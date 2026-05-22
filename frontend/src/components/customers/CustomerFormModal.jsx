import React from 'react';
import Select from 'react-select';

const categoryList = [
  { label: 'Lead', value: 'Lead' },
  { label: 'One Time', value: 'One Time' },
  { label: 'Subscribed', value: 'Subscribed' },
  { label: 'Unqualified', value: 'Unqualified' },
];

const sourceList = [
  { label: 'Website', value: 'Website' },
  { label: 'Friends', value: 'Friends' },
  { label: 'Newspaper', value: 'Newspaper' },
  { label: 'Ads', value: 'Ads' },
];

export default function CustomerFormModal({
  edit, submit, fileInputRef,
  hubNames, selectedHub, locationOptions, selectedLocation,
  selectedCategory, sourceCategory, deliveryExecutiveID, nod,
  handleChange, handleCategoryChange, handleSourceChange,
  handleHubChange, handleLocationChange, handleSubmit,
  onRolePermission, canEdit,
}) {
  return (
    <div className="modal fade" id="exampleModal-2" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel-2" aria-hidden="true">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-2">{edit ? 'Edit Customer' : 'Add Customer'}</h5>
            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <form className="forms-sample" onSubmit={handleSubmit}>
              {/* Row 1: Image, Category, Hub, Location */}
              <div className="form-group row">
                <div className="col">
                  <label>User Image:</label>
                  <input className="form-control" type="file" ref={fileInputRef} style={{ padding: '10px' }} name="customer_image" onChange={handleChange} />
                </div>
                <div className="col">
                  <label>Customer Category</label>
                  <Select options={categoryList} onChange={handleCategoryChange} value={selectedCategory} placeholder="Select Category" />
                </div>
                <div className="col">
                  <label>Hubs *</label>
                  <Select options={hubNames} onChange={handleHubChange} value={selectedHub} placeholder="Select Hub Name" required />
                </div>
                <div className="col">
                  <label>Location *</label>
                  <Select options={locationOptions} onChange={handleLocationChange} value={selectedLocation} placeholder="Select Location" required />
                  {deliveryExecutiveID === 'notfound' && (
                    <p style={{ color: 'red' }}>**No Delivery agent found for this location...</p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone, Alt Phone, Name */}
              <div className="form-group row">
                {[
                  { label: 'Customer Phone No *', id: 'customer_phone', type: 'tel', required: true, maxLength: 10 },
                  { label: 'Alternate Phone No', id: 'alt_phone', type: 'tel', maxLength: 10 },
                  { label: 'Customer Name *', id: 'customer_name', type: 'text', required: true },
                ].map(f => (
                  <div className="col" key={f.id}>
                    <label>{f.label}</label>
                    <input className="form-control" type={f.type} id={f.id} name={f.id}
                      onChange={handleChange} value={submit[f.id]} maxLength={f.maxLength}
                      required={f.required} autoComplete="off" pattern={f.type === 'tel' ? '[0-9]*' : undefined} />
                  </div>
                ))}
              </div>

              {/* Row 3: Email, DOB, Anniversary */}
              <div className="form-group row">
                <div className="col">
                  <label>Customer Email</label>
                  <input type="email" className="form-control" id="customer_email" name="customer_email" onChange={handleChange} value={submit.customer_email} autoComplete="off" />
                </div>
                {[
                  { label: 'DOB', id: 'dob' },
                  { label: 'Anniversary Date', id: 'anniversary_date' },
                ].map(f => (
                  <div className="col" key={f.id}>
                    <label>{f.label}</label>
                    <input type="date" className="form-control" id={f.id} name={f.id}
                      onChange={handleChange} value={submit[f.id]}
                      style={{ height: '35px', padding: '12px 20px', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>

              {/* Row 4: Computed address (read-only) */}
              <div className="form-group row">
                <div className="col">
                  <label>Customer Address (auto-computed)</label>
                  <input type="text" className="form-control" disabled id="customer_address" name="customer_address"
                    value={
                      (submit.floor ? submit.floor + ', ' : '') +
                      (submit.flat_villa_no ? submit.flat_villa_no + ', ' : '') +
                      (submit.landmark ? submit.landmark + ', ' : '') +
                      (submit.city ? submit.city + ', ' : '') +
                      (submit.state || '')
                    } />
                </div>
              </div>

              {/* Row 5: Address fields */}
              <div className="form-group row">
                {['floor', 'flat_villa_no', 'city', 'state'].map(field => (
                  <div className="col" key={field}>
                    <label>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                    <input type="text" className="form-control" id={field} name={field} onChange={handleChange} value={submit[field]} autoComplete="off" />
                  </div>
                ))}
              </div>

              {/* Row 6: Landmark, Pincode */}
              <div className="form-group row">
                <div className="col">
                  <label>Landmark</label>
                  <input type="text" className="form-control" id="landmark" name="landmark" onChange={handleChange} value={submit.landmark} autoComplete="off" />
                </div>
                <div className="col">
                  <label>Pincode</label>
                  <input className="form-control" type="tel" pattern="[0-9]*" id="pincode" name="pincode" onChange={handleChange} value={submit.pincode} maxLength={6} autoComplete="off" />
                </div>
              </div>

              {/* Row 7: Gender, Customer Type, Source */}
              <div className="form-group row">
                <div className="col">
                  <label>Gender *</label><br />
                  {['male', 'female', 'other'].map(g => (
                    <label key={g} style={{ marginRight: '10px' }}>
                      <input type="radio" id={`gender${g}`} value={g} name="gender" checked={submit.gender === g} onChange={handleChange} required />
                      <span style={{ marginLeft: '6px', textTransform: 'capitalize' }}>{g}</span>
                    </label>
                  ))}
                </div>
                <div className="col">
                  <label>Customer Type</label><br />
                  <input type="checkbox" id="customer_type" name="customer_type" checked={submit.customer_type}
                    onChange={e => {}} />
                  <label htmlFor="customer_type" style={{ marginLeft: '0.5rem' }}>Corporate</label>
                </div>
                <div className="col">
                  <label>Source</label>
                  <Select options={sourceList} onChange={handleSourceChange} value={sourceCategory} placeholder="Select Source" />
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                {nod !== '' && (
                  canEdit
                    ? <button type="submit" className="btn btn-success">Submit</button>
                    : <button type="button" className="btn btn-success" onClick={onRolePermission}>Submit</button>
                )}
                <button type="button" className="btn btn-info" data-bs-dismiss="modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
