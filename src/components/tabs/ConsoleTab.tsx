/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRconContext } from '../../context/RconContext';
import { COMMON_COMMANDS } from '../../constants/commands';

export default function ConsoleTab() {
  const {
    isConnected,
    consoleHistory,
    isExecuting,
    executeCommand,
  } = useRconContext();

  // The Console tab's input lifecycle: the command field, the up-arrow recall
  // history (persisted), the autocomplete dropdown, and the auto-scroll /
  // auto-focus behaviour. State lives and dies with the tab (commandHistory
  // aside, which is restored from localStorage).
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('cs2_command_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempCommand, setTempCommand] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const autocompleteSuggestions = commandInput.trim()
    ? COMMON_COMMANDS.filter(cmd => cmd.toLowerCase().startsWith(commandInput.toLowerCase()) && cmd !== commandInput)
    : [];

  useEffect(() => {
    localStorage.setItem('cs2_command_history', JSON.stringify(commandHistory));
  }, [commandHistory]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory]);

  useEffect(() => {
    if (!isExecuting && isConnected) {
      commandInputRef.current?.focus();
    }
  }, [isExecuting, isConnected]);

  // Submit the typed command: record it in the recall history, reset the input
  // and autocomplete, then delegate to the shared sender (which logs it to the
  // console and runs it).
  const submitCommand = async () => {
    const cmd = commandInput;
    if (!cmd.trim() || isExecuting) {
      return;
    }
    setCommandHistory(prev => {
      const newHistory = [cmd.trim(), ...prev.filter(h => h !== cmd.trim())].slice(0, 50);
      return newHistory;
    });
    setHistoryIndex(-1);
    setTempCommand('');
    setShowAutocomplete(false);
    setCommandInput('');
    await executeCommand(cmd);
  };

  return (
    <>
      <div
        onClick={() => {
          if (window.getSelection()?.toString() === '') {
            commandInputRef.current?.focus();
          }
        }}
        className="flex-1 p-6 font-mono text-[13px] leading-relaxed overflow-y-auto custom-scrollbar flex flex-col text-cs-text cursor-text"
      >
        <div className="mt-auto space-y-1">
          {consoleHistory.map((entry, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="text-cs-muted/30 text-[10px] mt-0.5 min-w-[65px] hidden sm:block">
                [{entry.timestamp.toLocaleTimeString([], { hour12: false })}]
              </span>
              <div className="flex-1">
                {entry.type === 'command' && (
                  <div className="flex items-start gap-2 text-cs-yellow font-bold">
                    <span className="opacity-50 tracking-tighter">[RCON]</span>
                    <span>{entry.content}</span>
                  </div>
                )}
                {entry.type === 'response' && (
                  <div className="text-cs-text/90 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </div>
                )}
                {entry.type === 'error' && (
                  <div className="text-cs-red bg-cs-red/5 border-l-2 border-cs-red pl-3 py-1 my-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {entry.content}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* RCON Input Bar */}
      <div className="h-14 border-t border-cs-border bg-cs-bg-panel px-4 flex items-center gap-3 shrink-0">
        <span className="text-cs-yellow font-mono font-bold text-xs">RCON</span>
        <form onSubmit={(e) => { e.preventDefault(); submitCommand(); }} className="flex-1 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={commandInputRef}
              type="text"
              value={commandInput}
              onChange={(e) => {
                setCommandInput(e.target.value);
                if (historyIndex === -1) {
                  setTempCommand(e.target.value);
                }
                setShowAutocomplete(true);
                setAutocompleteIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && autocompleteSuggestions.length > 0) {
                  e.preventDefault();
                  setCommandInput(autocompleteSuggestions[autocompleteIndex]);
                  setShowAutocomplete(false);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (showAutocomplete && autocompleteSuggestions.length > 0) {
                    setAutocompleteIndex(prev => (prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1));
                  } else if (historyIndex < commandHistory.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    setCommandInput(commandHistory[newIndex]);
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (showAutocomplete && autocompleteSuggestions.length > 0) {
                    setAutocompleteIndex(prev => (prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0));
                  } else if (historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    setCommandInput(commandHistory[newIndex]);
                  } else if (historyIndex === 0) {
                    setHistoryIndex(-1);
                    setCommandInput(tempCommand);
                  }
                } else if (e.key === 'Escape') {
                  setShowAutocomplete(false);
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click on suggestion
                setTimeout(() => setShowAutocomplete(false), 200);
              }}
              placeholder={isConnected ? "Type command (e.g. status, changelevel, kick)..." : "Initialize connection to send commands..."}
              disabled={!isConnected || isExecuting}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-mono placeholder:text-cs-muted/40 outline-none"
            />

            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-cs-bg-panel border border-cs-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-cs-border bg-black/20 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-cs-muted uppercase tracking-widest">Suggestions</span>
                  <span className="text-[8px] text-cs-muted/50 font-mono">TAB to select</span>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {autocompleteSuggestions.map((suggestion, idx) => (
                    <div
                      key={suggestion}
                      onClick={() => {
                        setCommandInput(suggestion);
                        setShowAutocomplete(false);
                        commandInputRef.current?.focus();
                      }}
                      className={`px-4 py-2 text-xs font-mono cursor-pointer transition-colors ${idx === autocompleteIndex ? 'bg-cs-yellow/10 text-cs-yellow' : 'text-cs-muted hover:bg-white/5'}`}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-cs-muted uppercase font-bold">
            {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : "ENTER"}
          </div>
        </form>
      </div>
    </>
  );
}
