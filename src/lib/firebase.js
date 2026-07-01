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

export const isFirebaseConfigured = true

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user) }
    })
    signInAnonymously(auth).catch(reject)
  })
}
