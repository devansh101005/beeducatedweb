import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));

const admin = initializeApp({
  credential: cert(serviceAccount)
});

export default admin;