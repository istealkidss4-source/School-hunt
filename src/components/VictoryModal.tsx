/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, RotateCcw } from 'lucide-react';
import { RunStats } from '../game/rules.ts';

interface VictoryModalProps {
  stats: RunStats;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a120e] border border-emerald-950/60 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Victory Emblem */}
        <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Award className="w-7 h-7" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-cinzel font-black tracking-widest text-emerald-400 uppercase">
          Escaped
        </h2>
        <p className="text-xs font-mono text-emerald-300/80 mt-1 uppercase tracking-wider">
          You broke the seal and fled into the night
        </p>

        {/* Stats Grid */}
        <div className="w-full my-6 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">All Clues Found</span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1">
              {stats.cluesFound} / {stats.totalClues}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Escape Time</span>
            <span className="text-xl font-bold font-mono text-emerald-300 mt-1">
              {Math.floor(stats.timeSurvived / 60)}m {Math.floor(stats.timeSurvived % 60)}s
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Sanity Preserved</span>
            <span className="text-xl font-bold font-mono text-teal-300 mt-1">
              {Math.round(stats.sanityRemaining)}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Near Misses Evaded</span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {stats.nearMisses}
            </span>
          </div>
        </div>

        <div className="text-xs font-serif italic text-slate-400 max-w-xs mb-6">
          “The truth of Saint Jude’s Academy has been brought to light. Behind you, the iron gates slam shut forever.”
        </div>

        {/* Play Again with data-start="true" */}
        <button
          onClick={onRestart}
          data-start="true"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-cinzel font-bold text-sm tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
};
