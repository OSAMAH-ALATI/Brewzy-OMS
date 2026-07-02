import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import {
  getDueStatus, formatDate, today, nowTime,
  taskDueThisVisit, FREQ_LABEL, FREQ_CLASS,
} from '../lib/utils.js'

// Complete a service cycle for a machine.
export default function ServiceModal({ open, machineId, onClose }) {
  const {
    getMachine, visitCount, session,
    setRow, patchRow, genId, logActivity, showToast,
  } = useApp()
  const { t } = useT()

  const machine = machineId ? getMachine(machineId) : null
  const vc = machineId ? visitCount(machineId) : 1

  // Tasks visible this visit.
  const tasks = machine?.tasks || []
  const visibleTasks = tasks.filter((t) => {
    if (t.freq === 'tech' || t.isTech) return true
    return taskDueThisVisit(t, vc)
  })

  const [checked, setChecked] = useState({})
  const [check1, setCheck1] = useState('All Ok')
  const [check2, setCheck2] = useState('All Ok')
  const [notes, setNotes] = useState('')
  const [flag, setFlag] = useState(false)
  const [severity, setSeverity] = useState('Medium')
  const [issueDesc, setIssueDesc] = useState('')

  // Reset the form each time the modal opens for a machine.
  useEffect(() => {
    if (!open) return
    const init = {}
    visibleTasks.forEach((t) => { init[t.id] = true })
    setChecked(init)
    setCheck1('All Ok')
    setCheck2('All Ok')
    setNotes('')
    setFlag(false)
    setSeverity('Medium')
    setIssueDesc('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, machineId])

  if (!open || !machine) return null

  const due = getDueStatus(machine)
  const dueColor = due === 'Overdue' ? 'var(--error)' : due === 'Due Today' ? 'var(--warning)' : 'var(--success)'

  const submit = async () => {
    const checklist = {}
    visibleTasks.forEach((t) => { checklist[t.id] = !!checked[t.id] })

    const scId = genId('sc_')
    await setRow('serviceCycles', scId, {
      id: scId,
      machineId,
      date: today(),
      time: nowTime(),
      operator: session.userId,
      checklist,
      onlineCheck1: check1,
      onlineCheck2: check2,
      notes: notes.trim(),
      status: 'Completed',
    }).catch(() => {})

    await patchRow('machines', machineId, { lastService: today() })

    const desc = issueDesc.trim()
    if (flag && desc) {
      const iId = genId('i_')
      await setRow('issues', iId, {
        id: iId,
        machineId,
        severity,
        status: 'Open',
        description: desc,
        reportedBy: session.userId,
        assignedTo: [machine.technician].filter(Boolean),
        dateReported: today(),
        techResponse: '',
        resolutionNotes: '',
        seenBy: [session.userId],
      }).catch(() => {})
      await logActivity('issue', `Issue flagged during service: ${desc.slice(0, 50)} – ${machine.name}`)
    }

    await logActivity('service', `Service completed: ${machine.name} (${machine.location})`)
    showToast(t('Service cycle completed') + ' ✓')
    onClose?.()
  }

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-teal" onClick={submit}>✓ {t('Mark Complete')}</button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={`${t('Service:')} ${machine.name}`} large footer={footer}>
      <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--brand)' }}>
          {machine.name}{' '}
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>{machine.machineId}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          📍 {machine.location} &nbsp;·&nbsp; 🌅 {t(machine.duty || 'Morning')} &nbsp;·&nbsp; {t(machine.frequency)} &nbsp;·&nbsp; {t('Visit #')}{vc}
        </div>
        <div style={{ fontSize: 12, marginTop: 2 }}>
          {t('Last service:')} {formatDate(machine.lastService)} &nbsp;·&nbsp;{' '}
          <span style={{ fontWeight: 600, color: dueColor }}>{t(due)}</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Service Checklist')}</label>
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <div className="checklist-item" key={task.id}>
              <input
                type="checkbox"
                checked={!!checked[task.id]}
                onChange={(e) => setChecked((c) => ({ ...c, [task.id]: e.target.checked }))}
              />
              <div>
                <div className="checklist-label">
                  {task.name}
                  {(task.freq === 'tech' || task.isTech) && <span className="checklist-tech-badge">{t('TECH')}</span>}
                  <span className={'freq-tag ' + (FREQ_CLASS[task.freq] || 'freq-daily')} style={{ marginLeft: 6 }}>
                    {t(FREQ_LABEL[task.freq] || task.freq)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {t('No tasks due for this visit')}
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Online Check 1 (12PM)')}</label>
          <select className="form-control" value={check1} onChange={(e) => setCheck1(e.target.value)}>
            <option value="All Ok">✅ {t('All Ok')}</option>
            <option value="There is a problem">⚠️ {t('There is a problem')}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('Online Check 2 (12AM)')}</label>
          <select className="form-control" value={check2} onChange={(e) => setCheck2(e.target.value)}>
            <option value="All Ok">✅ {t('All Ok')}</option>
            <option value="There is a problem">⚠️ {t('There is a problem')}</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('Service Notes')}</label>
        <textarea className="form-control" placeholder={t('Any observations...')} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">{t('Flag Technical Issue?')}</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="checkbox"
            style={{ width: 18, height: 18, accentColor: 'var(--brand)' }}
            checked={flag}
            onChange={(e) => setFlag(e.target.checked)}
          />
          <label style={{ fontSize: 14, color: 'var(--text-primary)' }}>{t('Flag an issue with this machine')}</label>
        </div>
      </div>

      {flag && (
        <div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('Severity')}</label>
              <select className="form-control" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Low">{t('Low')}</option>
                <option value="Medium">{t('Medium')}</option>
                <option value="High">{t('High')}</option>
                <option value="Critical">{t('Critical')}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('Issue Description')}</label>
            <textarea className="form-control" placeholder={t('Describe the issue...')} value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} />
          </div>
        </div>
      )}
    </Modal>
  )
}
