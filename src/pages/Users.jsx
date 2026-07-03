import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import UserModal from '../components/UserModal.jsx'

// Manager-only team management: grouped by role, with add/edit/delete.
export default function Users() {
  const { users, machines, removeRow, patchRow, showConfirm, showToast, removeFromAllowlist } = useApp()
  const { t } = useT()
  // undefined = closed, null = new member, id = edit
  const [editId, setEditId] = useState(undefined)

  const groups = [
    { title: 'Managers', icon: '📊', role: 'manager', bg: 'var(--accent)' },
    { title: 'Operators', icon: '🚗', role: 'operator', bg: 'var(--brand)' },
    { title: 'Technicians', icon: '🔧', role: 'technician', bg: 'var(--warning)' },
  ]

  const handleDelete = async (u) => {
    if (u.id === 'u_manager') {
      showToast(t("Primary manager can't be removed"), '⚠️')
      return
    }
    const ok = await showConfirm({
      title: 'Remove team member?',
      message: `${t('This will permanently delete')} ${u.name} ${t('and remove them from all assigned machines. They will no longer be able to log in. This cannot be undone.')}`,
      confirmText: 'Remove Member',
      tone: 'danger',
    })
    if (!ok) return
    // Revoke their data access (their secured account can no longer read/write).
    if (u.uid) removeFromAllowlist(u.uid).catch(() => {})
    await removeRow('users', u.id)
    // Clean the user out of every machine that references them.
    await Promise.all(machines.map((m) => {
      const ops = m.operators || []
      const inOps = ops.includes(u.id)
      const isTech = m.technician === u.id
      if (!inOps && !isTech) return null
      const patch = {}
      if (inOps) patch.operators = ops.filter((o) => o !== u.id)
      if (isTech) patch.technician = ''
      return patchRow('machines', m.id, patch)
    }).filter(Boolean))
    showToast(t('Member removed'), '🗑')
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Team Members')}</h1>
          <p>{t('Manage operators, technicians and managers')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-teal" onClick={() => setEditId(null)}>+ {t('Add Member')}</button>
        </div>
      </div>

      <div className="user-mgmt-grid">
        {groups.map((g) => {
          const list = users.filter((u) => u.role === g.role)
          return (
            <div className="user-card" key={g.role}>
              <div className="user-card-header">
                <div className="user-card-title">{g.icon} {t(g.title)}</div>
              </div>
              <div className="user-list">
                {list.length ? list.map((u) => (
                  <div className="user-list-item" key={u.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-mini-av" style={{ background: g.bg }}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{u.username}</div>
                      </div>
                    </div>
                    <div className="action-group">
                      {u.id === 'u_manager' && <span className="stat-pill">{t('Admin')}</span>}
                      <button className="btn btn-outline btn-sm" onClick={() => setEditId(u.id)}>{t('Edit')}</button>
                      {u.id !== 'u_manager' && (
                        <button className="btn btn-danger btn-sm btn-icon" title={t('Remove')} onClick={() => handleDelete(u)}>✕</button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>{t('None yet')}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <UserModal open={editId !== undefined} userId={editId ?? null} onClose={() => setEditId(undefined)} />
    </>
  )
}
