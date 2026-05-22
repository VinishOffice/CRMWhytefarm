import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import Customers from "./Customers";
import HubDist from "./HubDist";
import Location from "./Location";
import Products from "./Products";
import ProfilePage from "./ProfilePage";
import RoutesData from "./Routes";
import Users from "./Users";
import Banner from "./Banner";
import Reports from "./Reports";
import Tickets from "./Tickets";
import UsersLevel from "./UsersLevel";
import OrderSheet from "./OrderSheet";
import HubDeliveryReport from "./HubDeliveryReport";
import UserProfile from "./UserProfile";
import Login from "./Login";
import Signup from "./Signup";
import PermissionDenied from "./PermissionDenied";
import SalesReport from "./SalesReport";
import CumulativeSalesReport from "./CumulativeSalesReport";
import LowCreditReport from "./LowCreditReport";
import NewOnboardCustomers from "./NewOnboardCustomers";
import ReturnReport from "./ReturnReport";
import Ordersorting from "./Ordersorting";
import WalletTxnsReport from "./WalletTxnsReport";
import OrderReport from "./OrderReport";
import OneTimeOrders from "./OnetimeOrders";
import ActivityLogs from "./ActivityLogs";
import SubscriptionReport from "./SubscriptionReport";
import PayUMoneyPayment from "./Payment";
import EditCustomers from "./EditCustomer";
import PredictiveAnalysis from "./PredictiveAnalysis";
import Lead from "./pages/Lead";
import CafeManagement from "./pages/CafeManagement/CafeManagement";
import CustomerReport from "./components/CustomerReport";
import CafeSummary from "./pages/CafeManagement/Summary/CafeSummary";
import Marketing from "./Marketing";
import Dashboard from "./Dashboard";
import CurrentSubscripations from "./CurrentSubscripations";
import CustomerVactios from "./CustomerVactios";
import BulkUpdateReport from "./BulkUpdateReport";
import MarkatingDashboard from "./pages/Markating/Dashboard/MarkatingDashboard";
import RecurringCustomers from "./pages/Markating/Dashboard/RecurringCustomers";
import Inventory_Main from "./pages/Inventory-Management/Main";
import Markating_Main from "./pages/Markating/Main";
import B2bBanner from "./B2bBanner";
import CashCollection from "./CashCollection";

import Communication_Home from "./pages/Communication/Communication";
import Communication from "./pages/Communication/MainCommunication";
import LowCreditReportForCustomerCare from "./LowCreditReportForCustomerCare";
import LowBalanceAllotment from "./TableForCustomerCare";
import Newreport from "./pages/Newreport";
import OnBoardDashBoard from "./pages/OnBoard/OnBoardDashBoard";
import TableCod from "./TableCod";
import OrderSumaryPage from "./OrderSumaryPage";
import Autopaused from "./Autopaused";
import PausedSubscriptions from "./PausedSubscription";

import DailyOrdersReport from "./DailyOrdersReport";
import WalletBalanceReport from "./WalletBalanceReport";
import CustomerLifecycleReport from "./CustomerLifeCycle";
import FutureOrderReport from "./FutureOrderReport";

import TransferHubLocationModal from "./TransferHubLocationModal";


export default function Navigator() { 
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Dashboard/>} />
                <Route path="/location" caseSensitive={false} element={<Location />}  />
                <Route path="/routes" caseSensitive={false} element={<RoutesData />}  />
                <Route path="/customers" caseSensitive={false} element={<Customers />}  />
                <Route path="/vendors_data" caseSensitive={false} element={<HubDist />}  />
                <Route path="/products" caseSensitive={false} element={<Products />}  />
                <Route path="/banners" caseSensitive={false} element={<Banner />}  />
                <Route path="/marketing" caseSensitive={false} element={<Marketing />}  />
                <Route path="/tickets" caseSensitive={false} element={<Tickets />}  />
                <Route path="/reports" caseSensitive={false} element={<Reports />}  />
                <Route path="/profile/:id" caseSensitive={false} element={<ProfilePage />}  />
                <Route path="/users" caseSensitive={false} element={<Users />}  />
                <Route path="/users_level" caseSensitive={false} element={<UsersLevel />}  />
                <Route path="/orderSheet" caseSensitive={false} element={<OrderSheet />}  />
                <Route path="/ordersorting" caseSensitive={false} element={<Ordersorting />}  />
                <Route path="/lowcreditreport" caseSensitive={false} element={<LowCreditReport />}  />
                <Route path="/newonboardcustomer" caseSensitive={false} element={<NewOnboardCustomers />}  />
                <Route path="/hubdeliveryreport" caseSensitive={false} element={<HubDeliveryReport />}  />
                <Route path="/profile" caseSensitive={false} element={<UserProfile />} />
                <Route path="/return_report" element={<ReturnReport />} />
                <Route path="/permission_denied" element={<PermissionDenied />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/salesReport" caseSensitive={false} element={<SalesReport />} />
                <Route path="/cumulativeSalesReport" caseSensitive={false} element={<CumulativeSalesReport />} />
                <Route path="/wallettransactions" caseSensitive={false} element={<WalletTxnsReport />} />                
                <Route path="/orderreport" caseSensitive={false} element={<OrderReport />} />
                <Route path="/onetimeorders" caseSensitive={false} element={<OneTimeOrders />} />
                <Route path="/activitylogs" caseSensitive={false} element={<ActivityLogs />} />
                <Route path="/subscriptionreport" caseSensitive={false} element={<SubscriptionReport />} />
                <Route path="/payment" caseSensitive={false} element={<PayUMoneyPayment />} />
                <Route path="/edit_customers/:id" caseSensitive={false} element={<EditCustomers />} />
                <Route path="/predictiveanalysis" caseSensitive={false} element={<PredictiveAnalysis />} />
                <Route path="/leads/:task_id"  caseSensitive={false} element={<Lead />} />
                <Route path="/cafe-management" caseSensitive={false} element={<CafeManagement />} />
                <Route path="customers_report/" caseSensitive={false} element={<CustomerReport />} />     
                <Route path="/cafe-summary" caseSensitive={false} element={<CafeSummary />} />
                <Route path="/cart-products" caseSensitive={false} element={<MarkatingDashboard />} />
                <Route path="/current_subscripations" caseSensitive={false} element={<CurrentSubscripations />} />
                <Route path="/customer_vactions" caseSensitive={false} element={<CustomerVactios/>} />
                <Route path="/bulk_update_report" caseSensitive={false} element={<BulkUpdateReport/>} />
                <Route path="/recurring-customers" caseSensitive={false} element={<RecurringCustomers />} />
                <Route path="/utm-report" caseSensitive={false} element={<Markating_Main value={"UTMReport"} />} />
                <Route path="/inventory-management" caseSensitive={false} element={<Inventory_Main />} />
                <Route path="/conversation-logs-report" caseSensitive={false} element={<Newreport/>} />
                
                <Route path="/b2b_banner" caseSensitive={false} element={<B2bBanner />} />
                <Route path="/communication" caseSensitive={false} element={<Communication />} />  
                <Route path="/cash-collection" caseSensitive={false} element={<CashCollection />} />
                <Route path="/onboard" caseSensitive={false} element={<OnBoardDashBoard />} />
                <Route path="/TableCod" caseSensitive={false} element={<TableCod />} />
                <Route path="/OrderSumary" caseSensitive={false} element={<OrderSumaryPage />} />
                <Route path="/Autopaused" caseSensitive={false} element={<Autopaused />} />
                <Route path="/paused" caseSensitive={false} element={<PausedSubscriptions />} />
                <Route path="/order" caseSensitive={false} element={< DailyOrdersReport/>} />
                <Route path="/wallet-report" caseSensitive={false} element={< WalletBalanceReport/>} />
                <Route path="/cycle" caseSensitive={false} element={< CustomerLifecycleReport/>} />
                <Route path="/Future" caseSensitive={false} element={< FutureOrderReport/>} />
                <Route path="/locationtest" caseSensitive={false} element={< TransferHubLocationModal/>} />

               
               

               
                

                <Route path="/lowbalance-assign-task" caseSensitive={false} element={<LowBalanceAllotment />} />  
                <Route path="/lowcreditreportforcustomer" caseSensitive={false} element={<LowCreditReportForCustomerCare />}  />
      </Routes>
    </Router>
  );
}
