import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'

export default function Login() {
  const { login } = useApp()
  const { t } = useT()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setError('')
    if (!username.trim()) { setError('Please enter your username.'); return }
    setBusy(true)
    try {
      const res = await login(username, password)
      if (!res.ok) setError(res.error)
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">
          <img className="auth-logo-img" src="/auth-logo.png" alt="Brewzy" />

          {error && (
            <div className="auth-err show">
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span>{t(error)}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">{t('Username')}</label>
            <input type="text" className="auth-input" autoComplete="off" placeholder={t('Enter your username')}
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
          </div>

          <div className="auth-field">
            <label className="auth-label">{t('Password')}</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} className="auth-input" placeholder={t('Enter your password')}
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
              <button className="pw-eye" type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}>👁</button>
            </div>
          </div>

          <button className="auth-btn" onClick={submit} disabled={busy}>
            {busy ? t('Signing in…') : <>{t('Sign In')} →</>}
          </button>
          <div className="auth-hint">{t("Contact your manager if you don't have access")}</div>
        </div>
      </div>
    </div>
  )
}
