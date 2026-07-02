import { useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { formatDate } from '../lib/utils.js'
import '../features.css'

const sevBdg = (s) => s === 'Critical' ? 'badge-critical' : s === 'High' ? 'badge-high' : s === 'Medium' ? 'badge-medium' : 'badge-low'
const stBdg = (s) => s === 'Open' ? 'badge-open' : s === 'In Progress' ? 'badge-inprogress' : 'badge-resolved'

export default function IssueDetailModal({ open, issueId, onClose }) {
  const { issues, getUser, getUserName, getMachine, getMachineName } = useApp()
  const { t } = useT()
  const [lightbox, setLightbox] = useState(null)
  if (!open) return null

  const i = issues.find((x) => x.id === issueId)
  if (!i) return null

  const photos = i.photos || []

  const assignedNames = (i.assignedTo || [])
    .map((id) => { const u = getUser(id); return u ? `${u.role === 'operator' ? '🚗' : '🔧'} ${u.name}` : '' })
    .filter(Boolean).join(', ') || t('Not assigned')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('Issue')} – ${getMachineName(i.machineId)}`}
      footer={<button className="btn btn-outline" onClick={onClose}>{t('Close')}</button>}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={'badge ' + sevBdg(i.severity)}>{t(i.severity)}</span>
        <span className={'badge ' + stBdg(i.status)}>{t(i.status)}</span>
        <span className="stat-pill">📍 {getMachine(i.machineId)?.location || ''}</span>
        <span className="stat-pill">{t('By:')} {getUserName(i.reportedBy)}</span>
        <span className="stat-pill">{formatDate(i.dateReported)}</span>
      </div>

      <div className="form-group">
        <div className="form-label">{t('Description')}</div>
        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>{i.description}</div>
      </div>

      <div className="form-group">
        <div className="form-label">{t('Assigned To')}</div>
        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>{assignedNames}</div>
      </div>

      {i.techResponse ? (
        <div className="form-group">
          <div className="form-label">{t('Technician Response')}</div>
          <div style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 8, fontSize: 14 }}>{i.techResponse}</div>
        </div>
      ) : null}

      {i.resolutionNotes ? (
        <div className="form-group">
          <div className="form-label">{t('Resolution Notes')}</div>
          <div style={{ padding: 12, background: 'var(--success-subtle)', borderRadius: 8, fontSize: 14 }}>{i.resolutionNotes}</div>
        </div>
      ) : null}

      {photos.length ? (
        <div className="form-group">
          <div className="form-label">{t('Photos')}</div>
          <div className="photo-grid">
            {photos.map((src, idx) => (
              <div key={idx} className="photo-thumb">
                <img src={src} alt={`Photo ${idx + 1}`} onClick={() => setLightbox(src)} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" />
        </div>
      ) : null}
    </Modal>
  )
}
