import React, { useEffect, useState } from "react";
import moment from "moment";
import Select from "react-select";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { fetchPausedSubscriptions } from "./services/subscriptionOperationsService";

const PausedSubscriptionsReport = () => {
  const [firstTimeRender, setFirstTimeRender] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pauseSub, setPauseSub] = useState([]);
  const [pauseSubCopy, setPauseSubCopy] = useState([]);
  const [pausedSubIdMap, setPausedSubIdMap] = useState(new Map());
  const [subscriptions, setSubscriptions] = useState([]);
  const [filters, setFilters] = useState({});
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function fetchActivitiesByDateRange(startDate, endDate) {
    const Toast = Swal.mixin({
      toast: true,
      background: "#69aba6",
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
    if (!startDate || !endDate) {
      Toast.fire({
        icon: "error",
        title: "Please select both Start and End Date",
      });
      return;
    }
    if (startDate > endDate) {
      Toast.fire({
        icon: "error",
        title: "Start Date cannot be after End Date",
      });
      return;
    }
    setFirstTimeRender(false);
    setLoading(true);
    setPauseSub([]);
    setPauseSubCopy([]);

    try {
      const response = await fetchPausedSubscriptions({ startDate, endDate });
      const data = response.data || [];
      setPauseSub(data);
      setPauseSubCopy(data);
      setPausedSubIdMap(new Map(Object.entries(response.pausedDateMap || {})));
      setHubs(response.hubs || []);
      setProducts(response.products || []);
      setSubscriptionTypes(response.subscriptionTypes || []);
    } catch (error) {
      console.error("Error fetching paused subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }
  const filterBySubType = (val)=>{
    const filteredData = pauseSubCopy.filter((sub) => sub.subscription_type === val.value);
    setPauseSub(filteredData);
  }
   const filterByHub = (val)=>{
    const filteredData = pauseSubCopy.filter((sub) => sub.hub_name === val.value);
    setPauseSub(filteredData);
  }
  const filterByProduct = (vals)=>{
    const selectedProductValues = vals.map((v) => v.value);
    const filteredData = pauseSubCopy.filter((sub) => selectedProductValues.includes(sub.product_name));
    setPauseSub(filteredData);
  }
  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  // const formatFirestoreDate = (value) => {
  //   try {
  //     if (!value) return "-";
  //     if (typeof value === "string") return value;
  //     if (typeof value.toDate === "function")
  //       return moment(value.toDate()).format("DD-MM-YYYY");
  //     if (value.seconds) {
  //       const date = new Date(value.seconds * 1000);
  //       return moment(date).format("DD-MM-YYYY");
  //     }
  //     return "-";
  //   } catch (e) {
  //     return "-";
  //   }
  // };

  // Helper to batch Firestore queries by chunks of 30
  // const fetchInBatches = async (
  //   collectionName,
  //   field,
  //   ids,
  //   orderByField = null
  // ) => {
  //   const chunks = [];
  //   const idArray = Array.from(ids);
  //   for (let i = 0; i < idArray.length; i += 30) {
  //     chunks.push(idArray.slice(i, i + 30));
  //   }

  //   const results = [];
  //   for (const chunk of chunks) {
  //     // fetch all entries for the given customer_ids
  //     let q = query(collection(db, collectionName), where(field, "in", chunk));
  //     const snapshot = await getDocs(q);
  //     snapshot.forEach((doc) => results.push(doc.data()));
  //   }

  //   // If we want the latest entry per customer_id
  //   if (orderByField) {
  //     const latestMap = {};
  //     results.forEach((data) => {
  //       const current = latestMap[data.customer_id];
  //       if (
  //         !current ||
  //         data[orderByField]?.toDate() > current[orderByField]?.toDate()
  //       ) {
  //         latestMap[data.customer_id] = data;
  //       }
  //     });
  //     return Object.values(latestMap);
  //   }

  //   return results;
  // };

  // const fetchData = async () => {
  //   try {
  //     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  //     const subscriptionQuery = query(
  //       collection(db, "subscriptions_data"),
  //       where("status", "==", "0"),
  //       where("updated_date", ">=", thirtyDaysAgo)
  //     );

  //     const subscriptionSnapshot = await getDocs(subscriptionQuery);
  //     const results = [];
  //     const uniqueProducts = new Set();
  //     const uniqueTypes = new Set();
  //     const uniqueHubs = new Set();
  //     const customerIds = new Set();

  //     for (const doc of subscriptionSnapshot.docs) {
  //       const data = doc.data();
  //       if (data.subscription_type !== "One Time") {
  //         const cleanId = data.customer_id?.replace(/_paused/i, ""); // 🔥 Clean here
  //         results.push({ id: doc.id, ...data, customer_id: cleanId });
  //         if (data.product_name) uniqueProducts.add(data.product_name);
  //         if (data.subscription_type) uniqueTypes.add(data.subscription_type);
  //         if (data.hub_name) uniqueHubs.add(data.hub_name);
  //         customerIds.add(cleanId); // ✅ Use clean ID
  //       }
  //     }

  //     // ✅ Fetch customers_data in batches
  //     const customerDocs = await fetchInBatches(
  //       "customers_data",
  //       "customer_id",
  //       customerIds
  //     );
  //     const customerDataMap = {};
  //     customerDocs.forEach((data) => {
  //       customerDataMap[data.customer_id] = data.source || "-";
  //     });

  //     // ✅ Fetch latest wallet entry per customer (using created_date desc + limit 1)
  //     const walletDocs = await fetchInBatches(
  //       "wallet_history",
  //       "customer_id",
  //       customerIds,
  //       "created_date" // this will pick the latest based on created_date
  //     );

  //     const walletDataMap = {};
  //     walletDocs.forEach((data) => {
  //       walletDataMap[data.customer_id] = data;
  //     });

  //     // ✅ Merge data
  //     const mergedResults = results.map((sub) => {
  //       const cleanId = sub.customer_id?.replace(/_paused/i, "");
  //       return {
  //         ...sub,
  //         customer_id: cleanId,
  //         source: customerDataMap[cleanId] || "-",
  //         current_wallet_balance:
  //           walletDataMap[cleanId]?.current_wallet_balance ?? 0,
  //       };
  //     });

  //     setSubscriptions(mergedResults);
  //     // setProducts(Array.from(uniqueProducts));
  //     setSubscriptionTypes(Array.from(uniqueTypes));
  //     // setHubs(Array.from(uniqueHubs));
  //   } catch (error) {
  //     console.error("Error loading paused subscriptions:", error);
  //   }
  // };

  // const handleFilterChange = (field, value) => {
  //   setFilters({ ...filters, [field]: value });
  // };

  const clearFilters = () => {
    // setFilters({});
    setSelectedType(null);
    setSelectedHub(null);
    setSelectedProducts([]);
    // fetchData();
    setStartDate("");
    setEndDate("")
    setFirstTimeRender(true);
    setPauseSub([]);
    setPauseSubCopy([]);
    // const startInput = document.getElementById("startDateInput");
    // if (startInput) startInput.value = "";

    // const endInput = document.getElementById("endDateInput");
    // if (endInput) endInput.value = "";
  };

  // const filteredSubscriptions = Array.from(
  //   new Map(
  //     subscriptions
  //       .filter((sub) => {
  //         if (sub.subscription_type === "One Time") return false;

  //         const { subscription_type, updated_date, hub_name, product_name } =
  //           sub;
  //         const { type, startDate, endDate, hub, product } = filters;

  //         if (type && subscription_type !== type) return false;
  //         if (hub && hub !== hub_name) return false;
  //         if (product && product.length > 0 && !product.includes(product_name))
  //           return false;

  //         const updatedMoment = moment(
  //           updated_date instanceof Timestamp
  //             ? updated_date.toDate()
  //             : updated_date
  //         );

  //         // ✅ Apply correct start & end date comparison
  //         if (
  //           startDate &&
  //           updatedMoment.isBefore(moment(startDate).startOf("day"))
  //         )
  //           return false;
  //         if (endDate && updatedMoment.isAfter(moment(endDate).endOf("day")))
  //           return false;

  //         return true;
  //       })
  //       .map((item) => [
  //         `${item.customer_id}_${item.updated_date?.seconds || ""}`,
  //         item,
  //       ])
  //   ).values()
  // );

  // const fetchFilteredDataByDate = async () => {
  //   try {
  //     if (!filters.startDate || !filters.endDate) {
  //       alert("Please select both Start and End Date");
  //       return;
  //     }

  //     const start = moment(filters.startDate).startOf("day").toDate();
  //     const end = moment(filters.endDate).endOf("day").toDate();

  //     const q = query(
  //       collection(db, "subscriptions_data"),
  //       where("status", "==", "0"),
  //       where("updated_date", ">=", start),
  //       where("updated_date", "<=", end)
  //     );

  //     const querySnapshot = await getDocs(q);
  //     const results = [];
  //     const uniqueProducts = new Set();
  //     const uniqueTypes = new Set();
  //     const uniqueHubs = new Set();

  //     for (const doc of querySnapshot.docs) {
  //       const data = doc.data();
  //       if (data.subscription_type !== "One Time") {
  //         results.push({ id: doc.id, ...data });
  //         if (data.product_name) uniqueProducts.add(data.product_name);
  //         if (data.subscription_type) uniqueTypes.add(data.subscription_type);
  //         if (data.hub_name) uniqueHubs.add(data.hub_name);
  //       }
  //     }

  //     setSubscriptions(results);
  //     setProducts(Array.from(uniqueProducts));
  //     setSubscriptionTypes(Array.from(uniqueTypes));
  //     setHubs(Array.from(uniqueHubs));
  //   } catch (error) {
  //     console.error("Error loading filtered data:", error);
  //   }
  // };

  const generateCSVHeaders = [
    { label: "SN", key: "sn" },
    { label: "Customer ID", key: "customer_id" },
    { label: "Name", key: "customer_name" },
    { label: "Email", key: "customer_email" },
    { label: "Phone", key: "customer_phone" },
    { label: "Hub", key: "hub_name" },
    { label: "Product", key: "product_name" },
    { label: "Source", key: "source" },
    { label: "Wallet Balance", key: "current_wallet_balance" },
    { label: "Subscription Id", key: "subscription_id" },
    { label: "Subscription Type", key: "subscription_type" },
    { label: "Date of Pause", key: "date_of_pause" },
  ];

  const csvData = pauseSub.map((sub, index) => ({
    sn: index + 1,
    customer_id: sub.customer_id,
    customer_name: sub.customer_name,
    customer_email: sub.email,
    customer_phone: sub.customer_phone,
    hub_name: sub.hub_name,
    product_name: sub.product_name,
    source: sub.source,
    current_wallet_balance: sub.current_wallet_balance,
    subscription_id: sub.subscription_id,
    subscription_type: sub.subscription_type,
    date_of_pause: pausedSubIdMap.get(sub?.subscription_id),
  }));

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PausedSubscriptions");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "PausedSubscriptions.xlsx");
  };

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-3">Paused Subscriptions</h2>

      {/* Filters */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body p-3">
          {/* Date Filter Section */}
          <fieldset className="border p-3 rounded mb-4">
            <legend className="float-none w-auto px-2 small text-muted">
              Pause Date Filter
            </legend>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small">Start Date</label>
                <input
                  type="date"
                  id="startDateInput"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">End Date</label>
                <input
                  type="date"
                  id="endDateInput"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="col-md-3 d-flex align-items-center">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => fetchActivitiesByDateRange(startDate, endDate)}
                >
                  Apply Date Filter
                </button>
              </div>
            </div>
          </fieldset>

          {/* Other Filters Section */}
          <fieldset className="border p-3 rounded">
            <legend className="float-none w-auto px-2 small text-muted">
              Other Filters
            </legend>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small">Subscription Type</label>
                <Select
                  value={selectedType}
                  options={subscriptionTypes.map((t) => ({
                    value: t,
                    label: t,
                  }))}
                  onChange={(selected) => {
                    setSelectedType(selected);
                    filterBySubType(selected)
                    // handleFilterChange("type", selected?.value);
                  }}
                  placeholder="Select Type"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "34px",
                      fontSize: "0.875rem",
                    }),
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">Hub</label>
                <Select
                  value={selectedHub}
                  options={hubs.map((h) => ({ value: h, label: h }))}
                  onChange={(selected) => {
                    setSelectedHub(selected);
                    filterByHub(selected)
                    // handleFilterChange("hub", selected?.value);
                  }}
                  placeholder="Select Hub"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "34px",
                      fontSize: "0.875rem",
                    }),
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">Product</label>
                <Select
                  isMulti
                  value={selectedProducts}
                  options={products.map((p) => ({ value: p, label: p }))}
                  onChange={(selected) => {
                    setSelectedProducts(selected);
                    filterByProduct(selected);
                    // handleFilterChange(
                    //   "product",
                    //   selected ? selected.map((s) => s.value) : []
                    // );
                  }}
                  placeholder="Select Products"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "34px",
                      fontSize: "0.875rem",
                    }),
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <div className="col-md-3 d-flex align-items-center">
                {/* <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    // Trigger state update or UI refresh if needed
                  }}
                >
                  Apply Filters
                </button> */}
              </div>
            </div>
          </fieldset>

          {/* Buttons aligned right */}
          <div className="mt-3 d-flex justify-content-end gap-2 flex-wrap">
            <CSVLink
              data={csvData}
              headers={generateCSVHeaders}
              filename={"PausedSubscriptions.csv"}
              className="btn btn-sm btn-outline-primary"
            >
              Download CSV
            </CSVLink>
            <button
              onClick={exportToExcel}
              className="btn btn-sm btn-outline-success"
            >
              Download Excel
            </button>
            <button
              onClick={clearFilters}
              className="btn btn-sm btn-outline-danger"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}

      {firstTimeRender ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "100px",
          }}
        >
          <h3>Kindly select a date for the preparation of the report.</h3>
        </div>
      ) : loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "50px",
          }}
        >
          <>
            {/* <Spinner animation="border" /> */}
            <span style={{}}>
              <img
                src="https://static.showit.co/file/htL7TmAVTde2OYw8vCPtjg/98861/dots-typing.gif"
                alt=""
                style={{
                  width: "250px",
                }}
              />
            </span>
            <h3>Your report is in progress and will be ready shortly</h3>
          </>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped align-middle w-100">
            <thead className="table-dark">
              <tr>
                <th>SN</th>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Customer email</th>
                <th>Phone</th>
                <th>Hub</th>
                <th>Product</th>
                <th>Source</th>
                <th>Wallet Balance</th>
                <th>Subscription Id</th>
                <th>Subscription Type</th>
                <th>Date of Pause</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pauseSub.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center">
                    No paused subscriptions found.
                  </td>
                </tr>
              ) : (
                pauseSub.map((sub, index) => (
                  
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{sub.customer_id}</td>
                    <td>{sub.customer_name}</td>
                    <td>{sub.email}</td>
                    <td>{sub.customer_phone}</td>
                    <td>{sub.hub_name}</td>
                    <td>{sub.product_name}</td>
                    <td>{sub.source}</td>
                    <td>{sub.current_wallet_balance}</td>
                    <td>{sub.subscription_id}</td>
                    <td>{sub.subscription_type}</td>

                    <td>{pausedSubIdMap.get(sub?.subscription_id)}</td>
                    <td>
                      <a
                        href={`tel:${sub.customer_phone}?id=${sub.customer_id}`}
                        className="btn btn-sm btn-success me-1"
                      >
                        Call
                      </a>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRowClick(sub.customer_id)}
                      >
                        Log Conversation
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PausedSubscriptionsReport;
