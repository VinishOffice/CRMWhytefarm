import React, { useEffect, useState } from "react";
import Select from "react-select"; 
import DatePicker from "react-datepicker";
import { Button, Alert } from "react-bootstrap";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "react-datepicker/dist/react-datepicker.css";
import { fromDate, toDate } from "../utils/dateUtils";
import apiClient from "../services/apiClient";

function CustomerReport() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersCopy, setCustomersCopy] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [UtmSourceOptions, setUtmSourceOptions] = useState([]);
  const [UtmMediumOptions, setUtmMediumOptions] = useState([]);
  const [UtmCampaignOptions, setUtmCampaignOptions] = useState([]);

  /* Export table to CSV */
  const exportTableToCSV = () => {
    const csvColumns = ["Sr.No", "Hub", "Customer Name", "Customer's Contact", "Customer's email", "Wallet Amount", "Credit Limit", "Alternate Number", "Registered On", "Account Status" ,"Source"];
    const csvRows = customers.map((customer, index) => {
      const registered = toDate(customer.registered_date);
      const rowData = [
        index + 1,
        customer.hub_name || "Hub Not Added",
        customer.customer_name || "No data",
        customer.customer_phone || "No data",
        customer.customer_email || "No data",
        customer.wallet_balance || "0",
        customer.credit_limit || "0",
        customer.alt_phone || "Not Added",
        registered ? registered.toLocaleDateString() : "N/A",
        customer.status === 1 ? "Active" : "Inactive",
        customer.source,
      ];
      return rowData;
    });
    const csvContent = [
      csvColumns.join(","), 
      ...csvRows.map(row => row.join(",")) 
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_report.csv`); 
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link); 
  };

  /* Export table to PDF */
  const exportTableToPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer Report", 20, 10);
    doc.autoTable({ html: "#hub_delivery" });
    doc.save("customer_report.pdf");
  };

  /* Export table to Excel */
  const exportTableToEXL = () => {
    const table = document.getElementById("hub_delivery");
    const worksheet = XLSX.utils.table_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CustomerReport");
    XLSX.writeFile(workbook, "customer_report.xlsx");
  };

  /* Reset search form */
  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setCustomers([]);
    setCustomersCopy([]);
    setDataLoaded(false);
    setErrorMessage("");
  };

  // Search customers based on date range
  const handleSearch = async () => {
    setErrorMessage("");
    if (!startDate || !endDate) {
      setErrorMessage("Please select both start and end dates.");
      return;
    }
    const TWO_MONTHS_IN_MILLISECONDS = 60 * 24 * 60 * 60 * 1000;
    const timeDiff = endDate - startDate;
    if (timeDiff > TWO_MONTHS_IN_MILLISECONDS) {
      setErrorMessage("Please select a date range within two months.");
      return;
    }

    setLoading(true);
    try {
      const startTimestamp = fromDate(startDate);
      const endTimestamp = fromDate(endDate);

      const customerData = await apiClient.post("/api/customers_data/query", {
        filters: [
          { field: "registered_date", op: ">=", value: startTimestamp },
          { field: "registered_date", op: "<=", value: endTimestamp }
        ]
      }).then(res => res.data?.data || []);

      setCustomers(customerData);
      setCustomersCopy(customerData);
      setDataLoaded(true);

      if (customerData.length === 0) {
        setErrorMessage("No data found within the selected date range.");
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setErrorMessage("Error fetching customer data.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    async function fetchOptions() {
      /** utm_source */
      const utmSourceDocs = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "utm_source", op: "!=", value: null }]
      }).then(res => res.data?.data || []);
      const uniqueUtmSourceOptions = utmSourceDocs
        .map((doc) => doc.utm_source)
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map((utm_source) => ({ value: utm_source, label: utm_source }));
      setUtmSourceOptions(uniqueUtmSourceOptions);

      /**utm campaign */
      const utmCampaignDocs = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "utm_campaign", op: "!=", value: null }]
      }).then(res => res.data?.data || []);
      const uniqueUtmCampaignOptions = utmCampaignDocs
        .map((doc) => doc.utm_campaign)
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map((utm_campaign) => ({ value: utm_campaign, label: utm_campaign }));
      setUtmCampaignOptions(uniqueUtmCampaignOptions);
      
      /**utm medium */
      const utmMediumDocs = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "utm_medium", op: "!=", value: null }]
      }).then(res => res.data?.data || []);
      const uniqueUtmMediumOptions = utmMediumDocs
        .map((doc) => doc.utm_medium)
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map((utm_medium) => ({ value: utm_medium, label: utm_medium }));
      setUtmMediumOptions(uniqueUtmMediumOptions);
    }
    fetchOptions()
  }, []);

  const FilterByUtm = (selectedUtm, key) => {
    if (selectedUtm.length === 0) {
      setCustomers(customersCopy);
      return
    };
    let sourceArr = selectedUtm.map((e) => e.value);
    const filteredArr = customersCopy.filter(e => sourceArr.includes(e[key]));
    setCustomers(filteredArr);
    
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
      <div className="container-scroller ">
        <div className="container-fluid">
          <div className="main-panel" style={{ width: "100%" }}>
            <div className="panel" style={{ display: "flex" }}>
              <span
                style={{
                  fontSize: "18px",
                  color: "#288a84",
                  fontWeight: "700",
                  marginTop: "12px",
                }}
              >
                CUSTOMER REPORT
              </span>
              <div style={{ marginLeft: "65%" }}>
                {dataLoaded && (
                  <Button
                    onClick={exportTableToEXL}
                    className="btn btn-success btn-rounded btn-sm"
                  >
                    Export Excel
                  </Button>
                )}
              </div>
              {dataLoaded && (
                <>
                  <button
                    className="btn btn-success btn-rounded btn-sm"
                    onClick={exportTableToPDF}
                    style={{ marginLeft: "-15%" }}
                  >
                    Export PDF
                  </button>
                </>
              )}
              {dataLoaded && (
                <>
                  <button
                    className="btn btn-success btn-rounded btn-sm"
                    onClick={exportTableToCSV}
                    style={{ marginLeft: "-15%" }}
                  >
                    Export CSV
                  </button>
                </>
              )}
            </div>
            <br />
            <div className="panel">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  zIndex: "50",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  <div style={{ marginTop: "10px" , position:"relative", zIndex:9999}}>
                    <label>Start Date:</label>
                    <br />
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="From reg"
                      className="form-control"
                    />
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <label>End Date:</label>
                    <br />
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="To reg"
                      className="form-control"
                    />
                  </div>
                  <div className="" style={{ marginTop: "30px" }}>
                    <Button
                      variant="outline-success"
                      onClick={handleSearch}
                      size="sm"
                    >
                      Search
                    </Button>
                    <Button
                      variant="outline-success"
                      onClick={handleReset}
                      style={{ marginLeft: "10px" }}
                      size="sm"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <label>Utm Campaign :</label>
                    <Select
                      isMulti
                      options={UtmCampaignOptions}
                      // value={selectedUtmCampaign}
                      onChange={(selected) =>
                        FilterByUtm(selected, "utm_campaign")
                      }
                      placeholder="Select UTM Campaign(s)"
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "100%",
                        }),
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      }}
                    />
                  </div>
                  <div>
                    <label>Utm Medium :</label>
                    <Select
                      isMulti
                      options={UtmMediumOptions}
                      // value={selectedUtmMedium}
                      onChange={(selected) =>
                        FilterByUtm(selected, "utm_medium")
                      }
                      placeholder="Select UTM Medium(s)"
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "100%",
                        }),
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      }}
                    />
                  </div>
                  <div>
                    <label>Utm Source :</label>
                    <Select
                      isMulti
                      options={UtmSourceOptions}
                      // value={selectedUtmSource}
                      onChange={(selected) => {
                        FilterByUtm(selected, "utm_source");
                      }}
                      placeholder="Select UTM Source(s)"
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "100%",
                        }),
                        menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

            {/* Display Total Count */}
            {dataLoaded && (
              <div style={{ marginBottom: "10px", marginTop: "10px" }}>
                Total Customers: {customers.length}
              </div>
            )}
            <div className="card mt-4 px-1"
            >
              <div className="card-body p-0">
                <div
                  className="table-responsive"
                  style={{
                    overflowY: "auto",
                    maxHeight: "600px",
                  }}
                >
                  <table className="table table-striped" id="hub_delivery">
                    <thead className=" bg-white" style={{}}>
                      <tr>
                        <th>Sr No.</th>
                        <th>Hub</th>
                        <th>Customer Name</th>
                        <th>Customer's Contact</th>
                        <th>Customer's Email</th>
                        <th>Customer's Address</th>
                        <th>Wallet Amount</th>
                        <th>Credit Limit</th>
                        <th>Alternate Number</th>
                        <th>Registered On</th>
                        <th>Account Status</th>
                        <th>Source</th>
                        <th>UTM campaign</th>
                        <th>UTM medium</th>
                        <th>UTM source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length > 0 ? (
                        customers.map((customer, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{customer.hub_name || "Hub Not Added"}</td>
                            <td>{customer.customer_name || "No data"}</td>
                            <td>{customer.customer_phone || "No data"}</td>
                            <td>{customer.customer_email || "No data"}</td>
                            <td>{customer.customer_address || "No data"}</td>
                            <td>{customer.wallet_balance || "0"}</td>
                            <td>{customer.credit_limit || "0"}</td>
                            <td>{customer.alt_phone || "Not Added"}</td>
                            <td>
                              {customer.registered_date
                                ? new Date(
                                    customer.registered_date.seconds ? customer.registered_date.seconds * 1000 : customer.registered_date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td>
                              {customer.status === 1 ? "Active" : "Inactive"}
                            </td>
                            <td>{customer.source}</td>
                            <td>{customer?.utm_campaign}</td>
                            <td>{customer?.utm_medium}</td>
                            <td>{customer?.utm_source}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="15" className="text-center">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default CustomerReport;
