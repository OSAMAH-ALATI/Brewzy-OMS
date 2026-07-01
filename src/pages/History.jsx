import { useApp } from '../context/AppContext.jsx'
import { formatDate } from '../lib/utils.js'

// Service history for all roles: read-only table + CSV export.
export default function History() {
  const { serviceCycles, getMachine, getMachineName, getUserName, showToast } = useApp()

  // Newest first (by date then time).
  const sorted = [...serviceCycles].sort((a, b) => {
    const ka = `${a.date} ${a.time}`
    const kb = `${b.date} ${b.time}`
    return ka < kb ? 1 : ka > kb ? -1 : 0
  })

  const counts = (s) => {
    const cl = s.checklist || {}
    const total = Object.keys(cl).length
    const completed = Object.values(cl).filter(Boolean).length
    return { total, completed }
  }

  const exportCSV = () => {
    const rows = [['Date', 'Time', 'Machine', 'Location', 'Operator', 'Completed Tasks', 'Online Check 1', 'Online Check 2', 'Notes']]
    serviceCycles.forEach((s) => {
      const m = getMachine(s.machineId)
      const { total, completed } = counts(s)
      rows.push([
        s.date || '', s.time || '', getMachineName(s.machineId), m?.location || '',
        getUserName(s.operator), `${completed}/${total}`,
        s.onlineCheck1 || '', s.onlineCheck2 || '', s.notes || '',
      ])
    })
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brewzy_service_history.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported service history')
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>Service History</h1>
          <p>Past service records across the fleet</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline" onClick={exportCSV} disabled={!serviceCycles.length}>Export CSV</button>
        </div>
      </div>

      {sorted.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Machine</th>
                <th>Operator</th>
                <th>Completed Tasks</th>
                <th>Online Checks</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const m = getMachine(s.machineId)
                const { total, completed } = counts(s)
                return (
                  <tr key={s.id}>
                    <td>
                      {formatDate(s.date)}{' '}
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.time}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getMachineName(s.machineId)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m?.location || '—'}</div>
                    </td>
                    <td>{getUserName(s.operator)}</td>
                    <td><span style={{ fontSize: 12 }}>{completed} / {total} ✓</span></td>
                    <td>
                      <span style={{ fontSize: 11 }}>
                        Check1: {s.onlineCheck1 || '—'}<br />Check2: {s.onlineCheck2 || '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 160, fontSize: 12, color: 'var(--text-secondary)' }}>{s.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No service records yet</p>
        </div>
      )}
    </>
  )
}
