import { useEffect, useState } from "react";
import Markating_Main from "../Main";
import { fetchCustomerOrderHistory } from "../query";
import { DateTimeUtil } from "../../../Utility";
import ExportToCSV from "../../../components/Export/ExportToCSV";
import { useNavigate } from "react-router-dom";

const RecurringCustomers = () => {
  return <Markating_Main value="RecurringCustomer" />;
};

export default RecurringCustomers;

export const RecurringCustomersUI = () => {
  const [type, setType] = useState("Days");
  const [filters, setFilters] = useState({
    range: 7,
    interval: 7,
    statistic: "Avg",
    type: "Days",
    threshold: 1,
  });
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [matchList, setMatchList] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [formateData, setFormateData] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [tableData, setTableData] = useState([]);

  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchCustomerOrderHistory(startDate, endDate);
        const sortedOrders = data.sort((a, b) =>
          a.customer_id.localeCompare(b.customer_id)
        );

        let details = [];
        let currentCustomer = null;

        sortedOrders.forEach((order) => {
          if (
            !currentCustomer ||
            currentCustomer.customer_id !== order.customer_id
          ) {
            currentCustomer = {
              customer_id: order.customer_id,
              customer_name: order.customer_name,
              customer_phone: order.customer_phone,
              orders: [order],
            };
            details.push(currentCustomer);
          } else {
            currentCustomer.orders.push(order);
          }
        });

        setOrderDetails(details);
        setCustomerCount(details.length);
        setOrderCount(sortedOrders.length);
      } catch (error) {
        console.error("Error fetching order history:", error);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    const handleIntervalChange = (interval) => {
      const formattedData = orderDetails
        .sort((a, b) => {
          return a.delivery_date > b.delivery_date;
        })
        .map((val) => {
          const { customer_id, customer_name, customer_phone, orders } = val;
          const details = [];
          let tempData = { quantity: 0, order: 0, days: 0 };
          let prevDate = "";
          let currentIntervalEnd = new Date();
          currentIntervalEnd.setDate(currentIntervalEnd.getDate() - interval);
          let date = DateTimeUtil.timestampToISOHyphenDate(currentIntervalEnd);
          orders.forEach((order) => {
            if (order.delivery_date >= date) {
              tempData.quantity += order.quantity;
              tempData.order += 1;

              if (prevDate !== order.delivery_date) {
                tempData.days += 1;
                prevDate = order.delivery_date;
              }
            } else {
              details.push({ ...tempData });
              tempData = { quantity: order.quantity, order: 1, days: 1 };
              prevDate = order.delivery_date;
              currentIntervalEnd.setDate(
                currentIntervalEnd.getDate() - interval
              );
              date = DateTimeUtil.timestampToISOHyphenDate(currentIntervalEnd);
            }
          });

          if (tempData.quantity > 0) {
            details.push({ ...tempData });
          }

          return {
            customer_id,
            customer_name,
            customer_phone,
            orders: details,
          };
        });

      setFormateData(formattedData);
    };

    handleIntervalChange(filters.interval);
  }, [filters.interval, orderDetails]);

  useEffect(() => {
    const handleTypeMatch = () => {
      if (formateData) {
        let data = [];
        let totalMatchCount = 0;

        formateData.forEach((item) => {
          let totalmatch = 0;
          let { customer_id, customer_name, customer_phone } = item;
          let temp = { customer_id, customer_name, customer_phone };

          item.orders.forEach((order) => {
            if (type === "Orders" && order.order >= filters.threshold) {
              totalmatch += 1;
            } else if (type === "Days" && order.days >= filters.threshold) {
              totalmatch += 1;
            }
          });

          temp = { ...temp, match: totalmatch, orders: item.orders };
          if (totalmatch === item.orders.length) {
            totalMatchCount += 1;
            data.push(temp);
          }
        });
        setMatchCount(totalMatchCount);
        setMatchList(data);
      }
    };

    handleTypeMatch();
  }, [formateData, filters, type]);

  useEffect(() => {
    const formatToTableData = (details) => {
      return details.map((item) => [
        item.customer_id,
        item.customer_name,
        item.customer_phone,
        item.orders.length,
      ]);
    };

    if (orderDetails.length > 0) {
      const data = formatToTableData(orderDetails);
      setTableData(data);
    }
  }, [orderDetails]);

  const handleRangeChange = (e) => {
    const range = parseInt(e.target.value, 10);
    setFilters((prev) => ({ ...prev, range }));
    const today = new Date();
    today.setDate(today.getDate() - range);
    setStartDate(today);
  };

  const tableHeader = ["Customer ID", "Customer Name", "Customer Phone"];
  const rangeOptions = [
    { label: "1 week", value: 7 },
    { label: "2 weeks", value: 14 },
    { label: "1 month", value: 30 },
    // { label: "2 months", value: 60 },
    // { label: "3 months", value: 90 },
    // { label: "6 months", value: 180 },
    // { label: "1 year", value: 365 },
  ];
  const intervalOptions = [
    { label: "Monthly", value: 30 },
    { label: "Weekly", value: 7 },
  ];
  const typeOptions = [
    { label: "No of Orders", value: "Orders" },
    { label: "No of Days", value: "Days" },
  ];

  return (
    <>
      <div className="home-tab d-flex justify-content-between align-items-center my-2">
        <h3 className="fw-bold text-primary border-bottom pb-2 mb-0">
          Recurring Customers
        </h3>
        <ExportToCSV
          csvColumns={tableHeader}
          csvData={matchList.map((data) => [
            data.customer_id,
            data.customer_name,
            data.customer_phone,
          ])}
          CSV_FileName="Recuring Customer"
        />
      </div>

      <div className="col-lg-12 grid-margin stretch-card ">
        <div className="card shadow-lg rounded-3">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="p-4 border rounded-3 bg-light shadow-sm">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Range</label>
                        <select
                          className="form-select rounded-3"
                          value={filters.range}
                          onChange={handleRangeChange}
                        >
                          {rangeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Interval</label>
                        <select
                          className="form-select rounded-3"
                          value={filters.interval}
                          onChange={(e) =>
                            setFilters({ ...filters, interval: e.target.value })
                          }
                        >
                          {intervalOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Threshold</label>
                        <div className="input-group">
                          <input
                            type="number"
                            min={1}
                            className="form-control rounded-3"
                            value={filters.threshold}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                threshold: e.target.value,
                              })
                            }
                          />
                          <span className="input-group-text">{type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="row g-3">
                  <div className="col-6 col-md-12 col-lg-6">
                    <div className="card text-center p-3 border-0 rounded-3 shadow-sm bg-light">
                      <h6 className="text-muted mb-1">Match Customers</h6>
                      <p className="display-6 text-primary mb-0">
                        {matchCount}
                      </p>
                    </div>
                  </div>
                  <div className="col-6 col-md-12 col-lg-6">
                    <div className="card text-center p-3 border-0 rounded-3 shadow-sm bg-light">
                      <h6 className="text-muted mb-1">No of Orders</h6>
                      <p className="display-6 text-primary mb-0">
                        {orderCount}
                      </p>
                    </div>
                  </div>
                  <div className="col-6 col-md-12 col-lg-6">
                    <div className="card text-center p-3 border-0 rounded-3 shadow-sm bg-light">
                      <h6 className="text-muted mb-1">No of Days</h6>
                      <p className="display-6 text-primary mb-0">
                        {filters.range}
                      </p>
                    </div>
                  </div>
                  <div className="col-6 col-md-12 col-lg-6">
                    <div className="card text-center p-3 border-0 rounded-3 shadow-sm bg-light">
                      <h6 className="text-muted mb-1">Total Customers</h6>
                      <p className="display-6 text-primary mb-0">
                        {customerCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-12 grid-margin stretch-card ">
        <div className="card shadow-lg rounded-3">
          <div className="card-body">
            <h3 className="text-start">Match Customers</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th className="text-center">Customer ID</th>
                    <th className="text-center">Customer Name</th>
                    <th className="text-center">Customer Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {matchList && matchList.length > 0 ? (
                    matchList.map((row, index) => (
                      <tr
                        key={index}
                        className="hover-highlight"
                        style={{cursor: "pointer"}}
                        onClick={() => handleRowClick(row.customer_id)}
                      >
                        <td className="text-center">{row.customer_id}</td>
                        <td className="text-center">{row.customer_name}</td>
                        <td className="text-center">{row.customer_phone}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center">
                        No data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
