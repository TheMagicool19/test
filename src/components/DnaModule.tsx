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
import { PageShell, PageHeader, StatusDot, inputClass } from './ui/Page';

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
    <PageShell>
      <PageHeader
        code="C-02 · D.N.A."
        title="Knowledge vault & RAG retrieval"
        description={
          <>
            Memoria a lungo termine sincronizzata con Obsidian (Markdown + YAML frontmatter). Il
            filtro enzimatico tipizza le note grezze, il vector DB indicizza i chunk per le query di
            N.I.C.O.
          </>
        }
        aside={<StatusDot label="Vault 3 note · embeddings ok" />}
      />

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
              placeholder="Cerca per titolo, tag o query semantica…"
              className={`${inputClass} pl-9`}
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
          <div className="surface space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
              <span className="flex items-center gap-1.5 font-semibold text-ink-soft">
                <Folder className="h-3.5 w-3.5" /> Obsidian vault
              </span>
              <span>{filteredNotes.length} file .md</span>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`cursor-pointer space-y-1.5 rounded-lg border p-3 transition-colors ${
                    selectedNote.id === note.id
                      ? 'border-accent/40 bg-accent/[0.08]'
                      : 'border-hairline bg-white/[0.02] hover:border-hairline-strong hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-[12px] font-medium text-ink">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-dim" />
                      {note.title}
                    </span>
                    <span className="shrink-0 rounded border border-hairline bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-dim">
                      {note.type}
                    </span>
                  </div>

                  <div className="truncate font-mono text-[10px] text-ink-dim">{note.path}</div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded border border-hairline bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-ink-dim"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Enzymatic Filter Box */}
          <div className="surface space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                <Sparkles className="h-3.5 w-3.5 text-accent-soft" /> Filtro enzimatico · demo live
              </h3>
              <span className="rounded border border-hairline bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-dim">
                temp 0.0
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-dim">
              Incolla una nota grezza dall&apos;inbox: l&apos;LLM estrae le entità
              chimico-tossicologiche e genera il frontmatter tipizzato.
            </p>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={3}
              placeholder="Incolla nota grezza qui…"
              className={`${inputClass} resize-none font-mono text-[11px] leading-relaxed`}
            />

            <button
              onClick={handleRunEnzymaticFilter}
              disabled={isFiltering}
              className="btn-primary w-full py-2.5"
            >
              {isFiltering ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Elaborazione in corso…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Esegui filtro &amp; salva nel vault
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Markdown File Editor / Viewer */}
        <div className="surface flex flex-col space-y-4 p-5 lg:col-span-7">
          {/* Note Metadata Bar */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                <span>path</span>
                <span className="truncate normal-case text-ink-soft">{selectedNote.path}</span>
              </div>
              <h2 className="mt-1 text-[15px] font-semibold text-ink">{selectedNote.title}</h2>
            </div>

            <div className="flex shrink-0 items-center gap-2 font-mono text-[10px]">
              <span className="rounded border border-emerald-500/25 bg-emerald-500/[0.08] px-1.5 py-0.5 uppercase tracking-[0.06em] text-emerald-300/90">
                {selectedNote.status}
              </span>
              <span className="text-ink-dim">
                {new Date(selectedNote.created).toLocaleDateString('it-IT')}
              </span>
            </div>
          </div>

          {/* Markdown Content Area */}
          <div className="max-h-[580px] flex-1 overflow-y-auto rounded-lg border border-hairline bg-void/60 p-4">
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-ink-soft">
              {selectedNote.content}
            </pre>
          </div>

          <div className="pt-2 border-t border-hairline/80 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em] text-ink-dim">
            <span>Sync Obsidian vault</span>
            <span>Chunking 512 token · overlap 50</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
};
