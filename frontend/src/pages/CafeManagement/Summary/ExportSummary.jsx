import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "react-datepicker/dist/react-datepicker.css";

const CustomerTable = ({ customers }) => (
  <div style={{ overflowY: "auto", maxHeight: "600px" }}>
    <table className="table table-striped" id="hub_delivery">
      <thead>
        <tr>
          <th>Sr No.</th>
          <th>Hub Name</th>
          <th>Product</th>
          <th>Delivered Quantity</th>
          <th>Pending Quantity</th>
          <th>Total Quantity</th>
        </tr>
      </thead>
      <tbody>
        {customers?.length > 0 ? (
          customers.map((customer, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{customer?.hub_name || "Hub Not Added"}</td>
              <td>{customer?.productName || "No data"}</td>
              <td>{Number(customer.delivered || 0)}</td>
              <td>{Number(customer.pending || 0)}</td>
              <td>
                {Number(customer.delivered || 0) +
                  Number(customer.pending || 0)}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center">
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const ExportSummary = ({ orderList, dateRange }) => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [customers, setCustomers] = useState([]);
  const exportTableToCSV = () => {
    const csvColumns = [
      "Sr.No",
      "Hub",
      "Product",
      "Delivered Quantity",
      "Pending Quantity",
      "Total Quantity",
    ];
    const csvRows = customers.map((customer, index) => {
      const rowData = [
        index + 1,
        customer.hub_name || "Hub Not Added",
        customer.productName || "No data",
        Number(customer.delivered || 0),
        Number(customer.pending || 0),
        Number(customer.delivered || 0) + Number(customer.pending || 0),
      ];
      return rowData;
    });
    const csvContent = [
      csvColumns.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_report.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const formatDate = (date) => {
    if (!(date instanceof Date)) {
      console.error("Input must be a Date object", date); 
      return null; 
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };
  const exportTableToPDF = () => {
    const userRole = localStorage.getItem("role");
    const table = document.getElementById("hub_delivery");
    table.style.display = "none";
    const doc = new jsPDF();
    const companyName = "WHYTE FARMS";
    const startDate = formatDate(new Date(dateRange.start));
    const endDate = formatDate(new Date(dateRange.end));
    let totalHubs = 0;

    if (userRole === "Admin") {
      totalHubs = new Set(customers.map((customer) => customer.hub_name)).size;
    }

    doc.setFontSize(20);
    doc.text(companyName, 20, 10);

    doc.setFontSize(16);
    doc.text("Order Summary", 20, 20);

    doc.setFontSize(12);
    doc.text(`from ${startDate} to ${endDate}`, 20, 30);

    if (userRole === "Admin") {
      doc.text(`Total Number of Hubs: ${totalHubs}`, 20, 40);
    }
    if ( userRole === "Hub Manager") {
      doc.text(`Hub Name: ${localStorage.getItem("hub_name")}`, 20, 40);
    }

    doc.line(20, 45, 190, 45);
    doc.text("", 20, 50);

    const pdfData = customers.map((customer, index) => [
      index + 1,
      customer.hub_name || "Hub Not Added",
      customer.productName || "No data",
      Number(customer.delivered || 0),
      Number(customer.pending || 0),
      Number(customer.delivered || 0) + Number(customer.pending || 0),
    ]);
    if(customers.length === 0){
      doc.text("No data available", 20, 60);
    }
    const headers = userRole === "Admin" 
      ? [["Sr No.", "Hub Name", "Product", "Delivered Quantity", "Pending Quantity", "Total Quantity"]] 
      : [["Sr No.", "Product", "Delivered Quantity", "Pending Quantity", "Total Quantity"]];

    doc.autoTable({
      head: headers,
      body: pdfData,
      startY: 55,
      theme: "grid",
      headStyles: {
        fillColor: [74, 84, 186],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        cellPadding: 5,
        fontSize: 10, // Adjusted font size if needed
        halign: "center",
        valign: "middle",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [241, 241, 241],
      },
    });

    doc.save("summary_report.pdf");
    table.style.display = "table";
  };

  const exportTableToEXL = () => {
    const table = document.getElementById("hub_delivery");
    const worksheet = XLSX.utils.table_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    const headerCellRange = XLSX.utils.decode_range(worksheet["!ref"]);
    const headerRow = headerCellRange.s.r;

    for (let col = headerCellRange.s.c; col <= headerCellRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ c: col, r: headerRow });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: {
            fgColor: { rgb: "4A54BA" },
          },
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
          },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, "Order_Summary_report.xlsx");
  };

  const handleExport = () => {
    let summary = [];
    orderList.forEach((order) => {
      const data = order.aggregate || [];
      data.forEach((item) => {
        summary.push({ ...item, hub_name: order.hubName });
      });
    });
    setCustomers(summary);
    setDataLoaded(summary.length > 0);
  };

  useEffect(handleExport, [orderList]);

  return (
    <>
      <div className="mb-2">
        <div className="">
          <div className="d-flex justify-content-end align-items-center">
            <ExportButtons
              onExportExcel={exportTableToEXL}
              onExportPDF={exportTableToPDF}
              onExportCSV={exportTableToCSV}
              dataLoaded={dataLoaded}
            />
          </div>
          <div className="d-none">
            <CustomerTable customers={customers} />
          </div>
        </div>
      </div>
    </>
  );
};

const ExportButtons = ({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  dataLoaded,
}) => (
  <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
    <>
      <Button
        onClick={onExportExcel}
        className="btn btn-success btn-rounded btn-sm"
      >
        Export Excel
      </Button>
      <Button
        onClick={onExportPDF}
        className="btn btn-success btn-rounded btn-sm"
      >
        Export PDF
      </Button>
      <Button
        onClick={onExportCSV}
        className="btn btn-success btn-rounded btn-sm"
      >
        Export CSV
      </Button>
    </>
  </div>
);

export default ExportSummary;