import React from "react";
import DatePicker from "react-datepicker";
import { getTomorrowDate } from "../../../utils/dateUtils";

const ProfileCalendarModal = ({
  calendarDate,
  handleCalendarDateChange,
  subscriptionCalendarFutureData,
  editingRow,
  quantityFU,
  setQuantityFU,
  handleSaveClick,
  isSaving,
  handleEditClick,
}) => {
  return (
    <div
      className="modal calendar fade"
      id="exampleModal-2-calendar"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2">
              Calendar
            </h5>
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="panel">
              <div className="datepicker-container">
                <label className="datepicker-label">Delivery Date:</label>
                <DatePicker
                  selected={calendarDate}
                  minDate={getTomorrowDate()}
                  onChange={handleCalendarDateChange}
                  dateFormat="dd/MM/yyyy"
                  className="datepicker-input"
                  placeholderText="Select date"
                />
              </div>
            </div>
            <div className="table-responsive mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th className="pt-1">Category</th>
                    <th className="pt-1">Product</th>
                    <th className="pt-1">Quantity</th>
                    <th className="pt-1">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(subscriptionCalendarFutureData) &&
                  subscriptionCalendarFutureData.length > 0 ? (
                    subscriptionCalendarFutureData.map(
                      ({ id, subs }, index) => (
                        <tr key={index}>
                          <td>Dairy</td>
                          <td>{subs.product_name}</td>
                          <td>
                            {editingRow === index ? (
                              <input
                                type="number"
                                value={quantityFU}
                                onChange={(e) => setQuantityFU(e.target.value)}
                                style={{ width: "60px" }}
                              />
                            ) : (
                              subs.quantity
                            )}
                          </td>
                          <td>
                            {editingRow === index ? (
                              <button
                                onClick={() =>
                                  handleSaveClick(
                                    id,
                                    subs.subscription_id,
                                    subs.product_name
                                  )
                                }
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <div
                                    className="spinner-border"
                                    style={{
                                      width: "1rem",
                                      height: "1rem",
                                      color: "white",
                                    }}
                                    role="status"
                                  >
                                    <span className="visually-hidden">
                                      Loading...
                                    </span>
                                  </div>
                                ) : (
                                  "Save"
                                )}
                              </button>
                            ) : (
                              <i
                                className="menu-icon mdi mdi-pencil"
                                onClick={() =>
                                  handleEditClick(index, subs.quantity, id)
                                }
                                style={{
                                  color: "blue",
                                  cursor: "pointer",
                                  fontSize: "23px",
                                  paddingLeft: "5px",
                                }}
                              ></i>
                            )}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        No data found for selected date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCalendarModal;
