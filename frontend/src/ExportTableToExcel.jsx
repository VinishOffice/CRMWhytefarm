import React from 'react';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';

const ExportTableToExcel = ({ tableId, fileName }) => {
  return (
    <div >
      {/* Button to trigger export */}
      <ReactHTMLTableToExcel
        id="test-table-xls-button"
        className="btn btn-success btn-rounded btn-sm"
        style={{ marginTop:"5px" }}
        //className="export-excel-button"
        table={tableId}
        filename={fileName}
        sheet="Sheet"
        buttonText="Export to Excel"
      />
    </div>
  );
};

export default ExportTableToExcel;
