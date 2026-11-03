import React from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Database, 
  Atom, 
  Flame, 
  Calendar, 
  HeartPulse, 
  Wallet, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Zap, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { CompartmentId } from '../types/navicella';
import { sound } from '../services/soundFx';

interface EnterpriseArchitectureFlowProps {
  onSelectCompartment: (comp: CompartmentId) => void;
}

interface ServiceNode {
  id: CompartmentId;
  code: string;
  name: string;
  category: string;
  desc: string;
  status: string;
  throughput: string;
  color: string;
  bgLight: string;
  borderColor: string;
  btnBg: string;
  icon: any;
}

const SERVICE_NODES: ServiceNode[] = [
  {
    id: 'nico-ermes',
    code: 'C-01',
    name: 'E.R.M.E.S. Gateway',
    category: 'Ingestion & Proxy Webhook',
    desc: 'Riceve i webhook Telegram (testo, audio Whisper, immagini OCR), controlla la whitelist O(1) e instrada i payload.',
    status: 'ATTIVO',
    throughput: '< 150ms latenza',
    color: 'text-sky-400',
    bgLight: 'bg-sky-950/40',
    borderColor: 'border-sky-500/50 hover:border-sky-400',
    btnBg: 'bg-sky-600 hover:bg-sky-500 text-white',
    icon: Send,
  },
  {
    id: 'dna',
    code: 'C-02',
    name: 'D.N.A. Knowledge Vault',
    category: 'Stiva Dati & Vector RAG',
    desc: 'Gestione note Markdown Obsidian con frontmatter YAML. Filtro enzimatico deterministico e ricerca vettoriale cosine similarity.',
    status: 'INDICIZZATO',
    throughput: '3 note &bull; 512 tokens chunk',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/50 hover:border-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    icon: Database,
  },
  {
    id: 'lewis',
    code: 'C-03',
    name: 'L.E.W.I.S. CTF Reactor',
    category: 'Chimica & Metodo Feynman',
    desc: 'Cheminformatica RDKit, visualizzatore molecole SMILES, calcolo stechiometrico e sparring accademico rigoroso.',
    status: 'OPERATIVO',
    throughput: '3D Mol &bull; Rigore Severo',
    color: 'text-purple-400',
    bgLight: 'bg-purple-950/40',
    borderColor: 'border-purple-500/50 hover:border-purple-400',
    btnBg: 'bg-purple-600 hover:bg-purple-500 text-white',
    icon: Atom,
  },
  {
    id: 'forge',
    code: 'C-04',
    name: 'F.O.R.G.E. Cluster R&D',
    category: 'GPU Computing & DeepSeek-R1',
    desc: 'Tunnel SSH verso Google Colab (GPU NVIDIA A100), docking molecolare tensoriale e container Ollama locale per protezione IP.',
    status: 'ONLINE',
    throughput: 'NVIDIA A100-40GB &bull; 34% carico',
    color: 'text-orange-400',
    bgLight: 'bg-orange-950/40',
    borderColor: 'border-orange-500/50 hover:border-orange-400',
    btnBg: 'bg-orange-600 hover:bg-orange-500 text-white',
    icon: Flame,
  },
  {
    id: 'route',
    code: 'C-05',
    name: 'R.O.U.T.E. Scheduling',
    category: 'Gestione Turni & Timeboxing',
    desc: 'Parsing linguaggio naturale dei turni di lavoro, sincronizzazione Google Calendar API e timeboxing automatico per lo studio.',
    status: 'SINCRONIZZATO',
    throughput: '2 turni &bull; 2 esami attivi',
    color: 'text-blue-400',
    bgLight: 'bg-blue-950/40',
    borderColor: 'border-blue-500/50 hover:border-blue-400',
    btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
    icon: Calendar,
  },
  {
    id: 'faraday',
    code: 'C-06',
    name: 'F.A.R.A.D.A.Y. Bio-Energy',
    category: 'Monitor Burnout & Recupero',
    desc: 'State machine energia psicofisica (0-100%), sentiment analysis dei messaggi e override di sicurezza obbligatorio sotto il 20%.',
    status: 'MONITORAGGIO',
    throughput: 'Soglia Omega: 20%',
    color: 'text-rose-400',
    bgLight: 'bg-rose-950/40',
    borderColor: 'border-rose-500/50 hover:border-rose-400',
    btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
    icon: HeartPulse,
  },
  {
    id: 'ledger',
    code: 'C-07',
    name: 'L.E.D.G.E.R. Tesoreria',
    category: 'Finanze & Runway Sheets',
    desc: 'Tracciamento spese con Google Sheets API (GAS), calcolo automatico della runway residua e trigger verso il Vault D.N.A.',
    status: 'SINCRONIZZATO',
    throughput: '7.4 mesi Runway',
    color: 'text-amber-400',
    bgLight: 'bg-amber-950/40',
    borderColor: 'border-amber-500/50 hover:border-amber-400',
    btnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
    icon: Wallet,
  },
];

export const EnterpriseArchitectureFlow: React.FC<EnterpriseArchitectureFlowProps> = ({
  onSelectCompartment,
}) => {
  const handleClick = (comp: CompartmentId) => {
    sound.playClick();
    onSelectCompartment(comp);
  };

  return (
    <section className="surface surface-edge space-y-6 overflow-hidden p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <Layers className="h-2.5 w-2.5 text-accent-soft" />
              Topologia microservizi
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
              Architettura distribuita V1.0
            </span>
          </div>
          <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-ink">
            Topologia operativa e orchestrazione N.I.C.O.
          </h2>
          <p className="mt-1 max-w-3xl text-[11.5px] leading-relaxed text-ink-dim">
            Ogni input Telegram viene sanificato da E.R.M.E.S., classificato dal router semantico
            N.I.C.O. ed eseguito sui 7 microservizi specializzati di gestione, calcolo scientifico
            e tesoreria.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            7 servizi attivi
          </span>
        </div>
      </div>

      {/* Central Orchestrator Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-accent/25 bg-accent/[0.055] p-4 sm:p-5 md:flex-row md:items-center">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/15 text-accent-soft">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-semibold text-ink">N.I.C.O. Core</h3>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-accent-soft">
                Neural Interactive Co-Operator
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-300/90">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Router attivo
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-ink-soft">
              Motore semantico con <strong className="font-semibold text-ink">function calling strutturato</strong>{' '}
              (Gemini): esegue la classificazione dell&apos;intento e smista le chiamate API verso il
              compartimento dedicato.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleClick('nico-ermes')}
          className="btn-primary shrink-0 self-start md:self-center"
        >
          Apri console N.I.C.O.
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grid dei 7 microservizi */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SERVICE_NODES.map((node) => {
          const Icon = node.icon;
          return (
            <motion.button
              key={node.id}
              type="button"
              onClick={() => handleClick(node.id)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="surface-2 surface-interactive group flex flex-col justify-between p-4 text-left"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.04] text-ink-soft transition-colors group-hover:text-accent-soft">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-dim">
                    <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
                    {node.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-accent-soft/80">
                    {node.code}
                  </span>
                  <span className="truncate text-[12.5px] font-semibold text-ink">
                    {node.name}
                  </span>
                </div>

                <div className="mt-0.5 font-mono text-[10px] text-ink-dim">{node.category}</div>

                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft/85">
                  {node.desc}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-2.5">
                <span className="truncate font-mono text-[10px] text-ink-dim">{node.throughput}</span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-dim transition-colors group-hover:text-accent-soft">
                  Apri
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
