import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HubDropdown } from "./utility/productDropDown";
import { DateTimeUtil } from "../../Utility";
import { useInventoryContext } from "./InventoryContext";
import { Button, Dropdown, ToastContainer } from "react-bootstrap";
import Swal from "sweetalert2";
import FetchInventory, {
    AddInventory,
  UpdateInventory,
} from "./utility/queries";
import ExportToCSV from "../../components/Export/ExportToCSV";
import apiClient from "../../services/apiClient";
const Toast = Swal.mixin({
  toast: true,
  background: "#69aba6",
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});


const FarmStock = () => {

    const [create, setCreate] = useState(false);
    const [hub, setHub] = useState("Whyte Farms Gurgaon");
    const [loading, setLoading] = useState(false);
  
    const {
      farmstockData,
      setFarmStockData,
      farmstockHistory,
      setFarmStockHistory,
      role,
    } = useInventoryContext();
  
    // Memoize stock data
    const stock = useMemo(() => {
      if (hub === "All Hubs") {
        return farmstockData
          .sort((a, b) => a.productName.localeCompare(b.productName))
          .reduce((acc, item) => {
            const lastEntry = acc[acc.length - 1];
            if (lastEntry && lastEntry.productName === item.productName) {
              lastEntry.goodStock += item.goodStock || 0;
              lastEntry.damagedStock += item.damagedStock || 0;
            } else {
              acc.push({
                productName: item.productName,
                goodStock: item.goodStock || 0,
                damagedStock: item.damagedStock || 0,
              });
            }
            return acc;
          }, []);
      } else {
        return farmstockData.filter((item) => item.hub === hub);
      }
    }, [hub, farmstockData]);
  
    // Memoize history data
    const history = useMemo(() => {
      return hub === "All Hubs"
        ? farmstockHistory
        : farmstockHistory.filter((item) => item.hub === hub);
    }, [hub, farmstockHistory]);
  
    // Prepare CSV data for export
    const prepareCSVData = (data) => {
      return data.map((item) => ({
        "Product Name": item.productName,
        "Available Stock (units)": item.goodStock,
        "Damaged Stock (units)": item.damagedStock,
        "Total Stock (units)": item.goodStock + item.damagedStock,
      }));
    };
  
    // Fetch data from the database
    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        const farmstockDocs = await apiClient.post("/api/farm_stock_data/query", { filters: [] }).then(res => res.data?.data || []);
        setFarmStockData(
          farmstockDocs.map((doc) => ({ ...doc, id: doc._id }))
        );
  
        const farmStockHistoryDocs = await apiClient.post("/api/farm_stock_history/query", { filters: [] }).then(res => res.data?.data || []);
        const sortedHistory = farmStockHistoryDocs.sort((a,b) => new Date(b.date) - new Date(a.date));
        setFarmStockHistory(
          sortedHistory.map((doc) => ({ ...doc, id: doc._id }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire("Error", "Failed to fetch data. Please try again.", "error");
      } finally {
        setLoading(false); // Stop loading
      }
    };
  
    // Fetch data on mount or when `create` state changes
    useEffect(() => {
      fetchData();
    }, [create]);
  return (
    <>
      {/* Stock Management Header */}
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex flex-row justify-content-between align-items-start mt-1">
            <h3>Farm Stock Management</h3>

            {/* Export and Hub Selection */}
            <div className="d-flex flex-column justify-content-center align-items-end gap-2">
              <ExportToCSV
                csvColumns={[
                  "Product Name",
                  "Available Stock",
                  "Damaged Stock",
                  "Total Stock",
                ]}
                csvData={prepareCSVData(stock)}
              />
              <div className="d-flex flex-row justify-content-end align-items-center gap-2">
                <h3 className="mb-0">Farm:</h3>
                {role === "Admin" ? (
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="hub-dropdown">
                      {hub}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setHub("All Hubs")}>
                        All Hubs
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setHub("Farm 1")}>
                        Farm 1
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setHub("Whyte Farms Gurgaon")}>
                        Whyte Farms Gurgaon
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <h5 className="text-primary mb-0">{hub}</h5>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Stock Levels */}
      <div className="card p-3 mb-4">
        <div className="container my-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-primary mb-0">Current Farm Stock Levels</h4>
            {hub !== "All Hubs" && (
              <Button className="btn btn-primary" onClick={() => setCreate(true)}>
                Update Stock Levels
              </Button>
            )}
          </div>

          {create && (
            <UpdateStock
              closeCreate={() => setCreate(false)}
              stockData={farmstockData}
              setStockData={setFarmStockData}
              setStockHistory={setFarmStockHistory}
              hub={hub}
            />
          )}

          <StockTable stockData={stock} />
        </div>
      </div>

      {/* Stock History Log */}
      <div className="card p-3 mb-4">
        <div className="container my-4">
          <h4 className="text-primary mb-4">Farm Stock History Log</h4>
          <div style={{ overflowX: "auto" }}>
            <HistoryTable stockHistory={history} />
          </div>
        </div>
      </div>
    </>
  );
};



const StockTable = ({ stockData }) => (
  <table className="table table-bordered table-striped">
    <thead className="thead-dark">
      <tr>
        <th>Name</th>
        <th>Available Stock</th>
        <th>Damaged Stock</th>
        <th>Total Stock</th>
      </tr>
    </thead>
    <tbody>
      {stockData.length ? (
        stockData.map((product) => (
          <tr key={product.productName}>
            <td>{product.productName}</td>
            <td>{product.goodStock} units</td>
            <td>{product.damagedStock} units</td>
            <td>
              {Number(product.goodStock) + Number(product.damagedStock)} units
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="4" className="text-center text-muted">
            No products found/ Stock is empty
          </td>
        </tr>
      )}
    </tbody>
  </table>
);


const HistoryTable = ({ stockHistory }) => (
  <table className="table table-bordered table-striped">
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Action</th>
        <th>Date & Time</th>
        <th>User</th>
      </tr>
    </thead>
    <tbody>
      {stockHistory.length ? (
        stockHistory.map((history, index) => (
          <tr key={index}>
            <td>{history.productName}</td>
            <td>{history.quantity}</td>
            <td>{history.type}</td>
            <td>
              {DateTimeUtil.timestampToDate(
                new Date(history?.date?.seconds * 1000)
              )}{" "}
              {DateTimeUtil.timestampToTimeAMPM(
                new Date(history?.date?.seconds * 1000)
              )}
            </td>
            <td>{history.user || "NA"}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="text-center text-muted">
            No History found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default FarmStock;

const UpdateStock = ({
  closeCreate,
  stockData,
  setStockData,
  setStockHistory,
  hub,
}) => {
  const [newUpdate, setNewUpdate] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("Select Product");
  const [productID, setProductID] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState("Select Type");
  const [inStockQuantity, setInStockQuantity] = useState(0);
  const [loading, setIsLoading] = useState(false);

  useEffect(() => {
    const quantity = stockData
      .filter(({ productName }) => productName === selectedProduct)
      .reduce((total, { goodStock }) => total + goodStock, 0);
    setInStockQuantity(quantity);
  }, [selectedProduct, stockData]);

  const formatDate = useCallback(
    (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
    []
  );

  const addProductToUpdate = useCallback(() => {
    if (selectedProduct === "Select Product" || type === "Select Type") {
      Toast.fire({
        icon: "error",
        title: "Please select a product and update type.",
      });
      return;
    }

    if (quantity <= 0) {
      Toast.fire({
        icon: "error",
        title: "Quantity should be greater than 0.",
      });
      return;
    }

    if (type === "Damaged" && quantity > inStockQuantity) {
      Toast.fire({
        icon: "error",
        title: "Quantity should not be greater than in stock quantity.",
      });
      return;
    }

    setNewUpdate((prev) => [
      ...prev,
      {
        productName: selectedProduct,
        productId: productID,
        quantity,
        date: formatDate(new Date()),
        status: `${type} Stock Updated`,
        user: localStorage.getItem("loggedIn_user"),
        customer_id: localStorage.getItem("userId"),
        role: localStorage.getItem("role"),
        action: "update",
        hub,
        type,
      },
    ]);

    // Reset form
    setSelectedProduct("Select Product");
    setQuantity(1);
    setType("Select Type");
  }, [selectedProduct, type, quantity, inStockQuantity, hub, formatDate]);

  const handleQuantityChange = (e) => {
    const value = Math.max(1, Number(e.target.value)); // Avoid negative values
    setQuantity(value);
  };

  const confirmUpdate = useCallback(async () => {
    const inventoryUpdater = new UpdateInventory();
    const inventoryAdd = new AddInventory();

    setIsLoading(true); // Set loading state to true to show a loading indication.

    try {
      for (let item of newUpdate) {
        try {
          // Updating stock
          const updatedData = await inventoryUpdater.updateFarmStock(
            hub,
            item.productId,
            item.productName,
            item.quantity,
            item.type,
            localStorage.getItem("loggedIn_user"),
            localStorage.getItem("userId")
          );


          if (updatedData) {
            // Adding to stock history
            const addedData = await inventoryAdd.addFarmStockHistory({
              hub,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              type: item.type,
              user: localStorage.getItem("loggedIn_user"),
              user_id: localStorage.getItem("userId"),
              status: "Updated",
              action: `Update ${item.quantity} ${item.type} of ${
                item.productName
              } at ${DateTimeUtil.timestampToDate(
                new Date()
              )} ${DateTimeUtil.timestampToTimeAMPM(new Date())}`,
            });


            // Show success toast for each item
            Toast.fire({
              icon: "success",
              title: `Stock for ${item.productName} updated successfully!`,
            });
          }
        } catch (error) {
          console.error(`Error updating stock for ${item.productName}:`, error);

          // Show error toast for failed update
          Toast.fire({
            icon: "error",
            title: `Failed to update stock for ${item.productName}.`,
          });
        }
      }

      // After all operations are complete
      setIsLoading(false); // Set loading state to false after processing is finished.
      closeCreate(); // Close the modal or pop-up
    } catch (error) {
      console.error("Error in confirming stock update:", error);

      // Handle any unexpected errors and show a general error toast
      Toast.fire({
        icon: "error",
        title: "An error occurred while updating the stock.",
      });

      setIsLoading(false); // Ensure loading state is reset on error.
    }
  }, [newUpdate, setStockData, setStockHistory, closeCreate, hub]);

  useEffect(() => {
  }, [productID]);

  return (
    <>
      <div
        className="modal fade show"
        tabIndex="-1"
        aria-hidden="true"
        style={{
          display: "block",
          background: "rgba(0, 0, 0, 0.5)",
          overflowY: "auto",
        }}
      >
        <div className="modal-dialog modal-lg" style={{ width: "60%" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Update Stock</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeCreate}
              ></button>
            </div>

            <div className="modal-body">
              {/* Form Section */}
              <div className="mb-4">
                <h6 className="text-primary mb-2">Update Stock Details</h6>
                <form className="px-4 py-2 bg-light rounded shadow-sm">
                  {/* Product Dropdown */}
                  <div className="row gy-2">
                    <div className="col-md-6 d-flex align-items-center justify-content-between">
                      <label
                        htmlFor="product"
                        className="form-label fw-semibold mb-0 me-2"
                      >
                        Select Product:
                      </label>
                      <div style={{ flex: 1 }}>
                        <ProductDropdown
                          selectedProduct={selectedProduct}
                          setSelectedProduct={setSelectedProduct}
                          stockData={stockData}
                          setProductID={setProductID}
                        />
                      </div>
                    </div>

                    {/* Update Type Dropdown */}
                    <div className="col-md-6 d-flex align-items-center justify-content-between">
                      <label
                        htmlFor="updateType"
                        className="form-label fw-semibold mb-0 me-2"
                      >
                        Update Type:
                      </label>
                      <div style={{ flex: 1 }}>
                        <UpdateReasonDropdown
                          selectedReson={type}
                          setSelectedReson={setType}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="row gy-2 mt-2">
                    <div className="col-md-6 d-flex align-items-center justify-content-between">
                      <label
                        htmlFor="quantity"
                        className="form-label fw-semibold mb-0 me-2"
                      >
                        Quantity:
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        className="form-control"
                        style={{ maxWidth: "150px" }}
                        value={quantity}
                        min="1"
                        onChange={handleQuantityChange}
                      />
                    </div>

                    {/* Available Stock Display */}
                    <div className="col-md-6 d-flex align-items-center justify-content-between">
                      <label
                        htmlFor="goodStock"
                        className="form-label fw-semibold mb-0 me-2"
                      >
                        Available Stock:
                      </label>
                      <input
                        id="goodStock"
                        type="text"
                        className="form-control bg-light text-muted"
                        style={{ maxWidth: "150px" }}
                        value={inStockQuantity || 0}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-2">
                    <button
                      type="button"
                      className="btn btn-primary px-5 py-2 fw-semibold"
                      onClick={addProductToUpdate}
                    >
                      Add to Update List
                    </button>
                  </div>
                </form>
              </div>

              <hr />

              {/* History Section */}
              <div>
                <h6 className="text-primary mb-3">Update History</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newUpdate.length > 0 ? (
                        newUpdate.map((item, index) => (
                          <tr key={index}>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">
                            No Data Present.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-success" onClick={confirmUpdate}>
                Confirm Update
              </button>
              <button className="btn btn-secondary" onClick={closeCreate}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

const ProductDropdown = ({
  selectedProduct,
  setSelectedProduct,
  stockData,
  setProductID,
}) => {
  const { products } = useInventoryContext();
  const [defaultProduct, setDefaultProduct] = useState("Select Product");
  useEffect(() => {
    setSelectedProduct(defaultProduct);
    return () => {
      setSelectedProduct(defaultProduct);
    };
  }, [setSelectedProduct, defaultProduct]);

  return (
    <div className="d-flex justify-content-end align-items-center">
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="product-dropdown">
          {selectedProduct || "Select Product"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Default Option */}
          <Dropdown.Item onClick={() => setSelectedProduct(defaultProduct)}>
            {defaultProduct}
          </Dropdown.Item>
          {/* Dynamically Rendered Product Options */}
          {products.map(({ productName, productId }, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => {
                setSelectedProduct(productName);
                setProductID(productId);
              }}
            >
              {productName}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

const UpdateReasonDropdown = ({
  selectedReson,
  setSelectedReson,
  stockData,
}) => {
  const [type, setType] = useState([
    "Damaged",
    "New",
    "Return",
  ]);
  const [defaultType, setDefaultType] = useState("Select Type");
  useEffect(() => {
    setSelectedReson(defaultType);
    return () => {
      setSelectedReson(defaultType);
    };
  }, [setSelectedReson, defaultType]);

  return (
    <div className="d-flex justify-content-end align-items-center">
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="product-dropdown">
          {selectedReson || "Select Product"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Default Option */}
          <Dropdown.Item onClick={() => setSelectedReson(defaultType)}>
            {defaultType}
          </Dropdown.Item>
          {/* Dynamically Rendered Product Options */}
          {type.map((productName, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => setSelectedReson(productName)}
            >
              {productName}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};
