import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Send,
  Database,
  Atom,
  Flame,
  Calendar,
  HeartPulse,
  Wallet,
  FileCode2,
} from 'lucide-react';
import { CompartmentId } from '../types/navicella';
import { sound } from '../services/soundFx';

interface ModuleNavProps {
  activeModule: CompartmentId;
  onSelectModule: (module: CompartmentId) => void;
  faradayBattery: number;
}

interface NavItem {
  id: CompartmentId;
  /** Sigla mostrata nella tab */
  code: string;
  /** Nome esteso, usato come tooltip */
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'bridge',
    code: 'Dashboard',
    name: 'Overview Generale',
    icon: LayoutDashboard,
  },
  {
    id: 'nico-ermes',
    code: 'E.R.M.E.S.',
    name: 'Orchestratore & Gateway Telegram',
    icon: Send,
  },
  {
    id: 'dna',
    code: 'D.N.A.',
    name: 'Knowledge Vault & RAG',
    icon: Database,
  },
  {
    id: 'lewis',
    code: 'L.E.W.I.S.',
    name: 'Reattore Chimica CTF & Feynman',
    icon: Atom,
  },
  {
    id: 'forge',
    code: 'F.O.R.G.E.',
    name: 'Cluster R&D & GPU',
    icon: Flame,
  },
  {
    id: 'route',
    code: 'R.O.U.T.E.',
    name: 'Turni & Timeboxing',
    icon: Calendar,
  },
  {
    id: 'faraday',
    code: 'F.A.R.A.D.A.Y.',
    name: 'Bio-Stato & Prevenzione Burnout',
    icon: HeartPulse,
  },
  {
    id: 'ledger',
    code: 'L.E.D.G.E.R.',
    name: 'Tesoreria & Runway',
    icon: Wallet,
  },
  {
    id: 'architecture',
    code: 'Roadmap',
    name: 'Specifiche Tecniche & Roadmap Fasi 1-4',
    icon: FileCode2,
  },
];

export const ModuleNav: React.FC<ModuleNavProps> = ({
  activeModule,
  onSelectModule,
  faradayBattery,
}) => {
  const handleSelect = (id: CompartmentId) => {
    sound.playClick();
    onSelectModule(id);
  };

  return (
    <nav
      aria-label="Compartimenti di sistema"
      className="relative border-b border-hairline bg-panel"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="no-scrollbar flex items-stretch gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const showBadge = item.id === 'faraday' && faradayBattery < 20;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.name}
                className={`group relative flex shrink-0 items-center gap-2 px-3 py-3 text-[12px] font-medium transition-colors duration-150 outline-none ${
                  isActive
                    ? 'text-ink'
                    : 'text-ink-dim hover:text-ink-soft'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 transition-colors duration-150 ${
                    isActive
                      ? 'text-accent-soft'
                      : 'text-ink-dim/80 group-hover:text-ink-soft'
                  }`}
                />
                <span className="whitespace-nowrap font-mono text-[11px] font-semibold tracking-[0.02em]">
                  {item.code}
                </span>

                {showBadge && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_6px_1px_rgba(244,63,94,0.6)]" />
                )}

                {/* Indicatore attivo: unico elemento accent della barra */}
                {isActive && (
                  <motion.span
                    layoutId="module-nav-indicator"
                    className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-accent shadow-[0_0_12px_1px_rgba(126,107,242,0.55)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
