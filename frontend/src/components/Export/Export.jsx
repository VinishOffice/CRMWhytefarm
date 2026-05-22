import React from "react";
import ExportToExcel from "./ExportToExcel";
import ExportToPDF from "./ExportToPDF";
import ExportToCSV from "./ExportToCSV";
import { Table } from "../Table";

const Export = ({
  tableHeader,
  tableRow,
  details,
}) => {
  return (
    <div className="mb-2 p-1">
      <div className="d-flex justify-content-end flex-wrap gap-2">
        <ExportToExcel tableId="ExportTable" excelFilename="exported_data" />

        <ExportToCSV
          csvColumns={tableHeader}
          csvData={tableRow}
          CSV_FileName="exported_data"
        />

        <ExportToPDF
          pdfColumns={tableHeader}
          pdfData={tableRow}
          pdfDetails={details}
          PDF_filename="exported_data"
          pdfOptions={{ startY: 55 }}
        />
      </div>

      <div style={{ display: "none" }}>
        <Table
          tableHeader={tableHeader}
          tableData={tableRow}
          id="ExportTable"
        />
      </div>
    </div>
  );
};

export default Export;
