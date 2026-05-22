import React, { useContext, useEffect, useState } from "react";
import CustomDateRangePicker from "../../components/CustomDateRangePicker";
import ExportOrderHistory from "./ExportOrderHistory";
import {
  FaArrowLeft,
  FaCoffee,
  FaEdit,
  FaMapMarkerAlt,
  FaSave,
  FaShoppingCart,
  FaStore,
  FaWarehouse,
} from "react-icons/fa";
import Swal from "sweetalert2";
import PDFComponent from "./Degital Challan/PdfGenerator";
import moment from "moment";
import GlobalContext from "../../context/GlobalContext";
import apiClient from "../../services/apiClient";

const ViewCafeOrders = ({ rowData }) => {
  const { permissible_roles } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });


  const handleDateChange = (startDate, endDate) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const formatDate = (date) => {
    if (!(date instanceof Date)) {
      console.error("Input must be a Date object", date);
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const fetchOrderHistory = async () => {
    setLoading(true);
    if (!rowData || !(rowData?.type) || !dateRange || !(dateRange?.start)) {
      setLoading(false);
      return
    }
    try {
      let filters = [{ field: "cafe_id", op: "==", value: rowData.cafe_id }];
      if (dateRange.start) {
        filters.push({ field: "delivery_date", op: ">=", value: formatDate(dateRange.start) });
      }
      if (dateRange.end) {
        filters.push({ field: "delivery_date", op: "<=", value: formatDate(dateRange.end) });
      }

      const docs = await apiClient.post("/api/b2b_orders/query", { filters }).then(res => res.data?.data || []);
      const orders = docs.map((doc) => ({
        id: doc._id,
        data: doc,
      }));

      setOrderList(orders);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rowData) {
      fetchOrderHistory();
    }
  }, [dateRange, rowData]);

  useEffect(() => {
    return () => {
      setDateRange({ start: null, end: null });
    };
  }, []);

  return (
    <div className="modal-content shadow-lg rounded-4 border-0 d-flex flex-column" style={{ width: "100%", height: "95%", maxHeight: "95vh", minHeight: "200px", overflow: "auto" }}>


      {loading && (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center">
          <img
            alt="loader"
            style={{ height: "6rem" }}
            src="images/loader.gif"
          />
        </div>
      )}

      <div >
        <OrderHistoryHeader
          rowData={rowData}
          handleDateChange={handleDateChange}
          orderList={orderList}
          fetchOrderHistory={fetchOrderHistory}
          dateRange={dateRange}
        />
      </div>


      <OrderHistoryTable rowData={rowData} orderList={orderList} fetchOrderHistory={fetchOrderHistory} permissible_roles={permissible_roles} />
    </div>
  );
};

export default ViewCafeOrders;

const OrderHistoryHeader = ({ rowData, handleDateChange, orderList, fetchOrderHistory, dateRange }) => {
  return (
    <div className="modal-header container-fluid d-flex flex-column align-items-center justify-content-center p-4">
      {/* Cafe */}
      <div className="d-flex justify-content-between align-items-center w-100 mb-3">
        {rowData.type === "Cafe" ? (
          <div className="d-flex align-items-center">

            <FaStore className="me-2 text-warning" size={18} />

            <span className="text-warning fw-bold fs-6">{rowData.cafe_name}</span>

          </div>
        ) : (
          <div className="d-flex align-items-center">

            <FaShoppingCart className="me-2 text-warning" size={18} />
            <span className="text-warning fw-bold fs-6">{rowData.cafe_name}</span>

          </div>
        )}
        {/* <span>{rowData.cafe_name}</span> */}
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          data-bs-dismiss="modal"
        ></button>
      </div>

      {/* Hub */}
      <div className="d-flex justify-content-between align-items-center w-100 mb-3">
        <div className="d-flex align-items-center">
          <FaWarehouse className="me-2 text-info" size={18} />
          <span className="text-uppercase text-muted small fw-semibold me-1">Hub:</span>
          <span className="text-dark fw-semibold fs-6">{rowData.delivery_hub}</span>
        </div>
        <ExportOrderHistory
          orderList={orderList}
          fetchOrderHistory={fetchOrderHistory}
          dateRange={dateRange}
          rowData={rowData}
        />
      </div>

      {/* Location */}

      <div className="d-flex justify-content-between align-items-start w-100 mb-3">
        <div className="d-flex flex-column align-items-start">
          <div className="d-flex align-items-start mb-3">
            <FaMapMarkerAlt className="me-2 text-success" size={18} />
            <span className="text-uppercase text-muted small fw-semibold me-1">Location:</span>
            <span className="text-dark fw-normal">{rowData.cafe_location}</span>
          </div>
          {/* Consignee */}
          <div className="d-flex justify-content-start align-items-center w-100">
            <FaMapMarkerAlt className="me-2 text-danger" size={18} />
            <span className="text-uppercase text-muted small fw-semibold me-1">Consignee:</span>
            <span className="text-dark fw-normal">{rowData.consignee_name}</span>
          </div>
        </div>
        <CustomDateRangePicker onDateChange={handleDateChange} />
      </div>

    </div>


  );
};



const OrderHistoryTable = ({ rowData, orderList, fetchOrderHistory, permissible_roles }) => {
  return (
    <>
      <div className="modal-body mx-4" style={{ overflow: 'auto', maxHeight: '500px', padding: '0px', marginBottom: "20px", marginTop: "20px" }}>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Created Date</th>
                <th style={{ textAlign: "center" }}>Delivery Date</th>
                <th style={{ textAlign: "center" }}>Product Name</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "center" }}>Package Unit</th>
                <th style={{ textAlign: "center" }}>Chalan No</th>
                <th style={{ textAlign: "center" }}>Hub</th>
                <th style={{ textAlign: "center" }}>Delivery Address</th>
                <th style={{ textAlign: "center" }}>Buyer Address</th>
                <th style={{ textAlign: "center" }}>Created by</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
                <th style={{ textAlign: "center" }}>DC</th>
                <th style={{ textAlign: "center" }}>Update By</th>
                <th style={{ textAlign: "center" }}>Update Date</th>

                <th style={{ textAlign: "center" }}>Previous Quantity</th>
              </tr>
            </thead>
            <tbody>
              {orderList && orderList.length > 0 ? (
                orderList.map(({ id, data }) => (
                  <HistoryRow key={id} id={id} data={data} fetchOrderHistory={fetchOrderHistory} rowData={rowData} permissible_roles={permissible_roles} />
                ))
              ) : (
                <tr>
                  <td colSpan="16" style={{ textAlign: "center" }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};



const HistoryRow = ({ id, data, fetchOrderHistory, rowData, permissible_roles }) => {
  const [edit, setEdit] = useState(false);
  const [quantity, setQuantity] = useState(data.quantity);
  const [date, setDate] = useState((data.delivery_date && !(data.delivery_date instanceof Date) || isNaN(data.delivery_date)) ? new Date(data.delivery_date) : "Invalid Date");
  const [status, setStatus] = useState(data.status);

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


  const handleEdit = () => {

    if (permissible_roles.includes("mark_b2b_delivery")) {
      setEdit(true);
    } else {
      rolePermission();
    }
  }
  const handleSave = async () => {
    const user = localStorage.getItem("loggedIn_user");
    const userId = localStorage.getItem("userId");

    const orderDetails = {
      ...data,
      status,
      delivery_date: date ? new Date(date).toISOString().split('T')[0] : null,
      quantity,
      updated_by: user,
      updated_by_user_id: userId,
      updated_date: new Date().toISOString().split('T')[0],
      updated_at: new Date(),
      previous_quantity: Number(quantity) === Number(data.quantity) ? data?.previous_quantity || [] : data?.previous_quantity ? [data.quantity, ...data.previous_quantity] : [data.quantity],
    };

    try {
      await apiClient.put(`/api/b2b_orders/${id}`, orderDetails);
      setEdit(false);
      Toast.fire({
        icon: 'success',
        title: `Order ID: ${data.order_id} updated successfully`
      });
    } catch (e) {
      console.error("Order update error: ", e);
      Toast.fire({
        icon: 'error',
        title: `Order ID: ${data.order_id} updated unsuccessfully`
      });
    } finally {
      fetchOrderHistory();
    }
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return "Invalid Date";
    }
    return moment(date).format("DD/MM/YYYY");
  };

  const statusOptions = [
    { value: 0, label: "Pending", class: "badge bg-warning text-dark" },
    { value: 1, label: "Delivered", class: "badge bg-success text-white" },
    { value: 2, label: "Cancelled", class: "badge bg-danger text-white" },
  ];
  const [currentStatus, setCurrentStatus] = useState();
  useEffect(() => {
    const currentStatus = statusOptions.find(option => option.value === status);
    setCurrentStatus(currentStatus);
  }, [status])

  useEffect(() => {
    setEdit(false);
    return () => {
      setEdit(false);
    }
  }, [data]);
  return (
    <tr className="hover-highlight">
      <td style={{ verticalAlign: "top" }}>
        {formatDate(new Date(data.created_date))}
      </td>
      <td style={{ verticalAlign: "top" }}>
        {formatDate(new Date(data.delivery_date))}
      </td>
      <td style={{ verticalAlign: "top" }}>{data.product_name}</td>
      <td style={{ verticalAlign: "top" }}>
        {edit ? (
          <input
            className="form-control p-2"
            type="number"
            onChange={(e) => setQuantity(e.target.value)}
            value={quantity}
            required
            autoComplete="off"
            min="1"
            step="1"
          />
        ) : (
          data.quantity
        )}
      </td>
      <td style={{ verticalAlign: "top" }}>{data.package_unit}</td>
      <td style={{ verticalAlign: "top" }}>{data.delivery_challan_no}</td>
      <td style={{ verticalAlign: "top" }}>{data.hub_name}</td>
      <td style={{ verticalAlign: "top" }}>{data.location}</td>
      <td style={{ verticalAlign: "top" }}>{data.location}</td>
      <td style={{ verticalAlign: "top" }}>{data.created_by}</td>




      <td style={{ verticalAlign: "top" }}>
        {edit && data.status === 0 ? (
          <select
            className={`form-select form-select-sm ${currentStatus?.class.replace("badge", "").trim()}`}
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className={option.class}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={currentStatus?.class}>
            {currentStatus?.label}
          </span>
        )}
      </td>

      <td style={{ verticalAlign: "top" }}>
        {edit ? (
          <button
            className="btn btn-dark btn-sm"
            style={{
              backgroundColor: "blue",
              border: "none",
              marginRight: "1rem",
              padding: "0.2rem 0.85rem",
            }}
            onClick={handleSave}
          >
            <FaSave style={{ color: "white" }} />
          </button>
        ) :
          status === 0 ? (
            <>
              <button
                className="btn btn-dark btn-sm"
                style={{
                  marginRight: "1rem",
                  padding: "0.2rem 0.85rem",
                }}
                onClick={handleEdit}
              >
                <FaEdit style={{ color: "white" }} />
              </button>
            </>) :
            <p>-</p>

        }
      </td>

      <td style={{ verticalAlign: "top" }}>
        {data.status === 2 ? "-" : <PDFComponent order={[data]} cafeData={rowData} />}
      </td>


      <td style={{ verticalAlign: "top" }}>{data.updated_by || "N/A"}</td>
      <td style={{ verticalAlign: "top" }}>
        {(data.created_at && [0, 1, 2].includes(data.status)) ? (
          (() => {
            const d = data.created_at.seconds ? new Date(data.created_at.seconds * 1000) : new Date(data.created_at);
            return d.toLocaleDateString() + " " + d.toLocaleTimeString();
          })()
        ) : (
          "-"
        )}
      </td>


      <td style={{ verticalAlign: "top" }} title="Previous quantity (newest to oldest)">
        {data.previous_quantity?.length
          ? data.previous_quantity.map((item, index) => (
            <span>

              <span className="p-1" key={index}>
                {item}
              </span>
              {index != data.previous_quantity.length - 1 ? <span className="px-1"><FaArrowLeft /></span> : null}
            </span>
          ))
          : "N/A"}
      </td>



    </tr>
  );
};












