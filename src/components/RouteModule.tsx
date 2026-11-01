import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Plus,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { ShiftItem, ExamItem } from '../types/navicella';
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  StatusDot,
  EmptyState,
  inputClass,
} from './ui/Page';

interface RouteModuleProps {
  shifts: ShiftItem[];
  exams: ExamItem[];
  onAddShift: (nlText: string) => Promise<any>;
}

export const RouteModule: React.FC<RouteModuleProps> = ({ shifts, exams, onAddShift }) => {
  const [nlInput, setNlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      await onAddShift(nlInput.trim());
      setSuccessMsg('Turno registrato su Google Calendar e R.O.U.T.E.');
      setNlInput('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        code="C-05 · R.O.U.T.E."
        title="Turni & timeboxing"
        description={
          <>
            Un turno in linguaggio naturale (&laquo;Domani lavoro 14-18&raquo;) viene parsato da
            N.I.C.O., registrato via <span className="font-mono text-ink-soft">route_insert_shift()</span>,
            sincronizzato con Google Calendar e usato per ricalcolare i blocchi liberi di studio.
          </>
        }
        aside={<StatusDot label="Calendar sync attivo" />}
      />

      {/* ---- Ingestion ---- */}
      <Panel>
        <PanelHeader
          icon={Sparkles}
          label="Natural language"
          title="Inserimento turno"
          aside={
            <span className="hidden font-mono text-[10px] text-ink-dim sm:inline">
              «Sabato turno 09-13 laboratorio»
            </span>
          }
        />

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder="Inserisci turno in linguaggio naturale…"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={!nlInput.trim() || isSubmitting}
              className="btn-primary shrink-0 sm:px-5"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Registrazione…' : 'Invia a R.O.U.T.E.'}
            </button>
          </div>

          {successMsg && (
            <div className="animate-fade-in flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {successMsg}
            </div>
          )}
        </form>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ---- Turni + timeboxing ---- */}
        <div className="space-y-5 lg:col-span-7">
          <Panel flush>
            <div className="px-5 pt-5">
              <PanelHeader
                icon={Clock}
                label="Programmazione"
                title="Turni di lavoro"
                aside={
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                    {shifts.length} attivi
                  </span>
                }
              />
            </div>

            {shifts.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={CalendarIcon}
                  title="Nessun turno programmato"
                  hint="Inserisci un turno in linguaggio naturale per popolare il calendario."
                />
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-white/[0.05]">
                {shifts.map((shift) => (
                  <li
                    key={shift.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-ink">
                          {shift.role}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                          {shift.day} · {shift.date}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[12px] font-semibold text-ink">
                        {shift.start}–{shift.end}
                      </div>
                      <div className="mt-0.5 flex items-center justify-end gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-emerald-400/80">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Sync ok
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader icon={BookOpen} label="Timeboxing" title="Blocchi studio calcolati" />
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="surface-2 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                  Mattina · 08:30–12:30
                </div>
                <div className="mt-1.5 text-[12px] font-medium text-ink">
                  4h libere · Focus CTF sintesi
                </div>
              </div>
              <div className="surface-2 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                  Sera · 20:30–22:30
                </div>
                <div className="mt-1.5 text-[12px] font-medium text-ink">
                  2h libere · Sparring Feynman
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ---- Countdown esami ---- */}
        <Panel className="lg:col-span-5 flex flex-col">
          <PanelHeader
            icon={CalendarDays}
            label="Piano di studi"
            title="Countdown esami"
            aside={
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                {exams.length}
              </span>
            }
          />

          {exams.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={CalendarIcon} title="Nessun esame registrato" />
            </div>
          ) : (
            <ul className="mt-1 space-y-3">
              {exams.map((ex) => (
                <li key={ex.id} className="rounded-lg border border-hairline bg-white/[0.02] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-[12.5px] font-medium leading-snug text-ink">
                      {ex.subject}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-dim">{ex.date}</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-dim">
                      Vault D.N.A. residuo
                    </span>
                    <span className="font-mono text-[20px] font-semibold leading-none tracking-tight text-ink">
                      {ex.daysLeft}
                      <span className="ml-1 text-[10px] font-normal text-ink-dim">giorni</span>
                    </span>
                  </div>

                  <Progress
                    value={Math.max(10, 100 - ex.daysLeft * 2)}
                    tone={ex.daysLeft < 10 ? 'danger' : ex.daysLeft < 25 ? 'warning' : 'accent'}
                    className="mt-2"
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
            <span>R.O.U.T.E. engine</span>
            <span>GAS connector ok</span>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
};
