/**
 * Set custom claim role: 'admin' for a Firebase user.
 *
 * Usage:
 *   1. Put your Firebase service account key at: scripts/serviceAccountKey.json
 *   2. Get the user's UID from Firebase Console → Authentication → Users
 *   3. Run: node set-admin.js <UID>
 *
 * Example: node set-admin.js abc123xyz
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('Missing serviceAccountKey.json in the scripts folder.');
  console.error('Download it from: Firebase Console → Project settings → Service accounts → Generate new private key');
  process.exit(1);
}

const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node set-admin.js <USER_UID>');
  console.error('Get the UID from: Firebase Console → Authentication → Users (copy the User UID)');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log('Done. Admin claim set for UID:', uid);
    console.log('That user must sign out and sign in again to get the new role.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
