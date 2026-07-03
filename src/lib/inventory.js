// ─────────────────────────────────────────────────────────────
// Inventory / Procurement pure helpers (currency: SAR)
// ─────────────────────────────────────────────────────────────

// Stock status for an inventory item.
export function stockStatus(item) {
  const q = Number(item?.quantity) || 0
  const min = Number(item?.minLevel) || 0
  if (q <= 0) return 'Out'
  if (q <= min) return 'Low'
  return 'OK'
}

// Format a number as SAR, e.g. `123.45 SAR`. null/undefined -> '—'.
export function sar(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR'
}

// Stock value of a single item = quantity * price incl VAT.
export function itemValue(item) {
  return (Number(item?.quantity) || 0) * (Number(item?.priceInclVat) || 0)
}

// Next PO number in `PO-0001` style, incrementing from the max existing.
export function nextPoNumber(purchaseOrders) {
  let max = 0
  for (const po of purchaseOrders || []) {
    const m = /PO-(\d+)/.exec(po?.poNumber || '')
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n }
  }
  return 'PO-' + String(max + 1).padStart(4, '0')
}

// Badge class for a stock status.
export function stockBadge(status) {
  if (status === 'Out') return 'badge-overdue'
  if (status === 'Low') return 'badge-maintenance'
  return 'badge-active'
}

// Badge class for a PO status.
export function poBadge(status) {
  switch (status) {
    case 'Requested': return 'badge-open'
    case 'Ordered': return 'badge-inprogress'
    case 'Received': return 'badge-resolved'
    case 'Cancelled': return 'badge-inactive'
    default: return 'badge-inactive'
  }
}
