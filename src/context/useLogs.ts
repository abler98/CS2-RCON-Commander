/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import type { LogLine, SseStatus } from '../types/logs';

interface UseLogsParams {
  isConnected: boolean;
  isExecuting: boolean;
  logSignature: string | null;
  logServerAddr: string | null;
  executeCommand: (cmd?: string) => Promise<void>;
  runSilentCommand: (cmd: string) => Promise<string>;
}

// Owns the live server-log lifecycle for the Logs tab: the SSE stream, the
// pause/resume buffer, the log-line cap, and the server-side forwarding toggle.
// Called by LogsTab, which sources the connection context (incl. the
// connection-owned logSignature/logServerAddr) from the RCON controller. The
// hook's state lives and dies with the tab: the SSE effect opens the stream on
// mount and its cleanup tears it down on unmount or disconnect (when isConnected
// /logSignature change), so no explicit reset is needed.
export function useLogs({
  isConnected,
  isExecuting,
  logSignature,
  logServerAddr,
  executeCommand,
  runSilentCommand,
}: UseLogsParams) {
  // Live server logs (SSE) — see /api/logs/stream on the backend
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [sseStatus, setSseStatus] = useState<SseStatus>('idle');
  // When paused, the view freezes while new logs collect in logBufferRef; they
  // get flushed into `logs` on resume. logsPausedRef mirrors the state so the
  // SSE handler (a stable closure) reads the latest value without re-subscribing.
  // pausedCount is how many logs arrived while paused (not capped by the buffer).
  const [logsPaused, setLogsPaused] = useState(false);
  const [pausedCount, setPausedCount] = useState(0);
  const [copiedIngest, setCopiedIngest] = useState(false);
  // Server-side log forwarding (logaddress_*_http) toggle.
  // null = not yet determined; true/false = forwarding on/off per the server.
  const [logForwarding, setLogForwarding] = useState<boolean | null>(null);
  const [logForwardingBusy, setLogForwardingBusy] = useState(false);
  // Max log lines kept in the view/buffer (Infinity = unlimited). logLimitRef
  // mirrors it so the stable SSE handler closure reads the latest value.
  const [logLimit, setLogLimit] = useState(1000);
  const logLimitRef = useRef(1000);
  const logsPausedRef = useRef(false);
  const logBufferRef = useRef<LogLine[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  // Track the newest entry we've displayed. Timestamp is the primary cursor
  // because server ids reset to 1 when the server restarts; id is only a
  // tiebreaker for entries that share a timestamp (same ingest batch).
  const lastLogTsRef = useRef(0);
  const lastLogIdRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  // The server.cfg lines that point a CS2 server at this app's ingest endpoint.
  // Built from the current origin and the HMAC signature for this server.
  const logIngestUrl = logSignature
    ? `${window.location.origin}/api/logs/ingest/${logSignature}`
    : '';
  const logsIngestCommand = logSignature ? `logaddress_add_http "${logIngestUrl}"` : '';
  const logsIngestDelCommand = logSignature ? `logaddress_del_http "${logIngestUrl}"` : '';

  // Open an SSE log stream while the Logs tab is mounted and a token is available.
  // (The hook only lives while LogsTab is mounted, i.e. the Logs tab is active.)
  // EventSource auto-reconnects on transient errors and replays via Last-Event-ID,
  // so the server only sends entries we haven't seen.
  useEffect(() => {
    if (!isConnected || !logSignature || !logServerAddr) {
      return;
    }

    setLogs([]);
    logBufferRef.current = [];
    setPausedCount(0);
    setLogsPaused(false);
    logsPausedRef.current = false;
    lastLogTsRef.current = 0;
    lastLogIdRef.current = 0;
    setSseStatus('connecting');

    const url = `${window.location.origin}/api/logs/stream/${encodeURIComponent(logServerAddr)}?token=${logSignature}&n=200`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setSseStatus('open');
    };
    es.onerror = () => {
      // EventSource retries automatically; reflect the interrupted state.
      setSseStatus('error');
    };
    es.addEventListener('log', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { id: number; ts: number; line: string };
        // Skip anything we've already shown: older timestamp, or same timestamp
        // with an id we've already passed. New logs after a server restart carry
        // a later timestamp (ids reset), so they still get through.
        if (
          data.ts < lastLogTsRef.current ||
          (data.ts === lastLogTsRef.current && data.id <= lastLogIdRef.current)
        ) {
          return;
        }
        lastLogTsRef.current = data.ts;
        lastLogIdRef.current = data.id;
        const entry: LogLine = { id: data.id, timestamp: new Date(data.ts), line: data.line };
        if (logsPausedRef.current) {
          // Paused: keep collecting into the buffer (capped like the view), but
          // count every log received while paused regardless of the buffer cap.
          logBufferRef.current.push(entry);
          if (logBufferRef.current.length > logLimitRef.current) {
            logBufferRef.current.splice(0, logBufferRef.current.length - logLimitRef.current);
          }
          setPausedCount(prev => prev + 1);
        } else {
          setLogs(prev => [...prev, entry].slice(-logLimitRef.current));
        }
      } catch {
        // Ignore malformed frames.
      }
    });

    return () => {
      es.close();
      esRef.current = null;
      setSseStatus('idle');
    };
  }, [isConnected, logSignature, logServerAddr]);

  // Seed the forwarding toggle when the Logs tab opens on a connected server.
  useEffect(() => {
    if (!isConnected || !logSignature) {
      setLogForwarding(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const response = await runSilentCommand('logaddress_list_http');
      if (!cancelled) {
        setLogForwarding(response.includes(logIngestUrl));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, logSignature]);

  // Auto-scroll to the newest log line (same approach as the Console tab).
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Forwarding is ON if our full ingest URL appears in logaddress_list_http output.
  const checkLogForwarding = async (): Promise<void> => {
    if (logSignature) {
      const response = await runSilentCommand('logaddress_list_http');
      setLogForwarding(response.includes(logIngestUrl));
    }
  };

  // Toggle server-side forwarding. Add/del go through executeCommand (so they
  // show in the Console); the button is disabled while isExecuting so the guard
  // can't drop them. We re-list afterward to reconcile the true on/off state.
  const toggleLogForwarding = async (): Promise<void> => {
    if (logForwardingBusy || isExecuting || !logSignature) {
      return;
    }
    setLogForwardingBusy(true);
    try {
      await executeCommand(logForwarding ? logsIngestDelCommand : logsIngestCommand);
      await checkLogForwarding();
    } finally {
      setLogForwardingBusy(false);
    }
  };

  // Clear the displayed logs and any buffered-while-paused logs.
  const clearLogs = () => {
    setLogs([]);
    logBufferRef.current = [];
    setPausedCount(0);
  };

  // Toggle the live view. Pausing freezes the list (logs keep collecting in the
  // buffer); resuming flushes the buffer into the view.
  const toggleLogsPaused = () => {
    if (logsPausedRef.current) {
      logsPausedRef.current = false;
      setLogsPaused(false);
      const buffered = logBufferRef.current;
      logBufferRef.current = [];
      setPausedCount(0);
      if (buffered.length > 0) {
        setLogs(prev => [...prev, ...buffered].slice(-logLimitRef.current));
      }
    } else {
      logsPausedRef.current = true;
      setLogsPaused(true);
    }
  };

  // Change how many log lines are kept. Apply the new cap to the current view
  // and buffer right away (Infinity = unlimited, which never trims).
  const handleLogLimitChange = (limit: number) => {
    logLimitRef.current = limit;
    setLogLimit(limit);
    setLogs(prev => (prev.length > limit ? prev.slice(-limit) : prev));
    if (logBufferRef.current.length > limit) {
      logBufferRef.current.splice(0, logBufferRef.current.length - limit);
    }
  };

  const copyIngestCommand = () => {
    navigator.clipboard?.writeText(logsIngestCommand)
      .then(() => {
        setCopiedIngest(true);
        window.setTimeout(() => setCopiedIngest(false), 1500);
      })
      .catch(() => {});
  };

  return {
    logs,
    sseStatus,
    logsPaused,
    pausedCount,
    copiedIngest,
    logForwarding,
    logForwardingBusy,
    logLimit,
    logsEndRef,
    logsIngestCommand,
    toggleLogForwarding,
    clearLogs,
    toggleLogsPaused,
    handleLogLimitChange,
    copyIngestCommand,
  };
}
