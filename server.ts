import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit for base64 audio chunks
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health / Status endpoint
app.get('/api/status', (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasServerKey: hasEnvKey,
    recommendedModel: 'gemini-2.5-flash',
    alternativeModel: 'gemini-3.8-flash',
    timestamp: new Date().toISOString()
  });
});

// Translation API endpoint
app.post('/api/translate-audio', async (req, res) => {
  const startTime = Date.now();
  try {
    const { audioBase64, mimeType = 'audio/webm', targetLanguage = 'Spanish', modelName = 'gemini-2.5-flash', context = '' } = req.body;

    // Check for client-provided BYOK key or fallback to environment variable
    const clientKey = req.headers['x-gemini-api-key'] as string | undefined;
    const apiKey = (clientKey && clientKey.trim() !== '') ? clientKey.trim() : process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(401).json({
        error: 'No Gemini API key available. Please configure GEMINI_API_KEY in your environment or provide your own API key in Settings.',
        code: 'MISSING_API_KEY'
      });
    }

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body', code: 'MISSING_AUDIO' });
    }

    // Clean base64 string
    const cleanedBase64 = audioBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    // Initialize Google GenAI client with required header
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const targetLang = targetLanguage || 'Spanish';
    const systemPrompt = `You are an ultra-fast, low-latency live subtitle engine.
Analyze the provided audio input. Detect the spoken language and translate it directly into ${targetLang}.
${context ? `Previous subtitle context for continuity: "${context}"` : ''}
Output strictly in valid JSON format matching this schema:
{
  "original_transcript": "the detected sentence or words",
  "detected_language": "source language name",
  "translated_text": "the translated subtitle sentence"
}
If the audio is silent, background noise without clear human speech, or unintelligible, return:
{
  "original_transcript": "",
  "detected_language": "Unknown",
  "translated_text": ""
}
Do not include markdown code fences or conversational filler. Return only raw JSON.`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0] || 'audio/webm',
        data: cleanedBase64,
      },
    };

    const textPart = {
      text: `Transcribe and translate this live audio slice into ${targetLang}.`,
    };

    const targetModel = modelName || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original_transcript: {
              type: Type.STRING,
              description: 'The detected sentence or words in source speech',
            },
            detected_language: {
              type: Type.STRING,
              description: 'The detected source language name',
            },
            translated_text: {
              type: Type.STRING,
              description: 'The translated subtitle sentence in target language',
            },
          },
          required: ['original_transcript', 'detected_language', 'translated_text'],
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text ? response.text.trim() : '{}';
    let parsedData = {
      original_transcript: '',
      detected_language: 'Unknown',
      translated_text: '',
    };

    try {
      parsedData = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Failed to parse model JSON directly, attempting fallback cleanup:', rawText);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    return res.json({
      success: true,
      original_transcript: parsedData.original_transcript || '',
      detected_language: parsedData.detected_language || 'Auto',
      translated_text: parsedData.translated_text || '',
      latency_ms: latencyMs,
      model: targetModel,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/translate-audio:', err);
    const errorMessage = err?.message || 'Gemini audio translation failed';
    const status = err?.status || 500;
    return res.status(status).json({
      error: errorMessage,
      latency_ms: latencyMs,
      success: false,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SubLive AI Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer();
