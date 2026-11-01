import React, { useState } from 'react';
import { 
  Layers, 
  Send, 
  Database, 
  Atom, 
  Flame, 
  Calendar, 
  HeartPulse, 
  Wallet, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Zap, 
  Terminal, 
  FileText,
  AlertCircle,
  Bot,
  Sparkles
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

export const BridgeOverview: React.FC<BridgeOverviewProps> = ({
  telemetry,
  onNavigate,
  onExecutePrompt,
  recentLogs,
}) => {
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [activeScenarioResult, setActiveScenarioResult] = useState<any>(null);

  // Exact scenario from section 3 of technical specification
  const runSection3Demo = async () => {
    sound.playTelemetryChirp();
    setIsRunningScenario(true);
    setPipelineStep(1); // ERMES Audio received
    setActiveScenarioResult(null);

    try {
      setTimeout(() => { setPipelineStep(2); sound.playTelemetryChirp(); }, 700); // Whisper STT
      setTimeout(() => { setPipelineStep(3); sound.playTelemetryChirp(); }, 1400); // NICO Intent Routing
      setTimeout(() => { setPipelineStep(4); sound.playTelemetryChirp(); }, 2100); // LEDGER execution & Runway
      setTimeout(() => { setPipelineStep(5); sound.playTelemetryChirp(); }, 2800); // DNA Sub-routine stub

      const result = await onExecutePrompt(
        'Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata',
        'TELEGRAM_VOICE'
      );
      
      setPipelineStep(6); // Final output to Telegram
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
      title: 'Tracciamento Spesa Multi-Modulo (Specifica Sez. 3)',
      prompt: 'Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata',
      type: 'Audio / Voice',
      badgeBg: 'bg-indigo-600 text-white',
      desc: 'Pipeline: E.R.M.E.S. + N.I.C.O. + L.E.D.G.E.R. + auto-stub Obsidian in D.N.A.',
      action: runSection3Demo,
    },
    {
      title: 'Pianificazione Turno Lavoro & Timeboxing',
      prompt: 'Domani lavoro 14-18, aggiorna il calendario e ricalcola i blocchi studio',
      type: 'Testo / NL',
      badgeBg: 'bg-blue-600 text-white',
      desc: 'Invia chiamata a R.O.U.T.E., aggiorna Google Calendar e countdown esami CTF.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Domani lavoro 14-18, turno clinico farmacia', 'TELEGRAM_TEXT');
      },
    },
    {
      title: 'Segnalazione Burnout F.A.R.A.D.A.Y.',
      prompt: 'Sono distrutto stasera, livello di energia a zero e forte cefalea',
      type: 'Bio-State',
      badgeBg: 'bg-rose-600 text-white',
      desc: 'Attiva State Machine, decremento batteria e blocco di sicurezza studio.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Sono distrutto stasera, livello di energia a zero e forte cefalea', 'TELEGRAM_TEXT');
      },
    },
    {
      title: 'Sparring Accademico L.E.W.I.S. (Feynman)',
      prompt: 'Spiegami la cinetica della reazione di Diels-Alder ed enantioselettività',
      type: 'CTF Sparring',
      badgeBg: 'bg-purple-600 text-white',
      desc: 'Attiva la modalità "Esaminatore Implacabile" con chain-of-thought rigoroso.',
      action: () => {
        sound.playClick();
        onExecutePrompt('Spiegami la cinetica della reazione di Diels-Alder ed enantioselettività', 'TELEGRAM_TEXT');
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Command Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                SISTEMA OPERATIVO ATTIVO
              </span>
              <span className="text-xs font-mono text-slate-400 font-medium">
                GATEWAY: TELEGRAM BOT API &bull; ROUTER: N.I.C.O.
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Centro di Controllo & Gestione Agenti <span className="text-indigo-400">Navicella</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
              Piattaforma gestionale automatizzata ad architettura ad agenti. 
              Unifica l'ingestion multimodale da Telegram (testo, vocali Whisper, immagini OCR), 
              lo smistamento semantico N.I.C.O. e l'orchestrazione verso il Vault PKM (D.N.A.), 
              la cheminformatica CTF (L.E.W.I.S.), i cluster GPU (F.O.R.G.E.), i turni di lavoro (R.O.U.T.E.), 
              il bilancio energetico (F.A.R.A.D.A.Y.) e la tesoreria (L.E.D.G.E.R.).
            </p>
          </div>

          {/* Featured Action: Run Live Data Flow from Spec 3 with High Contrast Button */}
          <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 min-w-[320px] shadow-2xl flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-indigo-400/50 shadow-md shrink-0">
                  <img
                    src={nicoCoreImg}
                    alt="N.I.C.O. Neural Core"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> PIPELINE TEST RAPIDO
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    Specifica Sezione 3 (Multi-Modulo)
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-200 mb-3.5 italic font-sans bg-slate-900 p-3 rounded-xl border border-slate-800">
                "Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata"
              </div>
            </div>

            <button
              onClick={runSection3Demo}
              disabled={isRunningScenario}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunningScenario ? 'ORCHESTRAZIONE IN CORSO...' : 'LANCIA TEST MULTI-MODULO'}</span>
            </button>
          </div>
        </div>

        {/* Live Step-by-Step Visualization Pipeline */}
        {pipelineStep > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800 font-mono text-xs">
            <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-spin" /> ESECUZIONE MULTI-MODULO STEP-BY-STEP (LIVE PIPELINE):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 1 ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">FASE 1</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  E.R.M.E.S. {pipelineStep >= 1 && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 inline" />}
                </div>
                <div className="text-[10px] opacity-85 mt-0.5">Webhook POST & Whitelist O(1)</div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 2 ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">FASE 2</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  WHISPER / STT {pipelineStep >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 inline" />}
                </div>
                <div className="text-[10px] opacity-85 mt-0.5">Trascrizione & Sanitizzazione</div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 3 ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">FASE 3</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  N.I.C.O. ROUTER {pipelineStep >= 3 && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 inline" />}
                </div>
                <div className="text-[10px] opacity-85 mt-0.5">Intent Finanza / Function Call</div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 4 ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">FASE 4</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  L.E.D.G.E.R. {pipelineStep >= 4 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 inline" />}
                </div>
                <div className="text-[10px] opacity-85 mt-0.5">Google Sheets & Runway Calc</div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 5 ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-slate-400 font-bold">FASE 5</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  D.N.A. SUBROUTINE {pipelineStep >= 5 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
                </div>
                <div className="text-[10px] opacity-85 mt-0.5">Creazione Stub Vault Obsidian</div>
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                pipelineStep >= 6 ? 'bg-emerald-900 border-emerald-400 text-white shadow-md' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] text-emerald-200 font-bold">FASE 6</div>
                <div className="font-bold flex items-center gap-1 text-white">
                  TELEGRAM BOT {pipelineStep >= 6 && <CheckCircle2 className="w-3.5 h-3.5 text-white inline" />}
                </div>
                <div className="text-[10px] opacity-90 mt-0.5">Output inviato all'utente</div>
              </div>
            </div>

            {activeScenarioResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-700/80 text-emerald-200 flex items-start gap-3 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-white text-xs">Risposta Confermata inviata su Telegram:</div>
                  <div className="text-slate-100 font-sans text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {activeScenarioResult.telegramReply}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enterprise Architecture & Agent Flow Monitor (Replaces spaceship viewer) */}
      <EnterpriseArchitectureFlow onSelectCompartment={onNavigate} />

      {/* Recharts Global Telemetry Stats (Faraday Bio-Battery & Ledger Monthly Expenses) */}
      <GlobalTelemetryStats telemetry={telemetry} />

      {/* Quick Scenarios Deck & Recent Telemetry Log with High Contrast Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preset Operational Scenarios */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Protocolli di Test Rapido (Natural Language Intent)
            </h3>
            <span className="text-[11px] text-slate-400">1-Click Dispatcher</span>
          </div>

          <div className="space-y-3">
            {quickScenarios.map((sc, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${sc.badgeBg}`}>
                      {sc.type}
                    </span>
                    {sc.title}
                  </div>
                  <div className="text-xs text-slate-300 italic font-sans">
                    "{sc.prompt}"
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sc.desc}
                  </div>
                </div>

                <button
                  onClick={sc.action}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap self-start sm:self-center transition-all shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 shrink-0"
                >
                  Invia a N.I.C.O.
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Telemetry Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Log Eventi & Audit Trail
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                LIVE STREAM
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl my-4">
                Nessun evento ancora registrato. Esegui un comando o testa uno scenario qui a sinistra.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 mt-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-bold">{log.targetCompartment}</span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-200 font-sans truncate text-xs">
                      <span className="text-slate-400 font-mono">INPUT:</span> "{log.rawInput}"
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                      <span className="text-amber-400 font-bold">FN: {log.functionName}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-bold">{log.latencyMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-800 flex items-center justify-between">
            <span>Orchestratore N.I.C.O.: Operativo</span>
            <span className="text-slate-300 font-semibold">Gemini 3.8 Flash Function Calling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
