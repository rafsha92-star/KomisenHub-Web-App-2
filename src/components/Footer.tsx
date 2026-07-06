/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-4 px-6 md:px-8 text-xs flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800" id="komisenhub-footer">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-center md:text-left">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
          140+ Tawaran Aktif
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span>Ejen Berdaftar: 12,450+</span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="text-white font-medium">Jumlah Komisen Dibayar: RM 4.2M+</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 font-sans text-slate-400">
        <span className="text-slate-600 text-[10px] uppercase font-mono tracking-wider mr-2">KOMISENHUB MALAYSIA</span>
        <span className="text-slate-500">&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};
