import React, { useState, useEffect, useRef } from 'react';
import { 
  Atom, 
  Flame, 
  FlaskConical, 
  Scale, 
  Swords, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  HelpCircle,
  Eye,
  RotateCw
} from 'lucide-react';
import { FeynmanChallengeResponse } from '../types/navicella';
import { runFeynmanChallenge } from '../services/api';

interface MoleculePreset {
  name: string;
  iupac: string;
  formula: string;
  mw: number;
  smiles: string;
  category: string;
  atoms: { id: number; symbol: string; x: number; y: number; z: number; color: string; radius: number }[];
  bonds: [number, number][];
}

const PRESET_MOLECULES: MoleculePreset[] = [
  {
    name: 'Aspirina (Acido Acetilsalicilico)',
    iupac: '2-acetossibenzoico',
    formula: 'C9H8O4',
    mw: 180.16,
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    category: 'FANS / CTF',
    atoms: [
      // Benzene ring
      { id: 0, symbol: 'C', x: 0, y: -40, z: 0, color: '#38bdf8', radius: 10 },
      { id: 1, symbol: 'C', x: 35, y: -20, z: 10, color: '#38bdf8', radius: 10 },
      { id: 2, symbol: 'C', x: 35, y: 20, z: -10, color: '#38bdf8', radius: 10 },
      { id: 3, symbol: 'C', x: 0, y: 40, z: 0, color: '#38bdf8', radius: 10 },
      { id: 4, symbol: 'C', x: -35, y: 20, z: 10, color: '#38bdf8', radius: 10 },
      { id: 5, symbol: 'C', x: -35, y: -20, z: -10, color: '#38bdf8', radius: 10 },
      // Carboxyl group
      { id: 6, symbol: 'C', x: 65, y: -45, z: 15, color: '#38bdf8', radius: 10 },
      { id: 7, symbol: 'O', x: 95, y: -40, z: 20, color: '#f43f5e', radius: 12 },
      { id: 8, symbol: 'O', x: 60, y: -75, z: 10, color: '#f43f5e', radius: 12 },
      // Ester group
      { id: 9, symbol: 'O', x: 65, y: 45, z: -15, color: '#f43f5e', radius: 12 },
      { id: 10, symbol: 'C', x: 80, y: 75, z: -20, color: '#38bdf8', radius: 10 },
      { id: 11, symbol: 'O', x: 105, y: 70, z: -25, color: '#f43f5e', radius: 12 },
      { id: 12, symbol: 'C', x: 65, y: 105, z: -15, color: '#38bdf8', radius: 9 },
    ],
    bonds: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [1, 6], [6, 7], [6, 8],
      [2, 9], [9, 10], [10, 11], [10, 12],
    ],
  },
  {
    name: 'Dopamina',
    iupac: '4-(2-amminoetil)benzene-1,2-diolo',
    formula: 'C8H11NO2',
    mw: 153.18,
    smiles: 'c1cc(c(cc1CCN)O)O',
    category: 'Neurotrasmettitore / SNC',
    atoms: [
      { id: 0, symbol: 'C', x: -30, y: -20, z: 0, color: '#38bdf8', radius: 10 },
      { id: 1, symbol: 'C', x: 0, y: -35, z: 10, color: '#38bdf8', radius: 10 },
      { id: 2, symbol: 'C', x: 30, y: -20, z: -5, color: '#38bdf8', radius: 10 },
      { id: 3, symbol: 'C', x: 30, y: 15, z: 5, color: '#38bdf8', radius: 10 },
      { id: 4, symbol: 'C', x: 0, y: 30, z: -10, color: '#38bdf8', radius: 10 },
      { id: 5, symbol: 'C', x: -30, y: 15, z: 10, color: '#38bdf8', radius: 10 },
      // OH groups
      { id: 6, symbol: 'O', x: -60, y: -35, z: 0, color: '#f43f5e', radius: 12 },
      { id: 7, symbol: 'O', x: -60, y: 35, z: 15, color: '#f43f5e', radius: 12 },
      // Ethylamine chain
      { id: 8, symbol: 'C', x: 60, y: -35, z: -10, color: '#38bdf8', radius: 10 },
      { id: 9, symbol: 'C', x: 90, y: -20, z: 5, color: '#38bdf8', radius: 10 },
      { id: 10, symbol: 'N', x: 120, y: -35, z: 0, color: '#818cf8', radius: 11 },
    ],
    bonds: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [0, 6], [5, 7],
      [2, 8], [8, 9], [9, 10],
    ],
  },
  {
    name: 'Caffeina (1,3,7-trimetilxantina)',
    iupac: '1,3,7-trimetil-3,7-diidro-1H-purina-2,6-dione',
    formula: 'C8H10N4O2',
    mw: 194.19,
    smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C',
    category: 'Alcaloide / Stimolante',
    atoms: [
      { id: 0, symbol: 'N', x: -20, y: -30, z: 5, color: '#818cf8', radius: 11 },
      { id: 1, symbol: 'C', x: 10, y: -35, z: -5, color: '#38bdf8', radius: 10 },
      { id: 2, symbol: 'N', x: 35, y: -15, z: 10, color: '#818cf8', radius: 11 },
      { id: 3, symbol: 'C', x: 25, y: 15, z: -5, color: '#38bdf8', radius: 10 },
      { id: 4, symbol: 'C', x: -5, y: 25, z: 5, color: '#38bdf8', radius: 10 },
      { id: 5, symbol: 'C', x: -30, y: -5, z: -10, color: '#38bdf8', radius: 10 },
      // Carbonyls & methyls
      { id: 6, symbol: 'O', x: 20, y: -65, z: -10, color: '#f43f5e', radius: 12 },
      { id: 7, symbol: 'O', x: -55, y: -10, z: -20, color: '#f43f5e', radius: 12 },
      { id: 8, symbol: 'N', x: 45, y: 35, z: 0, color: '#818cf8', radius: 11 },
      { id: 9, symbol: 'C', x: 30, y: 55, z: 10, color: '#38bdf8', radius: 10 },
      { id: 10, symbol: 'N', x: 0, y: 50, z: 5, color: '#818cf8', radius: 11 },
    ],
    bonds: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [1, 6], [5, 7],
      [3, 8], [8, 9], [9, 10], [10, 4],
    ],
  },
];

export const LewisModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'stoichiometry' | 'feynman'>('visualizer');
  
  // Molecule Visualizer State
  const [selectedMolecule, setSelectedMolecule] = useState<MoleculePreset>(PRESET_MOLECULES[0]);
  const [rotAngle, setRotAngle] = useState({ x: 0.2, y: 0.5 });
  const [isRotating, setIsRotating] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stoichiometry Calculator State
  const [reagentAmount, setReagentAmount] = useState<number>(10.0); // grams
  const [reagentMw, setReagentMw] = useState<number>(138.12); // Salicylic acid
  const [productMw, setProductMw] = useState<number>(180.16); // Aspirin
  const [reactionEfficiency, setReactionEfficiency] = useState<number>(88.0); // %

  // Feynman Sparring State
  const [feynmanTopic, setFeynmanTopic] = useState('Reazione di Diels-Alder ed Enantioselettività');
  const [feynmanExplanation, setFeynmanExplanation] = useState(
    'La Diels-Alder è una cicloaddizione [4+2] tra un diene coniugato e un filodiene per formare un cicloesene. La stereochimica endo è favorita per sovrapposizione secondaria degli orbitali pi-greco, e avviene in un singolo passaggio concertato sincrono.'
  );
  const [rigorLevel, setRigorLevel] = useState('Severo');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feynmanResult, setFeynmanResult] = useState<FeynmanChallengeResponse | null>(null);

  // Canvas 3D Rendering of Molecule
  useEffect(() => {
    let animId: number;
    let angle = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (isRotating) {
        angle += 0.015;
      }

      // Rotate atoms in 3D
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(angle * 0.5);
      const sinB = Math.sin(angle * 0.5);

      const transformedAtoms = selectedMolecule.atoms.map((atom) => {
        // Rotate around Y axis
        let x1 = atom.x * cosA - atom.z * sinA;
        let z1 = atom.x * sinA + atom.z * cosA;
        // Rotate around X axis
        let y2 = atom.y * cosB - z1 * sinB;
        let z2 = atom.y * sinB + z1 * cosB;

        const scale = 250 / (250 + z2);
        return {
          ...atom,
          projX: centerX + x1 * scale,
          projY: centerY + y2 * scale,
          projZ: z2,
          scale,
        };
      });

      // Sort by Z for proper depth buffering
      transformedAtoms.sort((a, b) => a.projZ - b.projZ);

      // Draw Bonds
      selectedMolecule.bonds.forEach(([idxA, idxB]) => {
        const a1 = transformedAtoms.find((a) => a.id === idxA);
        const a2 = transformedAtoms.find((a) => a.id === idxB);
        if (!a1 || !a2) return;

        ctx.beginPath();
        ctx.moveTo(a1.projX, a1.projY);
        ctx.lineTo(a2.projX, a2.projY);
        ctx.lineWidth = 4 * ((a1.scale + a2.scale) / 2);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      });

      // Draw Atoms
      transformedAtoms.forEach((atom) => {
        const radius = atom.radius * atom.scale;
        ctx.beginPath();
        ctx.arc(atom.projX, atom.projY, radius, 0, Math.PI * 2);
        ctx.fillStyle = atom.color;
        ctx.shadowColor = atom.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(9 * atom.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.symbol, atom.projX, atom.projY);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedMolecule, isRotating]);

  // Calculations for stoichiometry
  const reagentMoles = reagentAmount / (reagentMw || 1);
  const theoreticalYieldGrams = reagentMoles * productMw;
  const actualYieldGrams = (theoreticalYieldGrams * reactionEfficiency) / 100;

  // Run Feynman Evaluation
  const handleFeynmanEval = async () => {
    if (!feynmanTopic.trim() || !feynmanExplanation.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setFeynmanResult(null);

    try {
      const res = await runFeynmanChallenge(feynmanTopic, feynmanExplanation, rigorLevel);
      setFeynmanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-950 border border-violet-800 text-violet-400">
              C-03: L.E.W.I.S. (REATTORE ACCADEMICO CTF)
            </span>
            <span className="text-xs font-mono text-slate-400">
              RDKIT CHEMINFORMATICS &bull; METODO FEYNMAN &bull; STECHIOMETRIA
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            L.E.W.I.S. CTF STUDY & CHEMINFORMATICS
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Modulo dedicato agli studi accademici in Chimica e Tossicologia Forense. 
            Include il visualizzatore molecolare SMILES, il calcolo stechiometrico in sandbox e l'Esaminatore Implacabile Feynman.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'visualizer' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Visualizzatore 3D
          </button>
          <button
            onClick={() => setActiveTab('stoichiometry')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'stoichiometry' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Calcolatore Stechiometria
          </button>
          <button
            onClick={() => setActiveTab('feynman')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'feynman' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Esaminatore Implacabile
          </button>
        </div>
      </div>

      {/* Tab: 3D Molecule Visualizer */}
      {activeTab === 'visualizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preset Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold font-mono text-violet-300 uppercase">
                MOLECOLE PREIMPOSTATE (CTF / FARMACI)
              </h3>
              <div className="space-y-2">
                {PRESET_MOLECULES.map((mol, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMolecule(mol)}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-mono transition-colors ${
                      selectedMolecule.name === mol.name
                        ? 'bg-violet-950/80 border-violet-500 text-violet-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-slate-100">{mol.name}</div>
                    <div className="text-[11px] text-violet-400 mt-0.5">{mol.formula} &bull; {mol.mw} g/mol</div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{mol.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Molecule Properties Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5 font-mono text-xs">
              <div className="text-violet-400 font-bold border-b border-slate-800 pb-2">
                SCHEDA CHIMICA CHEMINFORMATICA
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IUPAC:</span>
                <span className="text-slate-300 text-right">{selectedMolecule.iupac}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formula:</span>
                <span className="text-cyan-400 font-bold">{selectedMolecule.formula}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Massa Molare:</span>
                <span className="text-amber-400 font-bold">{selectedMolecule.mw} g/mol</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block mb-1">Stringa SMILES Canonica:</span>
                <code className="text-emerald-400 bg-slate-900 p-1.5 rounded block text-[11px] truncate select-all">
                  {selectedMolecule.smiles}
                </code>
              </div>
            </div>
          </div>

          {/* Canvas View */}
          <div className="lg:col-span-8 rounded-xl border border-violet-900/40 bg-slate-950/90 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-violet-400 animate-spin" />
                <span className="font-mono text-sm font-bold text-slate-100">
                  {selectedMolecule.name} &bull; 3D Interactive Model
                </span>
              </div>
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border transition-colors ${
                  isRotating
                    ? 'bg-violet-950 text-violet-300 border-violet-700'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                {isRotating ? 'Rotazione Attiva' : 'Pausa'}
              </button>
            </div>

            {/* Canvas */}
            <div className="relative flex-1 flex items-center justify-center my-4">
              <canvas
                ref={canvasRef}
                width={560}
                height={380}
                className="max-w-full h-auto cursor-grab active:cursor-grabbing rounded-lg bg-radial from-slate-900 to-slate-950"
              />
            </div>

            {/* Legend */}
            <div className="z-10 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span> Carbonio (C)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Ossigeno (O)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block"></span> Azoto (N)
                </span>
              </div>
              <span className="text-slate-500">RDKit Engine compatible</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stoichiometry Calculator */}
      {activeTab === 'stoichiometry' && (
        <div className="max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-violet-400" /> CALCOLATORE STECHIOMETRICO CTF (PYTHON SANDBOX)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calcolo delle moli, reagente limitante e resa teorica di reazione.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
              C7H6O3 + C4H6O3 → C9H8O4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Massa Reagente Iniziale (g):
              </label>
              <input
                type="number"
                step="0.1"
                value={reagentAmount}
                onChange={(e) => setReagentAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Massa Molare Reagente (g/mol):
              </label>
              <input
                type="number"
                step="0.01"
                value={reagentMw}
                onChange={(e) => setReagentMw(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Massa Molare Prodotto Desiderato (g/mol):
              </label>
              <input
                type="number"
                step="0.01"
                value={productMw}
                onChange={(e) => setProductMw(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Efficienza Reazione Prevista (%):
              </label>
              <input
                type="number"
                step="1"
                max="100"
                min="1"
                value={reactionEfficiency}
                onChange={(e) => setReactionEfficiency(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="p-4 rounded-xl border border-violet-900/50 bg-slate-950/80 font-mono text-xs space-y-3">
            <div className="text-violet-400 font-bold uppercase text-[11px]">
              RISULTATI STECHIOMETRIA DI REAZIONE
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">MOLI REAGENTE</div>
                <div className="text-base font-bold text-cyan-400 mt-1">
                  {reagentMoles.toFixed(4)} <span className="text-xs font-normal">mol</span>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">RESA TEORICA (100%)</div>
                <div className="text-base font-bold text-amber-400 mt-1">
                  {theoreticalYieldGrams.toFixed(2)} <span className="text-xs font-normal">g</span>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">RESA EFFETTIVA ({reactionEfficiency}%)</div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  {actualYieldGrams.toFixed(2)} <span className="text-xs font-normal">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Feynman "Esaminatore Implacabile" */}
      {activeTab === 'feynman' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User Sparging Input */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold font-mono text-slate-100 text-sm">
                  ESAMINATORE IMPLACABILE
                </h3>
              </div>
              <select
                value={rigorLevel}
                onChange={(e) => setRigorLevel(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-violet-300 text-xs font-mono rounded px-2 py-1"
              >
                <option value="Accademico">Rigore Accademico</option>
                <option value="Severo">Rigore Severo</option>
                <option value="Estremo">Rigore Estremo</option>
              </select>
            </div>

            <p className="text-xs text-slate-400 font-sans">
              <strong>Metodo Feynman:</strong> Spiega il concetto con parole tue. N.I.C.O. valuterà la coerenza logica rispetto ai dati di D.N.A., 
              identificherà superficialità o lacune e ti costringerà a una risposta più rigorosa.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Argomento d'Esame:
                </label>
                <input
                  type="text"
                  value={feynmanTopic}
                  onChange={(e) => setFeynmanTopic(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  La tua Spiegazione:
                </label>
                <textarea
                  rows={6}
                  value={feynmanExplanation}
                  onChange={(e) => setFeynmanExplanation(e.target.value)}
                  placeholder="Spiega il meccanismo dettagliato..."
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-sans text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                onClick={handleFeynmanEval}
                disabled={isEvaluating}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    L.E.W.I.S. sta analizzando le falle logiche...
                  </>
                ) : (
                  <>
                    <Swords className="w-3.5 h-3.5" />
                    Sottoponi a Esaminatore Implacabile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Examiner Verdict & Critique */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> VERDETTO DELL'ESAMINATORE
                </span>
                {feynmanResult && (
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    feynmanResult.score >= 80 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : feynmanResult.score >= 60
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-rose-950 text-rose-300 border-rose-600'
                  }`}>
                    PUNTEGGIO RIGORE: {feynmanResult.score}/100
                  </span>
                )}
              </div>

              {feynmanResult ? (
                <div className="mt-4 space-y-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-sm font-sans italic">
                    "{feynmanResult.verdict}"
                  </div>

                  {/* Logical gaps */}
                  {feynmanResult.logicalGaps && feynmanResult.logicalGaps.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-800/60 text-xs space-y-2">
                      <div className="font-mono font-bold text-rose-400 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> LACUNE E FALLACIE IDENTIFICATE:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 font-sans">
                        {feynmanResult.logicalGaps.map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ruthless challenge */}
                  <div className="p-3.5 rounded-lg bg-violet-950/40 border border-violet-800/70 text-xs space-y-2">
                    <div className="font-mono font-bold text-violet-300 flex items-center gap-1.5 uppercase">
                      <Swords className="w-3.5 h-3.5 text-violet-400" /> PROSSIMA SFIDA (RE-PROMPTING OBBLIGATORIO):
                    </div>
                    <p className="text-slate-200 font-sans leading-relaxed text-sm">
                      {feynmanResult.ruthlessChallenge}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  Invia una spiegazione dal modulo a sinistra per attivare l'Esaminatore Implacabile.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
              <span>Metodo Feynman Attivo</span>
              <span>Riferimento Vault D.N.A. indicizzato</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
