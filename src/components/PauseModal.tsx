/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, BookOpen } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenJournal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenJournal,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#0d0f14] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center">
        <h2 className="text-2xl font-cinzel font-bold tracking-widest text-white uppercase">
          Paused
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          The shadows wait in silence
        </p>

        <div className="w-full my-6 flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            onClick={onOpenJournal}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Review Journal</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-red-300 font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Investigation</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-white">Esc</kbd> or <kbd className="px-1 py-0.5 bg-white/10 rounded text-white">P</kbd> to resume
        </div>
      </div>
    </div>
  );
};
