import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { formatDate } from '../lib/utils.js'
import EmptyRecordModal from '../components/EmptyRecordModal.jsx'

// Manager: list of all machine-emptying records, newest first.
export default function EmptyRecords({ onNavigate }) {
  const { emptyRecords, getMachine, getMachineName, getUserName } = useApp()
  const { t } = useT()
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
          <h1>{t('Empty Records')}</h1>
          <p>{t('History of machines emptied or scheduled for emptying.')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-brand" onClick={() => setModalOpen(true)}>+ {t('New Record')}</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('Date')}</th>
                <th>{t('Machine')}</th>
                <th>{t('Reason')}</th>
                <th>{t('Assigned To / Done By')}</th>
                <th>{t('Notes')}</th>
                <th>{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">🔌</div>
                      <p>{t('No empty records yet')}</p>
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
                      {t(r.reason)}
                      {r.newLocation ? <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>→ {r.newLocation}</div> : null}
                    </td>
                    <td>{getUserName(r.doneBy)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160 }}>{r.notes || '—'}</td>
                    <td>
                      <span className={'badge ' + (r.completed ? 'badge-resolved' : 'badge-due')}>
                        {r.completed ? t('Completed') : t('Pending')}
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
