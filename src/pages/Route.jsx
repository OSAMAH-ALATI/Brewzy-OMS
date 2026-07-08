import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { getDueStatus, formatDate, formatDuty } from '../lib/utils.js'
import ServiceModal from '../components/ServiceModal.jsx'
import IssueModal from '../components/IssueModal.jsx'

// Worker (operator/technician) view of THEIR assigned machines.
export default function RoutePage({ onNavigate }) {
  const { machines, issues, emptyRecords, session, getUserName } = useApp()
  const { t } = useT()

  const [serviceId, setServiceId] = useState(undefined) // undefined = closed
  const [issueMachineId, setIssueMachineId] = useState(undefined)

  // Machines assigned to the current user.
  let mine = machines
  if (session?.role === 'operator') {
    mine = machines.filter((m) => (m.operators || []).includes(session.userId))
  } else if (session?.role === 'technician') {
    mine = machines.filter((m) => m.technician === session.userId)
  }

  const order = { Overdue: 0, 'Due Today': 1, 'Not Due': 2 }
  const sorted = [...mine].sort((a, b) => order[getDueStatus(a)] - order[getDueStatus(b)])

  const overdue = sorted.filter((m) => getDueStatus(m) === 'Overdue').length
  const dueToday = sorted.filter((m) => getDueStatus(m) === 'Due Today').length
  const notDue = sorted.filter((m) => getDueStatus(m) === 'Not Due').length

  const dueBadge = (due) => (due === 'Overdue' ? 'badge-overdue' : due === 'Due Today' ? 'badge-due' : 'badge-ok')
  const statusBadge = (s) =>
    s === 'Active' ? 'badge-active'
      : s === 'Maintenance' ? 'badge-maintenance'
        : s === 'Out of Service' ? 'badge-outofservice'
          : 'badge-inactive'

  return (
    <div>
      <div className="ph">
        <div className="ph-text">
          <h1>{t("Today's Route")}</h1>
          <p>{t('Your assigned machines')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="kpi-card c-red" style={{ flex: 1, minWidth: 110 }}>
          <div className="kpi-val">{overdue}</div>
          <div className="kpi-lbl">{t('Overdue')}</div>
        </div>
        <div className="kpi-card c-gold" style={{ flex: 1, minWidth: 110 }}>
          <div className="kpi-val">{dueToday}</div>
          <div className="kpi-lbl">{t('Due Today')}</div>
        </div>
        <div className="kpi-card c-green" style={{ flex: 1, minWidth: 110 }}>
          <div className="kpi-val">{notDue}</div>
          <div className="kpi-lbl">{t('Not Due')}</div>
        </div>
      </div>

      {!sorted.length ? (
        <div className="empty-state">
          <div className="empty-icon">☕</div>
          <p>{t('No machines assigned to you.')}</p>
        </div>
      ) : (
        sorted.map((m, i) => {
          const due = getDueStatus(m)
          const dueCls = due === 'Overdue' ? 'overdue' : due === 'Due Today' ? 'due' : 'ok'
          const openIssues = issues.filter((x) => x.machineId === m.id && x.status !== 'Resolved')
          const hasPendingEmpty = emptyRecords.some((e) => e.machineId === m.id && !e.completed)
          return (
            <div className={'route-card ' + dueCls} key={m.id}>
              <div className="route-num">{i + 1}</div>
              <div className="route-info">
                <div className="route-name">
                  {m.name}{' '}
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 12 }}>{m.machineId}</span>
                </div>
                <div className="route-meta">
                  📍 {m.location} &nbsp;·&nbsp; 🕐 {t(formatDuty(m.duty))} &nbsp;·&nbsp; 🔧 {getUserName(m.technician)}
                </div>
                <div className="stat-row">
                  <span className={'badge ' + dueBadge(due)}>{t(due)}</span>
                  <span className={'badge ' + statusBadge(m.status)}>{t(m.status)}</span>
                  <span className="stat-pill">{t('Last:')} {formatDate(m.lastService)}</span>
                  <span className="stat-pill">{t(m.frequency)}</span>
                  {openIssues.length > 0 && (
                    <span className="badge badge-high">
                      {openIssues.length} {t('open issues')}
                    </span>
                  )}
                </div>
              </div>
              <div className="route-actions">
                {m.mapsLink && (
                  <a href={m.mapsLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">📍 {t('Maps')}</a>
                )}
                <button className="btn btn-teal btn-sm" onClick={() => setServiceId(m.id)}>✓ {t('Service')}</button>
                <button className="btn btn-outline btn-sm" onClick={() => setIssueMachineId(m.id)}>⚠ {t('Issue')}</button>
                {hasPendingEmpty && (
                  <button className="btn btn-gold btn-sm" onClick={() => onNavigate('empty-checklist')}>🔌 {t('Empty Checklist')}</button>
                )}
              </div>
            </div>
          )
        })
      )}

      <ServiceModal open={serviceId !== undefined} machineId={serviceId} onClose={() => setServiceId(undefined)} />
      <IssueModal
        open={issueMachineId !== undefined}
        issueId={null}
        prefillMachineId={issueMachineId}
        onClose={() => setIssueMachineId(undefined)}
      />
    </div>
  )
}
