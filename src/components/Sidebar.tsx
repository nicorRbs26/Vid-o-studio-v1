/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Video, Music, Image as ImageIcon, Type, Trash2, FolderOpen, Play, Volume2, Sparkles, Check, Loader2, Wand2 } from 'lucide-react';
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
  onToast?: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void;
  apiKeyMode?: 'workspace' | 'custom' | 'none';
  setApiKeyMode?: (mode: 'workspace' | 'custom' | 'none') => void;
  customApiKey?: string;
  setCustomApiKey?: (key: string) => void;
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
    id: 'tpl-vid-cyberpunk-rain',
    name: 'Cyberpunk Rain Street (Tendance)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-neon-city-streets-at-night-42172-large.mp4',
    duration: 12,
    thumbnail: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=150&auto=format&fit=crop&q=60',
    description: 'Rues de Tokyo pluvieuses illuminées de néons'
  },
  {
    id: 'tpl-vid-retro-highway',
    name: 'Retro Future Highway (Tendance)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-grid-background-with-laser-lines-43093-large.mp4',
    duration: 10,
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=60',
    description: 'Autoroute néon rétro Outrun années 80'
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
    id: 'tpl-vid-mountain-drone',
    name: 'Epic Mountain Drone (Tendance)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-green-forest-and-mountain-peaks-42525-large.mp4',
    duration: 10,
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60',
    description: 'Survol cinématique de sommets embrumés'
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
    id: 'tpl-vid-fluid-ink',
    name: 'Abstract Fluid Ink (Tendance)',
    type: 'video' as const,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-expanding-in-water-with-fluid-colors-43224-large.mp4',
    duration: 12,
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&auto=format&fit=crop&q=60',
    description: 'Mélange fluide et hypnotique de couleurs de rêve'
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
    id: 'tpl-aud-lofi',
    name: 'Lo-Fi Cozy Study Beats (Tendance)',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 15,
    description: 'Beat relaxant idéal pour vlogs et voix-off',
    synthPreset: 'lofi'
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
    id: 'tpl-aud-epic',
    name: 'Epic Orchestral Trailer (Tendance)',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    duration: 15,
    description: 'Dramatique avec cordes héroïques et montées',
    synthPreset: 'epic'
  },
  {
    id: 'tpl-aud-industrial',
    name: 'Cyberpunk Techno Pulse (Tendance)',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    duration: 15,
    description: 'Techno industrielle sombre et rythmée',
    synthPreset: 'industrial'
  },
  {
    id: 'tpl-aud-tropical',
    name: 'Tropical Summer House (Tendance)',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    duration: 15,
    description: 'House ensoleillée, énergique et positive',
    synthPreset: 'tropical'
  },
  {
    id: 'tpl-aud-arcade',
    name: 'Retro Chiptune Arcade (Tendance)',
    type: 'audio' as const,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    duration: 12,
    description: 'Mélodie vintage chiptune jeu vidéo 8-bit',
    synthPreset: 'arcade'
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
    id: 'tpl-txt-cyberpunk-glitch',
    name: 'Futuristic Glitch (Tendance)',
    text: 'SYSTEM ERR_303',
    style: { x: 960, y: 540, fontSize: 110, color: '#ff0055' },
    description: 'Style glitch de science-fiction rouge flashy'
  },
  {
    id: 'tpl-txt-subtitle',
    name: 'Minimalist Subtitle',
    text: 'Ceci est un sous-titre moderne...',
    style: { x: 960, y: 880, fontSize: 36, color: '#f3f4f6' },
    description: 'Sous-titre centré en bas'
  },
  {
    id: 'tpl-txt-lowerthird',
    name: 'Minimal Aesthetic Lower Third (Tendance)',
    text: 'DOCUMENTARY MAKER',
    style: { x: 320, y: 880, fontSize: 32, color: '#cbd5e1' },
    description: 'Identifiant d\'interview élégant en bas à gauche'
  },
  {
    id: 'tpl-txt-serif',
    name: 'Elegant Editorial',
    text: 'The Art of Cinema',
    style: { x: 960, y: 540, fontSize: 75, color: '#ffedd5' },
    description: 'Style éditorial raffiné couleur ivoire'
  },
  {
    id: 'tpl-txt-cinematic',
    name: 'Bold Cinematic Trailer (Tendance)',
    text: 'THE REVELATION',
    style: { x: 960, y: 540, fontSize: 90, color: '#f8fafc' },
    description: 'Titre de cinéma majuscule avec grand espacement'
  },
  {
    id: 'tpl-txt-dreamy',
    name: 'Romantic Italic Serif (Tendance)',
    text: 'A love story under the sunset...',
    style: { x: 960, y: 540, fontSize: 62, color: '#fef08a' },
    description: 'Écriture fine romantique jaune or'
  },
  {
    id: 'tpl-txt-pixel',
    name: 'Retro Pixel Arcade (Tendance)',
    text: 'PLAYER 1 READY',
    style: { x: 960, y: 540, fontSize: 80, color: '#22c55e' },
    description: 'Style jeu rétro vert phosphorescent'
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
    } else if (preset === 'lofi') {
      // Smooth electric piano chords (Cmaj7 -> Am7)
      const freqs = [130.81, 164.81, 196.00, 246.94, 220.00]; // Rich chords
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        // Soft lowpass filter for that warm lofi sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; 

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + idx * 0.08 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 2.0);
      });
    } else if (preset === 'epic') {
      // Dramatic sub brassy stabs
      const freqs = [110.00, 165.00, 220.00];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(freq - 10, ctx.currentTime + 0.8);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);
        
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      });
    } else if (preset === 'industrial') {
      // Heavy synth bass pulse beat
      const notes = [55.00, 55.00, 73.42, 65.41];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = 800;
        
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.2);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.2 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.2 + 0.18);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.2);
        osc.stop(ctx.currentTime + idx * 0.2 + 0.2);
      });
    } else if (preset === 'tropical') {
      // Cheerful marimba-like pattern
      const melody = [523.25, 587.33, 659.25, 783.99];
      melody.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Add a soft higher frequency resonator for marimba vibe
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.15 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.14);
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.15);
        osc2.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.15);
        osc2.stop(ctx.currentTime + idx * 0.15 + 0.15);
      });
    } else if (preset === 'arcade') {
      // Classic 8-bit coin sound and level up slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.error('Web Audio failed:', err);
  }
}

export default function Sidebar({ 
  assets, 
  onAddAsset, 
  onDeleteAsset, 
  onAddToTimeline, 
  onAddCustomTextClip, 
  t, 
  clips, 
  selectedClipId, 
  onSelectClip, 
  onUpdateClip, 
  onToast,
  apiKeyMode = 'workspace',
  setApiKeyMode,
  customApiKey = '',
  setCustomApiKey
}: SidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'uploads' | 'video' | 'audio' | 'text' | 'image' | 'effects'>('uploads');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [uploadingFiles, setUploadingFiles] = React.useState<{ name: string; progress: string }[]>([]);
  const [aiSettingsExpanded, setAiSettingsExpanded] = React.useState(false);

  // AI Music Generator State
  const [aiMusicPrompt, setAiMusicPrompt] = React.useState('');
  const [aiMusicModel, setAiMusicModel] = React.useState('lyria-3-clip-preview');
  const [isGeneratingMusic, setIsGeneratingMusic] = React.useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = React.useState('');
  const [musicProgressMsg, setMusicProgressMsg] = React.useState('');
  const [musicError, setMusicError] = React.useState('');

  // AI Image Generator State
  const [aiImagePrompt, setAiImagePrompt] = React.useState('');
  const [aiImageModel, setAiImageModel] = React.useState('gemini-3.1-flash-lite-image');
  const [aiImageRatio, setAiImageRatio] = React.useState('16:9');
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState('');
  const [imageProgressMsg, setImageProgressMsg] = React.useState('');
  const [imageError, setImageError] = React.useState('');

  // AI Text Generator State
  const [aiTextPrompt, setAiTextPrompt] = React.useState('');
  const [aiTextModel, setAiTextModel] = React.useState('gemini-3.5-flash');
  const [isGeneratingText, setIsGeneratingText] = React.useState(false);
  const [generatedText, setGeneratedText] = React.useState('');
  const [textProgressMsg, setTextProgressMsg] = React.useState('');
  const [textError, setTextError] = React.useState('');

  // Helper functions to call API endpoints
  const handleGenerateMusic = async () => {
    if (!aiMusicPrompt.trim()) return;
    setIsGeneratingMusic(true);
    setMusicError('');
    setGeneratedMusicUrl('');
    
    const messages = [
      "Initialisation de Lyria...",
      "Analyse de la structure harmonique...",
      "Génération des motifs mélodiques...",
      "Synthèse instrumentale et rendu audio...",
      "Finalisation de la piste stéréo..."
    ];
    let msgIndex = 0;
    setMusicProgressMsg(messages[0]);
    
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setMusicProgressMsg(messages[msgIndex]);
    }, 4000);

    try {
      const response = await fetch('/api/gemini/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiMusicPrompt, 
          model: aiMusicModel,
          apiKey: customApiKey,
          apiKeyMode: apiKeyMode
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Une erreur est survenue pendant la génération de la musique.");
      }

      const data = await response.json();
      setGeneratedMusicUrl(data.audioUrl);
    } catch (err: any) {
      console.error(err);
      setMusicError(err.message || "Erreur de connexion avec le serveur de musique.");
    } finally {
      clearInterval(interval);
      setIsGeneratingMusic(false);
      setMusicProgressMsg('');
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError('');
    setGeneratedImageUrl('');

    const messages = [
      "Contact de Gemini Image...",
      "Interprétation du prompt artistique...",
      "Rendu de la grille de pixels (1K)...",
      "Optimisation de la clarté et du contraste...",
      "Mise en cache du visuel..."
    ];
    let msgIndex = 0;
    setImageProgressMsg(messages[0]);

    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setImageProgressMsg(messages[msgIndex]);
    }, 3000);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiImagePrompt, 
          model: aiImageModel, 
          aspectRatio: aiImageRatio,
          apiKey: customApiKey,
          apiKeyMode: apiKeyMode
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Une erreur est survenue pendant la génération d'image.");
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || "Erreur de communication avec l'IA d'image.");
    } finally {
      clearInterval(interval);
      setIsGeneratingImage(false);
      setImageProgressMsg('');
    }
  };

  const handleGenerateText = async () => {
    if (!aiTextPrompt.trim()) return;
    setIsGeneratingText(true);
    setTextError('');
    setGeneratedText('');
    setTextProgressMsg("Rédaction en cours par Gemini...");

    try {
      const response = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiTextPrompt, 
          model: aiTextModel,
          apiKey: customApiKey,
          apiKeyMode: apiKeyMode
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Une erreur est survenue pendant la génération du texte.");
      }

      const data = await response.json();
      setGeneratedText(data.text);
    } catch (err: any) {
      console.error(err);
      setTextError(err.message || "Erreur de connexion au serveur d'écriture.");
    } finally {
      setIsGeneratingText(false);
      setTextProgressMsg('');
    }
  };

  const getClipName = (clip: TimelineClip) => {
    const asset = assets.find(a => a.id === clip.assetId);
    if (asset) return asset.name;
    if (clip.type === 'text') return clip.text || 'Texte';
    return `${clip.type.toUpperCase()} Clip`;
  };

  const onDrop = React.useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections && fileRejections.length > 0) {
      if (onToast) {
        onToast({
          message: "Format de fichier non pris en charge. Formats acceptés : MP4, MOV, MP3, WAV, JPG, PNG, WEBP.",
          type: 'error'
        });
      }
    }

    setIsProcessing(true);
    for (const file of acceptedFiles) {
      // 1. Max size limit check (150MB)
      const MAX_SIZE_MB = 150;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        if (onToast) {
          onToast({
            message: `Le fichier "${file.name}" dépasse la limite recommandée de ${MAX_SIZE_MB}Mo pour le traitement client.`,
            type: 'error'
          });
        }
        continue;
      }

      const type = file.type.startsWith('video') ? 'video' : 
                   file.type.startsWith('audio') ? 'audio' : 
                   file.type.startsWith('image') ? 'image' : null;
      
      if (!type) {
        if (onToast) {
          onToast({
            message: `Format non reconnu pour "${file.name}".`,
            type: 'error'
          });
        }
        continue;
      }

      // Add to local upload tracker state
      setUploadingFiles(prev => [...prev, { name: file.name, progress: "Analyse..." }]);

      if (onToast) {
        onToast({
          message: `Importation de "${file.name}"...`,
          type: 'info'
        });
      }

      let thumbnail: string | undefined;
      let duration = 0;

      if (type === 'video' || type === 'audio') {
        const url = URL.createObjectURL(file);
        const element = document.createElement(type);
        element.src = url;

        // Wrap metadata loaded in a promise with timeout fallback (3 seconds) to prevent any blocking
        const metadataLoaded = new Promise<void>((resolve) => {
          element.onloadedmetadata = () => {
            duration = element.duration;
            resolve();
          };
          element.onerror = () => {
            console.warn(`Impossible de lire les métadonnées de ${file.name}`);
            resolve();
          };
        });

        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn(`Timeout métadonnées de ${file.name}`);
            resolve();
          }, 3000);
        });

        await Promise.race([metadataLoaded, timeoutPromise]);
        
        if (type === 'video') {
          setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: "Génération de la miniature..." } : f));
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
        duration: duration || (type === 'image' ? 5 : type === 'video' ? 10 : 30), // Safe fallbacks
        thumbnail
      });

      // Clear from tracker
      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));

      if (onToast) {
        onToast({
          message: `"${file.name}" importé avec succès !`,
          type: 'success'
        });
      }
    }
    setIsProcessing(false);
  }, [onAddAsset, onToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
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
        
        {/* Global AI Config header at the top of the panel */}
        <div className="border-b border-zinc-800 bg-zinc-900/30">
          <button
            id="btn-ai-config-toggle"
            onClick={() => setAiSettingsExpanded(!aiSettingsExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/40 transition-all"
          >
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{t.aiConfiguration || "Configuration Modèles IA"}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase",
                apiKeyMode === 'workspace' && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                apiKeyMode === 'custom' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                apiKeyMode === 'none' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              )}>
                {apiKeyMode === 'workspace' && (t.modeWorkspace || "Workspace")}
                {apiKeyMode === 'custom' && (t.modeCustom || "Clé Perso")}
                {apiKeyMode === 'none' && (t.modeSimulation || "Sans Clé (Simulé)")}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">{aiSettingsExpanded ? "▲" : "▼"}</span>
          </button>
          
          {aiSettingsExpanded && (
            <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex flex-col gap-2 text-xs">
              <div className="text-[10px] text-zinc-500">
                {t.aiConfigDescription || "Configurez l'accès aux modèles d'IA générative (Script, Voix, Image, Musique)."}
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <button
                  id="btn-ai-mode-workspace"
                  onClick={() => setApiKeyMode?.('workspace')}
                  className={cn(
                    "py-1.5 px-1 rounded-lg border text-[9px] font-medium text-center transition-all",
                    apiKeyMode === 'workspace' 
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {t.modeWorkspace || "Workspace"}
                </button>
                <button
                  id="btn-ai-mode-custom"
                  onClick={() => setApiKeyMode?.('custom')}
                  className={cn(
                    "py-1.5 px-1 rounded-lg border text-[9px] font-medium text-center transition-all",
                    apiKeyMode === 'custom' 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {t.modeCustom || "Clé Perso"}
                </button>
                <button
                  id="btn-ai-mode-none"
                  onClick={() => setApiKeyMode?.('none')}
                  className={cn(
                    "py-1.5 px-1 rounded-lg border text-[9px] font-medium text-center transition-all",
                    apiKeyMode === 'none' 
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-400" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {t.modeSimulation || "Simulé"}
                </button>
              </div>

              {apiKeyMode === 'custom' && (
                <div className="flex flex-col gap-1 mt-1.5">
                  <label className="text-[10px] text-zinc-400 font-medium">Clé API Gemini (Custom) :</label>
                  <div className="relative">
                    <input
                      id="input-custom-api-key"
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey?.(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {apiKeyMode === 'workspace' && (
                <div className="text-[9px] text-cyan-400/80 bg-cyan-950/20 border border-cyan-950/40 rounded-lg p-2 mt-1 flex items-start gap-1">
                  <span>ℹ️</span>
                  <span>Utilise la clé API sécurisée du serveur de l\'application (configurée dans les secrets par l\'administrateur).</span>
                </div>
              )}

              {apiKeyMode === 'none' && (
                <div className="text-[9px] text-amber-400/80 bg-amber-950/20 border border-amber-950/40 rounded-lg p-2 mt-1 flex items-start gap-1">
                  <span>⚠️</span>
                  <span>Mode sans clé API activé. Les générations de scripts, voix off, images et musiques seront simulées localement en offline de façon fluide.</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Tab 1: Uploads */}
        {activeTab === 'uploads' && (
          <div className="flex flex-col h-full">
            <div className="p-4 flex flex-col border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Importation de Médias</span>
                <button 
                  {...getRootProps()}
                  className="p-1.5 hover:bg-zinc-800 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-cyan-500/50 transition-all text-cyan-400 flex items-center gap-1 text-[9px] font-bold"
                  title="Parcourir"
                >
                  <input {...getInputProps()} />
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>AJOUTER</span>
                </button>
              </div>
              <span className="text-[8px] text-zinc-500 mt-1 select-none">Traitement local ultra-sécurisé & sans serveur</span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-4">
              {/* Enhanced Visual Dropzone */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border border-dashed border-zinc-800 rounded-xl p-5 text-center transition-all cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/[0.01]",
                  isDragActive && "border-cyan-500 bg-cyan-500/5 scale-[0.98]",
                  isProcessing && "opacity-80 pointer-events-none"
                )}
              >
                <input {...getInputProps()} />
                
                <div className="flex justify-center gap-3 mb-3 text-zinc-500">
                  <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/80 hover:text-cyan-400 transition-colors">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/80 hover:text-cyan-400 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/80 hover:text-cyan-400 transition-colors">
                    <Music className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-[10px] font-medium text-zinc-300 leading-relaxed">
                  {isDragActive ? "Déposez vos fichiers ici !" : "Glissez vos photos, vidéos ou audios"}
                </p>
                <p className="text-[9px] text-zinc-500 mt-1">
                  Ou cliquez pour parcourir vos dossiers
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-900/80 flex items-center justify-center gap-2 text-[8px] text-zinc-600">
                  <span>Recommandé : &lt;150Mo</span>
                  <span>•</span>
                  <span>MP4, MP3, WAV, JPG, PNG, WEBP</span>
                </div>
              </div>

              {/* Active Processing / Upload Progress list */}
              {uploadingFiles.length > 0 && (
                <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl p-2.5 space-y-2">
                  <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest block">Traitement en cours...</span>
                  <div className="space-y-1.5">
                    {uploadingFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-[9px]">
                        <span className="text-zinc-400 truncate flex-1 font-mono">{file.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0 text-cyan-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[8px] font-bold uppercase">{file.progress}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assets.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-[10px]">
                  Aucun média importé. Utilisez le bouton ci-dessus ou glissez-déposez vos fichiers de travail.
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
          <div className="flex flex-col h-full overflow-y-auto pb-6">
            {/* AI Generator section */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Générateur de Musique IA (Lyria)
              </span>
              <div className="space-y-2">
                <textarea
                  value={aiMusicPrompt}
                  onChange={(e) => setAiMusicPrompt(e.target.value)}
                  placeholder="Ex: Un synthwave futuriste et optimiste de 30 secondes pour une vidéo high-tech..."
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-300 placeholder-zinc-700 focus:border-cyan-500 focus:outline-none resize-none"
                />
                <div className="flex gap-2 items-center">
                  <select
                    value={aiMusicModel}
                    onChange={(e) => setAiMusicModel(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] text-zinc-400 outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="lyria-3-clip-preview">Lyria Clip (30s) - Rapide</option>
                    <option value="lyria-3-pro-preview">Lyria Pro (Chanson) - Haute Qualité</option>
                  </select>
                  <button
                    onClick={handleGenerateMusic}
                    disabled={isGeneratingMusic || !aiMusicPrompt.trim()}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-all uppercase"
                  >
                    {isGeneratingMusic ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
                    Générer
                  </button>
                </div>

                {isGeneratingMusic && (
                  <div className="p-2 bg-cyan-950/10 border border-cyan-500/10 rounded-lg text-center">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400 mx-auto mb-1" />
                    <p className="text-[9px] text-cyan-400 font-semibold animate-pulse">{musicProgressMsg}</p>
                    <p className="text-[7px] text-zinc-500 mt-0.5">La génération musicale de Lyria prend généralement de 15 à 30 secondes...</p>
                  </div>
                )}

                {musicError && (
                  <p className="text-[8px] text-red-400 leading-normal bg-red-950/20 border border-red-500/10 rounded-lg p-2">
                    {musicError}
                  </p>
                )}

                {generatedMusicUrl && (
                  <div className="p-2.5 bg-zinc-900 border border-cyan-500/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Musique IA Générée !
                    </p>
                    <audio src={generatedMusicUrl} controls className="w-full h-6 outline-none bg-zinc-950 rounded" />
                    <button
                      onClick={() => {
                        const asset: MediaAsset = {
                          id: `ai-music-${Date.now()}`,
                          name: `Musique IA (${aiMusicModel === 'lyria-3-clip-preview' ? 'Lyria Clip' : 'Lyria Pro'})`,
                          type: 'audio',
                          url: generatedMusicUrl,
                          duration: aiMusicModel === 'lyria-3-clip-preview' ? 30 : 60
                        };
                        onAddAsset(asset);
                        onAddToTimeline(asset);
                      }}
                      className="w-full py-1 bg-cyan-500 text-black rounded text-[9px] font-bold uppercase transition-all"
                    >
                      Ajouter au Montage
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-zinc-800/30 bg-zinc-900/10">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1">
                {t.audioTemplates}
              </span>
            </div>
            <div className="p-3 space-y-3">
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
          <div className="flex flex-col h-full overflow-y-auto pb-6">
            {/* AI Generator section */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Assistant Scénariste IA (Gemini)
              </span>
              <div className="space-y-2">
                <textarea
                  value={aiTextPrompt}
                  onChange={(e) => setAiTextPrompt(e.target.value)}
                  placeholder="Ex: Écris un titre stylé de 3 mots sur l'océan avec des majuscules..."
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-300 placeholder-zinc-700 focus:border-cyan-500 focus:outline-none resize-none"
                />
                <div className="flex gap-2 items-center">
                  <select
                    value={aiTextModel}
                    onChange={(e) => setAiTextModel(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[9px] text-zinc-400 outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Super rapide)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Créatif, détaillé)</option>
                  </select>
                  <button
                    onClick={handleGenerateText}
                    disabled={isGeneratingText || !aiTextPrompt.trim()}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-all uppercase"
                  >
                    {isGeneratingText ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
                    Générer
                  </button>
                </div>

                {isGeneratingText && (
                  <div className="p-2 bg-cyan-950/10 border border-cyan-500/10 rounded-lg text-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 mx-auto mb-1" />
                    <p className="text-[9px] text-cyan-400 font-semibold animate-pulse">{textProgressMsg}</p>
                  </div>
                )}

                {textError && (
                  <p className="text-[8px] text-red-400 leading-normal bg-red-950/20 border border-red-500/10 rounded-lg p-2">
                    {textError}
                  </p>
                )}

                {generatedText && (
                  <div className="p-2.5 bg-zinc-900 border border-cyan-500/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Texte généré !
                    </p>
                    <textarea
                      value={generatedText}
                      onChange={(e) => setGeneratedText(e.target.value)}
                      className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-zinc-300 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (onAddCustomTextClip) {
                          onAddCustomTextClip(generatedText, { x: 960, y: 540, fontSize: 50, color: '#ffffff' });
                        }
                      }}
                      className="w-full py-1 bg-cyan-50 text-black rounded text-[9px] font-bold uppercase transition-all"
                    >
                      Ajouter au Montage
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-zinc-800/30 bg-zinc-900/10">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1">
                {t.textTemplates}
              </span>
            </div>
            <div className="p-3 space-y-3">
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
          <div className="flex flex-col h-full overflow-y-auto pb-6">
            {/* AI Generator section */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Générateur d'Images IA (Gemini)
              </span>
              <div className="space-y-2">
                <textarea
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="Ex: Une peinture à l'huile d'un chat astronaute sur la lune, style cinématographique..."
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-300 placeholder-zinc-700 focus:border-cyan-500 focus:outline-none resize-none"
                />
                
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={aiImageModel}
                    onChange={(e) => setAiImageModel(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[9px] text-zinc-400 outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="gemini-3.1-flash-lite-image">Gemini Flash Lite (Rapide)</option>
                    <option value="gemini-3.1-flash-image">Gemini Flash (Pro 1K)</option>
                  </select>
                  <select
                    value={aiImageRatio}
                    onChange={(e) => setAiImageRatio(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[9px] text-zinc-400 outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="16:9">Format 16:9</option>
                    <option value="9:16">Format 9:16</option>
                    <option value="1:1">Format 1:1</option>
                    <option value="4:3">Format 4:3</option>
                    <option value="3:4">Format 3:4</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !aiImagePrompt.trim()}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white text-[9px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-all uppercase w-full"
                  >
                    {isGeneratingImage ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
                    Générer l'Image IA
                  </button>
                </div>

                {isGeneratingImage && (
                  <div className="p-2 bg-cyan-950/10 border border-cyan-500/10 rounded-lg text-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 mx-auto mb-1" />
                    <p className="text-[9px] text-cyan-400 font-semibold animate-pulse">{imageProgressMsg}</p>
                    <p className="text-[7px] text-zinc-500 mt-0.5">La génération d'images haute définition prend de 5 à 10 secondes...</p>
                  </div>
                )}

                {imageError && (
                  <p className="text-[8px] text-red-400 leading-normal bg-red-950/20 border border-red-500/10 rounded-lg p-2">
                    {imageError}
                  </p>
                )}

                {generatedImageUrl && (
                  <div className="p-2.5 bg-zinc-900 border border-cyan-500/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Image d'Art IA Générée !
                    </p>
                    <div className="relative aspect-video rounded overflow-hidden border border-zinc-850 bg-black">
                      <img src={generatedImageUrl} className="w-full h-full object-cover" alt="Visuel IA" />
                    </div>
                    <button
                      onClick={() => {
                        const asset: MediaAsset = {
                          id: `ai-image-${Date.now()}`,
                          name: `Image IA (${aiImagePrompt.slice(0, 15)}...)`,
                          type: 'image',
                          url: generatedImageUrl,
                          duration: 5
                        };
                        onAddAsset(asset);
                        onAddToTimeline(asset);
                      }}
                      className="w-full py-1 bg-cyan-50 text-black rounded text-[9px] font-bold uppercase transition-all"
                    >
                      Ajouter au Montage
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-zinc-800/30 bg-zinc-900/10">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1">
                {t.imageTemplates}
              </span>
            </div>
            <div className="p-3 space-y-3">
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
