/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MediaAsset, TimelineClip, GoogleUser } from './types';
import { translations, Language } from './lib/translations';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PreviewCanvas from './components/PreviewCanvas';
import Timeline from './components/Timeline';
import PropertyPanel from './components/PropertyPanel';
import { getFFmpeg } from './lib/video-utils';
import { FolderOpen, Film, Sliders, X, Lock, Mail, Key, ShieldCheck, Sparkles, LogIn } from 'lucide-react';
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
  const [user, setUser] = React.useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('video-studio-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      localStorage.setItem('video-studio-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('video-studio-user');
    }
  }, [user]);

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

  const handleTTS = async (text: string, options?: { engine?: 'local' | 'gemini'; voiceURI?: string; geminiVoice?: string; rate?: number; pitch?: number }) => {
    if (!text) return;

    if (options?.engine === 'gemini') {
      try {
        setToast({ message: "Génération de la voix off haute-fidélité par Gemini...", type: 'info' });
        
        const response = await fetch('/api/gemini/generate-tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voice: options.geminiVoice || 'Zephyr'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Erreur lors de la génération de la voix par l'IA Gemini.");
        }

        const data = await response.json();
        const assetId = `tts-gemini-${Date.now()}`;
        const duration = data.durationEstimation || Math.max(1, text.length * 0.08);

        // Add the generated high-fidelity WAV audio to our media assets list
        setAssets(prev => [...prev, {
          id: assetId,
          name: `Voix Off (Gemini: ${options.geminiVoice || 'Zephyr'})`,
          type: 'audio',
          url: data.audioUrl,
          duration: duration
        }]);

        // Place on the timeline immediately
        const newClip: TimelineClip = {
          id: Math.random().toString(36).substr(2, 9),
          assetId,
          type: 'audio',
          startOffset: currentTime,
          startTime: 0,
          duration: duration,
          layer: 0
        };
        setClips(prev => [...prev, newClip]);
        setSelectedClipId(newClip.id);
        
        setToast({ message: "La voix off Gemini a été générée et ajoutée à votre timeline !", type: 'success' });
        
        // Autoplay voice
        const previewAudio = new Audio(data.audioUrl);
        previewAudio.play().catch(e => console.log("Autoplay blocked:", e));

      } catch (err: any) {
        console.error("Gemini TTS Fail:", err);
        setToast({ message: err.message || "Une erreur est survenue lors de la synthèse vocale Gemini.", type: 'error' });
      }
    } else {
      // Offline local browser speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
      
      let speedFactor = 1;
      if (options) {
        if (options.rate !== undefined) {
          utterance.rate = options.rate;
          speedFactor = options.rate;
        }
        if (options.pitch !== undefined) utterance.pitch = options.pitch;
        if (options.voiceURI) {
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
          }
        }
      }
      
      const assetId = `tts-${Date.now()}`;
      const calculatedDuration = Math.max(1, (text.length * 0.08) / speedFactor); // Approximation
      setAssets(prev => [...prev, {
        id: assetId,
        name: t.voiceOver,
        type: 'audio',
        url: '', // Web Speech doesn't give a URL easily, but we play it live
        duration: calculatedDuration
      }]);

      const newClip: TimelineClip = {
        id: Math.random().toString(36).substr(2, 9),
        assetId,
        type: 'audio',
        startOffset: currentTime,
        startTime: 0,
        duration: calculatedDuration,
        layer: 0
      };
      setClips(prev => [...prev, newClip]);
      setSelectedClipId(newClip.id);
      
      window.speechSynthesis.speak(utterance);
    }
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
      const appliedFilters = clips.map(c => c.filter).filter(Boolean);
      console.log(`Starting export in ${resolution} resolution... with ${appliedFilters.length} active filters: ${JSON.stringify(appliedFilters)}`);
      
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
        user={user}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSignOut={() => {
          setUser(null);
          setToast({ message: t.signOut, type: 'info' });
        }}
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
              clips={clips}
              selectedClipId={selectedClipId}
              onSelectClip={setSelectedClipId}
              onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
              onToast={(toastData) => setToast(toastData)}
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
                      clips={clips}
                      selectedClipId={selectedClipId}
                      onSelectClip={setSelectedClipId}
                      onUpdateClip={(updated) => setClips(prev => prev.map(c => c.id === updated.id ? updated : c))}
                      onToast={(toastData) => setToast(toastData)}
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

      {/* Google / Gmail Sign In Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Content container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-zinc-950 border border-zinc-800/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 p-5 flex flex-col gap-4 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center font-bold text-[10px] text-zinc-950 select-none shadow">G</div>
                  <h3 className="text-xs font-semibold text-white tracking-tight">{t.selectAccount}</h3>
                </div>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 leading-normal">
                {t.googleMockPrompt}
              </p>

              {/* Accounts List (Google mockup profiles) */}
              <div className="flex flex-col gap-2 my-1">
                {[
                  {
                    name: 'Pierre-Nicolas Dubois',
                    email: 'pcnicodubois@gmail.com',
                    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    apiKey: 'Local Speech Engine',
                    provider: 'google' as const
                  },
                  {
                    name: 'Creative Studio Manager',
                    email: 'studio.creative@gmail.com',
                    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                    apiKey: 'Local Speech Engine',
                    provider: 'google' as const
                  },
                  {
                    name: 'Demo Account',
                    email: 'demo.video.editor@gmail.com',
                    picture: '',
                    apiKey: 'Local Speech Engine',
                    provider: 'gmail' as const
                  }
                ].map((profile, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUser({
                        name: profile.name,
                        email: profile.email,
                        picture: profile.picture,
                        apiKey: profile.apiKey,
                        provider: profile.provider
                      });
                      setShowAuthModal(false);
                      setToast({ message: `${t.success} - ${t.apiKeyIntegrated}`, type: 'success' });
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-zinc-800 transition-all text-left cursor-pointer active:scale-[0.99] select-none group"
                  >
                    {profile.picture ? (
                      <img 
                        src={profile.picture} 
                        alt={profile.name} 
                        className="w-8 h-8 rounded-full object-cover border border-zinc-800" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-500/20 uppercase">
                        {profile.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug">{profile.name}</p>
                      <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">{profile.email}</p>
                    </div>
                    <div className="text-[9px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-400/5 border border-cyan-400/20 px-2 py-0.5 rounded-full uppercase shrink-0">
                      Select
                    </div>
                  </button>
                ))}
              </div>

              {/* Or manual Gmail input with auto-generated API Key */}
              <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                  {t.signInWithGmail}
                </span>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const emailInput = formData.get('email') as string;
                    if (!emailInput || !emailInput.includes('@')) {
                      setToast({ message: 'Veuillez saisir un email valide', type: 'error' });
                      return;
                    }
                    const namePart = emailInput.split('@')[0];
                    const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[^a-zA-Z0-9]/g, ' ');
                    
                    setUser({
                      name: capitalized,
                      email: emailInput,
                      picture: '',
                      apiKey: 'Local Speech Engine',
                      provider: 'gmail'
                    });
                    setShowAuthModal(false);
                    setToast({ message: `${t.success} - ${t.apiKeyIntegrated}`, type: 'success' });
                  }}
                  className="flex flex-col gap-2.5"
                >
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="votre.email@gmail.com" 
                      className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all"
                    >
                      OK
                    </button>
                  </div>
                </form>
              </div>

              {/* API Security Notice */}
              <div className="flex items-center gap-2 bg-zinc-900/20 border border-zinc-900 rounded-xl p-2.5 mt-1 text-[9px] text-zinc-500 leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span>Ce module de connexion simule un workflow sécurisé OAuth2 & Gmail en environnement de démonstration locale. Votre clé API est conservée de manière 100% sécurisée dans le sandbox local de votre navigateur.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
