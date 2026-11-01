import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Moon, 
  Wind, 
  Sparkles, 
  Activity,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { submitFaradayCheckin } from '../services/api';

interface FaradayModuleProps {
  currentBattery: number;
  batteryStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL_OVERRIDE';
  onBatteryChange: (newBattery: number) => void;
}

export const FaradayModule: React.FC<FaradayModuleProps> = ({
  currentBattery,
  batteryStatus,
  onBatteryChange,
}) => {
  // Evening Check-in Form State
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [mentalFatigue, setMentalFatigue] = useState<number>(5);
  const [stressScore, setStressScore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);

  // Decompression Breathing Timer
  const [breathingPhase, setBreathingPhase] = useState<'Inspira (4s)' | 'Trattieni (4s)' | 'Espira (4s)' | 'Pausa (4s)'>('Inspira (4s)');
  const [isDecompressing, setIsDecompressing] = useState(false);

  const isCritical = currentBattery < 20;

  useEffect(() => {
    if (!isDecompressing) return;
    const phases: ('Inspira (4s)' | 'Trattieni (4s)' | 'Espira (4s)' | 'Pausa (4s)')[ ] = [
      'Inspira (4s)',
      'Trattieni (4s)',
      'Espira (4s)',
      'Pausa (4s)',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setBreathingPhase(phases[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isDecompressing]);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitFaradayCheckin({ sleepHours, mentalFatigue, stressScore });
      setCheckinResult(res);
      onBatteryChange(res.battery);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400">
              C-06: F.A.R.A.D.A.Y. (BURNOUT PREVENTION & BIO-STATE)
            </span>
            <span className="text-xs font-mono text-slate-400">
              STATE MACHINE BIO-BATTERY &bull; SAFETY OVERRIDE &bull; PROTOCOLLO OMEGA
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            F.A.R.A.D.A.Y. BIO-ENERGY & RECOVERY
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Monitora lo stato psicofisico e previene il sovraccarico cognitivo. 
            Se la batteria scende sotto il 20%, N.I.C.O. blocca attivamente lo studio notturno e attiva protocolli di decompressione forzata.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isCritical
            ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
            : currentBattery < 50
              ? 'bg-amber-950 text-amber-300 border-amber-600'
              : 'bg-emerald-950 text-emerald-300 border-emerald-600'
        }`}>
          {isCritical ? <BatteryWarning className="w-4 h-4 text-rose-400" /> : <BatteryCharging className="w-4 h-4" />}
          <span>Batteria: {currentBattery}% &bull; {batteryStatus}</span>
        </div>
      </div>

      {/* Critical Override Banner (if < 20%) */}
      {isCritical && (
        <div className="rounded-xl border border-rose-500/80 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950/60 p-5 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-rose-900/60 border border-rose-500 text-rose-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                  ⚠️ ALLERTA CRITICA F.A.R.A.D.A.Y. - PROTOCOLLO OMEGA ATTIVO
                </div>
                <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                  BLOCCO DI SICUREZZA STUDIO NOTTURNO ENFORCED
                </h2>
                <p className="text-xs text-slate-300 font-sans mt-1">
                  La batteria residua è al <strong>{currentBattery}%</strong> (&lt;20%). 
                  N.I.C.O. ha temporaneamente revocato l'accesso ai moduli di studio intensivo L.E.W.I.S. per prevenire burnout cognitivo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDecompressing(true)}
              className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all whitespace-nowrap self-start sm:self-center shadow-lg"
            >
              Avvia Decompressione Guidata (Box Breathing)
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Battery State Machine (Left) & Evening Check-in (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Bio-State Gauge & Manual Simulation Slider */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400" /> STATE MACHINE BIO-BATTERIA
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              Parametro: 0-100%
            </span>
          </div>

          {/* Large Battery Gauge */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight flex items-center justify-center gap-2">
              <span className={
                isCritical 
                  ? 'text-rose-400' 
                  : currentBattery < 50 
                    ? 'text-amber-400' 
                    : 'text-emerald-400'
              }>
                {currentBattery}%
              </span>
            </div>
            
            {/* Visual Battery Bar */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCritical 
                    ? 'bg-rose-500' 
                    : currentBattery < 50 
                      ? 'bg-amber-400' 
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${currentBattery}%` }}
              ></div>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center justify-between px-1">
              <span>0% Sfinimento</span>
              <span className="text-slate-300 font-bold">{batteryStatus}</span>
              <span>100% Ottimale</span>
            </div>
          </div>

          {/* Test Controls to adjust battery for demonstration */}
          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <label className="block text-slate-300 font-bold">
              Simula Livello Batteria (Test Rapido State Machine):
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={currentBattery}
              onChange={(e) => onBatteryChange(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => onBatteryChange(15)}
                className="text-rose-400 underline hover:text-rose-300"
              >
                Forza Critico (15%)
              </button>
              <button
                type="button"
                onClick={() => onBatteryChange(80)}
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                Ripristina Ottimale (80%)
              </button>
            </div>
          </div>

          {/* Decompression Guidance Widget */}
          {isDecompressing && (
            <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/40 text-center space-y-2 animate-fadeIn">
              <div className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-center gap-1.5 uppercase">
                <Wind className="w-4 h-4 text-cyan-400 animate-spin" /> BOX BREATHING 4-4-4-4
              </div>
              <div className="text-lg font-bold font-mono text-white py-2">
                {breathingPhase}
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Concentrati sul respiro diaframmatico per abbassare il cortisolo e ripristinare il tono vagale.
              </p>
              <button
                onClick={() => setIsDecompressing(false)}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 underline pt-1"
              >
                Termina sessione
              </button>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Evening Check-in Quiz & Sentiment History */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
              <Moon className="w-4 h-4 text-rose-400" /> QUESTIONARIO DI CHECK-IN SERALE
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              TELEGRAM SYNC
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans">
            Ogni sera N.I.C.O. invia un mini check-in su Telegram. I dati vengono elaborati per calcolare l'energia del giorno seguente.
          </p>

          <form onSubmit={handleCheckin} className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Ore di Sonno Effettive (notte precedente):</span>
                <span className="text-cyan-400 font-bold">{sleepHours} ore</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Affaticamento Mentale / Carico Cognitivo:</span>
                <span className="text-amber-400 font-bold">{mentalFatigue}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mentalFatigue}
                onChange={(e) => setMentalFatigue(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Livello di Stress Percepito:</span>
                <span className="text-rose-400 font-bold">{stressScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressScore}
                onChange={(e) => setStressScore(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Calcolo stato energetico...' : 'Invia Check-in Serale a F.A.R.A.D.A.Y.'}
            </button>
          </form>

          {checkinResult && (
            <div className="p-3.5 rounded-lg border border-slate-700 bg-slate-950/80 text-xs font-mono space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CHECK-IN ELABORATO CON SUCCESSO:
              </div>
              <div className="text-slate-300 font-sans text-xs">
                {checkinResult.protocol}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Sentiment Analyzer: VADER + Gemini</span>
            <span>Soglia di Decompressione: 20%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
