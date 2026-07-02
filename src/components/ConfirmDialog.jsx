import { useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'

export default function ConfirmDialog() {
  const { confirmState, closeConfirm } = useApp()
  const { t } = useT()

  useEffect(() => {
    if (!confirmState) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeConfirm(false)
      if (e.key === 'Enter') closeConfirm(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmState, closeConfirm])

  if (!confirmState) return null
  const { tone, title, message, confirmText, cancelText } = confirmState
  const okClass = tone === 'danger' ? 'btn-danger' : tone === 'warn' ? 'btn-gold' : 'btn-brand'
  const icon = tone === 'danger' ? '🗑️' : tone === 'warn' ? '⚠️' : '❓'
  const iconClass = 'confirm-icon' + (tone === 'danger' ? '' : ' ' + tone)

  return (
    <div className="modal-overlay confirm-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) closeConfirm(false) }}>
      <div className="confirm-box">
        <div className={iconClass}>{icon}</div>
        <div className="confirm-title">{t(title)}</div>
        <div className="confirm-message">{t(message)}</div>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={() => closeConfirm(false)}>{t(cancelText)}</button>
          <button className={'btn ' + okClass} onClick={() => closeConfirm(true)} autoFocus>{t(confirmText)}</button>
        </div>
      </div>
    </div>
  )
}
