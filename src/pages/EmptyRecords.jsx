import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { formatDate } from '../lib/utils.js'
import EmptyRecordModal from '../components/EmptyRecordModal.jsx'

// Manager: list of all machine-emptying records, newest first.
export default function EmptyRecords({ onNavigate }) {
  const { emptyRecords, getMachine, getMachineName, getUserName } = useApp()
  const [modalOpen, setModalOpen] = useState(false)

  const rows = [...(emptyRecords || [])].sort((a, b) => {
    const ka = a.createdAt || a.date || ''
    const kb = b.createdAt || b.date || ''
    return ka < kb ? 1 : ka > kb ? -1 : 0
  })

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>Empty Records</h1>
          <p>History of machines emptied or scheduled for emptying.</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-brand" onClick={() => setModalOpen(true)}>+ New Record</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Machine</th>
                <th>Reason</th>
                <th>Assigned To / Done By</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">🔌</div>
                      <p>No empty records yet</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map((r) => {
                const m = getMachine(r.machineId)
                return (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getMachineName(r.machineId)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m?.location || ''}</div>
                    </td>
                    <td style={{ maxWidth: 160 }}>
                      {r.reason}
                      {r.newLocation ? <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>→ {r.newLocation}</div> : null}
                    </td>
                    <td>{getUserName(r.doneBy)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160 }}>{r.notes || '—'}</td>
                    <td>
                      <span className={'badge ' + (r.completed ? 'badge-resolved' : 'badge-due')}>
                        {r.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EmptyRecordModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
