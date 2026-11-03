import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Terminal,
  Activity,
  ArrowUpRight,
  Bot,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { SystemTelemetry, CompartmentId, RoutingLogItem } from '../types/navicella';
import { GlobalTelemetryStats } from './GlobalTelemetryStats';
import { EnterpriseArchitectureFlow } from './EnterpriseArchitectureFlow';
import { sound } from '../services/soundFx';
import nicoCoreImg from '../assets/images/nico_core_hologram_1793542128851.jpg';

interface BridgeOverviewProps {
  telemetry: SystemTelemetry | null;
  onNavigate: (module: CompartmentId) => void;
  onExecutePrompt: (prompt: string, source?: string) => Promise<any>;
  recentLogs: RoutingLogItem[];
}

const PIPELINE_STEPS = [
  { phase: 'Fase 1', name: 'E.R.M.E.S.', desc: 'Webhook POST · whitelist O(1)' },
  { phase: 'Fase 2', name: 'Whisper / STT', desc: 'Trascrizione · sanitizzazione' },
  { phase: 'Fase 3', name: 'N.I.C.O. Router', desc: 'Intent · function calling' },
  { phase: 'Fase 4', name: 'L.E.D.G.E.R.', desc: 'Sheets · calcolo runway' },
  { phase: 'Fase 5', name: 'D.N.A.', desc: 'Stub vault Obsidian' },
  { phase: 'Fase 6', name: 'Telegram Bot', desc: 'Output all\u2019utente' },
];

/** Intestazione di sezione: label micro + titolo, allineati a sinistra. */
const SectionHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  aside?: React.ReactNode;
}> = ({ icon: Icon, label, title, aside }) => (
  <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.04] text-ink-soft">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="leading-tight">
        <div className="label-micro">{label}</div>
        <h2 className="mt-1 text-[13px] font-semibold text-ink">{title}</h2>
      </div>
    </div>
    {aside ? <div className="shrink-0 pt-1">{aside}</div> : null}
  </div>
);

export const BridgeOverview: React.FC<BridgeOverviewProps> = ({
  telemetry,
  onNavigate,
  onExecutePrompt,
  recentLogs,
}) => {
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [activeScenarioResult, setActiveScenarioResult] = useState<any>(null);

  // Scenario integrale dalla Sezione 3 della specifica tecnica
  const runSection3Demo = async () => {
    sound.playTelemetryChirp();
    setIsRunningScenario(true);
    setPipelineStep(1);
    setActiveScenarioResult(null);

    try {
      setTimeout(() => { setPipelineStep(2); sound.playTelemetryChirp(); }, 700);
      setTimeout(() => { setPipelineStep(3); sound.playTelemetryChirp(); }, 1400);
      setTimeout(() => { setPipelineStep(4); sound.playTelemetryChirp(); }, 2100);
      setTimeout(() => { setPipelineStep(5); sound.playTelemetryChirp(); }, 2800);

      const result = await onExecutePrompt(
        'Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata',
        'TELEGRAM_VOICE'
      );

      setPipelineStep(6);
      sound.playSuccessChime();
      setActiveScenarioResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningScenario(false);
    }
  };

  const quickScenarios = [
    {
      title: 'Tracciamento Spesa Multi-Modulo',
      spec: 'Specifica Sez. 3',
      prompt: 'Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata',
      type: 'Audio',
      desc: 'E.R.M.E.S. → N.I.C.O. → L.E.D.G.E.R. → auto-stub Obsidian in D.N.A.',
      action: runSection3Demo,
    },
    {
      title: 'Pianificazione Turno & Timeboxing',
      spec: 'R.O.U.T.E.',
      prompt: 'Domani lavoro 14-18, aggiorna il calendario e ricalcola i blocchi studio',
      type: 'Testo',
      desc: 'Aggiorna Google Calendar e i countdown degli esami CTF.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Domani lavoro 14-18, turno clinico farmacia', 'TELEGRAM_TEXT');
      },
    },
    {
      title: 'Segnalazione Burnout',
      spec: 'F.A.R.A.D.A.Y.',
      prompt: 'Sono distrutto stasera, livello di energia a zero e forte cefalea',
      type: 'Bio-State',
      desc: 'Attiva la state machine, decrementa la batteria, blocca lo studio.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Sono distrutto stasera, livello di energia a zero e forte cefalea', 'TELEGRAM_TEXT');
      },
    },
    {
      title: 'Sparring Accademico (Feynman)',
      spec: 'L.E.W.I.S.',
      prompt: 'Spiegami la cinetica della reazione di Diels-Alder ed enantioselettività',
      type: 'CTF',
      desc: 'Modalità "esaminatore implacabile" con chain-of-thought rigoroso.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Spiegami la cinetica della reazione di Diels-Alder ed enantioselettività', 'TELEGRAM_TEXT');
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      {/* ================= HERO ================= */}
      <section className="surface surface-edge animate-fade-up overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-12 lg:gap-8">
          {/* Copy */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Sistema operativo
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                Gateway Telegram Bot API · Router N.I.C.O.
              </span>
            </div>

            <h1 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[32px]">
              Centro di controllo e orchestrazione agenti
              <span className="text-accent-soft"> Navicella</span>
            </h1>

            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              Piattaforma gestionale ad architettura multi-agente. Unifica l&apos;ingestion
              multimodale da Telegram &mdash; testo, vocali Whisper, immagini OCR &mdash; lo
              smistamento semantico N.I.C.O. e l&apos;orchestrazione verso vault PKM (D.N.A.),
              cheminformatica CTF (L.E.W.I.S.), cluster GPU (F.O.R.G.E.), turni di lavoro
              (R.O.U.T.E.), bilancio energetico (F.A.R.A.D.A.Y.) e tesoreria (L.E.D.G.E.R.).
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button className="btn-ghost" type="button" onClick={() => onNavigate('architecture')}>
                <Sparkles className="h-3.5 w-3.5" />
                Specifiche tecniche
              </button>
              <button className="btn-ghost" type="button" onClick={() => onNavigate('nico-ermes')}>
                <Bot className="h-3.5 w-3.5" />
                Console N.I.C.O.
              </button>
            </div>
          </div>

          {/* Console di test */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-hairline bg-void/60 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={nicoCoreImg}
                  alt="N.I.C.O. Neural Core"
                  className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div className="min-w-0">
                  <div className="label-micro">Pipeline test rapido</div>
                  <div className="mt-1 truncate text-[12px] font-semibold text-ink">
                    Flusso multi-modulo end-to-end
                  </div>
                </div>
                <span className="ml-auto shrink-0 font-mono text-[10px] font-semibold text-ink-dim">
                  6 fasi
                </span>
              </div>

              <p className="mt-3 rounded-lg border border-hairline bg-panel-2/80 p-3 font-sans text-[12px] italic leading-relaxed text-ink-soft">
                &ldquo;Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata&rdquo;
              </p>

              <button
                type="button"
                onClick={runSection3Demo}
                disabled={isRunningScenario}
                className="btn-primary mt-3 w-full"
              >
                {isRunningScenario ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Orchestrazione in corso…
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Lancia test multi-modulo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ---- Stepper pipeline ---- */}
        {pipelineStep > 0 && (
          <div className="animate-fade-in border-t border-hairline bg-void/40 px-5 py-5 sm:px-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="label-micro">Esecuzione live · pipeline</span>
              <span className="font-mono text-[10px] font-semibold text-ink-dim">
                {Math.min(pipelineStep, 6)}/6
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PIPELINE_STEPS.map((step, idx) => {
                const done = pipelineStep >= idx + 1;
                return (
                  <div
                    key={step.name}
                    className={`rounded-lg border p-2.5 transition-colors duration-300 ${
                      done
                        ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                        : 'border-hairline bg-white/[0.015]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[9px] font-semibold uppercase tracking-[0.1em] ${
                          done ? 'text-emerald-300/80' : 'text-ink-dim/70'
                        }`}
                      >
                        {step.phase}
                      </span>
                      {done && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <div
                      className={`mt-1.5 text-[11px] font-semibold leading-tight ${
                        done ? 'text-ink' : 'text-ink-dim'
                      }`}
                    >
                      {step.name}
                    </div>
                    <div className="mt-1 text-[10px] leading-snug text-ink-dim">{step.desc}</div>
                  </div>
                );
              })}
            </div>

            {activeScenarioResult && (
              <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300/90">
                    Risposta confermata · inviata su Telegram
                  </span>
                </div>
                <p className="mt-2 rounded-md border border-hairline bg-void/50 p-3 text-[12px] leading-relaxed text-ink-soft">
                  {activeScenarioResult.telegramReply}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= MAPPA ARCHITETTURA & TELEMETRIA ================= */}
      <EnterpriseArchitectureFlow onSelectCompartment={onNavigate} />

      <GlobalTelemetryStats telemetry={telemetry} />

      {/* ================= PROTOCOLLI + AUDIT TRAIL ================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Protocolli */}
        <section className="surface surface-edge animate-fade-up overflow-hidden">
          <SectionHeader
            icon={Terminal}
            label="Dispatcher"
            title="Protocolli di test rapido"
            aside={
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                Intent NL
              </span>
            }
          />

          <ul className="divide-y divide-white/[0.05]">
            {quickScenarios.map((sc) => (
              <li
                key={sc.title}
                className="group flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-hairline bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                      {sc.type}
                    </span>
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {sc.title}
                    </span>
                    <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-dim/70 sm:inline">
                      {sc.spec}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11.5px] italic text-ink-soft/80">
                    &ldquo;{sc.prompt}&rdquo;
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-dim">{sc.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={sc.action}
                  className="btn-ghost shrink-0 self-start opacity-90 group-hover:border-hairline-strong group-hover:text-ink sm:self-center"
                >
                  Esegui
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Audit trail */}
        <section className="surface surface-edge animate-fade-up flex flex-col overflow-hidden">
          <SectionHeader
            icon={Activity}
            label="Telemetria"
            title="Log eventi & audit trail"
            aside={
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            }
          />

          <div className="flex-1 px-5 py-4">
            {recentLogs.length === 0 ? (
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-hairline px-6 text-center font-mono text-[11px] leading-relaxed text-ink-dim">
                Nessun evento registrato.
                <br />
                Esegui un protocollo per popolare l&apos;audit trail.
              </div>
            ) : (
              <ul className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-lg border border-hairline bg-white/[0.02] p-3 transition-colors hover:border-hairline-strong hover:bg-white/[0.035]"
                  >
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px]">
                      <span className="truncate font-semibold uppercase tracking-[0.06em] text-accent-soft/90">
                        {log.targetCompartment}
                      </span>
                      <span className="shrink-0 text-ink-dim">
                        {new Date(log.timestamp).toLocaleTimeString('it-IT')}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-[11.5px] text-ink-soft">
                      &ldquo;{log.rawInput}&rdquo;
                    </p>
                    <div className="mt-2 flex items-center gap-2 border-t border-white/[0.05] pt-2 font-mono text-[10px]">
                      <span className="text-ink-dim">fn</span>
                      <span className="font-semibold text-ink-soft">{log.functionName}</span>
                      <span className="text-ink-dim/50">·</span>
                      <span
                        className={
                          log.status === 'ERROR'
                            ? 'font-semibold text-rose-400'
                            : 'font-semibold text-emerald-400'
                        }
                      >
                        {log.latencyMs}ms
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
            <span>N.I.C.O. · operativo</span>
            <span className="text-ink-soft">Gemini Function Calling</span>
          </div>
        </section>
      </div>
    </div>
  );
};
