import React, { useState, useEffect, useContext, useMemo } from "react";
import apiClient from '../../services/apiClient';
import Home from "./Home";
import Orders from "./Orders";
import Dispatch from "./Dispatch";
import Stock from "./Stock";
import Delivery from "./Delivery";
import Report from "./Report";
import { extendMoment } from "moment-range";
import Moment from "moment";
import { useInventoryContext } from "./InventoryContext";
import Swal from "sweetalert2";
import FetchInventory from "./utility/queries";
import { FaBoxOpen, FaExclamationCircle, FaFileAlt, FaHome, FaShoppingCart, FaTruck, FaWarehouse } from "react-icons/fa";
import FarmStock from "./FarmStock";
import { DateTimeUtil, handleLogout } from "../../Utility";
import GlobalContext from "../../context/GlobalContext";
import { useNavigate } from "react-router-dom"; 
import useFetchUserRole from "./useFetchUserRole";

const inventoryStyles = `
  .inventory-loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .inventory-loader {
    border: 8px solid #f3f3f3;
    border-top: 8px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin-inventory 1s linear infinite;
  }
  @keyframes spin-inventory {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .dispatch-container {
    display: flex;
    flex-direction: column;
  }
  .dispatch-tab-row {
    display: flex;
    flex-direction: row;
  }
  .dispatch-tab-button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-bottom: none;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;
    cursor: pointer;
  }
  .dispatch-tab-button.dispatch-farms {
    border-top-left-radius: 0.5rem;
  }
  .dispatch-tab-button.dispatch-hub {
    border-top-right-radius: 0.5rem;
  }
  .dispatch-tab-button.dispatch-active {
    background-color: #bfdbfe;
    color: #1e3a8a;
    border-color: #93c5fd;
    z-index: 10;
  }
  .dispatch-tab-button:not(.dispatch-active) {
    background-color: #f3f4f6;
    color: #4b5563;
  }
  .dispatch-tab-button:not(.dispatch-active):hover {
    background-color: #e5e7eb;
  }
  .dispatch-content-card {
    border: 1px solid #d1d5db;
    border-radius: 0 0.5rem 0.5rem 0.5rem;
    background-color: #ffffff;
    padding: 1rem;
    margin-top: -1px;
  }
  .dispatch-btn {
    transition: transform 0.1s ease;
  }
  .dispatch-btn:hover {
    transform: scale(1.05);
  }
  .dispatch-update-status-form {
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .dispatch-card .card-body {
    background-color: #f8f9fa;
    border-radius: 0.25rem;
  }
`;

const Inventory_Home = () => {
  useFetchUserRole();
  const {permissible_roles} = useContext(GlobalContext);
  const navigate = useNavigate();
  // Ensure `setProcessedB2BData` is a separate state from `B2BPridiction`.
  const [processedB2BData, setProcessedB2BData] = useState({});
  
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
        navigate("/login");
    }else{
        if(permissible_roles.length>0){
            if(!permissible_roles.includes('inventory')){
                handleLogout()
                navigate("/permission_denied");
            }
        }
    }
  }, [navigate,permissible_roles]);

  
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



  const {
    setCummulativeDeliveryList,
    setHubs,
    setProducts,
    setLoading,
    loading,
    setStockData,
    setDispatches,
    setB2BPridiction,
    B2BPridiction,
    setHubWiesProduct,
    setDeliveryExecutive
  } = useInventoryContext();
  const moment = extendMoment(Moment);

  const fetchBulkQty = async () => {
    const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
    const docs = await apiClient.post("/api/bulk_update_quantity/query", {
      filters: [{ field: "delivery_date", op: "==", value: tomorrow }]
    }).then(res => res.data?.data || []);
  
    return docs.reduce((map, data) => {
      map.set(data.subscription_id, data.quantity);
      return map;
    }, new Map());
  };
  
  const checkVacationStatus = async () => {
    const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
    const tomorrowEnd = moment().add(1, "days").endOf("day").toDate();
    const docs = await apiClient.post("/api/customers_vacation/query", {
      filters: [
        { field: "start_date", op: ">=", value: tomorrowStart },
        { field: "end_date", op: "<=", value: tomorrowEnd }
      ]
    }).then(res => res.data?.data || []);
  
    return docs.reduce((map, data) => {
      map.set(data.customer_id, true);
      return map;
    }, new Map());
  };
  
  const calculatePredictAnalysisQty1 = async () => {
    setLoading(true);
  
    try {
      const bulkQuantityMap = await fetchBulkQty();
      const vacationMap = await checkVacationStatus();
      const customSubscriptionList = [];
      const nonCustomSubscriptionList = [];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayOfWeek = weekdays[tomorrow.getDay()];
  
      const customDocs = await apiClient.post("/api/subscriptions_data/query", {
        filters: [
          { field: dayOfWeek, op: ">=", value: 1 },
          { field: "subscription_type", op: "==", value: "Custom" },
          { field: "status", op: "==", value: "1" }
        ]
      }).then(res => res.data?.data || []);
  
      customDocs.forEach((subscription) => {
        if (!vacationMap.has(subscription.customer_id)) {
          subscription.quantity = bulkQuantityMap.get(subscription.subscription_id) || subscription[dayOfWeek];
          customSubscriptionList.push(subscription);
        }
      });
  
      const nonCustomDocs = await apiClient.post("/api/subscriptions_data/query", {
        filters: [
          { field: "subscription_type", op: "!=", value: "Custom" },
          { field: "status", op: "==", value: "1" },
          { field: "next_delivery_date", op: "==", value: moment(tomorrow).format("YYYY-MM-DD") }
        ]
      }).then(res => res.data?.data || []);
  
      nonCustomDocs.forEach((subscription) => {
        if (!vacationMap.has(subscription.customer_id)) {
          subscription.quantity = bulkQuantityMap.get(subscription.subscription_id) || subscription.quantity;
          nonCustomSubscriptionList.push(subscription);
        }
      });
  
      const combinedSubscriptionList = [...customSubscriptionList, ...nonCustomSubscriptionList];
      const productPackagingMap = new Map();
  
      combinedSubscriptionList.forEach((subscription) => {
        const key = subscription.product_name;
        productPackagingMap.set(key, (productPackagingMap.get(key) || 0) + subscription.quantity);
      });
  
      const cumulativeList = Array.from(productPackagingMap.entries()).map(([key, quantity]) => {
        const b2b = B2BPridiction["All Hub"]?.[key] || 0;
        
        return {
          product_name: key,
          B2C_predicted_orders: quantity,
          B2B_predicted_orders: b2b,
          buffer_added: 0,
          final_order: quantity + b2b,
          analysisDate: moment(tomorrow).format("DD-MM-YYYY"),
          day: dayOfWeek,
        };
      });
  
      
      setCummulativeDeliveryList(cumulativeList);
  
      const productPackagingMapWithHub = new Map();
  
      combinedSubscriptionList.forEach((subscription) => {
        const key = `${subscription.product_name}-${subscription.hub_name}`;
        productPackagingMapWithHub.set(key, (productPackagingMapWithHub.get(key) || 0) + 1);
      });
  
      const cumulativeListWithHub = Array.from(productPackagingMapWithHub.entries()).map(([key, quantity]) => {
        const [productName, hubName] = key.split("-");
        const b2b = B2BPridiction[hubName]?.[productName] || 0;
        // if(b2b){
        // }
        
        return {
          product_name: productName,
          B2C_predicted_orders: quantity,
          B2B_predicted_orders: b2b,
          buffer_added: 0,
          final_order: quantity + b2b,
          hubName: hubName,
          analysisDate: moment(tomorrow).format("DD-MM-YYYY"),
          day: dayOfWeek,
        };
      });
  
      setHubWiesProduct(cumulativeListWithHub);
    } catch (error) {
      console.error("Error calculating cumulative report:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
      calculatePredictAnalysisQty1();
  }, [B2BPridiction]);
  
  useEffect(() => {
    if (Array.isArray(processedB2BData) && processedB2BData.length > 0) {
      const b2bMap = processedB2BData.reduce((acc, item) => {
        const { hub_name, product_name, quantity } = item;
        if (!acc[hub_name]) acc[hub_name] = {};
        acc[hub_name][product_name] = (acc[hub_name][product_name] || 0) + Number(quantity || 0);
        return acc;
      }, {});
  
      const total = Object.keys(b2bMap).reduce((totalAcc, hub) => {
        Object.keys(b2bMap[hub]).forEach((product) => {
          totalAcc[product] = (totalAcc[product] || 0) + b2bMap[hub][product];
        });
        return totalAcc;
      }, {});
  
      setB2BPridiction((prev) => ({
        ...prev,
        ...b2bMap,
        "All Hub": total,
      }));
    }
  }, [processedB2BData]);
  
  const fetchB2BOrders = async () => {
    try {
      const b2bDocs = await apiClient.post("/api/b2b_orders/query", {
        filters: [{ field: "delivery_date", op: "==", value: moment().add(1, "days").format("YYYY-MM-DD") }]
      }).then(res => res.data?.data || []);
  
      const b2bOrders = b2bDocs.map((doc) => ({ ...doc, id: doc._id }));
      setProcessedB2BData(b2bOrders);
    } catch (error) {
      console.error("Error fetching B2B orders:", error);
    }
  };
  
  const fetchData = async () => {
    try {
      const hubsDocs = await apiClient.post("/api/hubs_data/query", { filters: [] }).then(res => res.data?.data || []);
      setHubs(hubsDocs.map((doc) => ({ ...doc, id: doc._id })));

      const deliveryExecutiveDocs = await apiClient.post("/api/hubs_users_data/query", { filters: [] }).then(res => res.data?.data || []);
      const deliveryExecutive = deliveryExecutiveDocs.reduce((acc, doc) => {
        const { hub_user_id, phone_no, first_name } = doc;
        acc[hub_user_id] = { hub_user_id, phone_no, first_name }; 
        return acc;
      }, {});

      setDeliveryExecutive(deliveryExecutive);
  
      const productsDocs = await apiClient.post("/api/products_data/query", { filters: [] }).then(res => res.data?.data || []);
      const pData = productsDocs.map((doc) => ({ ...doc, id: doc._id }))
      
      const pd = pData.filter((item)=> item.publishOnApp)
      setProducts(pd);
      
  
      const inventory = new FetchInventory();
      const stock = await inventory.fetchStock();
      // const stockSnap = await collection("stock_data").get();
      setStockData(stock);
  
      fetchB2BOrders();
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Failed to fetch data. Please try again.", "error");
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const navOptions = useMemo(() => [
    permissible_roles.includes("inventory_home") && {
      id: "home",
      label: "Home",
      icon: <FaHome />,
      component: <Home setLoading={setLoading} />,
    },
    permissible_roles.includes("view_order_prediction") && {
      id: "orders",
      label: "Orders",
      icon: <FaShoppingCart />,
      component: <Orders />,
    },
    permissible_roles.includes("view_dispatch") && {
      id: "dispatch",
      label: "Dispatch",
      icon: <FaTruck />,
      component: <Dispatch />,
    },
    permissible_roles.includes("view_stock") && {
      id: "stock",
      label: "Stock",
      icon: <FaWarehouse />,
      component: <Stock />,
    },
    permissible_roles.includes("view_deliverise") && {
      id: "delivery",
      label: "Delivery",
      icon: <FaBoxOpen />,
      component: <Delivery />,
    },
    permissible_roles.includes("view_reports") && {
      id: "report",
      label: "Report",
      icon: <FaFileAlt />,
      component: <Report />,
    },
  ].filter(Boolean), [permissible_roles, setLoading]);

  const [activeTab, setActiveTab] = useState(() =>
    navOptions.length > 0 ? navOptions[0].id : ""
  );

  useEffect(() => {
    setActiveTab(navOptions.length > 0 ? navOptions[0].id : "");
  }, [navOptions]);

    const renderFallbackMessage = () => (
      <div className="text-center mt-3">
        <FaExclamationCircle style={{ fontSize: "2rem", color: "#6c757d" }} />
        <p className="mt-3 text-muted">You don't have any permissions to view this content.</p>
      </div>
    );
  
    const renderNavBar = () => (
      <ul
        className="nav nav-tabs nav-justified "
        role="tablist"
        style={{
          background: "linear-gradient(90deg, #4a57d4, #7786f5)",
          borderRadius: "12px",
          padding: "0.6rem",
          maxWidth: "85%",
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {navOptions.map((option) => (
          <li
          className="nav-item"
          key={option.id}
          style={{
            flex: 1,
            margin: "0 0.5rem",
            maxWidth: "250px",
          }}
        >
          <a
            className={`nav-link text-center ${activeTab === option.id ? "active" : ""}`}
            role="tab"
            onClick={() => setActiveTab(option.id)}
            style={{
              color: activeTab === option.id ? "#fff" : "rgba(255, 255, 255, 0.85)",
              fontWeight: "600",
              fontSize: "1rem",
              borderRadius: "8px",
              padding: "0.7rem 1.2rem",
              backgroundColor: activeTab === option.id ? "rgba(255, 255, 255, 0.2)" : "transparent",
              cursor: "pointer",
              transition: "background 0.3s ease, transform 0.3s ease",
              display: "flex",
              justifyContent: "center",  // Align items horizontally in the center
              alignItems: "center",  // Align items vertically in the center
              flexDirection: "column",  // Stack icon and label vertically
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{ marginBottom: "0.5rem" }}>
              {option.icon}
            </div>
        
            {/* Label */}
            <div>{option.label}</div>
          </a>
        </li>
        
        ))}
        {navOptions.length === 0 && (
          <li className="nav-item" style={{ flex: 1, margin: "0 0.5rem" }}>
            <a
              className="nav-link active text-center"
              role="tab"
              style={{
                color: "#fff",
                fontWeight: "600",
                fontSize: "1rem",
                borderRadius: "8px",
                padding: "0.7rem 1.2rem",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
              }}
            >
              <FaExclamationCircle style={{ marginRight: "0.5rem" }} />
              No Tabs
            </a>
          </li>
        )}
      </ul>
    );
  
    return (
      <>
        <style>{inventoryStyles}</style>
        <div className="col-12 stretch-card mb-3 ">
          <div className="card" style={{ backgroundColor: "transparent", boxShadow: "none" }}>
            <div className="home-tab">{renderNavBar()}</div>
          </div>
        </div>
  
        <div className="row">
          <div className="col-md-12 col-xl-12 stretch-card">
            <div className="card">
              <div className="card-body">
                {loading && (
                  <div className="inventory-loader-overlay">
                    <div>
                      <img alt="loader" src="images/loader.gif" style={{ height: "6rem" }} />
                    </div>
                  </div>
                )}
                {navOptions.length > 0
                  ? navOptions.find((option) => option.id === activeTab)?.component
                  : renderFallbackMessage()}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  export default Inventory_Home;
  