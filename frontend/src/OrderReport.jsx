import React, { useState, useEffect,useContext } from "react";
import { Button } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import Moment from "moment";
import { extendMoment } from "moment-range";
import Select from "react-select";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import apiClient from "./services/apiClient";
import {
    fetchOrderReport,
    listCollection,
    queryCollection,
} from "./services/orderOperationsService";
import ExportTableToExcel from "./ExportTableToExcel";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";

const orderReportStyles = `
  .wrap-text {
    word-wrap: break-word !important;
    white-space: normal !important;
  }
  .customer-name-phone {
    max-width: 150px;
  }
  .customer-address {
    max-width: 200px;
  }
`;

function OrderReport() {
    const { permissible_roles } = useContext(GlobalContext);
    const navigate = useNavigate();

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
    const [deliveryDate, setDeliveryDate] = useState(new Date());
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [orderReports, setOrderReports] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages] = useState(0);
    const [selectedHub, setSelectedHub] = useState(null);
    const [deliveryExecutiveNames, setDeliveryExecutiveNames] = useState([]);
    const [hubNames, setHubNames] = useState([]);
    const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState();
    const [selectedOrderStatus, setSelectedOrderStatus] = useState();
    const [selectedOrderType, setSelectedOrderType] = useState();
    const [orderDataList, setOrderDataList] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [deliveryExecutivesMap, setDeliveryExecutivesMap] = useState(new Map());
    const [deliveredOrderCount, setDeliveredOrderCount] = useState(0);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [cancelledrderCount, setCancelledOrderCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCountList , setShowCountList] = useState(true);

    const orderStatusOptions = [
        { label: "New", value: "0" },
        { label: "Cancelled", value: "2" },
        { label: "Delivered", value: "1" },
    ];

    const orderTypeOptions = [
        { label: "Sub", value: "Sub" },
        { label: "OT", value: "OT" },
        { label: "Re-Order", value: "Re-Order" },
    ];

    const getDeliveryExecutive = async () => {
        const response = await queryCollection("hubs_users_data", {
            filters: [{ field: "role", op: "==", value: "Delivery Executive" }],
        });
        const deData = response.data || [];
        const newMap = new Map();
        deData.forEach((data) => {
            const value = `${data.first_name || ""} ${data.last_name || ""}`.trim();
            newMap.set(data.hub_user_id, value);
        });
        setDeliveryExecutivesMap(newMap);
    };
    useEffect(() => {

        getDeliveryExecutive();

    }, []);

    const handleSearch = async () => {
        setDataLoaded(false);
        setShowSpinner(true);
    
        try {
            const response = await fetchOrderReport({
                deliveryDate: moment(deliveryDate).format("YYYY-MM-DD"),
                hubName: selectedHub?.value,
                deliveryExeId: selectedDeliveryExecutive?.value,
                status: selectedOrderStatus?.value,
                orderType: selectedOrderType?.value,
            });

            const uniqueOrdersArray = response.orders || [];
            setOrderDataList(uniqueOrdersArray);
            setFilteredOrders(uniqueOrdersArray);
            setDeliveredOrderCount(response.counts?.delivered || 0);
            setPendingOrdersCount(response.counts?.pending || 0);
            setCancelledOrderCount(response.counts?.cancelled || 0);
            setShowCountList(true);
            setDataLoaded(true);
            setShowSpinner(false);
        } catch (error) {
            console.error("Error fetching documents: ", error);
            setDataLoaded(false);
            setShowSpinner(false);
        }
    };
    
    const handleReset = () => {
        setDeliveryDate(null);
        setSelectedHub("");
        setSelectedDeliveryExecutive("");
        setOrderReports([]);

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
    const exportTableToPDF = () => {
        const doc = new jsPDF();
        const fileName = "order_report";
    
        // Add title
        doc.text("Order Report", 10, 10);
    
        // Define table columns
        const tableColumn = ["SR No", "Order Id", "Hub", "Delivery Executive", "Customer Name" ,"Customer Phone", "Customer Address", "Order Status", "Order Type", "Order Amount", "Delivery Date", "Delivery Time", "Cancel Time", "Cancel Order Reason"];
        
        // Sort orders by customer name, then by delivery date
        const sortedOrders = filteredOrders.sort((a, b) => {
            if (a.customer_name === b.customer_name) {
                return new Date(a.delivery_date) - new Date(b.delivery_date);
            }
            return a.customer_name.localeCompare(b.customer_name);
        });
    
        // Prepare table rows
        const tableRows = sortedOrders.map((delivery, index) => {
            return [
                index + 1,
                delivery.order_id,
                delivery.hub_name,
                `${deliveryExecutivesMap.get(delivery.delivery_exe_id)}`,
                `${delivery.customer_name}`,
                `${delivery.customer_phone}`,
                `${delivery.delivering_to}`,
                `${delivery.status === "0" ? 'New' : delivery.status === "1" ? 'Delivered' : 'Cancelled'}`,
                `${delivery.order_type}`,
                `${parseInt(delivery.price * delivery.quantity)}`,
                `${moment(delivery.delivery_date).format("DD-MM-YYYY")}`,
                `${delivery.delivery_time ? moment(delivery.delivery_time, 'HH:mm:ss').format('hh:mm A') : ''}`,
                `${delivery.cancel_time ? moment(delivery.cancel_time, 'HH:mm:ss').format('hh:mm A') : ''}`,
                `${delivery.cancel_reason || ''}`
            ];
        });
    
        // Generate the table in the PDF
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: {
                fontSize: 6,
                cellPadding: 1,
            },
        });
    
        // Save the PDF
        doc.save(`${fileName || 'report'}.pdf`);
    };
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

    const handleOrderStatusChange = async (selectedOption) => {
        setSelectedOrderStatus(selectedOption);
    }

    const handleOrderTypeChange = async (selectedOption) => {
        setSelectedOrderType(selectedOption);
    }

    useEffect(() => {
        const filtered = filteredOrders.filter(order =>
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOrders(filtered);
    }, [searchTerm]);

    const changeQuantityOrders = async () => {
        setShowSpinner(true);
        setDataLoaded(false);
        const response = await apiClient.post("/api/orders/history/query", {
            filters: [{ field: "delivery_date", op: "==", value: moment(deliveryDate).format("YYYY-MM-DD") }],
        });
        const orderList = (response.data?.data || []).filter(
            (order) => "quantity_backup" in order && order.quantity !== order.quantity_backup
        );
        setFilteredOrders(orderList);
        setDataLoaded(true);
        setShowCountList(false);
        setShowSpinner(false);
    }

    return (
        <>
            <style>{orderReportStyles}</style>
            {showSpinner && ( // Render loader when loading state is true
                <div className="loader-overlay">
                    <div className="">
                        <img src="images/loader.gif" alt="Loading..." style={{ height: "6rem" }} />
                    </div>
                </div>
            )}
            <div class="container-scroller">
                <div class="container-fluid">
                    <div class="main-panel" style={{ width: '100%' }}>
                        <div className="panel" style={{ marginTop: "10px", marginBottom: "10px" }}>
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>ORDER REPORT</span>
                                <div className="d-flex">
                                    {dataLoaded &&
                                        <ExportTableToExcel
                                            tableId="order_report_table"
                                            fileName="order_report"
                                        />
                                    }
                                     {dataLoaded && (
                                        <button className='btn btn-success btn-rounded btn-sm mx-2' onClick={exportTableToPDF}style={{ marginLeft: '-15%' }} >Export PDF</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ marginTop: '2rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Search by Customer Name"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div style={{ marginTop: "7px" }}>
                                    <label style={{ marginBottom: '5px' }}>Delivery Date</label>
                                    <br />
                                    <DatePicker
                                        selected={deliveryDate}
                                        onChange={(date) => setDeliveryDate(date)}
                                        dateFormat="dd/MM/yyyy" // Format for displaying the date
                                        className="datepicker-input"
                                        placeholderText="Date"
                                    />
                                </div>

                                <div>
                                    <label style={{ marginBottom: '10px' }}>Hubs</label>
                                    <Select
                                        options={hubNames}
                                        onChange={handleHubChange}
                                        value={selectedHub}
                                        placeholder="Hub Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ marginBottom: '10px' }}>Delivery Executive</label>
                                    <Select
                                        options={deliveryExecutiveNames}
                                        onChange={handleDEchange}
                                        value={selectedDeliveryExecutive}
                                        placeholder="Delivery Executive"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ marginBottom: '10px' }}>Order Status</label>
                                    <Select
                                        options={orderStatusOptions}
                                        onChange={handleOrderStatusChange}
                                        value={selectedOrderStatus}
                                        placeholder="Order Status"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ marginBottom: '10px' }}>Order Type</label>
                                    <Select
                                        options={orderTypeOptions}
                                        onChange={handleOrderTypeChange}
                                        value={selectedOrderType}
                                        placeholder="Order Type"
                                        required
                                    />
                                </div>

                                <div style={{ marginTop: '25px' }}>
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
                            <Button variant="outline-info" onClick={changeQuantityOrders} size='sm'>
                                        Change Quantity Order
                                    </Button>
                                    <br/>
                        </div>
                        {dataLoaded && showCountList && <div className="position-relative end-0 p-3">
                            <div className="row">
                                <div className="col-lg-3 col-md-6">
                                    <div class="badge badge-pill badge-outline-info" style={{ display: 'flex', flexDirection: 'column', marginLeft: "1rem", fontSize: '17px', fontWeight: '500' }}>
                                        <span>Total Orders</span>
                                        <span>{orderDataList.length}</span>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div class="badge badge-pill badge-outline-success" style={{ display: 'flex', flexDirection: 'column', marginLeft: "1rem", fontSize: '17px', fontWeight: '500' }}>
                                        <span>Delivered Orders</span>
                                        <span>{deliveredOrderCount}</span>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div class="badge badge-pill badge-outline-danger" style={{ display: 'flex', flexDirection: 'column', marginLeft: "1rem", fontSize: '17px', fontWeight: '500' }}>
                                        <span>Cancelled Orders</span>
                                        <span>{cancelledrderCount}</span>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <div class="badge badge-pill badge-outline-info" style={{ display: 'flex', flexDirection: 'column', marginLeft: "1rem", fontSize: '17px', fontWeight: '500' }}>
                                        <span>Pending Orders</span>
                                        <span style={{ marginTop: '5px' }}>{pendingOrdersCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>}

                        <div class="table-responsive">
                            {showCountList ? 
                            <table class="table table-striped" id="order_report_table">
                            <thead>
                                <tr>
                                    <th>Order Id</th>
                                    <th>Hub</th>
                                    <th>Delivery Executive</th>
                                    <th >Customer Name</th>
                                    <th>Customer Phone</th>
                                    <th>Customer Address</th>
                                    <th>Order Status</th>
                                    <th>Order Type</th>
                                    <th>Order Amount</th>
                                    <th>Delivery Date</th>
                                    <th>Delivery Time</th>
                                    <th>Cancel Time</th>
                                    <th>Cancel Order Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataLoaded && filteredOrders.map((order, index) => (
                                    <tr key={index}>
                                        <td>{order.order_id}</td>
                                        <td>{order.hub_name}</td>
                                        <td>{deliveryExecutivesMap.get(order.delivery_exe_id)}</td>
                                        <td className="wrap-text customer-name-phone">{order.customer_name}</td>
                                        <td className="wrap-text customer-name-phone">{order.customer_phone}</td>
                                        <td className="wrap-text customer-name-phone" style={{ maxWidth: '400px' }}>{order.delivering_to}</td>
                                        <td>
                                            {order.status === "0" ? <div class="badge badge-pill badge-outline-info" style={{ marginRight: "1rem" }}>New</div> : <></>}
                                            {order.status === "1" ? <div class="badge badge-pill badge-outline-success" style={{ marginRight: "1rem" }}>Delivered</div> : <></>}
                                            {order.status === "2" ? <div class="badge badge-pill badge-outline-danger" style={{ marginRight: "1rem" }}>Cancelled</div> : <></>}
                                        </td>
                                        <td>{order.order_type}</td>
                                        <td>{parseInt(order.price * order.quantity)}</td>
                                        <td>{moment(order.delivery_date).format("DD-MM-YYYY")}</td>
                                        <td>{order.delivery_time ? moment(order.delivery_time, 'HH:mm:ss').format('hh:mm A') : ''}</td>
                                        <td>{order.cancel_time ? moment(order.cancel_time, 'HH:mm:ss').format('hh:mm A') : ''}</td>
                                        <td>{order.cancel_reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                            :
                            <table class="table table-striped" id="order_report_table">
                                <thead>
                                    <tr>
                                        <th>Order Id</th>
                                        <th>Hub</th>
                                        <th>Delivery Executive</th>
                                        <th >Customer Name & Phone</th>
                                        <th>Customer Address</th>
                                        <th>Order Status</th>
                                        <th>Original Quantity</th>
                                        <th>Changed Quantity</th>
                                        <th>Delivery Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataLoaded && filteredOrders.map((order, index) => (
                                        <tr key={index} style={{
                                            backgroundColor:
                                                (order.order_type === "Sub" && "#f7ffbd") ||
                                                (order.order_type === "OT" && "#d4ffda") ||
                                                (order.order_type === "Re-Order" && "#ffd4d4"),
                                        }}>
                                            <td>{order.order_id}</td>
                                            <td>{order.hub_name}</td>
                                            <td>{deliveryExecutivesMap.get(order.delivery_exe_id)}</td>
                                            <td className="wrap-text customer-name-phone">{`${order.customer_name} / ${order.customer_phone}`}</td>
                                            <td className="wrap-text customer-name-phone" style={{ maxWidth: '400px' }}>{order.delivering_to}</td>
                                            <td>
                                                {order.status === "0" ? <div class="badge badge-pill badge-outline-info" style={{ marginRight: "1rem" }}>New</div> : <></>}
                                                {order.status === "1" ? <div class="badge badge-pill badge-outline-success" style={{ marginRight: "1rem" }}>Delivered</div> : <></>}
                                                {order.status === "2" ? <div class="badge badge-pill badge-outline-danger" style={{ marginRight: "1rem" }}>Cancelled</div> : <></>}
                                            </td>
                                            <td>{order.quantity_backup}</td>
                                            <td>{order.quantity}</td>
                                            <td>{moment(order.delivery_date).format("DD-MM-YYYY")}</td>
                                            {/* <td>{order.delivery_time ? moment(order.delivery_time, 'HH:mm:ss').format('hh:mm A') : ''}</td>
                                            <td>{order.cancel_time ? moment(order.cancel_time, 'HH:mm:ss').format('hh:mm A') : ''}</td>
                                            <td>{order.cancel_reason}</td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            }
                            
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default OrderReport;
