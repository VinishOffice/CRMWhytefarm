import React from "react";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { HubDropdown } from "../../pages/Inventory-Management/utility/productDropDown";
import { DateTimeUtil } from "../../Utility";

const HubDispatchTable = ({
  hubDispatches,
  filteredHubDispatches,
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
  selectedHub,
  setSelectedHub,
}) => {
  return (
    <div className="container my-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
        <h5 className="fw-bold text-primary mb-0">Hub Dispatches</h5>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="hub" className="form-label fw-semibold mb-0">
            Select Hub:
          </label>
          <div style={{ minWidth: "200px" }}>
            <HubDropdown
              selectedHub={selectedHub}
              setSelectedHub={setSelectedHub}
              defaultHub="Select Hub"
            />
          </div>
        </div>
      </div>

      <div className="table-responsive shadow-sm rounded">
        <table className="table table-bordered table-hover table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th scope="col">Dispatch ID</th>
              <th scope="col">Hub</th>
              <th scope="col">Product</th>
              <th scope="col">Quantity</th>
              <th scope="col">Status</th>
              <th scope="col">Created By</th>
              <th scope="col">Dispatched On</th>
              <th scope="col">Delivered On</th>
              <th scope="col">Accepted By</th>
              <th scope="col">Sub Dispatch ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredHubDispatches.length > 0 ? (
              filteredHubDispatches.map((item, index) => {
                const isFirstRowOfGroup =
                  index === 0 ||
                  filteredHubDispatches[index - 1].dispatch_id !== item.dispatch_id;

                const groupRowCount = filteredHubDispatches.filter(
                  (dispatch) => dispatch.dispatch_id === item.dispatch_id
                ).length;

                return (
                  <tr key={`${item.dispatch_id}-${item.dispatch_sub_id}`}>
                    {isFirstRowOfGroup && (
                      <td rowSpan={groupRowCount}>
                        {item.dispatch_id || "N/A"}
                      </td>
                    )}
                    <td>{item.hub}</td>
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
                    <td>{item.created_by || "N/A"}</td>
                    {isFirstRowOfGroup && (
                      <td rowSpan={groupRowCount}>
                        {item.dispatch_date
                          ? `${DateTimeUtil.timestampFromDBToISODate(item.dispatch_date)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.dispatch_date)}`
                          : "N/A"}
                      </td>
                    )}
                    <td>
                      {item.accept_at
                        ? `${DateTimeUtil.timestampFromDBToISODate(item.accept_at)} ${DateTimeUtil.timestampFromDBToTimeAMPM(item.accept_at)}`
                        : "N/A"}
                    </td>
                    <td>{item.accept_user || "N/A"}</td>
                    <td>{item.dispatch_sub_id}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-muted py-4">
                  No hub dispatches available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HubDispatchTable;
