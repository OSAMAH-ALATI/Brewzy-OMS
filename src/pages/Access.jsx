import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'

// Manager-only page-access control for operators and technicians.
const ROLES = [
  { id: 'operator', label: '🚗 Operator — Page Access' },
  { id: 'technician', label: '🔧 Technician — Page Access' },
]
const FEATURES = [
  { id: 'route', label: "Today's Route", icon: '🗺️', desc: 'View assigned machines and due status' },
  { id: 'issues', label: 'Issues', icon: '⚠️', desc: 'View, report and update issues' },
  { id: 'history', label: 'Service History', icon: '📋', desc: 'View past service records' },
  { id: 'empty_checklist', label: 'Empty Checklist', icon: '🔌', desc: 'Access the machine emptying checklist' },
  { id: 'machines', label: 'Machine Directory', icon: '☕', desc: 'View the full machine list (read-only)' },
]

export default function Access() {
  const { access, updateConfig, showToast, users, allowlistUids } = useApp()
  const { t } = useT()

  // Security migration readiness: a member is "ready" once they've logged in at
  // least once since the security update (their secured account is on the allow-list).
  const ready = users.filter((u) => u.uid && allowlistUids.includes(u.uid))
  const pending = users.filter((u) => !(u.uid && allowlistUids.includes(u.uid)))
  const allReady = users.length > 0 && pending.length === 0

  const toggle = (role, feature, val) => {
    updateConfig({
      accessControl: {
        ...access,
        [role]: { ...access[role], [feature]: val },
      },
    })
    showToast(`${t(role)} ${t('access to')} "${feature}" ${val ? t('enabled') : t('disabled')}`)
  }

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Access Control')}</h1>
          <p>{t('Choose which pages operators and technicians can see')}</p>
        </div>
      </div>

      {/* ── Security lock-down status ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">🔒 {t('Security — Team Sign-in Status')}</div>
          <span className={'badge ' + (allReady ? 'badge-ok' : 'badge-due')}>
            {ready.length}/{users.length} {t('ready')}
          </span>
        </div>
        <div style={{ padding: '12px 20px 16px' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
            {allReady
              ? t('Everyone has signed in and has a secured account. You can now safely publish the strict database rules to lock out anyone outside your team.')
              : t('Each member below needs to sign in once so their secured account is created. Wait until everyone shows ✅ before publishing the strict database rules.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {users.map((u) => {
              const ok = u.uid && allowlistUids.includes(u.uid)
              return (
                <span key={u.id} className="stat-pill" style={{ borderColor: ok ? 'var(--success)' : 'var(--border)' }}>
                  {ok ? '✅' : '⏳'} {u.name} <span style={{ color: 'var(--text-tertiary)' }}>@{u.username}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="user-mgmt-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {ROLES.map((role) => (
          <div className="card" style={{ marginBottom: 0 }} key={role.id}>
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <div className="card-title">{t(role.label)}</div>
            </div>
            <div style={{ padding: '8px 20px 16px' }}>
              {FEATURES.map((f) => (
                <div
                  key={f.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.icon} {t(f.label)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t(f.desc)}</div>
                  </div>
                  <label className="toggle-wrap">
                    <input
                      type="checkbox"
                      checked={!!access[role.id]?.[f.id]}
                      onChange={(e) => toggle(role.id, f.id, e.target.checked)}
                    />
                    <span className="toggle-track" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
