import DatePicker from 'react-datepicker';
import { FaCompressAlt, FaExpandAlt } from "react-icons/fa";
import React, { useState, useEffect,useContext } from "react";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";

import { Button, Spinner } from "react-bootstrap"; // Import Spinner for loader
import moment from "moment"; // Import moment for date formatting
import Select from "react-select"; // Import Select for multi-select
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { handleLogout } from "../../../Utility";
import GlobalContext from "../../../context/GlobalContext";
import apiClient from "../../../services/apiClient";

const utmReportStyles = `
  .card.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1050;
    background-color: white;
    overflow: hidden;
    border-radius: 0px;
    margin: 0%;
    padding: 0%;
  }
  .fullscreen-table {
    height: calc(100vh - 60px);
    overflow: auto;
    width: 100%;
  }
  button {
    font-size: 20px;
    padding: 10px;
  }
`;

const UTMReport = () => {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedHub, setSelectedHub] = useState([]);
 
  const [data, setData] = useState([]);
  const [hubOptions, setHubOptions] = useState([]);
  const [showNoDataFound, setShowNoDataFound] = useState(false);
  const [loading, setLoading] = useState(false); 

  const [selectedSubscription, setSelectedSubscription] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState([]);
  const [productOptions, setProductOptions] = useState([]);


  const [utmSourceOptions, setUtmSourceOptions] = useState([]);
  const [selectedUtmSource, setSelectedUtmSource] = useState([]);

  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];


  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsFullScreen(true);
      setIsLoading(false); // Stop loading after action completes
    }, 500); // Simulating a delay for demonstration purposes
  };

  const handleCollapse = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsFullScreen(false);
      setIsLoading(false); // Stop loading after action completes
    }, 500); // Simulating a delay for demonstration purposes
  };


  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };
/** Fetch unique utm_source */





  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch hubs
        const hubsDocs = await apiClient.post("/api/hubs_data/query", { filters: [] }).then(res => res.data?.data || []);
        const hubOptions = hubsDocs.map((data) => ({
          value: data.hub_name,
          label: data.hub_name,
        }));
        setHubOptions(hubOptions);

        // Fetch products
        const productsDocs = await apiClient.post("/api/products_data/query", { filters: [] }).then(res => res.data?.data || []);
        const productOptions = productsDocs.map((data) => ({
          value: data.productName,
          label: data.productName,
        }));
        setProductOptions(productOptions);
        
        /** utm_source */
        const utmDocs = await apiClient.post("/api/subscriptions_data/query", {
          filters: [{ field: "utm_source", op: "!=", value: null }]
        }).then(res => res.data?.data || []);
        
        utmDocs.forEach((data) => {
        });
        const uniqueUtmSourceOptions = utmDocs
         .map((data) => data.utm_source)
         .filter((value, index, self) => value && self.indexOf(value) === index)
         .map((utm_source) => ({ value: utm_source, label: utm_source }));
        setUtmSourceOptions(uniqueUtmSourceOptions);
        
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
  
    let filters = [];
  
    try {
      // Construct filters safely
      if (selectedHub.length > 0) {
        const hubValues = selectedHub.map((h) => h.value).filter(Boolean);
        if (hubValues.length > 0) {
          filters.push({ field: "hub_name", op: "in", value: hubValues });
        }
      }
  
      if (selectedUtmSource.length > 0) {
        const utmSourceValues = selectedUtmSource.map((u) => u.value).filter(Boolean);
        if (utmSourceValues.length > 0) {
          filters.push({ field: "source", op: "in", value: utmSourceValues });
        }
      }
  
      if (startDate) {
        filters.push({ field: "created_date", op: ">=", value: startDate });
      }
  
      if (endDate) {
        filters.push({ field: "created_date", op: "<=", value: endDate });
      }
  
  
      const customerData = await apiClient.post("/api/customers_data/query", { filters, limit: filters.length === 0 ? 1000 : undefined }).then(res => res.data?.data || []);
  
      if (customerData.length === 0) {
        setShowNoDataFound(true);
        setData([]);
      } else {
        setData(customerData);
  
        // Query subscriptions_data for matching customer_ids
        const customer_ids = customerData.map(({ customer_id }) => customer_id);
        if (customer_ids.length > 0) {
          // Fetch in batches of 30
          const batchSize = 30;
          let batchPromises = [];
  
          for (let i = 0; i < customer_ids.length; i += batchSize) {
            const batchCustomerIds = customer_ids.slice(i, i + batchSize);
            const batchQuery = apiClient.post("/api/subscriptions_data/query", {
                filters: [{ field: "customer_id", op: "in", value: batchCustomerIds }]
            }).then(res => res.data?.data || []);
            batchPromises.push(batchQuery);
          }
  
          // Wait for all batches to complete
          const batchResults = await Promise.all(batchPromises);
  
          // Collect all the results from each batch
          let subscriptionData1 = [];
          batchResults.forEach((docs) => {
            if (docs.length > 0) {
              subscriptionData1 = [...subscriptionData1, ...docs];
            }
          });
  
          const joinedData = customerData.map((customer) => {
            const subscription = subscriptionData1.find(
              (sub) => sub.customer_id === customer.customer_id
            );
            return {
              ...customer,
              subscribed: subscription ? true : false,
              trial: subscription ? true : false,
            };
          });
  
          setData(joinedData);
  
          // Filter customers based on trial status if selected
          let filteredData = joinedData;


          // Filter customers based on subscription status if selected
          if (selectedSubscription.length === 1) {
            filteredData = filteredData.filter(({ subscribed }) => {
              if (selectedSubscription[0].label === "Yes" && subscribed) return true;
              if (selectedSubscription[0].label === "No" && !subscribed) return true;
              return false;
            });
          }
  
          if (selectedTrail.length === 1) {
            filteredData = filteredData.filter(({ trial }) => {
              if (selectedTrail[0].label === "Yes" && trial) return true;
              if (selectedTrail[0].label === "No" && !trial) return true;
              return false;
            });
          }
          
  
          setData(filteredData);
        } else {
          setShowNoDataFound(true);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("An error occurred while fetching the data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  
  
  
  

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedHub([]);
    setSelectedUtmSource([]);
    setData([]);
  };
  const exportTableToPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer Report", 20, 20);
  
    const tableColumn = [
      "Customer ID",
      "Customer Name",
      "Source",
      "Hub",
      "Trial",
      "Subscribe",
      "Register on",
    ];
  
    const tableRows = data.map((item) => [
      item.customer_id,
      item.customer_name || "N/A",
      item.source || "N/A",
      item.hub_name || "N/A",
      item.trial ? "Yes" : "No",
      item.subscribed ? "Yes" : "No",
      item.created_date
        ? moment(item.created_date.seconds ? item.created_date.seconds * 1000 : item.created_date).format("DD/MM/YYYY")
        : "-",
    ]);
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
  
    doc.save("customer_report.pdf");
  };
  
  
  const exportTableToCSV = () => {
    /* Prepare CSV headers */
    const csvColumns = [
      "Customer ID",
      "Customer Name",
      "Source",
      "Hub",
      "Trial",
      "Subscribe",
      "Register on",
    ];
  
    /* Function to escape special characters in CSV data */
    const escapeCSVValue = (value) => {
      if (!value) return '"N/A"';
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')
        ? `"${stringValue}"`
        : stringValue;
    };
  
    /* Prepare CSV rows */
    const csvRows = data.map((item) => [
      escapeCSVValue(item.customer_id),
      escapeCSVValue(item.customer_name || "N/A"),
      escapeCSVValue(item.source || "N/A"),
      escapeCSVValue(item.hub_name || "N/A"),
      item.trial ? "Yes" : "No",
      item.subscribed ? "Yes" : "No",
      item.created_date
        ? moment(item.created_date.seconds ? item.created_date.seconds * 1000 : item.created_date).format("DD/MM/YYYY")
        : "-",
    ]);
  
    // Combine headers and rows into a single CSV content
    const csvContent = [
      csvColumns.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
  
    /* Create a Blob from the CSV content */
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
    /* Create a link element for downloading */
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "customer_report.csv");
    link.style.visibility = "hidden";
  
    /* Append the link to the body */
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportTableToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "Customer ID": item.customer_id,
        "Customer Name": item.customer_name || "N/A",
        Source: item.source || "N/A",
        Hub: item.hub_name || "N/A",
        Trial: item.trial ? "Yes" : "No",
        Subscribe: item.subscribed ? "Yes" : "No",
        "Register on": item.created_date
          ? moment(item.created_date.seconds ? item.created_date.seconds * 1000 : item.created_date).format("DD/MM/YYYY")
          : "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customer_report.xlsx");
  };


  return (
    <>
      <style>{utmReportStyles}</style>
      
      <div className="card p-2 mb-4" style={{ position: "relative" }}>
        <div
          className="panel p-1"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative"
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
      <div className="card p-1 mb-4">
        <div className="container my-2"> 
          <div className="p-3">
            <div className="row g-3">
              
              {/* UTM Source */}
              <div className="col-12 col-md-6 col-lg-4">
                <CustomSelect
                  label="Utm Source:"
                  options={utmSourceOptions}
                  value={selectedUtmSource}
                  onChange={(selected) => setSelectedUtmSource(selected)}
                  placeholder="Select UTM Source(s)"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>

              {/* Hub */}
              <div className="col-12 col-md-6 col-lg-4">
                <CustomSelect
                  label="Hub:"
                  options={hubOptions}
                  onChange={(selected) => setSelectedHub(selected)}
                  placeholder="Select hub(s)"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>

              {/* Subscried */}
              <div className="col-12 col-md-6 col-lg-4">
                <CustomSelect
                  label="Subscried:"
                  options={["Yes", "No"].map((trail) => ({ value: trail, label: trail }))}
                  onChange={(selected) => setSelectedSubscription(selected)}
                  placeholder="Select subscried"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>

              {/* Trail */}
              <div className="col-12 col-md-6 col-lg-4">
                <CustomSelect
                  label="Trail:"
                  options={["Yes", "No"].map((trail) => ({ value: trail, label: trail }))}
                  onChange={(selected) => {setSelectedTrail(selected)}}
                  placeholder="Select Trail(s)"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <CustomDatePicker
                  label="Start Date:"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="Select start date"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>

              {/* End Date */}
              <div className="col-12 col-md-6 col-lg-4">
                <CustomDatePicker
                  label="End Date:"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="Select end date"
                  minWidth="200px"
                  maxWidth="300px"
                />
              </div>


              <div className="col-12 col-md-6 col-lg-4">
                <div className="d-flex justify-content-start gap-3 mt-3">
                  <Button
                    variant="outline-success"
                    onClick={handleSearch}
                    disabled={loading}
                    className="d-flex align-items-center"
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : "Search"}
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={handleReset}
                    className="d-flex align-items-center"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
      <div className={`card p-3 ${isFullScreen ? 'fullscreen' : 'mb-4'}`}>
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-start p-2">
            <h5 className="text-primary mb-0">Stock Levels</h5>
            <div className="d-flex flex-column justify-content-center align-items-end gap-1">
              <button
                onClick={isFullScreen ? handleCollapse : handleExpand}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" /> // Show loader when in progress
                ) : (
                  isFullScreen ? <FaCompressAlt /> : <FaExpandAlt />
                )}
              </button>
              <h6>Count : {data.length || 0}</h6>
            </div>
          </div>

          <div className={` p-2 ${isFullScreen ? 'fullscreen-table' : ''}`} style={{ overflowY: 'auto', overflowX: 'auto'}}>
            <table className="table table-striped" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Source</th>
                  <th>Hub</th>
                  <th>Trial</th>
                  <th>Subscribe</th>
                  <th>Register on</th>
                </tr>
              </thead>
              <tbody>
                {data.length ? (
                  data.map((item, index) => (
                    <tr key={index} 
                    className="hover-highlight"
                    style={{cursor: "pointer"}}
                    onClick={() => handleRowClick(item.customer_id)}
                    >
                      <td>{item.customer_id}</td>
                      <td>{item.customer_name || 'N/A'}</td>
                      <td>{item.source}</td>
                      <td>{item.hub_name || 'N/A'}</td>
                      <td>{item.trial ? 'Yes' : 'No'}</td>
                      <td>{item.subscribed ? "Yes": "No"}</td>
                      <td>{item.created_date ? moment(item.created_date.seconds ? item.created_date.seconds * 1000 : item.created_date).format('DD/MM/YYYY') : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">
                      {showNoDataFound ? 'No data found for the given filters.' : 'No data available.'}
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

export default UTMReport;



const CustomSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  minWidth = "200px",
  maxWidth = "300px",
}) => {
  return (
    <div style={{ flex: "1", minWidth, maxWidth }}>
      <label style={{ fontWeight: "600", marginBottom: "5px", display: "block" }}>
        {label}
      </label>
      <Select
        isMulti
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        styles={{
          container: (provided) => ({ ...provided, width: "100%" }),
          menu: (provided) => ({ ...provided, zIndex: 9999 }),
          // indicatorsContainer: () => ({ display: "none" }),
        }}
      />
    </div>
  );
};

const CustomDatePicker = ({
  label,
  value,
  onChange,
  placeholder,
  minWidth = "200px",
  maxWidth = "300px",
}) => {
  return (
    <div style={{ flex: "1", minWidth, maxWidth }}>
      <label style={{ fontWeight: "600", marginBottom: "5px", display: "block" }}>
        {label}
      </label>
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        className="form-control"
        maxDate={new Date()} 
        placeholderText={placeholder}
      />
    </div>
  );
};
