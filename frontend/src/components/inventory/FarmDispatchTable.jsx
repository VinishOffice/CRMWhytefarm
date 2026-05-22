import React from "react";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { DateTimeUtil } from "../../Utility";

const FarmDispatchTable = ({
  dispatches,
  farmDispatchData,
  editingDispatchId,
  updatedDispatches,
  handleQuantityChange,
  updatedStatus,
  setUpdatedStatus,
  saveUpdates,
  isIconLoaded,
  permissible_roles,
  handleUpdate,
  deleteSubDispatch,
  rolePermission,
  setEditingDispatchId,
}) => {
  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-primary mb-0">Farm Dispatches</h5>
      </div>

      {/* Summary Table */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-bordered table-hover table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {farmDispatchData.length > 0 ? (
              farmDispatchData.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center text-muted py-4">
                  No farm dispatches available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <h5 className="fw-bold text-primary mb-0">Farm Dispatches Logs</h5>
      </div>

      {/* Logs Table */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-bordered table-hover table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th scope="col">Dispatch ID</th>
              <th scope="col">Product</th>
              <th scope="col">Quantity</th>
              <th scope="col">Status</th>
              <th scope="col">Added On</th>
              <th scope="col">Created By</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.length > 0 ? (
              (() => {
                const filtered = dispatches
                  .filter((item) => item.type_val === 1)
                  .sort((a, b) => (a.dispatch_id || "").localeCompare(b.dispatch_id || ""));

                const groupCounts = {};
                filtered.forEach((item) => {
                  groupCounts[item.dispatch_id] = (groupCounts[item.dispatch_id] || 0) + 1;
                });

                const renderedDispatchIds = new Set();

                return filtered.map((item, index) => {
                  const isFirstRowOfGroup = !renderedDispatchIds.has(item.dispatch_id);
                  if (isFirstRowOfGroup) renderedDispatchIds.add(item.dispatch_id);

                  return (
                    <tr key={`${item.dispatch_id}-${item.dispatch_sub_id}`}>
                      {isFirstRowOfGroup && (
                        <td rowSpan={groupCounts[item.dispatch_id]}>
                          {item.dispatch_id || "N/A"}
                        </td>
                      )}
                      <td>{item.productName}</td>
                      <td>
                        {editingDispatchId === item.dispatch_id ? (
                          <input
                            type="number"
                            className="form-control form-control-sm d-inline"
                            value={
                              updatedDispatches.find(
                                (d) => d.dispatch_sub_id === item.dispatch_sub_id
                              )?.quantity || item.quantity
                            }
                            onChange={(e) =>
                              handleQuantityChange(item.dispatch_sub_id, e.target.value)
                            }
                            min="1"
                            style={{ width: "80px" }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td
                        className={`fw-bold ${
                          item.status === "Delivered"
                            ? "text-success"
                            : item.status === "Dispatched"
                            ? "text-warning"
                            : "text-primary"
                        }`}
                      >
                        {item.status}
                      </td>
                      <td>
                        {item.date
                          ? `${DateTimeUtil.timestampFromDBToISODate(item.date)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.date)}`
                          : "N/A"}
                      </td>
                      <td>{item.created_by || "N/A"}</td>
                    </tr>
                  );
                });
              })()
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No farm dispatches log available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FarmDispatchTable;
