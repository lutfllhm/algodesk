/**
 * ID baris untuk PUT/DELETE. Prioritas: objek baris di modal, lalu form (hasil spread row saat edit).
 */
export function getRecordId(modal, form) {
  const a = modal?.data?.id;
  if (a !== undefined && a !== null && a !== '') return a;
  const b = form?.id;
  if (b !== undefined && b !== null && b !== '') return b;
  return null;
}
