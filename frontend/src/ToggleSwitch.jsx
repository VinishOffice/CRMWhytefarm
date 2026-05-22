import React from 'react';

function ToggleSwitch({ inStock, onChange }) {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={inStock}
        onChange={onChange}
      />
      <span className="slider round"></span>
    </label>
  );
}

export default ToggleSwitch;
