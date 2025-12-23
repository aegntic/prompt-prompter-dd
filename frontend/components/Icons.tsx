
import React from 'react';

export const DatadogLogo = () => (
  <div className="flex items-center gap-2 text-slate-800 dark:text-white opacity-60 hover:opacity-100 transition-opacity">
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.6667 36.3333V43H36.3333V36.3333H11.6667ZM11.6667 29.6667V13H5V29.6667H11.6667ZM18.3333 5V43H25V5H18.3333ZM31.6667 5V43H38.3333V5H31.6667ZM43 13V29.6667H36.3333V13H43Z" fill="currentColor"/>
    </svg>
    <span className="font-bold text-xl tracking-tighter">DATADOG</span>
  </div>
);

export const GeminiLogo = () => (
  <div className="flex items-center gap-2 text-slate-800 dark:text-white opacity-60 hover:opacity-100 transition-opacity">
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L28.1 19.9L44 24L28.1 28.1L24 44L19.9 28.1L4 24L19.9 19.9L24 4Z" fill="#3B82F6" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"/>
    </svg>
    <span className="font-tech text-xl">Gemini</span>
  </div>
);

export const RobotIcon = () => (
  <div className="relative w-16 h-16">
    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 dark:text-blue-400">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
      <rect x="30" y="35" width="40" height="30" rx="5" fill="currentColor" opacity="0.1" />
      <circle cx="40" cy="50" r="4" fill="currentColor" />
      <circle cx="60" cy="50" r="4" fill="currentColor" />
      <path d="M40 65 Q50 72 60 65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="45" y="25" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  </div>
);
