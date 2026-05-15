'use strict';

/**
 * Kolom MySQL DATE: string kosong dari JSON body sering gagal di strict mode → null.
 * Mengembalikan 'YYYY-MM-DD' atau null.
 */
function normalizeOptionalDate(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Kolom DATETIME/TIMESTAMP: string kosong → null; selain itu string ter-trim (MySQL mem-parse). */
function normalizeOptionalDateTime(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

module.exports = { normalizeOptionalDate, normalizeOptionalDateTime };
