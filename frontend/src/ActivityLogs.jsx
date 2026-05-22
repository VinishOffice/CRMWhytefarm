import React, { useState, useEffect, useContext, useMemo } from "react";
import { Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { useNavigate } from "react-router-dom";
import ExportTableToExcel from "./ExportTableToExcel";
import { handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import SearchableDropdown from "./components/SearchableDropdown";
import CustomDateRangePicker from "./components/CustomDateRangePicker";
import { searchCustomerActivities } from "./services/customerActivitiesService";
function ActivityLogs() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const { permissible_roles } = useContext(GlobalContext)

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes('dashboard')) {
          handleLogout()
          navigate("/activity_logs");
        }
      }
    }
  }, [navigate, permissible_roles]);
  const moment = extendMoment(Moment);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [walletTxnsReport, setWalletTxnsReport] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState(new Date(new Date().setHours(23, 59, 59, 999)));
  const [activityLogs, setActivityLogs] = useState(null);
  const [endDateQuery, setEndDateQuery] = useState(null);
  const [deliveryExecutivesMap, setDeliveryExecutivesMap] = useState(new Map());

  const [filterName, setFilterName] = useState('');
  const [filterHub, setFilterHub] = useState('');
  const [filterDeliveryExe, setFilterDeliveryExe] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterObject, setFilterObject] = useState('');

  const getUniqueValues = (key) => {
    if (!activityLogs) return [];
    const values = activityLogs.map((log) => {
      if (key === "delivery_exe_name") {
        return deliveryExecutivesMap.get(log.delivery_exe_id) || "N/A";
      }
      return log[key] || "N/A";
    });
    return [...new Set(values)].sort();
  };

  // delivery executives map is fetched along with activity logs from backend



  // Validate date range
  const validateDateRange = () => {
    if (!startDate) {
      toast.error("Please enter From Date");
      return false;
    }
    if (!endDate) {
      toast.error("Please enter To Date");
      return false;
    }
    if (startDate > endDate) {
      toast.error("From Date should not be greater than To Date");
      return false;
    }
    return true;
  };
  const handleStartDateChange = (date) => {
    if (date) {
      setStartDate(prev => new Date(date.setHours(0, 0, 0, 0))); // Set to start of day
    }
  };

  const handleEndDateChange = (date) => {
    if (date) {
      setEndDate(prev =>new Date(date.setHours(23, 59, 59, 999))); // Set to end of day
    }
  };

  const toUTCDate = (date) => {
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate;
  };

  const filteredActivity = useMemo(() => {
    return activityLogs && activityLogs.length > 0
      ? activityLogs.filter((activity) => {
        const deliveryExeName = deliveryExecutivesMap.get(activity.delivery_exe_id) || "N/A";
        return (
          (filterName === '' || activity.customer_name === filterName) &&
          (filterHub === '' || activity.hub_name === filterHub) &&
          (filterDeliveryExe === '' || deliveryExeName === filterDeliveryExe) &&
          (filterUser === '' || activity.user === filterUser) &&
          (filterAction === '' || activity.action === filterAction) &&
          (filterObject === '' || activity.object === filterObject)
        );
      })
      : [];
  }, [activityLogs, filterName, filterHub, filterDeliveryExe, filterUser, filterAction, filterObject, deliveryExecutivesMap]);


  const handleSearch = async () => {
    if (!validateDateRange()) return;

    
    setIsLoading(true);

    try {
      const resp = await searchCustomerActivities({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const data = resp.data || [];
      const execObj = resp.deliveryExecutivesMap || {};
      const map = new Map(Object.entries(execObj));
      setDeliveryExecutivesMap(map);
      setActivityLogs(data);

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to fetch activity logs.");
    } finally {
      setIsLoading(false);
    }
  };


  // Export to CSV
  const exportToCSV = () => {
    if (!filteredActivity.length) {
      toast.error("No data available for export.");
      return;
    }
    const headers = [
      "S No.",
      "Customer ID",
      "Name",
      "Number",
      "Address",
      "Hub",
      "Delivery Executive",
      "User",
      "Object",
      "Action",
      "Description",
      "Date",
    ];
    const csvRows = filteredActivity.map((activity, idx) => [
      `"${idx + 1}"`,
      `"${activity.customer_id}"`,
      `"${activity.customer_name}"`,
      `"${activity.customer_phone}"`,
      `"${activity.customer_address}"`,
      `"${activity.hub_name}"`,
      `"${deliveryExecutivesMap.get(activity.delivery_exe_id) || "N/A"}"`,
      `"${activity.user || "N/A"}"`,
      `"${activity.object || "N/A"}"`,
      `"${activity.action || "N/A"}"`,
      `"${activity.description || "N/A"}"`,
      `"${activity.created_date ? moment(activity.created_date).format("DD/MM/YYYY, h:mm a") : "N/A"}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "activity_logs.csv";
    link.click();
  };

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setStartDate(null);
    setEndDate(null);
    setWalletTxnsReport([]);
  }

  const navi = (id) => {
    const url = `/profile/${id}`;
    const newTab = window.open(url, '_blank');
    newTab.focus();

  }

  const SpinnerOverlay = () => (
    <div className="spinner-overlay">
      <div className="spinner"></div>
    </div>
  );


  // useEffect(() => {
    
  // }, [startDate, endDate])
  
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch();
    }
  }, [startDate, endDate]);
  
  return (
    <>
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fs-5 fw-bold text-success">ACTIVITY LOG</span>
          <div className="d-flex gap-2">
            {dataLoaded && <ExportTableToExcel tableId="activitylog" fileName="activitylog" />}
            {dataLoaded && (
              <Button variant="success" size="sm" onClick={exportToCSV}>
                Export CSV
              </Button>
            )}
          </div>
        </div>
        <div className="card p-3 mb-3">
          <h6 className="card-title text-primary fw-semibold mb-3">Filters</h6>

          <div className="row g-3"> {/* Removed align-items-center */}
            {/* Date Range Picker */}
            <div className="col-lg-4 col-md-6">
              <div className="d-flex flex-column h-100">
                <label className="form-label text-primary fw-semibold mb-1">Date Range</label>
                <div style={{ flexGrow: 1 }}>
                  <CustomDateRangePicker
                    onDateChange={(start, end) => {
                      handleStartDateChange(start);
                      handleEndDateChange(end);
                      // handleSearch();
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Object Filter */}
            <div className="col-lg-3 col-md-6">
              <label className="form-label text-primary fw-semibold mb-1">Object</label>
              <select
                className="form-select"
                value={filterObject}
                onChange={(e) => setFilterObject(e.target.value)}
              >
                <option value="">All</option>
                {getUniqueValues("object").map((val, idx) => (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="col-lg-3 col-md-6">
              <label className="form-label text-primary fw-semibold mb-1">Action</label>
              <select
                className="form-select"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">All</option>
                {getUniqueValues("action").map((val, idx) => (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>



      </div>



      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="table-responsive position-relative">
            <table className="table table-bordered table-hover table-striped" id="activitylog">
              <thead className="table-light">
                <tr>
                  <th>S No.</th>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Number</th>
                  <th>Address</th>
                  <th>Hub</th>
                  <th>Delivery Executive</th>
                  <th>User</th>
                  <th>Object</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(showSpinner || isLoading) ? (
                  <>
                    <tr>
                      <td colSpan="12" className="text-center">Loading...</td>
                    </tr>
                  </>
                ) : (
                  filteredActivity && filteredActivity.length > 0 ? (
                    filteredActivity.map((activity, index) => (
                      <tr key={activity.id}>
                        <td>{index + 1}</td>
                        <td>{activity.customer_id || "N/A"}</td>
                        <td>{activity.customer_name || "N/A"}</td>
                        <td>{activity.customer_phone || "N/A"}</td>
                        <td>{activity.customer_address || "N/A"}</td>
                        <td>{activity.hub_name || "N/A"}</td>
                        <td>{deliveryExecutivesMap.get(activity.delivery_exe_id) || "N/A"}</td>
                        <td>{activity.user || "N/A"}</td>
                        <td>{activity.object || "N/A"}</td>
                        <td>{activity.action || "N/A"}</td>
                        <td>{activity.description || "N/A"}</td>
                        <td>
                          {activity.created_date
                            ? moment(activity.created_date).format("DD/MM/YYYY, h:mm a")
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        No records found.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </>
  );
}
export default ActivityLogs;














{/* <>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fs-5 fw-bold text-success">ACTIVITY LOG</span>
          <div className="d-flex gap-2">
            {dataLoaded && <ExportTableToExcel tableId="activitylog" fileName="activitylog" />}
            {dataLoaded && (
              <Button variant="success" size="sm" onClick={exportToCSV}>
                Export CSV
              </Button>
            )}
          </div>
        </div>

        Date Filters
        <div className="card p-3 mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label text-primary fw-semibold">From</label>
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="From Date"
                maxDate={endDate}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-primary fw-semibold">To</label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                selectsEnd
                startDate={startDate}
                minDate={startDate}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="To Date"
              />
            </div>
            <div className="col-md-2">
              <Button variant="primary" size="sm" className="w-100 fw-semibold" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Loading..." : "Search"}
              </Button>
            </div>
            <div className="col-md-2">
              <Button variant="outline-danger" size="sm" className="w-100 fw-semibold" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        Filters
        <div className="card p-3 mb-3">
          <div className="row g-3">
            <div className="col-lg-4 col-md-6">
              <label className="form-label text-primary fw-semibold mb-1">Customer Name</label>
              <SearchableDropdown
                options={getUniqueValues("customer_name")}
                value={filterName}
                onChange={setFilterName}
                placeholder="Enter customer name"
              />
            </div>
            <div className="col-lg-4 col-md-6">
              <label className="form-label text-primary fw-semibold mb-1">Hub</label>
              <select className="form-select" value={filterHub} onChange={(e) => setFilterHub(e.target.value)}>
                <option value="">All</option>
                {getUniqueValues("hub_name").map((val, idx) => (
                  <option key={idx} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-3 d-felx flex-row">
              <label className="form-label text-primary fw-semibold mb-1">Object</label>
              <select className="form-select" value={filterObject} onChange={(e) => setFilterObject(e.target.value)}>
                <option value="">All</option>
                {getUniqueValues("object").map((val, idx) => (
                  <option key={idx} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-3 d-felx flex-row">
              <label className="form-label text-primary fw-semibold mb-1">Action</label>
              <select className="form-select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="">All</option>
                {getUniqueValues("action").map((val, idx) => (
                  <option key={idx} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-4 col-md-6">
              <label className="form-label text-primary fw-semibold mb-1">Delivery Executive</label>
              <SearchableDropdown
                options={getUniqueValues("delivery_exe_name")}
                value={filterDeliveryExe}
                onChange={setFilterDeliveryExe}
                placeholder="Enter delivery executive name"
              />
            </div>
            <div className="col-lg-4 col-md-6 d-flex align-items-end">
              <button className="btn btn-outline-danger btn-sm w-100 fw-semibold" onClick={() => {
                setFilterName('');
                setFilterHub('');
                setFilterDeliveryExe('');
                setFilterUser('');
                setFilterAction('');
                setFilterObject('');
              }}>
                Reset Filters
              </button>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <Button variant="outline-danger" size="sm" className="btn btn-outline-danger btn-sm w-100 fw-semibold"  onClick={() => {
                setFilterName('');
                setFilterHub('');
                setFilterDeliveryExe('');
                setFilterUser('');
                setFilterAction('');
                setFilterObject('');
              }}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

      </div>


      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="table-responsive position-relative">
            <table className="table table-bordered table-hover table-striped" id="activitylog">
              <thead className="table-light">
                <tr>
                  <th>S No.</th>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Number</th>
                  <th>Address</th>
                  <th>Hub</th>
                  <th>Delivery Executive</th>
                  <th>User</th>
                  <th>Object</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(showSpinner || isLoading) ? (
                  <>
                    <tr>
                      <td colSpan="12" className="text-center">Loading...</td>
                    </tr>
                  </>
                ) : (
                  filteredActivity && filteredActivity.length > 0 ? (
                    filteredActivity.map((activity, index) => (
                        <tr key={activity.id}>
                          <td>{index + 1}</td>
                          <td>{activity.customer_id || "N/A"}</td>
                          <td>{activity.customer_name || "N/A"}</td>
                          <td>{activity.customer_phone || "N/A"}</td>
                          <td>{activity.customer_address || "N/A"}</td>
                          <td>{activity.hub_name || "N/A"}</td>
                          <td>{deliveryExecutivesMap.get(activity.delivery_exe_id) || "N/A"}</td>
                          <td>{activity.user || "N/A"}</td>
                          <td>{activity.object || "N/A"}</td>
                          <td>{activity.action || "N/A"}</td>
                          <td>{activity.description || "N/A"}</td>
                          <td>
                            {activity.created_date
                              ? moment(activity.created_date.toDate()).format("DD/MM/YYYY, h:mm a")
                              : "N/A"}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        No records found.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </> */}