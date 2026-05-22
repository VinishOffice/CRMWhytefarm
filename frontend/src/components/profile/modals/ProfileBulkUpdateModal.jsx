import React from "react";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";

const ProfileBulkUpdateModal = ({
  handleSubmitUpdateQuantity,
  newQuantityBU,
  setNewQuantityBU,
  afterEleven,
  startDateBU,
  setStartDateBU,
  endDateBU,
  setEndDateBU,
}) => {
  return (
    <div
      className="modal bq fade"
      id="exampleModal-2-bulk"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2-bulk"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2-bulk">
              Update Quantity in bulk
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
            <form onSubmit={handleSubmitUpdateQuantity}>
              <div className="form-group">
                <label htmlFor="newQuantity">New Quantity:</label>
                <input
                  type="number"
                  id="newQuantityBU"
                  value={newQuantityBU}
                  className="form-control"
                  onChange={(e) => setNewQuantityBU(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date:</label>
                <br />
                <DatePicker
                  selected={startDateBU}
                  onChange={(date) => setStartDateBU(date)}
                  selectsStart
                  minDate={addDays(new Date(), afterEleven ? 2 : 1)}
                  startDate={startDateBU}
                  endDate={endDateBU}
                  className="form-control"
                  placeholderText="Start Date"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date:</label>
                <br />
                <DatePicker
                  selected={endDateBU}
                  onChange={(date) => setEndDateBU(date)}
                  selectsEnd
                  startDate={startDateBU}
                  endDate={endDateBU}
                  minDate={addDays(new Date(), 2)}
                  className="form-control"
                  placeholderText="End Date"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "end" }}>
                <button type="submit" className="btn btn-primary">
                  Update Quantities
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBulkUpdateModal;
