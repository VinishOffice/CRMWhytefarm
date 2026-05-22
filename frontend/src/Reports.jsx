import React, { useState, useEffect, useContext } from "react";
import Sidebar from "./Sidebar";
import TopPanel from "./TopPanel";
import { Card } from 'react-bootstrap';
import GlobalContext from "./context/GlobalContext";
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import { handleLogout } from './Utility';
function Reports() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes('reports')) {
          handleLogout()
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);

  const [showReports, setShowReports] = useState(true);


  const clickLowCreditReport = () => {
    if (permissible_roles.includes("low_credit_report")) {
      const url = '/lowcreditreport';
      navigate(url);
    } else {
      rolePermission()
    }
  }
  const clickLowCreditReportForCustomerCare = () => {
    if (permissible_roles.includes("low_credit_report")) {
      const url = '/lowcreditreportforcustomer';
      navigate(url);
    } else {
      rolePermission()
    }
  }

  const clickWalletTransactions = () => {
    if (permissible_roles.includes("wallet_transaction_report")) {
      const url = '/wallettransactions';
      navigate(url);
    } else {
      rolePermission()
    }
    // const newTab = window.open(url, '_blank');
    // newTab.focus();
  }



  const loadOnBoardReport = () => {
    if (permissible_roles.includes("on_board_report")) {
      const url = '/newonboardcustomer';
      navigate(url);
    } else {
      rolePermission()
    }


  }

  const navigateToOrderSheet = () => {
    if (permissible_roles.includes("order_sheet_report")) {
      const url = '/orderSheet';
      navigate(url);
    } else {
      rolePermission()
    }
  }

  const navigateToHubDeliveryReport = () => {
    if (permissible_roles.includes("hub_deliveries_report")) {
      const url = '/hubdeliveryreport';
      navigate(url);
    } else {
      rolePermission()
    }
  }

  const navigateToSubscripationReport = () => {
    if (permissible_roles.includes("subscription_report")) {
      const url = '/subscriptionreport';
      navigate(url);
    } else {
      rolePermission()
    }
  };


  const navigateToCustomerVactionsReport = () => {
    if (permissible_roles.includes("customer_vactions")) {
      const url = '/customer_vactions';
      navigate(url);
    } else {
      rolePermission()
    }
  };


  const navigateToBlukUpdateReport = () => {
    if (permissible_roles.includes("bluk_quantity")) {
      const url = '/bluck_update_report';
      navigate(url);
    } else {
      rolePermission()
    }
  };


  const navigateToPredictiveAnalysis = () => {
    if (permissible_roles.includes("predictive_analysis")) {
      const url = '/predictiveanalysis';
      navigate(url);
    } else {
      rolePermission()
    }
  }
  const navigateToFuturePrediction = () => {
    if (permissible_roles.includes("future_prediction_report")) {
      const url = '/Future';
      navigate(url);
    } else {
      rolePermission()
    }
  }

  const navigateToSalesReport = () => {
    if (permissible_roles.includes("customer_sales_report")) {
      const url = '/salesReport';
      navigate(url);
    } else {
      rolePermission()
    }

  }

  const navigateToCumulativeSalesReport = () => {
    if (permissible_roles.includes("cumalative_sales_report")) {
      const url = '/cumulativeSalesReport';
      navigate(url);
    } else {
      rolePermission()
    }

  }

  const navigateToOrderSorting = () => {
    if (permissible_roles.includes("order_sorting_report")) {
      const url = '/ordersorting';
      navigate(url);
    } else {
      rolePermission()
    }
  }
  const navigateToCashColection = () => {
    if (permissible_roles.includes("cash_colection")) {
      const url = '/cash-collection';
      navigate(url);
    } else {
      rolePermission()
    }
  }
  const navigateToConversationLogsReport = () => {
    if(permissible_roles.includes("conversation_logs_report")){
      const url = '/conversation-logs-report';
      navigate(url);
    }else{
      rolePermission()
    }
  }
  const navigateToAutoPausedReport = () => {
    if(permissible_roles.includes("Auto_Paused_report")){
      const url = '/Autopaused';
      navigate(url);
    }else{
      rolePermission()
    }
  }
  const navigateToPausedReport = () => {
    if(permissible_roles.includes("paused_report")){
      
      const url = '/paused';
      navigate(url);
    }else{
      rolePermission()
    }
  }
  const navigateToWalletReport = () => {
    if(permissible_roles.includes("wallet__report")){
      
      const url = '/wallet-report';
      navigate(url);
    }else{
      rolePermission()
    }
  }

const navigateTocustomerLifeCycleReport = () => {
    if(permissible_roles.includes("customer_life_report")){
      
      const url = '/cycle';
      navigate(url);
    }else{
      rolePermission()
    }
  }

   

  const navigateToActivitylogs = () => {
    if (permissible_roles.includes("activity_logs_report")) {
      const url = '/activitylogs'
      navigate(url);
    } else {
      rolePermission()
    }
  }


  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: '#d7e7e6',
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: 'error',
      title: 'You are not authorised to do this action'
    });

  }


  return (
    <>

      <div class="container-scroller">
        <TopPanel />
        <div class="container-fluid page-body-wrapper">
          <Sidebar />
          <div class="main-panel">
            <div class="content-wrapper">
              <div class="col-lg-12 grid-margin stretch-card">
                <div class="card" style={{ background: '#4a54ba' }}>
                  <div class="card-body">
                    {showReports && <div>
                      <h4 class="card-title" style={{ color: '#fff', fontWeight: '700' }}>Reports</h4>

                      <Card>
                        <Card.Body>
                          <Card.Title>Customer Reports</Card.Title>
                          <Card.Text>
                            <br />
                          </Card.Text>
                          <div class="d-flex flex-row flex-wrap gap-1">
                            <button type="button" class="btn btn-success btn-rounded btn-sm  " onClick={clickLowCreditReport}
                            >
                              Low Credit Reports
                            </button>
                            <button type="button" class="btn btn-success btn-rounded btn-sm  " onClick={clickLowCreditReportForCustomerCare}
                            >
                              Give Credit To All
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "
                              onClick={loadOnBoardReport}
                            >
                              Onboard Report
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToConversationLogsReport}
                            >
                              Conversation Logs Report
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateTocustomerLifeCycleReport}
                            >
                            customer Life Cycle Report
                            </button>
                          </div>

                        </Card.Body>
                      </Card>
                      <br />

                      <Card>
                        <Card.Body>
                          <Card.Title>Predictive</Card.Title>
                          <Card.Text>
                            <br />
                          </Card.Text>
                          <div class="d-flex flex-row flex-wrap gap-1">
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm"
                              style={{ color: "white" }}
                              onClick={navigateToPredictiveAnalysis}
                            >
                              Predictive Analysis
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm"
                              style={{ color: "white" }}
                              onClick={navigateToFuturePrediction}
                            >
                            Future Prediction Report
                            </button>
                          </div>
                        </Card.Body>
                      </Card>
                      <br />
                      <Card>
                        <Card.Body>
                          <Card.Title>Operations</Card.Title>
                          <Card.Text>
                            <br />
                          </Card.Text>
                          <div class="d-flex flex-row flex-wrap gap-2"><button
                            type="button"
                            class="btn btn-success btn-rounded btn-sm  "

                            onClick={navigateToHubDeliveryReport}
                          >
                            Hub Deliveries
                          </button>

                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm"
                              onClick={navigateToSubscripationReport}
                            >
                              Subscription Report
                            </button>

                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm"
                              onClick={navigateToCustomerVactionsReport}
                            >
                              Vacation Report
                            </button>

                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm"
                              onClick={navigateToBlukUpdateReport}
                            >
                              Bulk Report
                            </button>



                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToOrderSheet}
                            >
                              Order Sheet
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToOrderSorting}
                            >
                              Order Sorting
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToCashColection}
                            >
                              Cash Collection
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToAutoPausedReport}
                            >
                              AutoPaused Report
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToPausedReport}
                            >
                              Paused Report
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToWalletReport}
                            >
                              Wallet Report
                            </button>
                            
                           
                            
                          </div>
                        </Card.Body>
                      </Card>
                      <br />
                      <Card>
                        <Card.Body>
                          <Card.Title>Finance</Card.Title>
                          <Card.Text>
                            <br />
                          </Card.Text>
                          <div class="d-flex flex-row flex-wrap gap-1">
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={navigateToCumulativeSalesReport}
                            >
                              Cumulative Sales
                            </button>

                            <button
                              type="button" class="btn btn-success btn-rounded btn-sm" onClick={navigateToSalesReport}>
                              Customer Sales (Sales Report)
                            </button>
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "

                              onClick={clickWalletTransactions}
                            >
                              Wallet Transactions
                            </button>
                          </div>

                        </Card.Body>
                      </Card>
                      <br />
                      <Card>
                        <Card.Body>
                          <Card.Title>Logs</Card.Title>
                          <Card.Text>
                            <br />
                          </Card.Text>
                          <div class="d-flex flex-row flex-wrap gap-1">
                            <button
                              type="button"
                              class="btn btn-success btn-rounded btn-sm  "
                              style={{ background: '#84bf93' }}
                              onClick={navigateToActivitylogs}
                            >
                              Activity Logs
                            </button>
                          </div>

                        </Card.Body>
                      </Card>
                    </div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Reports;
