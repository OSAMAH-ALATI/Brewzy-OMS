import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { formatDate, nowStamp } from '../lib/utils.js'

// Worker side: complete the emptying protocol for a machine assigned to you.
export default function EmptyChecklist({ onNavigate }) {
  const {
    emptyRecords, emptySteps, machines, session,
    getMachine, getMachineName, patchRow, logActivity, showToast,
  } = useApp()

  const steps = emptySteps || []
  const [selectedId, setSelectedId] = useState(null)

  // Pending records assigned to the current user (by machine assignment or doneBy).
  const pending = useMemo(() => {
    const uid = session?.userId
    return (emptyRecords || []).filter((r) => {
      if (r.completed) return false
      if (r.doneBy === uid) return true
      const m = machines.find((x) => x.id === r.machineId)
      if (!m) return false
      if (session?.role === 'operator') return (m.operators || []).includes(uid)
      if (session?.role === 'technician') return m.technician === uid
      return false
    }).sort((a, b) => {
      const ka = a.createdAt || a.date || ''
      const kb = b.createdAt || b.date || ''
      return ka < kb ? 1 : ka > kb ? -1 : 0
    })
  }, [emptyRecords, machines, session])

  if (!pending.length) {
    return (
      <>
        <div className="ph">
          <div className="ph-text">
            <h1>Empty Checklist</h1>
            <p>Complete the emptying protocol before moving a machine.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <p>No pending machine emptying tasks assigned to you.</p>
          </div>
        </div>
      </>
    )
  }

  const active = pending.find((r) => r.id === selectedId) || pending[0]
  const m = getMachine(active.machineId)
  const completed = active.stepsCompleted || []
  const doneCount = steps.filter((s) => completed.includes(s.id)).length
  const allDone = steps.length > 0 && doneCount === steps.length

  const toggle = (stepId) => {
    const cur = active.stepsCompleted || []
    const next = cur.includes(stepId) ? cur.filter((id) => id !== stepId) : [...cur, stepId]
    patchRow('emptyRecords', active.id, { stepsCompleted: next })
  }

  const submit = () => {
    patchRow('emptyRecords', active.id, {
      completed: true,
      completedBy: session.userId,
      completedAt: nowStamp(),
    })
    logActivity('service', `Machine emptied: ${getMachineName(active.machineId)}`)
    showToast('✅ Machine emptying recorded!')
    setSelectedId(null)
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>Empty Checklist</h1>
          <p>Complete every step before moving the machine.</p>
        </div>
      </div>

      {pending.length > 1 && (
        <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Select task to complete:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {pending.map((r) => (
              <button
                key={r.id}
                className={'btn ' + (r.id === active.id ? 'btn-brand' : 'btn-outline')}
                onClick={() => setSelectedId(r.id)}
              >{getMachineName(r.machineId)}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--sb, var(--brand))', borderRadius: 12, padding: '20px 22px', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--e2)' }}>
        <div style={{ width: 52, height: 52, background: 'var(--brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🔌</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{m?.name || '—'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 5 }}>📍 {m?.location || '—'} &middot; 📅 {formatDate(active.date)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 4, fontWeight: 700 }}>Reason: {active.reason}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Protocol Steps</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{doneCount} / {steps.length} steps completed</div>
        </div>

        {steps.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No protocol steps configured yet.
          </div>
        ) : (
          steps.map((s, i) => {
            const isDone = completed.includes(s.id)
            return (
              <div key={s.id} className="checklist-item" style={isDone ? { opacity: 0.6 } : undefined}>
                <input
                  type="checkbox"
                  id={'ec-' + s.id}
                  checked={isDone}
                  onChange={() => toggle(s.id)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: isDone ? 'var(--success)' : 'var(--bg)', color: isDone ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, border: '1.5px solid ' + (isDone ? 'var(--success)' : 'var(--border)') }}>{i + 1}</div>
                  <label htmlFor={'ec-' + s.id} className="checklist-label" style={{ cursor: 'pointer', textDecoration: isDone ? 'line-through' : 'none' }}>{s.text}</label>
                </div>
                {isDone && <span style={{ color: 'var(--success)', fontSize: 18, flexShrink: 0 }}>✓</span>}
              </div>
            )
          })
        )}

        {allDone && (
          <div style={{ marginTop: 18 }}>
            <div style={{ background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 10, padding: '14px 16px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              ✅ All steps complete — you can now record this machine as emptied.
            </div>
            <button className="btn btn-teal" onClick={submit}>Submit &amp; Record Completion</button>
          </div>
        )}
      </div>
    </>
  )
}
