export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { text, direction } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const API_URL = "https://techno-tuners-new-qwen-7b.hf.space/chat";
  const HF_TOKEN = process.env.HF_TOKEN;

  try {
    const fetchResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        direction: direction || "en2kha"
      })
    });

    if (!fetchResponse.ok) {
        throw new Error(`HF Chat API Error: ${fetchResponse.status} - ${await fetchResponse.text()}`);
    }

    const apiResult = await fetchResponse.json();
    res.status(200).json(apiResult);
  } catch(error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
}
