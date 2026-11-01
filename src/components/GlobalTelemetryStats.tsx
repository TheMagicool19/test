import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  HeartPulse, 
  Wallet, 
  ShieldAlert, 
  Calendar,
  Radio
} from 'lucide-react';
import { SystemTelemetry } from '../types/navicella';

interface TelemetryPoint {
  date: string;
  dayLabel: string;
  battery: number;
  expense: number;
  cumulativeExpense: number;
  runway: number;
  studyHours: number;
  isOverrideTriggered: boolean;
}

const BASE_TELEMETRY_DATA: TelemetryPoint[] = [
  { date: '2026-10-18', dayLabel: '18 Ott', battery: 85, expense: 12.0, cumulativeExpense: 120, runway: 8.5, studyHours: 5.0, isOverrideTriggered: false },
  { date: '2026-10-20', dayLabel: '20 Ott', battery: 78, expense: 45.0, cumulativeExpense: 165, runway: 8.3, studyHours: 5.5, isOverrideTriggered: false },
  { date: '2026-10-22', dayLabel: '22 Ott', battery: 64, expense: 8.5, cumulativeExpense: 173.5, runway: 8.2, studyHours: 4.0, isOverrideTriggered: false },
  { date: '2026-10-24', dayLabel: '24 Ott', battery: 52, expense: 32.0, cumulativeExpense: 205.5, runway: 8.0, studyHours: 3.5, isOverrideTriggered: false },
  { date: '2026-10-25', dayLabel: '25 Ott', battery: 34, expense: 15.0, cumulativeExpense: 220.5, runway: 7.9, studyHours: 2.0, isOverrideTriggered: false },
  { date: '2026-10-26', dayLabel: '26 Ott', battery: 16, expense: 0.0, cumulativeExpense: 220.5, runway: 7.9, studyHours: 0.0, isOverrideTriggered: true }, // Omega Lockdown
  { date: '2026-10-27', dayLabel: '27 Ott', battery: 42, expense: 24.0, cumulativeExpense: 244.5, runway: 7.8, studyHours: 2.5, isOverrideTriggered: false },
  { date: '2026-10-28', dayLabel: '28 Ott', battery: 62, expense: 62.0, cumulativeExpense: 306.5, runway: 7.7, studyHours: 4.5, isOverrideTriggered: false },
  { date: '2026-10-29', dayLabel: '29 Ott', battery: 70, expense: 5.0, cumulativeExpense: 311.5, runway: 7.6, studyHours: 5.0, isOverrideTriggered: false },
  { date: '2026-10-30', dayLabel: '30 Ott', battery: 58, expense: 18.5, cumulativeExpense: 330.0, runway: 7.5, studyHours: 3.5, isOverrideTriggered: false },
  { date: '2026-10-31', dayLabel: '31 Ott', battery: 74, expense: 37.0, cumulativeExpense: 367.0, runway: 7.5, studyHours: 4.5, isOverrideTriggered: false },
  { date: '2026-11-01', dayLabel: 'Oggi (01 Nov)', battery: 68, expense: 45.0, cumulativeExpense: 412.0, runway: 7.4, studyHours: 4.0, isOverrideTriggered: false },
];

interface GlobalTelemetryStatsProps {
  telemetry: SystemTelemetry | null;
}

export const GlobalTelemetryStats: React.FC<GlobalTelemetryStatsProps> = ({ telemetry }) => {
  const [activeView, setActiveView] = useState<'combined' | 'battery' | 'expenses'>('combined');
  const [timeRange, setTimeRange] = useState<'7d' | '14d'>('14d');

  // Inject current live battery and expenses into the latest data point
  const currentBattery = telemetry?.faradayBattery ?? 68;
  const currentSpend = telemetry?.monthlySpend ?? 412;
  const currentRunway = telemetry?.runwayMonths ?? 7.4;

  const dataset = BASE_TELEMETRY_DATA.map((pt, idx) => {
    if (idx === BASE_TELEMETRY_DATA.length - 1) {
      return {
        ...pt,
        battery: currentBattery,
        cumulativeExpense: currentSpend,
        runway: currentRunway,
        isOverrideTriggered: currentBattery < 20,
      };
    }
    return pt;
  });

  const displayData = timeRange === '7d' ? dataset.slice(-7) : dataset;

  // Key KPI Computations
  const avgBattery = Math.round(displayData.reduce((acc, curr) => acc + curr.battery, 0) / displayData.length);
  const totalPeriodSpend = displayData.reduce((acc, curr) => acc + curr.expense, 0);
  const overrideCount = displayData.filter((d) => d.isOverrideTriggered).length;

  // Custom Aerospace Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TelemetryPoint;
      return (
        <div className="rounded-xl border border-cyan-800/80 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-2 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {point.date}
            </span>
            <span className="text-[10px] text-slate-400">TELEMETRIA</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> F.A.R.A.D.A.Y.:
              </span>
              <span className={`font-bold ${
                point.battery < 20 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
              }`}>
                {point.battery}% {point.battery < 20 ? '⚠️ OVERRIDE' : ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Spesa del giorno:
              </span>
              <span className="font-bold text-amber-300">
                {point.expense.toFixed(2)} €
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Spesa Cumulata:
              </span>
              <span className="font-bold text-cyan-300">
                {point.cumulativeExpense.toFixed(2)} €
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
              <span className="text-slate-500">Runway Residua:</span>
              <span className="text-slate-300 font-bold">{point.runway} mesi</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5 shadow-lg relative overflow-hidden"
    >
      {/* Light beam scanline entrance sweep */}
      <motion.div
        initial={{ x: '-100%', opacity: 0.8 }}
        animate={{ x: '250%', opacity: 0 }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none transform -skew-x-12 z-20"
      />

      {/* Header bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-spin" /> TELEMETRIA GLOBALE TEMPORALE
            </span>
            <span className="text-xs font-mono text-slate-400">
              RECHARTS TELEMETRY &bull; STATE OVERLAY
            </span>
          </div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2 mt-1">
            <Activity className="w-4 h-4 text-indigo-400" /> METRICHE & TELEMETRIA OPERATIVA
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Analisi comparativa dell'andamento energetico psicofisico (F.A.R.A.D.A.Y.) e delle uscite finanziarie (L.E.D.G.E.R.) nel tempo.
          </p>
        </div>

        {/* Filters and View Switchers */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Time range */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === '7d' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              7 Giorni
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === '14d' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              14 Giorni
            </button>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('combined')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'combined' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Dual-Stream
            </button>
            <button
              onClick={() => setActiveView('battery')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'battery' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              F.A.R.A.D.A.Y.
            </button>
            <button
              onClick={() => setActiveView('expenses')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === 'expenses' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              L.E.D.G.E.R.
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Highlights Bar with Staggered Entrance */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.18 }
          }
        }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs"
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(244, 63, 94, 0.4)' }}
          className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 transition-colors"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <HeartPulse className="w-3 h-3 text-rose-400" /> MEDIA BATTERIA
          </div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">
            {avgBattery}%
          </div>
          <div className="text-[10px] text-slate-400">
            {avgBattery < 50 ? 'Carico moderato' : 'Livello ottimale'}
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)' }}
          className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 transition-colors"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Wallet className="w-3 h-3 text-amber-400" /> SPESA PERIODO
          </div>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {totalPeriodSpend.toFixed(2)} €
          </div>
          <div className="text-[10px] text-slate-400">
            Media: {(totalPeriodSpend / displayData.length).toFixed(1)} €/giorno
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(6, 182, 212, 0.4)' }}
          className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 transition-colors"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" /> RUNWAY ATTUALE
          </div>
          <div className="text-lg font-bold text-cyan-300 mt-0.5">
            {currentRunway} mesi
          </div>
          <div className="text-[10px] text-emerald-400">
            Tesoreria stabile
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 14, scale: 0.96 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(244, 63, 94, 0.5)' }}
          className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 transition-colors"
        >
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> OVERRIDE ATTIVATI
          </div>
          <div className={`text-lg font-bold mt-0.5 ${overrideCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {overrideCount} <span className="text-xs font-normal text-slate-400">eventi</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Soglia Omega &lt;20%
          </div>
        </motion.div>
      </motion.div>

      {/* Main Recharts Telemetry Canvas with Smooth Cross-fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeView}-${timeRange}`}
          initial={{ opacity: 0, scale: 0.985, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -6 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="h-72 sm:h-80 w-full pt-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                {/* Faraday gradient */}
                <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>

                {/* Cumulative Spend gradient */}
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis 
                dataKey="dayLabel" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis: Battery % */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#f43f5e"
                tick={{ fill: '#fb7185', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(v) => `${v}%`}
                tickLine={{ stroke: '#475569' }}
              />

              {/* Right Y Axis: Expenses € */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'dataMax + 50']}
                stroke="#f59e0b"
                tick={{ fill: '#fbbf24', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(v) => `${v}€`}
                tickLine={{ stroke: '#475569' }}
              />

              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'monospace' }} 
              />

              {/* Critical Faraday 20% Lockdown Line */}
              <ReferenceLine 
                yAxisId="left" 
                y={20} 
                stroke="#f43f5e" 
                strokeDasharray="4 4" 
                label={{ 
                  value: 'SOGLIA BLOCCO OMEGA (20%)', 
                  fill: '#f43f5e', 
                  fontSize: 10, 
                  position: 'insideBottomLeft',
                  fontFamily: 'monospace' 
                }} 
              />

              {/* Render based on selected view with entrance animation */}
              {(activeView === 'combined' || activeView === 'battery') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="battery"
                  name="Faraday Bio-Battery (%)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#batteryGradient)"
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={150}
                  dot={{ stroke: '#f43f5e', strokeWidth: 2, fill: '#0f172a', r: 3 }}
                  activeDot={{ r: 6, stroke: '#fda4af', strokeWidth: 2, fill: '#f43f5e' }}
                />
              )}

              {(activeView === 'combined' || activeView === 'expenses') && (
                <Bar
                  yAxisId="right"
                  dataKey="expense"
                  name="Spesa Giornaliera (€)"
                  fill="#f59e0b"
                  opacity={0.85}
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                  isAnimationActive={true}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  animationBegin={250}
                />
              )}

              {(activeView === 'combined' || activeView === 'expenses') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeExpense"
                  name="Uscite Cumulate Mese (€)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                  animationBegin={350}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* Footer diagnostic summary with fade-in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span> F.A.R.A.D.A.Y. Bio-Battery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> Spese Giornaliere
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-cyan-400 inline-block"></span> Trend Uscite Cumulate
          </span>
        </div>
        <div className="text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          Framer Motion Animation Engine &bull; Smooth Data-Loading
        </div>
      </motion.div>
    </motion.div>
  );
};
