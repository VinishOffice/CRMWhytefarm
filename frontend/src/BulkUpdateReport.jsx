import React, { useState, useEffect, useContext } from 'react';
import apiClient from './services/apiClient';
import { useNavigate } from 'react-router-dom';
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Select from 'react-select';

const bluckUpdateStyles = `
  .bluck-update-report-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .set-data {
    width: 250px;
  }
  .bluck-update-report-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .bluck-update-report-filters label {
    margin-right: 10px;
    font-size: 14px;
  }
  .filter-item {
    margin-left: 30px;
    margin-top: 5px;
  }
  .bluck-update-search-button {
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.3s;
  }
  .bluck-update-search-button:hover {
    background-color: #357abd;
  }
  .bluck-update-report-table {
    width: 100%;
    border-collapse: collapse;
  }
  .bluck-update-report-table thead th {
    background-color: #4a90e2;
    color: white;
    padding: 8px;
    text-align: left;
    border: 1px solid #ddd;
  }
  .bluck-update-report-table tbody td {
    padding: 8px;
    border: 1px solid #ddd;
    color: #333;
  }
  .bluck-update-report-table tbody tr:nth-child(odd) {
    background-color: #f2f2f2;
  }
  .result {
    margin-top: 20px;
    overflow-x: auto;
    height: 400px;
  }
  .bluck-update-empty-state {
    text-align: center;
    font-size: 16px;
    color: #777;
  }
  .bluck-update-export-button {
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.3s;
  }
  .css-13cymwt-control {
    width: 250px !important;
  }
  .bluck-update-export-button:hover {
    background-color: #357abd;
  }
`;

const BluckUpdateReport = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { permissible_roles } = useContext(GlobalContext);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    if (permissible_roles.length > 0 && !permissible_roles.includes("bluk_quantity")) {
      handleLogout();
      navigate("/permission_denied");
      return;
    }
  
    fetchProductOptions();
  }, [navigate, permissible_roles]);

  const fetchProductOptions = async () => {
    try {
      const docs = await apiClient.post("/api/products_data/query", { filters: [] })
        .then(res => res.data?.data || []);
      const options = docs.map(doc => ({
        value: doc.productName, // Using productName for the filter
        label: doc.productName,
      }));
      setProductOptions(options);
    } catch (err) {
      setError("Failed to fetch product options.");
    }
  };


  const [totalRecords, setTotalRecords] = useState(0); // For record count
  const fetchCustomerData = async (customerIds) => {
    const uniqueCustomerIds = [...new Set(customerIds)];
    const promises = uniqueCustomerIds.map(async (customerId) => {
      const customerData = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: customerId }]
      }).then(res => res.data?.data || []);
      return { customerId, customerData: customerData[0] || {} };
    });
    const customerDetails = await Promise.all(promises);
    return customerDetails.reduce((acc, { customerId, customerData }) => {
      acc[customerId] = customerData;
      return acc;
    }, {});
  }



  const fetchRecords = async (startDate, endDate) => {
    if (!startDate || !endDate) {
      setError("Please select a valid date range.");
      return;
    }

    const filters = [
      { field: 'delivery_date', op: '>=', value: startDate },
      { field: 'delivery_date', op: '<=', value: endDate },
    ];
    
    if (selectedProduct.length > 0) {
      filters.push({ field: 'product_name', op: 'in', value: selectedProduct.map(product => product.value) });
    }

    setLoading(true);
    setError(null);

    try {
      const docs = await apiClient.post("/api/bulk_update_quantity/query", { filters })
        .then(res => res.data?.data || []);
      const fetchedRecords = docs.map(doc => ({
        ...doc,
        id: doc._id,
      }));

      const customerIds = fetchedRecords.map(record => record.customer_id);
      const customerDetails = await fetchCustomerData(customerIds);

      const mergedRecords = fetchedRecords.map(record => ({
        ...record,
        customer_name: customerDetails[record.customer_id]?.customer_name || "N/A",
        customer_phone: customerDetails[record.customer_id]?.customer_phone || "N/A",
      }));
      setRecords(mergedRecords);
    } catch (err) {
      console.error("Query Error:", err.message); // Debugging
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };
  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  const handleSearch = () => {
    fetchRecords(startDate, endDate);
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["SN", "ID", "Customer ID", "Product Name", "Delivery Date", "Quantity"];
    const rows = records.map((record, index) => [
      index + 1,
      record.id || "N/A",
      record.customer_id || "N/A",
      record.product_name || "N/A",
      record.delivery_date || "N/A",
      record.quantity || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => `"${value}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_update_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (records.length === 0) {
      alert("No data available to export.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Bulk Update Report", 14, 10);

    const tableColumns = ["SN", "ID", "Customer ID", "Product Name", "Delivery Date", "Quantity"];
    const tableRows = records.map((record, index) => [
      index + 1,
      record.id || "N/A",
      record.customer_id || "N/A",
      record.product_name || "N/A",
      record.delivery_date || "N/A",
      record.quantity || 0,
    ]);

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    doc.save("bulk_update_report.pdf");
  };

  return (
    <div className="container-scroller">
      <style>{bluckUpdateStyles}</style>
      <div className="container-fluid">
        <div className="panel" style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>
              BULK REPORT
            </span>
            {records.length > 0 && (
              <div>
                <button onClick={exportToCSV} className="button-cls" style={{ marginRight: "10px" }}>
                  Export to CSV
                </button>
                <button onClick={exportToPDF} className="button-cls">
                  Export to PDF
                </button>
              </div>
            )}
          </div>
        </div>
 
  <div style={{ margin: "26px 0", display: "flex", alignItems: "center", justifyContent:"center", flexWrap: "wrap", gap: "20px" }}>
  <label htmlFor="start-date" style={{ marginRight: "10px" }}>Start Date:</label>
  <input
    id="start-date"
    type="date"
    className="form-control set-data"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    max={new Date().toISOString().split("T")[0]}
  />

  <label htmlFor="end-date" style={{ marginRight: "10px" }}>End Date:</label>
  <input
    id="end-date"
    type="date"
    className="form-control set-data"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    min={startDate}
  />


    <label>Product</label>
    <Select
    styles={{ width:"200px"  }}
      options={productOptions}
      isMulti
      onChange={(selected) => setSelectedProduct(selected)}
    />


  <button onClick={handleSearch} className="button-cls">Search</button>
</div>

        {loading && <div className="bluck-update-loading">Loading...</div>}
        {error && <div className="bluck-update-error">Error: {error}</div>}
        <div className="result" style={{ overflowY: 'auto', overflowX: 'auto', height: '500px' }}>
        <div>
            <strong>Total Records:</strong> {totalRecords}
          </div>
          <table className="table table-striped" style={{ width: "100%" }}>
          <thead>
              <tr>
                <th>SN</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Customer Phone</th>
                <th>Product Name</th>
                <th>Delivery Date</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={index}
                  className="hover-highlight"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(record.customer_id)}
                >
                  <td>{index + 1}</td>
                  <td>{record.customer_id || "N/A"}</td>
                  <td>{record.customer_name || "N/A"}</td>
                  <td>{record.customer_phone || "N/A"}</td>
                  <td>{record.product_name || "N/A"}</td>
                  <td>
  {record.delivery_date
    ? new Date(record.delivery_date).toLocaleDateString('en-GB')
    : "N/A"}
</td>

                  <td>{record.quantity}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default BluckUpdateReport;
