import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BatteryCharging, 
  BatteryWarning, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Bot, 
  AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { SystemTelemetry } from '../types/navicella';
import { sound } from '../services/soundFx';

interface HeaderHUDProps {
  telemetry: SystemTelemetry | null;
  activeModuleTitle: string;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({ telemetry, activeModuleTitle }) => {
  const [time, setTime] = useState<string>('');
  const [soundActive, setSoundActive] = useState<boolean>(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('it-IT', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    sound.enabled = !soundActive;
    setSoundActive(!soundActive);
    if (!soundActive) {
      sound.playClick();
    }
  };

  const battery = telemetry?.faradayBattery ?? 68;
  const isBatteryCritical = battery < 20;
  const isBatteryModerate = battery < 50 && battery >= 20;

  // SVG Radial circle calculation
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const batteryOffset = circumference - (battery / 100) * circumference;

  return (
    <header className="relative border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 select-none z-40 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Brand & Central Orchestrator */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Layers className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-sans">
                NAVICELLA <span className="text-indigo-400 font-mono">V1.0</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/80 uppercase">
                Enterprise Suite
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="text-sky-400 font-medium flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> N.I.C.O. ORCHESTRATOR
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-sans font-medium">{activeModuleTitle}</span>
            </div>
          </div>
        </div>

        {/* Center: Live High-Contrast Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Faraday Battery Radial Gauge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            isBatteryCritical 
              ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-md shadow-rose-900/30 animate-pulse'
              : isBatteryModerate
                ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                : 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
          }`}>
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  stroke={isBatteryCritical ? '#f43f5e' : isBatteryModerate ? '#f59e0b' : '#10b981'}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={batteryOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-white font-mono">
                {battery}
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">BIO-ENERGY</div>
              <div className="font-bold flex items-center gap-1 leading-tight font-mono">
                <span>{battery}%</span>
                <span className="text-[10px] font-medium opacity-90">
                  {isBatteryCritical ? 'LOCKDOWN' : isBatteryModerate ? 'MODERATO' : 'OTTIMALE'}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Runway Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">RUNWAY TESORERIA</div>
              <div className="font-bold text-amber-400 font-mono leading-tight">
                {telemetry?.runwayMonths ?? 7.4} <span className="text-[10px] text-slate-400 font-normal">mesi</span>
              </div>
            </div>
          </div>

          {/* GPU Cluster Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
            <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">CLUSTER GPU</div>
              <div className="font-bold text-slate-100 font-mono flex items-center gap-1.5 leading-tight">
                <span>A100-40GB</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
            </div>
          </div>

          {/* Security Whitelist Status */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-[11px] font-bold">WHITELIST O(1)</div>
          </div>
        </div>

        {/* Right: Audio Feedback Toggle & Local Real Clock */}
        <div className="flex items-center gap-3 font-mono">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? 'Disattiva feedback audio' : 'Attiva feedback audio interfaccia'}
            className={`p-2 rounded-lg border font-medium transition-all ${
              soundActive
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Local Italian Clock */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-white">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold tracking-wider">{time || '00:00:00'}</span>
            </div>
            <div className="text-[10px] text-slate-400">ORA LOCALE</div>
          </div>

          {isBatteryCritical && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/30 animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5" /> OVERRIDE ATTIVO
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
