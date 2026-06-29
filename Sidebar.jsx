import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { MANAGER_DEPTS, WORKER_ITEMS } from '../lib/nav.js'

function NavItem({ item, current, badge, onNavigate }) {
  return (
    <div className={'sb-item' + (current === item.id ? ' active' : '')}
      onClick={() => onNavigate(item.id)}>
      <span className="sb-ico">{item.icon}</span>
      <span className="sb-lbl">{item.label}</span>
      {badge > 0 && <span className="sb-badge">{badge}</span>}
    </div>
  )
}

export default function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }) {
  const { session, logout, issues, access } = useApp()
  const role = session?.role
  const initials = (session?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  // Unseen open-issue badge for the current user
  const issueBadge = issues.filter(
    (i) => i.status !== 'Resolved' && !(i.seenBy || []).includes(session?.userId),
  ).length

  const [openDepts, setOpenDepts] = useState(() => {
    const init = {}
    MANAGER_DEPTS.forEach((d) => { init[d.id] = localStorage.getItem('sb-dept-' + d.id) !== '0' })
    return init
  })
  const toggleDept = (id) => {
    setOpenDepts((p) => {
      const next = !p[id]
      localStorage.setItem('sb-dept-' + id, next ? '1' : '0')
      return { ...p, [id]: next }
    })
  }

  const go = (id) => { onNavigate(id); onCloseMobile?.() }
  const badgeFor = (id) => (id === 'issues' ? issueBadge : 0)

  return (
    <nav className={'sidebar' + (mobileOpen ? ' open' : '')} id="sidebar">
      <div className="sb-hd">
        <img className="sb-logo-img" src="/sidebar-logo.png" alt="Brewzy" />
      </div>

      <div className="sb-user">
        <div className="sb-avatar">{initials}</div>
        <div>
          <div className="sb-uname">{session?.name}</div>
          <div className="sb-urole">{role}</div>
        </div>
      </div>

      <div className="sb-nav">
        {role === 'manager' ? (
          MANAGER_DEPTS.map((dept) => (
            <div key={dept.id}>
              <div className="sb-dept-hdr" onClick={() => toggleDept(dept.id)}>
                <span className="sb-ico">{dept.icon}</span>
                <span className="sb-dept-label">{dept.label}</span>
                <span className={'sb-chevron' + (openDepts[dept.id] ? ' open' : '')}>›</span>
              </div>
              {openDepts[dept.id] && (
                <div className="sb-dept-items">
                  {dept.items.map((item) => (
                    <NavItem key={item.id} item={item} current={current} badge={badgeFor(item.id)} onNavigate={go} />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <>
            <div className="sb-section">Your Work</div>
            {WORKER_ITEMS.filter((it) => access?.[role]?.[it.access]).map((item) => (
              <NavItem key={item.id} item={item} current={current} badge={badgeFor(item.id)} onNavigate={go} />
            ))}
          </>
        )}
      </div>

      <div className="sb-ft">
        <button className="sb-logout-btn" onClick={logout}>
          <span className="sb-ico">←</span> Sign Out
        </button>
      </div>
    </nav>
  )
}
