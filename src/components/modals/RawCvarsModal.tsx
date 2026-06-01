/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCvarsContext } from '../../context/CvarsContext';

export default function RawCvarsModal() {
  const {
    rawCvars,
    setShowRawModal,
  } = useCvarsContext();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowRawModal(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-cs-bg-panel border border-cs-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col relative z-10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-cs-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest">RCON Raw Output: cvarlist</h3>
          <button onClick={() => setShowRawModal(false)} className="p-1 hover:bg-white/5 rounded text-cs-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-cs-muted bg-cs-bg-console">
          <pre className="whitespace-pre-wrap">{rawCvars || 'No raw data available. Ensure connection is active and data has been fetched.'}</pre>
        </div>
      </motion.div>
    </div>
  );
}
