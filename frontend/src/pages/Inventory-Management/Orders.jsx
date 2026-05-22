import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { extendMoment } from "moment-range";
import Moment from "moment";
import GlobalContext from "../../context/GlobalContext";
import { handleLogout } from "../../Utility";
import { useInventoryContext } from "./InventoryContext";
import { Button } from "react-bootstrap";
import useFetchUserRole from "./useFetchUserRole";
import apiClient from '../../services/apiClient';
import moment from "moment";


const Orders = () => {
  const db = {};
  const {
    user,
    setUser,
    bufferPercentage,
    setBufferPercentage,
    setLoading,
    stockData,
    hubs,
    B2BPridiction,
    cummulativeDeliveryList,
    setCummulativeDeliveryList,
    hubProducts,
    setHubWiesProduct,
  } = useInventoryContext();

  const [selectedHub, setSelectedHub] = useState("All Hub");
  const [isLocked, setIsLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState(null)

  const [FilteredHubDeliveryList, setFilteredHubDeliveryList] = useState([])
  const [deliveryList, setDeliveryList] = useState([]);
  const [cummulativeDeliveryList1, setCummulativeDeliveryList1] = useState(cummulativeDeliveryList || []);


  useEffect(() => {
    const fetchOrders = async () => {
      const todayDate = moment().format("YYYY-MM-DD");
      try {
        const res = await apiClient.get(`/api/orderLocks/${todayDate}`);
        const data = res.data?.data;
        if (data) {
          setDeliveryList(data.deliveryList || []);
          setCummulativeDeliveryList(data.deliveryList || []);
          setFilteredHubDeliveryList(data.deliveryList || []);
        }
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Polling as a fallback for onSnapshot
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const fetchLockStatus = async () => {
      const todayDate = moment().format("YYYY-MM-DD");
      try {
        const res = await apiClient.get(`/api/orderLocks/${todayDate}`);
        const data = res.data?.data;

        if (data) {
          setIsLocked(data.isLocked);
          setLockedAt(data.lockedAt);
          setBufferPercentage(data.bufferPercentage || 0);
          if (data.deliveryList) {
            setFilteredHubDeliveryList(data.deliveryList);
            setCummulativeDeliveryList1(data.deliveryList);
            setCummulativeDeliveryList(data.deliveryList);
          }
        }
      } catch (error) {
        console.error("Error fetching lock status:", error);
      }
    };

    fetchLockStatus();
  }, []);



  const handleLockOrders = async () => {
    const now = new Date();
    const timestamp = now.toISOString();
    const todayDate = moment(now).format("YYYY-MM-DD");

    try {
      const deliveryList = filteredHubDeliveryList.length > 0 ? filteredHubDeliveryList : null;

      const lockPayload = {
        isLocked: true,
        lockedAt: timestamp,
        bufferPercentage,
        created_at: timestamp,
        created_date: todayDate,
        ...(deliveryList && { deliveryList }),
      };

      await apiClient.put(`/api/orderLocks/${todayDate}`, lockPayload);
      setIsLocked(true);
      setLockedAt(timestamp);
    } catch (error) {
      console.error("Error locking orders:", error);
    }
  };


  const handleBufferChange = async (index, value) => {

    const updatedData = [...cummulativeDeliveryList1];

    // Safety check
    if (!updatedData[index]) {
      console.error("Item at index", index, "is undefined");
      return;
    }

    const item = updatedData[index];
    const buffer = Math.max(0, Math.round(value));

    const updatedItem = {
      ...item,
      buffer_added: buffer,
      final_order: (item.B2C_predicted_orders || 0) + (item.B2B_predicted_orders || 0) + buffer,
      stock_need_exceed:
        (item.B2C_predicted_orders || 0) +
        (item.B2B_predicted_orders || 0) +
        buffer -
        (item.stock || 0),
    };

    updatedData[index] = updatedItem;

    setCummulativeDeliveryList1(updatedData);
    setFilteredHubDeliveryList(updatedData)


    if (selectedHub !== "All Hub") {
      setFilteredHubDeliveryList(updatedData.filter((itm) => itm.hubName === selectedHub));
    }

    // Save if locked
    if (isLocked) {
      try {
        await apiClient.put(`/api/orderLocks/predictionLock`, {
          deliveryList: updatedData,
        });
      } catch (error) {
        console.error("Failed to update locked data:", error);
      }
    }
  };






  // Handle Hub Change
  const handleHubChange = (e) => {
    setSelectedHub(e.target.value);
  };

  const filteredHubDeliveryList =
    selectedHub === "All Hub"
      ? cummulativeDeliveryList1
      : hubProducts.filter((item) => item.hubName === selectedHub);
















  const handleBufferPercentageChange = (value) => {
    const newBufferPercentage = Math.max(0, Math.min(100, parseFloat(value)));
    setBufferPercentage(newBufferPercentage);

    if (selectedHub === "All Hub") {
      setCummulativeDeliveryList1((prevList) =>
        prevList.map((item) => {
          const bufferAdded = Math.round(
            (item.B2C_predicted_orders * newBufferPercentage) / 100
          );
          const finalOrder =
            item.B2C_predicted_orders + item.B2B_predicted_orders + bufferAdded;
          return {
            ...item,
            buffer_added: bufferAdded,
            final_order: finalOrder,
            stock_need_exceed: item.stock - finalOrder,
          };
        })
      );
    }
  };

  const handleDefaultStockChange = () => {
    const stockDataMap = stockData.reduce((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.goodStock;
      return acc;
    }, {});

    setCummulativeDeliveryList1((prevList) => {
      const updatedList = prevList.map((item) => {
        const stock = stockDataMap[item?.product_name] || 0;
        const stockNeedExceed = stock - item?.final_order;
        return {
          ...item,
          stock,
          stock_need_exceed: stockNeedExceed,
        };
      });
      return updatedList;
    });

    setHubWiesProduct((prevMap) => {
      const updatedArray = [];
      prevMap.forEach((order) => {
        const hubStockData = stockData
          .filter(({ hub }) => hub === order.hubName)
          .reduce((acc, item) => {
            acc[item.productName] =
              (acc[item.productName] || 0) + item.goodStock;
            return acc;
          }, {});

        const stock = hubStockData[order.product_name] || 0;
        const stockNeedExceed = stock - order.final_order;
        const updatedHubProducts = {
          ...order,
          stock,
          stock_need_exceed: stockNeedExceed,
        };
        updatedArray.push(updatedHubProducts);
      });
      return updatedArray;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      handleDefaultStockChange();
      handleBufferPercentageChange(bufferPercentage);
      if (user.role === "Hub Manager") {
        setSelectedHub(user.hub_name); // Automatically set the hub for Hub Manager
      }
    };

    fetchData();
  }, [bufferPercentage, user]);

  return (
    <>
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex flex-row justify-content-between align-items-start mt-1">

            <div className="d-flex flex-column gap-2">
              <h3 className="">Order Prediction</h3>
              <div className="d-flex align-items-center gap-3">
                <p className="text-black fs-4 mb-0">Date:</p>
                <p
                  style={{ width: "120px", fontSize: "16px", fontWeight: "bold", marginTop: "10px", padding: "8px", backgroundColor: "#F8F9FA", borderRadius: "0.375rem" }}
                >{moment().format('DD-MM-YYYY')}</p>
              </div>
            </div>



            {/* Hub Dropdown */}
            <div className="d-flex flex-column gap-2 align-items-end">
              <div className="mb-3">
                <MyComponent
                  filteredHubDeliveryList={filteredHubDeliveryList}
                  selectedHub={selectedHub}
                  handleBufferChange={handleBufferChange}
                />
              </div>

              {user.role === "Admin" ? (
                <div className="d-flex gap-2 mb-1  align-items-center">
                  <h4 className="mt-2">Hub:</h4>
                  <div className="d-flex flex-row align-items-center">
                    <select
                      className="form-select"
                      value={selectedHub}
                      onChange={handleHubChange} // Handles hub change for Admin
                    >
                      <option value="All Hub">All Hub</option>
                      {hubs.map((hub, index) => (
                        <option key={index} value={hub.hub_name}>
                          {hub.hub_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="d-flex  gap-2 mb-3  align-items-center">
                  <h4 className="">Hub:</h4>
                  <h4 className="bg-light text-primary">{user.hub_name}</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-2 mb-2">
        <div className="container my-4">
          <div className="d-flex flex-row justify-content-between align-items-center mb-4">
            <h4 className="text-primary mb-0">Cumulative Hub Delivery List</h4>
            {selectedHub === "All Hub" && user.role === "Admin" && (
              <div className="d-flex  flex-row align-items-center ms-3 gap-2">

                {!isLocked ? (
                  <button
                    className="btn btn-danger ms-4"
                    onClick={handleLockOrders}
                  >
                    Confirm
                  </button>
                ) : (
                  <p className="text-muted mt-2 pe-3">Locked at: {moment(new Date(lockedAt)).format("DD-MM-YYYY hh:mm:ss")}</p>
                )}

                <input
                  type="number"
                  className="form-control"
                  value={bufferPercentage}
                  min="0"
                  max="100"
                  disabled={isLocked}
                  onChange={(e) => handleBufferPercentageChange(e.target.value)}
                  style={{
                    width: "80px",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    textAlign: "center",
                  }}
                />

                <span className="ms-2">%</span>

              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th className="text-center align-middle">Product</th>
                  <th className="text-center align-middle">
                    Predicted Orders (B2C)
                  </th>
                  <th className="text-center align-middle">
                    Predicted Orders (B2B)
                  </th>
                  {selectedHub === "All Hub" && (
                    <th className="text-center align-middle">Added Buffer</th>
                  )}
                  <th className="text-center align-middle">Final Order</th>
                  <th className="text-center align-middle">Stock</th>
                  <th className="text-center align-middle">
                    Stock Need/Exceed
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHubDeliveryList &&
                  filteredHubDeliveryList.length > 0 ? (
                  filteredHubDeliveryList
                    .sort((a, b) => b.final_order - a.final_order)
                    .map((item, index) => (
                      <tr key={index} className="text-center">
                        <td title={`Full details: ${item.product_name}`}>
                          {item.product_name}
                        </td>
                        <td>{item.B2C_predicted_orders}</td>
                        <td>{item.B2B_predicted_orders}</td>
                        {selectedHub === "All Hub" && (
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={item.buffer_added || ""}
                              onChange={(e) => handleBufferChange(index, parseInt(e.target.value) || 0)}
                              min={0}
                              style={{ minWidth: "30px", backgroundColor: "#f0f0f0" }}
                              // disabled={!isLocked}
                              disabled={isLocked}
                            />


                          </td>
                        )}
                        <td>{item.final_order}</td>
                        <td>{item.stock || 0}</td>
                        <td>{item.stock_need_exceed}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="alert alert-info">
        <strong>Note:</strong> The final order is calculated by adding the
        buffer to predicted orders, ensuring enough stock for each hub.
      </div>
    </>
  );
};

export default Orders;

// Function to convert data to CSV format
const convertToCSV = (data, selectedHub) => {
  const headers =
    selectedHub === "All Hub"
      ? [
        "Product Name",
        "Predicted Orders (B2C)",
        "Predicted Orders (B2B)",
        "Buffer Added",
        "Final Order",
        "Stock",
        "Stock Need Exceed",
      ]
      : [
        "Product Name",
        "Predicted Orders (B2C)",
        "Predicted Orders (B2B)",
        "Final Order",
        "Stock",
        "Stock Need Exceed",
      ];
  const rows =
    selectedHub === "All Hub"
      ? data.map((item) => [
        item.product_name,
        item.B2C_predicted_orders,
        item.B2B_predicted_orders,
        item.buffer_added,
        item.final_order,
        item.stock,
        item.stock_need_exceed,
      ])
      : data.map((item) => [
        item.product_name,
        item.B2C_predicted_orders,
        item.B2B_predicted_orders,
        item.final_order,
        item.stock,
        item.stock_need_exceed,
      ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
  return csvContent;
};
// Function to trigger file download
const exportToCSV = (filteredHubDeliveryList, selectedHub) => {
  // Temporarily display the table
  const table = document.getElementById("deliveryTable");
  table.style.display = "table"; // Show the table temporarily for CSV export

  // Convert the table data to CSV format
  const csvData = convertToCSV(filteredHubDeliveryList, selectedHub);
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  // Set the file name to include the selected hub
  link.href = url;
  link.download = `${selectedHub}_delivery_list.csv`;

  link.click();

  // Hide the table again after export
  table.style.display = "none"; // Hide the table again after CSV export
};

const MyComponent = ({
  filteredHubDeliveryList,
  selectedHub,
  handleBufferChange,
}) => {
  return (
    <div>
      <Button
        className="btn btn-success btn-rounded btn-sm "
        onClick={() => exportToCSV(filteredHubDeliveryList, selectedHub)}
      >
        Export to CSV
      </Button>

      {/* Table used for exporting to CSV */}
      <table id="deliveryTable" style={{ display: "none" }}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Predicted Orders (B2C)</th>
            <th>Predicted Orders (B2B)</th>
            <th>Buffer Added</th>
            <th>Final Order</th>
            <th>Stock</th>
            <th>Stock Need Exceed</th>
          </tr>
        </thead>
        <tbody>
          {filteredHubDeliveryList &&
            filteredHubDeliveryList.map((item, index) => (
              <tr key={index} className="text-center">
                <td title={`Full details: ${item.product_name}`}>
                  {item.product_name}
                </td>
                <td>{item.B2C_predicted_orders}</td>
                <td>{item.B2B_predicted_orders}</td>
                <td>{item.predicted_orders}</td>
                {selectedHub === "All Hub" && (
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={item.buffer_added}
                      onChange={(e) =>
                        handleBufferChange(index, parseInt(e.target.value))
                      }
                      min="0"
                      style={{ minWidth: "30px" }}
                    />
                  </td>
                )}
                <td>{item.final_order}</td>
                <td>{item.stock}</td>
                <td>{item.stock_need_exceed}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
