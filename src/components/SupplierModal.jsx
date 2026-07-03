import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'

const EMPTY = { name: '', contact: '', phone: '', notes: '' }

export default function SupplierModal({ open, supplier, onClose }) {
  const { setRow, patchRow, genId, logActivity, showToast } = useApp()
  const { t } = useT()
  const isEdit = !!supplier

  const [form, setForm] = useState(EMPTY)
  const [nameErr, setNameErr] = useState(false)

  useEffect(() => {
    if (!open) return
    setNameErr(false)
    if (supplier) {
      setForm({
        name: supplier.name || '', contact: supplier.contact || '',
        phone: supplier.phone || '', notes: supplier.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, supplier])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    const name = form.name.trim()
    if (!name) { setNameErr(true); return }
    const fields = { name, contact: form.contact.trim(), phone: form.phone.trim(), notes: form.notes.trim() }
    if (isEdit) {
      patchRow('suppliers', supplier.id, fields)
      logActivity('service', `Supplier updated: ${name}`)
      showToast(t('Supplier updated'), '🏷')
    } else {
      const id = genId('sup_')
      setRow('suppliers', id, { id, ...fields })
      logActivity('service', `Supplier added: ${name}`)
      showToast(t('Supplier added'), '🏷')
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('Edit Supplier') : t('Add Supplier')}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn btn-teal" onClick={save}>{t('Save Supplier')}</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">{t('Name')} <span className="req">*</span></label>
        <input
          className={'form-control' + (nameErr ? ' error' : '')}
          value={form.name}
          placeholder={t('Supplier name')}
          onChange={(e) => { set('name', e.target.value); if (nameErr) setNameErr(false) }}
        />
        <div className={'field-err' + (nameErr ? ' show' : '')}>{t('Please enter a name')}</div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Contact person')}</label>
          <input className="form-control" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Phone')}</label>
          <input className="form-control" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t('Notes')}</label>
        <textarea className="form-control" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}
