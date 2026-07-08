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

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Should a task appear on this visit number?
export function taskDueThisVisit(task, visitCount, date = new Date()) {
  if (task.freq === 'daily') return true
  if (task.freq === 'every2') return visitCount % 2 === 0
  if (task.freq === 'every3') return visitCount % 3 === 0
  if (task.freq === 'weekly') {
    if (task.weekday != null) return date.getDay() === task.weekday
    return visitCount % 7 === 0
  }
  if (task.freq === 'monthly') {
    if (task.dayOfMonth != null) return date.getDate() === task.dayOfMonth
    return visitCount % 30 === 0
  }
  if (task.freq === 'tech') return false
  return true
}

// The next calendar Date a weekly/monthly task is due (null for visit-based freqs).
export function nextDueDate(task, from = new Date()) {
  if (task.freq === 'weekly' && task.weekday != null) {
    const d = new Date(from)
    d.setHours(0, 0, 0, 0)
    let diff = (task.weekday - d.getDay() + 7) % 7
    if (diff === 0) diff = 7 // strictly after today
    d.setDate(d.getDate() + diff)
    return d
  }
  if (task.freq === 'monthly' && task.dayOfMonth != null) {
    const d = new Date(from)
    d.setHours(0, 0, 0, 0)
    if (d.getDate() < task.dayOfMonth) {
      d.setDate(task.dayOfMonth)
    } else {
      d.setMonth(d.getMonth() + 1, task.dayOfMonth)
    }
    return d
  }
  return null
}

// Short human string describing when a task is next due (raw English; wrap with t()).
export function nextDueLabel(task) {
  if (task.freq === 'weekly' && task.weekday != null) {
    return `${WEEKDAYS[task.weekday]} · ${formatDate(nextDueDate(task))}`
  }
  if (task.freq === 'monthly' && task.dayOfMonth != null) {
    return formatDate(nextDueDate(task))
  }
  if (task.freq === 'daily') return 'Every visit'
  if (task.freq === 'every2') return 'Every 2 visits'
  if (task.freq === 'every3') return 'Every 3 visits'
  if (task.freq === 'tech') return 'Technician task'
  return ''
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
  monthly: 'Monthly',
  tech: 'Technician Task',
}

// Maps a task freq to the .freq-* CSS class used by the design system.
export const FREQ_CLASS = {
  daily: 'freq-daily',
  every2: 'freq-2d',
  every3: 'freq-3d',
  weekly: 'freq-weekly',
  monthly: 'freq-3d',
  tech: 'freq-tech',
}

export function clone(x) {
  return JSON.parse(JSON.stringify(x))
}

// Format a machine's operation time. Times are stored as "HH:MM" (24h) and shown
// as 12h (e.g. "8:00 AM"). Legacy shift words (Morning/Evening/Both) pass through.
export function formatDuty(duty) {
  if (!duty) return '—'
  const m = /^(\d{1,2}):(\d{2})$/.exec(duty)
  if (!m) return duty
  let h = Number(m[1])
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m[2]} ${ap}`
}
