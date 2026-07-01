import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { genId, today } from '../lib/utils.js'

const EMPTY = {
  machineId: '', severity: 'Medium', status: 'Open',
  description: '', assignedTo: [], techResponse: '', resolutionNotes: '',
}

export default function IssueModal({ open, issueId, prefillMachineId, onClose }) {
  const {
    machines, issues, getMachine, getUser, getUserName, getMachineName,
    session, setRow, patchRow, logActivity, showToast,
  } = useApp()
  const isEdit = !!issueId

  const [form, setForm] = useState(EMPTY)
  const [descErr, setDescErr] = useState(false)

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
      }
    } else {
      const firstMachine = prefillMachineId || machines[0]?.id || ''
      setForm({ ...EMPTY, machineId: firstMachine })
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
    }
    const assignedNames = form.assignedTo.map((id) => getUserName(id)).join(', ')

    if (isEdit) {
      const existing = issues.find((x) => x.id === issueId)
      const seenBy = (existing?.seenBy || []).filter((uid) => uid === session.userId)
      patchRow('issues', issueId, { ...fields, seenBy })
      logActivity('issue-update', `Issue updated: ${getMachineName(fields.machineId)} → ${fields.status}${assignedNames ? ' (assigned: ' + assignedNames + ')' : ''}`)
      showToast('Issue updated', '⚠️')
    } else {
      const id = genId('i_')
      setRow('issues', id, {
        id, ...fields,
        reportedBy: session.userId,
        dateReported: today(),
        seenBy: [session.userId],
      })
      logActivity('issue', `Issue reported by ${session.name}: ${desc.substring(0, 50)} – ${getMachineName(fields.machineId)}${assignedNames ? ' → ' + assignedNames : ''}`)
      showToast('Issue reported', '⚠️')
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Issue' : 'Report Issue'}
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-teal" onClick={save}>Save Issue</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">Machine <span className="req">*</span></label>
        <select className="form-control" value={form.machineId} onChange={(e) => onMachineChange(e.target.value)}>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.name} – {m.location}</option>)}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Severity</label>
          <select className="form-control" value={form.severity} onChange={(e) => set('severity', e.target.value)}>
            <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option>Open</option><option>In Progress</option><option>Resolved</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description <span className="req">*</span></label>
        <textarea
          className={'form-control' + (descErr ? ' error' : '')}
          placeholder="Describe the issue..."
          value={form.description}
          onChange={(e) => { set('description', e.target.value); if (descErr) setDescErr(false) }}
        />
        <div className={'field-err' + (descErr ? ' show' : '')}>Please describe the issue</div>
      </div>

      <div className="form-group">
        <label className="form-label">Assign To <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(select who needs to handle this)</span></label>
        <div className="assign-pills">
          {!machine ? (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Select a machine first</div>
          ) : assignable.length ? assignable.map((a) => {
            const isSel = form.assignedTo.includes(a.id)
            const cls = isSel ? (a.role === 'operator' ? 'selected-op' : 'selected-tech') : ''
            return (
              <div key={a.id} className={'assign-pill ' + cls} onClick={() => toggleAssignee(a.id)}>
                {a.role === 'operator' ? '🚗' : '🔧'} {a.name} <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{a.role}</span>
              </div>
            )
          }) : (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No operators or technician assigned to this machine</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Technician Response / Notes</label>
        <textarea className="form-control" placeholder="Tech notes..." value={form.techResponse} onChange={(e) => set('techResponse', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Resolution Notes</label>
        <textarea className="form-control" placeholder="How was it resolved?" value={form.resolutionNotes} onChange={(e) => set('resolutionNotes', e.target.value)} />
      </div>
    </Modal>
  )
}
