import React from "react";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";

const ProfileResumePauseModal = ({
  handlePauseSubscription,
  resumeDate,
  setResumeDate,
  afterEleven,
}) => {
  return (
    <div
      className="modal resumedatesub fade"
      id="exampleModal-2-resume"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2-resume"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2-resume">
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
            <form className="myForm" onSubmit={handlePauseSubscription}>
              <div className="form-group">
                <label style={{ marginRight: "10px" }}>
                  Select Resume Date:
                </label>
                <DatePicker
                  selected={resumeDate}
                  onChange={(date) => setResumeDate(date)}
                  selectsStart
                  minDate={addDays(new Date(), afterEleven ? 2 : 1)}
                  placeholderText="Resume Date"
                  className="form-control"
                  dateFormat="dd-MM-yyyy"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
                  Pause
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

export default ProfileResumePauseModal;
