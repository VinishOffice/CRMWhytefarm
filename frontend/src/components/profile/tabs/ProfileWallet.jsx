import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { PDFDownloadLink } from "@react-pdf/renderer";
import moment from "moment";
import { toDate } from "../../../utils/dateUtils";
import ExportWallet from "../../../ExportWallet";
import { AddTransaction } from "../../../forms";
import { ReportPdf } from "../../../pages";
import { verifyWalletLedger } from "../../../services/walletService";
import Swal from "sweetalert2";

const ProfileWallet = ({
  data,
  permissible_roles,
  walletData,
  filteredData,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleDateRangeWallet,
  resetWallet,
  handleFilterChange,
  username,
  reconsileWallet,
  params,
  showTransactionForm,
  setShowTransactionForm,
  fetchWalletData,
  fetchCustomerData,
}) => {
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    setIntegrityStatus(null);
    try {
      const result = await verifyWalletLedger(params.id);
      setIntegrityStatus(result);
      if (!result.in_sync) {
        Swal.fire({
          title: "Discrepancy Detected!",
          text: `Calculated: ${result.calculated_balance} | Stated: ${result.current_balance} | Diff: ${result.diff}`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Fix now (Reconcile)",
          cancelButtonText: "Cancel",
        }).then((res) => {
          if (res.isConfirmed) {
            reconsileWallet(params.id);
          }
        });
      } else {
        Swal.fire({
          title: "Wallet is Sync!",
          text: "The transaction ledger matches the current wallet balance.",
          icon: "success",
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("Verification failed:", error);
      Swal.fire("Error", "Failed to verify wallet integrity", "error");
    } finally {
      setIsVerifying(false);
    }
  };
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  const totalNoOfPage = Math.ceil((filteredData?.length || 0) / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  // const handlePageChange = (page) => {
  //   setCurrentPage(page);
  // };

  return (
    <>

      <div className="col-md-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="d-sm-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="From Date"
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                />
                <span className="mx-2"> TO </span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="To Date"
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                />
                <button
                  className="btn btn-primary text-white ms-2"
                  onClick={() => handleDateRangeWallet()}
                >
                  <i className="icon-search" ></i>Search
                </button>
                <button className="btn btn-primary text-white ms-2" onClick={() => resetWallet()}>
                  <i className="icon-reset"></i>Reset
                </button>
              </div>
              <div className="d-flex mt-3 mt-sm-0">
                {walletData && (
                  <div className="me-5">
                    <ExportWallet
                      walletData={walletData}
                      filteredData={filteredData}
                      visibleData={filteredData.slice(start, end)}
                      customerName={data?.data?.customer_name || "customer"}
                    />
                  </div>
                )}
                {walletData && (
                  <PDFDownloadLink
                    document={
                      <ReportPdf
                        wallet_data={filteredData}
                        customer_data={data}
                        start_date={startDate}
                        end_date={endDate}
                      />
                    }
                    fileName={`${data?.data?.customer_name}_wallet_transaction.pdf`}
                  >
                    <div className="btn btn-primary text-white">
                      <span>Generate Statement</span>
                    </div>
                  </PDFDownloadLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Wallet History</h4>
            <div className="form-group d-flex justify-content-between align-items-center">
              <div>
                <label htmlFor="filter">Filter by Type:</label>
                <select
                  id="filter"
                  className="form-control"
                  onChange={handleFilterChange}
                  style={{ width: "10rem" }}
                >
                  <option value="all">All</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              {username === "shruti" && (
                <div className="d-flex gap-2">
                  <button
                    className={`btn ${integrityStatus
                        ? integrityStatus.in_sync
                          ? "btn-success"
                          : "btn-danger"
                        : "btn-info"
                      } text-white`}
                    onClick={handleVerifyIntegrity}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <span className="spinner-border spinner-border-sm me-1"></span>
                    ) : (
                      <i className="icon-shield me-1"></i>
                    )}
                    {integrityStatus
                      ? integrityStatus.in_sync
                        ? "Balance Verified"
                        : "Discrepancy Found!"
                      : "Verify Integrity"}
                  </button>
                  <button className="btn btn-primary text-white" onClick={() => reconsileWallet(params.id)}>
                    Reconsile Wallet
                  </button>
                  <button
                    className="btn btn-primary text-white"
                    onClick={() => setShowTransactionForm(!showTransactionForm)}
                  >
                    {showTransactionForm ? "Hide form" : "Add missing transaction"}
                  </button>
                </div>
              )}
            </div>

            {showTransactionForm && (
              <div className="mb-4">
                <AddTransaction 
                  customer_data={data} 
                  setShowTransaction={setShowTransactionForm} 
                  fetchWalletData={fetchWalletData} 
                  fetchCustomerData={fetchCustomerData} 
                />
              </div>
            )}

            {permissible_roles.includes("wallet_transactions") ? (
              <>
                <div className="table-responsive">
                  <table className="table" id="waller_history_table">
                  <thead>
                    <tr>
                      <th className="pt-1 ps-0">Sr.No</th>
                      <th className="pt-1">Transaction Id</th>
                      <th className="pt-1">Amount</th>
                      <th className="pt-1">Type</th>
                      <th className="pt-1">Ledger Balance</th>
                      <th className="pt-1">Reason</th>
                      <th className="pt-1">Description</th>
                      <th className="pt-1">Source</th>
                      <th className="pt-1">Created On</th>
                      <th className="pt-1">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(start, end).map(({ id, data: txnData }, index) => (
                      <tr key={id}>
                        <td>{index + 1}</td>
                        <td>{txnData.txn_id}</td>
                        <td>{txnData.amount}</td>
                        <td
                          style={{
                            color:
                              txnData.type === "debit" || txnData.type === "Debit"
                                ? "red"
                                : "green",
                            fontWeight: "bold",
                          }}
                        >
                          {txnData.type}
                        </td>
                        <td>{Math.round(txnData.current_wallet_balance)}</td>
                        <td>{txnData.reason}</td>
                        <td>{txnData.description}</td>
                        <td>{txnData.source}</td>
                        <td>
                          {moment(toDate(txnData.created_date)?.toISOString()).format(
                            "DD-MM-YYYY, h:mm a"
                          )}
                        </td>
                        <td>{txnData.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalNoOfPage > 1 && (
                <div className="d-flex flex-column align-items-center justify-content-center mt-4 pt-3 border-top">
                  <div className="d-flex align-items-center mb-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="btn btn-sm btn-primary me-2"
                    >
                      &larr; Prev
                    </button>

                    <div className="d-flex align-items-center">
                      {/* Simple pagination logic based on current implementation */}
                      {Array.from({ length: totalNoOfPage }, (_, i) => i + 1).map((pageNum) => {
                        // Only show a few pages around the current page, or first/last
                        if (
                          pageNum === 1 ||
                          pageNum === totalNoOfPage ||
                          (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`btn btn-sm mx-1 ${
                                currentPage === pageNum
                                  ? "btn-primary"
                                  : "btn-outline-primary"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 3 ||
                          pageNum === currentPage + 3
                        ) {
                          return <span key={pageNum} className="mx-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      disabled={currentPage === totalNoOfPage}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="btn btn-sm btn-primary ms-2"
                    >
                      Next &rarr;
                    </button>
                  </div>
                  <div className="text-muted small">
                    Showing <span className="text-primary font-weight-bold">{start + 1}</span> to{" "}
                    <span className="text-primary font-weight-bold">{Math.min(end, filteredData?.length || 0)}</span> of{" "}
                    <span className="text-dark font-weight-bold">{filteredData?.length || 0}</span> results
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="p-3 text-center">Permission Denied</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileWallet;
