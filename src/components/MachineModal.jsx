import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { genId, today, clone } from '../lib/utils.js'

const EMPTY = {
  name: '', machineId: '', orderNumber: '', location: '', mapsLink: '',
  duty: 'Morning', frequency: 'Daily', status: 'Active',
  operators: [], technician: '', lastService: '', notes: '',
}

export default function MachineModal({ open, machineId, onClose }) {
  const { machines, users, globalTasks, getMachine, setRow, patchRow, logActivity, showToast } = useApp()
  const { t } = useT()
  const isEdit = !!machineId

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (machineId) {
      const m = getMachine(machineId)
      if (m) {
        setForm({
          name: m.name || '', machineId: m.machineId || '', orderNumber: m.orderNumber || '',
          location: m.location || '', mapsLink: m.mapsLink || '', duty: m.duty || 'Morning',
          frequency: m.frequency || 'Daily', status: m.status || 'Active',
          operators: [...(m.operators || [])], technician: m.technician || '',
          lastService: m.lastService || '', notes: m.notes || '',
        })
      }
    } else {
      setForm({ ...EMPTY, lastService: today() })
    }
  }, [open, machineId, getMachine])

  if (!open) return null

  const operatorUsers = users.filter((u) => u.role === 'operator')
  const technicianUsers = users.filter((u) => u.role === 'technician')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleOperator = (id) => setForm((f) => ({
    ...f,
    operators: f.operators.includes(id) ? f.operators.filter((x) => x !== id) : [...f.operators, id],
  }))

  const save = () => {
    const name = form.name.trim()
    const machineCode = form.machineId.trim()
    const location = form.location.trim()
    const errs = {}
    if (!name) errs.name = 'Machine name is required'
    if (!machineCode) errs.machineId = 'Machine ID is required'
    if (!location) errs.location = 'Location is required'
    if (machineCode) {
      const dup = machines.some((m) => m.machineId === machineCode && m.id !== machineId)
      if (dup) errs.machineId = 'Machine ID must be unique'
    }
    // errors are English keys; translated at render via t()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const fields = {
      name, machineId: machineCode, orderNumber: form.orderNumber.trim(),
      location, mapsLink: form.mapsLink.trim(), duty: form.duty,
      frequency: form.frequency, status: form.status,
      operators: [...form.operators], technician: form.technician,
      lastService: form.lastService, notes: form.notes.trim(),
    }

    if (isEdit) {
      patchRow('machines', machineId, fields)
      logActivity('service', `Machine updated: ${name} (${location})`)
      showToast(t('Machine updated'))
    } else {
      const id = genId('m_')
      setRow('machines', id, { id, ...fields, tasks: clone(globalTasks || []) })
      logActivity('service', `Machine added: ${name} (${location})`)
      showToast(t('Machine added'))
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title={isEdit ? t('Edit Machine') : t('Add Machine')}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn btn-teal" onClick={save}>{t('Save Machine')}</button>
        </>
      )}
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Machine Name')} <span className="req">*</span></label>
          <input
            className={'form-control' + (errors.name ? ' error' : '')}
            placeholder={t('e.g. Al Matarat')}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          <div className={'field-err' + (errors.name ? ' show' : '')}>{t(errors.name)}</div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Machine ID')} <span className="req">*</span></label>
          <input
            className={'form-control' + (errors.machineId ? ' error' : '')}
            placeholder={t('e.g. M001')}
            value={form.machineId}
            onChange={(e) => set('machineId', e.target.value)}
          />
          <div className={'field-err' + (errors.machineId ? ' show' : '')}>{t(errors.machineId)}</div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Order Number')}</label>
          <input className="form-control" placeholder={t('e.g. ORD-001')} value={form.orderNumber} onChange={(e) => set('orderNumber', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Location / Place Name')} <span className="req">*</span></label>
          <input
            className={'form-control' + (errors.location ? ' error' : '')}
            placeholder={t('e.g. Al Matarat')}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
          <div className={'field-err' + (errors.location ? ' show' : '')}>{t(errors.location)}</div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Maps Link')} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{t('(optional)')}</span></label>
        <input className="form-control" placeholder="https://maps.app.goo.gl/..." value={form.mapsLink} onChange={(e) => set('mapsLink', e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Operation Duty')}</label>
          <select className="form-control" value={form.duty} onChange={(e) => set('duty', e.target.value)}>
            <option value="Morning">{t('Morning')}</option><option value="Evening">{t('Evening')}</option><option value="Both">{t('Both')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Service Frequency')}</label>
          <select className="form-control" value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
            <option value="Daily">{t('Daily')}</option><option value="Every 2 Days">{t('Every 2 Days')}</option><option value="Every 3 Days">{t('Every 3 Days')}</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Machine Status')}</label>
          <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="Active">{t('Active')}</option><option value="Inactive">{t('Inactive')}</option><option value="Maintenance">{t('Maintenance')}</option><option value="Out of Service">{t('Out of Service')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Last Service Date')}</label>
          <input className="form-control" type="date" value={form.lastService} onChange={(e) => set('lastService', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Assign Operator(s)')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, maxHeight: 150, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1.5px solid var(--border)' }}>
            {operatorUsers.length ? operatorUsers.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}>
                <input
                  type="checkbox"
                  checked={form.operators.includes(u.id)}
                  onChange={() => toggleOperator(u.id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}</span>
              </label>
            )) : <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: 8 }}>{t('No operators added yet')}</div>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Assign Technician')}</label>
          <select className="form-control" value={form.technician} onChange={(e) => set('technician', e.target.value)}>
            <option value="">{t('None')}</option>
            {technicianUsers.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Notes')}</label>
        <textarea className="form-control" placeholder={t('Any notes...')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}
