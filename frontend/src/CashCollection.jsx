import React, { useState, useEffect } from "react";
import moment from "moment";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import CustomDateRangePicker from "./components/CustomDateRangePicker";
import Footer from "./Footer";
import { Card } from "react-bootstrap";
import apiClient from "./services/apiClient";
const CashCollection = () => {
    const [loading, setLoading] = useState(false);
    const [pureData, setPureData] = useState([]);
    const [data, setData] = useState([]);
    const [hubFilter, setHubFilter] = useState("All");
    const [hubs, setHubs] = useState([]);
    const [today] = useState(moment(Date()).format("YYYY-MM-DD"));
    const [dateRange, setDateRange] = useState({ start: today, end: today });

    const handleDateChange = (startDate, endDate) => {
        setDateRange({ start: moment(startDate).format("YYYY-MM-DD"), end: moment(endDate).format("YYYY-MM-DD") });
    };

    useEffect(() => {
        fetchCashCollection();
        setHubFilter("All")
    }, [dateRange]);

    useEffect(() => {
        // Filter data based on selected hub
        if (hubFilter === "All") {
            setData(pureData);
        } else {
            setData(pureData.filter(entry => entry.hub_name === hubFilter));
        }
    }, [hubFilter, pureData]);

    const fetchCashCollection = async () => {
        setLoading(true);
        try {
            let filters = [
                { field: "date", op: ">=", value: dateRange.start },
                { field: "date", op: "<=", value: dateRange.end }
            ];
            const result = await apiClient.post("/api/cash_collection/query", { filters }).then(res => res.data?.data || []);
            let data = [...result];
    
            data.sort((a, b) => {
                const dateA = a.created_date?.seconds ? a.created_date.seconds * 1000 : new Date(a.created_date || 0).getTime();
                const dateB = b.created_date?.seconds ? b.created_date.seconds * 1000 : new Date(b.created_date || 0).getTime();
                return dateA - dateB;
            });
    
            data = await Promise.all(
                data.map(async (entry) => {
                    if (entry.hub_name) {
                        return entry;
                    } else {
                        const customerData = await apiClient.post("/api/customers_data/query", {
                            filters: [{ field: "customer_id", op: "==", value: entry.customer_id }],
                            limit: 1
                        }).then(res => res.data?.data?.[0] || {});
                        return { ...entry, hub_name: customerData.hub_name || "Unknown" };
                    }
                })
            );
    
            setPureData(data);
            setHubs([...new Set(data.map(entry => entry.hub_name))]); // Extract unique hub names
        } catch (error) {
            console.error("Error fetching cash collection:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        {loading && (
          <div className="loader-overlay">
            <div>
              <img alt="loader" style={{ height: "6rem" }} src="images/loader.gif" />
            </div>
          </div>
        )}
        
        <div className="container mt-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
            <h4 className="text-success fw-bold mb-2">Cash Collection</h4>
      
            <div className="d-flex gap-2">
              <ExportCSV  data={data} />
            </div>
          </div>
      
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-3 justify-content-between align-items-start">
                {/* Hub Filter (Label & Select in the same row) */}
                <div className="d-flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                  <label className="form-label fw-bold">Hub:</label>
                  <select
                    className="form-select"
                    value={hubFilter}
                    onChange={(e) => setHubFilter(e.target.value)}
                  >
                    <option value="All">All Hubs</option>
                    {hubs.map((hub, index) => (
                        <option key={index} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
                    <CustomDateRangePicker onDateChange={handleDateChange} />
              </div>
            </div>
          </div>
      
        </div>
          <div className="m-1 rounded" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '750px' }}>
            <Table data={data} />
          </div>
      </>
      
    
    );
};

const ExportCSV = ({ data }) => {
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = [
            "S.No.",
            "Customer ID",
            "Customer Name",
            "Customer Phone",
            "Amount",
            "Collection Date",
            "Created At",
            "Status",
            "Hub",
            "Cash Collector Name",
            "Customer Address",
            "Created By"
        ];
        const csvRows = [headers.join(",")];

        // Sanitize function to escape quotes and remove newlines
        const sanitize = (value) => {
            if (value === null || value === undefined) return "";
            return String(value)
                .replace(/"/g, '""')       // escape double quotes
                .replace(/\r?\n|\r/g, " "); // remove newlines
        };

        data.forEach((val, index) => {
            const row = [
                index + 1,
                val.customer_id,
                val.customer_name,
                val.customer_phone,
                val.amount,
                val.date ? moment(val.date, "YYYY-MM-DD").format("DD-MM-YYYY") : "",
                val.created_date
                    ? moment(val.created_date?.seconds ? val.created_date.seconds * 1000 : val.created_date).format("DD-MM-YYYY")
                    : "",
                val.status === "1" ? "Collected" : "Pending",
                val.hub_name,
                val.delivery_executive_name,
                val.customer_address,
                val.created_by || val.customer_name,
            ].map(sanitize).map(v => `"${v}"`);

            csvRows.push(row.join(","));
        });

        // Debugging: check counts

        // Add UTF-8 BOM for Excel + create Blob (handles large files safely)
        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        // Create a download link
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "Cash_Collection_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            className="btn btn-success btn-sm"
            onClick={exportToCSV}
            disabled={!data || data.length === 0}
        >
            Export to CSV
        </button>
    );
};


const Table = ({ data }) => {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-bordered">
                <thead className="table-dark">
                    <tr>
                        {["S.No.", "Customer ID", "Customer Name", "Customer Phone", "Amount", "Collection Date", "Created At", "Status", "Hub", "Cash Collector Name", "Customer Address", "Created By"].map((col, index) => (
                            <th key={index} className="text-center">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? data.map((val, index) => (
                        <tr key={index}>
                            <td className="text-center">{index + 1}</td>
                            <td className="text-center">{val.customer_id}</td>
                            <td className="text-center">{val.customer_name}</td>
                            <td className="text-center">{val.customer_phone}</td>
                            <td className="text-center">{val.amount}</td>
                            <td className="text-center">{moment(val.date).format("DD-MM-YYYY")}</td>
                            <td className="text-center">{val.created_date ? moment(val.created_date?.seconds ? val.created_date.seconds * 1000 : val.created_date).format("DD-MM-YYYY") : ""}</td>
                            <td className={`text-center fw-bold ${val.status === "1" ? "text-success" : "text-danger"}`}>{val.status === "1" ? "Collected" : "Pending"}</td>
                            <td className="text-center">{val.hub_name}</td>
                            <td className="text-center">{val.delivery_executive_name}</td>
                            <td className="text-center">{val.customer_address}</td>
                            <td className="text-center">{val.created_by || val.customer_name}</td>
                        </tr>
                    )) : <tr><td colSpan="11" className="text-center fw-bold text-danger">NO DATA FOUND</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default CashCollection;
