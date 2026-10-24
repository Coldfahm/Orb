import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI with recommended telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Gemini Assistant Endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are Orb, a super-intelligent, hyper-compact desktop assistant widget. Keep answers crisp, direct, and under 25 words so they fit perfectly in a compact desktop pill interface. No markdown bloat.',
      },
    });

    res.json({ text: response.text || 'Processed.' });
  } catch (error: any) {
    console.error('[Orb Gemini Server Error]:', error);
    res.status(500).json({
      error: error.message || 'Gemini service error',
      fallback: 'Orb is ready. What would you like to compute or open?',
    });
  }
});

// Mount Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Orb Desktop Assistant] Server active on port ${PORT}`);
  });
}

startServer();
