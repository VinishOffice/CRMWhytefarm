import React from "react";

const CheckboxGroup = ({ property, options, selectedValues, onChange, aling = "row" }) => {
  const handleValueChange = (value) => {
    onChange((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSelectAll = () => {
    const isAllSelected = selectedValues.length === options.length;
    onChange(isAllSelected ? [] : options.map((option) => option.value));
  };

  return (
    <div
      className="filter-box"
      style={{
        width: "100%",
        maxWidth: "500px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="card-title mb-0">
        {property.split('_').map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(" ")}
          <span className="text-danger ms-1">*</span>
        </h5>
      </div>
  
      {/* Checkbox Group */}
      <div
        className={`d-flex ${aling === "column" ? "flex-column" : "flex-row flex-wrap"} gap-2`}
        style={{
          minWidth: "150px",
          alignItems: "flex-start",
          maxWidth: "100%",
        }}
      >
        {/* Select All Option */}
        { options && !(options[0]?.selectall) &&
        <div
          className={`p-2 border rounded d-flex align-items-center justify-content-between shadow-sm ${
            selectedValues.length === options.length ? "border-primary bg-light" : "border-secondary"
          }`}
          onClick={handleSelectAll}
          style={{
            cursor: "pointer",
            backgroundColor: "white",
            flex: "1 1 calc(50% - 10px)",
          }}
        >
          <div className="d-flex align-items-center">
            <input
              className="form-check-input me-2"
              type="checkbox"
              id={`${property}-select-all`}
              checked={selectedValues.length === options.length}
              readOnly
            />
            <label className="form-check-label fw-bold" htmlFor={`${property}-select-all`}>
              Select All
            </label>
          </div>
          <span className="badge bg-primary">
            {selectedValues.length}/{options.length}
          </span>
        </div>
        }
  
        {/* Individual Options */}
        {options.map(({ value, label, id }) => (
          <div
            key={id}
            className={`p-2 border rounded d-flex align-items-center shadow-sm ${
              selectedValues.includes(label) ? "border-primary bg-light" : "border-secondary"
            }`}
            onClick={() => handleValueChange(value)}
            style={{
              cursor: "pointer",
              backgroundColor: "white",
              flex: "1 1 calc(50% - 10px)",
            }}
          >
            <input
              className="form-check-input me-2"
              type="checkbox"
              id={`${property}-${id}`}
              checked={selectedValues.includes(value)}
              readOnly
            />
            <label className="form-check-label fw-bold" htmlFor={`${property}-${id}`}>
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default CheckboxGroup;
