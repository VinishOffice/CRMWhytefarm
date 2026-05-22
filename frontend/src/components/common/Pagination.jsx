import React from 'react';

/**
 * Generic reusable pagination component.
 * Props: currentPage, totalPages, onPageChange, onLoadMore, loading
 */
export default function Pagination({ currentPage, totalPages, onPageChange, onLoadMore, loading }) {
  const pages = [];
  let start = Math.max(1, currentPage - 5);
  let end = Math.min(totalPages, start + 9);
  if (totalPages <= 10) end = totalPages;
  else if (currentPage <= 5) { start = 1; end = 10; }
  else if (currentPage >= totalPages - 4) { end = totalPages; start = end - 9; }

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <ul className="pagination">
      <li className="page-item">
        <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
      </li>
      {pages.map(i => (
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" style={{ color: 'black' }} onClick={() => onPageChange(i)}>{i}</button>
        </li>
      ))}
      <li className="page-item">
        <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </li>
      {onLoadMore && (
        <li className="page-item">
          <button className="page-link" onClick={onLoadMore} disabled={loading}>Load More</button>
        </li>
      )}
    </ul>
  );
}
