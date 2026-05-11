import React from 'react';

/**
 * Reusable date range filter component.
 * Props: dateFrom, dateTo, onDateFromChange, onDateToChange, onReset
 */
const DateRangeFilter = ({ dateFrom, dateTo, onDateFromChange, onDateToChange, onReset }) => {
  const hasFilter = dateFrom || dateTo;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
        📅 Dari
      </span>
      <input
        type="date"
        className="form-control"
        style={{ width: '140px', fontSize: '12.5px' }}
        value={dateFrom}
        onChange={e => onDateFromChange(e.target.value)}
      />
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>s/d</span>
      <input
        type="date"
        className="form-control"
        style={{ width: '140px', fontSize: '12.5px' }}
        value={dateTo}
        onChange={e => onDateToChange(e.target.value)}
      />
      {hasFilter && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onReset}
          title="Reset filter tanggal"
          style={{ padding: '6px 10px', fontSize: '12px' }}
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
};

export default DateRangeFilter;
