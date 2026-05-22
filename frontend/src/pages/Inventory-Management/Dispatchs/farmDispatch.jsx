import React, { useEffect, useState } from "react";
import { DateTimeUtil } from "./../../../Utility";
import { useInventoryContext } from "./../InventoryContext";
import { AddInventory } from "./../utility/queries";
import moment from "moment";
import { now } from "../../../utils/dateUtils";

const CreateDispatch = ({ setDispatches, closeCreate }) => {
  const [newDispatches, setNewDispatches] = useState([]);
  
  const { products } = useInventoryContext();
  

  const generateDispatchId = () => `DISP-${Date.now()}`;
  const generateSubDispatchId = () =>
    `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const createDispatch = async () => {
    try {
      const dispatchId = generateDispatchId();
      const addInventory = new AddInventory();

      const dispatchPromises = newDispatches.map(async (item) => {
        const dispatchData = { ...item, dispatch_id: dispatchId };
        return await addInventory.addDispatch(dispatchData);
      });
      const [newDispatchResults] = await Promise.all([Promise.all(dispatchPromises)]);

      const successfulDispatches = newDispatchResults.filter(
        (result) => result !== null
      );

      setDispatches((prev) => [...prev, ...successfulDispatches]);
      closeCreate();
    } catch (error) {
      console.error("Error creating dispatches:", error);
    }
  };

  const handleQuantityChange = (e, index) => {
    setNewDispatches((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: e.target.value,
              date: new Date(),
              dispatch_date: new Date(),
            }
          : item
      )
    );
  };

  // ✅ FIXED useEffect — show productName without (300g) if only 1 packaging option
  useEffect(() => {
    if (products && products.length) {
      const init = [];

      products.forEach((product) => {
        const { productName, packagingOptions = [] } = product;

        if (packagingOptions.length === 1) {
          // Only one packaging — just use product name
          init.push({
            productName,
            quantity: 0,
            date: new Date(),
            dispatch_date: new Date(),
            dispatch_sub_id: generateSubDispatchId(),
            status: "Dispatched",
            created_by: localStorage.getItem("loggedIn_user"),
            created_user_id: localStorage.getItem("userId"),
            type: "Farms Dispatch",
            type_val: 1,
          });
        } else if (packagingOptions.length > 1) {
          // Multiple packaging options — use full name
          packagingOptions.forEach((pkg) => {
            init.push({
              productName: `${productName} (${pkg.packaging}${pkg.pkgUnit})`,
              quantity: 0,
              date: new Date(),
              dispatch_date: new Date(),
              dispatch_sub_id: generateSubDispatchId(),
              status: "Dispatched",
              created_by: localStorage.getItem("loggedIn_user"),
              created_user_id: localStorage.getItem("userId"),
              type: "Farms Dispatch",
              type_val: 1,
            });
          });
        }
      });

      setNewDispatches(init);
    }
  }, [products]);

  return (
    <div
      className="modal show fade"
      style={{ display: "block", background: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
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

          <div
            className="modal-body"
            style={{ overflowY: "scroll", maxHeight: "1000px", height: "75vh" }}
          >
            <h6 className="text-primary mb-3">Dispatch Products</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {newDispatches.map((dispatch, index) => (
                    <tr key={index}>
                      <td>{dispatch.productName}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={dispatch.quantity}
                          onChange={(e) => handleQuantityChange(e, index)}
                        />
                      </td>
                      <td>{DateTimeUtil.timestampToDate(dispatch.date)}</td>
                      <td>{DateTimeUtil.timestampToTimeAMPM(dispatch.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="alert alert-info mt-4">
              <strong>Note:</strong> If the selected product already exists in the
              dispatch list, its quantity will be updated.
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

export default CreateDispatch;
