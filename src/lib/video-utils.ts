/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Dans un environnement de production, vous devriez héberger ces fichiers
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export async function generateThumbnailHTML5(file: File): Promise<string> {
  // vibe: L'extraction locale HTML5 est 100% hors-ligne, ultra-rapide et n'a besoin d'aucun téléchargement réseau
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } else {
          reject(new Error('Could not get 2D context'));
        }
      } catch (err) {
        reject(err);
      } finally {
        cleanup();
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Video loading failed for local thumbnail'));
    };
  });
}

export async function generateThumbnail(file: File): Promise<string> {
  // vibe: Si l'appareil est hors ligne, on évite directement de lancer un fetch réseau vers unpkg pour charger ffmpeg-core
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await generateThumbnailHTML5(file);
  }

  try {
    const ffmpeg = await getFFmpeg();
    const name = 'input.mp4';
    await ffmpeg.writeFile(name, await fetchFile(file));
    
    await ffmpeg.exec(['-i', name, '-ss', '00:00:01', '-vframes', '1', 'out.jpg']);
    
    const data = await ffmpeg.readFile('out.jpg');
    const blob = new Blob([data], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn("FFmpeg failed or offline. Falling back to HTML5...", error);
    return await generateThumbnailHTML5(file);
  }
}
