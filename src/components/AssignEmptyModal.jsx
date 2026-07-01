import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { genId, today, nowStamp } from '../lib/utils.js'

const REASONS = [
  'Moving machine to new location',
  'Deep maintenance',
  'End of contract',
  'Machine failure',
  'Scheduled relocation',
  'Other',
]

// Manager assigns an emptying task: creates one emptyRecord per selected assignee.
export default function AssignEmptyModal({ open, onClose }) {
  const { machines, users, session, setRow, genId: ctxGenId, logActivity, showToast, getMachineName, getUserName } = useApp()
  const mkId = ctxGenId || genId

  const [machineId, setMachineId] = useState('')
  const [assignees, setAssignees] = useState([])
  const [date, setDate] = useState(today())
  const [reason, setReason] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setMachineId('')
    setAssignees([])
    setDate(today())
    setReason('')
    setNewLocation('')
    setNotes('')
  }, [open])

  if (!open) return null

  const operators = users.filter((u) => u.role === 'operator')
  const technicians = users.filter((u) => u.role === 'technician')

  const toggle = (id) => setAssignees((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  const save = () => {
    if (!machineId) { showToast('Select a machine', '⚠️'); return }
    if (!date) { showToast('Set a date', '⚠️'); return }
    if (!reason) { showToast('Select a reason', '⚠️'); return }
    if (!assignees.length) { showToast('Select at least one person to assign', '⚠️'); return }

    assignees.forEach((uid) => {
      const id = mkId('er_')
      setRow('emptyRecords', id, {
        id,
        machineId,
        date,
        reason,
        newLocation: newLocation.trim(),
        doneBy: uid,
        notes: notes.trim(),
        completed: false,
        stepsCompleted: [],
        createdBy: session.userId,
        createdAt: nowStamp(),
      })
    })

    const names = assignees.map((id) => getUserName(id)).join(', ')
    logActivity('service', `Emptying assigned: ${getMachineName(machineId)}`)
    showToast(`✓ Assigned to ${names}`)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📋 Assign Emptying Task"
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-teal" onClick={save}>✓ Assign Task</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">Machine to Empty <span className="req">*</span></label>
        <select className="form-control" value={machineId} onChange={(e) => { setMachineId(e.target.value); setAssignees([]) }}>
          <option value="">Select machine...</option>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.name} – {m.location}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Assign To <span className="req">*</span>{' '}
          <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>— select one or more</span>
        </label>
        {!machineId ? (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>Select a machine first</div>
        ) : (operators.length + technicians.length) === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>No operators or technicians in the system yet</div>
        ) : (
          <div className="assign-pills">
            {operators.map((u) => (
              <div
                key={u.id}
                className={'assign-pill' + (assignees.includes(u.id) ? ' selected-op' : '')}
                onClick={() => toggle(u.id)}
              >🚗 {u.name}</div>
            ))}
            {technicians.map((u) => (
              <div
                key={u.id}
                className={'assign-pill' + (assignees.includes(u.id) ? ' selected-tech' : '')}
                onClick={() => toggle(u.id)}
              >🔧 {u.name}</div>
            ))}
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date <span className="req">*</span></label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Reason <span className="req">*</span></label>
          <select className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select reason...</option>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">New Location <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(if relocating)</span></label>
        <input className="form-control" placeholder="e.g. King Fahd Road" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-control" placeholder="Any instructions for the assignees..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  )
}
