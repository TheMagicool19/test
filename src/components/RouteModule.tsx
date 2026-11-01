import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  CalendarDays, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ShiftItem, ExamItem } from '../types/navicella';

interface RouteModuleProps {
  shifts: ShiftItem[];
  exams: ExamItem[];
  onAddShift: (nlText: string) => Promise<any>;
}

export const RouteModule: React.FC<RouteModuleProps> = ({
  shifts,
  exams,
  onAddShift,
}) => {
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
      setSuccessMsg('Turno registrato con successo su Google Calendar & R.O.U.T.E.');
      setNlInput('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400">
              C-05: R.O.U.T.E. (TIME MANAGEMENT & LOGISTICA)
            </span>
            <span className="text-xs font-mono text-slate-400">
              GOOGLE CALENDAR API &bull; TIMEBOXING AUTOMATICO &bull; COUNTDOWN ESAMI
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            R.O.U.T.E. SHIFT & STUDY TIMEBOXING
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Ricevuto un turno in formato linguaggio naturale (es. "Domani lavoro 14-18"), 
            N.I.C.O. esegue la call <code className="text-cyan-400 font-mono">route_insert_shift()</code>, sincronizza Google Calendar e 
            ricalcola automaticamente i blocchi liberi per lo studio degli esami CTF.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-blue-300 bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-800">
          <CalendarDays className="w-4 h-4 text-blue-400" />
          <span>Calendar Sync: Attivo &bull; GSuite API</span>
        </div>
      </div>

      {/* Natural Language Shift Ingestion Bar */}
      <div className="rounded-xl border border-blue-900/50 bg-slate-900/60 p-4 sm:p-5 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-blue-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> INSERIMENTO TURNO IN LINGUAGGIO NATURALE:
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              Es. "Domani lavoro 14-18", "Sabato turno 09-13 laboratorio"
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder="Inserisci turno (es. Domani lavoro 14-18 turno farmacia ospedaliera)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
            <button
              type="submit"
              disabled={!nlInput.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Registrazione in corso...' : 'Invia a R.O.U.T.E.'}
            </button>
          </div>

          {successMsg && (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </form>
      </div>

      {/* Grid: Shifts Timetable & Exam Countdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Shifts and Timeboxing Slots */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> TURNI DI LAVORO PROGRAMMATI
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {shifts.length} Turni Attivi
              </span>
            </div>

            <div className="space-y-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {shift.role}
                    </div>
                    <div className="text-slate-400 text-xs font-sans">
                      {shift.day} &bull; Data: {shift.date}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">
                      {shift.start} - {shift.end}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Google Calendar: Sync OK
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeboxing Free Slots for Study */}
          <div className="rounded-xl border border-blue-900/40 bg-gradient-to-br from-blue-950/20 to-slate-900/60 p-4 font-mono text-xs space-y-2">
            <div className="text-blue-300 font-bold uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> BLOCCHI STUDIO CALCOLATI (TIMEBOXING LIBERO)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Mattina (08:30 - 12:30):</div>
                <div className="text-emerald-300 font-bold mt-0.5">4h Libere - Focus CTF Sintesi</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Sera (20:30 - 22:30):</div>
                <div className="text-emerald-300 font-bold mt-0.5">2h Libere - Sparring Feynman</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Exam Countdowns & Study Velocity */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-cyan-400" /> COUNTDOWN ESAMI ACCADEMICI
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                PIANO DI STUDI
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200 font-mono">
                      {ex.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{ex.date}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="text-xs text-slate-400 font-sans">
                      Tempo Residuo per completare il Vault D.N.A.:
                    </div>
                    <div className="text-xl font-extrabold text-cyan-400 font-mono flex items-baseline gap-1">
                      {ex.daysLeft} <span className="text-xs font-normal text-slate-400">giorni</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                      style={{ width: `${Math.max(10, 100 - ex.daysLeft * 2)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>R.O.U.T.E. Scheduling Engine</span>
            <span>Google Apps Script Connector: OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
