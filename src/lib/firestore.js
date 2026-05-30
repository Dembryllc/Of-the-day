import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function createUserDocument(uid, { name, email, grade }) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { name, email, grade, plan: 'free', createdAt: serverTimestamp() }, { merge: true });
}

export async function getUserDocument(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveDataSnapshot(uid, snapshot) {
  const ref = doc(db, 'users', uid, 'data', 'main');
  await setDoc(ref, { ...snapshot, savedAt: serverTimestamp() });
  return { savedAt: new Date().toISOString() };
}

export async function loadDataSnapshot(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'main'));
  return snap.exists() ? snap.data() : null;
}

export async function migrateFromLocalStorage(uid) {
  if (localStorage.getItem('ofd:migrated')) return;
  const existing = await loadDataSnapshot(uid);
  if (existing) {
    localStorage.setItem('ofd:migrated', '1');
    return;
  }
  const stored = {};
  for (const key of ['ofd:favorites', 'ofd:customActivities', 'ofd:savedRoutines', 'ofd:customVocab', 'ofd:customDoNow', 'ofd:projectorStyle']) {
    try {
      const val = localStorage.getItem(key);
      if (val) stored[key] = JSON.parse(val);
    } catch {}
  }
  if (Object.keys(stored).length > 0) {
    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: stored['ofd:favorites'] || [],
      customActivities: stored['ofd:customActivities'] || [],
      savedRoutines: stored['ofd:savedRoutines'] || [],
      customVocab: stored['ofd:customVocab'] || {},
      customDoNow: stored['ofd:customDoNow'] || {},
      projectorStyle: stored['ofd:projectorStyle'] || {},
    };
    await saveDataSnapshot(uid, snapshot);
  }
  localStorage.setItem('ofd:migrated', '1');
}
