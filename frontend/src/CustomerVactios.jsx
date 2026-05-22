import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DateTimeUtil } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Spinner } from "react-bootstrap";
import moment from "moment";
import Swal from "sweetalert2";
import apiClient from './services/apiClient';

const vacationStyles = `
  .customer-vacations {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .customer-vacations h3 {
    color: #333;
    margin-bottom: 20px;
    text-align: center;
  }
  .hed-class {
    font-size: 1.5rem;
    font-weight: 600;
    color: #007bff;
  }
  .calnde-cls {
    margin-bottom: 20px;
  }
  .calnde-cls-picker label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #555;
  }
  .calnde-cls input[type="date"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
    font-size: 1rem;
    color: #333;
    transition: border-color 0.3s ease;
  }
  .calnde-cls input[type="date"]:focus {
    border-color: #007bff;
    outline: none;
  }
  .button-cls {
    background: #83bf91;
    color: #ffffff;
    font-size: 1rem;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .button-cls:hover {
    background: #4a54ba;
    color: #ffffff;
  }
  .button-cls:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  .vacation-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  .vacation-table thead {
    background-color: #007bff;
    color: white;
  }
  .vacation-table thead th {
    padding: 10px;
    text-align: left;
  }
  .vacation-table tbody tr:nth-child(odd) {
    background-color: #f2f2f2;
  }
  .vacation-table tbody tr:nth-child(even) {
    background-color: #e9ecef;
  }
  .vacation-table tbody td {
    padding: 10px;
    text-align: left;
  }
  .vacation-table tbody tr:hover {
    background-color: #d1ecf1;
  }
  .vacation-table td,
  .vacation-table th {
    border: 1px solid #ddd;
  }
  .main-panel-vaca {
    transition: width 0.25s ease, margin 0.25s ease;
    width: calc(52% - 220px);
    min-height: calc(54vh - 97px);
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 600px) {
    .calnde-cls {
      margin-bottom: 15px;
    }
    .button-cls {
      width: 100%;
      margin-bottom: 10px;
      background: #83bf91;
      color: #ffffff;
    }
    .vacation-table thead {
      font-size: 0.9rem;
    }
    .vacation-table tbody td {
      font-size: 0.85rem;
    }
  }
`;

const Toast = Swal.mixin({
  toast: true,
  background: '#69aba6',
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})
const CustomerVacations = () => {

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes("subscription_report")) {
          handleLogout();
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);



  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  // async function fetchVacations() {
  //   setLoading(true);
  //   if (!startDate || !endDate) {
  //     alert("Please select both start and end dates.");
  //     return;
  //   }

  //   const start_date = new Date(startDate);
  //   const end_date = new Date(endDate);

  //   try {
  //     const vacationDocs = await collection("customers_vacation").get();
  //     const vacationDataArray = [];

  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0); // Ensure we compare only the date part
  //     // Iterating over the documents

  //     for (const doc of vacationDocs.docs) {
  //       try {
  //         const vacationData = doc.data();
  //         const vacationStartDate1 = vacationData.start_date.toDate(); // Converting to JavaScript Date
  //         const vacationEndDate1 = vacationData.end_date.toDate(); // Converting to JavaScript Date
  //         // Converting Firestore Timestamp to Date object
  //         const vacationStartDate = vacationData.start_date.toDate(); // Converting to JavaScript Date
  //         const vacationEndDate = vacationData.end_date.toDate(); // Converting to JavaScript Date

  //         // Setting status dynamically

  //         const vacationStatus = today > vacationEndDate ? "Inactive" : "Active";



  //         vacationStartDate.setHours(0, 0, 0, 0); // Set hours for date comparison
  //         vacationEndDate.setHours(23, 59, 59, 999); // Ensure end date includes all hours
  //         // Check if the given date range is within the vacation period

  //         if (
  //           vacationStartDate <= start_date &&
  //           vacationEndDate >= end_date &&
  //           (statusFilter === "" || vacationStatus === statusFilter)
  //         ) {
  //           vacationDataArray.push({
  //             customer_id: vacationData.customer_id,
  //             user: vacationData.user,
  //             customer_name: vacationData.customer_name,
  //             customer_phone: vacationData.customer_phone,
  //             start_date: vacationStartDate1,
  //             end_date: vacationEndDate1,
  //             status: vacationStatus,
  //             updated_by: vacationData.updated_by,
  //             updated_date: vacationData.updated_date || "",
  //           });
  //         }

  //       } catch (error) {
  //       }finally{
  //         setLoading(false);
  //       }
  //     }

  //     if (vacationDataArray.length === 0) {
  //       alert("No vacations found for the selected range.");
  //     }

  //     // Return the formatted vacation data as an array
  //     setEvents(vacationDataArray)
  //     return vacationDataArray;
  //   } catch (error) {
  //     return [];  // Return an empty array if an error occurs
  //   }
  // }


  async function fetchVacations() {
    setLoading(true);

    const startStr = startDate ? moment(startDate).format("YYYY-MM-DD") : null;
    const endStr = endDate ? moment(endDate).format("YYYY-MM-DD") : null;

    try {
      const res = await apiClient.post("/api/customers_vacation/query", { filters: [] });
      const vacationDocs = res.data?.data || [];
      const vacationDataArray = [];

      const todayStr = moment().format("YYYY-MM-DD");

      for (const vacationData of vacationDocs) {
        try {
          const vacationStartStr = moment(vacationData.start_date).format("YYYY-MM-DD");
          const vacationEndStr = moment(vacationData.end_date).format("YYYY-MM-DD");

          const status = todayStr > vacationEndStr ? "Inactive" : "Active";

          const matchesStart = !startStr || vacationStartStr <= startStr;
          const matchesEnd = !endStr || vacationEndStr >= endStr;
          const matchesStatus = statusFilter === "" || status === statusFilter;

          if (matchesStart && matchesEnd && matchesStatus) {
            vacationDataArray.push({
              customer_id: vacationData.customer_id,
              user: vacationData.user,
              customer_name: vacationData.customer_name,
              customer_phone: vacationData.customer_phone,
              start_date: new Date(vacationData.start_date),
              end_date: new Date(vacationData.end_date),
              status,
              updated_by: vacationData.updated_by,
              updated_date: vacationData.updated_date || "",
            });
          }
        } catch (err) {
        }
      }

      // Sort logic
      if (startDate && !endDate) {
        vacationDataArray.sort((a, b) => {
          const aDate = moment(a.start_date).format("YYYY-MM-DD");
          const bDate = moment(b.start_date).format("YYYY-MM-DD");
          return bDate.localeCompare(aDate);
        });
      }
      if (!startDate && endDate) {
        vacationDataArray.sort((a, b) => {
          const aDate = moment(a.end_date).format("YYYY-MM-DD");
          const bDate = moment(b.end_date).format("YYYY-MM-DD");
          return aDate.localeCompare(bDate);
        });
      }

      if (vacationDataArray.length === 0) {
        Toast.fire({
          icon: 'success',
          title: 'No vacations found for the selected filters.'
        })
      }

      setEvents(vacationDataArray);
      return vacationDataArray;

    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }


  const exportToCSV = () => {
    if (events.length === 0) {
      Toast.fire({
        icon: 'warning',
        title: 'No data to export'
        })
      return;
    }

    const headers = [
      "Customer ID",
      "Created By",
      "Name",
      "Phone",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Status",
      "Updated By",
      "Updated Date",
    ];

    const rows = events.map((event) => [
      event.customer_id || "-",
      event.user || "-",
      event.customer_name || "-",
      event.customer_phone || "-",
      DateTimeUtil.timestampToDate(new Date(event.start_date)) || "-",
      DateTimeUtil.timestampToTimeAMPM(new Date(event.start_date)) || "-",
      DateTimeUtil.timestampToDate(new Date(event.end_date)) || "-",
      DateTimeUtil.timestampToTimeAMPM(new Date(event.end_date)) || "-",
      event.status === "Active" ? "Running" : "Expired" || "-",
      event.updated_by || "-",
      event.updated_date
        ? DateTimeUtil.timestampToDate(new Date(event.updated_date.seconds * 1000)) + " " + DateTimeUtil.timestampToTimeAMPM(new Date(event.updated_date.seconds * 1000))
        : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((value) => `"${value}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vacation_events.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const exportToPDF = () => {
    if (events.length === 0) {
      Toast.fire({
        icon: "warning",
        title: "No data available to export."
      })
      return;
    }

    const doc = new jsPDF();
    doc.text("Vacation Report", 14, 10);

    const tableColumns = [
      "Customer ID",
      "Created By",
      "Customer Name",
      "Customer Phone",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Status",
      "Updated By",
      "Updated Date",
    ];

    const tableRows = events.map((event) => [
      event.customer_id || "-",
      event.user || "-",
      event.customer_name || "-",
      event.customer_phone || "-",
      DateTimeUtil.timestampToDate(new Date(event.start_date)) || "-",
      DateTimeUtil.timestampToTimeAMPM(new Date(event.start_date)) || "-",
      DateTimeUtil.timestampToDate(new Date(event.end_date)) || "-",
      DateTimeUtil.timestampToTimeAMPM(new Date(event.end_date)) || "-",
      event.status === "Active" ? "Running" : "Expired" || "-",
      event.updated_by || "-",
      event.updated_date
        ? DateTimeUtil.timestampToDate(new Date(event.updated_date.seconds * 1000)) + " " + DateTimeUtil.timestampToTimeAMPM(new Date(event.updated_date.seconds * 1000))
        : "-",
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    doc.save("vacation_report.pdf");
  };


  return (
    <div style={{ minHeight: "95vh" }}>
      <style>{vacationStyles}</style>
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
          <h4 className="text-success fw-bold mb-2">Vacation Report</h4>
          <div className="d-flex gap-2">
            {events.length > 0 && (
              <>
                <button onClick={exportToCSV} className="btn btn-success btn-sm">Export CSV</button>
                <button onClick={exportToPDF} className="btn btn-success btn-sm">Export PDF</button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-3 justify-content-start">
              {/* Start Date */}
              <div className="d-flex flex-column flex-grow-1" style={{ minWidth: '200px', maxWidth: '280px' }}>
                <label className="form-label">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Select Start Date"
                  maxDate={endDate} // 👈 Disallow dates after endDate
                />
              </div>

              {/* End Date */}
              <div className="d-flex flex-column flex-grow-1" style={{ minWidth: '200px', maxWidth: '280px' }}>
                <label className="form-label">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Select End Date"
                  minDate={startDate} // 👈 Disallow dates before startDate
                />
              </div>


              {/* Status */}
              <div className="d-flex flex-column flex-grow-1" style={{ minWidth: '200px', maxWidth: '280px' }}>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Active">Running</option>
                  <option value="Inactive">Expired</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="d-flex flex-column justify-content-end flex-grow-1" style={{ minWidth: '200px', maxWidth: '280px' }}>
                <label className="invisible">Search</label>
                <button className="btn btn-success w-100" onClick={fetchVacations}>Search Vacations</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="m-2 rounded" style={{ overflowY: 'auto' }}>
        <table className="table table-striped" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Created by</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Updated By</th>
              <th>Updated Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </td>
              </tr>
            )
              : events && events.length > 0 ? (events.map((event, index) => (
                <tr key={index} className="hover-highlight" style={{ cursor: "pointer" }} onClick={() => handleRowClick(event.customer_id)}>
                  <td>{event.customer_id || "N/A"}</td>
                  <td>{event.user || "-"}</td>
                  <td>{event.customer_name || "N/A"}</td>
                  <td>{event.customer_phone || "N/A"}</td>
                  <td>
                    {DateTimeUtil.timestampToDate(new Date(event.start_date)) + " " + DateTimeUtil.timestampToTimeAMPM(new Date(event.start_date)) || "N/A"}
                  </td>
                  <td>
                    {DateTimeUtil.timestampToDate(new Date(event.end_date)) + " " + DateTimeUtil.timestampToTimeAMPM(new Date(event.end_date)) || "N/A"}
                  </td>
                  <td style={{ color: event.status === "Active" ? "green" : "red", fontWeight: "bold" }}>
                    {event.status === "Active" ? "Running" : "Expired" || "-"}
                  </td>
                  <td>{event.updated_by || "-"}</td>
                  <td>
                    {DateTimeUtil.timestampToDate(new Date(event.updated_date.seconds * 1000)) + " " + DateTimeUtil.timestampToTimeAMPM(new Date(event.updated_date.seconds * 1000)) || "N/A"}
                  </td>
                </tr>
              )))
                : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No Data Found
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
    </div>

  );
};


export default CustomerVacations;
