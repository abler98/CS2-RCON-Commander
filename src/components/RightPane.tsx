/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal } from 'lucide-react';
import { groupConsoleHistory } from '../lib/sessionLog';
import { useRconContext } from '../context/RconContext';

export default function RightPane() {
  const {
    consoleHistory,
    setConsoleHistory,
  } = useRconContext();

  return (
    <aside className="w-72 border-l border-cs-border bg-cs-bg-main hidden xl:flex flex-col shrink-0 text-white">
      <div className="flex-1 overflow-hidden p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] text-cs-muted font-bold tracking-[0.2em]">Session Log</h2>
          <button 
            onClick={() => setConsoleHistory([])}
            className="text-[9px] font-bold text-cs-muted hover:text-cs-yellow transition-colors uppercase tracking-widest"
          >
            Clear Log
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {consoleHistory.length > 0 ? (
            <div className="space-y-4">
              {groupConsoleHistory(consoleHistory).reverse().slice(0, 30).map((item, i) => (
                  <div key={i} className={`p-3 rounded border-l-2 text-[10px] font-mono leading-relaxed bg-white/[0.02] shadow-sm ${
                    item.type === 'pair' ? 'border-cs-yellow/50' : 
                    item.type === 'command' ? 'border-cs-yellow' : 
                    item.type === 'error' ? 'border-cs-red' : 'border-cs-blue/30'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-bold tracking-widest ${
                        item.type === 'pair' || item.type === 'command' ? 'text-cs-yellow' : 
                        item.type === 'error' ? 'text-cs-red' : 'text-cs-muted'
                      }`}>
                        {item.type === 'pair' ? 'Session Transaction' : 
                          item.type === 'command' ? 'Command Call' : 
                          item.type === 'error' ? 'System Error' : 'Server Response'}
                      </span>
                      <span className="text-[8px] opacity-30">
                        {item.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {item.type === 'pair' ? (
                      <div className="space-y-2">
                        <div className="text-cs-yellow font-bold bg-cs-yellow/5 p-1.5 rounded">
                          <span className="opacity-50 mr-1">$</span> {item.command}
                        </div>
                        <div className="text-cs-text pl-3 border-l border-white/10 break-words line-clamp-4">
                          {item.response}
                        </div>
                      </div>
                    ) : (
                      <div className={`break-words line-clamp-3 ${
                        item.type === 'command' ? 'text-cs-yellow font-bold' : 
                        item.type === 'error' ? 'text-cs-red' : 'text-cs-text'
                      }`}>
                        {item.content}
                      </div>
                    )}
                  </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-cs-muted/10 opacity-50 space-y-4">
              <Terminal className="w-12 h-12 stroke-[0.5]" />
              <p className="text-[9px] uppercase tracking-widest text-center">Awaiting System<br/>Logs</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
