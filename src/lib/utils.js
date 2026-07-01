// ─────────────────────────────────────────────────────────────
// Pure helpers — ported from the original Brewzy logic
// ─────────────────────────────────────────────────────────────

export function genId(p) {
  return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function yesterday() {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0]
}

export function nowTime() {
  return new Date().toTimeString().slice(0, 5)
}

export function nowStamp() {
  return today() + ' ' + nowTime()
}

// Full days between an ISO date and today (both at midnight). 999 if missing.
export function daysDiff(d) {
  if (!d) return 999
  const a = new Date(d), b = new Date()
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0)
  return Math.floor((b - a) / 86400000)
}

export function getDueStatus(m) {
  const d = daysDiff(m.lastService)
  const f = m.frequency === 'Daily' ? 1 : m.frequency === 'Every 2 Days' ? 2 : 3
  return d > f ? 'Overdue' : d === f ? 'Due Today' : 'Not Due'
}

export function formatDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Should a task appear on this visit number?
export function taskDueThisVisit(task, visitCount) {
  if (task.freq === 'daily') return true
  if (task.freq === 'every2') return visitCount % 2 === 0
  if (task.freq === 'every3') return visitCount % 3 === 0
  if (task.freq === 'weekly') return visitCount % 7 === 0
  if (task.freq === 'tech') return false
  return true
}

// Does a task frequency apply to a machine's service frequency? (Quick Assign)
export function freqMatchesMachineFreq(taskFreq, machineFreq) {
  if (taskFreq === 'daily') return machineFreq === 'Daily'
  if (taskFreq === 'every2') return machineFreq === 'Every 2 Days'
  if (taskFreq === 'every3') return machineFreq === 'Every 3 Days'
  if (taskFreq === 'weekly') return true
  return false
}

export const FREQ_LABEL = {
  daily: 'Every Visit',
  every2: 'Every 2 Visits',
  every3: 'Every 3 Visits',
  weekly: 'Weekly',
  tech: 'Technician Task',
}

// Maps a task freq to the .freq-* CSS class used by the design system.
export const FREQ_CLASS = {
  daily: 'freq-daily',
  every2: 'freq-2d',
  every3: 'freq-3d',
  weekly: 'freq-weekly',
  tech: 'freq-tech',
}

export function clone(x) {
  return JSON.parse(JSON.stringify(x))
}
