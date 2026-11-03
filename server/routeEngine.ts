/**
 * R.O.U.T.E. — Motore logistico della Navicella.
 *
 * Persistenza su file JSON (data/route.json), espansione delle ricorrenze
 * settimanali, rilevamento conflitti e calcolo dei blocchi liberi di studio.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  addDays,
  minutesToTime,
  parseISODate,
  timeToMinutes,
  toISODate,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  type ExamPriority,
  type ExamStatus,
  type ShiftCategory,
  type ShiftRecurrence,
} from './routeParser.ts';

export type { ExamPriority, ExamStatus, ShiftCategory, ShiftRecurrence };

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
  recurrence: ShiftRecurrence;
  /** Ultima data valida per la ricorrenza (opzionale) */
  recurrenceUntil?: string | null;
  source: 'nl' | 'manual' | 'nico';
  createdAt: string;
  updatedAt: string;
}

export interface ShiftOccurrence extends ShiftRecord {
  baseId: string;
  occurrenceId: string;
  isRecurring: boolean;
}

export interface ShiftInput {
  title?: string;
  category?: ShiftCategory;
  date?: string;
  start?: string;
  end?: string;
  location?: string;
  notes?: string;
  recurrence?: ShiftRecurrence;
  recurrenceUntil?: string | null;
}

export interface ShiftConflict {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  category: ShiftCategory;
}

/* ------------------------------------------------------------------- Esami */

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
  cfu?: number | null;
  /** Voto (18–31, dove 31 = 30L) */
  grade?: number | null;
  topics?: string;
  notes?: string;
  source: 'nl' | 'manual' | 'nico';
  createdAt: string;
  updatedAt: string;
}

export interface ExamInput {
  subject?: string;
  date?: string;
  time?: string | null;
  status?: ExamStatus;
  priority?: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
  topics?: string;
  notes?: string;
}

export interface ExamMutationResult {
  exam?: ExamRecord;
  exams: ExamRecord[];
  errors: string[];
}

/** Forma consumata dalla HUD (countdown nel Bridge/Header). */
export interface UpcomingExam {
  id: string;
  subject: string;
  date: string;
  daysLeft: number;
  time?: string | null;
  status: ExamStatus;
  priority: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
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

export interface Agenda {
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
}

const CATEGORIES: ShiftCategory[] = ['lavoro', 'universita', 'studio', 'personale', 'altro'];

const DEFAULT_TITLES: Record<ShiftCategory, string> = {
  lavoro: 'Turno di lavoro',
  universita: 'Lezione',
  studio: 'Sessione di studio',
  personale: 'Impegno personale',
  altro: 'Impegno',
};

/* ------------------------------------------------------------------- Store */

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'route.json');

interface StoreShape {
  version: number;
  updatedAt: string;
  shifts: ShiftRecord[];
  exams: ExamRecord[];
}

let store: StoreShape | null = null;

function emptyStore(): StoreShape {
  return { version: 2, updatedAt: new Date().toISOString(), shifts: [], exams: [] };
}

function sanitizeRecord(raw: any): ShiftRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const start = typeof raw.start === 'string' ? raw.start : '';
  const end = typeof raw.end === 'string' ? raw.end : '';
  const date = typeof raw.date === 'string' ? raw.date : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;

  const category: ShiftCategory = CATEGORIES.includes(raw.category) ? raw.category : 'altro';

  return {
    id: String(raw.id || createId()),
    title: String(raw.title || DEFAULT_TITLES[category]).slice(0, 120),
    category,
    date,
    start,
    end,
    location: raw.location ? String(raw.location).slice(0, 120) : undefined,
    notes: raw.notes ? String(raw.notes).slice(0, 600) : undefined,
    recurrence: raw.recurrence === 'weekly' ? 'weekly' : 'none',
    recurrenceUntil:
      typeof raw.recurrenceUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.recurrenceUntil)
        ? raw.recurrenceUntil
        : null,
    source: ['nl', 'manual', 'nico'].includes(raw.source) ? raw.source : 'manual',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

const STORE_VERSION = 2;

const EXAM_STATUSES: ExamStatus[] = ['da_fare', 'prenotato', 'superato', 'ritirato'];
const EXAM_PRIORITIES: ExamPriority[] = ['alta', 'media', 'bassa'];

/**
 * Esami che in precedenza erano hardcoded nella HUD (server.ts).
 * Vengono importati nello store alla prima migrazione.
 */
const LEGACY_SEED_EXAMS: ExamRecord[] = [
  {
    id: 'ex-1',
    subject: 'Chimica Tossicologica & Forense (CTF)',
    date: '2026-11-20',
    time: null,
    status: 'da_fare',
    priority: 'media',
    cfu: null,
    grade: null,
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ex-2',
    subject: 'Farmacologia Molecolare Applicata',
    date: '2026-12-05',
    time: null,
    status: 'da_fare',
    priority: 'media',
    cfu: null,
    grade: null,
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function sanitizeExamRecord(raw: any): ExamRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const subject = typeof raw.subject === 'string' ? raw.subject.trim().slice(0, 120) : '';
  const date = typeof raw.date === 'string' ? raw.date : '';
  if (!subject) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const time = typeof raw.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time) ? raw.time : null;
  const cfu = Number.isFinite(Number(raw.cfu)) && Number(raw.cfu) > 0 ? Math.min(60, Number(raw.cfu)) : null;
  const grade =
    Number.isFinite(Number(raw.grade)) && Number(raw.grade) >= 18 && Number(raw.grade) <= 31
      ? Number(raw.grade)
      : null;

  return {
    id: String(raw.id || createExamId()),
    subject,
    date,
    time,
    status: EXAM_STATUSES.includes(raw.status) ? raw.status : 'da_fare',
    priority: EXAM_PRIORITIES.includes(raw.priority) ? raw.priority : 'media',
    cfu,
    grade,
    topics: raw.topics ? String(raw.topics).slice(0, 600) : undefined,
    notes: raw.notes ? String(raw.notes).slice(0, 600) : undefined,
    source: ['nl', 'manual', 'nico'].includes(raw.source) ? raw.source : 'manual',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

function loadStore(): StoreShape {
  if (store) return store;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      const shifts = Array.isArray(parsed?.shifts)
        ? parsed.shifts.map(sanitizeRecord).filter((s: ShiftRecord | null): s is ShiftRecord => Boolean(s))
        : [];
      const exams = Array.isArray(parsed?.exams)
        ? parsed.exams.map(sanitizeExamRecord).filter((e: ExamRecord | null): e is ExamRecord => Boolean(e))
        : [];
      store = {
        version: STORE_VERSION,
        updatedAt: String(parsed?.updatedAt || new Date().toISOString()),
        shifts,
        exams,
      };

      // Migrazione: gli esami erano hardcoded nella HUD e non esistevano nello
      // store. Al primo avvio dopo l'aggiornamento li importiamo per non
      // perdere il piano di studi già visibile nel Bridge.
      if (!Array.isArray(parsed?.exams)) {
        store.exams = LEGACY_SEED_EXAMS.map((exam) => ({ ...exam }));
        store.version = STORE_VERSION;
        markUpdated();
      }
    } else {
      store = emptyStore();
      persist();
    }
  } catch (error) {
    console.error('[R.O.U.T.E.] Store illeggibile, avvio con archivio vuoto:', error);
    store = emptyStore();
  }

  return store;
}

function persist(): void {
  if (!store) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error('[R.O.U.T.E.] Impossibile scrivere lo store:', error);
  }
}

function markUpdated(): void {
  if (!store) return;
  store.updatedAt = new Date().toISOString();
  persist();
}

function createId(): string {
  return `sh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createExamId(): string {
  return `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Accetta anche id di occorrenza nel formato `base@YYYY-MM-DD`. */
export function baseIdOf(id: string): string {
  const [base] = String(id).split('@');
  return base;
}

/* ---------------------------------------------------------------- Validazione */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateShiftInput(input: ShiftInput): { errors: string[]; value?: ShiftInput } {
  const errors: string[] = [];

  const title = String(input.title || '').trim().slice(0, 120);
  const category: ShiftCategory = CATEGORIES.includes(input.category as ShiftCategory)
    ? (input.category as ShiftCategory)
    : 'altro';
  const date = String(input.date || '').trim();
  const start = String(input.start || '').trim();
  const end = String(input.end || '').trim();
  const recurrence: ShiftRecurrence = input.recurrence === 'weekly' ? 'weekly' : 'none';

  if (!DATE_RE.test(date)) errors.push('Data non valida: usa il formato YYYY-MM-DD.');
  if (!TIME_RE.test(start)) errors.push('Ora di inizio non valida: usa HH:MM.');
  if (!TIME_RE.test(end)) errors.push('Ora di fine non valida: usa HH:MM.');
  if (TIME_RE.test(start) && TIME_RE.test(end) && timeToMinutes(end) <= timeToMinutes(start)) {
    errors.push("L'ora di fine deve essere successiva all'inizio (turni notturni non supportati).");
  }

  let recurrenceUntil: string | null = null;
  if (input.recurrenceUntil) {
    const candidate = String(input.recurrenceUntil).trim();
    if (!DATE_RE.test(candidate)) {
      errors.push('Fine ricorrenza non valida: usa il formato YYYY-MM-DD.');
    } else if (candidate < date) {
      errors.push('La fine della ricorrenza precede la data di inizio.');
    } else {
      recurrenceUntil = candidate;
    }
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      title: title || DEFAULT_TITLES[category],
      category,
      date,
      start,
      end,
      location: input.location ? String(input.location).trim().slice(0, 120) : undefined,
      notes: input.notes ? String(input.notes).trim().slice(0, 600) : undefined,
      recurrence,
      recurrenceUntil,
    },
  };
}

/* ------------------------------------------------------------------ Lettura */

export function listShifts(): ShiftRecord[] {
  return [...loadStore().shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.start) - timeToMinutes(b.start),
  );
}

export function getShift(id: string): ShiftRecord | undefined {
  const base = baseIdOf(id);
  return loadStore().shifts.find((shift) => shift.id === base);
}

export function storeMeta(): { file: string; updatedAt: string; count: number; examCount: number } {
  const current = loadStore();
  return {
    file: path.relative(process.cwd(), STORE_FILE),
    updatedAt: current.updatedAt,
    count: current.shifts.length,
    examCount: current.exams.length,
  };
}

/* -------------------------------------------------------- Espansione agenda */

export function expandOccurrences(from: string, to: string, records?: ShiftRecord[]): ShiftOccurrence[] {
  const source = records ?? loadStore().shifts;
  const fromDate = parseISODate(from);
  const toDate = parseISODate(to);
  const out: ShiftOccurrence[] = [];

  for (const record of source) {
    if (record.recurrence !== 'weekly') {
      if (record.date >= from && record.date <= to) {
        out.push({ ...record, baseId: record.id, occurrenceId: record.id, isRecurring: false });
      }
      continue;
    }

    let cursor = parseISODate(record.date);
    if (cursor < fromDate) {
      const diffDays = Math.ceil((fromDate.getTime() - cursor.getTime()) / 86_400_000);
      cursor = addDays(cursor, Math.ceil(diffDays / 7) * 7);
    }

    const until = record.recurrenceUntil ? parseISODate(record.recurrenceUntil) : null;
    let guard = 0;
    while (cursor <= toDate && (!until || cursor <= until) && guard < 520) {
      const date = toISODate(cursor);
      out.push({ ...record, date, baseId: record.id, occurrenceId: `${record.id}@${date}`, isRecurring: true });
      cursor = addDays(cursor, 7);
      guard += 1;
    }
  }

  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.start) - timeToMinutes(b.start),
  );
}

/* ------------------------------------------------------- Conflitti e blocchi */

export function findConflicts(
  candidate: { date: string; start: string; end: string; recurrence: ShiftRecurrence; recurrenceUntil?: string | null },
  ignoreBaseId?: string,
): ShiftConflict[] {
  const dates = new Set<string>([candidate.date]);
  if (candidate.recurrence === 'weekly') {
    for (let week = 1; week <= 7; week += 1) {
      dates.add(toISODate(addDays(parseISODate(candidate.date), week * 7)));
    }
  }

  const sortedDates = [...dates].sort();
  const others = loadStore().shifts.filter((shift) => shift.id !== ignoreBaseId);
  const occurrences = expandOccurrences(sortedDates[0], sortedDates[sortedDates.length - 1], others);

  const startMin = timeToMinutes(candidate.start);
  const endMin = timeToMinutes(candidate.end);

  const conflicts = occurrences.filter(
    (occurrence) =>
      dates.has(occurrence.date) &&
      timeToMinutes(occurrence.start) < endMin &&
      startMin < timeToMinutes(occurrence.end),
  );

  const seen = new Set<string>();
  return conflicts
    .filter((occurrence) => {
      const key = `${occurrence.baseId}@${occurrence.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((occurrence) => ({
      id: occurrence.occurrenceId,
      title: occurrence.title,
      date: occurrence.date,
      start: occurrence.start,
      end: occurrence.end,
      category: occurrence.category,
    }));
}

function mergeIntervals(intervals: { start: number; end: number }[]): { start: number; end: number }[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];

  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

export function computeFreeBlocks(
  busy: { start: string; end: string }[],
  dayStart = '08:00',
  dayEnd = '23:00',
  bufferMinutes = 30,
  minBlockMinutes = 30,
): FreeBlock[] {
  const windowStart = timeToMinutes(dayStart);
  const windowEnd = timeToMinutes(dayEnd);

  const intervals = mergeIntervals(
    busy.map((slot) => ({
      start: Math.max(windowStart, timeToMinutes(slot.start) - bufferMinutes),
      end: Math.min(windowEnd, timeToMinutes(slot.end) + bufferMinutes),
    })),
  );

  const blocks: FreeBlock[] = [];
  let cursor = windowStart;

  for (const interval of intervals) {
    if (interval.start - cursor >= minBlockMinutes) {
      blocks.push({
        start: minutesToTime(cursor),
        end: minutesToTime(interval.start),
        minutes: interval.start - cursor,
      });
    }
    cursor = Math.max(cursor, interval.end);
  }

  if (windowEnd - cursor >= minBlockMinutes) {
    blocks.push({ start: minutesToTime(cursor), end: minutesToTime(windowEnd), minutes: windowEnd - cursor });
  }

  return blocks;
}

/* -------------------------------------------------------------------- Agenda */

export function buildAgenda(
  from: string,
  to: string,
  options: {
    bufferMinutes?: number;
    dayStart?: string;
    dayEnd?: string;
    minBlockMinutes?: number;
    examBlockMinutes?: number;
  } = {},
): Agenda {
  const bufferMinutes = Number.isFinite(options.bufferMinutes) ? Math.max(0, Number(options.bufferMinutes)) : 30;
  const dayStart = options.dayStart || '08:00';
  const dayEnd = options.dayEnd || '23:00';
  const minBlockMinutes = options.minBlockMinutes ?? 30;
  const examBlockMinutes = Number.isFinite(options.examBlockMinutes)
    ? Math.max(30, Number(options.examBlockMinutes))
    : 120;

  const today = toISODate(new Date());
  const occurrences = expandOccurrences(from, to);
  const rangeExams = examsInRange(from, to);

  const byCategory = CATEGORIES.reduce(
    (acc, category) => ({ ...acc, [category]: { minutes: 0, count: 0 } }),
    {} as Record<ShiftCategory, { minutes: number; count: number }>,
  );

  const days: AgendaDay[] = [];
  let cursor = parseISODate(from);
  const end = parseISODate(to);
  let guard = 0;

  while (toISODate(cursor) <= to && cursor <= end && guard < 400) {
    const date = toISODate(cursor);
    const dayShifts = occurrences.filter((occurrence) => occurrence.date === date);
    const dayExams = rangeExams.filter((exam) => exam.date === date);

    // Un appello con orario occupa la giornata: riserva un blocco dedicato
    // (default 2h) così il timeboxing non propone di studiare durante l'esame.
    const examSlots = dayExams
      .filter((exam) => Boolean(exam.time))
      .map((exam) => ({
        start: exam.time as string,
        end: minutesToTime(Math.min(23 * 60 + 59, timeToMinutes(exam.time as string) + examBlockMinutes)),
      }));

    const busy = [
      ...dayShifts.map((shift) => ({ start: shift.start, end: shift.end })),
      ...examSlots,
    ];
    const freeBlocks = computeFreeBlocks(busy, dayStart, dayEnd, bufferMinutes, minBlockMinutes);

    const busyMinutes = busy.reduce(
      (total, slot) => total + Math.max(0, timeToMinutes(slot.end) - timeToMinutes(slot.start)),
      0,
    );

    for (const shift of dayShifts) {
      const minutes = Math.max(0, timeToMinutes(shift.end) - timeToMinutes(shift.start));
      byCategory[shift.category].minutes += minutes;
      byCategory[shift.category].count += 1;
    }

    days.push({
      date,
      weekday: WEEKDAY_NAMES[cursor.getDay()],
      weekdayShort: WEEKDAY_SHORT[cursor.getDay()],
      isToday: date === today,
      isPast: date < today,
      shifts: dayShifts,
      exams: dayExams,
      freeBlocks,
      busyMinutes,
      freeMinutes: freeBlocks.reduce((total, block) => total + block.minutes, 0),
    });

    cursor = addDays(cursor, 1);
    guard += 1;
  }

  const busyTotal = days.reduce((total, day) => total + day.busyMinutes, 0);
  const freeTotal = days.reduce((total, day) => total + day.freeMinutes, 0);

  return {
    from,
    to,
    days,
    dayWindow: { start: dayStart, end: dayEnd },
    bufferMinutes,
    minBlockMinutes,
    examBlockMinutes,
    totals: {
      busyMinutes: busyTotal,
      freeMinutes: freeTotal,
      shiftCount: days.reduce((total, day) => total + day.shifts.length, 0),
      examCount: days.reduce((total, day) => total + day.exams.length, 0),
      byCategory,
    },
    generatedAt: new Date().toISOString(),
  };
}

/* --------------------------------------------------------------------- CRUD */

export interface MutationResult {
  shift?: ShiftRecord;
  shifts: ShiftRecord[];
  conflicts: ShiftConflict[];
  errors: string[];
}

export function createShift(input: ShiftInput, source: ShiftRecord['source'] = 'manual'): MutationResult {
  const validation = validateShiftInput(input);
  if (!validation.value) {
    return { shifts: listShifts(), conflicts: [], errors: validation.errors };
  }

  const value = validation.value;
  const conflicts = findConflicts({
    date: value.date!,
    start: value.start!,
    end: value.end!,
    recurrence: value.recurrence as ShiftRecurrence,
    recurrenceUntil: value.recurrenceUntil,
  });

  const now = new Date().toISOString();
  const record: ShiftRecord = {
    id: createId(),
    title: value.title || DEFAULT_TITLES[value.category as ShiftCategory],
    category: value.category as ShiftCategory,
    date: value.date!,
    start: value.start!,
    end: value.end!,
    location: value.location,
    notes: value.notes,
    recurrence: (value.recurrence as ShiftRecurrence) || 'none',
    recurrenceUntil: value.recurrenceUntil ?? null,
    source,
    createdAt: now,
    updatedAt: now,
  };

  loadStore().shifts.push(record);
  markUpdated();

  return { shift: record, shifts: listShifts(), conflicts, errors: [] };
}

export function updateShift(id: string, patch: ShiftInput): MutationResult {
  const base = baseIdOf(id);
  const current = loadStore().shifts.find((shift) => shift.id === base);
  if (!current) {
    return { shifts: listShifts(), conflicts: [], errors: ['Impegno non trovato.'] };
  }

  const merged: ShiftInput = {
    title: patch.title ?? current.title,
    category: patch.category ?? current.category,
    date: patch.date ?? current.date,
    start: patch.start ?? current.start,
    end: patch.end ?? current.end,
    location: patch.location ?? current.location,
    notes: patch.notes ?? current.notes,
    recurrence: patch.recurrence ?? current.recurrence,
    recurrenceUntil: patch.recurrenceUntil ?? current.recurrenceUntil ?? null,
  };

  const validation = validateShiftInput(merged);
  if (!validation.value) {
    return { shifts: listShifts(), conflicts: [], errors: validation.errors };
  }

  const value = validation.value;
  const conflicts = findConflicts(
    {
      date: value.date!,
      start: value.start!,
      end: value.end!,
      recurrence: value.recurrence as ShiftRecurrence,
      recurrenceUntil: value.recurrenceUntil,
    },
    base,
  );

  Object.assign(current, {
    title: value.title,
    category: value.category,
    date: value.date,
    start: value.start,
    end: value.end,
    location: value.location,
    notes: value.notes,
    recurrence: value.recurrence,
    recurrenceUntil: value.recurrenceUntil ?? null,
    updatedAt: new Date().toISOString(),
  });

  markUpdated();

  return { shift: current, shifts: listShifts(), conflicts, errors: [] };
}

export function deleteShift(id: string): MutationResult {
  const base = baseIdOf(id);
  const before = loadStore().shifts.length;
  loadStore().shifts = loadStore().shifts.filter((shift) => shift.id !== base);
  const removed = loadStore().shifts.length < before;

  if (removed) markUpdated();

  return {
    shifts: listShifts(),
    conflicts: [],
    errors: removed ? [] : ['Impegno non trovato.'],
  };
}

/* ------------------------------------------------------------ Esami: CRUD */

export function validateExamInput(input: ExamInput): { errors: string[]; value?: ExamInput } {
  const errors: string[] = [];

  const subject = String(input.subject || '').trim().slice(0, 120);
  const date = String(input.date || '').trim();
  const timeRaw = input.time === null || input.time === undefined ? '' : String(input.time).trim();

  if (subject.length < 2) errors.push('Materia dell’esame mancante (minimo 2 caratteri).');
  if (!DATE_RE.test(date)) errors.push('Data appello non valida: usa il formato YYYY-MM-DD.');

  let time: string | null = null;
  if (timeRaw) {
    if (!TIME_RE.test(timeRaw)) errors.push('Ora appello non valida: usa il formato HH:MM.');
    else time = timeRaw;
  }

  const status: ExamStatus = EXAM_STATUSES.includes(input.status as ExamStatus)
    ? (input.status as ExamStatus)
    : 'da_fare';
  const priority: ExamPriority = EXAM_PRIORITIES.includes(input.priority as ExamPriority)
    ? (input.priority as ExamPriority)
    : 'media';

  let cfu: number | null = null;
  if (input.cfu !== undefined && input.cfu !== null && String(input.cfu).trim() !== '') {
    const numeric = Number(input.cfu);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 60) {
      errors.push('CFU non validi: inserisci un numero tra 1 e 60.');
    } else {
      cfu = numeric;
    }
  }

  let grade: number | null = null;
  if (input.grade !== undefined && input.grade !== null && String(input.grade).trim() !== '') {
    const numeric = Number(input.grade);
    if (!Number.isFinite(numeric) || numeric < 18 || numeric > 31) {
      errors.push('Voto non valido: usa un numero tra 18 e 30 (31 = 30L).');
    } else {
      grade = numeric;
    }
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      subject,
      date,
      time,
      status: grade !== null && status === 'da_fare' ? 'superato' : status,
      priority,
      cfu,
      grade,
      topics: input.topics ? String(input.topics).trim().slice(0, 600) : undefined,
      notes: input.notes ? String(input.notes).trim().slice(0, 600) : undefined,
    },
  };
}

function compareExams(a: ExamRecord, b: ExamRecord): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const timeA = a.time ? timeToMinutes(a.time) : -1;
  const timeB = b.time ? timeToMinutes(b.time) : -1;
  if (timeA !== timeB) return timeA - timeB;
  return a.subject.localeCompare(b.subject);
}

export function listExams(): ExamRecord[] {
  return [...loadStore().exams].sort(compareExams);
}

export function getExam(id: string): ExamRecord | undefined {
  return loadStore().exams.find((exam) => exam.id === id);
}

/** Esami con appello nell'intervallo richiesto (estremi inclusi). */
export function examsInRange(from: string, to: string): ExamRecord[] {
  return listExams().filter((exam) => exam.date >= from && exam.date <= to);
}

export function createExam(input: ExamInput, source: ExamRecord['source'] = 'manual'): ExamMutationResult {
  const validation = validateExamInput(input);
  if (!validation.value) return { exams: listExams(), errors: validation.errors };

  const value = validation.value;
  const now = new Date().toISOString();
  const record: ExamRecord = {
    id: createExamId(),
    subject: value.subject!,
    date: value.date!,
    time: value.time ?? null,
    status: (value.status as ExamStatus) ?? 'da_fare',
    priority: (value.priority as ExamPriority) ?? 'media',
    cfu: value.cfu ?? null,
    grade: value.grade ?? null,
    topics: value.topics,
    notes: value.notes,
    source,
    createdAt: now,
    updatedAt: now,
  };

  loadStore().exams.push(record);
  markUpdated();

  return { exam: record, exams: listExams(), errors: [] };
}

export function updateExam(id: string, patch: ExamInput): ExamMutationResult {
  const current = loadStore().exams.find((exam) => exam.id === id);
  if (!current) return { exams: listExams(), errors: ['Esame non trovato.'] };

  const validation = validateExamInput({
    subject: patch.subject ?? current.subject,
    date: patch.date ?? current.date,
    time: patch.time === undefined ? current.time : patch.time,
    status: patch.status ?? current.status,
    priority: patch.priority ?? current.priority,
    cfu: patch.cfu === undefined ? current.cfu : patch.cfu,
    grade: patch.grade === undefined ? current.grade : patch.grade,
    topics: patch.topics ?? current.topics,
    notes: patch.notes ?? current.notes,
  });

  if (!validation.value) return { exams: listExams(), errors: validation.errors };

  const value = validation.value;
  Object.assign(current, {
    subject: value.subject,
    date: value.date,
    time: value.time ?? null,
    status: value.status,
    priority: value.priority,
    cfu: value.cfu ?? null,
    grade: value.grade ?? null,
    topics: value.topics,
    notes: value.notes,
    updatedAt: new Date().toISOString(),
  });

  markUpdated();
  return { exam: current, exams: listExams(), errors: [] };
}

export function deleteExam(id: string): ExamMutationResult {
  const before = loadStore().exams.length;
  loadStore().exams = loadStore().exams.filter((exam) => exam.id !== id);
  const removed = loadStore().exams.length < before;
  if (removed) markUpdated();
  return { exams: listExams(), errors: removed ? [] : ['Esame non trovato.'] };
}

/** Esami ancora da dare (da fare o prenotati), dal più vicino nel tempo. */
export function listUpcomingExams(limit = 6): UpcomingExam[] {
  const today = toISODate(new Date());
  const todayMs = parseISODate(today).getTime();

  return listExams()
    .filter((exam) => (exam.status === 'da_fare' || exam.status === 'prenotato') && exam.date >= today)
    .slice(0, limit)
    .map((exam) => ({
      id: exam.id,
      subject: exam.subject,
      date: exam.date,
      daysLeft: Math.max(0, Math.round((parseISODate(exam.date).getTime() - todayMs) / 86_400_000)),
      time: exam.time ?? null,
      status: exam.status,
      priority: exam.priority,
      cfu: exam.cfu ?? null,
      grade: exam.grade ?? null,
    }));
}

/* ------------------------------------------------- Compatibilità con la HUD */

export interface LegacyShift {
  id: string;
  day: string;
  date: string;
  start: string;
  end: string;
  role: string;
  title: string;
  category: ShiftCategory;
  location?: string;
  recurrence: ShiftRecurrence;
}

/** Proiezione degli impegni da oggi in avanti nel formato storico della Navicella. */
export function listUpcomingLegacy(limit = 12): LegacyShift[] {
  const today = toISODate(new Date());
  const horizon = toISODate(addDays(new Date(), 60));
  return expandOccurrences(today, horizon)
    .slice(0, limit)
    .map((occurrence) => ({
      id: occurrence.occurrenceId,
      day: WEEKDAY_NAMES[parseISODate(occurrence.date).getDay()],
      date: occurrence.date,
      start: occurrence.start,
      end: occurrence.end,
      role: occurrence.title,
      title: occurrence.title,
      category: occurrence.category,
      location: occurrence.location,
      recurrence: occurrence.recurrence,
    }));
}
