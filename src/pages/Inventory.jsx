import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'
import { nowStamp } from '../lib/utils.js'
import { stockStatus, sar, itemValue, stockBadge } from '../lib/inventory.js'
import { SEED_SUPPLIERS, SEED_INVENTORY, MACHINE_FILL_KIT, INV_CATEGORIES } from '../lib/inventorySeed.js'
import Modal from '../components/Modal.jsx'
import InventoryModal from '../components/InventoryModal.jsx'
import PurchaseOrderModal from '../components/PurchaseOrderModal.jsx'
import '../inventory.css'
import '../dashboard.css'

export default function Inventory({ onNavigate }) {
  const {
    inventory, suppliers, setRow, patchRow, removeRow, genId,
    logActivity, showToast, showConfirm,
  } = useApp()
  const { t } = useT()

  const [search, setSearch] = useState('')
  const [fCat, setFCat] = useState('')
  const [fStatus, setFStatus] = useState('')

  const [editItem, setEditItem] = useState(undefined) // undefined=closed, null=new, item=edit
  const [poOpen, setPoOpen] = useState(false)
  const [poPrefill, setPoPrefill] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)
  const [adjustDir, setAdjustDir] = useState('add')
  const [adjustQty, setAdjustQty] = useState('1')
  const [showFill, setShowFill] = useState(false)

  const importCatalog = async () => {
    const existingSup = new Set(suppliers.map((s) => (s.name || '').toLowerCase()))
    let supCount = 0
    for (const s of SEED_SUPPLIERS) {
      if (existingSup.has((s.name || '').toLowerCase())) continue
      const id = genId('sup_')
      await setRow('suppliers', id, { id, name: s.name, contact: '', phone: '', notes: '' })
      existingSup.add((s.name || '').toLowerCase())
      supCount++
    }
    const existingInv = new Set(inventory.map((i) => (i.name || '').toLowerCase()))
    let invCount = 0
    for (const it of SEED_INVENTORY) {
      if (existingInv.has((it.name || '').toLowerCase())) continue
      const id = genId('inv_')
      await setRow('inventory', id, { id, ...it, quantity: 0, minLevel: 0, notes: '', updatedAt: nowStamp() })
      existingInv.add((it.name || '').toLowerCase())
      invCount++
    }
    logActivity('service', `Imported starter catalog: ${invCount} items, ${supCount} suppliers`)
    showToast(`${t('Imported')} ${invCount} ${t('items')}, ${supCount} ${t('suppliers')}`, '📦')
  }

  const doDelete = async (item) => {
    const ok = await showConfirm({
      title: t('Delete item?'),
      message: `${t('This will permanently delete')} ${item.name}. ${t('This action cannot be undone.')}`,
      confirmText: t('Delete Item'),
      tone: 'danger',
    })
    if (!ok) return
    await removeRow('inventory', item.id)
    logActivity('service', `Inventory item deleted: ${item.name}`)
    showToast(t('Item deleted'), '🗑')
  }

  const openAdjust = (item) => { setAdjustItem(item); setAdjustDir('add'); setAdjustQty('1') }
  const applyAdjust = () => {
    const delta = Number(adjustQty) || 0
    if (delta <= 0) { showToast(t('Enter a quantity'), '⚠️'); return }
    const cur = Number(adjustItem.quantity) || 0
    const next = adjustDir === 'add' ? cur + delta : Math.max(0, cur - delta)
    patchRow('inventory', adjustItem.id, { quantity: next, updatedAt: nowStamp() })
    logActivity('service', `Stock adjusted: ${adjustItem.name} ${adjustDir === 'add' ? '+' : '−'}${delta} (now ${next})`)
    showToast(t('Stock adjusted'), '📦')
    setAdjustItem(null)
  }

  const openReorder = (item) => {
    setPoPrefill({
      supplierName: item.vendor || '',
      items: [{
        inventoryId: item.id, name: item.name, unit: item.unit || '',
        qty: 1, unitCost: Number(item.priceInclVat) || 0, lineTotal: Number(item.priceInclVat) || 0,
      }],
    })
    setPoOpen(true)
  }

  const s = search.toLowerCase()
  const rows = inventory.filter((it) => {
    if (s && ![it.name, it.brand, it.vendor].some((v) => (v || '').toLowerCase().includes(s))) return false
    if (fCat && it.category !== fCat) return false
    if (fStatus && stockStatus(it) !== fStatus) return false
    return true
  })

  const lowCount = inventory.filter((it) => stockStatus(it) === 'Low').length
  const outCount = inventory.filter((it) => stockStatus(it) === 'Out').length
  const okCount = inventory.filter((it) => stockStatus(it) === 'OK').length
  const totalValue = inventory.reduce((sum, it) => sum + itemValue(it), 0)

  // ── Analytics: stock value per category (desc, non-zero only) ──
  const catValues = INV_CATEGORIES
    .map((c) => ({ cat: c, value: inventory.filter((it) => it.category === c).reduce((sum, it) => sum + itemValue(it), 0) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
  const maxCatValue = Math.max(1, ...catValues.map((d) => d.value))

  // ── Analytics: items needing restock (Out first) ──
  const restock = inventory
    .filter((it) => { const st = stockStatus(it); return st === 'Low' || st === 'Out' })
    .sort((a, b) => (stockStatus(a) === 'Out' ? 0 : 1) - (stockStatus(b) === 'Out' ? 0 : 1))

  // ── Analytics: stock-status health strip ──
  const stockHealth = [
    { key: 'OK', n: okCount, color: 'var(--success)' },
    { key: 'Low', n: lowCount, color: 'var(--warning)' },
    { key: 'Out', n: outCount, color: 'var(--error)' },
  ]
  const stockHealthTotal = Math.max(1, okCount + lowCount + outCount)

  const fillTotal = MACHINE_FILL_KIT.reduce((sum, l) => sum + (Number(l.totalPrice) || 0), 0)

  return (
    <>
      <div className="ph">
        <div className="ph-text">
          <h1>📦 {t('Inventory')}</h1>
          <p>{t('Stock of coffee, milk, cups, syrups, water, cleaning supplies and spare parts')}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline" onClick={importCatalog}>{t('Import starter catalog')}</button>
          <button className="btn btn-teal" onClick={() => setEditItem(null)}>+ {t('Add Item')}</button>
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">📦</div>
            <p>{t('No inventory yet. Import the starter catalog to get going.')}</p>
            <button className="btn btn-brand" style={{ marginTop: 16 }} onClick={importCatalog}>
              {t('Import starter catalog')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card c-brand">
              <span className="kpi-ico">📦</span>
              <div className="kpi-val">{inventory.length}</div>
              <div className="kpi-lbl">{t('Total Items')}</div>
            </div>
            <div className="kpi-card c-orange">
              <span className="kpi-ico">⚠️</span>
              <div className="kpi-val">{lowCount}</div>
              <div className="kpi-lbl">{t('Low Stock')}</div>
            </div>
            <div className="kpi-card c-red">
              <span className="kpi-ico">🚫</span>
              <div className="kpi-val">{outCount}</div>
              <div className="kpi-lbl">{t('Out of Stock')}</div>
            </div>
            <div className="kpi-card c-green">
              <span className="kpi-ico">💰</span>
              <div className="kpi-val" style={{ fontSize: 22 }}>{sar(totalValue)}</div>
              <div className="kpi-lbl">{t('Total Stock Value')}</div>
            </div>
          </div>

          <div className="two-col" style={{ marginBottom: 16 }}>
            <div className="chart-card">
              <div className="chart-title">📊 {t('Stock Value by Category')}</div>
              {catValues.length ? catValues.map((d) => (
                <div className="bar-row" key={d.cat} title={`${t(d.cat)}: ${sar(d.value)}`}>
                  <div className="bar-label">{t(d.cat)}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: (d.value / maxCatValue) * 100 + '%' }} /></div>
                  <div className="bar-val">{sar(d.value)}</div>
                </div>
              )) : <div className="empty-state" style={{ padding: 20 }}><p>{t('No stock value yet')}</p></div>}
            </div>

            <div className="chart-card">
              <div className="chart-title">⚠️ {t('Needs Restocking')}</div>
              <div className="health-bar">
                {stockHealth.map((h) => h.n > 0 && (
                  <div className="health-seg" key={h.key} title={`${t(h.key)}: ${h.n}`}
                    style={{ width: (h.n / stockHealthTotal) * 100 + '%', background: h.color }} />
                ))}
              </div>
              <div className="chart-legend">
                {stockHealth.map((h) => (
                  <span className="legend-item" key={h.key}>
                    <span className="legend-swatch" style={{ background: h.color }} />
                    {t(h.key)} <b style={{ color: 'var(--text-primary)' }}>{h.n}</b>
                  </span>
                ))}
              </div>
              {restock.length ? (
                <div className="attention-list">
                  {restock.map((it) => {
                    const st = stockStatus(it)
                    return (
                      <div className={'attention-item' + (st === 'Out' ? ' warning' : '')} key={it.id}>
                        <div className="attention-name">{it.name}</div>
                        <div className="attention-sub">{t(st)} · {t('In stock')}: {Number(it.quantity) || 0}</div>
                      </div>
                    )
                  })}
                </div>
              ) : <div className="empty-state" style={{ padding: 20 }}><p>✅ {t('Everything is well stocked')}</p></div>}
            </div>
          </div>

          <div className="filter-bar">
            <input
              className="filter-input"
              placeholder={t('Search by name, brand or vendor…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="filter-select" value={fCat} onChange={(e) => setFCat(e.target.value)}>
              <option value="">{t('All Categories')}</option>
              {INV_CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
            </select>
            <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t('All Status')}</option>
              <option value="OK">{t('OK')}</option>
              <option value="Low">{t('Low')}</option>
              <option value="Out">{t('Out')}</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('Item')}</th><th>{t('Category')}</th><th>{t('Vendor')}</th><th>{t('Pack')}</th>
                  <th>{t('Price incl VAT')}</th><th>{t('In Stock')}</th><th>{t('Min')}</th>
                  <th>{t('Status')}</th><th>{t('Value')}</th><th>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((it) => {
                  const st = stockStatus(it)
                  return (
                    <tr key={it.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{it.name}</div>
                        {it.brand && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{it.brand}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t(it.category)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{it.vendor || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{it.packageQty || '—'} {it.unit}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{sar(it.priceInclVat)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Number(it.quantity) || 0}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{Number(it.minLevel) || 0}</td>
                      <td><span className={'badge ' + stockBadge(st)}>{t(st)}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{sar(itemValue(it))}</td>
                      <td className="actions-cell">
                        <div className="action-group">
                          <button className="btn btn-outline btn-sm" onClick={() => openAdjust(it)}>{t('Adjust')}</button>
                          {(st === 'Low' || st === 'Out') && (
                            <button className="btn btn-gold btn-sm" onClick={() => openReorder(it)}>{t('Reorder')}</button>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => setEditItem(it)}>{t('Edit')}</button>
                          <button className="btn btn-danger btn-sm btn-icon" title={t('Delete')} onClick={() => doDelete(it)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={10}><div className="empty-state"><p>{t('No items found')}</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowFill((v) => !v)}>
          <div className="card-title">☕ {t('Standard Machine Fill')}</div>
          <button className="btn btn-ghost btn-sm">{showFill ? t('Hide') : t('Show')}</button>
        </div>
        {showFill && (
          <div style={{ padding: '4px 18px 16px' }}>
            <div className="fill-list">
              {MACHINE_FILL_KIT.map((l, i) => (
                <div className="fill-row" key={i}>
                  <span className="fill-name">{l.name}</span>
                  <span className="fill-qty">{l.qty} {l.unit}</span>
                  <span className="fill-price">{sar(l.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="fill-total">
              <span>{t('Standard cost to stock one machine')}</span>
              <span className="fill-total-val">{sar(fillTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <InventoryModal open={editItem !== undefined} item={editItem || null} onClose={() => setEditItem(undefined)} />
      <PurchaseOrderModal
        open={poOpen}
        po={null}
        prefill={poPrefill}
        onClose={() => { setPoOpen(false); setPoPrefill(null) }}
      />

      <Modal
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={adjustItem ? `${t('Adjust Stock')} — ${adjustItem.name}` : t('Adjust Stock')}
        footer={(
          <>
            <button className="btn btn-outline" onClick={() => setAdjustItem(null)}>{t('Cancel')}</button>
            <button className="btn btn-teal" onClick={applyAdjust}>{t('Apply')}</button>
          </>
        )}
      >
        {adjustItem && (
          <>
            <p style={{ marginBottom: 14, color: 'var(--text-secondary)', fontSize: 13 }}>
              {t('Current stock')}: <strong>{Number(adjustItem.quantity) || 0}</strong> {adjustItem.unit}
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('Direction')}</label>
                <select className="form-control" value={adjustDir} onChange={(e) => setAdjustDir(e.target.value)}>
                  <option value="add">+ {t('Received (add)')}</option>
                  <option value="sub">− {t('Used (subtract)')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('Quantity')}</label>
                <input type="number" className="form-control" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
