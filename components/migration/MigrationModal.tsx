'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, FileUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Disk, DiskGroup } from '@/hooks/use-firestore';
import { NumericInput } from '@/components/common/NumericInput';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onAdd: (m: any) => Promise<void>;
  isGuest: boolean;
}

export default function MigrationModal({ isOpen, onClose, clients, onAdd, isGuest }: MigrationModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    status: 'pendente' as const,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reportUrl: '',
    imageUrl: '',
    isIncremental: false,
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
        disks: g.disks.filter((_, i) => i !== diskIdx)
      } : g)
    });
  };

  const updateDiskInGroup = (groupId: string, diskIdx: number, data: Partial<Disk>) => {
    if (isGuest) return;
    setFormData({
      ...formData,
      groups: formData.groups.map(g => g.id === groupId ? {
        ...g,
        disks: g.disks.map((d, i) => i === diskIdx ? { ...d, ...data } : d)
      } : g)
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    if (isGuest) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const dataRows = data.slice(1);
      const headers = data[0].map((h: any) => String(h).toLowerCase());

      const findIdx = (possibleNames: string[]) => headers.findIndex(h => possibleNames.some(p => h.includes(p)));

      const sanitizeNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = String(val).replace(/[^\d,.]/g, '');
        if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
        return parseFloat(s) || 0;
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

          <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Cenário Incremental</p>
              <p className="text-[9px] text-blue-700 font-bold leading-tight">Ative se os dados de pastas e estudos forem cumulativos/somados nos discos.</p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, isIncremental: !formData.isIncremental })}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.isIncremental
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-white text-slate-400 border border-slate-200'
                }`}
            >
              {formData.isIncremental ? 'Ativado' : 'Desativado'}
            </button>
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
