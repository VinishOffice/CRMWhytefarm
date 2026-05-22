import React, { useContext, useEffect, useState } from "react";
import { CommunicationContext } from "../CommunicationContext";

const TrialUsersFilter = () => {
  const { setFilter, selectedDateTrailedUser, setSelectedDateTrailedUser } =
    useContext(CommunicationContext);
  const [isTrailedUserEnabled, setIsTrailedUserEnabled ] = useState(false)
  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 2);
  const minDateString = minDate.toISOString().split("T")[0];

  
  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      TrailedUser: {status: isTrailedUserEnabled, date: selectedDateTrailedUser},
    }));
  }, [isTrailedUserEnabled, selectedDateTrailedUser]);


  return (
    <div
      className="card p-3 bg-light shadow-sm d-flex flex-column gap-3"
      style={{ minWidth: "250px", maxHeight: "200px" }}
    >
      <div
        className="filter-box d-flex flex-column gap-3"
        style={{ maxWidth: "500px" }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">
            Trial Users
            <span className="text-danger ms-1">*</span>
          </h5>
        {/* Styled Checkbox */}
      <input
        type="checkbox"
        checked={isTrailedUserEnabled}
        onChange={() => setIsTrailedUserEnabled(!isTrailedUserEnabled)}
        className="form-check-input"
        style={{ width: "20px", height: "20px", cursor: "pointer" }}
      />
        </div>

        {/* Date Selector */}
        {/* Min and Max Input Fields */}
    <div
      className="d-flex flex-column gap-2 p-2 rounded"
      style={{
        transition: "all 0.3s ease",
        filter: isTrailedUserEnabled ? "none" : "blur(3px)", // Blur effect
        pointerEvents: isTrailedUserEnabled ? "auto" : "none", // Prevent interaction
        backgroundColor: isTrailedUserEnabled ? "transparent" : "#f8f9fa", // Slightly grey background when disabled
      }}
    >
        <div className="d-flex flex-row align-items-center justify-content-center gap-2">
          <label htmlFor="date-picker" className="form-label fw-bold mb-0">
            Form Date:
          </label>
          <input
            id="date-picker"
            type="date"
            className="form-control"
            style={{ maxWidth: "60%" }}
            value={selectedDateTrailedUser}
            onChange={(e) => setSelectedDateTrailedUser(e.target.value)}
            min={minDateString}
            max={maxDate}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

export default TrialUsersFilter;
