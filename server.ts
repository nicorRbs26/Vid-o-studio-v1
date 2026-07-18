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

function getAiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
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
    const { prompt, model = 'gemini-3.5-flash', apiKey, apiKeyMode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Un prompt est requis.' });
    }

    if (apiKeyMode === 'none') {
      const scriptSimulated = `[SCÉNARIO SIMULÉ - MODE SANS CLÉ API]
      
SCÈNE 1 - INTRODUCTION (0s - 4s)
[Plan : Prise de vue stable, tons chauds]
NARRATEUR : Bienvenue dans cette vidéo dédiée à : "${prompt.substring(0, 70)}".

SCÈNE 2 - ANALYSE (4s - 12s)
[Plan : Zoom lent progressif et inserts graphiques]
NARRATEUR : Pour réussir ce projet, nous mettons l'accent sur la structure, l'esthétique sonore et le rythme visuel de chaque calque.

SCÈNE 3 - CONCLUSION (12s - 15s)
[Plan : Fondu au noir, logo central et texte]
NARRATEUR : Suivez ces étapes simples pour donner vie à vos idées !`;
      return res.json({ text: scriptSimulated });
    }

    const ai = getAiClient(apiKey);
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
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée. Veuillez fournir votre clé perso ou utiliser le mode sans clé.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 3. Ultra-realistic Text-To-Speech (gemini-3.1-flash-tts-preview)
app.post('/api/gemini/generate-tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr', apiKey, apiKeyMode } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Le texte est requis.' });
    }

    if (apiKeyMode === 'none') {
      const sampleRate = 24000;
      const durationSec = 3.0;
      const numSamples = sampleRate * durationSec;
      const pcmBuffer = Buffer.alloc(numSamples * 2);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 349.23 * (1 + Math.floor(t * 3) * 0.25); // F major chord progression steps
        const value = Math.sin(2 * Math.PI * freq * t) * Math.exp(-2.5 * t) * 0.5;
        const pcmValue = Math.floor(value * 32767);
        pcmBuffer.writeInt16LE(pcmValue, i * 2);
      }
      const wavBuffer = pcmToWav(pcmBuffer, sampleRate);
      const playableBase64 = wavBuffer.toString('base64');
      return res.json({
        audioUrl: `data:audio/wav;base64,${playableBase64}`,
        voiceUsed: `${voice} (Simulé)`,
        durationEstimation: Math.ceil(pcmBuffer.length / (24000 * 2))
      });
    }

    const ai = getAiClient(apiKey);
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
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée. Veuillez fournir votre clé perso ou utiliser le mode sans clé.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 4. AI Image generator (gemini-3.1-flash-lite-image or gemini-3.1-flash-image)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.1-flash-lite-image', aspectRatio = '16:9', apiKey, apiKeyMode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Un prompt descriptif est requis.' });
    }

    const allowedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const selectedRatio = allowedRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    if (apiKeyMode === 'none') {
      const colors = ['#0f172a', '#1e1b4b', '#311042', '#022c22', '#1c1917', '#172554'];
      const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
      const randomColor2 = colors[(Math.floor(Math.random() * colors.length) + 1) % colors.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${randomColor1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${randomColor2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <circle cx="640" cy="360" r="220" fill="#22d3ee" opacity="0.12" filter="blur(60px)" />
        <rect x="240" y="160" width="800" height="400" rx="20" fill="#000000" opacity="0.3" stroke="#ffffff" stroke-opacity="0.05" />
        <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-family="'Space Grotesk', sans-serif" font-size="36" font-weight="bold" opacity="0.95">${prompt.substring(0, 45)}</text>
        <text x="50%" y="54%" text-anchor="middle" fill="#22d3ee" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="bold" letter-spacing="2" opacity="0.8">IMAGE SIMULÉE SANS CLÉ API</text>
      </svg>`;
      const base64Image = Buffer.from(svg).toString('base64');
      return res.json({
        imageUrl: `data:image/svg+xml;base64,${base64Image}`,
        aspectRatio: selectedRatio,
        modelUsed: `${model} (Simulé)`
      });
    }

    const ai = getAiClient(apiKey);

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
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée. Veuillez fournir votre clé perso ou utiliser le mode sans clé.' });
    } else {
      res.status(500).json({ error: err.message || 'Une erreur inconnue est survenue.' });
    }
  }
});

// 5. AI Music generator (lyria-3-clip-preview or lyria-3-pro-preview)
app.post('/api/gemini/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview', apiKey, apiKeyMode } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt musical est requis.' });
    }

    if (apiKeyMode === 'none') {
      const sampleRate = 16000;
      const durationSec = 8.0;
      const numSamples = sampleRate * durationSec;
      const pcmBuffer = Buffer.alloc(numSamples * 2);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const lfo = 1 + 0.04 * Math.sin(2 * Math.PI * 0.15 * t);
        const f1 = 261.63 * lfo; // middle C detuned
        const f2 = 329.63 * lfo; // E
        const f3 = 392.00 * lfo; // G
        const wave = Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t) + Math.sin(2 * Math.PI * f3 * t);
        const value = wave * 0.25 * Math.sin(Math.PI * (t / durationSec)); // Envelope fade in/out
        const pcmValue = Math.floor(value * 32767);
        pcmBuffer.writeInt16LE(pcmValue, i * 2);
      }
      const wavBuffer = pcmToWav(pcmBuffer, sampleRate);
      const playableBase64 = wavBuffer.toString('base64');
      return res.json({
        audioUrl: `data:audio/wav;base64,${playableBase64}`,
        modelUsed: `${model} (Simulé)`
      });
    }

    const ai = getAiClient(apiKey);

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
      res.status(401).json({ error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée. Veuillez fournir votre clé perso ou utiliser le mode sans clé.' });
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
