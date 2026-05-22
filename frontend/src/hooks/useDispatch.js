import { useState, useEffect, useMemo, useContext } from "react";
import { useInventoryContext } from "../pages/Inventory-Management/InventoryContext";
import FetchInventory, { UpdateInventory } from "../pages/Inventory-Management/utility/queries";
import GlobalContext from "../context/GlobalContext";
import Swal from "sweetalert2";
import moment from "moment";
import { DateTimeUtil } from "../Utility";

export const useDispatch = () => {
  const { dispatches, setDispatches, hubDispatches, setHubDispatches, hubs } = useInventoryContext();
  const { permissible_roles } = useContext(GlobalContext);

  const [create, setCreate] = useState(false);
  const [date, setDate] = useState(new Date());
  const [editingDispatchId, setEditingDispatchId] = useState(null);
  const [updatedDispatches, setUpdatedDispatches] = useState([]);
  const [updatedStatus, setUpdatedStatus] = useState("Added");
  const [isIconLoaded, setIsIconLoaded] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [dispatchesView, setDispatchesView] = useState("farms");
  const [selectedHub, setSelectedHub] = useState("Select Hub");
  const [farmDispatchData, setFarmDispatchData] = useState([]);

  const inventoryFetch = useMemo(() => new FetchInventory(), []);

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
  };

  useEffect(() => {
    const fetchDispatchesByDate = async () => {
      try {
        const data = await inventoryFetch.fetchDispatchesByDateRange(date);
        const hubData = data.filter(item => item?.type === "Hub Dispatch");
        const farmsData = data.filter(item => item?.type === "Farms Dispatch");
        setHubDispatches(hubData);
        setDispatches(farmsData);
      } catch (error) {
        console.error("Error fetching dispatches:", error);
      }
    };
    fetchDispatchesByDate();
  }, [date, inventoryFetch, setHubDispatches, setDispatches]);

  useEffect(() => {
    const fetchDispatches = async () => {
      if (!create) {
        try {
          const data = await inventoryFetch.fetchDispatchesByDateRange(new Date());
          const hubData = data.filter(item => item.type === "Hub Dispatch");
          const farmsData = data.filter(item => item.type === "Farms Dispatch");
          setHubDispatches(hubData);
          setDispatches(farmsData);
        } catch (error) {
          console.error("Error fetching dispatches:", error);
        }
      }
    };
    fetchDispatches();
  }, [create, inventoryFetch, setHubDispatches, setDispatches]);

  useEffect(() => {
    const todayDate = moment().format("YYYY-MM-DD");
    const map = new Map();

    dispatches
      .filter((item) => item?.type_val === 1 && item?.created_date === todayDate)
      .forEach((item) => {
        const name = item?.productName;
        if (!name) return;
        const qty = Number(item?.quantity) || 0;
        map.set(name, (map.get(name) || 0) + qty);
      });

    setFarmDispatchData(
      Array.from(map.entries()).map(([productName, quantity]) => ({
        productName,
        quantity,
        created_date: todayDate,
      }))
    );
  }, [dispatches]);

  const handleUpdate = (dispatchId) => {
    const group = dispatches.filter((item) => item.dispatch_id === dispatchId);
    setUpdatedDispatches(group);
    setUpdatedStatus(group[0]?.status || "Added");
    setEditingDispatchId(dispatchId);
  };

  const saveUpdates = async () => {
    try {
      const update = new UpdateInventory();

      await Promise.all(
        dispatches.map(async (item) => {
          if (item.dispatch_id === editingDispatchId) {
            const matchingDispatch = updatedDispatches.find(
              (d) => d.dispatch_sub_id === item.dispatch_sub_id
            );

            if (matchingDispatch) {
              await update.updateDispatch(
                item.dispatch_sub_id,
                matchingDispatch.quantity,
                updatedStatus,
                localStorage.getItem("loggedIn_user"),
                localStorage.getItem("userId")
              );
            }
          }
        })
      );

      setEditingDispatchId(null);
      setUpdatedDispatches([]);
      setUpdatedStatus("Added");

      const refreshedDispatches = await inventoryFetch.fetchDispatchesByDateRange(date);
      const hubData = refreshedDispatches.filter(item => item.type === "Hub Dispatch");
      const farmsData = refreshedDispatches.filter(item => item.type === "Farms Dispatch");
      setHubDispatches(hubData);
      setDispatches(farmsData);

    } catch (error) {
      console.error("Error saving updates:", error);
    }
  };

  const handleQuantityChange = (subId, quantity) => {
    setUpdatedDispatches((prev) =>
      prev.map((item) =>
        item.dispatch_sub_id === subId
          ? { ...item, quantity: Number(quantity) }
          : item
      )
    );
  };

  const deleteSubDispatch = (index) => {
    const updated = dispatches.filter((_, i) => i !== index);
    setDispatches(updated);
  };

  const exportToCSV = () => {
    const headers = [
      "Dispatch ID", "Sub Dispatch ID", "Hub", "Product", "Quantity", "Status",
      "Added On", "Dispatched On", "Delivered On", "Created By", "Updated By", "Accepted By",
    ];

    const rows = dispatches.map((item) => [
      item.dispatch_id || "N/A",
      item.dispatch_sub_id || "N/A",
      item.hub || "N/A",
      item.productName || "N/A",
      item.quantity || "N/A",
      item.status || "N/A",
      item.date ? `${DateTimeUtil.timestampFromDBToISODate(item.date)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.date)}` : "N/A",
      item.dispatch_date ? `${DateTimeUtil.timestampFromDBToISODate(item.dispatch_date)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.dispatch_date)}` : "N/A",
      item.accept_at ? `${DateTimeUtil.timestampFromDBToISODate(item.accept_at)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.accept_at)}` : "N/A",
      item.created_by || "N/A",
      item.user || "N/A",
      item.accept_user || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((value) => `"${value}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dispatches.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHubDispatches = useMemo(() => {
    if (hubs.map(item => item.hub_name).includes(selectedHub)) {
      return hubDispatches.filter(item => item.hub === selectedHub);
    }
    return hubDispatches;
  }, [hubDispatches, hubs, selectedHub]);

  return {
    dispatches, setDispatches, hubDispatches, setHubDispatches, hubs,
    create, setCreate,
    date, setDate,
    editingDispatchId, setEditingDispatchId,
    updatedDispatches, setUpdatedDispatches,
    updatedStatus, setUpdatedStatus,
    isIconLoaded,
    showGuide, setShowGuide,
    dispatchesView, setDispatchesView,
    selectedHub, setSelectedHub,
    farmDispatchData,
    permissible_roles,
    rolePermission,
    handleUpdate,
    saveUpdates,
    handleQuantityChange,
    deleteSubDispatch,
    exportToCSV,
    filteredHubDispatches,
  };
};
