import React, { useState, useEffect, useContext, useCallback } from "react";
import TopPanel from "../../../TopPanel";
import Sidebar from "../../../Sidebar";
import Footer from "../../../Footer";
import {
  fetchOrderList,
  fetchOrderListForHub,
  fetchOrderListForProduct,
} from "./queries";
import { formateOrder } from "./functions";
import GlobalContext from "../../../context/GlobalContext";

import { handleLogout } from "../../../Utility";
import { useNavigate } from "react-router-dom";
import CustomDateRangePicker from "../../../components/CustomDateRangePicker";
import ExportSummary from "./ExportSummary";

function CafeSummary() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else if (
      permissible_roles.length > 0 &&
      !permissible_roles.includes("locations")
    ) {
      handleLogout();
      navigate("/permission_denied");
    }
  }, [navigate, permissible_roles]);


  useEffect(() => {
    return () => {
      // Cleanup function to reset state on unmount
      setOrderList([]);
      setLoading(false);
    };
  }, []);

  const userRole = localStorage.getItem("role");

  const handleDateChange = (startDate, endDate) => {
    setDateRange({ start: startDate, end: endDate });
    fetchDataBasedOnDateRange(formatDate(startDate), formatDate(endDate));
  };

  const fetchDataBasedOnDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    let data;
    try {
      switch (userRole) {
        case "Admin":
          data = await fetchOrderList(startDate, endDate);
          break;
        case "Hub Manager":
          const hubName = localStorage.getItem("hub_name");
          data = await fetchOrderListForHub(startDate, endDate, hubName);
          break;
        default:
          console.warn("Unauthenticated Access");
          return;
      }

      const order = formateOrder(data);
      setOrderList(order);
    } catch (error) {
      console.error("Error fetching order list:", error);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchDataBasedOnDateRange(today, today);
  }, [today, fetchDataBasedOnDateRange]);

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

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div>
            <img
              alt="loader"
              style={{ height: "6rem" }}
              src="images/loader.gif"
            />
          </div>
        </div>
      )}
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel container-scroller">
            <div className="content-wrapper">
              <div className="row mb-4">
                <ExportSummary orderList={orderList} dateRange={dateRange} />
                <div className="card mb-4">
                  <div className="card-body">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <h4 className="card-title">Cafe / E-commerce Summary</h4>
                      <CustomDateRangePicker onDateChange={handleDateChange} />
                    </div>
                  </div>
                </div>
                <div className="card mb-4" id="Summary_Table">
                  {orderList?.map((hub, index) => (
                    <div className="card-body" key={index}>
                      <div
                        className="border border-primary rounded p-3 mb-3"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div className="d-flex flex-row align-items-center">
                          <h4 className="card-title mb-0">Delivery Hub:</h4>
                          <h4 className="card-title ms-2 mb-0">
                            {hub.hubName}
                          </h4>
                        </div>
                      </div>

                      <div className="modal-body">
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th style={{ textAlign: "center" }}>SN</th>
                                <th style={{ textAlign: "center" }}>
                                  Product Name
                                </th>
                                <th style={{ textAlign: "center" }}>
                                  Delivered Quantity
                                </th>
                                <th style={{ textAlign: "center" }}>
                                  Pending Quantity
                                </th>
                                <th style={{ textAlign: "center" }}>
                                  Total Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {hub.aggregate?.map(
                                (
                                  { productName, delivered, pending },
                                  index
                                ) => (
                                  <CafeSummaryTableBodyRow
                                    key={index}
                                    productName={productName}
                                    delivered={delivered}
                                    pending={pending}
                                    index={index}
                                    dateRange={dateRange}
                                    hub={hub.hubName}
                                    hub_data={hub}
                                    orderList={orderList}
                                  />
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {orderList.length === 0 && (
                  <div className="card mb-4" id="Summary_Table">
                    <div className="card-body">
                      <h4>No data found.</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

export default CafeSummary;

const CafeSummaryTableBodyRow = ({
  productName,
  delivered,
  pending,
  index,
  dateRange,
  hub,
  hub_data,
  orderList,
}) => {
  const [expand, setExpand] = useState(false);
  const [cafeOrders, setCafeOrders] = useState([]);

  const formatDate = (date) => {
    if (!(date instanceof Date)) {
      console.error("Input must be a Date object", date); // Log the invalid input
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleClick = async () => {
    setExpand(!expand);
    const data = await fetchOrderListForProduct(
      formatDate(dateRange.start),
      formatDate(dateRange.end),
      hub,
      productName
    );
    setCafeOrders(data);
  };

  // Cleanup function to reset state on unmount
  useEffect(() => {
    return () => {
      setCafeOrders([]);
    };
  }, []);

  return (
    <>
      <tr
        key={index}
        className="hover-highlight"
        style={{
          cursor: "pointer",
          backgroundColor: "#fff",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f1f1f1")
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
        onClick={handleClick}
      >
        <td style={{ textAlign: "center" }}>{index + 1}</td>
        <td style={{ textAlign: "center" }}>{productName}</td>
        <td style={{ textAlign: "center" }}>
          <span
            className="badge bg-success text-white"
            style={{ fontSize: "small" }}
          >
            {Number(delivered || 0)}
          </span>
        </td>
        <td style={{ textAlign: "center" }}>
          <span
            className="badge bg-warning text-dark"
            style={{ fontSize: "small" }}
          >
            {Number(pending || 0)}
          </span>
        </td>
        <td style={{ textAlign: "center" }}>
          {Number(delivered || 0) + Number(pending || 0)}
        </td>
      </tr>
      {expand && (
        <tr>
          <td colSpan="5" className="m-0 p-2" style={{ textAlign: "center" }}>
            <OrderTable orders={cafeOrders} />
          </td>
        </tr>
      )}
    </>
  );
};

const OrderTable = ({ orders }) => {
  const [loading, setLoading] = useState(true);
  const [aggregatedOrdersArray, setAggregatedOrdersArray] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState("All");

  useEffect(() => {
    if (!orders || orders.length === 0 || !orders[0].data) {
      setLoading(true);
      setAggregatedOrdersArray([]);
    } else {
      setLoading(false);
      const aggregatedOrders = orders.reduce((acc, { id, data }) => {
        const cafe = data.delivering_to;
        const quantity = data.quantity;
        const status = data.status;

        if (!acc[cafe]) {
          acc[cafe] = {
            delivering_to: cafe,
            delivered: 0,
            pending: 0,
            created_by: data.created_by,
          };
        }

        if (status === 1) {
          acc[cafe].delivered += quantity;
        } else {
          acc[cafe].pending += quantity;
        }

        return acc;
      }, {});

      setAggregatedOrdersArray(Object.values(aggregatedOrders));
    }

    // Cleanup function to reset state on unmount
    return () => {
      setLoading(true);
      setAggregatedOrdersArray([]);
      setSelectedCafe("All");
    };
  }, [orders]);

  const handleCafeChange = (event) => {
    setSelectedCafe(event.target.value);
  };

  const filteredOrders =
    selectedCafe === "All"
      ? aggregatedOrdersArray
      : aggregatedOrdersArray.filter(
          (order) => order.delivering_to === selectedCafe
        );

  return (
    <div className="col-lg-12 container-fluid">
      {loading ? (
        <div className="loader-overlay">
          <div>
            <img
              alt="loader"
              style={{ height: "6rem" }}
              src="images/loader.gif"
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="d-flex flex-column align-items-start justify-content-start w-100">
              <div className="mb-3 d-flex align-items-center justify-content-between w-100">
                <h4 className="text-start mb-0 me-3">
                  Product Name: {orders[0].data.product_name}
                </h4>
                <div className="d-flex align-items-center">
                  <label className="form-label mb-0 me-2">Cafe</label>
                  <select
                    className="form-select w-auto"
                    onChange={handleCafeChange}
                  >
                    <option key={-1} value="All">
                      All
                    </option>
                    {aggregatedOrdersArray.map((order, index) => (
                      <option key={index} value={order.delivering_to}>
                        {order.delivering_to}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-100 mt-2 d-flex align-items-center justify-content-center">
                <table
                  className="table table-sm table-bordered"
                  style={{ backgroundColor: "#e9ecef", fontSize: "small" }}
                >
                  <thead style={{ backgroundColor: "#007bff", color: "white" }}>
                    <tr>
                      <th scope="col">Delivered To</th>
                      <th scope="col">Delivered Quantity</th>
                      <th scope="col">Pending Quantity</th>
                      <th scope="col">Total Quantity</th>
                      <th scope="col">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const totalQuantity = order.delivered + order.pending;
                      return (
                        <tr key={order.delivering_to}>
                          <td>{order.delivering_to}</td>
                          <td>
                            <span className="badge bg-success text-white">
                              {Number(order.delivered || 0)}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-warning text-dark">
                              {Number(order.pending || 0)}
                            </span>
                          </td>
                          <td>{Number(totalQuantity || 0)}</td>
                          <td>{order.created_by}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
