'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard, useAuth } from '@/components/auth-provider';
import Image from 'next/image';
import {
  Users,
  BarChart3,
  LogOut,
  Plus,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Send,
  X,
  FileUp,
  HardDrive,
  Database,
  ArrowUpRight,
  Trash2,
  Settings2,
  Sparkles,
  Edit2,
  User,
  ArrowDownAZ,
  ArrowUpAZ,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useClients, useMigrations, Disk, DiskGroup } from '@/hooks/use-firestore';
import { format } from 'date-fns';
// Removed client-side GoogleGenAI import for security
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
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList
} from 'recharts';

// Componente de Input com Máscara Numérica
function NumericInput({ value, onChange, isFloat = false, className, readOnly, placeholder }: { value: number, onChange: (v: number) => void, isFloat?: boolean, className?: string, readOnly?: boolean, placeholder?: string }) {
  const [display, setDisplay] = React.useState('');

  React.useEffect(() => {
    if (isFloat) {
      setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setDisplay(value.toLocaleString('pt-BR'));
    }
  }, [value, isFloat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const raw = e.target.value;

    if (isFloat) {
      const clean = raw.replace(/[^\d,]/g, '');
      setDisplay(clean);
      const num = parseFloat(clean.replace(',', '.')) || 0;
      onChange(num);
    } else {
      const clean = raw.replace(/\D/g, '');
      setDisplay(clean ? Number(clean).toLocaleString('pt-BR') : '');
      onChange(Number(clean) || 0);
    }
  };

  const handleBlur = () => {
    if (isFloat) {
      setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setDisplay(value.toLocaleString('pt-BR'));
    }
  };

  return (
    <input
      type="text"
      className={className}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );
}

// AI initialization removed from client side for security.
// Calls are now routed through /api/ai

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, isGuest, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'migrations'>('overview');
  const { clients, addClient, deleteClient, updateClient } = useClients();
  const { migrations, addMigration, updateMigration, deleteMigration } = useMigrations();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

  const getClientName = (m: any) => {
    const client = clients.find(c => c.id === m.clientId);
    return client?.name || m.clientName || "Cliente Indefinido";
  };

  // Stats
  const stats = [
    { label: 'Total de Clientes', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Migrações Ativas', value: migrations.filter(m => m.status !== 'concluida').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Concluídas', value: migrations.filter(m => m.status === 'concluida').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Atrasadas', value: migrations.filter(m => m.status === 'atrasada').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  // Chart Data Preparation
  // Chart Data Preparation - Aggregated by Client
  const aggregatedData = migrations.reduce((acc: any, m) => {
    const rawName = getClientName(m);
    const clientName = rawName ? rawName.trim() : "Cliente Indefinido";

    const allDisks = [
      ...(m.disks || []),
      ...(m.groups?.flatMap(g => g.disks || []) || [])
    ];

    const studies = allDisks.reduce((sum, d) => sum + (Number(d.estudos) || 0), 0);
    // Sum totalPastas, but if not available, sum pastasRealizadas to ensure SOMETHING shows up if data exists
    const folders = allDisks.reduce((sum, d) => {
      const total = Number(d.totalPastas) || 0;
      const realized = Number(d.pastasRealizadas) || 0;
      return sum + (total > 0 ? total : realized);
    }, 0);
    const volume = allDisks.reduce((sum, d) => sum + (Number(d.storageMapeado) || 0), 0);

    if (!acc[clientName]) {
      acc[clientName] = { name: clientName, estudos: 0, pastas: 0, volume: 0 };
    }

    acc[clientName].estudos += studies;
    acc[clientName].pastas += folders;
    acc[clientName].volume += volume;

    return acc;
  }, {});

  const chartData = Object.values(aggregatedData);

  const statusData = [
    { name: 'Pendente', value: migrations.filter(m => m.status === 'pendente').length, color: '#94a3b8' },
    { name: 'Execução', value: migrations.filter(m => m.status === 'em_progresso').length, color: '#2563eb' },
    { name: 'Pausado', value: migrations.filter(m => m.status === 'pausado').length, color: '#f43f5e' },
    { name: 'Concluída', value: migrations.filter(m => m.status === 'concluida').length, color: '#10b981' },
    { name: 'Atrasada', value: migrations.filter(m => m.status === 'atrasada').length, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const selectedMigration = migrations.find(m => m.id === selectedMigrationId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-[100px]' : 'w-72'} bg-slate-900 flex-col border-r border-slate-800 shadow-2xl z-20 transition-all duration-500 ease-in-out relative`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 overflow-hidden min-h-[80px]">
          <div className="min-w-[32px] w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shrink-0">M</div>
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-bold text-lg tracking-tight font-display whitespace-nowrap"
            >
              MigraFlow
            </motion.span>
          )}
        </div>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-blue-600 border border-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-all z-30 shadow-[0_0_15px_rgba(37,99,235,0.4)] group/toggle"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3 h-3 transition-transform group-hover/toggle:scale-110" /> : <ChevronLeft className="w-3 h-3 transition-transform group-hover/toggle:scale-110" />}
        </button>

        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-x-hidden">
          <SidebarLink
            icon={BarChart3}
            label="Visão Geral"
            active={activeTab === 'overview'}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setActiveTab('overview'); setSelectedMigrationId(null); }}
          />
          <SidebarLink
            icon={Users}
            label="Clientes"
            active={activeTab === 'clients'}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setActiveTab('clients'); setSelectedMigrationId(null); }}
          />
          <SidebarLink
            icon={FileUp}
            label="Migrações"
            active={activeTab === 'migrations'}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30 relative">
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute bottom-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 ${isSidebarCollapsed ? 'left-4 w-48' : 'left-4 right-4'
                  }`}
              >
                <div className="p-3 border-b border-slate-700 flex flex-col bg-slate-900/50">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">{user?.displayName}</span>
                  <span className="text-[9px] text-slate-500 font-mono truncate">{user?.email || 'visitante@fluxo.com'}</span>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Sair do Sistema</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center transition-all duration-300 w-full rounded-2xl p-2 ${isSidebarCollapsed ? 'justify-center' : 'gap-4 px-3'
              } ${isProfileMenuOpen ? 'bg-slate-800 shadow-inner' : 'hover:bg-slate-800/50'}`}
          >
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="User"
                  width={32}
                  height={32}
                  className="rounded-full border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                  {user?.displayName?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-black truncate text-white uppercase tracking-wider">{user?.displayName}</p>
                <p className="text-[9px] text-slate-500 truncate lowercase font-mono">conectado</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative pb-20 md:pb-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-6 flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
              {selectedMigration ? `Detalhamento: ${getClientName(selectedMigration)}` : (
                activeTab === 'overview' ? 'Painel de Monitoramento' :
                  activeTab === 'clients' ? 'Gestão de Clientes' : 'Projetos de Migração'
              )}
            </h2>
            <p className="hidden md:block text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
              {selectedMigration ? 'Análise granular de discos e volumetria' : (
                activeTab === 'overview' ? 'Migração de Dados e Infraestrutura' :
                  activeTab === 'clients' ? 'Controle de Base de Atendimento' : 'Acompanhamento de Fluxo Crítico'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedMigration && (
              <button
                onClick={() => setSelectedMigrationId(null)}
                className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 px-3 py-2 transition-colors border border-slate-200 rounded-lg flex items-center justify-center whitespace-nowrap"
              >
                Voltar
              </button>
            )}
            {activeTab === 'clients' && !isGuest && (
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 md:px-6 py-2 md:py-2 rounded-lg md:rounded-md text-[10px] md:text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm uppercase tracking-tight whitespace-nowrap"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Novo</span> Cliente
              </button>
            )}
            {activeTab === 'migrations' && !selectedMigration && !isGuest && (
              <button
                onClick={() => setIsMigrationModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 md:px-6 py-2 md:py-2 rounded-lg md:rounded-md text-[10px] md:text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm uppercase tracking-tight whitespace-nowrap"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Nova</span> Migração
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selectedMigration ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MigrationDetails
                  migration={selectedMigration}
                  isGuest={isGuest}
                  onUpdate={(data) => updateMigration(selectedMigration.id!, data)}
                />
              </motion.div>
            ) : activeTab === 'overview' && (
              <motion.div
                key="overview"
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
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[350px] flex flex-col">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Volumetria por Cliente (Estudos vs Pastas)
                    </h3>
                    <div className="flex-1">
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
                                <div className="font-bold text-slate-900">{getClientName(m)}</div>
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
            )}

            {activeTab === 'clients' && (
              <motion.div
                key="clients"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Mobile Card Layout for Clients */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {clients.map((client) => (
                    <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all active:scale-[0.98]">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{client.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{client.company}</p>
                          </div>
                        </div>
                        {!isGuest && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setClientToEdit(client);
                                setIsClientModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id!)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] font-medium text-slate-500 border-t border-slate-50 pt-3">
                        <div className="flex justify-between">
                          <span className="uppercase tracking-widest opacity-60">Contato:</span>
                          <span className="text-slate-900">{client.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="uppercase tracking-widest opacity-60">Cadastro:</span>
                          <span className="text-slate-900">{client.createdAt?.seconds ? format(new Date(client.createdAt.seconds * 1000), 'dd/MM/yyyy') : '...'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View for Clients */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                        <th className="px-6 py-4">Cliente / Empresa</th>
                        <th className="px-6 py-4">Contato</th>
                        <th className="px-6 py-4">Data de Cadastro</th>
                        <th className="px-6 py-4 text-right pr-12">Operação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs shadow-inner">
                                {client.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">{client.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono italic">{client.company}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-slate-600">{client.email}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">
                            {client.createdAt?.seconds ? format(new Date(client.createdAt.seconds * 1000), 'dd.MM.yyyy') : '...'}
                          </td>
                          <td className="px-6 py-4 text-right pr-12">
                            {!isGuest && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setClientToEdit(client);
                                    setIsClientModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                                  title="Editar Cliente"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteClient(client.id!)}
                                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                                  title="Remover Cliente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'migrations' && (
              <motion.div
                key="migrations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-6"
              >
                {/* Mobile Card Layout for Migrations */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {[...migrations].sort((a, b) => {
                    if (sortOrder === 'none') return 0;
                    const nameA = getClientName(a).toLowerCase();
                    const nameB = getClientName(b).toLowerCase();
                    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                  }).map((m) => {
                    const statusConfig = {
                      pendente: { color: 'bg-slate-100 text-slate-600', label: 'Pendente' },
                      em_progresso: { color: 'bg-blue-100 text-blue-600', label: 'Execução' },
                      pausado: { color: 'bg-amber-100 text-amber-600', label: 'Pausado' },
                      concluida: { color: 'bg-emerald-100 text-emerald-600', label: 'Concluída' },
                      atrasada: { color: 'bg-rose-100 text-rose-600', label: 'Atraso' },
                    }[m.status || 'pendente'] || { color: 'bg-slate-100 text-slate-600', label: 'Pendente' };

                    const allDisks = [...(m.disks || []), ...(m.groups?.flatMap(g => g.disks || []) || [])];
                    const total = allDisks.reduce((sum, d) => sum + (Number(d.totalPastas) || 0), 0);
                    const realized = allDisks.reduce((sum, d) => sum + (Number(d.pastasRealizadas) || 0), 0);
                    const progress = total > 0 ? Math.round((realized / total) * 100) : 0;

                    return (
                      <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all" onClick={() => setSelectedMigrationId(m.id!)}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{getClientName(m)}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">{m.description || 'Migração de Dados'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Progresso</span>
                              <span className="text-slate-900">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              📅 {m.endDate || '...'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedMigrationId(m.id!); }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
                              >
                                <HardDrive className="w-3.5 h-3.5" /> Discos
                              </button>
                              {!isGuest && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteMigration(m.id!); }}
                                  className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View for Migrations */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[800px] md:min-w-full">
                    <thead>
                      <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                        <th className="px-6 py-4">
                          <button 
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                          >
                            Identificação
                            {sortOrder === 'asc' ? <ArrowUpAZ className="w-4 h-4 text-blue-500" /> : <ArrowDownAZ className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4">Escopo do Projeto</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4">Cronograma</th>
                        <th className="px-6 py-4 text-right pr-6">Opções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...migrations].sort((a, b) => {
                        if (sortOrder === 'none') return 0;
                        const nameA = getClientName(a).toLowerCase();
                        const nameB = getClientName(b).toLowerCase();
                        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                      }).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedMigrationId(m.id!)}
                              className="text-left group/btn"
                            >
                              <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter group-hover/btn:text-blue-600 transition-colors">{getClientName(m)}</p>
                              <span className="text-[10px] font-mono text-slate-400 italic">REFSUB-{m.id?.slice(-6)}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-600 leading-relaxed italic">{m.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <StatusBadge status={m.status} />
                              {!isGuest && (
                                <select
                                  value={m.status}
                                  onChange={(e) => updateMigration(m.id!, { status: e.target.value as any })}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-slate-100 rounded px-1.5 py-0.5 cursor-pointer outline-none border border-slate-200 font-bold uppercase"
                                >
                                  <option value="pendente">Pendente</option>
                                  <option value="em_progresso">Execução</option>
                                  <option value="pausado">Pausado</option>
                                  <option value="concluida">Concluída</option>
                                  <option value="atrasada">Atraso</option>
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-center gap-2 text-[10px] font-bold text-slate-500">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span className="uppercase tracking-widest">{m.endDate || '...'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => setSelectedMigrationId(m.id!)}
                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md scale-95 hover:scale-100"
                              >
                                <HardDrive className="w-3.5 h-3.5" /> Analisar Discos
                              </button>
                              {!isGuest && (
                                <button
                                  onClick={() => deleteMigration(m.id!)}
                                  className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all border border-transparent hover:border-rose-100 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Floating Trigger (Desktop Only) */}
        {!isGuest && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="hidden md:flex fixed bottom-8 right-8 bg-slate-900 border border-slate-800 text-white w-16 h-16 rounded-2xl shadow-2xl hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 flex-col items-center justify-center z-30 group"
          >
            <div className="relative mb-1">
              <MessageSquare className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-[0.15em] opacity-80">IA</span>
          </button>
        )}

        {/* Modals & AI Panel (Drawer Side) */}
        <MigrationModal isOpen={isMigrationModalOpen} onClose={() => setIsMigrationModalOpen(false)} clients={clients} onAdd={addMigration} isGuest={isGuest} />
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setClientToEdit(null);
          }}
          onAdd={addClient}
          onUpdate={updateClient}
          clientToEdit={clientToEdit}
          isGuest={isGuest}
        />
        {!isGuest && (
          <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} migrations={migrations} isGuest={isGuest} />
        )}

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-4 flex items-center justify-around z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
          <BottomNavLink
            icon={BarChart3}
            label="Painel"
            active={activeTab === 'overview'}
            onClick={() => { setActiveTab('overview'); setSelectedMigrationId(null); }}
          />
          <BottomNavLink
            icon={Users}
            label="Clientes"
            active={activeTab === 'clients'}
            onClick={() => { setActiveTab('clients'); setSelectedMigrationId(null); }}
          />
          <BottomNavLink
            icon={FileUp}
            label="Projetos"
            active={activeTab === 'migrations'}
            onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }}
          />
          {!isGuest && (
            <BottomNavLink
              icon={Sparkles}
              label="IA"
              active={isChatOpen}
              onClick={() => setIsChatOpen(true)}
            />
          )}
          <BottomNavLink
            icon={LogOut}
            label="Sair"
            active={false}
            onClick={() => signOut()}
          />
        </nav>
      </main>
    </div>
  );
}

function BottomNavLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div
          layoutId="activeTabMobile"
          className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
        />
      )}
    </button>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick, isCollapsed }: { icon: any, label: string, active: boolean, onClick: () => void, isCollapsed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full rounded-xl transition-all duration-300 border group relative ${active
        ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[inset_0_0_12px_rgba(37,99,235,0.05)]'
        : 'text-slate-500 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
        } ${isCollapsed ? 'flex-col justify-center py-4 px-1 gap-2' : 'px-5 py-3 gap-4'}`}
    >
      <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} shrink-0 transition-transform duration-300 ${active ? 'text-blue-500 scale-110' : 'text-slate-500 group-hover:text-slate-200 group-hover:scale-110'}`} />

      <span className={`font-black uppercase transition-all duration-300 ${isCollapsed
        ? 'text-[9px] leading-tight tracking-tight text-center'
        : `text-xs tracking-[0.15em] whitespace-nowrap ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`
        }`}>
        {label}
      </span>

      {active && !isCollapsed && (
        <motion.div
          layoutId="activeTab"
          className="ml-auto w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.6)]"
        />
      )}
      {active && isCollapsed && (
        <motion.div
          layoutId="activeTabCollapsed"
          className="absolute right-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-l-full shadow-[0_0_12px_rgba(37,99,235,0.6)]"
        />
      )}
    </button>
  );
}

function StatusBadge({ status, minimal = false }: { status: string, minimal?: boolean }) {
  const configs: Record<string, { label: string, color: string, bg: string, border: string }> = {
    pendente: { label: 'Em Análise', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
    em_progresso: { label: 'Executando', color: 'text-blue-700', bg: 'bg-blue-100/50', border: 'border-blue-200/50' },
    pausado: { label: 'Interrompido', color: 'text-rose-700', bg: 'bg-rose-100/50', border: 'border-rose-200/50' },
    concluida: { label: 'Finalizado', color: 'text-emerald-700', bg: 'bg-emerald-100/50', border: 'border-emerald-200/50' },
    atrasada: { label: 'Crítico', color: 'text-rose-700', bg: 'bg-rose-100/50', border: 'border-rose-200/50' },
  };

  const config = configs[status] || configs.pendente;

  if (minimal) {
    return <div className={`w-2 h-2 rounded-sm ${config.color.replace('text-', 'bg-')}`} />
  }

  return (
    <span className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.color} ${config.border}`}>
      {config.label}
    </span>
  );
}

// Modal Components
function ClientModal({ isOpen, onClose, onAdd, onUpdate, clientToEdit, isGuest }: { isOpen: boolean, onClose: () => void, onAdd: (c: any) => Promise<void>, onUpdate?: (id: string, data: any) => Promise<void>, clientToEdit?: any, isGuest: boolean }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        email: clientToEdit.email || '',
        company: clientToEdit.company || ''
      });
    } else {
      setFormData({ name: '', email: '', company: '' });
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl border border-slate-200"
      >
        <h3 className="text-xl font-black mb-6 font-display uppercase tracking-tight text-slate-900">
          {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome Completo</label>
            <input
              type="text"
              disabled={isGuest}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-50"
              placeholder="Ex: João da Silva"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">E-mail Corporativo</label>
            <input
              type="email"
              disabled={isGuest}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-50"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Empresa / Unidade</label>
            <input
              type="text"
              disabled={isGuest}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-50"
              placeholder="Ex: Tech Solutions"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
            {isGuest ? 'Fechar' : 'Cancelar'}
          </button>
          {!isGuest && (
            <button
              onClick={async () => {
                if (clientToEdit && onUpdate) {
                  await onUpdate(clientToEdit.id, formData);
                } else {
                  await onAdd(formData);
                }
                onClose();
                setFormData({ name: '', email: '', company: '' });
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              {clientToEdit ? 'Atualizar' : 'Cadastrar'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MigrationModal({ isOpen, onClose, clients, onAdd, isGuest }: { isOpen: boolean, onClose: () => void, clients: any[], onAdd: (m: any) => Promise<void>, isGuest: boolean }) {
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    status: 'pendente' as const,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reportUrl: '',
    imageUrl: '',
    groups: [{ id: 'default', title: 'Unidade Principal', disks: [] }] as DiskGroup[]
  });

  if (!isOpen) return null;

  const addGroup = () => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: [...formData.groups, { id: crypto.randomUUID(), title: 'Nova Unidade', disks: [] }]
    });
  };

  const removeGroup = (groupId: string) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.filter(g => g.id !== groupId)
    });
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.map(g => g.id === groupId ? { ...g, title } : g)
    });
  };

  const addDiskToGroup = (groupId: string) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.map(g => g.id === groupId ? {
        ...g,
        disks: [...g.disks, {
          path: '', status: 'Pendente', pastasRealizadas: 0, estudos: 0,
          send: 0, totalPastas: 0, storageMapeado: 0, storageEnviado: 0
        }]
      } : g)
    });
  };

  const removeDiskFromGroup = (groupId: string, diskIdx: number) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.map(g => g.id === groupId ? {
        ...g,
        disks: g.disks.filter((_: Disk, i: number) => i !== diskIdx)
      } : g)
    });
  };

  const updateDiskInGroup = (groupId: string, diskIdx: number, data: Partial<Disk>) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.map(g => g.id === groupId ? {
        ...g,
        disks: g.disks.map((d: Disk, i: number) => i === diskIdx ? { ...d, ...data } : d)
      } : g)
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    if (isGuest) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const headerRowIdx = rows.findIndex(r =>
        r.some(c => {
          const val = String(c || '').toLowerCase();
          return val.includes('caminho') || val.includes('path');
        })
      );

      if (headerRowIdx === -1) {
        alert("Não foi possível encontrar a coluna 'Caminho' na planilha.");
        return;
      }

      const headers = Array.from(rows[headerRowIdx] || []).map(h => String(h || '').toLowerCase().trim());
      const dataRows = rows.slice(headerRowIdx + 1);

      const findIdx = (aliases: string[]) => {
        return headers.findIndex(h =>
          h && aliases.some(alias => h.includes(alias.toLowerCase().trim()))
        );
      };

      const sanitizeNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleanVal = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(cleanVal) || 0;
      };

      let lastCumulative = 0;
      const importedDisks: Disk[] = dataRows
        .filter(row => row.length > 0 && row[findIdx(['caminho', 'path'])])
        .map(row => {
          const pathIdx = findIdx(['caminho', 'path', 'disco', 'origem']);
          const statusIdx = findIdx(['status']);
          const realIdx = findIdx(['realizac', 'realizadas', 'migradas', 'realizados']);
          const estIdx = findIdx(['estudos', 'exames']);
          const sendIdx = findIdx(['send', 'enviado']);
          const totIdx = findIdx(['total pastas', 'total']);
          const mapIdx = findIdx(['storage mapeado', 'mapeado', 'tamanho']);
          const envIdx = findIdx(['storage enviado', 'enviado']);
          const destIdx = findIdx(['destino', 'destination', 'target']);

          const currentPath = String(pathIdx !== -1 ? row[pathIdx] : '');
          const currentCumulative = sanitizeNum(realIdx !== -1 ? row[realIdx] : 0);
          const total = sanitizeNum(totIdx !== -1 ? row[totIdx] : 0);

          if (currentCumulative < lastCumulative) {
            lastCumulative = 0;
          }

          const individualRealized = Math.max(0, currentCumulative - lastCumulative);
          lastCumulative = currentCumulative;

          const statusVal = String(statusIdx !== -1 ? row[statusIdx] : '').toLowerCase();
          const isFinished = statusVal.includes('realizado') || statusVal.includes('concluido') || statusVal.includes('finalizado') || (individualRealized >= total && total > 0);

          return {
            path: currentPath,
            status: isFinished ? 'Realizado' : 'Pendente',
            pastasRealizadas: isFinished ? total : individualRealized,
            estudos: sanitizeNum(estIdx !== -1 ? row[estIdx] : 0),
            send: sanitizeNum(sendIdx !== -1 ? row[sendIdx] : 0),
            totalPastas: total,
            storageMapeado: sanitizeNum(mapIdx !== -1 ? row[mapIdx] : 0),
            storageEnviado: sanitizeNum(envIdx !== -1 ? row[envIdx] : 0),
            destination: destIdx !== -1 ? String(row[destIdx]) : undefined
          };
        });

      setFormData(prev => ({
        ...prev,
        groups: prev.groups.map(g => g.id === groupId ? { ...g, disks: [...g.disks, ...importedDisks] } : g)
      }));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-white rounded-xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black font-display uppercase tracking-tight text-slate-900">Novo Projeto de Migração</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente Alvo</label>
            <select
              disabled={isGuest}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none disabled:opacity-50"
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select>
          </div>

          <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Início</label>
              <input type="date" disabled={isGuest} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Previsão</label>
              <input type="date" disabled={isGuest} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Escopo e Especificação</label>
            <textarea
              disabled={isGuest}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none min-h-[60px] transition-all disabled:opacity-50"
              placeholder="Descreva o escopo técnico..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Configuração de Unidades e Discos</label>
              {!isGuest && (
                <button
                  onClick={addGroup}
                  className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Unidade
                </button>
              )}
            </div>

            <div className="space-y-6">
              {formData.groups.map((group) => (
                <div key={group.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <input
                      type="text"
                      disabled={isGuest}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                      value={group.title}
                      onChange={e => updateGroupTitle(group.id, e.target.value)}
                      placeholder="Nome da Unidade (ex: Matriz, Setor A)"
                    />
                    <div className="flex gap-2">
                      {!isGuest && (
                        <>
                          <label className="text-[10px] bg-blue-600 text-white px-3 py-2 rounded-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                            <FileUp className="w-3.5 h-3.5" /> Importar
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={e => handleFileUpload(e, group.id)} />
                          </label>
                          <button
                            onClick={() => addDiskToGroup(group.id)}
                            className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Disco
                          </button>
                        </>
                      )}
                      {!isGuest && formData.groups.length > 1 && (
                        <button onClick={() => removeGroup(group.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {group.disks.map((disk: Disk, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 group">
                        <input
                          type="text"
                          disabled={isGuest}
                          placeholder="Caminho / Host"
                          className="flex-1 bg-transparent text-[11px] font-mono outline-none disabled:opacity-50"
                          value={disk.path}
                          onChange={e => updateDiskInGroup(group.id, idx, { path: e.target.value })}
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">TB Total</span>
                            <NumericInput
                              isFloat
                              readOnly={isGuest}
                              className="w-12 bg-slate-50 border border-slate-200 rounded text-right p-0.5 text-[10px] outline-none disabled:opacity-50"
                              value={disk.storageMapeado}
                              onChange={v => updateDiskInGroup(group.id, idx, { storageMapeado: v })}
                            />
                          </div>
                          {!isGuest && (
                            <button onClick={() => removeDiskFromGroup(group.id, idx)} className="p-1 text-slate-300 hover:text-rose-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                    {group.disks.length === 0 && (
                      <p className="text-center py-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest italic border border-dashed border-slate-200 rounded-lg">Aguardando mapeamento...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
            {isGuest ? 'Fechar' : 'Cancelar'}
          </button>
          {!isGuest && (
            <button
              disabled={!formData.clientId}
              onClick={async () => {
                const client = clients.find(c => c.id === formData.clientId);
                await onAdd({ ...formData, clientName: client?.name || 'Cliente' });
                onClose();
              }}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-30"
            >
              Executar Projeto
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AIChatDrawer({ isOpen, onClose, migrations, isGuest }: { isOpen: boolean, onClose: () => void, migrations: any[], isGuest: boolean }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading || isGuest) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const context = migrations.map(m => `- Cliente: ${m.clientName}, Status: ${m.status}, Descrição: ${m.description}, Início: ${m.startDate}, Fim: ${m.endDate}`).join('\n');

      const prompt = `Você é uma IA analista sênior do sistema MigraFlow. Analise os estados abaixo e responda como um assistente técnico preciso:\n${context}\n\nAnalista: "${userMsg}"`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-3.1-flash-lite-preview" })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.text || 'Falha no processamento heurístico.' }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro na latência do subsistema de IA." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-32 right-8 w-[400px] h-[650px] max-h-[calc(100vh-160px)] bg-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-50 flex flex-col border border-slate-700/50 rounded-[32px] overflow-hidden text-white ring-1 ring-white/10"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] font-display">AI Analyst Core</h3>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
              <div className="bg-slate-800/40 p-4 rounded-xl rounded-tl-none text-[13px] leading-relaxed border-l-2 border-blue-500 text-slate-300">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 italic">IA System Ready:</p>
                Analista sênior conectado. Forneça instruções para análise de fluxo, checksum de dados ou relatórios de status.
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed shadow-xl transition-all ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                    : 'bg-slate-900/90 text-slate-200 rounded-tl-none border border-slate-800 backdrop-blur-md shadow-blue-900/5'
                    }`}>
                    {m.role === 'assistant' ? (
                      <div className="space-y-2">
                        {m.content.split('\n').map((line, li) => (
                          <p key={li}>
                            {line.split(/(\*\*.*?\*\*|`.*?`)/).map((part, pi) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={pi} className="text-blue-400 font-black tracking-tight">{part.slice(2, -2)}</strong>;
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return <code key={pi} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-blue-300 font-mono text-[10px]">{part.slice(1, -1)}</code>;
                              }
                              return part;
                            })}
                          </p>
                        ))}
                      </div>
                    ) : m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/30 p-4 rounded-xl rounded-tl-none border border-slate-800">
                    <LoaderPulse />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900">
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled={isGuest}
                  placeholder={isGuest ? "Interação desabilitada para visitantes" : "Instrução analítica..."}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-4 pl-4 pr-12 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 shadow-inner transition-colors disabled:opacity-50"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || isGuest}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-600 mt-4 uppercase tracking-widest font-bold">Heuristic Processing Active</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LoaderPulse() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite]" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite_0.2s]" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite_0.4s]" />
    </div>
  );
}

// Detailed Migration View
function MigrationDetails({ migration, onUpdate, isGuest }: { migration: any, onUpdate: (data: any) => Promise<void>, isGuest: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroups, setEditedGroups] = useState<DiskGroup[]>(
    migration.groups || (migration.disks?.length > 0 ? [{ id: 'default', title: 'Unidade Principal', disks: migration.disks }] : [{ id: 'default', title: 'Unidade Principal', disks: [] }])
  );
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  
  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentModalTarget, setCommentModalTarget] = useState<{ groupId: string, diskIdx: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSeverity, setCommentSeverity] = useState<NonNullable<Disk['comment']>['severity']>('sem_prioridade');
  const [copiedInsight, setCopiedInsight] = useState(false);
  const [hoveredComment, setHoveredComment] = useState<{ text: string, severity: string, x: number, y: number } | null>(null);

  useEffect(() => {
    setEditedGroups(migration.groups || (migration.disks?.length > 0 ? [{ id: 'default', title: 'Unidade Principal', disks: migration.disks }] : [{ id: 'default', title: 'Unidade Principal', disks: [] }]));
  }, [migration.groups, migration.disks]);

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanVal = String(val).replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanVal) || 0;
  };

  const allDisks = editedGroups.flatMap(g => g.disks);

  const summary = {
    totalPastas: allDisks.reduce((acc, d) => acc + parseNum(d.totalPastas), 0),
    pastasRealizadas: allDisks.reduce((acc, d) => {
      const total = parseNum(d.totalPastas);
      const realized = parseNum(d.pastasRealizadas);
      return acc + Math.min(realized, total);
    }, 0),
    estudosEnviados: allDisks.reduce((acc, d) => acc + parseNum(d.estudos), 0),
    storageMapeado: allDisks.reduce((acc, d) => acc + parseNum(d.storageMapeado), 0),
    storageEnviado: allDisks.reduce((acc, d) => acc + parseNum(d.storageEnviado), 0),
    progresso: 0
  };

  const total = summary.totalPastas;
  const realized = summary.pastasRealizadas;
  summary.progresso = total > 0 ? Number(((realized / total) * 100).toFixed(2)) : 0;

  const addGroup = () => {
    if (isGuest) return;
    setEditedGroups([...editedGroups, { id: crypto.randomUUID(), title: 'Nova Unidade', disks: [] }]);
    setIsEditing(true);
  };

  const removeGroup = (groupId: string) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.filter(g => g.id !== groupId));
    setIsEditing(true);
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? { ...g, title } : g));
    setIsEditing(true);
  };

  const addDiskToGroup = (groupId: string) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      disks: [...g.disks, {
        path: '', status: 'Pendente', pastasRealizadas: 0, estudos: 0,
        send: 0, totalPastas: 0, storageMapeado: 0, storageEnviado: 0
      }]
    } : g));
    setIsEditing(true);
  };

  const removeDiskFromGroup = (groupId: string, diskIdx: number) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      disks: g.disks.filter((_: Disk, i: number) => i !== diskIdx)
    } : g));
    setIsEditing(true);
  };

  const updateDiskInGroup = (groupId: string, diskIdx: number, data: Partial<Disk>) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      disks: g.disks.map((d: Disk, i: number) => i === diskIdx ? { ...d, ...data } : d)
    } : g));
    setIsEditing(true);
  };

  const saveComment = () => {
    if (!commentModalTarget || isGuest) return;
    updateDiskInGroup(commentModalTarget.groupId, commentModalTarget.diskIdx, {
      comment: {
        text: commentText,
        severity: commentSeverity as any
      }
    });
    setIsCommentModalOpen(false);
    setCommentModalTarget(null);
  };

  const getSeverityColor = (sev: NonNullable<Disk['comment']>['severity']) => {
    switch (sev) {
      case 'sem_prioridade': return 'bg-slate-900 text-white';
      case 'baixa': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'media': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'alta': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'urgente': return 'bg-rose-50 text-rose-600 border border-rose-100';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const copyInsight = async () => {
    if (!aiInsight) return;
    try {
      await navigator.clipboard.writeText(aiInsight);
      setCopiedInsight(true);
      setTimeout(() => setCopiedInsight(false), 2000);
    } catch (err) {
      console.error('Failed to copy insight:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const headerRowIdx = rows.findIndex(r =>
        r.some(c => {
          const val = String(c || '').toLowerCase();
          return val.includes('caminho') || val.includes('path');
        })
      );

      if (headerRowIdx === -1) {
        alert("Não foi possível encontrar a coluna 'Caminho' na planilha.");
        return;
      }

      const headers = Array.from(rows[headerRowIdx] || []).map(h => String(h || '').toLowerCase().trim());
      const dataRows = rows.slice(headerRowIdx + 1);

      const findIdx = (aliases: string[]) => {
        return headers.findIndex(h =>
          h && aliases.some(alias => h.includes(alias.toLowerCase().trim()))
        );
      };

      const sanitizeNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleanVal = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(cleanVal) || 0;
      };

      let lastCumulative = 0;
      const importedDisks: Disk[] = dataRows
        .filter(row => row.length > 0 && row[findIdx(['caminho', 'path'])])
        .map(row => {
          const pathIdx = findIdx(['caminho', 'path', 'disco', 'origem']);
          const statusIdx = findIdx(['status']);
          const realIdx = findIdx(['realizac', 'realizadas', 'migradas', 'realizados']);
          const estIdx = findIdx(['estudos', 'exames']);
          const sendIdx = findIdx(['send', 'enviado']);
          const totIdx = findIdx(['total pastas', 'total']);
          const mapIdx = findIdx(['storage mapeado', 'mapeado', 'tamanho']);
          const envIdx = findIdx(['storage enviado', 'enviado']);
          const destIdx = findIdx(['destino', 'destination', 'target']);

          const currentPath = String(pathIdx !== -1 ? row[pathIdx] : '');
          const currentCumulative = sanitizeNum(realIdx !== -1 ? row[realIdx] : 0);
          const total = sanitizeNum(totIdx !== -1 ? row[totIdx] : 0);

          if (currentCumulative < lastCumulative) {
            lastCumulative = 0;
          }

          const individualRealized = Math.max(0, currentCumulative - lastCumulative);
          lastCumulative = currentCumulative;

          const statusVal = String(statusIdx !== -1 ? row[statusIdx] : '').toLowerCase();
          const isFinished = statusVal.includes('realizado') || statusVal.includes('concluido') || statusVal.includes('finalizado') || (individualRealized >= total && total > 0);

          return {
            path: currentPath,
            status: isFinished ? 'Realizado' : 'Pendente',
            pastasRealizadas: isFinished ? total : individualRealized,
            estudos: sanitizeNum(estIdx !== -1 ? row[estIdx] : 0),
            send: sanitizeNum(sendIdx !== -1 ? row[sendIdx] : 0),
            totalPastas: total,
            storageMapeado: sanitizeNum(mapIdx !== -1 ? row[mapIdx] : 0),
            storageEnviado: sanitizeNum(envIdx !== -1 ? row[envIdx] : 0),
            destination: destIdx !== -1 ? String(row[destIdx]) : undefined
          };
        });

      setEditedGroups(prev => prev.map(g => g.id === groupId ? { ...g, disks: [...g.disks, ...importedDisks] } : g));
      setIsEditing(true);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    if (isGuest) return;
    await onUpdate({ groups: editedGroups });
    setIsEditing(false);
  };

  const generateAISummary = async () => {
    if (isGuest) return;
    setIsGeneratingInsight(true);
    try {
      const diskContext = allDisks.map(d => {
        let ctx = `- Caminho: ${d.path}, Status: ${d.status}, Pastas: ${d.pastasRealizadas}/${d.totalPastas}, Storage: ${d.storageEnviado}/${d.storageMapeado} TB`;
        if (d.comment) {
          ctx += ` | COMENTÁRIO TÉCNICO: [${d.comment.severity.toUpperCase()}] ${d.comment.text}`;
        }
        return ctx;
      }).join('\n');
      
      const prompt = `Gere um resumo executivo técnico conciso e elegante para a migração do cliente ${migration.clientName}. 
      Contexto dos discos e observações técnicas:\n${diskContext}\n
      Destaque o progresso total (${summary.progresso}%), identifique gargalos potenciais (especialmente aqueles marcados com alta prioridade ou urgente) e forneça recomendações estratégicas baseadas nos comentários técnicos. 
      Use markdown para formatação (**negrito**, listas, etc). Seja direto e profissional.`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-3.1-flash-lite-preview" })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAiInsight(data.text);
      setIsInsightModalOpen(true);
    } catch (error) {
      console.error("AI Error:", error);
      alert("Erro ao conectar com o subsistema de IA.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Resumo Executivo Horizontal */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Resumo Executivo do Projeto</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Indicadores de Performance e Volumetria</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {isEditing && (
              <button
                onClick={handleSave}
                className="bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 border border-emerald-500/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Salvar</span>
              </button>
            )}
            {!isGuest && (
              <button
                onClick={generateAISummary}
                disabled={isGeneratingInsight}
                className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 border border-blue-500/50 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isGeneratingInsight ? 'animate-pulse' : ''}`} /> 
                <span className="hidden sm:inline">{isGeneratingInsight ? 'Gerando...' : 'IA Insight'}</span>
                {!isGeneratingInsight && <span className="sm:hidden">IA</span>}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y divide-x-0 md:divide-y-0 md:divide-x divide-slate-100 bg-white">
          <div className="p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Pastas</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">{summary.totalPastas.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pastas Realizadas</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tighter">{summary.pastasRealizadas.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estudos Enviados</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">{summary.estudosEnviados.toLocaleString()}</span>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Mapeado (TB)</span>
            <span className="text-2xl font-black text-blue-600 tracking-tighter">{summary.storageMapeado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Enviado (TB)</span>
            <span className="text-2xl font-black text-blue-600 tracking-tighter">{summary.storageEnviado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Progresso Total</span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black tracking-tighter transition-colors ${summary.progresso === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {summary.progresso}%
              </span>
              <div className="w-12 h-12 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-200" strokeWidth="4" />
                  <circle 
                    cx="18" cy="18" r="16" fill="none" 
                    className={`${summary.progresso === 100 ? 'stroke-emerald-600' : 'stroke-blue-600'} transition-all duration-1000`} 
                    strokeWidth="4" 
                    strokeDasharray={`${summary.progresso}, 100`} 
                    strokeLinecap="round" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Groups and Tables Section */}
      <div className="space-y-12">
        {editedGroups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 w-full">
                {isEditing ? (
                  <input
                    type="text"
                    value={group.title}
                    onChange={e => updateGroupTitle(group.id, e.target.value)}
                    className="bg-white border border-blue-200 rounded px-3 py-1 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                ) : (
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight flex items-center gap-2 truncate">
                    <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                    {group.title}
                  </h3>
                )}
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{group.disks.length} Discos</span>
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                {!isGuest && (
                  <>
                    <label className="whitespace-nowrap text-[9px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95">
                      <FileUp className="w-3 h-3" /> Importar
                      <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={e => handleFileUpload(e, group.id)} />
                    </label>
                    <button
                      onClick={() => addDiskToGroup(group.id)}
                      className="whitespace-nowrap text-[9px] bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add Disco
                    </button>
                  </>
                )}
                {!isGuest && isEditing && editedGroups.length > 1 && (
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="whitespace-nowrap text-[9px] bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Card Layout for Disks */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden bg-slate-50/30">
              {group.disks.map((d: Disk, i: number) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none focus:text-blue-600 border-b border-transparent focus:border-blue-200 pb-1"
                        value={d.path}
                        onChange={e => updateDiskInGroup(group.id, i, { path: e.target.value })}
                      />
                      {d.destination && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Destino</span>
                          <input
                            type="text"
                            className="flex-1 bg-transparent text-[10px] font-mono text-slate-500 outline-none truncate"
                            value={d.destination}
                            onChange={e => updateDiskInGroup(group.id, i, { destination: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <select
                      value={d.status}
                      onChange={(e) => updateDiskInGroup(group.id, i, { status: e.target.value as any })}
                      className={`text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1 outline-none border transition-all ${
                        d.status === 'Realizado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        d.status === 'Realizando' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                        d.status === 'Pausado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Realizando">Realizando</option>
                      <option value="Pausado">Pausado</option>
                      <option value="Realizado">Realizado</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Realizadas</span>
                      <NumericInput 
                        readOnly={isGuest}
                        value={d.pastasRealizadas}
                        onChange={v => updateDiskInGroup(group.id, i, { pastasRealizadas: v })}
                        className="w-full text-center text-xs font-black text-emerald-600 bg-slate-50 rounded p-1 outline-none focus:ring-1 focus:ring-emerald-200"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estudos</span>
                      <NumericInput 
                        readOnly={isGuest}
                        value={d.estudos}
                        onChange={v => updateDiskInGroup(group.id, i, { estudos: v })}
                        className="w-full text-center text-xs font-black text-slate-900 bg-slate-50 rounded p-1 outline-none focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <NumericInput 
                        readOnly={isGuest}
                        value={d.totalPastas}
                        onChange={v => updateDiskInGroup(group.id, i, { totalPastas: v })}
                        className="w-full text-center text-xs font-black text-slate-400 bg-slate-50 rounded p-1 outline-none focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onMouseEnter={(e) => {
                          if (d.comment) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredComment({
                              text: d.comment.text,
                              severity: d.comment.severity,
                              x: rect.left,
                              y: rect.top
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredComment(null)}
                        onClick={() => {
                          if (isGuest) return;
                          setCommentModalTarget({ groupId: group.id, diskIdx: i });
                          setCommentText(d.comment?.text || '');
                          setCommentSeverity(d.comment?.severity || 'sem_prioridade');
                          setIsCommentModalOpen(true);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          d.comment 
                            ? getSeverityColor(d.comment.severity) 
                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {!isGuest && (
                        <button
                          onClick={() => removeDiskFromGroup(group.id, i)}
                          className="p-2 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <NumericInput 
                          isFloat
                          readOnly={isGuest}
                          value={d.storageEnviado}
                          onChange={v => updateDiskInGroup(group.id, i, { storageEnviado: v })}
                          className="w-12 text-right text-[10px] font-black text-blue-600 bg-transparent outline-none focus:ring-1 focus:ring-blue-100 rounded"
                        />
                        <span className="text-[9px] font-bold text-slate-300">/</span>
                        <NumericInput 
                          isFloat
                          readOnly={isGuest}
                          value={d.storageMapeado}
                          onChange={v => updateDiskInGroup(group.id, i, { storageMapeado: v })}
                          className="w-12 text-left text-[10px] font-black text-slate-400 bg-transparent outline-none focus:ring-1 focus:ring-slate-100 rounded"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase">TB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6 w-[25%]">Origem / Destino</th>
                    <th className="p-4 text-center w-[12%]">Status</th>
                    <th className="p-4 text-center w-[10%]">Realizadas</th>
                    <th className="p-4 text-center w-[10%]">Estudos</th>
                    <th className="p-4 text-center w-[10%]">Send</th>
                    <th className="p-4 text-center w-[10%]">Total</th>
                    <th className="p-4 text-center w-[8%]">Mapeado</th>
                    <th className="p-4 text-center w-[8%]">Enviado</th>
                    <th className="p-4 text-right pr-6 w-[7%]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.disks.map((d: Disk, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group/row">
                      <td className="p-4 pl-6">
                        <input
                          type="text"
                          className="w-full bg-transparent text-[11px] font-mono font-bold text-slate-700 outline-none focus:text-blue-600"
                          value={d.path}
                          onChange={e => updateDiskInGroup(group.id, i, { path: e.target.value })}
                        />
                        {d.destination && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1 rounded uppercase">Destino</span>
                            <input
                              type="text"
                              className="flex-1 bg-transparent text-[10px] font-mono text-slate-400 outline-none"
                              value={d.destination}
                              onChange={e => updateDiskInGroup(group.id, i, { destination: e.target.value })}
                            />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <select
                          disabled={isGuest}
                          className={`text-[9px] font-black uppercase py-1 px-2 rounded-lg border outline-none cursor-pointer transition-all ${d.status === 'Realizado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            d.status === 'Realizando' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              d.status === 'Pausado' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                            }`}
                          value={d.status}
                          onChange={e => updateDiskInGroup(group.id, i, { status: e.target.value as any })}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Realizando">Execução</option>
                          <option value="Pausado">Pausado</option>
                          <option value="Realizado">Finalizado</option>
                        </select>
                      </td>
                      <td className="p-4 text-center text-xs font-mono font-black text-slate-600">
                        <NumericInput readOnly={isGuest} className="w-full bg-transparent text-center outline-none" value={d.pastasRealizadas} onChange={v => updateDiskInGroup(group.id, i, { pastasRealizadas: v })} />
                      </td>
                      <td className="p-4 text-center text-xs font-mono font-black text-slate-600">
                        <NumericInput readOnly={isGuest} className="w-full bg-transparent text-center outline-none" value={d.estudos} onChange={v => updateDiskInGroup(group.id, i, { estudos: v })} />
                      </td>
                      <td className="p-4 text-center text-xs font-mono font-black text-slate-600">
                        <NumericInput readOnly={isGuest} className="w-full bg-transparent text-center outline-none" value={d.send} onChange={v => updateDiskInGroup(group.id, i, { send: v })} />
                      </td>
                      <td className="p-4 text-center text-xs font-mono font-black text-slate-400">
                        <NumericInput readOnly={isGuest} className="w-full bg-transparent text-center outline-none" value={d.totalPastas} onChange={v => updateDiskInGroup(group.id, i, { totalPastas: v })} />
                      </td>
                      <td className="p-4 text-center text-[10px] font-mono font-bold text-slate-400">
                        <div className="flex items-center justify-end gap-1">
                          <NumericInput isFloat readOnly={isGuest} className="w-12 bg-transparent text-right outline-none" value={d.storageMapeado} onChange={v => updateDiskInGroup(group.id, i, { storageMapeado: v })} />
                          <span>TB</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-[10px] font-mono font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1">
                          <NumericInput isFloat readOnly={isGuest} className="w-12 bg-transparent text-right outline-none" value={d.storageEnviado} onChange={v => updateDiskInGroup(group.id, i, { storageEnviado: v })} />
                          <span>TB</span>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative group/tooltip">
                            {(!isGuest || d.comment) && (
                              <button
                                onClick={() => {
                                  if (isGuest) return;
                                  setCommentModalTarget({ groupId: group.id, diskIdx: i });
                                  setCommentText(d.comment?.text || '');
                                  setCommentSeverity(d.comment?.severity || 'sem_prioridade');
                                  setIsCommentModalOpen(true);
                                }}
                                className={`p-1.5 rounded-lg transition-all ${isGuest ? 'cursor-default' : 'cursor-pointer'} ${d.comment ? getSeverityColor(d.comment.severity) : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                                title={isGuest ? "Observação Técnica" : "Comentário Técnico"}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {d.comment?.text && (
                              <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none translate-y-2 group-hover/tooltip:translate-y-0">
                                <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    d.comment.severity === 'sem_prioridade' ? 'bg-slate-400' :
                                    d.comment.severity === 'baixa' ? 'bg-blue-500' :
                                    d.comment.severity === 'media' ? 'bg-amber-500' :
                                    d.comment.severity === 'alta' ? 'bg-orange-500' : 'bg-rose-500'
                                  }`} />
                                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                                    {d.comment.severity.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed font-medium text-slate-200 whitespace-pre-wrap">{d.comment.text}</p>
                                <div className="absolute top-full right-4 w-3 h-3 bg-slate-900 rotate-45 -mt-1.5" />
                              </div>
                            )}
                          </div>
                          {!isGuest && (
                            <button
                              onClick={() => removeDiskFromGroup(group.id, i)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {!isGuest && (
          <button
            onClick={addGroup}
            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Adicionar Nova Unidade / Grupo de Discos</span>
          </button>
        )}
      </div>

      {/* Detail Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[450px] flex flex-col">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6">Curva de Transferência (Storage)</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={allDisks}>
              <defs>
                <linearGradient id="colorMapeado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEnviado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="path" hide />
              <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="storageMapeado" stroke="#2563eb" fillOpacity={1} fill="url(#colorMapeado)" name="Mapeado (TB)" />
              <Area type="monotone" dataKey="storageEnviado" stroke="#10b981" fillOpacity={1} fill="url(#colorEnviado)" name="Enviado (TB)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Hover Comment Tooltip */}
      <AnimatePresence>
        {hoveredComment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ 
              position: 'fixed', 
              left: hoveredComment.x, 
              top: hoveredComment.y - 120, // Position above
              zIndex: 9999 
            }}
            className="w-72 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
              <div className={`w-2 h-2 rounded-full ${
                hoveredComment.severity === 'sem_prioridade' ? 'bg-slate-400' :
                hoveredComment.severity === 'baixa' ? 'bg-blue-500' :
                hoveredComment.severity === 'media' ? 'bg-amber-500' :
                hoveredComment.severity === 'alta' ? 'bg-orange-500' : 'bg-rose-500'
              }`} />
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                {hoveredComment.severity.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed font-medium text-slate-200 whitespace-pre-wrap">{hoveredComment.text}</p>
            <div className="absolute top-full left-4 w-3 h-3 bg-slate-900 rotate-45 -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insight Modal */}
      <AnimatePresence>
        {isInsightModalOpen && aiInsight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInsightModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="bg-slate-900 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Insight Executivo IA</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Relatório Estratégico</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInsightModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="prose prose-slate max-w-none">
                  <div className="space-y-4">
                    {aiInsight.split('\n').map((line: string, li: number) => {
                      let currentLine = line.trim();
                      if (!currentLine) return <div key={li} className="h-2" />;
                      
                      const isBullet = currentLine.startsWith('- ') || currentLine.startsWith('* ');
                      if (isBullet) currentLine = currentLine.slice(2);
                      
                      const isHeader = currentLine.startsWith('#');
                      if (isHeader) currentLine = currentLine.replace(/^#+\s+/, '');

                      const content = currentLine.split(/(\*\*.*?\*\*|`.*?`)/).map((part: string, pi: number) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pi} className="text-slate-900 font-black">{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('`') && part.endsWith('`')) {
                          return <code key={pi} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-blue-600 font-mono text-[11px]">{part.slice(1, -1)}</code>;
                        }
                        return part;
                      });

                      if (isBullet) {
                        return (
                          <div key={li} className="flex gap-3 items-start ml-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <p className="text-slate-600 text-sm leading-relaxed flex-1">{content}</p>
                          </div>
                        );
                      }

                      return (
                        <p key={li} className={`text-slate-600 text-sm leading-relaxed ${isHeader ? 'text-slate-900 font-black text-base mt-6 mb-2' : ''}`}>
                          {content}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={copyInsight}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border ${
                    copiedInsight 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {copiedInsight ? (
                    <>
                      <Check className="w-4 h-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Relatório
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsInsightModalOpen(false)}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {isCommentModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommentModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Comentário Técnico</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Observação de Engenharia</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nível de Severidade</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'sem_prioridade', label: 'Sem Prioridade', color: 'bg-slate-900' },
                      { id: 'baixa', label: 'Baixa Prioridade', color: 'bg-blue-600' },
                      { id: 'media', label: 'Média Prioridade', color: 'bg-amber-500' },
                      { id: 'alta', label: 'Alta Prioridade', color: 'bg-orange-600' },
                      { id: 'urgente', label: 'Atenção Necessária / Urgente', color: 'bg-rose-600' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCommentSeverity(opt.id as any)}
                        className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all ${
                          commentSeverity === opt.id 
                            ? 'border-blue-600 bg-blue-50/50' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                        <span className={`text-xs font-bold ${commentSeverity === opt.id ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descrição da Observação</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Descreva detalhes técnicos, impedimentos ou observações relevantes..."
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveComment}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  Salvar Comentário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
