import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { useNavigate, Link, useParams } from 'react-router-dom';
import Select from "react-select";
import 'jspdf-autotable';
import ExportTableToExcel from "./ExportTableToExcel";
import {
    fetchOnetimeReport,
    listCollection,
    queryCollection,
} from "./services/orderOperationsService";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
function OneTimeOrders() {
    const { permissible_roles } = useContext(GlobalContext);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        } else {
            if (permissible_roles.length > 0) {
                if (!permissible_roles.includes('one_time_orders')) {
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate, permissible_roles]);
    const moment = extendMoment(Moment);
    const [deliveryDate, setDeliveryDate] = useState(new Date());
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [orderReports, setOrderReports] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [show, setShow] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);
    const [deliveryExecutiveNames, setDeliveryExecutiveNames] = useState([]);
    const [hubNames, setHubNames] = useState([]);
    const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState();
    const [selectedOrderStatus, setSelectedOrderStatus] = useState();

    const [deliveryExecutivesMap, setDeliveryExecutivesMap] = useState(new Map());
    const orderStatusOptions = [
        { label: "New", value: "0" },
        { label: "Cancelled", value: "2" },
        { label: "Delivered", value: "1" },
    ];
    // const firstDeliveryOptions = [
    //     { label: "One Time Order", value: "One Time Order" }
    // ];
    const [selectedFirstDelivery, setSelectedFirstDelivery] = useState('');

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

        const formattedDate = moment(deliveryDate).format("YYYY-MM-DD");
        try {
            const response = await fetchOnetimeReport({
                date: formattedDate,
                hubName: selectedHub?.value,
                deliveryExeId: selectedDeliveryExecutive?.value,
                status: selectedOrderStatus?.value,
                firstTime: selectedFirstDelivery?.value === "First Time Order",
            });

            const orders = response.orders || [];
            setOrderReports(orders);
            setFilteredOrders(orders);
            setDataLoaded(true);
            setShowSpinner(false);
        } catch (error) {
            console.error("Error fetching documents: ", error);
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


    return (
        <>
            {showSpinner && ( // Render loader when loading state is true
                <div className="loader-overlay">
                    <div className="">
                        <img style={{
                            height: "6rem"
                        }} src="images/loader.gif" alt="loader"></img>
                    </div>
                </div>
            )}
            <div class="container-scroller">
                <div class="container-fluid">
                    <div class="main-panel" style={{ width: '100%' }}>
                        <div className="panel" style={{ marginTop: "10px", marginBottom: "10px" }}>
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>One Time Deliveries</span>
                                <div>
                                    {dataLoaded &&
                                        // <button className="btn btn-success btn-rounded btn-sm">Export</button>
                                        <ExportTableToExcel
                                            tableId="one_time_orders_table"
                                            fileName="one_time_orders"
                                        />
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
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
                                    <label style={{ marginBottom: '10px' }}>Delivery Type</label>
                                    <Select
                                        options={[
                                            { value: 'One Time Order', label: 'One Time Order' },
                                            { value: 'First Time Order', label: 'First Time Order' },
                                        ]}
                                        onChange={setSelectedFirstDelivery}
                                        value={selectedFirstDelivery}
                                        placeholder="Select Order Type"
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
                        </div>


                        <div className="table-responsive">
                            <table className="table table-striped" id="one_time_orders_table">
                                <thead>
                                    <tr>
                                        <th>Order Id</th>
                                        <th>Product Name</th>
                                        <th>Hub</th>
                                        <th>Delivery Executive</th>
                                        <th>Customer Name</th>
                                        <th>Customer Phone</th>
                                        <th>Customer Address</th>
                                        <th>Order Status</th>
                                        <th>Order Amount</th>
                                        <th>Delivery Date</th>
                                        <th>Delivery Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataLoaded && orderReports.map((order, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                backgroundColor: order.isFirstTimeOrder ? 'lightgreen' : 'white'
                                            }}

                                            onClick={() => window.open(`/profile/${order.customer_id}`, "_blank")}
                                        >
                                            <td>{order.order_id}</td>
                                            <td className="wrap-text customer-name-phone">{order.product_name}</td>
                                            <td>{order.hub_name}</td>
                                            <td>{deliveryExecutivesMap.get(order.delivery_exe_id)}</td>
                                            <td className="wrap-text customer-name-phone">{order.customer_name}</td>
                                            <td className="wrap-text customer-name-phone">{order.customer_phone}</td>
                                            <td className="wrap-text customer-name-phone" style={{ maxWidth: '400px' }}>{order.location}</td>
                                            <td>
                                                {order.status === "0" && <div className="badge badge-pill badge-outline-info" style={{ marginRight: "1rem" }}>New</div>}
                                                {order.status === "1" && <div className="badge badge-pill badge-outline-success" style={{ marginRight: "1rem" }}>Delivered</div>}
                                                {order.status === "2" && <div className="badge badge-pill badge-outline-danger" style={{ marginRight: "1rem" }}>Cancelled</div>}
                                            </td>
                                            <td>{parseInt(order.total_amount)}</td>
                                            <td>{moment(order.delivery_date).format("DD-MM-YYYY")}</td>
                                            <td>{moment(order.delivery_time, 'HH:mm:ss').format('hh:mm A')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

export default OneTimeOrders;
