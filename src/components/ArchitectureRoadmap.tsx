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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-800 text-teal-400">
              SPECIFICHE TECNICHE & ROADMAP V1.0
            </span>
            <span className="text-xs font-mono text-slate-400">
              SISTEMA GESTIONALE AD AGENTI & MICROSERVIZI
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            ARCHITETTURA DI SISTEMA NAVICELLA
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Sintesi dell'architettura multi-modulo, pipeline di smistamento semantico N.I.C.O., 
            matrice di deployment nelle 4 fasi operative e codice sorgente bridge pronto all'uso.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-teal-300 bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-800">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Fasi 1-4 Attive nel Simulatore</span>
        </div>
      </div>

      {/* Visual Architectural Map */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono text-teal-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" /> SCHEMA ARCHITETTURALE FLUSSO DATI (DATA-FLOW V1.0)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Layer 1: Ingestion */}
          <div className="p-4 rounded-xl border border-sky-900/50 bg-slate-950/80 space-y-2">
            <div className="text-sky-400 font-bold text-sm flex items-center gap-1.5">
              <Send className="w-4 h-4" /> 1. INGESTION & GATEWAY
            </div>
            <div className="text-slate-300 font-sans text-xs">
              <strong>E.R.M.E.S.</strong> riceve webhook Telegram asincroni (Testo, Note Audio Whisper, Immagini Vision OCR).
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              &bull; Whitelist check O(1) immediato<br/>
              &bull; Sanitizzazione payload POST
            </div>
          </div>

          {/* Layer 2: Brain Router */}
          <div className="p-4 rounded-xl border border-cyan-900/50 bg-slate-950/80 space-y-2">
            <div className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> 2. BRAIN & ORCHESTRATOR
            </div>
            <div className="text-slate-300 font-sans text-xs">
              <strong>N.I.C.O.</strong> esegue Intent Classification e produce JSON strutturato con Function Calling.
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              &bull; Memoria breve (10 turni Telegram)<br/>
              &bull; Memoria lunga (RAG D.N.A.)<br/>
              &bull; Guardrails anti-prompt injection
            </div>
          </div>

          {/* Layer 3: Execution Services */}
          <div className="p-4 rounded-xl border border-emerald-900/50 bg-slate-950/80 space-y-2">
            <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" /> 3. STORAGE & COMPUTE
            </div>
            <div className="text-slate-300 font-sans text-xs">
              Smistamento parallelo ai microservizi specializzati della piattaforma:
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 space-y-0.5">
              <div>&bull; <strong>D.N.A.:</strong> Obsidian Vault & Vettori</div>
              <div>&bull; <strong>L.E.W.I.S.:</strong> RDKit & Feynman</div>
              <div>&bull; <strong>F.O.R.G.E.:</strong> Colab GPU & DeepSeek</div>
              <div>&bull; <strong>R.O.U.T.E.:</strong> Calendar & Turni</div>
              <div>&bull; <strong>F.A.R.A.D.A.Y.:</strong> Bio-State Override</div>
              <div>&bull; <strong>L.E.D.G.E.R.:</strong> Sheets & Runway</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Phases Deployment Roadmap Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-xs font-bold font-mono text-teal-300 uppercase tracking-wider">
          ROADMAP DI DEPLOYMENT (SEZIONE 4 DELLE SPECIFICHE)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[11px] uppercase">
                <th className="py-2.5 px-3">Fase</th>
                <th className="py-2.5 px-3">Denominazione</th>
                <th className="py-2.5 px-3">Moduli Coinvolti</th>
                <th className="py-2.5 px-3">Attività Chiave</th>
                <th className="py-2.5 px-3 text-right">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-bold text-cyan-400">Fase 1</td>
                <td className="py-3 px-3 text-white font-bold">MVP Ingestion</td>
                <td className="py-3 px-3 text-sky-400">E.R.M.E.S.</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Setup ambiente serverless, configurazione bot Telegram (BotFather), validazione webhook POST bidirezionali. Deploy Echo-Bot.
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    COMPLETATA
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-bold text-cyan-400">Fase 2</td>
                <td className="py-3 px-3 text-white font-bold">Brain & Routing</td>
                <td className="py-3 px-3 text-cyan-400">N.I.C.O.</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Integrazione API LLM (Gemini 3.8 Flash). Creazione schemi JSON Schema per Function Calling. Test intent classification.
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    COMPLETATA
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-bold text-cyan-400">Fase 3</td>
                <td className="py-3 px-3 text-white font-bold">DB & Logistica</td>
                <td className="py-3 px-3 text-emerald-400">D.N.A., R.O.U.T.E., L.E.D.G.E.R.</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Sviluppo API CRUD con Google Apps Script. Deploy Vector Database ed embedding documenti Markdown Obsidian pre-esistenti.
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    COMPLETATA
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-3 font-bold text-cyan-400">Fase 4</td>
                <td className="py-3 px-3 text-white font-bold">Advanced Compute</td>
                <td className="py-3 px-3 text-orange-400">L.E.W.I.S., F.O.R.G.E., F.A.R.A.D.A.Y.</td>
                <td className="py-3 px-3 text-slate-300 font-sans">
                  Container Docker per Ollama (DeepSeek-R1 locale) e test tunneling SSH verso notebook GPU A100 per docking molecolare.
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    OPERATIVA
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets & Deployment Connectors */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold font-mono text-slate-100 text-sm">
              SORGENTI PRONTI AL DEPLOYMENT ESTERNO
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSnippet('gas')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeSnippet === 'gas' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              Google Apps Script (GAS)
            </button>
            <button
              onClick={() => setActiveSnippet('colab')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeSnippet === 'colab' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              Google Colab SSH
            </button>
            <button
              onClick={() => setActiveSnippet('telegram')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeSnippet === 'telegram' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              Telegram Setup
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => handleCopy(
              activeSnippet === 'gas' ? gasScriptCode : activeSnippet === 'colab' ? colabScriptCode : telegramSetupInstructions
            )}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold font-mono shadow-md shadow-teal-600/30 z-10 transition-all hover:scale-105"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiato!' : 'Copia Codice'}
          </button>

          <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px]">
            {activeSnippet === 'gas' && gasScriptCode}
            {activeSnippet === 'colab' && colabScriptCode}
            {activeSnippet === 'telegram' && telegramSetupInstructions}
          </pre>
        </div>
      </div>
    </div>
  );
};
