/**
 * R.O.U.T.E. — Parser in linguaggio naturale per impegni (turni, lezioni, studio, vita).
 *
 * Funziona interamente in locale, senza chiamate esterne: il modulo Route resta
 * operativo anche quando GEMINI_API_KEY non è configurata.
 *
 * Esempi riconosciuti:
 *  - "Domani lavoro 14-18"
 *  - "Lunedì lezione di chimica organica dalle 9 alle 13 in aula B"
 *  - "Ogni martedì turno farmacia 15:00-19:30"
 *  - "12/11 esame CTF ore 9-12"
 *  - "Sabato palestra 10-12 e domenica studio 15-18"
 */

export type ShiftCategory = 'lavoro' | 'universita' | 'studio' | 'personale' | 'altro';
export type ShiftRecurrence = 'none' | 'weekly';

export interface ParsedShift {
  title: string;
  category: ShiftCategory;
  /** Data in formato ISO (YYYY-MM-DD) */
  date: string;
  /** Ora di inizio HH:MM */
  start: string;
  /** Ora di fine HH:MM */
  end: string;
  location?: string;
  recurrence: ShiftRecurrence;
  warnings: string[];
}

export interface ParseOutcome {
  shifts: ParsedShift[];
  errors: string[];
  raw: string;
}

/* -------------------------------------------------------------- Date utils */

export const WEEKDAY_NAMES = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
];

export const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const offset = (copy.getDay() + 6) % 7; // lunedì = 0
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/* ---------------------------------------------------------- Normalizzazione */

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/* --------------------------------------------------------------- Vocabolari */

const WEEKDAY_WORDS: Record<string, number> = {
  domenica: 0,
  lunedi: 1,
  martedi: 2,
  mercoledi: 3,
  giovedi: 4,
  venerdi: 5,
  sabato: 6,
  dom: 0,
  lun: 1,
  mar: 2,
  mer: 3,
  gio: 4,
  ven: 5,
  sab: 6,
};

const MONTH_WORDS: Record<string, number> = {
  gennaio: 1, gen: 1,
  febbraio: 2, feb: 2,
  marzo: 3, mar: 3,
  aprile: 4, apr: 4,
  maggio: 5, mag: 5,
  giugno: 6, giu: 6,
  luglio: 7, lug: 7,
  agosto: 8, ago: 8,
  settembre: 9, set: 9, sett: 9,
  ottobre: 10, ott: 10,
  novembre: 11, nov: 11,
  dicembre: 12, dic: 12,
};

const CATEGORY_KEYWORDS: { category: ShiftCategory; words: string[] }[] = [
  {
    category: 'lavoro',
    words: [
      'lavoro', 'turno', 'turni', 'farmacia', 'clinica', 'ufficio', 'negozio', 'bottega',
      'bar', 'ristorante', 'pizzeria', 'magazzino', 'cassa', 'consegna', 'consegne',
      'stage', 'tirocinio', 'reparto', 'azienda', 'stabilimento', 'cantiere', 'officina',
    ],
  },
  {
    category: 'universita',
    words: [
      'universita', 'uni', 'lezione', 'lezioni', 'esame', 'esami', 'corso', 'corsi',
      'seminario', 'aula', 'facolta', 'dipartimento', 'laboratorio', 'esercitazione',
      'ricevimento', 'appello', 'ctf', 'tirocinio didattico', 'tesi sperimentale',
    ],
  },
  {
    category: 'studio',
    words: [
      'studio', 'studiare', 'ripasso', 'ripetizione', 'tesi', 'preparazione',
      'biblioteca', 'esercizi', 'feynman', 'simulazione', 'approfondimento', 'appunti',
    ],
  },
  {
    category: 'personale',
    words: [
      'palestra', 'allenamento', 'corsa', 'nuoto', 'sport', 'medico', 'dentista',
      'dottore', 'spesa', 'famiglia', 'compleanno', 'cena', 'pranzo', 'aperitivo',
      'viaggio', 'treno', 'aereo', 'amici', 'fisioterapia', 'riposo', 'commissioni',
    ],
  },
];

const DEFAULT_TITLES: Record<ShiftCategory, string> = {
  lavoro: 'Turno di lavoro',
  universita: 'Lezione',
  studio: 'Sessione di studio',
  personale: 'Impegno personale',
  altro: 'Impegno',
};

/** Parole generiche rimosse dal titolo: non aggiungono informazione. */
const GENERIC_TITLE_WORDS = new Set([
  'turno', 'turni', 'impegno', 'impegni', 'appuntamento', 'lavoro', 'lavorativo',
  'lezione', 'lezioni', 'corso', 'corsi', 'esame', 'esami', 'studio', 'sessione',
  'blocco', 'universita', 'uni', 'orario', 'orari', 'di', 'del', 'dello', 'della',
  'dei', 'degli', 'delle', 'il', 'lo', 'la', 'i', 'gli', 'le', 'a', 'al', 'allo',
  'alla', 'ai', 'agli', 'alle', 'in', 'nel', 'nello', 'nella', 'nei', 'negli',
  'nelle', 'per', 'con', 'da', 'dal', 'dalla', 'su', 'e', 'ed', 'anche', 'poi',
  'circa', 'dalle', 'alle', 'ore', 'presso',
]);

const RECURRENCE_RE =
  /\b(ogni|tutti i|tutte le|settimanale|settimanali|ricorrente|si ripete|a settimana)\b/;

/* ------------------------------------------------------------ Estrazione ora */

interface TimeRange {
  start: string;
  end: string;
  raw: string;
}

const TIME_RANGE_PATTERNS: RegExp[] = [
  // "dalle 9 alle 13", "da 14:30 a 18:45", "dalle 9 fino alle 12"
  /(?:dalle?|da)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:alle?|a|fino\s*alle?|fino\s*a|-)\s*(\d{1,2})(?:[:.](\d{2}))?/,
  // "9:00-13:00", "9.00 alle 13.30"
  /(\d{1,2})[:.](\d{2})\s*(?:-|alle?|a)\s*(\d{1,2})(?:[:.](\d{2}))?/,
  // "14-18", "ore 9-13"
  /(?:ore\s*)?(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/,
];

function buildTime(hours: number, minutes?: string): string {
  return `${pad2(hours)}:${pad2(minutes ? Number(minutes) : 0)}`;
}

function extractTimeRange(text: string): TimeRange | null {
  for (const pattern of TIME_RANGE_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;

    const h1 = Number(match[1]);
    const h2 = Number(match[3]);
    if (!Number.isFinite(h1) || !Number.isFinite(h2)) continue;
    if (h1 > 23 || h2 > 23) continue;

    const startMinutes = h1 * 60 + (match[2] ? Number(match[2]) : 0);
    const endMinutes = h2 * 60 + (match[4] ? Number(match[4]) : 0);
    if (endMinutes <= startMinutes) continue;

    return { start: buildTime(h1, match[2]), end: buildTime(h2, match[4]), raw: match[0] };
  }
  return null;
}

/* ---------------------------------------------------------- Estrazione data */

interface DateMatch {
  date: string;
  raw: string;
}

function safeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = new Date(year, month - 1, day);
  if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
  return candidate;
}

function resolveYear(month: number, day: number, today: Date): number {
  const year = today.getFullYear();
  const candidate = safeDate(year, month, day);
  if (!candidate) return year;
  const limit = addDays(today, -1);
  limit.setHours(0, 0, 0, 0);
  return candidate < limit ? year + 1 : year;
}

function normalizeYear(raw?: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return raw.length === 2 ? 2000 + value : value;
}

function extractDate(text: string, today: Date): DateMatch | null {
  // 1) Relative
  const relative = /\b(dopodomani|domani|oggi)\b/.exec(text);
  if (relative) {
    const offset = relative[1] === 'oggi' ? 0 : relative[1] === 'domani' ? 1 : 2;
    return { date: toISODate(addDays(today, offset)), raw: relative[0] };
  }

  // 2) Weekday (eventualmente "lunedì prossimo")
  const weekday = /\b(domenica|lunedi|martedi|mercoledi|giovedi|venerdi|sabato|dom|lun|mar|mer|gio|ven|sab)\b/.exec(text);
  if (weekday) {
    const target = WEEKDAY_WORDS[weekday[1]];
    let delta = (target - today.getDay() + 7) % 7;
    const isNext = /\b(prossim[oa]|prossime|settimana prossima)\b/.test(text);
    if (delta === 0 && isNext) delta = 7;
    return { date: toISODate(addDays(today, delta)), raw: weekday[0] };
  }

  // 3) Giorno + mese testuale ("12 novembre", "3 nov 2027")
  const dayMonth = /\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)\b(?:\s+(\d{4}))?/.exec(text);
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = MONTH_WORDS[dayMonth[2]];
    const year = normalizeYear(dayMonth[3]) ?? resolveYear(month, day, today);
    const date = safeDate(year, month, day);
    if (date) return { date: toISODate(date), raw: dayMonth[0] };
  }

  // 4) Formato numerico dd/mm(/yyyy)
  const slash = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(text);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = normalizeYear(slash[3]) ?? resolveYear(month, day, today);
    const date = safeDate(year, month, day);
    if (date) return { date: toISODate(date), raw: slash[0] };
  }

  // 5) Formato numerico dd-mm(/yyyy) — solo se non interpretabile come orario
  const dash = /\b(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?\b/.exec(text);
  if (dash) {
    const first = Number(dash[1]);
    const second = Number(dash[2]);
    if (second <= 12) {
      const year = normalizeYear(dash[3]) ?? resolveYear(second, first, today);
      const date = safeDate(year, second, first);
      if (date) return { date: toISODate(date), raw: dash[0] };
    }
  }

  return null;
}

/* ------------------------------------------------------- Categoria e titolo */

function detectCategory(text: string): ShiftCategory {
  for (const group of CATEGORY_KEYWORDS) {
    for (const word of group.words) {
      const pattern = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`);
      if (pattern.test(text)) return group.category;
    }
  }
  return 'altro';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanTitle(text: string, category: ShiftCategory): string {
  const tokens = text
    .replace(/[^\p{L}\p{N}\s'&-]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token && !/^\d+$/.test(token) && !GENERIC_TITLE_WORDS.has(token));

  const title = tokens.join(' ').trim();
  if (title.length < 3) return DEFAULT_TITLES[category];
  return capitalize(title);
}

/* ------------------------------------------------------------- Parse singolo */

export function parseSegment(
  segment: string,
  today: Date = new Date(),
): { shift?: ParsedShift; error?: string } {
  const original = segment.trim();
  let working = normalizeText(original);
  if (!working) return {};

  const warnings: string[] = [];

  // 1) Data ISO esplicita (rimossa subito: eviterebbe falsi orari tipo "20-11")
  let date: string | null = null;
  const isoMatch = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(working);
  if (isoMatch) {
    const candidate = safeDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    if (candidate) {
      date = toISODate(candidate);
      working = working.replace(isoMatch[0], ' ');
    }
  }

  // 2) Fascia oraria (obbligatoria: senza orario non è un impegno collocabile)
  const time = extractTimeRange(working);
  if (!time) {
    return {
      error: `Orario non riconosciuto in «${original}». Indica una fascia, es. "14-18" oppure "dalle 9 alle 13".`,
    };
  }
  working = working.replace(time.raw, ' ');

  // 3) Data relativa / testuale / numerica
  if (!date) {
    const found = extractDate(working, today);
    if (found) {
      date = found.date;
      working = working.replace(found.raw, ' ');
    } else {
      date = toISODate(today);
      warnings.push('Data non specificata: assegnato oggi.');
    }
  }

  // 4) Ricorrenza settimanale
  let recurrence: ShiftRecurrence = 'none';
  if (RECURRENCE_RE.test(working)) {
    recurrence = 'weekly';
    working = working.replace(new RegExp(RECURRENCE_RE.source, 'g'), ' ');
  }

  // 5) Luogo esplicito ("presso ...")
  let location: string | undefined;
  const locationMatch = /\bpresso\s+([\p{L}\p{N}\s'&.-]{2,48})/u.exec(working);
  if (locationMatch) {
    location = capitalize(locationMatch[1].replace(/\s+/g, ' ').trim());
    working = working.replace(locationMatch[0], ' ');
  }

  // 5b) Aula / laboratorio / sede (es. "in aula B", "in lab 3")
  const roomMatch = /\b(?:in|a)\s+(aula|lab|laboratorio|sede|padiglione|reparto)\s+([\p{L}\p{N}]{1,8})\b/u.exec(working);
  if (!location && roomMatch) {
    const code = roomMatch[2];
    location = `${capitalize(roomMatch[1])} ${code.length === 1 ? code.toUpperCase() : capitalize(code)}`;
    working = working.replace(roomMatch[0], ' ');
  }

  // 6) Categoria + titolo
  const category = detectCategory(working);
  const title = cleanTitle(working, category);

  if (timeToMinutes(time.end) - timeToMinutes(time.start) > 16 * 60) {
    warnings.push('Durata superiore a 16 ore: verifica gli orari.');
  }

  return {
    shift: {
      title,
      category,
      date,
      start: time.start,
      end: time.end,
      location,
      recurrence,
      warnings,
    },
  };
}

/* ------------------------------------------------------- Parse multi-impegno */

export function splitSegments(text: string): string[] {
  const segments: string[] = [];
  const lines = text.split(/\r?\n|;/);

  for (const line of lines) {
    const parts = line.split(
      /\s+e\s+(?=(?:anche\s+)?(?:oggi|domani|dopodomani|il\s+\d|\d{1,2}\/\d|lunedi|lun\b|martedi|mar\b|mercoledi|mer\b|giovedi|gio\b|venerdi|ven\b|sabato|sab\b|domenica|dom\b|prossim[oa]))/i,
    );
    for (const part of parts) {
      const trimmed = part.trim().replace(/^[,.\-\s]+|[,.\-\s]+$/g, '');
      if (trimmed) segments.push(trimmed);
    }
  }

  return segments;
}

export function parseShifts(
  text: string,
  today: Date = new Date(),
  options: { skipExamSegments?: boolean } = {},
): ParseOutcome {
  const shifts: ParsedShift[] = [];
  const errors: string[] = [];

  if (!text || !text.trim()) {
    return { shifts, errors: ['Testo vuoto: descrivi il turno da inserire.'], raw: text || '' };
  }

  for (const segment of splitSegments(text)) {
    // Gli esami hanno un parser dedicato: qui vengono ignorati per non
    // generare un doppione "turno" accanto all'esame.
    if (options.skipExamSegments && isExamSegment(segment)) continue;

    const result = parseSegment(segment, today);
    if (result.shift) shifts.push(result.shift);
    if (result.error) errors.push(result.error);
  }

  if (shifts.length === 0 && errors.length === 0) {
    errors.push('Nessun impegno riconosciuto: aggiungi giorno e fascia oraria.');
  }

  return { shifts, errors, raw: text };
}

/* ============================================================================
   Esami — un esame non è un impegno: non ha una fascia oraria obbligatoria
   (spesso l'appello non è ancora pubblicato) e porta con sé stato, priorità,
   CFU e voto. Qui il riconoscimento locale, senza API key.
   ============================================================================ */

export type ExamStatus = 'da_fare' | 'prenotato' | 'superato' | 'ritirato';
export type ExamPriority = 'alta' | 'media' | 'bassa';

export interface ParsedExam {
  subject: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, opzionale */
  time?: string | null;
  status: ExamStatus;
  priority: ExamPriority;
  cfu?: number | null;
  grade?: number | null;
  topics?: string;
  notes?: string;
  warnings: string[];
}

export interface ExamParseOutcome {
  exams: ParsedExam[];
  errors: string[];
  raw: string;
}

const EXAM_SEGMENT_RE =
  /\b(esame|esami|appello|appelli|parziale|verbalizzante|prova scritta|prova orale|prova pratica)\b/;

/** Il segmento descrive un esame (e non un normale impegno orario)? */
export function isExamSegment(segment: string): boolean {
  return EXAM_SEGMENT_RE.test(normalizeText(segment));
}

const EXAM_STATUS_PATTERNS: { status: ExamStatus; re: RegExp }[] = [
  {
    status: 'prenotato',
    re: /\b(prenotato|prenotata|prenotazione fatta|iscritto|iscritta|iscrizione fatta)\b/,
  },
  {
    status: 'superato',
    re: /\b(superato|superata|passato|passata|gia dato|verbalizzato|verbalizzata)\b/,
  },
  {
    status: 'ritirato',
    re: /\b(ritirato|ritirata|rinunciato|rinunciato all'appello|annullato)\b/,
  },
];

const EXAM_PRIORITY_PATTERNS: { priority: ExamPriority; re: RegExp }[] = [
  {
    priority: 'alta',
    re: /\b(priorita alta|alta priorita|urgente|urgentissimo|importante|critico|da preparare subito)\b/,
  },
  {
    priority: 'bassa',
    re: /\b(priorita bassa|bassa priorita|rinviabile|secondario|non urgente)\b/,
  },
];

/** Parole che non fanno parte del nome dell'insegnamento. */
const EXAM_NOISE_WORDS = new Set([
  'esame', 'esami', 'appello', 'appelli', 'parziale', 'verbalizzante', 'prova', 'scritta',
  'orale', 'pratica', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'del',
  'dello', 'della', 'dei', 'degli', 'delle', 'd', 'a', 'al', 'allo', 'alla', 'ai', 'agli',
  'alle', 'in', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle', 'per', 'con', 'da', 'dal',
  'dalla', 'su', 'anche', 'poi', 'circa', 'presso', 'ore', 'dalle',
  'previsto', 'prevista', 'sessione', 'appello di', 'il giorno', 'giorno', 'data',
]);

/** Estrae un orario singolo ("ore 9", "alle 9:30", "9.30"). */
function extractSingleTime(text: string): { time: string; raw: string } | null {
  const patterns = [
    /(?:ore|alle|dalle|h)\s*(\d{1,2})(?:[:.](\d{2}))?\b/,
    /\b(\d{1,2})[:.](\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    if (!Number.isFinite(hours) || hours > 23 || minutes > 59) continue;
    return { time: `${pad2(hours)}:${pad2(minutes)}`, raw: match[0] };
  }

  return null;
}

function cleanSubject(text: string): string {
  const tokens = text
    .replace(/[^\p{L}\p{N}\s'&-]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token && !/^\d+$/.test(token) && !EXAM_NOISE_WORDS.has(token));

  const subject = tokens.join(' ').trim().replace(/\s+/g, ' ');
  if (subject.length < 2) return '';
  return capitalize(subject.slice(0, 90));
}

/** Estrae dal segmento un singolo esame (materia, data, stato, priorità…). */
export function parseExamSegment(
  segment: string,
  today: Date = new Date(),
): { exam?: ParsedExam; error?: string } {
  const original = segment.trim();
  let working = normalizeText(original);
  if (!working) return {};

  const warnings: string[] = [];
  let date: string | null = null;

  // 1) Data ISO esplicita — rimossa subito per non confondere gli orari
  const isoMatch = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(working);
  if (isoMatch) {
    const candidate = safeDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    if (candidate) {
      date = toISODate(candidate);
      working = working.replace(isoMatch[0], ' ');
    }
  }

  // 2) Ora singola dell'appello (opzionale, non una fascia)
  let time: string | null = null;
  const single = extractSingleTime(working);
  if (single) {
    time = single.time;
    working = working.replace(single.raw, ' ');
  }

  // 3) Data relativa / testuale / numerica
  if (!date) {
    const found = extractDate(working, today);
    if (found) {
      date = found.date;
      working = working.replace(found.raw, ' ');
    }
  }

  if (!date) {
    return {
      error: `Data non riconosciuta in «${original}». Indica il giorno dell'appello, es. "esame di Farmacologia il 5 dicembre".`,
    };
  }

  // 4) Stato
  let status: ExamStatus = 'da_fare';
  for (const entry of EXAM_STATUS_PATTERNS) {
    if (entry.re.test(working)) {
      status = entry.status;
      working = working.replace(new RegExp(entry.re.source, 'g'), ' ');
      break;
    }
  }

  // 5) Priorità
  let priority: ExamPriority = 'media';
  for (const entry of EXAM_PRIORITY_PATTERNS) {
    if (entry.re.test(working)) {
      priority = entry.priority;
      working = working.replace(new RegExp(entry.re.source, 'g'), ' ');
      break;
    }
  }

  // 6) CFU
  let cfu: number | null = null;
  const cfuMatch = /\b(?:(\d{1,2})\s*cfu|cfu\s*(\d{1,2}))\b/.exec(working);
  if (cfuMatch) {
    const value = Number(cfuMatch[1] ?? cfuMatch[2]);
    if (Number.isFinite(value) && value > 0 && value <= 60) cfu = value;
    working = working.replace(cfuMatch[0], ' ');
  }

  // 7) Voto
  let grade: number | null = null;
  const gradeMatch =
    /\b(?:voto|valutazione)\s*:?\s*(\d{1,2})\b/.exec(working) ?? /\b(\d{1,2})\s*\/\s*30\b/.exec(working);
  if (gradeMatch) {
    const value = Number(gradeMatch[1]);
    if (Number.isFinite(value) && value >= 18 && value <= 31) grade = value;
    working = working.replace(gradeMatch[0], ' ');
  }

  // 8) Luogo dell'appello → note (gli esami non hanno un campo location)
  let notes: string | undefined;
  const roomMatch =
    /\b(?:in|a|presso)\s+(aula|lab|laboratorio|sede|padiglione)\s+([\p{L}\p{N}]{1,8})\b/u.exec(working);
  if (roomMatch) {
    const code = roomMatch[2];
    notes = `${capitalize(roomMatch[1])} ${code.length === 1 ? code.toUpperCase() : capitalize(code)}`;
    working = working.replace(roomMatch[0], ' ');
  }

  // 9) Argomenti espliciti ("argomenti: ...", "su ...")
  let topics: string | undefined;
  const topicsMatch = /\b(?:argomenti|programma|da preparare)\s*:?\s*(.{3,160})$/u.exec(working);
  if (topicsMatch) {
    topics = capitalize(topicsMatch[1].replace(/\s+/g, ' ').trim());
    working = working.replace(topicsMatch[0], ' ');
  }

  // 10) Materia
  const subject = cleanSubject(working);
  if (!subject) {
    return {
      error: `Materia non riconosciuta in «${original}». Scrivi ad esempio "esame di Chimica Organica il 5 dicembre".`,
    };
  }

  if (grade !== null && status !== 'superato') {
    status = 'superato';
    warnings.push('Voto indicato: stato impostato a «superato».');
  }

  return {
    exam: {
      subject,
      date,
      time,
      status,
      priority,
      cfu,
      grade,
      topics,
      notes,
      warnings,
    },
  };
}

/** Riconosce tutti gli esami presenti in un testo libero (anche multi-riga). */
export function parseExams(text: string, today: Date = new Date()): ExamParseOutcome {
  const exams: ParsedExam[] = [];
  const errors: string[] = [];

  if (!text || !text.trim()) {
    return { exams, errors: ['Testo vuoto: descrivi l’esame da inserire.'], raw: text || '' };
  }

  for (const segment of splitSegments(text)) {
    if (!isExamSegment(segment)) continue;
    const result = parseExamSegment(segment, today);
    if (result.exam) exams.push(result.exam);
    if (result.error) errors.push(result.error);
  }

  if (exams.length === 0 && errors.length === 0) {
    errors.push('Nessun esame riconosciuto: scrivi ad esempio «esame di Farmacologia il 5 dicembre».');
  }

  return { exams, errors, raw: text };
}
