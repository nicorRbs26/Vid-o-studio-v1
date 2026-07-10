/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Play, Pause, SkipBack, SkipForward, Languages, Wifi, WifiOff, Smartphone, Monitor } from 'lucide-react';
import { Language } from '../lib/translations';

interface HeaderProps {
  onExport: () => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  resolution: string;
  setResolution: (res: string) => void;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  isOnline: boolean;
  layoutOverride: 'auto' | 'mobile' | 'desktop';
  setLayoutOverride: (mode: 'auto' | 'mobile' | 'desktop') => void;
  t: any;
}

export default function Header({ onExport, isPlaying, onPlayToggle, lang, setLang, resolution, setResolution, aspectRatio, setAspectRatio, isOnline, layoutOverride, setLayoutOverride, t }: HeaderProps) {
  return (
    <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-2 sm:px-4 bg-panel-bg shadow-sm z-50 select-none">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-black font-bold text-base sm:text-lg shadow-lg shadow-cyan-500/20">C</div>
        <div className="flex flex-col max-w-[80px] xs:max-w-[120px] sm:max-w-none">
          <h1 className="text-xs sm:text-sm font-medium tracking-tight text-white leading-none truncate">{t.placeholderProject}</h1>
          <span className="text-[8px] text-zinc-500 mt-0.5 tracking-wider uppercase flex items-center gap-1">
            {isOnline ? (
              <>
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse inline-block" />
                <span className="hidden xs:inline">{t.onlineStatus}</span>
              </>
            ) : (
              <>
                <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
                <span className="hidden xs:inline">{t.offlineStatus}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900/50 rounded-full px-2 sm:px-4 py-1 border border-zinc-800">
        <button className="p-1 hover:text-white transition-colors text-zinc-500 hidden sm:block"><SkipBack className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-current" /></button>
        <button 
          onClick={onPlayToggle}
          className="p-1 sm:mx-2 text-white hover:scale-110 transition-transform"
        >
          {isPlaying ? <Pause className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-current" /> : <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-current" />}
        </button>
        <button className="p-1 hover:text-white transition-colors text-zinc-500 hidden sm:block"><SkipForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-current" /></button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className="flex items-center gap-1">
          <select 
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            className="bg-zinc-800 text-[9px] sm:text-[10px] text-zinc-300 border border-zinc-700 rounded px-1 sm:px-2 py-0.5 sm:py-1 outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
          </select>
        </div>

        <div className="flex items-center gap-1 mr-0.5 sm:mr-2 hidden xs:flex">
          <select 
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="bg-zinc-800 text-[9px] sm:text-[10px] text-zinc-300 border border-zinc-700 rounded px-1 sm:px-2 py-0.5 sm:py-1 outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>
        </div>

        {/* Device view switcher to force mobile layout manually or standard layout */}
        <div className="flex items-center gap-0.5 bg-zinc-800/50 rounded-full p-0.5 border border-zinc-700/50">
          <button 
            onClick={() => setLayoutOverride('desktop')}
            title={t.forceDesktopLayout}
            className={cn(
              "p-1 rounded-full transition-all flex items-center gap-1",
              layoutOverride === 'desktop' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
            )}
          >
            <Monitor className="w-3 h-3" />
            <span className="text-[8px] font-bold px-0.5 hidden md:inline">{t.forceDesktopLayout}</span>
          </button>
          
          <button 
            onClick={() => setLayoutOverride('auto')}
            title="Auto-adaptative Layout"
            className={cn(
              "text-[8px] font-bold px-2 py-1 rounded-full transition-all",
              layoutOverride === 'auto' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
            )}
          >
            Auto
          </button>

          <button 
            onClick={() => setLayoutOverride('mobile')}
            title={t.forceMobileLayout}
            className={cn(
              "p-1 rounded-full transition-all flex items-center gap-1",
              layoutOverride === 'mobile' ? "bg-cyan-500 text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
            )}
          >
            <Smartphone className="w-3 h-3" />
            <span className="text-[8px] font-bold px-0.5 hidden md:inline">{t.forceMobileLayout}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-zinc-800/50 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 border border-zinc-700/50 mr-0.5 sm:mr-2 hidden sm:flex">
          <button 
            onClick={() => setLang('fr')}
            className={cn("text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded transition-colors", lang === 'fr' ? "bg-cyan-500 text-black" : "text-zinc-500 hover:text-zinc-300")}
          >
            FR
          </button>
          <button 
            onClick={() => setLang('en')}
            className={cn("text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded transition-colors", lang === 'en' ? "bg-cyan-500 text-black" : "text-zinc-500 hover:text-zinc-300")}
          >
            EN
          </button>
        </div>

        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] sm:text-[10px] font-medium hidden lg:flex">
            <Wifi className="w-3 h-3 text-green-400" />
            <span>FFmpeg Web Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] sm:text-[10px] font-medium hidden lg:flex" title={t.offlineNotice}>
            <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{t.localEngine}</span>
          </div>
        )}

        <button 
          onClick={onExport}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md shadow-lg shadow-cyan-900/20 transition-all active:scale-95 uppercase"
        >
          {t.export}
        </button>
      </div>
    </header>
  );
}

import { cn } from '../lib/utils';

