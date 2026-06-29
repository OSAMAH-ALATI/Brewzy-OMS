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

// Manager creates a standalone empty-machine record.
export default function EmptyRecordModal({ open, onClose }) {
  const { machines, users, session, setRow, genId: ctxGenId, logActivity, showToast, getMachineName } = useApp()
  const mkId = ctxGenId || genId

  const [machineId, setMachineId] = useState('')
  const [date, setDate] = useState(today())
  const [doneBy, setDoneBy] = useState('')
  const [reason, setReason] = useState('')
  const [reasonOther, setReasonOther] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setMachineId('')
    setDate(today())
    setDoneBy('')
    setReason('')
    setReasonOther('')
    setNewLocation('')
    setNotes('')
  }, [open])

  if (!open) return null

  const workers = users.filter((u) => u.role !== 'manager')

  const save = () => {
    let finalReason = reason
    if (reason === 'Other') finalReason = reasonOther.trim() || 'Other'
    if (!machineId) { showToast('Select a machine', '⚠️'); return }
    if (!date) { showToast('Select a date', '⚠️'); return }
    if (!reason) { showToast('Select a reason', '⚠️'); return }

    const id = mkId('er_')
    setRow('emptyRecords', id, {
      id,
      machineId,
      date,
      reason: finalReason,
      newLocation: newLocation.trim(),
      doneBy,
      notes: notes.trim(),
      completed: false,
      stepsCompleted: [],
      createdBy: session.userId,
      createdAt: nowStamp(),
    })
    logActivity('service', `Empty record created: ${getMachineName(machineId)} – ${finalReason}`)
    showToast('Empty record created')
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Empty Machine Record"
      footer={(
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-teal" onClick={save}>Create Record</button>
        </>
      )}
    >
      <div className="form-group">
        <label className="form-label">Machine <span className="req">*</span></label>
        <select className="form-control" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <option value="">Select machine...</option>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.name} – {m.location}</option>)}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date of Emptying <span className="req">*</span></label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Done By</label>
          <select className="form-control" value={doneBy} onChange={(e) => setDoneBy(e.target.value)}>
            <option value="">Select person...</option>
            {workers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Reason for Emptying <span className="req">*</span></label>
        <select className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Select reason...</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {reason === 'Other' && (
        <div className="form-group">
          <label className="form-label">Specify reason</label>
          <input className="form-control" placeholder="Enter reason..." value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">New Location <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(if relocating)</span></label>
        <input className="form-control" placeholder="e.g. King Fahd Road" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-control" placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--brand)' }}>
        After saving, the assigned operator/technician can open the <strong>Empty Checklist</strong> from Today's Route to complete the steps.
      </div>
    </Modal>
  )
}
