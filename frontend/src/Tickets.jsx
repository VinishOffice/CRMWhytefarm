import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import Moment from 'moment';
import { extendMoment } from 'moment-range';
import { CSVLink } from 'react-csv';

import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import Footer from './Footer';
import Loader from './components/common/Loader';
import ExistingTickets from './TicketsDialogs/ExistingTickets';
import GlobalContext from './context/GlobalContext';
import apiClient from './services/apiClient';
import { fromSecondsNanoseconds } from './utils/dateUtils';
import 'react-datepicker/dist/react-datepicker.css';

const moment = extendMoment(Moment);
const RECORDS_PER_PAGE = 5;
const STATUS_ORDER = { Open: 1, 'In Progress': 2, Resolved: 3 };
const STATUS_COLORS = { Resolved: '#83bf91', 'In Progress': '#EEF25E', Open: '#C6CACE' };
const TICKET_ACTIONS = ['Open', 'In Progress', 'Resolved'];

const CSV_HEADERS = [
  { label: 'Ticket ID', key: 'ticket_id' },
  { label: 'Customer Name', key: 'customer_name' },
  { label: 'Customer Phone', key: 'customer_phone' },
  { label: 'Category', key: 'category' },
  { label: 'Sub Category', key: 'sub_category' },
  { label: 'Subject', key: 'subject' },
  { label: 'Description', key: 'description' },
  { label: 'Order date', key: 'order_date' },
  { label: 'Attachment', key: 'attachment' },
  { label: 'Status', key: 'status' },
];

function Tickets() {
  const navigate = useNavigate();
  const { permissible_roles, state_user } = useContext(GlobalContext);
  const username = state_user?.username;

  useEffect(() => {
    if (localStorage.getItem('loggedIn') !== 'true') navigate('/login');
  }, [navigate]);

  const [data, setData]             = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [fromDate, setFromDate]     = useState(null);
  const [toDate, setToDate]         = useState(null);
  const [activePopUp, setActivePopUp] = useState('');

  // ─── pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [startPage, setStartPage]     = useState(1);
  const totalPages   = Math.ceil(filteredData.length / RECORDS_PER_PAGE);
  const visibleCount = 2;
  const endPage      = Math.min(startPage + visibleCount - 1, totalPages);
  const pageNumbers  = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  const currentRecords = filteredData.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      if (next > endPage) setStartPage(p => p + visibleCount);
    }
  };
  const handlePrev = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      if (prev < startPage) setStartPage(p => p - visibleCount);
    }
  };
  const handleLoadMore = () => {
    const next = startPage + visibleCount;
    if (next <= totalPages) { setStartPage(next); setCurrentPage(next); }
  };

  // ─── fetch ────────────────────────────────────────────────────────────────
  const fetchTickets = async () => {
    try {
      const res = await apiClient.post('/api/tickets/query', { filters: [] });
      const docs = res.data?.data || [];
      const sorted = docs
        .map(d => ({ ref: { id: d._id }, id: d._id, data: d }))
        .sort((a, b) => (STATUS_ORDER[a.data.status] || 9) - (STATUS_ORDER[b.data.status] || 9));
      setData(sorted);
    } catch (err) { console.error('Error fetching tickets:', err); }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── date filter ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fromDate && !toDate) { setFilteredData(data); return; }
    const start = fromDate ? moment(fromDate).startOf('day').valueOf() : 0;
    const end   = toDate   ? moment(toDate).endOf('day').valueOf()     : Number.MAX_SAFE_INTEGER;
    setFilteredData(data.filter(item => {
      const d = item.data?.created_date;
      if (d && typeof d.toDate === 'function') return d.toDate().getTime() >= start && d.toDate().getTime() <= end;
      return false;
    }));
  }, [fromDate, toDate, data]);

  // ─── ticket actions ───────────────────────────────────────────────────────
  const AddTicketActivity = async (ticketData, action) => {
    try {
      await apiClient.post('/api/customer_activities/add', {
        customer_name: ticketData.customer_name, customer_id: ticketData.customer_id,
        customer_phone: ticketData.customer_phone, object: 'Ticket Action', action: 'status update',
        description: `Ticket ${ticketData.ticket_id} was ${action} by ${username}`,
        platform: 'crm', user: username, created_date: new Date(), date: new Date(),
      });
    } catch (err) {
      console.error('Error adding ticket activity:', err);
    }
  };

  const HandleTicketAction = async (ticketRef, action, ticketData) => {
    try {
      await apiClient.patch(`/api/tickets/${ticketRef.id}`, { status: action });
      await AddTicketActivity(ticketData, action);
      fetchTickets();
    } catch (err) { console.error(err.message); }
  };

  // ─── CSV data ─────────────────────────────────────────────────────────────
  const csvData = filteredData.map(({ data: d }) => ({
    ticket_id: d.ticket_id, customer_name: d.customer_name, customer_phone: d.customer_phone,
    category: d.category, sub_category: d.sub_category, subject: d.subject, description: d.description,
    order_date: d.order_date ? fromSecondsNanoseconds(d.order_date?.seconds, d.order_date?.nanoseconds).toLocaleDateString() : 'Not Selected',
    attachment: d.attachment || 'No Attachment', status: d.status,
  }));

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <>
      {activePopUp === 'existingTickets' && (
        <div className="popup">
          <div className="popup-inner">
            <div className="close_btn_position"><button className="close_btn" onClick={() => setActivePopUp('')}>X</button></div>
            <ExistingTickets setActivePopUp={setActivePopUp} permissible_roles={permissible_roles} />
          </div>
        </div>
      )}
      <Loader show={loading} />
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4 className="card-title">Tickets</h4>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15 }}>
                        <DatePicker selected={fromDate} onChange={setFromDate} placeholderText="From Date" className="form-control" dateFormat="dd-MM-yyyy" />
                        <DatePicker selected={toDate} onChange={setToDate} placeholderText="To Date" className="form-control" dateFormat="dd-MM-yyyy" />
                        <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(null); setToDate(null); }}>Clear</button>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-success btn-rounded btn-sm" onClick={() => setActivePopUp('existingTickets')}>+ Tickets Category</button>
                        <CSVLink data={csvData} headers={CSV_HEADERS} filename="tickets.csv" className="btn btn-primary btn-rounded btn-sm">Download CSV</CSVLink>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Ticket ID</th><th>Customer Name</th><th>Customer Phone</th>
                            <th>Category</th><th>Sub-Category</th><th>Subject</th>
                            <th style={{ maxWidth: 450 }}>Description</th><th>Order date</th>
                            <th>Preferred Mode</th><th>Attachment</th><th>Status</th><th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentRecords.length ? currentRecords.map(({ ref, id, data: d }) => (
                            <tr key={id}>
                              <td>{d.ticket_id || '-'}</td>
                              <td>{d.customer_name || '-'}</td>
                              <td>{d.customer_phone || '-'}</td>
                              <td>{d.category || '-'}</td>
                              <td>{d.sub_category || '-'}</td>
                              <td style={{ maxWidth: 150, wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{d.subject || '-'}</td>
                              <td style={{ maxWidth: 300, wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{d.description || '-'}</td>
                              <td>{d.order_date ? fromSecondsNanoseconds(d.order_date?.seconds, d.order_date?.nanoseconds).toLocaleDateString() : 'Not Selected'}</td>
                              <td>{d.preferred_mode || '-'}</td>
                              <td>
                                {d.attachment?.length > 0
                                  ? d.attachment.map((link, idx) => <img key={idx} src={link} alt="issue" style={{ width: 50, height: 50, display: 'inline', cursor: 'pointer' }} onClick={() => window.open(link, '_blank')} />)
                                  : <p>No Attachments</p>}
                              </td>
                              <td>
                                <span style={{ borderRadius: 10, padding: '5px 10px', backgroundColor: STATUS_COLORS[d.status] || '#C6CACE', color: 'white' }}>{d.status}</span>
                              </td>
                              <td>
                                {d.status === 'Resolved' ? '-' : (
                                  <select value={d.status} style={{ borderRadius: 10 }} onChange={e => HandleTicketAction(ref, e.target.value, d)}>
                                    {TICKET_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                  </select>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="12" className="text-center">No Active Ticket Found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, border: '1px solid #ddd', borderRadius: 8, padding: 12, backgroundColor: '#f9f9f9', flexWrap: 'wrap' }}>
                      <button disabled={currentPage === 1} onClick={handlePrev} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: currentPage === 1 ? '#e5e7eb' : '#2563eb', color: currentPage === 1 ? '#9ca3af' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                      {pageNumbers.map(n => (
                        <button key={n} onClick={() => setCurrentPage(n)} style={{ padding: '6px 14px', borderRadius: 6, border: n === currentPage ? '1px solid #2563eb' : '1px solid #ccc', backgroundColor: n === currentPage ? '#2563eb' : '#fff', color: n === currentPage ? '#fff' : '#374151', cursor: 'pointer' }}>{n}</button>
                      ))}
                      <button disabled={currentPage === totalPages} onClick={handleNext} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#2563eb', color: currentPage === totalPages ? '#9ca3af' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
                      {visibleCount < totalPages && (
                        <button onClick={handleLoadMore} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer' }}>Load More</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

export default Tickets;
