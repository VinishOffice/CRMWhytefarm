import React, { useState } from 'react';

const multiSelectStyles = `
  .multi-select-dropdown {
    display: flex;
    flex-direction: column;
    width: 300px;
  }
  select {
    padding: 5px;
    margin-bottom: 10px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    display: flex;
    align-items: center;
    background-color: #e0e0e0;
    padding: 5px 10px;
    border-radius: 15px;
    z-index: 1;
  }
  .close-btn {
    margin-left: 5px;
    cursor: pointer;
    font-weight: bold;
  }
  .multi_select {
    border: 1px solid #ccc;
    height: 30px;
  }
`;

const MultiSelectDropdown = ({ options,label }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [dropdownValue, setDropdownValue] = useState('');

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value && !selectedItems.includes(value)) {
      setSelectedItems([...selectedItems, value]);
      setDropdownValue('');
    }
  };

  const handleRemoveItem = (item) => {
    setSelectedItems(selectedItems.filter(i => i !== item));
  };

  return (
    <div className="multi-select-dropdown">
      <style>{multiSelectStyles}</style>
      <select value={dropdownValue} onChange={handleSelectChange} className='multi_select'>
        <option value="" disabled>Select {label}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
      <div className="chips">
        {selectedItems.map((item, index) => (
          <div key={index} className="chip">
            {item}
            <span className="close-btn" onClick={() => handleRemoveItem(item)}>x</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;