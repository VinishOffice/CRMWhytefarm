import React from "react";
import { Button } from "react-bootstrap";

const ExportToCSV = ({ csvColumns, csvData, CSV_FileName }) => {
  const exportToCSV = () => {
    const escapeCSV = (text) => {
      if (text === null || text === undefined) return '';
      const value = text.toString().replace(/"/g, '""'); // Escape double quotes
      return `"${value}"`; // Wrap in quotes
    };

    const csvRows = csvData.map((row) =>
      row.map(cell => escapeCSV(cell)).join(",")
    );
    const csvContent = [csvColumns.map(escapeCSV).join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${CSV_FileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={exportToCSV} className="btn btn-success btn-rounded btn-sm">
      Export CSV
    </button>
  );
};

export default ExportToCSV;
