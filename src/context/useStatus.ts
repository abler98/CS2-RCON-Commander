/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { ServerDetails } from '../types/server';
import { sanitizeConfig } from '../lib/config';

interface UseStatusParams {
  isConnected: boolean;
  config: ServerDetails;
}

// The server-status data layer behind StatusContext: the parsed `status` payload
// and the in-flight flag. Wrapped by StatusProvider, which owns the 3s poll and
// reads isConnected/config from the RCON core. Exposed via useStatusContext().
export function useStatus({ isConnected, config }: UseStatusParams) {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  const fetchStatus = async () => {
    if (!isConnected) {
      return;
    }
    setIsFetchingStatus(true);
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerInfo(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  return {
    serverInfo,
    isFetchingStatus,
    fetchStatus,
  };
}
