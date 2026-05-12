'use client';

import React from 'react';
import {
  BarChart3,
  HardDrive,
  FileText,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowUpRight
} from 'lucide-react';

interface ReportsViewProps {
  migrations: any[];
  onGenerateIncidencesReport: () => void;
  onGenerateHandoffReport: () => void;
  onGenerateExecutiveReport: () => void;
  onGenerateInventoryReport: () => void;
  onGenerateLaudosReport: () => void;
  onGenerateStorageReport: () => void;
  onGenerateDensityReport: () => void;
}

export default function ReportsView({
  migrations,
  onGenerateIncidencesReport,
  onGenerateHandoffReport,
  onGenerateExecutiveReport,
  onGenerateInventoryReport,
  onGenerateLaudosReport,
  onGenerateStorageReport,
  onGenerateDensityReport
}: ReportsViewProps) {
  const reports = [
    {
      title: "Resumo Executivo Estratégico",
      desc: "Indicadores macro de progresso global, volumetria total e status das unidades.",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
      action: "Exportar XLSX",
      onClick: onGenerateExecutiveReport
    },
    {
      title: "Inventário de Discos e Storage",
      desc: "Relatório técnico detalhado por unidade, disco e ponto de montagem.",
      icon: HardDrive,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      action: "Exportar XLSX",
      onClick: onGenerateInventoryReport
    },
    {
      title: "Evolução de Laudos Clínicos",
      desc: "Acompanhamento de migração de laudos, PDFs e relatórios clínicos.",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
      action: "Exportar XLSX",
      onClick: onGenerateLaudosReport
    },
    {
      title: "Relatório de Incidências",
      desc: "Log detalhado de erros, interrupções e falhas reportadas durante o processo.",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      action: "Baixar Relatório",
      onClick: onGenerateIncidencesReport
    },
    {
      title: "Checklist de Entrega (Hand-off)",
      desc: "Documento de validação de conclusão para unidades com 100% de migração.",
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      action: "Gerar Relatório",
      onClick: onGenerateHandoffReport
    },
    {
      title: "Análise de Densidade e Eficiência",
      desc: "Estudo de compressão e média de storage por estudo entre diferentes unidades.",
      icon: Database,
      color: "text-slate-600",
      bg: "bg-slate-50",
      action: "Exportar CSV",
      onClick: onGenerateDensityReport
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Centro de Inteligência e Exportação</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Selecione um dos modelos de relatório abaixo para extrair informações estruturadas da sua base de migração.
            Todos os relatórios são gerados em tempo real com base nos dados mais recentes do MigraFlow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-xl ${report.bg}`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(dot => <div key={dot} className="w-1 h-1 rounded-full bg-slate-200" />)}
              </div>
            </div>

            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
              {report.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 flex-1">
              {report.desc}
            </p>

            <button
              onClick={report.onClick}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-100 hover:border-slate-900 flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {report.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
