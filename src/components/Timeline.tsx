/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TimelineClip, MediaAsset } from '../types';
import { formatTime, cn } from '../lib/utils';
import { Magnet } from 'lucide-react';

interface TimelineProps {
  clips: TimelineClip[];
  assets: MediaAsset[];
  currentTime: number;
  totalDuration: number;
  selectedClipId: string | null;
  onTimeChange: (time: number) => void;
  onUpdateClip: (clip: TimelineClip) => void;
  onSelectClip: (id: string | null) => void;
  t: any;
}

export default function Timeline({ clips, assets, currentTime, totalDuration, selectedClipId, onTimeChange, onUpdateClip, onSelectClip, t }: TimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMagnetEnabled, setIsMagnetEnabled] = React.useState(true);
  const scale = 100; // pixels per second
  const SNAP_THRESHOLD = 0.1; // seconds

  const handleTimelineClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.timeline-clip')) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    onTimeChange(x / scale);
  };

  const getSnapPoints = (excludeId: string) => {
    const points = [currentTime, 0];
    clips.forEach(c => {
      if (c.id !== excludeId) {
        points.push(c.startOffset);
        points.push(c.startOffset + c.duration);
      }
    });
    return Array.from(new Set(points));
  };

  const handleDrag = (clip: TimelineClip, newOffset: number) => {
    let finalOffset = Math.max(0, newOffset);
    
    if (isMagnetEnabled) {
      const snapPoints = getSnapPoints(clip.id);
      const clipEnd = finalOffset + clip.duration;
      
      let bestSnap = Infinity;
      let snapValue = finalOffset;

      snapPoints.forEach(p => {
        // Snap start
        if (Math.abs(finalOffset - p) < SNAP_THRESHOLD) {
          if (Math.abs(finalOffset - p) < bestSnap) {
            bestSnap = Math.abs(finalOffset - p);
            snapValue = p;
          }
        }
        // Snap end
        if (Math.abs(clipEnd - p) < SNAP_THRESHOLD) {
          if (Math.abs(clipEnd - p) < bestSnap) {
            bestSnap = Math.abs(clipEnd - p);
            snapValue = p - clip.duration;
          }
        }
      });
      
      finalOffset = snapValue;
    }

    if (finalOffset !== clip.startOffset) {
      onUpdateClip({ ...clip, startOffset: finalOffset });
    }
  };

  return (
    <div className="h-64 bg-app-bg border-t border-zinc-800 flex flex-col select-none relative">
      {/* Time Display Overlay & Magnet Toggle */}
      <div className="absolute left-4 top-2 z-[60] flex items-center gap-2">
        <div className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono border border-cyan-500/20 shadow-lg">
          {formatTime(currentTime)}
        </div>
        <button 
          onClick={() => setIsMagnetEnabled(!isMagnetEnabled)}
          className={cn(
            "p-1 rounded border transition-all",
            isMagnetEnabled ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
          )}
          title="Activer/Désactiver le magnétisme"
        >
          <Magnet className="w-3 h-3" />
        </button>
      </div>

      {/* Rulers */}
      <div className="h-8 border-b border-zinc-800 flex items-center bg-panel-bg relative overflow-hidden" onClick={handleTimelineClick} ref={containerRef}>
        <div style={{ width: `${Math.max(totalDuration * scale, 2000)}px`, position: 'relative', height: '100%' }}>
          {Array.from({ length: Math.ceil(totalDuration) + 10 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 bottom-0 border-l border-zinc-800/50 text-[9px] text-zinc-600 pl-1.5 pt-1 font-mono"
              style={{ left: `${i * scale}px` }}
            >
              {i}s
            </div>
          ))}
        </div>
      </div>

      {/* Tracks Container */}
      <div className="flex-1 overflow-auto relative bg-[#0c0c0e] timeline-track" onClick={handleTimelineClick}>
        <div 
          className="relative min-h-full p-4 space-y-1.5" 
          style={{ width: `${Math.max(totalDuration * scale, 2000)}px` }}
        >
          {/* Tracks Logic */}
          {[2, 1, 0].map(layer => (
            <div key={layer} className={cn(
              "h-12 bg-zinc-900/40 rounded flex items-center px-4 relative mb-1.5",
              layer === 2 ? "border-l-4 border-yellow-500/50" : 
              layer === 1 ? "border-l-4 border-cyan-500/50" : 
              "border-l-4 border-purple-500/50"
            )}>
              <span className="text-[9px] font-bold w-10 absolute left-[-48px] opacity-50 uppercase">
                {layer === 2 ? 'Sub' : layer === 1 ? 'Vid' : 'Aud'}
              </span>
              
              {clips.filter(c => c.layer === layer).map(clip => {
                const asset = assets.find(a => a.id === clip.assetId);
                return (
                  <motion.div 
                    key={clip.id}
                    drag="x"
                    dragMomentum={false}
                    dragElastic={0}
                    onDrag={(_, info) => {
                      const deltaX = info.delta.x / scale;
                      handleDrag(clip, clip.startOffset + deltaX);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    className={cn(
                      "timeline-clip absolute top-1 bottom-1 rounded px-2 text-[9px] flex items-center truncate cursor-grab active:cursor-grabbing z-10 border transition-all",
                      selectedClipId === clip.id ? "ring-2 ring-white border-transparent z-20" : "border-opacity-40",
                      clip.type === 'text' ? "bg-yellow-500/20 border-yellow-500 text-yellow-200" :
                      clip.type === 'video' ? "bg-cyan-500/20 border-cyan-500 text-cyan-200" :
                      "bg-purple-500/20 border-purple-500 text-purple-200"
                    )}
                    style={{ left: `${clip.startOffset * scale}px`, width: `${clip.duration * scale}px` }}
                  >
                    {clip.type === 'audio' && (
                      <div className="flex items-center gap-0.5 opacity-50 mr-2">
                        {[...Array(6)].map((_, i) => <div key={i} className="w-0.5 bg-purple-400" style={{ height: `${20 + Math.random() * 20}%` }} />)}
                      </div>
                    )}
                    <span className="truncate">{clip.text || asset?.name || 'Clip'}</span>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-white z-[100] pointer-events-none"
            style={{ left: `${currentTime * scale}px` }}
          >
            <div className="w-3 h-3 bg-white rotate-45 -translate-x-1.5 absolute -top-1 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap shadow-xl border border-white/20">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="h-6 border-t border-zinc-800 flex items-center px-4 justify-end gap-4 bg-panel-bg text-[10px] text-zinc-500 font-medium">
        <button className="hover:text-white transition-colors">{t.zoomOut}</button>
        <button className="hover:text-white transition-colors">{t.zoomIn}</button>
      </div>
    </div>
  );
}
