'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Edit2, 
  Trash2, 
  FileText, 
  Copy,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { formatFirestoreDate } from '@/lib/utils';

interface ClientsViewProps {
  clients: any[];
  isGuest: boolean;
  setClientToEdit: (client: any) => void;
  setIsClientModalOpen: (isOpen: boolean) => void;
  triggerDelete: (type: 'client' | 'migration', id: string, label: string) => void;
  repairClientDates?: () => Promise<number>;
}

export default function ClientsView({
  clients,
  isGuest,
  setClientToEdit,
  setIsClientModalOpen,
  triggerDelete,
  repairClientDates
}: ClientsViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const sortedClients = useMemo(() => {
    let sortableItems = [...clients];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Case insensitive for strings
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        // Handle nested objects like createdAt
        if (sortConfig.key === 'createdAt') {
          const getTime = (date: any) => {
            if (!date) return 0;
            if (date.seconds) return date.seconds;
            const d = new Date(date);
            return isNaN(d.getTime()) ? 0 : Math.floor(d.getTime() / 1000);
          };
          aValue = getTime(a.createdAt);
          bValue = getTime(b.createdAt);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [clients, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Maintenance / Repair Header */}
      {repairClientDates && clients.some(c => !c.createdAt || (typeof c.createdAt === 'object' && !('seconds' in c.createdAt) && !(c.createdAt instanceof Date))) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Inconsistência de Dados Detectada</p>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">Alguns clientes estão sem data de cadastro.</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              const count = await repairClientDates();
              alert(`${count} registros corrigidos com sucesso!`);
            }}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md active:scale-95"
          >
            Corrigir Agora
          </button>
        </div>
      )}

      {/* Mobile Toolbar for Sorting */}
      <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => requestSort('name')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sortConfig?.key === 'name' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          Nome {getSortIcon('name')}
        </button>
        <button 
          onClick={() => requestSort('createdAt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sortConfig?.key === 'createdAt' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          Data {getSortIcon('createdAt')}
        </button>
      </div>

      {/* Mobile Card Layout for Clients */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedClients.map((client) => (
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
                    onClick={() => triggerDelete('client', client.id!, client.name)}
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
                <span className="text-slate-900">{formatFirestoreDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View for Clients */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
              <th 
                className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-2">
                  Cliente / Empresa {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-4">Observações</th>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('email')}
              >
                <div className="flex items-center gap-2">
                  Contato {getSortIcon('email')}
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Data de Cadastro {getSortIcon('createdAt')}
                </div>
              </th>
              <th className="px-6 py-4 text-right pr-12">Operação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedClients.map((client) => (
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
                  {client.description && client.description !== "" && (
                    <div className="relative group/tooltip">
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ver Notas</span>
                      </button>

                      <div className="absolute left-0 top-full mt-2 w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-auto">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações Técnicas</span>
                          <button
                            onClick={() => {
                              const text = (client.description || '').replace(/<[^>]*>/g, '\n'); // Simple HTML to Text
                              navigator.clipboard.writeText(text);
                              alert('Conteúdo copiado!');
                            }}
                            className="flex items-center gap-1.5 text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-all"
                          >
                            <Copy className="w-3 h-3" /> COPIAR
                          </button>
                        </div>
                        <div
                          className="text-[11px] text-slate-600 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar prose prose-xs pr-2"
                          dangerouslySetInnerHTML={{ __html: client.description || '' }}
                        />
                        <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45" />
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-slate-600">{client.email}</p>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                  {formatFirestoreDate(client.createdAt, 'dd.MM.yyyy')}
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
                        onClick={() => triggerDelete('client', client.id!, client.name)}
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
  );
}
