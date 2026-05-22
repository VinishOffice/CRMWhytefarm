import React from "react";

const ProfileEditSubscriptionModal = ({
  handleSubmitES,
  editSubs,
  handleQuantityChangeES,
  handleChangeES,
  handleIntervalChangeES,
  nthES,
  handleNthDayChangeES,
}) => {
  return (
    <div
      className="modal subedit fade"
      id="exampleModal-2-edit"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-2-edit"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2-edit">
              Update Subscription
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
            <form className="myForm" onSubmit={handleSubmitES}>
              <div className="card mb-2">
                <div className="card-body">
                  <p className="mt-2 card-text">
                    Name: {editSubs.product_name}
                  </p>
                  <div className="form-group row">
                    <div className="col">
                      <p className="mt-2 card-text">
                        Price: ₹ {editSubs.price}
                      </p>
                    </div>
                    <div className="col">
                      <div className="quantity-control">
                        <div className="col">
                          <p className="mt-2 card-text">
                            Quantity :{" "}
                            <i
                              className="mdi mdi-minus-circle"
                              style={{
                                paddingRight: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleQuantityChangeES(-1)}
                            ></i>
                            {editSubs.quantity}
                            <i
                              className="mdi mdi-plus-circle"
                              style={{
                                paddingLeft: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleQuantityChangeES(1)}
                            ></i>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="form-group"
                    style={{ display: "flex", marginBottom: "0.5rem" }}
                  >
                    <div className="col">
                      <label>
                        Everyday
                        <input
                          type="radio"
                          name="subscription_type"
                          value="Everyday"
                          checked={editSubs.subscription_type === "Everyday"}
                          onChange={handleChangeES}
                        />
                      </label>
                    </div>
                    <div className="col">
                      <label>
                        On Interval
                        <input
                          type="radio"
                          name="subscription_type"
                          value="On-Interval"
                          checked={
                            editSubs.subscription_type === "On-Interval"
                          }
                          onChange={handleChangeES}
                        />
                      </label>
                    </div>
                    <div className="col">
                      <label>
                        Custom
                        <input
                          type="radio"
                          name="subscription_type"
                          value="Custom"
                          checked={editSubs.subscription_type === "Custom"}
                          onChange={handleChangeES}
                        />
                      </label>
                    </div>
                  </div>

                  {editSubs.subscription_type === "On-Interval" && (
                    <div className="dropdown">
                      <button
                        className="btn btn-danger btn-xs dropdown-toggle"
                        type="button"
                        id="dropdownMenuSizeButton3-edit"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        style={{
                          height: "22px",
                          padding: "5px",
                          marginRight: "14px",
                          marginLeft: "1rem",
                        }}
                      >
                        {editSubs.interval === ""
                          ? "Days"
                          : `Every ${editSubs.interval} day`}
                      </button>
                      <div
                        className="dropdown-menu"
                        aria-labelledby="dropdownMenuSizeButton3-edit"
                      >
                        <h6
                          className="dropdown-item"
                          onClick={() => handleIntervalChangeES(2)}
                        >
                          Every 2nd day
                        </h6>
                        <h6
                          className="dropdown-item"
                          onClick={() => handleIntervalChangeES(3)}
                        >
                          Every 3rd day
                        </h6>
                        <h6
                          className="dropdown-item"
                          onClick={() => handleIntervalChangeES(4)}
                        >
                          Every 4th day
                        </h6>
                        <div className="dropdown-divider"></div>
                        <h6
                          className="dropdown-item"
                          onClick={() => handleIntervalChangeES("nth")}
                        >
                          Every nth day
                        </h6>
                      </div>
                    </div>
                  )}

                  {nthES && (
                    <div>
                      <input
                        type="number"
                        className=""
                        style={{
                          width: "2rem",
                          border: "1px solid #dee2e6",
                          fontWeight: "400",
                          borderRadius: "4px",
                          height: "22px",
                          marginRight: "1rem",
                          fontSize: "11px",
                        }}
                        name="interval"
                        value={editSubs.interval}
                        onChange={handleNthDayChangeES}
                        placeholder="value"
                      />
                    </div>
                  )}

                  {editSubs.subscription_type === "Custom" && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          marginTop: "1rem",
                          justifyContent: "space-around",
                        }}
                      >
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, dIdx) => (
                          <div
                            key={dIdx}
                            className="badge badge-pill badge-outline-primary"
                            style={{ marginRight: "1rem" }}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          marginTop: "1rem",
                          justifyContent: "space-around",
                        }}
                      >
                        {[
                          "sunday",
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                        ].map((day) => (
                          <input
                            key={day}
                            type="number"
                            className=""
                            style={{
                              width: "2rem",
                              border: "1px solid #dee2e6",
                              fontWeight: "400",
                              borderRadius: "4px",
                              height: "22px",
                              marginRight: "1rem",
                              fontSize: "11px",
                            }}
                            name={day}
                            value={editSubs[day]}
                            onChange={handleChangeES}
                            placeholder="value"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
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

export default ProfileEditSubscriptionModal;
