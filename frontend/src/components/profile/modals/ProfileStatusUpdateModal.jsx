import React from "react";

const ProfileStatusUpdateModal = ({
  handleSubmitMarkDelivered,
  oiidStatus,
  handleChangeCR,
  submitCR,
}) => {
  return (
    <div
      className="modal mdlv fade"
      id="exampleModal-2-status"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2-status"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2-status">
              Update Status
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
            <form className="myForm" onSubmit={handleSubmitMarkDelivered}>
              {oiidStatus === "2" ? (
                <div className="form-group">
                  <label>
                    Are you sure you would like to mark the order(s) as
                    cancelled?
                  </label>
                </div>
              ) : (
                <div className="form-group">
                  <label style={{ fontSize: "15px", fontWeight: "500" }}>
                    Are you sure you would like to mark the order(s) as
                    delivered?
                  </label>
                </div>
              )}

              {oiidStatus === "2" && (
                <div className="form-group">
                  <label>Reason</label>
                  <select
                    className="form-control"
                    onChange={handleChangeCR}
                    id="reason"
                    value={submitCR.reason}
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Curdled/taste issue">Curdled/taste issue</option>
                    <option value="Quality issue">Quality issue</option>
                    <option value="Packaging issue">Packaging issue</option>
                    <option value="Quantity not adequate">
                      Quantity not adequate
                    </option>
                    <option value="Delivery time missed">
                      Delivery time missed
                    </option>
                    <option value="Tech issue">Tech issue</option>
                    <option value="Address not found">Address not found</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
                  {oiidStatus === "2" ? "Cancel Order" : "Mark Delivered"}
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

export default ProfileStatusUpdateModal;
