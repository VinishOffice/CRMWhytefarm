import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    bufferPercentage: 10,
    shippingMethod: 'Standard',
    roleBasedAccess: {
      admin: true,
      manager: true,
      user: false,
    },
  });

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleRoleChange = (role) => {
    setSettings({
      ...settings,
      roleBasedAccess: { ...settings.roleBasedAccess, [role]: !settings.roleBasedAccess[role] },
    });
  };

  const resetSettings = () => {
    setSettings({
      bufferPercentage: 10,
      shippingMethod: 'Standard',
      roleBasedAccess: {
        admin: true,
        manager: true,
        user: false,
      },
    });
  };

  return (
    <div className="container mt-4">
      <h3>System Settings</h3>
      <div className="mb-3">
        <label className="form-label">Buffer Percentage</label>
        <input
          type="number"
          className="form-control"
          name="bufferPercentage"
          value={settings.bufferPercentage}
          min="0"
          max="100"
          onChange={handleSettingsChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Shipping Method</label>
        <select
          className="form-select"
          name="shippingMethod"
          value={settings.shippingMethod}
          onChange={handleSettingsChange}
        >
          <option value="Standard">Standard</option>
          <option value="Express">Express</option>
          <option value="Next Day">Next Day</option>
        </select>
      </div>

      <h5>Role-based Access</h5>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={settings.roleBasedAccess.admin}
          onChange={() => handleRoleChange('admin')}
        />
        <label className="form-check-label">Admin</label>
      </div>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={settings.roleBasedAccess.manager}
          onChange={() => handleRoleChange('manager')}
        />
        <label className="form-check-label">Manager</label>
      </div>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          checked={settings.roleBasedAccess.user}
          onChange={() => handleRoleChange('user')}
        />
        <label className="form-check-label">User</label>
      </div>

      <button className="btn btn-danger mt-4" onClick={resetSettings}>
        Reset to Default
      </button>
    </div>
  );
};

export default Settings;
