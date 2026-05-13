import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseNum = (val: any) => {
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

export const getAllDisks = (m: any) => {
  if (m.groups && m.groups.length > 0) {
    return m.groups.flatMap((g: any) => g.disks || []);
  }
  return m.disks || [];
};

export const getClientName = (m: any, clients: any[]) => {
  const client = clients.find(c => c.id === m.clientId);
  return client?.name || m.clientName || "Cliente Indefinido";
};

/**
 * Formata datas vindas do Firestore (Timestamp, Date ou ISO String)
 */
export const formatFirestoreDate = (date: any, formatStr: string = 'dd/MM/yyyy') => {
  if (date === null || date === undefined) return 'Pendente...';
  
  try {
    // 1. Caso seja Timestamp do Firestore (objeto com property seconds)
    if (typeof date === 'object' && date !== null && 'seconds' in date) {
      return format(new Date(date.seconds * 1000), formatStr);
    }
    
    // 2. Caso seja um objeto Date nativo
    if (date instanceof Date) {
      if (!isNaN(date.getTime())) {
        return format(date, formatStr);
      }
      return 'Data Inválida';
    }

    // 3. Caso seja uma string (ISO ou outro formato que o Date entenda) ou número
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return format(d, formatStr);
    }
  } catch (e) {
    console.error("Erro crítico na formatação de data:", e, date);
    return 'Erro Formato';
  }
  
  return 'Formato Desconhecido';
};
