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
  FileUp,
  HardDrive,
  Database,
  Trash2,
  Sparkles,
  User,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useClients, useMigrations } from '@/hooks/use-firestore';
import { getClientName, getAllDisks, parseNum } from '@/lib/utils';
import { format } from 'date-fns';

// Modular Components
import Overview from '@/components/dashboard/Overview';
import ClientsView from '@/components/dashboard/ClientsView';
import MigrationsView from '@/components/dashboard/MigrationsView';
import ReportsView from '@/components/dashboard/ReportsView';
import MigrationDetails from '@/components/migration/MigrationDetails';
import MigrationModal from '@/components/migration/MigrationModal';
import ClientModal from '@/components/client/ClientModal';
import AIChatDrawer from '@/components/dashboard/AIChatDrawer';
import SidebarLink from '@/components/common/SidebarLink';
import BottomNavLink from '@/components/common/BottomNavLink';
import StatusBadge from '@/components/common/StatusBadge';

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, isGuest, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'migrations' | 'reports'>('overview');
  const { clients, addClient, deleteClient, updateClient, repairClientDates } = useClients();
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

  // Safe Delete Handlers
  const triggerDelete = (type: 'client' | 'migration', id: string, label: string) => {
    const item = type === 'client' ? clients.find(c => c.id === id) : migrations.find(m => m.id === id);

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
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Discos");
    const laudoHeaders = [['Período', 'Status', 'Realizados', 'Total'], ['Novembro - 2024', 'Realizado', '3429', '3429'], ['Outubro - 2024', 'Outro', '4702', '4702']];
    const wsLaudos = XLSX.utils.aoa_to_sheet(laudoHeaders);
    wsLaudos['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsLaudos, "Modelo_Laudos");
    XLSX.writeFile(wb, "migraflow_modelos_importacao.xlsx");
  };

  // --- REPORT GENERATION FUNCTIONS ---
  const generateChartImage = (type: 'pie' | 'bar', data: { label: string, value: number, color: string }[], title: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle); ctx.closePath(); ctx.fill();
        const legendX = 380; const legendY = 100 + i * 30;
        ctx.fillRect(legendX, legendY, 18, 18);
        ctx.fillStyle = '#475569'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
        const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
        ctx.fillText(`${d.label}: ${d.value.toFixed(1)} (${percent}%)`, legendX + 25, legendY + 14);
        startAngle += sliceAngle;
      });
    } else {
      const maxVal = Math.max(...data.map(d => d.value), 1);
      const barWidth = 35; const spacing = 65; const startX = 80; const startY = 320; const chartHeight = 220;
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startX - 10, startY); ctx.lineTo(startX + data.length * spacing, startY); ctx.stroke();
      data.forEach((d, i) => {
        const h = (d.value / maxVal) * chartHeight;
        ctx.fillStyle = d.color; ctx.fillRect(startX + i * spacing, startY - h, barWidth, h);
        ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.save(); ctx.translate(startX + i * spacing + barWidth / 2, startY + 15); ctx.rotate(Math.PI / 6); ctx.textAlign = 'left'; ctx.fillText(d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label, 0, 0); ctx.restore();
        ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.value.toFixed(1), startX + i * spacing + barWidth / 2, startY - h - 8);
      });
    }
    return canvas.toDataURL('image/png').split(',')[1];
  };

  const generateIncidencesReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
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
        row.getCell(1).value = c.name; row.getCell(2).value = com.date; row.getCell(3).value = com.severity?.toUpperCase() || 'NORMAL'; row.getCell(4).value = com.text;
        row.eachCell((cell, i) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFFFE4E6' } } }; cell.alignment = { vertical: 'middle', horizontal: i < 4 ? 'center' : 'left' }; if (currentRow % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }; });
        currentRow++;
      });
    });
    const severitySummary = [{ label: 'Alta', value: allComments.filter(c => c.severity === 'alta').length, color: '#e11d48' }, { label: 'Média', value: allComments.filter(c => c.severity === 'media').length, color: '#f59e0b' }, { label: 'Baixa', value: allComments.filter(c => c.severity === 'baixa').length, color: '#3b82f6' }].filter(s => s.value > 0);
    if (severitySummary.length > 0) {
      const chartImg = await generateChartImage('pie', severitySummary, 'Distribuição por Severidade');
      const chartId = workbook.addImage({ base64: chartImg as string, extension: 'png' });
      sheet.addImage(chartId, { tl: { col: 5, row: 4 }, ext: { width: 400, height: 300 } });
    }
    sheet.getColumn(1).width = 25; sheet.getColumn(2).width = 15; sheet.getColumn(3).width = 15; sheet.getColumn(4).width = 60;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Log_Incidencias_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  const generateLaudosReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
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
      row.getCell(1).value = getClientName(m, clients); row.getCell(2).value = allLaudos.length; row.getCell(3).value = done; row.getCell(4).value = allLaudos.length - done;
      row.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFFDE68A' } } }; cell.alignment = { horizontal: 'center' }; });
      currentRow++;
    });
    const totalLaudosData = migrations.map(m => (m.groups?.flatMap((g: any) => g.laudos || []) || []).length).reduce((a, b) => a + b, 0);
    if (totalLaudosData > 0) {
      const globalChart = await generateChartImage('bar', [{ label: 'Total', value: totalLaudosData, color: '#b45309' }], 'Resumo Geral');
      if (globalChart) sheet.addImage(workbook.addImage({ base64: globalChart, extension: 'png' }), { tl: { col: 5, row: 4 }, ext: { width: 300, height: 200 } });
    }
    for (const m of migrations) {
      const clientName = getClientName(m, clients);
      const safeName = clientName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      const clientSheet = workbook.addWorksheet(`${safeName}_Lau`);
      clientSheet.mergeCells('A1:G2');
      const cTitle = clientSheet.getCell('A1'); cTitle.value = `LAUDOS E RELATÓRIOS: ${clientName.toUpperCase()}`; cTitle.style = { font: { bold: true, size: 12, color: { argb: 'FFB45309' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
      const allLaudos = m.groups?.flatMap((g: any) => g.laudos || []) || [];
      const tableHeaders = ['UNIDADE', 'PERÍODO', 'STATUS', 'REALIZADOS', 'TOTAL', '% PROGRESSO'];
      const hRow = clientSheet.getRow(4);
      tableHeaders.forEach((h, i) => { const cell = hRow.getCell(i + 1); cell.value = h; cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } }, alignment: { horizontal: 'center' } }; });
      allLaudos.forEach((l: any, idx) => {
        const r = clientSheet.getRow(5 + idx);
        const prog = Number(l.total) > 0 ? Math.min(1, Number(l.realizados) / Number(l.total)) : 0;
        r.getCell(1).value = m.groups?.find((g: any) => g.laudos?.includes(l))?.title || 'Unidade'; r.getCell(2).value = l.periodo; r.getCell(3).value = l.status; r.getCell(4).value = Number(l.realizados) || 0; r.getCell(5).value = Number(l.total) || 0; r.getCell(6).value = prog; r.getCell(6).numFmt = '0.0%';
        r.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFFDE68A' } } }; });
      });
      const cProgData = [{ label: 'Entregue', value: allLaudos.filter(l => l.status === 'Concluído' || l.status === 'Realizado').length, color: '#10b981' }, { label: 'Pendente', value: allLaudos.filter(l => l.status !== 'Concluído' && l.status !== 'Realizado').length, color: '#f59e0b' }].filter(p => p.value > 0);
      if (cProgData.length > 0) {
        const chartImg = await generateChartImage('pie', cProgData, 'Status de Entrega');
        if (chartImg) clientSheet.addImage(workbook.addImage({ base64: chartImg, extension: 'png' }), { tl: { col: 6, row: 4 }, ext: { width: 300, height: 250 } });
      }
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Laudos_Clinicos_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  const generateHandoffReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
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
    headers.forEach((h, i) => { const cell = headerRow.getCell(i + 1); cell.value = h; cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }, alignment: { horizontal: 'center', vertical: 'middle' } }; });
    const readyMigrations = migrations.filter(m => {
      const disks = getAllDisks(m);
      const total = disks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0);
      const realized = disks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0);
      return total > 0 && realized >= total * 0.99;
    });
    let currentRow = 6;
    readyMigrations.forEach(m => {
      const disks = getAllDisks(m);
      const vol = disks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0);
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = getClientName(m, clients); row.getCell(2).value = m.status.toUpperCase(); row.getCell(3).value = 1; row.getCell(3).numFmt = '0%'; row.getCell(4).value = 'CONCLUÍDO'; row.getCell(5).value = vol; row.getCell(5).numFmt = '#,##0.00 "TB"'; row.getCell(6).value = 'AGUARDANDO ASSINATURA';
      row.eachCell(cell => { cell.border = { bottom: { style: 'thin', color: { argb: 'FF4F46E5' } } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; });
      currentRow++;
    });
    sheet.getColumn(1).width = 30; sheet.getColumn(2).width = 15; sheet.getColumn(3).width = 12; sheet.getColumn(4).width = 20; sheet.getColumn(5).width = 20; sheet.getColumn(6).width = 25;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Handoff_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  const generateDensityReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Densidade e Eficiência');
    sheet.mergeCells('A1:F2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MIGRAFLOW | ANÁLISE DE DENSIDADE E EFICIÊNCIA OPERACIONAL';
    titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF1E293B' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    const headers = ["CLIENTE", "TOTAL ESTUDOS", "STORAGE (TB)", "MÉDIA GB/ESTUDO", "DENSIDADE (MB)", "EFICIÊNCIA"];
    const headerRow = sheet.getRow(5); headerRow.height = 25;
    headers.forEach((h, i) => { const cell = headerRow.getCell(i + 1); cell.value = h; cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }, alignment: { horizontal: 'center', vertical: 'middle' } }; });
    let currentRow = 6;
    migrations.forEach((m: any) => {
      const disks = getAllDisks(m); const studies = disks.reduce((sum: number, d: any) => sum + (Number(d.estudos) || 0), 0); const volTB = disks.reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0); const avgGB = studies > 0 ? (volTB * 1024) / studies : 0; const avgMB = avgGB * 1024;
      let efficiency = "N/A"; let effColor = "FF94A3B8";
      if (avgGB > 0) { if (avgGB < 0.5) { efficiency = "ALTA (OTIMIZADO)"; effColor = "FF059669"; } else if (avgGB < 1.5) { efficiency = "NORMAL"; effColor = "FF2563EB"; } else { efficiency = "BAIXA (DADOS DENSOS)"; effColor = "FFDC2626"; } }
      const row = sheet.getRow(currentRow); row.getCell(1).value = getClientName(m, clients); row.getCell(2).value = studies; row.getCell(3).value = volTB; row.getCell(4).value = avgGB; row.getCell(5).value = avgMB; row.getCell(6).value = efficiency;
      row.getCell(2).numFmt = '#,##0'; row.getCell(3).numFmt = '#,##0.00 "TB"'; row.getCell(4).numFmt = '#,##0.00 "GB"'; row.getCell(5).numFmt = '#,##0 "MB"';
      row.eachCell((cell, colNumber) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }; cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'center' : 'left' }; if (colNumber === 6) cell.font = { bold: true, color: { argb: effColor }, size: 8 }; });
      currentRow++;
    });
    const densityData = migrations.slice(0, 8).map((m: any) => {
      const disks = getAllDisks(m); const studies = disks.reduce((sum: number, d: any) => sum + (Number(d.estudos) || 0), 0); const volTB = disks.reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0);
      return { label: getClientName(m, clients), value: studies > 0 ? (volTB * 1024) / studies : 0, color: '#6366f1' };
    }).filter((d: any) => d.value > 0);
    if (densityData.length > 0) {
      const chartImg = await generateChartImage('bar', densityData, 'Média de Storage por Estudo (GB)');
      if (chartImg) sheet.addImage(workbook.addImage({ base64: chartImg, extension: 'png' }), { tl: { col: 6, row: 4 }, ext: { width: 500, height: 350 } });
    }
    sheet.getColumn(1).width = 25; sheet.getColumn(4).width = 15; sheet.getColumn(5).width = 15; sheet.getColumn(6).width = 25;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Analise_Densidade_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  const generateExecutiveReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumo Executivo');
    const totalMapeado = migrations.reduce((acc: number, m: any) => acc + getAllDisks(m).reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0), 0);
    const totalEnviado = migrations.reduce((acc: number, m: any) => acc + getAllDisks(m).reduce((sum: number, d: any) => sum + parseNum(d.storageEnviado), 0), 0);
    const totalPastas = migrations.reduce((acc: number, m: any) => { const allDisks = getAllDisks(m); if (m.isIncremental) return acc + Math.max(0, ...allDisks.map((d: any) => Number(d.totalPastas) || 0)); return acc + allDisks.reduce((sum: number, d: any) => sum + (Number(d.totalPastas) || 0), 0); }, 0);
    const realizedPastas = migrations.reduce((acc: number, m: any) => { const allDisks = getAllDisks(m); if (m.isIncremental) return acc + Math.max(0, ...allDisks.map((d: any) => Number(d.pastasRealizadas) || 0)); return acc + allDisks.reduce((sum: number, d: any) => sum + (Number(d.pastasRealizadas) || 0), 0); }, 0);
    const progressGlobal = totalPastas > 0 ? Math.min(1, realizedPastas / totalPastas) : 0;
    const headerStyle: any = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { bottom: { style: 'thin', color: { argb: 'FF334155' } }, top: { style: 'thin', color: { argb: 'FF334155' } }, left: { style: 'thin', color: { argb: 'FF334155' } }, right: { style: 'thin', color: { argb: 'FF334155' } } } };
    sheet.mergeCells('A1:G2'); const titleCell = sheet.getCell('A1'); titleCell.value = 'MIGRAFLOW | DASHBOARD EXECUTIVO DE MIGRAÇÃO'; titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF2563EB' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    sheet.mergeCells('A3:G3'); sheet.getCell('A3').value = `Relatório Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`; sheet.getCell('A3').style = { font: { italic: true, size: 9, color: { argb: 'FF64748B' } }, alignment: { horizontal: 'center' } };
    const cards = [{ label: 'PROGRESSO GLOBAL', value: progressGlobal, format: '0.0%', color: 'FF2563EB' }, { label: 'VOLUME MAPEADO', value: totalMapeado, format: '#,##0.00 "TB"', color: 'FF1E293B' }, { label: 'VOLUME ENVIADO', value: totalEnviado, format: '#,##0.00 "TB"', color: 'FF10B981' }, { label: 'UNIDADES ATIVAS', value: migrations.length, format: '0', color: 'FF6366F1' }];
    const cardCols = [1, 3, 5, 7]; cards.forEach((card, i) => { const colIdx = cardCols[i]; const cellLabel = sheet.getCell(5, colIdx); const cellValue = sheet.getCell(6, colIdx); cellLabel.value = card.label; cellLabel.style = { font: { bold: true, size: 8, color: { argb: 'FF94A3B8' } }, alignment: { horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } } }; cellValue.value = card.value; cellValue.style = { font: { bold: true, size: 12, color: { argb: card.color } }, alignment: { horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }, numFmt: card.format }; const borderStyle: any = { style: 'thin', color: { argb: 'FFE2E8F0' } }; cellLabel.border = { top: borderStyle, left: borderStyle, right: borderStyle }; cellValue.border = { bottom: borderStyle, left: borderStyle, right: borderStyle }; });
    const tableHeader = ['CLIENTE / UNIDADE', 'STATUS ATUAL', 'PROGRESSO', 'MAPEADO (TB)', 'ENVIADO (TB)', 'ESTUDOS', 'PREVISÃO']; const row8 = sheet.getRow(8); row8.height = 25; tableHeader.forEach((h, i) => { const cell = row8.getCell(i + 1); cell.value = h; cell.style = headerStyle; });
    migrations.forEach((m, i) => { const rowIndex = 9 + i; const allDisks = getAllDisks(m); const mVol = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0); const mSent = allDisks.reduce((acc: number, d: any) => acc + parseNum(d.storageEnviado), 0); const mTotal = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => Number(d.totalPastas) || 0)) : allDisks.reduce((acc: number, d: any) => acc + (Number(d.totalPastas) || 0), 0); const mReal = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => Number(d.pastasRealizadas) || 0)) : allDisks.reduce((acc: number, d: any) => acc + (Number(d.pastasRealizadas) || 0), 0); const mProgress = mTotal > 0 ? Math.min(1, mReal / mTotal) : 0; const mStudies = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => Number(d.estudos) || 0)) : allDisks.reduce((acc: number, d: any) => acc + (Number(d.estudos) || 0), 0); const row = sheet.getRow(rowIndex); row.height = 20; row.getCell(1).value = getClientName(m, clients); row.getCell(2).value = m.status.toUpperCase(); row.getCell(3).value = mProgress; row.getCell(3).numFmt = '0.0%'; row.getCell(4).value = mVol; row.getCell(4).numFmt = '#,##0.00'; row.getCell(5).value = mSent; row.getCell(5).numFmt = '#,##0.00'; row.getCell(6).value = mStudies; row.getCell(6).numFmt = '#,##0'; row.getCell(7).value = m.endDate || '-'; row.eachCell((cell, colNumber) => { cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' }; cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }, left: { style: 'thin', color: { argb: 'FFF1F5F9' } }, right: { style: 'thin', color: { argb: 'FFF1F5F9' } } }; if (i % 2 !== 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; }); const progressCell = row.getCell(3); if (mProgress >= 0.99) progressCell.font = { color: { argb: 'FF059669' }, bold: true, size: 9 }; else if (mProgress > 0) progressCell.font = { color: { argb: 'FF2563EB' }, bold: true, size: 9 }; });
    const statusSummary = [{ label: 'Concluída', value: migrations.filter(m => m.status === 'concluida').length, color: '#10b981' }, { label: 'Em Execução', value: migrations.filter(m => m.status === 'em_progresso').length, color: '#2563eb' }, { label: 'Pendente', value: migrations.filter(m => m.status === 'pendente').length, color: '#94a3b8' }, { label: 'Atrasada', value: migrations.filter(m => m.status === 'atrasada').length, color: '#f43f5e' }];
    const volumeByClient = migrations.slice(0, 8).map(m => ({ label: getClientName(m, clients), value: getAllDisks(m).reduce((acc: number, d: any) => acc + parseNum(d.storageMapeado), 0), color: '#6366f1' }));
    const statusChart = await generateChartImage('pie', statusSummary, 'Distribuição por Status'); if (statusChart) sheet.addImage(workbook.addImage({ base64: statusChart, extension: 'png' }), { tl: { col: 8, row: 4 }, ext: { width: 380, height: 240 } });
    const volumeChart = await generateChartImage('bar', volumeByClient, 'Volume por Cliente (TB)'); if (volumeChart) sheet.addImage(workbook.addImage({ base64: volumeChart, extension: 'png' }), { tl: { col: 8, row: 17 }, ext: { width: 380, height: 240 } });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Resumo_Executivo_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  const generateInventoryReport = async () => {
    if (typeof window !== 'undefined' && !window.Buffer) { const { Buffer } = await import('buffer'); window.Buffer = Buffer; }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventário de Discos');
    sheet.mergeCells('A1:J2'); const titleCell = sheet.getCell('A1'); titleCell.value = 'MIGRAFLOW | INVENTÁRIO TÉCNICO DE DISCOS E STORAGE'; titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF059669' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    const totalDisks = migrations.reduce((acc: number, m: any) => acc + (m.disks?.length || 0) + (m.groups?.reduce((s: number, g: any) => s + (g.disks?.length || 0), 0) || 0), 0);
    const totalMapeado = migrations.reduce((acc: number, m: any) => acc + getAllDisks(m).reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0), 0);
    const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    sheet.mergeCells('A4:C5'); sheet.getCell('A4').value = `Total de Discos: ${totalDisks} | Volumetria Global: ${fmt.format(totalMapeado)} TB`; sheet.getCell('A4').style = { font: { bold: true, size: 10 }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }, border: { top: { style: 'thin', color: { argb: 'FFD1FAE5' } }, bottom: { style: 'thin', color: { argb: 'FFD1FAE5' } }, left: { style: 'thin', color: { argb: 'FFD1FAE5' } }, right: { style: 'thin', color: { argb: 'FFD1FAE5' } } } };
    const headers = ['CLIENTE', 'UNIDADE', 'CAMINHO / HOST', 'STATUS', 'PASTAS MIGRADAS', 'TOTAL PASTAS', '% PROGRESSO', 'MAPEADO (TB)', 'ENVIADO (TB)', 'ESTUDOS'];
    const headerRow = sheet.getRow(7); headerRow.height = 25; headers.forEach((h, i) => { const cell = headerRow.getCell(i + 1); cell.value = h; cell.style = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }, alignment: { horizontal: 'center', vertical: 'middle' } }; });
    let currentRow = 8;
    migrations.forEach((m) => {
      const disks = getAllDisks(m);
      disks.forEach((d: any) => {
        const row = sheet.getRow(currentRow); row.height = 20; const progress = Number(d.totalPastas) > 0 ? Math.min(1, Number(d.pastasRealizadas) / Number(d.totalPastas)) : 0;
        row.getCell(1).value = getClientName(m, clients); row.getCell(2).value = m.groups?.find((g: any) => g.disks?.includes(d))?.title || 'Unidade Principal'; row.getCell(3).value = d.path; row.getCell(4).value = d.status; row.getCell(5).value = Number(d.pastasRealizadas) || 0; row.getCell(5).numFmt = '#,##0'; row.getCell(6).value = Number(d.totalPastas) || 0; row.getCell(6).numFmt = '#,##0'; row.getCell(7).value = progress; row.getCell(7).numFmt = '0.0%'; row.getCell(8).value = parseNum(d.storageMapeado); row.getCell(8).numFmt = '#,##0.00'; row.getCell(9).value = parseNum(d.storageEnviado); row.getCell(9).numFmt = '#,##0.00'; row.getCell(10).value = Number(d.estudos) || 0; row.getCell(10).numFmt = '#,##0';
        row.eachCell((cell, colNumber) => { cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFF1F5F9' } }, right: { style: 'thin', color: { argb: 'FFF1F5F9' } } }; cell.alignment = { vertical: 'middle', horizontal: colNumber > 4 ? 'center' : 'left' }; if (currentRow % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; });
        currentRow++;
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MigraFlow_Inventario_Tecnico_${new Date().toISOString().split('T')[0]}.xlsx`; anchor.click();
  };

  // Stats & Chart Data
  const statsValues = [
    { label: 'Total de Clientes', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Migrações Ativas', value: migrations.filter(m => m.status !== 'concluida').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Concluídas', value: migrations.filter(m => m.status === 'concluida').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Atrasadas', value: migrations.filter(m => m.status === 'atrasada').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const aggregatedData = migrations.reduce((acc: any, m: any) => {
    const clientName = getClientName(m, clients);
    const allDisks = getAllDisks(m);
    const allLaudos = (m.groups || []).flatMap((g: any) => g.laudos || []);
    
    const studies = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.estudos))) : allDisks.reduce((sum: number, d: any) => sum + parseNum(d.estudos), 0);
    const folders = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => Math.max(parseNum(d.totalPastas), parseNum(d.pastasRealizadas)))) : allDisks.reduce((sum: number, d: any) => sum + Math.max(parseNum(d.totalPastas), parseNum(d.pastasRealizadas)), 0);
    const storageMapeado = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.storageMapeado))) : allDisks.reduce((sum: number, d: any) => sum + parseNum(d.storageMapeado), 0);
    const storageEnviado = m.isIncremental ? Math.max(0, ...allDisks.map((d: any) => parseNum(d.storageEnviado))) : allDisks.reduce((sum: number, d: any) => sum + parseNum(d.storageEnviado), 0);
    const laudos = allLaudos.reduce((sum: number, l: any) => sum + parseNum(l.total), 0);
    
    if (!acc[clientName]) acc[clientName] = { name: clientName, estudos: 0, pastas: 0, volume: 0, enviado: 0, laudos: 0 };
    acc[clientName].estudos += studies;
    acc[clientName].pastas += folders;
    acc[clientName].volume += storageMapeado;
    acc[clientName].enviado += storageEnviado;
    acc[clientName].laudos += laudos;
    return acc;
  }, {});

  const chartData = Object.values(aggregatedData).sort((a: any, b: any) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
  const statusData = [
    { name: 'Pendente', value: migrations.filter(m => m.status === 'pendente').length, color: '#94a3b8' },
    { name: 'Execução', value: migrations.filter(m => m.status === 'em_progresso').length, color: '#2563eb' },
    { name: 'Pausado', value: migrations.filter(m => m.status === 'pausado').length, color: '#f59e0b' },
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
          {!isSidebarCollapsed && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-white font-bold text-lg tracking-tight font-display whitespace-nowrap">MigraFlow</motion.span>}
        </div>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-blue-600 border border-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-all z-30 shadow-sm"><ChevronLeft className={`w-3 h-3 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} /></button>
        <nav className="flex-1 px-4 space-y-1 mt-6">
          <SidebarLink icon={BarChart3} label="Visão Geral" active={activeTab === 'overview'} isCollapsed={isSidebarCollapsed} onClick={() => { setActiveTab('overview'); setSelectedMigrationId(null); }} />
          <SidebarLink icon={Users} label="Clientes" active={activeTab === 'clients'} isCollapsed={isSidebarCollapsed} onClick={() => { setActiveTab('clients'); setSelectedMigrationId(null); }} />
          <SidebarLink icon={FileUp} label="Migrações" active={activeTab === 'migrations'} isCollapsed={isSidebarCollapsed} onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }} />
          <SidebarLink icon={ClipboardList} label="Relatórios" active={activeTab === 'reports'} isCollapsed={isSidebarCollapsed} onClick={() => { setActiveTab('reports'); setSelectedMigrationId(null); }} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-3 w-full p-2 hover:bg-slate-800 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">{user?.displayName?.charAt(0)}</div>
            {!isSidebarCollapsed && <div className="text-left"><p className="text-[10px] font-black text-white truncate uppercase">{user?.displayName}</p><p className="text-[9px] text-slate-500 truncate lowercase">conectado</p></div>}
          </button>
          <AnimatePresence>{isProfileMenuOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-2 bg-slate-800 rounded-lg overflow-hidden"><button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2 text-[10px] text-rose-400 font-bold uppercase hover:bg-rose-500/10 transition-colors"><LogOut className="w-3.5 h-3.5" /> Sair</button></motion.div>}</AnimatePresence>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative pb-20 md:pb-0 min-w-0 bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1 truncate">
            <h2 className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tighter truncate">{selectedMigration ? `Detalhamento: ${getClientName(selectedMigration, clients)}` : activeTab === 'overview' ? 'Painel de Monitoramento' : activeTab === 'clients' ? 'Gestão de Clientes' : activeTab === 'reports' ? 'Centro de Inteligência' : 'Migrações'}</h2>
            <p className="hidden md:block text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">{selectedMigration ? 'Análise granular de discos e volumetria' : activeTab === 'overview' ? 'Migração de Dados e Infraestrutura' : activeTab === 'clients' ? 'Controle de Base de Atendimento' : 'Acompanhamento de Fluxo Crítico'}</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedMigration && <button onClick={() => setSelectedMigrationId(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 px-3 py-2 border border-slate-200 rounded-lg">Voltar</button>}
            {activeTab === 'clients' && !isGuest && <button onClick={() => setIsClientModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Novo Cliente</button>}
            {activeTab === 'migrations' && !selectedMigration && !isGuest && <div className="flex gap-2"><button onClick={downloadTemplate} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"><FileUp className="w-3.5 h-3.5" /></button><button onClick={() => setIsMigrationModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Nova Migração</button></div>}
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {selectedMigration ? (
              <MigrationDetails key="details" migration={selectedMigration} isGuest={isGuest} onUpdate={(data) => updateMigration(selectedMigration.id!, data)} />
            ) : activeTab === 'overview' ? (
              <Overview key="overview" stats={statsValues} chartData={chartData} statusData={statusData} migrations={migrations} clients={clients} setActiveTab={setActiveTab} setSelectedMigrationId={setSelectedMigrationId} />
            ) : activeTab === 'clients' ? (
              <ClientsView key="clients" clients={clients} isGuest={isGuest} setClientToEdit={setClientToEdit} setIsClientModalOpen={setIsClientModalOpen} triggerDelete={triggerDelete} repairClientDates={repairClientDates} />
            ) : activeTab === 'migrations' ? (
              <MigrationsView key="migrations" migrations={migrations} clients={clients} isGuest={isGuest} sortOrder={sortOrder} setSortOrder={setSortOrder} setSelectedMigrationId={setSelectedMigrationId} updateMigration={updateMigration} triggerDelete={triggerDelete} />
            ) : activeTab === 'reports' ? (
              <ReportsView key="reports" migrations={migrations} onGenerateIncidencesReport={generateIncidencesReport} onGenerateHandoffReport={generateHandoffReport} onGenerateExecutiveReport={generateExecutiveReport} onGenerateInventoryReport={generateInventoryReport} onGenerateLaudosReport={generateLaudosReport} onGenerateStorageReport={generateInventoryReport} onGenerateDensityReport={generateDensityReport} />
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating UI Elements */}
      {!isGuest && <button onClick={() => setIsChatOpen(true)} className="hidden md:flex fixed bottom-8 right-8 bg-slate-900 text-white w-16 h-16 rounded-2xl shadow-2xl items-center justify-center z-30 hover:scale-110 transition-all"><MessageSquare className="w-6 h-6 text-blue-500" /></button>}
      <MigrationModal isOpen={isMigrationModalOpen} onClose={() => setIsMigrationModalOpen(false)} clients={clients} onAdd={addMigration} isGuest={isGuest} />
      <ClientModal isOpen={isClientModalOpen} onClose={() => { setIsClientModalOpen(false); setClientToEdit(null); }} onAdd={addClient} onUpdate={updateClient} clientToEdit={clientToEdit} isGuest={isGuest} />
      {!isGuest && <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} migrations={migrations} isGuest={isGuest} />}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-around z-50">
        <BottomNavLink icon={BarChart3} label="Painel" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSelectedMigrationId(null); }} />
        <BottomNavLink icon={Users} label="Clientes" active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setSelectedMigrationId(null); }} />
        <BottomNavLink icon={FileUp} label="Fluxo" active={activeTab === 'migrations'} onClick={() => { setActiveTab('migrations'); setSelectedMigrationId(null); }} />
        <BottomNavLink icon={ClipboardList} label="Relat." active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setSelectedMigrationId(null); }} />
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {undoToast.show && <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-[100] border border-slate-800"><p className="text-xs font-black uppercase">{undoToast.label} removido</p><button onClick={handleUndo} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Desfazer</button></motion.div>}
        {deleteConfirm.isOpen && <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"><div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 className="w-8 h-8 text-rose-600" /></div><h2 className="text-xl font-black uppercase mb-2">Excluir {deleteConfirm.type === 'client' ? 'Cliente' : 'Migração'}?</h2><p className="text-sm text-slate-500 mb-6 font-medium">Remover {deleteConfirm.label} definitivamente?</p><div className="flex gap-3"><button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black uppercase text-xs">Cancelar</button><button onClick={executeConfirmDelete} className="flex-1 bg-rose-600 text-white py-3 rounded-2xl font-black uppercase text-xs shadow-lg">Confirmar</button></div></motion.div></div>}
        {integrityModal.isOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIntegrityModal({ ...integrityModal, isOpen: false })} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"><div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-amber-600" /></div><h2 className="text-xl font-black uppercase mb-2">Bloqueio Crítico</h2><p className="text-sm text-slate-500 mb-6 font-medium">Não é possível excluir {integrityModal.label} com projetos ativos.</p><button onClick={() => setIntegrityModal({ ...integrityModal, isOpen: false })} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase text-xs">Entendido</button></motion.div></div>}
      </AnimatePresence>
    </div>
  );
}
