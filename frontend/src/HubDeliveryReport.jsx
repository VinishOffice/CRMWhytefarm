import React, { useState, useEffect,useContext } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderSheet'
import ExportTableToExcel from './ExportTableToExcel';
import { Button,  Alert } from 'react-bootstrap';
import {
  fetchHubDeliveryOptions,
  fetchHubDeliveryReport,
} from "./services/orderOperationsService";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import GlobalContext from './context/GlobalContext';
import { handleLogout } from './Utility';

const HubDeliveryReport = () => {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('hub_deliveries_report')){
              handleLogout()
              navigate("/permission_denied");
          }
      }
  }
  }, [navigate,permissible_roles]);
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const [selectedHubName, setSelectedHubName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [hubDeliveryData, setHubDeliveryData] = useState([]);
  const [hubNames, setHubNames] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [showNodataFound, setshowNodataFound] = useState(false);
  const [productList, setProductList] = useState([]);
  const [packagingOptions, setPackagingOptions] = useState([]);
  const [selectedPackaging, setSelectedPackaging] = useState();
  const [data, setData] = useState([]);
  const [totalQty, setTotalQty] = useState(0);
  const [fileName, setFileName] = useState("");
  const [selectedReportType, setSelectedReportType] = useState('');
  const [cummulativeHubDeliveryList, setCummulativeHubDeliveryList] = useState([]);
  const [loadData, setLoadData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadCummulativeData, setLoadCummulativeData] = useState(false);
  const reportTypeOptions = [
    { label: "Cummulative", value: "Cummulative" },
    { label: "Hub Wise", value: "Hubwise" }
  ];

  useEffect(() => {
    // Load data logic
  }, [currentPage]);

  const createFileName = () => {
    const d = startDate ? startDate : new Date();
    const dateStr = moment(d).format("YYYY-MM-DD");
    const reportType = selectedReportType?.value || "report";
    const hub = selectedHubName?.value || "all-hubs";
    const product = selectedProduct?.value || "all-products";
    const pkg = selectedPackaging?.value || "all-packaging";
    setFileName(`hub-delivery-${reportType}-${hub}-${product}-${pkg}-${dateStr}`);
  };
  
  
  const exportTableToPDF = () => {
    const doc = new jsPDF();
    // Optional: Add a title or any other text
    doc.text("Cumulative Hub Delivery Report", 20, 20);
    // Prepare table data
    const tableColumn = ["Sr.No", "Product Name", "Category", "Packaging", "Unit Price", "Quantity"];
    if (selectedReportType.value === "Hubwise") {
      tableColumn.splice(1, 0, "Hub Name");
    }
    const tableRows = cummulativeHubDeliveryList.map((delivery, index) => {
      const rowData = [
        index + 1,
        delivery.product_name,
        delivery.category,
        delivery.packaging,
        delivery.unit_price,
        delivery.quantity,
      ];

      if (selectedReportType.value === "Hubwise") {
        rowData.splice(1, 0, delivery.hub_name);
      }

      return rowData;
    });

    // Generate the table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30, // Start after the title
    });

    // Save the PDF
    doc.save(`${fileName || 'report'}.pdf`);
  };


  const exportTableToCSV = () => {
    // Prepare CSV headers
    const csvColumns = ["Sr.No", "Product Name", "Category", "Packaging", "Unit Price", "Quantity"];
    if (selectedReportType.value === "Hubwise") {
        csvColumns.splice(1, 0, "Hub Name"); // Insert "Hub Name" column if the report type is Hubwise
    }

    // Prepare CSV rows
    const csvRows = cummulativeHubDeliveryList.map((delivery, index) => {
        const rowData = [
            index + 1,
            delivery.product_name,
            delivery.category,
            delivery.packaging,
            delivery.unit_price,
            delivery.quantity,
        ];

        if (selectedReportType.value === "Hubwise") {
            rowData.splice(1, 0, delivery.hub_name); // Insert hub name if the report type is Hubwise
        }

        return rowData;
    });

    // Combine headers and rows into a single CSV content
    const csvContent = [
        csvColumns.join(","), // Join the header row
        ...csvRows.map(row => row.join(",")) // Join each data row
    ].join("\n"); // Join all rows with a newline character

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a link element for downloading
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName || 'report'}.csv`); // Use the same filename as PDF
    link.style.visibility = 'hidden';

    // Append the link to the body
    document.body.appendChild(link);
    link.click(); // Simulate a click on the link
    document.body.removeChild(link); // Remove the link after download
};

  const moment = require('moment');
  useEffect(() => {
    const fetchOptions = async () => {
      const response = await fetchHubDeliveryOptions();
      const hubs = response.hubs || [];
      const products = response.products || [];

      setHubNames(
        hubs.map((hub) => ({ label: hub.hub_name, value: hub.hub_name }))
      );

      setProductNames(
        products.map((product) => ({
          label: product.productName,
          value: product.productName,
        }))
      );

      if (products.length > 0) {
        setProductList(products);
      }
    };

    fetchOptions();
  }, []);

  const filterProductByName = (selectedProduct) => {
    const filteredList = productList.filter(productDetails => productDetails.productName === selectedProduct);
    if (filteredList) {
      setPackagingOptions(
        filteredList[0].packagingOptions.map((options) => ({ label: options.packaging + ' ' + options.pkgUnit, value: options.packaging + ' ' + options.pkgUnit }))
      )

    }

  };
  useEffect(() => {
    if (selectedProduct) {
      setPackagingOptions([]);
      setSelectedPackaging('');
      filterProductByName(selectedProduct.value);
    }
  }, [selectedProduct]);

  const runReport = async () => {
    if (!startDate || !selectedReportType) {
      const Toast = Swal.mixin({
        toast: true,
        background: '#69aba6',
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });

      Toast.fire({
        icon: 'warning',
        title: 'Please select Date and Report Type'
      });
      return;
    }

    if (selectedProduct && !selectedPackaging) {
      const Toast = Swal.mixin({
        toast: true,
        background: '#69aba6',
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });

      Toast.fire({
        icon: 'warning',
        title: 'Please Select Packaging'
      });
      return;
    }

    try {
      setLoading(true);
      setDataLoaded(false);
      setLoadCummulativeData(false);

      const response = await fetchHubDeliveryReport({
        date: moment(startDate).format('YYYY-MM-DD'),
        reportType: selectedReportType.value,
        hubName: selectedHubName?.value,
        productName: selectedProduct?.value,
        packageUnit: selectedPackaging?.value,
      });

      setCummulativeHubDeliveryList(response.data || []);
      setLoadCummulativeData(true);
      setDataLoaded(true);
      createFileName();
    } catch (error) {
      console.error('Error calculating report:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = async () => {
    runReport();
  }

  const handleDateChange = (date) => {

    setStartDate(date);
  };

  const handleReportTypeChange = (selectedOption) => {
    setSelectedReportType(selectedOption);
    setSelectedProduct('');
    setSelectedPackaging('');
    setSelectedHubName('');
    setCummulativeHubDeliveryList([]);
  };

  const handleReset = () => {
    setStartDate(null);
    setSelectedHubName("");
    setSelectedProduct("");
    setSelectedPackaging("");
    setSelectedReportType("");
    setshowNodataFound(false);
    setHubDeliveryData("");
    setDataLoaded(false);
  };

  
  return (
    <>
      {loading && ( // Render loader when loading state is true
        <div className="loader-overlay">
          <div className="">
            <img style={{
              height: "6rem"
            }} src="images/loader.gif"></img>
          </div>
        </div>
      )}
      <div class="container-scroller">
        <div class="container-fluid">
          <div class="main-panel" style={{ width: '100%' }}>
            <div className='panel' style={{ display: 'flex' }}>
              <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>HUB DELIVERY REPORT</span>
              <div style={{ marginLeft: '65%' }}>
                {dataLoaded && <ExportTableToExcel
                  tableId="hub_delivery"
                  fileName={fileName}
                />}
              </div>
            
              {dataLoaded && (
                <>
                 <button className='btn btn-success btn-rounded btn-sm' onClick={exportTableToPDF}style={{ marginLeft: '-15%' }} >Export PDF</button>
                
                <button className='btn btn-success btn-rounded btn-sm' onClick={exportTableToCSV}style={{ marginLeft: '-15%' }} >Export CSV</button>
                </>
               
              )}
              
            </div>
            <br />
            <div className="panel">

              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                <div style={{ marginTop: '10px' }}>
                  <label>Date:</label>
                  <br />
                  <DatePicker
                    selected={startDate}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="datepicker-input"
                    placeholderText="Select date"
                  />
                </div>
                <div className='inputPanels'>
                  <label>Report Type</label>
                  <Select
                    options={reportTypeOptions}
                    onChange={handleReportTypeChange}
                    value={selectedReportType}
                    placeholder="Report Type"
                  />
                </div>
                {selectedReportType.value == 'Hubwise' ? <>
                  <div className='inputPanels'>
                    <label>Hub Name:</label>
                    <Select
                      options={hubNames}
                      onChange={value => setSelectedHubName(value)}
                      value={selectedHubName}
                      placeholder="Select Hub Name"
                    />
                  </div>
                </> : <></>
                }
                <div className='inputPanels'>
                  <label>Product:</label>
                  <Select
                    options={productNames}
                    onChange={value => setSelectedProduct(value)}
                    value={selectedProduct}
                    placeholder="Select Product"
                  />
                </div>
                <div className='inputPanels'>
                  <label>Packaging:</label>
                  <Select
                    options={packagingOptions}
                    onChange={value => setSelectedPackaging(value)}
                    value={selectedPackaging}
                    placeholder="Select Packaging"
                  />
                </div>
                <div className='inputPanels' style={{ marginTop: '30px' }}>
                  <Button variant="outline-success"
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
  
            
            <table class="table table-striped" id="hub_delivery">
              <thead>
                <tr>
                  <th>Sr No.</th>
                  {selectedReportType.value == "Hubwise" ? <th>Hub Name</th> : <></>}
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Packaging</th>
                  <th>Unit Price</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dataLoaded &&
                  cummulativeHubDeliveryList.map((delivery, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      {selectedReportType.value == "Hubwise" ? <td>{delivery.hub_name}</td> : <></>}
                      <td>{delivery.product_name}</td>                      
                      <td>{delivery.category}</td>
                      <td>{delivery.packaging}</td>
                      <td>{delivery.unit_price}</td>
                      <td>{delivery.quantity}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <Alert show={showNodataFound} variant="success">
              <Alert.Heading>No data found for selected criteria</Alert.Heading>
              <div className="d-flex justify-content-end">
                <Button onClick={() => setshowNodataFound(false)} variant="outline-success">
                  Close
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      </div>
    </>
  );
};

export default HubDeliveryReport;
