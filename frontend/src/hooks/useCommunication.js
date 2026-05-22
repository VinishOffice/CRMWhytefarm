import { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import apiClient from "../services/apiClient";
import { CommunicationContext } from "../pages/Communication/CommunicationContext";
import { newCommunicationHistory } from "../pages/Communication/utility/queries";
import { cantCreateNewCampaign, notAuthorized } from "../pages/Communication/utility/Toast";
import { sendWhatsAppMessage } from "../pages/Communication/WATI API FUNCTIONS/wati";
import { sendSMS } from "../pages/Communication/WATI API FUNCTIONS/sendSMS";
import GlobalContext from "../context/GlobalContext";

export const useCommunication = () => {
  const navigate = useNavigate();
  const { permissible_roles } = useContext(GlobalContext);
  const {
    hub, msgData, setWhatsappLog, setSmsLog, newCampaign, setNewCampaign,
    filter, data, setData, title, selectedValue, handleDiscard, setSummary, smsParamMap
  } = useContext(CommunicationContext);

  const [launch, setLaunching] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [whatsappLogLocal, setWhatsappLogLocal] = useState([]);
  const [smsLogLocal, setSmsLogLocal] = useState([]);

  const chunkArray = (arr, size) => {
    return arr.reduce((chunks, item, index) => {
      const chunkIndex = Math.floor(index / size);
      if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
      chunks[chunkIndex].push(item);
      return chunks;
    }, []);
  };

  const fetchCartData = async (date) => {
    try {
      const formattedDate = moment(date).format("YYYY-MM-DD");
      const docs = await apiClient.post("/api/cart_data/query", {
        filters: [{ field: "update_date", op: ">=", value: formattedDate }]
      }).then(res => res.data?.data || []);
      return docs.filter(doc => doc.products && doc.products.length > 0);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      return [];
    }
  };

  const fetchTrailedUser = async (date) => {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    try {
      const docs = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "created_date", op: ">=", value: formattedDate }]
      }).then(res => res.data?.data || []);
      const customers = docs.map(doc => ({ id: doc._id, ...doc }));
      if (customers.length === 0) return [];

      const customerIds = customers.map(item => item.customer_id).filter(Boolean);
      const customerChunks = chunkArray(customerIds, 10);
      let orderData = [];

      for (const chunk of customerChunks) {
        if (chunk.length > 0) {
          const querySnapshot = await apiClient.post("/api/order_history/query", {
            filters: [{ field: "customer_id", op: "in", value: chunk }]
          }).then(res => res.data?.data || []);
          orderData.push(...querySnapshot);
        }
      }

      return customers.map(customer => {
        const userOrders = orderData.filter(order => order.customer_id === customer.customer_id);
        let trailedStatus = { id: "", status: userOrders.length > 0 };
        for (const order of userOrders) {
          if (!trailedStatus.id) trailedStatus.id = order.order_id;
          else if (trailedStatus.id !== order.order_id || order.order_type !== "OT" || order.status !== "1") {
            trailedStatus.status = false;
            break;
          }
        }
        return { ...customer, trailedUsers: trailedStatus.status };
      }).filter(customer => customer.trailedUsers);
    } catch (error) {
      console.error("Error fetching trial users:", error);
      return [];
    }
  };

  const fetchCustomer = async (filter) => {
    if (!filter) return [];
    let customers = [];

    if (filter?.AbandendCart?.status) {
      customers = await fetchCartData(filter.AbandendCart.date);
    }

    if (filter?.TrailedUser?.status) {
      const trailed = await fetchTrailedUser(filter.TrailedUser.date);
      if (customers.length === 0) {
        customers = trailed;
      } else {
        const trailedIds = new Set(trailed.map(c => c.customer_id));
        customers = customers.filter(c => trailedIds.has(c.customer_id));
      }
    }

    if (filter?.subscription_type?.length > 0 || filter?.status?.length > 0) {
      let subFilters = [];
      if (filter?.subscription_type?.length > 0 && filter?.subscription_type.length !== 3) {
        subFilters.push({ field: "subscription_type", op: "in", value: filter.subscription_type });
      }
      if (filter?.status?.length === 1 && filter.status[0] !== "subscribers") {
        const status = filter.status[0] === "active subscribers" ? "1" : "0";
        subFilters.push({ field: "status", op: "==", value: status });
      }

      const snapshot = await apiClient.post("/api/subscriptions_data/query", { filters: subFilters }).then(res => res.data?.data || []);
      const subCustIds = new Set(snapshot.map(s => s.customer_id));
      
      if (customers.length > 0) {
        customers = customers.filter(c => subCustIds.has(c.customer_id));
      } else {
        // This part in the original code is complex, simplifying for extraction but preserving logic
        const uniqueCustomers = {};
        snapshot.forEach(sub => {
          if (!uniqueCustomers[sub.customer_id]) {
            uniqueCustomers[sub.customer_id] = { customer_id: sub.customer_id, subscriptionType: new Set(), status: "0" };
          }
          uniqueCustomers[sub.customer_id].subscriptionType.add(sub.subscription_type);
          if (sub.status === "1") uniqueCustomers[sub.customer_id].status = "1";
        });
        customers = Object.values(uniqueCustomers).map(c => ({ ...c, subscriptionType: [...c.subscriptionType] }));
      }
    }

    // Main filters (Hub, Source, Platform)
    let mainFilters = [];
    if (filter?.hub?.length > 0 && filter.hub.length !== hub.length) mainFilters.push({ field: "hub_name", op: "in", value: filter.hub });
    if (filter?.source?.length > 0 && filter.source.length !== 4) mainFilters.push({ field: "source", op: "in", value: filter.source });
    if (filter?.platform?.length > 0 && filter.platform.length !== 3) mainFilters.push({ field: "platform", op: "in", value: filter.platform });

    const customerSnapshot = await apiClient.post("/api/customers_data/query", { filters: mainFilters }).then(res => res.data?.data || []);
    
    if (customers.length === 0) {
      customers = customerSnapshot;
    } else {
      const snapIds = new Set(customerSnapshot.map(c => c.customer_id));
      customers = customers.filter(c => snapIds.has(c.customer_id)).map(c => {
        const details = customerSnapshot.find(cs => cs.customer_id === c.customer_id);
        return { ...c, ...details };
      });
    }

    return customers;
  };

  const getData = async () => {
    const result = await fetchCustomer(filter);
    setData(result);
  };

  const handleNewCampaign = () => {
    if (newCampaign) {
      cantCreateNewCampaign();
      return;
    }
    setNewCampaign(true);
  };

  const getUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return null;
      const res = await apiClient.post("/api/users/query", { filters: [{ field: "user_id", op: "==", value: userId }] });
      return res.data?.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const sendWhatsApp = async (customers) => {
    const log = [];
    for (const customer of customers) {
      const parameters = msgData?.whatsapp?.prameter
        ? Object.entries(msgData.whatsapp.prameter).map(([key, value]) => ({ name: key, value: customer[value] || value }))
        : [];
      try {
        const response = await sendWhatsAppMessage(`91${customer.customer_phone}`, msgData.whatsapp.template.elementName, parameters);
        log.push({ customer_name: customer.customer_name, status: response ? "success" : "failed" });
      } catch (e) {
        log.push({ customer_name: customer.customer_name, status: "failed" });
      }
    }
    setWhatsappLogLocal(log);
    setWhatsappLog(log);
    return log;
  };

  const parseTemplate = (customer, template, values) => {
    return template.replace(/%%\|([\w]+)\^.*?%%/g, (match, key) => customer[values[key]] || values[key] || key);
  };

  const sendSMSMessage = async (customers) => {
    const log = [];
    for (const customer of customers) {
      try {
        const customMessage = parseTemplate(customer, msgData.sms.template.body, smsParamMap);
        const response = await sendSMS(customer.customer_phone, customMessage);
        log.push({ customer_name: customer.customer_name, status: response?.status === 200 ? 'success' : "failed" });
      } catch (e) {
        log.push({ customer_name: customer.customer_name, status: "failed" });
      }
    }
    setSmsLogLocal(log);
    setSmsLog(log);
    return log;
  };

  const handleSend = async () => {
    setLaunching(0);
    const user = await getUser();
    if (!user) {
      toast.error("User session expired.");
      navigate("/login");
      return;
    }

    setLaunching(1);
    const campaignData = {
      title, filter, medium: selectedValue, msgData,
      stats: { total: data.length, sms: { sent: 0, failed: 0 }, whatsapp: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } },
    };

    if (selectedValue.includes("SMS")) {
      setLaunching(2);
      await delay(500);
      const log = await sendSMSMessage(data);
      campaignData.stats.sms.sent = log.filter(e => e.status === "success").length;
      campaignData.stats.sms.failed = log.length - campaignData.stats.sms.sent;
    }

    if (selectedValue.includes("Email")) {
      setLaunching(3);
      await delay(500);
    }

    if (selectedValue.includes("WhatsApp")) {
      setLaunching(4);
      await delay(500);
      const log = await sendWhatsApp(data);
      campaignData.stats.whatsapp.sent = log.filter(e => e.status === "success").length;
      campaignData.stats.whatsapp.failed = log.length - campaignData.stats.whatsapp.sent;
    }

    setLaunching(5);
    try {
      await newCommunicationHistory(campaignData, user);
    } catch (error) {
      toast.error("Failed to save campaign history.");
    } finally {
      setComplete(true);
      setLaunching(6);
    }
  };

  const downloadCSV = (log, filename) => {
    if (!log || log.length === 0) return;
    const headers = Object.keys(log[0]).join(",") + "\n";
    const rows = log.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    if (whatsappLogLocal.length) downloadCSV(whatsappLogLocal, `whatsapp_log_${new Date().toISOString()}.csv`);
    if (smsLogLocal.length) downloadCSV(smsLogLocal, `sms_log_${new Date().toISOString()}.csv`);
  };

  return {
    launch, setLaunching, complete, setComplete,
    handleNewCampaign, handleSend, handleDownload, downloadCSV,
    getData, whatsappLogLocal, smsLogLocal
  };
};
