import React, { useState, useEffect,useContext } from "react";
import DatePicker from 'react-datepicker';
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { Button, Alert, Spinner } from "react-bootstrap"; // Import Spinner for loader
import moment from "moment"; // Import moment for date formatting
import Select from "react-select"; // Import Select for multi-select
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import {
  fetchSubscriptionOptions,
  fetchSubscriptionReport,
} from "./services/subscriptionOperationsService";

const subscriptionStyles = `
  .date-fix {
    width: 146%;
    margin-bottom: 14px;
    padding: 18px;
    border-radius: 5px;
    margin-top: 10px;
  }
`;

const SubscriptionReport = () => {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedHub, setSelectedHub] = useState([]);
 
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSubscriptionType, setSelectedSubscriptionType] =
    useState(null);
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [data, setData] = useState([]);
  const [hubOptions, setHubOptions] = useState([]);
  const [showNoDataFound, setShowNoDataFound] = useState(false);
  const [loading, setLoading] = useState(false); 


  const [selectedProduct, setSelectedProduct] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  
  const [utmSourceOptions, setUtmSourceOptions] = useState([]);
  const [selectedUtmSource, setSelectedUtmSource] = useState([]);

  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  const subscriptionTypeOptions = [
    { value: "Everyday", label: "Everyday" },
    { value: "Custom", label: "Custom" },
    { value: "On-Interval", label: "On-Interval" },
    { value: "One Time", label: "One Time" },
  ];

  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };


  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetchSubscriptionOptions();
        const hubs = response.hubs || [];
        const products = response.products || [];
        const utmSources = response.utmSources || [];

        setHubOptions(hubs.map((hub) => ({
          value: hub.hub_name,
          label: hub.hub_name,
        })));

        setProductOptions(products.map((product) => ({
          value: product.productName,
          label: product.productName,
        })));

        setUtmSourceOptions(utmSources.map((utm) => ({ value: utm, label: utm })));
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('subscription_report')){
              handleLogout()
              navigate("/permission_denied");
          }
      }
  }
  }, [navigate,permissible_roles]);


  const handleSearch = async () => {
    if (endDate && startDate && endDate < startDate) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        productNames: selectedProduct.map((p) => p.value).filter(Boolean),
        hubNames: selectedHub.map((h) => h.value).filter(Boolean),
        utmSources: selectedUtmSource.map((u) => u.value).filter(Boolean),
        customerPhone: customerNumber || null,
        customerName: customerName || null,
        startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : null,
        endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : null,
        status: selectedStatus || null,
        subscriptionType: selectedSubscriptionType || null,
      };

      const response = await fetchSubscriptionReport(payload);
      const subscriptionData = response.data || [];

      if (subscriptionData.length === 0) {
        setShowNoDataFound(true);
        setData([]);
      } else {
        setShowNoDataFound(false);
        setData(subscriptionData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleReset = () => {
    setCustomerNumber("");
    setCustomerName("");
    setStartDate(null);
    setEndDate(null);
    setSelectedHub([]);
    setSelectedProduct([]);
    setSelectedUtmSource([]);
    setSelectedStatus(null);
    setSelectedSubscriptionType(null);
    setData([]);
  };
  const exportTableToPDF = () => {
    const doc = new jsPDF();
    doc.text("Subscription Report", 20, 20);

    const tableColumn = [
      "Customer Number",
      "Product Name",
      "Hub",
      "Customer Name",
      "customer Address",
      "Source",
      "Status",
      "Email",
      "Subscription Type",
      "Start Date",
      "End Date",
    ];
    const tableRows = data.map((item, index) => [
      item.customer_phone,
      item.product_name || "N/A",
      item.hub_name || "N/A",
      item.customer_name,
      item.delivering_to,
      item.utm_source,
      item.status == "1" ? "Active" : "Inactive",
      item.email,
      item.subscription_type,
      item.start_date
        ? moment(item.start_date).format("DD/MM/YYYY")
        : "-",
      item.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "-",
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("subscription_report.pdf");
  };
  const exportTableToCSV = () => {
    /* Prepare CSV headers */
    const csvColumns = [
        "Customer Number",
        "Product Name",
        "Hub",
        "Customer Name",
        "Customer Address",
        "Source",
        "Status",
        "Email",
        "Subscription Type",
        "Start Date",
        "End Date",
    ];

    /* Function to escape special characters in CSV data */
    const escapeCSVValue = (value) => {
        if (!value) return '"N/A"';
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')
            ? `"${stringValue}"`
            : stringValue;
    };

    /* Function to format end_date */
    const formatEndDate = (item) => {
        if (!item.end_date) return "-";
        const endDate = item.end_date;
        const formattedEndDate = moment(endDate).format("DD/MM/YYYY");
        const specialDate1 = "31/12/3000";
        const specialDate2 = "01/01/3000";

        // Check for special dates
        if (formattedEndDate === specialDate1 || formattedEndDate === specialDate2) {
            return "Until paused";
        } else {
            return formattedEndDate;
        }
    };

    /* Prepare CSV rows */
    const csvRows = data.map((item) => [
        escapeCSVValue(item.customer_phone),
        escapeCSVValue(item.product_name),
        escapeCSVValue(item.hub_name),
        escapeCSVValue(item.customer_name),
        escapeCSVValue(item.delivering_to),
        escapeCSVValue(item.utm_source),
        item.status === "1" ? "Active" : "Inactive",
        escapeCSVValue(item.email),
        escapeCSVValue(item.subscription_type),
        item.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "-",
        formatEndDate(item), // Use the custom function to format end_date
    ]);

    // Combine headers and rows into a single CSV content
    const csvContent = [
        csvColumns.join(","), 
        ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    /* Create a Blob from the CSV content */
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    /* Create a link element for downloading */
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "subscription_report.csv");
    link.style.visibility = 'hidden';

    /* Append the link to the body */
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  const exportTableToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "Customer Number": item.customer_phone,
        "Product Name": item.product_name || "N/A",
        Hub: item.hub_name || "N/A",
        "Customer Name": item.customer_name,
        "Customer Address": item.delivering_to,
        "Source": item.utm_source,
        Status: item.status === "1" ? "Active" : "Inactive",
        "Subscription Type": item.subscription_type,
        "Start Date": item.start_date
          ? moment(item.start_date).format("DD/MM/YYYY")
          : "-",
        "End Date": item.end_date
          ? moment(item.end_date).format("DD/MM/YYYY")
          : "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
    XLSX.writeFile(wb, "subscription_report.xlsx");
  };

  return (
    <>
      <style>{subscriptionStyles}</style>
      <div className="container-scroller">
              <div class="container-fluid">
              <div className="main-panel" style={{ width: '100%', minHeight: '0px' }}>

                <div
                  className="panel"
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
              <div
                className="panel"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                   fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px"
                  }}
                >
                  SUBSCRIPTION REPORT
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    onClick={exportTableToPDF}
                    disabled={loading}
                    className="btn btn-success btn-rounded btn-sm"
                  >
                    Export PDF
                  </Button>
                  <Button
                    onClick={exportTableToExcel}
                    disabled={loading}
                    className="btn btn-success btn-rounded btn-sm"
                  >
                    Export Excel
                  </Button>
                  <Button
                    onClick={exportTableToCSV}
                    disabled={loading}
                    className="btn btn-success btn-rounded btn-sm"
                  > Export CSV
                  </Button>
                </div>
              </div>
              </div>
              <br/>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                  width: "100%",
                }}
              >
                {/* Customer Number */}
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <label>Customer Number:</label>
                  <input
                    type="text"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    placeholder="Enter customer number"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                    }}
                  />
                </div>
                {/* Customer Name */}
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <label>Customer Name:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                    }}
                  />
                </div>

                {/* Status */}
                <div style={{ flex: "1", minWidth: "200px" }}>
                <label>Status:</label>
                <select
                  onChange={(e) => setSelectedStatus(e.target.value)}  // Set the value directly
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                  }}
                >
                  <option value="">Select status</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}> 
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

                {/* Hub */}
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <label>Hub:</label>
                  <Select
                    isMulti
                    options={hubOptions}
                    onChange={(selected) => setSelectedHub(selected)}
                    placeholder="Select hub(s)"
                    styles={{
                      container: (provided) => ({
                        ...provided,
                        width: "100%",
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                {/* Subscription Type */}
                <div style={{ flex: "1", minWidth: "200px" }}>
  <label>Subscription Type:</label>
  <select
    onChange={(e) => setSelectedSubscriptionType(e.target.value)}  // Set the value directly
    style={{
      width: "100%",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #ced4da",
    }}
  >
    <option value="">Select subscription type</option>
    {subscriptionTypeOptions.map((subscriptionType) => (
      <option
        key={subscriptionType.value}
        value={subscriptionType.value}  // Use value to match Firestore
      >
        {subscriptionType.label}
      </option>
    ))}
  </select>
</div>


                {/* Product */}
                <div style={{ flex: "1", minWidth: "200px" }} >
                  <label>Product:</label>
                  <Select
                    isMulti
                    options={productOptions}
                    onChange={(selected) => setSelectedProduct(selected)}
                    placeholder="Select product(s)"
                    styles={{
                      container: (provided) => ({
                        ...provided,
                        width: "100%",
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                    }}
                  />
                </div>
                <div style={{ flex: "1", minWidth: "200px" }}>
  <label>Utm Source:</label>
  <Select
  isMulti
  options={utmSourceOptions}
  value={selectedUtmSource}
  onChange={(selected) => setSelectedUtmSource(selected)}
  placeholder="Select UTM Source(s)"
  styles={{
    container: (provided) => ({ ...provided, width: "100%" }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
  }}
/>

</div>
                {/* Start Date */}
                <div style={{ flex: "1", minWidth: "200px", marginTop:'-14px' }} className="date-fix">
                  <label>Start Date:</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    placeholderText="Select start date"
                  />
                </div>

                {/* End Date */}
                <div style={{ flex: "1", minWidth: "200px" ,marginTop:'-14px'}} className="date-fix">
                  <label>End Date:</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    placeholderText="Select end date"
                  />
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <Button
                  variant="outline-success"
                  onClick={handleSearch}
                  disabled={loading}
                  className="justify-content-center align-items-center inputPanels"
                >
                  {loading ? <Spinner animation="border" size="sm" /> : "Search"}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={handleReset}
                  style={{ marginLeft: "10px" }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="result" style={{ overflowY: 'auto', overflowX: 'auto', height: '500px' }}>
                <table
                  className="table table-striped"
                  style={{ width: "100%" }}
                >
                  <thead>
                    <tr>
                      <th>Customer Number</th>
                      <th>Product Name</th>
                      <th>Hub</th>
                      <th>Customer Name</th>
                      <th>Customer Address</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Email</th>
                      <th>Subscription Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length ? (
                      data.map((item, index) => (
                        <tr  key={index}
                        className="hover-highlight"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRowClick(item.customer_id)}>
                          <td>{item.customer_phone}</td>
                          <td>{item.product_name || "N/A"}</td>
                          

                          <td>{item.hub_name || "N/A"}</td>
                          <td>{item.customer_name}</td>
                          <td>{item.delivering_to}</td>
                          <td>{item.utm_source}</td>
                          <td>{item.status === "1" ? "Active" : "Inactive"}</td>
                          <td>{item.email || "-"}</td>

                          <td>{item.subscription_type}</td>
                          <td>
                            {item.start_date
                              ? moment(item.start_date).format("DD/MM/YYYY")
                              : "-"}
                          </td>
                          {/* <td>{item.end_date ? moment(item.end_date).format('DD/MM/YYYY') : '-'}</td> */}
                          <td>
                            {item.end_date
                              ? (() => {
                                  const endDate = item.end_date;

                                  // Convert the date to 'DD/MM/YYYY' format
                                  const formattedEndDate =
                                    moment(endDate).format("DD/MM/YYYY");
                                  const specialDate1 = "31/12/3000";
                                  const specialDate2 = "01/01/3000"; // Corresponds to the other check

                                  // Check if formattedEndDate matches special dates
                                  if (
                                    formattedEndDate === specialDate1 ||
                                    formattedEndDate === specialDate2
                                  ) {
                                    return "Until paused";
                                  } else {
                                    return formattedEndDate;
                                  }
                                })()
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center">
                          {showNoDataFound
                            ? "No data found for the given filters."
                            : "No data available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              
            </div>
                </div>
              </div>
      
          
    </>
  );
};

export default SubscriptionReport;
