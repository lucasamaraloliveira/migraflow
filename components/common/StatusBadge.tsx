'use client';

import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  minimal?: boolean;
}

export default function StatusBadge({ status, minimal = false }: StatusBadgeProps) {
  const configs: Record<string, { label: string, color: string, bg: string, border: string, icon: any }> = {
    pendente: {
      label: 'Pendente',
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: Clock
    },
    em_progresso: {
      label: 'Em Execução',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: Clock
    },
    concluida: {
      label: 'Concluída',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: CheckCircle2
    },
    atrasada: {
      label: 'Atrasada',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      icon: AlertCircle
    },
    pausado: {
      label: 'Pausado',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: AlertCircle
    }
  };

  const config = configs[status] || configs.pendente;
  const Icon = config.icon;

  if (minimal) {
    return (
      <div className={`flex items-center gap-1.5 ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{config.label}</span>
    </div>
  );
}
