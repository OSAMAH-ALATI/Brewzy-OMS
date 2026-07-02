import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { PAGE_TITLES } from '../lib/nav.js'
import '../features.css'

export default function Topbar({ current, onToggleMobile, onNavigate }) {
  const { theme, toggleTheme, notifications, session, markNotifRead } = useApp()
  const { t, lang, setLang } = useT()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const dateStr = new Date().toLocaleDateString('en-SA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  const mine = useMemo(() => (
    (notifications || [])
      .filter((n) => n.userId === session?.userId)
      .slice()
      .sort((a, b) => (a.time < b.time ? 1 : -1))
  ), [notifications, session?.userId])
  const unread = mine.filter((n) => !n.read).length

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const onClickNotif = (n) => {
    if (!n.read) markNotifRead(n.id)
    if (n.issueId) { onNavigate?.('issues'); setOpen(false) }
  }
  const markAll = () => { mine.forEach((n) => { if (!n.read) markNotifRead(n.id) }) }

  return (
    <header className="topbar">
      <div className="topbar-l">
        <button className="hamburger" onClick={onToggleMobile}>☰</button>
        <div className="page-title">{PAGE_TITLES[current] ? t(PAGE_TITLES[current]) : 'Brewzy'}</div>
      </div>
      <div className="topbar-r">
        <div className="notif-wrap" ref={wrapRef}>
          <button className="theme-btn" onClick={() => setOpen((v) => !v)} title={t('Notifications')}>
            🔔
            {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
          </button>
          {open && (
            <div className="notif-panel">
              <div className="notif-head">
                <span>{t('Notifications')}</span>
                {unread > 0 && (
                  <button className="btn btn-ghost btn-xs" onClick={markAll}>{t('Mark all read')}</button>
                )}
              </div>
              {mine.length ? (
                <div className="notif-list">
                  {mine.map((n) => (
                    <div
                      key={n.id}
                      className={'notif-item' + (n.read ? '' : ' unread')}
                      onClick={() => onClickNotif(n)}
                    >
                      <div className="notif-item-text">{n.text}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notif-empty">{t('No notifications yet')}</div>
              )}
            </div>
          )}
        </div>
        <button
          className="theme-btn"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          title={t('Switch language')}
          style={{ fontWeight: 700, fontSize: 13 }}
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>
        <button className="theme-btn" onClick={toggleTheme} title={t('Toggle dark / light mode')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="topbar-date">{dateStr}</div>
      </div>
    </header>
  )
}
