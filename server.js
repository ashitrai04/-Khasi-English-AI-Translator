import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load .env values
dotenv.config();

// Important: these are standard CommonJS/Express handlers masquerading as ES modules.
// Currently api/translate.js exports a Vercel default function like:
// export default async function handler(req, res) { ... }
// We can dynamically import them so express can run them locally!

async function serve() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Dynamically import the API handlers (which are ES modules)
  const translateHandler = (await import('./api/translate.js')).default;
  const adminLogsHandler = (await import('./api/admin_logs.js')).default;

  // Make them accessible locally exactly as they would be on Vercel
  app.post('/api/translate', (req, res) => translateHandler(req, res));
  app.post('/api/admin_logs', (req, res) => adminLogsHandler(req, res));

  // Serve Vite app in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 LOCAL SERVER RUNNING AT: http://localhost:${PORT}`);
    console.log(`==============================================\n`);
  });
}

serve().catch(err => console.error("Server creation error:", err));
