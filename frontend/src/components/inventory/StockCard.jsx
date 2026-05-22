import React, { useState } from "react";

const StockCard = ({ title, value, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="card d-flex align-items-start m-2"
      style={{
        cursor: "pointer",
        minWidth: "100px",
        backgroundColor: hovered ? "#84BF93" : "",
        color: hovered ? "white" : "",
        border: hovered ? "1px solid #f8f9fa" : "",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-body w-100">
        <p
          className="statistics-title text-end font-bold"
          style={{ fontSize: "1rem" }}
        >
          {title}
        </p>
        <h3 className="rate-percentage text-end">{value}</h3>
      </div>
    </div>
  );
};

export default StockCard;
