import React from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";

const ExportToExcel = ({ tableId, excelFilename, worksheetName = "Summary", headerCellStyle }) => {
  const exportToExcel = () => {
    const table = document.getElementById(tableId);
    const worksheet = XLSX.utils.table_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    const headerCellRange = XLSX.utils.decode_range(worksheet["!ref"]);
    const headerRow = headerCellRange.s.r;

    for (let col = headerCellRange.s.c; col <= headerCellRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ c: col, r: headerRow });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = headerCellStyle;
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
    XLSX.writeFile(workbook, `${excelFilename}.xlsx`);
  };

  return (
    <Button onClick={exportToExcel} className="btn btn-success btn-rounded btn-sm">
      Export Excel
    </Button>
  );
};

export default ExportToExcel;