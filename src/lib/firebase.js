// ─────────────────────────────────────────────────────────────
// Firebase initialisation + auth helpers
// ─────────────────────────────────────────────────────────────
// These web keys are public by design — security is enforced by Firestore
// rules + per-user accounts, not by hiding them.
//
// Login model: each team member keeps their simple username + PIN, but behind
// the scenes it maps to a real Firebase email/password account so the database
// can be locked to the team. The synthetic email is derived from the (stable,
// safe) userId; the password is padded to satisfy Firebase's 6-char minimum so
// short PINs like "7811" keep working transparently.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDjdACenp3BiiUsZreV-g8cRcWKvp2Mky0',
  authDomain: 'brewzy-oms.firebaseapp.com',
  projectId: 'brewzy-oms',
  storageBucket: 'brewzy-oms.firebasestorage.app',
  messagingSenderId: '331155070898',
  appId: '1:331155070898:web:00126ba136eac0c14d8eab',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Derive the synthetic Firebase credentials from app-level identity.
export const authEmail = (userId) => `${userId}@brewzy-oms.app`
export const authPassword = (pin) => `bz1_${pin}` // guarantees >= 6 chars

// Ensure SOME Firebase user exists on boot so the app can read the (secret-free)
// login lookup. Uses the persisted session if present; otherwise signs in
// anonymously. Anonymous users are never on the allow-list, so they can't read
// company data once the strict rules are published.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      if (user) resolve(user)
      else signInAnonymously(auth).then((c) => resolve(c.user)).catch(reject)
    })
  })
}

// Sign in an existing team member (primary session).
export function signInUser(userId, pin) {
  return signInWithEmailAndPassword(auth, authEmail(userId), authPassword(pin))
}

// Create a member's Firebase account WITHOUT disturbing the current session
// (uses a throwaway secondary app instance), and return the new uid.
let secondaryApp = null
export async function createAuthAccount(userId, pin) {
  secondaryApp = secondaryApp || initializeApp(firebaseConfig, 'provisioner')
  const secAuth = getAuth(secondaryApp)
  const cred = await createUserWithEmailAndPassword(secAuth, authEmail(userId), authPassword(pin))
  const uid = cred.user.uid
  await signOut(secAuth).catch(() => {})
  return uid
}
