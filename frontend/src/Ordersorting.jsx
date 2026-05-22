import React, { useState, useEffect,useContext } from "react";
import { Button } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { useNavigate } from 'react-router-dom';
import Alert from "react-bootstrap/Alert";
import Select from "react-select";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import { listCollection, queryCollection } from "./services/orderOperationsService";
function Ordersorting() {
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('order_sorting_report')){
              handleLogout()
              navigate("/permission_denied");
          }
      }
  }
  }, [navigate,permissible_roles]);
  const moment = extendMoment(Moment);
  const [fromDate, setFromDate] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [orderReports, setOrderReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [show, setShow] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const [deliveryExecutiveNames, setDeliveryExecutiveNames] = useState([]);
  const [hubNames, setHubNames] = useState([]);
  const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState();
  const [productList, setProductList] = useState([]);
  const [totalQtyOrder, setTotalQtyOrder] = useState(0);
  const [orderSheet, setOrdersheet] = useState({});
  const [orderDataList, setOrderDataList] = useState([]);
  const [productSummary, setProductSummary] = useState([]);
  const [productListQty , setProductListQty] = useState([]);
  const [deliveryModes, setDeliveryModes] = useState({});
  const [orderSortingList , setOrderSortingList] = useState([]);

 const validateParams = () => {

    let errMsg = "";
    if (!selectedHub) {
      errMsg = "Please enter the Hub Name";
      return errMsg;
    } else if (!selectedDeliveryExecutive) {
      errMsg = "Please enter the Delivery Executive";
      return errMsg;
    }
  };

  const getCustomerList = async (orders) => {
    try {
      const ids = Array.from(
        new Set(orders.map((order) => order.customer_id).filter(Boolean))
      );
      if (ids.length === 0) return [];

      const response = await queryCollection("customers_data", {
        filters: [{ field: "customer_id", op: "in", value: ids }],
      });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching customer list:", error);
      return [];
    }
  };

  const handleSearch = async () => {
    
    const errMsg = await validateParams();
    if (errMsg) {
      toast.error(errMsg);
      return;
    }
    setShowSpinner(true);
    setShow(false);
    setDataLoaded(false);
    const startDate = moment(new Date().toISOString()).format("YYYY-MM-DD");
    const response = await queryCollection("order_history", {
      filters: [
        { field: "delivery_date", op: "==", value: startDate },
        { field: "hub_name", op: "==", value: selectedHub.value },
        { field: "delivery_exe_id", op: "==", value: selectedDeliveryExecutive.value.trim() },
      ],
    });
    const orders = response.data || [];
    
    if(orders.length > 0) {

      const customer_list = await getCustomerList(orders);
      setOrderSortingList(customer_list);

      if (customer_list.length > 0) {
        setShowSpinner(false);
        setDataLoaded(true);
      } else {
        setShow(true);
        setDataLoaded(false);
        setShowSpinner(false);
      }
    }else {
      setShowSpinner(false);
      setShow(true);
      //setDataLoaded(true);
    }
    
  };

  
  

  const handleReset = () => {
    setFromDate(null);
    setSelectedHub("");
    setSelectedDeliveryExecutive("");
    setShow(false);
    setOrderReports([]);
    setProductList([]);
  };

  const SpinnerOverlay = () => (
    <div className="spinner-overlay">
      <div className="spinner"></div>
    </div>
  );

  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageButtons = () => {

    const pageButtons = [];
    
    let startPage = Math.max(1, currentPage - 5);
    let endPage = Math.min(totalPages, startPage + 9);

    
    if (totalPages <= 10) {
      endPage = totalPages;
    } else {
      // If the current page is near the start, display the first 10 pages
      if (currentPage <= 5) {
        startPage = 1;
        endPage = 10;
      }
      // If the current page is near the end, display the last 10 pages
      else if (currentPage >= totalPages - 4) {
        endPage = totalPages;
        startPage = endPage - 9;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <li
          key={i}
          className={`page-item ${currentPage === i ? "active" : ""}`}
        >
          <button
            onClick={() => paginate(i)}
            className="page-link"
            style={{ color: "black" }}
          >
            {i}
          </button>
        </li>
      );
    }

    return pageButtons;
  };

  useEffect(() => {
    const fetchHubs = async () => {
      const response = await listCollection("hubs_data");
      const hubs = response.data || [];
      setHubNames(
        hubs.map((hub) => ({
          label: hub.hub_name,
          value: hub.hub_name,
        }))
      );
    };
    fetchHubs();
  }, []);

  useEffect(() => {
    const fetchDeliveryExeList = async () => {

      try {
        if (!selectedHub) {
          setDeliveryExecutiveNames([]);
          return;
        }
        const response = await queryCollection("hubs_users_data", {
          filters: [{ field: "hub_name", op: "==", value: selectedHub.value }],
        });
        const de = (response.data || []).map((data) => ({
          value: `${data.hub_user_id}`,
          label: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        }));
        setDeliveryExecutiveNames(de);
      } catch (error) {
        console.error("Error fetching delivery executive:", error);
      }
    };

    fetchDeliveryExeList();
  }, [selectedHub]);



  const handleHubChange = async (selectedOption) => {

    setSelectedHub(selectedOption);
  };

  const handleDEchange = async (selectedOption) => {
    setSelectedDeliveryExecutive(selectedOption);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Sr No",
      "Customer ID",
      "Customer Name",
      "Phone Number",
      "Customer Address",
    ];
    const tableRows = orderSortingList.map((customers ,index) => [
      index + 1,
      customers.customer_id,
      customers.customer_name,
      customers.customer_phone,
      customers.customer_address
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("Odersorting.pdf");
  };

  const exportToCSV = () => {
    // Prepare CSV headers
    const csvColumns = [
        "Sr No",
        "Customer ID",
        "Customer Name",
        "Phone Number",
        "Customer Address",
    ];

    // Prepare CSV rows
    const csvRows = orderSortingList.map((customer, index) => [
        index + 1,
        customer.customer_id,
        customer.customer_name,
        customer.customer_phone,
        customer.customer_address
    ]);

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
    link.setAttribute("download", "OrderSorting.csv"); // Set the filename for the CSV
    link.style.visibility = 'hidden';

    // Append the link to the body
    document.body.appendChild(link);
    link.click(); // Simulate a click on the link
    document.body.removeChild(link); // Remove the link after download
};

  return (
    <>
      <div class="container-scroller">
        <div class="container-fluid">
          <div class="main-panel" style={{ width: '100%' }}>
            <div className="panel" style={{ marginTop: "10px", marginBottom: "10px", display:"flex", justifyContent:"space-between" }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>ORDER SORTING</span>
                
              </div>
              <div>
              <button className="btn btn-success btn-rounded btn-sm mt-1" onClick={exportToPDF} >Export to PDF</button>
              <button className="btn btn-success btn-rounded btn-sm mt-1"  style={{marginLeft:"10px"}} onClick={exportToCSV} >Export to CSV</button>
              </div>
            </div>

            <div className="panel datepickers-container">
              <div className="dropdown-container">
                <label>Hubs *</label>
              </div>
              <div className="dropdown-container">
                <Select
                  options={hubNames}
                  onChange={handleHubChange}
                  value={selectedHub}
                  placeholder="Select Hub Name"
                  required
                />
              </div>
              <div className="dropdown-container">
                <label>Delivery Executive *</label>
              </div>
              <div className="dropdown-container">
                <Select
                  options={deliveryExecutiveNames}
                  onChange={handleDEchange}
                  value={selectedDeliveryExecutive}
                  placeholder="Select Delivery Executive"
                  required
                />
              </div>
              <div>
                <Button variant="outline-success" onClick={handleSearch} size='sm'>
                  Search
                </Button>
                <Button
                  variant="outline-success"
                  onClick={handleReset}
                  style={{ marginLeft: "10px" }}
                  size='sm'
                >
                  Reset
                </Button>
              </div>
            </div>
            <br />
            <div className="panel">
                {dataLoaded && <div className="panel" style={{backgroundColor:'#ffff' , fontSize:'15px' , fontWeight:'700' ,width:'50%', display:'flex' , flexDirection:'row' , justifyContent:'space-between' , marginBottom:'10px'}}>
                    <div>
                        Hub Name : {selectedHub.value}
                    </div>
                    <div>
                        Delivery Executive : {selectedDeliveryExecutive.label}
                    </div>
                   
                </div>
                } 
            <table class="table table-striped" id="order_sorting_table">
            {showSpinner && <div className="spinner-container"><SpinnerOverlay/></div>}
          <thead>
            <tr>
              <th>Customer Id</th>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Customer Address</th>
              {/* <th>Delivery Preference</th> */}
            </tr>
          </thead>
          <tbody>
            {dataLoaded &&
              orderSortingList.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.customer_name}</td>
                  <td>{customer.customer_phone}</td>
                  <td>{customer.customer_address}</td>
                  {/* <td>customer.delivery_preference}</td> */}
                </tr>
              ))}
          </tbody>
        </table>
        <Alert show={show} variant="success">
        <Alert.Heading>No data found for selected criteria</Alert.Heading>
        <div className="d-flex justify-content-end">
          <Button onClick={() => setShow(false)} variant="outline-success">
            Close
          </Button>
        </div>
      </Alert>
            </div>
          </div>
        </div>
      </div>
      

    </>
  );
}

export default Ordersorting;
