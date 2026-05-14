'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  HardDrive,
  FileText,
  CheckCircle2,
  Activity,
  Database,
  Calendar,
  Layers,
  Link2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LabelList
} from 'recharts';
import { parseNum } from '@/lib/utils';

interface MigrationSummaryPrintProps {
  migration: any;
  clientName: string;
  onClose: () => void;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function MigrationSummaryPrint({ migration, clientName, onClose }: MigrationSummaryPrintProps) {
  const allGroups = migration.groups || [];
  const allDisks = allGroups.flatMap((g: any) => g.disks || []);
  const allLaudos = allGroups.flatMap((g: any) => g.laudos || []);

  const summary = {
    totalPastas: migration.isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.totalPastas)))
      : allDisks.reduce((acc: number, d: any) => acc + parseNum(d.totalPastas), 0),
    pastasRealizadas: migration.isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas))))
      : allDisks.reduce((acc: number, d: any) => acc + Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas)), 0),
    estudosEnviados: migration.isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.estudos)))
      : allDisks.reduce((acc: number, d: any) => acc + parseNum(d.estudos), 0),
    storageMapeado: migration.isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.storageMapeado)))
      : allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0),
    storageEnviado: migration.isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.storageEnviado)))
      : allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0),
  };

  const totalLaudos = allLaudos.reduce((acc: number, l: any) => acc + parseNum(l.total), 0);
  const laudosRealizados = allLaudos.reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0);

  const progressoGlobal = summary.totalPastas > 0
    ? Math.min(100, Number(((summary.pastasRealizadas / summary.totalPastas) * 100).toFixed(1)))
    : 0;

  const progressoLaudos = totalLaudos > 0
    ? Math.min(100, Number(((laudosRealizados / totalLaudos) * 100).toFixed(1)))
    : 0;

  // Unified Groups Logic
  const groups = [...allGroups];
  const rootGroups = groups.filter(g => !g.linkedGroupId);
  const unifiedGroups = rootGroups.map(root => {
    const family = groups.filter(g => g.id === root.id || g.linkedGroupId === root.id);
    const combinedTitle = family.map(f => f.title).join(' + ');
    const combinedDisks = family.flatMap(f => f.disks || []);
    
    const tP = migration.isIncremental 
      ? Math.max(0, ...combinedDisks.map((d: any) => parseNum(d.totalPastas))) 
      : combinedDisks.reduce((acc: number, d: any) => acc + parseNum(d.totalPastas), 0);
    const rP = migration.isIncremental 
      ? Math.max(0, ...combinedDisks.map((d: any) => Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas)))) 
      : combinedDisks.reduce((acc: number, d: any) => acc + Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas)), 0);
    const storage = combinedDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0);
    const estudos = combinedDisks.reduce((acc: number, d: any) => acc + parseNum(d.estudos), 0);
    const progresso = tP > 0 ? Math.round((rP / tP) * 100) : 0;

    return {
      id: root.id,
      title: combinedTitle,
      totalPastas: tP,
      pastasRealizadas: rP,
      storageEnviado: storage,
      estudos: estudos,
      progresso,
      familySize: family.length
    };
  });

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-0 md:p-8" id="print-overlay">
        <div className="bg-white w-full h-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl md:max-h-[92vh] md:rounded-3xl shadow-2xl flex flex-col overflow-y-auto p-4 md:p-8 lg:p-10 relative print:p-0 print:shadow-none print:rounded-none print:w-full print:h-full print:max-h-none" id="print-area">
          {/* Header Controls */}
          <div className="absolute top-6 right-6 flex gap-2 no-print z-10">
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2"
            >
              Fechar
            </button>
          </div>

          <div className="w-full h-full flex flex-col gap-3 md:gap-4">
            {/* Branding & Title */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-[10px]">M</div>
                  <span className="text-slate-900 font-black text-sm uppercase tracking-tighter">MigraFlow Systems</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Resumo de Migração</h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px] mt-1.5">Relatório Executivo de Progressão de Dados</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 uppercase">{clientName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3 md:p-4 rounded-xl text-white shadow-xl flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Progresso</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-none">{progressoGlobal}%</h2>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-500" style={{ width: `${progressoGlobal}%` }} />
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 p-3 md:p-4 rounded-xl shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Estudos</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{summary.estudosEnviados.toLocaleString()}</h2>
                <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest">Sincronizados</p>
              </div>

              <div className="bg-white border-2 border-slate-100 p-3 md:p-4 rounded-xl shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-3 h-3 text-blue-600" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Volume</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{summary.storageEnviado.toFixed(1)}</h2>
                  <span className="text-[8px] font-black text-slate-300 uppercase">TB</span>
                </div>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Meta: {summary.storageMapeado.toFixed(1)} TB</p>
              </div>

              <div className="bg-white border-2 border-slate-100 p-3 md:p-4 rounded-xl shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Laudos</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{progressoLaudos}%</h2>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                  {laudosRealizados}/{totalLaudos} concluídos
                </p>
              </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 md:grid-cols-10 gap-3 md:gap-4 flex-1 min-h-0">
              {/* Left Column: Progress by Unit */}
              <div className="md:col-span-6 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 md:p-6 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 md:mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Distribuição por Unidade</h3>
                  </div>
                  <span className="text-[8px] font-black bg-white px-2 py-1 rounded border border-slate-200 text-slate-500 uppercase tracking-widest">
                    {unifiedGroups.length} Grupos Unificados
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={unifiedGroups}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      barSize={32}
                    >
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="title" type="category" hide />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black border border-slate-800 shadow-xl">
                                <p className="uppercase tracking-widest mb-1">{payload[0].payload.title}</p>
                                <p className="text-blue-400">{payload[0].value}% Concluído</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="progresso" radius={4} background={{ fill: '#f1f5f9', radius: 4 }}>
                        {unifiedGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.progresso === 100 ? '#10b981' : '#2563eb'} />
                        ))}
                        <LabelList
                          dataKey="title"
                          position="insideLeft"
                          offset={10}
                          content={(props: any) => {
                            const { x, y, value, index } = props;
                            const group = unifiedGroups[index];
                            return (
                              <g>
                                <text x={x} y={y - 8} fill="#64748b" fontSize={9} fontWeight="900" textAnchor="start" className="uppercase tracking-widest">
                                  {value} {group.familySize > 1 && <tspan fill="#3b82f6" fontSize={8}> (UNIFICADO)</tspan>}
                                </text>
                                <text x={x + 10} y={y + 20} fill="#fff" fontSize={11} fontWeight="900" textAnchor="start">
                                  {group.progresso}%
                                </text>
                              </g>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Volumetrics */}
              <div className="md:col-span-4 flex flex-col gap-3 md:gap-4 min-h-0">
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 md:p-4 flex-1 flex flex-col min-h-0 relative">
                  <h3 className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2 shrink-0 text-center">Status da Volumetria</h3>
                  <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative py-2">
                    <div className="relative w-full max-w-[140px] aspect-square shrink-0 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={unifiedGroups.map(g => ({ name: g.title, value: g.storageEnviado }))}
                            innerRadius="75%"
                            outerRadius="100%"
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {unifiedGroups.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none w-full">
                        <span className="text-xl md:text-2xl font-black text-slate-900 leading-none tracking-tighter">{progressoGlobal}%</span>
                        <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Global</span>
                      </div>
                    </div>

                    <div className="mt-3 w-full border-t border-slate-50 pt-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      <div className="flex flex-col gap-1">
                        {unifiedGroups.map((group, idx: number) => (
                          <div key={idx} className="flex flex-col gap-1 py-2 border-b border-slate-50 last:border-0">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-900 font-black text-[10px] md:text-[11px] uppercase leading-tight truncate">{group.title}</span>
                                  {group.familySize > 1 && <Link2 className="w-2.5 h-2.5 text-blue-500 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-nowrap whitespace-nowrap">
                                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Vol: {group.storageEnviado.toFixed(1)} TB</span>
                                  <span className="text-slate-200 text-[8px]">•</span>
                                  <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Est: {group.estudos.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black">
                                    {group.progresso}%
                                  </span>
                                </div>
                                <span className="text-slate-400 text-[7px] font-black uppercase tracking-widest mt-1">{group.pastasRealizadas.toLocaleString()} / {group.totalPastas.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-4 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 blur-3xl rounded-full -mr-8 -mt-8" />
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <h3 className="text-[7px] font-black uppercase tracking-widest">Previsão</h3>
                  </div>
                  <p className="text-lg font-black tracking-tighter leading-none">
                    {migration.endDate?.split('-').reverse().join('/') || 'Análise'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[8px] font-black uppercase tracking-widest text-blue-400">
                      {migration.status === 'concluida' ? 'Concluído' : 'Em Progresso'}
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Meta de Entrega</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Detail */}
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4 border-t border-slate-100 shrink-0">
              <span>MigraFlow IA Executive Report</span>
              <div className="flex items-center gap-6">
                <span>SECURED AES-256</span>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DADOS VALIDADOS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 1.2cm !important;
            visibility: visible !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
          }
          .custom-scrollbar {
            overflow: visible !important;
            max-height: none !important;
          }
          .no-print {
            display: none !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
        }
      `}</style>
    </>
  );
}
