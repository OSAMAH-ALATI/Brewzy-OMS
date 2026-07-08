// Page metadata + sidebar structures, shared across the shell.

export const PAGE_TITLES = {
  dashboard: 'Operations Dashboard',
  route: "Today's Route",
  machines: 'Machine Directory',
  issues: 'Issue Tracker',
  users: 'Team Management',
  access: 'Access Control',
  tasks: 'Tasks Library',
  empty: 'Empty Machine Protocol',
  'empty-records': 'Machine Empty Records',
  'empty-checklist': 'Empty Machine Checklist',
  history: 'Service History',
  inventory: 'Inventory',
  procurement: 'Procurement',
}

// Manager sidebar — collapsible departments
export const MANAGER_DEPTS = [
  {
    id: 'operations', icon: '📊', label: 'Operations',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'machines', icon: '☕', label: 'Machine Directory' },
      { id: 'route', icon: '🗺️', label: "Today's Route" },
      { id: 'issues', icon: '⚠️', label: 'Issue Tracker' },
      { id: 'history', icon: '📋', label: 'Service History' },
      { id: 'empty-records', icon: '📋', label: 'Empty Records' },
    ],
  },
  {
    id: 'supply', icon: '📦', label: 'Supply Chain', soon: true,
    items: [
      { id: 'inventory', icon: '📦', label: 'Inventory' },
      { id: 'procurement', icon: '🛒', label: 'Procurement' },
    ],
  },
  {
    id: 'team', icon: '👥', label: 'Team',
    items: [
      { id: 'users', icon: '👥', label: 'Team Management' },
      { id: 'access', icon: '🔐', label: 'Access Control' },
    ],
  },
  {
    id: 'admin', icon: '⚙️', label: 'Administration',
    items: [
      { id: 'tasks', icon: '✅', label: 'Tasks Library' },
      { id: 'empty', icon: '🔌', label: 'Empty Machine Protocol' },
    ],
  },
]

// Pages a manager can grant to non-manager roles (operators/technicians/…).
// `pageId` is the router id; `accessKey` is the stable permission key stored in
// accessControl (kept stable so existing saved permissions keep working).
// The two admin pages (Team Management, Access Control) are intentionally NOT
// grantable — only managers can manage users and permissions.
export const GRANTABLE_PAGES = [
  { pageId: 'dashboard', accessKey: 'dashboard', icon: '📊', label: 'Dashboard', desc: 'Operations overview and charts' },
  { pageId: 'route', accessKey: 'route', icon: '🗺️', label: "Today's Route", desc: 'View assigned machines and due status' },
  { pageId: 'machines', accessKey: 'machines', icon: '☕', label: 'Machine Directory', desc: 'View the machine list' },
  { pageId: 'issues', accessKey: 'issues', icon: '⚠️', label: 'Issue Tracker', desc: 'View, report and update issues' },
  { pageId: 'history', accessKey: 'history', icon: '📋', label: 'Service History', desc: 'View past service records' },
  { pageId: 'tasks', accessKey: 'tasks', icon: '✅', label: 'Tasks Library', desc: 'View and edit maintenance tasks' },
  { pageId: 'empty', accessKey: 'empty', icon: '🔌', label: 'Empty Machine Protocol', desc: 'Edit the emptying steps' },
  { pageId: 'empty-records', accessKey: 'empty_records', icon: '📋', label: 'Empty Records', desc: 'View machine emptying records' },
  { pageId: 'empty-checklist', accessKey: 'empty_checklist', icon: '🔌', label: 'Empty Checklist', desc: 'Use the machine emptying checklist' },
  { pageId: 'inventory', accessKey: 'inventory', icon: '📦', label: 'Inventory', desc: 'View and manage stock' },
  { pageId: 'procurement', accessKey: 'procurement', icon: '🛒', label: 'Procurement', desc: 'Suppliers and purchase orders' },
]

// Worker sidebar — flat section; items filtered by access control.
export const WORKER_ITEMS = GRANTABLE_PAGES.map((p) => ({
  id: p.pageId, icon: p.icon, label: p.label, access: p.accessKey,
}))

// pageId → accessKey map used by the router to guard worker access.
export const WORKER_ACCESS = Object.fromEntries(GRANTABLE_PAGES.map((p) => [p.pageId, p.accessKey]))

export function defaultPage(role) {
  return role === 'manager' ? 'dashboard' : 'route'
}
