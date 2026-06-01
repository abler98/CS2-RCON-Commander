/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Users, Zap, Activity, ChevronDown, MessageSquare, RefreshCw } from 'lucide-react';
import { useRconContext } from '../../context/RconContext';
import { useCvarsContext } from '../../context/CvarsContext';

export default function ActionsTab() {
  const {
    executeAction,
    executeCommand,
  } = useRconContext();
  const {
    isLoadingCvars,
    cvars,
    fetchCvars,
  } = useCvarsContext();

  // Server Actions form state (bots, teams, rules, broadcast). The toggles seed
  // themselves from the server's cvars whenever they change, so the UI reflects
  // the live values. The actual RCON calls are issued via executeAction/executeCommand.
  const [botQuota, setBotQuota] = useState(10);
  const [botQuotaMode, setBotQuotaMode] = useState('normal');
  const [restartSec, setRestartSec] = useState(1);
  const [ctName, setCtName] = useState('');
  const [tName, setTName] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [friendlyFire, setFriendlyFire] = useState(false);

  useEffect(() => {
    cvars.forEach(c => {
      if (c.name === 'mp_friendlyfire') {
        setFriendlyFire(c.value === '1' || c.value.toLowerCase() === 'true');
      }
      if (c.name === 'bot_quota') {
        const botQuotaValue = parseInt(c.value);
        if (!isNaN(botQuotaValue)) {
          setBotQuota(botQuotaValue);
        }
      }
      if (c.name === 'bot_quota_mode') {
        setBotQuotaMode(c.value);
      }
    });
  }, [cvars]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">Server Actions</h2>
        <div className="flex gap-3">
            <button
              onClick={() => fetchCvars()}
              className="p-2.5 bg-cs-bg-panel border border-cs-border hover:bg-cs-border/50 rounded transition-colors"
              title="Force Fetch All"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCvars ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-3 py-1 bg-cs-yellow/10 border border-cs-yellow/20 rounded-full text-cs-yellow text-[10px] font-bold tracking-widest flex items-center">
              Live Session Management
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Game & Teams */}
        <div className="space-y-6">
          <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6">
            <h3 className="text-xs font-bold tracking-widest text-cs-muted mb-4 border-b border-cs-border/50 pb-2 flex items-center gap-2">
                <Zap className="w-3 h-3 text-cs-yellow" /> Combat & Rules
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Friendly Fire</p>
                  <p className="text-[10px] text-cs-muted">Allow teammates to damage each other</p>
                </div>
                <button 
                  onClick={() => {
                    const next = !friendlyFire;
                    setFriendlyFire(next);
                    executeAction('cvar', next ? '1' : '0', 'mp_friendlyfire');
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${friendlyFire ? 'bg-cs-green' : 'bg-cs-bg-main'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${friendlyFire ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="pt-4 space-y-2">
                <label className="text-[10px] uppercase text-cs-muted font-bold block">Quick Restart Schedule (Seconds)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" min="1" max="60"
                    value={restartSec}
                    onChange={(e) => setRestartSec(parseInt(e.target.value))}
                    className="w-20 bg-cs-bg-main border border-cs-border rounded px-3 py-2 text-sm font-mono"
                  />
                  <button 
                    onClick={() => executeCommand(`mp_restartgame ${restartSec}`)}
                    className="flex-1 bg-cs-red px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Execute Restart
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cs-muted mb-4 border-b border-cs-border/50 pb-2 flex items-center gap-2">
                <Users className="w-3 h-3 text-cs-blue" /> Team Management
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => executeCommand('mp_scrambleteams')}
                  className="flex-1 bg-cs-bg-main border border-cs-border hover:bg-white/5 p-2 rounded text-[10px] font-bold uppercase"
                >
                  Scramble Teams
                </button>
                <button 
                  onClick={() => executeCommand('mp_swapteams')}
                  className="flex-1 bg-cs-bg-main border border-cs-border hover:bg-white/5 p-2 rounded text-[10px] font-bold uppercase"
                >
                  Swap Sides
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-cs-muted font-bold">Rename CT</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Counter-Terrorists"
                      className="flex-1 bg-cs-bg-main border border-cs-border rounded px-3 py-2 text-sm"
                      value={ctName}
                      onKeyDown={(e) => e.key === 'Enter' && executeAction('teamname', ctName, 'ct')}
                      onChange={(e) => setCtName(e.target.value)}
                    />
                    <button 
                      onClick={() => executeAction('teamname', ctName, 'ct')}
                      className="bg-cs-bg-panel border border-cs-border hover:bg-white/5 px-2 rounded text-[9px] font-bold uppercase"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-cs-muted font-bold">Rename T</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Terrorists"
                      className="flex-1 bg-cs-bg-main border border-cs-border rounded px-3 py-2 text-sm"
                      value={tName}
                      onKeyDown={(e) => e.key === 'Enter' && executeAction('teamname', tName, 't')}
                      onChange={(e) => setTName(e.target.value)}
                    />
                    <button 
                      onClick={() => executeAction('teamname', tName, 't')}
                      className="bg-cs-bg-panel border border-cs-border hover:bg-white/5 px-2 rounded text-[9px] font-bold uppercase"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bots & Comms */}
        <div className="space-y-6">
          <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cs-muted mb-4 border-b border-cs-border/50 pb-2 flex items-center gap-2">
                <Activity className="w-3 h-3 text-cs-green" /> Bots
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] uppercase text-cs-muted font-bold">Bot Quota</label>
                    <span className="text-[10px] font-mono text-cs-yellow">{botQuota} ENTITIES</span>
                  </div>
                  <input 
                    type="range" min="0" max="32"
                    value={botQuota}
                    onChange={(e) => setBotQuota(parseInt(e.target.value))}
                    className="w-full accent-cs-yellow bg-cs-bg-main h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => executeAction('cvar', botQuota.toString(), 'bot_quota')}
                      className="flex-1 bg-cs-bg-main border border-cs-border hover:bg-white/5 p-2 rounded text-[10px] font-bold uppercase"
                    >
                      Set Quota
                    </button>
                    <button 
                      onClick={() => executeCommand('bot_kick')}
                      className="px-4 bg-cs-red/20 border border-cs-red/50 hover:bg-cs-red/30 p-2 rounded text-[10px] font-bold uppercase text-cs-red"
                    >
                      Kick All Bots
                    </button>
                  </div>
              </div>
              <div className="space-y-2">
                  <label htmlFor="bot-quota-mode" className="text-[10px] uppercase text-cs-muted font-bold">Quota Mode</label>
                  <div className="relative">
                    <select
                      id="bot-quota-mode"
                      value={botQuotaMode}
                      onChange={(e) => {
                        setBotQuotaMode(e.target.value);
                        executeCommand(`bot_quota_mode ${e.target.value}`);
                      }}
                      className="w-full appearance-none bg-cs-bg-main border border-cs-border rounded pl-3 pr-9 py-2 text-[11px] font-bold uppercase tracking-wide text-cs-text focus:outline-none focus:border-cs-yellow cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="fill">Fill</option>
                      <option value="match">Match</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cs-muted pointer-events-none" />
                  </div>
              </div>
            </div>
          </div>

          <div className="bg-cs-bg-panel border border-cs-border rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cs-muted mb-4 border-b border-cs-border/50 pb-2 flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-cs-blue" /> Global message
            </h3>
            <div className="space-y-4">
                <p className="text-[10px] text-cs-muted italic">Transmit a global text broadcast to all active session participants via RCON shell.</p>
                <div className="flex gap-2">
                  <input 
                    placeholder="Type broadcast message..."
                    className="flex-1 bg-cs-bg-main border border-cs-border rounded px-4 py-2 text-sm"
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeAction('say', broadcastMsg)}
                  />
                  <button 
                    onClick={() => {
                      executeAction('say', broadcastMsg);
                      setBroadcastMsg('');
                    }}
                    className="bg-cs-blue px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Send
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
