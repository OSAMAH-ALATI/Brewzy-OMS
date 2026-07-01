import { useApp } from '../context/AppContext.jsx'
import { getDueStatus, today } from '../lib/utils.js'

// Manager dashboard: KPIs, workload + frequency charts, attention list, activity feed.
export default function Dashboard() {
  const {
    machines, issues, serviceCycles, activityLog, users, session,
    getMachineName, removeRow, showConfirm, showToast,
  } = useApp()

  const t = today()
  const dueToday = machines.filter((m) => getDueStatus(m) === 'Due Today').length
  const overdue = machines.filter((m) => getDueStatus(m) === 'Overdue').length
  const maint = machines.filter((m) => m.status === 'Maintenance').length
  const openIssues = issues.filter((i) => i.status !== 'Resolved').length
  const servicesToday = serviceCycles.filter((s) => s.date === t).length

  const kpis = [
    { lbl: 'Total Machines', val: machines.length, sub: 'Active fleet', cls: 'c-brand', ico: '🏭' },
    { lbl: 'Due Today', val: dueToday, sub: 'Need service', cls: 'c-gold', ico: '⏰' },
    { lbl: 'Overdue', val: overdue, sub: 'Needs attention', cls: 'c-red', ico: '⚠️' },
    { lbl: 'Maintenance', val: maint, sub: 'Under repair', cls: 'c-orange', ico: '🔧' },
    { lbl: 'Open Issues', val: openIssues, sub: 'Need resolution', cls: 'c-red', ico: '🐞' },
    { lbl: 'Services Today', val: servicesToday, sub: 'Completed today', cls: 'c-green', ico: '✅' },
  ]

  // ── Operator workload (machines per operator) ──
  const operators = users.filter((u) => u.role === 'operator')
  const opData = operators.map((op) => ({
    name: op.name,
    count: machines.filter((m) => (m.operators || []).includes(op.id)).length,
  }))
  const maxOp = Math.max(1, ...opData.map((d) => d.count))

  // ── Technician workload (machines per technician) ──
  const technicians = users.filter((u) => u.role === 'technician')
  const techData = technicians.map((tech) => ({
    name: tech.name,
    count: machines.filter((m) => m.technician === tech.id).length,
  }))
  const maxTech = Math.max(1, ...techData.map((d) => d.count))

  // ── Service frequency distribution ──
  const daily = machines.filter((m) => m.frequency === 'Daily').length
  const ev2 = machines.filter((m) => m.frequency === 'Every 2 Days').length
  const ev3 = machines.filter((m) => m.frequency === 'Every 3 Days').length
  const freqData = [
    { name: 'Daily', count: daily, cls: '' },
    { name: 'Every 2 Days', count: ev2, cls: 'g' },
    { name: 'Every 3 Days', count: ev3, cls: '' },
  ]
  const maxFreq = Math.max(1, daily, ev2, ev3)

  // ── Needs attention: overdue machines + critical issues ──
  const ovMs = machines.filter((m) => getDueStatus(m) === 'Overdue')
  const critIs = issues.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved')
  const attention = [
    ...ovMs.map((m) => ({ key: 'm-' + m.id, name: m.name, sub: `Overdue – ${m.location}`, warn: false })),
    ...critIs.map((i) => ({
      key: 'i-' + i.id,
      name: getMachineName(i.machineId),
      sub: `Critical Issue: ${(i.description || '').slice(0, 50)}`,
      warn: true,
    })),
  ]

  // ── Activity feed (newest first) ──
  const dotCls = { service: 'g', issue: 'r', 'issue-update': 'gr' }
  const logs = [...activityLog].sort((a, b) => (a.time < b.time ? 1 : -1))
  const isManager = session?.role === 'manager'

  const clearAll = async () => {
    const ok = await showConfirm({
      title: 'Clear activity log?',
      message: 'This will permanently remove all activity log entries. This action cannot be undone.',
      confirmText: 'Clear All',
      tone: 'danger',
    })
    if (!ok) return
    await Promise.all(activityLog.map((l) => removeRow('activityLog', l.id)))
    showToast('Activity log cleared', '🗑')
  }

  return (
    <div>
      <div className="ph">
        <div className="ph-text">
          <h1>Dashboard</h1>
          <p>Fleet overview and recent activity</p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className={'kpi-card ' + k.cls} key={k.lbl}>
            <span className="kpi-ico">{k.ico}</span>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">👷 Operator Workload</div>
          {opData.length ? (
            opData.map((d) => (
              <div className="bar-row" key={d.name}>
                <div className="bar-label">{d.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: (d.count / maxOp) * 100 + '%' }} />
                </div>
                <div className="bar-val">{d.count}</div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ padding: 20 }}><p>No operators</p></div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">🔧 Technician Workload</div>
          {techData.length ? (
            techData.map((d) => (
              <div className="bar-row" key={d.name}>
                <div className="bar-label">{d.name}</div>
                <div className="bar-track">
                  <div className="bar-fill r" style={{ width: (d.count / maxTech) * 100 + '%' }} />
                </div>
                <div className="bar-val">{d.count}</div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ padding: 20 }}><p>No technicians</p></div>
          )}
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">📅 Service Frequency</div>
          {freqData.map((d) => (
            <div className="bar-row" key={d.name}>
              <div className="bar-label">{d.name}</div>
              <div className="bar-track">
                <div className={'bar-fill ' + d.cls} style={{ width: (d.count / maxFreq) * 100 + '%' }} />
              </div>
              <div className="bar-val">{d.count}</div>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <div className="chart-title">🚨 Needs Attention</div>
          {attention.length ? (
            <div className="attention-list">
              {attention.map((a) => (
                <div className={'attention-item' + (a.warn ? ' warning' : '')} key={a.key}>
                  <div className="attention-name">{a.name}</div>
                  <div className="attention-sub">{a.sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}><p>✅ All clear!</p></div>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <span>🕒 Recent Activity</span>
          {isManager && logs.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={clearAll}>🗑 Clear All</button>
          )}
        </div>
        {logs.length ? (
          logs.map((l) => (
            <div className="activity-item" key={l.id}>
              <div className={'act-dot ' + (dotCls[l.type] || '')} />
              <div style={{ flex: 1 }}>
                <div className="activity-text">{l.text}</div>
                <div className="activity-time">{l.time}</div>
              </div>
              {isManager && (
                <button className="activity-del" title="Delete" onClick={() => removeRow('activityLog', l.id)}>✕</button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ padding: 20 }}><p>No recent activity</p></div>
        )}
      </div>
    </div>
  )
}
