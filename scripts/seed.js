#!/usr/bin/env node
/**
 * Seed the Firestore `activities` collection with the canonical activity pool.
 *
 * Prerequisites:
 *   1. Place your Firebase Admin SDK service account key at:
 *      scripts/service-account.json
 *   2. npm install firebase-admin   (run once from the project root)
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Safe to run more than once — each document is set with merge:false,
 * which overwrites existing data so the collection stays in sync.
 */

const path = require("path");
const admin = require("firebase-admin");
const { POOL } = require("./activities-data");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account.json");

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error(
    `\n❌  Service account key not found at:\n   ${SERVICE_ACCOUNT_PATH}\n\n` +
    `   Download it from Firebase Console → Project Settings → Service Accounts\n` +
    `   → Generate new private key, then move the file to scripts/service-account.json\n`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const BATCH_SIZE = 400; // Firestore max is 500 ops per batch

async function seed() {
  console.log(`\nSeeding ${POOL.length} activities to Firestore…`);

  // Split into batches
  for (let i = 0; i < POOL.length; i += BATCH_SIZE) {
    const chunk = POOL.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const activity of chunk) {
      const docId = String(activity.id);
      const ref = db.collection("activities").doc(docId);
      batch.set(ref, {
        ...activity,
        id: docId, // store as string for consistent Firestore querying
        seededAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`  ✓ Wrote ${i + 1}–${Math.min(i + BATCH_SIZE, POOL.length)} of ${POOL.length}`);
  }

  console.log(`\n✅  Done — ${POOL.length} activities written to activities collection.\n`);
  process.exit(0);
}

seed().catch(err => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
