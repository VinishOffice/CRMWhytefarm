import React, { useContext, useEffect, useState } from "react";
import { FaTrashAlt, FaFileDownload, FaEdit } from "react-icons/fa";
import moment from "moment";
import apiClient from "./services/apiClient";
import {
  fetchB2BMissing,
  fetchB2BSummary,
} from "./services/orderOperationsService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from "./Utility";
import TopPanel from "./TopPanel";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const OrderSummaryPage = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState([0, 0, 0]);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [searchTerm, setSearchTerm] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const [missingCafes, setMissingCafes] = useState([]);
  const [editOrder, setEditOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    if (permissible_roles.length > 0 && !permissible_roles.includes("b2b_banner")) {
      handleLogout();
      navigate("/permission_denied");
    }
  }, [navigate, permissible_roles]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetchB2BSummary(selectedDate);
        setOrders(response.orders || []);
        setSummary(response.summary || [0, 0, 0]);
      } catch (error) {
        console.error("Failed to load B2B summary:", error);
      }
    };

    loadSummary();
  }, [selectedDate]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-warning text-dark",
      delivered: "bg-success text-white",
      cancelled: "bg-danger text-white",
    };
    return (
      <span className={`badge ${styles[status] || "bg-secondary"} text-capitalize`}>
        {status}
      </span>
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      await apiClient.delete(`/api/b2b_orders/${id}`);
    }
  };

  const handleDownload = (order) => {
    const data = `Order Summary\n\nCafe: ${order.cafe_name}\nLocation: ${order.cafe_location}\nQty: ${order.total_qty}\nDate: ${order.order_date}`;
    const blob = new Blob([data], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const showMissingOrders = async () => {
    const response = await fetchB2BMissing(selectedDate);
    setMissingCafes(response.data || []);
    setShowMissing(true);
  };

  const exportToCSV = () => {
    const data = orders.map((o) => ({
      Cafe: o.cafe_name,
      Location: o.cafe_location,
      Date: o.order_date,
      Status: o.status,
      Quantity: o.total_qty,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Orders");
    const csvBlob = XLSX.write(wb, { bookType: "csv", type: "array" });
    saveAs(new Blob([csvBlob]), `orders-${selectedDate}.csv`);
  };

  const exportToXLSX = () => {
    const data = orders.map((o) => ({
      Cafe: o.cafe_name,
      Location: o.cafe_location,
      Date: o.order_date,
      Status: o.status,
      Quantity: o.total_qty,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Orders");
    const xlsxBlob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([xlsxBlob]), `orders-${selectedDate}.xlsx`);
  };

  const handleEdit = (order) => {
    setEditOrder(order);
    setNewStatus(order.status);
  };

  const updateStatus = async () => {
    if (!editOrder?.id || !newStatus) return;
    const statusMap = { pending: 0, delivered: 1, cancelled: 2 };
    await apiClient.patch(`/api/b2b_orders/${editOrder.id}`, {
      data: { status: statusMap[newStatus] },
    });
    setEditOrder(null);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.cafe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cafe_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-scroller">
      <TopPanel />
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="container my-4">
              <h5 className="fw-bold mb-4">Filtered Orders Summary</h5>

              <div className="row mb-4">
                {["Delivered Qty", "Pending Qty", "Total Qty"].map((label, i) => (
                  <div key={label} className="col-md-4">
                    <div className="bg-light text-center rounded p-3 shadow-sm">
                      <div className="text-muted fw-semibold mb-1">{label}</div>
                      <h4 className="fw-bold">{summary[i]}</h4>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-3 mb-3 flex-wrap">
                <button className="btn btn-warning text-white" onClick={showMissingOrders}>
                  Show Missing Orders
                </button>
                <input
                  type="text"
                  placeholder="Search by name or location"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "250px" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="ms-auto d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={exportToCSV}>
                    Export CSV
                  </button>
                  <button className="btn btn-outline-secondary" onClick={exportToXLSX}>
                    Export XLSX
                  </button>
                </div>
              </div>

              <div className="mb-4 d-flex justify-content-end">
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "200px" }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="table-responsive shadow-sm bg-white rounded">
                <table className="table table-hover mb-0">
                  <thead className="table-light text-center">
                    <tr>
                      <th className="text-start">Cafe Name</th>
                      <th className="text-start">Cafe Location</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Total Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => (
                      <tr key={i} className="text-center align-middle">
                        <td className="text-start text-primary">{order.cafe_name}</td>
                        <td className="text-start text-primary">{order.cafe_location}</td>
                        <td>{order.order_date}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>{order.total_qty}</td>
                        <td>
                          <FaFileDownload className="me-2 text-purple" style={{ cursor: "pointer" }} onClick={() => handleDownload(order)} />
                          <FaEdit className="me-2 text-info" style={{ cursor: "pointer" }} onClick={() => handleEdit(order)} />
                          <FaTrashAlt className="text-danger" style={{ cursor: "pointer" }} onClick={() => handleDelete(order.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editOrder && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Edit Order Status</h5>
                        <button className="btn-close" onClick={() => setEditOrder(null)}></button>
                      </div>
                      <div className="modal-body">
                        <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-primary" onClick={updateStatus}>Update</button>
                        <button className="btn btn-secondary" onClick={() => setEditOrder(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showMissing && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Cafes Missing Orders</h5>
                        <button className="btn-close" onClick={() => setShowMissing(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p className="text-muted">These cafes have not placed an order today:</p>
                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          <table className="table table-bordered table-sm">
                            <thead className="table-light">
                              <tr>
                                <th>CAFE NAME</th>
                                <th>TYPE</th>
                                <th>ADDRESS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {missingCafes.map((cafe, index) => (
                                <tr key={index}>
                                  <td>{cafe.cafe_name}</td>
                                  <td>{cafe.type}</td>
                                  <td>{cafe.cafe_location}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowMissing(false)}>Close</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;
