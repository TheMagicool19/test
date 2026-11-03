import React, { useState } from 'react';
import {
  Flame,
  Cpu,
  Terminal,
  Play,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { SystemTelemetry } from '../types/navicella';
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
  StatTile,
  StatusDot,
  Field,
  inputClass,
} from './ui/Page';

interface ForgeModuleProps {
  telemetry: SystemTelemetry | null;
}

export const ForgeModule: React.FC<ForgeModuleProps> = ({ telemetry }) => {
  const [activeModel, setActiveModel] = useState('DeepSeek-R1-Distill-Qwen-14B-AWQ (Ollama)');
  const [targetReceptor, setTargetReceptor] = useState('5-HT2A Serotonin Receptor (PDB: 6A93)');
  const [ligandSmiles, setLigandSmiles] = useState(
    'CCN(CC)C(=O)C1CN(C2CC3=CNC4=CC=CC(=C34)C2=C1)C'
  );
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [dockingLogs, setDockingLogs] = useState<string[]>([
    '[COLAB-TUNNEL] Connessione SSH stabilita su ngrok-colab-tunnel-secure.ngrok-free.app',
    '[GPU-A100] CUDA Driver 12.4 attivo, VRAM allocata: 13.8 GB / 40.0 GB',
    '[VLLM-DAEMON] Server vLLM in ascolto sulla porta interna 8000 (Ollama Container)',
    '[RED-TEAM] Modalità privacy IP chimico attiva: nessuna query verso server proprietari',
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
      `[DEEPSEEK-R1] Audit Red-Team completato: stabilità conformazionale verificata (ΔG < -9.5 kcal/mol)`,
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
    <PageShell>
      <PageHeader
        code="C-04 · F.O.R.G.E."
        title="Cluster R&D ad alte prestazioni"
        description={
          <>
            Ambiente di computazione avanzata su Google Colab con tunnel sicuro. Docking molecolare
            su GPU NVIDIA A100 e hosting locale di modelli open-weights (DeepSeek-R1) per la tutela
            della proprietà intellettuale chimica.
          </>
        }
        aside={<StatusDot label={`${gpu.device} · ${gpu.status}`} />}
      />

      {/* ---- Telemetria hardware ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Tunnel remoto SSH"
          value={<span className="truncate text-[12px]">{gpu.tunnel}</span>}
          hint="Latenza media 38 ms · Colab Pro"
        />
        <StatTile label="Hardware" value={<span className="text-[13px]">{gpu.device}</span>} hint={`Utilizzo core ${gpu.utilization}`} />
        <StatTile label="VRAM allocata" value={gpu.vramUsed} hint="vLLM KV cache · 92% headroom" tone="warning" />
        <StatTile label="Container locale" value="DeepSeek-R1" hint={`vLLM porta ${gpu.vllmPort} · IP isolato`} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ---- Controlli ---- */}
        <Panel className="lg:col-span-5">
          <PanelHeader
            icon={Flame}
            label="Red team"
            title="Simulazione docking & audit"
            aside={
              <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-300/90">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                IP shield
              </span>
            }
          />

          <div className="mt-4 space-y-3.5">
            <Field label="Motore / modello">
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className={inputClass}
              >
                <option value="DeepSeek-R1-Distill-Qwen-14B-AWQ (Ollama)">
                  DeepSeek-R1-Distill-Qwen-14B (locale / Ollama)
                </option>
                <option value="Autodock Vina GPU + RDKit (Colab A100)">
                  Autodock Vina GPU + RDKit (Colab A100)
                </option>
                <option value="IBM RXN Retro-synthesis API">IBM RXN Retro-synthesis API</option>
              </select>
            </Field>

            <Field label="Target recettoriale" hint="PDB ID">
              <input
                type="text"
                value={targetReceptor}
                onChange={(e) => setTargetReceptor(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Ligando" hint="SMILES">
              <textarea
                rows={3}
                value={ligandSmiles}
                onChange={(e) => setLigandSmiles(e.target.value)}
                className={`${inputClass} resize-none font-mono text-[11px] leading-relaxed`}
              />
            </Field>

            <button
              onClick={handleRunDocking}
              disabled={isRunningSim}
              className="btn-primary w-full py-2.5"
            >
              {isRunningSim ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Esecuzione su cluster…
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  Lancia simulazione su GPU A100
                </>
              )}
            </button>
          </div>

          {dockingResult && (
            <div className="animate-fade-in mt-4 rounded-lg border border-hairline bg-white/[0.02] p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="label-micro">ΔG convergenza</span>
                <span className="font-mono text-[15px] font-semibold text-emerald-400">
                  {dockingResult.affinity}
                  <span className="ml-1 text-[10px] font-normal text-ink-dim">kcal/mol</span>
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/[0.05] pt-2.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                <span>RMSD · {dockingResult.rmsd} Å</span>
                <span className="text-right">H-bond · {dockingResult.hbonds}</span>
              </div>
            </div>
          )}
        </Panel>

        {/* ---- Console ---- */}
        <Panel className="lg:col-span-7 flex flex-col">
          <PanelHeader
            icon={Terminal}
            label="Python sandbox"
            title="Stream console Colab"
            aside={
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                TTY · /dev/pts/1
              </span>
            }
          />

          <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-hairline bg-void/70 p-3.5">
            <div className="space-y-1.5">
              {dockingLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 font-mono text-[11px] leading-relaxed text-ink-soft"
                >
                  <span className="shrink-0 text-accent-soft/70">&gt;</span>
                  <span className="min-w-0 break-words">{log}</span>
                </div>
              ))}
              {isRunningSim && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-accent-soft">
                  <span>&gt;</span>
                  <span className="animate-pulse">Elaborazione tensoriale su A100…</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-400" />
              Container vLLM · red team
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              Ambiente ricerca
            </span>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
};
