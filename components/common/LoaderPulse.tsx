'use client';

import React from 'react';

export function LoaderPulse() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite]" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite_0.2s]" />
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-[pulse_1s_infinite_0.4s]" />
    </div>
  );
}
