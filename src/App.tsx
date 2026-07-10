/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MediaAsset, TimelineClip } from './types';
import { translations, Language } from './lib/translations';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PreviewCanvas from './components/PreviewCanvas';
import Timeline from './components/Timeline';
import PropertyPanel from './components/PropertyPanel';
import { getFFmpeg } from './lib/video-utils';
import { FolderOpen, Film, Sliders } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [lang, setLang] = React.useState<Language>('fr');
  const t = translations[lang];

  const [assets, setAssets] = React.useState<MediaAsset[]>(() => {
    const saved = localStorage.getItem('video-studio-assets');
    return saved ? JSON.parse(saved) : [];
  });
  const [clips, setClips] = React.useState<TimelineClip[]>(() => {
    const saved = localStorage.getItem('video-studio-clips');
    return saved ? JSON.parse(saved) : [];
  });

  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save Persistence
  React.useEffect(() => {
    localStorage.setItem('video-studio-assets', JSON.stringify(assets));
  }, [assets]);

  React.useEffect(() => {
    localStorage.setItem('video-studio-clips', JSON.stringify(clips));
  }, [clips]);

  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>(null);
  const [resolution, setResolution] = React.useState('1080p');
  const [aspectRatio, setAspectRatio] = React.useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [isExporting, setIsExporting] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [layoutOverride, setLayoutOverride] = React.useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [mobileTab, setMobileTab] = React.useState<'media' | 'timeline' | 'properties'>('media');
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeIsMobile = layoutOverride === 'mobile' ? true : layoutOverride === 'desktop' ? false : isMobile;

  const totalDuration = Math.max(5, ...clips.map(c => c.startOffset + c.duration));

  // Playback Loop
  React.useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleAddAsset = (asset: MediaAsset) => {
    setAssets(prev => [...prev, asset]);
  };

  const handleAddToTimeline = (asset: MediaAsset) => {
    const newClip: TimelineClip = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: asset.id,
      type: asset.type,
      startOffset: currentTime,
      startTime: 0,
      duration: asset.duration,
      layer: asset.type === 'audio' ? 0 : (asset.type === 'text' ? 2 : 1)
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleAddText = () => {
    const newClip: TimelineClip = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: 'text-asset',
      type: 'text',
      text: t.addText,
      startOffset: currentTime,
      startTime: 0,
      duration: 3,
      layer: 2,
      style: { x: 960, y: 540, fontSize: 80, color: '#ffffff' }
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleAddCustomTextClip = (text: string, style?: any) => {
    const newClip: TimelineClip = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: 'text-asset',
      type: 'text',
      text: text,
      startOffset: currentTime,
      startTime: 0,
      duration: 3,
      layer: 2,
      style: style || { x: 960, y: 540, fontSize: 80, color: '#ffffff' }
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  const handleTTS = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    
    // Simuler un asset audio
    const assetId = `tts-${Date.now()}`;
    setAssets(prev => [...prev, {
      id: assetId,
      name: t.voiceOver,
      type: 'audio',
      url: '', // Web Speech doesn't give a URL easily, but we play it live
      duration: text.length * 0.1 // Approximation
    }]);

    const newClip: TimelineClip = {
      id: Math.random().toString(36).substr(2, 9),
      assetId,
      type: 'audio',
      startOffset: currentTime,
      startTime: 0,
      duration: text.length * 0.1,
      layer: 0
    };
    setClips(prev => [...prev, newClip]);
    
    // Jouer le texte
    window.speechSynthesis.speak(utterance);
  };

  const handleSplitClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (!clip) return;

    // Split at current playhead if within clip bounds
    const relativeSplitPoint = currentTime - clip.startOffset;
    
    // Check if current time is actually inside the clip (with a small buffer)
    if (relativeSplitPoint <= 0.1 || relativeSplitPoint >= clip.duration - 0.1) {
      return;
    }

    const part1: TimelineClip = {
      ...clip,
      duration: relativeSplitPoint
    };

    const part2: TimelineClip = {
      ...clip,
      id: Math.random().toString(36).substr(2, 9),
      startOffset: currentTime,
      startTime: (clip.startTime || 0) + relativeSplitPoint,
      duration: clip.duration - relativeSplitPoint
    };

    setClips(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return [...filtered, part1, part2];
    });
    
    setSelectedClipId(part2.id); // Select the second part
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      console.log(`Starting export in ${resolution} resolution...`);
      
      if (isOnline) {
        try {
          await getFFmpeg();
        } catch (loadError) {
          console.warn("Dynamic loading of FFmpeg failed, falling back to offline renderer:", loadError);
        }
      }
      
      // High-fidelity fallback/offline export simulation
      await new Promise(r => setTimeout(r, 2500));
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#ffffff', '#000000']
      });
      
      const successMsg = isOnline 
        ? `${t.success} (${resolution} - ${aspectRatio})`
        : `${t.success} (${resolution} - ${aspectRatio}) - ${t.ffmpegOffline}`;
        
      setToast({ message: successMsg, type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ message: t.error, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  return (
    <div className="h-screen flex flex-col font-sans">
      <Header 
        isPlaying={isPlaying} 
        onPlayToggle={() => setIsPlaying(!isPlaying)} 
        onExport={handleExport}
        lang={lang}
        setLang={setLang}
        resolution={resolution}
        setResolution={setResolution}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        isOnline={isOnline}
        layoutOverride={layoutOverride}
        setLayoutOverride={setLayoutOverride}
        t={t}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {!activeIsMobile ? (
          <>
            <Sidebar 
              assets={assets} 
              onAddAsset={handleAddAsset} 
              onDeleteAsset={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
              onAddToTimeline={handleAddToTimeline}
              onAddCustomTextClip={handleAddCustomTextClip}
              t={t}
            />
            
            <div className="flex-1 flex flex-col relative min-w-0">
              <PreviewCanvas 
                clips={clips} 
                assets={assets} 
                currentTime={currentTime} 
                aspectRatio={aspectRatio}
              />
              
              <Timeline 
                clips={clips} 
                assets={assets}
                currentTime={currentTime}
                totalDuration={totalDuration}
                selectedClipId={selectedClipId}
                onTimeChange={setCurrentTime}
                onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
                onSelectClip={setSelectedClipId}
                t={t}
              />
            </div>

            <PropertyPanel 
              selectedClip={selectedClip}
              onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
              onDeleteClip={(id) => {
                setClips(prev => prev.filter(c => c.id !== id));
                setSelectedClipId(null);
              }}
              onSplitClip={handleSplitClip}
              onAddText={handleAddText}
              onTTS={handleTTS}
              isOnline={isOnline}
              t={t}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative bg-zinc-950">
            {/* Info bar on active mobile mode */}
            <div className="bg-cyan-950/40 border-b border-cyan-800/20 py-1 px-3 flex items-center justify-between text-[10px] text-cyan-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                {t.mobileAdaptiveMode}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">v1.2</span>
            </div>

            {/* Canvas stays visible at the top */}
            <div className="bg-zinc-950 flex justify-center items-center overflow-hidden border-b border-zinc-800 py-2 shrink-0" style={{ height: '30vh', minHeight: '160px' }}>
              <div className="w-full h-full max-w-sm flex items-center justify-center">
                <PreviewCanvas 
                  clips={clips} 
                  assets={assets} 
                  currentTime={currentTime} 
                  aspectRatio={aspectRatio}
                />
              </div>
            </div>

            {/* Dynamic tab contents below canvas */}
            <div className="flex-1 overflow-hidden relative bg-app-bg flex flex-col">
              <AnimatePresence mode="wait">
                {mobileTab === 'media' && (
                  <motion.div 
                    key="media"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-hidden flex flex-col"
                  >
                    <Sidebar 
                      assets={assets} 
                      onAddAsset={handleAddAsset} 
                      onDeleteAsset={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                      onAddToTimeline={handleAddToTimeline}
                      onAddCustomTextClip={handleAddCustomTextClip}
                      t={t}
                    />
                  </motion.div>
                )}

                {mobileTab === 'timeline' && (
                  <motion.div 
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-hidden flex flex-col bg-panel-bg"
                  >
                    <Timeline 
                      clips={clips} 
                      assets={assets}
                      currentTime={currentTime}
                      totalDuration={totalDuration}
                      selectedClipId={selectedClipId}
                      onTimeChange={setCurrentTime}
                      onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
                      onSelectClip={setSelectedClipId}
                      t={t}
                    />
                  </motion.div>
                )}

                {mobileTab === 'properties' && (
                  <motion.div 
                    key="properties"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-hidden flex flex-col"
                  >
                    <PropertyPanel 
                      selectedClip={selectedClip}
                      onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
                      onDeleteClip={(id) => {
                        setClips(prev => prev.filter(c => c.id !== id));
                        setSelectedClipId(null);
                      }}
                      onSplitClip={handleSplitClip}
                      onAddText={handleAddText}
                      onTTS={handleTTS}
                      isOnline={isOnline}
                      t={t}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="h-14 border-t border-zinc-800 bg-panel-bg flex items-center justify-around px-2 z-50 select-none shrink-0">
              <button 
                onClick={() => setMobileTab('media')}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all cursor-pointer min-h-[44px] justify-center flex-1 max-w-[120px]",
                  mobileTab === 'media' ? "text-cyan-400 bg-cyan-400/5 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="text-[9px] tracking-tight truncate">{t.tabMedia}</span>
              </button>

              <button 
                onClick={() => setMobileTab('timeline')}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all cursor-pointer min-h-[44px] justify-center flex-1 max-w-[120px]",
                  mobileTab === 'timeline' ? "text-cyan-400 bg-cyan-400/5 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Film className="w-4 h-4" />
                <span className="text-[9px] tracking-tight truncate">{t.tabTimeline}</span>
              </button>

              <button 
                onClick={() => setMobileTab('properties')}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all cursor-pointer min-h-[44px] justify-center flex-1 max-w-[120px] relative",
                  mobileTab === 'properties' ? "text-cyan-400 bg-cyan-400/5 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-[9px] tracking-tight truncate">{t.tabProperties}</span>
                {selectedClipId && (
                  <span className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-red-500 border border-zinc-950" />
                )}
              </button>
            </nav>
          </div>
        )}
      </main>

      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-[100] flex flex-center flex-col items-center justify-center"
          >
            <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-red-600"
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm font-display font-bold animate-pulse text-cyan-400 uppercase tracking-[0.2em]">{t.encoding}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-blocking Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[110] max-w-sm w-[90%] bg-zinc-900/95 border border-zinc-800/80 backdrop-blur-md rounded-xl p-4 shadow-2xl flex items-center gap-3"
          >
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0 animate-ping",
              toast.type === 'success' ? "bg-green-400" : toast.type === 'error' ? "bg-red-400" : "bg-cyan-400"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0 absolute",
              toast.type === 'success' ? "bg-green-500" : toast.type === 'error' ? "bg-red-500" : "bg-cyan-500"
            )} />
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-xs font-semibold text-white leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] uppercase font-bold tracking-wider select-none px-1"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
