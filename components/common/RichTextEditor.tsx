'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bold, Underline, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, readOnly, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContent = useRef(value);

  // Sincroniza apenas se o valor vier de fora (ex: ao carregar o modal)
  useEffect(() => {
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
