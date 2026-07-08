import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { getDueStatus, formatDate, formatDuty } from '../lib/utils.js'
import ServiceModal from '../components/ServiceModal.jsx'
import IssueModal from '../components/IssueModal.jsx'
import MachineModal from '../components/MachineModal.jsx'
import TasksModal from '../components/TasksModal.jsx'

const dueBdg = (d) => d === 'Overdue' ? 'badge-overdue' : d === 'Due Today' ? 'badge-due' : 'badge-ok'
const stBdg = (s) => s === 'Active' ? 'badge-active' : s === 'Maintenance' ? 'badge-maintenance' : s === 'Out of Service' ? 'badge-outofservice' : 'badge-inactive'

export default function Machines({ onNavigate }) {
  const { machines, session, getMachine, removeRow, logActivity, showToast, showConfirm } = useApp()
  const { t } = useT()
  const isManager = session?.role === 'manager'

  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fDue, setFDue] = useState('')

  const [serviceId, setServiceId] = useState(undefined)        // machineId
  const [issuePrefill, setIssuePrefill] = useState(undefined)  // machineId for report
  const [machineEditId, setMachineEditId] = useState(undefined) // id|null
  const [tasksId, setTasksId] = useState(undefined)            // machineId

  const s = search.toLowerCase()
  const rows = machines.filter((m) => {
    if (s && !m.name.toLowerCase().includes(s) && !m.location.toLowerCase().includes(s) && !m.machineId.toLowerCase().includes(s)) return false
    if (fStatus && m.status !== fStatus) return false
    if (fDue && getDueStatus(m) !== fDue) return false
    return true
  })

  const deleteMachine = async (id) => {
    const m = getMachine(id)
    const ok = await showConfirm({
      title: 'Delete machine?',
      message: `${t('This will permanently delete')} ${m ? m.name : t('this machine')} (${m ? m.machineId : ''}) ${t('along with its task list, service schedule, and all associated data. This action cannot be undone.')}`,
      confirmText: 'Delete Machine',
      tone: 'danger',
    })
    if (!ok) return
    await removeRow('machines', id)
    logActivity('service', `Machine deleted: ${m ? m.name : id}`)
    showToast(t('Machine deleted'), '🗑')
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Machines')}</h1>
          <p>{t('Manage machines, schedules and assignments')}</p>
        </div>
        {isManager && (
          <div className="ph-actions">
            <button className="btn btn-teal" onClick={() => setMachineEditId(null)}>+ {t('Add Machine')}</button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder={t('Search by name, location or ID…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">{t('All Status')}</option>
          <option value="Active">{t('Active')}</option><option value="Inactive">{t('Inactive')}</option><option value="Maintenance">{t('Maintenance')}</option><option value="Out of Service">{t('Out of Service')}</option>
        </select>
        <select className="filter-select" value={fDue} onChange={(e) => setFDue(e.target.value)}>
          <option value="">{t('All Due')}</option>
          <option value="Overdue">{t('Overdue')}</option><option value="Due Today">{t('Due Today')}</option><option value="Not Due">{t('Not Due')}</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('Machine')}</th><th>{t('Location')}</th><th>{t('Duty')}</th><th>{t('Freq.')}</th>
              <th>{t('Last Service')}</th><th>{t('Due Status')}</th><th>{t('Machine Status')}</th><th>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((m) => {
              const due = getDueStatus(m)
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {m.machineId}{' '}
                      {m.mapsLink && (
                        <a href={m.mapsLink} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 500 }}>📍 {t('Map')}</a>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.location}</td>
                  <td><span className="stat-pill">{t(formatDuty(m.duty))}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(m.frequency)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(m.lastService)}</td>
                  <td><span className={'badge ' + dueBdg(due)}>{t(due)}</span></td>
                  <td><span className={'badge ' + stBdg(m.status)}>{t(m.status)}</span></td>
                  <td className="actions-cell">
                    <div className="action-group">
                      <button className="btn btn-outline btn-sm" onClick={() => setServiceId(m.id)}>✓ {t('Service')}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setIssuePrefill(m.id)}>⚠ {t('Issue')}</button>
                      {isManager && (
                        <>
                          <button className="btn btn-teal btn-sm" onClick={() => setTasksId(m.id)}>{t('Tasks')}</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setMachineEditId(m.id)}>{t('Edit')}</button>
                          <button className="btn btn-danger btn-sm btn-icon" title={t('Delete machine')} onClick={() => deleteMachine(m.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={8}><div className="empty-state"><p>{t('No machines found')}</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ServiceModal open={serviceId !== undefined} machineId={serviceId} onClose={() => setServiceId(undefined)} />
      <IssueModal open={issuePrefill !== undefined} issueId={null} prefillMachineId={issuePrefill} onClose={() => setIssuePrefill(undefined)} />
      <MachineModal open={machineEditId !== undefined} machineId={machineEditId} onClose={() => setMachineEditId(undefined)} />
      <TasksModal open={tasksId !== undefined} machineId={tasksId} onClose={() => setTasksId(undefined)} />
    </>
  )
}
