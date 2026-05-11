import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

// ─── Icons ────────────────────────────────────────────
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconFile = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── ExcelImport Component ────────────────────────────
const ExcelImport = ({ module, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const reset = () => {
    setFile(null);
    setResult(null);
    setDragging(false);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      toast.error('Hanya file .xlsx atau .xls yang diizinkan');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/import/${module}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setResult(res.data);
        toast.success(`${res.data.data.inserted} data berhasil diimport`);
        if (res.data.data.inserted > 0 && onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengimport file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/import/template/${module}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_${module}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(true)}
        title="Import dari Excel"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <IconUpload />
        Import Excel
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease-out',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import dari Excel
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upload file .xlsx untuk memasukkan data sekaligus
                </p>
              </div>
              <button
                onClick={close}
                style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <IconX />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>

              {/* Result view */}
              {result ? (
                <div>
                  <div style={{
                    background: result.data.inserted > 0 ? '#f0fdf4' : '#fef9c3',
                    border: `1px solid ${result.data.inserted > 0 ? '#bbf7d0' : '#fde68a'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: result.data.inserted > 0 ? '#16a34a' : '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', flexShrink: 0,
                      }}>
                        <IconCheck />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                          Import Selesai
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{result.data.inserted}</span>
                        <span style={{ color: 'var(--text-secondary)' }}> berhasil</span>
                      </div>
                      {result.data.skipped > 0 && (
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#d97706', fontWeight: 700 }}>{result.data.skipped}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> dilewati</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error list */}
                  {result.data.errors?.length > 0 && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: '10px', padding: '12px', marginBottom: '16px',
                      maxHeight: '140px', overflowY: 'auto',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>
                        Detail error:
                      </div>
                      {result.data.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: '11.5px', color: '#b91c1c', marginBottom: '3px' }}>
                          • {e}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={reset} style={{ flex: 1 }}>
                      Import Lagi
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={close} style={{ flex: 1 }}>
                      Selesai
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Download template */}
                  <div style={{
                    background: 'var(--primary-muted)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                        Belum punya template?
                      </div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '1px' }}>
                        Download template Excel sesuai format yang dibutuhkan
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={handleDownloadTemplate}
                      style={{
                        background: 'var(--primary)', color: 'white',
                        flexShrink: 0, gap: '5px',
                      }}
                    >
                      <IconDownload />
                      Template
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !file && fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragging ? 'var(--primary)' : file ? '#16a34a' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '28px 20px',
                      textAlign: 'center',
                      cursor: file ? 'default' : 'pointer',
                      background: dragging ? 'var(--primary-muted)' : file ? '#f0fdf4' : 'var(--bg)',
                      transition: 'all 0.15s',
                      marginBottom: '16px',
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFile(e.target.files[0])}
                    />

                    {file ? (
                      <div>
                        <div style={{ color: '#16a34a', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                          <IconFile />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        >
                          Ganti File
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                          <IconUpload />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          {dragging ? 'Lepaskan file di sini' : 'Drag & drop file Excel'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          atau <span style={{ color: 'var(--primary)', fontWeight: 600 }}>klik untuk pilih file</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Format: .xlsx / .xls — Maks. 10 MB
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={close} style={{ flex: 1 }}>
                      Batal
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSubmit}
                      disabled={!file || uploading}
                      style={{ flex: 2, justifyContent: 'center' }}
                    >
                      {uploading ? (
                        <>
                          <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                          Mengimport...
                        </>
                      ) : (
                        <>
                          <IconUpload />
                          Import Data
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelImport;
