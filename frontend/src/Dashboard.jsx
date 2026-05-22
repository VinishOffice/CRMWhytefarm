import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import apiClient from "./services/apiClient";
import Sidebar from "./Sidebar";
import TopPanel from "./TopPanel";
import Footer from "./Footer";
import { extendMoment } from 'moment-range';
import Moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { DateRangePicker } from 'react-date-range';
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from './Utility';
const Dashboard = () => {
  const { permissible_roles } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const moment = extendMoment(Moment);
  const [selectedRange, setSelectedRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [todayCustomers, setTodayCustomers] = useState(0);
  const [weekCustomers, setWeekCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [averageOrdersPerExecutive, setAverageOrdersPerExecutive] = useState(0);
  const [oneTimeOrderCount, setOneTimeOrderCount] = useState(0);
  const [android, setAndroid] = useState(0);
  const [ios, setIos] = useState(0);
  const [website, setWebsite] = useState(0);
  const [backend, setBackend] = useState(0);
  const [productNames, setProductNames] = useState([]);
  const [productQuantities, setProductQuantities] = useState([]);
  const dateRangeOptions = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last7days" },
    { label: "Custom", value: "custom" },
  ];

  const [customerCollectionSize, setCustomerCollectionSize] = useState(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      setLoading(true);
      const loggedIn = localStorage.getItem("loggedIn") === "true";
      if (!loggedIn) {
        navigate("/login");
      } else {
        if (permissible_roles.length > 0) {
          if (!permissible_roles.includes("dashboard")) {
            handleLogout();
            navigate("/permission_denied");
          }
        }
      }
      setLoading(false);
    };
    checkLoginStatus();
  }, [navigate, permissible_roles]);

  useEffect(() => {
    const initializeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.getContext("2d");
      } else {
        console.error("Canvas element not found");
      }
    };
    initializeCanvas();
  }, []);

  const openOneTimeOrders = () => {
    const url = "/onetimeorders";
    navigate("onetimeorders");
  };

  const openOrdersReport = () => {
    const url = "/orderreport";
    navigate("/orderreport");
  };

  const handleSelect = (ranges) => {
    setSelectedRange([ranges.selection]);
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  const handleSearchRange = () => {
    setStartDate(selectedRange[0].startDate);
    setEndDate(selectedRange[0].endDate);
    fetchDataBasedOnDateRange(
      selectedRange[0].startDate,
      selectedRange[0].endDate
    );
    togglePicker();
  };

  const fetchCollectionSize = async () => {
    try {
      const response = await apiClient.post("/api/customers_data/query", {
        filters: [],
        limit: 0 // If the backend supports returning total without data
      }).then(res => res.data || {});
      
      const totalCount = response.pagination?.total || (response.data?.length || 0);
      setCustomerCollectionSize(totalCount);
    } catch (error) {
      console.error("Error fetching collection size:", error);
    }
  };

  const fetchPlatformCount = async (platforms, setter) => {
    try {
      const response = await apiClient.post("/api/customers_data/query", {
        filters: [
          { field: "platform", op: "in", value: platforms }
        ]
      }).then(res => res.data || {});
      
      const count1 = response.pagination?.total || (response.data?.length || 0);

      const response2 = await apiClient.post("/api/customers_data/query", {
        filters: [
          { field: "plateform", op: "in", value: platforms }
        ]
      }).then(res => res.data || {});
      
      const count2 = response2.pagination?.total || (response2.data?.length || 0);

      setter(count1 + count2);
    } catch (error) {
      console.error("Error fetching platform count:", error);
    }
  };

  const fetchDailyCustomerCount = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const response = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "registered_date", op: ">=", value: today }]
      }).then(res => res.data || {});
      
      setTodayCustomers(response.pagination?.total || (response.data?.length || 0));
    } catch (error) {
      console.error("Error fetching daily customer count:", error);
    }
  };

  const [newUserCount, setNewUserCount] = useState(0);

  useEffect(() => {
    const fetchNewUserCount = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        const response = await apiClient.post("/api/customers_data/query", {
          filters: [{ field: "registered_date", op: ">=", value: today }]
        }).then(res => res.data || {});
        
        setNewUserCount(response.pagination?.total || (response.data?.length || 0));
      } catch (error) {
        console.error("Error fetching new user count:", error);
      }
    };

    fetchNewUserCount();
    const intervalId = setInterval(fetchNewUserCount, 86400000); // 86400000ms = 24 hours

    return () => clearInterval(intervalId);
  }, []);

  const fetchWeeklyCustomerCount = async () => {
    const today = new Date();
    const lastweek = new Date(today);
    lastweek.setDate(lastweek.getDate() - 7);

    try {
      const response = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "registered_date", op: ">=", value: lastweek }]
      }).then(res => res.data || {});
      
      setWeekCustomers(response.pagination?.total || (response.data?.length || 0));
    } catch (error) {
      console.error("Error fetching weekly customer count:", error);
    }
  };

  //fetch only one  orders count (including cancelled orders also)
  const fetchOnetimeOrdersCount = async () => {
    const formattedStartDate = moment(startDate).format("YYYY-MM-DD");

    try {
      const response = await apiClient.post("/api/order_history/query", {
        filters: [
          { field: "order_type", op: "==", value: "OT" },
          { field: "delivery_date", op: "==", value: formattedStartDate },
          { field: "status", op: "!=", value: "2" }
        ]
      }).then(res => res.data || {});
      
      setOneTimeOrderCount(response.pagination?.total || (response.data?.length || 0));
    } catch (error) {
      console.error("Error fetching one-time orders count:", error);
    }
  };
  const formatDateC = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchDataForChart = async () => {

    const tempProductQuantities = {};
    const tempProductNames = new Set();

    const startDate = new Date();
    startDate.setDate(1); // Set to the first day of the month
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Set to the last day of the month

    const formattedStartDate = moment(startDate).format("YYYY-MM-DD");
    const formattedEndDate = moment(endDate).format("YYYY-MM-DD");


    try {
      const response = await apiClient.post("/api/order_history/query", {
        filters: [
          { field: "delivery_date", op: ">=", value: formattedStartDate },
          { field: "delivery_date", op: "<=", value: formattedEndDate }
        ]
      }).then(res => res.data?.data || []);

      response.forEach((data) => {
        const productName = data.product_name.trim();
        const quantity = data.quantity;
        const deliveryDate = new Date(data.delivery_date);
        const formattedDate = formatDateC(deliveryDate);

        tempProductNames.add(productName);

        if (!tempProductQuantities[formattedDate]) {
          tempProductQuantities[formattedDate] = {};
        }

        if (!tempProductQuantities[formattedDate][productName]) {
          tempProductQuantities[formattedDate][productName] = 0;
        }

        tempProductQuantities[formattedDate][productName] += quantity;
      });

      // Ensure all dates have all product names initialized to 0
      Object.keys(tempProductQuantities).forEach(date => {
        tempProductNames.forEach(name => {
          if (tempProductQuantities[date][name] === undefined) {
             tempProductQuantities[date][name] = 0;
          }
        });
      });

      const sortedDates = Object.keys(tempProductQuantities).sort();
      const sortedQuantities = sortedDates.map((date) => {
        return Array.from(tempProductNames).map((productName) => {
          return tempProductQuantities[date][productName] || 0;
        });
      });

      setProductNames(Array.from(tempProductNames));
      setProductQuantities(sortedQuantities);
      window.orderData(Array.from(tempProductNames), sortedQuantities);
    } catch (error) {
      console.error("Error fetching chart data: ", error);
    }

    setLoading(false);
  };
  const fetchDataBasedOnDateRange = async (startDate, endDate) => {
    setLoading(true);
    await Promise.all([
      fetchCollectionSize(),
      fetchPlatformCount(["android"], setAndroid),
      fetchPlatformCount(["ios", "iOS"], setIos),
      fetchPlatformCount(["website", "Website"], setWebsite),
      fetchPlatformCount(["backend"], setBackend),
      fetchDailyCustomerCount(),
      fetchWeeklyCustomerCount(),
      fetchOnetimeOrdersCount(),
    ]);
    await calculateDashboardData(startDate, endDate);
    setLoading(false);
  };

  useEffect(() => {
    fetchDataBasedOnDateRange(new Date(), new Date());
  }, []);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  //fetch dashboard data (not including cancelled orders)
  const calculateDashboardData = async (startDate, endDate) => {
    let totalRevenue = 0;
    const uniqueOrderIds = new Set();
    const executives = new Set();

    try {
      const docs = await apiClient.post("/api/order_history/query", {
        filters: [
          { field: "delivery_date", op: ">=", value: moment(startDate).format("YYYY-MM-DD") },
          { field: "delivery_date", op: "<=", value: moment(endDate).format("YYYY-MM-DD") },
          { field: "status", op: "!=", value: "2" }
        ]
      }).then(res => res.data?.data || []);

      docs.forEach((data) => {
        totalRevenue += data.total_amount;
        uniqueOrderIds.add(data.order_id);
        executives.add(data.delivery_exe_id);
      });

      setTotalRevenue(totalRevenue);
      setTotalOrders(uniqueOrderIds.size);
      const averageValue = uniqueOrderIds.size > 0 ? totalRevenue / uniqueOrderIds.size : 0;
      setAverageOrderValue(averageValue);
      const numExecutives = executives.size;
      if (uniqueOrderIds.size > 0 && numExecutives > 0) {
        const averageExecutives = uniqueOrderIds.size / numExecutives;
        setAverageOrdersPerExecutive(averageExecutives.toFixed(1));
      } else {
        setAverageOrdersPerExecutive(0);
      }
    } catch (error) {
      console.error("Error calculating dashboard data:", error);
    }
  };

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div>
            <img
              style={{ height: "6rem" }}
              src="images/loader.gif"
              alt="Loading..."
            />
          </div>
        </div>
      )}
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row align-items-center">
                <div className="col">
                  <div>
                    <div
                      id="reportrange"
                      style={{
                        background: "#fff",
                        cursor: "pointer",
                        padding: "5px 10px",
                        border: "1px solid #ccc",
                        width: "50%",
                      }}
                      onClick={togglePicker}
                    >
                      <i className="fa fa-calendar" />
                      &nbsp;
                      <span>{`${selectedRange[0].startDate.toDateString()} - ${selectedRange[0].endDate.toDateString()}`}</span>{" "}
                      <i className="fa fa-caret-down" />
                    </div>
                    {showPicker && (
                      <div
                        style={{
                          background: "rgb(221 213 255)",
                          padding: "15px",
                          width: "37rem",
                          position: "absolute",
                          zIndex: 2,
                        }}
                      >
                        <DateRangePicker
                          ranges={selectedRange}
                          onChange={handleSelect}
                          moveRangeOnFirstSelection={false}
                          showDateDisplay={false}
                          direction="vertical"
                        />
                        <div style={{ display: "flex", justifyContent: "end" }}>
                          <button
                            type="button"
                            className="btn btn-success btn-rounded btn-sm"
                            style={{
                              background: "rgb(222 57 41)",
                              marginTop: "15px",
                              marginRight: "10px",
                            }}
                            onClick={togglePicker}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-success btn-rounded btn-sm"
                            style={{ background: "#4a54ba", marginTop: "15px" }}
                            onClick={handleSearchRange}
                          >
                            Search
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-auto ms-auto">
                  <button
                    onClick={openOneTimeOrders}
                    className="btn btn-success mx-2"
                  >
                    One Time Order
                  </button>
                  <button
                    onClick={openOrdersReport}
                    className="btn btn-success mx-2"
                  >
                    Order Report
                  </button>
                </div>
              </div>

              <div>
                <div className="col-sm-12">
                  <div className="home-tab">
                    <div className="tab-content tab-content-basic">
                      <div
                        className="tab-pane fade show active"
                        id="overview"
                        role="tabpanel"
                        aria-labelledby="overview"
                      >
                        <div className="row">
                          <div className="col-sm-12">
                            <div className="statistics-details d-flex align-items-center justify-content-between">
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div>
                                      <p className="statistics-title">
                                        Total Customers
                                      </p>
                                      <h3 className="rate-percentage">
                                        {customerCollectionSize}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div className="d-none d-md-block">
                                      <p className="statistics-title">
                                        Total Revenue
                                      </p>
                                      <h3 className="rate-percentage">
                                        ₹ {totalRevenue}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div className="d-none d-md-block">
                                      <p className="statistics-title">
                                        Total Orders
                                      </p>
                                      <h3 className="rate-percentage">
                                        {totalOrders}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div>
                                      <p className="statistics-title">
                                        One-Time Delivery
                                      </p>
                                      <h3 className="rate-percentage">
                                        {oneTimeOrderCount}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div className="d-none d-md-block">
                                      <p className="statistics-title">
                                        Avg. Order Value
                                      </p>
                                      <h3 className="rate-percentage">
                                        ₹{" "}
                                        {averageOrderValue
                                          ? averageOrderValue.toFixed(2)
                                          : "0"}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card d-flex align-items-start">
                                <div className="card-body">
                                  <div className="d-flex flex-row align-items-start">
                                    <div>
                                      <p className="statistics-title">
                                        Avg. Orders per DE
                                      </p>
                                      <h3 className="rate-percentage">
                                        {averageOrdersPerExecutive}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-sm-12">
                            <div className="statistics-details d-flex align-items-center justify-content-between">
                              <div>
                                <p className="statistics-title">
                                  Customers From Android
                                </p>
                                <h3 className="rate-percentage">{android}</h3>
                              </div>
                              <div>
                                <p className="statistics-title">
                                  Customers From IOS
                                </p>
                                <h3 className="rate-percentage">{ios}</h3>
                              </div>
                              <div>
                                <p className="statistics-title">
                                  From Webapps/Website
                                </p>
                                <h3 className="rate-percentage">{website}</h3>
                              </div>
                              <div className="d-none d-md-block">
                                <p className="statistics-title">Backend</p>
                                <h3 className="rate-percentage">{backend}</h3>
                              </div>
                              <div className="d-none d-md-block">
                                <p className="statistics-title">
                                  Current Week customer
                                </p>
                                <h3 className="rate-percentage">
                                  {weekCustomers}
                                </h3>
                              </div>
                              <div className="d-none d-md-block">
                                <p className="statistics-title">
                                  Today's Customer
                                </p>
                                <h3 className="rate-percentage">
                                  {newUserCount}
                                </h3>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-lg-12 d-flex flex-column">
                            <div className="row flex-grow">
                              <div
                                className="col-12 col-lg-8 col-lg-12 grid-margin stretch-card"
                                style={{
                                  height: "100%",
                                  paddingBottom: "2rem",
                                }}
                              >
                                <div className="card card-rounded">
                                  <div className="card-body">
                                    <div className="d-sm-flex justify-content-between align-items-start">
                                      <div>
                                        <h4 className="card-title card-title-dash">
                                          Monthly ORDER REPORT
                                        </h4>
                                        <button
                                          onClick={fetchDataForChart}
                                          className="btn btn-success mx-2"
                                        >
                                          View Graph Data
                                        </button>
                                      </div>
                                    </div>
                                    <div
                                      className="d-sm-flex align-items-center mt-1 justify-content-between"
                                      style={{ height: "22rem" }}
                                    >
                                      <canvas
                                        id="monthlyOrderChart"
                                        ref={canvasRef}
                                      ></canvas>
                                    </div>
                                    <div className="chartjs-bar-wrapper mt-3">
                                      <div
                                        id="monthly-order-legend"
                                        className="legend-horizontal"
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div
                            className="col-lg-12 d-flex flex-column"
                            style={{ height: "100%", paddingBottom: "2rem" }}
                          >
                            <div className="row flex-grow">
                              <div className="col-12 grid-margin stretch-card">
                                <div className="card card-rounded">
                                  <div className="card-body">
                                    <div className="d-sm-flex justify-content-between align-items-start">
                                      <div></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="row flex-grow">
                              <div className="col-12 grid-margin stretch-card"></div>
                            </div>
                            <div className="row flex-grow"></div>
                          </div>
                          <div className="col-lg-4 d-flex flex-column">
                            <div className="row flex-grow"></div>
                            <div className="row flex-grow">
                              <div className="col-12 grid-margin stretch-card"></div>
                            </div>
                            <div className="row flex-grow"></div>
                            <div className="row flex-grow">
                              <div className="col-12 grid-margin stretch-card"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;

