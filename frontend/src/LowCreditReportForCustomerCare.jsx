import React, { useState , useEffect,useContext, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Moment from "moment";
import { extendMoment } from "moment-range";
import DatePicker from "react-datepicker";
import { getUserInfo,handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import 'jspdf-autotable';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, Card, Form, Spinner, Table, Row, Col, Modal} from 'react-bootstrap';
import moment from "moment";
import GiveCreaditToAll from "./GiveCreaditToAll";
import { saveAs } from "file-saver";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import apiClient from "./services/apiClient";

function LowCreditReportForCustomerCare() {
    const {userId} = getUserInfo();
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();
    useEffect(() => {
        const loggedIn = localStorage.getItem("loggedIn") === "true";
        if (!loggedIn) {
            navigate("/login");
        }else{
            if(permissible_roles.length>0){
                if(!permissible_roles.includes('low_credit_report')){
                    handleLogout()
                    navigate("/permission_denied");
                }
            }
        }
    }, [navigate,permissible_roles]);

    const [lowCreditReport, setLowCreditReport] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [initialValue, setInitialvalue] = useState("No Data Found / Click on Search Records to get letest Data");
    const [fromDate, setFromDate] = useState('');
    const [totalCreditRequired, setTotalCreditRequired] = useState(0);
    const [totalOrdersAmount, setTotalOrdersAmount] = useState(0);
    const [vacationsData , setVacationsData] = useState([]);
    const [loadSearch , setLoadSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSearch, setIsSearch] = useState(true);
    const [showAgents, setShowAgents] = useState(false);
    const [agents, setAgents] = useState([]);
    const [showCustomerReport, setShowCustomerReport] = useState(false);
    const [assignToAgents, setAssignToAgents] = useState(true);

        
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ message: "", type: "" });
    
    const moment = extendMoment(Moment);


    //dont disturb these funtions
    const fetchCustomersOnVaction = async () => {
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() +1);

        const vacation_date = new Date(tomorrow);
        vacation_date.setHours(0,0,0,0);
        const endDate = new Date(vacation_date);
        endDate.setHours(23,59,59,999);

        const vacations_data = await apiClient.post("/api/customers_vacation/query", {
            filters: [
                { field: "start_date", op: "<=", value: endDate },
                { field: "end_date", op: ">=", value: vacation_date }
            ]
        }).then(res => res.data?.data || []);


        setVacationsData(vacations_data);
        setLoadSearch(false);

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
        return newMap;
    }
    
    const fetchTodayCreditLimitHistory = async () => {
        const today = moment(new Date()).format("YYYY-MM-DD")
        const docs = await apiClient.post("/api/credit_limit_history/query", {
            filters: [
                { field: "credit_date", op: "==", value: today }
            ]
        }).then(res => res.data?.data || []);
    
        // Optional: you can sort `docs` by created_date descending if backend doesn't yet do it.
        docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        const latestHistoryMap = new Map();

        docs.forEach(data => {
            if (!latestHistoryMap.has(data.customer_id)) {
                latestHistoryMap.set(data.customer_id, data);
            }
        });
        const fetchData = docs;
     
        return fetchData;
    
    };
    
    const navi = (id) => {
        const url = `/profile/${id}`;
        const newTab = window.open(url, '_blank');
        newTab.focus();
    };
    
    
    const exportToCSV = () => {
        if (!lowCreditReport.length) {
            alert("No data available to export!");
            return;
        }
    
        const headers = isSearch 
            ? ["#", "Customer ID", "Name", "Phone", "Hub Name", "Wallet Balance", "Order Amount", "Required Credit", "Status", "Update"]
            : ["#", "Customer ID", "Name", "Phone", "Credit Limit", "Credit Date", "Status", "Assigned To", "Credit By", "User ID"];
    
        const csvRows = [];
        csvRows.push(headers.join(",")); // Add headers
    
        lowCreditReport.forEach((report, index) => {
            const row = isSearch 
                ? [
                    index + 1, report.customer_id, report.customer_name, report.customer_phone,
                    report.hub_name, report.wallet_balance, report.total_price, report.requiredBalance, report.status, report.assign_to || ""
                  ]
                : [
                    index + 1, report.customer_id, report.customer_name, report.customer_phone,
                    report.credit_limit, report.credit_date, report.status, report.assign_to || "", report.user_name, report.userId
                  ];
            
            csvRows.push(row.map(value => `"${value}"`).join(",")); // Ensure values are enclosed in quotes
        });
    
        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
    
        // Create a download link
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "CustomerData.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        setLoadSearch(true);
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() +1);
        setFromDate(tomorrow);
        fetchCustomersOnVaction();
        handleCustomerAgents()
    }, []);

    const handleFromDateChange = (date) => {
        setFromDate(date);
    };


    const handleCheckout = async () => {
        setIsSearch(false);
        setShowSpinner(true);
        
        setShowCustomerReport(false);
        setDataLoaded(false);
        const todayCreditHistory = await fetchTodayCreditLimitHistory();
        
        // if (todayCreditHistory.length > 0) {
            setLowCreditReport(prev => todayCreditHistory);
            // } else {
                //     setInitialvalue("No Data Found");
                // }
                setDataLoaded(true);
    
        setShowSpinner(false);
    };
    
    const handleSearch = async () => {
        setShowCustomerReport(false);
        setIsSearch(true)
        setAssignToAgents(false); 
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

        const subscriptionsRegular = await apiClient.post("/api/subscriptions_data/query", {
            filters: [
                { field: "subscription_type", op: "!=", value: "Custom" },
                { field: "next_delivery_date", op: "==", value: nextDeliveryDate },
                { field: "status", op: "==", value: "1" }
            ]
        }).then(res => res.data?.data || []);
        
        const subscriptionsCustom = await apiClient.post("/api/subscriptions_data/query", {
            filters: [
                { field: "subscription_type", op: "==", value: "Custom" },
                { field: dayOfWeek, op: ">=", value: 1 },
                { field: "status", op: "==", value: "1" }
            ]
        }).then(res => res.data?.data || []);

        subscriptionsRegular.forEach(subscription => {
            if(!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
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
                if(!vacationsData.some(vacation => vacation.customer_id === subscription.customer_id)) {
                    if (bulk_Quantity_map.has(subscription.subscription_id)) {
                        subscription.quantity = bulk_Quantity_map.get(subscription.subscription_id);
                    }else {
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
        const customers = await handleCraditLimitCall(); 

        // Remove customers from `subscriptionMap` using `filter()`
        const filteredCustomers = customerIds.filter(customer => !customers.includes(customer));

        // Fetch only the filtered customer data
        const customerPromises = filteredCustomers.map(customer_id =>
            apiClient.post("/api/customers_data/query", {
                filters: [{ field: "customer_id", op: "==", value: customer_id }]
            }).then(res => res.data?.data?.[0])
        );

        const customerSnapshots= await Promise.all(customerPromises);
        for (let i = 0; i < customerSnapshots.length; i++) {

            const customerData = customerSnapshots[i];

            if (customerData) {
                const { customer_id, wallet_balance, credit_limit } = customerData;
                const total_price = subscriptionMap.get(customer_id)?.total_price || 0;
                let requiredBalance = 0;
                let isBalanceSufficient = true;

                if (wallet_balance < 0) {
                    if (credit_limit < total_price) {
                        isBalanceSufficient = false;
                        requiredBalance = total_price;
                    }
                } else if (wallet_balance + credit_limit < total_price) {
                    isBalanceSufficient = false;
                    requiredBalance = total_price - wallet_balance;
                }

                if (!isBalanceSufficient) {
                    const updatedCustomerData = {
                        ...customerData,
                        requiredBalance,
                        isBalanceSufficient,
                        total_price
                    };
                    totalCreditLimit += requiredBalance;
                    totalOrders += total_price;
                    newCustomerDataList.push(updatedCustomerData);
                }
            }
        }


        if (newCustomerDataList.length > 0) {
            setLowCreditReport(newCustomerDataList);
            setTotalCreditRequired(totalCreditLimit);
            setTotalOrdersAmount(totalOrders);
            setDataLoaded(true);
        } else {
            setInitialvalue("No Data Found");
        }

        setShowSpinner(false);
    };

    
    const handleAssignToCustomerCare = async () => {
        if (!isSearch) {
            return;
        }
        setAssignToAgents(true); 
        setShowModal(true);
        setModalContent({ message: "Starting assignment...", type: "info" });
        
        setTimeout(() => {
            setModalContent({ message: "Assigning customers to agents...", type: "info" });
        }, 1000);
        
        setLoadSearch(true);
        try {
            const promises = [];
    
            lowCreditReport.forEach((report, index) => {
                const agentID = agents[index % agents.length].user_id;
                const agentName = agents[index % agents.length].first_name + " " + agents[index % agents.length].last_name;
                const data = {
                    assignBy: userId || " ",
                    assigned_to: agentID || " ",
                    assigned_to_name: agentName || " ",
                    customer_id: report.customer_id || " ",
                    customer_phone: report.customer_phone || " ",
                    customer_name: report.customer_name || " ",
                    requiredBalance: report.requiredBalance || "",
                    isBalanceSufficient: report.isBalanceSufficient || "",
                    total_price: report.total_price || "",
                    status: "Assigned",
                    assigned_date: moment(new Date()).format("YYYY-MM-DD"),
                    updated_date: new Date(),
                };
                
                promises.push(apiClient.post("/api/cradit_limit_call_test", data));
            });
    
            await Promise.all(promises);
            
            setModalContent({ message: "Assigning customers to agents...", type: "info" });
            
            setTimeout(() => {
                setModalContent({ message: "Customers successfully assigned!", type: "success" });
                setTimeout(() => setShowModal(false), 3000);
            }, 1000);
            
        } catch (e) {
            console.error("Error assigning to customer care", e);
            setModalContent({ message: "Failed to assign customers. Please try again!", type: "error" });
            setTimeout(() => setShowModal(false), 5000);
        }
        setLoadSearch(false);
    };

    const CustomModal = ({ show, onHide, content }) => (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Body className="text-center p-4">
                <h5 className={content.type === "success" ? "text-success" : "text-danger"}>{content.message}</h5>
                <Button variant="secondary" onClick={onHide} className="mt-3">Close</Button>
            </Modal.Body>
        </Modal>
    );




    const handleCraditLimitCall = async () => {
        if (!isSearch) {
            return [];
        }
    
        setLoadSearch(true);
        try {
            const date = moment().format("YYYY-MM-DD");
            const docs = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "assigned_date", op: "==", value: date }]
            }).then(res => res.data?.data || []);
    
            const data = docs.map(doc => doc.customer_id);
            return data;
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        } finally {
            setLoadSearch(false);
        }
    };
    const handleCustomerAgents = async () => {
        try {
            const data = await apiClient.post("/api/users/query", {
                filters: [{ field: "role", op: "==", value: "Customer Care Agent" }]
            }).then(res => res.data?.data || []);
    
            setAgents(data);
            return data;
        } catch (error) {
            console.error("Error fetching Customer Care Agente:", error);
            return [];
        } finally {
        }
    };




    
 
    
    return (
        <div className="container-scroller">
            {loading && (
                <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                    <img src="images/loader.gif" alt="Loading..." style={{ height: "6rem" }} />
                </div>
            )}
            <TopPanel />
            <div className="container-fluid page-body-wrapper">
                <Sidebar />
                <div className="main-panel"> 
                    <div className="content-wrapper">
                        <CustomModal show={showModal} onHide={() => setShowModal(false)} content={modalContent} />

                        <Card className="p-3  shadow-sm mb-4">
                            <h4 className="text-primary fw-bold mb-0">Low Credit Report</h4>
                        </Card>

                        <Card className="p-3 shadow-sm mb-4">
                            <Row className="align-items-center g-2">
                                <Col md={3} className="d-flex align-items-center gap-2">
                                    <label className="fw-bold w-auto">Delivery Date:</label>
                                    <input
                                        type="text"
                                        value={moment(fromDate).format("DD-MM-YYYY")}
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: '100px' }}
                                        readOnly
                                    />
                                </Col>

                                <Col md={3}>
                                    <Button
                                        variant="outline-danger"
                                        className="w-100 btn-sm"
                                        onClick={handleCheckout}
                                        disabled={loadSearch}
                                    >
                                        Exclude Credit Data
                                    </Button>
                                </Col>

                                <Col md={3}>
                                    <Button
                                        variant="outline-success"
                                        className="w-100 btn-sm"
                                        onClick={handleSearch}
                                        disabled={loadSearch}
                                    >
                                        Search Records
                                    </Button>
                                </Col>

                                {/* {(!showCustomerReport && dataLoaded && agents?.length > 0 && lowCreditReport?.length > 0 && isSearch) && ( */}
                                    <Col md={3}>
                                        <Button
                                            variant="dark"
                                            className="w-100 btn-sm"
                                            onClick={handleAssignToCustomerCare}
                                            disabled={assignToAgents} // Disable when assigning
                                        >
                                            Assign Agents
                                        </Button>
                                    </Col>
                                {/* )} */}
                            </Row>
                            
                            <Row className="mt-3 g-2">
                                <Col md={3}>
                                    <GiveCreaditToAll />
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="outline-primary"
                                        className="w-100 btn-sm"
                                        onClick={() => navigate("/lowbalance-assign-task")}
                                        disabled={loadSearch}
                                    >
                                        Agent Task Dashboard
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <Button
                                        variant="outline-secondary"
                                        className="w-100 btn-sm"
                                        onClick={() => setShowCustomerReport(true)}
                                        disabled={loadSearch}
                                    >
                                        Agent Reports
                                    </Button>
                                </Col>
                                <Col md={3}>
                                    <AgentSidebar agents={agents} loadSearch={false} />
                                </Col>
                            </Row>
                        </Card>

                        {showCustomerReport ? <CreditLimitSummary /> : (
                            <>
                                {dataLoaded && (
                                    <Card className="p-4 mb-4">
                                        <h5 className="fw-bold mb-3">Summary</h5>
                                        <div className="d-flex flex-wrap gap-3">
                                            {[{ title: "Total Customers", value: lowCreditReport.length },
                                                isSearch && { title: "Total Order Value", value: `₹ ${totalOrdersAmount}` },
                                                isSearch && { title: "Total Credit Required", value: `₹ ${totalCreditRequired}` },
                                                isSearch && { title: "Total Credit Given", value: `₹ ${totalOrdersAmount - totalCreditRequired}` }]
                                                .filter(Boolean)
                                                .map((item, index) => (
                                                    <Card key={index} className="p-3 shadow-sm text-center" style={{ minWidth: "150px" }}>
                                                        <p className="mb-1 fw-bold" style={{ fontSize: "1rem" }}>{item.title}</p>
                                                        <h3 className="text-success fw-bold">{item.value}</h3>
                                                    </Card>
                                                ))}
                                        </div>
                                    </Card>
                                )}

                                <Card className="p-4 mb-4">
                                    <div className="d-flex flex-row justify-content-between align-items-cneter mb-2">
                                        <h5 className="fw-bold mb-3">{isSearch ? "Search Records" : "Credit Given TO"}</h5>
                                        <Button variant="success" onClick={exportToCSV} size="sm">
                                            Export to CSV
                                        </Button>
                                    </div>
                                    <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "auto", overflowX: "auto" }}>
                                        <Table striped bordered hover className="text-center">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Customer ID</th>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    {isSearch ? (
                                                        <>
                                                            <th>Hub Name</th>
                                                            <th>Wallet Balance</th>
                                                            <th>Order Amount</th>
                                                            <th>Required Credit</th>
                                                            <th>Status</th>
                                                            <th>Update</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th>Credit Limit</th>
                                                            <th>Credit Date</th>
                                                            <th>Status</th>
                                                            <th>Assigned To</th>
                                                            <th>Credit By</th>
                                                            <th>User ID</th>
                                                        </>
                                                    )}
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
                                                            {isSearch ? (
                                                                <>
                                                                    <td>{report.hub_name}</td>
                                                                    <td>{report.wallet_balance}</td>
                                                                    <td>{report.total_price}</td>
                                                                    <td>{report.requiredBalance}</td>
                                                                    <td>{report?.status}</td>
                                                                    <td>{report?.assign}</td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td>{report.credit_limit}</td>
                                                                    <td>{report.credit_date}</td>
                                                                    <td>{report?.status}</td>
                                                                    <td>{report?.assign}</td>
                                                                    <td>{report?.user_name}</td>
                                                                    <td>{report?.userId}</td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    showSpinner  ? 
                                                    <tr>
                                                        <td colSpan="10" className="text-center">
                                                            <div className="text-center"><Spinner animation="border" /></div>
                                                        </td>
                                                    </tr>
                                                    :
                                                    <tr>
                                                        <td colSpan="10" className="text-center">{initialValue}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card>
                            </>
                        )}
                        <Footer />
                    </div>
                </div>
            </div>
        </div>

    );
}

export default LowCreditReportForCustomerCare;














const TableForCustomerCare1 = ({lowCreditReport}) => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCreditLimitCalls = async () => {
        setIsLoading(true);
        try {
            const date = moment().format("YYYY-MM-DD");
            const docs = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "assigned_date", op: "==", value: date }]
            }).then(res => res.data?.data || []);
            return docs;
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetchCreditLimitCalls();
            setCustomers(result);
        };
        fetchData();
    }, []);
    useEffect(() => {
    if(lowCreditReport.length > 0 && customers.length > 0){
        const data = customers.map(item =>{
            const temp = lowCreditReport.filter(item1 => item1.customer_id === item.customer_id);
            return {...temp, ...item};
        })
        setCustomers(data)
        }
    }, [lowCreditReport]);


    

    const handleStatusChange = async (e, customerId) => {
        e.stopPropagation(); // Prevent row click when selecting status

        const newStatus = e.target.value;
        try {
            const docs = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "customer_id", op: "==", value: customerId }]
            }).then(res => res.data?.data || []);
            
            for (const doc of docs) {
                await apiClient.put(`/api/cradit_limit_call_test/${doc._id}`, { status: newStatus });
            }

            setCustomers(prevCustomers =>
                prevCustomers.map(customer =>
                    customer.customer_id === customerId
                        ? { ...customer, status: newStatus }
                        : customer
                )
            );
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    
    const navigateToProfile = (id) => {
        if (id) {
            const url = `/profile/${id}`;
            const newTab = window.open(url, "_blank");
            if (newTab) newTab.focus();
        }
    };

    return (
        <div className="table-responsive mt-4">
            {isLoading && <div className="text-center"><Spinner animation="border" /></div>}
            <Table striped bordered hover>
                <thead className="table-dark">
                    <tr>
                        <th>S.No.</th>
                        <th onClick={(e) => e.stopPropagation()}>Customer ID</th>
                        <th onClick={(e) => e.stopPropagation()}>Customer Name</th>
                        <th onClick={(e) => e.stopPropagation()}>Phone Number</th>
                        <th>Credit Limit</th>
                        <th>Credit Date</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Credit By</th>
                        <th>Credit By UserID</th>
                    </tr>
                </thead>
                <tbody>
                    {!isLoading && customers.length > 0 ? (
                        customers.map((report, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_id}</td>
                                <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_name}</td>
                                <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_phone}</td>
                                <td>{report.credit_limit}</td>
                                <td>{report.credit_date}</td>
                                <td className="p-2">
                                    <Form.Select
                                        value={report.status || "Assign"}
                                        onClick={(e) => e.stopPropagation()} // Stop row click
                                        onChange={(e) => handleStatusChange(e, report.customer_id)}
                                        className="form-select form-select-sm w-100 p-2 border-0 bg-light"
                                        style={{ appearance: "none", backgroundImage: "none", paddingRight: "10px" }}
                                    >
                                        <option value="Assign">Assign</option>
                                        <option value="Called">Called</option>
                                        <option value="Fund Added">Fund Added</option>
                                        <option value="Credit Given">Credit Given</option>
                                    </Form.Select>
                                </td>
                                <td>{report.assigned_to}</td>
                                <td>{report.user_name}</td>
                                <td>{report.userId}</td>
                            </tr>
                        ))
                    ) : (
                        !isLoading && (
                            <tr>
                                <td colSpan="10" className="text-center">No data available</td>
                            </tr>
                        )
                    )}
                </tbody>
            </Table>
        </div>
    );
};




const AgentSidebar = ({ agents, loadSearch }) => {
    const [showAgents, setShowAgents] = useState(false);
    const sidebarRef = useRef(null);

    // Close sidebar when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setShowAgents(false);
            }
        }
        if (showAgents) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAgents]);

    return (
        <div>
            <Button
                variant="outline-success"
                className="w-100 btn-sm"
                onClick={() => setShowAgents(true)}
                disabled={loadSearch}
            >
                Agents
            </Button>

            {showAgents && (
                <div
                    ref={sidebarRef}
                    className="position-fixed top-0 end-0 h-100 w-25 bg-white shadow p-4 overflow-auto border-start border-secondary"
                    style={{ zIndex:"9998", transition: "transform 0.3s ease-in-out", transform: showAgents ? "translateX(0)" : "translateX(100%)" }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold">Agents List</h4>
                        <Button variant="outline-danger" onClick={() => setShowAgents(false)}>Close</Button>
                    </div>
                    <div className="row g-3">
                        {agents.map((agent) => (
                            <div key={agent.user_id} className="col-12">
                                <div className="card border-0 shadow-sm p-3 rounded bg-light">
                                    <div className="card-body">
                                        <p className="mb-1 fw-bold text-primary">👤 {agent.first_name} {agent.last_name}</p>
                                        <p className="mb-0 text-muted">🆔 {agent.user_id}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const CreditLimitSummary = () => {
    const [summary, setSummary] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleCreditLimitCall = async (date) => {
        try {
            const formattedDate = moment(date).format("YYYY-MM-DD");
            const docs = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "assigned_date", op: "==", value: formattedDate }]
            }).then(res => res.data?.data || []);

            return docs;
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const result = await handleCreditLimitCall(selectedDate);
            const summaryMap = {};

            result.forEach(item => {
                const agent = item.assigned_to_name || "Unknown";
                if (!summaryMap[agent]) {
                    summaryMap[agent] = { 
                        "Assigned": 0, 
                        "Called": 0, 
                        "Fund Added": 0, 
                        "Credit Given": 0 
                    };
                }
                if (item.status in summaryMap[agent]) {
                    summaryMap[agent][item.status]++;
                }
            });

            const formattedSummary = Object.entries(summaryMap).map(([agent, counts]) => ({
                agent,
                assigned: counts["Assigned"] || 0,
                called: counts["Called"] || 0,
                fundAdded: counts["Fund Added"] || 0,
                creditGiven: counts["Credit Given"] || 0
            }));

            setSummary(formattedSummary);
        };

        fetchData();
    }, [selectedDate]);

    const exportToCSV = () => {
        const header = "Agent,Assigned,Called,Fund Added,Credit Given\n";
        const csvRows = summary.map(item => `${item.agent},${item.assigned},${item.called},${item.fundAdded},${item.creditGiven}`).join("\n");
        const csvContent = header + csvRows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `Credit_Limit_Summary_${moment(selectedDate).format("YYYY-MM-DD")}.csv`);
    };

    return (
        <Card className="p-4 mb-4">                   
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-3">Credit Limit Summary</h5>
                <div className="d-flex gap-3">
                    <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        className="form-control"
                        dateFormat="yyyy-MM-dd"
                        maxDate={new Date()}
                    />
                    <Button onClick={exportToCSV} variant="success" className="btn-sm">Export CSV</Button>
                </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "auto", overflowX: "auto" }}>
                <Table striped bordered hover className="text-center">
                    <thead className="table-dark">
                        <tr>
                            <th>#</th>
                            <th>Agent</th>
                            <th>Assigned</th>
                            <th>Called</th>
                            <th>Fund Added</th>
                            <th>Credit Given</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.length > 0 ? (
                            summary.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.agent}</td>
                                    <td>{item.assigned}</td>
                                    <td>{item.called}</td>
                                    <td>{item.fundAdded}</td>
                                    <td>{item.creditGiven}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">No Data Available</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
};





