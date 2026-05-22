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
import TableForCustomerCareAdmin from "./TableForCustomerCareAdmin";
import Footer from "./Footer";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import apiClient from "./services/apiClient";
const LowBalanceAllotment  = () =>{
    const db = { 
        collection: (name) => ({
            where: (field, op, value) => ({
                limit: () => ({
                    get: () => apiClient.post(`/api/${name}/query`, { filters: [{ field, op, value }] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [], empty: (res.data?.data || []).length === 0 }))
                })
            })
        })
    };
    const [ user, setUser] = useState({});
    const getUser = async () => {
        try {
        const loggedInUser = localStorage.getItem("userId");
        if (!loggedInUser) throw new Error("User not found in localStorage");
    
        const res = await apiClient.post("/api/users/query", {
            filters: [{ field: "user_id", op: "==", value: loggedInUser }]
        });
        const docs = res.data?.data || [];
        
        if (docs.length > 0) {
            setUser(docs[0])
          return docs[0];
        } else {
          throw new Error("User not found in database");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        return null; 
      }
    }

      useEffect(()=>{
        getUser();
      },[]);
    return (
        <>
            <div className="container-scroller">
                {/* {loading && (
                    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                        <img src="images/loader.gif" alt="Loading..." style={{ height: "6rem" }} />
                    </div>
                )} */}
                <TopPanel />
                <div className="container-fluid page-body-wrapper">
                    <Sidebar />
                    <div className="main-panel"> 
                        <div className="content-wrapper">
                            {user.role === 'Admin' ? <TableForCustomerCareAdmin /> : <TableForCustomerCare />}
                            <Footer />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LowBalanceAllotment;

const TableForCustomerCare = () => {
    const db = { 
        collection: (name) => ({
            where: (field, op, value) => ({
                get: () => apiClient.post(`/api/${name}/query`, { filters: [{ field, op, value }] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [], empty: (res.data?.data || []).length === 0 }))
            }),
            get: () => apiClient.post(`/api/${name}/query`, { filters: [] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [], empty: (res.data?.data || []).length === 0 }))
        })
    };
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


   const [ user, setUser] = useState({});
    const getUser = async () => {
        try {
        const loggedInUser = localStorage.getItem("userId");
        if (!loggedInUser) throw new Error("User not found in localStorage");
    
        const res = await apiClient.post("/api/users/query", {
            filters: [{ field: "user_id", op: "==", value: loggedInUser }]
        });
        const userDocs = res.data?.data || [];
        
        if (userDocs.length > 0) {
            setUser(userDocs[0])
          return userDocs[0];
        } else {
          throw new Error("User not found in database");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        return null; 
      }
    }






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
                .where("assigned_to", "==", user.user_id)
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
            }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [], empty: (res.data?.data || []).length === 0 }))
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
                .where("assigned_to", "==", user.user_id)
                .get();        const data =  snapshot.docs.map(doc => doc.data().customer_id)
            return data;
        } catch (error) {
            console.error("Error fetching credit limit calls:", error);
            return [];
        } finally {
            setLoadSearch(false);
        }
    };
    const totalOrdersAgent = useMemo(
        () => data.filter(item => item.assigned_to === agent && "credit_limit" in item).reduce((acc, item) => acc + (item.total_price || 0), 0),
        [agent, data]
      );
    
      const totalCreditRequiredAgent = useMemo(
        () => data.filter(item => item.assigned_to === agent && "credit_limit" in item).reduce((acc, item) => acc + (item.requiredBalance || 0), 0),
        [agent, data]
      );
    
      const totalCalled = useMemo(() => data.filter(item => item.assigned_to === agent && item.status === "Called").length, [agent, data]);
    const totalFundAdded = useMemo(() => data.filter(item => item.assigned_to === agent && item.status === "Fund Added").length, [agent, data]);
    const totalCreditGiven = useMemo(() => data.filter(item => item.assigned_to === agent && item.status === "Credit Given").length, [agent, data]);
    const totalNoAction = useMemo(() => data.filter(item => item.assigned_to === agent && item.status === "Assigned").length, [agent, data]);

    
      const showData = useMemo(() => {
        const statusMap = {
          "No Action": "Assigned",
          "Total Called": "Called",
          "Fund Added": "Fund Added",
          "Credit Given": "Credit Given",
        };
    
        if (activeTab === "Total Customers") return data.filter(item => item.assigned_to === agent);
        if (["Total Order Value", "Total Credit Required"].includes(activeTab)) return data.filter(item => item.assigned_to === agent && "credit_limit" in item);
    
        return data.filter(item => item.assigned_to === agent && item.status === (statusMap[activeTab] || activeTab));
      }, [agent, data, activeTab]);



    const handleStatusChange = async (e, customerId) => {
        e.stopPropagation();

        const newStatus = e.target.value;
        try {
            const res = await apiClient.post("/api/cradit_limit_call_test/query", {
                filters: [{ field: "customer_id", op: "==", value: customerId }]
            });
            const docsList = res.data?.data || [];
            for (const itemData of docsList) {
                const updatedStatusHistory = itemData.status_history ? [...itemData.status_history, itemData.status] : [itemData.status];

                await apiClient.patch(`/api/cradit_limit_call_test/${itemData._id || itemData.id}`, {
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
                const order = ["Fund Added", "Credit Given", "Called", "Assigned"];
                const indexA = order.indexOf(a.status);
                const indexB = order.indexOf(b.status);
            
                return indexA - indexB;
                return Object.entries(b).length - Object.entries(a).length;
            }));
        }
    }, [agent, customers])

    const [todayData, setTodayData] = useState([]);

    useEffect(() => {
        getUser();
    }, []);
    useEffect(() => {
        if (user.user_id){
            setAgent(user.user_id);
        }
    }, [user]);
    
    
    useEffect(() => {
        const fetchData = async () => {
        fetchCustomersOnVaction();
            const result = await fetchCreditLimitCalls();
            const sortResult = result.sort((a, b) => {
                // Define the order of statuses
                const order = ["Fund Added", "Credit Given", "Called", "Assigned"];
                const indexA = order.indexOf(a.status);
                const indexB = order.indexOf(b.status);
            
                return indexA - indexB;
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
        if(user.user_id){
            fetchData();
        }
        setActiveTab("Total Customers")
    }, [selectedDate, user]);



    useEffect(() => {
        if(lowCreditReport.length > 0 && customers.length > 0){
            const data = customers.map(item =>{
                const temp = lowCreditReport.filter(item1 => item1.customer_id === item.customer_id);
                
                return {...temp[0], ...item};
            })
            setCustomers(data)
            
        }
        
    }, [lowCreditReport]);

    const exportToCSV = () => {
        const headers = [
          "S.No.", "Customer ID", "Customer Name", "Phone Number", "Credit Limit", "Wallet Balance", "Total Price", "Required Balance", "Status"
        ];
        
        const rows = showData.map((report, index) => [
          index + 1,
          report.customer_id || " ",
          report.customer_name || " ",
          report.customer_phone || " ",
          report.credit_limit || " ",
          report.wallet_balance || " ",
          report.total_price || " ",
          report.requiredBalance || " ",
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
        
        <Card className="p-3  shadow-sm mb-4">
                            <h4 className="text-primary fw-bold mb-0">Low Credit Report</h4>
                        </Card>

              <Card className="p-4 shadow-sm border-0 mb-4 bg-light">
                    <h5 className="fw-bold mb-3">Summary</h5>
              {/* Statistics Cards */}
              <div className="d-flex flex-wrap gap-3">
{[
          { title: "Total Customers", value: data.length },
          { title: "Total Called", value: totalCalled || 0 },
          { title: "Fund Added", value: totalFundAdded || 0 },
          { title: "Credit Given", value: totalCreditGiven || 0 },
          { title: "No Action", value: totalNoAction || 0 },
          isToday && { title: "Total Order Value", value: `₹ ${totalOrdersAgent}` },
          isToday && { title: "Total Credit Required", value: `₹ ${totalCreditRequiredAgent}` },
        ]
                  .filter(Boolean)
                  .map((item, index) => (
                    <div
                      key={index}
                      className={`card p-3 shadow-sm rounded flex-fill text-center ${activeTab === item.title ? "bg-primary text-white" : "bg-light"}`}
                      style={{ cursor: "pointer", minWidth: "150px" }}
                      onClick={() => setActiveTab(item.title)}
                    >
                      <p className="fw-bold mb-1">{item.title}</p>
                      <h4 className="mb-0">{item.value}</h4>
                    </div>
                  ))}
              </div>
              </Card>
              <Card className="p-4 shadow-sm border-0 mb-4 bg-light">
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h5 className="fw-bold">Customers</h5>
    <div className="d-flex gap-3">
      <div className="d-flex align-items-center gap-2" style={{ position: "relative", zIndex: 10 }}>
        <label className="fw-semibold text-primary">📅 Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="form-control border-primary shadow-sm w-auto"
          dateFormat="dd-MM-yyyy"
          maxDate={new Date()}
          placeholderText="Select a date"
        />
      </div>
      <Button variant="success" onClick={exportToCSV} size="sm">Export to CSV</Button>
    </div>
  </div>

  {/* Table Section */}

  <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
    <Table striped bordered hover className="mb-0">
      <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 5 }}>
        <tr>
          <th>S.No.</th>
          <th>Customer ID</th>
          <th>Customer Name</th>
          <th>Phone Number</th>
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
              <td>{report.total_price}</td>
              <td>{report.requiredBalance}</td>
                <td>{report.credit_limit}</td>
                <td>{report.wallet_balance}</td>
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
</Card>

            {/* </div> */}
          </>
        
    );
};

