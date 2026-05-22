import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { toDate } from './utils/dateUtils';

const ExportWallet = ({ walletData, filteredData, visibleData, customerName }) => {
  const [showModal, setShowModal] = useState(false);
  const [exportOption, setExportOption] = useState('all');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Function to convert array of transactions to CSV string
  const convertToCSV = (dataArray) => {
    const headers = [
      "Sr.No",
      "Transaction Id",
      "Amount",
      "Type",
      "Ledger Balance",
      "Reason",
      "Description",
      "Source",
      "Created On",
      "User"
    ];

    const rows = dataArray.map((item, index) => {
      const txn = item.data;
      const formattedDate = moment(toDate(txn.created_date)?.toISOString()).format("DD-MM-YYYY, h:mm a");
      return [
        index + 1,
        `"${txn.txn_id || ''}"`,
        txn.amount || '0',
        `"${txn.type || ''}"`,
        Math.round(txn.current_wallet_balance || 0),
        `"${(txn.reason || '').replace(/"/g, '""')}"`,
        `"${(txn.description || '').replace(/"/g, '""')}"`,
        `"${txn.source || ''}"`,
        `"${formattedDate}"`,
        `"${txn.user || ''}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const handleExport = () => {
    let dataToExport = [];

    if (exportOption === 'all') {
      dataToExport = walletData;
    } else if (exportOption === 'visible') {
      dataToExport = visibleData;
    } else if (exportOption === 'daterange') {
      // Filter the main walletData by the selected dates
      const start = moment(startDate).startOf('day');
      const end = moment(endDate).endOf('day');
      dataToExport = walletData.filter((item) => {
        const itemDate = moment(toDate(item.data.created_date)?.toISOString());
        return itemDate.isBetween(start, end, null, '[]');
      });
    }

    if (dataToExport.length === 0) {
      alert("No transactions found for the selected option.");
      return;
    }

    const csvContent = convertToCSV(dataToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${customerName}_wallet_history_${exportOption}.csv`.replace(/\s+/g, '_'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowModal(false);
  };

  return (
    <>
      <button 
        className="btn btn-primary text-white"
        onClick={() => setShowModal(true)}
      >
        Export Wallet
      </button>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title font-weight-bold d-flex align-items-center">
                  <i className="icon-cloud-download me-2"></i> Export Wallet Transactions
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-4">Choose how you would like to export the transaction history.</p>
                
                {/* Custom Radio Button Group */}
                <div className="mb-4">
                  {/* Option 2 (Default): All Transactions */}
                  <div 
                    className={`card mb-2 border ${exportOption === 'all' ? 'border-primary bg-light' : ''}`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setExportOption('all')}
                  >
                    <div className="card-body p-3 d-flex align-items-center">
                      <div className={`form-check form-check-primary m-0`}>
                        <input className="form-check-input" type="radio" checked={exportOption === 'all'} readOnly />
                      </div>
                      <div className="ms-2">
                        <strong className="d-block text-dark">Export All Transactions</strong>
                        <small className="text-muted">Download all available wallet history ({walletData?.length || 0} items).</small>
                      </div>
                    </div>
                  </div>

                  {/* Option 1: Date Range */}
                  <div 
                    className={`card mb-2 border ${exportOption === 'daterange' ? 'border-primary bg-light' : ''}`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setExportOption('daterange')}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className="form-check form-check-primary m-0">
                          <input className="form-check-input" type="radio" checked={exportOption === 'daterange'} readOnly />
                        </div>
                        <div className="ms-2">
                          <strong className="d-block text-dark">Selected Date Range</strong>
                          <small className="text-muted">Choose a specific timeframe to download.</small>
                        </div>
                      </div>
                      
                      {exportOption === 'daterange' && (
                        <div className="d-flex align-items-center mt-3 ms-4">
                          <div className="flex-fill">
                            <label className="small text-muted mb-1">From Date</label>
                            <DatePicker
                              selected={startDate}
                              onChange={(date) => setStartDate(date)}
                              selectsStart
                              startDate={startDate}
                              endDate={endDate}
                              className="form-control form-control-sm"
                              dateFormat="dd/MM/yyyy"
                            />
                          </div>
                          <span className="mx-2 mt-4 text-muted">to</span>
                          <div className="flex-fill">
                            <label className="small text-muted mb-1">To Date</label>
                            <DatePicker
                              selected={endDate}
                              onChange={(date) => setEndDate(date)}
                              selectsEnd
                              startDate={startDate}
                              endDate={endDate}
                              minDate={startDate}
                              className="form-control form-control-sm"
                              dateFormat="dd/MM/yyyy"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option 3: Visible Items */}
                  <div 
                    className={`card mb-2 border ${exportOption === 'visible' ? 'border-primary bg-light' : ''}`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setExportOption('visible')}
                  >
                    <div className="card-body p-3 d-flex align-items-center">
                      <div className="form-check form-check-primary m-0">
                        <input className="form-check-input" type="radio" checked={exportOption === 'visible'} readOnly />
                      </div>
                      <div className="ms-2">
                        <strong className="d-block text-dark">Currently Visible Only</strong>
                        <small className="text-muted">Download exactly what is on the page right now ({visibleData?.length || 0} items).</small>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer bg-light border-0 py-3">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary shadow-sm px-4" onClick={handleExport}>
                  <i className="icon-cloud-download me-2"></i> Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportWallet;
