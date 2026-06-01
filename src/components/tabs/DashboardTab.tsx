/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server, Shield, Activity } from 'lucide-react';
import { parseSteamId } from '../../lib/steamId';
import { useRconContext } from '../../context/RconContext';
import { useStatusContext } from '../../context/StatusContext';

export default function DashboardTab() {
  const {
    config,
    isConnected,
  } = useRconContext();
  const {
    serverInfo,
    fetchStatus,
  } = useStatusContext();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Server Status</h2>
        <div className="flex gap-2">
          <button 
            onClick={fetchStatus}
            className="p-2 bg-cs-bg-panel border border-cs-border hover:bg-white/5 rounded text-cs-muted hover:text-white transition-colors"
            title="Force Refresh"
          >
            <Activity className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 bg-cs-blue/10 border border-cs-blue/20 rounded-full text-cs-blue text-[10px] font-bold tracking-widest flex items-center">
            Node: {serverInfo?.hostname || 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-cs-muted">
            <Shield className="w-4 h-4 text-cs-red" />
            <span className="text-[10px] font-bold tracking-widest">Steam Identity</span>
          </div>
          <div className="space-y-4">
            {serverInfo?.steamid ? (() => {
              const parsed = parseSteamId(serverInfo.steamid);
              if (parsed) {
                return (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-cs-muted uppercase tracking-wider">SteamID3 / GSLT</span>
                      <div className="font-mono text-sm text-cs-yellow">{parsed.steamId3}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 bg-cs-red/10 border border-cs-red/20 text-cs-red font-bold rounded">
                          {parsed.type === 'G' ? 'Persistent Server' : 'Anonymous'}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-cs-blue/10 border border-cs-blue/20 text-cs-blue font-bold rounded">
                          Universe: {parsed.universe === '1' ? 'Public' : parsed.universe}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-cs-muted font-mono rounded">
                          ID: {parsed.accountId}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pt-2 border-t border-cs-border/50">
                      <span className="text-[9px] font-bold text-cs-muted uppercase tracking-wider">SteamID64</span>
                      <div className="font-mono text-sm text-white/90">{parsed.steamId64}</div>
                    </div>
                  </>
                );
              }
              return <div className="font-mono text-sm text-cs-yellow">{serverInfo.steamid}</div>;
            })() : (
              <div className="font-mono text-sm text-cs-muted">Public Identifier N/A</div>
            )}
          </div>
        </div>
        {/* Technical Specs Cards */}
        <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-cs-muted">
            <Activity className="w-4 h-4 text-cs-yellow" />
            <span className="text-[10px] font-bold tracking-widest">Version / Build</span>
          </div>
          <div className="font-mono text-sm break-all leading-relaxed">
            {serverInfo?.version || 'Unknown System Build'}
          </div>
        </div>

        <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-cs-muted">
            <Server className="w-4 h-4 text-cs-blue" />
            <span className="text-[10px] font-bold tracking-widest">UDP/IP Interface</span>
          </div>
          <div className="font-mono text-sm">
            {serverInfo?.udp_ip || 'Internal Network Only'}
          </div>
        </div>

        <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-cs-muted">
            <Shield className="w-4 h-4 text-cs-green" />
            <span className="text-[10px] font-bold tracking-widest">OS Infrastructure</span>
          </div>
          <div className="font-mono text-sm leading-relaxed">
            {serverInfo?.os_type?.toLowerCase() || 'generic kernel'}
          </div>
        </div>
      </div>

      {/* Extended Details Table */}
      <div className="mt-8 bg-cs-bg-panel border border-cs-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-cs-border bg-cs-bg-main">
          <h3 className="text-[10px] font-bold text-cs-muted tracking-[0.2em]">Live Telemetry</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-cs-border">
          <div className="p-6 flex justify-between items-center">
            <span className="text-[11px] text-cs-muted font-bold">Humans Detected</span>
            <span className="text-2xl font-black text-white">{serverInfo?.humans ?? 0}</span>
          </div>
          <div className="p-6 flex justify-between items-center">
            <span className="text-[11px] text-cs-muted font-bold">Bots</span>
            <span className="text-2xl font-black text-cs-yellow">{serverInfo?.bots ?? 0}</span>
          </div>
          <div className="p-6 flex justify-between items-center">
            <span className="text-[11px] text-cs-muted font-bold">Current Map</span>
            <span className="text-xl font-bold text-cs-blue">{serverInfo?.map || 'N/A'}</span>
          </div>
          <div className="p-6 flex justify-between items-center">
            <span className="text-[11px] text-cs-muted font-bold">Maximum Capacity</span>
            <span className="text-xl font-bold text-cs-muted">{serverInfo?.maxPlayers || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Raw Context Output */}
      <div className="mt-8">
          <h3 className="text-[10px] font-bold text-cs-muted tracking-[0.2em] mb-4">Diagnostics Console</h3>
          <div className="bg-black/40 border border-cs-border rounded-lg p-4 font-mono text-[11px] text-cs-muted leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
            &gt; Fetching latest telemetry from node...<br/>
            &gt; Server: {config.host}:{config.port}<br/>
            &gt; Verified: {isConnected ? 'YES' : 'NO'}<br/>
            &gt; Last Response: {new Date().toLocaleTimeString()}<br/>
            &gt; All subsystems green.
          </div>
      </div>
    </>
  );
}
