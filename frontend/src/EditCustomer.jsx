import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { extendMoment } from 'moment-range';
import Moment from 'moment';
import Swal from 'sweetalert2';

import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import Footer from './Footer';
import Loader from './components/common/Loader';
import Pagination from './components/common/Pagination';
import CustomerFormModal from './components/customers/CustomerFormModal';
import { useCustomerForm } from './hooks/useCustomerForm';
import apiClient from './services/apiClient';
import { getUserInfo, handleLogout } from './Utility';
import { normalizeDateValue } from './helpers';
import GlobalContext from './context/GlobalContext';

const moment = extendMoment(Moment);

function showPermissionError() {
  Swal.mixin({
    toast: true, background: '#d7e7e6', position: 'top-end',
    showConfirmButton: false, timer: 3000, timerProgressBar: true,
    didOpen: t => { t.addEventListener('mouseenter', Swal.stopTimer); t.addEventListener('mouseleave', Swal.resumeTimer); },
  }).fire({ icon: 'error', title: 'You are not authorised to do this action' });
}

export default function EditCustomers() {
  const { permissible_roles } = useContext(GlobalContext);
  const { loggedIn_user } = getUserInfo();
  const navigate = useNavigate();
  const params = useParams();

  // Auth guard
  useEffect(() => {
    if (localStorage.getItem('loggedIn') !== 'true') { navigate('/login'); return; }
    if (permissible_roles.length > 0 && !permissible_roles.includes('edit_customers')) {
      handleLogout(); navigate('/permission_denied');
    }
  }, [navigate, permissible_roles]);

  const [customers, setCustomers] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [collectionSize, setCollectionSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useCustomerForm({ onSuccess: fetchInitialData });

  async function fetchInitialData() {
    setLoading(true);
    const res = await apiClient.post('/api/customers_data/query', {
      orderBy: [{ field: 'updated_date', direction: 'desc' }], limit: 20,
    });
    const docs = res.data?.data || [];
    setCustomers(docs.map(d => ({ id: d._id, data: d })));
    setLastVisible(docs[docs.length - 1] ?? null);
    setLoading(false);
  }

  async function fetchCollectionSize() {
    try {
      const res = await apiClient.post('/api/customers_data/query', { countOnly: true });
      setCollectionSize(res.data?.count ?? 0);
    } catch (e) { console.error(e); }
  }

  const fetchMoreData = async () => {
    if (!lastVisible) return;
    setLoading(true);
    const res = await apiClient.post('/api/customers_data/query', {
      orderBy: [{ field: 'updated_date', direction: 'desc' }], limit: 20, startAfter: lastVisible,
    });
    const docs = res.data?.data || [];
    setCustomers(prev => [...prev, ...docs.map(d => ({ id: d._id, data: d }))]);
    setLastVisible(docs[docs.length - 1] ?? null);
    setLoading(false);
  };

  const fetchData = useCallback(async (term = '') => {
    setLoading(true);
    const map = new Map();
    const end = term.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
    const results = await Promise.all([
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_name', op: '>=', value: term }, { field: 'customer_name', op: '<', value: end }], limit: 20 }),
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_phone', op: '==', value: term }] }),
      apiClient.post('/api/customers_data/query', { filters: [{ field: 'customer_id', op: '==', value: term }] }),
    ]);
    results.forEach(r => (r.data?.data || []).forEach(d => map.set(d._id, { id: d._id, data: d })));
    setCustomers(Array.from(map.values()));
    setLoading(false);
  }, []);

  // Auto-open the edit modal for the customer specified in the URL param
  useEffect(() => {
    if (!params.id) return;
    apiClient.post('/api/customers_data/query', {
      filters: [{ field: 'customer_id', op: '==', value: params.id }]
    }).then(res => {
      const docs = res.data?.data || [];
      if (docs.length > 0) {
        const doc = docs[0];
        form.openForEdit({ stopPropagation: () => {} }, doc, doc._id);
      }
    });
  }, [params.id]);

  useEffect(() => { fetchInitialData(); fetchCollectionSize(); }, []);

  const handleSearch = useCallback(() => { setCustomers([]); setLastVisible(null); fetchData(searchQuery); }, [fetchData, searchQuery]);
  const handleKeyDown = useCallback(e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }, [handleSearch]);
  useEffect(() => { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const handleDateRange = () => {
    const from = startDate?.getTime() ?? 0;
    const to   = endDate?.getTime()   ?? Date.now();
    apiClient.post('/api/customers_data/query', {
      filters: [{ field: 'created_date', op: '>=', value: new Date(from) }, { field: 'created_date', op: '<=', value: new Date(to) }],
      orderBy: [{ field: 'updated_date', direction: 'desc' }],
    }).then(r => setCustomers((r.data?.data || []).map(d => ({ id: d._id, data: d }))));
  };

  const totalPages  = Math.ceil(customers.length / itemsPerPage);
  const currentItems = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const canEdit = permissible_roles.includes('edit_customers');

  return (
    <>
      <Loader show={loading || form.loading} />
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row">
                <div className="col-sm-12">
                  <div className="home-tab">
                    <div className="d-sm-flex align-items-center justify-content-between border-bottom">
                      <h4>Edit Customers</h4>
                      <div className="btn-wrapper">
                        <button className="btn btn-primary text-white me-0 mr-2"
                          onClick={canEdit ? form.openForAdd : showPermissionError}>
                          <i className="icon-add"></i>Add Customer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-12 grid-margin stretch-card" style={{ marginTop: '1rem' }}>
                <div className="card">
                  <div className="card-body">
                    {/* Search + Date filters */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <input type="search" className="form-control" style={{ maxWidth: '300px' }}
                        value={searchQuery} onChange={e => { setSearchQuery(e.target.value); fetchData(e.target.value); }}
                        placeholder="Search by name / phone / ID" />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <DatePicker selected={startDate} onChange={setStartDate} dateFormat="dd/MM/YYYY" placeholderText="From" className="form-control" />
                        <DatePicker selected={endDate} onChange={setEndDate} dateFormat="dd/MM/YYYY" placeholderText="To" className="form-control" />
                        <button className="btn btn-primary btn-sm" onClick={handleDateRange}>Search</button>
                        <button className="btn btn-primary btn-sm" onClick={() => { setStartDate(null); setEndDate(null); fetchInitialData(); }}>Reset</button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            {['ID', 'Hub', 'Customer Name', 'Phone', 'Source', 'Wallet', 'Credit Limit', 'Registered On', 'Action'].map(h => (
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
                                <td>{data.customer_name}</td>
                                <td>{data.customer_phone}</td>
                                <td>{data.source}</td>
                                <td>₹ {data.wallet_balance}</td>
                                <td>₹ {data.credit_limit}</td>
                                <td>
                                  {(() => {
                                    try { const d = normalizeDateValue(data.registered_date); return d ? moment(d).format('DD-MM-YYYY') : '—'; }
                                    catch { return '—'; }
                                  })()}
                                </td>
                                <td>
                                  <button style={{ padding: '0.2rem 0.85rem' }}
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

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      onLoadMore={fetchMoreData}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>

      <CustomerFormModal {...form} canEdit={canEdit} onRolePermission={showPermissionError} />
    </>
  );
}
