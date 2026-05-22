import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import Swal from 'sweetalert2';

import Sidebar from './Sidebar';
import TopPanel from './TopPanel';
import Footer from './Footer';
import Loader from './components/common/Loader';
import Pagination from './components/common/Pagination';
import HubFormModal from './components/hubs/HubFormModal';
import HubUserFormModal from './components/hubs/HubUserFormModal';
import GlobalContext from './context/GlobalContext';
import { handleLogout } from './Utility';
import apiClient from './services/apiClient';
import { ref, getDownloadURL, uploadBytesResumable, storage } from './services/uploadService.jsx';

// ─── helpers ────────────────────────────────────────────────────────────────
const toast = (icon, title) =>
  Swal.mixin({ toast: true, background: '#69aba6', position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }).fire({ icon, title });

const confirmDelete = () =>
  Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' });

const ITEM_PER_PAGE = 20;

const INITIAL_HUB  = { hub_name: '', address: '', state: '', city: '', mobile_no: '', status: '', updated_date: new Date(), created_date: new Date() };
const INITIAL_USER = { first_name: '', last_name: '', hub_name: '', email: '', role: '', username: '', password: '', confirm_password: '', image: '', phone_no: '', status: '1', cash_collector: false, updated_date: new Date(), created_date: new Date() };

// ─── helpers for modal show/hide using CSS classes ──────────────────────────
const showModal = css => {
  const possibleFns = [css + 'modelshow', 'modelshow' + css, css + 'modalShow', 'modalShow' + css];
  for (const fn of possibleFns) {
    if (typeof window[fn] === 'function') {
      window[fn]();
      return;
    }
  }
};

const hideModal = css => {
  const possibleFns = [css + 'modalHide', 'modalHide' + css, css + 'modalhide', 'modalhide' + css];
  for (const fn of possibleFns) {
    if (typeof window[fn] === 'function') {
      window[fn]();
      return;
    }
  }
};

function HubDist() {
  const { permissible_roles, state_user } = useContext(GlobalContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // auth guard
  useEffect(() => {
    if (localStorage.getItem('loggedIn') !== 'true') { navigate('/login'); return; }
    if (permissible_roles.length > 0 && !permissible_roles.includes('hubs_dist')) {
      handleLogout(); navigate('/permission_denied');
    }
  }, [navigate, permissible_roles]);

  // ─── global loading + search ─────────────────────────────────────────────
  const [loading, setLoading]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── hub list ─────────────────────────────────────────────────────────────
  const [data, setData]             = useState([]);
  const [hubOptions, setHubOptions] = useState([]);
  const [hubCheck, setHubCheck]     = useState([]);
  const [hublabels]                 = useState({ 'Dwarka':'Dwarka','North Hub':'North Delhi','East Delhi':'East Delhi','Whyte Farms Delhi':'South Delhi','Noida':'Noida','West Delhi':'West Delhi','Whyte Farms Gurgaon':'Gurgaon' });

  // ─── hub tab / view ───────────────────────────────────────────────────────
  const [showTabs, setShowTabs]     = useState(false);
  const [activeHub, setActiveHub]   = useState('');
  const [dataUser, setDataUser]     = useState([]);
  const [dataLocation, setDataLocation] = useState([]);
  const [userMapID, setUserMapID]   = useState({});

  // ─── hub form ─────────────────────────────────────────────────────────────
  const [edit, setEdit]             = useState(false);
  const [editID, setEditID]         = useState('');
  const [submit, setSubmit]         = useState(INITIAL_HUB);
  const [errors]                    = useState({});

  // ─── user form ────────────────────────────────────────────────────────────
  const [editUser, setEditUser]     = useState(false);
  const [editIDUser, setEditIDUser] = useState('');
  const [submitUser, setSubmitUser] = useState({ ...INITIAL_USER });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  // ─── location form / selects ──────────────────────────────────────────────
  const [routeOptions, setRouteOptions]   = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [deliveryExecutives, setDeliveryExecutives] = useState([]);
  const [selectedDeliveryExecutive, setSelectedDeliveryExecutive] = useState(null);
  const [selectedMapOption, setSelectedMapOption] = useState(null);
  const [selectedRouteOptions, setSelectedRouteOptions] = useState('');
  const [editIDLocation, setEditIDLocation] = useState('');
  const [selectedHub, setSelectedHub] = useState('');
  const [username, setUsername]       = useState('');
  const [dePhone, setDePhone]         = useState('');
  const [hubUserID, setHubUserID]     = useState('');

  // ─── transfer within hub ──────────────────────────────────────────────────
  const [userOptions, setUserOptions]           = useState([]);
  const [selectedUserFrom, setSelectedUserFrom] = useState(null);
  const [selectedUserTo, setSelectedUserTo]     = useState(null);
  const [locations, setLocations]               = useState([]);
  const [locationsTo, setLocationsTo]           = useState([]);
  const [selectedLocationsFrom, setSelectedLocationsFrom] = useState([]);
  const [selectedRoute, setSelectedRoute]       = useState('');

  // ─── transfer hub-wise ────────────────────────────────────────────────────
  const [hubOptionsOne, setHubOptionsOne]           = useState([]);
  const [filteredHubOptions, setFilteredHubOptions] = useState([]);
  const [selectedHubFrom, setSelectedHubFrom]       = useState(null);
  const [selectedHubTo, setSelectedHubTo]           = useState(null);
  const [userOptionsFrom, setUserOptionsFrom]       = useState([]);
  const [userOptionsTo, setUserOptionsTo]           = useState([]);
  const [locationsFrom, setLocationsFrom]           = useState([]);
  const [locationsToo, setLocationsToo]             = useState([]);

  // ─── pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(0);
  const [currentPageL, setCurrentPageL] = useState(1);
  const [totalPagesL, setTotalPagesL]   = useState(0);

  // ═══════════════ DATA FETCHING ═══════════════════════════════════════════

  const fetchHubs = useCallback(async () => {
    const docs = await apiClient.post('/api/hubs_data/query', { filters: [] }).then(r => r.data?.data || []);
    setData(docs.map(d => ({ id: d._id, data: d })));
    const names = [...new Set(docs.map(d => d.hub_name))];
    setHubOptions(names.map(n => ({ value: n, label: n })));
    setHubCheck(docs.map(d => d.hub_name.toLowerCase()));
  }, []);

  useEffect(() => { fetchHubs(); }, [fetchHubs]);

  const usermap = async (hubname) => {
    const docs = await apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: hubname }] }).then(r => r.data?.data || []);
    setUserMapID(Object.fromEntries(docs.map(d => [String(d.hub_user_id), `${d.first_name} ${d.last_name}`])));
  };

  const fetchHubUsers = useCallback(async (hub) => {
    const docs = await apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: hub }] }).then(r => r.data?.data || []);
    setDataUser(docs.map(d => ({ id: d._id, data: d })));
    setUserOptions(docs.map(d => ({ value: `${d.first_name} ${d.last_name}`, label: `${d.first_name} ${d.last_name}`, delivery_exe_id: d.hub_user_id, hub_name: d.hub_name })));
    setTotalPages(Math.ceil(docs.length / ITEM_PER_PAGE));
  }, []);

  const fetchLocationHub = async (hub) => {
    const docs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'hub_name', op: '==', value: hub }] }).then(r => r.data?.data || []);
    setDataLocation(docs.map(d => ({ id: d._id, data: d })));
    setTotalPagesL(Math.ceil(docs.length / ITEM_PER_PAGE));
  };

  // Delivery executives & locations per selected hub (for location modal)
  useEffect(() => {
    if (!selectedHub) { setDeliveryExecutives([]); setLocationOptions([]); return; }
    apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: selectedHub }] })
      .then(r => setDeliveryExecutives((r.data?.data || []).map(d => ({ value: String(d.hub_user_id), label: `${d.first_name} ${d.last_name}`, user: d }))));
    apiClient.post('/api/locations_data/query', { filters: [{ field: 'hub_name', op: '==', value: selectedHub }] })
      .then(r => setLocationOptions((r.data?.data || []).map(d => ({ value: `${d.area}, ${d.subarea}`, label: `${d.area}, ${d.subarea}` }))));
  }, [selectedHub]);

  // Transfer within hub — fetch locations for FROM user
  const Anushka = useCallback(async () => {
    if (!activeHub) return;
    const docs = await apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: activeHub }] }).then(r => r.data?.data || []);
    setUserOptions(docs.map(d => ({ value: `${d.first_name} ${d.last_name}`, label: `${d.first_name} ${d.last_name}`, delivery_exe_id: d.hub_user_id, hub_name: d.hub_name })));
  }, [activeHub]);
  useEffect(() => { Anushka(); }, [Anushka]);

  const tushar = useCallback(async () => {
    if (!selectedUserFrom) return;
    const docs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(selectedUserFrom.delivery_exe_id) }] }).then(r => r.data?.data || []);
    setLocations(docs.map(d => ({ id: d._id, data: d })));
    setSelectedRoute(docs[0]?.route || '');
  }, [selectedUserFrom]);
  useEffect(() => { tushar(); }, [tushar]);

  useEffect(() => {
    if (!selectedUserTo) return;
    apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(selectedUserTo.delivery_exe_id) }] })
      .then(r => setLocationsTo((r.data?.data || []).map(d => ({ id: d._id, data: d }))));
  }, [selectedUserTo]);

  // ═══════════════ SHOW TABS ═══════════════════════════════════════════════

  const showtabs = (hub) => {
    setActiveHub(hub); setSelectedHub(hub); setShowTabs(true);
    setHubOptionsOne([{ value: hub, label: hub }]);
    usermap(hub); fetchHubUsers(hub); fetchLocationHub(hub);
  };

  // ═══════════════ HUB FORM ════════════════════════════════════════════════

  const addNew = async () => {
    try {
      await fetchHubs();
    } catch (error) {
      console.error("Error fetching hubs before add:", error);
    }
    setSubmit(INITIAL_HUB);
    setEdit(false);
    showModal('Hub');
  };

  const changeStatusForm = (d, id) => {
    setEdit(true); setEditID(id);
    setSubmit({ id, hub_name: d.hub_name, address: d.address, state: d.state, city: d.city, mobile_no: d.mobile_no, status: d.status, updated_date: new Date(), created_date: d.created_date || new Date() });
    showModal('Hub');
  };

  const handleChange = e => {
    const { id, value } = e.target;
    setSubmit(p => ({ ...p, [id]: id === 'mobile_no' ? value.replace(/\D/g, '') : value.replace(/[^\w\s.@/:+\-=]/gi, '') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (edit) {
      await apiClient.put(`/api/hubs_data/${editID}`, { ...submit, status: '1', updated_date: new Date() });
      toast('success', 'Hub Updated Successfully');
    } else {
      if (hubCheck.includes(submit.hub_name.toLowerCase())) {
        Swal.fire({ icon: 'error', title: 'Hub Name Exists', text: 'This hub name already exists.' });
        setLoading(false); return;
      }
      await apiClient.post('/api/hubs_data/add', { ...submit, status: '1', updated_date: new Date(), created_date: new Date() });
      toast('success', 'Hub Added Successfully');
      await fetchHubs();
    }
    hideModal('Hub'); setSubmit(INITIAL_HUB); setLoading(false);
  };

  // ═══════════════ USER FORM ═══════════════════════════════════════════════

  const addNewuser = () => {
    setEditUser(false); setSubmitUser({ ...INITIAL_USER, hub_name: activeHub });
    setImagePreview(null); setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showModal('user');
  };

  const changeStatusFormUser = (d, id) => {
    setEditUser(true); setEditIDUser(id);
    setSubmitUser({ id, first_name: d.first_name, last_name: d.last_name, email: d.email, role: d.role, username: d.username, password: d.password, confirm_password: d.password, image: d.image, phone_no: d.phone_no, status: '1', cash_collector: d.cash_collector, updated_date: new Date(), created_date: d.created_date || new Date() });
    setImagePreview(d.image || null); showModal('user');
  };

  const handleChangeuser = e => {
    const { id, value } = e.target;
    setSubmitUser(p => ({ ...p, [id]: id === 'phone_no' ? value.replace(/\D/g, '') : value }));
    if (id === 'confirm_password') setPasswordMatch(submitUser.password === value);
  };

  const handleImageChange = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const removeImage = () => { setImagePreview(null); setImageFile(null); };

  const checkPasswordCriteria = pw => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 8;

  const genereateHubUserId = async () => {
    const docs = await apiClient.post('/api/hubs_users_data/query', { filters: [] }).then(r => r.data?.data || []);
    if (docs.length === 0) return 1;
    const maxId = Math.max(...docs.map(d => parseInt(d.hub_user_id) || 0));
    return maxId + 1;
  };

  const finishSubmitUser = () => {
    toast('success', editUser ? 'User Updated Successfully' : 'User Added Successfully');
    fetchHubUsers(activeHub); usermap(activeHub);
  };

  const handleSubmituser = async (e) => {
    e.preventDefault();
    if (submitUser.phone_no.length !== 10) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Phone number must be 10 digits' }); return; }
    if (submitUser.password !== submitUser.confirm_password) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Passwords do not match' }); return; }
    if (!checkPasswordCriteria(submitUser.password)) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Password must be 8+ chars with uppercase, lowercase, and a number.' }); return; }

    setLoading(true);
    const huid = await genereateHubUserId();

    const saveUser = async (imageUrl) => {
      const payload = { ...submitUser, updated_date: new Date(), ...(imageUrl ? { image: imageUrl } : {}) };
      if (editUser) {
        await apiClient.put(`/api/hubs_users_data/${editIDUser}`, payload);
      } else {
        // uniqueness checks
        const [u, p, h] = await Promise.all([
          apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'username', op: '==', value: submitUser.username }] }).then(r => r.data?.data?.length > 0),
          apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'phone_no', op: '==', value: submitUser.phone_no }] }).then(r => r.data?.data?.length > 0),
          apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_user_id', op: '==', value: String(huid) }] }).then(r => r.data?.data?.length > 0),
        ]);
        if (u) { Swal.fire({ icon: 'error', title: 'Username exists' }); setLoading(false); return; }
        if (p) { Swal.fire({ icon: 'error', title: 'Phone exists' }); setLoading(false); return; }
        if (h) { Swal.fire({ icon: 'error', title: 'Hub User ID exists' }); setLoading(false); return; }
        await apiClient.post('/api/hubs_users_data/add', { ...payload, hub_user_id: String(huid), created_date: new Date() });
      }
      finishSubmitUser();
    };

    if (imageFile) {
      const storageRef = ref(storage, `files/${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      uploadTask.on('state_changed', null, alert, async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await saveUser(url);
      });
    } else {
      await saveUser(null);
    }

    setSubmitUser({ ...INITIAL_USER }); setImagePreview(null); setImageFile(null);
    hideModal('user'); setLoading(false);
  };

  const deleteDatauser = async (id, d) => {
    const refs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: `${d.first_name} ${d.last_name}` }] }).then(r => r.data?.data || []);
    if (refs.length > 0) { Swal.fire('Cannot delete!', 'This user has assigned locations.', 'warning'); return; }
    const res = await confirmDelete();
    if (res.isConfirmed) {
      setLoading(true);
      await apiClient.delete(`/api/hubs_users_data/${id}`);
      hideModal('user'); Swal.fire('Deleted!', 'User has been deleted.', 'success');
      setLoading(false);
    }
  };

  // ═══════════════ LOCATION FORM ═══════════════════════════════════════════

  const fetchRoutes = useCallback(async () => {
    if (!activeHub) { setRouteOptions([]); return; }
    const docs = await apiClient.post('/api/routes_data/query', { filters: [{ field: 'hub_name', op: '==', value: activeHub }] }).then(r => r.data?.data || []);
    setRouteOptions(docs.map(d => ({ value: d.route, label: d.route })));
  }, [activeHub]);

  const addNewLocation = () => {
    setSelectedMapOption(null); setSelectedRouteOptions(''); setSelectedDeliveryExecutive(null);
    fetchRoutes(); showModal('location');
  };

  const changeStatusFormLocation = (d, id) => {
    setSelectedMapOption([{ value: d.location, label: d.location }]);
    setSelectedRouteOptions(d.route); setSelectedDeliveryExecutive(d.delivery_exe_id); setEditIDLocation(id);
    fetchRoutes(); showModal('locationTHloma');
  };

  const handleRouteChange = async (option) => {
    setSelectedRouteOptions(option?.value || '');
    const docs = await apiClient.post('/api/routes_data/query', { filters: [{ field: 'route', op: '==', value: option.value }] }).then(r => r.data?.data || []);
    const locs = docs.flatMap(d => (d.locations || []).map(l => ({ value: l, label: l })));
    setLocationOptions(locs); setSelectedMapOption(locs);
  };

  const handleDeliveryExecutiveChange = option => {
    setSelectedDeliveryExecutive(option?.value || null);
    setUsername(option?.user?.username || '');
    setDePhone(option?.user?.phone_no || '');
    setHubUserID(String(option?.user?.hub_user_id || ''));
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    const locs = selectedMapOption?.map(l => l.value) || [];
    if (!locs.length) { Swal.fire('Warning', 'Select at least one location.', 'warning'); return; }
    setLoading(true);
    try {
      for (const loc of locs) {
        await apiClient.post('/api/hubs_locations_data/add', { route: selectedRouteOptions, hub_name: activeHub, location: loc, delivery_exe_id: selectedDeliveryExecutive, username, de_phone: dePhone, hub_user_id: hubUserID, status: '1', updated_date: new Date(), created_date: new Date() });
      }
      toast('success', 'Location Added');
      setSelectedMapOption(null); setSelectedRouteOptions(''); setSelectedDeliveryExecutive(null);
      hideModal('location'); fetchLocationHub(activeHub);
    } catch (err) { Swal.fire('Error!', 'Something went wrong.', 'error'); }
    setLoading(false);
  };

  const handleSubmitLocationEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const locs = selectedMapOption?.map(l => l.value) || [];
    for (const loc of locs) {
      await apiClient.post('/api/hubs_locations_data/add', { route: selectedRouteOptions, hub_name: activeHub, location: loc, delivery_exe_id: selectedDeliveryExecutive, username, de_phone: dePhone, hub_user_id: hubUserID, status: '1', updated_date: new Date(), created_date: new Date() });
    }
    if (editIDLocation) await apiClient.delete(`/api/hubs_locations_data/${editIDLocation}`);
    toast('success', 'Location Updated');
    setSelectedMapOption(null); setSelectedRouteOptions(''); setSelectedDeliveryExecutive(null);
    hideModal('locationTHloma'); fetchLocationHub(activeHub); setLoading(false);
  };

  const deleteDataLocation = async (id) => {
    const res = await confirmDelete();
    if (res.isConfirmed) {
      setLoading(true);
      await apiClient.delete(`/api/hubs_locations_data/${id}`);
      Swal.fire('Deleted!', 'Data has been deleted.', 'success');
      fetchLocationHub(activeHub); setLoading(false);
    }
  };

  // ═══════════════ TRANSFER WITHIN HUB ════════════════════════════════════

  const addtransferLocation = () => {
    setSelectedUserFrom(null); setSelectedUserTo(null); setLocations([]); setLocationsTo([]); setSelectedLocationsFrom([]);
    showModal('locationT');
  };

  const handleLocationFromChange = e => {
    const { value, checked } = e.target;
    setSelectedLocationsFrom(p => checked ? [...p, value] : p.filter(l => l !== value));
  };

  const tusharkumar = async (hub, locationarr, exeid) => {
    for (const loc of locationarr) {
      const docs = await apiClient.post('/api/customers_data/query', { filters: [{ field: 'location', op: '==', value: loc }, { field: 'hub_name', op: '==', value: hub }] }).then(r => r.data?.data || []);
      for (const doc of docs) await apiClient.put(`/api/customers_data/${doc._id}`, { delivery_exe_id: exeid, updated_date: new Date() });
    }
  };

  const handleSubmitTransferLocation = async (e) => {
    e.preventDefault();
    if (!selectedLocationsFrom.length || !selectedUserTo) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Fill all required fields!' }); return; }
    if (selectedUserFrom?.delivery_exe_id === selectedUserTo?.delivery_exe_id) { Swal.fire({ icon: 'error', title: 'Oops...', text: "Can't transfer to same user" }); return; }
    setLoading(true);
    try {
      const names = selectedLocationsFrom.map(l => (typeof l === 'string' ? l : l.location).trim());
      const [toDocs, fromDocs] = await Promise.all([
        apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(selectedUserTo.delivery_exe_id) }, { field: 'location', op: 'in', value: names }] }).then(r => r.data?.data || []),
        apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(selectedUserFrom.delivery_exe_id) }, { field: 'location', op: 'in', value: names }] }).then(r => r.data?.data || []),
      ]);
      if (toDocs.length) { Swal.fire({ icon: 'warning', title: 'Duplicate Location(s)', text: `Already assigned: ${toDocs.map(d => d.location).join(', ')}` }); setLoading(false); return; }
      for (const doc of fromDocs) await apiClient.delete(`/api/hubs_locations_data/${doc._id}`);
      for (const loc of names) await apiClient.post('/api/hubs_locations_data/add', { location: loc, route: selectedRoute, hub_name: selectedUserTo.hub_name, delivery_exe_id: String(selectedUserTo.delivery_exe_id), created_date: new Date(), updated_date: new Date(), status: '1' });
      await tusharkumar(selectedUserTo.hub_name, names, String(selectedUserTo.delivery_exe_id));
      toast('success', 'Locations Transferred Successfully');
      setLocations(p => p.filter(l => !names.includes(l.data?.location)));
      setSelectedUserFrom(null); setSelectedUserTo(null); setSelectedLocationsFrom([]);
      hideModal('locationT');
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.message }); }
    setLoading(false);
  };

  // ═══════════════ TRANSFER HUB-WISE ══════════════════════════════════════

  const addtransferLocationHW = () => {
    setSelectedHubFrom(null); setSelectedHubTo(null); setSelectedUserFrom(null); setSelectedUserTo(null);
    setSelectedLocationsFrom([]); setLocationsFrom([]); setLocationsToo([]);
    showModal('locationTH');
  };

  const handleHubFromChangeNew = async (option) => {
    setSelectedHubFrom(option);
    if (!option) { setUserOptionsFrom([]); setLocationsFrom([]); return; }
    const users = await apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: option.value }] }).then(r => (r.data?.data || []).map(d => ({ value: d.hub_user_id, label: `${d.first_name} ${d.last_name}` })));
    setUserOptionsFrom(users);
    setHubOptionsOne([{ value: option.value, label: option.label }]);
    setFilteredHubOptions(hubOptions.filter(h => h.value !== option.value));
  };

  const handleHubToChangeNew = async (option) => {
    setSelectedHubTo(option);
    if (!option) { setUserOptionsTo([]); setLocationsToo([]); return; }
    const users = await apiClient.post('/api/hubs_users_data/query', { filters: [{ field: 'hub_name', op: '==', value: option.value }] }).then(r => (r.data?.data || []).map(d => ({ value: d.hub_user_id, label: `${d.first_name} ${d.last_name}` })));
    setUserOptionsTo(users);
  };

  const handleUserFromChange1 = async (option) => {
    setSelectedUserFrom(option);
    if (!option) { setLocationsFrom([]); return; }
    const docs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(option.value) }] }).then(r => r.data?.data || []);
    setLocationsFrom(docs.map(d => ({ id: d._id, data: d })));
  };

  const handleUserToChange1 = async (option) => {
    setSelectedUserTo(option);
    if (!option) { setLocationsToo([]); return; }
    const docs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'delivery_exe_id', op: '==', value: String(option.value) }] }).then(r => r.data?.data || []);
    setLocationsToo(docs.map(d => ({ id: d._id, data: d })));
  };

  const handleLocationFromChangeNew = e => {
    const { value, checked } = e.target;
    setSelectedLocationsFrom(p => checked ? [...p, value] : p.filter(l => l !== value));
  };

  const handleSubmitTHNew = async (e) => {
    e.preventDefault();
    if (!selectedHubFrom || !selectedUserFrom || !selectedLocationsFrom.length || !selectedHubTo || !selectedUserTo) { alert('❌ Please fill all fields!'); return; }
    setLoading(true);
    try {
      for (let locName of selectedLocationsFrom) {
        const [loc, subloc] = locName.split(',');
        const fromDocs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'location', op: '==', value: locName }, { field: 'delivery_exe_id', op: '==', value: String(selectedUserFrom.value) }] }).then(r => r.data?.data || []);
        let locationId = '';
        if (fromDocs.length) { locationId = fromDocs[0].location_id || ''; await apiClient.delete(`/api/hubs_locations_data/${fromDocs[0]._id}`); }
        const toDocs = await apiClient.post('/api/hubs_locations_data/query', { filters: [{ field: 'location', op: '==', value: locName }, { field: 'delivery_exe_id', op: '==', value: String(selectedUserTo.value) }] }).then(r => r.data?.data || []);
        const payload = { delivery_exe_id: String(selectedUserTo.value), delivery_executive: selectedUserTo.label, hub_name: selectedHubTo.value, hub_user_id: String(selectedUserTo.value), location_id: locationId, route: selectedUserTo.label, status: '1', updated_date: new Date() };
        if (toDocs.length) await apiClient.put(`/api/hubs_locations_data/${toDocs[0]._id}`, payload);
        else await apiClient.post('/api/hubs_locations_data/add', { ...payload, location: locName, created_date: new Date() });
        // Update locations_data
        const locDataDocs = await apiClient.post('/api/locations_data/query', { filters: [{ field: 'area', op: '==', value: locName }] }).then(r => r.data?.data || []);
        const locPayload = { area: (loc || '').trim(), hub_name: selectedHubTo.value, subarea: (subloc || '').trim(), status: '1', updated_date: new Date(), visible_on: 'Internal', delivery_exe_id: selectedUserTo.value, route: selectedUserTo.label, location_id: locationId };
        if (locDataDocs.length) await apiClient.put(`/api/locations_data/${locDataDocs[0]._id}`, locPayload);
        else await apiClient.post('/api/locations_data/add', { ...locPayload, created_date: new Date() });
      }
      toast('success', 'Transfer Successfully');
      setSelectedHubFrom(null); setSelectedHubTo(null); setSelectedUserFrom(null); setSelectedUserTo(null);
      setSelectedLocationsFrom([]); setLocationsFrom([]); setLocationsToo([]);
      hideModal('locationTH');
    } catch (err) { Swal.fire({ icon: 'error', title: 'Transfer Failed', text: err.message }); }
    setLoading(false);
  };

  // ═══════════════ ROLE PERMISSION ═════════════════════════════════════════
  const rolePermission = () =>
    Swal.mixin({ toast: true, background: '#d7e7e6', position: 'top-end', showConfirmButton: false, timer: 3000 }).fire({ icon: 'error', title: 'You are not authorised to do this action' });

  // ═══════════════ FILTERED / PAGINATED DATA ════════════════════════════════
  const q = searchQuery.toLowerCase();
  const filteredUsers = dataUser.filter(({ data: d }) => {
    try { return [d.first_name, d.last_name, d.email, d.role, d.username, d.phone_no, d.status].some(v => v?.toLowerCase().includes(q)); }
    catch { return false; }
  });
  const filteredLocs = dataLocation.filter(({ data: d }) => {
    try { return d.route?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q) || userMapID[d.delivery_exe_id]?.toLowerCase().includes(q); }
    catch { return d.route?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q); }
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEM_PER_PAGE, currentPage * ITEM_PER_PAGE);
  const paginatedLocs  = filteredLocs.slice((currentPageL - 1) * ITEM_PER_PAGE, currentPageL * ITEM_PER_PAGE);

  // ═══════════════ RENDER ══════════════════════════════════════════════════

  return (
    <>
      <Loader show={loading} />
      <div className="container-scroller">
        <TopPanel />
        <div className="container-fluid page-body-wrapper">
          <Sidebar />
          <div className="main-panel">
            <div className="content-wrapper">

              {showTabs ? (
                /* ─── HUB DETAIL (Locations + Users tabs) ─── */
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span onClick={() => setShowTabs(false)} style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        <img width="20" height="20" src="https://img.icons8.com/flat-round/64/circled-left.png" alt="back" /> Go Back
                      </span>
                      <h4 className="card-title"><span style={{ color: '#34b1aa' }}>{activeHub}</span> : Hubs Data</h4>
                    </div>

                    <div className="home-tab">
                      <div className="align-items-center justify-content-between border-bottom" style={{ background: '#4a54ba', borderRadius: '15px' }}>
                        <ul className="nav nav-tabs" role="tablist">
                          <li className="nav-item" style={{ marginLeft: 10 }}>
                            <a className="nav-link ps-0" id="home-tab" data-bs-toggle="tab" href="#overview" role="tab" onClick={() => setSearchQuery('')}>Locations</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" id="profile-tab" data-bs-toggle="tab" href="#audiences" role="tab" onClick={() => setSearchQuery('')}>Users</a>
                          </li>
                          <li className="nav-item">
                            <input style={{ border: '1px solid grey', borderRadius: '1rem', marginTop: 3, marginLeft: '1rem', paddingLeft: '1rem', height: 32 }}
                              type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); setCurrentPageL(1); }} placeholder="Search..." />
                          </li>
                        </ul>
                      </div>

                      <div className="tab-content tab-content-basic">
                        {/* ── Locations Tab ── */}
                        <div className="tab-pane fade show active" id="overview" role="tabpanel">
                          <p className="card-description">
                            {['transfer_location_hub_wise', 'transfer_location', 'add_route'].map((role, i) => {
                              const labels = ['Transfer Location-Hub Wise', 'Transfer Location', 'Add Route'];
                              const actions = [addtransferLocationHW, addtransferLocation, addNewLocation];
                              return (
                                <button key={role} type="button" className="btn btn-success btn-rounded btn-sm" style={{ color: 'white' }}
                                  onClick={permissible_roles.includes(role) ? actions[i] : rolePermission}>
                                  {labels[i]}
                                </button>
                              );
                            })}
                          </p>
                          <div className="table-responsive">
                            <table className="table table-striped">
                              <thead><tr><th>Route</th><th>Location</th><th>Delivery Executive</th><th>Action</th></tr></thead>
                              <tbody>
                                {paginatedLocs.map(({ id, data: d }) => (
                                  <tr key={id}>
                                    <td>{d.route}</td>
                                    <td>{d.location}</td>
                                    <td>{userMapID[d.delivery_exe_id]}</td>
                                    <td>
                                      <button style={{ marginRight: '1rem', padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                        onClick={permissible_roles.includes('edit_location_route') ? () => changeStatusFormLocation(d, id) : rolePermission}>
                                        <i className="menu-icon mdi mdi-map-marker" style={{ color: 'white' }}></i>
                                      </button>
                                      <button style={{ padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                        onClick={permissible_roles.includes('delete_location') ? () => deleteDataLocation(id) : rolePermission}>
                                        <i className="menu-icon mdi mdi-delete" style={{ color: 'white' }}></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Pagination currentPage={currentPageL} totalPages={Math.ceil(filteredLocs.length / ITEM_PER_PAGE)} onPageChange={setCurrentPageL} />
                        </div>

                        {/* ── Users Tab ── */}
                        <div className="tab-pane fade" id="audiences" role="tabpanel">
                          <p className="card-description">
                            <button type="button" className="btn btn-success btn-rounded btn-sm" style={{ color: 'white' }}
                              onClick={permissible_roles.includes('add_hub_users') ? addNewuser : rolePermission}>Add User</button>
                          </p>
                          <div className="table-responsive">
                            <table className="table table-striped">
                              <thead><tr><th>Hub User Id</th><th>First Name</th><th>Last Name</th><th>Email</th><th>Role</th><th>Username</th><th>Phone</th><th>Action</th></tr></thead>
                              <tbody>
                                {paginatedUsers.map(({ id, data: d }) => (
                                  <tr key={id}>
                                    <td>{d.hub_user_id}</td><td>{d.first_name}</td><td>{d.last_name}</td>
                                    <td>{d.email}</td><td>{d.role}</td><td>{d.username}</td><td>{d.phone_no}</td>
                                    <td>
                                      <button style={{ marginRight: '1rem', padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                        onClick={permissible_roles.includes('edit_hub_users') ? () => changeStatusFormUser(d, id) : rolePermission}>
                                        <i className="menu-icon mdi mdi-pencil" style={{ color: 'white' }}></i>
                                      </button>
                                      <button style={{ padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                        onClick={permissible_roles.includes('delete_hub_users') ? () => deleteDatauser(id, d) : rolePermission}>
                                        <i className="menu-icon mdi mdi-delete" style={{ color: 'white' }}></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredUsers.length / ITEM_PER_PAGE)} onPageChange={setCurrentPage} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── HUBS TABLE ─── */
                <div className="col-lg-12 grid-margin stretch-card">
                  <div className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 className="card-title">HUBS</h4>
                        {permissible_roles.includes('add_hub') && (
                          <button type="button" className="btn btn-success btn-rounded btn-sm" onClick={addNew}>Add Hub/Distributor</button>
                        )}
                      </div>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead><tr><th>Hub Name</th><th>Display Name</th><th>Address</th><th>State</th><th>City</th><th>Mobile No</th><th style={{ textAlign: 'center' }}>Action</th></tr></thead>
                          <tbody>
                            {data.map(({ id, data: d }) => (
                              (state_user.role === 'Hub Manager' && d.hub_name !== state_user.hub_name) ? null : (
                                <tr key={id} className="hover-highlight">
                                  <td>{d.hub_name}</td>
                                  <td>{hublabels[d.hub_name] || '—'}</td>
                                  <td>{d.address}</td>
                                  <td>{d.state}</td>
                                  <td>{d.city}</td>
                                  <td>{d.mobile_no}</td>
                                  <td>
                                    <button style={{ marginRight: '1rem', padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                      onClick={permissible_roles.includes('edit_hub') ? () => changeStatusForm(d, id) : rolePermission}>
                                      <i className="menu-icon mdi mdi-pencil" style={{ color: 'white' }}></i>
                                    </button>
                                    <button style={{ padding: '0.2rem 0.85rem' }} className="btn btn-dark btn-sm"
                                      onClick={permissible_roles.includes('view_hub') ? () => showtabs(d.hub_name) : rolePermission}>
                                      <i className="menu-icon mdi mdi-eye" style={{ color: 'white' }}></i>
                                    </button>
                                  </td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── MODALS ─── */}
              <HubFormModal edit={edit} submit={submit} errors={errors} onSubmit={handleSubmit} onChange={handleChange} />
              <HubUserFormModal edit={editUser} submitUser={submitUser} imagePreview={imagePreview} showPassword={showPassword} passwordMatch={passwordMatch}
                onSubmit={handleSubmituser} onChange={handleChangeuser} onPasswordChange={e => setSubmitUser(p => ({ ...p, password: e.target.value }))}
                onImageChange={handleImageChange} removeImage={removeImage} onTogglePassword={() => setShowPassword(p => !p)} fileInputRef={fileInputRef} />

              {/* Add Route Modal */}
              <div className="modal lm fade" id="locationModal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document"><div className="modal-content">
                  <div className="modal-header"><h5 className="modal-title">Add Route</h5><button type="button" className="close" data-bs-dismiss="modal" aria-label="Close"><span>&times;</span></button></div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmitLocation}>
                      <div className="form-group row">
                        <div className="col"><label>Route Name:</label><Select options={routeOptions} onChange={handleRouteChange} value={routeOptions.find(o => o.value === selectedRouteOptions) || null} placeholder="Select Route" /></div>
                        <div className="col"><label>Delivery Executive</label><Select options={deliveryExecutives} onChange={handleDeliveryExecutiveChange} value={deliveryExecutives.find(o => o.value === selectedDeliveryExecutive) || null} placeholder="Select Executive" /></div>
                      </div>
                      <div className="form-group row">
                        <div className="col"><label>Locations</label><Select value={selectedMapOption} onChange={setSelectedMapOption} options={locationOptions} isMulti /></div>
                      </div>
                      <div className="modal-footer"><button type="submit" className="btn btn-success">Submit</button><button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button></div>
                    </form>
                  </div>
                </div></div>
              </div>

              {/* Transfer Location Modal */}
              <div className="modal tl fade" id="transferModal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document"><div className="modal-content">
                  <div className="modal-header"><h5 className="modal-title">Transfer Location</h5><button type="button" className="close" data-bs-dismiss="modal"><span>&times;</span></button></div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmitTransferLocation}>
                      <div className="form-group row">
                        <div className="col"><label>Transfer From</label><Select options={userOptions} value={selectedUserFrom} onChange={setSelectedUserFrom} /></div>
                        <div className="col"><label>Transfer To</label><Select options={userOptions} value={selectedUserTo} onChange={setSelectedUserTo} /></div>
                      </div>
                      <div className="form-group row">
                        <div className="col" style={{ paddingLeft: '2rem' }}>
                          <label>Locations From</label>
                          {locations.map(l => (
                            <div className="form-check" key={l.id}>
                              <input className="form-check-input" type="checkbox" value={l.data.location} id={l.id} onChange={handleLocationFromChange} />
                              <label className="form-check-label" htmlFor={l.id}>{l.data.location}</label>
                            </div>
                          ))}
                        </div>
                        <div className="col">
                          <label>Locations To</label>
                          {locationsTo.map(l => <div className="form-check" key={l.id}><label className="form-check-label">{l?.data?.location}</label></div>)}
                        </div>
                      </div>
                      <div className="modal-footer"><button type="submit" className="btn btn-success">Submit</button><button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button></div>
                    </form>
                  </div>
                </div></div>
              </div>

              {/* Transfer Hub-Wise Modal */}
              <div className="modal tlh fade" id="transferHubModal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document"><div className="modal-content">
                  <div className="modal-header"><h5 className="modal-title">Transfer Location Hub Wise</h5><button type="button" className="close" data-bs-dismiss="modal"><span>&times;</span></button></div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmitTHNew}>
                      <div className="form-group row">
                        <div className="col"><label>From Hub</label><Select options={hubOptionsOne} value={selectedHubFrom} onChange={handleHubFromChangeNew} placeholder="Select From Hub" /></div>
                        <div className="col"><label>To Hub</label><Select options={filteredHubOptions} value={selectedHubTo} onChange={handleHubToChangeNew} placeholder="Select To Hub" /></div>
                      </div>
                      <div className="form-group row">
                        <div className="col"><label>From User</label><Select options={userOptionsFrom} value={selectedUserFrom} onChange={handleUserFromChange1} /></div>
                        <div className="col"><label>To User</label><Select options={userOptionsTo} value={selectedUserTo} onChange={handleUserToChange1} /></div>
                      </div>
                      <div className="form-group row">
                        <div className="col" style={{ paddingLeft: '2rem' }}>
                          <label>Locations From</label>
                          {locationsFrom.map(l => (
                            <div className="form-check" key={l.id}>
                              <input className="form-check-input" type="checkbox" value={l.data.location} id={l.id}
                                onChange={handleLocationFromChangeNew} checked={selectedLocationsFrom.includes(l.data.location)} />
                              <label className="form-check-label" htmlFor={l.id}>{l.data.location}</label>
                            </div>
                          ))}
                        </div>
                        <div className="col">
                          <label>Locations To</label>
                          {locationsToo.map(l => <div className="form-check" key={l.id}><label className="form-check-label">{l.data?.location}</label></div>)}
                        </div>
                      </div>
                      <div className="modal-footer"><button type="submit" className="btn btn-success">Submit</button><button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button></div>
                    </form>
                  </div>
                </div></div>
              </div>

              {/* Update Location Modal */}
              <div className="modal loma fade" id="updateLocationModal" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document"><div className="modal-content">
                  <div className="modal-header"><h5 className="modal-title">Update Location</h5><button type="button" className="close" data-bs-dismiss="modal"><span>&times;</span></button></div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmitLocationEdit}>
                      <div className="form-group row">
                        <div className="col">
                          <label>Route Name:</label><Select options={routeOptions} onChange={handleRouteChange} />
                          <label className="mt-2">Delivery Executive</label><Select options={deliveryExecutives} onChange={handleDeliveryExecutiveChange} value={deliveryExecutives.find(o => o.value === selectedDeliveryExecutive) || null} placeholder="Select Executive" />
                        </div>
                      </div>
                      <div className="form-group row">
                        <div className="col"><label>Location</label><Select value={selectedMapOption} onChange={setSelectedMapOption} options={locationOptions} isMulti /></div>
                      </div>
                      <div className="modal-footer"><button type="submit" className="btn btn-success">Submit</button><button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button></div>
                    </form>
                  </div>
                </div></div>
              </div>

            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

export default HubDist;
