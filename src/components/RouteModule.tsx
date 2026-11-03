import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  PenLine,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  AgendaDay,
  ExamPayload,
  ExamPriority,
  ExamRecord,
  ExamStatus,
  ParsedShift,
  RouteAgenda,
  RouteStoreMeta,
  ShiftCategory,
  ShiftOccurrence,
  ShiftPayload,
  ShiftRecurrence,
} from '../types/navicella';
import {
  createRouteExam,
  createRouteShift,
  deleteRouteExam,
  deleteRouteShift,
  fetchRouteAgenda,
  fetchRouteExams,
  parseShiftText,
  updateRouteExam,
  updateRouteShift,
} from '../services/api';
import {
  EmptyState,
  PageHeader,
  PageShell,
  Panel,
  PanelHeader,
  Progress,
  StatusDot,
  inputClass,
} from './ui/Page';

/* ============================================================================
   C-05 · R.O.U.T.E. — Turni, lezioni e timeboxing
   Ingestion in linguaggio naturale (con anteprima modificabile), inserimento
   manuale, agenda settimanale persistente, blocchi liberi calcolati dal server.
   ============================================================================ */

interface RouteModuleProps {
  /** Notifica al resto della Navicella che l'agenda è cambiata */
  onChanged?: () => void;
}

/* ------------------------------------------------------------------ Helpers */

const pad2 = (value: number): string => String(value).padStart(2, '0');

const toISODateLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const todayISO = (): string => toISODateLocal(new Date());

const addDaysISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODateLocal(date);
};

const startOfWeekISO = (iso: string = todayISO()): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toISODateLocal(date);
};

const minutesOf = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${pad2(rest)}m`;
};

const formatDateLong = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const formatDateShort = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/* -------------------------------------------------------------- Vocabolario */

const CATEGORY_META: Record<
  ShiftCategory,
  { label: string; dot: string; text: string; border: string; bg: string; bar: string }
> = {
  lavoro: {
    label: 'Lavoro',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    border: 'border-emerald-400/25',
    bg: 'bg-emerald-400/10',
    bar: 'bg-emerald-400',
  },
  universita: {
    label: 'Università',
    dot: 'bg-accent',
    text: 'text-accent-soft',
    border: 'border-accent/30',
    bg: 'bg-accent/10',
    bar: 'bg-accent',
  },
  studio: {
    label: 'Studio',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    border: 'border-sky-400/25',
    bg: 'bg-sky-400/10',
    bar: 'bg-sky-400',
  },
  personale: {
    label: 'Personale',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    border: 'border-amber-400/25',
    bg: 'bg-amber-400/10',
    bar: 'bg-amber-400',
  },
  altro: {
    label: 'Altro',
    dot: 'bg-white/40',
    text: 'text-ink-soft',
    border: 'border-hairline',
    bg: 'bg-white/[0.04]',
    bar: 'bg-white/30',
  },
};

const CATEGORY_ORDER: ShiftCategory[] = ['lavoro', 'universita', 'studio', 'personale', 'altro'];

const EXAMPLES = [
  'Domani turno farmacia 14-18',
  'Lunedì lezione di chimica organica 9-13',
  'Ogni martedì laboratorio 9-13',
  'Esame di Farmacologia il 5 dicembre 9 cfu priorità alta',
  'Sabato palestra 10-12',
];

interface EditableShift {
  title: string;
  category: ShiftCategory;
  date: string;
  start: string;
  end: string;
  location?: string;
  recurrence: ShiftRecurrence;
}

interface DraftShift extends ParsedShift {
  key: string;
}

/* ------------------------------------------------------------------ Esami */

const EXAM_STATUS_ORDER: ExamStatus[] = ['da_fare', 'prenotato', 'superato', 'ritirato'];
const EXAM_PRIORITY_ORDER: ExamPriority[] = ['alta', 'media', 'bassa'];

const EXAM_STATUS_META: Record<
  ExamStatus,
  { label: string; text: string; border: string; bg: string }
> = {
  da_fare: {
    label: 'Da fare',
    text: 'text-ink-soft',
    border: 'border-hairline-strong',
    bg: 'bg-white/[0.04]',
  },
  prenotato: {
    label: 'Prenotato',
    text: 'text-accent-soft',
    border: 'border-accent/40',
    bg: 'bg-accent/10',
  },
  superato: {
    label: 'Superato',
    text: 'text-emerald-300',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/[0.08]',
  },
  ritirato: {
    label: 'Ritirato',
    text: 'text-ink-dim',
    border: 'border-hairline',
    bg: 'bg-white/[0.02]',
  },
};

const EXAM_PRIORITY_META: Record<ExamPriority, { label: string; text: string; dot: string }> = {
  alta: { label: 'Alta', text: 'text-rose-300', dot: 'bg-rose-400' },
  media: { label: 'Media', text: 'text-amber-300', dot: 'bg-amber-400' },
  bassa: { label: 'Bassa', text: 'text-ink-dim', dot: 'bg-white/40' },
};

/** Stato editabile del form esame (i numerici restano stringhe finché non si salva). */
interface EditableExam {
  subject: string;
  date: string;
  time: string;
  status: ExamStatus;
  priority: ExamPriority;
  cfu: string;
  grade: string;
  topics: string;
  notes: string;
}

interface DraftExam extends EditableExam {
  key: string;
  warnings: string[];
}

const blankExam = (date: string = todayISO()): EditableExam => ({
  subject: '',
  date,
  time: '',
  status: 'da_fare',
  priority: 'media',
  cfu: '',
  grade: '',
  topics: '',
  notes: '',
});

const editableFromExam = (exam: ExamRecord): EditableExam => ({
  subject: exam.subject,
  date: exam.date,
  time: exam.time ?? '',
  status: exam.status,
  priority: exam.priority,
  cfu: exam.cfu != null ? String(exam.cfu) : '',
  grade: exam.grade != null ? String(exam.grade) : '',
  topics: exam.topics ?? '',
  notes: exam.notes ?? '',
});

const editableFromParsed = (
  exam: { subject: string; date: string; time?: string | null; status: ExamStatus; priority: ExamPriority; cfu?: number | null; grade?: number | null; topics?: string; notes?: string },
): EditableExam => ({
  subject: exam.subject,
  date: exam.date,
  time: exam.time ?? '',
  status: exam.status,
  priority: exam.priority,
  cfu: exam.cfu != null ? String(exam.cfu) : '',
  grade: exam.grade != null ? String(exam.grade) : '',
  topics: exam.topics ?? '',
  notes: exam.notes ?? '',
});

const examPayloadFrom = (draft: EditableExam): ExamPayload => ({
  subject: draft.subject.trim() || undefined,
  date: draft.date,
  time: draft.time.trim() || null,
  status: draft.status,
  priority: draft.priority,
  cfu: draft.cfu.trim() === '' ? null : Number(draft.cfu),
  grade: draft.grade.trim() === '' ? null : Number(draft.grade),
  topics: draft.topics.trim() || undefined,
  notes: draft.notes.trim() || undefined,
});

const daysLeftOf = (iso: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

const iconButton =
  'grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-dim transition-colors hover:border-hairline-strong hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed';

/* ------------------------------------------------------ Componenti di dettaglio */

const CategoryBadge: React.FC<{ category: ShiftCategory }> = ({ category }) => {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.altro;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ${meta.border} ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const ExamStatusBadge: React.FC<{ status: ExamStatus }> = ({ status }) => {
  const meta = EXAM_STATUS_META[status] ?? EXAM_STATUS_META.da_fare;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ${meta.border} ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
};

const ExamPriorityBadge: React.FC<{ priority: ExamPriority }> = ({ priority }) => {
  const meta = EXAM_PRIORITY_META[priority] ?? EXAM_PRIORITY_META.media;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] ${meta.text}`}
      title={`Priorità ${meta.label.toLowerCase()}`}
    >
      <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const ShiftFields: React.FC<{
  value: EditableShift;
  onChange: (next: EditableShift) => void;
  showRecurrence?: boolean;
  disabled?: boolean;
}> = ({ value, onChange, showRecurrence = false, disabled = false }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
    <input
      className={`col-span-2 sm:col-span-2 ${inputClass}`}
      value={value.title}
      onChange={(event) => onChange({ ...value, title: event.target.value })}
      placeholder="Titolo impegno"
      disabled={disabled}
    />
    <select
      className={`col-span-1 sm:col-span-2 ${inputClass}`}
      value={value.category}
      onChange={(event) => onChange({ ...value, category: event.target.value as ShiftCategory })}
      disabled={disabled}
    >
      {CATEGORY_ORDER.map((category) => (
        <option key={category} value={category}>
          {CATEGORY_META[category].label}
        </option>
      ))}
    </select>
    <input
      className={`col-span-1 sm:col-span-2 ${inputClass}`}
      value={value.location ?? ''}
      onChange={(event) => onChange({ ...value, location: event.target.value })}
      placeholder="Luogo (opzionale)"
      disabled={disabled}
    />
    <input
      type="date"
      className={`col-span-2 sm:col-span-2 ${inputClass}`}
      value={value.date}
      onChange={(event) => onChange({ ...value, date: event.target.value })}
      disabled={disabled}
    />
    <input
      type="time"
      className={`col-span-1 sm:col-span-1 ${inputClass}`}
      value={value.start}
      onChange={(event) => onChange({ ...value, start: event.target.value })}
      disabled={disabled}
    />
    <input
      type="time"
      className={`col-span-1 sm:col-span-1 ${inputClass}`}
      value={value.end}
      onChange={(event) => onChange({ ...value, end: event.target.value })}
      disabled={disabled}
    />
    {showRecurrence ? (
      <select
        className={`col-span-2 sm:col-span-2 ${inputClass}`}
        value={value.recurrence}
        onChange={(event) => onChange({ ...value, recurrence: event.target.value as ShiftRecurrence })}
        disabled={disabled}
      >
        <option value="none">Una tantum</option>
        <option value="weekly">Ogni settimana</option>
      </select>
    ) : null}
  </div>
);

/* --------------------------------------------------------- Campi esame */

const ExamFields: React.FC<{
  value: EditableExam;
  onChange: (next: EditableExam) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
      <input
        className={`col-span-2 sm:col-span-3 ${inputClass}`}
        value={value.subject}
        onChange={(event) => onChange({ ...value, subject: event.target.value })}
        placeholder="Materia (es. Chimica Organica II)"
        disabled={disabled}
      />
      <input
        type="date"
        className={`col-span-1 sm:col-span-2 ${inputClass}`}
        value={value.date}
        onChange={(event) => onChange({ ...value, date: event.target.value })}
        disabled={disabled}
        title="Data dell'appello"
      />
      <input
        type="time"
        className={`col-span-1 sm:col-span-1 ${inputClass}`}
        value={value.time}
        onChange={(event) => onChange({ ...value, time: event.target.value })}
        disabled={disabled}
        title="Ora dell'appello (opzionale)"
      />

      <select
        className={`col-span-1 sm:col-span-2 ${inputClass}`}
        value={value.status}
        onChange={(event) => onChange({ ...value, status: event.target.value as ExamStatus })}
        disabled={disabled}
        title="Stato dell'esame"
      >
        {EXAM_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {EXAM_STATUS_META[status].label}
          </option>
        ))}
      </select>
      <select
        className={`col-span-1 sm:col-span-2 ${inputClass}`}
        value={value.priority}
        onChange={(event) => onChange({ ...value, priority: event.target.value as ExamPriority })}
        disabled={disabled}
        title="Priorità di preparazione"
      >
        {EXAM_PRIORITY_ORDER.map((priority) => (
          <option key={priority} value={priority}>
            Priorità {EXAM_PRIORITY_META[priority].label.toLowerCase()}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={60}
        className={`col-span-1 sm:col-span-1 ${inputClass}`}
        value={value.cfu}
        onChange={(event) => onChange({ ...value, cfu: event.target.value })}
        placeholder="CFU"
        disabled={disabled}
        title="CFU dell'insegnamento"
      />
      <input
        type="number"
        min={18}
        max={31}
        className={`col-span-1 sm:col-span-1 ${inputClass}`}
        value={value.grade}
        onChange={(event) => onChange({ ...value, grade: event.target.value })}
        placeholder="Voto"
        disabled={disabled}
        title="Voto (18–30, 31 = 30L)"
      />
    </div>

    <input
      className={inputClass}
      value={value.topics}
      onChange={(event) => onChange({ ...value, topics: event.target.value })}
      placeholder="Argomenti da preparare (es. reazioni di sostituzione, stereochimica)"
      disabled={disabled}
    />
    <input
      className={inputClass}
      value={value.notes}
      onChange={(event) => onChange({ ...value, notes: event.target.value })}
      placeholder="Note (aula, docente, modalità d'esame…)"
      disabled={disabled}
    />
  </div>
);

const DraftCard: React.FC<{
  draft: DraftShift;
  onChange: (patch: Partial<DraftShift>) => void;
  onRemove: () => void;
}> = ({ draft, onChange, onRemove }) => (
  <div className="surface-2 p-3">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
          {formatDateShort(draft.date)} · {draft.start}–{draft.end}
        </span>
        <CategoryBadge category={draft.category} />
        {draft.recurrence === 'weekly' ? (
          <span className="chip">
            <Repeat className="h-2.5 w-2.5" />
            settimanale
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className={iconButton}
        title="Rimuovi dalla bozza"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>

    <ShiftFields
      value={draft}
      onChange={(next) => onChange(next)}
      showRecurrence
    />

    {draft.warnings.length > 0 || (draft.conflicts?.length ?? 0) > 0 ? (
      <div className="mt-2 space-y-1">
        {(draft.conflicts ?? []).map((conflict) => (
          <p
            key={`${conflict.id}-${conflict.date}`}
            className="flex items-start gap-1.5 font-mono text-[10px] leading-snug text-amber-300/90"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Sovrapposizione con {conflict.title} ({conflict.start}–{conflict.end})
          </p>
        ))}
        {draft.warnings.map((warning) => (
          <p key={warning} className="font-mono text-[10px] leading-snug text-ink-dim">
            · {warning}
          </p>
        ))}
      </div>
    ) : null}
  </div>
);

/* -------------------------------------------------------------------- Modulo */

export const RouteModule: React.FC<RouteModuleProps> = ({ onChanged }) => {
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeekISO());
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());
  const [agenda, setAgenda] = useState<RouteAgenda | null>(null);
  const [storeMeta, setStoreMeta] = useState<RouteStoreMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const [nlInput, setNlInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<DraftShift[]>([]);
  const [draftErrors, setDraftErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState<EditableShift>(() => ({
    title: '',
    category: 'lavoro',
    date: todayISO(),
    start: '09:00',
    end: '13:00',
    location: '',
    recurrence: 'none',
  }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableShift | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ------------------------------------------------------------- Piano di studi */
  const [examList, setExamList] = useState<ExamRecord[]>([]);
  const [examLoading, setExamLoading] = useState(true);
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [examDraft, setExamDraft] = useState<EditableExam>(() => blankExam());
  const [examEditingId, setExamEditingId] = useState<string | null>(null);
  const [examEditDraft, setExamEditDraft] = useState<EditableExam | null>(null);
  const [examSaving, setExamSaving] = useState(false);
  const [examDeletingId, setExamDeletingId] = useState<string | null>(null);
  const [examDrafts, setExamDrafts] = useState<DraftExam[]>([]);
  const [examDraftErrors, setExamDraftErrors] = useState<string[]>([]);

  const notify = useCallback((tone: 'ok' | 'warn', text: string) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 6000);
  }, []);

  const loadAgenda = useCallback(async (from: string) => {
    setLoading(true);
    try {
      const data = await fetchRouteAgenda(from, addDaysISO(from, 6), { buffer: 30 });
      setAgenda(data);
      setStoreMeta(data.meta);
      setError('');
      return data;
    } catch (err: any) {
      setError(err?.message || 'Motore R.O.U.T.E. non raggiungibile.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgenda(weekStart);
  }, [weekStart, loadAgenda]);

  const loadExams = useCallback(async () => {
    setExamLoading(true);
    try {
      const data = await fetchRouteExams();
      setExamList(data.exams);
      if (data.meta) setStoreMeta(data.meta);
    } catch {
      // il piano di studi non deve bloccare l'agenda
    } finally {
      setExamLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const selectedDay = useMemo<AgendaDay | null>(() => {
    if (!agenda || agenda.days.length === 0) return null;
    return (
      agenda.days.find((day) => day.date === selectedDate) ??
      agenda.days.find((day) => day.isToday) ??
      agenda.days[0]
    );
  }, [agenda, selectedDate]);

  const goToWeek = (from: string) => {
    setWeekStart(from);
    const today = todayISO();
    setSelectedDate(today >= from && today <= addDaysISO(from, 6) ? today : from);
    setEditingId(null);
    setEditDraft(null);
  };

  const afterMutation = async (message: string, focusDate?: string) => {
    let from = weekStart;

    if (focusDate && (focusDate < weekStart || focusDate > addDaysISO(weekStart, 6))) {
      from = startOfWeekISO(focusDate);
      setWeekStart(from);
    }
    if (focusDate) setSelectedDate(focusDate);

    const data = await loadAgenda(from);
    if (data) notify('ok', message);
    onChanged?.();
  };

  /* ------------------------------------------------------------- Ingestion NL */

  const handleAnalyze = async () => {
    const text = nlInput.trim();
    if (!text || analyzing) return;

    setAnalyzing(true);
    setDraftErrors([]);
    setExamDraftErrors([]);
    setNotice(null);

    try {
      const result = await parseShiftText(text);
      const parsedExams = result.exams ?? [];
      const examProblems = result.examErrors ?? [];
      const stamp = Date.now();

      setDrafts(
        result.preview.map((shift, index) => ({
          ...shift,
          key: `draft-${stamp}-${index}`,
        })),
      );

      setExamDrafts(
        parsedExams.map((exam, index) => ({
          ...editableFromParsed(exam),
          key: `exam-draft-${stamp}-${index}`,
          warnings: exam.warnings ?? [],
        })),
      );

      if (result.preview.length === 0 && parsedExams.length === 0) {
        const problems = [...result.errors, ...examProblems];
        setDraftErrors(problems.length > 0 ? problems : ['Nessun impegno né esame riconosciuto.']);
        return;
      }

      // Gli avvisi "niente impegni" / "niente esami" sono rumore quando
      // l'altra metà del testo è stata riconosciuta correttamente.
      const shiftProblems =
        parsedExams.length > 0
          ? result.errors.filter((message) => !message.startsWith('Nessun impegno riconosciuto'))
          : result.errors;
      const examErrors =
        result.preview.length > 0
          ? examProblems.filter((message) => !message.startsWith('Nessun esame riconosciuto'))
          : examProblems;

      setDraftErrors([...shiftProblems, ...examErrors]);
    } catch (err: any) {
      setDrafts([]);
      setExamDrafts([]);
      setDraftErrors([err?.message || 'Parsing non riuscito.']);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<DraftShift>) => {
    setDrafts((previous) =>
      previous.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
    );
  };

  const handleSaveDrafts = async () => {
    if (drafts.length === 0 || saving) return;

    setSaving(true);
    const conflicts: string[] = [];
    let saved = 0;

    try {
      for (const draft of drafts) {
        const payload: ShiftPayload = {
          title: draft.title.trim() || undefined,
          category: draft.category,
          date: draft.date,
          start: draft.start,
          end: draft.end,
          location: draft.location?.trim() || undefined,
          recurrence: draft.recurrence,
        };
        const response = await createRouteShift(payload);
        saved += 1;
        (response.conflicts ?? []).forEach((conflict) => {
          conflicts.push(`${conflict.title} (${conflict.start}–${conflict.end})`);
        });
      }

      setDrafts([]);
      setDraftErrors([]);
      setNlInput('');
      await afterMutation(
        `${saved} impegno${saved === 1 ? '' : 'i'} registrat${saved === 1 ? 'o' : 'i'} in agenda.`,
        drafts[0]?.date,
      );

      if (conflicts.length > 0) {
        notify('warn', `Attenzione, sovrapposizioni: ${conflicts.join(', ')}.`);
      }
    } catch (err: any) {
      setDraftErrors([err?.message || 'Salvataggio non riuscito.']);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------- Inserimento manuale */

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const response = await createRouteShift({
        title: manual.title.trim() || undefined,
        category: manual.category,
        date: manual.date,
        start: manual.start,
        end: manual.end,
        location: manual.location?.trim() || undefined,
        recurrence: manual.recurrence,
      });

      setManual((previous) => ({ ...previous, title: '', location: '' }));
      setManualOpen(false);

      const overlap = response.conflicts?.[0];
      await afterMutation(
        overlap
          ? `Impegno registrato, ma si sovrappone a ${overlap.title} (${overlap.start}–${overlap.end}).`
          : 'Impegno registrato in agenda.',
        manual.date,
      );
    } catch (err: any) {
      notify('warn', err?.message || 'Registrazione non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------ Modifica / delete */

  const startEdit = (shift: ShiftOccurrence) => {
    setEditingId(shift.occurrenceId);
    setEditDraft({
      title: shift.title,
      category: shift.category,
      date: shift.date,
      start: shift.start,
      end: shift.end,
      location: shift.location ?? '',
      recurrence: shift.recurrence,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft || saving) return;

    setSaving(true);
    try {
      const response = await updateRouteShift(editingId, {
        title: editDraft.title.trim() || undefined,
        category: editDraft.category,
        date: editDraft.date,
        start: editDraft.start,
        end: editDraft.end,
        location: editDraft.location?.trim() || undefined,
      });
      const focusDate = editDraft.date;
      cancelEdit();

      const overlap = response.conflicts?.[0];
      await afterMutation(
        overlap
          ? `Impegno aggiornato, ma si sovrappone a ${overlap.title}.`
          : 'Impegno aggiornato.',
        focusDate,
      );
    } catch (err: any) {
      notify('warn', err?.message || 'Modifica non riuscita.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift: ShiftOccurrence) => {
    if (deletingId) return;
    setDeletingId(shift.occurrenceId);

    try {
      await deleteRouteShift(shift.occurrenceId);
      if (editingId === shift.occurrenceId) cancelEdit();
      await afterMutation(
        shift.isRecurring ? 'Serie settimanale eliminata.' : 'Impegno eliminato dall’agenda.',
      );
    } catch (err: any) {
      notify('warn', err?.message || 'Eliminazione non riuscita.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------- Piano di studi: azioni */

  const afterExamMutation = async (message: string, focusDate?: string) => {
    await afterMutation(message, focusDate);
    const data = await fetchRouteExams().catch(() => null);
    if (data) {
      setExamList(data.exams);
      setStoreMeta(data.meta);
    }
  };

  const handleExamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (examSaving) return;

    if (!examDraft.subject.trim()) {
      notify('warn', 'Indica la materia dell’esame.');
      return;
    }
    if (!examDraft.date) {
      notify('warn', 'Indica la data dell’appello.');
      return;
    }

    setExamSaving(true);
    try {
      await createRouteExam(examPayloadFrom(examDraft));
      const label = examDraft.subject.trim();
      const focusDate = examDraft.date;
      setExamDraft(blankExam());
      setExamFormOpen(false);
      await afterExamMutation(`Esame «${label}» aggiunto al piano di studi.`, focusDate);
    } catch (err: any) {
      notify('warn', err?.message || 'Registrazione dell’esame non riuscita.');
    } finally {
      setExamSaving(false);
    }
  };

  const startExamEdit = (exam: ExamRecord) => {
    setExamEditingId(exam.id);
    setExamEditDraft(editableFromExam(exam));
  };

  const cancelExamEdit = () => {
    setExamEditingId(null);
    setExamEditDraft(null);
  };

  const saveExamEdit = async () => {
    if (!examEditingId || !examEditDraft || examSaving) return;

    setExamSaving(true);
    try {
      await updateRouteExam(examEditingId, examPayloadFrom(examEditDraft));
      const focusDate = examEditDraft.date;
      cancelExamEdit();
      await afterExamMutation('Esame aggiornato.', focusDate);
    } catch (err: any) {
      notify('warn', err?.message || 'Modifica dell’esame non riuscita.');
    } finally {
      setExamSaving(false);
    }
  };

  const handleExamDelete = async (exam: ExamRecord) => {
    if (examDeletingId) return;
    setExamDeletingId(exam.id);

    try {
      await deleteRouteExam(exam.id);
      if (examEditingId === exam.id) cancelExamEdit();
      await afterExamMutation('Esame rimosso dal piano di studi.');
    } catch (err: any) {
      notify('warn', err?.message || 'Eliminazione dell’esame non riuscita.');
    } finally {
      setExamDeletingId(null);
    }
  };

  const handleSaveExamDrafts = async () => {
    if (examDrafts.length === 0 || examSaving) return;

    setExamSaving(true);
    const focusDate = examDrafts[0]?.date;
    let saved = 0;

    try {
      for (const draft of examDrafts) {
        await createRouteExam(examPayloadFrom(draft));
        saved += 1;
      }
      setExamDrafts([]);
      setExamDraftErrors([]);
      setNlInput('');
      await afterExamMutation(
        `${saved} esame${saved === 1 ? '' : 'i'} aggiunt${saved === 1 ? 'o' : 'i'} al piano di studi.`,
        focusDate,
      );
    } catch (err: any) {
      setExamDraftErrors([err?.message || 'Salvataggio degli esami non riuscito.']);
    } finally {
      setExamSaving(false);
    }
  };

  /* ------------------------------------------------------------------ Derivati */

  const totals = agenda?.totals;
  const categoryRows = useMemo(() => {
    if (!totals) return [] as { category: ShiftCategory; minutes: number; count: number }[];
    return CATEGORY_ORDER.map((category) => ({
      category,
      minutes: totals.byCategory[category]?.minutes ?? 0,
      count: totals.byCategory[category]?.count ?? 0,
    }))
      .filter((row) => row.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [totals]);

  const maxCategoryMinutes = Math.max(...categoryRows.map((row) => row.minutes), 1);

  const dayCapacity = selectedDay ? selectedDay.busyMinutes + selectedDay.freeMinutes : 0;
  const freeRatio = dayCapacity > 0 && selectedDay ? (selectedDay.freeMinutes / dayCapacity) * 100 : 0;

  const draftProblems = [...draftErrors, ...examDraftErrors];
  const inputError = draftProblems.length > 0;

  /** Esami «da dare» ordinati per urgenza, usati dal pannello Piano di studi. */
  const examRows = useMemo(() => {
    const weight: Record<ExamStatus, number> = { prenotato: 0, da_fare: 1, superato: 2, ritirato: 3 };
    const priorityWeight: Record<ExamPriority, number> = { alta: 0, media: 1, bassa: 2 };
    return [...examList].sort(
      (a, b) =>
        weight[a.status] - weight[b.status] ||
        a.date.localeCompare(b.date) ||
        priorityWeight[a.priority] - priorityWeight[b.priority],
    );
  }, [examList]);

  const upcomingExamCount = examRows.filter(
    (exam) => exam.status === 'da_fare' || exam.status === 'prenotato',
  ).length;

  const totalCfu = examRows
    .filter((exam) => exam.status !== 'ritirato')
    .reduce((sum, exam) => sum + (exam.cfu ?? 0), 0);

  /* -------------------------------------------------------------------- Render */

  return (
    <PageShell>
      <PageHeader
        code="C-05 · R.O.U.T.E."
        title="Turni, lezioni & timeboxing"
        description={
          <>
            Registra ogni impegno — lavoro, università, studio o personale — in linguaggio
            naturale oppure a mano. Il motore persiste l’agenda, espande le ricorrenze
            settimanali, rileva le sovrapposizioni e ricalcola i blocchi liberi di studio.
            Gli esami da dare hanno un piano di studi dedicato: materia, appello, stato,
            priorità, CFU e voto.
          </>
        }
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot
              tone={storeMeta ? 'success' : 'neutral'}
              label={storeMeta ? `${storeMeta.count} impegni` : 'archivio…'}
            />
            <StatusDot
              tone={upcomingExamCount > 0 ? 'warning' : 'neutral'}
              label={`${upcomingExamCount} esami da dare`}
            />
            <StatusDot tone="accent" label={`buffer ${agenda?.bufferMinutes ?? 30}′`} />
          </div>
        }
      />

      {error ? (
        <Panel className="border-rose-400/30 bg-rose-500/[0.06]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-rose-100">{error}</p>
              <button
                type="button"
                onClick={() => void loadAgenda(weekStart)}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-rose-200/80 underline decoration-dotted underline-offset-4 hover:text-rose-100"
              >
                Riprova connessione
              </button>
            </div>
          </div>
        </Panel>
      ) : null}

      {/* ------------------------------------------------------------ Ingestion */}
      <Panel>
        <PanelHeader
          icon={Sparkles}
          label="Ingestion"
          title="Descrivi l’impegno, N.I.C.O. lo struttura"
          aside={
            <span className="hidden font-mono text-[10px] text-ink-dim sm:inline">
              parse locale · nessuna API key richiesta
            </span>
          }
        />

        <div className="mt-4 space-y-3">
          <textarea
            value={nlInput}
            onChange={(event) => setNlInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                void handleAnalyze();
              }
            }}
            rows={2}
            placeholder="Es. «Domani turno farmacia 14-18» · «Ogni martedì laboratorio 9-13» · «Esame di Farmacologia il 5 dicembre 9 cfu»"
            className={`${inputClass} resize-none leading-relaxed`}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={!nlInput.trim() || analyzing}
              className="btn-primary"
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              {analyzing ? 'Analisi…' : 'Analizza'}
            </button>

            <button
              type="button"
              onClick={() => setManualOpen((open) => !open)}
              className="btn-ghost"
            >
              <PenLine className="h-3.5 w-3.5" />
              {manualOpen ? 'Chiudi modulo' : 'Inserimento manuale'}
            </button>

            <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim sm:inline">
              Ctrl/⌘ + Invio per analizzare
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setNlInput(example)}
                className="rounded-full border border-hairline bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-ink-dim transition-colors hover:border-hairline-strong hover:text-ink-soft"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {inputError ? (
          <div className="animate-fade-in mt-4 space-y-1.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5">
            {draftProblems.map((message) => (
              <p key={message} className="flex items-start gap-1.5 font-mono text-[10.5px] leading-snug text-amber-200/90">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {message}
              </p>
            ))}
          </div>
        ) : null}

        {drafts.length > 0 || examDrafts.length > 0 ? (
          <div className="animate-fade-in mt-4 space-y-2.5 border-t border-hairline pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="label-micro">
                Anteprima · {drafts.length} impegno{drafts.length === 1 ? '' : 'i'}
                {examDrafts.length > 0
                  ? ` · ${examDrafts.length} esame${examDrafts.length === 1 ? '' : 'i'}`
                  : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDrafts([]);
                  setExamDrafts([]);
                  setDraftErrors([]);
                  setExamDraftErrors([]);
                }}
                className="btn-ghost"
              >
                <X className="h-3 w-3" />
                Scarta
              </button>
            </div>

            {drafts.map((draft, index) => (
              <DraftCard
                key={draft.key}
                draft={draft}
                onChange={(patch) => updateDraft(index, patch)}
                onRemove={() => setDrafts((previous) => previous.filter((_, i) => i !== index))}
              />
            ))}

            {drafts.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleSaveDrafts()}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {saving ? 'Salvataggio…' : `Conferma e registra (${drafts.length})`}
              </button>
            ) : null}

            {examDrafts.length > 0 ? (
              <div className="space-y-2.5 border-t border-dashed border-hairline pt-3">
                <span className="label-micro">Esami riconosciuti</span>
                {examDrafts.map((draft) => (
                  <div key={draft.key} className="surface-2 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <ExamStatusBadge status={draft.status} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                          {formatDateShort(draft.date)}
                          {draft.time ? ` · ${draft.time}` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExamDrafts((previous) => previous.filter((item) => item.key !== draft.key))
                        }
                        className={iconButton}
                        title="Rimuovi dalla bozza"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <ExamFields
                      value={draft}
                      onChange={(next) =>
                        setExamDrafts((previous) =>
                          previous.map((item) =>
                            item.key === draft.key ? { ...item, ...next } : item,
                          ),
                        )
                      }
                    />

                    {draft.warnings.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {draft.warnings.map((warning) => (
                          <p key={warning} className="font-mono text-[10px] leading-snug text-ink-dim">
                            · {warning}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => void handleSaveExamDrafts()}
                  disabled={examSaving}
                  className="btn-primary w-full"
                >
                  {examSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <GraduationCap className="h-3.5 w-3.5" />
                  )}
                  {examSaving
                    ? 'Salvataggio…'
                    : `Aggiungi al piano di studi (${examDrafts.length})`}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {manualOpen ? (
          <form onSubmit={handleManualSubmit} className="animate-fade-in mt-4 space-y-3 border-t border-hairline pt-4">
            <ShiftFields
              value={manual}
              onChange={setManual}
              showRecurrence
              disabled={saving}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Plus className="h-3.5 w-3.5" />
                {saving ? 'Registrazione…' : 'Registra impegno'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setManualOpen(false)}>
                Annulla
              </button>
              <span className="font-mono text-[10px] text-ink-dim">
                Ricorrenza settimanale = stesso giorno e orario ogni settimana
              </span>
            </div>
          </form>
        ) : null}

        {notice ? (
          <div
            className={`animate-fade-in mt-4 flex items-start gap-1.5 font-mono text-[11px] ${
              notice.tone === 'ok' ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {notice.tone === 'ok' ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {notice.text}
          </div>
        ) : null}
      </Panel>

      {/* --------------------------------------------------------- Agenda + analytics */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Panel flush>
            <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <PanelHeader
                icon={CalendarDays}
                label="Settimana"
                title={`${formatDateShort(weekStart)} — ${formatDateShort(addDaysISO(weekStart, 6))}`}
                className="flex-1 border-transparent pb-0"
                aside={
                  loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-dim" />
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                      {totals?.shiftCount ?? 0} impegni
                    </span>
                  )
                }
              />
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => goToWeek(addDaysISO(weekStart, -7))} className={iconButton} title="Settimana precedente">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToWeek(startOfWeekISO())}
                  className="rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-hairline-strong hover:text-ink"
                >
                  Oggi
                </button>
                <button type="button" onClick={() => goToWeek(addDaysISO(weekStart, 7))} className={iconButton} title="Settimana successiva">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-5 pb-4">
              {(agenda?.days ?? []).map((day) => {
                const isActive = selectedDay?.date === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`min-w-[76px] flex-1 rounded-lg border px-2 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-hairline bg-white/[0.02] hover:border-hairline-strong'
                    }`}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-dim">
                      {day.weekdayShort}
                    </div>
                    <div
                      className={`mt-0.5 font-mono text-[15px] font-semibold leading-none ${
                        day.isToday ? 'text-accent-soft' : 'text-ink'
                      }`}
                    >
                      {Number(day.date.slice(8))}
                    </div>
                    <div className="mt-1.5 flex h-1 items-center gap-0.5">
                      {day.shifts.slice(0, 4).map((shift) => (
                        <span
                          key={shift.occurrenceId}
                          className={`h-1 w-1 rounded-full ${CATEGORY_META[shift.category]?.dot ?? 'bg-white/40'}`}
                        />
                      ))}
                      {day.exams.slice(0, 2).map((exam) => (
                        <span
                          key={exam.id}
                          className={`h-1 w-1 rounded-full ${exam.status === 'superato' ? 'bg-emerald-400' : 'bg-accent'}`}
                          title={`Esame · ${exam.subject}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-ink-dim">
                      {day.busyMinutes > 0 ? formatDuration(day.busyMinutes) : 'libero'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-hairline">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="label-micro">Agenda giorno</div>
                  <h2 className="mt-1 truncate text-[13px] font-semibold capitalize text-ink">
                    {selectedDay ? formatDateLong(selectedDay.date) : '—'}
                  </h2>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                  {selectedDay?.shifts.length ?? 0} impegni · {selectedDay?.exams.length ?? 0} esami ·{' '}
                  {formatDuration(selectedDay?.freeMinutes ?? 0)} libere
                </span>
              </div>

              {loading && !agenda ? (
                <div className="px-5 pb-6">
                  <EmptyState icon={Loader2} title="Caricamento agenda…" />
                </div>
              ) : (selectedDay?.shifts.length ?? 0) === 0 &&
                (selectedDay?.exams.length ?? 0) === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={CalendarIcon}
                    title="Nessun impegno in questa giornata"
                    hint="Usa l’ingestion in alto: «domani turno farmacia 14-18» oppure «esame di Farmacologia il 5 dicembre»."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {(selectedDay?.exams ?? []).map((exam) => (
                    <li
                      key={`exam-${exam.id}`}
                      className="flex items-start justify-between gap-3 bg-accent/[0.04] px-5 py-3.5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="w-[52px] shrink-0 border-r border-hairline pr-3 text-right font-mono text-[11px] leading-tight">
                          <div className="font-semibold text-accent-soft">{exam.time ?? '—'}</div>
                          <div className="text-[9px] uppercase tracking-[0.06em] text-ink-dim">esame</div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[12.5px] font-medium text-ink">{exam.subject}</span>
                            <ExamStatusBadge status={exam.status} />
                            <ExamPriorityBadge priority={exam.priority} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="h-2.5 w-2.5" />
                              appello
                            </span>
                            {exam.cfu ? <span>{exam.cfu} cfu</span> : null}
                            {exam.grade ? <span>voto {exam.grade === 31 ? '30L' : exam.grade}</span> : null}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startExamEdit(exam)}
                        className={iconButton}
                        title="Modifica esame"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}

                  {selectedDay!.shifts.map((shift) =>
                    editingId === shift.occurrenceId && editDraft ? (
                      <li key={shift.occurrenceId} className="bg-white/[0.02] px-5 py-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="label-micro">Modifica impegno</span>
                          <button type="button" onClick={cancelEdit} className={iconButton} title="Chiudi">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <ShiftFields value={editDraft} onChange={setEditDraft} disabled={saving} />
                        {shift.isRecurring ? (
                          <p className="mt-2 font-mono text-[10px] leading-snug text-amber-300/80">
                            Impegno ricorrente: le modifiche valgono per tutta la serie settimanale.
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2">
                          <button type="button" onClick={() => void saveEdit()} disabled={saving} className="btn-primary">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Salva
                          </button>
                          <button type="button" onClick={cancelEdit} className="btn-ghost">
                            Annulla
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li
                        key={shift.occurrenceId}
                        className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="w-[52px] shrink-0 border-r border-hairline pr-3 text-right font-mono text-[11px] leading-tight">
                            <div className="font-semibold text-ink">{shift.start}</div>
                            <div className="text-ink-dim">{shift.end}</div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-[12.5px] font-medium text-ink">{shift.title}</span>
                              <CategoryBadge category={shift.category} />
                              {shift.isRecurring ? (
                                <span className="chip">
                                  <Repeat className="h-2.5 w-2.5" />
                                  sett.
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                              <span>{formatDuration(minutesOf(shift.end) - minutesOf(shift.start))}</span>
                              {shift.location ? (
                                <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {shift.location}
                                </span>
                              ) : null}
                              {shift.source === 'nico' ? <span>· da N.I.C.O.</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(shift)}
                            className={iconButton}
                            title="Modifica impegno"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(shift)}
                            disabled={deletingId === shift.occurrenceId}
                            className={`${iconButton} hover:border-rose-400/40 hover:text-rose-300`}
                            title={shift.isRecurring ? 'Elimina tutta la serie' : 'Elimina impegno'}
                          >
                            {deletingId === shift.occurrenceId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-5 lg:col-span-5">
          {/* Timeboxing del giorno */}
          <Panel>
            <PanelHeader
              icon={Clock}
              label="Timeboxing"
              title="Blocchi liberi calcolati"
              aside={
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                  {agenda?.dayWindow.start}–{agenda?.dayWindow.end}
                </span>
              }
            />

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-[26px] font-semibold leading-none tracking-tight text-ink">
                {formatDuration(selectedDay?.freeMinutes ?? 0)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                disponibili
              </span>
            </div>
            <Progress value={freeRatio} tone={freeRatio < 20 ? 'danger' : freeRatio < 45 ? 'warning' : 'success'} className="mt-3" />

            {(selectedDay?.freeBlocks.length ?? 0) > 0 ? (
              <ul className="mt-4 space-y-1.5">
                {selectedDay!.freeBlocks.map((block) => (
                  <li
                    key={`${block.start}-${block.end}`}
                    className="flex items-center justify-between rounded-lg border border-hairline bg-white/[0.02] px-3 py-2 font-mono text-[11px]"
                  >
                    <span className="text-ink">
                      {block.start}–{block.end}
                    </span>
                    <span className="text-ink-dim">{formatDuration(block.minutes)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-hairline px-3 py-4 text-center font-mono text-[10.5px] text-ink-dim">
                Nessun blocco libero sufficiente in questa giornata.
              </p>
            )}

            <p className="mt-3 text-[10.5px] leading-snug text-ink-dim">
              Finestra operativa {agenda?.dayWindow.start}–{agenda?.dayWindow.end}; sottratti{' '}
              {agenda?.bufferMinutes ?? 30}′ di spostamento attorno a ogni impegno. Blocchi minimi da{' '}
              {agenda?.minBlockMinutes ?? 30}′.
            </p>
          </Panel>

          {/* Carico settimanale */}
          <Panel>
            <PanelHeader
              icon={GraduationCap}
              label="Carico settimanale"
              title="Ore per categoria"
              aside={
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                  {formatDuration(totals?.busyMinutes ?? 0)} totali
                </span>
              }
            />

            {categoryRows.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={CalendarIcon} title="Settimana ancora vuota" hint="Registra un impegno per vedere la distribuzione del carico." />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {categoryRows.map((row) => {
                  const meta = CATEGORY_META[row.category];
                  return (
                    <li key={row.category}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="font-mono text-[11px] text-ink">
                          {formatDuration(row.minutes)}
                          <span className="ml-1.5 text-[10px] text-ink-dim">×{row.count}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                          style={{ width: `${Math.max(4, (row.minutes / maxCategoryMinutes) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
              <span>Studio potenziale</span>
              <span className="text-ink">{formatDuration(totals?.freeMinutes ?? 0)}</span>
            </div>
          </Panel>

          {/* Piano di studi · esami */}
          <Panel className="flex flex-col">
            <PanelHeader
              icon={BookOpen}
              label="Piano di studi"
              title="Esami da dare"
              aside={
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                    {upcomingExamCount}/{examRows.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExamFormOpen((open) => !open);
                      setExamEditingId(null);
                      setExamEditDraft(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white/[0.03] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-hairline-strong hover:text-ink"
                  >
                    <Plus className="h-3 w-3" />
                    {examFormOpen ? 'Chiudi' : 'Esame'}
                  </button>
                </div>
              }
            />

            {examFormOpen ? (
              <form onSubmit={handleExamSubmit} className="animate-fade-in mt-4 space-y-2.5">
                <span className="label-micro">Nuovo esame</span>
                <ExamFields value={examDraft} onChange={setExamDraft} disabled={examSaving} />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className="btn-primary" disabled={examSaving}>
                    {examSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <GraduationCap className="h-3.5 w-3.5" />
                    )}
                    {examSaving ? 'Salvataggio…' : 'Aggiungi esame'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setExamFormOpen(false);
                      setExamDraft(blankExam());
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
              <span>CFU nel piano</span>
              <span className="text-ink">{totalCfu}</span>
            </div>

            {examLoading ? (
              <div className="mt-4">
                <EmptyState icon={Loader2} title="Caricamento piano di studi…" />
              </div>
            ) : examRows.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={GraduationCap}
                  title="Nessun esame registrato"
                  hint="Usa «Esame» oppure scrivi «esame di Farmacologia il 5 dicembre 9 cfu» nell’ingestion."
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {examRows.map((exam) => {
                  const isEditing = examEditingId === exam.id && examEditDraft;
                  const daysLeft = daysLeftOf(exam.date);
                  const passed = exam.status === 'superato';
                  const missed = !passed && exam.status !== 'ritirato' && daysLeft < 0;

                  if (isEditing) {
                    return (
                      <li
                        key={exam.id}
                        className="rounded-lg border border-accent/40 bg-accent/[0.06] p-3.5"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="label-micro">Modifica esame</span>
                          <button
                            type="button"
                            onClick={cancelExamEdit}
                            className={iconButton}
                            title="Chiudi"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <ExamFields
                          value={examEditDraft as EditableExam}
                          onChange={setExamEditDraft}
                          disabled={examSaving}
                        />
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void saveExamEdit()}
                            disabled={examSaving}
                            className="btn-primary"
                          >
                            {examSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Salva
                          </button>
                          <button type="button" onClick={cancelExamEdit} className="btn-ghost">
                            Annulla
                          </button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={exam.id} className="rounded-lg border border-hairline bg-white/[0.02] p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="min-w-0 text-[12.5px] font-medium leading-snug text-ink">
                              {exam.subject}
                            </span>
                            <ExamStatusBadge status={exam.status} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                            <span>{formatDateShort(exam.date)}</span>
                            {exam.time ? <span>{exam.time}</span> : <span>ora da definire</span>}
                            {exam.cfu ? <span>{exam.cfu} cfu</span> : null}
                            {exam.grade ? <span>voto {exam.grade === 31 ? '30L' : exam.grade}</span> : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startExamEdit(exam)}
                            className={iconButton}
                            title="Modifica esame"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExamDelete(exam)}
                            disabled={examDeletingId === exam.id}
                            className={`${iconButton} hover:border-rose-400/40 hover:text-rose-300`}
                            title="Elimina esame"
                          >
                            {examDeletingId === exam.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {passed ? null : (
                        <>
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <ExamPriorityBadge priority={exam.priority} />
                            <span className="font-mono text-[20px] font-semibold leading-none tracking-tight text-ink">
                              {Math.abs(daysLeft)}
                              <span className="ml-1 text-[10px] font-normal text-ink-dim">
                                {daysLeft < 0 ? 'giorni fa' : 'giorni'}
                              </span>
                            </span>
                          </div>

                          <Progress
                            value={daysLeft < 0 ? 100 : Math.max(10, 100 - daysLeft * 2)}
                            tone={
                              missed
                                ? 'danger'
                                : daysLeft < 10
                                  ? 'danger'
                                  : daysLeft < 25
                                    ? 'warning'
                                    : 'accent'
                            }
                            className="mt-2"
                          />

                          {missed ? (
                            <p className="mt-2 flex items-start gap-1.5 font-mono text-[10px] leading-snug text-amber-300/90">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              Appello passato: aggiorna lo stato (superato, prenotato o ritirato).
                            </p>
                          ) : null}

                          {exam.topics ? (
                            <p className="mt-2 text-[11px] leading-snug text-ink-soft line-clamp-2">
                              {exam.topics}
                            </p>
                          ) : null}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* --------------------------------------------------------------- Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
        <span className="truncate">Store · {storeMeta?.file ?? 'data/route.json'}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            persistenza attiva
          </span>
          <span className="text-hairline-strong">/</span>
          <span>{storeMeta ? `${storeMeta.count} impegni in archivio` : 'archivio non inizializzato'}</span>
          <span className="text-hairline-strong">/</span>
          <span>{storeMeta ? `${storeMeta.examCount} esami nel piano di studi` : 'piano di studi vuoto'}</span>
        </span>
      </div>
    </PageShell>
  );
};

export default RouteModule;
