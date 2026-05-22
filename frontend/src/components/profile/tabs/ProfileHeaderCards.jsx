import React from "react";

const ProfileHeaderCards = ({
  data,
  permissible_roles,
  openWallet,
  rolePermission,
  openCalendar,
  openDF,
  openCredit,
  openCash,
  openSRL,
}) => {
  return (
    <div className="col-md-12 grid-margin">
      <div className="row">
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start custom-green">
            <div
              className="card-body"
              onClick={() =>
                permissible_roles.includes("edit_wallet") ? openWallet() : rolePermission()
              }
            >
              <div className="d-flex flex-row align-items-start">
                <span
                  style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}
                  className="text-facebook"
                >
                  <i className="icon-wallet" style={{ marginRight: "6px" }}></i> Wallet
                </span>
              </div>
              <p className="mt-2 text-muted card-text custom-card-text">
                ₹ {data.data?.wallet_balance === 0 ? 0.0 : data.data?.wallet_balance || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start custom-green">
            <div
              className="card-body"
              onClick={() =>
                permissible_roles.includes("edit_wallet") ? openCredit() : rolePermission()
              }
            >
              <div className="d-flex flex-row align-items-start">
                <span
                  style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}
                     className="text-facebook"
                >
                  <i  style={{ marginRight: "6px" }}></i> Credit Limit
                </span>
              </div>
              <p className="mt-2 text-muted card-text custom-card-text">
                ₹ {data.data?.credit_limit === 0 ? 0.0 : data.data?.credit_limit || "0"}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start">
            <div className="card-body" onClick={() => openCalendar()}>
              <div className="d-flex flex-row align-items-start">
                <span style={{ fontSize: "13px", fontWeight: "600" }} className="text-facebook">
                  Calendar
                </span>
              </div>
              <p className="mt-2 card-text" style={{ color: "white" }}>
                .....
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start">
            <div
              className="card-body"
              onClick={() =>
                permissible_roles.includes("delivery_prefrence") ? openDF() : rolePermission()
              }
            >
              <div className="d-flex flex-row align-items-start" style={{ marginBottom: "-1rem" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }} className="text-facebook">
                  Delivery Preference
                </span>
              </div>
              <p className="mt-2 card-text" style={{ color: "white" }}>
                .....
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start">
            <div
              className="card-body"
              onClick={() =>
                permissible_roles.includes("cash_collection") ? openCash() : rolePermission()
              }
            >
              <div className="d-flex flex-row align-items-start" style={{ marginBottom: "-1rem" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }} className="text-facebook">
                  Cash Collection
                </span>
              </div>
              <p className="mt-2 card-text" style={{ color: "white" }}>
                .....
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-2 grid-margin" style={{ cursor: "pointer" }}>
          <div className="card d-flex align-items-start">
            <div className="card-body" onClick={() => openSRL()}>
              <div className="d-flex flex-row align-items-start" style={{ marginBottom: "-1rem" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }} className="text-facebook">
                  Copy Recharge Link
                </span>
              </div>
              <p className="mt-2 card-text" style={{ color: "white" }}>
                .....
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCards;
