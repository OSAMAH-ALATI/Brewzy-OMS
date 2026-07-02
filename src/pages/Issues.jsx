import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { formatDate } from '../lib/utils.js'
import IssueModal from '../components/IssueModal.jsx'
import IssueDetailModal from '../components/IssueDetailModal.jsx'
import '../features.css'

const sevBdg = (s) => s === 'Critical' ? 'badge-critical' : s === 'High' ? 'badge-high' : s === 'Medium' ? 'badge-medium' : 'badge-low'
const stBdg = (s) => s === 'Open' ? 'badge-open' : s === 'In Progress' ? 'badge-inprogress' : 'badge-resolved'

export default function Issues({ onNavigate }) {
  const {
    issues, users, session, getMachine, getMachineName, getUserName,
    patchRow, logActivity, showToast,
  } = useApp()
  const { t } = useT()
  const userId = session?.userId

  const [fStatus, setFStatus] = useState('')
  const [fSev, setFSev] = useState('')

  const [editId, setEditId] = useState(undefined)    // id|null
  const [viewId, setViewId] = useState(undefined)    // id

  // Mark every issue as seen by the current user on mount / when issues change.
  useEffect(() => {
    if (!userId) return
    issues.forEach((i) => {
      const seenBy = i.seenBy || []
      if (!seenBy.includes(userId)) {
        patchRow('issues', i.id, { seenBy: [...seenBy, userId] })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, userId])

  const rows = issues.filter((i) => {
    if (fStatus && i.status !== fStatus) return false
    if (fSev && i.severity !== fSev) return false
    return true
  }).slice().reverse()

  const resolveIssue = async (id) => {
    const i = issues.find((x) => x.id === id)
    if (!i) return
    const seenBy = [...(i.seenBy || [])]
    users.forEach((u) => { if (!seenBy.includes(u.id)) seenBy.push(u.id) })
    await patchRow('issues', id, { status: 'Resolved', seenBy })
    logActivity('issue-update', `Issue resolved: ${getMachineName(i.machineId)}`)
    showToast(t('Issue resolved') + ' ✓')
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Issues')}</h1>
          <p>{t('Track and resolve machine issues')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-teal" onClick={() => setEditId(null)}>+ {t('Report Issue')}</button>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">{t('All Status')}</option>
          <option value="Open">{t('Open')}</option><option value="In Progress">{t('In Progress')}</option><option value="Resolved">{t('Resolved')}</option>
        </select>
        <select className="filter-select" value={fSev} onChange={(e) => setFSev(e.target.value)}>
          <option value="">{t('All Severity')}</option>
          <option value="Low">{t('Low')}</option><option value="Medium">{t('Medium')}</option><option value="High">{t('High')}</option><option value="Critical">{t('Critical')}</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('Machine')}</th><th>{t('Description')}</th><th>{t('Severity')}</th><th>{t('Status')}</th>
              <th>{t('Assigned To')}</th><th>{t('Reported By')}</th><th>{t('Date')}</th><th>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((i) => {
              const isNew = !(i.seenBy || []).includes(userId)
              const assignedNames = (i.assignedTo || []).map((id) => getUserName(id)).join(', ') || '—'
              return (
                <tr key={i.id} style={isNew ? { background: 'var(--warning-subtle)' } : undefined}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{getMachineName(i.machineId)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{getMachine(i.machineId)?.location || ''}</div>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isNew && <span className="issue-new-dot" />} {i.description}
                    {(i.photos || []).length ? <span className="photo-badge">📷 {i.photos.length}</span> : null}
                  </td>
                  <td><span className={'badge ' + sevBdg(i.severity)}>{t(i.severity)}</span></td>
                  <td><span className={'badge ' + stBdg(i.status)}>{t(i.status)}</span></td>
                  <td style={{ fontSize: 12 }}>{assignedNames}</td>
                  <td style={{ fontSize: 12 }}>{getUserName(i.reportedBy)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(i.dateReported)}</td>
                  <td className="actions-cell">
                    <div className="action-group">
                      <button className="btn btn-outline btn-sm" onClick={() => setViewId(i.id)}>{t('View')}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditId(i.id)}>{t('Edit')}</button>
                      {i.status !== 'Resolved' && (
                        <button className="btn btn-teal btn-sm" onClick={() => resolveIssue(i.id)}>✓ {t('Resolve')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={8}><div className="empty-state"><p>{t('No issues found')} 👍</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <IssueModal open={editId !== undefined} issueId={editId} prefillMachineId={null} onClose={() => setEditId(undefined)} />
      <IssueDetailModal open={viewId !== undefined} issueId={viewId} onClose={() => setViewId(undefined)} />
    </>
  )
}
