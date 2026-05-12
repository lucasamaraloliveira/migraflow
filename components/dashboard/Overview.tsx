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
  LabelList 
} from 'recharts';
import StatusBadge from '@/components/common/StatusBadge';
import { getClientName } from '@/lib/utils';

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
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] md:h-[350px] flex flex-col overflow-hidden">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Volumetria por Cliente (Estudos vs Pastas)
          </h3>
          <div className="flex-1 min-h-[300px]">
            {/* Desktop Chart: Vertical Bars */}
            <div className="hidden md:block h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    stroke="#94a3b8"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const label = name === 'volume' ? 'Volume' :
                        name === 'estudos' ? 'Estudos' :
                          name === 'pastas' ? 'Pastas' : name;
                      const unit = name === 'volume' ? ' TB' : '';
                      return [`${value?.toLocaleString() || '0'}${unit}`, label];
                    }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="estudos" fill="#2563eb" radius={[4, 4, 0, 0]} name="Estudos">
                    <LabelList dataKey="estudos" position="top" formatter={(v: any) => v.toLocaleString()} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#1e293b' }} />
                  </Bar>
                  <Bar dataKey="pastas" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Pastas">
                    <LabelList dataKey="pastas" position="top" formatter={(v: any) => v.toLocaleString()} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile Chart: Horizontal Bars for better legibility */}
            <div className="md:hidden h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={8}
                    stroke="#94a3b8"
                    width={90}
                    tick={{ fontWeight: 'bold' }}
                    interval={0}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const label = name === 'estudos' ? 'Estudos' : 'Pastas';
                      return [`${value?.toLocaleString() || '0'}`, label];
                    }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Bar dataKey="estudos" fill="#2563eb" radius={[0, 4, 4, 0]} name="Estudos" />
                  <Bar dataKey="pastas" fill="#94a3b8" radius={[0, 4, 4, 0]} name="Pastas" />
                </BarChart>
              </ResponsiveContainer>
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
