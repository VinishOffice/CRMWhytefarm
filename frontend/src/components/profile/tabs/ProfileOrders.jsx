import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ProfileOrders = ({
  uniqueOrders,
  orderListData,
  userMapID,
  productDataID,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleSearchOrders,
  resetSearchOrders,
  permissible_roles,
  openAdhocOrder,
  setCartItems,
  rolePermission,
  openmdlv,
  handleEditClickOrd,
  handleSaveClickOrd,
  editingRowOrd,
  quantityOrd,
  setQuantityOrd,
}) => {
  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <div className="home-tab">
            <div className="d-sm-flex align-items-center justify-content-between">
              <div>
                <div className="btn-wrapper">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From Date"
                    className="form-control"
                    dateFormat="dd-MM-YYYY"
                  />
                  <span className="" style={{ width: "1rem" }}>
                    {" "}
                    TO{" "}
                  </span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="To Date"
                    className="form-control"
                    dateFormat="dd-MM-YYYY"
                  />
                  <a
                    href="#"
                    className="btn btn-primary text-white me-0 mr-2"
                    onClick={() => handleSearchOrders()}
                    style={{ marginTop: "9px", marginLeft: "14px" }}
                  >
                    <i className="icon-search"></i>Search
                  </a>
                  <a
                    href="#"
                    className="btn btn-primary text-white me-0 mr-2"
                    onClick={() => resetSearchOrders()}
                    style={{ marginTop: "9px", marginLeft: "14px" }}
                  >
                    <i className="icon-reset"></i>Reset
                  </a>
                </div>
              </div>
              <div>
                <div className="btn-wrapper">
                  {permissible_roles.includes("create_subscription") ? (
                    <a
                      href="#"
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => {
                        openAdhocOrder();
                        setCartItems([]);
                      }}
                    >
                      <i className="icon-plus"></i>Adhoc Order
                    </a>
                  ) : (
                    <a
                      href="#"
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => rolePermission()}
                    >
                      <i className="icon-plus"></i>Add Subscription
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Orders</h4>
            <div className="tab-pane" role="tabpanel">
              {uniqueOrders.map((order) => {
                const uniqueOrder = order;
                const allOrdersCancelled = uniqueOrder.data.status === "2";
                const anyOrderNew = uniqueOrder.data.status === "0";
                const anyOrderDelivered = uniqueOrder.data.status === "1";

                const orders = orderListData.filter(
                  (o) => o.data.order_id === uniqueOrder.data.order_id
                );

                return (
                  <div className="card mb-2" key={uniqueOrder.id}>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Hub:</p>
                            <p>{uniqueOrder.data.hub_name}</p>
                          </address>
                          <address>
                            <p className="fw-bold">Delivery Executive:</p>
                            <p>{userMapID[uniqueOrder.data.delivery_exe_id]}</p>
                          </address>
                        </div>
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Order Status:</p>
                            <p>
                              {anyOrderNew ? (
                                <button
                                  className="btn btn-info btn-rounded btn-sm"
                                  style={{ marginRight: "1rem", padding: "4px 19.4px" }}
                                >
                                  <span>New</span>
                                </button>
                              ) : anyOrderDelivered ? (
                                <button
                                  className="btn btn-success btn-rounded btn-sm"
                                  style={{ marginRight: "1rem", padding: "4px 19.4px" }}
                                >
                                  <span>Delivered</span>
                                </button>
                              ) : allOrdersCancelled ? (
                                <button
                                  className="btn btn-danger btn-rounded btn-sm"
                                  style={{ marginRight: "1rem", padding: "4px 19.4px" }}
                                >
                                  <span>Cancelled</span>
                                </button>
                              ) : null}
                            </p>
                          </address>
                          <address>
                            <p className="fw-bold">Order Type</p>
                            <p>{uniqueOrder.data.order_type}</p>
                          </address>
                        </div>
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Phone No:</p>
                            <p>
                              {userMapID &&
                                uniqueOrder &&
                                userMapID[uniqueOrder.data.delivery_exe_id + "_phone"]}
                            </p>
                          </address>
                          <address>
                            <p className="fw-bold">Order ID</p>
                            <p>{uniqueOrder.data.order_id}</p>
                          </address>
                        </div>
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Date:</p>
                            <p>{uniqueOrder.data.delivery_date}</p>
                          </address>
                          <address>
                            <p className="fw-bold">Delivery Time</p>
                            <p>{uniqueOrder.data.delivery_time}</p>
                          </address>
                        </div>
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Order Amount:</p>
                            <p>{uniqueOrder.data.quantity * uniqueOrder.data.price}</p>
                          </address>
                          <address>
                            <p className="fw-bold">Total Order Amount</p>
                            <p>{uniqueOrder.data.quantity * uniqueOrder.data.price}</p>
                          </address>
                        </div>
                        <div className="col-lg-2">
                          <address>
                            <p className="fw-bold">Total Discount:</p>
                            <p>0.00</p>
                          </address>
                          {!allOrdersCancelled && (
                            <address>
                              <p className="fw-bold">Action</p>
                              <span>
                                {anyOrderDelivered ? (
                                  <button
                                    onClick={() => openmdlv(uniqueOrder.data.order_id, "2")}
                                    className="btn btn-danger btn-sm"
                                    style={{ marginRight: "1rem", padding: "4px 15px" }}
                                  >
                                    <i
                                      className="menu-icon mdi mdi-delete"
                                      style={{ color: "white", fontSize: "15px" }}
                                    ></i>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openmdlv(uniqueOrder.data.order_id, "1")}
                                      className="btn btn-success btn-sm"
                                      style={{ marginRight: "1rem", padding: "4px 15px" }}
                                    >
                                      <i
                                        className="menu-icon mdi mdi-check-all"
                                        style={{ color: "white", fontSize: "15px" }}
                                      ></i>
                                    </button>
                                    <button
                                      onClick={() => openmdlv(uniqueOrder.data.order_id, "2")}
                                      className="btn btn-danger btn-sm"
                                      style={{ marginRight: "1rem", padding: "4px 15px" }}
                                    >
                                      <i
                                        className="menu-icon mdi mdi-delete"
                                        style={{ color: "white", fontSize: "15px" }}
                                      ></i>
                                    </button>
                                  </>
                                )}
                              </span>
                            </address>
                          )}
                        </div>
                      </div>
                      <br />
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="pt-1">Product Image</th>
                            <th className="pt-1">Sub ID</th>
                            <th className="pt-1">Product</th>
                            <th className="pt-1">Unit Price</th>
                            <th className="pt-1">Total Price</th>
                            <th className="pt-1">Quantity</th>
                            <th className="pt-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((filteredOrder, index) => (
                            <tr key={filteredOrder.id}>
                              <td>
                                <div
                                  className="d-flex align-items-center"
                                  style={{ paddingBottom: "0rem" }}
                                >
                                  <img
                                    src={productDataID[filteredOrder.data.product_name]}
                                    alt="product"
                                    style={{ height: "70px", width: "93px" }}
                                  />
                                </div>
                              </td>
                              <td>{filteredOrder.data.subscription_id}</td>
                              <td>{filteredOrder.data.product_name}</td>
                              <td>{filteredOrder.data.price}</td>
                              <td>
                                {filteredOrder.data.quantity * filteredOrder.data.price}
                              </td>
                              <td>
                                {editingRowOrd === index ? (
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <input
                                      type="number"
                                      value={quantityOrd}
                                      onChange={(e) => setQuantityOrd(e.target.value)}
                                      style={{ width: "60px" }}
                                    />
                                    <button
                                      onClick={() =>
                                        handleSaveClickOrd(
                                          filteredOrder.id,
                                          filteredOrder.data.quantity,
                                          filteredOrder.data.price
                                        )
                                      }
                                      className="btn btn-success btn-xs ms-2"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    {filteredOrder.data.quantity}
                                    <i
                                      className="ti-pencil ms-2"
                                      style={{ cursor: "pointer", fontSize: "12px" }}
                                      onClick={() =>
                                        handleEditClickOrd(index, filteredOrder.data.quantity)
                                      }
                                    ></i>
                                  </div>
                                )}
                              </td>
                              <td>
                                {filteredOrder.data.status === "2" ? (
                                  <div
                                    className="badge badge-pill badge-outline-danger"
                                    style={{ marginRight: "1rem" }}
                                  >
                                    Cancelled
                                  </div>
                                ) : filteredOrder.data.status === "1" ? (
                                  <div
                                    className="badge badge-pill badge-outline-success"
                                    style={{ marginRight: "1rem" }}
                                  >
                                    Delivered
                                  </div>
                                ) : (
                                  <div
                                    className="badge badge-pill badge-outline-info"
                                    style={{ marginRight: "1rem" }}
                                  >
                                    New
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileOrders;
