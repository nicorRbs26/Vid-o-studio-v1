/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Layers, Plus, Wand2, Scissors, Mic, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimelineClip } from '../types';
import { cn } from '../lib/utils';

interface PropertyPanelProps {
  selectedClip: TimelineClip | null;
  onUpdateClip: (clip: TimelineClip) => void;
  onDeleteClip: (id: string) => void;
  onSplitClip: (id: string) => void;
  onAddText: () => void;
  onTTS: (text: string, options?: { voiceURI?: string; rate?: number; pitch?: number }) => void;
  isOnline: boolean;
  t: any;
}

export default function PropertyPanel({ selectedClip, onUpdateClip, onDeleteClip, onSplitClip, onAddText, onTTS, isOnline, t }: PropertyPanelProps) {
  const [ttsText, setTtsText] = React.useState('');
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = React.useState<string>('');
  const [rate, setRate] = React.useState<number>(1);
  const [pitch, setPitch] = React.useState<number>(1);

  React.useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        const filtered = availableVoices.filter(v => 
          v.lang.startsWith('fr') || v.lang.startsWith('en')
        );
        setVoices(filtered);
        if (filtered.length > 0 && !selectedVoiceURI) {
          const isFrench = t.voiceSelect ? t.voiceSelect.includes('Voix') : true;
          const preferred = filtered.find(v => v.lang.startsWith(isFrench ? 'fr' : 'en')) || filtered[0];
          setSelectedVoiceURI(preferred.voiceURI);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [t]);

  return (
    <div className="w-full sm:w-64 border-l border-zinc-800 bg-panel-bg flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{t.properties}</h3>
        <Sliders className="w-3 h-3 text-zinc-600" />
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <button 
            onClick={onAddText}
            className="w-full py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center gap-2 text-cyan-500 hover:bg-cyan-500/20 transition-all text-xs font-semibold"
          >
            <Plus className="w-3 h-3" /> {t.addText}
          </button>
        </section>

        {/* TTS Section */}
        <section className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 shadow-inner space-y-3">
          <div className="flex items-center justify-between mb-1 gap-1">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3 h-3 text-cyan-400" />
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.voiceOver}</h4>
            </div>
            <span className="text-[8px] bg-cyan-950/80 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/50 whitespace-nowrap">
              {t.ttsOffline}
            </span>
          </div>

          <textarea 
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="..."
            className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[11px] focus:border-cyan-500 outline-none resize-none text-zinc-300 placeholder:text-zinc-700"
          />

          {/* Voice Select */}
          {voices.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{t.voiceSelect}</label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-zinc-300 focus:border-cyan-500 focus:outline-none"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pitch Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>{t.voicePitch}</span>
              <span className="text-cyan-400">{pitch.toFixed(1)}x</span>
            </div>
            <input 
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Rate Selectors (Speed) */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">{t.voiceRate}</span>
            <div className="grid grid-cols-4 gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={cn(
                    "py-1 rounded text-[9px] font-bold border transition-all cursor-pointer",
                    rate === r
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                  )}
                >
                  {r === 0.5 ? t.voiceRateSlow : r === 1.0 ? t.voiceRateNormal : r === 1.5 ? '1.5x' : t.voiceRateFast}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onTTS(ttsText, { voiceURI: selectedVoiceURI, rate, pitch })}
            className="w-full py-1.5 bg-zinc-200 text-black rounded-md text-[10px] font-bold hover:bg-white transition-colors uppercase tracking-wider cursor-pointer"
          >
            {t.generateAudio}
          </button>
        </section>

        {/* Selected Clip Properties */}
        <AnimatePresence mode="wait">
          {selectedClip ? (
            <motion.section 
              key={selectedClip.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="h-px bg-zinc-800 w-full" />
              <h4 className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{t.clipSettings}</h4>
              
              <div className="space-y-3">
                {selectedClip.type === 'text' && (
                  <div>
                    <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.textContent}</label>
                    <input 
                      type="text" 
                      value={selectedClip.text || ''}
                      onChange={(e) => onUpdateClip({ ...selectedClip, text: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[11px] focus:border-cyan-500 outline-none text-white"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.start}</label>
                    <input 
                      type="number" 
                      value={selectedClip.startOffset}
                      onChange={(e) => onUpdateClip({ ...selectedClip, startOffset: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[11px] text-zinc-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.duration}</label>
                    <input 
                      type="number" 
                      value={selectedClip.duration}
                      onChange={(e) => onUpdateClip({ ...selectedClip, duration: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[11px] text-zinc-300"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.opacity}</label>
                  <div className="h-1 bg-zinc-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-cyan-500 w-full" />
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => onSplitClip(selectedClip.id)}
                     className="py-2 border border-cyan-500/30 text-cyan-500/70 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                   >
                     <Scissors className="w-3 h-3" /> {t.split}
                   </button>
                   <button 
                     onClick={() => onDeleteClip(selectedClip.id)}
                     className="py-2 border border-red-500/30 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider"
                   >
                     {t.deleteClip}
                   </button>
                </div>

                <div className="pt-2">
                  <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.transitionIn}</label>
                  <select 
                    value={selectedClip.transitionIn || 'none'}
                    onChange={(e) => onUpdateClip({ ...selectedClip, transitionIn: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[11px] text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="none">{t.none}</option>
                    <option value="fade">{t.fade} (Fade)</option>
                    <option value="slide-left">{t.slideLeft}</option>
                    <option value="slide-right">{t.slideRight}</option>
                  </select>
                </div>

                {selectedClip.transitionIn && selectedClip.transitionIn !== 'none' && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <label className="text-[9px] text-zinc-500 block mb-1 uppercase tracking-tighter">{t.transitionDuration}</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0.1"
                      max="2"
                      value={selectedClip.transitionDuration || 0.5}
                      onChange={(e) => onUpdateClip({ ...selectedClip, transitionDuration: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[11px] text-zinc-300"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <label className="text-[9px] text-zinc-500 block mb-2 uppercase tracking-tighter">{t.filters}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: t.none, value: 'none' },
                      { name: 'N&B', value: 'grayscale(100%)' },
                      { name: 'Sépia', value: 'sepia(80%)' },
                      { name: 'Noir', value: 'brightness(70%) contrast(150%)' },
                      { name: 'Vif', value: 'saturate(150%) brightness(110%)' },
                      { name: 'Rétro', value: 'hue-rotate(20deg) saturate(80%)' },
                      { name: 'Froid', value: 'hue-rotate(180deg) saturate(70%)' },
                      { name: 'Inverser', value: 'invert(100%)' },
                      { name: 'Pop', value: 'contrast(200%) saturate(150%)' },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => onUpdateClip({ ...selectedClip, filter: f.value })}
                        className={cn(
                          "px-1 py-2 text-[8px] rounded border transition-all truncate",
                          (selectedClip.filter === f.value || (!selectedClip.filter && f.value === 'none'))
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-200"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <div className="text-center py-10">
              <Layers className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-600">Sélectionnez un clip pour modifier ses propriétés</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
