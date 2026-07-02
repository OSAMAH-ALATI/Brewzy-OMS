import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { genId } from '../lib/utils.js'
import AssignEmptyModal from '../components/AssignEmptyModal.jsx'

// Manager-only: configure the ordered list of machine-emptying protocol steps.
export default function EmptyProtocol({ onNavigate }) {
  const { emptySteps, updateConfig, showToast, showConfirm } = useApp()
  const { t } = useT()
  const steps = emptySteps || []

  const [newStep, setNewStep] = useState('')
  const [editIdx, setEditIdx] = useState(null)
  const [editText, setEditText] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)

  const persist = (arr) => updateConfig({ emptySteps: arr })

  const addStep = () => {
    const val = newStep.trim()
    if (!val) { showToast(t('Enter a step description'), '⚠️'); return }
    persist([...steps, { id: genId('es_'), text: val }])
    setNewStep('')
  }

  const startEdit = (i) => { setEditIdx(i); setEditText(steps[i].text) }
  const cancelEdit = () => { setEditIdx(null); setEditText('') }
  const confirmEdit = (i) => {
    const val = editText.trim()
    if (!val) { showToast(t('Step cannot be empty'), '⚠️'); return }
    const arr = steps.map((s, idx) => (idx === i ? { ...s, text: val } : s))
    persist(arr)
    cancelEdit()
  }

  const deleteStep = async (i) => {
    const ok = await showConfirm({
      title: 'Delete step?',
      message: 'This protocol step will be permanently removed. This cannot be undone.',
      confirmText: 'Delete Step',
      tone: 'danger',
    })
    if (!ok) return
    persist(steps.filter((_, idx) => idx !== i))
    if (editIdx === i) cancelEdit()
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const arr = [...steps]
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    persist(arr)
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Machine Emptying Protocol')}</h1>
          <p>{t('Define the steps a worker must complete before a machine can be moved.')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-brand" onClick={() => setAssignOpen(true)}>📋 {t('Assign to Operator')}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">{t('Protocol Steps')}</div>
        </div>

        {steps.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {t('No steps yet. Add one below.')}
          </div>
        ) : (
          <div>
            {steps.map((s, i) => (
              <div
                key={s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>

                {editIdx === i ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 6 }}>
                    <input
                      className="form-control"
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit(i)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-teal btn-sm" onClick={() => confirmEdit(i)}>✓</button>
                    <button className="btn btn-outline btn-sm" onClick={cancelEdit}>✕</button>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text-primary)' }}>{s.text}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-icon btn-sm" title={t('Move up')} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button className="btn btn-icon btn-sm" title={t('Move down')} disabled={i === steps.length - 1} onClick={() => move(i, 1)}>↓</button>
                      <button className="btn btn-ghost btn-sm" title={t('Edit')} style={{ color: 'var(--brand)' }} onClick={() => startEdit(i)}>✏</button>
                      <button className="btn btn-ghost btn-sm" title={t('Delete')} style={{ color: 'var(--error)' }} onClick={() => deleteStep(i)}>🗑</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            className="form-control"
            placeholder={t('Type a new step and press Enter…')}
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addStep() }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-teal" onClick={addStep}>+ {t('Add Step')}</button>
        </div>

        <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--brand)', marginTop: 16 }}>
          {t('All steps above must be completed before a machine can be moved.')}
        </div>
      </div>

      <AssignEmptyModal open={assignOpen} onClose={() => setAssignOpen(false)} />
    </>
  )
}
