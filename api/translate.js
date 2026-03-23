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
  
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const API_URL = "https://techno-tuners-qwen-mt-model-space.hf.space/translate";
  const HF_TOKEN = process.env.HF_TOKEN;

  let apiResult = null;

  try {
    const fetchResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        max_new_tokens: 128
      })
    });

    if (!fetchResponse.ok) {
        throw new Error(`HF API Error: ${fetchResponse.status} - ${await fetchResponse.text()}`);
    }

    apiResult = await fetchResponse.json();

    // Log to Firestore
    try {
        const db = getDb();
        const timestamp = new Date().toISOString();
        const detected = apiResult.detected_language || "Unknown";
        const translation = apiResult.translated_text || "";
        const direction = apiResult.translation_direction || "Unknown";
        const original = apiResult.original_text || text;
        
        const docRef = await db.collection('translator_logs').add({
           Timestamp: timestamp,
           Direction: direction,
           "Detected Language": detected,
           "Original Text": original,
           "Translated Text": translation,
           Review: "Pending"
        });
        apiResult.doc_id = docRef.id;
        console.log("Successfully pushed to Firestore! Doc ID:", docRef.id);
    } catch(logError) {
        console.error("Failed to log to Firestore:", logError);
    }

    res.status(200).json(apiResult);
  } catch(error) {
    console.error("Translate Error:", error);
    res.status(500).json({ error: error.message });
  }
}

