// ─────────────────────────────────────────────────────────────
// Firebase initialisation
// ─────────────────────────────────────────────────────────────
// Reads config from Vite env vars (VITE_FIREBASE_*). These keys are public
// by design — security is enforced by Firestore rules + anonymous auth.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// True only when the essential config is present.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
)

let app = null
let dbRef = null
let authRef = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  dbRef = getFirestore(app)
  authRef = getAuth(app)
}

export const db = dbRef
export const auth = authRef

// Sign the device in anonymously so Firestore rules (request.auth != null)
// are satisfied. Resolves once we have a Firebase user.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    if (!authRef) {
      reject(new Error('Firebase is not configured'))
      return
    }
    const unsub = onAuthStateChanged(authRef, (user) => {
      if (user) {
        unsub()
        resolve(user)
      }
    })
    signInAnonymously(authRef).catch(reject)
  })
}
