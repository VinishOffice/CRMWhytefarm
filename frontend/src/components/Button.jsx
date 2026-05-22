import React, { useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
const SelectButton = ({ isSelected, setIsSelected }) => {
  const toggleSelection = () => {
    setIsSelected(!isSelected);
  };

  return (
    <button
      className={`  ${isSelected ? "btn-success" : "btn-secondary"}`}
      onClick={toggleSelection}
      style={{ display: "flex", alignItems: "center" }}
    >
      {isSelected ? <FaCheck /> : <FaTimes />} {/* Optional icons */}
      <span className="ms-2">{isSelected ? "Selected" : "Unselected"}</span>
    </button>
  );
};

const ApplyButton = ({label, handleApply}) => {
  return (
    <div className="d-flex justify-content-end mt-2 ">
      <button
        style={{
          background: "linear-gradient(90deg, #4caf50, #8bc34a)",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "16px",
          cursor: "pointer",
          transition: "background 0.3s ease",
        }}
        onClick={handleApply}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(90deg, #8bc34a, #4caf50)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(90deg, #4caf50, #8bc34a)";
        }}
      >
       {label || 'Apply'}
      </button>
    </div>
  );
};
