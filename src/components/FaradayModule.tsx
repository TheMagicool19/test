import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  BatteryCharging,
  BatteryWarning,
  ShieldAlert,
  CheckCircle2,
  Moon,
  Wind,
} from 'lucide-react';
import { submitFaradayCheckin } from '../services/api';
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  StatusDot,
  Field,
} from './ui/Page';

interface FaradayModuleProps {
  currentBattery: number;
  batteryStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL_OVERRIDE';
  onBatteryChange: (newBattery: number) => void;
}

type BreathingPhase = 'Inspira (4s)' | 'Trattieni (4s)' | 'Espira (4s)' | 'Pausa (4s)';

export const FaradayModule: React.FC<FaradayModuleProps> = ({
  currentBattery,
  batteryStatus,
  onBatteryChange,
}) => {
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [mentalFatigue, setMentalFatigue] = useState<number>(5);
  const [stressScore, setStressScore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);

  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('Inspira (4s)');
  const [isDecompressing, setIsDecompressing] = useState(false);

  const isCritical = currentBattery < 20;
  const isModerate = currentBattery < 50 && !isCritical;
  const tone = isCritical ? 'danger' : isModerate ? 'warning' : 'success';

  useEffect(() => {
    if (!isDecompressing) return;
    const phases: BreathingPhase[] = [
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
    <PageShell>
      <PageHeader
        code="C-06 · F.A.R.A.D.A.Y."
        title="Bio-energy & recovery"
        description={
          <>
            Monitora lo stato psicofisico e previene il sovraccarico cognitivo. Sotto il 20% di
            batteria N.I.C.O. blocca lo studio notturno e attiva i protocolli di decompressione
            forzata.
          </>
        }
        aside={
          <div className="flex items-center gap-2">
            <StatusDot
              tone={tone as 'success' | 'warning' | 'danger'}
              label={`Batteria ${currentBattery}% · ${batteryStatus}`}
            />
          </div>
        }
      />

      {/* ---- Override critico ---- */}
      {isCritical && (
        <Panel className="border-rose-500/30 bg-rose-500/[0.05]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-300/90">
                  Protocollo Omega attivo
                </div>
                <h2 className="mt-1 text-[13px] font-semibold text-ink">
                  Blocco di sicurezza dello studio notturno
                </h2>
                <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-ink-soft">
                  Batteria residua al <strong className="font-semibold text-ink">{currentBattery}%</strong>{' '}
                  (&lt;20%). L&apos;accesso ai moduli di studio intensivo L.E.W.I.S. è temporaneamente
                  revocato per prevenire burnout cognitivo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDecompressing(true)}
              className="btn-primary shrink-0 self-start sm:self-center"
            >
              <Wind className="h-3.5 w-3.5" />
              Avvia decompressione
            </button>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ---- State machine ---- */}
        <Panel className="lg:col-span-5">
          <PanelHeader
            icon={HeartPulse}
            label="State machine"
            title="Bio-batteria"
            aside={
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                0–100%
              </span>
            }
          />

          <div className="mt-4 rounded-xl border border-hairline bg-void/50 p-5 text-center">
            <div
              className={`font-mono text-[44px] font-semibold leading-none tracking-[-0.04em] ${
                isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {currentBattery}
              <span className="ml-0.5 text-[18px] font-normal text-ink-dim">%</span>
            </div>

            <Progress
              value={currentBattery}
              tone={tone as 'success' | 'warning' | 'danger'}
              className="mt-4"
            />

            <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
              <span>Sfinimento</span>
              <span className="font-semibold text-ink-soft">{batteryStatus}</span>
              <span>Ottimale</span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <label className="label-micro">Simula livello batteria</label>
              <span className="font-mono text-[10px] text-ink-dim">{currentBattery}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={currentBattery}
              onChange={(e) => onBatteryChange(parseInt(e.target.value))}
              className="range"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => onBatteryChange(15)}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-rose-400 transition-colors hover:text-rose-300"
              >
                Forza critico 15%
              </button>
              <button
                type="button"
                onClick={() => onBatteryChange(80)}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Ripristina 80%
              </button>
            </div>
          </div>

          {isDecompressing && (
            <div className="animate-fade-in mt-4 rounded-xl border border-hairline bg-accent/[0.06] p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-soft">
                <Wind className="h-3.5 w-3.5" />
                Box breathing 4-4-4-4
              </div>
              <div className="mt-2 font-mono text-[18px] font-semibold text-ink">
                {breathingPhase}
              </div>
              <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-relaxed text-ink-dim">
                Respirazione diaframmatica per abbassare il cortisolo e ripristinare il tono vagale.
              </p>
              <button
                onClick={() => setIsDecompressing(false)}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim underline underline-offset-4 transition-colors hover:text-ink-soft"
              >
                Termina sessione
              </button>
            </div>
          )}
        </Panel>

        {/* ---- Check-in serale ---- */}
        <Panel className="lg:col-span-7">
          <PanelHeader
            icon={Moon}
            label="Telegram sync"
            title="Questionario di check-in serale"
            aside={
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                Ogni sera · 21:00
              </span>
            }
          />

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-dim">
            N.I.C.O. invia un mini check-in su Telegram. I dati elaborati determinano l&apos;energia
            disponibile per il giorno successivo.
          </p>

          <form onSubmit={handleCheckin} className="mt-4 space-y-4">
            <Field label="Ore di sonno effettive" hint={`${sleepHours} h`}>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="range"
              />
            </Field>

            <Field label="Affaticamento mentale" hint={`${mentalFatigue}/10`}>
              <input
                type="range"
                min="1"
                max="10"
                value={mentalFatigue}
                onChange={(e) => setMentalFatigue(parseInt(e.target.value))}
                className="range"
              />
            </Field>

            <Field label="Stress percepito" hint={`${stressScore}/10`}>
              <input
                type="range"
                min="1"
                max="10"
                value={stressScore}
                onChange={(e) => setStressScore(parseInt(e.target.value))}
                className="range"
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5"
            >
              {isSubmitting ? (
                <>
                  <BatteryCharging className="h-4 w-4 animate-pulse" />
                  Calcolo stato energetico…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Invia check-in a F.A.R.A.D.A.Y.
                </>
              )}
            </button>
          </form>

          {checkinResult && (
            <div className="animate-fade-in mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300/90">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Check-in elaborato
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
                {checkinResult.protocol}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
            <span>Sentiment · VADER + Gemini</span>
            <span>Soglia decompressione · 20%</span>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
};
