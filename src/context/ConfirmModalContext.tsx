/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ConfirmModalState } from '../types/ui';

interface ConfirmModalContextValue {
  confirmModal: ConfirmModalState;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  confirmAction: (
    type: 'map' | 'gamemode' | 'action',
    title: string,
    description: string,
    action: () => void,
    data?: any,
  ) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    show: false,
    type: 'map',
    title: '',
    description: '',
    action: () => {},
  });

  const confirmAction = (
    type: 'map' | 'gamemode' | 'action',
    title: string,
    description: string,
    action: () => void,
    data?: any,
  ) => {
    setConfirmModal({
      show: true,
      type,
      title,
      description,
      action: () => {
        action();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
      data,
    });
  };

  return (
    <ConfirmModalContext.Provider value={{ confirmModal, setConfirmModal, confirmAction }}>
      {children}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirmModal(): ConfirmModalContextValue {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return ctx;
}
