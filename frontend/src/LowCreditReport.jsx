import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import ExportTableToExcel from "./ExportTableToExcel";
import Moment from "moment";
import { extendMoment } from "moment-range";
import DatePicker from "react-datepicker";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { getUserInfo, handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import 'jspdf-autotable';
import apiClient from "./services/apiClient";
import { fromDate, now, serverTimestamp, fromSecondsNanoseconds, toDate } from './utils/dateUtils';
function LowCreditReport() {
    const { permissible_roles } = useContext(GlobalContext);
    const navigate = useNavigate();
    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        } else {
            if (permissible_roles.length > 0) {
                if (!permissible_roles.includes('low_credit_report')) {
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate, permissible_roles]);

    const { loggedIn, userId, username, loggedIn_user } = getUserInfo();
    const [lowCreditReport, setLowCreditReport] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [initialValue, setInitialvalue] = useState("");
    const [fromDate, setFromDate] = useState('');
    const [totalCreditRequired, setTotalCreditRequired] = useState(0);
    const [totalOrdersAmount, setTotalOrdersAmount] = useState(0);
    const [vacationsData, setVacationsData] = useState([]);
    const [calendarData, setCalendarData] = useState([]);
    const [initalSubsData, setInitialSubsData] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [loadSearch, setLoadSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSearch, setIsSearch] = useState(true);

    function generateCustomerId() {
        const now = new Date();
        const timestamp = now.getTime(); // Get the timestamp in milliseconds since January 1, 1970
        const random4Digits = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0"); // Generate a random 4-digit number

        // Take the last 4 digits of the timestamp and concatenate with the random 4-digit number
        const customerId =
            (timestamp % 10000).toString().padStart(4, "0") + random4Digits;

        return customerId;
    }

    const moment = extendMoment(Moment);

    const fetchCustomersOnVaction = async () => {
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const vacation_date = new Date(tomorrow);
        vacation_date.setHours(0, 0, 0, 0);
        const endDate = new Date(vacation_date);
        endDate.setHours(23, 59, 59, 999);

        const vacations_data = await apiClient.post("/api/customers_vacation/query", {
            filters: [
                { field: "start_date", op: "<=", value: endDate },
                { field: "end_date", op: ">=", value: vacation_date }
            ]
        }).then(res => res.data?.data || []);


        setVacationsData(vacations_data);
        setLoadSearch(false);

    }

    const fetchCustomersWithCalendar = async () => {
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const calendar_data = await apiClient.post("/api/bulk_update_quantity/query", {
            filters: [
                { field: "delivery_date", op: "==", value: moment(tomorrow).format('YYYY-MM-DD') }
            ]
        }).then(res => res.data?.data || []);


        setCalendarData(calendar_data);

    }

    const fetchBulkQty = async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const calendar_data = await apiClient.post("/api/bulk_update_quantity/query", {
            filters: [
                { field: "delivery_date", op: "==", value: moment(tomorrow).format('YYYY-MM-DD') }
            ]
        }).then(res => res.data?.data || []);
        const newMap = new Map();
        calendar_data.forEach(data => {
            const value = data.quantity;
            newMap.set(data.subscription_id, value);
        })
        //setCalendarMap(newMap);
        return newMap;
    }

    const fetchSubscriptions = async () => {
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const initial_sub_data = await apiClient.post("/api/subscriptions_data/query", {
            filters: [
                { field: "next_delivery_date", op: "==", value: moment(tomorrow).format('YYYY-MM-DD') }
            ]
        }).then(res => res.data?.data || []);



        const vacationCustomerIds = new Set(vacationsData.map(vacation => vacation.customer_id));
        const filteredData = initial_sub_data.filter(sub => !vacationCustomerIds.has(sub.customer_id));
        setInitialSubsData(filteredData);

    }
    useEffect(() => {
        setLoadSearch(true);
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFromDate(tomorrow);
        fetchCustomersOnVaction();
        //fetchCustomersWithCalendar();
        //fetchSubscriptions();
    }, []);

    const handleFromDateChange = (date) => {
        setFromDate(date);
    };

    const fetchCashCollectionCount = async (customer_id, date, amount) => {
        const docs = await apiClient.post("/api/cash_collection/query", {
            filters: [
                { field: "customer_id", op: "==", value: customer_id },
                { field: "date", op: "==", value: date },
                { field: "amount", op: "==", value: amount }
            ]
        }).then(res => res.data?.data || []);
        return docs.length;
    };
    const updateCustomerCreditLimits = async () => {
        setUpdating(true);
        Swal.fire({
            title: 'Are you sure you want to assign the credit to all customers?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Update All!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    const today = new Date();
                    for (const customer of lowCreditReport) {
                        const customerId = customer.customer_id;
                        const newCreditLimit = parseInt(customer.requiredBalance); // Ensure it's an integer
                        // Query the customers_data collection
                        const docs = await apiClient.post("/api/customers_data/query", {
                            filters: [{ field: 'customer_id', op: '==', value: customerId }]
                        }).then(res => res.data?.data || []);
                        
                        // Update the credit_limit for each matching document
                        await Promise.all(docs.map(async (data) => {
                            // Update credit_limit in customers_data
                            await apiClient.put(`/api/customers_data/${data._id}`, { credit_limit: newCreditLimit });

                            // Add entry to credit_limit_history
                            await apiClient.post("/api/credit_limit_history", {
                                txn_id: generateCustomerId(),
                                credit_limit: newCreditLimit,
                                customer_phone: data?.customer_phone,
                                customer_id: data?.customer_id,
                                customer_name: data?.customer_name,
                                status: "1",
                                user: "Admin",
                                created_date: new Date(),
                                credit_date: moment(today).format("YYYY-MM-DD"),
                                user_name: loggedIn_user,
                                userId: userId,
                            });

                            // Record activity in customer_activities collection
                            await apiClient.post("/api/customer_activities", {
                                customer_id: customerId,
                                user: loggedIn,
                                description: `Credit limit updated to ${newCreditLimit} by ${loggedIn_user}`, // Fixed template literal
                                created_date: new Date(),
                            });
                        }));
                    }

                    setUpdating(false);

                    handleSearch();
                } catch (error) {
                    console.error("Error updating customer credit limits: ", error);
                }
                setLoading(false);
            } else {
                setUpdating(false);
                setLoading(false);
            }
        });
    };

    const fetchTodayCreditLimitHistory = async () => {
        const today = moment(new Date()).format("YYYY-MM-DD")
        const docs = await apiClient.post("/api/credit_limit_history/query", {
            filters: [{ field: 'credit_date', op: '==', value: today }]
        }).then(res => res.data?.data || []);
        
        docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        const latestHistoryMap = new Map();

        docs.forEach(data => {
            if (!latestHistoryMap.has(data.customer_id)) {
                latestHistoryMap.set(data.customer_id, data);
            }
        });
        const fetchData = docs;



        return fetchData;

        // return Array.from(latestHistoryMap.values());
    };

    const handleCheckout = async () => {
        setIsSearch(false);
        setShowSpinner(true);
        const todayCreditHistory = await fetchTodayCreditLimitHistory();

        if (todayCreditHistory.length > 0) {
            setLowCreditReport(todayCreditHistory);
        } else {
            setInitialvalue("No Data Found");
        }

        setShowSpinner(false);
    };

    const fetchOrderCount = async (customer_id) => {
        const docs = await apiClient.post("/api/order_history/query", {
            filters: [{ field: "customer_id", op: "==", value: customer_id }]
        }).then(res => res.data?.data || []);

        // remove cancelled orders — your data uses cancelled_reason field
        const validOrders = docs.filter(data => {
            return !data.cancelled_reason || data.cancelled_reason === "Cancelled";
        });

        return validOrders.length;
    };


    const handleSearch = async () => {
        setIsSearch(true)
        setShowSpinner(true);
        setDataLoaded(false);
        setInitialvalue("");
        //fetchCashCollectionStatus();
        let bulk_Quantity_map = new Map();
        bulk_Quantity_map = await fetchBulkQty();
        const nextDeliveryDate = moment(fromDate).format('YYYY-MM-DD');

        const subscriptionMap = new Map();
        const newCustomerDataList = [];
        let totalCreditLimit = 0;
        let totalOrders = 0;

        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeekIndex = fromDate.getDay();
        const dayOfWeek = weekdays[dayOfWeekIndex];

        const subscriptionsRegular = await apiClient.post('/api/subscriptions_data/query', {
            filters: [
                { field: 'subscription_type', op: '!=', value: 'Custom' },
                { field: 'next_delivery_date', op: '==', value: nextDeliveryDate },
                { field: 'status', op: '==', value: '1' }
            ]
        }).then(res => res.data?.data || []);

        const subscriptionsCustom = await apiClient.post('/api/subscriptions_data/query', {
            filters: [
                { field: 'subscription_type', op: '==', value: 'Custom' },
                { field: dayOfWeek, op: '>=', value: 1 },
                { field: 'status', op: '==', value: '1' }
            ]
        }).then(res => res.data?.data || []);

        const pausedResumedRegular = await apiClient.post('/api/subscriptions_data/query', {
            filters: [
                { field: 'subscription_type', op: '!=', value: 'Custom' },
                { field: "resume_date", op: "==", value: nextDeliveryDate },
                { field: 'status', op: '==', value: '0' }
            ]
        }).then(res => res.data?.data || []);

        const pausedResumedCustom = await apiClient.post('/api/subscriptions_data/query', {
            filters: [
                { field: 'subscription_type', op: '==', value: 'Custom' },
                { field: dayOfWeek, op: '>=', value: 1 },
                { field: "resume_date", op: "==", value: nextDeliveryDate },
                { field: 'status', op: '==', value: '0' }
            ]
        }).then(res => res.data?.data || []);

        subscriptionsRegular.forEach(subscription => {
            if (!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
                if (bulk_Quantity_map.has(subscription.subscription_id)) {
                    subscription.quantity = bulk_Quantity_map.get(subscription.subscription_id);
                }
                if (!subscriptionMap.has(subscription.customer_id)) {
                    subscriptionMap.set(subscription.customer_id, { items: [], total_price: 0 });
                }
                subscriptionMap.get(subscription.customer_id).items.push(subscription);
                subscriptionMap.get(subscription.customer_id).total_price += (subscription.price * subscription.quantity);
            }

        });

        subscriptionsCustom.forEach(subscription => {
            if (!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
                if (bulk_Quantity_map.has(subscription.subscription_id)) {
                    subscription.quantity = bulk_Quantity_map.get(subscription.subscription_id);
                } else {
                    subscription.quantity = subscription[dayOfWeek];
                }
                if (!subscriptionMap.has(subscription.customer_id)) {
                    subscriptionMap.set(subscription.customer_id, { items: [], total_price: 0 });
                }
                subscriptionMap.get(subscription.customer_id).items.push(subscription);
                subscriptionMap.get(subscription.customer_id).total_price += (subscription.price * subscription.quantity);
            }
        });

        pausedResumedRegular.forEach(subscription => {
            if (!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
                if (bulk_Quantity_map.has(subscription.subscription_id)) {
                    subscription.quantity = bulk_Quantity_map.get(subscription.subscription_id);
                }
                if (!subscriptionMap.has(subscription.customer_id)) {
                    subscriptionMap.set(subscription.customer_id, { items: [], total_price: 0 });
                }
                subscriptionMap.get(subscription.customer_id).items.push(subscription);
                subscriptionMap.get(subscription.customer_id).total_price += (subscription.price * subscription.quantity);
            }

        });

        pausedResumedCustom.forEach(subscription => {
            if (!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
                if (bulk_Quantity_map.has(subscription.subscription_id)) {
                    subscription.quantity = bulk_Quantity_map.get(subscription.subscription_id);
                } else {
                    subscription.quantity = subscription[dayOfWeek];
                }
                if (!subscriptionMap.has(subscription.customer_id)) {
                    subscriptionMap.set(subscription.customer_id, { items: [], total_price: 0 });
                }
                subscriptionMap.get(subscription.customer_id).items.push(subscription);
                subscriptionMap.get(subscription.customer_id).total_price += (subscription.price * subscription.quantity);
            }
        });

        const customerIds = Array.from(subscriptionMap.keys());
        const customerPromises = customerIds.map(customer_id =>
            apiClient.post("/api/customers_data/query", {
                filters: [{ field: "customer_id", op: "==", value: customer_id }]
            }).then(res => res.data?.data?.[0])
        );

        const customerSnapshots = await Promise.all(customerPromises);

        for (let i = 0; i < customerSnapshots.length; i++) {
            const customerData = customerSnapshots[i];

            if (customerData) {
                const { customer_id, wallet_balance, credit_limit } = customerData;
                const total_price = subscriptionMap.get(customer_id).total_price;
                let requiredBalance = 0;
                let isBalanceSufficient = true;

                if (wallet_balance < 0) {
                    if (credit_limit < total_price) {
                        isBalanceSufficient = false;
                        requiredBalance = total_price;
                    }

                } else {
                    //isBalanceSufficient = wallet_balance + credit_limit >= total_price;
                    if (wallet_balance + credit_limit < total_price) {
                        isBalanceSufficient = false;
                    }
                    if (!isBalanceSufficient) {
                        requiredBalance = total_price - wallet_balance;
                    }
                }

                // const cash_collection_count = await fetchCashCollectionCount(customer_id, nextDeliveryDate);
                // const cash_collection_status = cash_collection_count >= 1 ? 'Requested' : 'Not Requested';

                if (!isBalanceSufficient) {
                    const updatedCustomerData = {
                        ...customerData,
                        requiredBalance,
                        isBalanceSufficient,
                        total_price,
                        // cash_collection_status
                    };
                    totalCreditLimit += requiredBalance;
                    totalOrders += total_price;
                    newCustomerDataList.push(updatedCustomerData);
                }
            }
        }

        if (newCustomerDataList.length > 0) {
            let testArr = [];
            for (let i = 0; i < newCustomerDataList.length; i++) {
                let orderCount = await fetchOrderCount(newCustomerDataList[i].customer_id)
           

                testArr.push({ ...newCustomerDataList[i], order_count: orderCount })
            }


            setLowCreditReport(testArr);
            setTotalCreditRequired(totalCreditLimit);
            setTotalOrdersAmount(totalOrders);
            setDataLoaded(true);
        } else {
            setInitialvalue("No Data Found");
        }

        setShowSpinner(false);
    };

    const navi = (id) => {
        const url = `/profile/${id}`;
        const newTab = window.open(url, '_blank');
        newTab.focus();
    };

    const SpinnerOverlay = () => (
        <div className="spinner-overlay">
            <div className="spinner"></div>
        </div>
    );

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        let tableColumn = [];
        let tableRows = [];

        // Adjust the content based on isSearch flag
        if (isSearch) {
            tableColumn = [
                "Customer ID", "Customer Name", "Phone Number", "Hub Name",
                "Current wallet Balance", "Total Orders Amount", "Required Credit"
            ];
            tableRows = lowCreditReport.map((customer) => [
                customer.customer_id,
                customer.customer_name,
                customer.customer_phone,
                customer.hub_name,
                customer.wallet_balance,
                customer.total_price,
                customer.requiredBalance,
            ]);
        } else {
            tableColumn = [
                "S.No.", "Customer Id", "Customer Name", "Phone Number", "Credit Limit", "Credit Date"
            ];
            tableRows = lowCreditReport.map((customer, index) => [
                index + 1,
                customer.customer_id,
                customer.customer_name,
                customer.customer_phone,
                customer.credit_limit,
                customer.credit_date
            ]);
        }

        // Using autoTable to generate the table in the PDF
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
        });

        // Save the PDF with the appropriate filename3
        doc.save("LowCreditReport.pdf");
    };

    const exportToCSV = () => {
        let csvHeader = []
        let csvRows = []
        if (isSearch) {
            csvHeader = ["Customer ID", "Customer Name", "Phone Number", "Hub Name", "Current Wallet Balance", "Total Orders Amount", "Required Credit",].join(",") + "\n";

            csvRows = lowCreditReport.map(customer => [
                customer.customer_id,
                customer.customer_name,
                customer.customer_phone,
                customer.hub_name,
                customer.wallet_balance,
                customer.total_price,
                customer.requiredBalance,
            ].join(",")).join("\n");
        } else {
            csvHeader = ["S.No.", "Customer Id", "Customer Name", "Phone Number", "Credit Limit", "Credit Date"].join(",") + "\n";

            csvRows = lowCreditReport.map((customer, index) => [
                index + 1,
                customer.customer_id,
                customer.customer_name,
                customer.customer_phone,
                customer.credit_limit,
                customer.credit_date
            ].join(",")).join("\n");
        }
        const csvContent = csvHeader + csvRows;

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "LowCreditReport.csv");
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
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
            <div className="panel" style={{ marginTop: "10px", marginBottom: "10px" }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: "18px", color: "#288a84", fontWeight: "700", marginTop: "12px" }}>LOW CREDIT REPORT</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}> {/* Flexbox for buttons */}
                        {dataLoaded &&
                            <ExportTableToExcel tableId="low_credit_report" fileName="low_credit_report" />
                        }
                        <button className="btn btn-success btn-rounded btn-sm mt-1" style={{ marginLeft: '8px' }} onClick={exportToPDF}>Export to PDF</button>
                        <button className="btn btn-success btn-rounded btn-sm mt-1" style={{ marginLeft: '8px' }} onClick={exportToCSV}>Export to CSV</button>
                    </div>
                </div>
            </div>


            <div className="panel" style={{ display: 'flex', flexDirection: 'row' }}>
                <div className="datepicker-container" style={{ marginTop: "10px" }}>
                    <label className="datepicker-label">Delivery Date:</label>
                    <DatePicker
                        selected={fromDate}
                        minDate={getTomorrowDate()}
                        maxDate={getTomorrowDate()}
                        onChange={handleFromDateChange}
                        dateFormat="dd-MM-yyyy"
                        className="datepicker-input"
                        placeholderText="Select date"
                    />
                </div>
                <Button
                    style={{
                        marginRight: '22px', padding: '9px', height: '35px', borderRadius: '20px', marginTop: '8px'
                    }}
                    className="btn  btn-success"
                    onClick={handleCheckout} disabled={loadSearch} >
                    Exclude credit limit
                </Button>
                <div style={{ marginTop: '10px' }}>
                    <Button variant="outline-success" onClick={handleSearch} size='sm' disabled={loadSearch}>
                        Search
                    </Button>
                    {dataLoaded && <Button style={{ marginLeft: '1rem' }} variant="outline-danger" size='sm' onClick={updateCustomerCreditLimits} disabled={updating}>Give Credit To All</Button>}
                </div>
                {dataLoaded && (
                    <>
                        <div className="card d-flex align-items-start custom-green" style={{ marginLeft: '10rem' }}>
                            <div className="card-body">
                                <div className="d-flex flex-row align-items-start">
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: '#fff' }} className="text-facebook">Total Customers</span>
                                </div>
                                <p className="mt-2 text-muted card-text custom-card-text">{lowCreditReport.length}</p>
                            </div>
                        </div>
                        <div className="card d-flex align-items-start custom-green" style={{ marginLeft: '1rem' }}>
                            <div className="card-body" >

                                <span style={{ fontSize: "13px", fontWeight: "600", color: '#fff' }} className="text-facebook">Total Order Value</span>
                                <p className="mt-2 text-muted card-text custom-card-text">₹ {totalOrdersAmount}</p>
                            </div>
                        </div>
                        <div className="card d-flex align-items-start custom-green" style={{ marginLeft: '1rem' }}>
                            <div className="card-body" style={{ marginBottom: '-1rem' }}>
                                <div className="d-flex flex-row align-items-start">
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: '#fff' }} className="text-facebook">Total Credit Required</span>
                                </div>
                                <p className="mt-2 text-muted card-text custom-card-text">₹ {totalCreditRequired}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }} class="table-responsive">
                {showSpinner && <div className="spinner-container"><SpinnerOverlay /></div>}
                {

                    isSearch ?

                        (<table id="low_credit_report" class="table table-striped">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Customer Id</th>
                                    <th>Customer Name</th>
                                    <th>Phone Number</th>
                                    <th>Hub Name</th>
                                    <th>Current wallet Balance</th>
                                    <th>Total Order Amount</th>
                                    <th>Required Credit</th>
                                    <th>Register date</th>
                                    <th>Order Count</th>


                                    {/* <th>Cash Collection Status</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {dataLoaded ? (
                                    lowCreditReport.map((report, index) => (
                                        <tr key={index} onClick={() => navi(report.customer_id)} style={{ cursor: "pointer" }}>
                                            <td>{index + 1}</td>
                                            <td>{report.customer_id}</td>
                                            <td>{report.customer_name}</td>
                                            <td>{report.customer_phone}</td>
                                            <td>{report.hub_name}</td>
                                            <td>{report.wallet_balance}</td>
                                            <td>{report.total_price}</td>
                                            <td>{report.requiredBalance}</td>
                                            <td>
                                                {report.registered_date ? moment(
                                                    report.registered_date.seconds ? report.registered_date.seconds * 1000 : report.registered_date
                                                ).format("DD-MM-YYYY, h:mm a") : "N/A"}
                                            </td>
                                            <td>{report.order_count}</td>
                                            {/* <td>{fetchCashCollectionCount(report.customer_id , moment(fromDate).format('YYYY-MM-DD') , report.requiredBalance)==1 ? 'Requested' : 'Not Requested'}</td> */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: "center" }}>{initialValue}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>)
                        :
                        (<table id="low_credit_report" class="table table-striped">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Customer Id</th>
                                    <th>Customer Name</th>
                                    <th>Phone Number</th>
                                    <th>Credit Limit</th>
                                    <th>Credit Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowCreditReport.length > 0 ? (
                                    lowCreditReport.map((report, index) => {
                                        // Convert Firestore timestamp to a readable date
                                        // const createdDate = new Date(report.created_date.seconds * 1000).toLocaleDateString();
                                        return (
                                            <tr key={index} onClick={() => navi(report.customer_id)} style={{ cursor: "pointer" }}>
                                                <td>{index + 1}</td>
                                                <td>{report.customer_id}</td>
                                                <td>{report.customer_name}</td>
                                                <td>{report.customer_phone}</td>
                                                <td>{report.credit_limit}</td>
                                                <td>{report.credit_date}</td>
                                                {/* <td>{createdDate}</td> Display the formatted date */}
                                            </tr>
                                        );
                                    })

                                ) : (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: "center" }}>{initialValue}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        )
                }
            </div>
        </>
    );
}

export default LowCreditReport;