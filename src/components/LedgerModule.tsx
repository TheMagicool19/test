import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  FileSpreadsheet,
  Wallet,
  Zap,
} from 'lucide-react';
import { ExpenseItem, SystemTelemetry } from '../types/navicella';
import {
  PageShell,
  PageHeader,
  Panel,
  PanelHeader,
  StatTile,
  StatusDot,
  Progress,
  Field,
  inputClass,
} from './ui/Page';

interface LedgerModuleProps {
  telemetry: SystemTelemetry | null;
  onAddExpenseDirect: (exp: {
    amount: number;
    category: string;
    item: string;
    method: string;
  }) => Promise<any>;
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    date: '2026-11-01',
    amount: 45.0,
    currency: 'EUR',
    category: 'Accademia/CTF',
    item: 'Manuale Chimica Organica',
    method: 'Prepagata',
    status: 'APPENDED_SHEET',
    dnaStubCreated: true,
  },
  {
    id: 'exp-2',
    date: '2026-10-30',
    amount: 18.5,
    currency: 'EUR',
    category: 'Logistica/Trasporti',
    item: 'Ricarica Mensile Abbonamento Metro',
    method: 'Carta',
    status: 'APPENDED_SHEET',
    dnaStubCreated: false,
  },
  {
    id: 'exp-3',
    date: '2026-10-28',
    amount: 62.0,
    currency: 'EUR',
    category: 'Vitto/Ordinario',
    item: 'Spesa Alimentare Settimanale',
    method: 'Bancomat',
    status: 'APPENDED_SHEET',
    dnaStubCreated: false,
  },
  {
    id: 'exp-4',
    date: '2026-10-25',
    amount: 32.0,
    currency: 'EUR',
    category: 'Accademia/CTF',
    item: 'Camice Laboratorio & Occhiali DPI',
    method: 'Contanti',
    status: 'APPENDED_SHEET',
    dnaStubCreated: true,
  },
];

export const LedgerModule: React.FC<LedgerModuleProps> = ({
  telemetry,
  onAddExpenseDirect,
}) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [amount, setAmount] = useState<string>('45');
  const [item, setItem] = useState<string>('Manuale Chimica Organica');
  const [category, setCategory] = useState<string>('Accademia/CTF');
  const [method, setMethod] = useState<string>('Prepagata');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !item) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const numAmount = parseFloat(amount) || 0;
      await onAddExpenseDirect({ amount: numAmount, category, item, method });

      const isAcademic =
        category.toLowerCase().includes('ctf') ||
        category.toLowerCase().includes('accademia') ||
        item.toLowerCase().includes('chimica');

      const newEntry: ExpenseItem = {
        id: `exp-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: numAmount,
        currency: 'EUR',
        category,
        item,
        method,
        status: 'APPENDED_SHEET',
        dnaStubCreated: isAcademic,
      };

      setExpenses((prev) => [newEntry, ...prev]);
      setSuccessMsg(
        `Spesa di ${numAmount}€ registrata su Google Sheets${
          isAcademic ? ' · sub-routine D.N.A. triggerata' : ''
        }`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const balance = telemetry?.currentBalance ?? 6280;
  const runway = telemetry?.runwayMonths ?? 7.4;
  const spend = telemetry?.monthlySpend ?? 412;
  const budget = telemetry?.monthlyBudget ?? 850;
  const budgetUsedPct = budget > 0 ? (spend / budget) * 100 : 0;

  return (
    <PageShell>
      <PageHeader
        code="C-07 · L.E.D.G.E.R."
        title="Tesoreria & runway"
        description={
          <>
            Google Sheets come database relazionale leggero. N.I.C.O. invoca{' '}
            <span className="font-mono text-ink-soft">ledger_add_expense()</span> via Apps Script,
            appende la riga e ricalcola la runway residua in mesi di autonomia.
          </>
        }
        aside={<StatusDot label="Sheets connesso · GAS webhook" />}
      />

      {/* ---- KPI ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Runway residua"
          value={runway}
          unit="mesi"
          hint="Media mobile su 3 mesi"
          tone="accent"
        />
        <StatTile
          label="Liquidità attuale"
          value={balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          hint="Tesoreria & riserve"
        />
        <StatTile
          label="Spesa mese"
          value={`${spend.toFixed(2)} €`}
          hint={`Su budget di ${budget} €/mese`}
          tone="warning"
        />
        <StatTile
          label="Budget residuo"
          value={`${(budget - spend).toFixed(2)} €`}
          hint="Margine di sicurezza ok"
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="lg:col-span-4">
          <PanelHeader
            icon={Plus}
            label="Function call"
            title="Registra spesa"
            aside={
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-dim">
                ledger
              </span>
            }
          />

          <form onSubmit={handleAddExpense} className="mt-4 space-y-3.5">
            <Field label="Importo" hint="EUR">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="45.00"
              />
            </Field>

            <Field label="Descrizione">
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className={inputClass}
                placeholder="Manuale Chimica Organica"
              />
            </Field>

            <Field label="Categoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="Accademia/CTF">Accademia/CTF (triggera D.N.A.)</option>
                <option value="Logistica/Trasporti">Logistica / Trasporti</option>
                <option value="Vitto/Ordinario">Vitto / Ordinario</option>
                <option value="Hardware/Colab">Hardware / Colab GPU</option>
                <option value="Svago/Varie">Svago / Varie</option>
              </select>
            </Field>

            <Field label="Metodo di pagamento">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={inputClass}
              >
                <option value="Prepagata">Carta prepagata</option>
                <option value="Bancomat">Bancomat / Carta</option>
                <option value="Contanti">Contanti</option>
                <option value="Bonifico">Bonifico</option>
              </select>
            </Field>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Appendo riga…' : 'Esegui ledger_add_expense()'}
            </button>
          </form>

          {successMsg && (
            <div className="animate-fade-in mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3 font-mono text-[11px] leading-relaxed text-emerald-300/90">
              {successMsg}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-hairline bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-soft">
              <Zap className="h-3 w-3" />
              Sub-routine multi-modulo
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">
              Se la voce appartiene ad &laquo;Accademia/CTF&raquo;, un webhook crea automaticamente
              uno stub Markdown nel vault Obsidian (D.N.A.).
            </p>
          </div>
        </Panel>

        {/* ---- Tabella ---- */}
        <Panel className="lg:col-span-8 flex flex-col" flush>
          <div className="px-5 pt-5">
            <PanelHeader
              icon={FileSpreadsheet}
              label="Google Sheets"
              title="Foglio &laquo;uscite_navicella&raquo;"
              aside={
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">
                  A1:F{expenses.length + 1}
                </span>
              }
            />
          </div>

          <div className="mt-1 flex-1 overflow-x-auto px-2 pb-2">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {['Data', 'Voce', 'Categoria', 'Metodo', 'Importo', 'D.N.A.'].map((h, i) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-dim ${
                        i === 4 ? 'text-right' : i === 5 ? 'text-center' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {expenses.map((exp) => {
                  const isAcademic =
                    exp.category.includes('CTF') || exp.category.includes('Accademia');
                  return (
                    <tr key={exp.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-ink-dim">
                        {exp.date}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-medium text-ink">{exp.item}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ${
                            isAcademic
                              ? 'border-accent/30 bg-accent/10 text-accent-soft'
                              : 'border-hairline bg-white/[0.03] text-ink-dim'
                          }`}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-ink-dim">
                        {exp.method}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[12px] font-semibold text-ink">
                        {exp.amount.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {exp.dnaStubCreated ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <span className="font-mono text-[11px] text-ink-dim/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-hairline px-5 py-3">
            <div className="flex flex-1 items-center gap-2">
              <span className="label-micro shrink-0">Budget</span>
              <Progress value={budgetUsedPct} tone={budgetUsedPct > 85 ? 'danger' : 'accent'} />
              <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                {Math.round(budgetUsedPct)}%
              </span>
            </div>
            <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim sm:block">
              GAS trigger
            </span>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
};
