import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { clone, FREQ_LABEL, FREQ_CLASS } from '../lib/utils.js'
import GlobalTaskModal from '../components/GlobalTaskModal.jsx'

// Manager-only Tasks page: manage the global task library (left) and assign
// global tasks to individual machines (right).
export default function Tasks({ onNavigate }) {
  const { machines, globalTasks, updateConfig, patchRow, showConfirm, showToast, session } = useApp()
  const { t: tr } = useT()

  const [editIndex, setEditIndex] = useState(undefined) // undefined = modal closed
  const [machineId, setMachineId] = useState('')
  const [addId, setAddId] = useState('')

  if (session?.role !== 'manager') {
    return (
      <div className="ph">
        <div className="ph-text"><h1>{tr('Tasks')}</h1><p>{tr('Managers only.')}</p></div>
      </div>
    )
  }

  const machine = machines.find((m) => m.id === machineId) || null
  const machineTasks = machine?.tasks || []

  // ── Global task library actions ──
  const moveGlobal = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= globalTasks.length) return
    const arr = [...globalTasks]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    updateConfig({ globalTasks: arr })
  }
  const deleteGlobal = async (i) => {
    const t = globalTasks[i]
    const ok = await showConfirm({
      title: 'Delete task?',
      message: `"${t?.name || tr('this task')}" ${tr("will be permanently deleted from the library and removed from all machines it's assigned to. This cannot be undone.")}`,
      confirmText: 'Delete Task',
      tone: 'danger',
    })
    if (!ok) return
    const tid = t.id
    updateConfig({ globalTasks: globalTasks.filter((_, j) => j !== i) })
    // Remove from every machine that has it.
    machines.forEach((m) => {
      if ((m.tasks || []).some((x) => x.id === tid)) {
        patchRow('machines', m.id, { tasks: m.tasks.filter((x) => x.id !== tid) })
      }
    })
    showToast(tr('Task deleted'), '🗑')
  }

  // ── Per-machine assignment actions ──
  const moveMachineTask = (i, dir) => {
    const j = i + dir
    if (!machine || j < 0 || j >= machineTasks.length) return
    const arr = [...machineTasks]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    patchRow('machines', machine.id, { tasks: arr })
  }
  const removeMachineTask = (i) => {
    if (!machine) return
    patchRow('machines', machine.id, { tasks: machineTasks.filter((_, j) => j !== i) })
    showToast(tr('Task removed from machine'))
  }
  const unassigned = globalTasks.filter((gt) => !machineTasks.some((mt) => mt.id === gt.id))
  const addToMachine = () => {
    if (!machine || !addId) return
    const gt = globalTasks.find((t) => t.id === addId)
    if (!gt || machineTasks.some((t) => t.id === gt.id)) return
    patchRow('machines', machine.id, { tasks: [...machineTasks, clone(gt)] })
    setAddId('')
    showToast(`${tr('Task added to')} ${machine.name}`)
  }

  const freqTag = (freq) => <span className={`freq-tag ${FREQ_CLASS[freq] || 'freq-daily'}`}>{tr(FREQ_LABEL[freq] || freq)}</span>

  return (
    <div>
      <div className="ph">
        <div className="ph-text"><h1>{tr('Tasks')}</h1><p>{tr('Manage the task library and per-machine assignments')}</p></div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT — global task library */}
        <div className="card" style={{ flex: '0 0 380px', maxWidth: '100%' }}>
          <div className="card-header">
            <div className="card-title">{tr('All Tasks')} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>· {globalTasks.length} {tr('tasks')}</span></div>
            <button className="btn btn-teal btn-sm" onClick={() => setEditIndex(null)}>+ {tr('Add Task')}</button>
          </div>
          {!globalTasks.length && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>{tr('No tasks yet. Click + Add Task.')}</div>
          )}
          {globalTasks.map((t, i) => (
            <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: t.freq === 'tech' ? 600 : 400 }}>{t.name}</div>
                <div style={{ marginTop: 3 }}>{freqTag(t.freq)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button className="btn btn-icon btn-sm" onClick={() => moveGlobal(i, -1)} disabled={i === 0} title={tr('Move up')}>↑</button>
                <button className="btn btn-icon btn-sm" onClick={() => moveGlobal(i, 1)} disabled={i === globalTasks.length - 1} title={tr('Move down')}>↓</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditIndex(i)} title={tr('Edit')} style={{ color: 'var(--brand)' }}>✏</button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteGlobal(i)} title={tr('Delete')} style={{ color: 'var(--red)' }}>🗑</button>
            </div>
          ))}
        </div>

        {/* RIGHT — per-machine assignment */}
        <div className="card" style={{ flex: '1 1 420px', minWidth: 320 }}>
          <div className="card-header">
            <div className="card-title">{tr('Machine Tasks')}</div>
          </div>
          <div className="form-group">
            <label className="form-label">{tr('Machine')}</label>
            <select className="form-control" value={machineId} onChange={(e) => { setMachineId(e.target.value); setAddId('') }}>
              <option value="">{tr('Select a machine...')}</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {!machine && (
            <div style={{ padding: 24, color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>{tr('Select a machine to manage its assigned tasks')}</div>
          )}

          {machine && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
                {machine.name} — {machineTasks.length} {tr('tasks')}
              </div>
              {!machineTasks.length && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>{tr('No tasks assigned. Add from the global list below.')}</div>
              )}
              {machineTasks.map((t, i) => (
                <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button className="btn btn-icon btn-sm" onClick={() => moveMachineTask(i, -1)} disabled={i === 0} title={tr('Move up')}>↑</button>
                    <button className="btn btn-icon btn-sm" onClick={() => moveMachineTask(i, 1)} disabled={i === machineTasks.length - 1} title={tr('Move down')}>↓</button>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: t.freq === 'tech' ? 600 : 400 }}>{t.name}</div>
                  {freqTag(t.freq)}
                  <button className="btn btn-ghost btn-sm" onClick={() => removeMachineTask(i)} title={tr('Remove task')} style={{ color: 'var(--red)', flexShrink: 0 }}>✕</button>
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>{tr('Add from Global Tasks')}</div>
                {unassigned.length ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-control" style={{ flex: 1 }} value={addId} onChange={(e) => setAddId(e.target.value)}>
                      <option value="">{tr('Select a task...')}</option>
                      {unassigned.map((gt) => <option key={gt.id} value={gt.id}>{gt.name}</option>)}
                    </select>
                    <button className="btn btn-teal" onClick={addToMachine} disabled={!addId}>{tr('Add')}</button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{tr('All global tasks are already assigned to this machine.')}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <GlobalTaskModal
        open={editIndex !== undefined}
        editIndex={editIndex === undefined ? null : editIndex}
        onClose={() => setEditIndex(undefined)}
      />
    </div>
  )
}
