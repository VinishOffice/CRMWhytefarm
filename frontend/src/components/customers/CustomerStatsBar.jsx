import React from 'react';

/**
 * Displays the top three stat cards on the Customers page.
 * Props: newUserCount, collectionSize, searchQuery, onSearchChange, onSearch, onKeyDown
 */
export default function CustomerStatsBar({ newUserCount, collectionSize, searchQuery, onSearchChange, onSearch, onKeyDown }) {
  return (
    <div className="row" style={{ marginTop: '1rem' }}>
      {/* New Registrations */}
      <div className="col-md-4 grid-margin">
        <div className="card d-flex align-items-start" style={{ background: '#84bf93' }}>
          <div className="card-body">
            <div className="d-flex flex-row align-items-start">
              <i className="mdi mdi-account-check icon-lg" style={{ color: '#fff' }}></i>
              <div className="ms-3">
                <h6 style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{newUserCount}</h6>
                <p className="mt-2 text-muted card-text custom-text">New Registrations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Customers */}
      <div className="col-md-4 grid-margin">
        <div className="card d-flex align-items-start" style={{ background: '#4a54ba' }}>
          <div className="card-body">
            <div className="d-flex flex-row align-items-start">
              <i className="mdi mdi-account-multiple-outline icon-lg" style={{ color: '#fff' }}></i>
              <div className="ms-3">
                <h6 style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>{collectionSize}</h6>
                <p className="mt-2 text-muted card-text custom-text" style={{ fontSize: '15px' }}>Total Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="col-md-4 grid-margin">
        <div className="card d-flex align-items-start" style={{ background: '#4a54ba' }}>
          <div className="card-body">
            <div className="d-flex flex-row align-items-start">
              <i className="mdi mdi-account-search icon-lg" style={{ color: '#fff' }}></i>
              <div className="ms-3" style={{ display: 'flex' }}>
                <input
                  type="search"
                  className="form-control"
                  onChange={onSearchChange}
                  value={searchQuery}
                  placeholder="Search Customer here"
                  onKeyDown={onKeyDown}
                />
                <button
                  type="button"
                  className="btn btn-xs btn-primary text-white me-0"
                  onClick={onSearch}
                  style={{ marginLeft: '10px', background: 'rgb(132, 191, 147)' }}
                >
                  <i className="icon-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
