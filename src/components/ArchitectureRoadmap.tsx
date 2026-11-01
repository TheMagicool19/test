import React, { useState } from 'react';
import { 
  FileCode2, 
  Layers, 
  Cpu, 
  Send, 
  Database, 
  Atom, 
  Flame, 
  Calendar, 
  HeartPulse, 
  Wallet, 
  CheckCircle2, 
  Copy, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import { PageShell, PageHeader, StatusDot, Segmented } from './ui/Page';

export const ArchitectureRoadmap: React.FC = () => {
  const [activeSnippet, setActiveSnippet] = useState<'gas' | 'colab' | 'telegram'>('gas');
  const [copied, setCopied] = useState(false);

  const gasScriptCode = `// ==========================================
// GOOGLE APPS SCRIPT (GAS) - L.E.D.G.E.R. & R.O.U.T.E. GATEWAY
// Incolla questo script nell'editor Apps Script associato al tuo Foglio Google.
// ==========================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === "ledger_add_expense") {
      const sheet = ss.getSheetByName("Uscite") || ss.insertSheet("Uscite");
      const timestamp = new Date();
      
      // Appende la transazione estratta da N.I.C.O.
      sheet.appendRow([
        timestamp,
        data.item,
        data.amount,
        data.category,
        data.method,
        "CONFIRMED"
      ]);
      
      // Calcola Runway residua dalla cella pivot nascosta
      const balanceCell = ss.getRangeByName("CURRENT_BALANCE") || sheet.getRange("H2");
      const avgBurnRateCell = ss.getRangeByName("AVG_BURN_RATE") || sheet.getRange("H3");
      const currentBalance = balanceCell.getValue() - data.amount;
      const burnRate = Math.max(avgBurnRateCell.getValue() || 500, 100);
      const runwayMonths = (currentBalance / burnRate).toFixed(1);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "SUCCESS",
        newBalance: currentBalance,
        runwayMonths: runwayMonths,
        item: data.item
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "route_insert_shift") {
      const cal = CalendarApp.getDefaultCalendar();
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      cal.createEvent("Turno Lavoro: " + (data.label || "Turno"), startTime, endTime);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "SUCCESS",
        calendarEventCreated: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Azione sconosciuta" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const colabScriptCode = `# ==========================================
# GOOGLE COLAB / JUPYTER SSH TUNNEL (F.O.R.G.E. & DEEPSEEK-R1)
# Esegui in un notebook Google Colab con GPU A100 / T4 abilitata.
# ==========================================

!pip install pyngrok rdkit vllm -q

from pyngrok import ngrok
import os

# Configura il token ngrok
ngrok.set_auth_token("TUO_NGROK_AUTHTOKEN")

# Avvia il tunnel verso il server vLLM (porta 8000)
http_tunnel = ngrok.connect(8000)
print(f"[*] F.O.R.G.E. Tunnel Attivo: {http_tunnel.public_url}")

# Avvia vLLM con DeepSeek-R1 Distillato per Red-Team IP locale
!python -m vllm.entrypoints.openai.api_server \\
    --model deepseek-ai/DeepSeek-R1-Distill-Qwen-14B \\
    --port 8000 \\
    --dtype half \\
    --gpu-memory-utilization 0.90`;

  const telegramSetupInstructions = `# ==========================================
# CONFIGURAZIONE BOT TELEGRAM (E.R.M.E.S. FASE 1)
# ==========================================

1. Apri Telegram e cerca @BotFather.
2. Invia il comando: /newbot
3. Assegna un nome al bot: "Navicella V1.0 Core" e uno username (es. "navicella_core_bot").
4. Copia il Bot Token generato (es. 123456789:AAH...).
5. Configura il Webhook di ascolto verso l'endpoint della Navicella:
   curl -F "url=https://<TUO_APPLET_URL>/api/ermes/webhook" \\
        https://api.telegram.org/bot<TUO_BOT_TOKEN>/setWebhook
6. Configura il tuo Chat ID nella Whitelist O(1) nel tab N.I.C.O. / E.R.M.E.S.`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageShell>
      <PageHeader
        code="Specifiche tecniche · V1.0"
        title="Architettura di sistema Navicella"
        description={
          <>
            Architettura multi-modulo, pipeline di smistamento semantico N.I.C.O., matrice di
            deployment nelle 4 fasi operative e sorgenti bridge pronti all&apos;uso.
          </>
        }
        aside={<StatusDot label="Fasi 1–4 attive" />}
      />

      {/* Visual Architectural Map */}
      <section className="surface surface-edge space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
          <Layers className="h-3.5 w-3.5" /> Schema architetturale · data-flow V1.0
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Layer 1 */}
          <div className="surface-2 space-y-2 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[10px] font-bold text-accent-soft">
                1
              </span>
              <span className="text-[12px] font-semibold text-ink">Ingestion &amp; gateway</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">E.R.M.E.S.</strong> riceve webhook Telegram
              asincroni: testo, note audio Whisper, immagini con OCR.
            </p>
            <ul className="space-y-1 border-t border-white/[0.05] pt-2 font-mono text-[10px] text-ink-dim">
              <li>· Whitelist check O(1)</li>
              <li>· Sanitizzazione payload POST</li>
            </ul>
          </div>

          {/* Layer 2 */}
          <div className="surface-2 space-y-2 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[10px] font-bold text-accent-soft">
                2
              </span>
              <span className="text-[12px] font-semibold text-ink">Brain &amp; orchestrator</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">N.I.C.O.</strong> esegue intent
              classification e produce JSON strutturato via function calling.
            </p>
            <ul className="space-y-1 border-t border-white/[0.05] pt-2 font-mono text-[10px] text-ink-dim">
              <li>· Memoria breve: 10 turni</li>
              <li>· Memoria lunga: RAG D.N.A.</li>
              <li>· Guardrail anti prompt-injection</li>
            </ul>
          </div>

          {/* Layer 3 */}
          <div className="surface-2 space-y-2 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md border border-accent/30 bg-accent/10 font-mono text-[10px] font-bold text-accent-soft">
                3
              </span>
              <span className="text-[12px] font-semibold text-ink">Storage &amp; compute</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-ink-soft">
              Smistamento parallelo ai microservizi specializzati:
            </p>
            <ul className="grid grid-cols-1 gap-0.5 border-t border-white/[0.05] pt-2 font-mono text-[10px] text-ink-dim">
              <li>· D.N.A. — vault &amp; vettori</li>
              <li>· L.E.W.I.S. — RDKit &amp; Feynman</li>
              <li>· F.O.R.G.E. — GPU &amp; DeepSeek</li>
              <li>· R.O.U.T.E. — calendar &amp; turni</li>
              <li>· F.A.R.A.D.A.Y. — bio-state</li>
              <li>· L.E.D.G.E.R. — sheets &amp; runway</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4 Phases Deployment Roadmap Table */}
      <section className="surface surface-edge space-y-4 p-5">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
          Roadmap di deployment · sezione 4
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {['Fase', 'Denominazione', 'Moduli', 'Attività chiave', 'Stato'].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-dim ${
                      i === 4 ? 'text-right' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {[
                {
                  phase: 'Fase 1',
                  name: 'MVP ingestion',
                  mods: 'E.R.M.E.S.',
                  desc: 'Setup ambiente serverless, configurazione bot Telegram (BotFather), validazione webhook POST bidirezionali. Deploy Echo-Bot.',
                  status: 'COMPLETATA',
                },
                {
                  phase: 'Fase 2',
                  name: 'Brain & routing',
                  mods: 'N.I.C.O.',
                  desc: 'Integrazione API LLM (Gemini Flash). Schemi JSON Schema per function calling. Test di intent classification.',
                  status: 'COMPLETATA',
                },
                {
                  phase: 'Fase 3',
                  name: 'DB & logistica',
                  mods: 'D.N.A., R.O.U.T.E., L.E.D.G.E.R.',
                  desc: 'API CRUD con Google Apps Script. Deploy del vector database e embedding delle note Markdown Obsidian.',
                  status: 'COMPLETATA',
                },
                {
                  phase: 'Fase 4',
                  name: 'Advanced compute',
                  mods: 'L.E.W.I.S., F.O.R.G.E., F.A.R.A.D.A.Y.',
                  desc: 'Container Docker per Ollama (DeepSeek-R1 locale) e tunnel SSH verso notebook GPU A100 per docking molecolare.',
                  status: 'OPERATIVA',
                },
              ].map((row) => (
                <tr key={row.phase} className="transition-colors hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] font-semibold text-accent-soft">
                    {row.phase}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[12px] font-medium text-ink">
                    {row.name}
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                    {row.mods}
                  </td>
                  <td className="px-3 py-3 text-[11.5px] leading-relaxed text-ink-soft">{row.desc}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-emerald-500/25 bg-emerald-500/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-emerald-300/90">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Code Snippets & Deployment Connectors */}
      <section className="surface surface-edge space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/[0.04] text-ink-soft">
              <FileCode2 className="h-3.5 w-3.5" />
            </span>
            <div className="leading-tight">
              <div className="label-micro">Deployment</div>
              <h2 className="mt-0.5 text-[13px] font-semibold text-ink">Sorgenti pronti all&apos;uso</h2>
            </div>
          </div>

          <Segmented
            value={activeSnippet}
            onChange={(id) => setActiveSnippet(id as 'gas' | 'colab' | 'telegram')}
            options={[
              { id: 'gas', label: 'Apps Script' },
              { id: 'colab', label: 'Colab SSH' },
              { id: 'telegram', label: 'Telegram' },
            ]}
          />
        </div>

        <div className="relative">
          <button
            onClick={() =>
              handleCopy(
                activeSnippet === 'gas'
                  ? gasScriptCode
                  : activeSnippet === 'colab'
                    ? colabScriptCode
                    : telegramSetupInstructions
              )
            }
            className="btn-ghost absolute right-3 top-3 z-10"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copiato' : 'Copia'}
          </button>

          <pre className="max-h-[380px] overflow-x-auto rounded-lg border border-hairline bg-void/70 p-4 font-mono text-[11.5px] leading-relaxed text-ink-soft">
            {activeSnippet === 'gas' && gasScriptCode}
            {activeSnippet === 'colab' && colabScriptCode}
            {activeSnippet === 'telegram' && telegramSetupInstructions}
          </pre>
        </div>
      </section>
    </PageShell>
  );
};
