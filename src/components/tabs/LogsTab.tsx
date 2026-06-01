/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChevronDown,
  Loader2,
  AlertTriangle,
  Power,
  PowerOff,
  ScrollText,
  Trash2,
  Pause,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import SelectMenu from '../../components/SelectMenu';
import { LOG_LIMIT_OPTIONS } from '../../constants/logs';
import { useRconContext } from '../../context/RconContext';
import { useLogs } from '../../context/useLogs';

export default function LogsTab() {
  const {
    isConnected,
    isExecuting,
    logSignature,
    logServerAddr,
    executeCommand,
    runSilentCommand,
  } = useRconContext();
  const {
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
  } = useLogs({
    isConnected,
    isExecuting,
    logSignature,
    logServerAddr,
    executeCommand,
    runSilentCommand,
  });

  return (
    <>
      {/* Logs Header */}
      <div className="h-14 border-b border-cs-border bg-cs-bg-panel px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <ScrollText className="w-4 h-4 text-cs-yellow" />
          <h2 className="text-sm font-bold tracking-wide">Live Server Logs</h2>
          {/* SSE connection status */}
          {(() => {
            const meta =
              sseStatus === 'open'
                ? { color: 'text-cs-green', dot: 'bg-cs-green', label: 'Live', pulse: true }
                : sseStatus === 'connecting'
                  ? {
                      color: 'text-cs-yellow',
                      dot: 'bg-cs-yellow',
                      label: 'Connecting…',
                      pulse: true,
                    }
                  : sseStatus === 'error'
                    ? {
                        color: 'text-cs-red',
                        dot: 'bg-cs-red',
                        label: 'Reconnecting…',
                        pulse: true,
                      }
                    : { color: 'text-cs-muted', dot: 'bg-cs-muted', label: 'Idle', pulse: false };
            return (
              <span
                className={`flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase ${meta.color}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`}
                ></span>
                {meta.label}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <SelectMenu
            options={LOG_LIMIT_OPTIONS}
            getKey={(o) => o.label}
            getLabel={(o) => o.label}
            isActive={(o) => logLimit === o.value}
            onSelect={(o) => handleLogLimitChange(o.value)}
            heading="Lines kept"
            widthClass="w-36"
            placement="up"
            className="flex items-center gap-1.5"
            beforeTrigger={
              <span className="text-[10px] text-cs-muted/60 tracking-widest uppercase hidden md:inline">
                Keep
              </span>
            }
            trigger={({ open, toggle }) => (
              <button
                onClick={toggle}
                title="Max log lines to keep in view"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-cs-border bg-cs-bg-main text-cs-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                {logLimit === Infinity ? 'Unlimited' : logLimit}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          />
          <button
            onClick={toggleLogsPaused}
            title={logsPaused ? 'Resume live updates' : 'Pause live updates (keep collecting)'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase border transition-colors ${
              logsPaused
                ? 'border-cs-yellow/30 bg-cs-yellow/10 text-cs-yellow'
                : 'border-cs-border bg-cs-bg-main text-cs-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {logsPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {logsPaused ? `Resume${pausedCount > 0 ? ` (${pausedCount})` : ''}` : 'Pause'}
          </button>
          {isConnected && logSignature && (
            <button
              onClick={toggleLogForwarding}
              disabled={logForwardingBusy || isExecuting}
              title={
                logForwarding
                  ? 'Stop the server forwarding logs here (logaddress_del_http)'
                  : "Forward this server's logs here (logaddress_add_http)"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                logForwarding
                  ? 'border-cs-green/30 bg-cs-green/10 text-cs-green'
                  : 'border-cs-border bg-cs-bg-main text-cs-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {logForwardingBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : logForwarding ? (
                <Power className="w-3 h-3" />
              ) : (
                <PowerOff className="w-3 h-3" />
              )}
              {logForwarding ? 'Forwarding' : 'Forward Logs'}
            </button>
          )}
          <button
            onClick={clearLogs}
            title="Clear logs"
            className="p-1.5 rounded text-cs-muted hover:text-cs-red hover:bg-cs-red/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Stream */}
      <div className="flex-1 p-6 font-mono text-[13px] leading-relaxed overflow-y-auto custom-scrollbar text-cs-text">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-cs-muted gap-2">
            <ScrollText className="w-8 h-8 opacity-30" />
            <p className="text-xs tracking-wide">Connect to a server to view logs.</p>
          </div>
        ) : !logSignature ? (
          <div className="h-full flex flex-col items-center justify-center text-cs-muted gap-2 text-center px-6">
            <AlertTriangle className="w-8 h-8 opacity-40 text-cs-yellow" />
            <p className="text-xs tracking-wide">Log streaming is not enabled on the server.</p>
            <p className="text-[10px] text-cs-muted/60">
              Set <span className="font-bold">LOG_INGEST_SECRET</span> and point your server at{' '}
              <span className="font-bold">logaddress_add_http</span>.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-cs-muted gap-5 px-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin opacity-40" />
              <p className="text-xs tracking-wide">Waiting for incoming logs…</p>
            </div>
            <div className="max-w-2xl w-full bg-cs-bg-panel border border-cs-border rounded-lg p-4 text-left">
              <p className="text-[11px] text-cs-muted/80 leading-relaxed mb-3">
                Add this to your <span className="font-bold text-cs-text/80">server.cfg</span> (or
                run it in the console) to forward logs here via the{' '}
                <span className="font-bold text-cs-text/80">logaddress_add_http</span> option:
              </p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 bg-black/30 border border-cs-border rounded px-3 py-2 text-[11px] text-cs-text/90 font-mono break-all select-all">
                  {logsIngestCommand}
                </code>
                <button
                  onClick={copyIngestCommand}
                  title="Copy to clipboard"
                  className="shrink-0 flex items-center justify-center px-3 rounded border border-cs-border text-cs-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  {copiedIngest ? (
                    <Check className="w-3.5 h-3.5 text-cs-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((entry) => (
              <div key={`${entry.timestamp.getTime()}-${entry.id}`} className="flex gap-4 group">
                <span className="text-cs-muted/30 text-[10px] mt-0.5 min-w-[65px] hidden sm:block">
                  [{entry.timestamp.toLocaleTimeString([], { hour12: false })}]
                </span>
                <div className="flex-1 whitespace-pre-wrap break-words text-cs-text/90">
                  {entry.line}
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </>
  );
}
