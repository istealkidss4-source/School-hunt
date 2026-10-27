/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import {
  InventoryItem,
  SanityEffects,
} from '../game/rules.ts';
import {
  Flashlight,
  Volume2,
  VolumeX,
  Pause,
  BookOpen,
  Activity,
  Radio,
  Key,
  Wrench,
  Zap,
  Heart,
  BatteryCharging,
  Package,
} from 'lucide-react';

interface HorrorHUDProps {
  locationName: string;
  cluesDiscovered: number;
  totalClues: number;
  sanity: number;
  stamina: number;
  flashlightBattery: number;
  isFlashlightOn: boolean;
  threatLevel: number;
  isHiding: boolean;
  sanityEffects: SanityEffects;
  inventory: InventoryItem[];
  selectedItemIndex: number;
  interactionPrompt: string | null;
  statusNotification: string | null;
  isMuted: boolean;
  onToggleFlashlight: () => void;
  onSelectItem: (index: number) => void;
  onUseActiveItem: () => void;
  onToggleMute: () => void;
  onOpenJournal: () => void;
  onPause: () => void;
}

export const HorrorHUD: React.FC<HorrorHUDProps> = ({
  locationName,
  cluesDiscovered,
  totalClues,
  sanity,
  stamina,
  flashlightBattery,
  isFlashlightOn,
  threatLevel,
  isHiding,
  sanityEffects,
  inventory,
  selectedItemIndex,
  interactionPrompt,
  statusNotification,
  isMuted,
  onToggleFlashlight,
  onSelectItem,
  onUseActiveItem,
  onToggleMute,
  onOpenJournal,
  onPause,
}) => {
  const gradientId = useId();
  // Sanity status label
  const getSanityState = () => {
    if (sanity > 75) return { label: 'Composed', color: 'text-emerald-400', borderColor: 'border-emerald-500/30' };
    if (sanity > 50) return { label: 'Unsettled', color: 'text-amber-300', borderColor: 'border-amber-500/40' };
    if (sanity > 25) return { label: 'Terrified', color: 'text-orange-400', borderColor: 'border-orange-500/50' };
    return { label: 'Psychotic Breakdown', color: 'text-red-500 font-bold', borderColor: 'border-red-600/70' };
  };
  const sanityInfo = getSanityState();

  // EMF Meter needle rotation (-45deg to +45deg)
  const emfAngle = -45 + threatLevel * 90;
  const emfLeds = [0.15, 0.35, 0.55, 0.75, 0.9];

  // Helper for item icons
  const renderItemIcon = (icon: string) => {
    switch (icon) {
      case 'key':
        return <Key className="w-4 h-4 text-amber-300" />;
      case 'wrench':
        return <Wrench className="w-4 h-4 text-slate-300" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-300" />;
      case 'heart':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'battery-charging':
        return <BatteryCharging className="w-4 h-4 text-emerald-300" />;
      default:
        return <Package className="w-4 h-4 text-slate-400" />;
    }
  };

  const activeItem = inventory[selectedItemIndex] || null;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* FULLSCREEN HORROR ATMOSPHERE LAYERS */}
      {/* 1. Base subtle dark CRT vignette */}
      <div className="absolute inset-0 horror-vignette pointer-events-none" />

      {/* 2. Cold Unseen Entity Threat Vignette (deepens as entity draws near) */}
      {threatLevel > 0.05 && (
        <div
          className="absolute inset-0 threat-vignette-cold transition-opacity duration-300 pointer-events-none"
          style={{ opacity: Math.min(1, threatLevel * 1.3) }}
        />
      )}

      {/* 3. Low Sanity Visual Hallucinations (Screen edge distortion & chromatic static) */}
      {sanityEffects.visualDistortion > 0.1 && (
        <div
          className="absolute inset-0 threat-vignette-danger pointer-events-none transition-opacity duration-500"
          style={{
            opacity: sanityEffects.visualDistortion * 0.8,
            filter: `contrast(${1 + sanityEffects.visualDistortion * 0.4}) hue-rotate(${sanityEffects.visualDistortion * 25}deg)`,
          }}
        />
      )}

      {/* 4. Phantom shadow apparition flickering in periphery at low sanity */}
      {sanity < 35 && (
        <div
          className="absolute top-1/4 -right-12 w-64 h-96 bg-black/70 rounded-full blur-2xl pointer-events-none animate-pulse"
          style={{ opacity: (35 - sanity) / 35 * 0.7 }}
        />
      )}

      {/* TOP BAR CLUSTER */}
      <div className="flex items-start justify-between z-10 w-full pointer-events-auto">
        {/* Top-Left: School Location & Objective Counter */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-xs font-mono text-slate-300 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-semibold text-white tracking-wide">{locationName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-amber-950/40 text-xs font-mono text-amber-200/90 shadow-lg">
            <span className="text-amber-400 font-bold">RECOVER SEALS:</span>
            <span>
              {cluesDiscovered} / {totalClues}
            </span>
            <span className="text-slate-500">·</span>
            <span className={cluesDiscovered === totalClues ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {cluesDiscovered === totalClues ? 'Front Gate Unsealed!' : 'Exit Chained'}
            </span>
          </div>

          {isHiding && (
            <div className="mt-1 px-3 py-1 rounded bg-indigo-950/80 border border-indigo-600/40 text-xs font-mono text-indigo-200 animate-pulse">
              CONCEALED INSIDE LOCKER (Press [E] to exit)
            </div>
          )}
        </div>

        {/* Top-Right: Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJournal}
            aria-label="Open Evidence Journal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 hover:border-amber-400/50 text-xs font-mono text-slate-300 hover:text-amber-200 transition-colors shadow-lg"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Journal [Tab]</span>
          </button>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-black/70 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2 rounded-lg bg-black/70 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER HUD: Reticle, Contextual Interaction Prompt & Alerts */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none z-10">
        {/* Minimal Reticle */}
        {!isHiding && (
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 ring-2 ring-white/10 mb-4" />
        )}

        {/* Status Notification Toast */}
        {statusNotification && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-black/85 border border-amber-500/50 text-xs font-mono text-amber-200 shadow-2xl animate-fade-in">
            {statusNotification}
          </div>
        )}

        {/* Context Interaction Prompt */}
        {interactionPrompt && (
          <div className="px-5 py-2.5 rounded-xl bg-black/85 border border-white/20 text-sm font-semibold tracking-wide text-white shadow-2xl flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 text-xs font-mono text-amber-300">E</span>
            <span>{interactionPrompt}</span>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL DOCK (Collapsible & Compact) */}
      <div className="w-full max-w-4xl mx-auto z-10 pointer-events-auto">
        <div className="p-3 md:p-4 rounded-2xl bg-[#090b0e]/90 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 1. SANITY & ECG HEART RATE MONITOR */}
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-black/50 border ${sanityInfo.borderColor} min-w-[210px]`}>
            <Activity className={`w-5 h-5 shrink-0 ${sanity < 40 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">SANITY</span>
                <span className={`font-bold tabular-nums ${sanityInfo.color}`}>
                  {Math.round(sanity)}% · {sanityInfo.label}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    sanity > 50 ? 'bg-emerald-500' : sanity > 25 ? 'bg-amber-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${sanity}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. HANDHELD EMF & STATIC DETECTOR */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/50 border border-white/10 min-w-[190px]">
            <Radio className={`w-5 h-5 shrink-0 ${threatLevel > 0.4 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">EMF / STATIC</span>
                <span className={`font-bold tabular-nums ${threatLevel > 0.5 ? 'text-red-400' : 'text-slate-300'}`}>
                  {(threatLevel * 5).toFixed(1)} mG
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {emfLeds.map((thresh, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      threatLevel >= thresh
                        ? idx >= 3
                          ? 'bg-red-500 shadow-sm'
                          : idx === 2
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 3. FLASHLIGHT & SPRINT STAMINA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFlashlight}
              aria-label="Toggle Flashlight"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-mono ${
                isFlashlightOn
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Flashlight className={`w-4 h-4 ${isFlashlightOn ? 'text-amber-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="font-semibold leading-tight">Flashlight [F]</div>
                <div className="text-[10px] text-slate-400 tabular-nums">{Math.round(flashlightBattery)}%</div>
              </div>
            </button>

            {/* Stamina bar */}
            <div className="w-16 h-8 px-2 py-1 bg-black/50 border border-white/10 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-mono text-slate-400 leading-none">STAMINA</span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${stamina}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. LIMITED INVENTORY SLOTS (6 SLOTS) */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10">
            {Array.from({ length: 6 }).map((_, idx) => {
              const item = inventory[idx];
              const isSelected = selectedItemIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectItem(idx)}
                  title={item ? `${item.name} - ${item.description}` : 'Empty Slot'}
                  className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/50 shadow-md ring-1 ring-amber-400/50'
                      : item
                      ? 'border-white/20 bg-white/5 hover:bg-white/10'
                      : 'border-white/5 bg-transparent opacity-40'
                  }`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-400">
                    {idx + 1}
                  </span>
                  {item ? renderItemIcon(item.icon) : null}
                  {item?.quantity && item.quantity > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-amber-200">
                      x{item.quantity}
                    </span>
                  )}
                </button>
              );
            })}

            {activeItem && (
              <button
                onClick={onUseActiveItem}
                className="ml-1 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-black tracking-wider transition-colors"
              >
                USE
              </button>
            )}
          </div>
        </div>

        {/* Selected item description hint */}
        {activeItem && (
          <div className="mt-1.5 text-center text-[11px] font-mono text-amber-300/80">
            Equipped: <span className="font-semibold text-white">{activeItem.name}</span> — {activeItem.description}
          </div>
        )}
      </div>
    </div>
  );
};
