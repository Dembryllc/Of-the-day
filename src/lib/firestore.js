import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function createUserDocument(uid, { name, email, grade }) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { name, email, grade, plan: 'trial', trialStartedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
}

export async function updateUserGrade(uid, grade) {
  await setDoc(doc(db, 'users', uid), { grade }, { merge: true });
}

export async function updateUserProfile(uid, { name, grade }) {
  await setDoc(doc(db, 'users', uid), { name, grade }, { merge: true });
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

export async function fetchActivities() {
  const snap = await getDocs(collection(db, 'activities'));
  return snap.docs.map(d => {
    const data = d.data();
    // Restore numeric id so existing filter logic (GRADE_RITUAL_ACTIVITY_IDS) still works.
    return { ...data, id: isNaN(Number(data.id)) ? data.id : Number(data.id) };
  });
}

// ── Lesson Slides ─────────────────────────────────────────────────────────────

export async function saveLessonSlide(uid, slide) {
  const ref = doc(db, 'users', uid, 'slides', slide.id);
  await setDoc(ref, { ...slide, savedAt: serverTimestamp() });
}

export async function loadLessonSlides(uid) {
  const q = query(collection(db, 'users', uid, 'slides'), orderBy('savedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function deleteLessonSlide(uid, slideId) {
  await deleteDoc(doc(db, 'users', uid, 'slides', slideId));
}

export async function saveBehavioralExpectations(uid, expectations) {
  await setDoc(doc(db, 'users', uid), { behavioralExpectations: expectations }, { merge: true });
}
