/**
 * R.O.U.T.E. → Google Calendar
 *
 * Sincronizza impegni ed esami su un calendario Google tramite OAuth2
 * (refresh token). Gli eventi vengono creati con reminder espliciti, così le
 * notifiche arrivano sul telefono anche se il calendario non è "primary".
 *
 * Configurazione (variabili d'ambiente, mai nel codice):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   GOOGLE_CALENDAR_ID   (default: primary)
 *   GOOGLE_TIMEZONE      (default: Europe/Rome)
 *   GOOGLE_CALENDAR_DRY_RUN=1  → costruisce e logga gli eventi senza chiamare Google
 *
 * Senza credenziali il modulo resta inerte: R.O.U.T.E. funziona normalmente.
 */

import type { ExamRecord, ShiftRecord } from './routeEngine.ts';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://www.googleapis.com/calendar/v3';

/** Durata riservata in calendario per un appello con orario. */
const EXAM_EVENT_MINUTES = 120;

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  timeZone: string;
  dryRun: boolean;
}

export interface CalendarStatus {
  configured: boolean;
  dryRun: boolean;
  calendarId: string | null;
  timeZone: string;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastAction: string | null;
}

interface CalendarEventBody {
  summary: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides: { method: 'popup' | 'email'; minutes: number }[];
  };
  extendedProperties?: { private: Record<string, string> };
}

const runtime = {
  lastError: null as string | null,
  lastSuccessAt: null as string | null,
  lastAction: null as string | null,
};

/* ------------------------------------------------------------------ Config */

export function googleConfig(): GoogleCalendarConfig | null {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) return null;

  return {
    clientId,
    clientSecret,
    refreshToken,
    calendarId: (process.env.GOOGLE_CALENDAR_ID || 'primary').trim(),
    timeZone: (process.env.GOOGLE_TIMEZONE || 'Europe/Rome').trim(),
    dryRun: process.env.GOOGLE_CALENDAR_DRY_RUN === '1',
  };
}

export function isGoogleConfigured(): boolean {
  return googleConfig() !== null;
}

export function calendarStatus(): CalendarStatus {
  const config = googleConfig();
  return {
    configured: Boolean(config),
    dryRun: Boolean(config?.dryRun),
    calendarId: config?.calendarId ?? null,
    timeZone: config?.timeZone ?? 'Europe/Rome',
    lastError: runtime.lastError,
    lastSuccessAt: runtime.lastSuccessAt,
    lastAction: runtime.lastAction,
  };
}

/* ------------------------------------------------------------------- Token */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(config: GoogleCalendarConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `Token Google rifiutato (${response.status}): ${payload?.error_description || payload?.error || 'risposta non valida'}`,
    );
  }

  cachedToken = {
    value: String(payload.access_token),
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
}

/* ------------------------------------------------------------- Costruzione */

function isoDateTime(date: string, time: string, timeZone: string) {
  return { dateTime: `${date}T${time}:00`, timeZone };
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

function endTime(start: string, minutes: number): string {
  const [h, m] = start.split(':').map(Number);
  return minutesToTime((h || 0) * 60 + (m || 0) + minutes);
}

function weeklyRule(until: string | null | undefined): string {
  if (until) {
    const compact = until.replace(/-/g, '');
    return `RRULE:FREQ=WEEKLY;UNTIL=${compact}T235959Z`;
  }
  return 'RRULE:FREQ=WEEKLY;COUNT=26';
}

/** Payload Calendar per un impegno R.O.U.T.E. */
export function buildShiftEvent(shift: ShiftRecord, timeZone = 'Europe/Rome'): CalendarEventBody {
  const lines = [
    `Categoria: ${shift.category}`,
    shift.location ? `Luogo: ${shift.location}` : '',
    shift.notes ? `Note: ${shift.notes}` : '',
    shift.examId ? 'Sessione di studio collegata a un esame' : '',
    'Creato da NAVICELLA · R.O.U.T.E.',
  ].filter(Boolean);

  return {
    summary: shift.title,
    description: lines.join('\n'),
    location: shift.location,
    start: isoDateTime(shift.date, shift.start, timeZone),
    end: isoDateTime(shift.date, shift.end, timeZone),
    recurrence: shift.recurrence === 'weekly' ? [weeklyRule(shift.recurrenceUntil)] : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
    extendedProperties: { private: { routeId: shift.id, routeKind: 'shift' } },
  };
}

/** Payload Calendar per un esame (tutto il giorno se l'ora non è nota). */
export function buildExamEvent(exam: ExamRecord, timeZone = 'Europe/Rome'): CalendarEventBody {
  const lines = [
    `Esame · stato: ${exam.status} · priorità: ${exam.priority}`,
    exam.cfu ? `CFU: ${exam.cfu}` : '',
    exam.topics ? `Argomenti: ${exam.topics}` : '',
    exam.notes ? `Note: ${exam.notes}` : '',
    'Creato da NAVICELLA · R.O.U.T.E.',
  ].filter(Boolean);

  const reminders = {
    useDefault: false,
    overrides: [
      { method: 'popup' as const, minutes: 1440 },
      { method: 'popup' as const, minutes: 120 },
    ],
  };

  const base = {
    summary: `Esame · ${exam.subject}`,
    description: lines.join('\n'),
    reminders,
    extendedProperties: { private: { routeId: exam.id, routeKind: 'exam' } },
  };

  if (!exam.time) {
    // Evento "tutto il giorno": in Calendar la data di fine è esclusiva.
    return {
      ...base,
      start: { date: exam.date },
      end: { date: addDaysISO(exam.date, 1) },
    };
  }

  return {
    ...base,
    start: isoDateTime(exam.date, exam.time, timeZone),
    end: isoDateTime(exam.date, endTime(exam.time, EXAM_EVENT_MINUTES), timeZone),
  };
}

/* -------------------------------------------------------------------- API */

async function callApi(
  config: GoogleCalendarConfig,
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<any> {
  const token = await accessToken(config);
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const detail: any = await response.json().catch(() => ({}));
    throw new Error(
      `Google Calendar ${response.status}: ${detail?.error?.message || detail?.error || 'richiesta rifiutata'}`,
    );
  }

  return response.status === 204 ? null : response.json().catch(() => null);
}

function remember(action: string, error?: unknown) {
  if (error) {
    runtime.lastError = error instanceof Error ? error.message : String(error);
    console.error(`[R.O.U.T.E.→Calendar] ${action}: ${runtime.lastError}`);
    return;
  }
  runtime.lastError = null;
  runtime.lastSuccessAt = new Date().toISOString();
  runtime.lastAction = action;
}

/**
 * Crea o aggiorna l'evento di un impegno.
 * Restituisce l'id dell'evento Google (null se la sincronizzazione è spenta).
 */
export async function syncShiftEvent(shift: ShiftRecord): Promise<string | null> {
  const config = googleConfig();
  if (!config) return null;

  const body = buildShiftEvent(shift, config.timeZone);

  if (config.dryRun) {
    console.log('[R.O.U.T.E.→Calendar] DRY RUN shift', JSON.stringify(body));
    remember(`dry-run shift ${shift.id}`);
    return null;
  }

  try {
    const calendar = encodeURIComponent(config.calendarId);
    const event = shift.googleEventId
      ? await callApi(config, 'PATCH', `/calendars/${calendar}/events/${encodeURIComponent(shift.googleEventId)}`, body)
      : await callApi(config, 'POST', `/calendars/${calendar}/events`, body);

    remember(`${shift.googleEventId ? 'update' : 'create'} shift ${shift.id}`);
    return event?.id ? String(event.id) : null;
  } catch (error) {
    remember(`shift ${shift.id}`, error);
    return null;
  }
}

/** Crea o aggiorna l'evento di un esame. */
export async function syncExamEvent(exam: ExamRecord): Promise<string | null> {
  const config = googleConfig();
  if (!config) return null;

  const body = buildExamEvent(exam, config.timeZone);

  if (config.dryRun) {
    console.log('[R.O.U.T.E.→Calendar] DRY RUN exam', JSON.stringify(body));
    remember(`dry-run exam ${exam.id}`);
    return null;
  }

  try {
    const calendar = encodeURIComponent(config.calendarId);
    const event = exam.googleEventId
      ? await callApi(config, 'PATCH', `/calendars/${calendar}/events/${encodeURIComponent(exam.googleEventId)}`, body)
      : await callApi(config, 'POST', `/calendars/${calendar}/events`, body);

    remember(`${exam.googleEventId ? 'update' : 'create'} exam ${exam.id}`);
    return event?.id ? String(event.id) : null;
  } catch (error) {
    remember(`exam ${exam.id}`, error);
    return null;
  }
}

/** Elimina l'evento collegato (se presente). Un 404/410 non è un errore. */
export async function removeCalendarEvent(eventId: string | null | undefined): Promise<void> {
  const config = googleConfig();
  if (!config || !eventId) return;

  if (config.dryRun) {
    console.log('[R.O.U.T.E.→Calendar] DRY RUN delete', eventId);
    remember(`dry-run delete ${eventId}`);
    return;
  }

  try {
    const calendar = encodeURIComponent(config.calendarId);
    await callApi(config, 'DELETE', `/calendars/${calendar}/events/${encodeURIComponent(eventId)}`);
    remember(`delete ${eventId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('410') && !message.includes('404')) remember(`delete ${eventId}`, error);
  }
}

/** Verifica che le credenziali funzionino davvero (chiamata leggera). */
export async function pingCalendar(): Promise<{ ok: boolean; error?: string }> {
  const config = googleConfig();
  if (!config) return { ok: false, error: 'Google Calendar non configurato.' };
  if (config.dryRun) return { ok: true };

  try {
    await accessToken(config);
    remember('ping');
    return { ok: true };
  } catch (error) {
    remember('ping', error);
    return { ok: false, error: runtime.lastError || 'Errore sconosciuto' };
  }
}
