'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LabelList,
  Treemap
} from 'recharts';
import StatusBadge from '@/components/common/StatusBadge';
import { getClientName, getAllDisks } from '@/lib/utils';

interface OverviewProps {
  stats: any[];
  chartData: any[];
  statusData: any[];
  migrations: any[];
  clients: any[];
  setActiveTab: (tab: any) => void;
  setSelectedMigrationId: (id: string | null) => void;
}

export default function Overview({
  stats,
  chartData,
  statusData,
  migrations,
  clients,
  setActiveTab,
  setSelectedMigrationId
}: OverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${stat.bg.replace('bg-', 'bg-')}`} style={{ backgroundColor: 'currentColor' }} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{String(stat.value).padStart(2, '0')}</h3>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Volumetria Global por Cliente (Ranking)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
            {/* Column 1: First Half */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData.slice(0, Math.ceil(chartData.length / 2))}
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={9}
                    stroke="#94a3b8"
                    width={75}
                    tick={{ fontWeight: 'bold' }}
                    interval={0}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 12) + '...' : val}
                  />
                  <Tooltip
                    formatter={(v: any, n: any) => [v.toLocaleString(), n === 'estudos' ? 'Estudos' : n === 'pastas' ? 'Pastas' : 'Laudos']}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="estudos" fill="#2563eb" radius={[0, 2, 2, 0]} barSize={10} />
                  <Bar dataKey="laudos" fill="#f59e0b" radius={[0, 2, 2, 0]} barSize={6} />
                  <Bar dataKey="pastas" fill="#cbd5e1" radius={[0, 2, 2, 0]} barSize={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Column 2: Second Half */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData.slice(Math.ceil(chartData.length / 2))}
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={9}
                    stroke="#94a3b8"
                    width={75}
                    tick={{ fontWeight: 'bold' }}
                    interval={0}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 12) + '...' : val}
                  />
                  <Tooltip
                    formatter={(v: any, n: any) => [v.toLocaleString(), n === 'estudos' ? 'Estudos' : n === 'pastas' ? 'Pastas' : 'Laudos']}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="estudos" fill="#2563eb" radius={[0, 2, 2, 0]} barSize={10} />
                  <Bar dataKey="laudos" fill="#f59e0b" radius={[0, 2, 2, 0]} barSize={6} />
                  <Bar dataKey="pastas" fill="#cbd5e1" radius={[0, 2, 2, 0]} barSize={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Estudos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Laudos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 rounded-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pastas</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[350px] flex flex-col">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            Status das Migrações
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-bold text-slate-600">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Eficiência de Storage Global (Mapeado vs Enviado)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
            {/* Column 1: First Half */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData.slice(0, Math.ceil(chartData.length / 2))}
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={9}
                    stroke="#94a3b8"
                    width={75}
                    tick={{ fontWeight: 'bold' }}
                    interval={0}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 12) + '...' : val}
                  />
                  <Tooltip
                    formatter={(v: any, n: any) => [`${(Number(v) || 0).toFixed(1)} TB`, n === 'volume' ? 'Mapeado' : 'Enviado']}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="volume" fill="#e2e8f0" radius={[0, 2, 2, 0]} barSize={10} />
                  <Bar dataKey="enviado" fill="#10b981" radius={[0, 2, 2, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Column 2: Second Half */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData.slice(Math.ceil(chartData.length / 2))}
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={9}
                    stroke="#94a3b8"
                    width={75}
                    tick={{ fontWeight: 'bold' }}
                    interval={0}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 12) + '...' : val}
                  />
                  <Tooltip
                    formatter={(v: any, n: any) => [`${(Number(v) || 0).toFixed(1)} TB`, n === 'volume' ? 'Mapeado' : 'Enviado']}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="volume" fill="#e2e8f0" radius={[0, 2, 2, 0]} barSize={10} />
                  <Bar dataKey="enviado" fill="#10b981" radius={[0, 2, 2, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-200 rounded-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Mapeado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Enviado</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[350px] flex flex-col">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Severidade de Incidências
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Urgente', value: migrations.reduce((acc, m) => acc + getAllDisks(m).filter((d: any) => d.comment?.severity === 'urgente').length, 0), color: '#e11d48' },
                    { name: 'Alta', value: migrations.reduce((acc, m) => acc + getAllDisks(m).filter((d: any) => d.comment?.severity === 'alta').length, 0), color: '#f43f5e' },
                    { name: 'Média', value: migrations.reduce((acc, m) => acc + getAllDisks(m).filter((d: any) => d.comment?.severity === 'media').length, 0), color: '#f59e0b' },
                    { name: 'Baixa', value: migrations.reduce((acc, m) => acc + getAllDisks(m).filter((d: any) => d.comment?.severity === 'baixa').length, 0), color: '#3b82f6' },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { color: '#e11d48' },
                    { color: '#f43f5e' },
                    { color: '#f59e0b' },
                    { color: '#3b82f6' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1">
            {[
              { name: 'Urgente', color: '#e11d48' },
              { name: 'Alta', color: '#f43f5e' },
              { name: 'Média', color: '#f59e0b' },
              { name: 'Baixa', color: '#3b82f6' },
            ].map((s, i) => {
              const count = migrations.reduce((acc, m) => acc + getAllDisks(m).filter((d: any) => d.comment?.severity === s.name.toLowerCase()).length, 0);
              if (count === 0) return null;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tables / Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[480px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Migrações Recentes</h3>
            <button onClick={() => setActiveTab('migrations')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Ver Fluxo Completo</button>
          </div>
          <div className="overflow-y-auto flex-1 h-full">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100 font-black">
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {migrations.slice(0, 8).map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">{getClientName(m, clients)}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">REF-{m.id?.slice(-4)}</div>
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => setSelectedMigrationId(m.id || null)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-blue-600 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {migrations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">Aguardando dados...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[480px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Novos Parceiros</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {clients.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{c.name}</p>
                  <p className="text-[10px] text-slate-500 truncate italic">{c.company}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all" />
              </div>
            ))}
            {clients.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-20 font-bold uppercase tracking-widest italic opacity-50">Base vazia</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
