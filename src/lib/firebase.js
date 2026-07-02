// ─────────────────────────────────────────────────────────────
// Firebase initialisation
// ─────────────────────────────────────────────────────────────
// These web keys are public by design — security is enforced by Firestore
// rules + anonymous auth, not by hiding them.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

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

// Sign the device in anonymously so Firestore rules (request.auth != null) pass.
// Resolves once we have a Firebase user.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub()
        resolve(user)
      }
    })
    signInAnonymously(auth).catch(reject)
  })
}
