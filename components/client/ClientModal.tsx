'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RichTextEditor } from '@/components/common/RichTextEditor';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (c: any) => Promise<void>;
  onUpdate?: (id: string, data: any) => Promise<void>;
  clientToEdit?: any;
  isGuest: boolean;
}

export default function ClientModal({ isOpen, onClose, onAdd, onUpdate, clientToEdit, isGuest }: ClientModalProps) {
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
