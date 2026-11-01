import React, { useState } from 'react';
import { 
  Database, 
  FileText, 
  Search, 
  Sparkles, 
  Folder, 
  Tag, 
  Clock, 
  CheckCircle2, 
  FileCode, 
  Share2, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { DnaNote } from '../types/navicella';
import { runEnzymaticFilter } from '../services/api';

const INITIAL_NOTES: DnaNote[] = [
  {
    id: 'note-1',
    title: 'Manuale Chimica Organica - Da Studiare',
    path: 'Accademia/CTF/manuale-chimica-organica.md',
    tags: ['ctf', 'chimica-organica', 'studio-q3', 'libri'],
    type: 'ctf-study-material',
    created: '2026-11-01T04:45:00Z',
    status: 'enzymatically-validated',
    content: `---
type: ctf-study-material
tags: [ctf, chimica-organica, studio-q3, libri]
created: 2026-11-01
status: active-vault
purchased_via: L.E.D.G.E.R. (45.00 EUR - Prepagata)
priority: HIGH
---

# Manuale Chimica Organica - Da Studiare

Nota generata automaticamente dalla sub-routine di **L.E.D.G.E.R.** in seguito all'acquisto del manuale.

## Moduli Prioritari per Esame CTF
1. **Reazioni di Addizione Elettrofila** agli Alcheni (Meccanismo Markovnikov vs Anti-Markovnikov).
2. **Reazioni Pericicliche e Ciclizzazioni di Diels-Alder**:
   - Dieni coniugati in conformazione s-cis.
   - Filodieni attivati da gruppi elettron-attrattori (EWG).
   - Regola della stereochimica endo per massimizzare la sovrapposizione secondaria degli orbitali.
3. **Chimica dei Composti Eterociclici** (Piridina, Pirrolo, Furano) e loro ruolo nei farmaci attivi su SNC.

## Collegamento a L.E.W.I.S.
- Esercizi di sintesi stechiometrica previsti nel simulatore.
- Prossima sessione di sparring Feynman programmata.`,
  },
  {
    id: 'note-2',
    title: 'Recettori 5-HT2A e Farmacodinamica Serotoninergica',
    path: 'Accademia/Farmacologia/5-ht2a-farmacodinamica.md',
    tags: ['farmacologia', 'recettori', 'snc', 'docking'],
    type: 'ctf-note',
    created: '2026-10-28T14:20:00Z',
    status: 'vectorized',
    content: `---
type: ctf-note
tags: [farmacologia, recettori, snc, docking]
created: 2026-10-28
status: indexed-in-vectordb
embedding_model: text-embedding-3-small
---

# Recettori 5-HT2A e Farmacodinamica Serotoninergica

I recettori **5-HT2A** appartengono alla superfamiglia dei recettori accoppiati a proteine G (GPCR), specificamente associati alla proteina Gq/11.

## Cascata di Trasduzione
- Attivazione della **Fosfolipasi C (PLC)**.
- Idrolisi del fosfatidilinositolo 4,5-bisfosfato (PIP2) in:
  - **Inositolo trisfosfato (IP3)** $\\rightarrow$ mobilizzazione del Ca2+ dal reticolo endoplasmatico.
  - **Diacilglicerolo (DAG)** $\\rightarrow$ attivazione della Protein Kinasi C (PKC).

## Implicazioni Tossicologiche & R&D (F.O.R.G.E.)
- Ligandi allucinogeni e farmaci antipsicotici atipici (es. Clozapina, Risperidone) agiscono come agonisti parziali o antagonisti con affinità nanomolare.
- Simulazioni di docking in corso sul cluster Colab con Autodock Vina.`,
  },
  {
    id: 'note-3',
    title: 'Sintesi e Calcoli Stechiometrici Aspirina (Acido Acetilsalicilico)',
    path: 'Accademia/Laboratorio/sintesi-aspirina.md',
    tags: ['laboratorio', 'stechiometria', 'sintesi'],
    type: 'lab-protocol',
    created: '2026-10-20T11:10:00Z',
    status: 'vectorized',
    content: `---
type: lab-protocol
tags: [laboratorio, stechiometria, sintesi]
created: 2026-10-20
reagents: [Acido Salicilico, Anidride Acetica, Acido Solforico concentrato]
---

# Sintesi Aspirina (Acido Acetilsalicilico)

Reazione di esterificazione tra acido salicilico (C7H6O3) e anidride acetica (C4H6O3) catalizzata da H2SO4.

$$\\text{C}_7\\text{H}_6\\text{O}_3 + \\text{C}_4\\text{H}_6\\text{O}_3 \\xrightarrow{\\text{H}^+} \\text{C}_9\\text{H}_8\\text{O}_4 + \\text{CH}_3\\text{COOH}$$

Massa molare Acido Salicilico: 138.12 g/mol.
Massa molare Aspirina: 180.16 g/mol.
Resa teorica calcolata con L.E.W.I.S.: 88.4%.`,
  },
];

export const DnaModule: React.FC = () => {
  const [notes, setNotes] = useState<DnaNote[]>(INITIAL_NOTES);
  const [selectedNote, setSelectedNote] = useState<DnaNote>(INITIAL_NOTES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ragResults, setRagResults] = useState<{ note: DnaNote; score: number; chunk: string }[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Raw note input for Enzymatic Filter test
  const [rawInput, setRawInput] = useState(
    'appunti veloci esame farmacologia: farmaco propranololo betabloccante non selettivo beta1 e beta2 riduce frequenza cardiaca e pressione occhio a pazienti asmatici per broncocostrizione'
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterResult, setFilterResult] = useState<string | null>(null);

  // Filter notes by search
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Run Enzymatic Filter test
  const handleRunEnzymaticFilter = async () => {
    if (!rawInput.trim() || isFiltering) return;
    setIsFiltering(true);
    setFilterResult(null);

    try {
      const res = await runEnzymaticFilter(rawInput);
      setFilterResult(res.typedMarkdown);

      // Create new note in Obsidian Vault
      const newNote: DnaNote = {
        id: `note-${Date.now()}`,
        title: 'Appunti Farmacologia Propranololo (Enzymatic)',
        path: 'Accademia/Farmacologia/propranololo-enzymatic.md',
        tags: ['farmacologia', 'betabloccanti', 'asma', 'cardiovascolare'],
        type: 'ctf-note',
        created: new Date().toISOString(),
        status: 'enzymatically-validated',
        content: res.typedMarkdown,
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFiltering(false);
    }
  };

  // Simulate RAG Vector Similarity Search
  const handleRagSearch = (query: string) => {
    if (!query.trim()) {
      setRagResults([]);
      return;
    }
    setIsSearchingRag(true);
    setTimeout(() => {
      const terms = query.toLowerCase().split(' ');
      const scored = notes
        .map((note) => {
          let matches = 0;
          terms.forEach((t) => {
            if (note.content.toLowerCase().includes(t)) matches += 2;
            if (note.title.toLowerCase().includes(t)) matches += 3;
            if (note.tags.some((tag) => tag.toLowerCase().includes(t))) matches += 2;
          });
          const score = Math.min(0.98, parseFloat((0.65 + matches * 0.08).toFixed(3)));
          return {
            note,
            score,
            chunk: note.content.slice(0, 180) + '...',
          };
        })
        .filter((item) => item.score > 0.65)
        .sort((a, b) => b.score - a.score);

      setRagResults(scored);
      setIsSearchingRag(false);
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
              C-02: D.N.A. (KNOWLEDGE VAULT & RAG)
            </span>
            <span className="text-xs font-mono text-slate-400">
              OBSIDIAN VAULT &bull; FILTRO ENZIMATICO &bull; COSINE SIMILARITY
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            D.N.A. KNOWLEDGE VAULT & RAG RETRIEVAL
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Base di conoscenza e memoria a lungo termine sincronizzata con Obsidian (Markdown + YAML Frontmatter). 
            Il Filtro Enzimatico ascolta le note grezze e le tipizza; il Vector DB indicizza i frammenti per le query di N.I.C.O.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Vault: 3 Note Attive &bull; Embeddings: OK</span>
        </div>
      </div>

      {/* Main Grid: Vault Explorer (Left) & Note Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Explorer, Search & Enzymatic Filter */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleRagSearch(e.target.value);
              }}
              placeholder="Cerca per titolo, tag o query semantica RAG..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* RAG Vector Similarity Scores (if search active) */}
          {ragResults.length > 0 && (
            <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-xs font-mono space-y-2">
              <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                <span>RAG COSINE SIMILARITY MATCHES:</span>
                <span className="text-[10px] text-slate-400">text-embedding-3-small</span>
              </div>
              <div className="space-y-1.5">
                {ragResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedNote(res.note)}
                    className="p-2 rounded bg-slate-950/80 border border-emerald-900/50 hover:border-emerald-500 cursor-pointer flex items-center justify-between text-[11px]"
                  >
                    <span className="truncate text-slate-200">{res.note.title}</span>
                    <span className="text-emerald-400 font-bold ml-2">{(res.score * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes List in Obsidian Style */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Folder className="w-3.5 h-3.5 text-emerald-400" /> OBSIDIAN VAULT (VAULT/CTF/)
              </span>
              <span>{filteredNotes.length} file .md</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors space-y-1.5 ${
                    selectedNote.id === note.id
                      ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800/90 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-slate-100 flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {note.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {note.type}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {note.path}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {note.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Enzymatic Filter Box */}
          <div className="rounded-xl border border-emerald-900/50 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4 text-emerald-400" /> FILTRO ENZIMATICO LIVE DEMO
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Temp: 0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Incolla una nota grezza da Inbox: l'LLM estrarrà entità chimico-tossicologiche e genererà il frontmatter tipizzato.
            </p>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={3}
              placeholder="Incolla nota grezza qui..."
              className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleRunEnzymaticFilter}
              disabled={isFiltering}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isFiltering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Elaborazione Enzimatica in Corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Esegui Filtro Enzimatico & Salva nel Vault
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Markdown File Editor / Viewer */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col space-y-4">
          {/* Note Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span>PATH:</span> <span className="text-slate-300">{selectedNote.path}</span>
              </div>
              <h2 className="text-lg font-bold font-mono text-white mt-0.5">
                {selectedNote.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {selectedNote.status}
              </span>
              <span className="text-slate-500">
                {new Date(selectedNote.created).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Markdown Content Area */}
          <div className="flex-1 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80 overflow-y-auto max-h-[580px]">
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {selectedNote.content}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Sincronizzato con Obsidian Vault (Markdown)</span>
            <span>RAG Chunking: 512 tokens &bull; Overlap: 50</span>
          </div>
        </div>
      </div>
    </div>
  );
};
