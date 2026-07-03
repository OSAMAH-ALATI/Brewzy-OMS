// ─────────────────────────────────────────────────────────────
// AppContext — single source of truth
//
// • Signs the device in anonymously, then subscribes to every Firestore
//   collection with onSnapshot → the UI updates live across all devices.
// • Seeds the database the first time it is empty.
// • Exposes session (login/logout), theme, toast + confirm, and all
//   data-mutation actions used by the pages.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, getDoc, writeBatch,
  arrayUnion, arrayRemove, deleteField,
} from 'firebase/firestore'
import {
  db, auth, ensureSignedIn, isFirebaseConfigured,
  signInUser, createAuthAccount,
} from '../lib/firebase'
import { seedData } from '../lib/seed'
import { genId, today, yesterday, nowStamp, clone } from '../lib/utils'

// `users` is subscribed always (needed by the login screen). These company
// collections are subscribed only once a team member is logged in.
const MEMBER_COLLECTIONS = ['machines', 'issues', 'serviceCycles', 'activityLog', 'emptyRecords', 'notifications', 'inventory', 'suppliers', 'purchaseOrders']
const CONFIG_DOC = ['config', 'main']

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  // Connection / boot status: 'connecting' | 'ready' | 'error' | 'unconfigured'
  const [status, setStatus] = useState(isFirebaseConfigured ? 'connecting' : 'unconfigured')
  const [errorMsg, setErrorMsg] = useState('')

  // Live data
  const [data, setData] = useState({
    users: [], machines: [], issues: [], serviceCycles: [], activityLog: [], emptyRecords: [], notifications: [],
    inventory: [], suppliers: [], purchaseOrders: [],
  })
  const [config, setConfig] = useState({ globalTasks: [], emptySteps: [], accessControl: null })
  // uids allowed to access company data (security lock-down)
  const [allowlistUids, setAllowlistUids] = useState([])

  // Session (persisted locally so a refresh keeps you logged in)
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('brewzy-session')) || null } catch { return null }
  })

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('brewzy-theme') || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('brewzy-theme', theme)
  }, [theme])
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  // Toast
  const [toast, setToast] = useState(null) // {msg, icon}
  const toastTimer = useRef(null)
  const showToast = useCallback((msg, icon = '✓') => {
    setToast({ msg, icon })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  // Confirm dialog (promise-based, mirrors the original showConfirm)
  const [confirmState, setConfirmState] = useState(null)
  const confirmResolve = useRef(null)
  const showConfirm = useCallback((opts) => {
    return new Promise((resolve) => {
      confirmResolve.current = resolve
      setConfirmState({ tone: 'danger', confirmText: 'Delete', cancelText: 'Cancel', title: 'Are you sure?', message: '', ...opts })
    })
  }, [])
  const closeConfirm = useCallback((result) => {
    setConfirmState(null)
    if (confirmResolve.current) { confirmResolve.current(result); confirmResolve.current = null }
  }, [])

  // ── Boot: sign in, seed if needed, subscribe to login-safe data ──
  // Only `users`, config and the allow-list are subscribed here — these are
  // readable by any signed-in client (even before login), so the login screen
  // works. Company data is subscribed separately once a member is logged in,
  // so a not-yet-logged-in visitor never trips a permission-denied listener.
  useEffect(() => {
    if (!isFirebaseConfigured) return
    let unsubs = []
    let cancelled = false

    ;(async () => {
      try {
        await ensureSignedIn()
        // Best-effort: seeds a brand-new project; harmless (and skipped) once
        // seeded or when the database is locked down to members.
        try { await seedIfEmpty() } catch { /* already seeded / no permission */ }
        if (cancelled) return

        unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
          setData((prev) => ({ ...prev, users: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }))
        }, (err) => { console.error('snapshot users', err) }))

        unsubs.push(onSnapshot(doc(db, 'config', 'allowlist'), (d) => {
          setAllowlistUids(d.exists() ? (d.data().uids || []) : [])
        }, () => {}))

        setStatus('ready')
      } catch (e) {
        console.error(e)
        if (!cancelled) { setErrorMsg(e?.message || String(e)); setStatus('error') }
      }
    })()

    return () => { cancelled = true; unsubs.forEach((u) => u && u()) }
  }, [])

  // ── Company data: subscribe only while a member is logged in ──
  useEffect(() => {
    if (!isFirebaseConfigured || !session) return
    const unsubs = MEMBER_COLLECTIONS.map((name) => onSnapshot(collection(db, name), (snap) => {
      setData((prev) => ({ ...prev, [name]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }))
    }, (err) => { console.error(`snapshot ${name}`, err) }))
    // config/main (globalTasks, emptySteps, accessControl) is members-only.
    unsubs.push(onSnapshot(doc(db, ...CONFIG_DOC), (d) => {
      if (d.exists()) setConfig(d.data())
    }, (err) => { console.error('snapshot config', err) }))
    return () => unsubs.forEach((u) => u && u())
  }, [session?.userId])

  async function seedIfEmpty() {
    const cfgSnap = await getDoc(doc(db, ...CONFIG_DOC))
    if (cfgSnap.exists()) return // already initialised
    const usersSnap = await getDocs(collection(db, 'users'))
    if (!usersSnap.empty) return

    const seed = seedData(today(), yesterday())
    const batch = writeBatch(db)
    ;['users', 'machines', 'issues'].forEach((name) => {
      seed[name].forEach((row) => batch.set(doc(db, name, row.id), row))
    })
    batch.set(doc(db, ...CONFIG_DOC), seed.config)
    await batch.commit()
  }

  // ── Mutations ─────────────────────────────────────────────
  const setRow = useCallback((coll, id, row) => setDoc(doc(db, coll, id), row), [])
  const patchRow = useCallback((coll, id, patch) => updateDoc(doc(db, coll, id), patch), [])
  const removeRow = useCallback((coll, id) => deleteDoc(doc(db, coll, id)), [])
  const updateConfig = useCallback((patch) => setDoc(doc(db, ...CONFIG_DOC), patch, { merge: true }), [])

  // Notifications
  const notify = useCallback((userId, text, issueId) => {
    const id = genId('n_')
    return setRow('notifications', id, { id, userId, text, issueId: issueId || null, read: false, time: nowStamp() })
  }, [setRow])
  const markNotifRead = useCallback((id) => patchRow('notifications', id, { read: true }), [patchRow])

  // Activity log (cap at 200 — trim oldest)
  const activityLogRef = useRef([])
  activityLogRef.current = data.activityLog
  const logActivity = useCallback(async (type, text) => {
    const id = genId('a_')
    await setDoc(doc(db, 'activityLog', id), { id, type, text, time: nowStamp() })
    const all = [...activityLogRef.current].sort((a, b) => (a.time < b.time ? 1 : -1))
    if (all.length > 200) {
      const extra = all.slice(200)
      const batch = writeBatch(db)
      extra.forEach((e) => batch.delete(doc(db, 'activityLog', e.id)))
      batch.commit().catch(() => {})
    }
  }, [])

  // ── Security allow-list helpers ───────────────────────────
  const addToAllowlist = useCallback(
    (uid) => setDoc(doc(db, 'config', 'allowlist'), { uids: arrayUnion(uid) }, { merge: true }),
    [],
  )
  const removeFromAllowlist = useCallback(
    (uid) => setDoc(doc(db, 'config', 'allowlist'), { uids: arrayRemove(uid) }, { merge: true }),
    [],
  )
  // Create a real Firebase account for a new member + add them to the allow-list.
  const provisionUser = useCallback(async (userId, pin) => {
    const uid = await createAuthAccount(userId, pin)
    await addToAllowlist(uid).catch(() => {})
    return uid
  }, [addToAllowlist])

  // ── Session ───────────────────────────────────────────────
  // Backward-compatible: if Firebase email/password isn't set up yet, falls back
  // to the legacy PIN check so nothing breaks during the migration window.
  const login = useCallback(async (username, password) => {
    const u = data.users.find((x) => x.username?.toLowerCase() === username.trim().toLowerCase())
    if (!u) return { ok: false, error: 'No account found with that username.' }

    const legacyOk = u.password !== undefined && u.password === password
    let authUid = null

    try {
      const cred = await signInUser(u.id, password)
      authUid = cred.user.uid
    } catch (e) {
      if (legacyOk) {
        // Not migrated yet → create the secure account now (or provider disabled).
        try {
          await createAuthAccount(u.id, password)
          const cred = await signInUser(u.id, password)
          authUid = cred.user.uid
        } catch (ce) {
          if (ce.code === 'auth/email-already-in-use') {
            return { ok: false, error: 'Incorrect password. Please try again.' }
          }
          // e.g. provider not enabled yet → fall through on the legacy check
        }
      } else if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(e.code)) {
        return { ok: false, error: 'Incorrect password. Please try again.' }
      } else {
        return { ok: false, error: 'Sign-in failed. Please try again.' }
      }
    }

    if (!authUid && !legacyOk) return { ok: false, error: 'Incorrect password. Please try again.' }

    if (authUid) {
      // Record on allow-list, store the account id, and drop the plaintext PIN
      // (now held securely by Firebase Auth).
      addToAllowlist(authUid).catch(() => {})
      const patch = { uid: authUid }
      if (u.password !== undefined) patch.password = deleteField()
      updateDoc(doc(db, 'users', u.id), patch).catch(() => {})
    }

    const s = { userId: u.id, role: u.role, name: u.name, uid: authUid || null }
    setSession(s)
    localStorage.setItem('brewzy-session', JSON.stringify(s))
    return { ok: true }
  }, [data.users, addToAllowlist])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem('brewzy-session')
  }, [])

  // ── Derived lookups ───────────────────────────────────────
  const getUser = useCallback((id) => data.users.find((x) => x.id === id), [data.users])
  const getUserName = useCallback((id) => data.users.find((x) => x.id === id)?.name || '—', [data.users])
  const getMachine = useCallback((id) => data.machines.find((x) => x.id === id), [data.machines])
  const getMachineName = useCallback((id) => data.machines.find((x) => x.id === id)?.name || '—', [data.machines])
  const visitCount = useCallback(
    (machineId) => data.serviceCycles.filter((s) => s.machineId === machineId).length + 1,
    [data.serviceCycles],
  )

  const access = config.accessControl || {
    operator: { route: true, issues: true, history: true, empty_checklist: true, machines: false },
    technician: { route: true, issues: true, history: true, empty_checklist: true, machines: false },
  }

  const value = useMemo(() => ({
    status, errorMsg,
    ...data, ...config, access,
    session, login, logout,
    theme, toggleTheme,
    toast, showToast,
    confirmState, showConfirm, closeConfirm,
    setRow, patchRow, removeRow, updateConfig, logActivity, genId,
    notify, markNotifRead,
    allowlistUids, provisionUser, removeFromAllowlist,
    getUser, getUserName, getMachine, getMachineName, visitCount,
  }), [status, errorMsg, data, config, access, session, login, logout, theme, toggleTheme,
      toast, showToast, confirmState, showConfirm, closeConfirm, setRow, patchRow, removeRow,
      updateConfig, logActivity, notify, markNotifRead, allowlistUids, provisionUser, removeFromAllowlist,
      getUser, getUserName, getMachine, getMachineName, visitCount])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
