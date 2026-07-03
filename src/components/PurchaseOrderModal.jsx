import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { nowStamp } from '../lib/utils.js'
import { sar, nextPoNumber } from '../lib/inventory.js'
import '../inventory.css'

const num = (v) => (v === '' || v == null ? 0 : Number(v))

export default function PurchaseOrderModal({ open, po, prefill, onClose }) {
  const {
    suppliers, inventory, purchaseOrders, session,
    setRow, patchRow, genId, logActivity, showToast,
  } = useApp()
  const { t } = useT()
  const isEdit = !!po

  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [lines, setLines] = useState([])
  const [notes, setNotes] = useState('')
  const [expectedDate, setExpectedDate] = useState('')

  useEffect(() => {
    if (!open) return
    if (po) {
      setSupplierId(po.supplierId || '')
      setSupplierName(po.supplierName || '')
      setLines((po.items || []).map((it) => ({ ...it })))
      setNotes(po.notes || '')
      setExpectedDate(po.expectedDate || '')
    } else if (prefill) {
      // Prefill supplier by name if it matches an existing supplier.
      const sup = suppliers.find((s) => s.name === prefill.supplierName)
      setSupplierId(sup?.id || '')
      setSupplierName(prefill.supplierName || sup?.name || '')
      setLines((prefill.items || []).map((it) => ({ ...it })))
      setNotes('')
      setExpectedDate('')
    } else {
      setSupplierId('')
      setSupplierName('')
      setLines([])
      setNotes('')
      setExpectedDate('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, po, prefill])

  if (!open) return null

  const onSupplierChange = (id) => {
    setSupplierId(id)
    setSupplierName(suppliers.find((s) => s.id === id)?.name || '')
  }

  const addLine = () => setLines((ls) => [...ls, { inventoryId: '', name: '', unit: '', qty: 1, unitCost: 0, lineTotal: 0 }])
  const removeLine = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx))

  const updateLine = (idx, patch) => setLines((ls) => ls.map((l, i) => {
    if (i !== idx) return l
    const next = { ...l, ...patch }
    next.lineTotal = (num(next.qty)) * (num(next.unitCost))
    return next
  }))

  const onPickItem = (idx, inventoryId) => {
    const it = inventory.find((x) => x.id === inventoryId)
    updateLine(idx, {
      inventoryId,
      name: it?.name || '',
      unit: it?.unit || '',
      unitCost: it ? (Number(it.priceInclVat) || 0) : 0,
    })
  }

  const subtotal = lines.reduce((s, l) => s + (num(l.lineTotal)), 0)
  const total = subtotal

  const save = () => {
    if (!supplierId && !supplierName) { showToast(t('Please select a supplier'), '⚠️'); return }
    const validLines = lines.filter((l) => l.inventoryId || l.name)
    if (!validLines.length) { showToast(t('Add at least one line item'), '⚠️'); return }
    const items = validLines.map((l) => ({
      inventoryId: l.inventoryId || null,
      name: l.name,
      unit: l.unit,
      qty: num(l.qty),
      unitCost: num(l.unitCost),
      lineTotal: num(l.qty) * num(l.unitCost),
    }))
    const sub = items.reduce((s, l) => s + l.lineTotal, 0)
    const fields = {
      supplierId: supplierId || '',
      supplierName,
      items,
      notes: notes.trim(),
      expectedDate: expectedDate || '',
      subtotal: sub,
      total: sub,
    }
    if (isEdit) {
      patchRow('purchaseOrders', po.id, fields)
      logActivity('service', `Purchase order ${po.poNumber} updated`)
      showToast(t('Purchase order updated'), '🛒')
    } else {
      const id = genId('po_')
      const poNumber = nextPoNumber(purchaseOrders)
      setRow('purchaseOrders', id, {
        id, poNumber, status: 'Requested',
        requestedBy: session?.userId || '',
        createdAt: nowStamp(),
        receivedAt: '',
        ...fields,
      })
      logActivity('service', `Purchase order ${poNumber} created`)
      showToast(t('Purchase order created'), '🛒')
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title={isEdit ? `${t('Edit Purchase Order')} ${po.poNumber}` : t('New Purchase Order')}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn btn-teal" onClick={save}>{t('Save Purchase Order')}</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">{t('Supplier')} <span className="req">*</span></label>
        <select className="form-control" value={supplierId} onChange={(e) => onSupplierChange(e.target.value)}>
          <option value="">{supplierName ? supplierName : t('Select a supplier…')}</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Line Items')}</label>
        <div className="po-lines">
          <div className="po-line po-line-head">
            <div>{t('Item')}</div><div>{t('Qty')}</div><div>{t('Unit Cost')}</div><div>{t('Total')}</div><div></div>
          </div>
          {lines.map((l, idx) => (
            <div className="po-line" key={idx}>
              <select className="form-control" value={l.inventoryId || ''} onChange={(e) => onPickItem(idx, e.target.value)}>
                <option value="">{l.name || t('Select item…')}</option>
                {inventory.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input type="number" className="form-control" value={l.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} />
              <input type="number" className="form-control" value={l.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} />
              <div className="po-line-total">{sar(num(l.qty) * num(l.unitCost))}</div>
              <button type="button" className="po-line-remove" title={t('Remove')} onClick={() => removeLine(idx)}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={addLine}>+ {t('Add line')}</button>
        <div className="po-totals">
          <span className="po-sub">{t('Subtotal')}: {sar(subtotal)}</span>
          <span>{t('Total')}: {sar(total)}</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Expected date')}</label>
          <input type="date" className="form-control" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Notes')}</label>
        <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}
