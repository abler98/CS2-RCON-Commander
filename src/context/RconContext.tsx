/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useRcon } from './useRcon';

export type RconContextValue = ReturnType<typeof useRcon>;

const RconContext = createContext<RconContextValue | null>(null);

export function RconProvider({ children }: { children: ReactNode }) {
  const value = useRcon();
  return <RconContext.Provider value={value}>{children}</RconContext.Provider>;
}

export function useRconContext(): RconContextValue {
  const ctx = useContext(RconContext);
  if (!ctx) {
    throw new Error('useRconContext must be used within a RconProvider');
  }
  return ctx;
}
