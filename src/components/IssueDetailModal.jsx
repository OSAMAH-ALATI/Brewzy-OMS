import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { formatDate } from '../lib/utils.js'

const sevBdg = (s) => s === 'Critical' ? 'badge-critical' : s === 'High' ? 'badge-high' : s === 'Medium' ? 'badge-medium' : 'badge-low'
const stBdg = (s) => s === 'Open' ? 'badge-open' : s === 'In Progress' ? 'badge-inprogress' : 'badge-resolved'

export default function IssueDetailModal({ open, issueId, onClose }) {
  const { issues, getUser, getUserName, getMachine, getMachineName } = useApp()
  if (!open) return null

  const i = issues.find((x) => x.id === issueId)
  if (!i) return null

  const assignedNames = (i.assignedTo || [])
    .map((id) => { const u = getUser(id); return u ? `${u.role === 'operator' ? '🚗' : '🔧'} ${u.name}` : '' })
    .filter(Boolean).join(', ') || 'Not assigned'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Issue – ${getMachineName(i.machineId)}`}
      footer={<button className="btn btn-outline" onClick={onClose}>Close</button>}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={'badge ' + sevBdg(i.severity)}>{i.severity}</span>
        <span className={'badge ' + stBdg(i.status)}>{i.status}</span>
        <span className="stat-pill">📍 {getMachine(i.machineId)?.location || ''}</span>
        <span className="stat-pill">By: {getUserName(i.reportedBy)}</span>
        <span className="stat-pill">{formatDate(i.dateReported)}</span>
      </div>

      <div className="form-group">
        <div className="form-label">Description</div>
        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>{i.description}</div>
      </div>

      <div className="form-group">
        <div className="form-label">Assigned To</div>
        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>{assignedNames}</div>
      </div>

      {i.techResponse ? (
        <div className="form-group">
          <div className="form-label">Technician Response</div>
          <div style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 8, fontSize: 14 }}>{i.techResponse}</div>
        </div>
      ) : null}

      {i.resolutionNotes ? (
        <div className="form-group">
          <div className="form-label">Resolution Notes</div>
          <div style={{ padding: 12, background: 'var(--success-subtle)', borderRadius: 8, fontSize: 14 }}>{i.resolutionNotes}</div>
        </div>
      ) : null}
    </Modal>
  )
}
