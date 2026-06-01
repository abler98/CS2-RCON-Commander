/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users } from 'lucide-react';
import { useRconContext } from '../../context/RconContext';
import { useStatusContext } from '../../context/StatusContext';
import type { Player } from '../../types/server';

export default function PlayersTab() {
  const { executeAction } = useRconContext();
  const { serverInfo } = useStatusContext();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Connected Players</h2>
        <div className="px-3 py-1 bg-cs-green/10 border border-cs-green/20 rounded-full text-cs-green text-[10px] font-bold tracking-widest">
          Live
        </div>
      </div>

      <div className="flex-1 bg-cs-bg-panel border border-cs-border rounded-lg overflow-hidden flex flex-col">
        {serverInfo?.playerList?.length > 0 ? (
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cs-bg-main border-b border-cs-border sticky top-0 z-10">
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest">
                    ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest">
                    Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest">
                    Time
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest">
                    Ping
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cs-border">
                {serverInfo.playerList.map((player: Player) => (
                  <tr key={player.userId} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-cs-muted">{player.userId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{player.name || 'Unknown'}</span>
                        {player.isBot ? (
                          <span className="text-[8px] px-1.5 py-0.5 bg-cs-yellow/10 border border-cs-yellow/20 text-cs-yellow font-bold rounded uppercase tracking-wider">
                            Bot
                          </span>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.5 bg-cs-green/10 border border-cs-green/20 text-cs-green font-bold rounded uppercase tracking-wider">
                            Player
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-cs-muted">
                      {player.address || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-cs-muted">
                      {player.time || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {player.isBot ? (
                        <span className="text-xs font-mono text-cs-muted">—</span>
                      ) : (
                        <span
                          className={`text-xs font-mono ${parseInt(player.ping) < 50 ? 'text-cs-green' : 'text-cs-yellow'}`}
                        >
                          {player.ping}ms
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => executeAction('kick', player.userId)}
                          title={`Kick ${player.name} (Slot ${player.userId})`}
                          className="px-3 py-1 bg-cs-yellow/10 hover:bg-cs-yellow text-cs-yellow hover:text-black text-[10px] font-bold rounded transition-all uppercase"
                        >
                          Kick
                        </button>
                        {!player.isBot ? (
                          <>
                            <button
                              onClick={() => executeAction('ban', '60', player.userId)}
                              title={`Ban ${player.name} for 60m`}
                              className="px-3 py-1 bg-cs-red/10 hover:bg-cs-red text-cs-red hover:text-white text-[10px] font-bold rounded transition-all uppercase"
                            >
                              Ban 1h
                            </button>
                            <button
                              onClick={() => executeAction('ban', '0', player.userId)}
                              title={`Permanent Ban ${player.name}`}
                              className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-[10px] font-bold rounded transition-all uppercase"
                            >
                              Forever
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-20">
            <Users className="w-24 h-24 stroke-[0.5]" />
            <p className="text-xs uppercase tracking-[0.4em]">No Personnel Detected</p>
          </div>
        )}
      </div>
    </>
  );
}
