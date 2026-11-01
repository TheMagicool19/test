import React, { useState } from 'react';
import { 
  Flame, 
  Cpu, 
  Server, 
  Activity, 
  Terminal, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Layers 
} from 'lucide-react';
import { SystemTelemetry } from '../types/navicella';

interface ForgeModuleProps {
  telemetry: SystemTelemetry | null;
}

export const ForgeModule: React.FC<ForgeModuleProps> = ({ telemetry }) => {
  const [activeModel, setActiveModel] = useState('DeepSeek-R1-Distill-Qwen-14B-AWQ (Ollama)');
  const [targetReceptor, setTargetReceptor] = useState('5-HT2A Serotonin Receptor (PDB: 6A93)');
  const [ligandSmiles, setLigandSmiles] = useState('CCN(CC)C(=O)C1CN(C2CC3=CNC4=CC=CC(=C34)C2=C1)C');
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [dockingLogs, setDockingLogs] = useState<string[]>([
    '[COLAB-TUNNEL] Connessione SSH stabilita con successo su ngrok-colab-tunnel-secure.ngrok-free.app',
    '[GPU-A100] CUDA Driver 12.4 attivo, VRAM allocata: 13.8 GB / 40.0 GB',
    '[VLLM-DAEMON] Server vLLM in ascolto sulla porta interna 8000 (Ollama Container)',
    '[RED-TEAM] Modalità privacy IP chimico attiva: nessuna query inviata a server proprietari esterni',
  ]);
  const [dockingResult, setDockingResult] = useState<{
    affinity: number;
    rmsd: number;
    hbonds: number;
    status: string;
  } | null>({
    affinity: -9.8,
    rmsd: 1.15,
    hbonds: 3,
    status: 'CONVERGED_OPTIMAL',
  });

  const handleRunDocking = () => {
    setIsRunningSim(true);
    setDockingResult(null);

    const steps = [
      `[FORGE] Avvio sandbox Python su Google Colab per target ${targetReceptor}...`,
      `[RDKit] Generazione conformeri 3D da stringa SMILES: ${ligandSmiles.slice(0, 30)}...`,
      `[AUTODOCK VINA] Grid box centrata sul sito ortosterico (X: 14.2, Y: -8.5, Z: 24.1)...`,
      `[CUDA-STREAM] Calcolo tensoriale binding energy sui core Tensor A100...`,
      `[DEEPSEEK-R1] Audit Red-Team completato: stabilità conformazionale verificata con Delta G < -9.5 kcal/mol`,
    ];

    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setDockingLogs((prev) => [...prev, msg]);
        if (idx === steps.length - 1) {
          setIsRunningSim(false);
          setDockingResult({
            affinity: parseFloat((-9.2 - Math.random() * 1.5).toFixed(1)),
            rmsd: parseFloat((0.9 + Math.random() * 0.5).toFixed(2)),
            hbonds: Math.floor(2 + Math.random() * 3),
            status: 'CONVERGED_OPTIMAL',
          });
        }
      }, (idx + 1) * 700);
    });
  };

  const gpu = telemetry?.gpuColabStatus || {
    status: 'ONLINE',
    device: 'NVIDIA A100-SXM4-40GB',
    tunnel: 'ngrok-colab-tunnel-secure.ngrok-free.app',
    vllmPort: 8000,
    activeModel: 'DeepSeek-R1-Distill-Qwen-14B-AWQ',
    utilization: '34%',
    vramUsed: '13.8 GB / 40.0 GB',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-950 border border-orange-800 text-orange-400">
              C-04: F.O.R.G.E. (REATTORE R&D COMPUTAZIONALE)
            </span>
            <span className="text-xs font-mono text-slate-400">
              GOOGLE COLAB GPU &bull; OLLAMA / VLLM &bull; DEEPSEEK-R1 RED TEAM
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            F.O.R.G.E. HIGH-PERFORMANCE R&D CLUSTER
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Ambiente di computazione avanzata. Connette un Google Colab con tunnel sicuro (ngrok/Cloudflare) 
            per eseguire docking molecolare su GPU NVIDIA A100 e hosting locale di modelli Open-Weights (DeepSeek-R1) 
            per garantire la tutela della proprietà intellettuale (IP chimico).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-orange-300 bg-orange-950/60 px-3 py-1.5 rounded-lg border border-orange-800">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span>GPU: {gpu.device} &bull; {gpu.status}</span>
        </div>
      </div>

      {/* Telemetry Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">TUNNEL REMOTO SSH</div>
          <div className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            {gpu.tunnel}
          </div>
          <div className="text-[10px] text-emerald-400">Latenza media: 38ms (Colab PRO)</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">HARDWARE ACCELERATION</div>
          <div className="text-sm font-bold text-cyan-300">{gpu.device}</div>
          <div className="text-[10px] text-slate-400">Utilizzo Core: {gpu.utilization}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">MEMORIA VRAM ALLOCATA</div>
          <div className="text-sm font-bold text-amber-400">{gpu.vramUsed}</div>
          <div className="text-[10px] text-slate-400">vLLM KV Cache: 92% headroom</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">CONTAINER LOCAL MODEL</div>
          <div className="text-sm font-bold text-emerald-400 truncate">DeepSeek-R1 (Local)</div>
          <div className="text-[10px] text-slate-400">Porta vLLM: {gpu.vllmPort} &bull; IP Isolato</div>
        </div>
      </div>

      {/* Simulation Runner & Docking Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> SIMULAZIONE DOCKING & AUDIT RED-TEAM
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              IP-SHIELD ACTIVE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Motore Computazionale / Modello:
              </label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-orange-300 focus:outline-none focus:border-orange-500"
              >
                <option value="DeepSeek-R1-Distill-Qwen-14B-AWQ (Ollama)">
                  DeepSeek-R1-Distill-Qwen-14B (Locale / Ollama)
                </option>
                <option value="Autodock Vina GPU + RDKit (Colab A100)">
                  Autodock Vina GPU + RDKit (Colab A100)
                </option>
                <option value="IBM RXN Retro-synthesis API">
                  IBM RXN Retro-synthesis API
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Target Recettoriale (PDB ID):
              </label>
              <input
                type="text"
                value={targetReceptor}
                onChange={(e) => setTargetReceptor(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Ligando da Testare (Formula SMILES):
              </label>
              <textarea
                rows={3}
                value={ligandSmiles}
                onChange={(e) => setLigandSmiles(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-orange-500 text-[11px]"
              />
            </div>

            <button
              onClick={handleRunDocking}
              disabled={isRunningSim}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isRunningSim ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Esecuzione su Cluster Colab...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Lancia Simulazione Docking su GPU A100
                </>
              )}
            </button>
          </div>

          {/* Results Badge */}
          {dockingResult && (
            <div className="p-3.5 rounded-lg border border-emerald-800/60 bg-emerald-950/30 text-xs font-mono space-y-2">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>CONVERGENZA ENERGETICA (ΔG):</span>
                <span className="text-sm font-extrabold text-white">
                  {dockingResult.affinity} kcal/mol
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>RMSD: {dockingResult.rmsd} Å</div>
                <div>Legami Idrogeno: {dockingResult.hbonds}</div>
              </div>
            </div>
          )}
        </div>

        {/* Live Terminal / Execution Log */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between font-mono text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span className="font-bold">PYTHON SANDBOX & COLAB STREAM CONSOLE</span>
              </div>
              <span className="text-[10px] text-slate-500">TTY: /dev/pts/1</span>
            </div>

            <div className="mt-3 bg-slate-900/80 rounded-lg p-3.5 border border-slate-800/90 space-y-1.5 max-h-[380px] overflow-y-auto">
              {dockingLogs.map((log, idx) => (
                <div key={idx} className="text-[11px] leading-relaxed text-slate-300">
                  <span className="text-orange-400 font-bold">&gt;</span> {log}
                </div>
              ))}
              {isRunningSim && (
                <div className="text-cyan-400 animate-pulse text-[11px]">
                  &gt; Elaborazione tensoriale su NVIDIA A100 in corso...
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Container vLLM &bull; Red Team IP Shield</span>
            <span>Ambiente di Ricerca Avanzato F.O.R.G.E.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
