/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clue } from '../game/rules.ts';
import { FileText, MapPin, X } from 'lucide-react';

interface JournalModalProps {
  clues: Clue[];
  activeClue: Clue | null;
  onSelectClue: (clue: Clue) => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  clues,
  activeClue,
  onSelectClue,
  onClose,
}) => {
  const discoveredCount = clues.filter((c) => c.discovered).length;
  const currentViewClue = activeClue || clues.find((c) => c.discovered) || clues[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-none p-4 select-none">
      <div className="relative w-full max-w-4xl bg-[#12141a] border border-amber-950/40 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh]">
        {/* Left Column: Clue Index */}
        <div className="w-full md:w-80 bg-[#0a0c10] border-r border-amber-950/30 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-cinzel font-bold text-amber-200 tracking-wider">
                Investigator’s Journal
              </h2>
              <p className="text-xs text-amber-200/60 font-mono mt-0.5">
                Clues Recovered: {discoveredCount} / {clues.length}
              </p>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {clues.map((clue, idx) => {
              const isSelected = currentViewClue?.id === clue.id;
              return (
                <button
                  key={clue.id}
                  onClick={() => onSelectClue(clue)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-100 shadow-md'
                      : clue.discovered
                      ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      : 'bg-black/40 border-white/5 text-slate-600 opacity-70'
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      clue.discovered ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">
                      {clue.discovered ? clue.title : `Classified Clue #${idx + 1}`}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {clue.discovered ? clue.location : 'Location Undiscovered'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-white">Tab</kbd> or click Close to return to the school.
          </div>
        </div>

        {/* Right Column: Detailed Document / Evidence Paper View */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-[#16181f]">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>{currentViewClue?.location || 'Unknown'}</span>
              <span>·</span>
              <span>{currentViewClue?.date || 'Undated'}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Journal"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {currentViewClue && currentViewClue.discovered ? (
            <div className="my-6 p-6 rounded-lg bg-[#f4ebd9] text-[#241c15] shadow-inner font-handwriting leading-relaxed border border-[#d6c7b0]">
              <h3 className="text-xl font-bold font-cinzel text-[#1c140d] mb-3 pb-2 border-b border-[#c8b79f]">
                {currentViewClue.title}
              </h3>
              <p className="text-base italic text-[#4a3b2c] mb-4 bg-amber-100/60 p-3 rounded border-l-2 border-amber-800">
                {currentViewClue.excerpt}
              </p>
              <p className="text-sm text-[#2b2118] whitespace-pre-line">
                {currentViewClue.lore}
              </p>
            </div>
          ) : (
            <div className="my-12 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl text-slate-500">
              <FileText className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
              <div className="text-sm font-cinzel font-semibold text-slate-400">
                This document has not been found yet
              </div>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Explore the classrooms, science wing, archives, and principal’s office. Watch for the faint golden light of scattered evidence.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200 bg-amber-950/60 border border-amber-700/50 rounded-lg hover:bg-amber-900/60 transition-colors"
            >
              Resume Investigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
