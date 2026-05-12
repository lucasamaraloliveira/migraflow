import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
