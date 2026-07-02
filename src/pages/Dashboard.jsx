import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { getDueStatus, today, formatDate } from '../lib/utils.js'
import '../dashboard.css'

// Manager dashboard: KPIs, fleet health, workload + frequency charts,
// a 7-day service trend, attention list, activity feed, and a printable report.
export default function Dashboard() {
  const {
    machines, issues, serviceCycles, activityLog, users, session,
    getMachineName, removeRow, showConfirm, showToast,
  } = useApp()
  const { t } = useT()

  const tday = today()
  const dueToday = machines.filter((m) => getDueStatus(m) === 'Due Today').length
  const overdue = machines.filter((m) => getDueStatus(m) === 'Overdue').length
  const notDue = machines.filter((m) => getDueStatus(m) === 'Not Due').length
  const maint = machines.filter((m) => m.status === 'Maintenance').length
  const openIssues = issues.filter((i) => i.status !== 'Resolved').length
  const servicesToday = serviceCycles.filter((s) => s.date === tday).length

  const kpis = [
    { lbl: 'Total Machines', val: machines.length, sub: 'Active fleet', cls: 'c-brand', ico: '🏭' },
    { lbl: 'Due Today', val: dueToday, sub: 'Need service', cls: 'c-gold', ico: '⏰' },
    { lbl: 'Overdue', val: overdue, sub: 'Needs attention', cls: 'c-red', ico: '⚠️' },
    { lbl: 'Maintenance', val: maint, sub: 'Under repair', cls: 'c-orange', ico: '🔧' },
    { lbl: 'Open Issues', val: openIssues, sub: 'Need resolution', cls: 'c-red', ico: '🐞' },
    { lbl: 'Services Today', val: servicesToday, sub: 'Completed today', cls: 'c-green', ico: '✅' },
  ]

  // ── Fleet health strip (on-schedule / due / overdue) ──
  const health = [
    { key: 'Not Due', n: notDue, color: 'var(--success)' },
    { key: 'Due Today', n: dueToday, color: 'var(--warning)' },
    { key: 'Overdue', n: overdue, color: 'var(--error)' },
  ]
  const healthTotal = Math.max(1, notDue + dueToday + overdue)

  // ── Operator / Technician workload ──
  const operators = users.filter((u) => u.role === 'operator')
  const opData = operators.map((op) => ({ name: op.name, count: machines.filter((m) => (m.operators || []).includes(op.id)).length }))
  const maxOp = Math.max(1, ...opData.map((d) => d.count))

  const technicians = users.filter((u) => u.role === 'technician')
  const techData = technicians.map((tech) => ({ name: tech.name, count: machines.filter((m) => m.technician === tech.id).length }))
  const maxTech = Math.max(1, ...techData.map((d) => d.count))

  // ── Service frequency distribution ──
  const freqData = [
    { name: 'Daily', count: machines.filter((m) => m.frequency === 'Daily').length },
    { name: 'Every 2 Days', count: machines.filter((m) => m.frequency === 'Every 2 Days').length },
    { name: 'Every 3 Days', count: machines.filter((m) => m.frequency === 'Every 3 Days').length },
  ]
  const maxFreq = Math.max(1, ...freqData.map((d) => d.count))

  // ── 7-day service trend ──
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const iso = d.toISOString().split('T')[0]
    days.push({
      iso,
      label: d.toLocaleDateString('en-SA', { weekday: 'short' }),
      count: serviceCycles.filter((s) => s.date === iso).length,
    })
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count))

  // ── Needs attention ──
  const ovMs = machines.filter((m) => getDueStatus(m) === 'Overdue')
  const critIs = issues.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved')
  const attention = [
    ...ovMs.map((m) => ({ key: 'm-' + m.id, name: m.name, sub: `${t('Overdue')} – ${m.location}`, warn: false })),
    ...critIs.map((i) => ({ key: 'i-' + i.id, name: getMachineName(i.machineId), sub: `${t('Critical Issue')}: ${(i.description || '').slice(0, 50)}`, warn: true })),
  ]

  // ── Activity feed ──
  const dotCls = { service: 'g', issue: 'r', 'issue-update': 'gr' }
  const logs = [...activityLog].sort((a, b) => (a.time < b.time ? 1 : -1))
  const isManager = session?.role === 'manager'

  const clearAll = async () => {
    const ok = await showConfirm({ title: 'Clear activity log?', message: 'This permanently removes all activity entries. This cannot be undone.', confirmText: 'Clear All', tone: 'danger' })
    if (!ok) return
    await Promise.all(activityLog.map((l) => removeRow('activityLog', l.id)))
    showToast(t('Activity log cleared'), '🗑')
  }

  const exportCSV = () => {
    const rows = [['Machine', 'ID', 'Location', 'Frequency', 'Last Service', 'Due Status', 'Machine Status']]
    machines.forEach((m) => rows.push([m.name, m.machineId, m.location, m.frequency, m.lastService || '', getDueStatus(m), m.status]))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `brewzy_fleet_${tday}.csv`; a.click()
    URL.revokeObjectURL(url)
    showToast(t('Fleet summary exported'), '📄')
  }

  // ── Trend SVG geometry ──
  const W = 700, H = 160, PL = 8, PR = 8, PT = 18, PB = 22
  const iw = W - PL - PR, ih = H - PT - PB
  const xAt = (i) => PL + (days.length === 1 ? iw / 2 : (i / (days.length - 1)) * iw)
  const yAt = (v) => PT + ih - (v / maxDay) * ih
  const linePts = days.map((d, i) => `${xAt(i)},${yAt(d.count)}`).join(' ')
  const areaPts = `${xAt(0)},${PT + ih} ${linePts} ${xAt(days.length - 1)},${PT + ih}`
  const hasServices = days.some((d) => d.count > 0)

  return (
    <div>
      <div className="ph">
        <div className="ph-text">
          <h1>{t('Dashboard')}</h1>
          <p>{t('Fleet overview and recent activity')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>📄 {t('Export CSV')}</button>
          <button className="btn btn-brand btn-sm" onClick={() => window.print()}>🖨 {t('Print Report')}</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className={'kpi-card ' + k.cls} key={k.lbl}>
            <span className="kpi-ico">{k.ico}</span>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{t(k.lbl)}</div>
            <div className="kpi-sub">{t(k.sub)}</div>
          </div>
        ))}
      </div>

      {/* Fleet health + 7-day trend */}
      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">💚 {t('Fleet Health')}</div>
          <div className="health-bar">
            {health.map((h) => h.n > 0 && (
              <div className="health-seg" key={h.key} title={`${h.key}: ${h.n}`}
                style={{ width: (h.n / healthTotal) * 100 + '%', background: h.color }} />
            ))}
          </div>
          <div className="chart-legend">
            {health.map((h) => (
              <span className="legend-item" key={h.key}>
                <span className="legend-swatch" style={{ background: h.color }} />
                {t(h.key)} <b style={{ color: 'var(--text-primary)' }}>{h.n}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">📈 {t('Services — Last 7 Days')}</div>
          <div className="trend-wrap">
            <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Services completed over the last 7 days">
              <g className="trend-grid">
                {[0, 0.5, 1].map((f) => <line key={f} x1={PL} x2={W - PR} y1={PT + ih - f * ih} y2={PT + ih - f * ih} />)}
              </g>
              {hasServices ? (
                <>
                  <polygon className="trend-area" points={areaPts} />
                  <polyline className="trend-line" points={linePts} />
                  {days.map((d, i) => (
                    <g key={d.iso}>
                      <circle className="trend-dot" cx={xAt(i)} cy={yAt(d.count)} r={4}>
                        <title>{`${d.label}: ${d.count} service${d.count === 1 ? '' : 's'}`}</title>
                      </circle>
                      {d.count > 0 && <text className="trend-vlabel" x={xAt(i)} y={yAt(d.count) - 9}>{d.count}</text>}
                      <text className="trend-xlabel" x={xAt(i)} y={H - 6}>{d.label}</text>
                    </g>
                  ))}
                </>
              ) : (
                <text className="trend-empty" x={W / 2} y={H / 2}>{t('No services recorded this week yet')}</text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Workload */}
      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">👷 {t('Operator Workload')}</div>
          {opData.length ? opData.map((d) => (
            <div className="bar-row" key={d.name} title={`${d.name}: ${d.count} machine${d.count === 1 ? '' : 's'}`}>
              <div className="bar-label">{d.name}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: (d.count / maxOp) * 100 + '%' }} /></div>
              <div className="bar-val">{d.count}</div>
            </div>
          )) : <div className="empty-state" style={{ padding: 20 }}><p>{t('No operators')}</p></div>}
        </div>

        <div className="chart-card">
          <div className="chart-title">🔧 {t('Technician Workload')}</div>
          {techData.length ? techData.map((d) => (
            <div className="bar-row" key={d.name} title={`${d.name}: ${d.count} machine${d.count === 1 ? '' : 's'}`}>
              <div className="bar-label">{d.name}</div>
              <div className="bar-track"><div className="bar-fill r" style={{ width: (d.count / maxTech) * 100 + '%' }} /></div>
              <div className="bar-val">{d.count}</div>
            </div>
          )) : <div className="empty-state" style={{ padding: 20 }}><p>{t('No technicians')}</p></div>}
        </div>
      </div>

      {/* Frequency + attention */}
      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">📅 {t('Service Frequency')}</div>
          {freqData.map((d, i) => (
            <div className="bar-row" key={d.name} title={`${t(d.name)}: ${d.count}`}>
              <div className="bar-label">{t(d.name)}</div>
              <div className="bar-track"><div className={'bar-fill ' + (i === 1 ? 'g' : '')} style={{ width: (d.count / maxFreq) * 100 + '%' }} /></div>
              <div className="bar-val">{d.count}</div>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <div className="chart-title">🚨 {t('Needs Attention')}</div>
          {attention.length ? (
            <div className="attention-list">
              {attention.map((a) => (
                <div className={'attention-item' + (a.warn ? ' warning' : '')} key={a.key}>
                  <div className="attention-name">{a.name}</div>
                  <div className="attention-sub">{a.sub}</div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state" style={{ padding: 20 }}><p>✅ {t('All clear!')}</p></div>}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <span>🕒 {t('Recent Activity')}</span>
          {isManager && logs.length > 0 && <button className="btn btn-outline btn-sm" onClick={clearAll}>🗑 {t('Clear All')}</button>}
        </div>
        {logs.length ? logs.map((l) => (
          <div className="activity-item" key={l.id}>
            <div className={'act-dot ' + (dotCls[l.type] || '')} />
            <div style={{ flex: 1 }}>
              <div className="activity-text">{l.text}</div>
              <div className="activity-time">{l.time}</div>
            </div>
            {isManager && <button className="activity-del" title={t('Delete')} onClick={() => removeRow('activityLog', l.id)}>✕</button>}
          </div>
        )) : <div className="empty-state" style={{ padding: 20 }}><p>{t('No recent activity')}</p></div>}
      </div>
    </div>
  )
}
