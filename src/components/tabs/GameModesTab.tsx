/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, ChevronRight } from 'lucide-react';
import { GAME_MODES } from '../../constants/gameModes';
import { useRconContext } from '../../context/RconContext';
import { useStatusContext } from '../../context/StatusContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';

export default function GameModesTab() {
  const { executeAction } = useRconContext();
  const { serverInfo } = useStatusContext();
  const { confirmAction } = useConfirmModal();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Game Modes</h2>
        <div className="px-3 py-1 bg-cs-blue/10 border border-cs-blue/20 rounded-full text-cs-blue text-[10px] font-bold tracking-widest">
          Change Mode
        </div>
      </div>

      <div className="space-y-2">
        {GAME_MODES.map((mode) => {
          const isActive = serverInfo?.gameType === mode.type && serverInfo?.gameMode === mode.mode;
          return (
            <div
              key={mode.name}
              onClick={() =>
                confirmAction(
                  'gamemode',
                  `Change Mode to ${mode.name}?`,
                  `The match will restart with ${mode.name} rules.`,
                  () =>
                    executeAction(
                      'gamemode',
                      `${mode.type} ${mode.mode}`,
                      serverInfo?.map || 'de_dust2',
                    ),
                )
              }
              className={`flex items-center justify-between p-4 bg-cs-bg-panel border border-cs-border rounded-lg cursor-pointer transition-all hover:bg-white/5 ${isActive ? 'border-cs-blue/50 ring-1 ring-cs-blue/30' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-cs-blue animate-pulse' : 'bg-cs-muted/30'}`}
                />
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-cs-yellow leading-tight">{mode.name}</h3>
                    <div className="flex gap-2 font-mono text-[9px] text-cs-muted font-bold tracking-tighter opacity-50">
                      <span>T:{mode.type}</span>
                      <span>M:{mode.mode}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-cs-muted mt-0.5">
                    {(mode as any).desc || 'Standard ruleset'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isActive ? (
                  <span className="text-[9px] font-bold text-cs-blue uppercase tracking-widest bg-cs-blue/20 border border-cs-blue/30 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-[0_0_10px_rgba(30,144,255,0.1)]">
                    <span className="w-1.5 h-1.5 bg-cs-blue rounded-full animate-pulse" />
                    Active Mode
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-cs-muted/40 uppercase tracking-widest">
                    Switch
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isActive ? 'text-cs-blue translate-x-1' : 'text-cs-muted/20'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-cs-bg-panel border border-cs-border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-cs-yellow" />
          <h4 className="text-xs font-bold uppercase tracking-widest">Protocol Reminder</h4>
        </div>
        <p className="text-xs text-cs-muted leading-relaxed max-w-2xl">
          Changing the engagement ruleset (Game Mode) typically requires a map reload. The system
          will automatically trigger a reload of the current theater (
          <span className="text-cs-yellow font-bold uppercase">{serverInfo?.map}</span>) after
          updating server variables to ensure all mechanics are initialized correctly.
        </p>
      </div>
    </>
  );
}
