/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRconContext } from './RconContext';
import { useStatus } from './useStatus';

export type StatusContextValue = ReturnType<typeof useStatus>;

const StatusContext = createContext<StatusContextValue | null>(null);

// Owns the live server-status poll for the whole session. Nested inside
// RconProvider so it can read isConnected/config, and mounted above AppLayout so
// serverInfo is shared by Header and the Dashboard/Players/GameModes/Maps tabs.
export function StatusProvider({ children }: { children: ReactNode }) {
  const { isConnected, config } = useRconContext();
  const status = useStatus({ isConnected, config });

  // Kick off an immediate fetch on connect and refresh every 3s while connected.
  // Replaces the same effect that used to live in useRcon, and also
  // covers testConnection's old post-connect fetchStatus() call — the effect
  // fires as soon as isConnected flips true.
  useEffect(() => {
    if (isConnected) {
      status.fetchStatus();
      const interval = setInterval(status.fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return <StatusContext.Provider value={status}>{children}</StatusContext.Provider>;
}

export function useStatusContext(): StatusContextValue {
  const ctx = useContext(StatusContext);
  if (!ctx) {
    throw new Error('useStatusContext must be used within a StatusProvider');
  }
  return ctx;
}
