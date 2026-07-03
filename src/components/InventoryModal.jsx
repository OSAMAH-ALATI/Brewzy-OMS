import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { nowStamp } from '../lib/utils.js'
import { INV_CATEGORIES, INV_UNITS } from '../lib/inventorySeed.js'

const EMPTY = {
  name: '', category: INV_CATEGORIES[0], unit: INV_UNITS[0], brand: '', vendor: '',
  packageQty: '', priceInclVat: '', priceExclVat: '', vat: '', pricePerUnit: '',
  packetsPerCarton: '', credit: false, quantity: '', minLevel: '', notes: '',
}

const num = (v) => (v === '' || v == null ? 0 : Number(v))

export default function InventoryModal({ open, item, onClose }) {
  const { suppliers, setRow, patchRow, genId, logActivity, showToast } = useApp()
  const { t } = useT()
  const isEdit = !!item

  const [form, setForm] = useState(EMPTY)
  const [nameErr, setNameErr] = useState(false)

  useEffect(() => {
    if (!open) return
    setNameErr(false)
    if (item) {
      setForm({
        name: item.name || '', category: item.category || INV_CATEGORIES[0], unit: item.unit || INV_UNITS[0],
        brand: item.brand || '', vendor: item.vendor || '',
        packageQty: item.packageQty ?? '', priceInclVat: item.priceInclVat ?? '', priceExclVat: item.priceExclVat ?? '',
        vat: item.vat ?? '', pricePerUnit: item.pricePerUnit ?? '', packetsPerCarton: item.packetsPerCarton || '',
        credit: !!item.credit, quantity: item.quantity ?? '', minLevel: item.minLevel ?? '', notes: item.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, item])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    const name = form.name.trim()
    if (!name) { setNameErr(true); return }
    const fields = {
      name,
      category: form.category,
      unit: form.unit,
      brand: form.brand.trim(),
      vendor: form.vendor.trim(),
      credit: !!form.credit,
      packageQty: num(form.packageQty),
      priceInclVat: num(form.priceInclVat),
      priceExclVat: num(form.priceExclVat),
      vat: num(form.vat),
      pricePerUnit: num(form.pricePerUnit),
      packetsPerCarton: form.packetsPerCarton.trim(),
      quantity: num(form.quantity),
      minLevel: num(form.minLevel),
      notes: form.notes.trim(),
      updatedAt: nowStamp(),
    }
    if (isEdit) {
      patchRow('inventory', item.id, fields)
      logActivity('service', `Inventory item updated: ${name}`)
      showToast(t('Item updated'), '📦')
    } else {
      const id = genId('inv_')
      setRow('inventory', id, { id, ...fields })
      logActivity('service', `Inventory item added: ${name}`)
      showToast(t('Item added'), '📦')
    }
    onClose?.()
  }

  const vendorNames = Array.from(new Set(suppliers.map((s) => s.name).filter(Boolean)))

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title={isEdit ? t('Edit Item') : t('Add Item')}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn btn-teal" onClick={save}>{t('Save Item')}</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">{t('Name')} <span className="req">*</span></label>
        <input
          className={'form-control' + (nameErr ? ' error' : '')}
          value={form.name}
          placeholder={t('Item name')}
          onChange={(e) => { set('name', e.target.value); if (nameErr) setNameErr(false) }}
        />
        <div className={'field-err' + (nameErr ? ' show' : '')}>{t('Please enter a name')}</div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Category')}</label>
          <select className="form-control" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {INV_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Unit')}</label>
          <select className="form-control" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
            {INV_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Brand')}</label>
          <input className="form-control" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Vendor')}</label>
          <input className="form-control" list="vendor-list" value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
          <datalist id="vendor-list">
            {vendorNames.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Package Qty')}</label>
          <input type="number" className="form-control" value={form.packageQty} onChange={(e) => set('packageQty', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Packets per carton')}</label>
          <input className="form-control" value={form.packetsPerCarton} onChange={(e) => set('packetsPerCarton', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Price incl VAT')} (SAR)</label>
          <input type="number" className="form-control" value={form.priceInclVat} onChange={(e) => set('priceInclVat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Price excl VAT')} (SAR)</label>
          <input type="number" className="form-control" value={form.priceExclVat} onChange={(e) => set('priceExclVat', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('VAT')} (SAR)</label>
          <input type="number" className="form-control" value={form.vat} onChange={(e) => set('vat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Price per unit')} (SAR)</label>
          <input type="number" className="form-control" value={form.pricePerUnit} onChange={(e) => set('pricePerUnit', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('In stock quantity')} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>({t('packs')})</span></label>
          <input type="number" className="form-control" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Min level')} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>({t('reorder point')})</span></label>
          <input type="number" className="form-control" value={form.minLevel} onChange={(e) => set('minLevel', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.credit} onChange={(e) => set('credit', e.target.checked)} />
          {t('Bought on credit')}
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Notes')}</label>
        <textarea className="form-control" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}
