import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { clone, freqMatchesMachineFreq, FREQ_LABEL, WEEKDAYS } from '../lib/utils.js'
import Modal from './Modal.jsx'

const FREQ_OPTS = ['daily', 'every2', 'every3', 'weekly', 'monthly', 'tech']

// Create / edit a library (global) task and optionally push it into machines.
// editIndex: number => edit globalTasks[editIndex]; null => new task.
export default function GlobalTaskModal({ open, editIndex, onClose }) {
  const { machines, globalTasks, updateConfig, patchRow, showToast, genId } = useApp()
  const { t } = useT()

  const editing = editIndex !== null && editIndex !== undefined

  const [name, setName] = useState('')
  const [freq, setFreq] = useState('daily')
  const [weekday, setWeekday] = useState(0)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [checked, setChecked] = useState([]) // machine ids

  // Reset fields whenever the modal opens.
  useEffect(() => {
    if (!open) return
    const t = editing ? globalTasks[editIndex] : null
    setName(t ? t.name : '')
    setFreq(t ? t.freq : 'daily')
    setWeekday(t && t.weekday != null ? t.weekday : 0)
    setDayOfMonth(t && t.dayOfMonth != null ? t.dayOfMonth : 1)
    if (t) {
      setChecked(machines.filter((m) => (m.tasks || []).some((mt) => mt.id === t.id)).map((m) => m.id))
    } else {
      // New task: default to all machines checked (mirrors original).
      setChecked(machines.map((m) => m.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const selectAll = (val) => setChecked(val ? machines.map((m) => m.id) : [])

  const sameFreqMachines = machines.filter((m) => m.frequency && freqMatchesMachineFreq(freq, m.frequency))
  const assignSameFreq = () => {
    setChecked((c) => Array.from(new Set([...c, ...sameFreqMachines.map((m) => m.id)])))
    showToast(`${t('Selected')} ${sameFreqMachines.length} ${t('machines')}`)
  }

  const save = () => {
    const n = name.trim()
    if (!n) { showToast(t('Please enter a task name'), '⚠️'); return }

    const schedule = freq === 'weekly'
      ? { weekday: Number(weekday) }
      : freq === 'monthly'
        ? { dayOfMonth: Number(dayOfMonth) }
        : {}

    let task
    let newTasks
    if (editing) {
      const { weekday: _w, dayOfMonth: _d, ...base } = globalTasks[editIndex]
      task = { ...base, name: n, freq, isTech: freq === 'tech', ...schedule }
      newTasks = globalTasks.map((t, i) => (i === editIndex ? task : t))
    } else {
      task = { id: genId('t_'), name: n, freq, isTech: freq === 'tech', ...schedule }
      newTasks = [...globalTasks, task]
    }
    updateConfig({ globalTasks: newTasks })

    // Sync each machine: add if checked & missing, remove if unchecked & present,
    // refresh in place if checked & present (keeps name/freq aligned).
    machines.forEach((m) => {
      const list = m.tasks || []
      const has = list.some((t) => t.id === task.id)
      const isChecked = checked.includes(m.id)
      if (isChecked && !has) {
        patchRow('machines', m.id, { tasks: [...list, clone(task)] })
      } else if (!isChecked && has) {
        patchRow('machines', m.id, { tasks: list.filter((t) => t.id !== task.id) })
      } else if (isChecked && has) {
        patchRow('machines', m.id, { tasks: list.map((t) => (t.id === task.id ? clone(task) : t)) })
      }
    })

    showToast(editing ? t('Task updated') : t('Task added'))
    onClose?.()
  }

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-teal" onClick={save}>{t('Save Task')}</button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={editing ? t('Edit Task') : t('New Task')} footer={footer}>
      <div className="form-group">
        <label className="form-label">{t('Task Name')} <span className="req">*</span></label>
        <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Describe the task...')} />
      </div>
      <div className="form-group">
        <label className="form-label">{t('Frequency')}</label>
        <select className="form-control" value={freq} onChange={(e) => setFreq(e.target.value)}>
          {FREQ_OPTS.map((f) => <option key={f} value={f}>{t(FREQ_LABEL[f])}</option>)}
        </select>
      </div>

      {freq === 'weekly' && (
        <div className="form-group">
          <label className="form-label">{t('Day of Week')}</label>
          <select className="form-control" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{t(d)}</option>)}
          </select>
        </div>
      )}

      {freq === 'monthly' && (
        <div className="form-group">
          <label className="form-label">{t('Day of Month')}</label>
          <select className="form-control" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {freq !== 'tech' && (
        <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>⚡ {t('Quick Assign — Same Frequency')}</div>
              <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>
                {sameFreqMachines.length
                  ? `${sameFreqMachines.length} ${t('machine(s) with')} ${t(FREQ_LABEL[freq])} ${t('service frequency:')}`
                  : t('No machines with matching service frequency found.')}
              </div>
            </div>
            {sameFreqMachines.length > 0 && (
              <button className="btn btn-teal btn-sm" onClick={assignSameFreq}>{t('Assign to all')}</button>
            )}
          </div>
          {sameFreqMachines.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 8 }}>
              {sameFreqMachines.map((m) => m.name).join(' · ')}
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          {t('Assign to Machines')} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>{t('(check all that apply)')}</span>
          <button type="button" onClick={() => selectAll(true)} style={{ marginLeft: 8, fontSize: 10, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('All')}</button>
          <button type="button" onClick={() => selectAll(false)} style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{t('None')}</button>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {machines.map((m) => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, cursor: 'pointer', border: '1.5px solid var(--border)' }}>
              <input type="checkbox" checked={checked.includes(m.id)} onChange={() => toggle(m.id)} style={{ accentColor: 'var(--brand)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.location}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
