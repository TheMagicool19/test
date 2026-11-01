/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { ModuleNav } from './components/ModuleNav';
import { BridgeOverview } from './components/BridgeOverview';
import { NicoErmesModule } from './components/NicoErmesModule';
import { DnaModule } from './components/DnaModule';
import { LewisModule } from './components/LewisModule';
import { ForgeModule } from './components/ForgeModule';
import { RouteModule } from './components/RouteModule';
import { FaradayModule } from './components/FaradayModule';
import { LedgerModule } from './components/LedgerModule';
import { ArchitectureRoadmap } from './components/ArchitectureRoadmap';

import { CompartmentId, SystemTelemetry, RoutingLogItem } from './types/navicella';
import { 
  fetchSystemState, 
  sendNicoMessage, 
  fetchWhitelist 
} from './services/api';

const INITIAL_LOGS: RoutingLogItem[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: 'TELEGRAM_VOICE',
    rawInput: 'Oggi ho speso 45€ per il manuale di chimica organica, pagato con la prepagata',
    intent: 'ledger_add_expense',
    targetCompartment: 'C-07: L.E.D.G.E.R. (Tesoreria)',
    functionName: 'ledger_add_expense',
    parameters: {
      amount: 45,
      category: 'Accademia/CTF',
      item: 'Manuale Chimica Organica',
      method: 'Prepagata',
    },
    subRoutines: [
      {
        module: 'C-02: D.N.A. Knowledge Vault',
        action: 'Auto-Stub Markdown creato in Obsidian Vault',
        details: '# Manuale Chimica Organica - Da Studiare (CTF)',
      },
    ],
    telegramResponse:
      '✅ Spesa di 45€ registrata in L.E.D.G.E.R. Runway stimata: 7.4 mesi. Lo stub del libro è stato creato nel Vault D.N.A. per le future sessioni di L.E.W.I.S.',
    latencyMs: 142,
    status: 'SUCCESS',
  },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<CompartmentId>('bridge');
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [logs, setLogs] = useState<RoutingLogItem[]>(INITIAL_LOGS);
  const [whitelistConfig, setWhitelistConfig] = useState<{
    allowedChatIds: string[];
    allowedUserIds: string[];
    authEnabled: boolean;
  }>({
    allowedChatIds: ['123456789', '987654321', 'commander_root'],
    allowedUserIds: ['123456789', 'commander_root', 'domy_dentamaro'],
    authEnabled: true,
  });

  // Fetch initial telemetry and whitelist
  const loadInitialData = async () => {
    try {
      const state = await fetchSystemState();
      setTelemetry(state);
      const wl = await fetchWhitelist();
      if (wl) setWhitelistConfig(wl);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Central function to execute a prompt through N.I.C.O.
  const handleExecutePrompt = async (
    text: string,
    source: string = 'TELEGRAM_TEXT'
  ) => {
    const startTime = performance.now();
    try {
      const res = await sendNicoMessage(text);
      const latencyMs = Math.round(performance.now() - startTime);

      const topCall = res.functionCalls?.[0] || {};
      const newLog: RoutingLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: (source as any) || 'TELEGRAM_TEXT',
        rawInput: text,
        intent: res.intentClassification || 'general_query',
        targetCompartment: getCompartmentTitle(topCall.name || ''),
        functionName: topCall.name || 'general_query',
        parameters: topCall.args || {},
        subRoutines: res.subRoutines || [],
        telegramResponse: res.telegramReply,
        latencyMs,
        status: 'SUCCESS',
      };

      setLogs((prev) => [newLog, ...prev]);

      if (res.systemState) {
        setTelemetry(res.systemState);
      } else {
        // Refresh telemetry
        loadInitialData();
      }

      return res;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorLog: RoutingLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: (source as any) || 'TELEGRAM_TEXT',
        rawInput: text,
        intent: 'error',
        targetCompartment: 'N.I.C.O. Router',
        functionName: 'handle_error',
        parameters: { error: err.message },
        subRoutines: [],
        telegramResponse: `⚠️ Errore durante l'elaborazione del payload: ${err.message}`,
        latencyMs,
        status: 'ERROR',
      };
      setLogs((prev) => [errorLog, ...prev]);
      throw err;
    }
  };

  const getCompartmentTitle = (fnName: string): string => {
    if (fnName.startsWith('ledger_')) return 'C-07: L.E.D.G.E.R. (Tesoreria)';
    if (fnName.startsWith('route_')) return 'C-05: R.O.U.T.E. (Logistica & Turni)';
    if (fnName.startsWith('dna_')) return 'C-02: D.N.A. (Knowledge Vault & RAG)';
    if (fnName.startsWith('lewis_')) return 'C-03: L.E.W.I.S. (Reattore CTF)';
    if (fnName.startsWith('faraday_')) return 'C-06: F.A.R.A.D.A.Y. (Burnout Prevention)';
    if (fnName.startsWith('forge_')) return 'C-04: F.O.R.G.E. (R&D & Colab)';
    return 'N.I.C.O. Core Router';
  };

  // Helper for direct expense submission from L.E.D.G.E.R.
  const handleAddExpenseDirect = async (exp: { amount: number; category: string; item: string; method: string }) => {
    return handleExecutePrompt(
      `Ho speso ${exp.amount}€ per ${exp.item}, categoria ${exp.category}, pagato con ${exp.method}`,
      'TELEGRAM_TEXT'
    );
  };

  // Helper for adding shifts from R.O.U.T.E.
  const handleAddShiftDirect = async (nlText: string) => {
    return handleExecutePrompt(nlText, 'TELEGRAM_TEXT');
  };

  // Module titles for the Header
  const moduleTitles: Record<CompartmentId, string> = {
    bridge: 'Dashboard Generale (Overview Agenti)',
    'nico-ermes': 'N.I.C.O. Orchestrator & E.R.M.E.S. Gateway',
    dna: 'C-02: D.N.A. (Vault Obsidian & RAG)',
    lewis: 'C-03: L.E.W.I.S. (CTF Study & Feynman)',
    forge: 'C-04: F.O.R.G.E. (R&D Colab GPU)',
    route: 'C-05: R.O.U.T.E. (Time Management)',
    faraday: 'C-06: F.A.R.A.D.A.Y. (Bio-State & Recovery)',
    ledger: 'C-07: L.E.D.G.E.R. (Tesoreria & Runway)',
    architecture: 'Specifiche Tecniche & Roadmap Fasi 1-4',
  };

  return (
    <div className="min-h-screen bg-void text-ink flex flex-col relative antialiased">
      {/* ---- Atmosfera di fondo: un solo alone + maglia tecnica ---- */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 aurora" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-void to-transparent" />
      </div>

      {/* ---- Chrome applicativo (fascia piena, sticky) ---- */}
      <div className="sticky top-0 z-40 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.95)]">
        <HeaderHUD
          telemetry={telemetry}
          activeModuleTitle={moduleTitles[activeModule]}
        />
        <ModuleNav
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          faradayBattery={telemetry?.faradayBattery ?? 68}
        />
      </div>

      {/* ---- Contenuto del compartimento attivo ---- */}
      <main className="flex-1 relative z-10 pb-16">
        <div key={activeModule} className="animate-fade-in">
          {activeModule === 'bridge' && (
            <BridgeOverview
              telemetry={telemetry}
              onNavigate={setActiveModule}
              onExecutePrompt={handleExecutePrompt}
              recentLogs={logs}
            />
          )}

          {activeModule === 'nico-ermes' && (
            <NicoErmesModule
              onSendMessage={handleExecutePrompt}
              logs={logs}
              whitelistConfig={whitelistConfig}
              onRefreshWhitelist={loadInitialData}
            />
          )}

          {activeModule === 'dna' && <DnaModule />}

          {activeModule === 'lewis' && <LewisModule />}

          {activeModule === 'forge' && <ForgeModule telemetry={telemetry} />}

          {activeModule === 'route' && (
            <RouteModule
              shifts={telemetry?.activeShifts || []}
              exams={telemetry?.examsCountdown || []}
              onAddShift={handleAddShiftDirect}
            />
          )}

          {activeModule === 'faraday' && (
            <FaradayModule
              currentBattery={telemetry?.faradayBattery ?? 68}
              batteryStatus={telemetry?.faradayStatus ?? 'OPTIMAL'}
              onBatteryChange={(newBattery) => {
                setTelemetry((prev) =>
                  prev
                    ? {
                        ...prev,
                        faradayBattery: newBattery,
                        faradayStatus: newBattery < 20 ? 'CRITICAL_OVERRIDE' : newBattery < 50 ? 'MODERATE' : 'OPTIMAL',
                      }
                    : null
                );
              }}
            />
          )}

          {activeModule === 'ledger' && (
            <LedgerModule
              telemetry={telemetry}
              onAddExpenseDirect={handleAddExpenseDirect}
            />
          )}

          {activeModule === 'architecture' && <ArchitectureRoadmap />}
        </div>
      </main>

      {/* ---- Status bar inferiore: chiusura visiva della shell ---- */}
      <footer className="relative z-10 border-t border-hairline bg-void/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim sm:px-6">
          <span>Navicella V1.0 · Enterprise Suite</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Core operativo
            </span>
            <span className="text-hairline-strong">/</span>
            <span>N.I.C.O. Router</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
