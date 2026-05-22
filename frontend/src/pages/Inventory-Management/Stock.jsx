import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import GlobalContext from "../../context/GlobalContext";

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

const Stock = () => {
  const { permissible_roles,  orders, setOrders } = useContext(GlobalContext);

  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };
  const updateStockAllHub = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "Please select Hub",
    });
  };

  const [hub, setHub] = useState("Select Hub");
  const [create, setCreate] = useState(false);
  const [role, setRole] = useState("Admin");
  const [toast, setToast] = useState(null);
  const {
    dispatches,
    stockHistory,
    stockData,
    setStockData,
    setStockHistory,
    setDispatches,
    products,
    user,
  } = useInventoryContext();

  const [stock, setStock] = useState([]);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    if (user.role === "Hub Manager") {
      setHub(user.hub_name); // Automatically set the hub for Hub Manager
    }
  }, []);
  const fetchData = async () => {
    try {
      const inventory = new FetchInventory();
      const stock = await inventory.fetchStock();
      const history = await inventory.fetchStockHistory();
      const dispatch = await inventory.fetchDispatch();
      setStockData(stock);
      setStockHistory(history);
      setDispatches(dispatch);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [create]);





  useEffect(() => {
    const updatedStock =
      hub === "All Hubs"
        ? stockData
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
            }, [])
        : stockData.filter((item) => item.hub === hub);

    setStock(updatedStock);
  }, [hub, stockData]);

  useEffect(() => {
    const updatedHistory =
      hub === "All Hubs"
        ? stockHistory
        : stockHistory.filter((item) => item.hub === hub);
    setHistory(updatedHistory);
  }, [hub, stockHistory]);

  const newDispatches = useMemo(
    () =>
      hub === "All Hubs"
        ? dispatches
        : dispatches.filter(
            (item) => item.hub === hub && item.status === "Dispatched"
          ),
    [dispatches, hub]
  );

  
  const handleEdit = async (index) => {
    const product = newDispatches[index];
    
    const matchingProduct = products.find(
      (item) => item.productName === product.productName
    );

    if (!matchingProduct) {
      console.error(
        `Product ID not found for ${product.productName}. Please ensure the product is in the inventory.`
      );
      Toast.fire({
        icon: "error",
        title: `Product ID not found for ${product.productName}.`,
      });
      return;
    }

    const productId = matchingProduct.productId;
    const data = await acceptDispatch(product, productId);
    if (data) {
      fetchData();
    }
  };

  const acceptDispatch = async (product, productId) => {

    const inventoryUpdater = new UpdateInventory();
    const inventoryAdd = new AddInventory();

    try {
      // Update the stock in the inventory
      const updatedStock = await inventoryUpdater.updateStock(
        hub,
        productId,
        product.productName,
        product.quantity,
        "Dispatch",
        localStorage.getItem("loggedIn_user"),
        localStorage.getItem("userId")
      );

      if (updatedStock) {
        // Mark the dispatch as delivered
        const deliveryStatus = await inventoryUpdater.acceptDispatch(
          product.dispatch_sub_id,
          localStorage.getItem("loggedIn_user"),
          localStorage.getItem("userId")
        );

        if (deliveryStatus) {
          // Add the delivery details to the stock history
          const historyUpdate = await inventoryAdd.addStockHistory({
            hub,
            productId,
            productName: product.productName,
            quantity: product.quantity,
            type: "Dispatch",
            user: localStorage.getItem("loggedIn_user"),
            user_id: localStorage.getItem("userId"),
            status: "Delivered",
            action: `Delivery of ${product.quantity} units of ${
              product.productName
            } accepted on ${DateTimeUtil.timestampToDate(
              new Date()
            )} at ${DateTimeUtil.timestampToTimeAMPM(new Date())}.`,
          });
          // Show success toast
          Toast.fire({
            icon: "success",
            title: `${product.quantity} units of ${product.productName} marked as delivered successfully.`,
          });
          if (historyUpdate) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error(
        `Failed to accept dispatch for ${product.productName}:`,
        error
      );

      // Show error toast
      Toast.fire({
        icon: "error",
        title: `Failed to process delivery of ${product.productName}. Please try again.`,
      });
      return false;
    }
  };

  const prepareCSVData = (stockData) => {
    // Define CSV headers
    const headers = [
      "Product Name",
      "Available Stock (units)",
      "Damaged Stock (units)",
      "Total Stock (units)",
    ];

    const rows = stockData.map((product) => ({
      "Product Name": product.productName,
      "Available Stock (units)": product.goodStock,
      "Damaged Stock (units)": product.damagedStock,
      "Total Stock (units)":
        Number(product.goodStock) + Number(product.damagedStock),
    }));

    const csvData = [...rows.map((row) => Object.values(row))];

    return csvData;
  };

  return (
    <>
      <div className="card p-1 mb-4">
        <div className="container my-2">
          <div className="d-flex flex-row justify-content-between align-items-start mt-1">
            <div>
              <h3 className="mt-2">Stock Management</h3>
            </div>

            {/* Hub Dropdown */}
            <div className="d-flex  align-items-end gap-3">
              <div className="mb-3">
                <ExportToCSV
                  csvColumns={[
                    "Product Name",
                    "Available Stock",
                    "Damaged Stock",
                    "Total Stock",
                  ]}
                  csvData={prepareCSVData(stock)}
                />
              </div>

              {user.role === "Admin" ? (
                <div className="d-flex flex-row justify-content-end align-items-center gap-2 mb-2">
                  <h4 className="mb-0">Hub:</h4>
                  <div className="d-flex flex-row align-items-center">
                    <HubDropdown selectedHub={hub} setSelectedHub={setHub} />
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-row justify-content-end align-items-center gap-2 mb-3">
                  <h4 className="">Hub:</h4>
                  <h4 className="bg-light text-primary">{hub}</h4>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Available Stock */}
      <div className="card p-3 mb-4">
        <div className="container my-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="text-primary mb-0">Current Available Stock</h4>
            {hub !== "All Hubs" ? (
              <>
                {permissible_roles.includes("update_hub_stock") ? (
                  <Button
                    className="btn btn-primary "
                    onClick={() => setCreate(true)}
                  >
                    {" "}
                    Update Stock Levels{" "}
                  </Button>
                ) : (
                  <Button
                    className="btn btn-primary "
                    onClick={() => rolePermission()}
                  >
                    {" "}
                    Update Stock Levels{" "}
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="btn btn-primary "
                onClick={() => updateStockAllHub()}
              >
                {" "}
                Update Stock Levels{" "}
              </Button>
            )}
          </div>

          {create && (
            <UpdateStock
              closeCreate={() => setCreate(false)}
              stockData={stockData}
              setStockData={setStockData}
              setStockHistory={setStockHistory}
              hub={hub}
              setToast={setToast}
            />
          )}

          <StockTable stockData={stock} />
        </div>
      </div>

      {/* New Dispatches Awaiting Processing */}
      {hub !== "All Hubs" && (
        <div className="card p-3 mb-4">
          {newDispatches?.length > 0 ? (
            <div className="container my-3">
              <h4 className="text-primary mb-3">
                New Dispatches Awaiting Processing
              </h4>
              <DispatchTable
                newDispatches={newDispatches}
                handleEdit={handleEdit}
              />
            </div>
          ) : (
            <div className="alert alert-info text-center">
              No new dispatches to process
            </div>
          )}
        </div>
      )}

      {/* Stock History Log */}

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

const DispatchTable = ({ newDispatches, handleEdit }) => {
  const { permissible_roles } = useContext(GlobalContext);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Function to show a toast message when the user doesn't have permission
  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };

  // Function to show confirmation before proceeding with delivery action
  const handleDeliveredClick = (index) => {
    setSelectedIndex(index); // Store the index of the dispatch item to be marked
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this dispatch as delivered?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, mark as delivered!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleEdit(index); // Proceed with the edit action if confirmed
      }
    });
  };

  return (
    <table className="table table-bordered table-striped">
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Date & Time</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {newDispatches.length ? (
          newDispatches.map((item, index) => (
            <tr key={index}>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>{item.status}</td>
              <td>
                {item.date
                  ? `${DateTimeUtil.timestampFromDBToISODate(
                      item.date
                    )} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.date)}`
                  : "N/A"}
              </td>
              <td>
                {permissible_roles.includes("accept_dispatch") ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDeliveredClick(index)} // Trigger confirmation on click
                  >
                    Delivered
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={rolePermission} // Show permission toast if not authorized
                  >
                    Delivered
                  </button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center text-muted">
              No new dispatches.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const HistoryTable = ({ stockHistory }) => (
  <table className="table table-bordered table-striped">
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Status</th>
        <th>Date & Time</th>
        <th>User</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {stockHistory.length ? (
        stockHistory.map((history, index) => (
          <tr key={index}>
            <td>{history.productName}</td>
            <td>{history.quantity}</td>
            <td
              className={`fw-bold ${
                history.status === "Updated" ? "text-primary" : "text-success"
              }`}
            >
              {history.status}
            </td>
            <td>
              {DateTimeUtil.timestampToDate(
                new Date(history?.date?.seconds * 1000)
              )}{" "}
              {DateTimeUtil.timestampToTimeAMPM(
                new Date(history?.date?.seconds * 1000)
              )}
            </td>
            <td>{history.user || "NA"}</td>
            <td>{history.action || "Accepted"}</td>
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

export default Stock;

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
          const updatedData = await inventoryUpdater.updateStock(
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
            const addedData = await inventoryAdd.addStockHistory({
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
        }}
      >
        <div
          className="modal-dialog modal-lg datastock"
          style={{ width: "70%" }}
        >
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

            <div
              className="modal-body"
              style={{ overflowY: "scroll", height: "400px" }}
            >
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
                        value={inStockQuantity}
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
    "Out for Dilivery",
    "Damaged",
    // "New",
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

const Orders = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleEdit = (index) => {
    // Handle the delivery logic (e.g., marking the order as delivered)
    setShowConfirmation(false); // Close the confirmation modal
  };

  const handleCancel = () => {
    setShowConfirmation(false); // Close the confirmation modal
  };

  const handleDeliveredClick = (index) => {
    setSelectedIndex(index);
    setShowConfirmation(true); // Show the confirmation modal when the button is clicked
  };

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Product</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample data, replace with actual data */}
            {[1, 2, 3].map((item, index) => (
              <tr key={index}>
                <td>Product {item}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDeliveredClick(index)} // Trigger confirmation
                  >
                    Delivered
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delivery</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCancel} // Close modal without any action
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to mark this order as delivered?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel} // Cancel action
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleEdit(selectedIndex)} // Proceed with the delivery action
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};