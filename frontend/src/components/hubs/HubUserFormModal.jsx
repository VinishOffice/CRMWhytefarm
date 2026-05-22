import React from 'react';

/**
 * Modal for Add/Edit Hub User.
 * Props: edit, submitUser, imagePreview, showPassword, passwordMatch,
 *        onSubmit, onChange, onPasswordChange, onImageChange, removeImage, onTogglePassword
 */
export default function HubUserFormModal({
  edit, submitUser, imagePreview, showPassword, passwordMatch,
  onSubmit, onChange, onPasswordChange, onImageChange, removeImage, onTogglePassword,
  fileInputRef,
}) {
  return (
    <div className="modal um fade" id="userModal" tabIndex="-1" role="dialog" aria-labelledby="userModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="userModalLabel">{edit ? 'Edit User' : 'Add User'}</h5>
            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={onSubmit}>

              {/* Image Upload */}
              <div className="form-group row">
                <div className="col">
                  <label>Profile Image</label>
                  <input type="file" id="image" ref={fileInputRef} className="form-control" onChange={onImageChange} style={{ padding: '10px' }} />
                  {imagePreview && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={imagePreview} alt="preview" style={{ height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                      <button type="button" className="btn btn-sm btn-danger ms-2" onClick={removeImage}>Remove</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Name + Email + Role */}
              <div className="form-group row">
                {[
                  { label: 'First Name *', id: 'first_name', required: true },
                  { label: 'Last Name *', id: 'last_name', required: true },
                  { label: 'Email', id: 'email', type: 'email' },
                ].map(f => (
                  <div className="col" key={f.id}>
                    <label>{f.label}</label>
                    <input type={f.type || 'text'} className="form-control" id={f.id} name={f.id}
                      onChange={onChange} value={submitUser[f.id]} required={f.required} autoComplete="off" />
                  </div>
                ))}
              </div>

              {/* Role + Username + Phone */}
              <div className="form-group row">
                <div className="col">
                  <label>Role *</label>
                  <select className="form-control" id="role" onChange={onChange} value={submitUser.role} required>
                    <option value="">Select Role</option>
                    {['Delivery Executive', 'Hub Manager', 'Hub Admin', 'Cash Collector'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <label>Username *</label>
                  <input type="text" className="form-control" id="username" onChange={onChange} value={submitUser.username} required autoComplete="off" />
                </div>
                <div className="col">
                  <label>Phone No *</label>
                  <input type="tel" pattern="[0-9]*" className="form-control" id="phone_no" onChange={onChange} value={submitUser.phone_no} maxLength={10} required autoComplete="off" />
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="form-group row">
                <div className="col">
                  <label>Password *</label>
                  <div style={{ display: 'flex' }}>
                    <input type={showPassword ? 'text' : 'password'} className="form-control" id="password"
                      onChange={onPasswordChange} value={submitUser.password} required autoComplete="new-password" />
                    <button type="button" className="btn btn-sm btn-secondary ms-1" onClick={onTogglePassword}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <small style={{ color: 'grey' }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</small>
                </div>
                <div className="col">
                  <label>Confirm Password *</label>
                  <input type={showPassword ? 'text' : 'password'} className={`form-control ${!passwordMatch ? 'is-invalid' : ''}`}
                    id="confirm_password" onChange={onChange} value={submitUser.confirm_password} required autoComplete="new-password" />
                  {!passwordMatch && <div className="invalid-feedback">Passwords do not match.</div>}
                </div>
                <div className="col d-flex align-items-center">
                  <input type="checkbox" id="cash_collector" checked={submitUser.cash_collector}
                    onChange={e => onChange({ target: { id: 'cash_collector', value: e.target.checked } })} />
                  <label htmlFor="cash_collector" style={{ marginLeft: '0.5rem' }}>Cash Collector</label>
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
