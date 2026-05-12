'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Edit2, 
  Trash2, 
  FileText, 
  Copy 
} from 'lucide-react';
import { format } from 'date-fns';

interface ClientsViewProps {
  clients: any[];
  isGuest: boolean;
  setClientToEdit: (client: any) => void;
  setIsClientModalOpen: (isOpen: boolean) => void;
  triggerDelete: (type: 'client' | 'migration', id: string, label: string) => void;
}

export default function ClientsView({
  clients,
  isGuest,
  setClientToEdit,
  setIsClientModalOpen,
  triggerDelete
}: ClientsViewProps) {
  return (
    <motion.div
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
                <span className="text-slate-900">{client.createdAt?.seconds ? format(new Date(client.createdAt.seconds * 1000), 'dd/MM/yyyy') : '...'}</span>
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
              <th className="px-6 py-4">Cliente / Empresa</th>
              <th className="px-6 py-4">Observações</th>
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
