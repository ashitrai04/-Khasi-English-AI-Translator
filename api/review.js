import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function getDb() {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) { // For Vercel Production
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) { // For Local Dev
      serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
  } else {
      throw new Error("Missing Firebase keys in .env");
  }
  
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { doc_id, review } = req.body;
  if (!doc_id || !review) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const db = getDb();
    await db.collection('translator_logs').doc(doc_id).update({
        Review: review
    });
    res.status(200).json({ success: true });
  } catch(error) {
    console.error("Review Error:", error);
    res.status(500).json({ error: error.message });
  }
}
