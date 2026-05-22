import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import { fetch_records } from '../../helpers';
import { getUserInfo } from '../../Utility';
import ExportToCSV from '../Export/ExportToCSV';

const SpinnerOverlay = () => (
  <div className="spinner-overlay">
    <div className="spinner" />
  </div>
);

const FollowUpModal = ({ show, handleClose }) => {
  const { username, role } = getUserInfo();
  const [followUps, setFollowUps] = useState([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agents, setAgents] = useState([]);

  const handleFromDateChange = (date) => setFromDate(date);
  const handleAgentChange = (e) => setSelectedAgent(e.target.value);

  useEffect(() => {
    const fetchFollowUP = async () => {
        setShowSpinner(true);
        try {
          const filters = [
            { key: 'followup_required', operator: '==', value: true },
            { key: 'follow_up_date', operator: '==', value: moment(fromDate).format('YYYY-MM-DD') },
          ];
      
          // For non-admin users, filter by assigned_to
          if (role !== 'Admin') {
            filters.push({ key: 'assigned_to', operator: '==', value: username });
          }
      
          const Data = await fetch_records('conversation_logs', filters);
          const formatted = Data.map(item => ({ id: item.id, ...item.data }));
          
          setFollowUps(formatted);
      
          // Admins get the agent list for the dropdown
          if (role === 'Admin') {
            const uniqueAgents = [...new Set(formatted.map(f => f.assigned_to || ''))].filter(Boolean);
            setAgents(uniqueAgents);
          }
      
        } catch (err) {
          console.error('Error fetching data', err);
        }
        setShowSpinner(false);
      };
      

    if (show) fetchFollowUP();
  }, [fromDate, show]);

 useEffect(() => {
  let data = followUps;

  if (selectedAgent) {
    data = data.filter(f => f.assigned_to === selectedAgent);
  }

 
  data = data.filter(
    f =>
      f.disposition?.toLowerCase() === "onboard" &&
      f.sub_disposition?.toLowerCase() === "follow up"
  );

  setFilteredFollowUps(data);
}, [followUps, selectedAgent]);


  const renderFilterSection = () => (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="dashboard-stat-card">
            <h5 className="dashboard-stat-card-title text-info fw-bold">Total Follow-Up</h5>
            <p className="dashboard-stat-card-value text-info fw-bold">{filteredFollowUps.length || '0'}</p>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="dashboard-stat-card bg-light border rounded shadow-sm p-3">
            <label className="form-label text-muted fw-bold mb-1">Select Date</label>
            <DatePicker
              selected={fromDate}
              onChange={handleFromDateChange}
              dateFormat="dd/MM/yyyy"
              className="form-control"
            />
          </div>
        </div>
        {role === 'Admin' && (
          <div className="col-lg-4 mb-4">
            <div className="dashboard-stat-card bg-light border rounded shadow-sm p-3">
              <label className="form-label text-muted fw-bold mb-1">Select Agent</label>
              <select className="form-control" value={selectedAgent} onChange={handleAgentChange}>
                <option value="">All</option>
                {agents.map((agent, idx) => (
                  <option key={idx} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose} dialogClassName="modal-5xl">
      <Modal.Header closeButton>
        <Modal.Title>Follow Up's</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      {role === 'Admin' ? (
  <div className="px-3 pb-3 d-flex justify-content-end">
    <ExportToCSV
      csvColumns={[
        "Follow Up Date", "Created At", "Agent", "Customer ID", "Phone", "Email",
        "Call Type", "Task Type", "Disposition", "Sub-Disp.", "Products", "Remarks"
      ]}
      csvData={filteredFollowUps.map(f => [
        f.follow_up_date ? moment(f.follow_up_date, 'YYYY-MM-DD').format('DD-MM-YYYY') : '',
        f.created_at?.seconds ? moment(f.created_at.seconds * 1000).format("DD-MM-YYYY, h:mm A") : 'N/A',
        f.assigned_to || 'N/A',
        f.customer_id || '',
        f.customer_phone || '',
        f.customer_email || '',
        f.call_type || '',
        f.task_type || '',
        f.disposition || '',
        f.sub_disposition || '',
        (f.selected_products || []).join(', '),
        f.conversation_notes || ''
      ])}
      CSV_FileName={`FollowUps-${moment(fromDate).format('DD-MM-YYYY')}`}
    />
  </div>
) : (
  <div className="px-3 pb-3">
    <h5 className="text-primary fw-bold">Welcome, {username}</h5>
  </div>
)}


        {renderFilterSection()}

        <div className="table-responsive mt-3">
          <table className="table table-striped table-bordered">
            <thead className="table-light">
              <tr>
                <th>Follow Up Date</th>
                <th>Created At</th>
                <th>Agent</th>
                <th>Customer ID</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Call Type</th>
                <th>Task Type</th>
                <th>Disposition</th>
                <th>Sub-Disp.</th>
                <th>Products</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {showSpinner ? (
                <tr>
                  <td colSpan="12" className="text-center py-4"><SpinnerOverlay /></td>
                </tr>
              ) : filteredFollowUps.length > 0 ? (
                filteredFollowUps.map((data, index) => (
                  <tr key={index}>
                    <td>{data.follow_up_date}</td>
                    <td>{data.created_at?.seconds ? moment(data.created_at.seconds * 1000).format('DD/MM/YY, h:mm a') : 'N/A'}</td>
                    <td>{data.assigned_to || 'N/A'}</td>
                    <td>{data.customer_id}</td>
                    <td>{data.customer_phone}</td>
                    <td>{data.customer_email || 'N/A'}</td>
                    <td>{data.call_type}</td>
                    <td>{data.task_type}</td>
                    <td>{data.disposition}</td>
                    <td>{data.sub_disposition}</td>
                    <td>{(data.selected_products || []).join(', ')}</td>
                    <td>{data.conversation_notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center text-muted py-4">No data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default FollowUpModal;
