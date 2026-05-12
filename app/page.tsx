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
  Check,
  Bold,
  Underline,
  Type,
  FilePlus,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import type * as ExcelJS from 'exceljs';
import { useClients, useMigrations, Disk, DiskGroup, Laudo } from '@/hooks/use-firestore';
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
  LabelList,
  ComposedChart
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

const parseNum = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val);
  // Se contém vírgula, tratamos como formato brasileiro (ex: 1.234,56 ou 5,81)
  if (s.includes(',')) {
    const cleanVal = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanVal) || 0;
  }
  // Se não contém vírgula, tratamos como formato padrão JS/US (ex: 1234.56 ou 5.81)
  return parseFloat(s) || 0;
};

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function ReportsView({
  migrations,
  onGenerateIncidencesReport,
  onGenerateHandoffReport,
  onGenerateExecutiveReport,
  onGenerateInventoryReport,
  onGenerateLaudosReport,
  onGenerateStorageReport,
  onGenerateDensityReport
}: {
  migrations: any[],
  onGenerateIncidencesReport: () => void,
  onGenerateHandoffReport: () => void,
  onGenerateExecutiveReport: () => void,
  onGenerateInventoryReport: () => void,
  onGenerateLaudosReport: () => void,
  onGenerateStorageReport: () => void,
  onGenerateDensityReport: () => void
}) {
  const reports = [
    {
      title: "Resumo Executivo Estratégico",
      desc: "Indicadores macro de progresso global, volumetria total e status das unidades.",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
      action: "Exportar XLSX",
      onClick: onGenerateExecutiveReport
    },
    {
      title: "Inventário de Discos e Storage",
      desc: "Relatório técnico detalhado por unidade, disco e ponto de montagem.",
      icon: HardDrive,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      action: "Exportar XLSX",
      onClick: onGenerateInventoryReport
    },
    {
      title: "Evolução de Laudos Clínicos",
      desc: "Acompanhamento de migração de laudos, PDFs e relatórios clínicos.",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
      action: "Exportar XLSX",
      onClick: onGenerateLaudosReport
    },
    {
      title: "Relatório de Incidências",
      desc: "Log detalhado de erros, interrupções e falhas reportadas durante o processo.",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      action: "Baixar Relatório",
      onClick: onGenerateIncidencesReport
    },
    {
      title: "Checklist de Entrega (Hand-off)",
      desc: "Documento de validação de conclusão para unidades com 100% de migração.",
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      action: "Gerar Relatório",
      onClick: onGenerateHandoffReport
    },
    {
      title: "Análise de Densidade e Eficiência",
      desc: "Estudo de compressão e média de storage por estudo entre diferentes unidades.",
      icon: Database,
      color: "text-slate-600",
      bg: "bg-slate-50",
      action: "Exportar CSV",
      onClick: onGenerateDensityReport
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Centro de Inteligência e Exportação</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Selecione um dos modelos de relatório abaixo para extrair informações estruturadas da sua base de migração.
            Todos os relatórios são gerados em tempo real com base nos dados mais recentes do MigraFlow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-xl ${report.bg}`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(dot => <div key={dot} className="w-1 h-1 rounded-full bg-slate-200" />)}
              </div>
            </div>

            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
              {report.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 flex-1">
              {report.desc}
            </p>

            <button
              onClick={report.onClick}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-100 hover:border-slate-900 flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {report.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, isGuest, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'migrations' | 'reports'>('overview');
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

  // Safety Delete States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'client' | 'migration' | 'disk';
    id: string;
    label: string;
    item?: any;
  }>({ isOpen: false, type: 'client', id: '', label: '' });

  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    type: 'client' | 'migration' | 'disk';
    item: any;
    label: string;
  }>({ show: false, type: 'client', item: null, label: '' });

  const [integrityModal, setIntegrityModal] = useState<{
    isOpen: boolean;
    label: string;
  }>({ isOpen: false, label: '' });

  const getClientName = (m: any) => {
    const client = clients.find(c => c.id === m.clientId);
    return client?.name || m.clientName || "Cliente Indefinido";
  };

  // Safe Delete Handlers
  const triggerDelete = (type: 'client' | 'migration', id: string, label: string) => {
    const item = type === 'client' ? clients.find(c => c.id === id) : migrations.find(m => m.id === id);

    // Integrity Check: Prevent deleting client with linked migrations
    if (type === 'client') {
      const hasLinkedMigrations = migrations.some(m => m.clientId === id);
      if (hasLinkedMigrations) {
        setIntegrityModal({ isOpen: true, label });
        return;
      }
    }

    setDeleteConfirm({ isOpen: true, type, id, label, item });
  };

  const executeConfirmDelete = async () => {
    if (!deleteConfirm.item) return;

    const { type, id, label, item } = deleteConfirm;

    try {
      if (type === 'client') {
        await deleteClient(id);
      } else {
        await deleteMigration(id);
      }

      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
      setUndoToast({ show: true, type, item, label });

      // Auto-hide toast
      setTimeout(() => setUndoToast(prev => ({ ...prev, show: false })), 8000);
    } catch (error) {
      alert("Erro ao excluir item.");
    }
  };

  const handleUndo = async () => {
    if (!undoToast.item) return;

    try {
      if (undoToast.type === 'client') {
        await addClient(undoToast.item);
      } else {
        await addMigration(undoToast.item);
      }
      setUndoToast({ ...undoToast, show: false });
    } catch (error) {
      alert("Erro ao restaurar item.");
    }
  };

  const downloadTemplate = () => {
    const headers = [
      ['Caminho', 'Status', 'Total Pastas', 'Pastas Realizadas', 'Estudos', 'Storage Mapeado (TB)', 'Storage Enviado (TB)', 'Destino'],
      ['/mnt/storage/disco01', 'Pendente', '1500', '450', '25000', '12.5', '3.2', 'Cloud_Bucket_A'],
      ['/mnt/storage/disco02', 'Pendente', '2000', '0', '32000', '15.0', '0.0', 'Cloud_Bucket_B']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Discos");

    const laudoHeaders = [
      ['Período', 'Status', 'Realizados', 'Total'],
      ['Novembro - 2024', 'Realizado', '3429', '3429'],
      ['Outubro - 2024', 'Outro', '4702', '4702']
    ];
    const wsLaudos = XLSX.utils.aoa_to_sheet(laudoHeaders);
    wsLaudos['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsLaudos, "Modelo_Laudos");

    XLSX.writeFile(wb, "migraflow_modelos_importacao.xlsx");
  };

  const getAllDisks = (m: any) => {
    if (m.groups && m.groups.length > 0) {
      return m.groups.flatMap((g: any) => g.disks || []);
    }
    return m.disks || [];
  };

  const generateIncidencesReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Log de Incidências');

    sheet.mergeCells('A1:D2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | RELATÓRIO DE INCIDÊNCIAS TÉCNICAS';
    titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FFE11D48' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

    const headers = ['CLIENTE', 'DATA', 'SEVERIDADE', 'DESCRIÇÃO DA INCIDÊNCIA'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 25;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    });

    let currentRow = 6;
    const allComments: any[] = [];
    clients.forEach(c => {
      (c.comments || []).forEach((com: any) => {
        allComments.push({ client: c.name, ...com });
        const row = sheet.getRow(currentRow);
        row.getCell(1).value = c.name;
        row.getCell(2).value = com.date;
        row.getCell(3).value = com.severity?.toUpperCase() || 'NORMAL';
        row.getCell(4).value = com.text;

        row.eachCell((cell, i) => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFFFE4E6' } } };
          cell.alignment = { vertical: 'middle', horizontal: i < 4 ? 'center' : 'left' };
          if (currentRow % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
        });
        currentRow++;
      });
    });

    const severitySummary = [
      { label: 'Alta', value: allComments.filter(c => c.severity === 'alta').length, color: '#e11d48' },
      { label: 'Média', value: allComments.filter(c => c.severity === 'media').length, color: '#f59e0b' },
      { label: 'Baixa', value: allComments.filter(c => c.severity === 'baixa').length, color: '#3b82f6' }
    ].filter(s => s.value > 0);

    if (severitySummary.length > 0) {
      const chartImg = await generateChartImage('pie', severitySummary, 'Distribuição por Severidade');
      const chartId = workbook.addImage({ base64: chartImg as string, extension: 'png' });
      sheet.addImage(chartId, { tl: { col: 5, row: 4 }, ext: { width: 400, height: 300 } });
    }

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 60;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Log_Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
  };

  const generateLaudosReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laudos Resumo');

    sheet.mergeCells('A1:D2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | RELATÓRIO GLOBAL DE LAUDOS';
    titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FFB45309' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

    const headers = ['CLIENTE', 'TOTAL LAUDOS', 'REALIZADOS', 'PENDENTES'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 25;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    });

    let currentRow = 6;
    migrations.forEach(m => {
      const allLaudos = m.groups?.flatMap((g: any) => g.laudos || []) || [];
      const done = allLaudos.filter((l: any) => l.status === 'Concluído' || l.status === 'Realizado').length;

      const row = sheet.getRow(currentRow);
      row.getCell(1).value = getClientName(m);
      row.getCell(2).value = allLaudos.length;
      row.getCell(3).value = done;
      row.getCell(4).value = allLaudos.length - done;

      row.eachCell(cell => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFFDE68A' } } };
        cell.alignment = { horizontal: 'center' };
      });
      currentRow++;
    });

    sheet.addImage(sheet.workbook.addImage({ base64: await generateChartImage('bar', [{ label: 'Total', value: 10, color: '#b45309' }], 'Resumo Geral') || '', extension: 'png' }), { tl: { col: 5, row: 4 }, ext: { width: 300, height: 200 } });

    // --- SEPARAÇÃO POR CLIENTE ---
    for (const m of migrations) {
      const clientName = getClientName(m);
      const safeName = clientName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      const clientSheet = workbook.addWorksheet(`${safeName}_Lau`);

      clientSheet.mergeCells('A1:G2');
      const cTitle = clientSheet.getCell('A1');
      cTitle.value = `LAUDOS E RELATÓRIOS: ${clientName.toUpperCase()}`;
      cTitle.style = { font: { bold: true, size: 12, color: { argb: 'FFB45309' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

      const allLaudos = m.groups?.flatMap((g: any) => g.laudos || []) || [];
      const tableHeaders = ['UNIDADE', 'PERÍODO', 'STATUS', 'REALIZADOS', 'TOTAL', '% PROGRESSO'];
      const hRow = clientSheet.getRow(4);
      tableHeaders.forEach((h, i) => {
        const cell = hRow.getCell(i + 1);
        cell.value = h;
        cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } }, alignment: { horizontal: 'center' } };
      });

      allLaudos.forEach((l: any, idx) => {
        const r = clientSheet.getRow(5 + idx);
        const prog = Number(l.total) > 0 ? Math.min(1, Number(l.realizados) / Number(l.total)) : 0;
        r.getCell(1).value = m.groups?.find((g: any) => g.laudos?.includes(l))?.title || 'Unidade';
        r.getCell(2).value = l.periodo;
        r.getCell(3).value = l.status;
        r.getCell(4).value = Number(l.realizados) || 0;
        r.getCell(5).value = Number(l.total) || 0;
        r.getCell(6).value = prog;
        r.getCell(6).numFmt = '0.0%';

        r.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFFDE68A' } } }; });
      });

      const cProgData = [
        { label: 'Entregue', value: allLaudos.filter(l => l.status === 'Concluído' || l.status === 'Realizado').length, color: '#10b981' },
        { label: 'Pendente', value: allLaudos.filter(l => l.status !== 'Concluído' && l.status !== 'Realizado').length, color: '#f59e0b' }
      ].filter(p => p.value > 0);

      if (cProgData.length > 0) {
        const chartImg = await generateChartImage('pie', cProgData, 'Status de Entrega');
        const chartId = workbook.addImage({ base64: chartImg as string, extension: 'png' });
        clientSheet.addImage(chartId, { tl: { col: 6, row: 4 }, ext: { width: 300, height: 250 } });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Laudos_Clinicos_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const generateHandoffReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hand-off Checklist');

    sheet.mergeCells('A1:F2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | CHECKLIST DE ENTREGA E HAND-OFF';
    titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF4F46E5' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

    const headers = ['CLIENTE', 'STATUS', 'PROGRESSO', 'DURAÇÃO ESTIMADA', 'VOLUMETRIA TOTAL', 'VALIDAÇÃO'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 25;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    });

    const readyMigrations = migrations.filter(m => {
      const disks = getAllDisks(m);
      const total = disks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0);
      const realized = disks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0);
      return total > 0 && realized >= total * 0.99; // 99% or more
    });

    let currentRow = 6;
    readyMigrations.forEach(m => {
      const disks = getAllDisks(m);
      const vol = disks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0);
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = getClientName(m);
      row.getCell(2).value = m.status.toUpperCase();
      row.getCell(3).value = 1;
      row.getCell(3).numFmt = '0%';
      row.getCell(4).value = 'CONCLUÍDO';
      row.getCell(5).value = vol;
      row.getCell(5).numFmt = '#,##0.00 "TB"';
      row.getCell(6).value = 'AGUARDANDO ASSINATURA';

      row.eachCell(cell => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E7FF' } } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      currentRow++;
    });

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 20;
    sheet.getColumn(6).width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Handoff_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
  };

  const generateDensityReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Densidade e Eficiência');

    // Header Branding
    sheet.mergeCells('A1:F2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | ANÁLISE DE DENSIDADE E EFICIÊNCIA OPERACIONAL';
    titleCell.style = {
      font: { bold: true, size: 14, color: { argb: 'FF1E293B' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // Table Headers
    const headers = ["CLIENTE", "TOTAL ESTUDOS", "STORAGE (TB)", "MÉDIA GB/ESTUDO", "DENSIDADE (MB)", "EFICIÊNCIA"];
    const headerRow = sheet.getRow(5);
    headerRow.height = 25;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.style = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
    });

    let currentRow = 6;
    migrations.forEach((m: any) => {
      const disks = getAllDisks(m);
      const studies = disks.reduce((sum: number, d: any) => sum + (Number(d.estudos) || 0), 0);
      const volTB = disks.reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0);
      const avgGB = studies > 0 ? (volTB * 1024) / studies : 0;
      const avgMB = avgGB * 1024;

      let efficiency = "N/A";
      let effColor = "FF94A3B8";
      if (avgGB > 0) {
        if (avgGB < 0.5) { efficiency = "ALTA (OTIMIZADO)"; effColor = "FF059669"; }
        else if (avgGB < 1.5) { efficiency = "NORMAL"; effColor = "FF2563EB"; }
        else { efficiency = "BAIXA (DADOS DENSOS)"; effColor = "FFDC2626"; }
      }

      const row = sheet.getRow(currentRow);
      row.getCell(1).value = getClientName(m);
      row.getCell(2).value = studies;
      row.getCell(3).value = volTB;
      row.getCell(4).value = avgGB;
      row.getCell(5).value = avgMB;
      row.getCell(6).value = efficiency;

      // Formatting
      row.getCell(2).numFmt = '#,##0';
      row.getCell(3).numFmt = '#,##0.00 "TB"';
      row.getCell(4).numFmt = '#,##0.00 "GB"';
      row.getCell(5).numFmt = '#,##0 "MB"';

      row.eachCell((cell, colNumber) => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
        cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'center' : 'left' };
        if (colNumber === 6) {
          cell.font = { bold: true, color: { argb: effColor }, size: 8 };
        }
      });
      currentRow++;
    });

    // Charts
    const densityData = migrations.slice(0, 8).map((m: any) => {
      const disks = getAllDisks(m);
      const studies = disks.reduce((sum: number, d: any) => sum + (Number(d.estudos) || 0), 0);
      const volTB = disks.reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0);
      return {
        label: getClientName(m),
        value: studies > 0 ? (volTB * 1024) / studies : 0,
        color: '#6366f1'
      };
    }).filter((d: any) => d.value > 0);

    if (densityData.length > 0) {
      const chartImg = await generateChartImage('bar', densityData, 'Média de Storage por Estudo (GB)');
      const chartId = workbook.addImage({ base64: chartImg as string, extension: 'png' });
      sheet.addImage(chartId, { tl: { col: 6, row: 4 }, ext: { width: 500, height: 350 } });
    }

    sheet.getColumn(1).width = 25;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Analise_Densidade_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const generateGlobalStorageReport = () => {
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewData = migrations.map((m: any) => {
      const allDisks = getAllDisks(m);
      const totalTB = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0);
      const sentTB = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0);
      const totalPastas = allDisks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0);
      const realizedPastas = allDisks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0);
      const progress = totalPastas > 0 ? ((realizedPastas / totalPastas) * 100).toFixed(2) : "0.00";

      return {
        'Cliente': getClientName(m),
        'Status': m.status.toUpperCase(),
        'Progresso (%)': progress + "%",
        'Storage Mapeado (TB)': totalTB.toFixed(2),
        'Storage Enviado (TB)': sentTB.toFixed(2),
        'Total Pastas': totalPastas,
        'Pastas Realizadas': realizedPastas
      };
    });
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "Visão Geral");

    // 2. Disks Sheet
    const disksData: any[] = [];
    migrations.forEach((m: any) => {
      const clientName = getClientName(m);
      const allDisks = getAllDisks(m);
      allDisks.forEach((d: any) => {
        disksData.push({
          'Cliente': clientName,
          'Caminho': d.path,
          'Destino': d.destination || '-',
          'Status': d.status,
          'Mapeado (TB)': parseNum(d.storageMapeado).toFixed(2),
          'Enviado (TB)': parseNum(d.storageEnviado).toFixed(2),
          'Pastas': `${d.pastasRealizadas}/${d.totalPastas}`,
          'Estudos': d.estudos || 0
        });
      });
    });
    const wsDisks = XLSX.utils.json_to_sheet(disksData);
    XLSX.utils.book_append_sheet(wb, wsDisks, "Inventário de Discos");

    // 3. Laudos Sheet
    const laudosData: any[] = [];
    migrations.forEach(m => {
      const clientName = getClientName(m);
      const allLaudos = m.groups?.flatMap((g: any) => g.laudos || []) || [];
      allLaudos.forEach((l: any) => {
        laudosData.push({
          'Cliente': clientName,
          'Período': l.periodo,
          'Status': l.status,
          'Realizados': l.realizados,
          'Total': l.total
        });
      });
    });
    if (laudosData.length > 0) {
      const wsLaudos = XLSX.utils.json_to_sheet(laudosData);
      XLSX.utils.book_append_sheet(wb, wsLaudos, "Laudos Clínicos");
    }

    XLSX.writeFile(wb, `MigraFlow_Relatorio_Global_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateChartImage = (type: 'pie' | 'bar', data: { label: string, value: number, color: string }[], title: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), canvas.width / 2, 45);

    if (type === 'pie') {
      const total = data.reduce((acc, d) => acc + d.value, 0);
      let startAngle = 0;
      const centerX = 200;
      const centerY = 220;
      const radius = 120;

      data.forEach((d, i) => {
        if (d.value === 0 && total > 0) return;
        const sliceAngle = total > 0 ? (2 * Math.PI * d.value) / total : (2 * Math.PI) / (data.length || 1);

        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Legend
        const legendX = 380;
        const legendY = 100 + i * 30;
        ctx.fillRect(legendX, legendY, 18, 18);
        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
        ctx.fillText(`${d.label}: ${d.value.toFixed(1)} (${percent}%)`, legendX + 25, legendY + 14);

        startAngle += sliceAngle;
      });
    } else {
      // Bar Chart
      const maxVal = Math.max(...data.map(d => d.value), 1);
      const barWidth = 35;
      const spacing = 65;
      const startX = 80;
      const startY = 320;
      const chartHeight = 220;

      // Draw Axes
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX - 10, startY);
      ctx.lineTo(startX + data.length * spacing, startY);
      ctx.stroke();

      data.forEach((d, i) => {
        const h = (d.value / maxVal) * chartHeight;
        ctx.fillStyle = d.color;
        ctx.fillRect(startX + i * spacing, startY - h, barWidth, h);

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.translate(startX + i * spacing + barWidth / 2, startY + 15);
        ctx.rotate(Math.PI / 6);
        ctx.textAlign = 'left';
        ctx.fillText(d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label, 0, 0);
        ctx.restore();

        // Value
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.value.toFixed(1), startX + i * spacing + barWidth / 2, startY - h - 8);
      });
    }

    return canvas.toDataURL('image/png').split(',')[1]; // Base64 without header
  };

  const generateExecutiveReport = async () => {
    // Polyfill Buffer for browser environment if needed by ExcelJS
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumo Executivo');

    const getAllDisks = (m: any) => {
      if (m.groups && m.groups.length > 0) {
        return m.groups.flatMap((g: any) => g.disks || []);
      }
      return m.disks || [];
    };

    const totalMapeado = migrations.reduce((acc: number, m: any) =>
      acc + getAllDisks(m).reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0), 0);

    const totalEnviado = migrations.reduce((acc: number, m: any) =>
      acc + getAllDisks(m).reduce((sum: number, d: any) => sum + parseNum(d.storageEnviado), 0), 0);

    const totalPastas = migrations.reduce((acc: number, m: any) => {
      const allDisks = getAllDisks(m);
      if (m.isIncremental) {
        return acc + Math.max(0, ...allDisks.map((d: any) => Number(d.totalPastas) || 0));
      }
      return acc + allDisks.reduce((sum: number, d: any) => sum + (Number(d.totalPastas) || 0), 0);
    }, 0);

    const realizedPastas = migrations.reduce((acc: number, m: any) => {
      const allDisks = getAllDisks(m);
      if (m.isIncremental) {
        return acc + Math.max(0, ...allDisks.map((d: any) => Number(d.pastasRealizadas) || 0));
      }
      return acc + allDisks.reduce((sum: number, d: any) => sum + (Number(d.pastasRealizadas) || 0), 0);
    }, 0);

    const progressGlobal = totalPastas > 0 ? Math.min(1, realizedPastas / totalPastas) : 0;

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        bottom: { style: 'thin', color: { argb: 'FF334155' } },
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      }
    };

    sheet.mergeCells('A1:G2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | DASHBOARD EXECUTIVO DE MIGRAÇÃO';
    titleCell.style = {
      font: { bold: true, size: 14, color: { argb: 'FF2563EB' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };

    sheet.mergeCells('A3:G3');
    sheet.getCell('A3').value = `Relatório Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    sheet.getCell('A3').style = { font: { italic: true, size: 9, color: { argb: 'FF64748B' } }, alignment: { horizontal: 'center' } };

    const cards = [
      { label: 'PROGRESSO GLOBAL', value: progressGlobal, format: '0.0%', color: 'FF2563EB' },
      { label: 'VOLUME MAPEADO', value: totalMapeado, format: '#,##0.00 "TB"', color: 'FF1E293B' },
      { label: 'VOLUME ENVIADO', value: totalEnviado, format: '#,##0.00 "TB"', color: 'FF10B981' },
      { label: 'UNIDADES ATIVAS', value: migrations.length, format: '0', color: 'FF6366F1' }
    ];

    const cardCols = [1, 3, 5, 7];
    cards.forEach((card, i) => {
      const colIdx = cardCols[i];
      const cellLabel = sheet.getCell(5, colIdx);
      const cellValue = sheet.getCell(6, colIdx);
      cellLabel.value = card.label;
      cellLabel.style = { font: { bold: true, size: 8, color: { argb: 'FF94A3B8' } }, alignment: { horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } } };
      cellValue.value = card.value;
      cellValue.style = {
        font: { bold: true, size: 12, color: { argb: card.color } },
        alignment: { horizontal: 'center' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
        numFmt: card.format
      };
      const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFE2E8F0' } };
      cellLabel.border = { top: borderStyle, left: borderStyle, right: borderStyle };
      cellValue.border = { bottom: borderStyle, left: borderStyle, right: borderStyle };
    });

    const tableHeader = ['CLIENTE / UNIDADE', 'STATUS ATUAL', 'PROGRESSO', 'MAPEADO (TB)', 'ENVIADO (TB)', 'ESTUDOS', 'PREVISÃO'];
    const row8 = sheet.getRow(8);
    row8.height = 25;
    tableHeader.forEach((h, i) => {
      const cell = row8.getCell(i + 1);
      cell.value = h;
      cell.style = headerStyle;
    });

    migrations.forEach((m, i) => {
      const rowIndex = 9 + i;
      const allDisks = getAllDisks(m);
      const mVol = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0);
      const mSent = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0);
      const mTotal = m.isIncremental
        ? Math.max(0, ...allDisks.map((d: any) => Number(d.totalPastas) || 0))
        : allDisks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0);
      const mReal = m.isIncremental
        ? Math.max(0, ...allDisks.map((d: any) => Number(d.pastasRealizadas) || 0))
        : allDisks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0);
      const mProgress = mTotal > 0 ? Math.min(1, mReal / mTotal) : 0;
      const mStudies = m.isIncremental
        ? Math.max(0, ...allDisks.map((d: any) => Number(d.estudos) || 0))
        : allDisks.reduce((acc: number, d: any) => acc + (Number(d.estudos) || 0), 0);

      const row = sheet.getRow(rowIndex);
      row.height = 20;
      row.getCell(1).value = getClientName(m);
      row.getCell(2).value = m.status.toUpperCase();
      row.getCell(3).value = mProgress;
      row.getCell(3).numFmt = '0.0%';
      row.getCell(4).value = mVol;
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).value = mSent;
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).value = mStudies;
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).value = m.endDate || '-';

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }, left: { style: 'thin', color: { argb: 'FFF1F5F9' } }, right: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
        if (i % 2 !== 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });

      const progressCell = row.getCell(3);
      if (mProgress >= 0.99) progressCell.font = { color: { argb: 'FF059669' }, bold: true, size: 9 };
      else if (mProgress > 0) progressCell.font = { color: { argb: 'FF2563EB' }, bold: true, size: 9 };
    });

    // 7. Graphics: Conditional Formatting (Data Bars)
    if (migrations.length > 0) {
      sheet.addConditionalFormatting({
        ref: `C9:C${8 + migrations.length}`,
        rules: [
          {
            type: 'dataBar',
            cfvo: [{ type: 'min', value: 0 }, { type: 'max', value: 1 }],
            color: { argb: 'FFDBEAFE' }
          } as any
        ]
      });
    }

    // 8. Charts: Visual Graphics
    const statusSummary = [
      { label: 'Concluída', value: migrations.filter(m => m.status === 'concluida').length, color: '#10b981' },
      { label: 'Em Execução', value: migrations.filter(m => m.status === 'em_progresso').length, color: '#2563eb' },
      { label: 'Pendente', value: migrations.filter(m => m.status === 'pendente').length, color: '#94a3b8' },
      { label: 'Atrasada', value: migrations.filter(m => m.status === 'atrasada').length, color: '#f43f5e' }
    ];

    const volumeByClient = migrations.slice(0, 8).map(m => {
      const allDisks = getAllDisks(m);
      return {
        label: getClientName(m),
        value: allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0),
        color: '#6366f1'
      };
    });

    const statusChartBase64 = generateChartImage('pie', statusSummary, 'Distribuição por Status');
    const volumeChartBase64 = generateChartImage('bar', volumeByClient, 'Volume por Cliente (TB)');

    if (statusChartBase64) {
      const statusImg = workbook.addImage({ base64: statusChartBase64, extension: 'png' });
      sheet.addImage(statusImg, { tl: { col: 8, row: 4 }, ext: { width: 380, height: 240 } });
    }

    if (volumeChartBase64) {
      const volumeImg = workbook.addImage({ base64: volumeChartBase64, extension: 'png' });
      sheet.addImage(volumeImg, { tl: { col: 8, row: 17 }, ext: { width: 380, height: 240 } });
    }

    // --- SEPARAÇÃO POR CLIENTE ---
    for (const m of migrations) {
      const clientName = getClientName(m);
      const safeName = clientName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      const clientSheet = workbook.addWorksheet(safeName);

      clientSheet.mergeCells('A1:G2');
      const cTitle = clientSheet.getCell('A1');
      cTitle.value = `RESUMO INDIVIDUAL: ${clientName.toUpperCase()}`;
      cTitle.style = { font: { bold: true, size: 12, color: { argb: 'FF2563EB' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

      const allDisks = getAllDisks(m);
      const cTotal = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0);
      const cSent = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0);
      const cTotalFolders = m.isIncremental
        ? Math.max(0, ...allDisks.map((d: any) => Number(d.totalPastas) || 0))
        : allDisks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0);
      const cRealizedFolders = m.isIncremental
        ? Math.max(0, ...allDisks.map((d: any) => Number(d.pastasRealizadas) || 0))
        : allDisks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0);
      const cProg = cTotalFolders > 0 ? Math.min(1, cRealizedFolders / cTotalFolders) : 0;

      const cCards = [
        { l: 'STATUS', v: m.status.toUpperCase(), c: 'FF1E293B' },
        { l: 'PROGRESSO', v: cProg, f: '0.0%', c: 'FF2563EB' },
        { l: 'MAPEADO', v: cTotal, f: '#,##0.00 "TB"', c: 'FF1E293B' },
        { l: 'ENVIADO', v: cSent, f: '#,##0.00 "TB"', c: 'FF10B981' }
      ];

      cCards.forEach((card, i) => {
        const col = i * 2 + 1;
        clientSheet.getCell(4, col).value = card.l;
        clientSheet.getCell(4, col).style = { font: { bold: true, size: 8, color: { argb: 'FF94A3B8' } }, alignment: { horizontal: 'center' } };
        const vCell = clientSheet.getCell(5, col);
        vCell.value = card.v;
        vCell.style = { font: { bold: true, size: 11, color: { argb: card.c } }, alignment: { horizontal: 'center' }, numFmt: card.f };
      });

      const cStatusData = [
        { label: 'Concluído', value: allDisks.filter((d: any) => d.status === 'Realizado').length, color: '#10b981' },
        { label: 'Em Execução', value: allDisks.filter((d: any) => d.status !== 'Realizado').length, color: '#2563eb' }
      ].filter((d: any) => d.value > 0);

      if (cStatusData.length > 0) {
        const cPieImg = await generateChartImage('pie', cStatusData, 'Distribuição de Discos');
        const cPieId = workbook.addImage({ base64: cPieImg as string, extension: 'png' });
        clientSheet.addImage(cPieId, { tl: { col: 0, row: 7 }, ext: { width: 300, height: 250 } });
      }

      const cDiskData = allDisks.slice(0, 6).map((d: any) => ({ label: d.path.split('\\').pop() || d.path, value: parseNum(d.storageMapeado) }));
      if (cDiskData.length > 0) {
        const cBarImg = await generateChartImage('bar', cDiskData, 'Volumetria por Disco (TB)');
        const cBarId = workbook.addImage({ base64: cBarImg as string, extension: 'png' });
        clientSheet.addImage(cBarId, { tl: { col: 4, row: 7 }, ext: { width: 400, height: 250 } });
      }
    }

    // 10. Write and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Resumo_Executivo_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const generateInventoryReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventário de Discos');

    // Branding Header
    sheet.mergeCells('A1:J2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | INVENTÁRIO TÉCNICO DE DISCOS E STORAGE';
    titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF059669' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

    // KPI Summary
    const totalDisks = migrations.reduce((acc: number, m: any) => acc + (m.disks?.length || 0) + (m.groups?.reduce((s: number, g: any) => s + (g.disks?.length || 0), 0) || 0), 0);
    const totalMapeado = migrations.reduce((acc: number, m: any) =>
      acc + [...(m.disks || []), ...(m.groups?.flatMap((g: any) => g.disks || []) || [])]
        .reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0), 0);

    const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    sheet.mergeCells('A4:C5');
    sheet.getCell('A4').value = `Total de Discos: ${totalDisks} | Volumetria Global: ${fmt.format(totalMapeado)} TB`;
    sheet.getCell('A4').style = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } },
      border: {
        top: { style: 'thin', color: { argb: 'FFD1FAE5' } },
        bottom: { style: 'thin', color: { argb: 'FFD1FAE5' } },
        left: { style: 'thin', color: { argb: 'FFD1FAE5' } },
        right: { style: 'thin', color: { argb: 'FFD1FAE5' } }
      }
    };

    // Header Table
    const headers = ['CLIENTE', 'UNIDADE', 'CAMINHO / HOST', 'STATUS', 'PASTAS MIGRADAS', 'TOTAL PASTAS', '% PROGRESSO', 'MAPEADO (TB)', 'ENVIADO (TB)', 'ESTUDOS'];
    const headerRow = sheet.getRow(7);
    headerRow.height = 25;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    });

    const getAllDisks = (m: any) => {
      if (m.groups && m.groups.length > 0) {
        return m.groups.flatMap((g: any) => g.disks || []);
      }
      return m.disks || [];
    };

    let currentRow = 8;
    migrations.forEach((m, mIdx) => {
      const disks = getAllDisks(m);
      disks.forEach((d: any, dIdx: number) => {
        const row = sheet.getRow(currentRow);
        row.height = 20;
        const progress = Number(d.totalPastas) > 0 ? Math.min(1, Number(d.pastasRealizadas) / Number(d.totalPastas)) : 0;

        row.getCell(1).value = getClientName(m);
        row.getCell(2).value = m.groups?.find((g: any) => g.disks?.includes(d))?.title || 'Unidade Principal';
        row.getCell(3).value = d.path;
        row.getCell(4).value = d.status;
        row.getCell(5).value = Number(d.pastasRealizadas) || 0;
        row.getCell(5).numFmt = '#,##0';
        row.getCell(6).value = Number(d.totalPastas) || 0;
        row.getCell(6).numFmt = '#,##0';
        row.getCell(7).value = progress;
        row.getCell(7).numFmt = '0.0%';
        row.getCell(8).value = parseNum(d.storageMapeado);
        row.getCell(8).numFmt = '#,##0.00';
        row.getCell(9).value = parseNum(d.storageEnviado);
        row.getCell(9).numFmt = '#,##0.00';
        row.getCell(10).value = Number(d.estudos) || 0;
        row.getCell(10).numFmt = '#,##0';

        row.eachCell((cell, colNumber) => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFF1F5F9' } }, right: { style: 'thin', color: { argb: 'FFF1F5F9' } } };
          cell.alignment = { vertical: 'middle', horizontal: colNumber > 4 ? 'center' : 'left' };
          if (currentRow % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
        currentRow++;
      });
    });

    if (currentRow > 8) {
      sheet.addConditionalFormatting({
        ref: `G8:G${currentRow - 1}`,
        rules: [{ type: 'dataBar', cfvo: [{ type: 'min', value: 0 }, { type: 'max', value: 1 }], color: { argb: 'FFD1FAE5' } } as any]
      });
    }

    // 8. Charts: Technical Visuals
    const diskStatusSummary = [
      { label: 'Realizado', value: migrations.reduce((acc, m) => acc + [...(m.disks || []), ...(m.groups?.flatMap((g: any) => g.disks || []) || [])].filter(d => d.status === 'Realizado').length, 0), color: '#10b981' },
      { label: 'Pendente', value: migrations.reduce((acc, m) => acc + [...(m.disks || []), ...(m.groups?.flatMap((g: any) => g.disks || []) || [])].filter(d => d.status === 'Pendente').length, 0), color: '#94a3b8' }
    ];

    const chartBase64 = generateChartImage('pie', diskStatusSummary, 'Saúde Global dos Discos');
    if (chartBase64) {
      const imgId = workbook.addImage({ base64: chartBase64, extension: 'png' });
      sheet.addImage(imgId, { tl: { col: 11, row: 4 }, ext: { width: 400, height: 280 } });
    }

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 45;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(7).width = 15;
    sheet.getColumn(8).width = 15;
    sheet.getColumn(9).width = 15;
    sheet.getColumn(10).width = 12;
    sheet.getColumn(11).width = 5; // Spacing

    // --- SEPARAÇÃO POR CLIENTE ---
    for (const m of migrations) {
      const clientName = getClientName(m);
      const safeName = clientName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      const clientSheet = workbook.addWorksheet(`${safeName}_Inv`);

      clientSheet.mergeCells('A1:G2');
      const cTitle = clientSheet.getCell('A1');
      cTitle.value = `INVENTÁRIO TÉCNICO: ${clientName.toUpperCase()}`;
      cTitle.style = { font: { bold: true, size: 12, color: { argb: 'FF059669' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

      const allDisks = getAllDisks(m);
      const tableHeaders = ['CAMINHO', 'STATUS', 'REALIZADAS', 'TOTAL', '%', 'MAPEADO', 'ENVIADO'];
      const hRow = clientSheet.getRow(4);
      tableHeaders.forEach((h, i) => {
        const cell = hRow.getCell(i + 1);
        cell.value = h;
        cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }, alignment: { horizontal: 'center' } };
      });

      allDisks.forEach((d: any, idx: number) => {
        const r = clientSheet.getRow(5 + idx);
        const prog = Number(d.totalPastas) > 0 ? Math.min(1, Number(d.pastasRealizadas) / Number(d.totalPastas)) : 0;
        r.getCell(1).value = d.path;
        r.getCell(2).value = d.status;
        r.getCell(3).value = Number(d.pastasRealizadas) || 0;
        r.getCell(4).value = Number(d.totalPastas) || 0;
        r.getCell(5).value = prog;
        r.getCell(5).numFmt = '0.0%';
        r.getCell(6).value = parseNum(d.storageMapeado);
        r.getCell(6).numFmt = '#,##0.00';
        r.getCell(7).value = parseNum(d.storageEnviado);
        r.getCell(7).numFmt = '#,##0.00';

        r.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }; });
      });

      const cHealthData = [
        { label: 'OK', value: allDisks.filter((d: any) => d.status === 'Realizado').length, color: '#10b981' },
        { label: 'Pendente', value: allDisks.filter((d: any) => d.status !== 'Realizado').length, color: '#f59e0b' }
      ].filter((h: any) => h.value > 0);

      if (cHealthData.length > 0) {
        const chartImg = await generateChartImage('pie', cHealthData, 'Saúde da Migração');
        const chartId = workbook.addImage({ base64: chartImg as string, extension: 'png' });
        clientSheet.addImage(chartId, { tl: { col: 7, row: 4 }, ext: { width: 300, height: 250 } });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MigraFlow_Inventario_Tecnico_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
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
  const aggregatedData = migrations.reduce((acc: any, m: any) => {
    const rawName = getClientName(m);
    const clientName = rawName ? rawName.trim() : "Cliente Indefinido";

    const allDisks = getAllDisks(m);
    const isIncremental = m.isIncremental;

    const studies = isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => Number(d.estudos) || 0))
      : allDisks.reduce((sum: number, d: any) => sum + (Number(d.estudos) || 0), 0);

    const folders = isIncremental
      ? Math.max(0, ...allDisks.map((d: any) => {
        const total = Number(d.totalPastas) || 0;
        const realized = Number(d.pastasRealizadas) || 0;
        return total > 0 ? total : realized;
      }))
      : allDisks.reduce((sum: number, d: any) => {
        const total = Number(d.totalPastas) || 0;
        const realized = Number(d.pastasRealizadas) || 0;
        return sum + (total > 0 ? total : realized);
      }, 0);

    const volume = allDisks.reduce((sum: number, d: any) => sum + (Number(d.storageMapeado) || 0), 0);

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
          <SidebarLink
            icon={ClipboardList}
            label="Relatórios"
            active={activeTab === 'reports'}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setActiveTab('reports'); setSelectedMigrationId(null); }}
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
      <main className="flex-1 overflow-y-auto custom-scrollbar relative pb-20 md:pb-0 min-w-0 bg-slate-50">
        {/* Mobile User Bar */}
        <div className="md:hidden bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-white font-bold shadow-inner">
              {user?.displayName?.charAt(0) || <User className="w-3 h-3" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[150px] leading-none">{user?.displayName}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Operador</span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            <span className="text-[9px] font-black uppercase tracking-widest">Sair</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-6 flex flex-row items-center justify-between sticky top-0 md:top-0 z-10 backdrop-blur-md bg-white/80 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
              {selectedMigration ? `Detalhamento: ${getClientName(selectedMigration)}` : (
                activeTab === 'overview' ? 'Painel de Monitoramento' :
                  activeTab === 'clients' ? 'Gestão de Clientes' :
                    activeTab === 'reports' ? 'Centro de Inteligência' : 'Migrações'
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
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-1.5 bg-white text-slate-600 px-3 md:px-4 py-2 md:py-2 rounded-lg border border-slate-200 text-[10px] md:text-xs font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm uppercase tracking-tight whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5 rotate-180" /> <span className="hidden sm:inline">Modelo XLSX</span>
                </button>
                <button
                  onClick={() => setIsMigrationModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 md:px-6 py-2 md:py-2 rounded-lg md:rounded-md text-[10px] md:text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm uppercase tracking-tight whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Nova</span> Migração
                </button>
              </div>
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

            {!selectedMigration && activeTab === 'clients' && (
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
            )}

            {!selectedMigration && activeTab === 'migrations' && (
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

                    const allDisks = getAllDisks(m);
                    const total = allDisks.reduce((sum: number, d: any) => sum + (Number(d.totalPastas) || 0), 0);
                    const realized = allDisks.reduce((sum: number, d: any) => {
                      const t = Number(d.totalPastas) || 0;
                      const r = Number(d.pastasRealizadas) || 0;
                      return sum + Math.min(r, t);
                    }, 0);
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
                                  onClick={(e) => { e.stopPropagation(); triggerDelete('migration', m.id!, getClientName(m)); }}
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
                        <th className="px-6 py-4 w-[25%]">
                          <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-2 hover:text-white transition-colors w-full"
                          >
                            <span className="truncate">Identificação</span>
                            {sortOrder === 'asc' ? <ArrowUpAZ className="w-4 h-4 text-blue-500 shrink-0" /> : <ArrowDownAZ className="w-4 h-4 shrink-0" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 w-[20%]">Escopo</th>
                        <th className="px-6 py-4 text-center w-[20%]">Progresso</th>
                        <th className="px-6 py-4 text-center w-[20%]">Status</th>
                        <th className="px-6 py-4 w-[12%] text-center">Data</th>
                        <th className="px-6 py-4 text-right pr-6 w-[8%]"></th>
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
                          <td className="px-6 py-4 overflow-hidden">
                            <button
                              onClick={() => setSelectedMigrationId(m.id!)}
                              className="text-left group/btn w-full overflow-hidden"
                            >
                              <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter group-hover/btn:text-blue-600 transition-colors truncate">{getClientName(m)}</p>
                              <span className="text-[10px] font-mono text-slate-400 italic truncate block">REFSUB-{m.id?.slice(-6)}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 overflow-hidden">
                            <p className="text-xs text-slate-600 leading-relaxed italic truncate">{m.description || 'Nenhuma descrição'}</p>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const allDisks = getAllDisks(m);
                              const total = allDisks.reduce((sum: number, d: any) => sum + (Number(d.totalPastas) || 0), 0);
                              const realized = allDisks.reduce((sum: number, d: any) => {
                                const t = Number(d.totalPastas) || 0;
                                const r = Number(d.pastasRealizadas) || 0;
                                return sum + Math.min(r, t);
                              }, 0);
                              const progress = total > 0 ? Math.round((realized / total) * 100) : 0;
                              return (
                                <div className="flex items-center gap-3 min-w-[120px]">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className={`text-[10px] font-black ${progress === 100 ? 'text-emerald-600' : 'text-slate-900'}`}>{progress}%</span>
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
                                  onClick={() => triggerDelete('migration', m.id!, getClientName(m))}
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
            {!selectedMigration && activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ReportsView
                  migrations={migrations}
                  onGenerateIncidencesReport={generateIncidencesReport}
                  onGenerateHandoffReport={generateHandoffReport}
                  onGenerateExecutiveReport={generateExecutiveReport}
                  onGenerateInventoryReport={generateInventoryReport}
                  onGenerateLaudosReport={generateLaudosReport}
                  onGenerateStorageReport={generateInventoryReport}
                  onGenerateDensityReport={generateDensityReport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

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
          label="Migrações"
          active={activeTab === 'migrations'}
          onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }}
        />
        <BottomNavLink
          icon={ClipboardList}
          label="Relatórios"
          active={activeTab === 'reports'}
          onClick={() => { setActiveTab('reports'); setSelectedMigrationId(null); }}
        />
        {!isGuest && (
          <BottomNavLink
            icon={Sparkles}
            label="IA"
            active={isChatOpen}
            onClick={() => setIsChatOpen(true)}
          />
        )}
      </nav>

      {/* Global Undo Toast */}
      <AnimatePresence>
        {undoToast.show && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 min-w-[320px] md:min-w-[400px]"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  {undoToast.type === 'client' ? 'Cliente Removido' : 'Migração Removida'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{undoToast.label}</p>
              </div>
            </div>
            <button
              onClick={handleUndo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
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
                  <Trash2 className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                  Excluir {deleteConfirm.type === 'client' ? 'Cliente' : 'Migração'}?
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Você está prestes a remover <span className="text-slate-900 font-bold">{deleteConfirm.label}</span>. Esta ação pode ser desfeita nos próximos segundos.
                </p>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                  className="bg-white text-slate-600 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeConfirmDelete}
                  className="bg-rose-600 text-white px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 active:scale-95"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Integrity Alert Modal */}
      <AnimatePresence>
        {integrityModal.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIntegrityModal({ ...integrityModal, isOpen: false })}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bloqueio de Segurança</h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Não é possível excluir <span className="text-slate-900 font-bold">{integrityModal.label}</span> porque existem projetos de migração vinculados a este perfil.
                </p>
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                  Dica: Remova ou arquive as migrações deste cliente antes de tentar excluí-lo.
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setIntegrityModal({ ...integrityModal, isOpen: false })}
                  className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

// Rich Text Editor Component
function RichTextEditor({ value, onChange, readOnly, placeholder }: { value: string, onChange: (v: string) => void, readOnly?: boolean, placeholder?: string }) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastContent = React.useRef(value);

  // Sincroniza apenas se o valor vier de fora (ex: ao carregar o modal)
  React.useEffect(() => {
    if (editorRef.current && value !== lastContent.current) {
      editorRef.current.innerHTML = value || '';
      lastContent.current = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      lastContent.current = newContent;
      onChange(newContent);
    }
  };

  const execCommand = (command: string, val?: string) => {
    if (readOnly) return;
    document.execCommand(command, false, val);
    handleInput();
  };

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-blue-600 transition-all">
      {!readOnly && (
        <div className="flex items-center gap-1 p-1.5 bg-white border-b border-slate-200">
          <button type="button" onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Negrito"><Bold className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Sublinhado"><Underline className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button type="button" onClick={() => execCommand('foreColor', '#ef4444')} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors" title="Vermelho"><Type className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => execCommand('foreColor', '#2563eb')} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Azul"><Type className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => execCommand('foreColor', '#1e293b')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-900 transition-colors" title="Preto"><Type className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className="p-4 text-sm min-h-[150px] outline-none text-slate-700 leading-relaxed overflow-y-auto max-h-[300px]"
      />
      {(!value || value === '<br>') && (
        <div className="absolute top-[52px] left-4 text-slate-400 text-xs pointer-events-none italic">{placeholder}</div>
      )}
    </div>
  );
}

// Modal Components
function ClientModal({ isOpen, onClose, onAdd, onUpdate, clientToEdit, isGuest }: { isOpen: boolean, onClose: () => void, onAdd: (c: any) => Promise<void>, onUpdate?: (id: string, data: any) => Promise<void>, clientToEdit?: any, isGuest: boolean }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', description: '' });

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        email: clientToEdit.email || '',
        company: clientToEdit.company || '',
        description: clientToEdit.description || ''
      });
    } else {
      setFormData({ name: '', email: '', company: '', description: '' });
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-white rounded-xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
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
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição e Observações Técnicas</label>
            <RichTextEditor
              readOnly={isGuest}
              value={formData.description}
              onChange={v => setFormData({ ...formData, description: v })}
              placeholder="Acesso remoto, VPN, observações importantes..."
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
                setFormData({ name: '', email: '', company: '', description: '' });
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
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 md:bottom-32 left-0 md:left-auto right-0 md:right-8 w-full md:w-[400px] h-[85vh] md:h-[650px] max-h-[calc(100vh-40px)] md:max-h-[calc(100vh-160px)] bg-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-[200] flex flex-col border-t md:border border-slate-700/50 rounded-t-[32px] md:rounded-[32px] overflow-hidden text-white ring-1 ring-white/10"
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
              {/* Unit Summary Grid Removed per Request */}

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

              {/* If unit has disks but NO laudos yet, show a subtle button to add reports module */}
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
