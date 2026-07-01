import { useApp } from '../context/AppContext.jsx'
import { PAGE_TITLES } from '../lib/nav.js'

export default function Topbar({ current, onToggleMobile }) {
  const { theme, toggleTheme } = useApp()
  const dateStr = new Date().toLocaleDateString('en-SA', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
  return (
    <header className="topbar">
      <div className="topbar-l">
        <button className="hamburger" onClick={onToggleMobile}>☰</button>
        <div className="page-title">{PAGE_TITLES[current] || 'Brewzy'}</div>
      </div>
      <div className="topbar-r">
        <button className="theme-btn" onClick={toggleTheme} title="Toggle dark / light mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="topbar-date">{dateStr}</div>
      </div>
    </header>
  )
}
