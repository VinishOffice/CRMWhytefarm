import React from "react";
import { Button } from "react-bootstrap";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ExportToPDF = ({
  pdfColumns,
  pdfData,
  pdfDetails,
  PDF_filename,
  pdfOptions,
}) => {
  const exportToPDF = () => {
    const doc = new jsPDF();
    const companyName = "WHYTE FARMS";
    let y = 20;

    doc.setFontSize(20);
    doc.text(companyName, y, 10);
    y += 10;

    if (pdfDetails && Array.isArray(pdfDetails)) {
      pdfDetails.forEach(([name, value]) => {
        doc.setFontSize(16);
        doc.text(name, 10, y);
        doc.setFontSize(16);
        doc.text(value, 100, y);
        y += 10;
      });
    }

    doc.autoTable({
      head: [pdfColumns],
      body: pdfData,
      startY: y,
      ...pdfOptions,
    });

    doc.save(`${PDF_filename}.pdf`);
  };

  return (
    <Button
      onClick={exportToPDF}
      className="btn btn-success btn-rounded btn-sm"
    >
      Export PDF
    </Button>
  );
};

export default ExportToPDF;
