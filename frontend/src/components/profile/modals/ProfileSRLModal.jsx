import React from "react";

const ProfileSRLModal = ({
  handleSubmitSRL,
  handleChangeSRL,
  submitSRL,
}) => {
  return (
    <div
      className="modal srl fade"
      id="exampleModal-2-srl"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2">
              Send Recharge Link
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
            <form className="myForm" onSubmit={handleSubmitSRL}>
              <div className="form-group">
                <label>Enter Amount:</label>
                <input
                  className="form-control"
                  type="number"
                  onChange={handleChangeSRL}
                  id="amount"
                  value={submitSRL.amount}
                  autoComplete="off"
                />
              </div>
              <div className="form-group row" style={{ display: "flex" }}>
                <div className="col">
                  <label style={{ paddingRight: "11px" }}>Email:</label>
                  <input
                    type="checkbox"
                    id="email"
                    checked={submitSRL.email}
                    onChange={handleChangeSRL}
                  />
                </div>
                <div className="col">
                  <label style={{ paddingRight: "11px" }}>SMS:</label>
                  <input
                    type="checkbox"
                    id="sms"
                    checked={submitSRL.sms}
                    onChange={handleChangeSRL}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="submit"
                  data-type="copy"
                  className="btn btn-success"
                >
                  Copy Recharge Link
                </button>
                <button
                  type="submit"
                  data-type="send"
                  className="btn btn-success"
                >
                  Send
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

export default ProfileSRLModal;
