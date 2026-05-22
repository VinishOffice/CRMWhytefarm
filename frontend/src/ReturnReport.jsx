import React, { useState, useEffect,useContext } from "react";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import TopPanel from "./TopPanel";
import DatePicker from 'react-datepicker';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Select from 'react-select';
import { Button, Card, Row, Col, Form, Alert } from 'react-bootstrap';
import { handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import { fetchReportOptions, fetchReturnReport } from "./services/reportsOperationsService";

function ReturnReport() {
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();

    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('return_report')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);
    const [data, setData] = useState([]);
    const [cashCollectionTotals, setCashCollectionTotals] = useState({});
    const [hubNames, setHubNames] = useState([]);
    const [selectedHubName, setSelectedHubName] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);



    const moment = require('moment');
    const handleSearch = async () => {

        const dateObj = new Date(startDate);
        const formattedDate = dateObj.toISOString().split('T')[0];
        const resp = await fetchReturnReport({
            date: startDate?.toISOString(),
            hubName: selectedHubName?.value,
        });

        setData(resp.data || []);
        setCashCollectionTotals(resp.cashTotals || {});
        setTotalAmount(resp.totalAmount || 0);
    }

    useEffect(() => {
        fetchReportOptions()
            .then((resp) => {
                setHubNames((resp.hubs || []).map((h) => ({ label: h, value: h })));
            })
            .catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        // const orderHistoryCollection = collection('order_history').where('delivery_date', '==', "2024-05-02").where('delivered_by', '==', selectedHubName.value);

        // orderHistoryCollection.get().then((querySnapshot) => {
        //     let uniqueDeliveryExecutives = [];

        //     querySnapshot.forEach((doc) => {
        //         const order = doc.data();
        //         const deliveryExecutive = order.delivery_executive;

        //         if (!uniqueDeliveryExecutives.includes(deliveryExecutive)) {
        //             uniqueDeliveryExecutives.push(deliveryExecutive);
        //         }
        //     });

        //     const reportData = uniqueDeliveryExecutives.map((deliveryExecutive) => {
        //         let executiveReport = {
        //             delivery_executive: deliveryExecutive,
        //             phone_no: '',
        //             hub_name: [],
        //             products: [],
        //             quantity: [],
        //             delivered: [],
        //             remaining: []
        //         };

        //         const ordersForExecutive = querySnapshot.docs.filter((doc) => doc.data().delivery_executive === deliveryExecutive);

        //         ordersForExecutive.forEach((doc) => {
        //             const order = doc.data();
        //             const hubName = order.delivered_by;
        //             const productName = order.product_name;
        //             const quantity = order.quantity;
        //             const delivered = order.status;

        //             if (!executiveReport.hub_name.includes(hubName)) {
        //                 executiveReport.hub_name.push(hubName);
        //             }

        //             if (!executiveReport.products.includes(productName)) {
        //                 executiveReport.products.push(productName);
        //                 executiveReport.quantity.push(0);
        //                 executiveReport.delivered.push(0);
        //                 executiveReport.remaining.push(0);
        //             }

        //             const productIndex = executiveReport.products.indexOf(productName);

        //             executiveReport.quantity[productIndex] += quantity;
        //             if (delivered === 1) {
        //                 executiveReport.delivered[productIndex] += quantity;
        //             } else {
        //                 executiveReport.remaining[productIndex] += quantity;
        //             }
        //         });

        //         const firstOrder = ordersForExecutive[0].data();
        //         executiveReport.phone_no = firstOrder.delivery_phone;

        //         return executiveReport;
        //     });

        //     setData(reportData);
        //     fetchCashCollection();
        // });
    }, []);

    // cash collection totals are returned by backend report endpoint


    const getTotalAmountForPhone = (phoneNo) => {
        return cashCollectionTotals[phoneNo] || 0;
    };

    const handleDateChange = (date) => {
        const updatedDate = new Date(date);
        updatedDate.setHours(5);
        updatedDate.setMinutes(30);
        setStartDate(updatedDate);
    };


    // import React, { useState, useEffect } from "react";
    // import Footer from "./Footer";
    // import Sidebar from "./Sidebar";
    // import TopPanel from "./TopPanel";
    // import DatePicker from 'react-datepicker';
    // import Select from 'react-select';
    // import { Button } from 'react-bootstrap';

    // function ReturnReport() {
    //     const [data, setData] = useState([]);
    //     const [cashCollectionTotals, setCashCollectionTotals] = useState({});
    //     const [hubNames, setHubNames] = useState([]);
    //     const [selectedHubName, setSelectedHubName] = useState('');
    //     const [startDate, setStartDate] = useState(null);

    //     useEffect(() => {
    //         collection("hubs_data").onSnapshot((snapshot) => {
    //             setHubNames(
    //                 snapshot.docs.map((doc) => ({ label: doc.data().hub_name, value: doc.data().hub_name }))
    //             );
    //         });
    //     }, []);

    //     const handleSearch = async () => {
    //         const orderHistoryCollection = collection('order_history');
    //         let query = orderHistoryCollection;

    //         if (startDate) {
    //             const timestampString = "2024-05-01T18:30:00.000Z";
    //             const dateObj = new Date(timestampString);
    //             const startDateObj = dateObj.toISOString().split('T')[0];



    //             // Construct the query for the date range
    //             query = query.where('delivery_date', '>=', startDateObj);
    //         }


    //         if (selectedHubName) {
    //             query = query.where('delivered_by', '==', selectedHubName.value);
    //         }

    //         const querySnapshot = await query.get();

    //         // Process the querySnapshot to generate the report data and cash collection totals
    //         let reportData = [];
    //         let cashTotals = {};

    //         querySnapshot.forEach((doc) => {
    //             const order = doc.data();
    //             const deliveryExecutive = order.delivery_executive;

    //             // Process order data and update reportData

    //             // Calculate cash collection totals
    //             const phoneNo = order.delivery_executive_phone;
    //             const amount = order.amount;

    //             if (!cashTotals[phoneNo]) {
    //                 cashTotals[phoneNo] = 0;
    //             }

    //             cashTotals[phoneNo] += amount;
    //         });

    //         setData(reportData);
    //         setCashCollectionTotals(cashTotals);
    //     };

    //     const getTotalAmountForPhone = (phoneNo) => {
    //         return cashCollectionTotals[phoneNo] || 0;
    //     };

    //     const handleDateChange = (date) => {
    //         const updatedDate = new Date(date);
    //         updatedDate.setHours(5);
    //         updatedDate.setMinutes(30);
    //         setStartDate(updatedDate);
    //     };



    return (
        <div className="container-scroller">
            <TopPanel />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel">
                    <div className="content-wrapper">
                        <div className="col-lg-12 grid-margin stretch-card">

                            <div className="card">
                                <div style={{ display: 'flex', flexDirection: 'row', marginLeft: "2rem", marginTop: "1rem", justifyContent: "space-between" }}>

                                    <div style={{ display: 'flex', flexDirection: 'row', marginLeft: "2rem", marginTop: "1rem", alignItems: "start" }}>
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
                                            <label>Hub Name:</label>
                                            <Select
                                                options={hubNames}
                                                onChange={value => setSelectedHubName(value)}
                                                value={selectedHubName}
                                                placeholder="Select Hub Name"
                                            />
                                        </div>
                                        <Button variant="outline-success" style={{ height: "2rem", marginLeft: "3rem", marginTop: "2rem" }}
                                            onClick={handleSearch}
                                            size="sm"
                                        >
                                            Search
                                        </Button>
                                    </div>

                                    <div class="col-md-4 grid-margin" style={{ marginRight: "2rem" }}>
                                        <div class="card d-flex align-items-start">
                                            <div class="card-body" style={{ width: "19rem", marginRight: "2rem" }}>
                                                <div class="d-flex flex-row align-items-start">
                                                    <img src="/images/mbag.png" style={{ height: "60px", width: "70px" }}></img>
                                                    <div class="ms-3">
                                                        <h6 class="text-user" style={{ fontSize: "22px", fontWeight: "800" }}>{totalAmount}</h6>
                                                        <p class="mt-2 text-muted card-text" style={{ fontSize: "18px", }}>Total Cash Collected</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                </div>
                                <div className="card-body">
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <h4 className="card-title">RETURN REPORT</h4>
                                        <p className="card-description"></p>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Delivery Executive</th>
                                                    <th>Phone No</th>
                                                    <th>Hub Name</th>
                                                    <th>Products</th>
                                                    <th>Quantity</th>
                                                    <th>Delivered</th>
                                                    <th>Remaining</th>
                                                    <th>Cash Collected</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(data) && data.map((executiveReport, index) => (
                                                    <tr key={index}>
                                                        <td>{executiveReport.delivery_executive}</td>
                                                        <td>{executiveReport.phone_no}</td>
                                                        <td>{executiveReport.hub_name}</td>
                                                        <td>
                                                            {executiveReport.products.map((product, index) => (
                                                                <p key={index}>{product}</p>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {executiveReport.quantity.map((qty, index) => (
                                                                <p key={index}>{qty}</p>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {executiveReport.delivered.map((deliv, index) => (
                                                                <p key={index}>{deliv}</p>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {executiveReport.remaining.map((rem, index) => (
                                                                <p key={index}>{rem}</p>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            <p>{getTotalAmountForPhone(executiveReport.phone_no)}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
}

export default ReturnReport;

