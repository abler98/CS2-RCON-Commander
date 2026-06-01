/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Map as MapIcon, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useConfirmModal } from '../../context/ConfirmModalContext';

export default function ConfirmModal() {
  const {
    confirmModal,
    setConfirmModal,
  } = useConfirmModal();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-cs-bg-panel border border-cs-border rounded-xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
      >
        <div className="bg-cs-yellow h-1 w-full" />
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${confirmModal.type === 'map' ? 'bg-cs-yellow/20' : 'bg-cs-blue/20'}`}>
              {confirmModal.type === 'map' ? <MapIcon className="w-6 h-6 text-cs-yellow" /> : <Zap className="w-6 h-6 text-cs-blue" />}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-cs-muted font-bold uppercase tracking-widest mt-1">Confirmation Required</p>
            </div>
          </div>

          {confirmModal.data?.thumb && (
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-6 border border-cs-border bg-black/40">
              <img src={confirmModal.data.thumb} className="w-full h-full object-cover" alt="Preview" />
            </div>
          )}

          <p className="text-sm text-cs-muted leading-relaxed mb-8">
            {confirmModal.description}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="flex-1 px-6 py-3 bg-white/5 border border-cs-border hover:bg-white/10 rounded-lg text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={confirmModal.action}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-lg shadow-black/20 ${
                confirmModal.type === 'map' ? 'bg-cs-yellow text-black hover:scale-[1.02]' : 'bg-cs-blue text-white hover:scale-[1.02]'
              }`}
            >
              Confirm Change
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
