/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { ServerDetails } from '../types/server';
import type { CVar } from '../types/cvars';
import { sanitizeConfig } from '../lib/config';

interface UseCvarsParams {
  config: ServerDetails;
  addLog: (type: 'command' | 'response' | 'error', content: string) => void;
  executeAction: (action: string, value?: string, target?: string) => Promise<boolean>;
}

// The cvars data layer behind CvarsContext: the parsed cvar directory, the raw
// cvarlist dump, the loading flag, and the raw-modal visibility. Wrapped by
// CvarsProvider (not tab-local) so the list outlives the Cvars/Actions tabs and
// the Raw modal in AppLayout; reads config/addLog/executeAction from the RCON
// core and is exposed via useCvarsContext().
export function useCvars({ config, addLog, executeAction }: UseCvarsParams) {
  const [cvars, setCvars] = useState<CVar[]>([]);
  const [rawCvars, setRawCvars] = useState('');
  const [showRawModal, setShowRawModal] = useState(false);
  const [isLoadingCvars, setIsLoadingCvars] = useState(false);

  const fetchCvars = async () => {
    setIsLoadingCvars(true);
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/cvars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCvars(data.cvars);
        setRawCvars(data.raw);
      }
    } catch (err: any) {
      addLog('error', `Directory Fault: ${err.message}`);
    } finally {
      setIsLoadingCvars(false);
    }
  };

  const updateCvar = async (name: string, value: string) => {
    const success = await executeAction('cvar', value, name);
    if (success) {
      setCvars((prev) => prev.map((c) => (c.name === name ? { ...c, value } : c)));
    }
  };

  return {
    cvars,
    rawCvars,
    showRawModal,
    setShowRawModal,
    isLoadingCvars,
    fetchCvars,
    updateCvar,
  };
}
