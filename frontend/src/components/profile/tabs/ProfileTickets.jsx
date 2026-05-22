import React from "react";
import { fromSecondsNanoseconds } from "../../../utils/dateUtils";

const ProfileTickets = ({
  ticketsData,
  addTickets,
  rolePermission,
  permissible_roles,
  HandleTicketAction,
  ticketActionOptions,
  OpenAttachment,
}) => {
  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <div className="home-tab">
            <div className="d-sm-flex align-items-center justify-content-between">
              <ul className="nav nav-tabs" role="tablist"></ul>
              <div>
                <div className="btn-wrapper">
                  {permissible_roles.includes("add_ticket") ? (
                    <a
                      href="#"
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => addTickets()}
                    >
                      <i className="icon-plus"></i>Add Tickets
                    </a>
                  ) : (
                    <a
                      href="#"
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => rolePermission()}
                    >
                      <i className="icon-plus"></i>Add Tickets
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-12 grid-margin grid-margin-md-0 stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Tickets</h4>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer Name</th>
                    <th>Customer Phone</th>
                    <th>Category</th>
                    <th>Sub-Category</th>
                    <th>Subject</th>
                    <th style={{ maxWidth: "450px" }}>Description</th>
                    <th>Order date</th>
                    <th>Preferred Mode</th>
                    <th>Attachment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsData.length ? (
                    ticketsData.map(({ ref, id, data }) => (
                      <tr key={id}>
                        <td>{data.ticket_id || "-"}</td>
                        <td>{data.customer_name || "-"}</td>
                        <td>{data.customer_phone || "-"}</td>
                        <td>{data.category || "-"}</td>
                        <td>{data.sub_category || "-"}</td>
                        <td
                          style={{
                            maxWidth: "150px",
                            wordBreak: "keep-all",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {data.subject || "-"}
                        </td>
                        <td
                          style={{
                            maxWidth: "300px",
                            wordBreak: "keep-all",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {data.description || "-"}
                        </td>
                        <td>
                          {data.order_date
                            ? fromSecondsNanoseconds(
                                data.order_date?.seconds,
                                data.order_date?.nanoseconds
                              ).toLocaleDateString()
                            : "Not Selected"}
                        </td>
                        <td>{data.preferred_mode || "-"}</td>
                        <td>
                          {data.attachment && data.attachment.length > 0 ? (
                            data.attachment.map((link, idx) => (
                              <img
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  display: "inline",
                                  cursor: "pointer",
                                }}
                                src={link}
                                key={idx}
                                alt="issue"
                                onClick={() => OpenAttachment(link)}
                              />
                            ))
                          ) : (
                            <p>No Attachments</p>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              borderRadius: "10px",
                              padding: "5px 10px",
                              backgroundColor: `${
                                data.status === "Resolved"
                                  ? "#83bf91"
                                  : data.status === "In Progress"
                                  ? "#EEF25E"
                                  : "#C6CACE"
                              }`,
                              color: "white",
                            }}
                          >
                            {data.status}
                          </span>
                        </td>
                        <td>
                          {data.status === "Resolved" ? (
                            "-"
                          ) : (
                            <select
                              className="form-select form-select-sm"
                              value={data.status}
                              onChange={(e) => HandleTicketAction(ref, e.target.value, data)}
                              style={{ borderRadius: "10px" }}
                            >
                              {ticketActionOptions.map((opt) => (
                                <option value={opt} key={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        No Active Ticket Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileTickets;
