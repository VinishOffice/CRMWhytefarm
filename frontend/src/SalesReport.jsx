import React, { useState, useEffect, useCallback,useContext } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
    
import ExportTableToExcel from './ExportTableToExcel';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import GlobalContext from './context/GlobalContext';
import { handleLogout } from './Utility';
import { fetchReportOptions, fetchSalesReport } from "./services/reportsOperationsService";
const SalesReport = () => {
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('customer_sales_report')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    const [selectedHub, setSelectedHub] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [hubNames, setHubNames] = useState([]);
    const [productsNames, setProductsNames] = useState([]);
    const [showNodataFound, setshowNodataFound] = useState(false);
    const [fileName, setFileName] = useState("");
    const [deliveryExecutiveNames, setDeliveryExecutiveNames] = useState([]);
    const [deliveryExecutivesMap, setDeliveryExecutivesMap] = useState(new Map());
    const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [salesReportData, setSalesReportData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [initialValue, setInitialValue] = useState("");
    const moment = require('moment');
    useEffect(() => {
        if (localStorage.getItem("loggedIn") !== "true") {
          navigate("/login");
        }
      }, [navigate]);

      const getDeliveryExecutives = useCallback(async () => {
        const newMap = new Map();
        const resp = await fetchReportOptions();
        (resp.deliveryExecutives || []).forEach((d) => {
          newMap.set(d.hub_user_id, d.name);
        });
        setDeliveryExecutivesMap(newMap);
      }, []);
    
    useEffect(() => {
    getDeliveryExecutives();
    }, [getDeliveryExecutives]);

    useEffect(() => {
        const fetchHubs = async () => {
        const resp = await fetchReportOptions();
        setHubNames((resp.hubs || []).map((h) => ({ label: h, value: h })));
        };
        fetchHubs();
    }, []);

    useEffect(() => {
        const fetchDeliveryExeList = async () => {
          if (!selectedHub) return;
          
          const resp = await fetchReportOptions();
          const de = (resp.deliveryExecutives || [])
            .filter((d) => d.hub_name === selectedHub.value)
            .map((d) => ({ value: d.hub_user_id, label: d.name }));
          setDeliveryExecutiveNames(de);
    };
        
    fetchDeliveryExeList();
}, [selectedHub]);
useEffect(() => {
    const fetchProductsList = async () => {
        const resp = await fetchReportOptions();
        const product = (resp.products || []).map((p) => ({ value: p, label: p }));
        setProductsNames(product);
          
        };
        
        fetchProductsList();
      }, []);

    

    const handleSearch = async () => {
        setShowSpinner(true);
        setDataLoaded(false);
        setInitialValue("");
      
        try {
          const resp = await fetchSalesReport({
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
            hubName: selectedHub?.value,
            deliveryExeId: selectedDeliveryExecutive?.value,
            productName: selectedProduct?.value,
          });

          const salesList = resp.data || [];
          setSalesReportData(salesList);
      
          if (salesList.length === 0) {
            setInitialValue("No Data Found");
          } else {
            setDataLoaded(true);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setShowSpinner(false);
        }
      };
      



  
  
      const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedHub(null);
        setSelectedDeliveryExecutive(null);
        setDataLoaded(false);
        setInitialValue("");
        setInitialValue([]);
        
      };
    const handleEndDateChange = (date) => {

        if (date) {
            const updatedEndDate = new Date(date);
            updatedEndDate.setHours(23, 59, 59, 999); // Set the time to 11:59:59 PM
            //setEndDateQuery(updatedEndDate);
            setEndDate(updatedEndDate);
        }
    }
    const handleDateChange = (date) => {
        const updatedDate = new Date(date);
        updatedDate.setHours(5);
        updatedDate.setMinutes(30);
        setStartDate(updatedDate);
    };

    const handleDEchange = async (selectedOption) => {
        setSelectedDeliveryExecutive(selectedOption);
    };
    const handlePDchange = async (selectedOption) => {
        setSelectedProduct(selectedOption);
    };


const exportToCSV = () => {
    const csvColumns = [
      "Sr No", "Order ID", "Hub Name", "Customer ID", "Name", "Phone", 
      "Location", "Order Type", "Product", "Quantity", "Unit Price", 
      "Total Amount", "Delivery Date", "Delivery Time", "Delivery Executive"
    ];

    const csvRows = salesReportData.map((sale, index) => [
      index + 1,
      sale.order_id,
      sale.hub_name,
      sale.customer_id,
      sale.customer_name,
      sale.customer_phone,
      sale.location,
      sale.order_type,
      sale.product_name,
      sale.quantity,
      sale.price,
      sale.total_amount,
      moment(sale.delivery_date).format("DD-MM-YYYY"),
      sale.delivery_time,
      deliveryExecutivesMap.get(sale.delivery_exe_id)
    ]);

    // Convert each row to CSV format with fields wrapped in double quotes
    const csvContent = [
      csvColumns.map(col => `"${col}"`).join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "SalesReport.csv";
    link.click();
};



      const exportToPDF = () => {
        const doc = new jsPDF();
        const tableColumn = [
          "Sr No", "Order ID", "Hub Name", "Customer ID", "Name", "Phone", 
          "Location", "Order Type", "Product", "Quantity", "Unit Price", 
          "Total Amount", "Delivery Date", "Delivery Time", "Delivery Executive"
        ];
    
        const tableRows = salesReportData.map((sale, index) => [
          index + 1,
          sale.order_id,
          sale.hub_name,
          sale.customer_id,
          sale.customer_name,
          sale.customer_phone,
          sale.location,
          sale.order_type,
          sale.product_name,
          sale.quantity,
          sale.price,
          sale.total_amount,
          moment(sale.delivery_date).format("DD-MM-YYYY"),
          sale.delivery_time,
          deliveryExecutivesMap.get(sale.delivery_exe_id)
        ]);
    
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          styles: { fontSize: 6, cellPadding: 1 }
        });
    
        doc.save("SalesReport.pdf");
      };
    return (
      <>
        <div class="container-scroller">
          <div class="container-fluid">
            <div class="main-panel" style={{ width: "100%" }}>
              <div
                className="panel"
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#288a84",
                      fontWeight: "700",
                      marginTop: "12px",
                    }}
                  >
                    SALES REPORT
                  </span>
                </div>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {dataLoaded && (
                    <ExportTableToExcel
                      tableId="saleReportTable"
                      fileName={fileName}
                    />
                  )}
                  {dataLoaded && (
                    <button
                      className="btn btn-success btn-rounded btn-sm"
                      onClick={exportToPDF}
                    >
                      Export to PDF
                    </button>
                  )}
                  {dataLoaded && (
                    <button
                      className="btn btn-success btn-rounded btn-sm"
                      onClick={exportToCSV}
                    >
                      Export to CSV
                    </button>
                  )}
                </div>
              </div>
              <div className="panel" style={{ marginTop: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems:"center",
                    width: "85%",
                  }}
                >
                  <div style={{ marginTop: "10px" }}>
                    <label>Hub Name</label>
                    <br />
                    <Select
                      options={hubNames}
                      onChange={(value) => setSelectedHub(value)}
                      value={selectedHub}
                      placeholder="Select Hub Name"
                    />
                  </div>
                  <div className="inputPanels">
                    <label>Delivery Executive</label>
                    <Select
                      options={deliveryExecutiveNames}
                      onChange={handleDEchange}
                      value={selectedDeliveryExecutive}
                      placeholder="Select Delivery Executive"
                      required
                    />
                  </div>
                  <div className="inputPanels">
                    <label>Product</label>
                    <Select
                      options={productsNames}
                      onChange={handlePDchange}
                      value={selectedProduct}
                      placeholder="Select Product"
                      required
                    />
                  </div>
                  <div className="inputPanels">
                    <label>From </label>
                    <br />
                    <DatePicker
                      selected={startDate}
                      maxDate={endDate}
                      onChange={(date) => setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="datepicker-input"
                      placeholderText="Enter From date"
                    />
                  </div>
                  <div className="inputPanels">
                    <label>To</label>
                    <br />
                    <DatePicker
                      selected={endDate}
                      minDate={startDate}
                      onChange={handleEndDateChange}
                      dateFormat="dd/MM/yyyy"
                      className="datepicker-input"
                      placeholderText="Enter To date"
                    />
                  </div>
                  <div className="inputPanels d-flex" style={{ marginTop: "30px" }}>
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
              </div>
              <div className="panel" style={{ marginTop: "10px" }}>
                {showSpinner ? (
                  <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <>
                      {salesReportData.length?<h3>Total Orders : {salesReportData.length}</h3>:""}

                    <div className="panel2">
                      <div className="table-responsive">
                        <table className="table" id="saleReportTable">
                          <thead>
                            <tr>
                              <th>Sr No.</th>
                              <th>Order ID</th>
                              <th>Hub Name</th>
                              <th>Customer ID</th>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Location</th>
                              <th>Customer Address</th>
                              <th>Order Type</th>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Total Amount</th>
                              <th>Delivery Date</th>
                              <th>Delivery Time</th>
                              <th>Delivery Executive</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataLoaded ? (
                              salesReportData.map((sale, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{sale.order_id}</td>
                                  <td>{sale.hub_name}</td>
                                  <td>{sale.customer_id}</td>
                                  <td>{sale.customer_name}</td>
                                  <td>{sale.customer_phone}</td>
                                  <td>{sale.location}</td>
                                  <td>{sale.delivering_to}</td>
                                  <td>{sale.order_type}</td>
                                  <td>{sale.product_name}</td>
                                  <td>{sale.quantity}</td>
                                  <td>{sale.price}</td>
                                  <td>{sale.total_amount}</td>
                                  <td>
                                    {moment(sale.delivery_date).format(
                                      "DD-MM-YYYY"
                                    )}
                                  </td>
                                  <td>{sale.delivery_time}</td>
                                  <td>
                                    {deliveryExecutivesMap.get(
                                      sale.delivery_exe_id
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="15"
                                  style={{ textAlign: "center" }}
                                >
                                  {initialValue}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
};

export default SalesReport;