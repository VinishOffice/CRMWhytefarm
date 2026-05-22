import React from "react";

const ProfileDeliveryExecutive = ({
  hubData,
  deliveryExecutives,
  data,
  handleOpenModal,
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h4 className="card-title">Delivery Executive</h4>
            <p>
              <span style={{ fontSize: "12px", fontWeight: "600" }}>Hub Name</span> :{" "}
              <span style={{ fontWeight: "500", fontSize: "11px", color: "grey" }}>
                {hubData.hub_name}
              </span>
            </p>
          </div>
          <img
            src={
              hubData.image
                ? hubData.image
                : "https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg"
            }
            className="img-lg rounded-circle mb-2"
            alt="profile"
          />
        </div>
        <p
          style={{ fontWeight: "700", color: "grey", fontSize: "16px" }}
          className="card-description"
        >
          Details
        </p>
        <div className="row">
          <div className="col-md-6">
            <address>
              <p className="fw-bold">
                <i className="ti-user"></i> Name
              </p>
              <p>
                {deliveryExecutives.length > 0 && (
                  <>
                    {deliveryExecutives[0].first_name} {deliveryExecutives[0].last_name}
                  </>
                )}
              </p>
            </address>
            <address>
              <p className="fw-bold">
                <i className="ti-location-pin"></i> Location
              </p>
              <p>
                {hubData.address}, {hubData.city}
              </p>
              <p>{hubData.state}, India</p>
            </address>
          </div>
          <div className="col-md-6">
            <address className="text-primary">
              <p className="fw-bold">
                <i className="ti-mobile"></i> Phone No
              </p>
              <p className="mb-2">
                {deliveryExecutives.length > 0 && <>{deliveryExecutives[0].phone_no}</>}
              </p>
              <p className="fw-bold">Special Instructions</p>
              <div className="mb-2 text-dark">
                {data.data?.instruction && <p>{data.data.instruction}</p>}
              </div>
            </address>
            <button className="btn btn-sm btn-primary" onClick={handleOpenModal}>
              Special Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDeliveryExecutive;
