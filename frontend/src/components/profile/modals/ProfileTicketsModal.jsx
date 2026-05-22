import React from "react";

const ProfileTicketsModal = ({
  handleSubmitTickets,
  handleChangeTickets,
  submitTickets,
  loggedIn_user,
}) => {
  return (
    <div
      className="modal tickets fade"
      id="exampleModal-2-tickets"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2">
              Add Ticket
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
            <form className="myForm" onSubmit={handleSubmitTickets}>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  onChange={handleChangeTickets}
                  id="category"
                  value={submitTickets.category}
                >
                  <option>Select category</option>
                  <option value="Support">Support</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Complaint">Complaint</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  onChange={handleChangeTickets}
                  id="status"
                  value={submitTickets.status}
                >
                  <option>Select Status</option>
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                  <option value="In Process">In Process</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-select"
                  onChange={handleChangeTickets}
                  id="priority"
                  value={submitTickets.priority}
                >
                  <option>Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  style={{
                    height: "35px",
                    padding: "12px 20px",
                    boxSizing: "border-box",
                    borderRadius: "4px",
                    resize: "none",
                  }}
                  id="due_date"
                  name="due_date"
                  onChange={handleChangeTickets}
                  value={submitTickets.due_date}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Owner</label>
                <select
                  className="form-select"
                  onChange={handleChangeTickets}
                  id="owner"
                  value={submitTickets.owner}
                >
                  <option>Select Owner</option>
                  <option value={loggedIn_user}>{loggedIn_user}</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  cols="30"
                  onChange={handleChangeTickets}
                  id="description"
                  value={submitTickets.description}
                  style={{ height: "4rem" }}
                />
              </div>

              <div className="form-group">
                <label>Visible On</label>
                <select
                  className="form-select"
                  onChange={handleChangeTickets}
                  id="visible_on"
                  value={submitTickets.visible_on}
                >
                  <option>Select Visibility</option>
                  <option value="Internal">Internal</option>
                  <option value="Internal & External">
                    Internal & External
                  </option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="submit" value="submit" className="btn btn-success">
                  Submit
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

export default ProfileTicketsModal;
