import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Edit2, 
  Trash2, 
  HardDrive, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown 
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getClientName, getAllDisks, parseNum } from '@/lib/utils';

interface MigrationsViewProps {
  migrations: any[];
  clients: any[];
  isGuest: boolean;
  sortOrder: 'asc' | 'desc' | 'none';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc' | 'none'>>;
  setSelectedMigrationId: (id: string | null) => void;
  updateMigration: (id: string, data: any) => Promise<void>;
  triggerDelete: (type: 'client' | 'migration', id: string, label: string) => void;
}

export default function MigrationsView({
  migrations,
  clients,
  isGuest,
  sortOrder: _sortOrder,
  setSortOrder: _setSortOrder,
  setSelectedMigrationId,
  updateMigration,
  triggerDelete
}: MigrationsViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'clientName', direction: 'asc' });

  const sortedMigrations = useMemo(() => {
    let sortableItems = [...migrations].map(m => ({
      ...m,
      clientName: getClientName(m, clients)
    }));

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        if (sortConfig.key === 'progress') {
          const disksA = getAllDisks(a);
          const totalA = disksA.reduce((sum: number, d: any) => sum + parseNum(d.totalPastas), 0);
          const realizedA = disksA.reduce((sum: number, d: any) => sum + Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas)), 0);
          aValue = totalA > 0 ? realizedA / totalA : 0;

          const disksB = getAllDisks(b);
          const totalB = disksB.reduce((sum: number, d: any) => sum + parseNum(d.totalPastas), 0);
          const realizedB = disksB.reduce((sum: number, d: any) => sum + Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas)), 0);
          bValue = totalB > 0 ? realizedB / totalB : 0;
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

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
  }, [migrations, clients, sortConfig]);

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

  const statusMap: Record<string, { color: string, label: string }> = {
    pendente: { color: 'bg-slate-100 text-slate-600', label: 'Pendente' },
    em_progresso: { color: 'bg-blue-100 text-blue-600', label: 'Execução' },
    pausado: { color: 'bg-amber-100 text-amber-600', label: 'Pausado' },
    concluida: { color: 'bg-emerald-100 text-emerald-600', label: 'Concluída' },
    atrasada: { color: 'bg-rose-100 text-rose-600', label: 'Atraso' },
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 gap-6"
    >
      {/* Mobile Toolbar for Sorting */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => requestSort('clientName')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sortConfig?.key === 'clientName' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          Nome {getSortIcon('clientName')}
        </button>
        <button 
          onClick={() => requestSort('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sortConfig?.key === 'progress' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          Progresso {getSortIcon('progress')}
        </button>
        <button 
          onClick={() => requestSort('endDate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${sortConfig?.key === 'endDate' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          Data {getSortIcon('endDate')}
        </button>
      </div>

      {/* Mobile Card Layout for Migrations */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedMigrations.map((m) => {
          const statusConfig = statusMap[m.status as keyof typeof statusMap] || statusMap.pendente;

          const allDisks = getAllDisks(m);
          const total = allDisks.reduce((sum: number, d: any) => sum + parseNum(d.totalPastas), 0);
          const realized = allDisks.reduce((sum: number, d: any) => {
            const t = parseNum(d.totalPastas);
            const r = parseNum(d.pastasRealizadas);
            return sum + Math.min(r, t);
          }, 0);
          const progress = total > 0 ? Math.round((realized / total) * 100) : 0;

          return (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all" onClick={() => setSelectedMigrationId(m.id!)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{getClientName(m, clients)}</p>
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
                        onClick={(e) => { e.stopPropagation(); triggerDelete('migration', m.id!, getClientName(m, clients)); }}
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
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
              <th 
                className="px-6 py-4 w-[25%] cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('clientName')}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">Identificação</span>
                  {getSortIcon('clientName')}
                </div>
              </th>
              <th className="px-6 py-4 w-[20%]">Escopo</th>
              <th 
                className="px-6 py-4 text-center w-[20%] cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('progress')}
              >
                <div className="flex items-center justify-center gap-2">
                  Progresso {getSortIcon('progress')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center w-[20%] cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center justify-center gap-2">
                  Status {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-4 w-[12%] text-center cursor-pointer hover:text-white transition-colors group"
                onClick={() => requestSort('endDate')}
              >
                <div className="flex items-center justify-center gap-2">
                  Data {getSortIcon('endDate')}
                </div>
              </th>
              <th className="px-6 py-4 text-right pr-6 w-[8%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMigrations.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 overflow-hidden">
                  <button
                    onClick={() => setSelectedMigrationId(m.id!)}
                    className="text-left group/btn w-full overflow-hidden"
                  >
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter group-hover/btn:text-blue-600 transition-colors truncate">{getClientName(m, clients)}</p>
                    <span className="text-[10px] font-mono text-slate-400 italic truncate block">REFSUB-{m.id?.slice(-6)}</span>
                  </button>
                </td>
                <td className="px-6 py-4 overflow-hidden">
                  <p className="text-xs text-slate-600 leading-relaxed italic truncate">{m.description || 'Nenhuma descrição'}</p>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const allDisks = getAllDisks(m);
                    const total = allDisks.reduce((sum: number, d: any) => sum + parseNum(d.totalPastas), 0);
                    const realized = allDisks.reduce((sum: number, d: any) => {
                      const t = parseNum(d.totalPastas);
                      const r = parseNum(d.pastasRealizadas);
                      return sum + Math.min(r, t);
                    }, 0);
                    const progress = total > 0 ? Math.round((realized / total) * 100) : 0;
                    return (
                      <div className="flex items-center justify-center gap-3 w-full">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-black min-w-[30px] ${progress === 100 ? 'text-emerald-600' : 'text-slate-900'}`}>{progress}%</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <StatusBadge status={m.status} />
                    {!isGuest && (
                      <select
                        value={m.status}
                        onChange={(e) => { e.stopPropagation(); updateMigration(m.id!, { status: e.target.value as any }); }}
                        onClick={(e) => e.stopPropagation()}
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
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                    <span className="uppercase tracking-widest">{m.endDate?.split('-').reverse().slice(0, 2).join('/') || '...'}</span>
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
                        onClick={(e) => { e.stopPropagation(); triggerDelete('migration', m.id!, getClientName(m, clients)); }}
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
  );
}
