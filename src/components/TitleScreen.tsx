/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Volume2, ShieldAlert } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden select-none bg-black">
      {/* Background key-art backdrop */}
      <img
        src="/src/assets/images/school_horror_title_1793110486985.jpg"
        alt="Dark abandoned school hallway"
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
        referrerPolicy="no-referrer"
      />

      {/* Atmospheric gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
      <div className="absolute inset-0 horror-vignette" />

      {/* TOP: School Name Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-200/60 uppercase tracking-widest">
          <span>Saint Jude Academy · Abandoned 1987</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Headphones Recommended</span>
        </div>
      </div>

      {/* CENTER: Title Emblem & Primary Action */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl my-auto">
        {/* Subtle emblem badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-amber-900/40 text-amber-400/90 text-xs font-mono mb-4 tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SURVIVAL PSYCHOLOGICAL HORROR</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-cinzel font-black tracking-widest text-slate-100 uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
          Hollow Hall
        </h1>
        <h2 className="text-xl sm:text-2xl font-cinzel font-semibold tracking-wider text-amber-400/90 -mt-1 sm:-mt-2 uppercase">
          The Unseen
        </h2>

        <p className="mt-6 text-sm sm:text-base text-slate-300 font-serif max-w-lg leading-relaxed text-balance">
          Five students vanished in these corridors on a freezing winter night in 1987.
          Collect the five hidden investigative seals and solve environmental locks to escape.
          Whatever you do, listen closely to the static—it cannot be seen, but it knows you are here.
        </p>

        {/* Primary Start CTA */}
        <button
          onClick={onStartGame}
          data-start="true"
          className="mt-8 px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-cinzel font-bold text-sm tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(217,119,6,0.5)] hover:shadow-[0_0_35px_rgba(217,119,6,0.8)] hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Enter the School</span>
        </button>

        <span className="mt-3 text-xs font-mono text-slate-400">
          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-white">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-white">Space</kbd> to begin
        </span>
      </div>

      {/* BOTTOM: Minimalist Controls Row */}
      <div className="relative z-10 w-full max-w-4xl py-3 px-4 rounded-xl bg-black/70 border border-white/10 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        <span><strong className="text-white">WASD</strong> Move</span>
        <span>·</span>
        <span><strong className="text-white">Mouse / Drag</strong> Look</span>
        <span>·</span>
        <span><strong className="text-white">F</strong> Flashlight</span>
        <span>·</span>
        <span><strong className="text-white">E</strong> Interact / Hide in Locker</span>
        <span>·</span>
        <span><strong className="text-white">1-6</strong> Inventory Hotbar</span>
        <span>·</span>
        <span><strong className="text-white">Shift</strong> Sprint</span>
        <span>·</span>
        <span><strong className="text-white">Tab</strong> Clue Journal</span>
      </div>
    </div>
  );
};
