import React from 'react';

/* ============================================================================
   Primitivi UI condivisi — Design System "Obsidian"
   Usati da tutti i moduli interni per garantire la stessa grammatica visiva.
   ============================================================================ */

/* ---------------------------------------------------------------- PageShell */

export const PageShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 ${className}`}>
    {children}
  </div>
);

/* --------------------------------------------------------------- PageHeader */

interface PageHeaderProps {
  /** Sigla compartimento, es. "C-06: F.A.R.A.D.A.Y." */
  code: string;
  title: string;
  description: React.ReactNode;
  /** Contenuto a destra (stato, badge, KPI) */
  aside?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ code, title, description, aside }) => (
  <header className="flex flex-col gap-4 border-b border-hairline pb-5 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <span className="chip">{code}</span>
      <h1 className="mt-2.5 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[26px]">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-ink-soft">{description}</p>
    </div>
    {aside ? <div className="shrink-0">{aside}</div> : null}
  </header>
);

/* -------------------------------------------------------------------- Panel */

export const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Rimuove il padding interno (per liste/tabelle a filo bordo) */
  flush?: boolean;
}> = ({ children, className = '', flush = false }) => (
  <section className={`surface surface-edge overflow-hidden ${flush ? '' : 'p-5'} ${className}`}>
    {children}
  </section>
);

/* -------------------------------------------------------------- PanelHeader */

export const PanelHeader: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  title?: string;
  aside?: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, label, title, aside, className = '' }) => (
  <div
    className={`flex items-start justify-between gap-4 border-b border-hairline pb-3.5 ${className}`}
  >
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.04] text-ink-soft">
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className="min-w-0 leading-tight">
        <div className="label-micro">{label}</div>
        {title ? <h2 className="mt-1 truncate text-[13px] font-semibold text-ink">{title}</h2> : null}
      </div>
    </div>
    {aside ? <div className="shrink-0 pt-0.5">{aside}</div> : null}
  </div>
);

/* ---------------------------------------------------------------- StatTile */

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: string;
  /** Colore del valore: default neutro */
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}> = ({ label, value, unit, hint, tone = 'neutral', className = '' }) => {
  const toneClass = {
    neutral: 'text-ink',
    accent: 'text-accent-soft',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
  }[tone];

  return (
    <div className={`surface-2 p-4 ${className}`}>
      <div className="label-micro">{label}</div>
      <div className={`mt-2 flex items-baseline gap-1.5 font-mono text-[20px] font-semibold tracking-tight ${toneClass}`}>
        {value}
        {unit ? <span className="text-[11px] font-normal text-ink-dim">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-[11px] leading-snug text-ink-dim">{hint}</div> : null}
    </div>
  );
};

/* ---------------------------------------------------------------- Progress */

export const Progress: React.FC<{
  value: number;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}> = ({ value, tone = 'accent', className = '' }) => {
  const fill = {
    accent: 'bg-accent',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
  }[tone];

  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/[0.08] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${fill}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
};

/* ---------------------------------------------------------------- StatusDot */

export const StatusDot: React.FC<{
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  label: string;
  className?: string;
}> = ({ tone = 'success', label, className = '' }) => {
  const dot = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-white/30',
    accent: 'bg-accent',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

/* --------------------------------------------------------------- EmptyState */

export const EmptyState: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  className?: string;
}> = ({ icon: Icon, title, hint, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-hairline px-6 py-10 text-center ${className}`}
  >
    {Icon ? <Icon className="h-5 w-5 text-ink-dim" /> : null}
    <p className="font-mono text-[11px] text-ink-dim">{title}</p>
    {hint ? <p className="max-w-xs text-[11px] leading-snug text-ink-dim/70">{hint}</p> : null}
  </div>
);

/* ------------------------------------------------------------- Form fields */

export const Field: React.FC<{
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, children, className = '' }) => (
  <div className={className}>
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label className="label-micro">{label}</label>
      {hint ? <span className="font-mono text-[10px] text-ink-dim">{hint}</span> : null}
    </div>
    {children}
  </div>
);

export const inputClass =
  'w-full rounded-lg border border-hairline bg-void/70 px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink-dim/70 transition-colors hover:border-hairline-strong focus:border-accent/60 focus:outline-none';

/* ---------------------------------------------------------------- Segmented */

export const Segmented: React.FC<{
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ options, value, onChange, className = '' }) => (
  <div
    className={`inline-flex items-center gap-0.5 rounded-lg border border-hairline bg-void/60 p-0.5 ${className}`}
  >
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => onChange(opt.id)}
        className={`rounded-[6px] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
          value === opt.id
            ? 'bg-white/[0.09] text-ink'
            : 'text-ink-dim hover:text-ink-soft'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
