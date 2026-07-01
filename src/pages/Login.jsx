import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const submit = () => {
    setError('')
    if (!username.trim()) { setError('Please enter your username.'); return }
    const res = login(username, password)
    if (!res.ok) setError(res.error)
  }

  return (
    <div id="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">
          <img className="auth-logo-img" src="/auth-logo.png" alt="Brewzy" />

          {error && (
            <div className="auth-err show">
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input type="text" className="auth-input" autoComplete="off" placeholder="Enter your username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} className="auth-input" placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
              <button className="pw-eye" type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}>👁</button>
            </div>
          </div>

          <button className="auth-btn" onClick={submit}>Sign In →</button>
          <div className="auth-hint">Contact your manager if you don't have access</div>
        </div>
      </div>
    </div>
  )
}
