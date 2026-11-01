import React, { useState, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Camera, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Lock, 
  Unlock, 
  Copy, 
  FileJson,
  Upload,
  RefreshCw
} from 'lucide-react';
import { RoutingLogItem } from '../types/navicella';
import { transcribeAudio, analyzeVision, updateWhitelist, fetchWhitelist } from '../services/api';
import nicoCoreImg from '../assets/images/nico_core_hologram_1793542128851.jpg';

interface NicoErmesModuleProps {
  onSendMessage: (text: string, source: 'TELEGRAM_TEXT' | 'TELEGRAM_VOICE' | 'TELEGRAM_IMAGE') => Promise<any>;
  logs: RoutingLogItem[];
  whitelistConfig: { allowedChatIds: string[]; allowedUserIds: string[]; authEnabled: boolean };
  onRefreshWhitelist: () => void;
}

export const NicoErmesModule: React.FC<NicoErmesModuleProps> = ({
  onSendMessage,
  logs,
  whitelistConfig,
  onRefreshWhitelist,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'inspector' | 'whitelist' | 'webhook'>('chat');
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioStatus, setAudioStatus] = useState<string>('');

  // Image input state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inspector selected log
  const [selectedLog, setSelectedLog] = useState<RoutingLogItem | null>(logs[0] || null);

  // Whitelist local edit state
  const [editChatIds, setEditChatIds] = useState(whitelistConfig.allowedChatIds.join(', '));
  const [editUserIds, setEditUserIds] = useState(whitelistConfig.allowedUserIds.join(', '));
  const [authEnabled, setAuthEnabled] = useState(whitelistConfig.authEnabled);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle Text Submission
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await onSendMessage(textToSend, 'TELEGRAM_TEXT');
      if (res && logs.length > 0) {
        setSelectedLog(logs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice recording logic with MediaRecorder
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setAudioStatus('Elaborazione buffer audio in corso...');
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setAudioStatus('E.R.M.E.S. Pipeline: Trascrizione vocale Gemini in corso...');
            try {
              const res = await transcribeAudio(base64Audio, 'audio/webm');
              setAudioStatus('');
              if (res.text) {
                setInputText(res.text);
                setIsProcessing(true);
                await onSendMessage(res.text, 'TELEGRAM_VOICE');
                setIsProcessing(false);
              }
            } catch (err: any) {
              setAudioStatus(`Errore trascrizione: ${err.message}`);
              setTimeout(() => setAudioStatus(''), 3000);
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAudioStatus('Registrazione audio in corso... Parla ora.');
      } catch (err: any) {
        setAudioStatus(`Microfono non accessibile: ${err.message}. Uso simulazione vocale.`);
        setTimeout(async () => {
          setAudioStatus('Invio audio di esempio da specifiche...');
          setInputText('Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata');
          await onSendMessage('Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata', 'TELEGRAM_VOICE');
          setAudioStatus('');
        }, 1500);
      }
    }
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsProcessing(true);
      try {
        const visionResult = await analyzeVision(base64, 'general');
        setInputText(visionResult.analysis);
        await onSendMessage(
          `[Immagine Scontrino/Nota inviata]: ${visionResult.analysis}`,
          'TELEGRAM_IMAGE'
        );
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
        setImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Whitelist
  const handleSaveWhitelist = async () => {
    const chatIds = editChatIds.split(',').map((s) => s.trim()).filter(Boolean);
    const userIds = editUserIds.split(',').map((s) => s.trim()).filter(Boolean);
    await updateWhitelist({ allowedChatIds: chatIds, allowedUserIds: userIds, authEnabled });
    setSaveSuccess(true);
    onRefreshWhitelist();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400">
              ORCHESTRATORE CENTRALE & GATEWAY C-01
            </span>
            <span className="text-xs font-mono text-slate-400">
              FUNCTION CALLING &bull; WHITELIST O(1)
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            N.I.C.O. & E.R.M.E.S. GATEWAY
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Punto unico di ingestion per messaggi testo, note vocali (Whisper/Gemini) e immagini (OCR/SMILES). 
            N.I.C.O. esegue la classificazione dell'intento e genera output JSON tipizzati con Function Calling.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'chat' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Telegram Console
          </button>
          <button
            onClick={() => {
              setActiveTab('inspector');
              if (!selectedLog && logs.length > 0) setSelectedLog(logs[0]);
            }}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'inspector' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            JSON Router Inspector
          </button>
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'whitelist' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Whitelist Auth
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'webhook' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
            }`}
          >
            Webhook API
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Telegram Simulator Cockpit */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col h-[650px] shadow-lg">
            {/* Telegram Header */}
            <div className="bg-slate-900/90 border-b border-slate-800 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
                  <img src={nicoCoreImg} alt="N.I.C.O. Hologram" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    N.I.C.O. Bot
                    <span className="text-[10px] px-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                      @navicella_bot
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Online &bull; E.R.M.E.S. Webhook Hooked
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-400">
                <span>Chat ID: </span>
                <span className="text-cyan-400">{whitelistConfig.allowedChatIds[0] || '123456789'}</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> NAVICELLA V1.0 INGESTION GATEWAY READY
                </div>
                <div>Invia un messaggio per testare N.I.C.O.:</div>
                <div className="text-slate-300 italic pl-2 border-l border-cyan-800/50">
                  - Spese: "Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata"<br/>
                  - Turni: "Domani lavoro 14-18 turno farmacia"<br/>
                  - Bio: "Sono esausto stasera, la testa scoppia"
                </div>
              </div>

              {logs.map((log) => (
                <div key={log.id} className="space-y-3">
                  {/* User Message Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-700 to-cyan-700 text-white p-3.5 text-xs shadow-md space-y-1">
                      <div className="flex items-center justify-between gap-4 text-[10px] text-blue-200 font-mono">
                        <span>{log.source}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm font-sans">{log.rawInput}</div>
                    </div>
                  </div>

                  {/* NICO Response Bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-900 border border-cyan-900/60 text-slate-200 p-3.5 text-xs shadow-md space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5">
                        <span className="text-cyan-400 font-bold flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-cyan-400" /> N.I.C.O. ROUTER [{log.targetCompartment}]
                        </span>
                        <span className="text-slate-400">{log.latencyMs}ms</span>
                      </div>

                      {/* Main Telegram reply text */}
                      <div className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                        {log.telegramResponse}
                      </div>

                      {/* Function Calling details badge */}
                      {log.functionName && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] bg-slate-950/60 p-2 rounded">
                          <div className="text-amber-400 font-bold flex items-center justify-between">
                            <span>FUNCTION: {log.functionName}()</span>
                            <span className="text-[10px] text-slate-500">Structured Output</span>
                          </div>
                          <div className="text-slate-400 truncate mt-0.5">
                            ARGS: {JSON.stringify(log.parameters)}
                          </div>
                        </div>
                      )}

                      {/* Parallel Sub-routines (e.g. D.N.A. stub creation) */}
                      {log.subRoutines && log.subRoutines.length > 0 && (
                        <div className="mt-2 bg-emerald-950/40 border border-emerald-800/50 rounded p-2 text-[11px] font-mono text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" /> SUB-ROUTINE PARALLELA ATTIVATA:
                          </div>
                          {log.subRoutines.map((sub, sIdx) => (
                            <div key={sIdx} className="text-slate-300 text-[10px]">
                              <span className="text-emerald-400 font-bold">{sub.module}:</span> {sub.action}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 p-3 text-xs font-mono text-cyan-400 bg-slate-900/60 rounded-lg w-max border border-cyan-800/40">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                  <span>N.I.C.O. sta analizzando il messaggio ed eseguendo Function Calling...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2">
              {audioStatus && (
                <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800 flex items-center gap-1.5 animate-pulse">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  {audioStatus}
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                {/* Voice Record Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  title="Registra nota vocale (Whisper Pipeline)"
                  className={`p-2.5 rounded-lg border transition-all ${
                    isRecording 
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Image / Receipt Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Invia scontrino o immagine molecola (OCR/Vision)"
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Scrivi messaggio come su Telegram (es. spesa, turno, chimica)..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Invia</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Col: Live Semantic Router & Guardrail Status */}
          <div className="space-y-4">
            {/* Semantic Intent Radar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5 uppercase">
                  <Cpu className="w-4 h-4 text-cyan-400" /> SEMANTIC ROUTER ENGINE
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                N.I.C.O. non dialoga liberamente ma valida semantica ed esegue il routing alle API dedicate.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Classificatore:</span>
                  <span className="text-slate-200">Zero-Shot Intent</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Funzioni Registrate:</span>
                  <span className="text-amber-400 font-bold">6 Function Calls</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Short-Term Memory:</span>
                  <span className="text-emerald-400">Last 10 turns</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Long-Term Memory:</span>
                  <span className="text-cyan-400">D.N.A. Vector RAG</span>
                </div>
              </div>
            </div>

            {/* Guardrails & Security Layer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> GUARDRAILS & SICUREZZA
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ENFORCED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Anti-Prompt Injection:</strong> Inibisce comandi che tentano di forzare record fittizi in L.E.D.G.E.R.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sanitizzazione Input:</strong> Rimozione caratteri di escape e parsing sicuro JSON.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Whitelist O(1):</strong> Scarto istantaneo dei payload da chat non autorizzate.</span>
                </div>
              </div>
            </div>

            {/* Quick Helper */}
            <div className="p-3.5 rounded-xl border border-cyan-900/40 bg-gradient-to-br from-cyan-950/30 to-slate-900 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-cyan-300 font-mono text-xs">
                💡 Test Rapido dal Microfono:
              </div>
              <p className="text-[11px] text-slate-400">
                Clicca sull'icona del microfono in basso a sinistra e detta una frase di spesa o un turno. 
                Verrà trascritta in streaming e inviata automaticamente a N.I.C.O.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: JSON Inspector */}
      {activeTab === 'inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History list */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase">
              PAYLOADS RECENTI N.I.C.O.
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLog(item)}
                  className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                    selectedLog?.id === item.id 
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold">{item.targetCompartment}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="truncate text-slate-200 mt-1 font-sans text-xs">
                    "{item.rawInput}"
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">
                    fn: {item.functionName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Tree View */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100">
                  STRUCTURED FUNCTION CALL PAYLOAD (JSON)
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                STATUS: SUCCESS
              </span>
            </div>

            {selectedLog ? (
              <div className="space-y-4">
                <div>
                  <div className="text-slate-500 text-[11px] uppercase">Input Ricevuto da Telegram:</div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-sans text-sm">
                    "{selectedLog.rawInput}"
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px] uppercase">Function Calling Strutturato:</div>
                  <pre className="p-3.5 rounded bg-slate-900 border border-cyan-900/50 text-cyan-300 overflow-x-auto text-xs leading-relaxed">
{JSON.stringify({
  function: selectedLog.functionName,
  compartment: selectedLog.targetCompartment,
  parameters: selectedLog.parameters,
  subRoutines: selectedLog.subRoutines,
  timestamp: selectedLog.timestamp,
}, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px] uppercase">Risposta Telemetrica Formulata:</div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 font-sans text-xs">
                    {selectedLog.telegramResponse}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Seleziona un evento dalla colonna di sinistra.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Whitelist Security */}
      {activeTab === 'whitelist' && (
        <div className="max-w-3xl rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold font-mono text-slate-100 text-sm">
                  C-01 E.R.M.E.S. AUTH & SECURITY LAYER
                </h3>
                <p className="text-xs text-slate-400">
                  Controllo O(1) in middleware: se chat_id o user_id non combaciano con la whitelist, rigetto immediato con HTTP 200.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthEnabled(!authEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
                  authEnabled
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-rose-950 text-rose-300 border-rose-600'
                }`}
              >
                {authEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {authEnabled ? 'WHITELIST ATTIVA' : 'DISATTIVATA'}
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Chat ID Autorizzati (separati da virgola):
              </label>
              <input
                type="text"
                value={editChatIds}
                onChange={(e) => setEditChatIds(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="123456789, 987654321, commander_root"
              />
              <span className="text-[10px] text-slate-500">
                Il tuo ID Telegram personale fornito da @userinfobot o BotFather.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                User ID Amministratore / Owner Autorizzati:
              </label>
              <input
                type="text"
                value={editUserIds}
                onChange={(e) => setEditUserIds(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="123456789, domy_dentamaro"
              />
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-sans">
              ℹ️ <strong>Comportamento da specifica:</strong> Quando un webhook Telegram arriva con un mittente non presente in whitelist, 
              il middleware restituisce comunque <code className="text-cyan-400 font-mono">HTTP 200 OK</code> con codice di scarto interno, 
              evitando che i server Telegram ritentino la consegna in loop infinito.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveWhitelist}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Salva Configurazione Whitelist
              </button>

              {saveSuccess && (
                <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                  ✓ Configurazione salvata in memoria!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Webhook Setup */}
      {activeTab === 'webhook' && (
        <div className="max-w-3xl rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> CONFIGURAZIONE LIVE TELEGRAM WEBHOOK
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Istruzioni per collegare un vero bot Telegram (BotFather) a questo gateway della Navicella.
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[11px] uppercase mb-1">1. Endpoint Webhook E.R.M.E.S.:</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/ermes/webhook`}
                  className="flex-1 p-2.5 rounded bg-slate-950 border border-cyan-800 text-cyan-300 text-xs select-all"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/ermes/webhook`)}
                  className="px-3 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px] uppercase mb-1">2. Comando cURL per BotFather / Telegram API:</div>
              <pre className="p-3.5 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
{`curl -F "url=${window.location.origin}/api/ermes/webhook" \\
  https://api.telegram.org/bot<TUO_BOT_TOKEN>/setWebhook`}
              </pre>
            </div>

            <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800 space-y-2 font-sans text-xs text-slate-300">
              <div className="font-bold text-cyan-300 font-mono">📋 Note Tecniche per la Fase 1 (MVP Ingestion):</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Supporta payload JSON nativi di Telegram: <code className="text-cyan-400 font-mono">message.text</code>, <code className="text-cyan-400 font-mono">message.voice</code>, <code className="text-cyan-400 font-mono">message.photo</code>.</li>
                <li>Include header di sanitizzazione per impedire injection di script o prompt maliziosi.</li>
                <li>Le risposte vengono formulate da N.I.C.O. e re-inoltrate come output testuale formattato all'utente.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
