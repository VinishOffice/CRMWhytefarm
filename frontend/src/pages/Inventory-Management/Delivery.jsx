import { AiOutlineClose } from "react-icons/ai";
import React, { useEffect, useState } from "react";
import { Card, Button, Table, Row, Col, Dropdown } from "react-bootstrap";
import { useInventoryContext } from "./InventoryContext";
import { HubDropdown, ProductDropdown } from "./utility/productDropDown";
import { DateTimeUtil } from "../../Utility";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExportToCSV from "../../components/Export/ExportToCSV";
import apiClient from "../../services/apiClient";



const Delivery = () => {
  const { hubs, user, orders, setOrders } = useInventoryContext();

  const [selectedHub, setSelectedHub] = useState("All Hubs");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [date , setDate] = useState(new Date())
  // Example data for products
  const [products, setProducts] = useState([]);

  const [summary, setSummary] = useState([]);

  useEffect(()=>{
      if(user.role === "Hub Manager"){
        setSelectedHub(user.hub_name);  // Automatically set the hub for Hub Manager
      }
    }, [])

  // Fetch orders from database
  const fetchTodayOrdersList = async () => {
    try {
      if(user.role === "Admin"){
      const docs = await apiClient.post("/api/order_history/query", {
        filters: [{ field: "delivery_date", op: "==", value: DateTimeUtil.timestampToISOHyphenDate(new Date(date)) }]
      }).then(res => res.data?.data || []);
      const data = docs.map((doc) => ({ ...doc, id: doc._id }));
      setOrders(data);
      }else if(user.hub_name){
        const docs = await apiClient.post("/api/order_history/query", {
          filters: [
            { field: "delivery_date", op: "==", value: DateTimeUtil.timestampToISOHyphenDate(new Date(date)) },
            { field: "hub_name", op: "==", value: user.hub_name }
          ]
        }).then(res => res.data?.data || []);
        const data = docs.map((doc) => ({ ...doc, id: doc._id }));
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching Todays Orders:", error);
      Swal.fire("Error", "Failed to fetch Todays Orders. Please try again.", "error");
    }
  };

  useEffect(() => {
    fetchTodayOrdersList();
  }, [date]);

  useEffect(() => {
    
    if (orders.length > 0) {
      // Step 1: Filter orders based on the selected hub
      const filteredOrders = selectedHub === "All Hubs" ? orders : orders.filter(({ hub_name }) => hub_name === selectedHub);
      
      // Step 2: Get a list of unique products (product_name) based on the filtered orders
      const productsList = [...new Set(filteredOrders.map(({ product_name }) => product_name))];
      
      // Step 3: Map through the unique products to generate product summary
      const productSummary = productsList.map((productName) => {
        // Filter the orders for each product
        const filteredProductOrders = filteredOrders.filter(
          (order) => order.product_name === productName
        );
        
        // Count the number of delivered, pending, and canceled orders for this product
        const delivered = filteredProductOrders.filter((order) => order.status === "1").length;
        const pending = filteredProductOrders.filter((order) => order.status === "0").length;
        const canceled = filteredProductOrders.filter((order) => order.status === "2").length;
        // hm yha p wo logic likhenge and compare
        // Find the corresponding product in the `products` array to get the `finalOrder` value
        const product = products.find((prod) => prod.productName === productName);
        
        return {
          productName,
          delivered,
          pending,
          canceled,
          total: delivered+pending+canceled || 0,  // Ensure `finalOrder` exists for this product
        };
      });
      
      setSummary(productSummary);
    }
  }, [orders, selectedHub, products]);
  
  const prepareCSVData = () => {
    const csvData = summary.map((product) => {
      return [
        product.productName,
        product.delivered,
        product.pending,
        product.canceled,
        product.delivered+product.pending+product.canceled,
      ]
      });
      return csvData;
      };

      const [showDeliveryModal, setShowDeliveryModal] = useState(false); // State to control modal visibility
      const [deliveredOrders, setDeliveredOrders] = useState([]);
      const [status, setStatus] = useState(1);


      // Show delivered orders in the modal
      const showDeliveredOrdersModal = (status) => {
        const deliveredOrders = orders.filter(order => order.status === status); // Filter only the delivered orders
        const filteredOrders = selectedHub === "All Hubs" ? deliveredOrders : deliveredOrders.filter(({ hub_name }) => hub_name === selectedHub);
        setDeliveredOrders(filteredOrders);
        setStatus(prev=>status);
        setShowDeliveryModal(true); // Open the modal
      };

      const closeModal = () => {
        setShowDeliveryModal(false); // Close the modal
      };

  return (
    <>
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex justify-content-between align-items-center mt-1">
            <div className="d-flex flex-column gap-1">
              <h3 className="">Delivery Management</h3>
              <div className="d-flex align-items-center gap-3">
                <p className="text-black text-bold fs-4">Date:</p>
                <DateInputEnd
                  date={date}
                  setDate={setDate}
                  style={{ width: "140px", backgroundColor: "#F8F9FA", borderRadius: "0.375rem" }}
                />
              </div>
            </div>

            <div className="d-flex flex-column align-items-end gap-1">
              <ExportToCSV
                csvColumns={["Product Name", "Delivered", "Pending", "Canceled", "Total"]}
                csvData={prepareCSVData()}
                CSV_FileName={`orders-${DateTimeUtil.timestampToDate(date)}-${selectedHub}`}
              />
              <div className="d-flex align-items-center gap-2">
                <h4 className="mb-0">Hub:</h4>
                {user.role === 'Admin' 
                ? <HubDropdown selectedHub={selectedHub} setSelectedHub={setSelectedHub} />
                : <h4 className="text-primary mb-0">{user.hub_name}</h4>
                } 
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-4 shadow-sm" style={{ borderRadius: "15px", backgroundColor: "#f9f9fb" }}>
  <div className="container my-4">
    <div>
      <h4 className="text-primary mb-4 fw-bold">Delivery Stats</h4>
    </div>
    <div className="d-flex flex-column gap-4">
      {/* Flex Container for Cards */}
      <div className="d-flex flex-wrap justify-content-between gap-3">
        {/* Card Template */}
        {[
          {
            title: "Total Orders",
            value: summary.reduce((acc, { total }) => acc + total, 0),
            color: "text-primary",
            bgHover: "#cce5ff",
          },
          {
            title: "Delivered",
            value: summary.reduce((acc, { delivered }) => acc + delivered, 0),
            color: "text-success",
            bgHover: "#d4edda",
            onClick: ()=>showDeliveredOrdersModal("1"),
          },
          {
            title: "Pending",
            value: summary.reduce((acc, { pending }) => acc + pending, 0),
            color: "text-warning",
            bgHover: "#fff3cd",
            onClick: ()=>showDeliveredOrdersModal("0"),
          },
          {
            title: "Cancelled",
            value: summary.reduce((acc, { canceled }) => acc + canceled, 0),
            color: "text-danger",
            bgHover: "#f8d7da",
            onClick: ()=>showDeliveredOrdersModal("2"),
          },
        ].map(({ title, value, color, bgHover, onClick }, index) => (
          <div
            key={index}
            className="flex-grow-1 card text-center shadow-sm border-0"
            style={{
              minWidth: "220px",
              flexBasis: "22%",
              cursor: "pointer",
              borderRadius: "15px",
              backgroundColor: "#ffffff",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.backgroundColor = bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 5px 10px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            <div className="card-body">
              <h5 className="card-title mb-2 text-muted fw-bold">{title}</h5>
              <h2 className={`card-text ${color} fw-bold`}>{value}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>



      
      <div className="card p-3 mb-4">
        <div className="container my-4">
          <div>
            <h4 className="text-primary mb-4">Delivery Summary Table</h4>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Delivered</th>
                  <th>Pending</th>
                  <th>Canceled</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {summary && summary.length> 0  ? summary.map((summaryItem, index) => (
                  <tr key={index}>
                    <td>{summaryItem.productName}</td>
                    <td>{summaryItem.delivered}</td>
                    <td>{summaryItem.pending}</td>
                    <td>{summaryItem.canceled}</td>
                    <td>{summaryItem.total}</td>
                  </tr>
                ))
              : 
              <tr>
                <td colSpan="5" className="text-center">No data available</td>
              </tr>
              }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="alert alert-info mt-4">
        <strong>Note:</strong> The remaining stock is updated by subtracting delivered quantities and adding returned excess stock.
      </div>

      
      <DeliveredOrdersModal  showDeliveryModal={showDeliveryModal} deliveredOrders={deliveredOrders} closeModal={closeModal} status={status} />
      

    </>
  );
};

export default Delivery;


export const DateInputEnd = ({ date, setDate, style }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);

  const defaultStyle = {
    position: "relative",
    display: "inline-block",
  };

  const inputStyle = {
    cursor: "pointer",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "200px", // Set a fixed width for the input to make it more consistent
    textAlign: "center", // Center align the date text
    backgroundColor: "#f9f9f9", // Slight background color for better visibility
    fontSize: "14px", // Adjust font size
    fontWeight: "500", // Add a little font weight for prominence
    color: "#333", // Color for the text
    ...style,
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setDate(date);
    setShowCalendar(false);
  };

  const handleClickOutside = (event) => {
    if (event.target.closest('.datepicker-popup') === null) {
      setShowCalendar(false);
    }
  };

  // Attach event listener to close the calendar when clicking outside
  React.useEffect(() => {
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div style={defaultStyle}>
      <p onClick={() => setShowCalendar((prev) => !prev)} style={inputStyle}>
        {DateTimeUtil.timestampToDate(selectedDate)}
      </p>
      {showCalendar && (
        <div className="datepicker-popup" style={{ position: "absolute", zIndex: 1000 }}>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            onClickOutside={() => setShowCalendar(false)}
            maxDate={today}
          />
        </div>
      )}
    </div>
  );
};


const DeliveredOrdersModal = ({ showDeliveryModal, deliveredOrders, closeModal, status }) => {
  const canceledOrders = deliveredOrders;
  const pendingOrders = deliveredOrders;
  const {deliveryExecutive} = useInventoryContext();
  const orderLabel = status === "0" ? "Panding" : status === "1" ? "Deleiverd" : "Cancel" ;
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return 'N/A'; // Handle null/undefined values
    const strValue = String(value); // Ensure it's a string
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`; // Escape double quotes and wrap in quotes
    }
    return strValue;
  };

  const exportDeliveredCSV = () => {
    const headers = ["Customer Name", "Customer Phone", "Product Name", "Quantity", "Delivery Executive", "Delivery Executive ID", "Delivery Executive Phone", "Order Type", "Delivery Time", "Price", "Delivery Address"];
    
    // Prepare data rows
    const rows = deliveredOrders.map(order => [
      escapeCSVValue(order.customer_name),
      escapeCSVValue(order.customer_phone),
      escapeCSVValue(order.product_name),
      escapeCSVValue(order.quantity),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.first_name),
      escapeCSVValue(order.delivery_exe_id),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.phone_no),
      escapeCSVValue(order.order_type),
      escapeCSVValue(order.delivery_time),
      escapeCSVValue(order.price),
      escapeCSVValue(order.delivering_to)
    ]);

    // Create a CSV content string
    const csvContent = [
      headers.join(','), // Headers row
      ...rows.map(row => row.join(',')) // Data rows
    ].join('\n');

    // Create a Blob and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'delivered_orders.csv'; // Filename
    link.click();
  };

  const exportPendingCSV = () => {
    const headers = ["Customer Name", "Customer Phone", "Product Name", "Quantity", "Delivery Executive", "Delivery Executive ID", "Delivery Executive Phone", "Order Type", "Price", "Delivery Address"];
    
    // Prepare data rows
    const rows = pendingOrders.map(order => [
      escapeCSVValue(order.customer_name),
      escapeCSVValue(order.customer_phone),
      escapeCSVValue(order.product_name),
      escapeCSVValue(order.quantity),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.first_name),
      escapeCSVValue(order.delivery_exe_id),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.phone_no),
      escapeCSVValue(order.order_type),
      escapeCSVValue(order.price),
      escapeCSVValue(order.delivering_to)
    ]);

    // Create a CSV content string
    const csvContent = [
      headers.join(','), // Headers row
      ...rows.map(row => row.join(',')) // Data rows
    ].join('\n');

    // Create a Blob and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pending_orders.csv'; // Filename
    link.click();
  };

  const exportCanceledCSV = () => {
    const headers = [
      "Customer Name", "Customer Phone", "Product Name", "Quantity", "Order Type", 
      "Cancelation Reason", "Cancelation Time", "Delivery Executive", 
      "Delivery Executive ID", "Delivery Executive Phone", "Price", "Delivery Address"
    ];
    
    // Prepare data rows
    const rows = canceledOrders.map(order => [
      escapeCSVValue(order.customer_name),
      escapeCSVValue(order.customer_phone),
      escapeCSVValue(order.product_name),
      escapeCSVValue(order.quantity),
      escapeCSVValue(order.order_type),
      escapeCSVValue(order.cancelled_reason || "N/A"),
      escapeCSVValue(order.cancelled_time),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.first_name || "N/A"),
      escapeCSVValue(order.delivery_exe_id),
      escapeCSVValue(deliveryExecutive[order.delivery_exe_id]?.phone_no || "N/A"),
      escapeCSVValue(order.price),
      escapeCSVValue(order.delivering_to)
    ]);

    // Create a CSV content string
    const csvContent = [
      headers.join(','), // Headers row
      ...rows.map(row => row.join(',')) // Data rows
    ].join('\n');

    // Create a Blob and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'canceled_orders.csv'; // Filename
    link.click();
  };



  return (
    <div
      className={`modal fade ${showDeliveryModal ? "show" : ""}`}
      tabIndex="-1"
      aria-labelledby="deliveredOrdersModalLabel"
      aria-hidden={!showDeliveryModal}
      style={{
        display: showDeliveryModal ? "block" : "none",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "1050",
        transition: "opacity 0.3s ease-in-out"
      }}
    >
      {/* Chrome-like Modal */}
      <div
        className="modal-content shadow-lg border-0 w-100 h-100"
        style={{
          background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
          borderRadius: "12px 12px 0 0",
          overflow: "hidden",
          transform: "scale(1)",
          opacity: "1",
          transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
        }}
      >
        {/* Chrome Tab Bar */}
        <div
          className="modal-header border-0 d-flex justify-content-between align-items-center px-3 py-2 bg-light rounded-top shadow-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f1f3f4",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            padding: "10px"
          }}
        >
            {/* Tab Title */}
            <div
              style={{
                color: "#5f6368",
                fontWeight: "bold",
                marginLeft: "12px",
                fontSize: "14px"
              }}
            >
              Delivery Management
            </div>
          <div className="d-flex align-items-center justify-content-center">
            {/* Close button inside the red circle */}
            <button
  type="button"
  className="d-flex align-items-center justify-content-center border-0 bg-danger text-white rounded-circle p-1"
  data-bs-dismiss="modal"
  aria-label="Close"
  onClick={closeModal}
  style={{
    width: "20px",
    height: "20px",
    cursor: "pointer",
    transition: "background 0.2s ease-in-out",
  }}
  onMouseEnter={(e) => (e.target.style.backgroundColor = "#dc3545")}
  onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff4d4f")}
>
  <AiOutlineClose style={{ fontSize: "12px" }} />
</button>


            
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3 bg-white border-bottom"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 24px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #ddd"
          }}
        >
          <h3
            className="m-0 fw-bold"
            style={{
              color: status === "0" ? "#ffc107" : status === "1" ? "#28a745" : "#dc3545",
              fontWeight: "bold",
              margin: "0"
            }}
          >
            {status === "0" ? "Pending Orders" : status === "1" ? "Delivered Orders" : "Canceled Orders"}
          </h3>

          <button
            className="btn btn-success px-4 fw-semibold"
            onClick={status === "0" ? exportPendingCSV : status === "2" ? exportCanceledCSV : exportDeliveredCSV}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s ease-in-out"
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
          >
            Export CSV
          </button>
        </div>

        {/* Order List Section */}
        <div
          className="table-responsive p-4"
          style={{
            maxHeight: "calc(100% )",
            overflowY: "auto",
            borderRadius: "0 0 12px 12px",
            padding: "16px"
          }}
        >
          {status === "0" ? (
            <PendingOrders pendingOrders={deliveredOrders} deliveryExecutive={deliveryExecutive} />
          ) : status === "1" ? (
            <DeliveredOrders deliveredOrders={deliveredOrders} deliveryExecutive={deliveryExecutive} />
          ) : (
            <CanceledOrders canceledOrders={deliveredOrders} deliveryExecutive={deliveryExecutive} />
          )}
        </div>
      </div>
    </div>
  );
  
  
  

};



const DeliveredOrders = ({ deliveredOrders, deliveryExecutive }) => {
  const { handleCustomerID } = useInventoryContext();

  

  return (
    <div>
      

      <table className="table table-striped table-hover table-bordered align-middle">
        <thead className="bg-primary text-white">
          <tr>
            <th>Customer Name</th>
            <th>Customer Phone</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Delivery Executive</th>
            <th>Delivery Executive Phone</th>
            <th>Order Type</th>
            <th>Delivery Time</th>
            <th>Price</th>
            <th>Delivery Address</th>
          </tr>
        </thead>
        <tbody>
          {deliveredOrders.length > 0 ? (
            deliveredOrders.map((order, index) => (
              <tr key={index} onClick={() => handleCustomerID(order.customer_id)}>
                <td>{order.customer_name}</td>
                <td>{order.customer_phone}</td>
                <td>{order.product_name}</td>
                <td>{order.quantity}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.first_name + ` (${order.delivery_exe_id})`}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.phone_no}</td>
                <td>{order.order_type}</td>
                <td>{order.delivery_time}</td>
                <td>{order.price}</td>
                <td>{order.delivering_to}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center text-muted">No Delivered Orders Available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};




const PendingOrders = ({ pendingOrders, deliveryExecutive }) => {
  const { handleCustomerID } = useInventoryContext();

 

  return (
    <div>
      
      <table className="table table-striped table-hover table-bordered align-middle">
        <thead className="bg-warning text-dark">
          <tr>
            <th>Customer Name</th>
            <th>Customer Phone</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Delivery Executive</th>
            <th>Delivery Executive Phone</th>
            <th>Order Type</th>
            <th>Price</th>
            <th>Delivery Address</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.length > 0 ? (
            pendingOrders.map((order, index) => (
              <tr key={index} className="cursor-pointer" onClick={() => handleCustomerID(order.customer_id)}>
                <td title={order.customer_name}>
                  {order.customer_name.split(" ").length > 3
                    ? order.customer_name.split(" ").slice(0, 3).join(" ") + "..."
                    : order.customer_name}
                </td>
                <td>{order.customer_phone}</td>
                <td>{order.product_name}</td>
                <td>{order.quantity}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.first_name + ` (${order.delivery_exe_id})`}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.phone_no}</td>
                <td>{order.order_type}</td>
                <td>{order.price}</td>
                <td>{order.delivering_to}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center text-muted">No Pending Orders Available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};




const CanceledOrders = ({ canceledOrders, deliveryExecutive }) => {
  
  const { handleCustomerID } = useInventoryContext();
  

  return (
    <div>
      
      <table className="table table-striped table-hover table-bordered align-middle">
        <thead className="bg-danger text-white">
          <tr>
            <th>Customer Name</th>
            <th>Customer Phone</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Order Type</th>
            <th>Cancelation Reason</th>
            <th>Cancelation Time</th>
            <th>Delivery Executive</th>
            <th>Delivery Executive Phone</th>
            <th>Price</th>
            <th>Delivery Address</th>
          </tr>
        </thead>
        <tbody>
          {canceledOrders.length > 0 ? (
            canceledOrders.map((order, index) => (
              <tr key={index} className="cursor-pointer" onClick={() => handleCustomerID(order.customer_id)}>
                <td title={order.customer_name}>
                  {order.customer_name.split(" ").length > 3
                    ? order.customer_name.split(" ").slice(0, 3).join(" ") + "..."
                    : order.customer_name}
                </td>
                <td>{order.customer_phone}</td>
                <td>{order.product_name}</td>
                <td>{order.quantity}</td>
                <td>{order.order_type}</td>
                <td>{order.cancelled_reason || "N/A"}</td>
                <td>{order.cancelled_time}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.first_name + ` (${order.delivery_exe_id})`}</td>
                <td>{deliveryExecutive[order.delivery_exe_id]?.phone_no}</td>
                <td>{order.price}</td>
                <td>{order.delivering_to}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="text-center text-muted">
                No Canceled Orders Available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};







