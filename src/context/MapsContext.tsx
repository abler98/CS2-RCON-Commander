/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRconContext } from './RconContext';
import { useMaps } from './useMaps';

export type MapsContextValue = ReturnType<typeof useMaps>;

const MapsContext = createContext<MapsContextValue | null>(null);

// Owns the maps data layer for the whole session. Nested inside RconProvider so
// it can read isConnected/config/addLog, and mounted above AppLayout so its data
// outlives the Maps tab — Header reads workshopMaps for the current-map label and
// the lists persist across tab switches.
export function MapsProvider({ children }: { children: ReactNode }) {
  const { isConnected, config, addLog } = useRconContext();
  const maps = useMaps({ isConnected, config, addLog });

  // Seed the installed/workshop lists on connect, independent of whether the Maps
  // tab is open, so Header's current-map label resolves right away. Replaces the
  // syncMaps call that used to live in testConnection; the effect fires after
  // isConnected is already true, so no force flag is needed.
  useEffect(() => {
    if (isConnected) {
      maps.syncMaps();
    }
  }, [isConnected]);

  return <MapsContext.Provider value={maps}>{children}</MapsContext.Provider>;
}

export function useMapsContext(): MapsContextValue {
  const ctx = useContext(MapsContext);
  if (!ctx) {
    throw new Error('useMapsContext must be used within a MapsProvider');
  }
  return ctx;
}
