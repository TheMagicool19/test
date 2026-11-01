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
  FileCode2 
} from 'lucide-react';
import { CompartmentId } from '../types/navicella';
import { sound } from '../services/soundFx';

interface ModuleNavProps {
  activeModule: CompartmentId;
  onSelectModule: (module: CompartmentId) => void;
  faradayBattery: number;
}

export const ModuleNav: React.FC<ModuleNavProps> = ({ 
  activeModule, 
  onSelectModule, 
  faradayBattery 
}) => {
  const navItems = [
    {
      id: 'bridge' as CompartmentId,
      code: 'DASHBOARD',
      name: 'Overview Generale',
      icon: LayoutDashboard,
      activeBg: 'bg-indigo-600',
      activeText: 'text-white',
      borderColor: 'border-indigo-500',
      accentColor: 'text-indigo-400',
    },
    {
      id: 'nico-ermes' as CompartmentId,
      code: 'C-01: E.R.M.E.S.',
      name: 'Orchestratore & Telegram',
      icon: Send,
      activeBg: 'bg-sky-600',
      activeText: 'text-white',
      borderColor: 'border-sky-500',
      accentColor: 'text-sky-400',
    },
    {
      id: 'dna' as CompartmentId,
      code: 'C-02: D.N.A.',
      name: 'Vault Obsidian & RAG',
      icon: Database,
      activeBg: 'bg-emerald-600',
      activeText: 'text-white',
      borderColor: 'border-emerald-500',
      accentColor: 'text-emerald-400',
    },
    {
      id: 'lewis' as CompartmentId,
      code: 'C-03: L.E.W.I.S.',
      name: 'Chimica CTF & Feynman',
      icon: Atom,
      activeBg: 'bg-purple-600',
      activeText: 'text-white',
      borderColor: 'border-purple-500',
      accentColor: 'text-purple-400',
    },
    {
      id: 'forge' as CompartmentId,
      code: 'C-04: F.O.R.G.E.',
      name: 'Cluster R&D & GPU',
      icon: Flame,
      activeBg: 'bg-orange-600',
      activeText: 'text-white',
      borderColor: 'border-orange-500',
      accentColor: 'text-orange-400',
    },
    {
      id: 'route' as CompartmentId,
      code: 'C-05: R.O.U.T.E.',
      name: 'Turni & Timeboxing',
      icon: Calendar,
      activeBg: 'bg-blue-600',
      activeText: 'text-white',
      borderColor: 'border-blue-500',
      accentColor: 'text-blue-400',
    },
    {
      id: 'faraday' as CompartmentId,
      code: 'C-06: F.A.R.A.D.A.Y.',
      name: 'Bio-Stato & Benessere',
      icon: HeartPulse,
      activeBg: 'bg-rose-600',
      activeText: 'text-white',
      borderColor: 'border-rose-500',
      accentColor: 'text-rose-400',
      badge: faradayBattery < 20 ? 'OVERRIDE' : undefined,
    },
    {
      id: 'ledger' as CompartmentId,
      code: 'C-07: L.E.D.G.E.R.',
      name: 'Tesoreria & Runway',
      icon: Wallet,
      activeBg: 'bg-amber-600',
      activeText: 'text-white',
      borderColor: 'border-amber-500',
      accentColor: 'text-amber-400',
    },
    {
      id: 'architecture' as CompartmentId,
      code: 'DOCUMENTAZIONE',
      name: 'Specifiche & Roadmap',
      icon: FileCode2,
      activeBg: 'bg-teal-600',
      activeText: 'text-white',
      borderColor: 'border-teal-500',
      accentColor: 'text-teal-400',
    },
  ];

  const handleSelect = (id: CompartmentId) => {
    sound.playClick();
    onSelectModule(id);
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900/90 px-3 py-2 overflow-x-auto scrollbar-none z-30">
      <div className="flex items-center gap-2 min-w-max max-w-7xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 outline-none border ${
                isActive
                  ? `${item.activeBg} text-white ${item.borderColor} shadow-md font-bold`
                  : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
            >
              {/* Icon */}
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? 'text-white' : item.accentColor
              }`} />

              {/* Text */}
              <div className="text-left">
                <div className={`text-[9px] uppercase tracking-wider font-mono ${
                  isActive ? 'text-white/80' : 'text-slate-400'
                }`}>
                  {item.code}
                </div>
                <div className={`leading-tight text-xs font-sans ${
                  isActive ? 'text-white font-bold' : 'text-slate-200'
                }`}>
                  {item.name}
                </div>
              </div>

              {/* Alert Badge */}
              {item.badge && (
                <span className="ml-1 text-[9px] px-2 py-0.5 rounded-full bg-white text-rose-700 font-bold font-mono shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
