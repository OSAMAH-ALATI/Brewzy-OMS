import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { nowStamp, today } from '../lib/utils.js'
import { sar, poBadge } from '../lib/inventory.js'
import PurchaseOrderModal from '../components/PurchaseOrderModal.jsx'
import SupplierModal from '../components/SupplierModal.jsx'
import '../inventory.css'
import '../dashboard.css'

const OPEN_STATUSES = ['Requested', 'Ordered']

export default function Procurement({ onNavigate }) {
  const {
    purchaseOrders, suppliers, inventory,
    patchRow, removeRow, logActivity, showToast, showConfirm,
  } = useApp()
  const { t } = useT()

  const [poEdit, setPoEdit] = useState(undefined) // undefined=closed, null=new, po=edit
  const [supEdit, setSupEdit] = useState(undefined)

  const openPOs = purchaseOrders.filter((po) => OPEN_STATUSES.includes(po.status))
  const pendingValue = openPOs.reduce((sum, po) => sum + (Number(po.total) || 0), 0)
  const monthPrefix = today().slice(0, 7)
  const receivedThisMonth = purchaseOrders.filter(
    (po) => po.status === 'Received' && (po.receivedAt || '').slice(0, 7) === monthPrefix,
  ).length

  const markOrdered = (po) => {
    patchRow('purchaseOrders', po.id, { status: 'Ordered' })
    logActivity('service', `Purchase order ${po.poNumber} marked Ordered`)
    showToast(t('Marked as Ordered'), '🛒')
  }

  const markReceived = async (po) => {
    // Increment stock for each line with an inventoryId.
    for (const line of po.items || []) {
      if (!line.inventoryId) continue
      const inv = inventory.find((x) => x.id === line.inventoryId)
      if (!inv) continue
      const next = (Number(inv.quantity) || 0) + (Number(line.qty) || 0)
      await patchRow('inventory', line.inventoryId, { quantity: next, updatedAt: nowStamp() })
    }
    await patchRow('purchaseOrders', po.id, { status: 'Received', receivedAt: nowStamp() })
    logActivity('service', `Received PO ${po.poNumber} — stock updated`)
    showToast(t('PO received — stock updated'), '📦')
  }

  const cancelPO = async (po) => {
    const ok = await showConfirm({
      title: t('Cancel purchase order?'),
      message: `${t('This will cancel')} ${po.poNumber}.`,
      confirmText: t('Cancel PO'),
      tone: 'warn',
    })
    if (!ok) return
    await patchRow('purchaseOrders', po.id, { status: 'Cancelled' })
    logActivity('service', `Purchase order ${po.poNumber} cancelled`)
    showToast(t('Purchase order cancelled'), '🛒')
  }

  const deleteSupplier = async (sup) => {
    const ok = await showConfirm({
      title: t('Delete supplier?'),
      message: `${t('This will permanently delete')} ${sup.name}.`,
      confirmText: t('Delete Supplier'),
      tone: 'danger',
    })
    if (!ok) return
    await removeRow('suppliers', sup.id)
    logActivity('service', `Supplier deleted: ${sup.name}`)
    showToast(t('Supplier deleted'), '🗑')
  }

  const sortedPOs = [...purchaseOrders].sort((a, b) => ((a.createdAt || '') < (b.createdAt || '') ? 1 : -1))

  // ── Analytics: purchase orders by status ──
  const statusCls = { Requested: '', Ordered: 'g', Received: 'gr', Cancelled: 'r' }
  const statusCounts = ['Requested', 'Ordered', 'Received', 'Cancelled'].map((st) => ({
    status: st, count: purchaseOrders.filter((po) => po.status === st).length,
  }))
  const maxStatus = Math.max(1, ...statusCounts.map((d) => d.count))

  // ── Analytics: spend by supplier (received POs, top 6 desc) ──
  const receivedPOs = purchaseOrders.filter((po) => po.status === 'Received')
  const supplierSpend = suppliers
    .map((sup) => ({
      name: sup.name,
      total: receivedPOs
        .filter((po) => (po.supplierId ? po.supplierId === sup.id : po.supplierName === sup.name))
        .reduce((sum, po) => sum + (Number(po.total) || 0), 0),
    }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  const maxSpend = Math.max(1, ...supplierSpend.map((d) => d.total))

  // ── Analytics: 6-month received-spend trend (by receivedAt YYYY-MM) ──
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      label: d.toLocaleDateString('en-SA', { month: 'short' }),
      total: receivedPOs
        .filter((po) => (po.receivedAt || '').slice(0, 7) === key)
        .reduce((sum, po) => sum + (Number(po.total) || 0), 0),
    })
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total))
  const hasSpend = months.some((m) => m.total > 0)

  // Trend SVG geometry (mirrors Dashboard)
  const W = 700, H = 160, PL = 8, PR = 8, PT = 18, PB = 22
  const iw = W - PL - PR, ih = H - PT - PB
  const xAt = (i) => PL + (months.length === 1 ? iw / 2 : (i / (months.length - 1)) * iw)
  const yAt = (v) => PT + ih - (v / maxMonth) * ih
  const linePts = months.map((m, i) => `${xAt(i)},${yAt(m.total)}`).join(' ')
  const areaPts = `${xAt(0)},${PT + ih} ${linePts} ${xAt(months.length - 1)},${PT + ih}`

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>🛒 {t('Procurement')}</h1>
          <p>{t('Suppliers and purchase orders — connected to Inventory')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-teal" onClick={() => setPoEdit(null)}>+ {t('New Purchase Order')}</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card c-brand">
          <span className="kpi-ico">📋</span>
          <div className="kpi-val">{openPOs.length}</div>
          <div className="kpi-lbl">{t('Open POs')}</div>
        </div>
        <div className="kpi-card c-orange">
          <span className="kpi-ico">💰</span>
          <div className="kpi-val" style={{ fontSize: 22 }}>{sar(pendingValue)}</div>
          <div className="kpi-lbl">{t('Pending Value')}</div>
        </div>
        <div className="kpi-card c-green">
          <span className="kpi-ico">✅</span>
          <div className="kpi-val">{receivedThisMonth}</div>
          <div className="kpi-lbl">{t('Received this month')}</div>
        </div>
        <div className="kpi-card c-gold">
          <span className="kpi-ico">🏷</span>
          <div className="kpi-val">{suppliers.length}</div>
          <div className="kpi-lbl">{t('Suppliers')}</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-title">📈 {t('Spend Trend — Last 6 Months')}</div>
        <div className="trend-wrap">
          <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={t('Received purchase order spend over the last 6 months')}>
            <g className="trend-grid">
              {[0, 0.5, 1].map((f) => <line key={f} x1={PL} x2={W - PR} y1={PT + ih - f * ih} y2={PT + ih - f * ih} />)}
            </g>
            {hasSpend ? (
              <>
                <polygon className="trend-area" points={areaPts} />
                <polyline className="trend-line" points={linePts} />
                {months.map((m, i) => (
                  <g key={m.key}>
                    <circle className="trend-dot" cx={xAt(i)} cy={yAt(m.total)} r={4}>
                      <title>{`${m.label}: ${sar(m.total)}`}</title>
                    </circle>
                    <text className="trend-xlabel" x={xAt(i)} y={H - 6}>{m.label}</text>
                  </g>
                ))}
              </>
            ) : (
              <text className="trend-empty" x={W / 2} y={H / 2}>{t('No received orders yet')}</text>
            )}
          </svg>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="chart-card">
          <div className="chart-title">📊 {t('Purchase Orders by Status')}</div>
          {statusCounts.map((d) => (
            <div className="bar-row" key={d.status} title={`${t(d.status)}: ${d.count}`}>
              <div className="bar-label">{t(d.status)}</div>
              <div className="bar-track"><div className={'bar-fill ' + statusCls[d.status]} style={{ width: (d.count / maxStatus) * 100 + '%' }} /></div>
              <div className="bar-val">{d.count}</div>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <div className="chart-title">💰 {t('Spend by Supplier')}</div>
          {supplierSpend.length ? supplierSpend.map((d) => (
            <div className="bar-row" key={d.name} title={`${d.name}: ${sar(d.total)}`}>
              <div className="bar-label">{d.name}</div>
              <div className="bar-track"><div className="bar-fill gr" style={{ width: (d.total / maxSpend) * 100 + '%' }} /></div>
              <div className="bar-val">{sar(d.total)}</div>
            </div>
          )) : <div className="empty-state" style={{ padding: 20 }}><p>{t('No received orders yet')}</p></div>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">🏷 {t('Suppliers')}</div>
          <button className="btn btn-outline btn-sm" onClick={() => setSupEdit(null)}>+ {t('Add Supplier')}</button>
        </div>
        <div style={{ padding: '4px 18px 16px' }}>
          {suppliers.length ? (
            <div className="sup-list">
              {suppliers.map((sup) => (
                <div className="sup-item" key={sup.id}>
                  <div>
                    <div className="sup-name">{sup.name}</div>
                    <div className="sup-sub">
                      {[sup.contact, sup.phone].filter(Boolean).join(' · ') || t('No contact info')}
                    </div>
                  </div>
                  <div className="action-group">
                    <button className="btn btn-outline btn-sm" onClick={() => setSupEdit(sup)}>{t('Edit')}</button>
                    <button className="btn btn-danger btn-sm btn-icon" title={t('Delete')} onClick={() => deleteSupplier(sup)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}><p>{t('No suppliers yet')}</p></div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 {t('Purchase Orders')}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('PO #')}</th><th>{t('Supplier')}</th><th>{t('Items')}</th><th>{t('Total')}</th>
                <th>{t('Status')}</th><th>{t('Date')}</th><th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPOs.length ? sortedPOs.map((po) => {
                const editable = po.status === 'Requested' || po.status === 'Ordered'
                return (
                  <tr key={po.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{po.poNumber}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{po.supplierName || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{(po.items || []).length}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{sar(po.total)}</td>
                    <td><span className={'badge ' + poBadge(po.status)}>{t(po.status)}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{po.createdAt || '—'}</td>
                    <td className="actions-cell">
                      <div className="action-group">
                        {po.status === 'Requested' && (
                          <button className="btn btn-teal btn-sm" onClick={() => markOrdered(po)}>{t('Mark Ordered')}</button>
                        )}
                        {po.status === 'Ordered' && (
                          <button className="btn btn-brand btn-sm" onClick={() => markReceived(po)}>{t('Mark Received')}</button>
                        )}
                        {editable && (
                          <button className="btn btn-outline btn-sm" onClick={() => setPoEdit(po)}>{t('View/Edit')}</button>
                        )}
                        {editable && (
                          <button className="btn btn-outline btn-sm" onClick={() => cancelPO(po)}>{t('Cancel')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={7}><div className="empty-state"><p>{t('No purchase orders yet')}</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseOrderModal
        open={poEdit !== undefined}
        po={poEdit || null}
        prefill={null}
        onClose={() => setPoEdit(undefined)}
      />
      <SupplierModal
        open={supEdit !== undefined}
        supplier={supEdit || null}
        onClose={() => setSupEdit(undefined)}
      />
    </>
  )
}
