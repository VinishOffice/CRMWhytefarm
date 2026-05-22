import React from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
import { toDate } from "../../../utils/dateUtils";

const ProfileActivities = ({
  activitiesData,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleDateRange,
  resetActivities,
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
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From Date"
                    className="form-control"
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
                  />
                  <button
                    className="btn btn-primary text-white me-0 mr-2"
                    onClick={() => handleDateRange()}
                    style={{ marginTop: "9px", marginLeft: "14px" }}
                  >
                    <i className="icon-search"></i>Search
                  </button>
                  <button
                    className="btn btn-primary text-white me-0 mr-2"
                    onClick={() => resetActivities()}
                    style={{ marginTop: "9px", marginLeft: "14px" }}
                  >
                    <i className="icon-reset"></i>Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Activities History</h4>
          <div className="container-fluid">
            <div className="row example-basic">
              <div className="col-xs-12 col-xs-offset-1 col-sm-12 col-sm-offset-2">
                <ul className="timeline">
                  {activitiesData?.map(({ id, data }) => (
                    <li className="timeline-item" key={id}>
                      <div className="timeline-info">
                        <span>
                          {moment(toDate(data.created_date)?.toISOString()).format(
                            "DD-MM-YYYY, h:mm a"
                          )}
                        </span>
                      </div>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <p>
                          {data.description}{" "}
                          {data.platform && <span>platform: {data.platform}</span>}
                        </p>
                        {data.changes && (
                          <div>
                            <h5>Changes:</h5>
                            <ul>
                              {Object.keys(data.changes).map((key) => (
                                <li key={key}>
                                  <strong>{key}:</strong>
                                  <span>
                                    {key === "due_date"
                                      ? (() => {
                                          try {
                                            const oldDate = moment(
                                              toDate(data.changes[key].old)?.toISOString()
                                            ).format("DD-MM-YYYY, h:mm a");
                                            const newDate = moment(
                                              toDate(data.changes[key].new)?.toISOString()
                                            ).format("DD-MM-YYYY, h:mm a");
                                            return `old: ${oldDate}, new: ${newDate}`;
                                          } catch (error) {
                                            return `old: ${data.changes[key].old}, new: ${data.changes[key].new}`;
                                          }
                                        })()
                                      : `old: ${data.changes[key].old}, new: ${data.changes[key].new}`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                  <li className="timeline-item period"></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileActivities;
