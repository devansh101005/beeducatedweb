// // import { initializeApp, cert } from 'firebase-admin/app';
// // import { readFileSync } from 'fs';

// // const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));

// // const admin = initializeApp({
// //   credential: cert(serviceAccount)
// // });

// // export default admin;

// const admin = require('firebase-admin');
// const serviceAccount = {
//   type: "service_account",
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   client_email: process.env.FIREBASE_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_CLIENT_ID,
//   auth_uri: "https://accounts.google.com/o/oauth2/auth",
//   token_uri: "https://oauth2.googleapis.com/token",
//   auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//   client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
// };
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET
// });
// module.exports = admin;

import admin from 'firebase-admin';
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
export default admin; // ESM default export