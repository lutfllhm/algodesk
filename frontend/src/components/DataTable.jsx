import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DataTable = ({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  onSearch,
  searchValue,
  onAdd,
  addLabel = 'Tambah Data',
  extraFilters,
  enableWrapToggle = true,
  defaultWrap = false,
  minColumnWidth = 90,
  /** `auto`: lebar kolom mengikuti teks/konten (scroll horizontal jika perlu). `fixed`: kolom dibagi proporsional + bisa di-resize */
  columnSizing = 'auto'
}) => {
  const isFixedSizing = columnSizing === 'fixed';
  const [wrap, setWrap] = useState(!!defaultWrap);
  const [colWidths, setColWidths] = useState(() =>
    columns.map((c) => {
      const w = c?.style?.width;
      const parsed = typeof w === 'number' ? w : typeof w === 'string' ? parseInt(w, 10) : NaN;
      return Number.isFinite(parsed) ? parsed : 180;
    })
  );

  useEffect(() => {
    if (!isFixedSizing) return;
    setColWidths((prev) => {
      if (prev.length === columns.length) return prev;
      return columns.map((c, i) => {
        const existing = prev[i];
        if (Number.isFinite(existing)) return existing;
        const w = c?.style?.width;
        const parsed = typeof w === 'number' ? w : typeof w === 'string' ? parseInt(w, 10) : NaN;
        return Number.isFinite(parsed) ? parsed : 180;
      });
    });
  }, [columns, isFixedSizing]);

  const resizingRef = useRef(null);

  const startResize = (index, startClientX) => {
    resizingRef.current = {
      index,
      startX: startClientX,
      startWidth: colWidths[index] || 180
    };
  };

  const onPointerMove = useCallback((e) => {
    if (!isFixedSizing) return;
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientX - r.startX;
    const next = Math.max(minColumnWidth, r.startWidth + delta);
    setColWidths((w) => {
      const copy = [...w];
      copy[r.index] = next;
      return copy;
    });
  }, [minColumnWidth, isFixedSizing]);

  const stopResize = useCallback(() => {
    resizingRef.current = null;
  }, []);

  useEffect(() => {
    if (!isFixedSizing) return undefined;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResize);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResize);
    };
  }, [onPointerMove, stopResize, isFixedSizing]);

  const tableClassName = useMemo(() => (wrap ? 'table-wrap' : ''), [wrap]);

  return (
    <div className="card fade-in">
      {/* Toolbar */}
      <div className="card-header data-table-toolbar">
        <div className="data-table-toolbar-left">
          {onSearch && (
            <div className="data-table-search">
              <svg
                className="data-table-search-icon"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Cari data..."
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="form-control data-table-search-input"
              />
            </div>
          )}
          {extraFilters}
        </div>
        <div className="data-table-toolbar-right">
          {enableWrapToggle && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setWrap((v) => !v)}
              title="Toggle wrap (turun baris)"
              type="button"
            >
              {wrap ? 'No Wrap' : 'Wrap'}
            </button>
          )}
          {onAdd && (
            <button className="btn btn-primary btn-sm" onClick={onAdd} type="button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table
          className={`data-table ${tableClassName} ${isFixedSizing ? 'data-table-fixed' : 'data-table-auto-cols'}`}
          style={
            isFixedSizing
              ? { tableLayout: 'fixed', width: '100%' }
              : { tableLayout: 'auto', width: 'max-content', minWidth: '100%' }
          }
        >
          {isFixedSizing && (
            <colgroup>
              {columns.map((_, i) => (
                <col key={i} style={{ width: colWidths[i] }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    position: 'relative',
                    ...(isFixedSizing
                      ? {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      : {}),
                    whiteSpace: wrap ? 'normal' : 'nowrap',
                    ...col.style
                  }}
                  title={typeof col.header === 'string' ? col.header : undefined}
                >
                  {isFixedSizing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {col.header}
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        title="Geser untuk memperlebar / memperkecil kolom"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startResize(i, e.clientX);
                        }}
                        style={{
                          width: 10,
                          marginRight: -10,
                          cursor: 'col-resize',
                          alignSelf: 'stretch',
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          style={{
                            width: 2,
                            borderRadius: 2,
                            background: 'var(--border)',
                            opacity: 0.9
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div className="spinner" />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '56px', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '8px', fontSize: '28px' }}>📭</div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px', color: 'var(--text-secondary)' }}>Tidak ada data</div>
                  <div style={{ fontSize: '12px' }}>Belum ada data yang tersedia</div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col, j) => {
                    const cellContent = col.render ? col.render(row, i) : row[col.key];
                    const isText = typeof cellContent === 'string' || typeof cellContent === 'number';
                    return (
                      <td
                        key={j}
                        style={{
                          whiteSpace: wrap ? 'normal' : 'nowrap',
                          wordBreak: wrap ? 'break-word' : undefined,
                          ...(isFixedSizing
                            ? {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 0
                              }
                            : {}),
                          ...col.cellStyle
                        }}
                        title={isText ? String(cellContent) : undefined}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-light)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
          </span>
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >‹</button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let page;
              if (pagination.totalPages <= 5) page = i + 1;
              else if (pagination.page <= 3) page = i + 1;
              else if (pagination.page >= pagination.totalPages - 2) page = pagination.totalPages - 4 + i;
              else page = pagination.page - 2 + i;
              return (
                <button
                  key={page}
                  className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="page-btn"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
