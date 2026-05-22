import React from 'react';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Andaman and Nicobar Islands','Assam','Bihar',
  'Chhattisgarh','Chandigarh','Dadra and Nagar Haveli','Daman and Diu','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka',
  'Kerala','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttarakhand','Uttar Pradesh','West Bengal',
];

/**
 * Modal for Add/Edit Hub. Props: edit, submit, errors, onSubmit, onChange
 */
export default function HubFormModal({ edit, submit, errors = {}, onSubmit, onChange }) {
  return (
    <div className="modal hub fade" id="hubModal" tabIndex="-1" role="dialog" aria-labelledby="hubModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="hubModalLabel">{edit ? 'Edit Hub' : 'Add Hub'}</h5>
            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form className="myForm" onSubmit={onSubmit}>
              <div className="form-group row">
                <div className="col">
                  <label>Hub Name:</label>
                  <input className={`form-control ${errors.hub_name ? 'is-invalid' : ''}`} type="text" onChange={onChange} id="hub_name" value={submit.hub_name} required autoComplete="off" />
                </div>
                <div className="col">
                  <label>Address</label>
                  <input className={`form-control ${errors.address ? 'is-invalid' : ''}`} type="text" onChange={onChange} id="address" value={submit.address} required autoComplete="off" />
                </div>
                <div className="col">
                  <label>State</label>
                  <select className={`form-control ${errors.state ? 'is-invalid' : ''}`} onChange={onChange} id="state" value={submit.state} required>
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <div className="col">
                  <label>City</label>
                  <input className={`form-control ${errors.city ? 'is-invalid' : ''}`} type="text" onChange={onChange} id="city" value={submit.city} required autoComplete="off" />
                </div>
                <div className="col">
                  <label>Mobile No</label>
                  <input className="form-control" type="tel" pattern="[0-9]*" onChange={onChange} id="mobile_no" value={submit.mobile_no} maxLength={10} required autoComplete="off" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-success">Submit</button>
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
