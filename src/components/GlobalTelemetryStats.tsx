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
        <div className="z-50 min-w-[210px] space-y-2 rounded-xl border border-hairline-strong bg-panel/95 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-hairline pb-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <Calendar className="h-3.5 w-3.5 text-accent-soft" /> {point.date}
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-dim">Telemetria</span>
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
      className="surface surface-edge relative space-y-5 overflow-hidden p-5"
    >
      {/* Header bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col justify-between gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <Radio className="h-2.5 w-2.5 text-accent-soft" />
              Telemetria temporale
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
              Recharts · state overlay
            </span>
          </div>
          <h2 className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Activity className="h-3.5 w-3.5 text-ink-soft" />
            Metriche &amp; telemetria operativa
          </h2>
          <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-ink-dim">
            Andamento energetico psicofisico (F.A.R.A.D.A.Y.) e uscite finanziarie (L.E.D.G.E.R.) nel tempo.
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
                {/* Faraday gradient — accento */}
                <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7e6bf2" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#7e6bf2" stopOpacity={0.0} />
                </linearGradient>

                {/* Cumulative Spend gradient — ice cyan */}
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#45bed6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#45bed6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" opacity={1} />

              <XAxis 
                dataKey="dayLabel" 
                stroke="#2a3038" 
                tick={{ fill: '#6b7380', fontSize: 10, fontFamily: 'JetBrains Mono Variable, monospace' }}
                tickLine={{ stroke: '#23272e' }}
              />

              {/* Left Y Axis: Battery % */}
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#2a3038"
                tick={{ fill: '#98a0ac', fontSize: 10, fontFamily: 'JetBrains Mono Variable, monospace' }}
                tickFormatter={(v) => `${v}%`}
                tickLine={{ stroke: '#23272e' }}
              />

              {/* Right Y Axis: Expenses € */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'dataMax + 50']}
                stroke="#2a3038"
                tick={{ fill: '#98a0ac', fontSize: 10, fontFamily: 'JetBrains Mono Variable, monospace' }}
                tickFormatter={(v) => `${v}€`}
                tickLine={{ stroke: '#23272e' }}
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
                  stroke="#7e6bf2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#batteryGradient)"
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={150}
                  dot={{ stroke: '#7e6bf2', strokeWidth: 2, fill: '#0c0e12', r: 2.5 }}
                  activeDot={{ r: 5, stroke: '#a496f8', strokeWidth: 2, fill: '#7e6bf2' }}
                />
              )}

              {(activeView === 'combined' || activeView === 'expenses') && (
                <Bar
                  yAxisId="right"
                  dataKey="expense"
                  name="Spesa Giornaliera (€)"
                  fill="rgba(255,255,255,0.16)"
                  opacity={1}
                  radius={[3, 3, 0, 0]}
                  barSize={14}
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
                  stroke="#45bed6"
                  strokeWidth={1.75}
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
            <span className="inline-block h-2 w-2 rounded-full bg-accent"></span> F.A.R.A.D.A.Y. Bio-Battery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-white/25"></span> Spese Giornaliere
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-2.5 rounded bg-sky-400"></span> Trend Uscite Cumulate
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
