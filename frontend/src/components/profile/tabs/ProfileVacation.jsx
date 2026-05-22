import React from "react";
import moment from "moment";
import Swal from "sweetalert2";
import { toDate } from "../../../utils/dateUtils";
import apiClient from "../../../services/apiClient";

const ProfileVacation = ({
  vacationData,
  setSelectedVacation,
  rolePermission,
  permissible_roles,
  params,
  setIsOnVacation,
  fetchVacationData,
  checkVacationStatus,
}) => {
  const handleDeleteVacation = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        apiClient.delete(`/api/customers_vacation/${id}`).then(() => {
          Swal.fire("Deleted!", "Data has been deleted.", "success");
          if (checkVacationStatus) {
            checkVacationStatus(params.id).then(setIsOnVacation);
          }
          fetchVacationData();
        });
      }
    });
  };

  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <div className="home-tab">
            <div className="d-sm-flex align-items-center justify-content-between">
              <ul className="nav nav-tabs" role="tablist"></ul>
              <div>
                <div className="btn-wrapper">
                  {permissible_roles.includes("add_vacation") ? (
                    <button
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => setSelectedVacation(null)}
                      data-bs-toggle="modal"
                      data-bs-target="#exampleModal-vacation"
                    >
                      <i className="icon-plus"></i>Add Vacation
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary text-white me-0 mr-2"
                      onClick={() => rolePermission()}
                    >
                      <i className="icon-plus"></i>Add Vacation
                    </button>
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
            <h4 className="card-title">CURRENT VACATIONS</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th className="pt-1 ps-0">Sr.No</th>
                    <th className="pt-1">Start Date</th>
                    <th className="pt-1">End Date</th>
                    <th className="pt-1">Source</th>
                    <th className="pt-1">Created On</th>
                    <th className="pt-1">Updated On</th>
                    <th className="pt-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vacationData?.map(({ id, data }, index) => (
                    <tr key={id}>
                      <td>{index + 1}</td>
                      <td>
                        {moment(toDate(data.start_date)?.toISOString()).format("DD-MM-YYYY")}
                      </td>
                      <td>
                        {moment(toDate(data.end_date)?.toISOString()).format("DD-MM-YYYY")}
                      </td>
                      <td>{data.source}</td>
                      <td>
                        {moment(toDate(data.created_date)?.toISOString()).format("DD-MM-YYYY")}
                      </td>
                      <td>
                        {moment(toDate(data.updated_date)?.toISOString()).format("DD-MM-YYYY")}
                      </td>
                      <td>
                        {permissible_roles.includes("edit_vacation") ? (
                          <button
                            style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                            onClick={() => setSelectedVacation({ ...data, _id: id })}
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModal-vacation"
                            className="btn btn-dark btn-sm"
                          >
                            <i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i>
                          </button>
                        ) : (
                          <button
                            style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                            onClick={() => rolePermission()}
                            className="btn btn-dark btn-sm"
                          >
                            <i className="menu-icon mdi mdi-pencil" style={{ color: "white" }}></i>
                          </button>
                        )}
                        <button
                          style={{ marginRight: "1rem", padding: "0.2rem 0.85rem" }}
                          className="btn btn-dark btn-sm"
                          onClick={() => handleDeleteVacation(id)}
                        >
                          <i className="menu-icon mdi mdi-delete" style={{ color: "white" }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileVacation;
