import React, { useState, useEffect, useContext } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { useNavigate } from "react-router-dom";
import ExportTableToExcel from "./ExportTableToExcel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  fetch_records,
  create_record,
  generate_random_id,
  fetch_records_with_limit,
} from "./helpers";
import { getAllData, getUserInfo, handleLogout } from "./Utility";
import GlobalContext from "./context/GlobalContext";
import FollowUpModal from "./components/Modals/FollowUpModal";
import Lead from "./pages/Lead";
import apiClient from "./services/apiClient";

function NewOnboardCustomers() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  const handleCustomerROwClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes("on_board_report")) {
          handleLogout();
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);

  const { userId } = getUserInfo();
  const moment = extendMoment(Moment);

  // Load fromDate and toDate from sessionStorage on mount
  const [fromDate, setFromDate] = useState(() => {
    const storedFromDate = sessionStorage.getItem("fromDate");
    return storedFromDate ? new Date(storedFromDate) : null;
  });
  const [toDate, setToDate] = useState(() => {
    const storedToDate = sessionStorage.getItem("toDate");
    return storedToDate ? new Date(storedToDate) : null;
  });

  const [loagingFeedback, setLoagingFeedback] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [task_id, setTask_id] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [OnboardedCustomer, setOnboardedCustomer] = useState([]);
  const [OnboardedCustomerCopy, setOnboardedCustomerCopy] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [customerFeedbackData, setCustomerFeedbackData] = useState([]);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [initialValue, setInitialvalue] = useState("No Data Found");
  const [followUps, setFollowUps] = useState([]);
  const [customerIdAndAssign, SetCustomerIdAndAssign] = useState("");
  const [availableAgent, SetAvailableAgent] = useState([]);  
  // Update sessionStorage when fromDate changes
  useEffect(() => {
    if (fromDate) {
      sessionStorage.setItem("fromDate", fromDate.toISOString());
    } else {
      sessionStorage.removeItem("fromDate");
    }
  }, [fromDate]);

  // Update sessionStorage when toDate changes
  useEffect(() => {
    if (toDate) {
      sessionStorage.setItem("toDate", toDate.toISOString());
    } else {
      sessionStorage.removeItem("toDate");
    }
  }, [toDate]);

  const handleFromDateChange = (date) => {
    setShow(false);
    setFromDate(date);
  };

  const handleToDateChange = (date) => {
    setShow(false);
    if (date) {
      const updatedDate = new Date(date);
      updatedDate.setHours(23, 59, 59, 999);
      setToDate(updatedDate);
    } else {
      setToDate(null);
    }
  };

  useEffect(() => {
    const fetchFollowUP = async () => {
      const Data = await fetch_records("conversation_logs", [
        {
          key: "followup_required",
          operator: "==",
          value: true,
        },
        {
          key: "follow_up_date",
          operator: "==",
          value: moment().format("YYYY-MM-DD"),
        },
      ]);
      const formateData = Data.map((item) => {
        return {
          id: item.id,
          ...item.data,
        };
      });

      console.table(formateData);
      setFollowUps(formateData.filter(f => (f.disposition === "Onboard" && f.sub_disposition === "Follow up"))
);
    };
    fetchFollowUP();
  }, []);
  const handleSearch = async () => {
    setShow(false);
    if (!fromDate) {
        toast.error("Please enter from date");
        return;
    } else {
      setShowSpinner(true);
      try {
        const filters = [{ field: "registered_date", op: ">=", value: fromDate }];
        if (toDate) {
          filters.push({ field: "registered_date", op: "<", value: toDate });
        }

        // Execute the query
        const customersData = await apiClient.post("/api/customers_data/query", { filters })
            .then(res => res.data?.data || []);

        if (customersData.length > 0) {
          setDataLoaded(true);

          setOnboardedCustomer(customersData);     //tushar
          setOnboardedCustomerCopy(customersData);
        } else {
          
          setDataLoaded(false);
          setInitialvalue("No data found");
        }
        setShowSpinner(false);
        renderPageButtons();
      } catch (error) {
        console.error("Error fetching customers data:", error);
      }
    }
  };
 
  const handleSearchFidBack = async () => {
    setLoagingFeedback(true);
    if (OnboardedCustomer && OnboardedCustomer.length > 0) {

      try {
        const customerIds = OnboardedCustomer.map((item) => item.customer_id);

        const chunkArray = (arr, size) => {
          const result = [];
          for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
          }
          return result;
        };

        const chunks = chunkArray(customerIds, 10);
        console.log(`📦 Splitting into ${chunks.length} chunks (max 10 per query)`);

        const feedbackMap = {};

        for (let i = 0; i < chunks.length; i++) {
          const docs = await apiClient.post("/api/customer_feedback/query", {
            filters: [{ field: "customer_id", op: "in", value: chunks[i] }]
          }).then(res => res.data?.data || []);

          console.log(`📥 Received ${docs.length} feedback entries for chunk ${i + 1}`);
          docs.forEach((feedbackData) => {
            feedbackMap[feedbackData.customer_id] = feedbackData;
          });
        }

        const updatedData = OnboardedCustomer.map((customer) => {
          const feedback = feedbackMap[customer.customer_id];
          const feedbackAttend = feedback ? 1 : 0;
          return { ...customer, feedback: feedback || null, feedbackAttend };
         
          
        });

        setOnboardedCustomer(updatedData);

      } catch (error) {
        console.error("❌ Error fetching customer feedback data:", error);
      }
    } else {
    }
    setLoagingFeedback(false);
  };

  useEffect(() => {
    
    if (OnboardedCustomer && OnboardedCustomer.length > 0) {
      handleSearchFidBack();
    }
  }, [fromDate, OnboardedCustomer, handleSearchFidBack]);

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setShow(false);
    setInitialvalue("");
    setOnboardedCustomer([]);
    setOnboardedCustomerCopy([]);
    sessionStorage.removeItem("fromDate");
    sessionStorage.removeItem("toDate");
  };

  // New handler to clear stored dates and reset state

  const SpinnerOverlay = () => (
    <div className="spinner-overlay">
      <div className="spinner"></div>
    </div>
  );

  // Determine the range of page numbers to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = OnboardedCustomer.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  console.log(currentItems);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const total = Math.ceil(OnboardedCustomer.length / itemsPerPage);
    setTotalPages(total);
  }, [OnboardedCustomer.length, itemsPerPage]);
 

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

  const [feedbackDate, setfeedbackDate] = useState(null);
  const [remark, setRemark] = useState("");
  const [showFeecback, setShowFeedback] = useState(false);
  const [showFOllowUp, setShowFollowUp] = useState(false);
  const [selectedHub, setSelectedHub] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState();
  const [show, setShow] = useState(false);
  const [loadFeedbackData, setLoadFeedbackData] = useState(false);

  const handleSubmit = async () => {
    try {
      const feedbackId = new Date().getTime().toString(); // Temporary ID

      await apiClient.post("/api/customer_feedback", {
        customer_id: selectedCustomer.customer_id,
        feedback_id: feedbackId,
        feedback_date: feedbackDate,
        remarks: remark,
        created_date: new Date(),
        created_on: moment().format("YYYY-MM-DD"),
        created_by: userId,
      });
      closeAddFeedback();
      retrieveData(selectedCustomer.customer_id);
      toast.success("Feedback added Successfully");
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("There is error while adding feedback");
    }
  };

  const feedbackInfodata = async (customerId) => {
    try {
      const fetchedData = await apiClient.post("/api/customer_feedback/query", {
        filters: [{ field: "customer_id", op: "==", value: customerId }]
      }).then(res => res.data?.data || []);
      return fetchedData;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  };

  const retrieveData = async (customerId) => {
    const data = await feedbackInfodata(customerId);

    if (data.length >= 1) {
      setCustomerFeedbackData(data);
      setLoadFeedbackData(true);
    } else {
      setCustomerFeedbackData([]);
      setLoadFeedbackData(true);
    }
  };

  const handleFeedback = async (selectedCustomer) => {
    setSelectedCustomer(selectedCustomer);
    await retrieveData(selectedCustomer.customer_id);
    setShowFeedback(true);
  };
  const handleFollowUp = async () => {
    setShowFollowUp(true);
  };

  const handleClose = () => {
    
    setShowFeedback(false);
    setShowAddFeedbackModal(false);
    setShowFollowUp(false);
    setShowLeadModal(false);
    RefineTasksDataWithIdAndAgent();
    
  };

  const closeAddFeedback = () => {
    setShowAddFeedbackModal(false);
  };

  const handleAddFeedback = () => {
    setfeedbackDate(null);
    setRemark("");
    setShowAddFeedbackModal(true);
  };

  const checklead = (customer_id, customer_name, customer_phone) => {
    let task_id = null;
    fetch_records_with_limit(
      "tasks",
      { key: "customer_id", value: customer_id, operator: "==" },      
      1, //limit
      true, // require_sorting
      "created_at", // orderByField
      "desc" // orderDirection
    ).then((data) => {
      if (data) {
        task_id = data.task_id;
      } else {
        task_id = generate_random_id(8);
        create_record("tasks", {
          task_id: task_id,
          customer_id: customer_id,
          customer_name: customer_name,
          customer_phone: customer_phone,
          attempts: 0,
          assign_to: "",
          status: "LEAD",
        });
      }

      // Navigate to the leads page with task_id
      // navigate(`/leads/${task_id}`);
      setTask_id(task_id);
      setShowLeadModal(true);
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Sr No",
      "Customer ID",
      "Customer Name",
      "Phone Number",
      "Customer Email",
      "Hub Name\t",
      "Wallet Balance",
      "Registered On",
    ];
    const tableRows = OnboardedCustomer.map((customer, index) => [
      index + 1,
      customer.customer_id,
      customer.customer_name,
      customer.customer_phone,
      customer.customer_email,
      customer.hub_name,
      customer.wallet_balance,
      customer.created_date &&
        moment(customer.created_date.seconds ? customer.created_date.seconds * 1000 : customer.created_date).format(
          "DD/MM/YY, h:mm a"
        ),
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("OnBoardCustomer.pdf");
  };

  const exportToCSV = () => {
    // Define the CSV columns
    const csvColumns = [
      "Sr No",
      "Customer ID",
      "Customer Name",
      "Phone Number",
      "Customer Email",
      "Hub Name",
      "Wallet Balance",
      "Registered On",
    ];

    // Create CSV rows
    const csvRows = OnboardedCustomer.map((customer, index) => [
      index + 1,
      customer.customer_id,
      customer.customer_name,
      customer.customer_phone,
      customer.customer_email,
      customer.hub_name,
      customer.wallet_balance,
      customer.created_date &&
        moment(customer.created_date.seconds ? customer.created_date.seconds * 1000 : customer.created_date).format("DD/MM/YY, h:mm a"),
    ]);

    // Combine columns and rows into a single CSV content
    const csvContent = [
      csvColumns.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link element for downloading
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "OnBoardCustomer.csv");
    link.style.visibility = "hidden";

    // Append the link to the body
    document.body.appendChild(link);
    link.click(); // Simulate a click on the link
    document.body.removeChild(link); // Remove the link after download
  };

  //Mapping assign agent with customer_id..
  const RefineTasksDataWithIdAndAgent = async () => {
    const data = await getAllData("tasks");    
    const obj = {};
    if (data) {
      data.forEach((e) => {
        if(e.data().assign_to) obj[e.data().customer_id] = e.data().assign_to;
      });
    }
    SetCustomerIdAndAssign(obj);
  };

  useEffect(() => {
    RefineTasksDataWithIdAndAgent();
  }, []);

  useEffect(() => {
    fetch_records("users", [
      {
        key: "role",
        value: ["Customer Care Agent", "Customer Support Team Lead"], // Specify required roles
        operator: "in",
      },
    ]).then((data) => {
      
      SetAvailableAgent(data);
    });
  }, []);

  //
  const FilterByAgent = (agentName) => {    
    const arr = [];
    if (agentName !== "clear") {
      for (let key in customerIdAndAssign) {
        if (customerIdAndAssign[key] === agentName) arr.push(key);
      }
      if (OnboardedCustomerCopy.length > 0) {
        const filteredOnboardCustomer = OnboardedCustomerCopy.filter((cus) =>
          arr.includes(cus.customer_id)
        );
        setOnboardedCustomer(filteredOnboardCustomer);
      } else {
        alert("No onboard customer available");
      }
    }
    else {
      setOnboardedCustomer(OnboardedCustomerCopy);
    }

  }

  return (
    <div style={{ minHeight: "95vh" }}>
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
          <h4 className="text-success fw-bold mb-2">NEW ONBOARD CUSTOMER</h4>
          <div className="d-flex gap-2">
            {dataLoaded && (
              <>
                <ExportTableToExcel
                  tableId="new_onboard_customers"
                  fileName="new_onboard_customers"
                  className="btn btn-success btn-sm"
                />
                <button
                  className="btn btn-success btn-sm ms-2"
                  onClick={exportToPDF}
                >
                  Export PDF
                </button>
                <button
                  className="btn btn-success btn-sm ms-2"
                  onClick={exportToCSV}
                >
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body" style={{ zIndex: 1050 }}>
            <div className="d-flex justify-content-between align-items-end w-auto">
              <div className="d-flex flex-wrap gap-3 align-items-end ">
                {/* From Date */}
                <div
                  className="d-flex flex-column flex-grow-1"
                  style={{ minWidth: "200px", maxWidth: "280px" }}
                >
                  <label className="form-label">From Date:</label>
                  <div style={{ zIndex: 9999, position: "relative" }}></div>
                  <DatePicker
                    selected={fromDate}
                    maxDate={toDate}
                    onChange={handleFromDateChange}
                    dateFormat="dd/MM/yyyy" // Format for displaying the date
                    className="form-control"
                    placeholderText="Select date"
                  />
                </div>

                {/* To Date */}
                <div
                  className="d-flex flex-column flex-grow-1"
                  style={{ minWidth: "200px", maxWidth: "280px" }}
                >
                  <label className="form-label">To Date:</label>
                  <DatePicker
                    selected={toDate}
                    minDate={fromDate}
                    onChange={handleToDateChange}
                    dateFormat="dd/MM/yyyy" // Format for displaying the date
                    className="form-control"
                    placeholderText="Select date"
                  />
                </div>

                {/* Search and Reset Buttons */}
                <div className=" d-flex gap-2 align-items-center mt-2 mt-md-0">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  {/* <Button variant="outline-secondary" size="sm" onClick={handleSearchFidBack}>
                  upfate follow up
                </Button> */}
                </div>
              </div>
              <div>
                <strong>Filter by Agent : </strong>
                <select
                  className="border border-2 rounded-3"
                  onChange={(e) => FilterByAgent(e.target.value)}
                >
                  <option disabled selected>
                    Select Agent
                  </option>
                  {availableAgent.map((user, index) => (
                    <option
                      key={index}
                      value={user.data.first_name + " " + user.data.last_name}
                    >
                      {user.data.first_name} {user.data.last_name}
                    </option>
                  ))}
                  <option value="clear">
                    Clear filter
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mt-4">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div className="dashboard-stat-card">
              <h5 className="dashboard-stat-card-title text-success">
                Total Onboarded Customers
              </h5>
              <p className="dashboard-stat-card-value text-primary">
                {OnboardedCustomer.length || "0"}
              </p>
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="dashboard-stat-card">
              <h5 className="dashboard-stat-card-title text-info">
                Customer Engagement Attempts
              </h5>
              {loagingFeedback ? (
                <p className="dashboard-stat-card-value text-info dot-typing text-info"></p>
              ) : (
                <p className="dashboard-stat-card-value text-info">
                  {OnboardedCustomer.filter(
                    (customer) =>
                      customer.feedbackAttend !== undefined &&
                      customer.feedbackAttend
                  ).length || "0"}
                </p>
              )}
            </div>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="dashboard-stat-card" onClick={handleFollowUp}>
              <h5 className="dashboard-stat-card-title text-warning">
                Customers Awaiting Follow-Up
              </h5>
              <p className="dashboard-stat-card-value text-warning">
                {followUps?.length || "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4 px-1">
        <div className="card-body p-0">
          <div
            className="table-responsive"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <table
              className="table table-striped mb-0"
              id="new_onboard_customers"
            >
              <thead className="sticky-top bg-white">
                <tr>
                  <th>Sr No.</th>
                  <th>Customer Id</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Assign To</th>
                  <th>Customer Email</th>
                  <th>Hub Name</th>
                  <th>Wallet balance</th>
                  <th>Registered On</th>
                  <th>Feedback</th>
                  
                  <th>Assign Details</th>
                </tr>
              </thead>
              <tbody>
                {showSpinner ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4">
                      <SpinnerOverlay />
                    </td>
                  </tr>
                ) : dataLoaded ? (
                  OnboardedCustomer.map((customer, index) => (
                    <tr key={index}>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {index + 1}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.customer_id}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.customer_name}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.customer_phone}
                      </td>
                      <td>{customerIdAndAssign[customer.customer_id]}</td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.customer_email}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.hub_name}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.wallet_balance}
                      </td>
                      <td
                        onClick={() =>
                          handleCustomerROwClick(customer.customer_id)
                        }
                      >
                        {customer.created_date &&
                          moment(
                            customer.created_date.seconds ? customer.created_date.seconds * 1000 : customer.created_date
                          ).format("DD/MM/YY, h:mm a")}
                      </td>
                      <td>
                        {(customer.feedbackAttend !== undefined &&
                          customer.feedbackAttend) ||
                          0}
                      </td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleFeedback(customer)}
                        >
                          Feedback Info
                        </Button>
                      </td>
                      <td>
                        <button
                          className="btn btn-dark btn-sm"
                          onClick={() =>
                            checklead(
                              customer.customer_id,
                              customer.customer_name,
                              customer.customer_phone
                            )
                          }
                          style={{ padding: "0.2rem 0.85rem" }}
                        >
                          <i
                            className="menu-icon mdi mdi-eye"
                            style={{ color: "white" }}
                          ></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center">
                      {initialValue}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* <ul className="pagination mt-3">
        <li className="page-item">
          <button
            onClick={() => paginate(currentPage - 1)}
            className="page-link"
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>
        {renderPageButtons()}
        <li className="page-item">
          <button
            onClick={() => paginate(currentPage + 1)}
            className="page-link"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul> */}

      {showFOllowUp && (
        <FollowUpModal show={showFOllowUp} handleClose={handleClose} />
      )}
      {showLeadModal && (
        <Lead
          show={showLeadModal}
          handleClose={handleClose}
          task_id={task_id}
        />
      )}

      {showFeecback && (
        <Modal show={showFeecback} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedCustomer.customer_name}'s Feedback
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="card-description text-end">
              {" "}
              {/* Moved and adjusted styling */}
              <button
                type="button"
                className="btn btn-success btn-rounded btn-sm"
                data-toggle="modal"
                data-target="#exampleModal-2"
                onClick={handleAddFeedback}
              >
                {customerFeedbackData.length >= 1
                  ? "Add Follow Up"
                  : "Add Feedback"}
              </button>
            </p>
            <div className="table-responsive">
              {showSpinner && (
                <div className="spinner-container">
                  <SpinnerOverlay />
                </div>
              )}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Feedback Date</th>
                    <th>Agent</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {customerFeedbackData && customerFeedbackData.length > 0 ? (
                    customerFeedbackData.map((data, index) => (
                      <tr key={index}>
                        <td>
                          {moment(
                            data.feedback_date?.seconds ? data.feedback_date.seconds * 1000 : data.feedback_date
                          ).format("DD-MM-YYYY")}
                        </td>
                        <td>{data.created_by || "N/A"}</td>
                        <td>{data.remarks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center">
                        No Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <Modal show={showAddFeedbackModal} onHide={closeAddFeedback} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Customer's Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="datePicker" className="mb-3">
              {" "}
              {/* Added mb-3 for spacing */}
              <Form.Label>Date</Form.Label>
              <br />
              <DatePicker
                selected={feedbackDate}
                onChange={(date) => setfeedbackDate(date)}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                minDate={new Date()}
                maxDate={new Date()}
              />
            </Form.Group>
            <Form.Group controlId="remark" className="mb-3">
              {" "}
              {/* Added mb-3 for spacing */}
              <Form.Label>Remark</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remark..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAddFeedback}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default NewOnboardCustomers;
