import React from 'react';

/** Shared full-screen loading overlay with spinner gif */
export default function Loader({ show }) {
  if (!show) return null;
  return (
    <div className="loader-overlay">
      <div>
        <img style={{ height: '6rem' }} src="images/loader.gif" alt="loading..." />
      </div>
    </div>
  );
}
