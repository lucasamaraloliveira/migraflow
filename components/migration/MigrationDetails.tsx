'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  FileUp,
  Plus,
  MessageSquare,
  FileText,
  FilePlus,
  X,
  Sparkles,
  Check,
  Copy,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
  Bar,
  Line
} from 'recharts';
import { Disk, DiskGroup, Laudo } from '@/hooks/use-firestore';
import { NumericInput } from '@/components/common/NumericInput';
import { parseNum } from '@/lib/utils';

interface MigrationDetailsProps {
  migration: any;
  onUpdate: (data: any) => Promise<void>;
  isGuest: boolean;
}

export default function MigrationDetails({ migration, onUpdate, isGuest }: MigrationDetailsProps) {
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

  // Security: Delete Confirmation & Undo
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ groupId: string, idx: number, type: 'disk' | 'laudo' } | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ groupId: string, type: 'all' } | null>(null);
  const [lastDeletedDisk, setLastDeletedDisk] = useState<{ groupId: string, disk: Disk, idx: number } | null>(null);
  const [lastDeletedLaudo, setLastDeletedLaudo] = useState<{ groupId: string, laudo: Laudo, idx: number } | null>(null);
  const [lastBulkDelete, setLastBulkDelete] = useState<{ groupId: string, data: { disks: Disk[], laudos: Laudo[] } } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoType, setUndoType] = useState<'disk' | 'laudo' | 'bulk'>('disk');

  useEffect(() => {
    setEditedGroups(migration.groups || (migration.disks?.length > 0 ? [{ id: 'default', title: 'Unidade Principal', disks: migration.disks }] : [{ id: 'default', title: 'Unidade Principal', disks: [] }]));
  }, [migration.groups, migration.disks]);

  const allDisks = editedGroups.flatMap(g => g.disks);

  const summary = {
    totalPastas: migration.isIncremental
      ? Math.max(0, ...allDisks.map(d => parseNum(d.totalPastas)))
      : allDisks.reduce((acc, d) => acc + parseNum(d.totalPastas), 0),
    pastasRealizadas: migration.isIncremental
      ? Math.max(0, ...allDisks.map(d => Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas))))
      : allDisks.reduce((acc, d) => {
        const total = parseNum(d.totalPastas);
        const realized = parseNum(d.pastasRealizadas);
        return acc + Math.min(realized, total);
      }, 0),
    estudosEnviados: migration.isIncremental
      ? Math.max(0, ...allDisks.map(d => parseNum(d.estudos)))
      : allDisks.reduce((acc, d) => acc + parseNum(d.estudos), 0),
    storageMapeado: allDisks.reduce((acc, d) => acc + parseNum(d.storageMapeado), 0),
    storageEnviado: allDisks.reduce((acc, d) => acc + parseNum(d.storageEnviado), 0),
    progresso: 0
  };

  const total = summary.totalPastas;
  const realized = summary.pastasRealizadas;
  summary.progresso = total > 0 ? Math.min(100, Number(((realized / total) * 100).toFixed(2))) : 0;

  const allLaudos = editedGroups.flatMap(g => g.laudos || []);
  const laudosSummary = {
    total: allLaudos.reduce((acc, l) => acc + parseNum(l.total), 0),
    realizados: allLaudos.reduce((acc, l) => acc + parseNum(l.realizados), 0),
    progresso: 0
  };
  laudosSummary.progresso = laudosSummary.total > 0 ? Math.min(100, Number(((laudosSummary.realizados / laudosSummary.total) * 100).toFixed(2))) : 0;

  const getGroupSummary = (groupDisks: Disk[]) => {
    const isIncremental = migration.isIncremental;
    const totalPastas = isIncremental
      ? Math.max(0, ...groupDisks.map(d => parseNum(d.totalPastas)))
      : groupDisks.reduce((acc, d) => acc + parseNum(d.totalPastas), 0);
    const pastasRealizadas = isIncremental
      ? Math.max(0, ...groupDisks.map(d => Math.min(parseNum(d.pastasRealizadas), parseNum(d.totalPastas))))
      : groupDisks.reduce((acc, d) => {
        const total = parseNum(d.totalPastas);
        const realized = parseNum(d.pastasRealizadas);
        return acc + Math.min(realized, total);
      }, 0);
    const estudosEnviados = isIncremental
      ? Math.max(0, ...groupDisks.map(d => parseNum(d.estudos)))
      : groupDisks.reduce((acc, d) => acc + parseNum(d.estudos), 0);
    const storageMapeado = groupDisks.reduce((acc, d) => acc + parseNum(d.storageMapeado), 0);
    const storageEnviado = groupDisks.reduce((acc, d) => acc + parseNum(d.storageEnviado), 0);
    const progresso = totalPastas > 0 ? Number(((pastasRealizadas / totalPastas) * 100).toFixed(2)) : 0;

    return { totalPastas, pastasRealizadas, estudosEnviados, storageMapeado, storageEnviado, progresso };
  };

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

  const askRemoveDisk = (groupId: string, diskIdx: number) => {
    if (isGuest) return;
    setDeleteTarget({ groupId, idx: diskIdx, type: 'disk' });
    setIsDeleteConfirmOpen(true);
  };

  const askRemoveLaudo = (groupId: string, laudoIdx: number) => {
    if (isGuest) return;
    setDeleteTarget({ groupId, idx: laudoIdx, type: 'laudo' });
    setIsDeleteConfirmOpen(true);
  };

  const clearAllData = (groupId: string) => {
    if (isGuest) return;
    setBulkDeleteTarget({ groupId, type: 'all' });
    setIsDeleteConfirmOpen(true);
  };

  const confirmRemoveItem = () => {
    if (!deleteTarget || isGuest) return;
    const { groupId, idx, type } = deleteTarget;

    const group = editedGroups.find(g => g.id === groupId);
    if (!group) return;

    if (type === 'disk') {
      const diskToDelete = group.disks[idx];
      setLastDeletedDisk({ groupId, disk: diskToDelete, idx });
      setUndoType('disk');
      setEditedGroups(editedGroups.map(g => g.id === groupId ? {
        ...g,
        disks: g.disks.filter((_: Disk, i: number) => i !== idx)
      } : g));
    } else {
      const laudoToDelete = (group.laudos || [])[idx];
      setLastDeletedLaudo({ groupId, laudo: laudoToDelete, idx });
      setUndoType('laudo');
      setEditedGroups(editedGroups.map(g => g.id === groupId ? {
        ...g,
        laudos: (group.laudos || []).filter((_: Laudo, i: number) => i !== idx)
      } : g));
    }

    setIsEditing(true);
    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 8000);
  };

  const confirmBulkDelete = () => {
    if (!bulkDeleteTarget || isGuest) return;
    const { groupId } = bulkDeleteTarget;

    const group = editedGroups.find(g => g.id === groupId);
    if (!group) return;

    setLastBulkDelete({ groupId, data: { disks: group.disks || [], laudos: group.laudos || [] } });
    setUndoType('bulk');

    setEditedGroups(editedGroups.map(g => g.id === groupId ? { ...g, disks: [], laudos: [] } : g));

    setIsEditing(true);
    setIsDeleteConfirmOpen(false);
    setBulkDeleteTarget(null);
    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 8000);
  };

  const undoDelete = () => {
    if (isGuest) return;

    if (undoType === 'disk' && lastDeletedDisk) {
      const { groupId, disk, idx } = lastDeletedDisk;
      setEditedGroups(editedGroups.map(g => g.id === groupId ? {
        ...g,
        disks: [...g.disks.slice(0, idx), disk, ...g.disks.slice(idx)]
      } : g));
      setLastDeletedDisk(null);
    } else if (undoType === 'laudo' && lastDeletedLaudo) {
      const { groupId, laudo, idx } = lastDeletedLaudo;
      setEditedGroups(editedGroups.map(g => g.id === groupId ? {
        ...g,
        laudos: [...(g.laudos || []).slice(0, idx), laudo, ...(g.laudos || []).slice(idx)]
      } : g));
      setLastDeletedLaudo(null);
    } else if (undoType === 'bulk' && lastBulkDelete) {
      const { groupId, data } = lastBulkDelete;
      setEditedGroups(editedGroups.map(g => g.id === groupId ? { ...g, disks: data.disks, laudos: data.laudos } : g));
      setLastBulkDelete(null);
    }
    setShowUndoToast(false);
  };

  const removeDiskFromGroup = (groupId: string, diskIdx: number) => {
    askRemoveDisk(groupId, diskIdx);
  };

  const updateDiskInGroup = (groupId: string, diskIdx: number, data: Partial<Disk>) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      disks: g.disks.map((d: Disk, i: number) => i === diskIdx ? { ...d, ...data } : d)
    } : g));
    setIsEditing(true);
  };

  const addLaudoToGroup = (groupId: string) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      laudos: [...(g.laudos || []), {
        id: crypto.randomUUID(),
        periodo: '',
        status: 'Pendente',
        realizados: 0,
        total: 0
      }]
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

  const updateLaudoInGroup = (groupId: string, laudoId: string, data: Partial<Laudo>) => {
    if (isGuest) return;
    setEditedGroups(editedGroups.map(g => g.id === groupId ? {
      ...g,
      laudos: (g.laudos || []).map(l => l.id === laudoId ? { ...l, ...data } : l)
    } : g));
    setIsEditing(true);
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

      // Detect if it's Disks or Laudos
      const isLaudos = rows.some(r => r.some(c => String(c || '').toLowerCase().includes('período') || String(c || '').toLowerCase().includes('periodo')));

      const headerRowIdx = rows.findIndex(r =>
        r.some(c => {
          const val = String(c || '').toLowerCase();
          return isLaudos ? (val.includes('período') || val.includes('periodo')) : (val.includes('caminho') || val.includes('path'));
        })
      );

      if (headerRowIdx === -1) {
        alert("Não foi possível encontrar o cabeçalho correto na planilha.");
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
        const s = String(val).replace(/[^\d,.-]/g, '');
        if (s.includes(',')) {
          const cleanVal = s.replace(/\./g, '').replace(',', '.');
          return parseFloat(cleanVal) || 0;
        }
        return parseFloat(s) || 0;
      };

      if (isLaudos) {
        const perIdx = findIdx(['período', 'periodo', 'mês', 'mes', 'data']);
        const statusIdx = findIdx(['status']);
        const realIdx = findIdx(['realizados', 'concluídos', 'realizac']);
        const totIdx = findIdx(['total', 'meta']);

        const importedLaudos: Laudo[] = dataRows
          .filter(row => row.length > 0)
          .map(row => {
            let periodoVal = '';
            if (perIdx !== -1) {
              const rawVal = row[perIdx];
              if (rawVal instanceof Date) {
                periodoVal = format(rawVal, 'MM/yyyy');
              } else if (typeof rawVal === 'number' && rawVal > 1000) {
                // Handle Excel serial date
                const date = XLSX.SSF.parse_date_code(rawVal);
                periodoVal = `${String(date.m).padStart(2, '0')}/${date.y}`;
              } else {
                periodoVal = String(rawVal || '');
              }
            }

            return {
              id: crypto.randomUUID(),
              periodo: periodoVal,
              status: (String(statusIdx !== -1 ? (row[statusIdx] || '') : '').toLowerCase().includes('realizado') ? 'Realizado' : 'Pendente') as any,
              realizados: sanitizeNum(realIdx !== -1 ? row[realIdx] : 0),
              total: sanitizeNum(totIdx !== -1 ? row[totIdx] : 0)
            };
          })
          .filter(l => l.periodo || l.total > 0);

        setEditedGroups(prev => prev.map(g => g.id === groupId ? { ...g, laudos: [...(g.laudos || []), ...importedLaudos] } : g));
      } else {
        let lastCumulative = 0;
        let lastMapeado = 0;
        let lastEnviado = 0;

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
            const currentMapeado = sanitizeNum(mapIdx !== -1 ? row[mapIdx] : 0);
            const currentEnviado = sanitizeNum(envIdx !== -1 ? row[envIdx] : 0);

            if (currentMapeado < lastMapeado) lastMapeado = 0;
            if (currentEnviado < lastEnviado) lastEnviado = 0;

            const individualMapeado = Math.max(0, currentMapeado - lastMapeado);
            const individualEnviado = Math.max(0, currentEnviado - lastMapeado);

            lastMapeado = currentMapeado;
            lastEnviado = currentEnviado;

            if (currentCumulative < lastCumulative) lastCumulative = 0;
            const individualRealized = Math.max(0, currentCumulative - lastCumulative);
            lastCumulative = currentCumulative;

            const statusVal = String(statusIdx !== -1 ? row[statusIdx] : '').toLowerCase();
            const isFinished = statusVal.includes('realizado') || statusVal.includes('concluido') || statusVal.includes('finalizado') || (individualRealized >= total && total > 0);

            const finalIndividualEnviado = individualEnviado > 0 ? individualEnviado : individualMapeado;

            return {
              path: currentPath,
              status: isFinished ? 'Realizado' : 'Pendente',
              pastasRealizadas: isFinished ? total : individualRealized,
              estudos: sanitizeNum(estIdx !== -1 ? row[estIdx] : 0),
              send: sanitizeNum(sendIdx !== -1 ? row[sendIdx] : 0),
              totalPastas: total,
              storageMapeado: individualMapeado,
              storageEnviado: finalIndividualEnviado,
              destination: destIdx !== -1 ? String(row[destIdx]) : undefined
            };
          });

        setEditedGroups(prev => prev.map(g => g.id === groupId ? { ...g, disks: [...g.disks, ...importedDisks] } : g));
      }
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
    // Guest Quota Logic
    if (isGuest) {
      const today = new Date().toLocaleDateString();
      const quotaData = JSON.parse(localStorage.getItem('migraflow_ai_quota') || '{}');

      if (quotaData.date !== today) {
        // New day, reset quota
        quotaData.date = today;
        quotaData.count = 0;
      }

      if (quotaData.count >= 2) {
        alert("📊 Cota Diária Atingida: Visitantes podem gerar até 2 insights por dia. Entre em contato com o administrador para acesso completo.");
        return;
      }

      // Increment and save
      quotaData.count += 1;
      localStorage.setItem('migraflow_ai_quota', JSON.stringify(quotaData));
    }

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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Resumo Geral</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdate({ isIncremental: !migration.isIncremental })}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${migration.isIncremental
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
            >
              {migration.isIncremental ? 'Cenário Incremental: ATIVO' : 'Cenário Incremental: INATIVO'}
            </button>
            {isEditing && (
              <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">Salvar</button>
            )}
            <button onClick={generateAISummary} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">IA Insight</button>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {editedGroups.map((group) => {
          const groupSummary = getGroupSummary(group.disks);
          return (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 w-full">
                  <div className="flex flex-col flex-1 min-w-0">
                    <input
                      type="text"
                      readOnly={isGuest}
                      className="text-sm font-black text-slate-900 uppercase tracking-tight bg-transparent border-b border-transparent focus:border-blue-600 outline-none transition-all w-full md:w-auto"
                      value={group.title}
                      onChange={e => updateGroupTitle(group.id, e.target.value)}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identificador de Unidade</span>
                  </div>
                  {!isGuest && editedGroups.length > 1 && (
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95 group/del shrink-0"
                      title="Remover Unidade Inteira"
                    >
                      <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                    </button>
                  )}
                </div>

                {!isGuest && (
                  <div className="flex flex-wrap items-center gap-2">
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
                    <button
                      onClick={() => addLaudoToGroup(group.id)}
                      className="whitespace-nowrap text-[9px] bg-white text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add Laudo
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1 hidden md:block" />
                    <button
                      onClick={() => clearAllData(group.id)}
                      className="whitespace-nowrap text-[9px] text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      title="Apagar todos os dados desta unidade (Discos e Laudos)"
                    >
                      <Trash2 className="w-3 h-3" /> Limpar Tudo
                    </button>
                  </div>
                )}
              </div>

              {group.disks.length > 0 && (
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden bg-slate-50/30">
                  {group.disks.map((d: Disk, i: number) => {
                    const previousDisks = group.disks.slice(0, i);
                    const sumPrevEnviado = previousDisks.reduce((acc, prev) => acc + parseNum(prev.storageEnviado), 0);
                    const currentRunningEnviado = sumPrevEnviado + parseNum(d.storageEnviado);

                    return (
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
                            className={`text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1 outline-none border transition-all ${d.status === 'Realizado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              d.status === 'Realizando' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                                d.status === 'Pausado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  d.status === 'Reprocessamento de Erros' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Realizando">Realizando</option>
                            <option value="Pausado">Pausado</option>
                            <option value="Realizado">Realizado</option>
                            <option value="Reprocessamento de Erros">Reprocessamento de Erros</option>
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
                            <div className="relative group/tooltip">
                              {(!isGuest || d.comment) && (
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
                                  className={`p-2 rounded-xl transition-all ${d.comment
                                    ? getSeverityColor(d.comment.severity)
                                    : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                  <NumericInput
                                    isFloat
                                    readOnly={isGuest}
                                    value={currentRunningEnviado}
                                    onChange={v => {
                                      const sumPrevEnviado = previousDisks.reduce((acc, prev) => acc + parseNum(prev.storageEnviado), 0);
                                      const delta = Math.max(0, v - sumPrevEnviado);
                                      updateDiskInGroup(group.id, i, { storageMapeado: delta, storageEnviado: delta });
                                    }}
                                    className="w-16 text-right text-[11px] font-black text-emerald-600 bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-100 rounded px-1.5 py-0.5"
                                  />
                                  <span className="text-[8px] font-black text-emerald-500">TB</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-300">/</span>
                              <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black text-blue-500 uppercase mb-0.5">Incremento</span>
                                <div className="flex items-center gap-1">
                                  <NumericInput
                                    isFloat
                                    readOnly={isGuest}
                                    value={d.storageMapeado}
                                    onChange={v => updateDiskInGroup(group.id, i, { storageMapeado: v, storageEnviado: v })}
                                    className="w-16 text-left text-[11px] font-black text-slate-400 bg-slate-50 outline-none focus:ring-1 focus:ring-slate-100 rounded px-1.5 py-0.5"
                                  />
                                  <span className="text-[8px] font-black text-slate-400">TB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {group.disks.length > 0 && (
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
                      {group.disks.map((d: Disk, i: number) => {
                        const previousDisks = group.disks.slice(0, i);
                        const sumPrevEnviado = previousDisks.reduce((acc, prev) => acc + parseNum(prev.storageEnviado), 0);
                        const currentRunningEnviado = sumPrevEnviado + parseNum(d.storageEnviado);

                        return (
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
                                      d.status === 'Reprocessamento de Erros' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        'bg-slate-50 text-slate-400 border-slate-100'
                                  }`}
                                value={d.status}
                                onChange={e => updateDiskInGroup(group.id, i, { status: e.target.value as any })}
                              >
                                <option value="Pendente">Pendente</option>
                                <option value="Realizando">Execução</option>
                                <option value="Pausado">Pausado</option>
                                <option value="Realizado">Finalizado</option>
                                <option value="Reprocessamento de Erros">Reprocessamento</option>
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
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1">
                                  <NumericInput
                                    isFloat
                                    readOnly={isGuest}
                                    className="w-20 bg-slate-50 text-center text-xs font-black outline-none rounded py-1 px-1.5"
                                    value={d.storageMapeado}
                                    onChange={v => updateDiskInGroup(group.id, i, { storageMapeado: v, storageEnviado: v })}
                                  />
                                  <span className="text-[8px] font-black text-slate-400">TB</span>
                                </div>
                                <span className="text-[7px] font-black text-slate-400 uppercase leading-none">Incremento</span>
                              </div>
                            </td>
                            <td className="p-4 text-center text-[10px] font-mono font-bold text-slate-900">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1">
                                  <NumericInput
                                    isFloat
                                    readOnly={isGuest}
                                    className="w-20 bg-emerald-50 text-center text-xs font-black outline-none rounded border border-emerald-100 py-1 px-1.5"
                                    value={currentRunningEnviado}
                                    onChange={v => {
                                      const sumPrevEnviado = previousDisks.reduce((acc, prev) => acc + parseNum(prev.storageEnviado), 0);
                                      const delta = Math.max(0, v - sumPrevEnviado);
                                      updateDiskInGroup(group.id, i, { storageMapeado: delta, storageEnviado: delta });
                                    }}
                                  />
                                  <span className="text-[8px] font-black text-emerald-600">TB</span>
                                </div>
                                <span className="text-[7px] font-black text-emerald-600 uppercase leading-none text-center">Total Unidade</span>
                              </div>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setCommentModalTarget({ groupId: group.id, diskIdx: i });
                                    setCommentText(d.comment?.text || '');
                                    setCommentSeverity(d.comment?.severity || 'sem_prioridade');
                                    setIsCommentModalOpen(true);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${d.comment ? getSeverityColor(d.comment.severity) : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => removeDiskFromGroup(group.id, i)}
                                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Laudos Table Section */}
              {((group.laudos && group.laudos.length > 0) || group.disks.length === 0) && (
                <div className={`mt-0 pt-0 ${group.disks.length > 0 ? 'mt-8 pt-8 border-t border-slate-100' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-6 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Relatórios Clínicos / Laudos</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Acompanhamento por Período</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Global da Unidade</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0) / ((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.total), 0) || 1)) * 100).toFixed(1)}%` }}
                              className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            />
                          </div>
                          <span className="text-xs font-black text-blue-600">
                            {(((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0) / ((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.total), 0) || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 border-l border-slate-200 pl-6">
                        {!isGuest && (
                          <button
                            onClick={() => addLaudoToGroup(group.id)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Período
                          </button>
                        )}
                        {!isGuest && group.laudos && group.laudos.length > 0 && (
                          <button
                            onClick={() => clearAllData(group.id)}
                            className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline px-2"
                          >
                            Limpar Tudo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Summary Cards for this Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 px-6">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Laudos</p>
                      <p className="text-xl font-black text-slate-900 font-mono">
                        {(group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.total), 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm border-l-4 border-l-blue-600">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Realizados</p>
                      <p className="text-xl font-black text-slate-900 font-mono">
                        {(group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Pendente</p>
                      <p className="text-xl font-black text-slate-900 font-mono">
                        {((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.total), 0) - (group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0)).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-900/20">
                      <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-1">Progresso Final</p>
                      <p className="text-xl font-black text-white font-mono">
                        {(((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.realizados), 0) / ((group.laudos || []).reduce((acc: number, l: any) => acc + parseNum(l.total), 0) || 1)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mx-6 mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        Listagem Detalhada por Período
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f0f2ff] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="p-4 pl-12 w-[40%]">Período</th>
                            <th className="p-4 text-center w-[20%]">Status</th>
                            <th className="p-4 text-center w-[20%]">Realizados</th>
                            <th className="p-4 text-center w-[20%] pr-12">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(group.laudos || []).map((laudo: Laudo, li: number) => (
                            <tr key={laudo.id || li} className="hover:bg-slate-50/50 transition-colors group/laudo">
                              <td className="p-4 pl-12 text-xs font-bold text-slate-700">
                                <input
                                  type="text"
                                  className="w-full bg-transparent outline-none focus:text-blue-600 border-b border-transparent focus:border-blue-200"
                                  value={laudo.periodo}
                                  placeholder="Mês - Ano"
                                  onChange={e => updateLaudoInGroup(group.id, laudo.id!, { periodo: e.target.value })}
                                  readOnly={isGuest}
                                />
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border appearance-none text-center ${laudo.status === 'Realizado' ? 'bg-[#e7f9ee] text-[#10b981] border-[#dcfce7]' : 'bg-[#fff7ed] text-[#f59e0b] border-[#ffedd5]'
                                    }`}
                                  value={laudo.status}
                                  onChange={e => updateLaudoInGroup(group.id, laudo.id!, { status: e.target.value as any })}
                                  disabled={isGuest}
                                >
                                  <option value="Realizado">Realizado</option>
                                  <option value="Pendente">Pendente</option>
                                  <option value="Em Andamento">Em Andamento</option>
                                </select>
                              </td>
                              <td className="p-4 text-center text-xs font-mono font-black text-slate-600">
                                <NumericInput
                                  className="w-full bg-transparent text-center outline-none"
                                  value={laudo.realizados}
                                  onChange={v => updateLaudoInGroup(group.id, laudo.id!, { realizados: v })}
                                  readOnly={isGuest}
                                />
                              </td>
                              <td className="p-4 text-center text-xs font-mono font-black text-slate-900 pr-12 relative">
                                <div className="flex items-center justify-center gap-2">
                                  <NumericInput
                                    className="w-full bg-transparent text-center outline-none"
                                    value={laudo.total}
                                    onChange={v => updateLaudoInGroup(group.id, laudo.id!, { total: v })}
                                    readOnly={isGuest}
                                  />
                                  {!isGuest && (
                                    <button
                                      onClick={() => askRemoveLaudo(group.id, li)}
                                      className="absolute right-4 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/laudo:opacity-100"
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
                </div>
              )}

              {!isGuest && group.disks.length > 0 && (!group.laudos || group.laudos.length === 0) && (
                <div className="p-8 flex justify-center border-t border-slate-50 bg-slate-50/30">
                  <button
                    onClick={() => addLaudoToGroup(group.id)}
                    className="flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all group"
                  >
                    <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-blue-200 group-hover:shadow-md transition-all">
                      <FilePlus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Habilitar Módulo de Laudos Clínicos</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

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

      {/* Laudos Transfer Curve Chart */}
      {allLaudos.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Curva de Transferência (Laudos)</h3>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                  Realizados vs Total por Período — Progresso Acumulado {laudosSummary.progresso}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span className="text-slate-400">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-400">Realizados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400">% Progresso</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={allLaudos.map((l: any, idx: number) => {
                  const itemsBefore = allLaudos.slice(0, idx + 1);
                  const cumRealizados = itemsBefore.reduce((acc: number, x: any) => acc + parseNum(x.realizados), 0);
                  const cumTotal = itemsBefore.reduce((acc: number, x: any) => acc + parseNum(x.total), 0);
                  const progressPercent = cumTotal > 0 ? Math.min(100, Number(((cumRealizados / cumTotal) * 100).toFixed(1))) : 0;
                  return {
                    periodo: l.periodo || `Período ${idx + 1}`,
                    realizados: parseNum(l.realizados),
                    total: parseNum(l.total),
                    progressPercent
                  };
                })}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorLaudoTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorLaudoRealizados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="periodo"
                  fontSize={10}
                  fontWeight={700}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  fontSize={10}
                  fontWeight={700}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  fontSize={10}
                  fontWeight={700}
                  stroke="#f59e0b"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}
                  itemStyle={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, padding: '2px 0' }}
                  formatter={(value: any, name: any) => {
                    const val = Number(value || 0);
                    if (name === 'progressPercent') return [`${val}%`, '📈 Progresso Acum.'];
                    if (name === 'realizados') return [val.toLocaleString('pt-BR'), '✅ Realizados'];
                    if (name === 'total') return [val.toLocaleString('pt-BR'), '📊 Total'];
                    return [val, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="total" fill="url(#colorLaudoTotal)" name="total" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar yAxisId="left" dataKey="realizados" fill="url(#colorLaudoRealizados)" name="realizados" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="progressPercent" name="progressPercent" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hover Comment Tooltip */}
      <AnimatePresence>
        {hoveredComment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              position: 'fixed',
              left: hoveredComment?.x || 0,
              top: (hoveredComment?.y || 0) - 120, // Position above
              zIndex: 9999
            }}
            className="hidden md:block w-72 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
              <div className={`w-2 h-2 rounded-full ${hoveredComment?.severity === 'sem_prioridade' ? 'bg-slate-400' :
                  hoveredComment?.severity === 'baixa' ? 'bg-blue-500' :
                    hoveredComment?.severity === 'media' ? 'bg-amber-500' :
                      hoveredComment?.severity === 'alta' ? 'bg-orange-500' : 'bg-rose-500'
                }`} />
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                {hoveredComment?.severity.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed font-medium text-slate-200 whitespace-pre-wrap">{hoveredComment?.text}</p>
            <div className="absolute top-full left-4 w-3 h-3 bg-slate-900 rotate-45 -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insight Modal */}
      <AnimatePresence>
        {isInsightModalOpen && aiInsight && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6">
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
              className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 mb-0 md:mb-0 max-h-[92vh] flex flex-col"
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

              <div className="p-5 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="prose prose-slate max-w-none">
                  <div className="space-y-4">
                    {(aiInsight || "").split('\n').map((line: string, li: number) => {
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border ${copiedInsight
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
                        className={`flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all ${commentSeverity === opt.id
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

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndoToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 min-w-[320px] md:min-w-[400px]"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  {undoType === 'bulk' ? 'Dados Removidos' : undoType === 'disk' ? 'Disco Excluído' : 'Laudo Excluído'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">
                  {undoType === 'bulk'
                    ? 'Todos os dados da unidade foram limpos'
                    : undoType === 'disk'
                      ? (lastDeletedDisk?.disk.path || 'Sem caminho')
                      : (lastDeletedLaudo?.laudo.periodo || 'Sem período')
                  }
                </p>
              </div>
            </div>
            <button
              onClick={undoDelete}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeleteTarget(null);
                setBulkDeleteTarget(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                  {bulkDeleteTarget
                    ? 'Limpar Toda Unidade?'
                    : deleteTarget?.type === 'disk' ? 'Excluir Disco?' : 'Excluir Laudo?'
                  }
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {bulkDeleteTarget
                    ? 'Tem certeza que deseja remover TODOS os dados desta unidade? Esta ação pode ser desfeita.'
                    : deleteTarget?.type === 'disk'
                      ? "Esta ação removerá o disco e todas as métricas associadas. Deseja continuar?"
                      : "Esta ação removerá o registro do laudo deste período. Deseja continuar?"
                  }
                </p>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteTarget(null);
                    setBulkDeleteTarget(null);
                  }}
                  className="bg-white text-slate-600 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={bulkDeleteTarget ? confirmBulkDelete : confirmRemoveItem}
                  className="bg-rose-600 text-white px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 active:scale-95"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
