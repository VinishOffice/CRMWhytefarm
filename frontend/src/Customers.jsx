import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { extendMoment } from 'moment-range';
import Moment from 'moment';
import Swal from 'sweetalert2';

import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import Footer from './Footer';
import CustomerStatsBar from './components/customers/CustomerStatsBar';
import CustomerFormModal from './components/customers/CustomerFormModal';
import { useCustomerForm } from './hooks/useCustomerForm';
import apiClient from './services/apiClient';
import { getUserInfo, handleLogout } from './Utility';
import { normalizeDateValue } from './helpers';
import GlobalContext from './context/GlobalContext';

const moment = extendMoment(Moment);

const styles = `
  .custom-text { font-size: 15px !important; color: #fff !important; font-weight: 500; }
  .bg-gradient-info { background-image: linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%); }
`;

function showPermissionError() {
  Swal.mixin({
    toast: true, background: '#d7e7e6', position: 'top-end',
    showConfirmButton: false, timer: 3000, timerProgressBar: true,
    didOpen: t => { t.addEventListener('mouseenter', Swal.stopTimer); t.addEventListener('mouseleave', Swal.resumeTimer); },
  }).fire({ icon: 'error', title: 'You are not authorised to do this action' });
}

export default function Customers() {
  const { permissible_roles } = useContext(GlobalContext);
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (localStorage.getItem('loggedIn') !== 'true') { navigate('/login'); return; }
    if (permissible_roles.length > 0 && !permissible_roles.includes('customers')) {
      handleLogout(); navigate('/permission_denied');
    }
  }, [navigate, permissible_roles]);

  // --- Data state ---
  const [customers, setCustomers]         = useState([]);
  const [lastVisible, setLastVisible]     = useState(null);
  const [loading, setLoading]             = useState(false);
  const [collectionSize, setCollectionSize] = useState(null);
  const [newUserCount, setNewUserCount]   = useState(0);
  const [searchQuery, setSearchQuery]     = useState('');
  const [startDate, setStartDate]         = useState(null);
  const [endDate, setEndDate]             = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 10;

  // --- Customer form hook ---
  const form = useCustomerForm({ onSuccess: () => { fetchInitialData(); } });

  // --- Fetch helpers ---
  const fetchCollectionSize = async () => {
    try {
      const res = await apiClient.post('/api/customers_data/query', {
        filters: [{ field: 'platform', op: 'in', value: ['ios', 'iOS', 'android', 'Website', 'website', 'backend'] }],
        countOnly: true,
      });
      setCollectionSize(res.data?.count ?? 0);
    } catch (e) { console.error(e); }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    const res = await apiClient.post('/api/customers_data/query', {
      orderBy: [{ field: 'registered_date', direction: 'desc' }], limit: 20,
    });
    const docs = res.data?.data || [];
    setCustomers(docs.map(d => ({ id: d._id, data: d })));
    setLastVisible(docs[docs.length - 1] ?? null);
    setLoading(false);
  };

  const fetchMoreData = async () => {
    if (!lastVisible) return;
    setLoading(true);
    const res = await apiClient.post('/api/customers_data/query', {
      orderBy: [{ field: 'registered_date', direction: 'desc' }], limit: 20, startAfter: lastVisible,
    });
    const docs = res.data?.data || [];
    setCustomers(prev => [...prev, ...docs.map(d => ({ id: d._id, data: d }))]);
    setLastVisible(docs[docs.length - 1] ?? null);
    setLoading(false);
  };

  const fetchData = useCallback(async (term = '') => {
    if (!term) { fetchInitialData(); return; }
    setLoading(true);
    const map = new Map();
    const end = term.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
    const results = await Promise.all([
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_name', op: '>=', value: term }, { field: 'customer_name', op: '<', value: end }], limit: 20 }),
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_phone', op: '>=', value: term }, { field: 'customer_phone', op: '<', value: end }], limit: 20 }),
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_name', op: '==', value: term }] }),
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_phone', op: '==', value: term }] }),
    ]);
    results.forEach(r => (r.data?.data || []).forEach(d => map.set(d._id, { id: d._id, data: d })));
    setCustomers(Array.from(map.values()));
    setLoading(false);
  }, []);

  useEffect(() => { fetchInitialData(); fetchCollectionSize(); }, []);

  // New user count (today)
  useEffect(() => {
    const fetch = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const res = await apiClient.post('/api/customers_data/query', { filters: [{ field: 'registered_date', op: '>=', value: today }] });
      setNewUserCount(res.data?.data?.length ?? 0);
    };
    fetch();
    const id = setInterval(fetch, 86400000);
    return () => clearInterval(id);
  }, []);

  // Search
  const handleSearch = useCallback(() => { setCustomers([]); setLastVisible(null); fetchData(searchQuery); }, [fetchData, searchQuery]);
  const handleKeyDown = useCallback(e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }, [handleSearch]);
  useEffect(() => { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  // Date range filter
  const handleDateRange = () => {
    const from = startDate ? startDate.getTime() : 0;
    const to   = endDate   ? endDate.getTime()   : Date.now();
    apiClient.post('/api/customers_data/query', {
      filters: [{ field: 'created_date', op: '>=', value: new Date(from) }, { field: 'created_date', op: '<=', value: new Date(to) }],
      orderBy: [{ field: 'registered_date', direction: 'desc' }],
    }).then(r => setCustomers((r.data?.data || []).map(d => ({ id: d._id, data: d }))));
  };
  const handleReset = () => { setStartDate(null); setEndDate(null); fetchInitialData(); };

  // Pagination
  const totalPages  = Math.ceil(customers.length / itemsPerPage);
  const currentItems = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginate = (n) => setCurrentPage(n);
  const renderPageButtons = () => {
    let start = Math.max(1, currentPage - 5), end = Math.min(totalPages, start + 9);
    if (totalPages <= 10) end = totalPages;
    else if (currentPage <= 5) { start = 1; end = 10; }
    else if (currentPage >= totalPages - 4) { end = totalPages; start = end - 9; }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(i => (
      <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
        <button onClick={() => paginate(i)} className="page-link" style={{ color: 'black' }}>{i}</button>
      </li>
    ));
  };

  // Category filter
  const filterData = (cat) => {
    const query = cat === 'All'
      ? apiClient.post('/api/customers_data/query', { orderBy: [{ field: 'registered_date', direction: 'desc' }] })
      : apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_category', op: '==', value: cat }] });
    query.then(r => setCustomers((r.data?.data || []).map(d => ({ id: d._id, data: d }))));
  };

  const canEdit = permissible_roles.includes('edit_customers');
  const canAdd  = permissible_roles.includes('add_customers');

  return (
    <>
      <style>{styles}</style>
      {(loading || form.loading) && (
        <div className="loader-overlay">
          <div><img style={{ height: '6rem' }} src="images/loader.gif" alt="loading..." /></div>
        </div>
      )}

      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">

              {/* Top action bar */}
              <div className="row">
                <div className="col-sm-12">
                  <div className="home-tab">
                    <div className="d-sm-flex align-items-center justify-content-between border-bottom">
                      <ul className="nav nav-tabs" role="tablist"></ul>
                      <div className="btn-wrapper">
                        <button type="button" className="btn btn-primary text-white me-0 mr-2"
                          onClick={canAdd ? form.openForAdd : showPermissionError}>
                          <i className="icon-add"></i>Add Customer
                        </button>
                        <button type="button" className="btn btn-primary text-white me-0" style={{ marginLeft: '1rem' }}
                          onClick={() => navigate('/customers_report')}>
                          <i className="icon-download"></i>Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <CustomerStatsBar
                newUserCount={newUserCount}
                collectionSize={collectionSize}
                searchQuery={searchQuery}
                onSearchChange={e => { setSearchQuery(e.target.value); fetchData(e.target.value); }}
                onSearch={handleSearch}
                onKeyDown={handleKeyDown}
              />

              {/* Customer Table */}
              <div className="col-lg-12 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4 className="card-title">Customers</h4>
                      <div className="card-description">
                        <DatePicker selected={startDate} onChange={setStartDate} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd/MM/YYYY" placeholderText="From reg" className="form-control" />
                        <span style={{ width: '1rem' }}> TO </span>
                        <DatePicker selected={endDate} onChange={setEndDate} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd/MM/YYYY" placeholderText="To reg" className="form-control" />
                      </div>
                    </div>

                    {/* Category tabs */}
                    <div className="home-tab">
                      <div className="d-sm-flex align-items-center justify-content-between border-bottom">
                        <ul className="nav nav-tabs" role="tablist">
                          {['All', 'One Time', 'Subscription', 'Lead'].map(cat => (
                            <li className="nav-item" key={cat}>
                              <a className={`nav-link ${cat === 'All' ? 'active ps-0' : ''}`} href={`#${cat}`}
                                role="tab" aria-selected={cat === 'All'} onClick={() => filterData(cat)}>{cat}</a>
                            </li>
                          ))}
                        </ul>
                        <div className="btn-wrapper">
                          <button className="btn btn-primary text-white me-0" onClick={handleDateRange}><i className="icon-search"></i>Search</button>
                          <button className="btn btn-primary text-white me-0" onClick={handleReset}><i className="icon-reset"></i>Reset</button>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            {['ID', 'Hub', 'Customer Name', 'Phone', 'Source', 'Wallet Amount', 'Credit Limit', 'Registered On', 'Action'].map(h => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length === 0
                            ? <tr><td colSpan="9" style={{ textAlign: 'center' }}>No data found</td></tr>
                            : currentItems.map(({ id, data }) => (
                              <tr key={id}
                                onClick={() => permissible_roles.includes('view_customers') ? navigate(`/profile/${data.customer_id}`) : showPermissionError()}
                                style={{ cursor: 'pointer' }}>
                                <td>{data.customer_id}</td>
                                <td>{data.hub_name}</td>
                                <td><p>{data.customer_name}</p></td>
                                <td>{data.customer_phone}</td>
                                <td>{data.source}</td>
                                <td>₹ {data.wallet_balance}</td>
                                <td>₹ {data.credit_limit}</td>
                                <td>
                                  {(() => {
                                    try { const d = normalizeDateValue(data.registered_date); return d ? moment(d).format('DD-MM-YYYY, h:mm a') : 'Invalid Date'; }
                                    catch { return 'Invalid Date'; }
                                  })()}
                                </td>
                                <td>
                                  <button style={{ marginRight: '1rem', padding: '0.2rem 0.85rem' }}
                                    onClick={e => form.openForEdit(e, data, id)}
                                    className="btn btn-dark btn-sm">
                                    <i className="menu-icon mdi mdi-pencil" style={{ color: 'white' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <ul className="pagination">
                      <li className="page-item">
                        <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                      </li>
                      {renderPageButtons()}
                      <li className="page-item">
                        <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                      </li>
                      <li className="page-item">
                        <button className="page-link" onClick={fetchMoreData} disabled={loading}>Load More</button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <CustomerFormModal {...form} canEdit={canEdit} onRolePermission={showPermissionError} />
    </>
  );
}
