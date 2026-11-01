import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { SystemTelemetry } from '../types/navicella';
import { sound } from '../services/soundFx';

interface HeaderHUDProps {
  telemetry: SystemTelemetry | null;
  activeModuleTitle: string;
}

/** Singola metrica: etichetta micro + valore mono. Niente box, solo tipografia. */
const Metric: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  dotClassName?: string;
  className?: string;
}> = ({ label, value, hint, dotClassName, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {dotClassName ? (
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} />
    ) : null}
    <div className="leading-none">
      <div className="label-micro">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5 font-mono text-[11px] font-semibold text-ink">
        <span>{value}</span>
        {hint ? (
          <span className="text-[10px] font-normal text-ink-dim">{hint}</span>
        ) : null}
      </div>
    </div>
  </div>
);

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

  const batteryDot = isBatteryCritical
    ? 'bg-rose-400 shadow-[0_0_8px_2px_rgba(244,63,94,0.45)]'
    : isBatteryModerate
      ? 'bg-amber-400 shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]'
      : 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]';

  const batteryBar = isBatteryCritical
    ? 'bg-rose-400'
    : isBatteryModerate
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <header className="relative border-b border-hairline bg-panel select-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/* ---- Brand ---- */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-hairline-strong bg-gradient-to-b from-white/12 to-white/[0.02] shadow-sm">
            <span className="font-mono text-[13px] font-bold leading-none tracking-tight text-ink">
              N
            </span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-void" />
          </div>

          <div className="hidden leading-none sm:block">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold tracking-tight text-ink">
                Navicella
              </span>
              <span className="rounded border border-hairline bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-ink-dim">
                V1.0
              </span>
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
              Enterprise Suite
            </div>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-hairline md:block" />

        {/* ---- Breadcrumb del compartimento ---- */}
        <div className="hidden min-w-0 flex-1 items-center gap-2 font-mono text-[11px] md:flex">
          <span className="text-ink-dim">N.I.C.O.</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-ink-dim/60" />
          <span className="truncate text-ink-soft" title={activeModuleTitle}>
            {activeModuleTitle}
          </span>
        </div>

        {/* ---- Metriche operative ---- */}
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${batteryDot}`} />
            <div className="leading-none">
              <div className="label-micro">Bio-energy</div>
              <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] font-semibold text-ink">
                <span>{battery}%</span>
                <span className="h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full transition-all duration-500 ${batteryBar}`}
                    style={{ width: `${Math.max(2, Math.min(100, battery))}%` }}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-hairline" />

          <Metric
            label="Runway"
            value={telemetry?.runwayMonths ?? 7.4}
            hint="mesi"
            dotClassName="bg-amber-400/70"
          />

          <div className="h-7 w-px bg-hairline" />

          <Metric label="Cluster GPU" value="A100-40GB" dotClassName="bg-emerald-400/70" />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          {/* Whitelist */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-hairline bg-white/[0.03] px-2 py-1.5 text-emerald-300/90 md:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
              Whitelist O(1)
            </span>
          </div>

          {/* Alert critico */}
          {isBatteryCritical && (
            <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                Override
              </span>
            </div>
          )}

          {/* Audio */}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundActive}
            aria-label={soundActive ? 'Disattiva feedback audio' : 'Attiva feedback audio'}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
              soundActive
                ? 'border-accent/40 bg-accent/15 text-accent-soft'
                : 'border-hairline bg-white/[0.03] text-ink-dim hover:text-ink-soft'
            }`}
          >
            {soundActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Orologio */}
          <div className="hidden items-center gap-2 rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1.5 sm:flex">
            <Clock className="h-3.5 w-3.5 text-ink-dim" />
            <span className="font-mono text-[11px] font-semibold tracking-tight text-ink">
              {time || '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Hairline luminosa di chiusura */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
};
