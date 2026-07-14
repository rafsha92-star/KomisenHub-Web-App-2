/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export type StatusType = 'loading' | 'success' | 'error';

interface StatusOverlayProps {
  isOpen: boolean;
  type: StatusType;
  title: string;
  message: string;
  onClose?: () => void;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="status-overlay-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            id="status-overlay-card"
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -15, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center relative overflow-hidden"
          >
            {/* Visual background accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -z-10" />

            {/* Icon section with animations */}
            <div className="flex justify-center mb-6">
              {type === 'loading' && (
                <div className="relative">
                  <motion.div
                    id="loader-glow"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg"
                  />
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner relative border border-blue-100">
                    <Loader2 className="w-8 h-8 animate-spin stroke-[2]" />
                  </div>
                </div>
              )}

              {type === 'success' && (
                <div className="relative">
                  <motion.div
                    id="success-glow"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg"
                  />
                  <motion.div
                    id="success-icon-wrapper"
                    initial={{ scale: 0.5, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-md border border-emerald-100"
                  >
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </motion.div>
                </div>
              )}

              {type === 'error' && (
                <div className="relative">
                  <motion.div
                    id="error-glow"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"
                  />
                  <motion.div
                    id="error-icon-wrapper"
                    initial={{ scale: 0.5, rotate: 15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-md border border-red-100"
                  >
                    <XCircle className="w-9 h-9 stroke-[2.5]" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Typography */}
            <motion.h3
              id="status-overlay-title"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-sans font-extrabold text-slate-950 tracking-tight mb-2"
            >
              {title}
            </motion.h3>

            <motion.p
              id="status-overlay-message"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-slate-500 font-sans leading-relaxed px-2"
            >
              {message}
            </motion.p>

            {/* Action Button for failures, to dismiss manually */}
            {type === 'error' && onClose && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <button
                  id="status-overlay-close-btn"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-98"
                >
                  Tutup dan Cuba Semula
                </button>
              </motion.div>
            )}

            {type === 'success' && onClose && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <button
                  id="status-overlay-continue-btn"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98"
                >
                  Seterusnya <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
