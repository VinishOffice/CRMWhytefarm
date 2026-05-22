import { useState, useRef, useCallback, useEffect } from 'react';
import { extendMoment } from 'moment-range';
import Moment from 'moment';
import Swal from 'sweetalert2';
import { ref, getDownloadURL, uploadBytesResumable, storage } from '../services/uploadService.jsx';
import apiClient from '../services/apiClient';
import { createCustomerActivity } from '../services/customerActivitiesService';
import { getUserInfo } from '../Utility';

const moment = extendMoment(Moment);

const INITIAL_FORM = {
  customer_id: '', customer_image: null, customer_type: false,
  customer_name: '', customer_category: '', hub_name: '',
  customer_phone: '', alt_phone: '', customer_email: '',
  dob: '', anniversary_date: '', customer_address: '',
  flat_villa_no: '', floor: '', city: '', state: '',
  landmark: '', location: '', pincode: '', gender: '',
  platform: '', delivery_exe_id: '', wallet_balance: 0,
  credit_limit: 0, status: '', source: '',
  updated_date: new Date(), created_date: new Date(),
};

function generateCustomerId() {
  const now = new Date();
  const random4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return (now.getTime() % 10000).toString().padStart(4, '0') + random4;
}

function showToast(icon, title) {
  Swal.mixin({
    toast: true, background: '#69aba6', position: 'top-end',
    showConfirmButton: false, timer: 3000, timerProgressBar: true,
    didOpen: (t) => {
      t.addEventListener('mouseenter', Swal.stopTimer);
      t.addEventListener('mouseleave', Swal.resumeTimer);
    },
  }).fire({ icon, title });
}

export function useCustomerForm({ onSuccess }) {
  const { loggedIn_user } = getUserInfo();
  const fileInputRef = useRef(null);

  const [submit, setSubmit] = useState(INITIAL_FORM);
  const [edit, setEdit]     = useState(false);
  const [editID, setEditID] = useState('');
  const [loading, setLoading] = useState(false);

  const [hubNames, setHubNames]             = useState([]);
  const [selectedHub, setSelectedHub]       = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sourceCategory, setSourceCategory]     = useState('');
  const [deliveryExecutiveID, setDeliveryExecutiveID] = useState('');
  const [nod, setNod] = useState('');

  // fetch hubs once
  useEffect(() => {
    apiClient.get('/api/hubs_data').then(res => {
      setHubNames((res.data?.data || []).map(d => ({ label: d.hub_name, value: d.hub_name })));
    }).catch(console.error);
  }, []);

  // fetch locations when hub changes
  const fetchLocations = useCallback(async () => {
    if (!selectedHub) { setLocationOptions([]); return; }
    try {
      const res = await apiClient.post('/api/locations_data/query', {
        filters: [{ field: 'hub_name', op: '==', value: selectedHub.value }]
      });
      setLocationOptions((res.data?.data || []).map(d => ({
        value: `${d.area}, ${d.subarea}`, label: `${d.area}, ${d.subarea}`,
      })));
    } catch (e) { console.error(e); }
  }, [selectedHub]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleChange = (e) => {
    const { id, name, value, type, checked, files } = e.target;
    let v = type === 'checkbox' ? checked
          : type === 'file'     ? files[0]
          : type === 'radio'    ? value
          : (id === 'customer_phone' || id === 'pincode' || id === 'alt_phone')
            ? value.replace(/\D/g, '')
            : value.replace(/[^\w\s.@/:+\-=]/gi, '');
    setSubmit(prev => ({ ...prev, [name]: v }));
  };

  const handleCategoryChange = (opt) => { setSelectedCategory(opt); setSubmit(p => ({ ...p, customer_category: opt.value })); };
  const handleSourceChange   = (opt) => { setSourceCategory(opt);   setSubmit(p => ({ ...p, source: opt.value })); };
  const handleHubChange      = (opt) => { setSelectedHub(opt); setSelectedLocation([]); setSubmit(p => ({ ...p, hub_name: opt.value })); };

  const handleLocationChange = (opt) => {
    setSelectedLocation(opt);
    setSubmit(p => ({ ...p, location: opt.value }));
    apiClient.post('/api/hubs_locations_data/query', {
      filters: [
        { field: 'hub_name', op: '==', value: selectedHub.value },
        { field: 'location', op: '==', value: opt.value },
      ], limit: 1
    }).then(res => {
      const docs = res.data?.data || [];
      setDeliveryExecutiveID(docs.length > 0 ? (docs[0].hub_user_id || docs[0].delivery_exe_id) : 'notfound');
      setNod('found');
    }).catch(() => setNod('found'));
  };

  const resetForm = () => {
    setSubmit(INITIAL_FORM);
    setSelectedHub(null); setSelectedLocation([]); setSelectedCategory(''); setSourceCategory('');
    setDeliveryExecutiveID(''); setNod('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openForAdd = () => { resetForm(); setEdit(false); window.modelshow(); };

  const openForEdit = (e, data, id) => {
    e.stopPropagation();
    setSelectedHub({ value: data.hub_name, label: data.hub_name });
    setSelectedLocation([{ value: data.location, label: data.location }]);
    setSelectedCategory({ value: data.customer_category, label: data.customer_category });
    setSourceCategory({ value: data.source, label: data.source });
    setDeliveryExecutiveID(data.delivery_exe_id || 'notfound');
    setNod('found'); setEdit(true); setEditID(id);
    setSubmit({
      id, customer_id: data.customer_id, customer_image: data.customer_image,
      customer_type: data.customer_type, customer_name: data.customer_name,
      customer_category: data.customer_category, hub_name: data.hub_name,
      customer_phone: data.customer_phone, alt_phone: data.alt_phone,
      customer_email: data.customer_email,
      dob: moment(data.dob).format('YYYY-MM-DD'),
      anniversary_date: moment(data.anniversary_date?.toDate?.() || data.anniversary_date).format('YYYY-MM-DD'),
      customer_address: data.customer_address, flat_villa_no: data.flat_villa_no,
      floor: data.floor, landmark: data.landmark, location: data.location,
      pincode: data.pincode, gender: data.gender, platform: data.platform,
      delivery_exe_id: data.delivery_exe_id, wallet_balance: data.wallet_balance,
      credit_limit: data.credit_limit, status: data.status, source: data.source,
      city: data.city || '', state: data.state || '',
      updated_date: new Date(), created_date: new Date(),
    });
    window.modelshow();
  };

  const buildAddress = (f) =>
    (f.floor ? f.floor + ', ' : '') + (f.flat_villa_no ? f.flat_villa_no + ', ' : '') +
    (f.landmark ? f.landmark + ', ' : '') + (f.city ? f.city + ', ' : '') + (f.state || '');

  const saveToDb = async (payload, isEdit) => {
    if (isEdit) {
      await apiClient.patch(`/api/customers_data/${editID}`, payload);
    } else {
      await apiClient.post('/api/customers_data', payload);
    }
    showToast('success', isEdit ? 'Customer Updated Successfully' : 'Customer Added');
    window.modalHide();
    resetForm();
    onSuccess?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submit.customer_phone.length !== 10) {
      return Swal.fire({ icon: 'error', title: 'Oops...', text: 'Phone number must be 10 digits' });
    }
    setLoading(true);
    const customerId = generateCustomerId();
    const address = buildAddress(submit);
    const activityBase = {
      customer_id: customerId, customer_name: submit.customer_name,
      customer_phone: submit.customer_phone, hub_name: submit.hub_name,
      delivery_exe_id: deliveryExecutiveID, user: 'Server',
      platform: 'CRM', date: new Date().toISOString(), created_date: new Date().toISOString(),
    };

    try {
      if (!edit) {
        const phoneExists = await apiClient.post('/api/customers_data/query', {
          filters: [{ field: 'customer_phone', op: '==', value: submit.customer_phone }], limit: 1
        }).then(r => (r.data?.data || []).length > 0);
        if (phoneExists) {
          setLoading(false);
          return Swal.fire({ icon: 'error', title: 'Oops...', text: 'Phone no already exists!' });
        }
      }

      const basePayload = {
        customer_id: edit ? submit.customer_id : customerId,
        customer_type: submit.customer_type,
        customer_name: submit.customer_name,
        customer_category: submit.customer_category || 'Lead',
        hub_name: submit.hub_name, customer_phone: submit.customer_phone,
        alt_phone: submit.alt_phone, customer_email: submit.customer_email,
        anniversary_date: submit.anniversary_date ? new Date(submit.anniversary_date) : new Date(),
        customer_address: address, flat_villa_no: submit.flat_villa_no, floor: submit.floor,
        landmark: submit.landmark, location: submit.location,
        state: submit.state || '', city: submit.city || '',
        pincode: submit.pincode, gender: submit.gender,
        platform: 'Website', delivery_exe_id: deliveryExecutiveID,
        wallet_balance: edit ? submit.wallet_balance : 0,
        credit_limit: edit ? submit.credit_limit : 110,
        source: submit.source, status: edit ? submit.status : '1',
        updated_date: new Date(), referral_code: '', latitude: '', longitude: '',
      };

      if (!edit) basePayload.registered_date = new Date();
      if (!edit) basePayload.created_date = new Date();
      if (!edit) basePayload.dob = submit.dob ? new Date(submit.dob) : new Date();

      if (submit.customer_image && typeof submit.customer_image !== 'string') {
        const storageRef = ref(storage, `users/${submit.customer_image.name}`);
        const task = uploadBytesResumable(storageRef, submit.customer_image);
        task.on('state_changed', null, console.error, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          await saveToDb({ ...basePayload, customer_image: url }, edit);
          createCustomerActivity({ ...activityBase, object: edit ? 'Edit Customer' : 'Add Customer',
            action: edit ? 'Edit Customer' : 'Add Customer', customer_address: address,
            description: `Customer ${edit ? 'updated' : 'created'} by ${loggedIn_user}` }).catch(console.error);
          setLoading(false);
        });
      } else {
        if (edit) basePayload.customer_image = submit.customer_image;
        else basePayload.customer_image = '';
        await saveToDb(basePayload, edit);
        createCustomerActivity({ ...activityBase, object: edit ? 'Edit Customer' : 'Add Customer',
          action: edit ? 'Edit Customer' : 'Add Customer', customer_address: address,
          description: `Customer ${edit ? 'updated' : 'created'} by ${loggedIn_user}` }).catch(console.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return {
    submit, edit, loading, fileInputRef,
    hubNames, selectedHub, locationOptions, selectedLocation,
    selectedCategory, sourceCategory, deliveryExecutiveID, nod,
    handleChange, handleCategoryChange, handleSourceChange,
    handleHubChange, handleLocationChange, handleSubmit,
    openForAdd, openForEdit,
  };
}
