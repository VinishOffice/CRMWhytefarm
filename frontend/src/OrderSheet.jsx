import React, { useState, useEffect,useContext } from "react";
import { Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Moment from "moment";
import { extendMoment } from "moment-range";
import Alert from "react-bootstrap/Alert";
import Select from "react-select";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2'
import { handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import {
  fetchOrderSheet,
  listCollection,
  queryCollection,
} from "./services/orderOperationsService";

function OrderSheet() {
  const navigate = useNavigate();
  const {permissible_roles} = useContext(GlobalContext);
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
  }else{
      if(permissible_roles.length>0){
          if(!permissible_roles.includes('order_report')){
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
  const [productListQty, setProductListQty] = useState([]);
  const [groupedRecords, setGroupedRecords] = useState({});
  const [customerDetails, setCustomerDetails] = useState({});
  const [combinedList , setCombinedList] = useState([]);
  const [loading , setLoading] = useState(false);
  const [totalQuantity , setTotalQuantity] = useState(0);
  const [customerWalletMap , setCustomerWalletMap] = useState(new Map());
  const [disabledSearch , setDisabledSearch] = useState(false);


  const generatePDF = async () => {
    const doc = new jsPDF();
    const orderDate = moment(fromDate.toISOString()).format("DD-MM-YYYY");
    const fullFilename = `OrderSheet_${orderDate}`;
    
    const headers = [
      ['Customer Name',
      'Contact', 
      'Customer Address', 
      'Product', 
      'Pkg', 
      'Qty', 
      'Wallet', 
      'Location']
    ];
  
    const product_header = [
      ['Product Name', 'Packaging', 'Quantity']
    ];
  
    const dEdetails_header = [
      ['Delivery Executive Name', 'Order Date', 'Total Quantity']
    ];
  
    const col_width_DE = [60, 40, 30];
    const columnWidths = [30, 20, 30, 25, 15, 15, 18, 30];
    const col_width_product = [80, 25, 20];
  
    const headerColor = [30, 50, 100];  // RGB for header color (light blue)
    const bodyColor = [240, 240, 240];  // RGB for body color (light grey)
    const borderColor = [200, 200, 200];  // RGB for borders (light grey)
    const alternateRowColor = [255, 255, 255]; // RGB for alternating rows (white)
    
    // Create the rows for orders with proper data
    const createOrderRows = (orders) => {
      return orders
        .sort((a, b) => a.location.localeCompare(b.location))
        .map(order => {
          const customerName = order.customer_name || 'No Data';
          const customerPhone = order.customer_phone || 'No Data';
          const deliveringTo = order.delivering_to || 'No Data';
          const productName = order.product_name || 'No Data';
          const packageUnit = order.package_unit || '0';
          const quantity = order.quantity || '0';
          const wallet = customerWalletMap.get(order.customer_id) || '0';
          const location = order.location || 'No Data';
  
          return [
            customerName,
            customerPhone, 
            deliveringTo,
            productName,
            packageUnit, // Ensures '0' is set if no data
            quantity,    // Ensures '0' is set if no data
            wallet,      // Ensures '0' is set if no data
            location
          ];
        });
    };
    
    const createProductRows = (orders) => {
      const productMap = new Map();
      
      let showNoDataRow = false;
      
      orders.forEach(order => {
        const productName = order.product_name || 'No Data';
        const packageUnit = order.package_unit || '0';
        const quantity = order.quantity || '0'; // Fallback to 0 instead of '0' for summation
        
        if (productName === 'No Data' || packageUnit === '0' || quantity === '0') {
          showNoDataRow = true;
        } else {
          const key = `${productName}-${packageUnit}`;
          if (productMap.has(key)) {
            productMap.set(key, productMap.get(key) + quantity);
          } else {
            productMap.set(key, quantity);
          }
        }
      });
      
      const productRows = Array.from(productMap.entries()).map(([key, quantity]) => {
        const [productName, packaging] = key.split('-');
        return [
          productName || 'No Data', 
          packaging || 'No Data',   
          quantity.toString() || '0' // Convert to string for PDF consistency
        ];
      });
      
      if (showNoDataRow) {
        productRows.unshift(['No Data', 'No Data', '0']);
      }
      
      return productRows;
    };
  
    // Filter orders based on the selected delivery executive
    const filteredOrders = selectedDeliveryExecutive && selectedDeliveryExecutive.value.trim()
      ? orderDataList.filter(order => order.delivery_exe_id === selectedDeliveryExecutive.value.trim())
      : orderDataList;
  
    filteredOrders.sort((a, b) => {
      const isAlphaA = /^[a-zA-Z]/.test(a.customer_name);
      const isAlphaB = /^[a-zA-Z]/.test(b.customer_name);
  
      if (isAlphaA && !isAlphaB) return -1; 
      if (!isAlphaA && isAlphaB) return 1; 
      // Sort alphabetically otherwise
      const nameA = a.customer_name?.toLowerCase() || "";
      const nameB = b.customer_name?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });
  
    let yOffset = 10;
    
    // Delivery Executive Data logic
    const dEData = selectedDeliveryExecutive && selectedDeliveryExecutive.value.trim()
      ? [{ label: selectedDeliveryExecutive.label, value: selectedDeliveryExecutive.value }]
      : deliveryExecutiveNames;
    
    dEData.forEach(dE => {
      const filteredOrdersForDE = filteredOrders.filter(order => order.delivery_exe_id === dE.value);
      
      // Calculate total quantity for the Delivery Executive
      const totalQuantityForDE = filteredOrdersForDE.reduce((acc, order) => acc + Number(order.quantity || 0), 0);
  
      const rows_dE = [
        [dE.label || 'No Data', moment(fromDate.toISOString()).format("DD-MM-YYYY"),
        totalQuantityForDE || '0']
      ];
  
      const orderRows = createOrderRows(filteredOrdersForDE);
      const productRows = createProductRows(filteredOrdersForDE);
  
      const addTableWithPageBreaks = (tableConfig) => {
        doc.autoTable({
          ...tableConfig,
          startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : tableConfig.startY,
          styles: { 
            overflow: 'linebreak', 
            cellPadding: 3,
            fontSize: 10,
            lineColor: borderColor,
            lineWidth: 0.5
          },
          columnStyles: tableConfig.columnStyles || {},
          headStyles: { fillColor: headerColor }, 
          alternateRowStyles: { fillColor: alternateRowColor }, 
        });
      };
  
      // For Delivery Executive Table
      addTableWithPageBreaks({
        startY: yOffset,
        head: dEdetails_header,
        body: rows_dE.length ? rows_dE : [['No Data', 'No Data', '0']],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: col_width_DE[0] },
          1: { cellWidth: col_width_DE[1] },
          2: { cellWidth: col_width_DE[2] },
        },
      });
  
      yOffset = doc.previousAutoTable.finalY + 10;
  
      // For Product Table
      addTableWithPageBreaks({
        startY: yOffset,
        head: product_header,
        body: productRows.length ? productRows : [['No Data', '', '']],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: col_width_product[0] },
          1: { cellWidth: col_width_product[1] },
          2: { cellWidth: col_width_product[2] },
        },
      });
  
      yOffset = doc.previousAutoTable.finalY + 10;
  
      // For Order Table
      addTableWithPageBreaks({
        startY: yOffset,
        head: headers,
        body: orderRows.length ? orderRows : [['No Data', 'No Data', 'No Data', '0', '0', '0', 'No Data']],
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: columnWidths[0] },
          1: { cellWidth: columnWidths[1] },
          2: { cellWidth: columnWidths[2] },
          3: { cellWidth: columnWidths[3] },
          4: { cellWidth: columnWidths[4] },
          5: { cellWidth: columnWidths[5] },
          6: { cellWidth: columnWidths[6] },
          7: { cellWidth: columnWidths[7] },
        },
      });
  
      yOffset = doc.previousAutoTable.finalY + 10;
    });
  
    // Save PDF
    doc.save(fullFilename);
  };
  
  
  const handleFromDateChange = (date) => {
    setShow(false);
    setFromDate(date);
  };

  const validateParams = () => {

    let errMsg = "";
    if (!fromDate) {
      errMsg = "Please enter the Date";
      return errMsg;
    } else if (!selectedHub) {
      errMsg = "Please enter the Hub Name";
      return errMsg;
    } else if (!selectedDeliveryExecutive) {
      errMsg = "Please enter the Delivery Executive";
      return errMsg;
    }
  };

const handleSearch = async () => {
  setLoading(true);

  if (!selectedHub) {
    const Toast = Swal.mixin({
      toast: true,
      background: "#69aba6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    setLoading(false);
    Toast.fire({
      icon: "warning",
      title: "Please select Hub Name",
    });
    return;
  }

  try {
    const response = await fetchOrderSheet({
      date: moment(fromDate).format("YYYY-MM-DD"),
      hubName: selectedHub.value,
      deliveryExeId: selectedDeliveryExecutive?.value?.trim(),
    });

    const ordersList = response.orders || [];
    setOrderDataList(ordersList);
    setCustomerDetails(ordersList);

    const walletMap = new Map(Object.entries(response.walletMap || {}));
    setCustomerWalletMap(walletMap);

    const productsMap = {};
    ordersList.forEach((data) => {
      const productName = data.product_name;
      const packaging = data.package_unit;
      const unitPrice = data.price;
      const quantity = data.quantity;

      if (!productsMap[productName]) {
        productsMap[productName] = {
          productName: productName,
          packaging: packaging,
          unitPrice: unitPrice,
          totalQuantity: 0,
        };
      }

      productsMap[productName].totalQuantity += quantity;
    });

    const productListArr = Object.values(productsMap);
    setProductList(productListArr);

    setDataLoaded(true);
  } catch (error) {
    console.error("Error fetching orders:", error);
  } finally {
    setLoading(false);
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

  // Determine the range of page numbers to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  //const currentItems = OnboardedCustomer.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageButtons = () => {

    const pageButtons = [];
    // Determine the range of page numbers to display
    let startPage = Math.max(1, currentPage - 5);
    let endPage = Math.min(totalPages, startPage + 9);

    // If the total number of pages is less than 10, adjust the endPage
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
            <div className="panel" style={{ marginTop: "10px", marginBottom: "10px" }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>ORDER SHEET</span>
                <div>
                  {dataLoaded &&
                    <button className="btn btn-success btn-rounded btn-sm" onClick={generatePDF}>Generate PDF</button>
                  }
                </div>
              </div>
            </div>

            <div className="panel datepickers-container">
              <div className="datepicker-container" style={{ marginTop: "10px" }}>
                <label className="datepicker-label">Date:</label>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  dateFormat="dd/MM/yyyy" // Format for displaying the date
                  className="datepicker-input"
                  placeholderText="Select date"
                />
              </div>
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
                <Button variant="outline-success" onClick={handleSearch} size='sm' disabled={disabledSearch}>
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
            <br />
            <div class="home-tab" style={{ marginLeft: "10px" }}>
              <div class="d-sm-flex align-items-center justify-content-between border-bottom">
                <ul class="nav nav-tabs" role="tablist">
                  <li class="nav-item" style={{color:'#83bf91'}}>
                    <a
                      class="nav-link active ps-0"
                      id="home-tab"
                      data-bs-toggle="tab"
                      href="#overview"
                      role="tab"
                      aria-controls="overview"
                      aria-selected="true"
                      style={{color:'#83bf91'}}
                    >
                      Customer List Report
                    </a>
                  </li>
                  <li class="nav-item" style={{color:'#83bf91'}}>
                    <a
                      class="nav-link"
                      id="profile-tab"
                      data-bs-toggle="tab"
                      href="#audiences"
                      role="tab"
                      aria-selected="false"
                      style={{color:'#83bf91'}}
                    >
                      Product List Report
                    </a>
                  </li>
                  <input
                    style={{
                      border: "1px solid grey",
                      padding: "0px 4px 0px 1rem;",
                      borderRadius: "1rem",
                      marginTop: "3px",
                      marginLeft: "7px",
                      marginBottom: "1rem",
                      paddingLeft: "1rem",
                      height: "32px",
                      paddingBottom: "0px",
                    }}
                    type="text"
                    placeholder="Search here"


                  />
                </ul>
              </div>
              <div class="tab-content tab-content-basic">
                <div
                  class="tab-pane fade show active"
                  id="overview"
                  role="tabpanel"
                  aria-labelledby="home-tab"
                >
                  {dataLoaded &&
                    <div class="col-md-12 grid-margin grid-margin-md-0 stretch-card">
                      <div class="card">
                        <div class="card-body">
                          <h4 class="card-title">Delivery Date : {moment(fromDate).format("DD-MM-YYYY")}</h4>
                          <div class="">
                            <div class="tab-pane" role="tabpanel" aria-labelledby="contact-tab">
                              {customerDetails.map((customer,index) => (
                                <div className="card mb-2" key={index}>

                                  <div className="card-body">
                                    <div class="row">
                                      <div class="col-lg-2">
                                        <address>
                                          <p class="fw-bold"> Customer Name: </p>
                                          <p>  {customer.customer_name}
                                          </p>
                                        </address>


                                      </div>
                                      <div class="col-lg-2">
                                        <address>
                                          <p class="fw-bold"> Customer Phone :</p>
                                          <p>
                                            {customer.customer_phone}
                                          </p>
                                        </address>


                                      </div>
                                      <div class="col-lg-2">
                                        <address>
                                          <p class="fw-bold"> Customer Address: </p>
                                          <p>
                                            {customer.delivering_to}
                                          </p>
                                        </address>



                                      </div>
                                      <div class="col-lg-2">
                                        <address>
                                          <p class="fw-bold"> Wallet Balance: </p>
                                          <p>
                                            {customerWalletMap.get(customer.customer_id)}
                                          </p>
                                        </address>


                                      </div>
                                      <div class="col-lg-2">
                                        {/* <address>
                                          <p class="fw-bold"> Delivery Preference </p>
                                          <p>
                                            {customer.delivery_mode}
                                          </p>
                                        </address> */}
                                      </div>
                                      <div class="col-lg-2">
                                        {/* <address>
                                          <p class="fw-bold"> Order ID </p>
                                          <p>
                                            {groupedRecords[customerId][0].order_id}
                                          </p>
                                        </address> */}
                                      </div>
                                    </div>
                                    <br />
                                    <div class="" style={{ display: "flex", justifyContent: "space-between" }}>
                                      <div style={{ backgroundColor: "", display: "flex" }}>
                                      </div>
                                      <div>
                                      </div>
                                    </div>

                                  </div>
                                  <div className="table-responsive">
                                    <table className="table">
                                      <thead>
                                        <tr>
                                          <th className="pt-1">Product Name</th>
                                          <th className="pt-1">Packaging</th>
                                          <th className="pt-1">Quantity</th>
                                          <th className="pt-1">Unit Price</th>
                                          <th className="pt-1">Total Amount</th>
                                          {/* <th className="pt-1">Order Id</th>
                                          <th className="pt-1">customer id</th> */}

                                        </tr>
                                      </thead>
                                      <tbody>
                                      
                                        {(orderDataList.filter(orders => orders.customer_id == customer.customer_id)).map((filteredOrders , index) => (
                                          //{orderListData.filter(order => order.data.order_id === uniqueOrder.data.order_id).map
                                          //(record => (
                                          <tr key={index}>

                                            <td>{filteredOrders.product_name}</td>
                                            <td>{filteredOrders.package_unit}</td>
                                            <td>{filteredOrders.quantity}</td>
                                            <td>{filteredOrders.price}</td>
                                            <td>{filteredOrders.total_amount}</td>
                                            {/* <td>{filteredOrders.order_id}</td>
                                            <td>{filteredOrders.customer_id}</td> */}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                  <div class="media">
                    <div class="card-body">
                      <div className="grid-container" id="dataPanel">

                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="tab-pane fade"
                  id="audiences"
                  role="tabpanel"
                  aria-labelledby="profile-tab"
                >
                  <div class="media">
                    <div class="card-body">
                      {productList && <div class="table-responsive">
                        <table class="table table-striped" id="productTable">
                          <thead>
                            <tr>
                              <th>Sr No.</th>
                              <th>Product Name</th>
                              <th>packaging</th>
                              <th>Product Price</th>
                              <th>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>

                            {productList.map((product, index) => {
                              return (
                                <tr>
                                  <td>{index + 1}</td>
                                  <td>{product.productName}</td>
                                  <td>{product.packaging}</td>
                                  <td>{product.unitPrice}</td>
                                  <td>{product.totalQuantity}</td>
                                </tr>
                              )

                            })

                            }
                          </tbody>
                        </table>
                      </div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Alert show={show} variant="success">
        <Alert.Heading>No data found for selected criteria</Alert.Heading>
        <div className="d-flex justify-content-end">
          <Button onClick={() => setShow(false)} variant="outline-success">
            Close
          </Button>
        </div>
      </Alert>

    </>
  );
}

export default OrderSheet;
