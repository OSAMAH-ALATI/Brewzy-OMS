// ─────────────────────────────────────────────────────────────
// Seed data — ported verbatim from the original Brewzy v8 initDB()
// Used only the very first time the cloud database is empty.
// ─────────────────────────────────────────────────────────────

// Default maintenance tasks shared across machines (can be overridden per machine)
export const DEFAULT_TASKS = [
  { id: 't1', name: 'Replace water gallons with full ones', freq: 'daily', isTech: false },
  { id: 't2', name: 'Replace milk and milk box', freq: 'daily', isTech: false },
  { id: 't3', name: 'Empty coffee bean waste bucket', freq: 'daily', isTech: false },
  { id: 't4', name: 'Refill ingredients, cups and lids', freq: 'daily', isTech: false },
  { id: 't5', name: 'Tablet / touchscreen clean', freq: 'every2', isTech: false },
  { id: 't6', name: 'Mixer check and clean', freq: 'daily', isTech: false },
  { id: 't7', name: 'Empty & clean waste milk tank, replace milk tank', freq: 'daily', isTech: true },
  { id: 't8', name: 'Regular interior clean', freq: 'daily', isTech: false },
  { id: 't9', name: 'Payment device, cart, ice maker, brewer & order check', freq: 'daily', isTech: false },
  { id: 't10', name: 'Clean machine from outside', freq: 'daily', isTech: false },
  { id: 't11', name: 'Mark empty ingredients on dashboard', freq: 'daily', isTech: false },
  { id: 't12', name: 'Mark restocked ingredients as full on dashboard', freq: 'daily', isTech: false },
  { id: 't13', name: 'Milk chemical solution deep clean', freq: 'weekly', isTech: true },
]

export const EMPTY_STEPS = [
  { id: 'es1', text: 'Turn off ice maker' },
  { id: 'es2', text: 'Take milk out then deep clean' },
  { id: 'es3', text: 'Remove all powder boxes and syrup into a box' },
  { id: 'es4', text: 'Clean the mixers with water spray' },
  { id: 'es5', text: 'Clean the syrup pipe with water' },
  { id: 'es6', text: 'Milk deep clean – finish cycle' },
  { id: 'es7', text: 'Remove all water gallons' },
  { id: 'es8', text: 'Empty water from equipment (use Empty Water button)' },
  { id: 'es9', text: 'Clean milk waste tank' },
  { id: 'es10', text: 'Turn off refrigerator' },
  { id: 'es11', text: 'Turn off machine' },
  { id: 'es12', text: 'Clean water bucket' },
  { id: 'es13', text: 'Return water bucket' },
  { id: 'es14', text: 'Close the door' },
  { id: 'es15', text: '✅ Now you can move the machine' },
]

export function getDefaultAccess() {
  return {
    operator: { route: true, issues: true, history: true, empty_checklist: true, machines: false },
    technician: { route: true, issues: true, history: true, empty_checklist: true, machines: false },
  }
}

const clone = (x) => JSON.parse(JSON.stringify(x))

// Returns the full initial dataset. `today`/`yesterday` are ISO date strings.
export function seedData(today, yesterday) {
  const t = today
  const y = yesterday
  return {
    users: [
      { id: 'u_manager', name: 'Osamah', role: 'manager', username: 'OSAMAH', password: '7811' },
      { id: 'u_op1', name: 'Liton', role: 'operator', username: 'liton', password: 'brew123' },
      { id: 'u_op2', name: 'Zakir', role: 'operator', username: 'zakir', password: 'brew123' },
      { id: 'u_tech1', name: 'Majharul', role: 'technician', username: 'majharul', password: 'tech123' },
    ],
    machines: [
      { id: 'm1', name: 'Al Matarat', machineId: 'M001', orderNumber: 'ORD-001', location: 'Al Matarat', mapsLink: 'https://maps.app.goo.gl/gh4Vg1s3GsJ6w2JF7', duty: 'Morning', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: y, notes: '', tasks: clone(DEFAULT_TASKS) },
      { id: 'm2', name: 'Fitness Time', machineId: 'M002', orderNumber: 'ORD-002', location: 'Al Taawun', mapsLink: '', duty: 'Morning', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: t, notes: '', tasks: clone(DEFAULT_TASKS) },
      { id: 'm3', name: 'Point Market', machineId: 'M003', orderNumber: 'ORD-003', location: 'Al Nada', mapsLink: '', duty: 'Morning', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: t, notes: '', tasks: clone(DEFAULT_TASKS) },
      { id: 'm4', name: 'Hala Padel', machineId: 'M004', orderNumber: 'ORD-004', location: 'Hala Padel', mapsLink: '', duty: 'Morning', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: y, notes: 'Milk pipe blockage reported', tasks: clone(DEFAULT_TASKS) },
      { id: 'm5', name: 'Tuwaiq Academy', machineId: 'M005', orderNumber: 'ORD-005', location: 'Tuwaiq', mapsLink: 'https://maps.app.goo.gl/YYCSh9v5WybrDWV8A', duty: 'Evening', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: t, notes: '', tasks: clone(DEFAULT_TASKS) },
      { id: 'm6', name: 'Apple Academy', machineId: 'M006', orderNumber: 'ORD-006', location: 'Apple Academy', mapsLink: '', duty: 'Evening', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: t, notes: '', tasks: clone(DEFAULT_TASKS) },
      { id: 'm7', name: 'Saudi Energy', machineId: 'M007', orderNumber: 'ORD-007', location: 'Saudi Energy', mapsLink: 'https://maps.app.goo.gl/qXshBFz1TAaGnUbf9', duty: 'Evening', frequency: 'Daily', status: 'Active', operators: ['u_op1', 'u_op2'], technician: 'u_tech1', lastService: y, notes: 'Refrigerator problem reported', tasks: clone(DEFAULT_TASKS) },
    ],
    issues: [
      { id: 'i1', machineId: 'm4', description: 'Regular milk pipe is blocked', severity: 'High', status: 'Open', reportedBy: 'u_op1', assignedTo: ['u_tech1'], dateReported: y, techResponse: '', resolutionNotes: '', seenBy: ['u_op1'] },
      { id: 'i2', machineId: 'm7', description: 'Refrigerator temperature too high', severity: 'Critical', status: 'In Progress', reportedBy: 'u_op2', assignedTo: ['u_tech1'], dateReported: y, techResponse: 'Compressor inspection scheduled', resolutionNotes: '', seenBy: ['u_op2', 'u_tech1'] },
    ],
    emptyRecords: [],
    activityLog: [],
    config: {
      globalTasks: clone(DEFAULT_TASKS),
      emptySteps: clone(EMPTY_STEPS),
      accessControl: getDefaultAccess(),
      serviceCycles: [],
    },
  }
}
