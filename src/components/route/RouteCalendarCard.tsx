import React from 'react';
import { CalendarClock, CheckCircle2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { GoogleCalendarStatus } from '../../types/navicella';
import { Panel, PanelHeader, StatusDot } from '../ui/Page';

/* ============================================================================
   R.O.U.T.E. → Google Calendar
   Stato della sincronizzazione e pulsante di allineamento manuale.
   Le notifiche sul telefono dipendono dai reminder impostati sugli eventi
   (60′ e 10′ prima per gli impegni, 1 giorno e 2 ore prima per gli appelli).
   ============================================================================ */

interface RouteCalendarCardProps {
  status: GoogleCalendarStatus | null;
  syncing: boolean;
  onSync: () => void;
}

const formatMoment = (iso: string | null): string => {
  if (!iso) return 'mai';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'mai';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const RouteCalendarCard: React.FC<RouteCalendarCardProps> = ({ status, syncing, onSync }) => {
  const configured = status?.configured ?? false;
  const dryRun = status?.dryRun ?? false;

  return (
    <Panel>
      <PanelHeader
        icon={CalendarClock}
        label="Google Calendar"
        title="Sincronizzazione & avvisi"
        aside={
          <StatusDot
            tone={configured ? (status?.lastError ? 'warning' : 'success') : 'neutral'}
            label={configured ? (dryRun ? 'dry-run' : 'attivo') : 'non configurato'}
          />
        }
      />

      {!configured ? (
        <div className="mt-4 space-y-2 rounded-lg border border-dashed border-hairline px-3 py-3">
          <p className="text-[12px] leading-snug text-ink-soft">
            Collega un calendario Google per ricevere gli impegni e gli appelli sul telefono.
            Servono tre variabili nel file <code className="font-mono text-[11px] text-ink">.env</code>:
          </p>
          <ul className="space-y-1 font-mono text-[10.5px] leading-snug text-ink-dim">
            <li>GOOGLE_CLIENT_ID=…</li>
            <li>GOOGLE_CLIENT_SECRET=…</li>
            <li>GOOGLE_REFRESH_TOKEN=…</li>
          </ul>
          <p className="text-[11px] leading-snug text-ink-dim">
            La procedura guidata è nella sezione «Google Calendar» del README
            (<code className="font-mono text-[10.5px]">npm run google:auth</code>).
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="surface-2 px-3 py-2">
              <div className="label-micro">Calendario</div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink">
                {status?.calendarId ?? '—'}
              </div>
            </div>
            <div className="surface-2 px-3 py-2">
              <div className="label-micro">Fuso</div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink">
                {status?.timeZone ?? '—'}
              </div>
            </div>
            <div className="surface-2 px-3 py-2">
              <div className="label-micro">Da sincronizzare</div>
              <div className="mt-1 font-mono text-[11px] text-ink">{status?.pending ?? 0}</div>
            </div>
            <div className="surface-2 px-3 py-2">
              <div className="label-micro">Ultima sync</div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink">
                {formatMoment(status?.lastSuccessAt ?? null)}
              </div>
            </div>
          </div>

          {status?.lastError ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 font-mono text-[10.5px] leading-snug text-amber-200/90">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {status.lastError}
            </p>
          ) : (
            <p className="mt-3 flex items-start gap-1.5 font-mono text-[10.5px] leading-snug text-emerald-300/80">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
              Reminder attivi: 60′ e 10′ prima degli impegni, 1 giorno e 2 ore prima degli appelli.
            </p>
          )}

          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="btn-ghost mt-3 w-full justify-center"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncing ? 'Sincronizzazione…' : 'Sincronizza ora'}
          </button>
        </>
      )}
    </Panel>
  );
};

export default RouteCalendarCard;
