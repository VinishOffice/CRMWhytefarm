import React, { useContext, useEffect, useState } from "react";
import { CommunicationContext } from "./CommunicationContext";

const WalletFilter = () => {
  const { filter, setFilter } = useContext(CommunicationContext);
  const [isWalletEnabled, setIsWalletEnabled] = useState(false);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  const onChangeMin = (value) => {
    setMinValue(value);
  };

  const onChangeMax = (value) => {
    setMaxValue(value);
  };

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      wallet: { min: minValue, max: maxValue, status: isWalletEnabled },
    }));
  }, [minValue, maxValue, isWalletEnabled]);


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
            Wallet <span className="text-danger ms-1">*</span>
          </h5>
          {/* Styled Checkbox */}
          <input
            type="checkbox"
            checked={isWalletEnabled}
            onChange={() => setIsWalletEnabled(!isWalletEnabled)}
            className="form-check-input"
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
        </div>

        {/* Min and Max Input Fields */}
        <div
          className="d-flex flex-column gap-2 p-2 rounded"
          style={{
            transition: "all 0.3s ease",
            filter: isWalletEnabled ? "none" : "blur(3px)", // Blur effect
            pointerEvents: isWalletEnabled ? "auto" : "none", // Prevent interaction
            backgroundColor: isWalletEnabled ? "transparent" : "#f8f9fa", // Slightly grey background when disabled
          }}
        >
          {/* Minimum Balance */}
          <div className="d-flex flex-row align-items-center justify-content-center gap-2">
            <label htmlFor="wallet-min" className="form-label fw-bold mb-0">
              Min Balance:
            </label>
            <input
              id="wallet-min"
              type="number"
              className="form-control"
              style={{ maxWidth: "60%" }}
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              disabled={!isWalletEnabled}
            />
          </div>

          {/* Maximum Balance */}
          <div className="d-flex flex-row align-items-center justify-content-center gap-2">
            <label htmlFor="wallet-max" className="form-label fw-bold mb-0">
              Max Balance:
            </label>
            <input
              id="wallet-max"
              type="number"
              className="form-control"
              style={{ maxWidth: "60%" }}
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              disabled={!isWalletEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletFilter;
