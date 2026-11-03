export type CompartmentId =
  | 'bridge'
  | 'nico-ermes'
  | 'dna'
  | 'lewis'
  | 'forge'
  | 'route'
  | 'faraday'
  | 'ledger'
  | 'architecture';

export interface SystemTelemetry {
  faradayBattery: number;
  faradayStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL_OVERRIDE';
  lastSentiment: string;
  runwayMonths: number;
  monthlyBudget: number;
  currentBalance: number;
  monthlySpend: number;
  activeShifts: ShiftItem[];
  examsCountdown: ExamItem[];
  gpuColabStatus: {
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    device: string;
    tunnel: string;
    vllmPort: number;
    activeModel: string;
    utilization: string;
    vramUsed: string;
  };
  hasApiKey: boolean;
  timestamp: string;
  routeStore?: RouteStoreMeta;
}

export type ShiftCategory = 'lavoro' | 'universita' | 'studio' | 'personale' | 'altro';

export type ShiftRecurrence = 'none' | 'weekly';

/* ------------------------------------------------------------------ Esami */

/** Stato di un esame nel piano di studi R.O.U.T.E. */
export type ExamStatus = 'da_fare' | 'prenotato' | 'superato' | 'ritirato';

/** Priorità di preparazione dichiarata. */
export type ExamPriority = 'alta' | 'media' | 'bassa';

/**
 * Esame persistito: entità autonoma rispetto agli impegni orari.
 * Non richiede una fascia oraria (l'appello può non essere ancora pubblicato).
 */
export interface ExamRecord {
  id: string;
  /** Materia / insegnamento */
  subject: string;
  /** Data dell'appello (YYYY-MM-DD) */
  date: string;
  /** Ora dell'appello (HH:MM), opzionale */
  time?: string | null;
  status: ExamStatus;
  priority: ExamPriority;
  /** CFU dell'insegnamento */
  cfu?: number | null;
  /** Voto conseguito (18–31, dove 31 = 30L) */
  grade?: number | null;
  /** Ore di studio che si vogliono dedicare alla preparazione */
  targetHours?: number | null;
  /** Argomenti da preparare */
  topics?: string;
  notes?: string;
  /** Id dell'evento su Google Calendar, se sincronizzato */
  googleEventId?: string | null;
  source: 'nl' | 'manual' | 'nico';
  createdAt: string;
  updatedAt: string;
}

/** Avanzamento della preparazione di un esame. */
export interface ExamStudyStats {
  examId: string;
  targetMinutes: number | null;
  plannedMinutes: number;
  remainingMinutes: number | null;
  progressPct: number | null;
  daysLeft: number;
  riskLevel: 'done' | 'ok' | 'attention' | 'critical';
}

export interface RouteWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  code: 'exam-imminent' | 'exam-no-plan' | 'exam-past' | 'week-overload';
  message: string;
  date?: string;
  examId?: string;
}

export interface OverviewDay {
  date: string;
  weekdayShort: string;
  shiftMinutes: number;
  studyMinutes: number;
  examCount: number;
  freeMinutes: number;
}

export interface RouteOverview {
  from: string;
  to: string;
  days: OverviewDay[];
  exams: (ExamRecord & { daysLeft: number; stats: ExamStudyStats })[];
  warnings: RouteWarning[];
  totals: {
    shiftMinutes: number;
    studyMinutes: number;
    examCount: number;
    freeMinutes: number;
  };
  generatedAt: string;
  meta: RouteStoreMeta;
}

export interface GoogleCalendarStatus {
  configured: boolean;
  dryRun: boolean;
  calendarId: string | null;
  timeZone: string;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastAction: string | null;
  pending: number;
}

/** Bozza di esame non ancora salvata (parser NL o form manuale). */
export interface ParsedExam {
  subject: string;
  date: string;
  time?: string | null;
  status: ExamStatus;
  priority: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
  topics?: string;
  notes?: string;
  warnings: string[];
}

export interface ExamPayload {
  subject?: string;
  date?: string;
  time?: string | null;
  status?: ExamStatus;
  priority?: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
  targetHours?: number | null;
  topics?: string;
  notes?: string;
}

export interface RouteExamsResponse {
  exams: ExamRecord[];
  meta: RouteStoreMeta;
  exam?: ExamRecord;
  created?: ExamRecord[];
  errors?: string[];
}

export interface ShiftItem {
  id: string;
  day: string;
  date: string;
  start: string;
  end: string;
  role: string;
  title?: string;
  category?: ShiftCategory;
  location?: string;
  recurrence?: ShiftRecurrence;
}

/** Impegno persistito da R.O.U.T.E. */
export interface ShiftRecord {
  id: string;
  title: string;
  category: ShiftCategory;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  start: string;
  /** HH:MM */
  end: string;
  location?: string;
  notes?: string;
  /** Esame collegato (studio mirato alla preparazione) */
  examId?: string | null;
  recurrence: ShiftRecurrence;
  recurrenceUntil?: string | null;
  /** Id dell'evento su Google Calendar, se sincronizzato */
  googleEventId?: string | null;
  source: 'nl' | 'manual' | 'nico';
  createdAt: string;
  updatedAt: string;
}

export interface ShiftOccurrence extends ShiftRecord {
  baseId: string;
  occurrenceId: string;
  isRecurring: boolean;
}

export interface ShiftConflict {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  category: ShiftCategory;
  /** Impegno o appello d'esame */
  kind?: 'shift' | 'exam';
}

export interface ParsedShift {
  title: string;
  category: ShiftCategory;
  date: string;
  start: string;
  end: string;
  location?: string;
  recurrence: ShiftRecurrence;
  warnings: string[];
  conflicts?: ShiftConflict[];
}

export interface RouteParseResult {
  shifts: ParsedShift[];
  preview: ParsedShift[];
  /** Esami riconosciuti nello stesso testo */
  exams?: ParsedExam[];
  examErrors?: string[];
  errors: string[];
  raw: string;
}

export interface FreeBlock {
  start: string;
  end: string;
  minutes: number;
}

export interface AgendaDay {
  date: string;
  weekday: string;
  weekdayShort: string;
  isToday: boolean;
  isPast: boolean;
  shifts: ShiftOccurrence[];
  /** Esami il cui appello cade in questa giornata */
  exams: ExamRecord[];
  freeBlocks: FreeBlock[];
  busyMinutes: number;
  freeMinutes: number;
}

export interface RouteStoreMeta {
  file: string;
  updatedAt: string;
  count: number;
  /** Numero di esami in archivio */
  examCount: number;
}

export interface RouteAgenda {
  from: string;
  to: string;
  days: AgendaDay[];
  dayWindow: { start: string; end: string };
  bufferMinutes: number;
  minBlockMinutes: number;
  /** Durata del blocco riservato in agenda a un appello con orario */
  examBlockMinutes: number;
  totals: {
    busyMinutes: number;
    freeMinutes: number;
    shiftCount: number;
    examCount: number;
    byCategory: Record<ShiftCategory, { minutes: number; count: number }>;
  };
  generatedAt: string;
  meta: RouteStoreMeta;
}

export interface RouteShiftsResponse {
  shifts: ShiftRecord[];
  /** Piano di studi aggiornato (restituito insieme agli impegni) */
  exams?: ExamRecord[];
  meta: RouteStoreMeta;
  shift?: ShiftRecord;
  created?: ShiftRecord[];
  conflicts?: ShiftConflict[];
  errors?: string[];
}

export interface ShiftPayload {
  title?: string;
  category?: ShiftCategory;
  date: string;
  start: string;
  end: string;
  location?: string;
  notes?: string;
  examId?: string | null;
  recurrence?: ShiftRecurrence;
  recurrenceUntil?: string | null;
}


export interface ShiftItem {
  id: string;
  day: string;
  date: string;
  start: string;
  end: string;
  role: string;
}

export interface ExamItem {
  id: string;
  subject: string;
  date: string;
  daysLeft: number;
  time?: string | null;
  status?: ExamStatus;
  priority?: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
}

export interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  item: string;
  method: string;
  status: 'APPENDED_SHEET' | 'PENDING' | 'RECONCILED';
  dnaStubCreated?: boolean;
}

export interface DnaNote {
  id: string;
  title: string;
  path: string;
  tags: string[];
  type: string;
  created: string;
  status: 'raw' | 'enzymatically-validated' | 'vectorized';
  content: string;
}

export interface RoutingLogItem {
  id: string;
  timestamp: string;
  source: 'TELEGRAM_TEXT' | 'TELEGRAM_VOICE' | 'TELEGRAM_IMAGE' | 'WEBHOOK_API';
  rawInput: string;
  intent: string;
  targetCompartment: string;
  functionName: string;
  parameters: Record<string, any>;
  subRoutines: { module: string; action: string; details: string }[];
  telegramResponse: string;
  latencyMs: number;
  status: 'SUCCESS' | 'REJECTED_WHITELIST' | 'GUARDRAIL_BLOCKED' | 'ERROR';
}

export interface FeynmanChallengeResponse {
  score: number;
  verdict: string;
  strengths: string[];
  logicalGaps: string[];
  ruthlessChallenge: string;
}
