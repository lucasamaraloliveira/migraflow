'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, User } from 'lucide-react';
import { LoaderPulse } from '@/components/common/LoaderPulse';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  migrations: any[];
  isGuest: boolean;
}

export default function AIChatDrawer({ isOpen, onClose, migrations, isGuest }: AIChatDrawerProps) {
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
