import React from "react";

const ProfileCashModal = ({
  handleSubmitCash,
  handleChangeCash,
  submitCash,
  loading,
}) => {
  return (
    <div
      className="modal cash fade"
      id="exampleModal-2-cash"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2">
              Cash Collection Time
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
            <form className="myForm" onSubmit={handleSubmitCash}>
              <div className="form-group">
                <label>Amount:</label>
                <input
                  className="form-control"
                  type="number"
                  onChange={handleChangeCash}
                  id="amount"
                  value={submitCash.amount}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  style={{
                    height: "35px",
                    padding: "12px 20px",
                    boxSizing: "border-box",
                    borderRadius: "4px",
                    resize: "none",
                  }}
                  id="date"
                  name="date"
                  onChange={handleChangeCash}
                  value={submitCash.date}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <select
                  className="form-control"
                  onChange={handleChangeCash}
                  id="time"
                  value={submitCash.time}
                  required
                >
                  <option value="">Select Time</option>
                  <option value="06:00 to 09:30">06:00 to 09:30</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  value="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCashModal;
