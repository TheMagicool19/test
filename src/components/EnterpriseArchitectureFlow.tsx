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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold border border-indigo-700/60 uppercase">
              TOPOLOGIA MICROSERVIZI AD AGENTI
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Architettura Distribuita V1.0
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white font-sans mt-1.5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Topologia Operativa & Orchestrazione N.I.C.O.
          </h2>
          <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-3xl">
            Flusso integrato: ogni input Telegram viene sanificato da E.R.M.E.S., analizzato dal semantic router N.I.C.O. 
            ed eseguito in parallelo sui 7 microservizi specializzati di gestione, calcolo scientifico e tesoreria.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>7 Servizi Attivi &bull; Zero Deadlocks</span>
        </div>
      </div>

      {/* Central Orchestrator Banner */}
      <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-sans">
                N.I.C.O. Core (Neural Interactive Co-Operator)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                ROUTER ATTIVO
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Motore semantico con <strong>Function Calling strutturato</strong> (Gemini 3.8 Flash): esegue la classificazione dell'intento e smista le chiamate API verso il compartimento dedicato.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleClick('nico-ermes')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
        >
          <span>Apri Console Telegram N.I.C.O.</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of the 7 Autonomous Microservices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {SERVICE_NODES.map((node) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl border ${node.borderColor} ${node.bgLight} p-4 flex flex-col justify-between transition-all duration-200 shadow-md`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white shrink-0">
                      <Icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <div>
                      <div className={`text-[10px] font-bold font-mono tracking-wider ${node.color}`}>
                        {node.code}
                      </div>
                      <div className="font-bold text-sm text-white font-sans leading-tight">
                        {node.name}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                    {node.status}
                  </span>
                </div>

                {/* Subtitle category */}
                <div className="text-[11px] font-medium text-slate-400 font-mono mb-2">
                  {node.category}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {node.desc}
                </p>
              </div>

              {/* Bottom Card Footer with High-Contrast Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  {node.throughput}
                </span>

                <button
                  onClick={() => handleClick(node.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${node.btnBg}`}
                >
                  <span>Apri</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
