/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimelineClip, MediaAsset } from '../types';

interface PreviewCanvasProps {
  clips: TimelineClip[];
  assets: MediaAsset[];
  currentTime: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
}

export default function PreviewCanvas({ clips, assets, currentTime, aspectRatio }: PreviewCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const videoRefs = React.useRef<Record<string, HTMLVideoElement>>({});
  const imageRefs = React.useRef<Record<string, HTMLImageElement>>({});

  let canvasWidth = 1920;
  let canvasHeight = 1080;
  if (aspectRatio === '9:16') {
    canvasWidth = 1080;
    canvasHeight = 1920;
  } else if (aspectRatio === '1:1') {
    canvasWidth = 1080;
    canvasHeight = 1080;
  } else if (aspectRatio === '4:5') {
    canvasWidth = 1080;
    canvasHeight = 1350;
  }

  // Sync canvas with time
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Filter clips active at currentTime
      const activeClips = clips
        .filter(c => currentTime >= c.startOffset && currentTime <= c.startOffset + c.duration)
        .sort((a, b) => a.layer - b.layer);

      activeClips.forEach(clip => {
        const asset = assets.find(a => a.id === clip.assetId);
        if (!asset) return;

        const assetTime = currentTime - clip.startOffset + clip.startTime;
        
        // Transition logic
        const transitionDuration = clip.transitionDuration || 0.5;
        const timeInClip = currentTime - clip.startOffset;
        let opacity = 1;
        let offsetX = 0;

        if (clip.transitionIn && clip.transitionIn !== 'none' && timeInClip < transitionDuration) {
          const progress = timeInClip / transitionDuration;
          if (clip.transitionIn === 'fade') {
            opacity = progress;
          } else if (clip.transitionIn === 'slide-left') {
            offsetX = canvas.width * (1 - progress);
          } else if (clip.transitionIn === 'slide-right') {
            offsetX = -canvas.width * (1 - progress);
          }
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(offsetX, 0);
        
        if (clip.filter && clip.filter !== 'none') {
          ctx.filter = clip.filter;
        }

        if (clip.type === 'video') {
          let video = videoRefs.current[clip.id];
          if (!video) {
            video = document.createElement('video');
            video.src = asset.url;
            video.muted = true;
            videoRefs.current[clip.id] = video;
          }
          
          if (Math.abs(video.currentTime - assetTime) > 0.1) {
            video.currentTime = assetTime;
          }
          
          // Render with cover aspect ratio scaling to fit beautifully without squishing
          const videoWidth = video.videoWidth || 1920;
          const videoHeight = video.videoHeight || 1080;
          const imgRatio = videoWidth / videoHeight;
          const canvasRatio = canvas.width / canvas.height;
          
          let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
          if (imgRatio > canvasRatio) {
            sWidth = videoHeight * canvasRatio;
            sx = (videoWidth - sWidth) / 2;
          } else {
            sHeight = videoWidth / canvasRatio;
            sy = (videoHeight - sHeight) / 2;
          }
          ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

        } else if (clip.type === 'image') {
          // vibe: Instancier `new Image()` à chaque rendu du canvas (60 fois par seconde pendant la lecture) recrée inutilement des objets,
          // provoque des surcharges mémoire importantes (Garbage Collection) et cause des clignotements visuels (flickering) dus à des
          // conditions de concurrence (race conditions) asynchrones. La mise en cache via `imageRefs` règle ce problème.
          let img = imageRefs.current[clip.id];
          if (!img) {
            img = new Image();
            img.src = asset.url;
            imageRefs.current[clip.id] = img;
          }

          const drawImg = () => {
            const imgWidth = img.naturalWidth || 1920;
            const imgHeight = img.naturalHeight || 1080;
            const imgRatio = imgWidth / imgHeight;
            const canvasRatio = canvas.width / canvas.height;
            
            let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;
            if (imgRatio > canvasRatio) {
              sWidth = imgHeight * canvasRatio;
              sx = (imgWidth - sWidth) / 2;
            } else {
              sHeight = imgWidth / canvasRatio;
              sy = (imgHeight - sHeight) / 2;
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          };

          if (img.complete) {
            drawImg();
          } else {
            img.onload = () => {
              // vibe: Le chargement asynchrone d'une image peut se terminer après que la tête de lecture ait déjà avancé vers un autre clip.
              // En redéclenchant un render global plutôt que d'écrire directement sur le canvas, nous garantissons que l'affichage
              // respecte l'état courant et ordonné des calques.
              render();
            };
          }

        } else if (clip.type === 'text') {
          ctx.fillStyle = clip.style?.color || '#fff';
          const fontSize = clip.style?.fontSize || 40;
          ctx.font = `bold ${fontSize}px Outfit, Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Map standard 1920x1080 template coordinates to actual dynamic canvas dimensions
          const x = clip.style?.x !== undefined ? (clip.style.x / 1920) * canvas.width : canvas.width / 2;
          const y = clip.style?.y !== undefined ? (clip.style.y / 1080) * canvas.height : canvas.height / 2;
          
          ctx.fillText(clip.text || '', x, y);
        }

        ctx.restore();
      });
    };

    render();
  }, [currentTime, clips, assets, aspectRatio]);

  const getContainerStyles = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] h-full max-h-[500px] w-auto';
      case '1:1':
        return 'aspect-square h-full max-h-[460px] w-auto';
      case '4:5':
        return 'aspect-[4/5] h-full max-h-[460px] w-auto';
      case '16:9':
      default:
        return 'aspect-[16/9] w-full max-w-4xl h-auto';
    }
  };

  return (
    <div className="flex-1 bg-preview-bg relative flex items-center justify-center p-8 overflow-hidden">
      <div className={cn("relative shadow-2xl shadow-black bg-black border border-zinc-800 rounded-sm overflow-hidden transition-all duration-300", getContainerStyles())}>
        <canvas 
          ref={canvasRef} 
          width={canvasWidth} 
          height={canvasHeight} 
          className="w-full h-full object-contain"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-zinc-500 border border-zinc-800/50">
          LIVE PREVIEW | {aspectRatio}
        </div>
        
        {/* Mock Subtitle Preview if active */}
        <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 opacity-0 animate-in fade-in slide-in-from-bottom-2">
             {/* Text would be rendered on canvas, this is just for UI polish */}
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
