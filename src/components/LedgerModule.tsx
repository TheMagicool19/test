import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Tag, 
  CreditCard,
  DollarSign
} from 'lucide-react';
import { ExpenseItem, SystemTelemetry } from '../types/navicella';

interface LedgerModuleProps {
  telemetry: SystemTelemetry | null;
  onAddExpenseDirect: (exp: { amount: number; category: string; item: string; method: string }) => Promise<any>;
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
      await onAddExpenseDirect({
        amount: numAmount,
        category,
        item,
        method,
      });

      const isAcademic = category.toLowerCase().includes('ctf') || category.toLowerCase().includes('accademia') || item.toLowerCase().includes('chimica');
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
      setSuccessMsg(`Spesa di ${numAmount}€ registrata con successo su Google Sheets!${isAcademic ? ' (Sub-routine D.N.A. triggerata!)' : ''}`);
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
              C-07: L.E.D.G.E.R. (TESORERIA & RUNWAY)
            </span>
            <span className="text-xs font-mono text-slate-400">
              GOOGLE SHEETS API &bull; GAS SCRIPT &bull; RUNWAY CALCULATION
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            L.E.D.G.E.R. FINANCIAL ENGINE & RUNWAY
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Usa Google Sheets come DB relazionale leggero. N.I.C.O. invoca <code className="text-amber-400 font-mono">ledger_add_expense()</code> 
            tramite Google Apps Script (GAS), appende la riga e ricalcola la Runway residua (mesi di autonomia).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-800">
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Foglio Google: Connesso &bull; GAS Webhook</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">RUNWAY FINANZIARIA RESIDUA</div>
          <div className="text-2xl font-extrabold text-amber-400">
            {runway} <span className="text-xs font-normal text-slate-400">mesi</span>
          </div>
          <div className="text-[10px] text-emerald-400">Calcolata su medie mobili 3M</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">LIQUIDITÀ ATTUALE</div>
          <div className="text-2xl font-extrabold text-white">
            {balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </div>
          <div className="text-[10px] text-slate-400">Tesoreria & Riserve</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">SPESA MESE CORRENTE</div>
          <div className="text-2xl font-extrabold text-cyan-400">
            {spend.toFixed(2)} €
          </div>
          <div className="text-[10px] text-slate-400">Su budget di {budget} €/mese</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 font-mono text-xs space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">BUDGET RESIDUO</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {(budget - spend).toFixed(2)} €
          </div>
          <div className="text-[10px] text-slate-400">Margine di sicurezza OK</div>
        </div>
      </div>

      {/* Grid: Manual Expense Form & Google Sheets Transaction Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (4 cols): Function Calling Direct Form */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold font-mono text-slate-100 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> REGISTRA SPESA RAPIDA
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              FUNCTION CALL
            </span>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Importo Speso (€):
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                placeholder="45.00"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Descrizione Voce:
              </label>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                placeholder="Manuale Chimica Organica"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Categoria:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Accademia/CTF">Accademia/CTF (Triggera D.N.A.!)</option>
                <option value="Logistica/Trasporti">Logistica / Trasporti</option>
                <option value="Vitto/Ordinario">Vitto / Ordinario</option>
                <option value="Hardware/Colab">Hardware / Colab GPU</option>
                <option value="Svago/Varie">Svago / Varie</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Metodo di Pagamento:
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Prepagata">Carta Prepagata</option>
                <option value="Bancomat">Bancomat / Carta</option>
                <option value="Contanti">Contanti</option>
                <option value="Bonifico">Bonifico</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {isSubmitting ? 'Appendo riga...' : 'Esegui ledger_add_expense()'}
            </button>
          </form>

          {successMsg && (
            <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
              {successMsg}
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-sans space-y-1">
            <span className="font-bold text-amber-400 font-mono">⚡ Multi-Module Subroutine:</span>
            <p>
              Se la voce appartiene a "Accademia/CTF", un webhook triggera automaticamente la creazione di un nuovo stub Markdown nel Vault Obsidian (D.N.A.).
            </p>
          </div>
        </div>

        {/* Right Col (8 cols): Google Sheets Simulator Table */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-bold font-mono text-slate-100 text-sm">
                  GOOGLE SHEETS: FOGLIO "USCITE_NAVICELLA"
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Range: A1:F{expenses.length + 1}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px] uppercase">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Voce / Descrizione</th>
                    <th className="py-2 px-3">Categoria</th>
                    <th className="py-2 px-3">Metodo</th>
                    <th className="py-2 px-3 text-right">Importo</th>
                    <th className="py-2 px-3 text-center">D.N.A. Stub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{exp.date}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-200">
                        {exp.item}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          exp.category.includes('CTF') || exp.category.includes('Accademia')
                            ? 'bg-violet-950/80 text-violet-300 border border-violet-800'
                            : 'bg-slate-900 text-slate-400'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{exp.method}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                        {exp.amount.toFixed(2)} €
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {exp.dnaStubCreated ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CREATO
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Aggiornato tramite Google Apps Script (GAS) Trigger</span>
            <span>Tabelle Pivot Nascoste: Ricalcolate in background</span>
          </div>
        </div>
      </div>
    </div>
  );
};
