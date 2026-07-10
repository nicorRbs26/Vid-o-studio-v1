/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Video, Music, Image as ImageIcon, Type, Trash2, FolderOpen, Play, Volume2, Sparkles, Check } from 'lucide-react';
import { MediaAsset, TimelineClip } from '../types';
import { cn } from '../lib/utils';
import { generateThumbnail } from '../lib/video-utils';

interface SidebarProps {
  assets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (id: string) => void;
  onAddToTimeline: (asset: MediaAsset) => void;
  onAddCustomTextClip?: (text: string, style?: any) => void;
  t: any;
  clips?: TimelineClip[];
  selectedClipId?: string | null;
  onSelectClip?: (id: string | null) => void;
  onUpdateClip?: (clip: TimelineClip) => void;
}

const VIDEO_TEMPLATES = [
  {
    id: 'tpl-vid-cyberpunk',
    name: 'Cyberpunk Neon City',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-building-at-night-42171-large.mp4',
    duration: 10,
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=150&auto=format&fit=crop&q=60',
    description: 'Néon et rétro-futuriste'
  },
  {
    id: 'tpl-vid-forest',
    name: 'Cinematic Forest',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    duration: 8,
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&auto=format&fit=crop&q=60',
    description: 'Forêt paisible et rayons de soleil'
  },
  {
    id: 'tpl-vid-sunset',
    name: 'Sunset Ocean Waves',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-under-a-sunset-sky-40021-large.mp4',
    duration: 12,
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=60',
    description: 'Vagues douces au couché du soleil'
  },
  {
    id: 'tpl-vid-glitch',
    name: 'Vintage VHS Overlay',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-scratched-vintage-film-texture-34281-large.mp4',
    duration: 5,
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&auto=format&fit=crop&q=60',
    description: 'Texture rétro VHS analogique'
  }
];

const AUDIO_TEMPLATES = [
  {
    id: 'tpl-aud-synthwave',
    name: 'Synthwave Retro Beat',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 15,
    description: 'Beat rétro dynamique des années 80',
    synthPreset: 'synthwave'
  },
  {
    id: 'tpl-aud-ambient',
    name: 'Space Cosmic Pad',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 20,
    description: 'Nappe sonore spatiale immersive',
    synthPreset: 'ambient'
  },
  {
    id: 'tpl-aud-impact',
    name: 'Cinematic Sub Boom',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 4,
    description: 'Impact de basse profonde',
    synthPreset: 'impact'
  },
  {
    id: 'tpl-aud-beep',
    name: '8-Bit Retro Beep',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    duration: 2,
    description: 'Bruit de jeu vintage chiptune',
    synthPreset: 'beep'
  }
];

const TEXT_TEMPLATES = [
  {
    id: 'tpl-txt-cyberpunk',
    name: 'Cyberpunk Glow',
    text: 'NEON LIGHTS',
    style: { x: 960, y: 540, fontSize: 100, color: '#00ffff' },
    description: 'Néon rétro-futuriste cyan large'
  },
  {
    id: 'tpl-txt-subtitle',
    name: 'Minimalist Subtitle',
    text: 'Ceci est un sous-titre moderne...',
    style: { x: 960, y: 880, fontSize: 36, color: '#f3f4f6' },
    description: 'Sous-titre centré en bas'
  },
  {
    id: 'tpl-txt-serif',
    name: 'Elegant Editorial',
    text: 'The Art of Cinema',
    style: { x: 960, y: 540, fontSize: 75, color: '#ffedd5' },
    description: 'Style éditorial raffiné couleur ivoire'
  },
  {
    id: 'tpl-txt-impact',
    name: 'Championship Bold',
    text: 'VICTOIRE !',
    style: { x: 960, y: 540, fontSize: 120, color: '#eab308' },
    description: 'Jaune ultra large, gras et percutant'
  }
];

const IMAGE_TEMPLATES = [
  {
    id: 'tpl-img-nebula',
    name: 'Cosmic Nebula',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80',
    duration: 5,
    description: 'Nébuleuse cosmique violette et rose'
  },
  {
    id: 'tpl-img-grid',
    name: 'Retro Synth Grid',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    duration: 5,
    description: 'Perspective de grille néon 80s'
  },
  {
    id: 'tpl-img-pastel',
    name: 'Dreamy Sunset',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    duration: 5,
    description: 'Dégradé pastel doux de coucher de soleil'
  },
  {
    id: 'tpl-img-hud',
    name: 'Abstract Dark Wave',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    duration: 5,
    description: 'Vagues géométriques sombres minimalistes'
  }
];

function playSynthPreview(preset: string) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (preset === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (preset === 'impact') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } else if (preset === 'synthwave') {
      const notes = [130.81, 196.00, 220.00, 174.61];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime + idx * 0.25);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.25);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.25 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.25 + 0.24);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.25);
        osc.stop(ctx.currentTime + idx * 0.25 + 0.25);
      });
    } else if (preset === 'ambient') {
      const freqs = [196.00, 246.94, 293.66, 392.00];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq + (Math.random() * 2 - 1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
      });
    }
  } catch (err) {
    console.error('Web Audio failed:', err);
  }
}

export default function Sidebar({ assets, onAddAsset, onDeleteAsset, onAddToTimeline, onAddCustomTextClip, t, clips, selectedClipId, onSelectClip, onUpdateClip }: SidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'uploads' | 'video' | 'audio' | 'text' | 'image' | 'effects'>('uploads');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const getClipName = (clip: TimelineClip) => {
    const asset = assets.find(a => a.id === clip.assetId);
    if (asset) return asset.name;
    if (clip.type === 'text') return clip.text || 'Texte';
    return `${clip.type.toUpperCase()} Clip`;
  };

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    for (const file of acceptedFiles) {
      const type = file.type.startsWith('video') ? 'video' : 
                   file.type.startsWith('audio') ? 'audio' : 'image';
      
      let thumbnail: string | undefined;
      let duration = 0;

      if (type === 'video' || type === 'audio') {
        const url = URL.createObjectURL(file);
        const element = document.createElement(type);
        element.src = url;
        await new Promise((resolve) => {
          element.onloadedmetadata = () => {
            duration = element.duration;
            resolve(null);
          };
        });
        
        if (type === 'video') {
          try {
            thumbnail = await generateThumbnail(file);
          } catch (e) {
            console.error('Erreur thumbnail:', e);
          }
        }
      }

      onAddAsset({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type,
        url: URL.createObjectURL(file),
        duration: duration || 5, // Default 5s for images
        thumbnail
      });
    }
    setIsProcessing(false);
  }, [onAddAsset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    }
  } as any);

  return (
    <div className="flex h-full select-none">
      {/* Narrow Tool Rail */}
      <aside className="w-16 border-r border-zinc-800 bg-panel-bg flex flex-col items-center py-6 gap-6">
        <button 
          onClick={() => setActiveTab('uploads')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'uploads' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.uploads}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.uploads}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('video')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'video' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.videoTemplates}
        >
          <Video className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.videoTemplates}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('audio')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'audio' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.audioTemplates}
        >
          <Music className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.audioTemplates}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('text')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'text' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.textTemplates}
        >
          <Type className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.textTemplates}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('image')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'image' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.imageTemplates}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.imageTemplates}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('effects')}
          className={cn(
            "p-3 rounded-xl transition-all hover:scale-105 relative group",
            activeTab === 'effects' ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          )} 
          title={t.effects}
        >
          <Sparkles className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
            {t.effects}
          </span>
        </button>
      </aside>

      {/* Sidebar Panel Content */}
      <div className="flex-1 sm:w-64 sm:flex-initial border-r border-zinc-800 bg-app-bg flex flex-col h-full overflow-hidden">
        
        {/* Tab 1: Uploads */}
        {activeTab === 'uploads' && (
          <div className="flex flex-col h-full">
            <div className="p-4 flex flex-col border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{t.uploads}</span>
                <button 
                  {...getRootProps()}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors"
                  title="Ajouter un fichier"
                >
                  <input {...getInputProps()} />
                  <Plus className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
              <span className="text-[8px] text-zinc-600 mt-1 select-none">{t.mediaLocalOnly}</span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-4">
              <div 
                {...getRootProps()} 
                className={cn(
                  "border border-dashed border-zinc-800 rounded-lg p-4 text-center transition-all cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/30",
                  isDragActive && "border-cyan-500 bg-cyan-500/5",
                  isProcessing && "opacity-50 pointer-events-none"
                )}
              >
                <input {...getInputProps()} />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  {isProcessing ? t.processing : t.dropFiles}
                </p>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-[10px]">
                  Aucun média importé. Utilisez le bouton + ou glissez vos fichiers.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {assets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className="group relative bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-cyan-500/50 transition-all cursor-move shadow-sm"
                      onClick={() => onAddToTimeline(asset)}
                    >
                      <div className="aspect-square bg-black flex items-center justify-center">
                        {asset.thumbnail ? (
                          <img src={asset.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={asset.name} />
                        ) : (
                          asset.type === 'audio' ? <Music className="w-5 h-5 text-zinc-700" /> :
                          asset.type === 'image' ? <ImageIcon className="w-5 h-5 text-zinc-700" /> :
                          <Video className="w-5 h-5 text-zinc-700" />
                        )}
                        {asset.type !== 'image' && (
                          <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] font-mono">
                            {Math.floor(asset.duration)}s
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 truncate text-[9px] text-zinc-500 bg-zinc-900">
                        {asset.name}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Video Templates */}
        {activeTab === 'video' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.videoTemplates}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {VIDEO_TEMPLATES.map((tpl) => {
                const alreadyInProject = assets.some(a => a.id === tpl.id);
                return (
                  <div 
                    key={tpl.id}
                    className="p-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-cyan-500/30 hover:bg-zinc-900 transition-all flex flex-col gap-2 relative group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                      <img 
                        src={tpl.thumbnail} 
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity" 
                        alt={tpl.name}
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-300">
                        {tpl.duration}s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-zinc-200">{tpl.name}</span>
                      <span className="text-[8px] text-zinc-500 mt-0.5 leading-relaxed">{tpl.description}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const asset: MediaAsset = {
                          id: tpl.id,
                          name: tpl.name,
                          type: 'video',
                          url: tpl.url,
                          duration: tpl.duration,
                          thumbnail: tpl.thumbnail
                        };
                        if (!alreadyInProject) {
                          onAddAsset(asset);
                        }
                        onAddToTimeline(asset);
                      }}
                      className="w-full py-1 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addTemplate}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Audio Templates */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.audioTemplates}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {AUDIO_TEMPLATES.map((tpl) => {
                const alreadyInProject = assets.some(a => a.id === tpl.id);
                return (
                  <div 
                    key={tpl.id}
                    className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-cyan-500/30 hover:bg-zinc-900 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold text-zinc-200 truncate">{tpl.name}</span>
                        <span className="text-[8px] text-zinc-500 mt-0.5 leading-relaxed truncate">{tpl.description}</span>
                      </div>
                      <button 
                        onClick={() => playSynthPreview(tpl.synthPreset)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex-shrink-0"
                        title="Écouter l'aperçu synthétique"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const asset: MediaAsset = {
                          id: tpl.id,
                          name: tpl.name,
                          type: 'audio',
                          url: tpl.url,
                          duration: tpl.duration
                        };
                        if (!alreadyInProject) {
                          onAddAsset(asset);
                        }
                        onAddToTimeline(asset);
                      }}
                      className="w-full py-1 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addTemplate}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Text Templates */}
        {activeTab === 'text' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.textTemplates}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {TEXT_TEMPLATES.map((tpl) => (
                <div 
                  key={tpl.id}
                  className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-cyan-500/30 hover:bg-zinc-900 transition-all flex flex-col gap-2"
                >
                  <div className="h-14 bg-zinc-950/80 rounded border border-zinc-800/80 flex items-center justify-center overflow-hidden">
                    <span 
                      style={{ color: tpl.style.color, fontSize: '13px' }} 
                      className="font-bold tracking-tight text-center px-2 truncate"
                    >
                      {tpl.text}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-zinc-200">{tpl.name}</span>
                    <span className="text-[8px] text-zinc-500 mt-0.5 leading-relaxed">{tpl.description}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (onAddCustomTextClip) {
                        onAddCustomTextClip(tpl.text, tpl.style);
                      }
                    }}
                    className="w-full py-1 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t.addTemplate}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Image Templates */}
        {activeTab === 'image' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.imageTemplates}
              </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {IMAGE_TEMPLATES.map((tpl) => {
                const alreadyInProject = assets.some(a => a.id === tpl.id);
                return (
                  <div 
                    key={tpl.id}
                    className="p-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-cyan-500/30 hover:bg-zinc-900 transition-all flex flex-col gap-2 group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-zinc-800">
                      <img 
                        src={tpl.url} 
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity" 
                        alt={tpl.name}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-zinc-200">{tpl.name}</span>
                      <span className="text-[8px] text-zinc-500 mt-0.5 leading-relaxed">{tpl.description}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const asset: MediaAsset = {
                          id: tpl.id,
                          name: tpl.name,
                          type: 'image',
                          url: tpl.url,
                          duration: tpl.duration
                        };
                        if (!alreadyInProject) {
                           onAddAsset(asset);
                        }
                        onAddToTimeline(asset);
                      }}
                      className="w-full py-1 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/20 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addTemplate}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Effects & Filters */}
        {activeTab === 'effects' && (
          <div className="flex flex-col h-full select-none">
            <div className="p-4 border-b border-zinc-800/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.effectsTabTitle || 'Filtres & Effets'}
              </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-4">
              {/* Clip selection/info */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl flex flex-col gap-2.5">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{t.clipLabel || 'Clip :'}</span>
                
                {clips && clips.filter(c => c.type === 'video' || c.type === 'image').length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      value={selectedClipId || ''}
                      onChange={(e) => onSelectClip && onSelectClip(e.target.value || null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-zinc-300 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">-- {t.selectClip || 'Sélectionner un clip'} --</option>
                      {clips
                        .filter(c => c.type === 'video' || c.type === 'image')
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            [{c.type.toUpperCase()}] {getClipName(c)} ({Math.round(c.duration)}s)
                          </option>
                        ))
                      }
                    </select>

                    {selectedClipId && clips.find(c => c.id === selectedClipId) && (
                      <div className="text-[9px] text-zinc-400 bg-black/40 border border-zinc-800/50 rounded-lg p-2 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Type :</span>
                          <span className="font-semibold text-cyan-400 uppercase">{clips.find(c => c.id === selectedClipId)?.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Filtre actuel :</span>
                          <span className="font-mono text-zinc-400 truncate max-w-[120px]">{clips.find(c => c.id === selectedClipId)?.filter || 'Aucun'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 italic text-center py-2">
                    {t.noClipsAvailable || 'Aucun clip disponible sur la timeline.'}
                  </div>
                )}
              </div>

              {/* Grid of filters if a clip is selected */}
              {selectedClipId && clips && clips.find(c => c.id === selectedClipId) ? (
                <div className="space-y-3">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Filtres Disponibles</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: t.filterNone || 'Aucun', value: 'none', previewStyle: {} },
                      { name: t.filterGrayscale || 'Noir & Blanc', value: 'grayscale(100%)', previewStyle: { filter: 'grayscale(100%)' } },
                      { name: t.filterSepia || 'Sépia', value: 'sepia(100%)', previewStyle: { filter: 'sepia(100%)' } },
                      { name: t.filterContrast || 'Contraste +', value: 'contrast(160%)', previewStyle: { filter: 'contrast(160%)' } },
                      { name: t.filterBlur || 'Flou', value: 'blur(3px)', previewStyle: { filter: 'blur(3px)' } },
                      { name: t.filterInvert || 'Inverser', value: 'invert(100%)', previewStyle: { filter: 'invert(100%)' } },
                      { name: t.filterSaturate || 'Saturé', value: 'saturate(180%)', previewStyle: { filter: 'saturate(180%)' } },
                      { name: t.filterBrightness || 'Luminosité', value: 'brightness(140%)', previewStyle: { filter: 'brightness(140%)' } },
                      { name: 'Chaud (Warm)', value: 'sepia(40%) saturate(130%) contrast(110%)', previewStyle: { filter: 'sepia(40%) saturate(130%) contrast(110%)' } },
                      { name: 'Froid (Cool)', value: 'contrast(110%) hue-rotate(30deg) saturate(120%)', previewStyle: { filter: 'contrast(110%) hue-rotate(30deg) saturate(120%)' } }
                    ].map((f) => {
                      const currentClip = clips.find(c => c.id === selectedClipId);
                      const isApplied = currentClip && (currentClip.filter === f.value || (f.value === 'none' && !currentClip.filter));

                      return (
                        <button
                          key={f.value}
                          onClick={() => {
                            if (currentClip && onUpdateClip) {
                              onUpdateClip({
                                ...currentClip,
                                filter: f.value === 'none' ? undefined : f.value
                              });
                            }
                          }}
                          className={cn(
                            "group p-2 rounded-xl border bg-zinc-900/50 hover:bg-zinc-900/90 text-left transition-all flex flex-col gap-1.5 relative cursor-pointer overflow-hidden",
                            isApplied 
                              ? "border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10" 
                              : "border-zinc-800/60 hover:border-zinc-700"
                          )}
                        >
                          {/* Mini visual preview */}
                          <div className="w-full aspect-video rounded-md bg-zinc-950 overflow-hidden relative flex items-center justify-center border border-zinc-800/40">
                            {/* We show a small gradient or abstract image matching the filter */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-500 opacity-80"
                              style={f.previewStyle}
                            />
                            {isApplied && (
                              <div className="absolute top-1 right-1 bg-cyan-500 text-black p-0.5 rounded-full z-10">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          
                          <span className={cn(
                            "text-[9px] font-semibold leading-none truncate w-full",
                            isApplied ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-200"
                          )}>
                            {f.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500 text-center py-6 bg-zinc-900/20 border border-zinc-800/40 rounded-xl px-4">
                  {t.selectClipToFilter || 'Sélectionnez un clip pour lui appliquer un effet.'}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
