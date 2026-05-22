import React, { useContext, useState } from "react";
import CheckboxGroup from "./CheckboxGroup";
import { CommunicationContext } from "../CommunicationContext";
import moment from "moment";
import { sendSMS } from "../WATI API FUNCTIONS/sendSMS";

const CampaignDetailsForm = () => {
  const {
    title,
    setTitle,
    message,
    setMessage,
    selectedValue,
    setSelectedValue,
    data,
  } = useContext(CommunicationContext);

  // Validation states
  const [titleError, setTitleError] = useState(true);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (e.target.value.trim() !== "") setTitleError(false);
    else setTitleError(true);
  };





  return (
    <div className="card-body bg-light rounded m-4">
      <div className="row mb-3">
        <div className="col-md-6">
          {/* Title Input */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <label className="card-title mb-0" style={{ minWidth: "70px" }}>
              Title<span style={{ color: "red" }}>*</span>
            </label>
            <div style={{ width: "100%" }}>
              <input
                className={`form-control ${titleError ? "border-danger" : ""}`}
                type="text"
                placeholder="Enter campaign title"
                id="title"
                name="title"
                value={title}
                onChange={handleTitleChange}
              />
              {titleError && <small className="text-danger">Title is required</small>}
            </div>
          </div>

          {/* Customer Found */}


          {/* Date */}

        </div>

        {/* Platform Medium */}
        <div className="col-md-6">
          <CheckboxGroup
            property={"Platform"}
            options={[
              { value: "SMS", label: "SMS", id: "sms" },
              { value: "WhatsApp", label: "WhatsApp", id: "whatsapp" },

            ]}
            selectedValues={selectedValue}

            
            onChange={setSelectedValue}
          />
          {selectedValue.length===0 && <small className="text-danger">Select at least one platform</small>}
        </div>
      </div>

    </div>
  );
};

export default CampaignDetailsForm;
