import { useEffect, useState } from "react";


const Filter = function ({ title, value, filter, setFilter, propertyNames, propertyOptionsMap }) {
    return (
        <div className="container-fluid p-3">
            <h4 className="mb-3">{title}</h4>
            <div className="row">
                <div className="col-12">
                    <PropertyList 
                        parent={value} 
                        setFilter={setFilter} 
                        propertyNames={propertyNames} 
                        propertyOptionsMap={propertyOptionsMap} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Filter;

const PropertyList = ({ parent, setFilter, propertyNames, propertyOptionsMap }) =>
    propertyNames.length > 0 && (
        <div className="row row-cols-1 ">
            {propertyNames.map((property, index) => (
                <div key={index} className="col">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <FilterBox
                                setFilter={setFilter}
                                parent={parent}
                                property={property}
                                propertyOptions={propertyOptionsMap[property]}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

const FilterBox = function ({ parent, setFilter, property, propertyOptions }) {
    const [selectedValue, setSelectedValue] = useState([]);
  
    useEffect(() => {
        updateFilter(setFilter, parent, property, selectedValue)
    }, [selectedValue, setFilter, property]);
  
    const handleValueChange = (e) => {
        e.preventDefault();
        const checkboxValue = e.currentTarget.getAttribute('data-value');
        
        setSelectedValue((prev) => {
            const isValueSelected = prev.includes(checkboxValue);
            const isLastItem = prev.length === propertyOptions.length - 1;
            const isSingleItemLeft = prev.length === 1;
    
            if (isValueSelected) {
                if (isSingleItemLeft) return [];
                return prev.filter(val => val !== checkboxValue);
            }
    
            if (isLastItem) {
                return propertyOptions.map(item => item.label);
            }
    
            return [...prev, checkboxValue];
        });
    };
  
    const handleSelectAll = (e) => {
        e.preventDefault();
        setSelectedValue(selectedValue.length === propertyOptions.length ? [] : propertyOptions.map(item => item.label));
    };
  
    return (
        <div className="filter-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">{property}<span style={{ color: 'red' }}>*</span></h5>
            </div>
            <div className="checkbox-group ms-2" style={{minWidth: "250px"}}>
                {/* Select All Option */}
                <div 
                    className={`filter-item ${selectedValue.length === propertyOptions.length ? 'selected' : ''}`}
                    onClick={handleSelectAll}
                    data-value="all"
                >
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={`${property}-all`}
                        checked={selectedValue.length === propertyOptions.length}
                        readOnly
                    />
                    <label 
                        className="form-check-label" 
                        htmlFor={`${property}-all`}
                    >
                        Select All
                    </label>
                </div>

                {/* Individual Options */}
                {propertyOptions.map(({ label, id }) => (
                    <div 
                        key={id} 
                        className={`filter-item ${selectedValue.includes(label) ? 'selected' : ''}`}
                        onClick={handleValueChange}
                        data-value={label}
                    >
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`${property}-${id}`}
                            checked={selectedValue.includes(label)}
                            readOnly
                        />
                        <label 
                            className="form-check-label" 
                            htmlFor={`${property}-${id}`}
                        >
                            {label}
                        </label>
                    </div>
                ))}
            </div>
            
            <style jsx>{`
                .checkbox-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .filter-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background-color: white;
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                }

                .filter-item:hover {
                    border-color: #4a90e2;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .filter-item.selected {
                    border-color: #4a90e2;
                    background-color: #f0f6ff;
                    box-shadow: 0 4px 6px rgba(74,144,226,0.1);
                }

                .filter-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(74,144,226,0.1);
                    transform: scale(0);
                    transition: transform 0.3s ease;
                    z-index: -1;
                }

                .filter-item:active::before {
                    transform: scale(1);
                }

                .form-check-input {
                    margin-right: 10px;
                    width: 1.2em;
                    height: 1.2em;
                    cursor: pointer;
                }

                .form-check-label {
                    margin-left: 5px;
                    font-weight: 500;
                    color: #333;
                    cursor: pointer;
                }

                .filter-item.selected .form-check-input {
                    accent-color: #4a90e2;
                }
            `}</style>
        </div>
    );
};

  const updateFilter = (setFilter, parent, property, value )=>{
    switch (parent) {
        case "subscriber":
            setFilter((prev) => ({
                ...prev,
                subscriber: {
                  ...prev.subscriber,
                  [property]: value
                }
              }));
            break;
        case "user":
            setFilter((prev) => ({
                ...prev,
                user: {
                  ...prev.user,
                  [property]: value
                }
              }));
            break;
        case "activity":
            setFilter((prev) => ({
                ...prev,
                activity: {
                  ...prev.activity,
                  [property]: value
                }
              }));
            break;
    
        default:
            break;
    }

}