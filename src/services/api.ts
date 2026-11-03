import {
  ExamPayload,
  GoogleCalendarStatus,
  ParsedExam,
  RouteAgenda,
  RouteExamsResponse,
  RouteOverview,
  RouteParseResult,
  RouteShiftsResponse,
  RoutingLogItem,
  FeynmanChallengeResponse,
  ShiftPayload,
  SystemTelemetry,
} from '../types/navicella';

async function readJson(res: Response, fallback: string): Promise<any> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data?.errors) ? data.errors.join(' ') : data?.error;
    throw new Error(detail || fallback);
  }
  return data;
}

export async function fetchSystemState(): Promise<SystemTelemetry> {
  const res = await fetch('/api/system/state');
  if (!res.ok) throw new Error('Impossibile recuperare lo stato del sistema');
  return res.json();
}

export async function sendNicoMessage(message: string, contextHistory: any[] = []): Promise<{
  success: boolean;
  rawUserMessage: string;
  intentClassification: string;
  functionCalls: any[];
  executionLogs: any[];
  subRoutines: any[];
  telegramReply: string;
  systemState: SystemTelemetry;
}> {
  const res = await fetch('/api/nico/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, contextHistory }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Errore di routing N.I.C.O.');
  }
  return res.json();
}

export async function sendErmesWebhook(payload: any): Promise<any> {
  const res = await fetch('/api/ermes/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<{ text: string; source: string }> {
  const res = await fetch('/api/ermes/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });
  if (!res.ok) throw new Error('Errore trascrizione audio');
  return res.json();
}

export async function analyzeVision(imageBase64: string, mode: 'general' | 'molecule' = 'general'): Promise<{ analysis: string; source: string }> {
  const res = await fetch('/api/ermes/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mode }),
  });
  if (!res.ok) throw new Error('Errore analisi immagine');
  return res.json();
}

export async function runEnzymaticFilter(rawNote: string): Promise<{ typedMarkdown: string; status: string }> {
  const res = await fetch('/api/dna/enzymatic-filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNote }),
  });
  if (!res.ok) throw new Error('Errore filtro enzimatico');
  return res.json();
}

export async function runFeynmanChallenge(topic: string, explanation: string, rigorLevel: string = 'Severo'): Promise<FeynmanChallengeResponse> {
  const res = await fetch('/api/lewis/feynman', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, explanation, rigorLevel }),
  });
  if (!res.ok) throw new Error('Errore valutazione Feynman');
  return res.json();
}

export async function submitFaradayCheckin(answers: { sleepHours: number; mentalFatigue: number; stressScore: number }): Promise<any> {
  const res = await fetch('/api/faraday/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Errore check-in F.A.R.A.D.A.Y.');
  return res.json();
}

export async function fetchWhitelist(): Promise<any> {
  const res = await fetch('/api/security/whitelist');
  return res.json();
}

export async function updateWhitelist(data: { allowedChatIds?: string[]; allowedUserIds?: string[]; authEnabled?: boolean }): Promise<any> {
  const res = await fetch('/api/security/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// C-05: R.O.U.T.E. — turni, agenda e timeboxing
// ---------------------------------------------------------------------------

export async function fetchRouteShifts(): Promise<RouteShiftsResponse> {
  const res = await fetch('/api/route/shifts');
  return readJson(res, 'Impossibile leggere gli impegni di R.O.U.T.E.');
}

export async function fetchRouteAgenda(
  from: string,
  to: string,
  options: { buffer?: number; dayStart?: string; dayEnd?: string } = {}
): Promise<RouteAgenda> {
  const params = new URLSearchParams({ from, to });
  if (options.buffer !== undefined) params.set('buffer', String(options.buffer));
  if (options.dayStart) params.set('dayStart', options.dayStart);
  if (options.dayEnd) params.set('dayEnd', options.dayEnd);

  const res = await fetch(`/api/route/agenda?${params.toString()}`);
  return readJson(res, "Impossibile calcolare l'agenda di R.O.U.T.E.");
}

export async function parseShiftText(text: string): Promise<RouteParseResult> {
  const res = await fetch('/api/route/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return readJson(res, 'Parsing del turno non riuscito.');
}

export async function createRouteShift(payload: ShiftPayload): Promise<RouteShiftsResponse> {
  const res = await fetch('/api/route/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson(res, "Impossibile registrare l'impegno.");
}

export async function updateRouteShift(id: string, payload: Partial<ShiftPayload>): Promise<RouteShiftsResponse> {
  const res = await fetch(`/api/route/shifts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson(res, "Impossibile modificare l'impegno.");
}

export async function deleteRouteShift(id: string): Promise<RouteShiftsResponse> {
  const res = await fetch(`/api/route/shifts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return readJson(res, "Impossibile eliminare l'impegno.");
}

export async function ingestShiftText(text: string): Promise<RouteShiftsResponse> {
  const res = await fetch('/api/route/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return readJson(res, 'Ingestione del turno non riuscita.');
}

// ---------------------------------------------------------------------------
// C-05b: R.O.U.T.E. — piano di studi (esami)
// ---------------------------------------------------------------------------

export async function fetchRouteExams(): Promise<RouteExamsResponse> {
  const res = await fetch('/api/route/exams');
  return readJson(res, 'Impossibile leggere il piano di studi.');
}

export async function createRouteExam(payload: ExamPayload): Promise<RouteExamsResponse> {
  const res = await fetch('/api/route/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson(res, "Impossibile registrare l'esame.");
}

export async function updateRouteExam(
  id: string,
  payload: Partial<ExamPayload>,
): Promise<RouteExamsResponse> {
  const res = await fetch(`/api/route/exams/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson(res, "Impossibile modificare l'esame.");
}

export async function deleteRouteExam(id: string): Promise<RouteExamsResponse> {
  const res = await fetch(`/api/route/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return readJson(res, "Impossibile eliminare l'esame.");
}

export async function parseExamText(
  text: string,
): Promise<{ exams: ParsedExam[]; errors: string[]; raw: string }> {
  const res = await fetch('/api/route/exams/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return readJson(res, "Parsing dell'esame non riuscito.");
}

// ---------------------------------------------------------------------------
// C-05c: R.O.U.T.E. — orizzonte, segnalazioni e Google Calendar
// ---------------------------------------------------------------------------

export async function fetchRouteOverview(days = 60): Promise<RouteOverview> {
  const res = await fetch(`/api/route/overview?days=${encodeURIComponent(days)}`);
  return readJson(res, 'Impossibile calcolare la vista dei prossimi giorni.');
}

export async function fetchGoogleStatus(): Promise<GoogleCalendarStatus> {
  const res = await fetch('/api/google/status');
  return readJson(res, 'Stato Google Calendar non disponibile.');
}

export async function syncGoogleCalendar(): Promise<
  GoogleCalendarStatus & { shiftSynced?: number; examSynced?: number }
> {
  const res = await fetch('/api/google/sync', { method: 'POST' });
  return readJson(res, 'Sincronizzazione con Google Calendar non riuscita.');
}
