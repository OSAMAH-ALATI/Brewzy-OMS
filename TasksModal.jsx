import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { clone, FREQ_LABEL } from '../lib/utils.js'
import Modal from './Modal.jsx'

const FREQ_OPTS = ['daily', 'every2', 'every3', 'weekly', 'tech']

// Edit ONE machine's task list. Works on a local copy; Save persists, Cancel discards.
export default function TasksModal({ open, machineId, onClose }) {
  const { machines, patchRow, logActivity, showToast, genId } = useApp()
  const machine = machines.find((m) => m.id === machineId)

  const [tasks, setTasks] = useState([])
  const [newName, setNewName] = useState('')
  const [newFreq, setNewFreq] = useState('daily')

  // Seed the local copy each time the modal opens.
  useEffect(() => {
    if (!open) return
    setTasks(clone(machine?.tasks || []))
    setNewName('')
    setNewFreq('daily')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, machineId])

  if (!open || !machine) return null

  const setTaskName = (i, val) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, name: val } : t)))
  const setTaskFreq = (i, val) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, freq: val, isTech: val === 'tech' } : t)))
  const removeTask = (i) => setTasks((ts) => ts.filter((_, j) => j !== i))
  const move = (i, dir) => setTasks((ts) => {
    const j = i + dir
    if (j < 0 || j >= ts.length) return ts
    const next = [...ts]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })
  const addTask = () => {
    const n = newName.trim()
    if (!n) { showToast('Enter a task description first', '⚠️'); return }
    setTasks((ts) => [...ts, { id: genId('t_'), name: n, freq: newFreq, isTech: newFreq === 'tech' }])
    setNewName('')
  }

  const save = () => {
    patchRow('machines', machine.id, { tasks: clone(tasks) })
    logActivity('service', `Tasks updated: ${machine.name}`)
    showToast(`Tasks saved for ${machine.name}`)
    onClose?.()
  }

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose}>Close</button>
      <button className="btn btn-teal" onClick={save}>Save Tasks</button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} large title={`Tasks – ${machine.name}`} footer={footer}>
      <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: 'var(--brand)' }}>
        <strong>{machine.name}</strong> · {machine.location} · {machine.frequency || '—'} · {machine.duty || 'Morning'} shift
      </div>

      <div>
        {!tasks.length && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>No tasks yet. Add one below.</div>
        )}
        {tasks.map((t, i) => (
          <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button className="btn btn-icon btn-sm" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</button>
              <button className="btn btn-icon btn-sm" onClick={() => move(i, 1)} disabled={i === tasks.length - 1} title="Move down">↓</button>
            </div>
            <input
              className="form-control"
              style={{ flex: 1, minWidth: 0, fontWeight: t.freq === 'tech' ? 600 : 400 }}
              value={t.name}
              onChange={(e) => setTaskName(i, e.target.value)}
            />
            <select className="form-control" style={{ minWidth: 130, flexShrink: 0 }} value={t.freq} onChange={(e) => setTaskFreq(i, e.target.value)}>
              {FREQ_OPTS.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => removeTask(i)} title="Remove task" style={{ color: 'var(--red)', flexShrink: 0 }}>🗑</button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>Add New Task</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input className="form-control" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Task description..." onKeyDown={(e) => { if (e.key === 'Enter') addTask() }} />
          </div>
          <select className="form-control" style={{ minWidth: 130 }} value={newFreq} onChange={(e) => setNewFreq(e.target.value)}>
            {FREQ_OPTS.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
          </select>
          <button className="btn btn-teal" onClick={addTask}>+ Add Task</button>
        </div>
      </div>
    </Modal>
  )
}
