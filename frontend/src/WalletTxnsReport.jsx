import React, { useState, useEffect, useContext } from 'react'
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetch_records_with_pagination, fetch_records, fetch_all_records } from './helpers';
import { Button, Spinner } from 'react-bootstrap';
import Select from "react-select";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import GlobalContext from "./context/GlobalContext";
import { handleLogout } from './Utility';
import ExportTableToExcel from './ExportTableToExcel';
const WalletTxnsReport = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filters, setFilters] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [hubsData, setHubsData] = useState([]);
  const [selectedHubs, setSelectedHubs] = useState([]);
  const [hubUserData, setHubUserData] = useState([]);

  const navigate = useNavigate();
  const { permissible_roles } = useContext(GlobalContext);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    } else {
      if (permissible_roles.length > 0) {
        if (!permissible_roles.includes('wallet_transaction_report')) {
          handleLogout()
          navigate("/permission_denied");
        }
      }
    }
  }, [navigate, permissible_roles]);

  const handleDownloadPdf = async () => {
    const doc = new jsPDF();
    const tableColumn = [
      "SR.NO",
      "Txn ID",
      "Name",
      "Contact",
      "Hub",
      "Type",
      "Amount",
      "last Ledger Amount",
      "Description",
      "Reason",
      "Source",
      "Date & Time",
      "User",
      "Delivery Executive"
    ];

    const tableRows = data.map((wallet, index) => [
      index + 1,
      wallet.data.txn_id,
      wallet.data.customer_name,
      wallet.data.customer_phone,
      wallet.data.hub_name,
      wallet.data.type,
      wallet.data.amount,
      wallet.data.current_wallet_balance,
      wallet.data.description,
      wallet.data.reason,
      wallet.data.source,
      wallet.data.created_date ? new Date(wallet.data.created_date).toISOString() : "",
      wallet.data.user,
      wallet.data.delivery_executive
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 6,
        cellPadding: 1,
      },
    });

    doc.save("WalletTxnsReport.pdf");
  }


  const reasonsOptions = [
    { label: "Cash Deposit", value: "Cash Deposit" },
    { label: "Adjustment", value: "Adjustment" },
    { label: "Auto Generated", value: "Auto Generated" },
    { label: "Via Payment Gateway", value: "Via Payment Gateway" },
    { label: "Manual Order Executed", value: "Manual Order Executed" },
    { label: "Cron", value: "Cron" },
    { label: "Cashback", value: "Cashback" },
  ];


  const sourceOptions = [
    { label: "Backend", value: "Backend" },
    { label: "Online", value: "Online" },
    { label: "Server", value: "Server" },
    { label: "Deivery Man Application", value: "delivery man application" },
    { label: "Application", value: "application" },
    { label: "Bulk Wallet Upload", value: "bulk wallet upload" },

  ];


  const exportTableToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
      'Txn ID': item.data.txn_id,
      'Name': item.data.customer_name,
      'Contact': item.data.customer_phone,
      'Hub': item.data.hub_name,
      'Type': item.data.type,
      'Amount': item.data.amount,
      'last Ledger Amount': item.data.current_wallet_balance,
      'Description': item.data.description,
      'Reason': item.data.reason,
      'Source': item.data.source,
      'Date & Time': item.data.created_date ? new Date(item.data.created_date).toISOString() : "",
      'User': item.data.user,
      'Delivery Executive': item.data.delivery_executive
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');
    XLSX.writeFile(wb, 'wallet_transaction_report.csv');
  };

  // const [filters, setFilters] = useState([]);
  const [pendingFilters, setPendingFilters] = useState([]);

  const applyFilters = () => {
    setFilters(pendingFilters);
    setPage(1); // Optional: Reset to first page
  };


  // useEffect(() => {
  //   setLoading(true);
  //   if (filters.length !== 0) {
  //     fetch_records_with_pagination('wallet_history', filters).then((data) => {
  //       setLastVisible(data.lastVisible);
  //       setTotalPages(data.totalPages);
  //       setTotalCount(data.totalCount);
  //       setPage(data.currentPage);
  //       setData(data.data);
  //       setLoading(false); 
  //     }).catch((error) => {
  //       console.error(error);
  //       setLoading(false);
  //     });
  //   } else {
  //     setLoading(false);
  //   }
  // }, [filters,page]);

  useEffect(() => {
    setLoading(true);
    if (filters.length !== 0) {
      fetch_records_with_pagination('wallet_history', filters).then((data) => {
        setLastVisible(data.lastVisible);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setPage(data.currentPage);
        setData(data.data);
        setLoading(false);
      }).catch((error) => {
        console.error(error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [filters]);


  useEffect(() => {
    fetch_all_records('hubs_data').then((data) => {

      setHubsData(data);
    }
    );
  }, [])

  useEffect(() => {
    if (selectedHubs.length !== 0) {
      fetch_records('hubs_users_data', [{ key: 'hub_name', value: selectedHubs, operator: 'in' }]).then((data) => {
        setHubUserData(data);
      }
      );
    }
  }, [selectedHubs])

  // const updateFilters = (key, value, operator,action_type="") => {
  //   setFilters((prevFilters) => {
  //     const existingFilterIndex = prevFilters.findIndex(
  //       (filter) => filter.key === key && filter.operator === operator
  //     );
  //     if (action_type === "remove") {
  //       if (existingFilterIndex !== -1) {
  //         const updatedFilters = [...prevFilters];
  //         updatedFilters.splice(existingFilterIndex, 1);
  //         return updatedFilters;
  //       }
  //       return prevFilters;
  //     }

  //     if (existingFilterIndex !== -1) {
  //       const updatedFilters = [...prevFilters];
  //       updatedFilters[existingFilterIndex].value = value;
  //       return updatedFilters;
  //     } else {

  //       return [...prevFilters, { key, value, operator }];
  //     }
  //   });



  // };

  const updateFilters = (key, value, operator, action_type = "") => {

    setPendingFilters((prevFilters) => {
      const existingFilterIndex = prevFilters.findIndex(
        (filter) => filter.key === key && filter.operator === operator
      );

      if (action_type === "remove") {
        if (existingFilterIndex !== -1) {
          const updatedFilters = [...prevFilters];
          updatedFilters.splice(existingFilterIndex, 1);
          return updatedFilters;
        }
        return prevFilters;
      }

      if (existingFilterIndex !== -1) {
        const updatedFilters = [...prevFilters];
        updatedFilters[existingFilterIndex].value = value;
        return updatedFilters;
      } else {
        return [...prevFilters, { key, value, operator }];
      }
    });
  };

  const handlesetStartDate = (data) => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    setStartDate(startOfDay);
    updateFilters('created_date', startOfDay, '>=');
  }

  const handleEndDate = (data) => {
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);
    setEndDate(endOfDay);
    updateFilters('created_date', endOfDay, '<=');
  }

  const handleHubChange = (selected_values) => {
    if (selected_values.length === 0) {
      updateFilters('hub_name', '', 'in', 'remove');
      return;
    } else {
      let values = []
      selected_values.forEach(value => {
        values.push(value.value);
      });
      setSelectedHubs(values);
      updateFilters('hub_name', values, 'in');
    }
  }

  const handleDeliveryExecutiveChange = (selected_values) => {
    if (selected_values.length === 0) {
      updateFilters('delivery_executive', '', 'in', 'remove');
      return;
    } else {

      let values = []
      selected_values.forEach(value => {
        values.push(value.value);
      });
      updateFilters('delivery_executive', values, 'in');
    }
  }

  const handleTypeChange = (e) => {
    let values = []
    try {
      values.push(e.value);
      values.push(e.value.toLowerCase());

      updateFilters('type', values, 'in');
    } catch (error) {
      updateFilters('type', values, 'in', 'remove');

    }
  }


  const handleReasonChange = (selected_valued) => {
    if (selected_valued.length === 0) {
      updateFilters('reason', '', 'in', 'remove');
      return;
    } else {
      let values = []
      selected_valued.forEach(value => {
        values.push(value.value);
      });

      updateFilters('reason', values, 'in');
    }

  }

  const handleSourceChange = (selected_valued) => {
    if (selected_valued.length === 0) {
      updateFilters('source', '', 'in', 'remove');
      return;
    } else {
      let values = []
      selected_valued.forEach(value => {
        values.push(value.value);
      });
      updateFilters('source', values, 'in');
    }
  }


  const downloadCSVFromTable = () => {
    const table = document.getElementById("walletTable");
    const rows = table.querySelectorAll("tr");
    const csv = [];

    for (let row of rows) {
      const cols = row.querySelectorAll("td, th");
      const rowData = [];

      for (let col of cols) {
        let text = col.innerText.replace(/,/g, ""); // remove commas to avoid CSV column issues
        rowData.push(`"${text}"`);
      }

      csv.push(rowData.join(","));
    }

    const csvContent = csv.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "wallet_transactions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };




  return (
    <>
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
          <h4 className="text-success fw-bold mb-2">Wallet Transactions</h4>
          <div className="d-flex gap-2">
            {data.length > 0 && (
              <>
                <Button variant="success" size="sm" onClick={handleDownloadPdf}>
                  Export PDF
                </Button>
                <ExportTableToExcel tableId="walletTable" fileName="walletTransactions" />
                <Button variant="success" size="sm" onClick={downloadCSVFromTable}>
                  Export CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filter Card */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-3 justify-content-start">
              {/* Each Filter Field */}
              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">From Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={handlesetStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="From Date"
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="To Date"
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">Hubs</label>
                <Select
                  isMulti
                  options={hubsData.map(hub => ({ label: hub.data.hub_name, value: hub.data.hub_name }))}
                  onChange={handleHubChange}
                  placeholder="Select Hub"
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">Delivery Executive</label>
                <Select
                  isMulti
                  options={hubUserData.map(hub => ({
                    label: `${hub.data.first_name} ${hub.data.last_name}`,
                    value: `${hub.data.first_name} ${hub.data.last_name}`
                  }))}
                  onChange={handleDeliveryExecutiveChange}
                  placeholder="Select Delivery Executive"
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">Type</label>
                <Select
                  options={[{ label: 'Credit', value: 'Credit' }, { label: 'Debit', value: 'Debit' }]}
                  onChange={handleTypeChange}
                  placeholder="Select Type"
                  isClearable
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">Reason</label>
                <Select
                  isMulti
                  options={reasonsOptions}
                  onChange={handleReasonChange}
                  placeholder="Select Reason"
                />
              </div>

              <div
                className="d-flex flex-column flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="form-label">Source</label>
                <Select
                  isMulti
                  options={sourceOptions}
                  onChange={handleSourceChange}
                  placeholder="Select Source"
                />
              </div>

              {/* Search Button - inline with filters */}
              <div
                className="d-flex flex-column justify-content-end flex-grow-1"
                style={{ minWidth: '200px', maxWidth: '280px' }}
              >
                <label className="invisible">Search</label> {/* For spacing alignment */}
                <button
                  className="btn btn-success w-100"
                  onClick={applyFilters}
                  style={{
                    height: '38px',
                    transition: '0.3s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#198754')}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="d-flex justify-content-start gap-3 mb-2 px-2">
        <h5 className="pagination_text">Total Records: {totalCount}</h5>
      </div>
      <div className="custom_container" style={{ overflowX: 'auto', overflowY: 'auto' }}>
        {/* Header showing total records */}

        {/* Table */}
        <table className="table custom-table" id="walletTable">
          <thead>
            <tr>
              {[
                'SR.NO',
                'Txn ID',
                'Name',
                'Contact',
                'Hub',
                'Type',
                'Amount',
                'Last Ledger Amount',
                'Description',
                'Reason',
                'Source',
                'Date & Time',
                'User',
                'Delivery Executive',
              ].map((title, idx) => (
                <th
                  key={idx}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>


          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((wallet, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{wallet.data.txn_id}</td>
                  <td>{wallet.data.customer_name}</td>
                  <td>{wallet.data.customer_phone}</td>
                  <td>{wallet.data.hub_name}</td>
                  <td>{wallet.data.type}</td>
                  <td>{wallet.data.amount}</td>
                  <td>{wallet.data.current_wallet_balance}</td>
                  <td>{wallet.data.description}</td>
                  <td>{wallet.data.reason}</td>
                  <td>{wallet.data.source}</td>
                  <td>
                    {wallet.data.created_date &&
                      typeof wallet.data.created_date.toDate === 'function'
                      ? wallet.data.created_date
                        .toDate()
                        .toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })
                      : 'Invalid Date'}
                  </td>
                  <td>{wallet.data.user}</td>
                  <td>{wallet.data.delivery_executive}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" className="text-center">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </>
  )
}

export default WalletTxnsReport