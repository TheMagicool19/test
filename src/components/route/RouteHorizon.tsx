import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { RouteOverview, RouteWarning } from '../../types/navicella';
import { EmptyState, Panel, PanelHeader, Progress, StatusDot } from '../ui/Page';

/* ============================================================================
   R.O.U.T.E. — Orizzonte dei prossimi 60 giorni
   Vista compatta: settimane, carico, appelli e segnalazioni deterministiche
   (esame imminente senza studio pianificato, settimana sovraccarica…).
   ============================================================================ */

interface RouteHorizonProps {
  overview: RouteOverview | null;
  loading: boolean;
  onFocusDate?: (date: string) => void;
  onRefresh?: () => void;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

const formatDay = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

const formatHours = (minutes: number): string => {
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${pad2(rest)}m`;
};

const SEVERITY_META: Record<
  RouteWarning['severity'],
  { icon: React.ComponentType<{ className?: string }>; text: string; border: string; bg: string }
> = {
  critical: {
    icon: AlertTriangle,
    text: 'text-rose-200',
    border: 'border-rose-400/30',
    bg: 'bg-rose-500/[0.07]',
  },
  warning: {
    icon: AlertTriangle,
    text: 'text-amber-200',
    border: 'border-amber-400/25',
    bg: 'bg-amber-400/[0.06]',
  },
  info: {
    icon: Info,
    text: 'text-ink-soft',
    border: 'border-hairline',
    bg: 'bg-white/[0.02]',
  },
};

interface WeekBucket {
  index: number;
  from: string;
  to: string;
  shiftMinutes: number;
  studyMinutes: number;
  examCount: number;
  freeMinutes: number;
}

function groupWeeks(overview: RouteOverview): WeekBucket[] {
  const buckets: WeekBucket[] = [];

  for (let index = 0; index < overview.days.length; index += 7) {
    const slice = overview.days.slice(index, index + 7);
    if (slice.length === 0) continue;
    buckets.push({
      index: buckets.length,
      from: slice[0].date,
      to: slice[slice.length - 1].date,
      shiftMinutes: slice.reduce((total, day) => total + day.shiftMinutes, 0),
      studyMinutes: slice.reduce((total, day) => total + day.studyMinutes, 0),
      examCount: slice.reduce((total, day) => total + day.examCount, 0),
      freeMinutes: slice.reduce((total, day) => total + day.freeMinutes, 0),
    });
  }

  return buckets;
}

export const RouteHorizon: React.FC<RouteHorizonProps> = ({
  overview,
  loading,
  onFocusDate,
  onRefresh,
}) => {
  const weeks = overview ? groupWeeks(overview) : [];
  const maxWeekMinutes = Math.max(...weeks.map((week) => week.shiftMinutes), 1);
  const warnings = overview?.warnings ?? [];
  const criticalCount = warnings.filter((warning) => warning.severity === 'critical').length;
  const exams = overview?.exams ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Panel>
        <PanelHeader
          icon={AlertTriangle}
          label="Segnalazioni"
          title="Cosa richiede attenzione"
          aside={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                {criticalCount} critiche · {warnings.length} totali
              </span>
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-dim transition-colors hover:border-hairline-strong hover:text-ink"
                  title="Ricalcola"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : null}
            </div>
          }
        />

        {warnings.length === 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2.5">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <p className="text-[12px] leading-snug text-emerald-100/90">
              Nessuna criticità: appelli sotto controllo e carico settimanale sostenibile.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {warnings.map((warning) => {
              const meta = SEVERITY_META[warning.severity];
              const Icon = meta.icon;
              return (
                <li
                  key={warning.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${meta.border} ${meta.bg}`}
                >
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.text}`} />
                  <span className={`text-[12px] leading-snug ${meta.text}`}>{warning.message}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          icon={CalendarDays}
          label="Orizzonte"
          title={overview ? `${formatDay(overview.from)} → ${formatDay(overview.to)}` : 'Prossimi 60 giorni'}
          aside={
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
              {overview ? `${overview.totals.examCount} appelli · ${formatHours(overview.totals.studyMinutes)} studio` : '—'}
            </span>
          }
        />

        {!overview && loading ? (
          <div className="mt-4">
            <EmptyState icon={Loader2} title="Calcolo orizzonte…" />
          </div>
        ) : weeks.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={CalendarDays} title="Nessun dato disponibile" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {weeks.map((week) => (
              <li key={week.from}>
                <button
                  type="button"
                  onClick={() => onFocusDate?.(week.from)}
                  className="w-full text-left"
                  title="Apri la settimana in agenda"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                      {week.index === 0 ? 'questa settimana' : `+${week.index * 7}g`} · {formatDay(week.from)}–{formatDay(week.to)}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {formatHours(week.shiftMinutes)}
                      {week.examCount > 0 ? (
                        <span className="ml-1.5 rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-accent-soft">
                          {week.examCount} appelli
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full bg-ink/40 transition-all duration-500"
                      style={{ width: `${Math.max(2, (week.shiftMinutes / maxWeekMinutes) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${Math.max(0, (week.studyMinutes / maxWeekMinutes) * 100)}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" /> impegni
            <span className="ml-2 h-1.5 w-1.5 rounded-full bg-accent" /> studio per esame
          </span>
          <span className="text-ink">{overview ? formatHours(overview.totals.shiftMinutes) : '—'}</span>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon={BookOpen}
          label="Preparazione"
          title="Appelli in arrivo"
          aside={
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
              {exams.length}
            </span>
          }
        />

        {exams.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={BookOpen} title="Nessun appello nell'orizzonte" />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {exams.map((exam) => {
              const planned = exam.stats.plannedMinutes;
              const target = exam.stats.targetMinutes;
              const pct = exam.stats.progressPct;
              const tone =
                exam.stats.riskLevel === 'critical'
                  ? 'danger'
                  : exam.stats.riskLevel === 'attention'
                    ? 'warning'
                    : 'success';

              return (
                <li key={exam.id} className="rounded-lg border border-hairline bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-[12px] font-medium leading-snug text-ink">
                      {exam.subject}
                    </span>
                    <StatusDot
                      tone={exam.stats.riskLevel === 'critical' ? 'danger' : exam.stats.riskLevel === 'attention' ? 'warning' : 'success'}
                      label={`${exam.daysLeft}g`}
                    />
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                    <span>{formatDay(exam.date)}</span>
                    <span>
                      {formatHours(planned)}
                      {target ? ` / ${formatHours(target)}` : ' pianificati'}
                      {pct !== null ? ` · ${pct}%` : ''}
                    </span>
                  </div>

                  <Progress
                    value={pct ?? Math.min(100, planned > 0 ? 40 : 3)}
                    tone={tone}
                    className="mt-1.5"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default RouteHorizon;
