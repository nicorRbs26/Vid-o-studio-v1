/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize Google Gen AI client lazy-style to prevent immediate crash if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Simple pcm to wav converter for gemini-3.1-flash-tts-preview
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);
  // RIFF identifier
  wavBuffer.write('RIFF', 0);
  // File length
  wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  // RIFF type
  wavBuffer.write('WAVE', 8);
  // Format chunk identifier
  wavBuffer.write('fmt ', 12);
  // Format chunk length (16 for PCM)
  wavBuffer.writeUInt32LE(16, 16);
  // Sample format (uncompressed PCM = 1)
  wavBuffer.writeUInt16LE(1, 20);
  // Channel count (mono = 1)
  wavBuffer.writeUInt16LE(1, 22);
  // Sample rate
  wavBuffer.writeUInt32LE(sampleRate, 24);
  // Byte rate = (sampleRate * blockAlign)
  wavBuffer.writeUInt32LE(sampleRate * 2, 28);
  // Block align = (channelCount * bytesPerSample)
  wavBuffer.writeUInt16LE(2, 32);
  // Bits per sample = 16
  wavBuffer.writeUInt16LE(16, 34);
  // Data chunk identifier
  wavBuffer.write('data', 36);
  // Chunk length
  wavBuffer.writeUInt32LE(pcmBuffer.length, 40);
  // Copy PCM data
  pcmBuffer.copy(wavBuffer, 44);
  return wavBuffer;
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health check & configuration status
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    geminiApiKeyConfigured: hasKey,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 2. Text Script / Subtitle generator (e.g. gemini-3.5-flash)
app.post('/api/gemini/generate-script', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.5-flash' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Un prompt est requis.' });
    }

    const ai = getAiClient();
    const systemInstruction = "Tu es un assistant scénariste professionnel. Rédige un script court ou des sous-titres adaptés à un montage vidéo, sans fioritures techniques inutiles. Format de retour clair et concis.";

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || '';
    res.json({ text });
  } catch (err: any) {
    console.error('Error generating script:', err);
    if (err.message === 'GEMINI_API_KEY_MISSING') {
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée dans les paramètres de l\'application.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 3. Ultra-realistic Text-To-Speech (gemini-3.1-flash-tts-preview)
app.post('/api/gemini/generate-tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Le texte est requis.' });
    }

    const ai = getAiClient();
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const selectedVoice = allowedVoices.includes(voice) ? voice : 'Zephyr';

    // Call Gemini TTS model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!rawBase64) {
      return res.status(500).json({ error: 'Aucun flux audio généré par le modèle.' });
    }

    // Wrap the raw 16-bit PCM little-endian audio in a playable standard WAV container
    const pcmBuffer = Buffer.from(rawBase64, 'base64');
    const wavBuffer = pcmToWav(pcmBuffer, 24000); // sample rate is 24000Hz for gemini-3.1-flash-tts-preview
    const playableBase64 = wavBuffer.toString('base64');

    res.json({
      audioUrl: `data:audio/wav;base64,${playableBase64}`,
      voiceUsed: selectedVoice,
      durationEstimation: Math.ceil(pcmBuffer.length / (24000 * 2)) // 16-bit is 2 bytes per sample
    });
  } catch (err: any) {
    console.error('Error generating TTS:', err);
    if (err.message === 'GEMINI_API_KEY_MISSING') {
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée dans les paramètres de l\'application.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 4. AI Image generator (gemini-3.1-flash-lite-image or gemini-3.1-flash-image)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.1-flash-lite-image', aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Un prompt descriptif est requis.' });
    }

    const ai = getAiClient();

    // Mapping allowed aspect ratios for image configuration
    const allowedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const selectedRatio = allowedRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: selectedRatio as any,
          imageSize: '1K'
        }
      }
    });

    let base64Image = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      return res.status(500).json({ error: 'Le modèle n\'a retourné aucune image valide.' });
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`,
      aspectRatio: selectedRatio,
      modelUsed: model
    });
  } catch (err: any) {
    console.error('Error generating image:', err);
    if (err.message === 'GEMINI_API_KEY_MISSING') {
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée dans les paramètres de l\'application.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 5. AI Music generator (lyria-3-clip-preview or lyria-3-pro-preview)
app.post('/api/gemini/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt musical est requis.' });
    }

    const ai = getAiClient();

    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: {
        responseModalities: ['AUDIO']
      }
    });

    let audioBase64 = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: 'Le modèle de musique Lyria n\'a retourné aucun flux audio.' });
    }

    res.json({
      audioUrl: `data:${mimeType};base64,${audioBase64}`,
      modelUsed: model
    });
  } catch (err: any) {
    console.error('Error generating music:', err);
    if (err.message === 'GEMINI_API_KEY_MISSING') {
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée dans les paramètres de l\'application.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// -----------------------------------------------------------------------------
// VITE INTEGRATION & STATIC SERVING
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware mounted.');
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files serving enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
