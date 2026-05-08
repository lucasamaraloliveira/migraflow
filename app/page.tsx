'use client';

import React, { useState } from 'react';
import { AuthGuard, useAuth } from '@/components/auth-provider';
import Image from 'next/image';
import { 
  Users, 
  BarChart3, 
  LogOut, 
  Plus, 
  ChevronRight, 
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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients, useMigrations, Disk } from '@/hooks/use-firestore';
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
  Area
} from 'recharts';

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
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'migrations'>('overview');
  const { clients, addClient, deleteClient } = useClients();
  const { migrations, addMigration, updateMigration, deleteMigration } = useMigrations();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);

  // Stats
  const stats = [
    { label: 'Total de Clientes', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Migrações Ativas', value: migrations.filter(m => m.status !== 'concluida').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Concluídas', value: migrations.filter(m => m.status === 'concluida').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Atrasadas', value: migrations.filter(m => m.status === 'atrasada').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  // Chart Data Preparation
  const chartData = migrations.map(m => {
    const totalEstudos = m.disks?.reduce((acc, d) => acc + (d.estudos || 0), 0) || 0;
    const totalPastas = m.disks?.reduce((acc, d) => acc + (d.totalPastas || 0), 0) || 0;
    return {
      name: m.clientName.split(' ')[0],
      estudos: totalEstudos,
      pastas: totalPastas,
    };
  });

  const statusData = [
    { name: 'Pendente', value: migrations.filter(m => m.status === 'pendente').length, color: '#94a3b8' },
    { name: 'Execução', value: migrations.filter(m => m.status === 'em_progresso').length, color: '#2563eb' },
    { name: 'Concluída', value: migrations.filter(m => m.status === 'concluida').length, color: '#10b981' },
    { name: 'Atrasada', value: migrations.filter(m => m.status === 'atrasada').length, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const selectedMigration = migrations.find(m => m.id === selectedMigrationId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">M</div>
          <span className="text-white font-bold text-lg tracking-tight font-display">MigraFlow</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          <SidebarLink 
            icon={BarChart3} 
            label="Visão Geral" 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setSelectedMigrationId(null); }} 
          />
          <SidebarLink 
            icon={Users} 
            label="Clientes" 
            active={activeTab === 'clients'} 
            onClick={() => { setActiveTab('clients'); setSelectedMigrationId(null); }} 
          />
          <SidebarLink 
            icon={FileUp} 
            label="Migrações" 
            active={activeTab === 'migrations'} 
            onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-2">
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
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white uppercase tracking-wider">{user?.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate lowercase font-mono">conectado</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="mt-4 flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-3 h-3" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">
              {selectedMigration ? `Detalhamento: ${selectedMigration.clientName}` : (
                activeTab === 'overview' ? 'Painel de Monitoramento' :
                activeTab === 'clients' ? 'Gestão de Clientes' : 'Projetos de Migração'
              )}
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
              {selectedMigration ? 'Análise granular de discos e volumetria' : (
                activeTab === 'overview' ? 'Migração de Dados e Infraestrutura' :
                activeTab === 'clients' ? 'Controle de Base de Atendimento' : 'Acompanhamento de Fluxo Crítico'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedMigration && (
              <button 
                onClick={() => setSelectedMigrationId(null)}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 px-3 py-2 transition-colors border border-slate-200 rounded-lg"
              >
                Voltar ao Painel
              </button>
            )}
            {activeTab === 'clients' && (
              <button 
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm uppercase tracking-tight"
              >
                <Plus className="w-4 h-4" /> Novo Cliente
              </button>
            )}
            {activeTab === 'migrations' && !selectedMigration && (
              <button 
                onClick={() => setIsMigrationModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm uppercase tracking-tight"
              >
                <Plus className="w-4 h-4" /> Iniciar Migração
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
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
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                          <YAxis fontSize={10} stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="estudos" fill="#2563eb" radius={[4, 4, 0, 0]} name="Estudos" />
                          <Bar dataKey="pastas" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Pastas" />
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
                                <div className="font-bold text-slate-900">{m.clientName}</div>
                                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">REF-{m.id?.slice(-4)}</div>
                              </td>
                              <td className="p-4 text-center">
                                <StatusBadge status={m.status} />
                              </td>
                              <td className="p-4 text-right pr-6">
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-blue-600 transition-all">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                            <button 
                              onClick={() => deleteClient(client.id!)}
                              className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-md transition-all border border-transparent hover:border-rose-100"
                            >
                              Remover
                            </button>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                        <th className="px-6 py-4">Identificação</th>
                        <th className="px-6 py-4">Escopo do Projeto</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4">Cronograma</th>
                        <th className="px-6 py-4 text-right pr-12">Dossiê</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {migrations.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => setSelectedMigrationId(m.id!)}
                              className="text-left group/btn"
                            >
                              <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter group-hover/btn:text-blue-600 transition-colors">{m.clientName}</p>
                              <span className="text-[10px] font-mono text-slate-400 italic">REFSUB-{m.id?.slice(-6)}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 max-sm">
                            <p className="text-xs text-slate-600 leading-relaxed italic">{m.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <StatusBadge status={m.status} />
                              <select 
                                value={m.status}
                                onChange={(e) => updateMigration(m.id!, { status: e.target.value as any })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-slate-100 rounded px-1.5 py-0.5 cursor-pointer outline-none border border-slate-200 font-bold uppercase"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="em_progresso">Execução</option>
                                <option value="concluida">Concluída</option>
                                <option value="atrasada">Atraso</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedMigrationId(m.id!)}
                              className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 hover:underline transition-all"
                            >
                              Analisar Discos
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => deleteMigration(m.id!)}
                                className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all border border-transparent hover:border-rose-100 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setSelectedMigrationId(m.id!)}
                                className="p-2 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-blue-100"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
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

        {/* AI Floating Trigger */}
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group flex items-center gap-3 z-30"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-black text-xs uppercase tracking-[0.2em] opacity-80">AI Assistant</span>
          <MessageSquare className="w-5 h-5 text-blue-500" />
        </button>

        {/* Modals & AI Panel (Drawer Side) */}
        <MigrationModal isOpen={isMigrationModalOpen} onClose={() => setIsMigrationModalOpen(false)} clients={clients} onAdd={addMigration} />
        <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onAdd={addClient} />
        <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} migrations={migrations} />
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 border ${
        active 
          ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.05)]' 
          : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-blue-500' : 'text-slate-500'}`} />
      <span className={`text-xs font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
    </button>
  );
}

function StatusBadge({ status, minimal = false }: { status: string, minimal?: boolean }) {
  const configs: Record<string, { label: string, color: string, bg: string, border: string }> = {
    pendente: { label: 'Em Análise', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
    em_progresso: { label: 'Executando', color: 'text-blue-700', bg: 'bg-blue-100/50', border: 'border-blue-200/50' },
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
function ClientModal({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (c: any) => Promise<void> }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-xl p-8 shadow-2xl border border-slate-200"
      >
        <h3 className="text-xl font-black mb-6 font-display uppercase tracking-tight text-slate-900">Cadastrar Novo Cliente</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome Completo</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="Ex: João da Silva"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">E-mail Corporativo</label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Empresa / Unidade</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="Ex: Tech Solutions"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
          <button 
            onClick={async () => {
              await onAdd(formData);
              onClose();
              setFormData({ name: '', email: '', company: '' });
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            Cadastrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MigrationModal({ isOpen, onClose, clients, onAdd }: { isOpen: boolean, onClose: () => void, clients: any[], onAdd: (m: any) => Promise<void> }) {
  const [formData, setFormData] = useState({ 
    clientId: '', 
    description: '', 
    status: 'pendente' as const,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reportUrl: '',
    imageUrl: '',
    disks: [] as Disk[]
  });

  if (!isOpen) return null;

  const addDisk = () => {
    setFormData({
      ...formData,
      disks: [...formData.disks, { 
        path: '', status: 'Pendente', pastasRealizadas: 0, estudos: 0, 
        send: 0, totalPastas: 0, storageMapeado: 0, storageEnviado: 0 
      }]
    });
  };

  const removeDisk = (idx: number) => {
    const newDisks = [...formData.disks];
    newDisks.splice(idx, 1);
    setFormData({ ...formData, disks: newDisks });
  };

  const updateDisk = (idx: number, data: Partial<Disk>) => {
    const newDisks = [...formData.disks];
    newDisks[idx] = { ...newDisks[idx], ...data };
    setFormData({ ...formData, disks: newDisks });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-white rounded-xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black font-display uppercase tracking-tight text-slate-900">Novo Projeto de Migração</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente Alvo</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Escopo e Especificação</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none min-h-[80px] transition-all"
              placeholder="Descreva o escopo técnico..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Início</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Previsão</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
          </div>

          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mapeamento de Discos</label>
              <button 
                onClick={addDisk}
                className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Disco
              </button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.disks.map((disk, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 group">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Caminho / Host" 
                      className="w-full bg-transparent text-[11px] font-mono outline-none"
                      value={disk.path}
                      onChange={e => updateDisk(idx, { path: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">TB Total</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-12 bg-white border border-slate-200 rounded text-right p-0.5 text-[10px] outline-none"
                        value={disk.storageMapeado}
                        onChange={e => updateDisk(idx, { storageMapeado: Number(e.target.value) })}
                      />
                    </div>
                    <button onClick={() => removeDisk(idx)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              {formData.disks.length === 0 && (
                <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-lg">Nenhum disco inicial</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
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
        </div>
      </motion.div>
    </div>
  );
}

function AIChatDrawer({ isOpen, onClose, migrations }: { isOpen: boolean, onClose: () => void, migrations: any[] }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

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
        body: JSON.stringify({ prompt, model: "gemini-1.5-flash" })
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-800 text-white"
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
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-xl text-[13px] leading-relaxed shadow-lg ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                      : 'bg-slate-800/60 text-slate-200 rounded-tl-none border border-slate-800'
                  }`}>
                    {m.content}
                  </div>
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
                  placeholder="Instrução analítica..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-4 pl-4 pr-12 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 shadow-inner transition-colors"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
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
function MigrationDetails({ migration, onUpdate }: { migration: any, onUpdate: (data: any) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDisks, setEditedDisks] = useState<Disk[]>(migration.disks || []);

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove dots (common thousand separator in PT-BR) and replace comma with dot for decimal
    const cleanVal = String(val).replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanVal) || 0;
  };

  const summary = {
    totalPastas: editedDisks.reduce((acc, d) => acc + parseNum(d.totalPastas), 0),
    pastasRealizadas: editedDisks.reduce((acc, d) => {
      const total = parseNum(d.totalPastas);
      const realized = parseNum(d.pastasRealizadas);
      // Cap realized by total to avoid over-counting cumulative data in the summary
      return acc + Math.min(realized, total);
    }, 0),
    estudosEnviados: editedDisks.reduce((acc, d) => acc + parseNum(d.estudos), 0),
    progresso: 0
  };

  const total = summary.totalPastas;
  const realized = summary.pastasRealizadas;
  summary.progresso = total > 0 ? Number(((realized / total) * 100).toFixed(2)) : 0;

  const addDisk = () => {
    setEditedDisks([...editedDisks, { 
      path: '', 
      status: 'Pendente', 
      pastasRealizadas: 0, 
      estudos: 0, 
      send: 0, 
      totalPastas: 0, 
      storageMapeado: 0, 
      storageEnviado: 0 
    }]);
    setIsEditing(true);
  };

  const removeDisk = (index: number) => {
    const newDisks = [...editedDisks];
    newDisks.splice(index, 1);
    setEditedDisks(newDisks);
    setIsEditing(true);
  };

  const updateDisk = (index: number, data: Partial<Disk>) => {
    const newDisks = [...editedDisks];
    newDisks[index] = { ...newDisks[index], ...data };
    setEditedDisks(newDisks);
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onUpdate({ disks: editedDisks });
    setIsEditing(false);
  };

  const generateAISummary = async () => {
    try {
      const diskContext = editedDisks.map(d => `- Caminho: ${d.path}, Status: ${d.status}, Pastas: ${d.pastasRealizadas}/${d.totalPastas}, Storage: ${d.storageEnviado}/${d.storageMapeado} TB`).join('\n');
      const prompt = `Gere um resumo executivo técnico curto (máximo 4 parágrafos) para a migração do cliente ${migration.clientName}. 
      Contexto dos discos:\n${diskContext}\n
      Destaque o progresso total (${summary.progresso}%), gargalos e recomendações. Use um tom profissional e direto.`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: "gemini-1.5-flash" })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      alert("Resumo gerado:\n\n" + data.text);
    } catch (error) {
      console.error("AI Error:", error);
      alert("Erro ao gerar resumo via IA.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Summary Card - Matches Design in Image */}
        <div className="lg:col-span-1 border border-blue-200 rounded-lg overflow-hidden shadow-sm h-fit">
          <div className="bg-blue-600/20 px-4 py-2 border-b border-blue-200 flex justify-between items-center">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tighter">Resumo Executivo</h3>
            <Sparkles className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition-transform" onClick={generateAISummary} />
          </div>
          <div className="p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-500">Total de pastas</span>
              <span className="font-mono text-slate-900 font-black">{summary.totalPastas.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-500">Pastas Realizadas</span>
              <span className="font-mono text-slate-900 font-black">{summary.pastasRealizadas.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-500">Estudos enviados</span>
              <span className="font-mono text-slate-900 font-black">{summary.estudosEnviados.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Progresso</span>
              <span className="font-mono text-blue-600 font-black">{summary.progresso}%</span>
            </div>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
             <button 
              onClick={addDisk}
              className="flex-1 bg-slate-900 text-white py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" /> Adicionar Disco
            </button>
            {isEditing && (
              <button 
                onClick={handleSave}
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-all active:scale-95"
                title="Salvar Alterações"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Disks Table - Matches Design in Image */}
        <div className="lg:col-span-4 border border-blue-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <div className="bg-blue-600/20 px-4 py-2 border-b border-blue-200 flex justify-between items-center">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tighter">Discos - {migration.clientName}</h3>
            <Settings2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[750px] table-fixed">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-500 uppercase tracking-tighter border-b border-slate-200 text-center">
                  <th className="p-2 text-left w-[22%] border-r border-slate-200">Caminho</th>
                  <th className="p-2 w-[12%] border-r border-slate-200">Status</th>
                  <th className="p-2 w-[10%] border-r border-slate-200">Realizadas</th>
                  <th className="p-2 w-[8%] border-r border-slate-200">Estudos</th>
                  <th className="p-2 w-[8%] border-r border-slate-200">Send</th>
                  <th className="p-2 w-[10%] border-r border-slate-200">Total</th>
                  <th className="p-2 w-[12%] border-r border-slate-200" colSpan={2}>Mapeado</th>
                  <th className="p-2 w-[12%] border-r border-slate-200" colSpan={2}>Enviado</th>
                  <th className="p-2 w-[6%]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {editedDisks.map((disk, idx) => (
                  <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="p-1 border-r border-slate-100">
                      <input 
                        type="text" 
                        value={disk.path} 
                        onChange={e => updateDisk(idx, { path: e.target.value })}
                        className="w-full bg-transparent p-1 text-[10px] font-mono text-slate-600 focus:bg-white outline-none rounded border border-transparent focus:border-blue-200"
                        placeholder="\\servidor\pasta..."
                      />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-center">
                      <select 
                        value={disk.status}
                        onChange={e => updateDisk(idx, { status: e.target.value as any })}
                        className={`text-[9px] font-bold p-1 rounded-full px-2 w-full outline-none appearance-none text-center cursor-pointer ${
                          disk.status === 'Realizado' ? 'bg-emerald-100 text-emerald-700' :
                          disk.status === 'Realizando' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <option value="Realizado">Realizado</option>
                        <option value="Realizando">Realizando</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </td>
                    <td className="p-1 border-r border-slate-100 text-center">
                      <input type="number" value={disk.pastasRealizadas} onChange={e => updateDisk(idx, { pastasRealizadas: Number(e.target.value) })} className="w-full bg-transparent text-center text-[10px] font-mono outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-center">
                      <input type="number" value={disk.estudos} onChange={e => updateDisk(idx, { estudos: Number(e.target.value) })} className="w-full bg-transparent text-center text-[10px] font-mono outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-center">
                      <input type="number" value={disk.send} onChange={e => updateDisk(idx, { send: Number(e.target.value) })} className="w-full bg-transparent text-center text-[10px] font-mono outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-center">
                      <input type="number" value={disk.totalPastas} onChange={e => updateDisk(idx, { totalPastas: Number(e.target.value) })} className="w-full bg-transparent text-center text-[10px] font-mono outline-none" />
                    </td>
                    <td className="p-1 text-center text-[10px] font-mono text-slate-500">
                      <input type="number" step="0.01" value={disk.storageMapeado} onChange={e => updateDisk(idx, { storageMapeado: Number(e.target.value) })} className="w-10 bg-transparent text-right outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-[8px] font-black text-slate-400">TB</td>
                    <td className="p-1 text-center text-[10px] font-mono text-slate-500">
                      <input type="number" step="0.01" value={disk.storageEnviado} onChange={e => updateDisk(idx, { storageEnviado: Number(e.target.value) })} className="w-10 bg-transparent text-right outline-none" />
                    </td>
                    <td className="p-1 border-r border-slate-100 text-[8px] font-black text-slate-400">TB</td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => removeDisk(idx)}
                        className="p-1 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {editedDisks.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Nenhum disco mapeado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6">Curva de Transferência (Storage)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={editedDisks}>
            <defs>
              <linearGradient id="colorMapeado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEnviado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
  );
}
