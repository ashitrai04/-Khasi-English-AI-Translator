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
  
  const { id, pass } = req.body;
  if (id !== "Ashit" || pass !== "Ashit@123") {
    return res.status(401).json({ error: "Unauthorized. Invalid credentials." });
  }

  try {
    const db = getDb();
    const snapshot = await db.collection('translator_logs').orderBy('Timestamp', 'desc').get();
    
    if (snapshot.empty) {
       return res.status(200).json({ logs: [] });
    }

    const logs = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ logs });
  } catch(error) {
    console.error("Admin Log Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
}

