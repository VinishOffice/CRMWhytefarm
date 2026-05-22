import React, { useContext, useEffect, useState } from "react";
import { fetchCodList, updateCodItem } from "./services/orderOperationsService";
import { useNavigate } from "react-router-dom";
import GlobalContext from "./context/GlobalContext";
import { getUserInfo, handleLogout } from "./Utility";
import moment from "moment";
import { Button } from "react-bootstrap";
import { ContentState } from "draft-js";
import { fromDate, now, serverTimestamp, fromSecondsNanoseconds, toDate } from './utils/dateUtils';

const TableCod = () => {
  const { loggedIn, userId, username, loggedIn_user } = getUserInfo();

const [selectedDate, setSelectedDate] = useState(
  moment().add(1, "day").format("YYYY-MM-DD")
);

  const [orders, setOrders] = useState([]);
  const [copyOrders, SetCopyOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStatusInfo, setSelectedStatusInfo] = useState({
    orderIndex: null,
    itemIndex: null,
    status: "",
    reason: "", // new
    sendWhatsApp: false,
  });

  const [name, SetName] = useState("");
  const [phone, SetPhone] = useState("");
  const [status, SetStatus] = useState("");
  const [createdAt, SetCreatedAt] = useState("");
  const [highLightColumn, SetHighLightColumn] = useState("Delivery Date");
const fetchOrders = async () => {
  try {
    const response = await fetchCodList();
    const rawOrders = response.orders || [];

    const enrichedOrders = rawOrders.map((order) => ({
      ...order,
      platform: order.platform || "Website",
    }));

    setOrders(enrichedOrders);
    setFilteredOrders(enrichedOrders);
    SetCopyOrders(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (
        permissible_roles.length > 0 &&
        !permissible_roles.includes("Tablecod")
      ) {
        handleLogout();
        navigate("/permission_denied");
      }
    }
  }, [navigate, permissible_roles]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔁 Returns orders with items filtered by status
  const filteredUpdated = () => {
    return filteredOrders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => {
          if (item?.status) {
            return statusFilter === "All" ? true : item.status === statusFilter;
          } else {
            return statusFilter === "pending";
          }
        }),
      }))
      .filter((order) => order.items.length > 0);
  };

  // 📌 Confirmation Modal Trigger
  const openConfirmationModal = (
    customer_id,
    next_delivery_date,
    product,
    qty,
    price_per_unit,
    status,
    order
  ) => {
    setSelectedStatusInfo({
      customer_id,
      next_delivery_date,
      product,
      qty,
      price_per_unit,
      status,
      order,
      // reason: "",           // for rejection reason
      // sendWhatsApp: false,  // checkbox flag
    });
    setModalOpen(true);
  };

  // ✅ Confirm & Update Status in Firebase + Local State
  const confirmStatusUpdate = async (
    customerOrder,
    status,
    customer_id,
    next_delivery_date,
    product,
    qty,
    price_per_unit,
    reason
  ) => {
    const agent_name = localStorage.getItem("agent_name") || "Unknown Agent";

    try {
      await updateCodItem({
        customer_id,
        next_delivery_date,
        product,
        qty,
        price_per_unit,
        status,
        reason,
        agent_name,
      });

      const updatedOrders = orders.map((o) => {
        if (o.customer_id !== customer_id) return o;

        const updatedItems = o.items.map((item) => {
          if (
            item.next_delivery_date === next_delivery_date &&
            item.product === product &&
            item.qty === qty &&
            item.price_per_unit === price_per_unit
          ) {
            return {
              ...item,
              status,
              updatedAt: new Date(),
              cancel_reason: status === "Reject" ? reason : null,
              agent_name: agent_name,
            };
          }
          return item;
        });

        return { ...o, items: updatedItems };
      });

      setOrders(updatedOrders);
      handleDateFilter();
      setModalOpen(false);
    } catch (error) {
      console.error("COD update error:", error);
    }
  };


  const filterByName = (name) => {
    const filtered = copyOrders.filter((order) =>
      order.customer_name.toLowerCase().includes(name.toLowerCase())
    );
    // SetCopyOrders(filtered);
    setFilteredOrders(filtered);
  };

  const filterByPhone = (phone) => {
    const filtered = copyOrders.filter((order) => order.phone.includes(phone));
    // SetCopyOrders(filtered);
    setFilteredOrders(filtered);
  };

  const filterByCreatedAt = (date) => {
    const filtered = copyOrders.filter(
      (order) => moment(order.createdAt.toDate()).format("YYYY-MM-DD") === date
    );
    // setFilteredOrders(filtered);
    SetCopyOrders(filtered);
  };

  const filterByStatus = (status) => {
    const filtered = copyOrders.filter(
      (order) => order.items[0].status === status
    );
    // SetCopyOrders(filtered);
    setFilteredOrders(filtered);
  };

  // 🧠 Run this when orders change
  useEffect(() => {
    if (orders.length) {
      handleDateFilter();
    }
  }, [orders]);

  //Run when selected date changes
  useEffect(() => {
    handleDateFilter();
  }, [selectedDate]);

  // Apply filter by next_delivery_date
  const handleDateFilter = () => {
    const date = moment(selectedDate).format("YYYY-MM-DD");
    if (!date) return;
    const filteredOrders = orders.filter(
      (order) =>
        moment(order.items[0].next_delivery_date).format("YYYY-MM-DD") === date
    );
    setFilteredOrders(filteredOrders);
    SetCopyOrders(filteredOrders);
  };

  const groupedOrders = [];

  const groupMap = new Map();

  filteredOrders.forEach((order) => {
    const key = `${order.customer_id}_${moment(
      order.items[0].next_delivery_date
    ).format("YYYY-MM-DD")}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        ...order,
        items: [...order.items], // clone items
      });
    } else {
      groupMap.get(key).items.push(...order.items);
    }
  });

  groupedOrders.push(...groupMap.values());

  return (
    <>
      <div className="m-3">
        <p
          className="text-center mb-5 mt-5"
          style={{ fontSize: "48px", fontWeight: "bold" }}
        >
          Awaiting Confirmation Orders
        </p>

        {/* Date and Status Filter */}

        <div className="border border-4 border-dark-subtle  bg-gray-50 rounded-xl p-3">
          <div className="d-flex justify-content-between">
            <p className="fw-bold fs-2 mb-5">Filter Order</p>
            <p
              className="fw-bolder text-decoration-underline text-primary"
              role="button"
              onClick={() => {
                SetName("");
                SetPhone("");
                SetPhone("");
                SetStatus(null);
                SetCreatedAt("");
                handleDateFilter();
                SetHighLightColumn("")
              }}
            >
              clear all filters
            </p>
          </div>

          <div className="d-flex justify-content-between  ">
            <div className="flex items-center gap-2 mb-4">
              <label className="mb-3 fs-6 fw-bold">Deliver By : </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  SetHighLightColumn("Delivery Date");
                }}
                className="border px-3 py-2 rounded-md"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="mb-3 fs-6 fw-bold">Created At : </label>
              <input
                type="date"
                value={createdAt}
                onChange={(e) => {
                  filterByCreatedAt(e.target.value);
                  SetCreatedAt(e.target.value);
                  SetHighLightColumn("Requested At");
                }}
                className="border px-3 py-2 rounded-md"
              />
            </div>
            <div>
              <label className="mb-3 fs-6 fw-bold">Status Update: </label>
              <select
                value={status}
                onChange={(e) => {
                  SetStatus(e.target.value);
                  filterByStatus(e.target.value);
                }}
                className="border px-2 py-1 rounded ml-2 bg-white"
              >
                <option>Select status</option>
                <option value="Pending">Pending</option>
                <option value="Accept">Accept</option>
                <option value="Reject">Reject</option>
              </select>
            </div>

            <div className="mb-3  ">
              <label className="mb-3 fs-6 fw-bold">Customer Name: </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  SetName(e.target.value);
                  filterByName(e.target.value);
                  SetHighLightColumn("Customer Name");
                }}
                className="py-2 px-1 ms-1 border border-2 rounded bg-white"
                placeholder="e.g Alice"
              />
            </div>
            <div className="mb-3  ">
              <label className="mb-3 fs-6 fw-bold">Mobile Number: </label>
              <input
                type="number"
                value={phone}
                onChange={(e) => {
                  filterByPhone(e.target.value);
                  SetPhone(e.target.value);
                  SetHighLightColumn("Phone");
                }}
                className="py-2 px-1 ms-1 border border-2 rounded bg-white"
                placeholder="e.g 98765"
              />
            </div>

            {/* filter by order_id is pending 
        <div className="mb-3  ">
        <label>Order Id: </label>
        <input 
        type="number"
     
        className="py-2 px-1 ms-1 border border-2 rounded" 
        placeholder="e.g Order_123"/>
     
        </div> */}

            {/* filter by platform is pending 
        <div className="mb-3  ">
        <label>Platform: </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded ml-2 ms-1"
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Accept">Accept</option>
          <option value="Reject">Reject</option>
        </select>
        </div> */}
          </div>
        </div>

        {/* Orders Table */}
        <div className="col-12 mt-4">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-dark">
                <tr>
                  <th className="">Requested At </th>
                  <th>Delivery Date</th>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Product</th>

                  <th>Hub</th>
                  <th>Price/Unit</th>
                  <th>Total Price</th>
                  <th>Email</th>
                  <th>Platform</th>
                  <th>Agent</th>

                  <th>Status</th>
                  <th>Action Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders && filteredOrders.length > 0 ? (
                  filteredOrders.map((order, orderIndex) => (
                    <tr key={orderIndex} style={{ verticalAlign: "top" }}>
                      {/* Created & Delivery Date */}
                      <td
                        className={`${
                          highLightColumn === "Requested At"
                            ? "table-primary"
                            : ""
                        }`}
                      >
                        {order.createdAt?.toDate().toLocaleDateString()}
                      </td>
                      <td
                        className={`${
                          highLightColumn === "Delivery Date"
                            ? "table-primary"
                            : ""
                        }`}
                      >
                        {moment(order.items[0].next_delivery_date).format(
                          "DD-MM-YYYY"
                        )}
                      </td>

                      {/* Customer Info */}
                      <td onClick={() => handleRowClick(order.customer_id)}>
                        {order.customer_id}
                      </td>
                      <td
                        className={`${
                          highLightColumn === "Customer Name"
                            ? "table-primary"
                            : ""
                        }`}
                        onClick={() => handleRowClick(order.customer_id)}
                      >
                        {order.customer_name}
                      </td>
                      <td
                        className={`${
                          highLightColumn === "Phone" ? "table-primary" : ""
                        }`}
                        onClick={() => handleRowClick(order.customer_id)}
                      >
                        {order.phone}
                      </td>

                      {/* Products */}
                      <td>
                        {order.items.map((item, i) => (
                          <div key={i}>
                            {item.product} <strong>x{item.qty}</strong>
                          </div>
                        ))}
                      </td>

                      {/* Hub */}
                      <td>{order.hub}</td>

                      {/* Price per Unit */}
                      <td>
                        {order.items.map((item, i) => (
                          <div key={i}>₹{item.price_per_unit}</div>
                        ))}
                      </td>

                      {/* Total Price */}
                      <td style={{ fontWeight: "bold" }}>
                        ₹
                        {order.items.reduce(
                          (total, item) => total + (item.total_price || 0),
                          0
                        )}
                      </td>

                      {/* Email */}
                      <td>{order.email}</td>

                      {/* platform */}
                      <td>
                        {order.platform || (
                          <span style={{ color: "gray" }}>N/A</span>
                        )}
                      </td>

                      <td>
                        {order.items.map((item, i) => (
                          <div key={i}>
                            {item.status === "Accept" ||
                            item.status === "Reject"
                              ? item.agent_name || (
                                  <span style={{ color: "gray" }}>N/A</span>
                                )
                              : "-"}
                          </div>
                        ))}
                      </td>

                      {/* Accept / Reject Buttons for each item */}
                      <td>
                        {order.items.map((item, i) => {
                          const isPending =
                            item.status?.toLowerCase() === "pending" ||
                            !item.status;
                          const dateCheck = new Date(item.next_delivery_date) <= new Date(Date.now());
                          return (
                            <div key={i} className="mb-2 ">
                              {
                                isPending ? (
                                  dateCheck ? 
                                <span
                                 style={{
                                     background:"red",
                                     color:"white",
                                     padding:"5px",
                                     borderRadius:"5px"
                                 }}
                                >You can't accept this order</span>
                                :
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => {
                                      openConfirmationModal(
                                        order.customer_id,
                                        item.next_delivery_date,
                                        item.product,
                                        item.qty,
                                        item.price_per_unit,
                                        "Accept",
                                        order
                                      );
                                    }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      openConfirmationModal(
                                        order.customer_id,
                                        item.next_delivery_date,
                                        item.product,
                                        item.qty,
                                        item.price_per_unit,
                                        "Reject",
                                        order
                                      )
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{ color: "green", fontWeight: "bold" }}
                                >
                                  {item.status}
                                  {item.status === "Reject" &&
                                    item.cancel_reason && (
                                      <div
                                        style={{
                                          marginTop: "5px",
                                          fontSize: "14px",
                                          fontWeight: "bold",
                                          color: "black",
                                        }}
                                      >
                                        Reason:{item.cancel_reason}
                                      </div>
                                    )}
                                </span>
                              )}
                              
                            </div>
                          );
                        })}
                      </td>
                      <td>
                        {order.items[0].status === "Accept" ||
                        order.items[0].status === "Reject"
                          ? order?.updatedAt?.toDate().toLocaleDateString() +
                            " " +
                            order?.updatedAt?.toDate().toLocaleTimeString()
                          : ""}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan="13">No data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}

        {modalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              }}
            >
              <p
                style={{
                  marginBottom: "20px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                Are you sure you want to{" "}
                <strong>{selectedStatusInfo.status}</strong> this order?
              </p>

              {selectedStatusInfo.status === "Reject" && (
                <div style={{ marginBottom: "16px" }}>
                  <textarea
                    rows="3"
                    placeholder="Enter rejection reason..."
                    value={selectedStatusInfo.reason}
                    onChange={(e) =>
                      setSelectedStatusInfo((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      resize: "vertical",
                      marginBottom: "10px",
                    }}
                  />
                  {/* <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={selectedStatusInfo.sendWhatsApp}
              onChange={(e) =>
                setSelectedStatusInfo((prev) => ({
                  ...prev,
                  sendWhatsApp: e.target.checked,
                }))
              }
            />
            Send reason via WhatsApp
          </label> */}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                }}
              >
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    confirmStatusUpdate(
                      selectedStatusInfo.order,
                      selectedStatusInfo.status,
                      selectedStatusInfo.customer_id,
                      selectedStatusInfo.next_delivery_date,
                      selectedStatusInfo.product,
                      selectedStatusInfo.qty,
                      selectedStatusInfo.price_per_unit,
                      selectedStatusInfo.reason,
                      selectedStatusInfo.sendWhatsApp
                    )
                  }
                >
                  Confirm
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TableCod;
