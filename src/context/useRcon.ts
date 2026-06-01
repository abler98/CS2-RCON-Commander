/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import type { ServerDetails } from '../types/server';
import type { ConsoleEntry } from '../types/console';
import { sanitizeConfig } from '../lib/config';

export function useRcon() {
  const [config, setConfig] = useState<ServerDetails>(() => {
    const saved = localStorage.getItem('cs2_rcon_config');
    return saved ? JSON.parse(saved) : { host: '', port: '27015', password: '' };
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfig, setShowConfig] = useState(!config.host);
  const [configEdited, setConfigEdited] = useState(false);
  const [hasAutoConnectAttempted, setHasAutoConnectAttempted] = useState(false);

  // Live server log identity from the connection handshake — set in
  // testConnection, cleared in resetConfig. Exposed to the Logs tab, which feeds
  // it into useLogs to open the log stream (LogsTab → useLogs).
  const [logSignature, setLogSignature] = useState<string | null>(null);
  const [logServerAddr, setLogServerAddr] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        // Require at least host and password
        if (data.host && data.password) {
          const newConfig = {
            host: data.host,
            port: data.port || '27015',
            password: data.password,
          };
          setConfig(newConfig);
          setShowConfig(false);
        }
      } catch (err) {
        console.error('Failed to fetch environment config', err);
      }
    };
    fetchEnvConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem('cs2_rcon_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (
      !isConnected &&
      !isConnecting &&
      !hasAutoConnectAttempted &&
      !configEdited &&
      config.host &&
      config.password
    ) {
      setHasAutoConnectAttempted(true);
      testConnection();
    }
  }, [
    isConnected,
    isConnecting,
    hasAutoConnectAttempted,
    configEdited,
    config.host,
    config.password,
  ]);

  const addLog = (type: 'command' | 'response' | 'error', content: string) => {
    setConsoleHistory((prev) => [...prev, { type, content, timestamp: new Date() }].slice(-100));
  };

  const executeAction = async (action: string, value: string = '', target: string = '') => {
    if (!isConnected) {
      return false;
    }
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
          action,
          value,
          target,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('command', `Server: ${action} ${target} ${value}`);
        if (data.response) {
          addLog('response', data.response);
        }
        return true;
      } else {
        addLog('error', `Rejected: ${data.error}`);
        return false;
      }
    } catch (err: any) {
      addLog('error', `Link Fault: ${err.message}`);
      return false;
    }
  };

  const testConnection = async () => {
    if (!config.host) {
      return;
    }
    setIsConnecting(true);
    setConnectionError(null);
    const sanitized = sanitizeConfig(config);

    // Check for LAN IP
    const isPrivateIP = sanitized.host.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
    if (isPrivateIP && window.location.hostname.includes('run.app')) {
      setConnectionError(
        'Detected Private LAN IP. The cloud-based preview cannot connect to local network addresses. Please run this app locally via Docker.',
      );
      setIsConnecting(false);
      return;
    }

    try {
      const res = await fetch(`${window.location.origin}/api/rcon/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsConnected(true);
        setShowConfig(false);
        setLogSignature(data.signature ?? null);
        setLogServerAddr(data.serverAddr ?? `${sanitized.host}:${sanitized.port}`);
        addLog('response', 'Successfully established connection to server ' + sanitized.host);
      } else {
        setConnectionError(data.error || 'Authentication rejected by server.');
        addLog('error', 'Authentication failed: ' + data.error);
      }
    } catch (err: any) {
      setConnectionError(
        'Network failure: Unable to reach the backend gateway. Check your internet connection.',
      );
      addLog('error', 'Network failure: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Core RCON command sender: logs the command to the console, runs it, and
  // logs the response. The console input/recall lifecycle lives in ConsoleTab,
  // which calls this with the typed command; every other caller passes an
  // explicit command string.
  const executeCommand = async (cmd: string = ''): Promise<void> => {
    if (!cmd.trim() || isExecuting) {
      return;
    }

    addLog('command', cmd);

    setIsExecuting(true);
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
          command: cmd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('response', data.response);
      } else {
        addLog('error', data.error);
      }
    } catch (err: any) {
      addLog('error', 'Console error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run an RCON command WITHOUT writing to the console history. Returns the raw
  // server response, or '' on failure. Body mirrors executeCommand exactly.
  const runSilentCommand = async (cmd: string): Promise<string> => {
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password))),
          command: cmd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        return data.response ?? '';
      }
      return '';
    } catch {
      return '';
    }
  };

  const resetConfig = () => {
    localStorage.removeItem('cs2_rcon_config');
    setConfig({ host: '', port: '27015', password: '' });
    setIsConnected(false);
    setConnectionError(null);
    setShowConfig(true);
    setConfigEdited(false);
    setHasAutoConnectAttempted(false);
    setLogSignature(null);
    setLogServerAddr(null);
  };

  return {
    config,
    setConfig,
    isConnected,
    isConnecting,
    setIsConnecting,
    connectionError,
    consoleHistory,
    setConsoleHistory,
    isExecuting,
    showConfig,
    setShowConfig,
    setConfigEdited,
    logSignature,
    logServerAddr,
    addLog,
    executeAction,
    testConnection,
    executeCommand,
    runSilentCommand,
    resetConfig,
  };
}
