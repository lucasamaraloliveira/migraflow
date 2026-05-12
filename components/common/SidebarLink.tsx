'use client';

import React from 'react';
import { motion } from 'motion/react';

interface SidebarLinkProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  isCollapsed?: boolean;
}

export default function SidebarLink({ icon: Icon, label, active, onClick, isCollapsed }: SidebarLinkProps) {
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
