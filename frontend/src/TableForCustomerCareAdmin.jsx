import React, { useState , useEffect,useContext, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Moment from "moment";
import { extendMoment } from "moment-range";
import DatePicker from "react-datepicker";
import { getUserInfo,handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import 'jspdf-autotable';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, Card, Form, Spinner, Table} from 'react-bootstrap';
import moment from "moment";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import apiClient from "./services/apiClient";


const TableForCustomerCareAdmin = () => {
    const {userId} = getUserInfo();
    const {permissible_roles} = useContext(GlobalContext);
    const navigate = useNavigate();
    const db = { 
        collection: (name) => ({
            where: (field, op, value) => ({
                get: () => apiClient.post(`/api/${name}/query`, { filters: [{ field, op, value }] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
            }),
            get: () => apiClient.post(`/api/${name}/query`, { filters: [] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
        })
    };
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
    }, [navigate,permissible_roles]);const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lowCreditReport, setLowCreditReport] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [initialValue, setInitialvalue] = useState("");
    const [fromDate, setFromDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }); 
    
        const [agents, setAgents] = useState([]);
        const handleCustomerAgents = async () => {
                try {
                    const snapshot = await db
                        .collection("users")
                        .where("role", "==", "Customer Care Agent")
                        .get();
            
                    const data =  snapshot.docs.map(doc => doc.data())
                    setAgents(data);
                    return data;
                } catch (error) {
                    console.error("Error fetching Customer Care Agente:", error);
                    return [];
                } finally {
                }
            };
    const [agent, setAgent] = useState("All");
    const today = new Date(); 
    const [data, setData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(today);   
    const [totalCreditRequired, setTotalCreditRequired] = useState(0);
    const [totalOrdersAmount, setTotalOrdersAmount] = useState(0);
    const [vacationsData , setVacationsData] = useState([]);
    const [loadSearch , setLoadSearch] = useState(true);
    const [isSearch, setIsSearch] = useState(true);
    const [isToday, setIsToday] = useState(true);
    const [activeTab, setActiveTab] = useState("Total Customers")
   const moment = extendMoment(Moment);
const navigateToProfile = (id) => {
        if (id) {
            const url = `/profile/${id}`;
            const newTab = window.open(url, "_blank");
            if (newTab) newTab.focus();
        }
    };



    const fetchCreditLimitCalls = async () => {
        setIsLoading(true);
        try {
            const date = moment(selectedDate).format("YYYY-MM-DD");
            const snapshot = await db
                .collection("cradit_limit_call_test")
                .where("assigned_date", "==", date)
                .get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };


    const fetchCustomersOnVaction = async () => {
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() +1);

        const vacation_date = new Date(tomorrow);
        vacation_date.setHours(0,0,0,0);
        const endDate = new Date(vacation_date);
        endDate.setHours(23,59,59,999);

        const res = await apiClient.post("/api/customers_vacation/query", {
            filters: [
                { field: "start_date", op: "<=", value: endDate },
                { field: "end_date", op: ">=", value: vacation_date }
            ]
        });

        const vacations_data = res.data?.data || [];


        setVacationsData(vacations_data);
        setLoadSearch(false);

    }


    const fetchBulkQty = async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const res = await apiClient.post("/api/bulk_update_quantity/query", {
            filters: [{ field: "delivery_date", op: "==", value: moment(tomorrow).format('YYYY-MM-DD') }]
        });
        
        const calendar_data = res.data?.data || [];
        const newMap = new Map();
        calendar_data.forEach(data => {
            const value = data.quantity;
            newMap.set(data.subscription_id, value);
        })
        return newMap;
    }

    const handleSearch = async () => {
        setIsSearch(true)
        setShowSpinner(true);
        setDataLoaded(false);
        setInitialvalue("");
        let bulk_Quantity_map = new Map();
        bulk_Quantity_map = await fetchBulkQty();    
        const subscriptionMap = new Map();
        const newCustomerDataList = [];
        let totalCreditLimit = 0;
        let totalOrders = 0;
        
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        
        // Ensure `fromDate` is a Date object
        const fromDateObj = new Date(fromDate);
        
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get the weekday index and name
        const dayOfWeekIndex = tomorrow.getDay();
        const dayOfWeek = weekdays[dayOfWeekIndex];
        const nextDeliveryDate = moment(fromDate).format('YYYY-MM-DD');



        const subscriptionSnapshot = await db.collection('subscriptions_data')
            .where('subscription_type', '!=', 'Custom')
            .where('next_delivery_date', '==', nextDeliveryDate)
            .where('status', '==', '1')
            .get();
        
        const customSubscriptionSnapshot = await db.collection('subscriptions_data')
            .where('subscription_type', '==', 'Custom')
            .where(dayOfWeek.toLowerCase(), '>=', 1)
            .where('status', '==', '1')
            .get();

        subscriptionSnapshot.docs.forEach(doc => {
            const subscription = doc.data();
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

        
        customSubscriptionSnapshot.docs.forEach(doc => {
            const subscription = doc.data();
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
        
        const filteredCustomers = customerIds.filter(customer => customers.includes(customer));

        
        const customerPromises = filteredCustomers.map(customer_id =>
            apiClient.post("/api/customers_data/query", {
                filters: [{ field: "customer_id", op: "==", value: customer_id }]
            }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
        );


        const customerSnapshots= await Promise.all(customerPromises);
        for (let i = 0; i < customerSnapshots.length; i++) {

            const customerSnapshot = customerSnapshots[i];
            const customerData = customerSnapshot.docs.map(doc => doc.data())[0];

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


 const handleCraditLimitCall = async () => {
        if (!isSearch) {
            return [];
        }    setLoadSearch(true);
        try {
            const date = moment(new Date()).format("YYYY-MM-DD");
            const snapshot = await db
                .collection("cradit_limit_call_test")
                .where("assigned_date", "==", date)
                .get();        const data =  snapshot.docs.map(doc => doc.data().customer_id)
            return data;
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        } finally {
            setLoadSearch(false);
        }
    };
    
    const totalOrdersAgent = useMemo(() => {
        if (agent === "All") return totalOrdersAmount; // If "All" is selected, return the total amount
        const filterd = data
            .filter(item => item.assigned_to == agent && item.hasOwnProperty("credit_limit"))
            
            const sum = filterd
            .reduce((acc, item) => acc + (item.total_price || 0), 0);
            return sum
    }, [agent, customers, data]);

    const totalCraditRequiredAgent = useMemo(() => {
        if (agent === "All") return totalCreditRequired; // If "All" is selected, return the total amount
    
        const filtered = data.filter(item => item.assigned_to === agent && item.hasOwnProperty("credit_limit"));
    
        const sum = filtered.reduce((acc, item) => acc + (item.requiredBalance || 0), 0);
    
        return sum;
    }, [agent, data, totalCreditRequired]);
    

    const totalCalled = useMemo(() => {
        const filterd = agent === "All" ? data.filter(item => item.status === "Called") : data.filter(item => item.assigned_to == agent && item.status === "Called")
            return filterd.length;
    }, [agent, customers, data]);

    const totalFundAdded = useMemo(() => {
        const filterd = agent === "All" ? data.filter(item => item.status === "Fund Added") : data.filter(item => item.assigned_to == agent && item.status === "Fund Added")
            return filterd.length;
    }, [agent, customers, data]);

    const totalCreditGiven = useMemo(() => {
        const filterd = agent === "All" ? data.filter(item => item.status === "Credit Given") : data.filter(item => item.assigned_to == agent && item.status === "Credit Given")
            return filterd.length;
    }, [agent, customers, data]);

    const totalNoAction = useMemo(() => {

        const filterd = agent === "All" ? data.filter(item => item.status === "Assigned") : data.filter(item => item.assigned_to == agent && item.status === "Assigned")
        
        return filterd.length;
    }, [agent, customers, data]);


    const showData = useMemo(() => {
        const mapObject = {
            "No Action": "Assigned",
            "Total Called": "Called",
            "Fund Added": "Fund Added",
            "Credit Given": "Credit Given",
        };



    
        if (activeTab === "Total Customers") {
            return agent === "All" ? data : data.filter(item => item.assigned_to == agent);
        }
        if (activeTab === "Total Order Value" || activeTab === "Total Credit Required") {
            return agent === "All" ? data.filter(item => item.hasOwnProperty("credit_limit")) : data.filter(item => item.assigned_to == agent && item.hasOwnProperty("credit_limit"));
        }
    
        const statusFilter = mapObject[activeTab] || activeTab; // Default to activeTab if not in mapObject
    
        return agent === "All"
            ? data.filter(item => item.status === statusFilter)
            : data.filter(item => item.assigned_to == agent && item.status === statusFilter);
    }, [agent, data, activeTab]);
    


    
    
    const handleStatusChange = async (e, customerId) => {
        e.stopPropagation();

        const newStatus = e.target.value;
        try {
            const res = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "customer_id", op: "==", value: customerId }]
            });
            
            const docs = res.data?.data || [];
            for (const data of docs) {
                const updatedStatusHistory = data.status_history ? [...data.status_history, data.status] : [data.status];

                await apiClient.patch(`/api/cradit_limit_call_test/${data._id || data.id}`, {
                    status: newStatus,
                    update_on: new Date(),
                    status_history: updatedStatusHistory
                });
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


    useEffect(()=>{
        if(agent !== "All"){
            const tempData = customers.filter(item => item.assigned_to === agent)
            setData(tempData);
        }else{
            setData(customers.sort((a, b) => {
                // Define the order of statuses
                // const order = ["Fund Added", "Credit Given", "Called", "Assigned"];
                // const indexA = order.indexOf(a.status);
                // const indexB = order.indexOf(b.status);
            
                // return indexA - indexB;
                return Object.entries(b).length - Object.entries(a).length;
            }));
        }
    }, [agent, customers])

    const [todayData, setTodayData] = useState([]);

    useEffect(() => {
        handleCustomerAgents();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
        fetchCustomersOnVaction();
            const result = await fetchCreditLimitCalls();
            const sortResult = result.sort((a, b) => {
                // Define the order of statuses
                // const order = ["Fund Added", "Credit Given", "Called", "Assigned"];
                // const indexA = order.indexOf(a.status);
                // const indexB = order.indexOf(b.status);
            
                // return indexA - indexB;
                return Object.entries(a).length - Object.entries(b).length;
            });
            
            setCustomers(sortResult);
            if(isToday){
                await handleSearch();
            }else{
                setData(customers);
            }
        };
        setIsToday(moment(selectedDate).format("DD-MM-YYYY") === moment(new Date()).format("DD-MM-YYYY"));
        fetchData();
    }, [selectedDate]);



    useEffect(() => {
        if(lowCreditReport.length > 0 && customers.length > 0){
            const data = customers.map(item =>{
                const temp = lowCreditReport.filter(item1 => item1.customer_id === item.customer_id);
                
                return {...temp[0], ...item};
            })
            setCustomers(data)
            
        }
        
    }, [lowCreditReport]);
// Function to export table data to CSV
const exportToCSV = () => {
    const headers = [
      "S.No.", "Customer ID", "Customer Name", "Phone Number", "Credit Limit", "Wallet Balance", "Total Price", "Required Balance", "Status"
    ];
    
    const rows = showData.map((report, index) => [
      index + 1,
      report.customer_id || "",
      report.customer_name || "",
      report.customer_phone || "",
      report.credit_limit || "",
      report.wallet_balance || "",
      report.total_price || "",
      report.requiredBalance || "",
      report.status || "Assigned"
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${value}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

    return (
        <>
            <div className="">

                        <Card className="p-3  shadow-sm mb-4">
                            <h4 className="text-primary fw-bold mb-0">Low Credit Customers</h4>
                        </Card>
      <Card className="p-4 shadow-sm border-0 mb-4 bg-light">
        
    <div className="row g-4 align-items-center">
        
        {/* Date Picker */}
        <div className="col-md-6">
            <label className="form-label fw-semibold text-primary">📅 Select Date</label>
            <div className="input-group">
                <DatePicker
                    selected={selectedDate}
                    onChange={date => setSelectedDate(date)}
                    className="form-control border-primary shadow-sm"
                    dateFormat="dd-MM-yyyy"
                    maxDate={new Date()} 
                    placeholderText="Select a date"
                />
                {/* <span className="input-group-text bg-primary text-white"><i className="bi bi-calendar"></i></span> */}
            </div>
        </div>

        {/* User Dropdown */}
        <div className="col-md-6">
            <label className="form-label fw-semibold text-primary">👤 Select Agent</label>
            <select 
                className="form-select border-primary shadow-sm"
                onChange={(e) => setAgent(e.target.value)}
            >
                <option value="All">All</option>
                {agents.map(({ user_id, first_name, last_name,  }) => (
                    <option key={user_id} value={user_id}>{first_name+last_name}</option>
                ))}
            </select>
        </div>

    </div>
                </Card>


                <Card className="p-4 shadow-sm border-0 mb-4 bg-light">
      <h5 className="fw-bold mb-3">Summary</h5>
                {isToday && (
                    <>
                        <div className="d-flex flex-wrap align-items-center gap-3 ">
                            {[
                                { title: "Total Customers", value: data.length },
                                isToday && { title: "Total Called", value: totalCalled || 0 },
                                isToday && { title: "Fund Added", value: totalFundAdded || 0 },
                                isToday && { title: "Credit Given", value: totalCreditGiven || 0 },
                                isToday && { title: "No Action", value: totalNoAction || 0 },
                                isToday ? { title: "Total Order Value", value: `₹ ${agent === "All" ? totalOrdersAmount : totalOrdersAgent}` } : null,
                                isToday ? { title: "Total Credit Required", value: `₹ ${agent === "All" ? totalCreditRequired : totalCraditRequiredAgent}` } : null,
                            ]
                                .filter(Boolean)
                                .map((item, index) => (
                                    <div
                                        key={index}
                                        className="card d-flex align-items-start shadow-sm rounded"
                                        style={{
                                            cursor: "pointer",
                                            minWidth: "120px",
                                            backgroundColor: activeTab === item.title ? "#84BF93" : "#f8f9fa",
                                            color: activeTab === item.title ? "white" : "black",
                                            transition: "0.3s",
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = "#84BF93";
                                            e.currentTarget.style.color = "white";
                                        }}
                                        onMouseOut={(e) => {
                                            if (activeTab !== item.title) {
                                                e.currentTarget.style.background = "#f8f9fa";
                                                e.currentTarget.style.color = "black";
                                            }
                                        }}
                                        onClick={() => setActiveTab(item.title)}
                                    >
                                        <div className="card-body w-100 text-end">
                                            <p className="statistics-title font-bold mb-1" style={{ fontSize: "1rem" }}>
                                                {item.title}
                                            </p>
                                            <h3 className="rate-percentage">{item.value}</h3>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                )}

</Card>

<Card className="p-4 shadow-sm border-0 mb-2 bg-light">
    <div className="d-flex flex-row justify-content-between align-items-cneter mb-2">
                                            <h5 className="fw-bold mb-3">Customers</h5>
                                            <Button variant="success" onClick={exportToCSV} size="sm">
                                                Export to CSV
                                            </Button>
                                        </div>
                                <div className="table-container">
                    
                    <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "auto", overflowX: "auto" }}>
                    <Table striped bordered hover className="mb-0">
                            <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                                <tr>
                                    <th>S.No.</th>
                                    <th onClick={(e) => e.stopPropagation()}>Customer ID</th>
                                    <th onClick={(e) => e.stopPropagation()}>Customer Name</th>
                                    <th onClick={(e) => e.stopPropagation()}>Phone Number</th>
                                    <th>Status</th>
                                    <th>Total Price</th>
                                    <th>Required Balance</th>
                                    <th>Credit Limit</th>
                                    <th>Wallet Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!isLoading && showData.length > 0 ? (
                                    showData.map((report, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_id}</td>
                                            <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_name}</td>
                                            <td onClick={() => navigateToProfile(report.customer_id)} style={{ cursor: "pointer" }}>{report.customer_phone}</td>
                                            <td style={{ minWidth: "150px" }}>
                                                <Form.Select
                                                    value={report.status || "Assigned"}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleStatusChange(e, report.customer_id)}
                                                    className="form-select form-select-sm border rounded shadow-sm p-2"
                                                    style={{ background: "#fff", borderColor: "#ced4da" }}
                                                    >
                                                    <option value="Assigned">📝 Assign</option>
                                                    <option value="Called">📞 Called</option>
                                                    <option value="Fund Added">💰 Fund Added</option>
                                                    <option value="Credit Given">✅ Credit Given</option>
                                                </Form.Select>
                                            </td>
                                            <td>{report?.total_price}</td>
                                            <td>{report?.requiredBalance}</td>
                                            <td>{report.credit_limit}</td>
                                            <td>{report?.wallet_balance}</td>
                                        </tr>
                                    ))
                                ) : (
                                    isLoading ? 
                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                <div className="text-center"><Spinner animation="border" /></div>
                                            </td>
                                        </tr>
                                        :
                                        <tr>
                                            <td colSpan="9" className="text-center">No data available</td>
                                        </tr>
                                )}
                            </tbody>
                        </Table>
        </div>
      </div>
    </Card>

            </div>

        </>
    );
};



export default TableForCustomerCareAdmin;