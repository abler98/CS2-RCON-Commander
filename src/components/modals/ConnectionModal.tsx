/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useRconContext } from '../../context/RconContext';

export default function ConnectionModal() {
  const {
    config,
    setConfig,
    isConnected,
    isConnecting,
    setIsConnecting,
    connectionError,
    setShowConfig,
    setConfigEdited,
    testConnection,
    resetConfig,
  } = useRconContext();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => isConnected && setShowConfig(false)}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-cs-bg-panel border border-cs-border rounded-lg p-8 w-full max-w-md relative shadow-2xl overflow-hidden"
      >
        {/* Logo Background Blur */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cs-yellow/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react//global/cs2_icon_color_512x512.png"
            alt="CS2 Logo"
            className="w-16 h-16 mb-4"
          />
          <h2 className="text-2xl font-black tracking-tighter text-cs-yellow italic uppercase">
            CS2 RCON Commander
          </h2>
          <p className="text-cs-muted text-[10px] tracking-[0.2em] mt-1 font-bold">
            Remote Server Authentication
          </p>
        </div>

        {isConnected && (
          <button
            onClick={() => setShowConfig(false)}
            className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded text-cs-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-6">
          {connectionError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-cs-red/10 border border-cs-red/30 rounded text-[11px] text-cs-red flex gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{connectionError}</span>
            </motion.div>
          )}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-mono text-cs-muted font-bold ml-1">
              Server IP Address
            </label>
            <input
              type="text"
              placeholder="E.G. 127.0.0.1"
              value={config.host}
              onChange={(e) => {
                setConfigEdited(true);
                setConfig({ ...config, host: e.target.value });
              }}
              className="w-full bg-cs-bg-console border border-cs-border rounded-md py-3 px-4 outline-none focus:border-cs-yellow/50 transition-all font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-mono text-cs-muted font-bold ml-1">
              RCON Port
            </label>
            <input
              type="text"
              placeholder="27015"
              value={config.port}
              onChange={(e) => {
                setConfigEdited(true);
                setConfig({ ...config, port: e.target.value });
              }}
              className="w-full bg-cs-bg-console border border-cs-border rounded-md py-3 px-4 outline-none focus:border-cs-yellow/50 transition-all font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-mono text-cs-muted font-bold ml-1">
              RCON Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={config.password}
              onChange={(e) => {
                setConfigEdited(true);
                setConfig({ ...config, password: e.target.value });
              }}
              className="w-full bg-cs-bg-console border border-cs-border rounded-md py-3 px-4 outline-none focus:border-cs-yellow/50 transition-all font-mono text-sm"
            />
          </div>

          {isConnected && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase text-cs-muted font-bold tracking-widest">
                Danger Zone
              </span>
              <button
                onClick={resetConfig}
                className="text-[10px] text-cs-red font-bold hover:underline uppercase tracking-widest"
              >
                Logout / Wipe Config
              </button>
            </div>
          )}

          <button
            onClick={testConnection}
            disabled={!config.host || !config.port || !config.password || isConnecting}
            className="w-full py-4 bg-cs-yellow hover:brightness-110 disabled:opacity-5 disabled:grayscale text-black font-black uppercase tracking-[0.2em] text-xs rounded shadow-xl transition-all active:scale-[0.98] mt-4"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </span>
            ) : (
              'Login to RCON'
            )}
          </button>

          {isConnecting && (
            <p className="text-center mt-4">
              <button
                onClick={() => setIsConnecting(false)}
                className="text-[10px] text-cs-muted hover:text-white uppercase font-bold tracking-widest"
              >
                Cancel Attempt
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
