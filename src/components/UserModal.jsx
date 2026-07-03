import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../lib/i18n.js'

// Add / edit a team member. userId=null => new member.
export default function UserModal({ open, userId, onClose }) {
  const { users, machines, getUser, setRow, patchRow, showToast, genId, provisionUser } = useApp()
  const { t } = useT()

  const isEdit = !!userId
  const isPrimary = userId === 'u_manager'
  const migrated = isEdit && getUser(userId)?.password === undefined

  const [name, setName] = useState('')
  const [role, setRole] = useState('operator')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')

  // Hydrate fields whenever the modal opens / target changes.
  useEffect(() => {
    if (!open) return
    setErr('')
    setShowPw(false)
    if (isEdit) {
      const u = getUser(userId)
      setName(u?.name || '')
      setRole(u?.role || 'operator')
      setUsername(u?.username || '')
      setPassword(u?.password || '')
    } else {
      setName('')
      setRole('operator')
      setUsername('')
      setPassword('')
    }
  }, [open, userId])

  if (!open) return null

  const save = async () => {
    const nm = name.trim()
    const un = username.trim()
    if (!nm) { setErr(t("Please enter the member's full name.")); return }
    if (!un) { setErr(t('Please set a username.')); return }
    if (!isEdit && !password) { setErr(t('Please set a password.')); return }
    if (password && password.length < 4) { setErr(t('Password must be at least 4 characters.')); return }
    if (isPrimary && role !== 'manager') { setErr(t('The primary admin account must stay as Manager.')); return }
    const dupe = users.find((u) => u.username?.toLowerCase() === un.toLowerCase() && u.id !== userId)
    if (dupe) { setErr(`${t('Username')} "${un}" ${t('is already taken. Choose another.')}`); return }

    if (isEdit) {
      const patch = { name: nm, username: un, role }
      if (password && !migrated) patch.password = password // only pre-migration PIN edits take effect
      await patchRow('users', userId, patch)
      showToast(t('Member updated'))
    } else {
      const id = genId('u_')
      // Create a real secured account when possible; fall back to legacy PIN if
      // Email/Password sign-in isn't enabled yet (they'll migrate on first login).
      let uid = null
      try { uid = await provisionUser(id, password) } catch { /* provider not enabled yet */ }
      const docData = { id, name: nm, role, username: un }
      if (uid) docData.uid = uid
      else docData.password = password
      await setRow('users', id, docData)
      // Auto-assign new user to machines by default.
      if (role === 'operator') {
        await Promise.all(machines.map((m) => {
          const ops = m.operators || []
          if (ops.includes(id)) return null
          return patchRow('machines', m.id, { operators: [...ops, id] })
        }).filter(Boolean))
      } else if (role === 'technician') {
        await Promise.all(machines.map((m) => {
          if (m.technician) return null
          return patchRow('machines', m.id, { technician: id })
        }).filter(Boolean))
      }
      showToast(t('Member added — assigned to all machines by default'))
    }
    onClose?.()
  }

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose}>{t('Cancel')}</button>
      <button className="btn btn-teal" onClick={save}>{t('Save Member')}</button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('Edit Team Member') : t('Add Team Member')} footer={footer}>
      <div className={'field-err' + (err ? ' show' : '')}>{err}</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Full Name')} <span className="req">*</span></label>
          <input className="form-control" value={name} placeholder={t('Name')} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Role')}</label>
          <select className="form-control" value={role} disabled={isPrimary} onChange={(e) => setRole(e.target.value)}>
            <option value="manager">{t('Manager')}</option>
            <option value="operator">{t('Operator')}</option>
            <option value="technician">{t('Technician')}</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('Username')} <span className="req">*</span></label>
          <input className="form-control" value={username} placeholder={t('e.g. ahmad_op')} autoComplete="off" onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('Password')} {!isEdit && <span className="req">*</span>}</label>
          <div className="pw-wrapper">
            <input
              className="form-control"
              type={showPw ? 'text' : 'password'}
              value={password}
              placeholder={isEdit ? t('Leave blank to keep current') : t('Set password')}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="pw-toggle" type="button" tabIndex={-1} onClick={() => setShowPw((s) => !s)}>👁</button>
          </div>
          {migrated && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
              {t('This member has a secured login — their PIN can no longer be changed here. To reset it, remove and re-add them.')}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
