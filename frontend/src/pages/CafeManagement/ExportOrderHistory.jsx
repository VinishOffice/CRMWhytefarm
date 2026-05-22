import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

const ExportOrderHistory = ({
  orderList,
  fetchOrderHistory,
  dateRange,
  rowData,
}) => {
  const [dataLoaded, setDataLoaded] = useState(false);

  const exportTableToCSV = () => {
    const csvColumns = [
      "Created Date",
      "Delivery Date",
      "Product Name",
      "Quantity",
      "Package Unit",
      "Chalan No",
      "Hub",
      "Delivery Address",
      "Buyer Address",  
      "Created by",
      "Status",
      "Update By",
      "Update Date",
      "Previous Quantity",
    ];

    const csvRows = orderList.map(({ id, data }) => [
      `"${formatDate(new Date(data.order_date))}"`,
      `"${formatDate(new Date(data.delivery_date))}"`,
      `"${data.product_name || ""}"`,
      `"${data.quantity || ""}"`,
      `"${data.package_unit || ""}"`,
      `"${data.delivery_challan_no || ""}"`,
      `"${data.hub_name || ""}"`,
      `"${data.location || ""}"`,
      `"${data.location || ""}"`,
      `"${data.created_by || ""}"`,
      `${data.status === 0 ? "Pending" : data.status === 1 ? "Delivered" : "Cancelled"}`,
      `"${data.updated_by || "N/A"}"`,
      `"${
        data.updated_date ? formatDate(new Date(data.updated_date)) : "N/A"
      }"`,
      `"${
          data.previous_quantity?.length 
            ? data.previous_quantity.join(", ") 
            : "N/A"
      }"`,

    ]);

    const csvContent = [
      csvColumns.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `order_history_report.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return date;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF();
    const companyName = "WHYTE FARMS";

    doc.setFontSize(20);
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - textWidth) / 2, 10);

    doc.setFontSize(16);
    const reportTitle = "Order History Report";
    const reportTitleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - reportTitleWidth) / 2, 20);

    const startDate = formatDate(dateRange.start);
    const endDate = formatDate(dateRange.end);

    doc.setFontSize(12);
    doc.text(`From ${startDate} to ${endDate}`, 20, 30);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cafe: ${rowData.cafe_name || "N/A"}`, 20, 40);

    doc.setTextColor(0, 0, 255);
    doc.setFontSize(12);

    const locationLabel = "Location: ";
    const hubLabel = "Hub: ";
    const locationText = rowData.cafe_location || "N/A";
    const hubText = rowData.delivery_hub || "N/A";

    const locationX = 20;
    const hubX = pageWidth - doc.getTextWidth(hubLabel + hubText) - 20;

    doc.text(locationLabel, locationX, 50);
    doc.text(locationText, locationX + doc.getTextWidth(locationLabel), 50);

    doc.text(hubLabel, hubX, 50);
    doc.text(hubText, hubX + doc.getTextWidth(hubLabel), 50);

    doc.setDrawColor(0);
    doc.line(20, 55, pageWidth - 20, 55);

    const pdfData = orderList.map(({ id, data }) => [
      formatDate(new Date(data.delivery_date)) || "N/A",
      data.product_name || "No data",
      data.quantity || "0",
      data.package_unit || "N/A",
      data.hub_name || "N/A",
      formatDate(new Date(data.created_date)),
      data.created_by || "N/A",
      data.status === 0 ? "Pending" : "Delivered",
    ]);

    doc.autoTable({
      head: [
        [
          {
            content: "Order Date",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Product Name",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Quantity",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Package Unit",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Location",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Created Date",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Created by",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
          {
            content: "Status",
            styles: {
              fillColor: [74, 84, 186],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 11,
            },
          },
        ],
      ],
      body: pdfData,
      startY: 60,
      theme: "grid",
      styles: {
        cellPadding: 3,
        fontSize: 10,
        halign: "center",
        valign: "middle",
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    doc.save("order_history_report.pdf");
  };

  const exportTableToEXL = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      orderList.map(({ id, data }) => ({
        
      "Created Date": `${formatDate(new Date(data.order_date))}`,
      "Delivery Date": `${formatDate(new Date(data.delivery_date))}`,
      "Product Name": `${data.product_name || ""}`,
      "Quantity": `${data.quantity || ""}`,
      "Package Unit": `${data.package_unit || ""}`,
      "Chalan No": `${data.delivery_challan_no || ""}`,
      "Hub": `${data.hub_name || ""}`,
      "Delivery Address": `${data.location || ""}`,
      "Buyer Address" : `${data.location || ""}`,
      "Created by": `${data.created_by || ""}`,
      "Status": `${data.status === 0 ? "Pending" : data.status === 1 ? "Delivered" : "Cancelled"}`,
      "Update By": `${data.updated_by || "N/A"}`,
      "Update Date":`${
        data.updated_date ? formatDate(new Date(data.updated_date)) : "N/A"
      }`,
      "Previous Quantity":  `${
          data.previous_quantity?.length 
            ? data.previous_quantity.join(", ") 
            : "N/A"
      }`,
      }))
      
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order History");
    XLSX.writeFile(workbook, "Order_History_Report.xlsx");
  };

  const handleExport = () => {
    setDataLoaded(orderList.length > 0);
  };

  useEffect(() => {
    handleExport();
  }, [orderList]);

  return (
    <>
      <div className="mb-2">
        <div className="d-flex justify-content-end align-items-center">
          <ExportButtons
            onExportExcel={exportTableToEXL}
            onExportPDF={exportTableToPDF}
            onExportCSV={exportTableToCSV}
            dataLoaded={dataLoaded}
          />
        </div>
        <div className="modal-body" style={{ display: "none" }}>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>Order Date</th>
                  <th style={{ textAlign: "center" }}>Product Name</th>
                  <th style={{ textAlign: "center" }}>Quantity</th>
                  <th style={{ textAlign: "center" }}>Package Unit</th>
                  <th style={{ textAlign: "center" }}>Chalan No</th>
                  <th style={{ textAlign: "center" }}>Hub</th>
                  <th style={{ textAlign: "center" }}>Delivery Address</th>
                  <th style={{ textAlign: "center" }}>Buyer Address</th>
                  <th style={{ textAlign: "center" }}>Created by</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Created Date</th>
                  <th style={{ textAlign: "center" }}>Update By</th>
                  <th style={{ textAlign: "center" }}>Update Date</th>
                </tr>
              </thead>
              <tbody>
                {orderList && orderList.length > 0 ? (
                  orderList.map(({ id, data }) => (
                    <HistoryRow
                      key={id}
                      id={id}
                      data={data}
                      fetchOrderHistory={fetchOrderHistory}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

const HistoryRow = ({ id, data, fetchOrderHistory }) => {
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return date;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <tr key={id} className="hover-highlight">
      <td style={{ textAlign: "center" }}>
        {formatDate(new Date(data.delivery_date))}
      </td>
      <td style={{ textAlign: "center" }}>{data.product_name}</td>
      <td style={{ textAlign: "center" }}>{data.quantity}</td>
      <td style={{ textAlign: "center" }}>{data.package_unit}</td>
      <td style={{  verticalAlign: "top" }}>{data.delivery_challan_no}</td>
      <td style={{  verticalAlign: "top" }}>{data.hub_name}</td>
      <td style={{  verticalAlign: "top" }}>{data.location}</td>
      <td style={{  verticalAlign: "top" }}>{data.location}</td>
      <td style={{ textAlign: "center" }}>{data.created_by}</td>
      <td style={{ textAlign: "center" }}>
        {
          <span
            className={
              data.status === 0
                ? "badge bg-warning text-dark"
                : "badge bg-success text-white"
            }
          >
            {data.status === 0 ? "Pending" : "Delivered"}
          </span>
        }
      </td>
      <td style={{  verticalAlign: "top" }}>
        {formatDate(new Date(data.created_date))}
      </td>
      <td style={{  verticalAlign: "top" }}>{data.updated_by || "N/A"}</td>
      <td style={{  verticalAlign: "top" }}>
        {data.updated_date ? formatDate(new Date(data.updated_date)) : "N/A"}
        </td>
    </tr>
  );
};

const ExportButtons = ({
  onExportExcel,
  onExportPDF,
  onExportCSV,
  dataLoaded,
}) => (
  <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
    <Button
      onClick={onExportExcel}
      className="btn btn-success btn-rounded btn-sm"
      disabled={!dataLoaded}
    >
      Export Excel
    </Button>
    {/* <Button
      onClick={onExportPDF}
      className="btn btn-success btn-rounded btn-sm"
      disabled={!dataLoaded}
    >
      Export PDF
    </Button> */}
    <Button
      onClick={onExportCSV}
      className="btn btn-success btn-rounded btn-sm"
      disabled={!dataLoaded}
    >
      Export CSV
    </Button>
  </div>
);

export default ExportOrderHistory;
