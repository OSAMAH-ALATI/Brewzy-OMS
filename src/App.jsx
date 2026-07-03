import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext.jsx'
import { useT } from './lib/i18n.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Toast from './components/Toast.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import Login from './pages/Login.jsx'
import SetupScreen from './pages/SetupScreen.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RoutePage from './pages/Route.jsx'
import Machines from './pages/Machines.jsx'
import Issues from './pages/Issues.jsx'
import Users from './pages/Users.jsx'
import Access from './pages/Access.jsx'
import Tasks from './pages/Tasks.jsx'
import EmptyProtocol from './pages/EmptyProtocol.jsx'
import EmptyRecords from './pages/EmptyRecords.jsx'
import EmptyChecklist from './pages/EmptyChecklist.jsx'
import History from './pages/History.jsx'
import Inventory from './pages/Inventory.jsx'
import Procurement from './pages/Procurement.jsx'
import { defaultPage } from './lib/nav.js'

const PAGES = {
  dashboard: Dashboard,
  route: RoutePage,
  machines: Machines,
  issues: Issues,
  users: Users,
  access: Access,
  tasks: Tasks,
  empty: EmptyProtocol,
  'empty-records': EmptyRecords,
  'empty-checklist': EmptyChecklist,
  history: History,
  inventory: Inventory,
  procurement: Procurement,
}

// Which pages each role may open.
const MANAGER_PAGES = Object.keys(PAGES)
const WORKER_BASE = { route: 'route', issues: 'issues', machines: 'machines', history: 'history', 'empty-checklist': 'empty_checklist' }

function Loader({ label }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
      </div>
    </div>
  )
}

export default function App() {
  const { status, errorMsg, session, access } = useApp()
  const { t } = useT()
  const role = session?.role
  const [current, setCurrent] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  // When a session appears, route to the role's default page.
  useEffect(() => {
    if (session) setCurrent(defaultPage(session.role))
  }, [session?.userId])

  if (status === 'unconfigured') return <SetupScreen />
  if (status === 'connecting') return <Loader label={t('Connecting to Brewzy cloud…')} />
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 460, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>{t('Couldn’t reach the database')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            {t('Check that Firestore and Anonymous Authentication are enabled in your Firebase project.')}
          </p>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  // Resolve which page to show, guarding worker access.
  let pageId = current
  const allowed = role === 'manager'
    ? MANAGER_PAGES
    : Object.entries(WORKER_BASE).filter(([, key]) => access?.[role]?.[key]).map(([p]) => p)
  if (!allowed.includes(pageId)) pageId = defaultPage(role)

  const PageComp = PAGES[pageId] || Dashboard

  return (
    <div id="app" style={{ display: 'block' }}>
      <div className={'overlay-bg' + (mobileOpen ? ' open' : '')} onClick={() => setMobileOpen(false)} />
      <div className="app-body">
        <Sidebar current={pageId} onNavigate={setCurrent} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="main">
          <Topbar current={pageId} onToggleMobile={() => setMobileOpen((v) => !v)} onNavigate={setCurrent} />
          <div className="page-body">
            <div className="page active">
              <PageComp onNavigate={setCurrent} />
            </div>
          </div>
        </div>
      </div>
      <Toast />
      <ConfirmDialog />
    </div>
  )
}
