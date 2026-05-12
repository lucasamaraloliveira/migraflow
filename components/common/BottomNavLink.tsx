'use client';

import React from 'react';
import { motion } from 'motion/react';

interface BottomNavLinkProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function BottomNavLink({ icon: Icon, label, active, onClick }: BottomNavLinkProps) {
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
