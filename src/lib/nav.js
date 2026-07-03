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
    id: 'supply', icon: '📦', label: 'Supply Chain',
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

// Worker sidebar — flat section; items filtered by access control
export const WORKER_ITEMS = [
  { id: 'route', icon: '🗺️', label: "Today's Route", access: 'route' },
  { id: 'issues', icon: '⚠️', label: 'Issues', access: 'issues' },
  { id: 'machines', icon: '☕', label: 'Machine Directory', access: 'machines' },
  { id: 'history', icon: '📋', label: 'Service History', access: 'history' },
  { id: 'empty-checklist', icon: '🔌', label: 'Empty Checklist', access: 'empty_checklist' },
]

export function defaultPage(role) {
  return role === 'manager' ? 'dashboard' : 'route'
}
