import React, { useState, useEffect, useContext, useCallback } from "react";
import { normalizeDateValue } from "./helpers";
import { useNavigate, useParams } from "react-router-dom";

import { forwardRef } from "react";
import Sidebar from "./Sidebar";
import Swal from "sweetalert2";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { addDays } from "date-fns";
import TopPanel from "./TopPanel";
import Footer from "./Footer";

import {
  getUserInfo,
  calculateChanges,
  reconsileWallet,
  handleLogout,
} from "./Utility";
import apiClient from "./services/apiClient";
import { AddTransaction } from "./forms";
import { ConversastionLogs, EmailLogs, CallLogs } from "./components";
import GlobalContext from "./context/GlobalContext";

import { createCustomerActivity } from "./services/customerActivitiesService";
import { makeKnowlarityCall } from "./services/telephonyService";
import VacationModal from "./components/profile/modals/VacationModal";
import WalletModal from "./components/profile/modals/WalletModal";
import CreditLimitModal from "./components/profile/modals/CreditLimitModal";
import DeliveryPreferencesModal from "./components/profile/modals/DeliveryPreferencesModal";
import { checkVacationStatus, getVacations } from "./services/vacationService";
import { getWalletHistory, reconcileWallet as reconcileWalletApi } from "./services/walletService";
import { toDate, getTomorrowDate, fromSecondsNanoseconds } from "./utils/dateUtils";
import ProfileHome from "./components/profile/tabs/ProfileHome";
import ProfileOrders from "./components/profile/tabs/ProfileOrders";
import ProfileSubscriptions from "./components/profile/tabs/ProfileSubscriptions";
import ProfileVacation from "./components/profile/tabs/ProfileVacation";
import ProfileTickets from "./components/profile/tabs/ProfileTickets";
import ProfileActivities from "./components/profile/tabs/ProfileActivities";
import ProfileWallet from "./components/profile/tabs/ProfileWallet";
import ProfileHeaderCards from "./components/profile/tabs/ProfileHeaderCards";
import ProfileProductModal from "./components/profile/modals/ProfileProductModal";
import ProfileBulkUpdateModal from "./components/profile/modals/ProfileBulkUpdateModal";
import ProfileStatusUpdateModal from "./components/profile/modals/ProfileStatusUpdateModal";
import ProfileResumePauseModal from "./components/profile/modals/ProfileResumePauseModal";
import ProfileEditSubscriptionModal from "./components/profile/modals/ProfileEditSubscriptionModal";
import ProfileCalendarModal from "./components/profile/modals/ProfileCalendarModal";
import ProfileCashModal from "./components/profile/modals/ProfileCashModal";
import ProfileSRLModal from "./components/profile/modals/ProfileSRLModal";
import ProfileTicketsModal from "./components/profile/modals/ProfileTicketsModal";

const profilePageStyles = `
  .bg-gradient-info {
    background-image: linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%);
  }
  .custom-text {
    font-size: 15px !important;
    color: #fff !important;
    font-weight: 500;
  }
  .custom-green {
    background: #84bf93 !important;
  }
  .nav-link:hover,
  .nav-link:focus {
    background-color: #fff !important;
    color: #4751b2 !important;
  }
  .home-tab .nav-tabs .nav-item .nav-link {
    color: #fff;
    border-right: none;
  }
  .custom-card-text {
    font-weight: bolder;
    font-size: 24px !important;
    color: #fff !important;
  }
  .custom-active {
    background-color: #fff !important;
    color: #4751b2 !important;
  }
  .custom-red {
    background: linear-gradient(90deg, #ffbf96, #fe7096);
  }
  .loderes {
    position: relative;
    padding: 10px 20px;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .btn.loading {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
function ProfilePage() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes("profile")) {
          handleLogout();
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);


  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // State to manage loader for Save action

  const { loggedIn, userId, username, loggedIn_user } = getUserInfo();
  let params = useParams();

  const moment = extendMoment(Moment);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [data, setData] = useState({});
  const [vacationData, setVacationData] = useState([]);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [ticketsData, setTicketsData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);
  const [orderListData, setOrderListData] = useState([]);
  const [uniqueOrders, setUniqueOrders] = useState([]);
  const [walletData, setWalletData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hubData, setHubData] = useState({});
  const [deliveryExecutives, setDeliveryExecutives] = useState({});

  const [edit, setEdit] = useState(false);
  const [editID, setEditID] = useState("");

  const [subscriptionDataID, setSubscriptionDataID] = useState("");
  const [activeCart, setSetActiveCart] = useState("Subscription");
  const [delPreData, setdelPreData] = useState([]);
  const [activeTab, setActivetab] = useState("Home");
  const [oid, setOid] = useState("");
  const [startDate, setStartDate] = useState(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState(null);
  const [adhocDeliveryDate, setAdhocDeliveryDate] = useState(new Date());
  const [cartItems, setCartItems] = useState([]);
  const [editingDateFor, setEditingDateFor] = useState(null); // Tracks subscription_id being edited
  const [updatingDates, setUpdatingDates] = useState({}); // Tracks loading state
  const [afterEleven, setAfterEleven] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [subscriptionCalendarData, setSubscriptionCalendarData] = useState([]);
  const [subscriptionCalendarFutureData, setSubscriptionCalendarFutureData] =
    useState([]);
  const [newQuantityBU, setNewQuantityBU] = useState("");
  const [startDateBU, setStartDateBU] = useState(null);
  const [endDateBU, setEndDateBU] = useState(null);
  const [sidBU, setSidBU] = useState("");
  const [oiidStatus, setOiidStatus] = useState(""); // Moved to top
  const [submit, setSubmit] = useState({ description: "", reason: "" });
  const [oldTicketData, setOldTicketData] = useState(null);
  
  // Dummy handlers for un-modularized sections to fix compilation
  const [submitTickets, setSubmitTickets] = useState({
    category: "",
    status: "",
    priority: "",
    due_date: "",
    owner: loggedIn_user || "",
    description: "",
    visible_on: "",
    status: "1",
    created_date: new Date(),
    updated_date: new Date(),
  });
  const [submitCash, setSubmitCash] = useState({
    amount: "",
    date: "",
    time: "",
    status: "",
    created_date: new Date(),
  });
  const [submitSRL, setSubmitSRL] = useState({});

  const openSpecificModal = (selector) => {
    if (window.$) {
      window.$(selector).modal("show");
    }
  };

  const closeSubscription = () => {};
  const openSubscription = () => {
    setShowModal("addSubscription");
    openSpecificModal("#exampleModal");
  };
  const openCalendar = () => {
    openSpecificModal("#exampleModal-2-calendar");
  };
  const openPauseSubDialog = (sid, name, sub) => {
    setSelectedSubIdToPause(sid);
    setSelectedSubscriptionToPause(name);
    setSelectedSubscription(sub);
    openSpecificModal("#exampleModal-2-resume");
  };
  const closePauseSubDialog = () => {};
  const openmdlv = (id, status) => {
    setOid(id);
    setOiidStatus(status);
    openSpecificModal("#exampleModal-2-status");
  };
  const closemdlv = () => {
    if (window.$) window.$("#exampleModal-2-status").modal("hide");
  };
  const closeTickets = () => {
    if (window.$) window.$("#exampleModal-2-tickets").modal("hide");
  };
  const openAdhocOrder = () => {
    setShowModal("adhocOrder");
    openSpecificModal("#exampleModal");
  };
  const [updateCustomer, setUpdateCustomer] = useState("");
  const [OrderHistoryCount, setOrderHistoryCount] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCreditButton, setShowCreditButton] = useState(false);
  const [calendarDate, setCalendarDate] = useState(getTomorrowDate());
  const [showModal, setShowModal] = useState("");
  const [instruction, setInstruction] = useState("");
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const [showAddressModal, setShowAddressModal] = useState(false); // Use boolean instead of ""
  const [alltranteAddress, setAlltranteAddress] = useState("");
  const ticketActionOptions = ["Open", "In Progress", "Resolved"];
  const handleOpenAddressModal = () => {
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
  };

  const handleInputChange = (e) => {
    setInstruction(e.target.value);
  };

  const handleInputChangeAddress = (e) => {
    setAlltranteAddress(e.target.value);
  };

  const [isOnVacation, setIsOnVacation] = useState(false);
  const [resumeDate, setResumeDate] = useState(null);
  const [selectedSubscriptionToPause, setSelectedSubscriptionToPause] =
    useState("");
  const [selectedSubIdToPause, setSelectedSubIdToPause] = useState("");

  const openModal = () => {

    window.modelshow();
  };

  const closeModal = () => {
    window.modalHide();
  };

  function generateRandomTicket() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let ticket_id = "";
    const length = 8;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      ticket_id += characters[randomIndex];
    }

    return ticket_id;
  }


  const handleNextChange = async (subs, selectedDate, docId) => {

    if (!selectedDate || typeof docId !== "string") {
      console.error("Invalid docId:", docId);
      return alert("Update failed: invalid document ID");
    }

    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    setUpdatingDates((prev) => ({ ...prev, [subs.subscription_id]: true }));

    try {
      // ✅ Firestore Update
      await apiClient.patch(`/api/subscriptions_data/${docId}`, {
        next_delivery_date: formattedDate,
        updated_date: new Date(),
      });

      // ✅ Log Activity

      await createCustomerActivity({
        customer_id: data.data?.customer_id,
        customer_name: data.data?.customer_name,
        customer_phone: data.data?.customer_phone,
        user: loggedIn_user,
        object: "Subscription",
        action: "Next Delivery Updated",
        description: `Next delivery for Subscription ID: ${subs.subscription_id} changed to ${formattedDate} by ${loggedIn_user}`,
        date: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });

      setEditingDateFor(null);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed");
    } finally {
      setUpdatingDates((prev) => ({ ...prev, [subs.subscription_id]: false }));
    }
  };

  const navi = (id) => {
    const url = `/edit_customers/${id}`;
    navigate(url);
    // const newTab = window.open(url, '_blank');
    // newTab.focus();
  };

  //existing add function
  const handleAddToCart = (item) => {
     try{
    const sId = generateCustomerId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timestamp = tomorrow;
    // Create a new object with the start_date property added
    const newItem = {
      ...item,
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      interval: 1,
      coupon_code: "",
      quantity: 1,
      subscription_id: sId,
      start_date: timestamp,
      delivered_by: hubData.hub_name,
      delivering_to: `Home - ${data.data && data.data.customer_address},${
        data.data && data.data.floor
      },${data.data && data.data.flat_villa_no}, ${
        data.data && data.data.pincode
      }`,
      status: "1",
      customer_id: `${data.data && data.data.customer_id}`,
      customer_name: `${data.data && data.data.customer_name}`,
      customer_phone: `${data.data && data.data.customer_phone}`,
      created_date: new Date(),
      updated_date: new Date(),
      reason: "",
      resume_date: new Date(),
      discount:item?.discount ?? "",
    };
    // Add the new item to the cart
    setCartItems((prevItems) => [...prevItems, newItem]);
     }
     catch(err){
     }
  };

  const [products, setProducts] = useState([]);

  const fetchVacationData = async () => {
    if (!params.id) return;
    try {
      const status = await checkVacationStatus(params.id);
      setIsOnVacation(status);
      
      const res = await getVacations(params.id);
      setVacationData((res.data?.data || []).map(doc => ({ id: doc._id, data: doc })));
    } catch (error) {
      console.error("Error fetching vacation data:", error);
    }
  };

  useEffect(() => {
    fetchVacationData();
    getCalendarDate();
  }, [params.id]);

  useEffect(() => {
    let isActive = true;
    apiClient.post("/api/products_data/query", {
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
      if (isActive) {
        const docs = res.data?.data || [];
        setProducts(
          docs.map((doc) => ({
            id: doc._id,
            data: doc,
            selectedOption: doc.packagingOptions[0]
          }))
        );
      }
    });
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let isActive = true;
    setSelectedCustomerId(params.id);
    apiClient.post("/api/subscriptions_data/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }]
    }).then((res) => {
      if (isActive) {
        const docs = res.data?.data || [];
        const subsData = docs
          .map((doc) => ({ id: doc._id, subs: doc }))
          .sort((a, b) => new Date(a.subs.next_delivery_date) - new Date(b.subs.next_delivery_date))
          .sort((a, b) => b.subs.status - a.subs.status)
          .filter(
            (item) => !(item.subs.subscription_type === "One Time" && !moment(item.subs.next_delivery_date).isAfter(moment(), "day"))
          );
        setSubscriptionData(subsData);
        setSubscriptionDataID(subsData[0]?.id);
      }
    });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let isActive = true;
    apiClient.post("/api/subscriptions_data/query", {
      filters: [
        { field: "customer_id", op: "==", value: params.id },
        { field: "status", op: "==", value: "1" }
      ]
    }).then((res) => {
      if (isActive) {
        // Keeping this logic for potential future use or if side-effects depend on it
        const subsData = (res.data?.data || []).map((doc) => ({ id: doc._id, subs: doc }));
      }
    });
    return () => { isActive = false; };
  }, []);

  const [subscriptionAmount, setSubscriptionAmount] = useState(0);

  useEffect(() => {
    let isActive = true;
    apiClient.post("/api/subscriptions_data/query", {
      filters: [
        { field: "customer_id", op: "==", value: params.id },
        { field: "status", op: "==", value: "1" }
      ]
    }).then((res) => {
      if (isActive) {
        const docs = res.data?.data || [];
        const subsData = docs.map((doc) => {
          const totalAmount = doc.quantity * doc.price;
          return { id: doc._id, subs: doc, totalAmount: totalAmount };
        });

        const totalAmountSum = subsData.reduce((accumulator, current) => {
          return accumulator + current.totalAmount;
        }, 0);
        setSubscriptionAmount(totalAmountSum);
      }
    });

    return () => { isActive = false; };
  }, []);

  const subscriptionReasonUpdate = async () => {
    try {
      // Query for subscriptions matching the customer ID
      const querySnapshot = await apiClient.post("/api/subscriptions_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }]
      }).then(res => res.data?.data || []);

      const customerDataSnapshot = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }],
        limit: 1
      }).then(res => res.data?.data || []);

      // Ensure customer data is retrieved
      if (customerDataSnapshot.length === 0) {
        throw new Error("Customer data not found");
      }

      const customerData = customerDataSnapshot[0];

      const activities = [];
      const updatePromises = [];

      querySnapshot.forEach((data) => {
        if (data.reason === "cron") {
          // If reason is 'cron', update status to '1'
          updatePromises.push(
            apiClient.patch(`/api/subscriptions_data/${data._id}`, { status: "1", reason: "" })
          );
          activities.push({
            action: "Subscription Resumed",
            created_date: new Date(),
            customer_id: customerData.customer_id,
            customer_name: customerData.customer_name,
            customer_phone: customerData.customer_phone,
            description: `Subscription resumed for ${data.subscription_id} after wallet was recharged`,
            object: "Subscription Resumed",
            user: "System",
          });
        }
      });

      // Commit the updates
      if (updatePromises.length > 0) await Promise.all(updatePromises);

      // Add customer activities
      const activityPromises = activities.map((activity) =>
        apiClient.post("/api/customer_activities", activity)
      );
      await Promise.all(activityPromises);
    } catch (error) {
      console.error("Error updating subscriptions:", error);
    }
  };

  const [selectedIndex, setSelectedIndex] = useState("");

  const handleSaveIndex = (index) => {
    setSelectedIndex(index);
  };

  const [newQuantity, setNewQuantity] = useState("");
  const [quantityMap, setQuantityMap] = useState({});
  const [updateDate, setUpdateDate] = useState("");
  const [chechVacDate, setChechVacDate] = useState("");
  const [upProd, setUpProd] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState("");

  const shiftByDay = (next_delivery_date, docid) => {
    const newDate = moment(next_delivery_date)
      .add(1, "days")
      .format("YYYY-MM-DD");

    Swal.fire({
      title: `Do you want to change subscription date from - ${moment(
        next_delivery_date
      ).format("MMMM Do")} to ${moment(newDate).format("MMMM Do")}`,
      showCancelButton: true,
      confirmButtonText: "Shift by one day",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Saved!", `New delivery date: ${newDate}`, "success");
        apiClient.patch(`/api/subscriptions_data/${docid}`, { next_delivery_date: newDate })
          .then(() => {
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      }
    });
  };

  const openbulkQt = (sid, name, subscription) => {
    setNewQuantityBU("");
    setSidBU(sid);
    setSelectedSubscription(subscription);
    setUpProd(name);
    openSpecificModal("#exampleModal-2-bulk");
  };

  const closebulkQt = () => {
    window.bqlclose();
  };

  const [editingRow, setEditingRow] = useState(null);
  const [quantityFU, setQuantityFU] = useState("");
  const handleSaveClick = async (id, sid, pname) => {
    if (quantityFU === "" || quantityFU < 0) {
      alert("Please enter a valid quantity");
      return;
    }

    setIsSaving(true);
    try {
      const formattedDate = moment(calendarDate).format("YYYY-MM-DD");
      const querySnapshot = await apiClient.post("/api/bulk_update_quantity/query", {
        filters: [
          { field: "delivery_date", op: "==", value: formattedDate },
          { field: "subscription_id", op: "==", value: sid }
        ]
      }).then(res => res.data?.data || []);

      if (querySnapshot.length > 0) {
        // Document exists, update the quantity
        const updates = querySnapshot.map((doc) =>
          apiClient.patch(`/api/bulk_update_quantity/${doc._id}`, { quantity: parseInt(quantityFU) })
        );
        await Promise.all(updates);
      } else {
        // Document does not exist, create a new entry
        await apiClient.post("/api/bulk_update_quantity", {
          customer_id: data.data.customer_id,
          date: new Date(calendarDate),
          delivery_date: formattedDate,
          quantity: parseInt(quantityFU),
          subscription_id: sid,
          status: "1",
          product_name: pname,
          // Add other necessary fields here
        });
      }

      // Update the subscription data state with the new quantity
      setSubscriptionCalendarFutureData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? {
                ...item,
                subs: { ...item.subs, quantity: parseInt(quantityFU) },
              }
            : item
        )
      );

      // Log the activity
      await createCustomerActivity({
        customer_phone: data.data && data.data.customer_phone,
        customer_id: data.data && data.data.customer_id,
        customer_name: data.data && data.data.customer_name,
        customer_address: data.data && data.data.customer_address,
        hub_name: data.data && data.data.hub_name,
        delivery_exe_id: data.data && data.data.delivery_exe_id,
        user: loggedIn_user,
        object: "Subscription",
        action: "Change Quantity (Calendar)",
        description: `Quantity changed to ${quantityFU} for ${calendarDate} in calendar for subscription ID: ${sid} through CRM by ${loggedIn_user}`,
        date: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });

      setEditingRow(null); // Reset the editing state
    } catch (error) {
      console.error("Error updating or creating document: ", error);
    } finally {
      setIsSaving(false); // Hide loader after completion
    }
  };

  const handleDateChange = async (date) => {
    try {
      const today = moment(date).startOf("day");

      setChechVacDate(date);

      if (date) {
        const dateString = moment(date).format("YYYY-MM-DD");
        setUpdateDate(dateString);

        let isOnVacation = false;

        const vacationQuerySnapshot = await apiClient.post("/api/customers_vacation/query", {
          filters: [{ field: "customer_id", op: "==", value: params.id }]
        }).then(res => res.data?.data || []);

        vacationQuerySnapshot.forEach((vacationData) => {
          const startJsDate = toDate(vacationData.start_date);
          const endJsDate = toDate(vacationData.end_date);
          if (!startJsDate || !endJsDate) return;
          const startDate = moment(startJsDate).startOf("day");
          const endDate = moment(endJsDate).endOf("day");

          if (today.isBetween(startDate, endDate, null, "[]")) {
            isOnVacation = true;
            setSubscriptionCalendarFutureData([]);
            Swal.fire("On Vacation");
          }
        });

        if (!isOnVacation) {
          const subscriptionData = await apiClient.post("/api/subscriptions_data/query", {
            filters: [
              { field: "customer_id", op: "==", value: params.id },
              { field: "status", op: "==", value: "1" }
            ]
          }).then(res => (res.data?.data || []).map(doc => ({ id: doc._id, subs: doc })));

          if (subscriptionData.length !== 0) {
            const bulkUpdateData = await apiClient.post("/api/bulk_update_quantity/query", {
              filters: [
                { field: "customer_id", op: "==", value: params.id },
                { field: "delivery_date", op: "==", value: moment(date).format("YYYY-MM-DD") }
              ]
            }).then(res => (res.data?.data || []).map(doc => ({ id: doc._id, subs: doc })));

            const subscriptionDataForDate = subscriptionData.filter((item) => {
              const {
                subscription_type: type,
                interval,
                next_delivery_date,
              } = item.subs;
              const nextDeliveryDate =
                moment(next_delivery_date).startOf("day");
              const selectedDate = moment(date).startOf("day");

              if (type === "Everyday") {
                // Ensure it is only for the selected date and future dates, not before the next delivery date
                return selectedDate.isSameOrAfter(nextDeliveryDate, "day");
              } else if (type === "On-Interval") {
                const diffDays = selectedDate.diff(nextDeliveryDate, "days");
                return diffDays >= 0 && diffDays % interval === 0;
              } else if (type === "Custom") {
                const dayOfWeek = selectedDate.format("dddd").toLowerCase();
                return (
                  item.subs[dayOfWeek] > 0 &&
                  selectedDate.isSameOrAfter(nextDeliveryDate)
                );
              } else if (type === "One Time") {
                return selectedDate.isSame(nextDeliveryDate, "day");
              }
              return false;
            });

            subscriptionDataForDate.forEach((sub) => {
              const bulkUpdate = bulkUpdateData.find(
                (update) =>
                  update.subs.subscription_id === sub.subs.subscription_id
              );
              if (bulkUpdate) {
                sub.subs.quantity = bulkUpdate.subs.quantity;
              } else if (sub.subs.subscription_type === "Custom") {
                const dayOfWeek = new Date(date)
                  .toLocaleDateString("en-US", { weekday: "long" })
                  .toLowerCase();
                sub.subs.quantity = sub.subs[dayOfWeek] || 0;
              }
            });

            setSubscriptionCalendarFutureData(subscriptionDataForDate);
          } else {
            setSubscriptionCalendarFutureData([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    }
  };
  const handleEditClick = (index, initialQuantity, id) => {
    setEditingRow(index);
    setQuantityFU(initialQuantity);
    // alert(id)
  };

  const handleQuantityUpdate = (e) => {
    const { value } = e.target;
    setNewQuantity(value);
  };

  const handleQuantityUpdateSave = (sid) => {
    // Convert checkVacDate to a string in the 'YYYY-MM-DD' format
    let checkVacDateStr = chechVacDate.toISOString().split("T")[0];

    // Fetch existing vacations for the same customer from the database
    apiClient.post("/api/customers_vacation/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }]
    }).then((res) => {
        const querySnapshot = res.data?.data || [];
        let overlappingVacationExists = false;

        querySnapshot.forEach((vacation) => {
          const vacationStartDateStr = normalizeDateValue(vacation.start_date)
            .toISOString()
            .split("T")[0];
          const vacationEndDateStr = normalizeDateValue(vacation.end_date)
            .toISOString()
            .split("T")[0];

          // Check if the selected date lies between the start and end dates of the vacation
          if (
            checkVacDateStr >= vacationStartDateStr &&
            checkVacDateStr <= vacationEndDateStr
          ) {
            overlappingVacationExists = true;
          }
        });

        if (overlappingVacationExists) {
          // If there is a vacation that includes the selected date, show an alert
          alert(
            "Cannot update quantity because there is an active vacation that includes the selected date."
          );
        } else {
          // If no overlapping vacations, proceed with the quantity update
          updateSubscriptionQuantityInFirestore(updateDate, sid, newQuantity);
          setSelectedIndex("");
          refreshDateChange(updateDate);
        }
      })
      .catch((error) => {
        console.error("Error fetching existing vacations:", error);
        // Handle the error accordingly (e.g., show an error message)
      });
  };

  const refreshDateChange = async (date) => {
    try {
      // Fetch subscription data from Firestore based on the customer_phone
      const snapshot = await apiClient.post("/api/subscriptions_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }]
      }).then(res => res.data?.data || []);

      if (snapshot.length > 0) {
        const data = snapshot.map((doc) => ({
          id: doc._id,
          ...doc,
        }));
        // Check if subscription period data is available for the selected date
        const subscriptionDataForDate = data
          .map(
            (item) => item.subscription_period && item.subscription_period[date]
          )
          .filter((item) => item);
        setSubscriptionCalendarData(subscriptionDataForDate);
      } else {
        setSubscriptionCalendarData([]);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    }
  };

  const handleChangeCartDate = (date, index) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid date selected");
      return; // Ensure the function exits if the date is invalid
    }
    
    // Update startDate state
    setStartDate(date);

    // Format the date to "YYYY-MM-DD"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero if necessary
    const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if necessary
    const formattedDate = `${year}-${month}-${day}`;

    // Convert formatted date back to a Date object (for consistency)
    const timestamp = new Date(formattedDate);

    // Update cartItems state
    setCartItems((prevItems) => {
      return prevItems.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            start_date: timestamp, // Update the start_date field
            end_date:
              activeCart === "One Time"
                ? timestamp
                : activeCart === "Subscription"
                ? item.end_date
                : "",
          };
        }
        return item;
      });
    });
  };

  const handleChangeEndDate = (date, index) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid end date selected");
      return;
    }
    
    setEndDate(date);

    setCartItems((prevItems) => {
      return prevItems.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            end_date: date, // Update the end_date field
          };
        }
        return item;
      });
    });
  };

  const [showNth, setShowNth] = useState(false);
  const handleInterval = async (interval, index) => {
    if (interval === "nth") {
      handleInterval("5", index);
      setShowNth(true);
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].interval =
          interval === "nth" ? 5 : parseInt(interval);
        // updatedItems[index].interval_category = "nth"; // Update the start_date field in the cart item
        return updatedItems;
      });
    } else {
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].interval = parseInt(interval); // Update the start_date field in the cart item
        // updatedItems[index].interval_category = ""; //
        return updatedItems;
      });
      setShowNth(false);
    }
  };

  const [userMapID, setUserMapID] = useState({});

  const usermap = () => {};

  // Function to calculate the next delivery date for custom-day subscriptions
  const calculateNextDeliveryDate = (currentDate, selectedDays) => {
    let nextDeliveryDate = new Date(currentDate);

    // Move the current date to the next day and iterate until a match is found
    do {
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
      const dayOfWeek = nextDeliveryDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (selectedDays.includes(dayOfWeek)) {
        break;
      }
    } while (true);

    return nextDeliveryDate;
  };

  const handleChangenCustom = (e, index, day) => {
    const { value } = e.target;
    // Update the cartItems array with the modified item
    const updatedCartItems = cartItems.map((item, idx) => {
      if (idx === index) {
        // Create a copy of the item to update
        const updatedItem = { ...item };
        // Update the value of the specified day
        updatedItem[day] = parseInt(value); // Convert value to integer if needed
        return updatedItem;
      }
      return item;
    });
    // Set the updated cartItems array
    setCartItems(updatedCartItems);
    // Log the updated cartItems array
  };
  const handleChangenth = (e, index) => {
    // alert(e.target.value);
    setCartItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].interval = parseInt(e.target.value); // Update the start_date field in the cart item
      return updatedItems;
    });
  };
  const [showIntervalType, setShowIntervalType] = useState("");
  const handleChangeCart = (e, index) => {
    const { id, value, checked } = e.target;
    if (id === "Everyday" || id === "On-Interval" || id === "Custom") {
      setShowIntervalType(value);
      const nextDeliveryDates = new Date();
      nextDeliveryDates.setDate(startDate.getDate() + 1);
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].subscription_type = value; // Update the type field
        updatedItems[index].interval = 1; // Update the type field
        updatedItems[index].next_delivery_date = nextDeliveryDates;
        return updatedItems;
      });
      if (id === "On-Interval") {
        handleInterval("2", index);
      } else {
        handleInterval("", index);
      }
      if (id === "Everyday") {
        setCartItems((prevItems) => {
          const updatedItems = [...prevItems];
          updatedItems[index].interval = 1;
          return updatedItems;
        });
      }
    } else {
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index][id] = value;
        return updatedItems;
      });
    }
    if (id === "Everyday" || id === "Custom") {
      setShowNth(false);
    }
  };

  const handleRemoveFromCart = (index) => {
    setCartItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  };

  // Define your custom quantities
  const customQuantities = {
    sunday: "2",
    monday: "4",
    tuesday: "6",
    // Add more days if needed
  };

  const [productDataID, setProductDataID] = useState({});

  const productmap = () => {
    setProductDataID({});
    apiClient.post("/api/products_data/query", {}).then((res) => {
      const productDataIDData = (res.data?.data || []).map((doc) => {
        const { productName, image, packagingOptions } = doc;
        return { [productName]: image };
      });

      // Set the state with the fetched data
      setProductDataID(Object.assign({}, ...productDataIDData));
    });
  };

  const calculateTotalAmount = (orderId) => {
    return orderListData
      .filter((order) => order.data.order_id === orderId)
      .map(
        (filteredOrder) =>
          filteredOrder.data.quantity * filteredOrder.data.price
      )
      .reduce((total, current) => total + current, 0);
  };

  const extractUtilisedBalances = async (orderId) => {
    // Filter orders based on orderId
    const filteredOrders = orderListData.filter(
      (order) => order.data.order_id === orderId
    );

    // Initialize variables to accumulate total balances
    let utilised_wallet_balance = 0;
    let utilised_credit_limit = 0;

    // Iterate through filtered orders to sum up balances
    filteredOrders.forEach((order) => {
      const orderData = order.data;
      if (orderData.status != "2") {
        utilised_wallet_balance += orderData.utilised_wallet_balance || 0;
        utilised_credit_limit += orderData.utilised_credit_limit || 0;
      }
    });
    return {
      utilised_wallet_balance,
      utilised_credit_limit,
    };
  };

  function calculateNextDelivery(obj) {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Get current date and time
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // Get the current day (0 for Sunday, 1 for Monday, etc.)

    // Find the next delivery day with a value greater than 0
    let nextDeliveryDay;
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDay + i) % 7; // Get the index of the next day
      const day = days[nextDayIndex]; // Get the day name
      if (obj[day] > 0) {
        nextDeliveryDay = nextDayIndex;
        break;
      }
    }

    // Calculate the next delivery date starting from tomorrow
    if (nextDeliveryDay !== undefined) {
      const nextDeliveryDate = new Date();
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1); // Start from tomorrow
      while (nextDeliveryDate.getDay() !== nextDeliveryDay) {
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1); // Move to the next day
      }
      return nextDeliveryDate.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
    } else {
      return null; // No delivery days found
    }
  }

  const generateOrderId = (customer_id) => {
    const timestamp = Date.now().toString();
    const todayDate = moment(new Date()).format("YYYY-MM-DD");
    //const uniqueOrderId = `${customer_id}${todayDate}`;
    const randomComponent = Math.floor(Math.random() * 100);
    const uniqueOrderId =
      (timestamp % 100000000).toString().padStart(6, "0") +
      randomComponent.toString().padStart(2, "0");
    return uniqueOrderId;
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Retrieve initial balances
      let wallet_balance = data.data?.wallet_balance || 0;
      let credit_limit = data.data?.credit_limit || 0;
      let remaining_amount = 0;
      let orders = [];
      const newSortedArr = cartItems.sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date)
      );
      const itemAtZeroIdx = newSortedArr[0];
      const itemWithSameNextDate = cartItems.filter(
        (item) =>
          new Date(itemAtZeroIdx.start_date).toLocaleDateString() ===
          new Date(item.start_date).toLocaleDateString()
      );
      let totalOrderAmount = 0;

      // first check totalOrderAmount ......
      for (const item of itemWithSameNextDate) {
        totalOrderAmount += item.quantity * item.price;
      }

      const Toast = Swal.mixin({
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });
      if (wallet_balance > 0 && credit_limit > 0) {
        if (wallet_balance + credit_limit < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - (wallet_balance + credit_limit)
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance > 0 && credit_limit <= 0) {
        if (wallet_balance < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - wallet_balance
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance <= 0 && credit_limit > 0) {
        if (credit_limit < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - credit_limit
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance <= 0 && credit_limit <= 0) {
        Toast.fire({
          icon: "error",
          title: `You need additional ${totalOrderAmount} to proceed`,
        });
        return;
      }
      //for loop end...
      orders = cartItems;
      if (orders.length > 0) {
        for (const order of orders) {
          const item = order;
          // const utilised_wallet_balance = order.utilised_wallet_balance;
          // const utilised_credit_limit = order.utilised_credit_limit;

          if (item.end_date === "") {
            // Set a default far future date instead of null
            // item.end_date = new Date("3000-01-01");
            item.end_date = null;
          }

          if (showModal === "addSubscription") {
            item.next_delivery_date = moment(item.start_date).format(
              "YYYY-MM-DD"
            );
            if (
              item.subscription_type === "Custom" ||
              item.subscription_type === "One Time"
            ) {
              item.interval = 0;
            }
            await apiClient.post("/api/subscriptions_data", item);
            await createCustomerActivity({
              customer_phone: data.data?.customer_phone,
              customer_id: data.data?.customer_id,
              customer_name: data.data?.customer_name,
              customer_address: data.data?.customer_address,
              hub_name: data.data?.hub_name,
              delivery_exe_id: data.data?.delivery_exe_id,
              user: "Server",
              object: "Subscription",
              action: "Create",
              description:
                `${item.subscription_type} Subscription ID:${item.subscription_id} ${item.product_name} ${item.package_unit} created through System by ${loggedIn_user}. Start date:${item.next_delivery_date} ` +
                (item.end_date
                  ? `to End date:${new Date(item.end_date).toLocaleDateString(
                      "en-ca"
                    )}`
                  : ""),
              date: new Date().toISOString(),
              created_date: new Date().toISOString(),
            });

            if (item.discount !== undefined && Number(item.discount) > 0) {
              await createCustomerActivity({
                customer_phone: data.data?.customer_phone,
                customer_id: data.data?.customer_id,
                customer_name: data.data?.customer_name,
                customer_address: data.data?.customer_address,
                hub_name: data.data?.hub_name,
                delivery_exe_id: data.data?.delivery_exe_id,
                user: loggedIn_user,
                object: "Discount",
                action: "Update",
                description: `Discount of ₹${item.discount} applied on subscription ID ${item.subscription_id} by ${loggedIn_user}`,
                created_date: new Date().toISOString(),
              });
            }
          }
          setCartItems([]);
          closeSubscription();
        }
        setEndDate(null);
        setCartItems([]);
      }
    } finally {
      setLoading(false); // Re-enable button
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      // Retrieve initial balances
      let wallet_balance = data.data?.wallet_balance || 0;
      let credit_limit = data.data?.credit_limit || 0;
      let remaining_amount = 0;
      const orders = [];
      let totalOrderAmount = 0;

      // first check totalOrderAmount ......
      for (const item of cartItems) {
        totalOrderAmount += item.quantity * item.price;
      }
      const Toast = Swal.mixin({
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 6000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });
      if (wallet_balance > 0 && credit_limit > 0) {
        if (wallet_balance + credit_limit < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - (wallet_balance + credit_limit)
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance > 0 && credit_limit <= 0) {
        if (wallet_balance < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - wallet_balance
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance <= 0 && credit_limit > 0) {
        if (credit_limit < totalOrderAmount) {
          Toast.fire({
            icon: "error",
            title: `You need additional ${
              totalOrderAmount - credit_limit
            } to proceed`,
          });
          return;
        }
      } else if (wallet_balance < 0 && credit_limit < 0) {
        Toast.fire({
          icon: "error",
          title: `You need additional ${totalOrderAmount} to proceed`,
        });
        return;
      }

      //for loop start...
      for (const item of cartItems) {
        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        const today = new Date();
        // Ensure the current date cannot be selected for start date
        if (
          startDate.toDateString() === today.toDateString() &&
          showModal === "addSubscription"
        ) {
          const Toast = Swal.mixin({
            toast: true,
            background: "#69aba6",
            position: "top-end",
            showConfirmButton: false,
            timer: 6000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            },
          });

          Toast.fire({
            icon: "error",
            title: `Start date cannot be the current date.`,
          });
          setLoading(false);
          return;
        }

        // Ensure end date is not earlier than start date
        if (endDate < startDate && showModal === "addSubscription") {
          const Toast = Swal.mixin({
            toast: true,
            background: "#69aba6",
            position: "top-end",
            showConfirmButton: false,
            timer: 6000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            },
          });

          Toast.fire({
            icon: "error",
            title: `End date cannot be earlier than the start date.`,
          });
          setLoading(false);
          return;
        }

        const itemTotal = item.quantity * item.price;

        let utilised_wallet_balance = 0;
        let utilised_credit_limit = 0;
        let remaining_amount = 0;

        // 1) Wallet se hi pura cover
        if (itemTotal <= wallet_balance) {
          // Wallet balance is sufficient for this item
          utilised_wallet_balance = itemTotal;
          utilised_credit_limit = 0;
        } else if (wallet_balance >= 0) {
          // 2) Wallet + credit se cover
          if (itemTotal <= wallet_balance + credit_limit) {
            // Wallet balance and credit limit together are sufficient
            utilised_wallet_balance = wallet_balance;
            utilised_credit_limit = itemTotal - wallet_balance;
          } else {
            // insufficient
            remaining_amount = itemTotal - (wallet_balance + credit_limit);
            const Toast = Swal.mixin({
              toast: true,
              background: "#69aba6",
              position: "top-end",
              showConfirmButton: false,
              timer: 6000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener("mouseenter", Swal.stopTimer);
                toast.addEventListener("mouseleave", Swal.resumeTimer);
              },
            });

            Toast.fire({
              icon: "error",
              title: `You need additional ${remaining_amount} to proceed`,
            });
            return;
          }
        } else if (wallet_balance < 0) {
          if (itemTotal <= credit_limit) {
            utilised_wallet_balance = 0;
            utilised_credit_limit = itemTotal;
          } else {
            remaining_amount = itemTotal - credit_limit;
            const Toast = Swal.mixin({
              toast: true,
              background: "#69aba6",
              position: "top-end",
              showConfirmButton: false,
              timer: 6000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener("mouseenter", Swal.stopTimer);
                toast.addEventListener("mouseleave", Swal.resumeTimer);
              },
            });

            Toast.fire({
              icon: "error",
              title: `You need additional ${remaining_amount} to proceed`,
            });
            return;
          }
        } else {
          utilised_wallet_balance = 0;
          utilised_credit_limit = 0;
          console.error(`Insufficient funds for item: ${item.product_name}`);
          remaining_amount = itemTotal - (wallet_balance + credit_limit);
          const Toast = Swal.mixin({
            toast: true,
            background: "#69aba6",
            position: "top-end",
            showConfirmButton: false,
            timer: 6000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            },
          });

          Toast.fire({
            icon: "error",
            title: `You need additional ${remaining_amount} to proceed`,
          });
          return;
        }

        wallet_balance =
          wallet_balance - utilised_wallet_balance - utilised_credit_limit;
        credit_limit = credit_limit - utilised_credit_limit;

        orders.push({
          item,
          utilised_wallet_balance,
          utilised_credit_limit,
        });
      }
      //for loop end...
      if (orders.length > 0) {
        for (const order of orders) {
          const item = order.item;

          const utilised_wallet_balance = order.utilised_wallet_balance;
          const utilised_credit_limit = order.utilised_credit_limit;

          if (item.end_date === "") {
            // Set a default far future date instead of null
            // item.end_date = new Date("3000-01-01");
            item.end_date = null;
          }

          if (showModal === "addSubscription") {
            item.next_delivery_date = moment(item.start_date).format(
              "YYYY-MM-DD"
            );
            if (
              item.subscription_type === "Custom" ||
              item.subscription_type === "One Time"
            ) {
              item.interval = 0;
            }
            await apiClient.post("/api/subscriptions_data", item);
            await createCustomerActivity({
              customer_phone: data.data?.customer_phone,
              customer_id: data.data?.customer_id,
              customer_name: data.data?.customer_name,
              customer_address: data.data?.customer_address,
              hub_name: data.data?.hub_name,
              delivery_exe_id: data.data?.delivery_exe_id,
              user: "Server",
              object: "Subscription",
              action: "Create",
              description:
                `${item.subscription_type} Subscription ID:${item.subscription_id} ${item.product_name} ${item.package_unit} created through System by ${loggedIn_user}. Start date:${item.next_delivery_date} ` +
                (item.end_date
                  ? `to End date:${new Date(item.end_date).toLocaleDateString(
                      "en-ca"
                    )}`
                  : ""),
              date: new Date().toISOString(),
              created_date: new Date().toISOString(),
            });
          } else {
            // Adhoc order logic
            const orderDetails = {
              cancelled_reason: "",
              cancelled_time: "",
              created_date: item.created_date,
              customer_id: item.customer_id,
              customer_name: item.customer_name,
              customer_phone: item.customer_phone,
              delivering_to: item.delivering_to,
              delivery_date: moment(adhocDeliveryDate).format("YYYY-MM-DD"),
              delivery_exe_id: data.data?.delivery_exe_id || "",
              delivery_time: "00:00:00",
              delivery_timestamp: adhocDeliveryDate,
              handling_charges: 0,
              hub_name: item.delivered_by,
              latitude: data.data?.latitude || "",
              location: data.data?.location || "",
              longitude: data.data?.longitude || "",
              marked_delivered_by: "",
              order_id: generateOrderId(item.customer_id),
              order_type: "Re-Order",
              package_unit: item.package_unit,
              price: item.price,
              product_name: item.product_name,
              quantity: item.quantity,
              status: "0",
              subscription_id: "0",
              tax: 0,
              total_amount: item.price * item.quantity,
              updated_date: item.created_date,
              utilised_wallet_balance,
              utilised_credit_limit,
            };
            await apiClient.post("/api/order_history", orderDetails);

            // Add activity to customer_activities table
            await createCustomerActivity({
              customer_phone: data.data?.customer_phone,
              customer_id: data.data?.customer_id,
              customer_name: data.data?.customer_name,
              customer_address: data.data?.customer_address,
              hub_name: data.data?.hub_name,
              delivery_exe_id: data.data?.delivery_exe_id,
              user: "Server",
              object: "Order",
              action: "Create",
              description: `Adhoc Order ID:${orderDetails.order_id} ${item.product_name} ${item.package_unit} created through System by ${loggedIn_user}. Delivery date:${orderDetails.delivery_date}`,
              date: new Date().toISOString(),
              created_date: new Date().toISOString(),
            });

            const querySnapshot = await apiClient.post("/api/customers_data/query", {
              filters: [{ field: "customer_id", op: "==", value: item.customer_id }]
            }).then(res => res.data?.data || []);

            querySnapshot.forEach((doc) => {
              apiClient.patch(`/api/customers_data/${doc._id}`, {
                  wallet_balance: wallet_balance,
                  credit_limit: credit_limit,
                })
                .then(() => {
                })
                .catch((error) => {
                  console.error("Error updating wallet balance:", error);
                });
            });

            const Toast = Swal.mixin({
              toast: true,
              background: "#69aba6",
              position: "top-end",
              showConfirmButton: false,
              timer: 6000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener("mouseenter", Swal.stopTimer);
                toast.addEventListener("mouseleave", Swal.resumeTimer);
              },
            });

            Toast.fire({
              icon: "success",
              title: `Adhoc Order Created Successfully`,
            });
          }
        }
        if (showModal !== "addSubscription") {
          wallethistoryAdhoc(
            "debit",
            cartItems.reduce(
              (total, item) => total + item.quantity * item.price,
              0
            ),
            wallet_balance,
            "Manual Order Executed"
          );
        }
        setCartItems([]);
        closeSubscription();
      } else {
        const Toast = Swal.mixin({
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 6000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });

        Toast.fire({
          icon: "error",
          title: `You need additional ${remaining_amount} to proceed`,
        });
      }
      setEndDate(null);
      setCartItems([]);
    } finally {
      setLoading(false); // Re-enable button
    }
  };

  function getDayIndex(day) {
    switch (day) {
      case "sunday":
        return 0;
      case "monday":
        return 1;
      case "tuesday":
        return 2;
      case "wednesday":
        return 3;
      case "thursday":
        return 4;
      case "friday":
        return 5;
      case "saturday":
        return 6;
      default:
        return -1; // Invalid day
    }
  }

  const handleQuantityChange = (index, action) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          let newQuantity;
          if (action === "add") {
            newQuantity = Number(item.quantity) + 1;
          } else if (action === "subtract") {
            newQuantity = Math.max(Number(item.quantity) - 1, 1); // Ensure quantity never goes below 1
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      return updatedItems;
    });
  };

  const deleteProduct = (id, subs) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        apiClient.delete(`/api/subscriptions_data/${id}`)
          .then(() => {
            Swal.fire("Deleted!", "Subscription has been deleted.", "success");
          });
        //collection('subscriptions_data').doc(id).update({ status: "0" });
      }
    });
    apiClient.post("/api/customer_activities", {
        customer_phone: data.data && data.data.customer_phone,
        customer_id: data.data && data.data.customer_id,
        customer_name: data.data && data.data.customer_name,
        customer_address: data.data && data.data.customer_name,
        hub_name: data.data && data.data.hub_name,
        delivery_exe_id: data.data && data.data.delivery_exe_id,
        user: loggedIn_user,
        object: "Subscription",
        action: "Delete Subscription",
        description: `Subscription ID:${subs.subscription_id} has been deleted by ${loggedIn_user}`,
        date: new Date(),
        created_date: new Date(),
      })
      .then(() => {
      });
  };

  const handleRemoveFututeBulk = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        apiClient.delete(`/api/bulk_update_quantity/${id}`)
          .then(() => {
            Swal.fire("Deleted!", "Subscription has been deleted.", "success");
          });
      }
    });
  };
  const handleCalendarDateChange = (date) => {
    setCalendarDate(date);
    handleDateChange(date);
  };
  // Function to update subscription quantity in Firestore
  const updateSubscriptionQuantityInFirestore = async (
    date,
    subscriptionId,
    newQuantity
  ) => {
    try {
      const snapshot = await apiClient.get("/api/subscriptions_data").then(res => res.data?.data || []);
      snapshot.forEach((doc) => {
        const subscriptionPeriod = doc.subscription_period;
        if (subscriptionPeriod && subscriptionPeriod[date]) {
          subscriptionPeriod[date].forEach((product) => {
            if (product.subscription_id === subscriptionId) {
              product.quantity = newQuantity;
            }
          });
          // Update the document in db
          apiClient.patch(`/api/subscriptions_data/${doc._id}`, { subscription_period: subscriptionPeriod });
        }
      });
    } catch (error) {
      console.error("Error updating subscription quantity:", error);
    }
  };

  const handleQuantityChangeIndex = async (subscriptionId, newQuantity) => {
    try {
      // Fetch the document containing the subscription data from Firestore
      const doc = await apiClient.get(`/api/subscriptions_data/${subscriptionId}`).then(res => res.data?.data);

      if (!doc) {
        return;
      }

      // Extract the subscription data from the document
      const subscriptionData = doc;

      // Find the index of the product within the "products" array that matches the subscription ID
      const productIndex = subscriptionData.products.findIndex(
        (product) => product.subscription_id === "38228274"
      );

      if (productIndex !== -1) {
        // Update the quantity of the matching product directly in the Firestore document
        await apiClient.patch(`/api/subscriptions_data/${subscriptionId}`, {
          [`products.${productIndex}.quantity`]: newQuantity,
        });

      } else {
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

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

  const changeCart = (name, index) => {

    setUpdateCustomer(name);
    const sId = generateCustomerId();
    // setCartItems((prevItems) => {
    //   const updatedItems = [...prevItems];
    //   updatedItems[index].subscription_type = name; // Update the type field
    //   updatedItems[index].subscription_id = sId; // Update the type field
    //   return updatedItems;
    // });
    if (name === "Subscription") {
      setSetActiveCart(name);
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].subscription_type = "Everyday";
        updatedItems[index].subscription_id = sId;
        updatedItems[index].interval = 1;
        updatedItems[index].end_date = "";
        return updatedItems;
      });

      // setCartItems([])
    } else {
      setSetActiveCart(name);
      // setCartItems([])
      setEndDate(startDate);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0"); // Add leading zero if necessary
      const day = String(startDate.getDate()).padStart(2, "0"); // Add leading zero if necessary
      const dateString = `${year}-${month}-${day}`;
      const timestamp = new Date(dateString);
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].end_date = timestamp; // Update the start_date field in the cart item
        updatedItems[index].interval = 0; // Update the start_date field in the cart item
        // updatedItems[index].interval_category = ""; // Update the start_date field in the cart item
        // updatedItems[index].custom = []; // Update the start_date field in the cart item
        updatedItems[index].subscription_type = "One Time"; // Update the start_date field in the cart item
        updatedItems[index].subscription_id = sId;
        return updatedItems;
      });
    }
  };

  const resetActivities = () => {
    apiClient.post("/api/customer_activities/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setActivitiesData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  const [editingRowOrd, setEditingRowOrd] = useState(null);
  const [quantityOrd, setQuantityOrd] = useState("");

  const handleEditClickOrd = (index, initialQuantity) => {
    setEditingRowOrd(index);
    setQuantityOrd(initialQuantity);
  };
  const handleSaveClickOrd = (id, qty, price) => {
    if (quantityOrd * price - qty * price > 0) {
      if (quantityOrd * price - qty * price >= data.data?.wallet_balance) {
        alert(
          `insufficient wallet balance need to recharge for  Rs ${
            quantityOrd * price - qty * price
          }`
        );
      } else {
        const deduct = quantityOrd * price - qty * price;
        const amount = parseInt(data.data?.wallet_balance) - parseInt(deduct);
        wallethistory("Debit", deduct);
        // alert(`sufficient wallet balance ${(quantityOrd * price - qty * price)}`)
        apiClient.patch(`/api/order_history/${id}`, { quantity: parseInt(quantityOrd) });
        apiClient.post("/api/customers_data/query", {
          filters: [{ field: "customer_id", op: "==", value: params.id }]
        }).then((res) => {
            const querySnapshot = res.data?.data || [];
            querySnapshot.forEach((doc) => {
              apiClient.patch(`/api/customers_data/${doc._id}`, {
                  wallet_balance: parseInt(amount),
                })
                .then(() => {
                  // Proceed with the rest of your logic here, such as adding wallet history
                })
                .catch((error) => {
                  console.error("Error updating wallet balance:", error);
                });
            });
          });
      }
    } else {
      const refund = quantityOrd * price - qty * price;
      const amount = parseInt(data.data?.wallet_balance) - parseInt(refund);
      wallethistory("Credit", refund);
      // alert(refund)
      // alert(amount)
      // alert(`sufficient wallet balance ${(quantityOrd * price - qty * price)}`)
      apiClient.patch(`/api/order_history/${id}`, { quantity: parseInt(quantityOrd) });
      apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }]
      }).then((res) => {
          const querySnapshot = res.data?.data || [];
          querySnapshot.forEach((doc) => {
            apiClient.patch(`/api/customers_data/${doc._id}`, {
                wallet_balance: parseInt(amount),
              })
              .then(() => {
                // Proceed with the rest of your logic here, such as adding wallet history
              })
              .catch((error) => {
                console.error("Error updating wallet balance:", error);
              });
          });
        });
    }
    setEditingRowOrd(false);
  };

  const handleSubmitUpdateQuantity = async (event) => {
    event.preventDefault();
    const nextDeliveryDate = new Date(selectedSubscription.next_delivery_date);
    nextDeliveryDate.setHours(0, 0, 0, 0);
    const enteredStartedDate = new Date(startDateBU);
    enteredStartedDate.setHours(0, 0, 0, 0);

    if (enteredStartedDate < nextDeliveryDate) {
      alert(
        "Subscription next delivery date is greater than the entered dates"
      );
      return;
    }
    bulkUpdateQuantities2(startDateBU, endDateBU, sidBU, newQuantityBU, data);
  };

  const fetchExistingEntries = async (subscription_id, date) => {
    const snapshot = await apiClient.post("/api/bulk_update_quantity/query", {
      filters: [{ field: "delivery_date", op: "==", value: moment(date).format("YYYY-MM-DD") },
                { field: "subscription_id", op: "==", value: subscription_id }]
    }).then(res => res.data?.data || []);

    const entries = snapshot.map((doc) => ({ id: doc._id, ...doc }));
    return entries;
    //setExistingEntries(entries);
  };

  const bulkUpdateQuantities2 = async (
    startDate,
    endDate,
    sid,
    newQuantity,
    data
  ) => {
    //e.preventDefault();
    if (!startDate || !endDate || !newQuantity) {
      alert("Please fill all fields");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    try {
      const promises = [];
      for (let i = 0; i <= daysDifference; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const existingEntries = await fetchExistingEntries(sid, currentDate);
        const existingEntry = existingEntries.find(
          (entry) =>
            moment(toDate(entry.date)).format("YYYY-MM-DD") ===
            moment(currentDate).format("YYYY-MM-DD")
        );

        if (existingEntry) {
          promises.push(apiClient.patch(`/api/bulk_update_quantity/${existingEntry.id || existingEntry._id}`, { quantity: parseInt(newQuantity) }));
        } else {
          // Add new entry
          const entryData = {
            date: currentDate,
            quantity: parseInt(newQuantity),
            delivery_date: moment(currentDate).format("YYYY-MM-DD"),
            customer_id: data.data && data.data.customer_id, // Access data passed from handleSubmitUpdateQuantity
            status: "1",
            product_name: upProd,
            subscription_id: sid,
            // Add other fields as needed
          };
          promises.push(apiClient.post("/api/bulk_update_quantity", entryData));
        }
      }

      await Promise.all(promises);
      apiClient.post("/api/customer_activities", {
          customer_phone: data.data && data.data.customer_phone,
          customer_id: data.data && data.data.customer_id,
          customer_name: data.data && data.data.customer_name,
          customer_address: data.data && data.data.customer_name,
          hub_name: data.data && data.data.hub_name,
          delivery_exe_id: data.data && data.data.delivery_exe_id,
          user: "",
          object: "Subscription",
          action: "Changed Quantity in Bulk",
          description: `Quantity for subscription with subscription ID ${sid} has been changed to ${newQuantity} from Date ${moment(
            startDate
          ).format("DD-MM-YYYY")} to ${moment(endDate).format(
            "DD-MM-YYYY"
          )} by ${loggedIn_user}`,
          //'description': description,
          date: new Date(),
          created_date: new Date(),
        })
        .then(() => {
        });

      //alert(`Successfully updated entries in Firebase!`);
      closebulkQt();
    } catch (error) {
      console.error("Error creating entries in the database:", error);
    }
  };

  const resetSearchOrders = () => {
    setStartDate(null);
    setEndDate(null);
    fetchOrderHistory();
  };

  const resetWallet = () => {
    apiClient.post("/api/wallet_history/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setWalletData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  const handleDateRange = () => {
    const startDateTimestamp = startDate ? startDate.getTime() : 0;
    const endDateTimestamp = endDate ? endDate.getTime() : new Date().getTime();

    apiClient.post("/api/customer_activities/query", {
      filters: [
        { field: "customer_id", op: "==", value: params.id },
        { field: "created_date", op: ">=", value: new Date(startDateTimestamp) },
        { field: "created_date", op: "<=", value: new Date(endDateTimestamp) }
      ],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setActivitiesData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  const handleSearchOrders = () => {
    const startDateTimestamp = startDate ? startDate.getTime() : 0;
    const endDateTimestamp = endDate ? endDate.getTime() : new Date().getTime();

    apiClient.post("/api/order_history/query", {
      filters: [
        { field: "customer_id", op: "==", value: params.id },
        { field: "delivery_timestamp", op: ">=", value: new Date(startDateTimestamp) },
        { field: "delivery_timestamp", op: "<=", value: new Date(endDateTimestamp) }
      ],
      orderBy: [{ field: "delivery_timestamp", direction: "desc" }]
    }).then((res) => {
        setOrderListData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  const handleDateRangeWallet = () => {
    const startDateTimestamp = startDate ? startDate.getTime() : 0;
    const endDateTimestamp = endDate ? endDate.getTime() : new Date().getTime();

    apiClient.post("/api/wallet_history/query", {
      filters: [
        { field: "customer_id", op: "==", value: params.id },
        { field: "created_date", op: ">=", value: new Date(startDateTimestamp) },
        { field: "created_date", op: "<=", value: new Date(endDateTimestamp) }
      ],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setWalletData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  useEffect(() => {
    const getCurrentTimeOfDay = () => {
      const currentTime = new Date().getHours();
      if (currentTime < 12) {
        setTimeOfDay("Good Morning");
      } else if (currentTime >= 12 && currentTime < 18) {
        setTimeOfDay("Good Afternoon");
      } else {
        setTimeOfDay("Good Evening");
      }
    };

    getCurrentTimeOfDay();
  }, []);

  const fetchCustomerData = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }],
        limit: 1
      });
      const querySnapshot = res.data?.data || [];
      if (querySnapshot.length > 0) {
        const userDataFromDb = {
          id: querySnapshot[0]._id,
          data: querySnapshot[0],
        };
        setData(userDataFromDb);

        if (userDataFromDb.data && userDataFromDb.data.hub_name) {
          apiClient.post("/api/hubs_data/query", {
            filters: [{ field: "hub_name", op: "==", value: userDataFromDb.data.hub_name }]
          }).then((querySnapshot) => {
            const hubs = querySnapshot.data?.data || [];
            hubs.forEach((doc) => {
              setHubData(doc);
            });
          }).catch(() => {});

          apiClient.post("/api/hubs_users_data/query", {
            filters: [{ field: "hub_user_id", op: "==", value: userDataFromDb.data.delivery_exe_id }]
          }).then((userSnapshot) => {
            const users = userSnapshot.data?.data || [];
            if (users.length > 0) {
              setDeliveryExecutives(users);
            }
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }, [params.id]);

  const fetchWalletData = useCallback(() => {
    apiClient.post("/api/wallet_history/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
      setWalletData(
        (res.data?.data || []).map((doc) => ({
          id: doc._id,
          data: doc,
        }))
      );
    });
  }, [params.id]);

  const fetchDeliveryPreferences = useCallback(() => {
    apiClient.post("/api/delivery_preference/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }]
    }).then((res) => {
      setdelPreData(
        (res.data?.data || []).map((doc) => ({
          id: doc._id,
          data: doc,
        }))
      );
    });
  }, [params.id]);

  useEffect(() => {
    fetchCustomerData();
    fetchWalletData();
    fetchDeliveryPreferences();
    productmap();
    const odId = generateCustomerId();
    setOid(odId);
  }, [fetchCustomerData, fetchWalletData, fetchDeliveryPreferences]);

  useEffect(() => {
    const getCurrentTimeOfDay = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        setTimeOfDay("Good Morning");
      } else if (currentHour < 18) {
        setTimeOfDay("Good Afternoon");
      } else {
        setTimeOfDay("Good Evening");
      }
    };
    getCurrentTimeOfDay();
  }, []);

  useEffect(() => {
    productmap();
    const odId = generateCustomerId();
    setOid(odId);
    let isActive = true;
    apiClient.post("/api/customers_data/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      limit: 1
    }).then((res) => {
        const querySnapshot = res.data?.data || [];
        if (querySnapshot.length > 0 && isActive) {
          const userDataFromDb = {
            id: querySnapshot[0]._id,
            data: querySnapshot[0],
          };
          setData(userDataFromDb);

          if (userDataFromDb.data && userDataFromDb.data.hub_name) {
            apiClient.post("/api/hubs_data/query", {
              filters: [{ field: "hub_name", op: "==", value: userDataFromDb.data.hub_name }]
            }).then((querySnapshot) => {
                const hubs = querySnapshot.data?.data || [];
                hubs.forEach((doc) => {
                  setHubData(doc);
                });
              }).catch(() => {});

            const de = [];
            apiClient.post("/api/hubs_users_data/query", {
              filters: [{ field: "hub_user_id", op: "==", value: userDataFromDb.data.delivery_exe_id }]
            }).then((userSnapshot) => {
                const users = userSnapshot.data?.data || [];
                users.forEach((doc) => {
                  de.push(doc);
                });
                setDeliveryExecutives(de);
              }).catch(() => {});

            setUserMapID({}); // Reset state

            apiClient.post("/api/hubs_users_data/query", {
              filters: [{ field: "hub_name", op: "==", value: userDataFromDb.data.hub_name }]
            }).then((snapshot) => {
                const users = snapshot.data?.data || [];
                const userMapIDData = users.map((data) => {
                  const { hub_user_id, first_name, last_name, phone_no } = data;
                  return {
                    [hub_user_id]: `${first_name} ${last_name}`,
                    [hub_user_id + "_phone"]: phone_no,
                  };
                });
                setUserMapID(Object.assign({}, ...userMapIDData));
              });
          }
        }
      });

    return () => { isActive = false; };
  }, [params.id]);

  const handleSaveAddress = async () => {
    if (!alltranteAddress.trim()) {
      console.warn("⚠️ No alternate address provided!");
      Swal.fire({
        icon: "warning",
        title: "Please enter an alternate address.",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const customerId = params.id; // Fetching customer ID from params

      // Fetch customer document using customer_id
      const customerSnapshot = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: customerId }]
      }).then(res => res.data?.data || []);

      if (customerSnapshot.length === 0) {
        console.warn("⚠️ Customer not found!");
        Swal.fire({
          icon: "error",
          title: "Customer not found!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      const customerDoc = customerSnapshot[0];
      const customerData = customerDoc; // Extract customer data

      // Update the alternate address
      await apiClient.patch(`/api/customers_data/${customerDoc._id}`, {
        backend_instructions: alltranteAddress,
        updated_at: new Date(),
      });

      // Add customer activity log
      await createCustomerActivity({
        description: `Backend Instruction updated to "${alltranteAddress}" by ${loggedIn_user}`,
        customer_phone: customerData.customer_phone,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
        created_date: new Date().toISOString(),
        object: "Address Update",
        action: "Update",
        user: loggedIn_user,
      });

      Swal.fire({
        icon: "success",
        title: "Alternate address updated successfully!",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      setAlltranteAddress(""); // Clear input field
      handleCloseAddressModal(); // Close modal
    } catch (error) {
      console.error("❌ Error updating alternate address:", error);
      Swal.fire({
        icon: "error",
        title: "Error occurred while updating address",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleSaveInstruction = async () => {
    if (!instruction.trim()) {
      console.warn("⚠️ No instruction provided!");
      return;
    }

    try {
      const customerId = params.id; // Customer ID from params

      // Fetch customer data to get delivery_exe_id
      const customerSnapshot = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: customerId }]
      }).then(res => res.data?.data || []);

      if (customerSnapshot.length === 0) {
        console.warn("⚠️ Customer not found!");
        Swal.fire({
          icon: "error",
          title: "Customer not found!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      const customerData = customerSnapshot[0];
      const deliveryExeId = customerData.delivery_exe_id; // Get assigned delivery_exe_id

      if (!deliveryExeId) {
        console.warn("⚠️ No delivery executive assigned!");
        Swal.fire({
          icon: "error",
          title: "No delivery executive assigned!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      // Update instruction in the customers_data
      await apiClient.patch(`/api/customers_data/${customerSnapshot[0]._id}`, {
        instruction: instruction,
        timestamp: new Date(),
      });

      // **Add Customer Activity Log**
      await createCustomerActivity({
        description: `Special instruction updated to "${instruction}" by ${loggedIn_user}`,
        customer_phone: customerData.customer_phone,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
        delivery_exe_id: deliveryExeId, // Adding delivery executive ID
        created_date: new Date().toISOString(),
        object: "Instruction Update",
        action: "Update",
        user: loggedIn_user,
      });

      Swal.fire({
        icon: "success",
        title: "Instruction updated successfully!",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      setInstruction(""); // Clear input
      handleCloseModal(); // Close modal
    } catch (error) {
      console.error("❌ Error saving/updating instruction:", error);
      Swal.fire({
        icon: "error",
        title: "Error occurred while saving instruction",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };


  useEffect(() => {
    if (!params.id) {
      console.error("Customer ID is not defined");
      return;
    }

    const unsubscribe = listenToTickets();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [params.id]);

  const listenToTickets = () => {
    const ticketOrder = {
      Open: 1,
      ["In Progress"]: 2,
      Resolved: 3,
    };
    apiClient.post("/api/customers_tickets/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }]
    }).then((res) => {
      const snapshot = res.data?.data || [];
      if (snapshot.length > 0) {
        const fineData = snapshot.map((doc) => ({
          ref: doc._id, // Store ID instead of ref
          id: doc._id,
          data: doc,
        }));
        const sortData = fineData.sort(
          (a, b) => ticketOrder[a.data.status] - ticketOrder[b.data.status]
        );
        setTicketsData(sortData);
      } else {
        setTicketsData([]);
      }
    });

    return () => {}; // return empty function instead of unsubscribe
  };

  const AddTicketActivity = async (ticketData, action) => {
    try {
      const activityData = {
        customer_name: ticketData.customer_name,
        customer_id: ticketData.customer_id,
        customer_phone: ticketData.customer_phone,
        object: "Ticket Action",
        action: "status update",
        description: `Ticket ${ticketData.ticket_id} was ${action} by ${username}`,
        platform: "crm",
        user: username,
        created_date: new Date(Date.now()),
        date: new Date(Date.now()),
      };
      await apiClient.post("/api/customer_activities", activityData);
    } catch (err) {
    }
  };

  const HandleTicketAction = async (ticketRef, action, ticketData) => {
    try {
      await apiClient.patch(`/api/tickets/${ticketRef}`, { status: action });
      await AddTicketActivity(ticketData, action);
    } catch (err) {
      console.error(err.message);
    }
  };
  const OpenAttachment = (link) => {
    window.open(link, "_blank");
  };

  useEffect(() => {
    apiClient.post("/api/customer_activities/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setActivitiesData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  }, []);

  useEffect(() => {
    async function fetchOrderHistoryCount() {
      try {
        const snapshot = await apiClient.post("/api/order_history/query", {
          filters: [{ field: "customer_id", op: "==", value: params.id }]
        }).then(res => res.data?.data || []);
        setOrderHistoryCount(snapshot.length);
      } catch (error) {
        console.error("Error fetching order history count: ", error);
      }
    }

    fetchOrderHistoryCount();
  }, [params.id]);
  const fetchOrderHistory = () => {
    apiClient.post("/api/order_history/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [{ field: "created_date", direction: "desc" }]
    }).then((res) => {
        setOrderListData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  };

  useEffect(() => {
    fetchOrderHistory();
  }, [params.id]);

  useEffect(() => {
    const uniqueOrdersMap = new Map();

    orderListData.forEach((order) => {
      const orderID = order.data.order_id;
      if (!uniqueOrdersMap.has(orderID)) {
        uniqueOrdersMap.set(orderID, order);
      }
    });

    const uniqueOrdersArray = Array.from(uniqueOrdersMap.values());

    uniqueOrdersArray.sort((a, b) => {
      const dateA = toDate(a.data.created_date);
      const dateB = toDate(b.data.created_date);
      return dateB - dateA;
    });

    setUniqueOrders(uniqueOrdersArray);
  }, [orderListData]);

  useEffect(() => {
    apiClient.post("/api/wallet_history/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }],
      orderBy: [
        { field: "created_date", direction: "desc" },
        { field: "current_wallet_balance", direction: "asc" }
      ]
    }).then((res) => {
        setWalletData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  }, []);

  useEffect(() => {
    apiClient.post("/api/delivery_preference/query", {
      filters: [{ field: "customer_id", op: "==", value: params.id }]
    }).then((res) => {
        setdelPreData(
          (res.data?.data || []).map((doc) => ({
            id: doc._id,
            data: doc,
          }))
        );
      });
  }, []);

  const openWallet = () => {
    const modal = new window.bootstrap.Modal(document.getElementById('exampleModal-wallet'));
    modal.show();
  };

  const closeWallet = () => {
    window.customerWalletclose();
  };

  const openCredit = () => {
    const modal = new window.bootstrap.Modal(document.getElementById('exampleModal-credit'));
    modal.show();
  };

  const closeCredit = () => {
    window.customerCreditclose();
  };

  const openCreditFromCheckout = () => {
    // alert("ooo")
    window.customerCredittopenFromCheckout();
  };

  const closeCreditFromCheckout = () => {
    window.customerCreditcloseFromCheckout();
    setShowCreditButton(false);
  };

  const openDF = () => {
    const modal = new window.bootstrap.Modal(document.getElementById('exampleModal-df'));
    modal.show();
  };

  const closeDF = () => {
    window.customerDFclose();
  };

  const openCash = () => {
    openSpecificModal("#exampleModal-2-cash");
  };

  const closeCash = () => {
    window.customerCashclose();
  };

  const openSRL = () => {
    openSpecificModal("#exampleModal-2-srl");
  };

  const openTickets = () => {
    openSpecificModal("#exampleModal-2-tickets");
  };

  const closeSRL = () => {
    window.customerSRLclose();
  };

  const openVacationModal = (vacation = null) => {
    setSelectedVacation(vacation);
  };

  const addTickets = () => {
    setEdit(false);
    openTickets();
    setSubmitTickets({
      category: "",
      status: "",
      priority: "",
      due_date: "",
      owner: loggedIn_user,
      description: "",
      visible_on: "",
      status: "1",
      created_date: new Date(),
      updated_date: new Date(),
    });
  };

  const editTickets = (data, id) => {
    setEdit(true);
    setEditID(id);
    setSubmitTickets({
      category: data.category,
      status: data.status,
      priority: data.priority,
      due_date: moment(normalizeDateValue(data.due_date).toISOString()).format(
        "YYYY-MM-DD"
      ),
      owner: data.owner,
      description: data.description,
      visible_on: data.visible_on,
      data_status: "1",
      created_date: new Date(),
      updated_date: new Date(),
      ticket_id: data.ticket_id,
    });
    setOldTicketData(data);
    openTickets();
  };

  const initialFormEditSubs = {
    end_date: "",
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
    interval: 0,
    next_delivery_date: "",
    product_name: "",
    quantity: 0,
    subscription_type: "",
    price: 0,
    status: "",
    updated_date: new Date(),
  };
  const [editSubs, setEditSubs] = useState(initialFormEditSubs);
  const [idES, setIdES] = useState("");
  const opensedit = (subs, id) => {
    setEditSubs({
      subscription_id: subs.subscription_id,
      end_date: subs.end_date,
      monday: subs.monday,
      tuesday: subs.tuesday,
      wednesday: subs.wednesday,
      thursday: subs.thursday,
      friday: subs.friday,
      saturday: subs.saturday,
      sunday: subs.sunday,
      interval: subs.interval,
      next_delivery_date: subs.next_delivery_date,
      product_name: subs.product_name,
      quantity: subs.quantity,
      subscription_type: subs.subscription_type,
      price: subs.price,
      status: subs.status,
      updated_date: new Date(),
    });
    setIdES(id);
    openSpecificModal("#exampleModal-2-edit");
  };

  const closesedit = () => {
    window.seditclose();
  };

  const handleChangeES = (e) => {
    const { name, value } = e.target;
    setEditSubs((prevState) => ({ ...prevState, [name]: value }));
  };

  const [nthES, setNthES] = useState(false);
  const handleIntervalChangeES = (interval) => {
    if (interval === "nth") {
      setNthES(true);
      setEditSubs((prevState) => ({ ...prevState, interval }));
    } else {
      setNthES(false);
      setEditSubs((prevState) => ({ ...prevState, interval }));
    }
  };

  const handleQuantityChangeES = (delta) => {
    setEditSubs((prevState) => ({
      ...prevState,
      quantity: Math.max(0, prevState.quantity + delta),
    }));
  };

  const handleNthDayChangeES = (e) => {
    const value = e.target.value;
    setEditSubs((prevState) => ({ ...prevState, interval: value }));
  };

  /** subscripation all  activity records here */
  const handleSubmitES = async (e) => {
    e.preventDefault();


    const nextDeliveryDates = new Date();

    if (editSubs.subscription_type !== "Custom") {
      nextDeliveryDates.setDate(
        nextDeliveryDates.getDate() +
          (editSubs.subscription_type === "Everyday"
            ? 1
            : parseInt(editSubs.interval))
      );
    }

    try {
      // Fetch current subscription data
      const subscriptionDocs = await apiClient.post("/api/subscriptions_data/query", {
        filters: [{ field: "_id", op: "==", value: idES }]
      }).then(res => res.data?.data || []);

      if (subscriptionDocs.length === 0) {
        throw new Error(`Subscription with ID ${idES} does not exist.`);
      }

      const currentData = subscriptionDocs[0];

      const initialQuantity = currentData?.quantity;
      const initialSubscriptionType = currentData?.subscription_type;
      const initialInterval = currentData?.interval;

      // Set default values for fields that might be undefined
      const updatedData = {
        monday: parseInt(editSubs.monday) || 0,
        tuesday: parseInt(editSubs.tuesday) || 0,
        wednesday: parseInt(editSubs.wednesday) || 0,
        thursday: parseInt(editSubs.thursday) || 0,
        friday: parseInt(editSubs.friday) || 0,
        saturday: parseInt(editSubs.saturday) || 0,
        sunday: parseInt(editSubs.sunday) || 0,
        interval:
          editSubs.subscription_type === "Everyday"
            ? 1
            : editSubs.subscription_type === "On-Interval"
            ? parseInt(editSubs.interval) || 0
            : 0,
        // next_delivery_date:
        //   editSubs.subscription_type === "Custom"
        //     ? editSubs.next_delivery_date || ""
        //     : moment(nextDeliveryDates).format("YYYY-MM-DD"),
        product_name: editSubs.product_name || "",
        quantity: parseInt(editSubs.quantity) || 0,
        subscription_type: editSubs.subscription_type || "",
        package_unit: editSubs.package_unit || "", // Correct field name
        price: parseInt(editSubs.price) || 0,
        status: editSubs.status || "",
        updated_date: new Date(),
      };


      await apiClient.patch(`/api/subscriptions_data/${idES}`, updatedData);

      closesedit();

      // Log for successful update

      // Ensure data object has the necessary fields
      if (!data || !data.data) {
        throw new Error("Data object is not defined properly.");
      }

      // Check if the quantity has changed
      if (initialQuantity !== parseInt(editSubs.quantity)) {
        await createCustomerActivity({
          customer_phone: data.data?.customer_phone ?? "N/A",
          customer_id: data.data?.customer_id ?? "N/A",
          customer_name: data.data?.customer_name ?? "N/A",
          customer_address: data.data?.customer_address ?? "N/A",
          hub_name: data.data?.hub_name ?? "N/A",
          delivery_exe_id: data.data?.delivery_exe_id ?? "N/A",
          user: "Server",
          object: "Edit Subscription",
          action: "Edit Subscription",
          description: `Subscription ID: ${
            editSubs?.subscription_id ?? "N/A"
          } for ${editSubs?.product_name ?? "N/A"} ${
            editSubs?.package_unit ?? "N/A"
          } has been edited through CRM by ${
            loggedIn_user ?? "Unknown"
          }. Quantity changed from ${initialQuantity ?? "N/A"} to ${
            editSubs.quantity
          }.`,
          date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        });
      }

      // Check if the subscription type has changed
      if (initialSubscriptionType !== editSubs.subscription_type) {
        let subscriptionChangeDescription = `Subscription ID: ${
          editSubs?.subscription_id ?? "N/A"
        } for ${editSubs?.product_name ?? "N/A"} ${
          editSubs?.package_unit ?? "N/A"
        } has been edited through CRM by ${
          loggedIn_user ?? "Unknown"
        }. Subscription type changed from ${
          initialSubscriptionType ?? "N/A"
        } to ${editSubs.subscription_type}.`;
        if (editSubs.subscription_type === "On-Interval") {
          subscriptionChangeDescription += ` Interval: ${editSubs.interval} days.`;
        } else if (editSubs.subscription_type === "Custom") {
          const days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const customQuantities = days
            .map((day) => {
              const quantity = editSubs[day.toLowerCase()];
              return quantity > 0 ? `${day}: ${quantity}` : null;
            })
            .filter(Boolean)
            .join(", ");
          subscriptionChangeDescription += ` Custom Quantities - ${customQuantities}.`;
        }
        await createCustomerActivity({
          customer_phone: data.data?.customer_phone ?? "N/A",
          customer_id: data.data?.customer_id ?? "N/A",
          customer_name: data.data?.customer_name ?? "N/A",
          customer_address: data.data?.customer_address ?? "N/A",
          hub_name: data.data?.hub_name ?? "N/A",
          delivery_exe_id: data.data?.delivery_exe_id ?? "N/A",
          user: "Server",
          object: "Edit Subscription",
          action: "Edit Subscription",
          description: subscriptionChangeDescription,
          date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        });
      }

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

      Toast.fire({
        icon: "success",
        title: "Subscription Updated Successfully",
      });
      // Proceed with the rest of your logic here, such as adding wallet history
    } catch (error) {
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

      Toast.fire({
        icon: "failure",
        title: "Error Occurred while updating Subscription",
      });
      console.error("Error updating subscription:", error);
    }
  };

  /**subscripation all  activity records  end */
  const reason = [
    { name: "Cash Deposit", action: "plus" },
    { name: "Recharge", action: "plus" },
    { name: "Bank Transfer", action: "plus" },
    { name: "Cheque Payment", action: "plus" },
    { name: "Via Payment Gateway", action: "plus" },
    { name: "Refund", action: "plus" },
    { name: "Adjustment (Positive)", action: "plus" },
    { name: "Adjustment (Negative)", action: "minus" },
    { name: "Penalty (Cheque Bounce)", action: "minus" },
    { name: "Penalty (Late Payment)", action: "minus" },
    { name: "Penalty (Bottle Charges)", action: "minus" },
    { name: "Last Cycle Payment", action: "minus" },
    { name: "Recharge Bonus", action: "plus" },
    { name: "Registration Bonus", action: "plus" },
    { name: "Referral Bonus", action: "plus" },
    { name: "Cashback", action: "plus" },
    { name: "Cashback Reversal", action: "minus" },
    { name: "Influencer Campaign", action: "plus" },
    { name: "Farm visit", action: "plus" },
  ];

  const del_mo = [
    "Ring Door Bell",
    "Drop at the Door",
    "In Hand Delivery",
    "Keep in Bag",
    "No Preference",
  ];

  const handleChangeCash = (e) => {
    const { id, value } = e.target;
    setSubmitCash({ ...submitCash, [id]: value });
  };

  const handleChangeSRL = (e) => {
    const { id, value, type, checked } = e.target;
    setSubmitSRL((prevState) => ({
      ...prevState,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitSRL = async (e) => {
    e.preventDefault();
    const buttonType = e.nativeEvent.submitter.getAttribute("data-type");

    if (buttonType != "copy") {
      // Validation check for email or SMS checkbox
      if (!submitSRL.email && !submitSRL.sms) {
        alert("Please check either Email or SMS.");
        return;
      }
    }
    const dataRL = {
      amount: submitSRL.amount,
      customer_id: data.data && data.data.customer_id,
      email: data.data && data.data.customer_email,
      name: data.data && data.data.customer_name,
      phone: data.data && data.data.customer_phone,
      created_date: new Date(),
    };

    try {
      // Save data to the link collection
      const docRef = await apiClient.post("/api/recharge_link", dataRL);

      if (buttonType === "copy") {
        // Copy the document ID to clipboard
        navigator.clipboard
          .writeText(`https://www.whytefarms.com/rechargelink/${docRef.id}`)
          .then(() => {
            closeSRL();
          })
          .catch((err) => {
            console.error("Error copying to clipboard: ", err);
          });
      } else if (buttonType === "send") {
        // alert('Document ID: ' + docRef.id);
        const myHeaders = new Headers();
        myHeaders.append("Cookie", "PHPSESSID=gjhn17aj59uck1uj3jgfan2b60");

        const requestOptions = {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        };

        // (TextLocal SMS is sent via backend now)
        //     .then((response) => response.text())
        //     .catch((error) => console.error(error));

        closeSRL();
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleChangeTickets = (e) => {
    const { id, value } = e.target;
    setSubmitTickets({ ...submitTickets, [id]: value });
  };

  const [selectedDays, setSelectedDays] = useState([]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleDayChange = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(
        selectedDays.filter((selectedDay) => selectedDay !== day)
      );
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const wallethistoryAdhoc = (action, amount, cwb, reason) => {
    const txn = generateCustomerId();

    apiClient.post("/api/wallet_history", {
        txn_id: txn,
        amount: amount,
        description: "Re-Order",
        reason: reason,
        customer_phone: data.data && data.data.customer_phone,
        customer_id: data.data && data.data.customer_id,
        customer_name: data.data && data.data.customer_name,
        hub_name: hubData.hub_name,
        delivery_executive: `${deliveryExecutives[0].first_name} ${deliveryExecutives[0].last_name}`,
        current_wallet_balance: cwb,
        status: "1",
        type: action,
        source: "Backend",
        user: loggedIn_user,
        created_date: new Date(),
      })
      .then(() => {
      })
      .catch((error) => {
        console.error("Error updating:", error);
      });
  };

  const wallethistory = (action, amount) => {
    const txn = generateCustomerId();

    apiClient.post("/api/wallet_history", {
        txn_id: txn,
        amount: amount,
        description: submit.description,
        reason: submit.reason,
        customer_phone: data.data && data.data.customer_phone,
        customer_id: data.data && data.data.customer_id,
        customer_name: data.data && data.data.customer_name,
        hub_name: hubData.hub_name,
        delivery_executive: `${deliveryExecutives[0].first_name} ${deliveryExecutives[0].last_name}`,
        current_wallet_balance: data.data?.wallet_balance,
        status: "1",
        type: action,
        source: "Backend",
        user: loggedIn_user,
        created_date: new Date(),
      })
      .then(() => {
      })
      .catch((error) => {
        console.error("Error updating:", error);
      });
  };

  const wallethistoryRefund = (action, amount, cba, reason) => {
    const txn = generateCustomerId();

    apiClient.post("/api/wallet_history", {
        txn_id: txn,
        amount: amount,
        description: "Cancelled Order",
        reason: reason,
        customer_phone: data.data && data.data.customer_phone,
        customer_id: data.data && data.data.customer_id,
        customer_name: data.data && data.data.customer_name,
        hub_name: hubData.hub_name,
        delivery_executive: `${deliveryExecutives[0].first_name} ${deliveryExecutives[0].last_name}`,
        current_wallet_balance: parseInt(cba),
        status: "1",
        type: action,
        source: "Backend",
        user: loggedIn_user,
        created_date: new Date(),
      })
      .then(() => {
      })
      .catch((error) => {
        console.error("Error updating:", error);
      });
  };
  const sendWalletUpdateSmS = async (phoneNo, amount, wallet_balance) => {

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const body = JSON.stringify({
      phoneNo: phoneNo,
      amount: amount,
      balance: wallet_balance,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: body,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        "http://whytefarms.com:5003/send-sms",
        requestOptions
      );


      const text = await response.text();

      const result = JSON.parse(text);
      if (result.Status === "Success") {
      } else {
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  };


  const [oiid, setOiid] = useState("");
  const [submitCR, setSubmitCR] = useState({ reason: "" });

  const handleChangeCR = (e) => {
    const { id, value } = e.target;
    setSubmitCR((prevState) => ({ ...prevState, [id]: value }));
  };

  const getCurrentTime = () => {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const seconds = currentTime.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const getCalendarDate = () => {
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    if (currentHour >= 23 && currentMinute <= 59) {
      setAfterEleven(true);
    } else {
      setAfterEleven(false);
    }
  };

  const handleSubmitMarkDelivered = async (e) => {
    e.preventDefault();
    //const totalAmount = calculateTotalAmount(oiid);
    const { utilised_wallet_balance, utilised_credit_limit } =
      await extractUtilisedBalances(oiid);
    let walletBalance = 0;
    let creditLimit = 0;

    // if (utilised_credit_limit > 0 && data.data?.wallet_balance < 0) {
    walletBalance =
      data.data?.wallet_balance +
      utilised_wallet_balance +
      utilised_credit_limit;
    creditLimit = data.data?.credit_limit + utilised_credit_limit;
    // } else {
    //   walletBalance = data.data?.wallet_balance + utilised_wallet_balance;
    //   creditLimit = data.data?.credit_limit + utilised_credit_limit;
    // }
    if (oiidStatus === "1") {
      try {
        // Query documents with matching order_id
        const orderDocs = await apiClient.post("/api/order_history/query", {
          filters: [{ field: "order_id", op: "==", value: oiid }]
        }).then(res => res.data?.data || []);

        // Update status for each matching document
        const updates = orderDocs.map((doc) =>
          apiClient.patch(`/api/order_history/${doc._id}`, {
            status: "1",
            delivery_time: getCurrentTime(),
          })
        );
        await Promise.all(updates);
        apiClient.post("/api/customer_activities", {
            customer_phone: data.data && data.data.customer_phone,
            customer_id: data.data && data.data.customer_id,
            customer_name: data.data && data.data.customer_name,
            customer_address: data.data && data.data.customer_name,
            hub_name: data.data && data.data.hub_name,
            delivery_exe_id: data.data && data.data.delivery_exe_id,
            user: loggedIn_user,
            object: "Mark Delivery",
            action: "Delivery",
            description: `Order Id: ${oiid} Delivery on ${moment(
              new Date()
            ).format("DD-MM-YYYY")} by ${loggedIn_user}`,
            //'description': description,
            date: new Date(),
            created_date: new Date(),
          })
          .then(() => {
          });

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

        Toast.fire({
          icon: "Updated",
          title: "Updated Successfully",
        });
        closemdlv();

        // Handle success
      } catch (error) {
        // Handle error
        console.error("Error updating order status:", error);
      }
    } else {
      try {
        wallethistoryRefund(
          "Credit",
          utilised_wallet_balance + utilised_credit_limit,
          walletBalance,
          submitCR.reason
        );
        // Query documents with matching order_id
        const orderDocs = await apiClient.post("/api/order_history/query", {
          filters: [{ field: "order_id", op: "==", value: oiid }]
        }).then(res => res.data?.data || []);

        // Update status for each matching document
        const updates = orderDocs.map((doc) =>
          apiClient.patch(`/api/order_history/${doc._id}`, {
            status: "2",
            cancelled_reason: submitCR.reason,
            cancelled_time: getCurrentTime(),
          })
        );
        await Promise.all(updates);
        //const amount = parseInt(data.data?.wallet_balance) + parseInt(totalAmount)
        apiClient.post("/api/customers_data/query", {
          filters: [{ field: "customer_id", op: "==", value: params.id }]
        }).then(async (res) => {
            const docs = res.data?.data || [];
            await Promise.all(docs.map(doc => 
              apiClient.patch(`/api/customers_data/${doc._id}`, {
                  wallet_balance: parseInt(walletBalance),
                  credit_limit: parseInt(creditLimit),
              }).then(() => {
              }).catch((error) => {
                  console.error("Error updating wallet balance:", error);
              })
            ));
          });
        apiClient.post("/api/customer_activities", {
            customer_phone: data.data && data.data.customer_phone,
            customer_id: data.data && data.data.customer_id,
            customer_name: data.data && data.data.customer_name,
            customer_address: data.data && data.data.customer_name,
            hub_name: data.data && data.data.hub_name,
            delivery_exe_id: data.data && data.data.delivery_exe_id,
            user: loggedIn_user,
            object: "Order",
            action: "Cancel",
            description: `Your Order Id: ${oiid} had been cancelled by ${loggedIn_user} with Reason ${submitCR.reason}`,
            //'description': description,
            date: new Date(),
            created_date: new Date(),
          })
          .then(() => {
          });
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

        Toast.fire({
          icon: "Updated",
          title: "Updated Successfully",
        });
        closemdlv();

        // Handle success
      } catch (error) {
        // Handle error
        console.error("Error updating order status:", error);
      }
    }
  };

  const [filter, setFilter] = useState("all");

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredData = walletData?.filter(({ data }) => {
    if (filter === "all") return true;
    return data.type.toLowerCase() === filter.toLowerCase();
  });
  const [loadingCredit, setLoadingCredit] = useState(false);



  /** add cash collection start*/

  const handleSubmitCash = async (e) => {
    e.preventDefault();

    if (deliveryExecutives[0] === undefined) {
      alert("No Delivery Executive Found");
      return;
    }
    setLoading(true); // Disable button

    try {
      // Add cash collection document
      await apiClient.post("/api/cash_collection", {
        amount: parseInt(submitCash.amount),
        collected_amount: 0,
        created_date: new Date(),
        customer_id: data.data?.customer_id,
        customer_name: data.data?.customer_name,
        customer_phone: data.data?.customer_phone,
        customer_address: data.data?.customer_address,
        date: submitCash.date,
        delivery_exe_id: `${deliveryExecutives[0].hub_user_id}`,
        delivery_executive_name: `${deliveryExecutives[0].first_name} ${deliveryExecutives[0].last_name}`,
        delivery_executive_phone: deliveryExecutives[0].phone_no,
        description: "",
        status: "0",
        time: submitCash.time,
        updated_date: new Date(),
        created_by: localStorage.getItem("loggedIn_user") || "admin",
        created_user_id: localStorage.getItem("userId") || "0000",
      });


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

      Toast.fire({
        icon: "success",
        title: "Created Successfully",
      });

      // Record activity
      await createCustomerActivity({
        customer_phone: data.data?.customer_phone,
        customer_id: data.data?.customer_id,
        customer_name: data.data?.customer_name,
        customer_address: data.data?.customer_address,
        hub_name: data.data?.hub_name,
        delivery_exe_id: deliveryExecutives[0].hub_user_id,
        user: loggedIn_user,
        object: "Cash collection request",
        action: "Cash collection request",
        description: `Cash collection request of Amount ${submitCash.amount} has been raised by ${loggedIn_user} for ${submitCash.date}`,
        date: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });

      // Reset form state
      closeCash();
      setSubmitCash({
        amount: "",
        date: "",
        time: "",
        status: "",
        created_date: new Date(),
      });
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setLoading(false); // Re-enable the button
    }
  };

  // Vacation and Tickets related logic moved to modular components

  //make outbound call
  const triggerCallAPI = async (customerPhone) => {
    try {
      const userId = localStorage.getItem("userId");
      await makeKnowlarityCall({ customerPhone, userId });
    } catch (error) {
      console.error("Error triggering outbound call:", error);
    }
  };

  const handleSubmitTickets = (e) => {
    e.preventDefault();

    if (edit) {
      setLoading(true);
      apiClient.patch(`/api/customers_tickets/${editID}`, {
          category: submitTickets.category,
          status: submitTickets.status,
          source: "Backend",
          priority: submitTickets.priority,
          due_date: new Date(submitTickets.due_date),
          owner: submitTickets.owner,
          description: submitTickets.description,
          visible_on: submitTickets.visible_on,
          data_status: "1",
          updated_date: new Date(),
        })
        .then(() => {
          let changes = calculateChanges(oldTicketData, submitTickets);
          apiClient.post("/api/customer_activities", {
              customer_phone: data.data && data.data.customer_phone,
              customer_id: data.data && data.data.customer_id,
              customer_name: data.data && data.data.customer_name,
              customer_address: data.data && data.data.customer_name,
              hub_name: data.data && data.data.hub_name,
              delivery_exe_id: data.data && data.data.delivery_exe_id,
              user: loggedIn_user,
              object: "Ticket",
              action: "Update Ticket",
              description: `Ticket with id ${submitTickets.ticket_id} is updated by ${loggedIn_user}`,
              date: new Date(),
              changes: changes,
              created_date: new Date(),
            })
            .then(() => {
            });
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
          Toast.fire({
            icon: "success",
            title: "Ticket Updated Successfully",
          });
          closeTickets();
          setSubmitTickets({
            category: "",
            status: "",
            priority: "",
            due_date: "",
            owner: loggedIn_user || "",
            description: "",
            visible_on: "",
            status: "1",
            created_date: new Date(),
            updated_date: new Date(),
          });
          setLoading(false);
          setEdit(false);
          setEditID("");
          listenToTickets();
        });
    } else {
      setLoading(true);
      apiClient.post("/api/customers_tickets", {
          ticket_id: `${generateRandomTicket()}`,
          category: submitTickets.category,
          status: submitTickets.status,
          source: "Backend",
          priority: submitTickets.priority,
          due_date: new Date(submitTickets.due_date),
          owner: submitTickets.owner,
          description: submitTickets.description,
          visible_on: submitTickets.visible_on,
          data_status: "1",
          customer_phone: data.data && data.data.customer_phone,
          customer_id: data.data && data.data.customer_id,
          customer_name: data.data && data.data.customer_name,
          updated_date: new Date(),
          created_date: new Date(),
        })
        .then(() => {
          apiClient.post("/api/customer_activities", {
              customer_phone: data.data && data.data.customer_phone,
              customer_id: data.data && data.data.customer_id,
              customer_name: data.data && data.data.customer_name,
              customer_address: data.data && data.data.customer_name,
              hub_name: data.data && data.data.hub_name,
              delivery_exe_id: data.data && data.data.delivery_exe_id,
              user: loggedIn_user,
              object: "Ticket",
              action: "Update Ticket",
              description: `Feedback Ticket is created by ${loggedIn_user}`,
              date: new Date(),
              created_date: new Date(),
            })
            .then(() => {
            });
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
          closeTickets();
          setSubmitTickets({
            category: "",
            status: "",
            priority: "",
            due_date: "",
            owner: loggedIn_user || "",
            description: "",
            visible_on: "",
            status: "1",
            created_date: new Date(),
            updated_date: new Date(),
          });
          setLoading(false);
          Toast.fire({
            icon: "success",
            title: "Customer Added",
          });
          listenToTickets();
        });
    }
  };

  const deleteTickets = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        apiClient.delete(`/api/customers_tickets/${id}`)
          .then(() => {
            apiClient.post("/api/customer_activities", {
                description: `Ticket is deleted by ${loggedIn_user}`,
                customer_phone: data.data && data.data.customer_phone,
                customer_id: data.data && data.data.customer_id,
                customer_name: data.data && data.data.customer_name,
                created_date: new Date(),
                user: loggedIn_user,
                action: "Ticket",
                object: "Ticket",
              })
              .then(() => {
              });
              setSubmitTickets({
                category: "",
                status: "",
                priority: "",
                due_date: "",
                owner: loggedIn_user || "",
                description: "",
                visible_on: "",
                status: "1",
                created_date: new Date(),
                updated_date: new Date(),
              });
              listenToTickets();
              Swal.fire("Deleted!", "Data has been deleted.", "success");
            });
        }
      });
  };

  const renderCheckboxPairs = () => {
    const pairs = [];
    for (let i = 0; i < daysOfWeek.length - 1; i += 2) {
      const pair = [daysOfWeek[i], daysOfWeek[i + 1]];
      pairs.push(pair);
    }

    // Check if there's an odd number of days
    if (daysOfWeek.length % 2 !== 0) {
      const singleDay = [daysOfWeek[daysOfWeek.length - 1]];
      pairs.push(singleDay);
    }

    return pairs.map((pair, index) => (
      <div
        key={index}
        className="form-row"
        style={{ display: "flex", paddingLeft: "38px" }}
      >
        {pair.map((day) => (
          <div key={day} className="form-check col">
            <input
              type="checkbox"
              id={day}
              checked={selectedDays.includes(day)}
              onChange={() => handleDayChange(day)}
              className="form-check-input"
            />
            <label htmlFor={day} className="form-check-label">
              {day}
            </label>
          </div>
        ))}
      </div>
    ));
  };

  const tabs = (name) => {
    setActivetab(name);
  };

  const CustomDatePickerIcon = React.forwardRef(({ value, onClick }, ref) => (
    <span className="calender-placment" onClick={onClick} ref={ref}>
      <i className="mdi mdi-calendar" />
    </span>
  ));

  const handleRemoveProduct = async (orderId, productId) => {
    try {
      // Fetch the current order data
      const orderDocs = await apiClient.post("/api/order_history/query", {
        filters: [{ field: "_id", op: "==", value: orderId }]
      }).then(res => res.data?.data || []);

      if (orderDocs.length === 0) {
        console.error("Order not found");
        return;
      }
      const orderData = orderDocs[0]; // Define orderData here

      // Find the index of the product to remove
      const productIndex = orderData.products.findIndex(
        (product) => product.subscription_id === productId
      );

      // Ensure the product exists in the array
      if (productIndex === -1) {
        console.error("Product not found in the order");
        return;
      }

      // Remove the product from the array
      const updatedProducts = [...orderData.products];
      updatedProducts.splice(productIndex, 1);

      // Update the order document with the updated products array
      if (updatedProducts.length === 0) {
        // If there are no more products, delete the entire document
        await apiClient.delete(`/api/order_history/${orderId}`);
      } else {
        // Otherwise, update the order document with the updated products array
        await apiClient.patch(`/api/order_history/${orderId}`, { products: updatedProducts });
      }
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };

  const [discounts, setDiscounts] = useState({});

  useEffect(() => {
  }, [discounts]);

  const handleDiscountChange = (productId, event) => {
    let { value } = event.target;

    if (value.includes("-")) {
      value = value.replace("-", "");
    }

    if (isNaN(value)) value = "";

    setDiscounts((prevDiscounts) => ({
      ...prevDiscounts,
      [productId]: value || "",
    }));
  };


  const calculateFinalPrice = (price, discount) => {
    return price - (discount || 0);
  };

  const resetCalendar = () => {
    setCalendarDate(getTomorrowDate());
  };

  /** pauseSubscripation start */

  const handlePauseSubscription = async (e) => {
    e.preventDefault();
    if (selectedSubIdToPause !== "" && selectedSubscriptionToPause !== "") {
      // Calculate next delivery date as resumeDate + 1 day
      const calculatedNextDeliveryDate = resumeDate
        ? moment(resumeDate).add(0, "days").format("YYYY-MM-DD")
        : moment().add(1, "days").format("YYYY-MM-DD");
      try {
        await apiClient.patch(`/api/subscriptions_data/${selectedSubIdToPause}`, {
            status: "0",
            resume_date: resumeDate ? moment(resumeDate).format("YYYY-MM-DD") : "",
            next_delivery_date: calculatedNextDeliveryDate,
            updated_date: new Date(),
          })
          .then(() => {
            })
          .catch((error) =>
            console.error("Error updating subscription:", error)
          );

        await apiClient.post("/api/customer_activities", {
            customer_phone: data.data?.customer_phone,
            customer_id: data.data?.customer_id,
            customer_name: data.data?.customer_name,
            customer_address: data.data?.customer_name,
            hub_name: data.data?.hub_name,
            delivery_exe_id: data.data?.delivery_exe_id,
            user: loggedIn_user,
            object: "Subscription",
            action: "Paused",
            description: `Subscription ID: ${
              selectedSubscriptionToPause.subscription_id
            } for ${selectedSubscriptionToPause.product_name} ${
              selectedSubscriptionToPause.package_unit
            } was paused by ${loggedIn_user} through CRM. Updated resume date: ${resumeDate?
              moment(resumeDate).format("DD-MM-YYYY") :
              "no resume date selected"
            }`,
            date: new Date(),
            created_date: new Date(),
          })
          .then(() => {
          })
          .catch((error) => console.error("Error logging activity:", error));

        closePauseSubDialog();
      } catch (error) {
        console.error("Error handling pause subscription:", error);
      }
    }
  };

  const changeSubcriptionStatus = async (id, subscription) => {
    
    const today = new Date();
    const tomorrow = new Date(today);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    if (currentHour >= 23 && currentMinute <= 59) {
      tomorrow.setDate(tomorrow.getDate() + 2);
    } else {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    const updatedNextDeliveryDate = moment(tomorrow).format("YYYY-MM-DD");
   
    if (subscription.status === "0") {
      try {
        await apiClient.patch(`/api/subscriptions_data/${id}`, {
            status: "1",
            next_delivery_date: updatedNextDeliveryDate,
            updated_date: new Date(),
            resume_date: updatedNextDeliveryDate,
            reason: "",
          })
          .then(() =>{
          }
          )
          .catch((error) =>
            console.error("Error updating subscription:", error)
          );

        await apiClient.post("/api/customer_activities", {
            customer_phone: data.data?.customer_phone,
            customer_id: data.data?.customer_id,
            customer_name: data.data?.customer_name,
            customer_address: data.data?.customer_name,
            hub_name: data.data?.hub_name,
            delivery_exe_id: data.data?.delivery_exe_id,
            user: loggedIn_user,
            object: "Subscription",
            action: "Activated",
            description: `Subscription ID: ${subscription.subscription_id} for ${subscription.product_name} ${subscription.package_unit} was activated by ${loggedIn_user} through the system. Next delivery date: ${updatedNextDeliveryDate}`,
            date: new Date(),
            created_date: new Date(),
          })
          .then(() => {
      })
          .catch((error) => console.error("Error logging activity:", error));
      } catch (error) {
        console.error("Error changing subscription status:", error);
      }
    } else {
      setSelectedSubscriptionToPause(subscription);
      setSelectedSubIdToPause(id);
      setResumeDate(null);
      openPauseSubDialog();
    }
  };

  /** pauseSubscripation end */

  const [filterText, setFilterText] = useState("");
  // Handle search input change
  const handleSearchChange = (e) => {
    setFilterText(e.target.value.toLowerCase());
  };

  const filteredProducts = products.filter(
    ({ data }) =>
      data.productName.toLowerCase().includes(filterText) &&
      (data.publishOnCRM === true || data.inStock === true)
  );

  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control"
      value={value}
      onClick={onClick}
      ref={ref}
      readOnly // ✅ disables typing
      style={{ cursor: "pointer", backgroundColor: "#fff" }}
    />
  ));

  return (
    <>
      <style>{profilePageStyles}</style>
      <div className="container-scroller">
        <TopPanel />

        <div class="container-fluid page-body-wrapper">
          <Sidebar />

          <div class="main-panel">
            <div class="content-wrapper">
              <div class="row">
                <div class="col-sm-12">
                  <div class="home-tab">
                    <div class="d-sm-flex align-items-center justify-content-between">
                      <ul class="nav nav-tabs" role="tablist"></ul>
                      <div>
                        <div class="btn-wrapper"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ----- Start - For Navbar */}
              <div
                class="col-md-12 col-xl-12 stretch-card"
                style={{ marginBottom: "10px" }}
              >
                <div class="card">
                  <div class="card">
                    <div class="home-tab">
                      <div class="align-items-center justify-content-between border-bottom">
                        <ul
                          class="nav nav-tabs"
                          role="tablist"
                          style={{
                            background: "#4751b2",
                            borderRadius: "15px",
                          }}
                        >
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Home")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Home" ? "custom-active" : ""
                              } ps-0`}
                              style={{ color: "#fff", marginLeft: "1.4rem" }}
                              id="home-tab"
                              data-bs-toggle="tab"
                              href="#overview"
                              role="tab"
                              aria-controls="overview"
                              aria-selected="true"
                            >
                              {" "}
                              <i
                                class="icon-home"
                                style={{
                                  marginRight: "5px",
                                  marginLeft: "15px",
                                }}
                              ></i>
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Subscription")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Subscription"
                                  ? "custom-active"
                                  : ""
                              }`}
                              id="profile-tab"
                              data-bs-toggle="tab"
                              href="#audiences"
                              role="tab"
                              aria-selected="false"
                            >
                              Subscription ({subscriptionData.length})
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Orders")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Orders" ? "custom-active" : ""
                              }`}
                              id="profile-tab"
                              data-bs-toggle="tab"
                              href="#audiences"
                              onClick={() => fetchOrderHistory()}
                              role="tab"
                              aria-selected="false"
                            >
                              Orders ({uniqueOrders.length})
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Wallet")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Wallet" ? "custom-active" : ""
                              }`}
                              id="contact-tab"
                              data-bs-toggle="tab"
                              href="#demographics"
                              role="tab"
                              aria-selected="false"
                            >
                              Wallet
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Activities")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Activities"
                                  ? "custom-active"
                                  : ""
                              }`}
                              id="contact-tab"
                              data-bs-toggle="tab"
                              href="#demographics"
                              role="tab"
                              aria-selected="false"
                            >
                              Activities
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Tickets")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Tickets" ? "custom-active" : ""
                              }`}
                              id="contact-tab"
                              data-bs-toggle="tab"
                              href="#demographics"
                              role="tab"
                              aria-selected="false"
                            >
                              Tickets (
                              {ticketsData.length === 0
                                ? "0"
                                : ticketsData.length}
                              )
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("Vacation")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "Vacation" ? "custom-active" : ""
                              }`}
                              id="contact-tab"
                              data-bs-toggle="tab"
                              href="#demographics"
                              role="tab"
                              aria-selected="false"
                            >
                              Vacation (
                              {vacationData.length === 0
                                ? "0"
                                : vacationData.length}
                              )
                            </a>
                          </li>

                          <li
                            class="nav-item"
                            onClick={() => setActivetab("conversastion_logs")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "conversastion_logs"
                                  ? "custom-active"
                                  : ""
                              }`}
                              style={{ color: "#fff" }}
                              id="conversastion_logs-tab"
                              data-bs-toggle="tab"
                              href="#overview"
                              role="tab"
                              aria-controls="overview"
                              aria-selected="true"
                            >
                              {" "}
                              Conversastion logs
                            </a>
                          </li>

                          <li
                            class="nav-item"
                            onClick={() => setActivetab("email_logs")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "email_logs"
                                  ? "custom-active"
                                  : ""
                              }`}
                              style={{ color: "#fff" }}
                              id="email_logs-tab"
                              data-bs-toggle="tab"
                              href="#overview"
                              role="tab"
                              aria-controls="overview"
                              aria-selected="true"
                            >
                              {" "}
                              Email logs
                            </a>
                          </li>
                          <li
                            class="nav-item"
                            onClick={() => setActivetab("call_logs")}
                          >
                            <a
                              class={`nav-link ${
                                activeTab === "call_logs" ? "custom-active" : ""
                              }`}
                              style={{ color: "#fff" }}
                              id="call_logs-tab"
                              data-bs-toggle="tab"
                              href="#overview"
                              role="tab"
                              aria-controls="overview"
                              aria-selected="true"
                            >
                              {" "}
                              Call logs
                            </a>
                          </li>

                          {isOnVacation ? (
                            <li class="nav-item">
                            
                              <i
                                style={{
                                  fontSize: "28px",
                                  marginTop: "8px",
                                  color: "red",
                                  marginLeft: "10px",
                                }}
                                class="fa-solid fa-plane"
                              ></i>
                            </li>
                          ) : (
                            <></>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ----- End */}

            {activeTab !== "Home" && (
              <ProfileHeaderCards
                data={data}
                permissible_roles={permissible_roles}
                openWallet={openWallet}
                rolePermission={rolePermission}
                openCalendar={openCalendar}
                openDF={openDF}
                openCredit={openCredit}
                openCash={openCash}
                openSRL={openSRL}
              />
            )}

              {/* ----- Start - For customer Home */}
              {activeTab === "Home" && (
                <ProfileHome
                  data={data}
                  hubData={hubData}
                  deliveryExecutives={deliveryExecutives}
                  loggedIn_user={loggedIn_user}
                  permissible_roles={permissible_roles}
                  navi={navi}
                  triggerCallAPI={triggerCallAPI}
                  params={params}
                  openWallet={openWallet}
                  rolePermission={rolePermission}
                  openCalendar={openCalendar}
                  openDF={openDF}
                  openCredit={openCredit}
                  openCash={openCash}
                  openSRL={openSRL}
                />
              )}
              {/* ----- End */}

              {/* ----- Start - For Orders */}
              {activeTab === "Orders" && (
                <ProfileOrders
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  handleSearchOrders={handleSearchOrders}
                  resetSearchOrders={resetSearchOrders}
                  permissible_roles={permissible_roles}
                  openAdhocOrder={openAdhocOrder}
                  setCartItems={setCartItems}
                  rolePermission={rolePermission}
                  uniqueOrders={uniqueOrders}
                  orderListData={orderListData}
                  userMapID={userMapID}
                  productDataID={productDataID}
                  editingRowOrd={editingRowOrd}
                  quantityOrd={quantityOrd}
                  setQuantityOrd={setQuantityOrd}
                  openmdlv={openmdlv}
                />
              )}
              {/* ----- End */}

              {/* ----- Start - For Subscrition */}
              {activeTab === "Subscription" && (
                <ProfileSubscriptions
                  permissible_roles={permissible_roles}
                  openSubscription={openSubscription}
                  rolePermission={rolePermission}
                  subscriptionData={subscriptionData}
                  productDataID={productDataID}
                  moment={moment}
                  toDate={toDate}
                  editingDateFor={editingDateFor}
                  setEditingDateFor={setEditingDateFor}
                  handleNextChange={handleNextChange}
                  updatingDates={updatingDates}
                  changeSubcriptionStatus={changeSubcriptionStatus}
                  opensedit={opensedit}
                  deleteProduct={deleteProduct}
                  openbulkQt={openbulkQt}
                  shiftByDay={shiftByDay}
                />
              )}
              {/* ----- End */}

              {/* ----- Start - For Vactions */}
              {activeTab === "Vacation" && (
                <ProfileVacation
                  permissible_roles={permissible_roles}
                  setSelectedVacation={setSelectedVacation}
                  rolePermission={rolePermission}
                  vacationData={vacationData}
                  moment={moment}
                  toDate={toDate}
                  apiClient={apiClient}
                  checkVacationStatus={checkVacationStatus}
                  setIsOnVacation={setIsOnVacation}
                  fetchVacationData={fetchVacationData}
                  params={params}
                />
              )}
              {/* ----- End */}

              {/* ----- Start - For Tickets */}
              {/* ----- Start - For Tickets */}
              {activeTab === "Tickets" && (
                <ProfileTickets
                  ticketsData={ticketsData}
                  addTickets={addTickets}
                  rolePermission={rolePermission}
                  permissible_roles={permissible_roles}
                  HandleTicketAction={HandleTicketAction}
                  ticketActionOptions={ticketActionOptions}
                  OpenAttachment={OpenAttachment}
                />
              )}
              {/* ----- End */}
              {/* ----- End */}

              {/* ----- Start - For Activities */}
              {/* ----- Start - For Activities */}
              {activeTab === "Activities" && (
                <ProfileActivities
                  activitiesData={activitiesData}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  handleDateRange={handleDateRange}
                  resetActivities={resetActivities}
                />
              )}
              {/* ----- End */}
              {/* ----- End */}

              {/* ----- Start - For Conversation logs */}
              {activeTab === "conversastion_logs" ? (
                <>
                  <ConversastionLogs customer_data={data} />
                </>
              ) : (
                <></>
              )}
              {/* ----- End */}

              {/* ----- Start - For Call logs */}
              {activeTab === "call_logs" ? (
                <>
                  <CallLogs customer_data={data} />
                </>
              ) : (
                <></>
              )}
              {/* ----- End */}

              {/* ----- Start - For Email logs */}
              {activeTab === "email_logs" ? (
                <>
                  <EmailLogs customer_data={data} />
                </>
              ) : (
                <></>
              )}
              {/* ----- End */}

              {/* ----- Start - For Wallet */}
              {/* ----- Start - For Wallet */}
              {activeTab === "Wallet" && (
                <ProfileWallet
                  data={data}
                  permissible_roles={permissible_roles}
                  openWallet={openWallet}
                  rolePermission={rolePermission}
                  openCalendar={openCalendar}
                  openDF={openDF}
                  openCredit={openCredit}
                  openCash={openCash}
                  openSRL={openSRL}
                  fetchWalletData={fetchWalletData}
                  fetchCustomerData={fetchCustomerData}
                  hubData={hubData}
                  deliveryExecutives={deliveryExecutives}
                  handleOpenModal={handleOpenModal}
                  walletData={walletData}
                  filteredData={filteredData}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  handleDateRangeWallet={handleDateRangeWallet}
                  resetWallet={resetWallet}
                  handleFilterChange={handleFilterChange}
                  username={username}
                  reconsileWallet={reconsileWallet}
                  params={params}
                  showTransactionForm={showTransactionForm}
                  setShowTransactionForm={setShowTransactionForm}
                />
              )}
              {/* ----- End */}
              {/* ----- End */}

            <Footer />
      {/* End of Modals */}
                       

      <ProfileCalendarModal
        calendarDate={calendarDate}
        handleCalendarDateChange={handleCalendarDateChange}
        subscriptionCalendarFutureData={subscriptionCalendarFutureData}
        editingRow={editingRow}
        quantityFU={quantityFU}
        setQuantityFU={setQuantityFU}
        handleSaveClick={handleSaveClick}
        isSaving={isSaving}
        handleEditClick={handleEditClick}
      />


      <ProfileCashModal
        handleSubmitCash={handleSubmitCash}
        handleChangeCash={handleChangeCash}
        submitCash={submitCash}
        loading={loading}
      />


      <ProfileSRLModal
        handleSubmitSRL={handleSubmitSRL}
        handleChangeSRL={handleChangeSRL}
        submitSRL={submitSRL}
      />


      <VacationModal
        customer={data.data}
        loggedIn_user={loggedIn_user}
        onVacationAdded={fetchVacationData}
        editData={selectedVacation}
      />

      <ProfileTicketsModal
        handleSubmitTickets={handleSubmitTickets}
        handleChangeTickets={handleChangeTickets}
        submitTickets={submitTickets}
        loggedIn_user={loggedIn_user}
      />

      <ProfileProductModal
        showModal={showModal}
        setCartItems={setCartItems}
        handleSearchChange={handleSearchChange}
        filteredProducts={filteredProducts}
        discounts={discounts}
        handleDiscountChange={handleDiscountChange}
        calculateFinalPrice={calculateFinalPrice}
        handleAddToCart={handleAddToCart}
        cartItems={cartItems}
        handleChangeCartDate={handleChangeCartDate}
        handleChangeEndDate={handleChangeEndDate}
        startDate={startDate}
        handleQuantityChange={handleQuantityChange}
        handleChangeCart={handleChangeCart}
        changeCart={changeCart}
        handleInterval={handleInterval}
        showNth={showNth}
        handleChangenth={handleChangenth}
        handleRemoveFromCart={handleRemoveFromCart}
        handleChangenCustom={handleChangenCustom}
        handleCheckout={handleCheckout}
        adhocDeliveryDate={adhocDeliveryDate}
        setAdhocDeliveryDate={setAdhocDeliveryDate}
        handleConfirmOrder={handleConfirmOrder}
        loading={loading}
      />

      <ProfileBulkUpdateModal
        newQuantityBU={newQuantityBU}
        setNewQuantityBU={setNewQuantityBU}
        startDateBU={startDateBU}
        setStartDateBU={setStartDateBU}
        endDateBU={endDateBU}
        setEndDateBU={setEndDateBU}
        handleSubmitUpdateQuantity={handleSubmitUpdateQuantity}
      />

      <ProfileStatusUpdateModal
        handleSubmitMarkDelivered={handleSubmitMarkDelivered}
        oiidStatus={oiidStatus}
        handleChangeCR={handleChangeCR}
        submitCR={submitCR}
      />

      <ProfileResumePauseModal
        handlePauseSubscription={handlePauseSubscription}
        resumeDate={resumeDate}
        setResumeDate={setResumeDate}
        afterEleven={afterEleven}
      />

      <ProfileEditSubscriptionModal
        editSubs={editSubs}
        handleQuantityChangeES={handleQuantityChangeES}
        handleChangeES={handleChangeES}
        handleIntervalChangeES={handleIntervalChangeES}
        nthES={nthES}
        handleNthDayChangeES={handleNthDayChangeES}
        handleSubmitES={handleSubmitES}
      />
      </div>
    </div>
  </div>
</div>
      <WalletModal
        customer={data.data}
        loggedIn_user={loggedIn_user}
        hubData={hubData}
        deliveryExecutive={deliveryExecutives[0]}
        onTransactionAdded={fetchWalletData}
      />
      <CreditLimitModal
        customer={data.data}
        loggedIn_user={loggedIn_user}
        userId={userId}
        onCreditLimitUpdated={fetchCustomerData}
      />
      <DeliveryPreferencesModal
        customer={data.data}
        onUpdated={fetchDeliveryPreferences}
      />
    </>
  );
}
export default ProfilePage;
