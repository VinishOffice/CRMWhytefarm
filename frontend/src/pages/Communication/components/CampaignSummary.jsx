import React, { useState, useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import { BsExclamationTriangleFill } from "react-icons/bs";
import moment from "moment";
import { CommunicationContext } from "../CommunicationContext";
import EmailPreview from "../preview/EmailPreview";
import { DateTimeUtil } from "../../../Utility"; // Ensure this path is correct

const CampaignSummary = ({ setReload, handleSend, launch, setLaunching, complete, setComplete, whatsappLog, setWhatsappLog, smsLog, setSmsLog, downloadCSV, handleDownload }) => {
  const {
    title,
    date,
    filter,
    selectedValue,
    msgData,
    summary,
    setSummary,
    handleDiscard,
    data,
    smsParamMap,
  } = useContext(CommunicationContext);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleLaunch1 = () => {
    setShowConfirm(true); 
  };

  const confirmLaunch = () => {
    setShowConfirm(false);
    handleSend(); 
  };

  const getBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case "custom": return "badge bg-warning text-dark"; 
      case "everyday": return "badge bg-secondary text-white"; 
      case "interval": return "badge bg-danger text-white"; 
      case "one-time": return "badge bg-primary text-white"; 
      default: return "badge bg-info text-dark"; 
    }
  };

  const getBadgeTextClass = (source) => {
    switch (source?.toLowerCase() || source) {
      case "instagram": return "badge bg-warning text-dark"; 
      case "add": return "badge bg-info text-dark"; 
      case "google": return "badge bg-danger";
      case "facebook": return "badge bg-primary text-white"; 
      default: return "badge bg-info text-dark";
    }
  };

  const getBadgeTextClassPlatform = (source) => {
    switch (source?.toLowerCase() || source) {
      case "ios": return "badge bg-warning text-dark"; 
      case "android": return "badge bg-info text-dark"; 
      case "website": return "badge bg-danger";
      case "backend": return "badge bg-primary text-white"; 
      default: return "badge bg-info text-dark";
    }
  };

  if (!summary) return null;

  return (
    <>
      {launch !== -1 && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            display: "flex", justifyContent: "center", alignItems: "center",
            backdropFilter: "blur(10px)", backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: 9999,
          }}
        >
          {launch !== 6 && (
            <div className="text-center text-white">
              <div className="spinner-border text-light" style={{ width: "4rem", height: "4rem" }} role="status"></div>
              <p className="mt-3 fw-semibold">
                {launch === 0 && "Checking user login data..."}
                {launch === 1 && "Preparing data..."}
                {launch === 2 && "Sending SMS..."}
                {launch === 3 && "Sending Email..."}
                {launch === 4 && "Sending WhatsApp message..."}
                {launch === 5 && "Sending campaign summary to the backend..."}
              </p>
              <p className="fw-semibold mt-2">
                Ensure a <span className="fw-bold text-warning">stable network connection</span> and <span className="fw-bold text-warning">keep the system running</span> to avoid interruptions.
              </p>
            </div>
          )}

          {launch === 6 && (
            <div
              className="d-flex flex-column justify-content-center align-items-center rounded shadow-lg p-4"
              style={{ width: "400px", backgroundColor: "#f8f9fa", color: "#212529", textAlign: "center" }}
            >
              <i className="bi bi-check-circle-fill text-success display-4 mb-3"></i>
              <h5 className="mb-2 fw-bold">Message Sent Successfully!</h5>
              <p className="text-muted mb-3">Would you like to download all reports?</p>
              <div className="d-flex gap-3">
                <button
                  className="btn btn-success px-4 fw-bold"
                  onClick={() => {
                    handleDownload(true);
                    setLaunching(-1);
                    handleDiscard();
                    window.location.reload();
                  }}
                >
                  Yes, Download
                </button>
                <button
                  className="btn btn-outline-secondary px-4 fw-bold"
                  onClick={() => {
                    setLaunching(-1);
                    handleDiscard();
                    window.location.reload();
                  }}
                >
                  No, Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!complete && (
        <div
          className="loader-overlay w-100 d-flex align-items-center justify-content-center"
          style={{
            backdropFilter: "blur(8px)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="bg-light p-4 rounded shadow-lg"
            style={{ width: "80%", minWidth: "700px", maxHeight: "90%", overflowY: "auto", overflowX: "hidden" }}
          >
            <h3 className="text-center text-primary mb-4">Campaign Summary</h3>
            <div className="d-flex justify-content-end mb-4">
              <button className="btn btn-outline-success btn-sm me-2" onClick={() => setSummary(false)}>Edit</button>
              <button className="btn btn-warning btn-sm" onClick={handleLaunch1}>Launch</button>
            </div>

            <Modal style={{ zIndex: 9998 }} show={showConfirm} onHide={() => setShowConfirm(false)} centered>
              <Modal.Body className="bg-primary text-white text-center rounded-top p-4">
                <BsExclamationTriangleFill className="fs-1 text-warning mb-3" />
                <h4 className="fw-bold">Confirm Your Action</h4>
                <p className="mb-2">This will send messages to <span className="fw-bold">all selected customers</span>. Ensure your filters are correct.</p>
                <p className="fw-semibold">Ensure a <span className="fw-bold text-warning">stable network connection</span> and <span className="fw-bold text-warning">keep the system running</span>.</p>
              </Modal.Body>
              <Modal.Footer className="border-0 justify-content-center bg-primary rounded-bottom">
                <Button variant="secondary" className="px-4 fw-bold" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button variant="success" className="px-4 fw-bold" onClick={confirmLaunch}>Yes, Proceed</Button>
              </Modal.Footer>
            </Modal>

            {/* Campaign Details */}
            <div className="mb-4 p-3 border rounded shadow-sm">
              <h5 className="fw-bold mb-3">Campaign Details <sup className="text-danger">*</sup></h5>
              <div className="row">
                <div className="col-md-6 d-flex flex-column align-items-start ps-2">
                  <div className="mb-2 w-100">
                    <span className="fw-semibold">Title:</span>
                    {title === "" ? <span className="text-danger ms-2">Please provide a campaign title</span> : <span className="ms-2">{title}</span>}
                  </div>
                  <div className="mb-2 w-100"><span className="fw-semibold">Date:</span><span className="ms-2">{date}</span></div>
                </div>
                <div className="col-md-6 d-flex flex-column align-items-start ps-2">
                  <div className="mb-2 w-100"><span className="fw-semibold">No. of Customers:</span><span className="badge bg-info text-dark ms-2">{data?.length}</span></div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 p-3 border rounded shadow-sm">
              <h5 className="fw-bold mb-3">Applied Filters <sup className="text-danger">*</sup></h5>
              {filter ? (
                <div className="row g-3">
                  <div className="col-md-6 d-flex flex-column align-items-start">
                    <div className="mb-2 w-100">
                      <span className="fw-semibold">Abandoned Cart:</span>
                      {filter?.AbandendCart?.status && filter?.AbandendCart?.date && (
                        <span className="badge bg-primary text-white ms-2">Last Update : {moment(filter.AbandendCart.date).format("DD/MM/YYYY")}</span>
                      )}
                    </div>
                    <div className="mb-2 w-100">
                      <span className="fw-semibold">Status:</span>
                      {filter?.status?.map((type, index) => <span key={index} className="badge bg-primary text-white ms-2">{type}</span>)}
                    </div>
                    <div className="mb-2 w-100">
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <span className="fw-semibold">Platform:</span>
                        {filter.platform.map((plat, index) => <span key={index} className="badge bg-dark text-white">{plat}</span>)}
                      </div>
                    </div>
                    <div className="mb-2 w-100">
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <span className="fw-semibold">Subscription Type:</span>
                        {filter.subscription_type.map((type, index) => <span key={index} className="badge bg-success text-white">{type}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 d-flex flex-column align-items-start">
                    <div className="mb-2 w-100">
                      <span className="fw-semibold">Trial Users:</span>
                      {filter?.TrailedUser?.status ? <span className="badge bg-primary text-white ms-2">From :{moment(filter.TrailedUser.date).format("DD/MM/YYYY")}</span> : null}
                    </div>
                    <div className="mb-2 w-100">
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <span className="fw-semibold">Source:</span>
                        {filter.source.map((src, index) => <span key={index} className="badge bg-warning text-dark">{src}</span>)}
                      </div>
                    </div>
                    <div className="mb-2 w-100">
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <span className="fw-semibold">Hub Locations:</span>
                        {filter.hub.map((h, index) => <span key={index} className="badge bg-primary text-white">{h}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : <p className="text-danger">Please select customer status</p>}
            </div>

            {/* Customer Details Table */}
            <div className="mb-4 p-3 border rounded shadow-sm">
              <h5 className="fw-bold mb-3">Customer Details</h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Phone</th>
                      {filter?.status?.length > 0 && <th>Status</th>}
                      {filter?.platform?.length > 0 && <th>Platform</th>}
                      {filter?.subscription_type?.length > 0 && <th>Subscription Type</th>}
                      {filter?.source?.length > 0 && <th>Source</th>}
                      {filter?.hub?.length > 0 && <th>Hub Location</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.length > 0 ? data.map((customer, index) => (
                      <tr key={index} className="align-middle cursor-pointer" onClick={() => customer.customer_id && window.open(`/profile/${customer.customer_id}`, "_blank", "noopener,noreferrer")}>
                        <td>{customer?.customer_name}</td><td>{customer?.customer_email}</td><td>{customer?.customer_phone}</td>
                        {filter?.status?.length > 0 && <td>{customer?.status}</td>}
                        {filter?.platform?.length > 0 && <td><span className={`${getBadgeTextClassPlatform(customer?.platform)} ms-2`}>{customer?.platform}</span></td>}
                        {filter?.subscription_type?.length > 0 && (
                          <td>
                            {customer?.subscriptionType?.map((type, idx) => <span key={idx} className={`${getBadgeClass(type)} ms-2`}>{type}</span>)}
                          </td>
                        )}
                        {filter?.source?.length > 0 && <td><span className={`${getBadgeTextClass(customer?.source)} ms-2`}>{customer?.source}</span></td>}
                        {filter?.hub?.length > 0 && <td>{customer?.hub_name}</td>}
                      </tr>
                    )) : <tr><td className="text-center" colSpan="10">No customers found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignSummary;
