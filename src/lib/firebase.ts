import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  off,
  type Database,
  type DatabaseReference,
} from 'firebase/database'
import type { RoomState } from '@/types'

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_DATABASE_URL &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_API_KEY,
  )
}

let _app: FirebaseApp | null = null
let _db: Database | null = null

function getDb(): Database {
  if (_db) return _db

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* in .env.local.')
  }

  try {
    if (!_app) {
      const existing = getApps()[0]
      _app =
        existing ??
        initializeApp({
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
          // measurementId は Analytics 用、未設定でも動作する
          ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
            ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
            : {}),
        })
    }
    _db = getDatabase(_app)
    return _db
  } catch (err) {
    console.error('[Firebase] 初期化に失敗しました:', err)
    throw err
  }
}

function roomRef(roomCode: string): DatabaseReference {
  return ref(getDb(), `rooms/${roomCode}`)
}

export async function createRoom(roomCode: string, state: RoomState): Promise<void> {
  await set(roomRef(roomCode), state)
}

export async function getRoom(roomCode: string): Promise<RoomState | null> {
  const snap = await get(roomRef(roomCode))
  return snap.exists() ? (snap.val() as RoomState) : null
}

export async function updateRoom(roomCode: string, partial: Partial<RoomState>): Promise<void> {
  await update(roomRef(roomCode), partial)
}

export function subscribeRoom(
  roomCode: string,
  cb: (state: RoomState | null) => void,
): () => void {
  const r = roomRef(roomCode)
  onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as RoomState) : null)
  })
  return () => off(r)
}
