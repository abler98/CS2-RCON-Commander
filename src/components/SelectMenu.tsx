/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export interface SelectMenuProps<T> {
  /** Items to render in the dropdown list. */
  options: readonly T[];
  /** Stable React key + identity for each option. */
  getKey: (option: T) => string;
  /** Visible row text for each option. */
  getLabel: (option: T) => ReactNode;
  /** True for the active option (drives highlight + check icon). */
  isActive: (option: T) => boolean;
  /** Called when an option is chosen; the menu auto-closes afterward. */
  onSelect: (option: T) => void;
  /** Small uppercase heading shown at the top of the dropdown panel. */
  heading: string;
  /**
   * Trigger element. Receives the current open state and a toggle fn so callers
   * render their own button (icon-only, value + chevron, etc.) while the menu
   * owns open/close behavior.
   */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  /** Tailwind width class for the dropdown panel. */
  widthClass?: string;
  /** Open direction: 'down' (y:10, mt-2) or 'up' (y:-6, top-full mt-2). */
  placement?: 'down' | 'up';
  /** Extra classes for the outer relative wrapper. */
  className?: string;
  /** Node rendered before the trigger inside the wrapper (e.g. a label). */
  beforeTrigger?: ReactNode;
}

export default function SelectMenu<T>({
  options,
  getKey,
  getLabel,
  isActive,
  onSelect,
  heading,
  trigger,
  widthClass = 'w-48',
  placement = 'down',
  className = '',
  beforeTrigger,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [open]);

  const y = placement === 'up' ? -6 : 10;
  const positionClass = placement === 'up' ? 'top-full mt-2' : 'mt-2';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {beforeTrigger}
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y, scale: 0.95 }}
            className={`absolute right-0 ${positionClass} ${widthClass} bg-cs-bg-panel border border-cs-border rounded-lg shadow-xl z-[100] overflow-hidden`}
          >
            <div className="p-2 border-b border-cs-border">
              <p className="text-[9px] uppercase tracking-widest text-cs-muted font-bold px-2 py-1">
                {heading}
              </p>
            </div>
            <div className="p-1">
              {options.map((option) => {
                const active = isActive(option);
                return (
                  <button
                    key={getKey(option)}
                    onClick={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${active ? 'bg-cs-yellow/10 text-cs-yellow' : 'text-cs-muted hover:bg-white/5 hover:text-white'}`}
                  >
                    {getLabel(option)}
                    {active && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
