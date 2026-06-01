/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRconContext } from './RconContext';
import { useCvars } from './useCvars';

export type CvarsContextValue = ReturnType<typeof useCvars>;

const CvarsContext = createContext<CvarsContextValue | null>(null);

// Owns the cvar directory for the whole session. Nested inside RconProvider so it
// can read config/addLog/executeAction, and mounted above AppLayout so the list
// outlives the Cvars/Actions tabs and the Raw modal (rendered in AppLayout).
export function CvarsProvider({ children }: { children: ReactNode }) {
  const { isConnected, config, addLog, executeAction } = useRconContext();
  const cvarsApi = useCvars({ config, addLog, executeAction });

  // Seed the cvar directory on connect, independent of whether the Cvars/Actions
  // tab is open. Replaces useCvarsAutoFetch (which fired on tab mount); the effect
  // only runs when isConnected flips true, so it seeds once per connection.
  useEffect(() => {
    if (isConnected) {
      cvarsApi.fetchCvars();
    }
  }, [isConnected]);

  return <CvarsContext.Provider value={cvarsApi}>{children}</CvarsContext.Provider>;
}

export function useCvarsContext(): CvarsContextValue {
  const ctx = useContext(CvarsContext);
  if (!ctx) {
    throw new Error('useCvarsContext must be used within a CvarsProvider');
  }
  return ctx;
}
