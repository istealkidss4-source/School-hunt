/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Skull, RotateCcw } from 'lucide-react';
import { RunStats } from '../game/rules.ts';

interface GameOverModalProps {
  stats: RunStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0f0709] border border-red-950/60 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Skull icon */}
        <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-700/50 flex items-center justify-center text-red-500 mb-4 animate-pulse">
          <Skull className="w-7 h-7" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-cinzel font-black tracking-widest text-red-500 uppercase">
          Consumed
        </h2>
        <p className="text-xs font-mono text-red-400/80 mt-1 uppercase tracking-wider">
          {stats.causeOfDeath || 'The Unseen Entity took you into the dark'}
        </p>

        {/* Stats Grid */}
        <div className="w-full my-6 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Clues Found</span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1">
              {stats.cluesFound} / {stats.totalClues}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Time Survived</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-1">
              {Math.floor(stats.timeSurvived / 60)}m {Math.floor(stats.timeSurvived % 60)}s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Final Sanity</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1">
              {Math.round(stats.sanityRemaining)}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Near Misses</span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {stats.nearMisses}
            </span>
          </div>
        </div>

        <div className="text-xs font-serif italic text-slate-400 max-w-xs mb-6">
          “When the static turns into a deafening roar, extinguish your light or slip inside a locker before it senses your breath.”
        </div>

        {/* Try Again CTA with data-start="true" */}
        <button
          onClick={onRestart}
          data-start="true"
          className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-cinzel font-bold text-sm tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(185,28,28,0.5)] hover:shadow-[0_0_30px_rgba(185,28,28,0.8)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
