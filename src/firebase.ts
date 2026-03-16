import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  getIdTokenResult,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import {
  getFirestore,
  serverTimestamp,
  Timestamp,
  collection,
  doc,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBbY2qIryw2GlgDNm-tjmNVEF62uGBaKbs",
  authDomain: "passmartshop.firebaseapp.com",
  projectId: "passmartshop",
  storageBucket: "passmartshop.firebasestorage.app",
  messagingSenderId: "1069152018502",
  appId: "1:1069152018502:web:c17f5a46067004595b6a47",
}

const app = initializeApp(firebaseConfig)

/** True when real Firebase config is set (not placeholders). Skip Firestore/Auth calls when false. */
export const isFirebaseConfigured =
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const now = serverTimestamp

export {
  Timestamp,
  serverTimestamp,
  collection,
  doc,
  onAuthStateChanged,
  getIdTokenResult,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
}
export { query, where, orderBy } from 'firebase/firestore'
export type { User }

