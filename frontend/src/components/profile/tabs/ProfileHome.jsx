import React, { useState } from "react";
import Swal from "sweetalert2";
import { toDate } from "../../../utils/dateUtils";
import apiClient from "../../../services/apiClient";
import { createCustomerActivity } from "../../../services/customerActivitiesService";
import moment from "moment";
import ProfileDeliveryExecutive from "./ProfileDeliveryExecutive";



const ProfileHome = ({

  data,
  hubData,
  deliveryExecutives,
  loggedIn_user,
  permissible_roles,
  navi,
  triggerCallAPI,
  params,
  openWallet,
  rolePermission,
  openCalendar,
  openDF,
  openCredit,
  openCash,
  openSRL,
}) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [alltranteAddress, setAlltranteAddress] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [instruction, setInstruction] = useState("");

  const handleOpenAddressModal = () => setShowAddressModal(true);
  const handleCloseAddressModal = () => setShowAddressModal(false);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => setInstruction(e.target.value);
 


  const handleSaveAddress = async () => {
    if (!alltranteAddress.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Please enter an alternate address.",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const customerSnapshot = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }]
      }).then(res => res.data?.data || []);

      if (customerSnapshot.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Customer not found!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      const customerDoc = customerSnapshot[0];
      await apiClient.patch(`/api/customers_data/${customerDoc._id}`, {
        backend_instructions: alltranteAddress,
        updated_at: new Date(),
      });

      await createCustomerActivity({
        description: `Backend Instruction updated to "${alltranteAddress}" by ${loggedIn_user}`,
        customer_phone: customerDoc.customer_phone,
        customer_id: customerDoc.customer_id,
        customer_name: customerDoc.customer_name,
        created_date: new Date().toISOString(),
        object: "Address Update",
        action: "Update",
        user: loggedIn_user,
      });

      Swal.fire({
        icon: "success",
        title: "Alternate address updated successfully!",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      setAlltranteAddress("");
      handleCloseAddressModal();
    } catch (error) {
      console.error("❌ Error updating alternate address:", error);
      Swal.fire({
        icon: "error",
        title: "Error occurred while updating address",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleSaveInstruction = async () => {
    if (!instruction.trim()) return;

    try {
      const customerSnapshot = await apiClient.post("/api/customers_data/query", {
        filters: [{ field: "customer_id", op: "==", value: params.id }]
      }).then(res => res.data?.data || []);

      if (customerSnapshot.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Customer not found!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      const customerData = customerSnapshot[0];
      const deliveryExeId = customerData.delivery_exe_id;

      if (!deliveryExeId) {
        Swal.fire({
          icon: "error",
          title: "No delivery executive assigned!",
          toast: true,
          background: "#69aba6",
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      await apiClient.patch(`/api/customers_data/${customerData._id}`, {
        instruction: instruction,
        timestamp: new Date(),
      });

      await createCustomerActivity({
        description: `Special instruction updated to "${instruction}" by ${loggedIn_user}`,
        customer_phone: customerData.customer_phone,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
        delivery_exe_id: deliveryExeId,
        created_date: new Date().toISOString(),
        object: "Instruction Update",
        action: "Update",
        user: loggedIn_user,
      });

      Swal.fire({
        icon: "success",
        title: "Instruction updated successfully!",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      setInstruction("");
      handleCloseModal();
    } catch (error) {
      console.error("❌ Error saving/updating instruction:", error);
      Swal.fire({
        icon: "error",
        title: "Error occurred while saving instruction",
        toast: true,
        background: "#69aba6",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  return (
    <div className="row">
      <div className="col-md-6 grid-margin stretch-card">
        <div className="card">
          <span
            style={{
              display: "flex",
              justifyContent: "end",
              paddingRight: "21px",
              paddingTop: "4px",
            }}
          >
            <i
              className="menu-icon mdi mdi-pencil"
              onClick={() => navi(data.data && data.data.customer_id)}
              style={{
                color: "grey",
                cursor: "pointer",
                fontSize: "23px",
                paddingLeft: "5px",
              }}
            ></i>
          </span>
          <div className="card-body">
            <div className="pb-2" style={{ textAlign: "center" }}>
              <img
                src={
                  data.data && data.data.customer_image
                    ? data.data.customer_image
                    : "https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
                }
                className="img-lg rounded-circle mb-2"
                alt="profile image"
              />
              <h4>{data.data && data.data.customer_name}</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <p className="text-muted mb-0">
                  <i className="ti-mobile"></i> +91-
                  {data.data && data.data.customer_phone}
                </p>
                <button
                  className="btn btn-primary btn-rounded btn-sm"
                  style={{ padding: "4px 8px" }}
                  onClick={() => triggerCallAPI(data.data.customer_phone)}
                >
                  <span>Call</span>
                </button>
              </div>
            </div>
            <div className="border-top pt-4">
              <h5 className="card-title">
                Address <i className="ti-home"></i>
              </h5>
            </div>
            <div className="row">
              <div className="col-md-6">
                <address>
                  <p className="fw-bold">{data.data && data.data.customer_address}</p>
                  <p>{data.data && data.data.location}</p>
                  <p>{data.data && data.data.hub_name}</p>
                  <p>{data.data && data.data.pincode}</p>
                </address>

                <address>
                  <p
                    className="fw-bold text-primary"
                    onClick={handleOpenAddressModal}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="ti-pencil"></i>Backend Instructions
                  </p>
                  {data.data?.backend_instructions && (
                    <p>{data.data.backend_instructions}</p>
                  )}
                </address>
              </div>

              <div className="col-md-6">
                <address className="text-primary">
                  <p className="fw-bold">
                    E-mail <i className="ti-email"></i>
                  </p>
                  <p className="mb-2">{data.data && data.data.customer_email}</p>
                  <p className="fw-bold">
                    Landmark <i className="ti-location-pin"></i>
                  </p>
                  <p>{data.data && data.data.landmark}</p>
                  <br />
                  <p className="fw-bold">
                    Alternate Contact Number <i className="ti-mobile"></i>
                  </p>
                  <p>{data.data && data.data.alt_phone}</p>
                </address>
              </div>
            </div>
            {showAddressModal && (
              <div className="modal d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title text-dark">Enter Backend Instructions</h5>
                      <button
                        type="button"
                        className="close"
                        onClick={handleCloseAddressModal}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="form-floating">
                        <textarea
                          className="form-control"
                          value={alltranteAddress}
                          onChange={(e) => setAlltranteAddress(e.target.value)}
                          placeholder="Leave a Instruction here"
                          id="floatingTextarea2"
                          style={{ height: "100px" }}
                        ></textarea>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={handleCloseAddressModal}>
                        Close
                      </button>
                      <button className="btn btn-success" onClick={handleSaveAddress}>
                        Save Address
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="card-body">
            <div className="border-top pt-3">
              <div className="row" style={{ textAlign: "center" }}>
                <div className="col-3">
                  <h6 style={{ fontWeight: "500", color: "grey" }}>ID</h6>
                  <p>{data.data && data.data.customer_id}</p>
                </div>
                <div className="col-3">
                  <h6 style={{ fontWeight: "500", color: "grey" }}>Category</h6>
                  <p>{data.data && data.data.customer_category}</p>
                </div>
                <div className="col-6">
                  <h6 style={{ fontWeight: "500", color: "grey" }}>Registered On</h6>
                  <p>
                    {data.data &&
                      moment(toDate(data.data.created_date)?.toISOString()).format(
                        "DD-MM-YYYY, h:mm a"
                      )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6 grid-margin">
        <div className="row mb-4">
          {/* Row 1 */}
          <div className="col-md-4 mb-3" style={{ cursor: "pointer" }}>
            <div className="card h-100 custom-green text-white shadow-sm border-0" onClick={() => permissible_roles?.includes("edit_wallet") ? openWallet() : rolePermission()}>
              <div className="card-body p-3 d-flex flex-column justify-content-center">
                <span style={{ fontSize: "13px", fontWeight: "600" }}><i className="icon-wallet me-1"></i> Wallet</span>
                <h5 className="mt-3 mb-0 fw-bold" style={{ fontSize: "20px" }}>₹ {data.data?.wallet_balance || "0"}</h5>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3" style={{ cursor: "pointer" }}>
            <div className="card h-100 shadow-sm border-0" onClick={() => openCalendar()}>
              <div className="card-body p-3 d-flex align-items-center">
                <span className="text-primary" style={{ fontSize: "13px", fontWeight: "600" }}>Calendar</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3" style={{ cursor: "pointer" }}>
            <div className="card h-100 shadow-sm border-0" onClick={() => permissible_roles?.includes("delivery_prefrence") ? openDF() : rolePermission()}>
              <div className="card-body p-3 d-flex align-items-center">
                <span className="text-primary" style={{ fontSize: "13px", fontWeight: "600" }}>Delivery<br/>Preference</span>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="col-md-4 mb-0" style={{ cursor: "pointer" }}>
            <div className="card h-100 custom-green text-white shadow-sm border-0" onClick={() => openCredit && openCredit()}>
              <div className="card-body p-3 d-flex flex-column justify-content-center">
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Credit Limit</span>
                <h5 className="mt-3 mb-0 fw-bold" style={{ fontSize: "20px" }}>₹ {data.data?.credit_limit || "0"}</h5>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-0" style={{ cursor: "pointer" }}>
            <div className="card h-100 shadow-sm border-0" onClick={() => permissible_roles?.includes("cash_collection") ? openCash() : rolePermission()}>
              <div className="card-body p-3 d-flex align-items-center">
                <span className="text-primary" style={{ fontSize: "13px", fontWeight: "600" }}>Cash Collection</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-0" style={{ cursor: "pointer" }}>
            <div className="card h-100 shadow-sm border-0" onClick={() => openSRL()}>
              <div className="card-body p-3 d-flex align-items-center">
                <span className="text-primary" style={{ fontSize: "13px", fontWeight: "600" }}>Copy Recharge<br/>Link</span>
              </div>
            </div>
          </div>
        </div>
        <ProfileDeliveryExecutive
          hubData={hubData}
          deliveryExecutives={deliveryExecutives}
          data={data}
          handleOpenModal={handleOpenModal}
        />
        {showModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-dark">Enter Special Instructions</h5>
                  <button type="button" className="close" onClick={handleCloseModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      value={instruction}
                      onChange={handleInputChange}
                      id="floatingTextarea2"
                      style={{ height: "100px" }}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseModal}>
                    Close
                  </button>
                  <button className="btn btn-success" onClick={handleSaveInstruction}>
                    Save Instruction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHome;
