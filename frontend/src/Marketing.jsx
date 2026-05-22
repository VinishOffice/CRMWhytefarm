import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopPanel from "./TopPanel";
import { Pie } from "react-chartjs-2";
import "chart.js/auto"; // Auto imports required chart.js components
import Footer from "./Footer";
import jsPDF from "jspdf";
import "jspdf-autotable"; // For exporting table data to CSV
import apiClient from "./services/apiClient";

const Marketing = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true); // Set true initially for loading
  const [chartData, setChartData] = useState({});
  const [sourceData, setSourceData] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);

  // Pagination state for the source data table
  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePerPage] = useState(20); // Number of items per page for source data

  // Pagination state for the customer details table
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPerPage] = useState(20); // Number of items per page for customer details

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Fetch data from Firestore to populate the chart and table
    const fetchData = async () => {
      setLoading(true); // Set loader when fetching starts
      try {
        const docs = await apiClient.post("/api/customers_data/query", { filters: [] }).then(res => res.data?.data || []);
        const sourceCounts = {};

        docs.forEach((data) => {
          /*Handle cases where source might be undefined */
          const source = data.source || "Unknown"; 

          if (sourceCounts[source]) {
            sourceCounts[source] += 1;
          } else {
            sourceCounts[source] = 1;
          }
        });

        // Prepare data for the pie chart
        const chartLabels = Object.keys(sourceCounts);
        const chartValues = Object.values(sourceCounts);

        // Set the chart data state
        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: "Customer Source Distribution",
              data: chartValues,
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ],
              hoverBackgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
              ],
            },
          ],
        });

        // Set the source data state to be displayed in the table
        const formattedSourceData = chartLabels.map((label, index) => ({
          source: label,
          count: chartValues[index],
        }));
        setSourceData(formattedSourceData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false); // Remove loader when fetching is done
      }
    };
    fetchData();
  }, []);

  // Fetch detailed customer data when a source is selected
  const fetchCustomerDetails = async (source) => {
    setLoading(true); // Show loader while fetching customer details
    try {
      const customers = await apiClient.post("/api/customers_data/query", {
          filters: [{ field: "source", op: "==", value: source }]
      }).then(res => res.data?.data || []);
        
      setCustomerDetails(customers);
      setSelectedSource(source);
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoading(false); // Hide loader once details are fetched
    }
  };

  // Chart options to show the count next to the labels in the pie chart
  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            let label = tooltipItem.label || "";
            let value = tooltipItem.raw || 0;
            return `${label}: ${value} customers`; // Display label and count
          },
        },
      },
      legend: {
        display: true,
        position: "bottom",
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => {
              return {
                text: `${label} (${data.datasets[0].data[i]})`, // Label with count
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i,
              };
            });
          },
        },
      },
    },
  };

  // Logic to get current page data for source data
  const indexOfLastSource = sourcePage * sourcePerPage;
  const indexOfFirstSource = indexOfLastSource - sourcePerPage;
  const currentSourceData = sourceData.slice(indexOfFirstSource, indexOfLastSource);

  // Logic to get current page data for customer details
  const indexOfLastCustomer = customerPage * customerPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customerPerPage;
  const currentCustomerDetails = customerDetails.slice(indexOfFirstCustomer, indexOfLastCustomer);

  // Handlers for pagination
  const handleSourcePageChange = (pageNumber) => setSourcePage(pageNumber);
  const handleCustomerPageChange = (pageNumber) => setCustomerPage(pageNumber);



  // Render pagination controls
  const renderPagination = (dataLength, perPage, page, handlePageChange) => {
    const pageCount = Math.ceil(dataLength / perPage);
    const pages = [];
    const maxVisiblePages = 2;
    pages.push(
      <li
        key="prev"
        className={`page-item ${page === 1 ? "disabled" : ""}`}
        onClick={() => handlePageChange(page - 1)}
      >
        <a className="page-link" href="#prev">Previous</a>
      </li>
    );

    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || (i >= page - maxVisiblePages && i <= page + maxVisiblePages)) {
        pages.push(
          <li
            key={i}
            className={`page-item ${i === page ? "active" : ""}`}
            onClick={() => handlePageChange(i)}
          >
            <a className="page-link" href={`#page-${i}`}>{i}</a>
          </li>
        );
      } else if (i === page - maxVisiblePages - 1 || i === page + maxVisiblePages + 1) {
        pages.push(
          <li key={`ellipsis-${i}`} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    pages.push(
      <li
        key="next"
        className={`page-item ${page === pageCount ? "disabled" : ""}`}
        onClick={() => handlePageChange(page + 1)}
      >
        <a className="page-link" href="#next">Next</a>
      </li>
    );

    return <ul className="pagination">{pages}</ul>;
  };



  // Fetch detailed customer data when a source is selected and export to CSV
const fetchCustomerDetailsAndExportCSV = async (source) => {
  setLoading(true); // Show loader while fetching customer details
  try {
    const customers = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "source", op: "==", value: source }]
    }).then(res => res.data?.data || []);

    setCustomerDetails(customers);
    setSelectedSource(source);

    // Automatically export the customer details to CSV after fetching
    exportToCSV(customers, source);
  } catch (error) {
    console.error("Error fetching customer details:", error);
  } finally {
    setLoading(false); // Hide loader once details are fetched
  }
};

// Function to export customer details to CSV
const exportToCSV = (customerData, source) => {
  const tableColumn = ["Customer Id", "Name", "Phone"];
  const tableRows = [];

  // Iterate through customer details and push to table rows
  customerData.forEach((customer) => {
    const customerDataArray = [
      customer.customer_id,
      customer.customer_name,
      customer.customer_phone,
    ];
    tableRows.push(customerDataArray);
  });

  // Combine column headers and data rows
  let csvContent = tableColumn.join(",") + "\n"; // Add headers
  tableRows.forEach((rowArray) => {
    const row = rowArray.join(","); // Join each row's values with a comma
    csvContent += row + "\n"; // Add each row to the CSV content
  });

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create a link element for downloading the CSV
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `customer_details_${source}.csv`);
  
  // Append the link to the body and trigger the download
  document.body.appendChild(link);
  link.click();
  
  // Clean up by removing the link after download
  document.body.removeChild(link);
};

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div>
            <img
              style={{ height: "6rem" }}
              src="images/loader.gif"
              alt="Loading..."
            />
          </div>
        </div>
      )}

      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <h4 className="card-title">Source Wise Customers Bifurcation</h4>
                    </div>
                    <div style={{ width: '100%', height: '500px', marginBottom: '62px', marginLeft:'300px',alignItems: 'center' }}>
                      {chartData && chartData.labels && chartData.labels.length > 0 ? (
                        <Pie data={chartData} options={chartOptions} />
                      ) : (
                        <p style={{ marginLeft:'210px' }}>data loding.....</p>
                      )}
                    </div>

                    <div className="row">
                      {/* Table to show the source data */}
                      <div className="col-lg-3">
                        <h5>Customer Source Data</h5>
                        <table className="table table-bordered table-responsive-sm">
                          <thead>
                            <tr>
                              <th>Source</th>
                              <th>Count<br/><span style={{ fontSize:'10px' }}>(Click to Export)</span></th>
                            </tr>
                          </thead>
                          <tbody>
                          {currentSourceData.map((item, index) => (
                            <tr
                              key={index}
                              style={{ cursor: "pointer" }}
                              onClick={() => fetchCustomerDetailsAndExportCSV(item.source)} // Handle click for CSV export
                            >
                              <td>{item.source}</td>
                              <td>
                                <button className="btn btn-sm btn-info">
                                  {item.count}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        </table>
                        <div className="mt-4">
                          {renderPagination(sourceData.length, sourcePerPage, sourcePage, handleSourcePageChange)}
                        </div>
                      </div>

                      {/* Show customer details when a source is selected */}
                      {selectedSource && (
                        <div className="col-lg-8" style={{ marginLeft: "40px" }}>
                          <h4 className="text-dark">
                            Customer Details for Source: {selectedSource}
                          </h4>
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Customer Id</th>
                                <th>Name</th>
                                <th>Phone</th>
                                {/* Add other customer details as needed */}
                              </tr>
                            </thead>
                            <tbody>
                              {currentCustomerDetails.map((customer, index) => (
                                <tr key={index}>
                                  <td>{customer.customer_id}</td>
                                  <td>{customer.customer_name}</td>
                                  <td>{customer.customer_phone}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-4">
                            {renderPagination(customerDetails.length, customerPerPage, customerPage, handleCustomerPageChange)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default Marketing;
