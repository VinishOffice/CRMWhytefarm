import React, { useState , useEffect,useContext } from "react";
import { Button} from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import ExportTableToExcel from "./ExportTableToExcel";
import Moment from "moment";
import { extendMoment } from "moment-range";
import DatePicker from "react-datepicker";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { getUserInfo,handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import 'jspdf-autotable';
import { FaExclamationTriangle } from "react-icons/fa";
import toast from "react-hot-toast";
import {
    fetchLowCreditReport,
    fetchTodayCreditHistory,
    giveCreditToCustomers,
} from "./services/customerOperationsService";
function GiveCreaditToAll() {
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
    const { loggedIn, userId, username, loggedIn_user } = getUserInfo();
    const [lowCreditReport, setLowCreditReport] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [initialValue, setInitialvalue] = useState("");
    const [fromDate, setFromDate] = useState('');
    const [totalCreditRequired, setTotalCreditRequired] = useState(0);
    const [totalOrdersAmount, setTotalOrdersAmount] = useState(0);
    const [vacationsData , setVacationsData] = useState([]);
    const [calendarData , setCalendarData] = useState([]);
    const [initalSubsData , setInitialSubsData] = useState([]);
    const [updating , setUpdating] = useState(false);
    const [loadSearch , setLoadSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isSearch, setIsSearch] = useState(true);
    
    const moment = extendMoment(Moment);

    useEffect(() => {
        setLoadSearch(true);
        const date = new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() +1);
        setFromDate(tomorrow);
        setLoadSearch(false);
    }, []);

    const handleFromDateChange = (date) => {
        setFromDate(date);
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
                    await giveCreditToCustomers({
                        items: lowCreditReport.map((c) => ({
                            customer_id: c.customer_id,
                            requiredBalance: c.requiredBalance,
                        })),
                        userId,
                        userName: loggedIn_user,
                        user: loggedIn,
                    });
                    
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
        const resp = await fetchTodayCreditHistory();
        return resp.data || [];
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
    
    const handleSearch = async () => {
        Toast.fire({
            icon: "success",
            title: "Fetching Data ...",
          });
        setIsSearch(true)
        setShowSpinner(true);
        setDataLoaded(false);
        setInitialvalue("");
        try {
            const resp = await fetchLowCreditReport({
                deliveryDate: fromDate ? fromDate.toISOString() : undefined,
            });

            if ((resp.data || []).length > 0) {
                setLowCreditReport(resp.data || []);
                setTotalCreditRequired(resp.totals?.totalCreditRequired || 0);
                setTotalOrdersAmount(resp.totals?.totalOrdersAmount || 0);
                setDataLoaded(true);
            } else {
                setLowCreditReport([]);
                setInitialvalue("No Data Found");
            }
        } catch (e) {
            console.error(e);
            setLowCreditReport([]);
            setInitialvalue("Failed to fetch report");
        }
        Toast.fire({
            icon: "success",
            title: "Data Fetched...",
          });
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
            "S.No.", "Customer Id", "Customer Name", "Phone Number", "Credit Limit","Credit Date"
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
      
        // Save the PDF with the appropriate filename
        doc.save("LowCreditReport.pdf");
      };
      
    const exportToCSV = () => {
        let csvHeader = []
        let csvRows = []
        if(isSearch){
            csvHeader = [ "Customer ID", "Customer Name", "Phone Number", "Hub Name", "Current Wallet Balance", "Total Orders Amount", "Required Credit",].join(",") + "\n"; 
            
            csvRows = lowCreditReport.map(customer => [
                customer.customer_id,
                customer.customer_name,
                customer.customer_phone,
                customer.hub_name,
                customer.wallet_balance,
                customer.total_price,
                customer.requiredBalance,
            ].join(",")).join("\n"); 
        }else{
            csvHeader = ["S.No.", "Customer Id", "Customer Name", "Phone Number", "Credit Limit","Credit Date"].join(",") + "\n"; 
        
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
           
           {/* <Button
              variant="primary"
              className="w-100"
    onClick={async () => {
        await handleSearch(); 
        updateCustomerCreditLimits();
    }} 
    disabled={loadSearch || updating}
>
    Give Credit To All
</Button> */}
<Button
                variant="outline-warning"
                className="w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
                onClick={async () => {
                    await handleSearch();
                    updateCustomerCreditLimits();
                }}
                disabled={loadSearch || updating}
            >
                <FaExclamationTriangle /> Give Credit
            </Button>


        </>
    );
}

export default GiveCreaditToAll;