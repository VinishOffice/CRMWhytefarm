import React, { useContext, useEffect, useMemo, useState } from "react";
import { HubDropdown, ProductDropdown } from "./../utility/productDropDown";
import { DateTimeUtil } from "./../../../Utility";
import { DateInputEnd } from "./../Delivery";
import { FaEdit, FaInfoCircle, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { useInventoryContext } from "./../InventoryContext";
import FetchInventory, {
  AddInventory,
  UpdateInventory,
} from "./../utility/queries";
import GlobalContext from "./../../../context/GlobalContext";
import Swal from "sweetalert2";


import moment from "moment";
import { fromDate, now, fromSecondsNanoseconds, toDate } from '../../../utils/dateUtils';

const CreateHubsDispatch = ({ setDispatches, closeCreate , productSummary}) => {
  const [newDispatches, setNewDispatches] = useState([]);
  const [selectedHub, setSelectedHub] = useState("Select Hub");
  const [selectedProduct, setSelectedProduct] = useState("Select Product");
  const [quantity, setQuantity] = useState(1);
  const { hubProducts, setHubWiesProduct, products, hubs } = useInventoryContext();
  
  const generateDispatchId = () => `DISP-${Date.now()}`;
const generateSubDispatchId = () => {
  const timestamp = Date.now().toString(36); // base-36 timestamp
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36); // cryptographic randomness
  return `SUB-${timestamp}-${randomPart}`;
};



const createDispatch = async () => {
  // 🚫 Step 0: Validate selected hub
  if (!hubs.map(({ hub_name }) => hub_name).includes(selectedHub)) {
    Swal.fire({
      title: "Error",
      text: "Please select a valid hub",
      icon: "error",
    });
    return;
  }

  try {
    // 🆔 Step 1: Generate dispatch ID
    const dispatchId = generateDispatchId();
    const addInventory = new AddInventory();

    // 🔄 Step 2: Upload individual dispatches
    const promises = newDispatches.map(async (item) => {
      const subDispatchId = generateSubDispatchId();
      const data = await addInventory.addDispatch({
        ...item,
        dispatch_id: dispatchId,
        hub: selectedHub,
        dispatch_sub_id : subDispatchId,
      });
      return data;
    });
    // Wait for dispatch creation
    const [addResults] = await Promise.all([Promise.all(promises)]);

    // ✅ Step 7: Update UI
    const successfulDispatches = addResults.filter((result) => result !== null);
    setDispatches((prev) => [...prev, ...successfulDispatches]);
    closeCreate();

  } catch (error) {
    console.error("❌ Error creating dispatches:", error);
    Swal.fire({
      title: "Error",
      text: "Failed to create dispatches. Please try again.",
      icon: "error",
    });
  }
};




  const handleQuantityChange = (e, index) => {
  const value = Number(e.target.value) || 0;
  const productName = newDispatches[index]?.productName;

  if (value > productSummary.reduce((acc, item) =>
      item.productName === productName
        ? acc + Number(item.quantity)
        : acc
    , 0)) {
    Swal.fire({
      title: "Error",
      text: "Quantity cannot be greater than available product",
      icon: "error",
    });
    return;
  }

  setNewDispatches((prev) =>
    prev.map((item, i) =>
      i === index
        ? {
            ...item,
            quantity: value,
            date: new Date(),
            dispatch_date: new Date(),
          }
        : item
    )
  );
};

const need = useMemo(() => {

  const filteredProducts = hubProducts
    .filter((item) => item.hubName === selectedHub)
    .reduce((acc, item) => {
      const name = item.product_name;
      const b2c = Number(item.B2C_predicted_orders) || 0;
      const b2b = Number(item.B2B_predicted_orders) || 0;
      acc[name] = (acc[name] || 0) + b2c + b2b;
      return acc;
    }, {});

  return filteredProducts;
}, [hubProducts, selectedHub]);



  useEffect(()=>{
    setNewDispatches((prev)=>{
      return prev.map((item, index) =>{
        return {...item, hub : selectedHub, date: new Date(), dispatch_date: new Date(),}
      })
    })
  }, [selectedHub])

  useEffect(()=>{

    if(products && products.length){

        const init = products.map((product)=>{
            const dispatch_init = 
            {
              productName: product.productName,
              hub: selectedHub,
              quantity: 0,
              date: new Date(),
              dispatch_date: new Date(),
              dispatch_sub_id: generateDispatchId(),
              // status: "Added",
              status: "Dispatched",
              created_by: localStorage.getItem("loggedIn_user"),
              created_user_id: localStorage.getItem("userId"),
              type: "Hub Dispatch",
              type_val: 2,
            }
            return dispatch_init;
        })

        setNewDispatches(init);
    }
    }, []);

    
  return (
    <div
      className="modal show fade"
      style={{
        display: "block",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-lg dispatchdata" style={{ width: "80%" }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Dispatch</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={closeCreate}
            ></button>
          </div>

          <div className="modal-body" style={{
            overflowY: "scroll",
            maxHeight: "1000px",
            height: "75vh",
          }}>

            {/* Dispatch Table */}
            <div>
              <h6 className="text-primary mb-3">Dispatch Products</h6>
              {/* Select Hub */}
              <div className="col-md-6 d-flex align-items-center justify-content-between">
                <label
                  htmlFor="hub"
                  className="form-label fw-semibold mb-0 me-2"
                >
                  Select Hub:
                </label>
                <div style={{ flex: 1 }}>
                  <HubDropdown
                    selectedHub={selectedHub}
                    setSelectedHub={setSelectedHub}
                    defaultHub="Select Hub"
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Product Name</th>
                      {/* <th>Hub</th> */}
                      <th>Quantity</th>
                      <th>Hub Need</th>
                      <th>Dispatch Avalable</th>
                      <th>Date</th>
                      <th>Time</th>
                      {/* <th>Action</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {newDispatches.length > 0 ? (
                      newDispatches.map((dispatch, index) => (
                        <tr key={index}>
                          <td>{dispatch.productName}</td>
                          {/* <td>{dispatch.hub}</td> */}
                          <td>
                            <input type="number"
                            className="form-control"
                            value={dispatch.quantity}
                            onChange={(e) =>
                              handleQuantityChange(e, index)
                            }
                            /></td>
                          <td>{need[dispatch.productName] || 0}</td>
                          <td>
  {
    productSummary.reduce((acc, item) =>
      item.productName === dispatch.productName
        ? acc + Number(item.quantity)
        : acc
    , 0)
  }
</td>

                          <td>{DateTimeUtil.timestampToDate(dispatch.date)}</td>
                          <td>{DateTimeUtil.timestampToTimeAMPM(dispatch.date)}</td>
                          {/* <td>
                            <button
                            className="btn btn-sm btn-danger"
                              onClick={() => deleteProductFromDispatch(index)}
                            >
                              Delete
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => editProductFromDispatch(index)}
                            >
                              Edit
                            </button>
                          </td> */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No products added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="alert alert-info mt-4">
                <strong>Note:</strong> If the selected product for a hub already exists
                in the dispatch list, its quantity will be updated instead of creating a
                new entry.
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-success" onClick={createDispatch}>
              Create Dispatch
            </button>
            <button className="btn btn-secondary" onClick={closeCreate}>
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


export default CreateHubsDispatch;
