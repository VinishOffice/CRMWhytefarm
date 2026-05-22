import React, { useContext, useEffect, useState } from "react";
import { CommunicationContext } from "../CommunicationContext";

const AbandonedCartFilter = () => {
  const { setFilter, selectedDateAbandonedCart, setSelectedDateAbandonedCart } =
    useContext(CommunicationContext);
    
  const [isAbandonedCartEnabled, setIsAbandonedCartEnabled] = useState(false);
  
  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 2);
  const minDateString = minDate.toISOString().split("T")[0];


  useEffect(() => {
      setFilter((prev) => ({
        ...prev,
        AbandendCart: {status: isAbandonedCartEnabled, date: selectedDateAbandonedCart},
      }));
    }, [isAbandonedCartEnabled, selectedDateAbandonedCart]);


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
            Abandoned Cart
            <span className="text-danger ms-1">*</span>
          </h5>
          {/* Styled Checkbox */}
          <input
            type="checkbox"
            checked={isAbandonedCartEnabled}
            onChange={() => setIsAbandonedCartEnabled(!isAbandonedCartEnabled)}
            className="form-check-input"
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
        </div>

        {/* Date Selector */}
        <div
          className="d-flex flex-column gap-2 p-2 rounded"
          style={{
            transition: "all 0.3s ease",
            filter: isAbandonedCartEnabled ? "none" : "blur(3px)",
            pointerEvents: isAbandonedCartEnabled ? "auto" : "none",
            backgroundColor: isAbandonedCartEnabled ? "transparent" : "#f8f9fa",
          }}
        >
          <div className="d-flex flex-row align-items-center justify-content-center gap-2">
            <label htmlFor="abandoned-cart-date" className="form-label fw-bold mb-0">
              Last Update:
            </label>
            <input
              id="abandoned-cart-date"
              type="date"
              className="form-control"
              style={{ maxWidth: "60%" }}
              value={selectedDateAbandonedCart}
              onChange={(e) => setSelectedDateAbandonedCart(e.target.value)}
              min={minDateString}
              max={maxDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCartFilter;
