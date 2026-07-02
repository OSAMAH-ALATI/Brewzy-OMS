import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { genId, today } from '../lib/utils.js'
import { fileToCompressedDataURL } from '../lib/image.js'
import '../features.css'

const MAX_PHOTOS = 4

const EMPTY = {
  machineId: '', severity: 'Medium', status: 'Open',
  description: '', assignedTo: [], techResponse: '', resolutionNotes: '',
}

export default function IssueModal({ open, issueId, prefillMachineId, onClose }) {
  const {
    machines, issues, getMachine, getUser, getUserName, getMachineName,
    session, setRow, patchRow, logActivity, showToast, notify,
  } = useApp()
  const { t } = useT()
  const isEdit = !!issueId

  const [form, setForm] = useState(EMPTY)
  const [descErr, setDescErr] = useState(false)
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    if (!open) return
    setDescErr(false)
    if (issueId) {
      const i = issues.find((x) => x.id === issueId)
      if (i) {
        setForm({
          machineId: i.machineId || '', severity: i.severity || 'Medium', status: i.status || 'Open',
          description: i.description || '', assignedTo: [...(i.assignedTo || [])],
          techResponse: i.techResponse || '', resolutionNotes: i.resolutionNotes || '',
        })
        setPhotos([...(i.photos || [])])
      }
    } else {
      const firstMachine = prefillMachineId || machines[0]?.id || ''
      setForm({ ...EMPTY, machineId: firstMachine })
      setPhotos([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, issueId, prefillMachineId])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const machine = getMachine(form.machineId)
  const assignable = []
  if (machine) {
    ;(machine.operators || []).forEach((id) => { const u = getUser(id); if (u) assignable.push({ id, name: u.name, role: 'operator' }) })
    if (machine.technician) { const u = getUser(machine.technician); if (u) assignable.push({ id: machine.technician, name: u.name, role: 'technician' }) }
  }

  const toggleAssignee = (id) => setForm((f) => ({
    ...f,
    assignedTo: f.assignedTo.includes(id) ? f.assignedTo.filter((x) => x !== id) : [...f.assignedTo, id],
  }))

  const onMachineChange = (id) => setForm((f) => ({ ...f, machineId: id, assignedTo: [] }))

  const onAddPhotos = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) { showToast(`${t('Up to')} ${MAX_PHOTOS} ${t('photos')}`, '📷'); break }
      try {
        const url = await fileToCompressedDataURL(file)
        setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, url]))
      } catch {
        showToast(t('Could not add that image'), '⚠️')
      }
    }
  }
  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))

  const save = () => {
    const desc = form.description.trim()
    if (!desc) { setDescErr(true); return }
    const fields = {
      machineId: form.machineId,
      severity: form.severity,
      status: form.status,
      description: desc,
      assignedTo: [...form.assignedTo],
      techResponse: form.techResponse,
      resolutionNotes: form.resolutionNotes,
      photos: [...photos],
    }
    const assignedNames = form.assignedTo.map((id) => getUserName(id)).join(', ')

    // Notify newly-added technician assignees.
    const notifyTechs = (targetIssueId, newAssignees) => {
      const shortDesc = desc.length > 60 ? desc.substring(0, 60) + '…' : desc
      newAssignees.forEach((uid) => {
        const u = getUser(uid)
        if (u && u.role === 'technician') {
          notify(uid, `${t('You were assigned an issue:')} ${getMachineName(fields.machineId)} — ${shortDesc}`, targetIssueId)
        }
      })
    }

    if (isEdit) {
      const existing = issues.find((x) => x.id === issueId)
      const prevAssigned = existing?.assignedTo || []
      const newlyAdded = form.assignedTo.filter((id) => !prevAssigned.includes(id))
      const seenBy = (existing?.seenBy || []).filter((uid) => uid === session.userId)
      patchRow('issues', issueId, { ...fields, seenBy })
      logActivity('issue-update', `Issue updated: ${getMachineName(fields.machineId)} → ${fields.status}${assignedNames ? ' (assigned: ' + assignedNames + ')' : ''}`)
      notifyTechs(issueId, newlyAdded)
      showToast(t('Issue updated'), '⚠️')
    } else {
      const id = genId('i_')
      setRow('issues', id, {
        id, ...fields,
        reportedBy: session.userId,
        dateReported: today(),
        seenBy: [session.userId],
      })
      logActivity('issue', `Issue reported by ${session.name}: ${desc.substring(0, 50)} – ${getMachineName(fields.machineId)}${assignedNames ? ' → ' + assignedNames : ''}`)
      notifyTechs(id, form.assignedTo)
      showToast(t('Issue reported'), '⚠️')
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('Edit Issue') : t('Report Issue')}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn btn-teal" onClick={save}>{t('Save Issue')}</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">{t('Machine')} <span className="req">*</span></label>
        <select className="form-control" value={form.machineId} onChange={(e) => onMachineChange(e.target.value)}>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.name} – {m.location}</option>)}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Severity')}</label>
          <select className="form-control" value={form.severity} onChange={(e) => set('severity', e.target.value)}>
            <option value="Low">{t('Low')}</option><option value="Medium">{t('Medium')}</option><option value="High">{t('High')}</option><option value="Critical">{t('Critical')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Status')}</label>
          <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="Open">{t('Open')}</option><option value="In Progress">{t('In Progress')}</option><option value="Resolved">{t('Resolved')}</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Description')} <span className="req">*</span></label>
        <textarea
          className={'form-control' + (descErr ? ' error' : '')}
          placeholder={t('Describe the issue...')}
          value={form.description}
          onChange={(e) => { set('description', e.target.value); if (descErr) setDescErr(false) }}
        />
        <div className={'field-err' + (descErr ? ' show' : '')}>{t('Please describe the issue')}</div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Assign To')} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>{t('(select who needs to handle this)')}</span></label>
        <div className="assign-pills">
          {!machine ? (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('Select a machine first')}</div>
          ) : assignable.length ? assignable.map((a) => {
            const isSel = form.assignedTo.includes(a.id)
            const cls = isSel ? (a.role === 'operator' ? 'selected-op' : 'selected-tech') : ''
            return (
              <div key={a.id} className={'assign-pill ' + cls} onClick={() => toggleAssignee(a.id)}>
                {a.role === 'operator' ? '🚗' : '🔧'} {a.name} <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t(a.role)}</span>
              </div>
            )
          }) : (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('No operators or technician assigned to this machine')}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Technician Response / Notes')}</label>
        <textarea className="form-control" placeholder={t('Tech notes...')} value={form.techResponse} onChange={(e) => set('techResponse', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">{t('Resolution Notes')}</label>
        <textarea className="form-control" placeholder={t('How was it resolved?')} value={form.resolutionNotes} onChange={(e) => set('resolutionNotes', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">{t('Photos')}</label>
        <div className="photo-grid">
          {photos.map((src, idx) => (
            <div key={idx} className="photo-thumb">
              <img src={src} alt={`Photo ${idx + 1}`} />
              <button type="button" className="photo-remove" title={t('Remove')} onClick={() => removePhoto(idx)}>✕</button>
            </div>
          ))}
        </div>
        {photos.length < MAX_PHOTOS && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onAddPhotos}
            style={{ marginTop: 8, fontSize: 12 }}
          />
        )}
        <div className="photo-hint">{t('Attach up to')} {MAX_PHOTOS} {t('photos')}</div>
      </div>
    </Modal>
  )
}
