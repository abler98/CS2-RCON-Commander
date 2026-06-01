/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings, X, Loader2, Palette, Power } from 'lucide-react';
import SelectMenu from '../components/SelectMenu';
import { THEMES } from '../constants/themes';
import { MAP_LIST } from '../constants/maps';
import { getGameModeName } from '../lib/gameMode';
import { useRconContext } from '../context/RconContext';
import { useStatusContext } from '../context/StatusContext';
import { useMapsContext } from '../context/MapsContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../context/ConfirmModalContext';

export default function Header() {
  const {
    config,
    isConnected,
    isConnecting,
    setShowConfig,
    executeCommand,
    resetConfig,
  } = useRconContext();
  const { serverInfo, isFetchingStatus } = useStatusContext();
  const { workshopMaps } = useMapsContext();
  const { theme, setTheme } = useTheme();
  const { confirmAction } = useConfirmModal();

  return (
    <header className="h-16 border-b border-cs-border bg-cs-bg-panel flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <img 
            src="https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react//global/cs2_icon_color_512x512.png" 
            alt="CS2 Logo" 
            className="w-8 h-8"
          />
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                {serverInfo?.hostname || (isConnected ? config.host : 'Dedicated Server')}
              </h1>
              <p className="text-[10px] text-cs-muted font-mono">
                {config.host ? `ID: ${config.host}:${config.port}` : 'NO_CONFIG_LOADED'}
              </p>
            </div>
            {isConnected && (
              <button 
                onClick={resetConfig}
                className="p-1.5 hover:bg-cs-red/10 rounded-md text-cs-muted hover:text-cs-red transition-colors"
                title="Disconnect from Server"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cs-muted tracking-widest">Status</span>
              {isFetchingStatus && <Loader2 className="w-2.5 h-2.5 text-cs-yellow animate-spin" />}
            </div>
            <span className={`text-xs flex items-center gap-1.5 ${isConnected ? 'text-cs-green' : 'text-cs-red'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cs-green animate-pulse' : 'bg-cs-red'}`}></span>
              {isConnecting ? 'Connecting...' : isConnected ? 'Active' : 'Disconnected'}
            </span>
          </div>
          
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-cs-muted tracking-widest">Game Mode</span>
            <div className="h-4 flex items-center gap-1.5 min-w-[60px] justify-end">
              {serverInfo ? (
                <span className={`text-xs font-medium ${isConnected && serverInfo ? 'text-cs-blue' : 'text-cs-muted'}`}>
                  {getGameModeName(serverInfo.gameType, serverInfo.gameMode)}
                </span>
              ) : (
                <Loader2 className="w-3 h-3 text-cs-muted animate-spin" />
              )}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-cs-muted tracking-widest">Current Map</span>
            <div className="flex flex-col items-end leading-none min-w-[80px] min-h-[16px] justify-center">
              {serverInfo ? (
                <>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`text-xs font-bold tracking-tight ${isConnected && serverInfo ? 'text-cs-yellow' : 'text-cs-muted'}`}>
                      {MAP_LIST.find(m => m.id === serverInfo.map)?.name || workshopMaps.find(m => m.id === serverInfo.map || m.name === serverInfo.map)?.name || (serverInfo.map && serverInfo.map.toLowerCase().replace(/cs2/g, 'CS2').replace(/cs/g, 'CS'))}
                    </span>
                  </div>
                  {serverInfo?.map && (
                    <span className="text-[8px] text-cs-muted font-mono mt-0.5">
                      {serverInfo.map.toLowerCase().replace(/cs2/g, 'CS2').replace(/cs/g, 'CS')}
                    </span>
                  )}
                </>
              ) : (
                <Loader2 className="w-3 h-3 text-cs-muted animate-spin" />
              )}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-cs-muted tracking-widest">Players</span>
            <div className="h-4 flex items-center gap-1.5 min-w-[50px] justify-end">
              {serverInfo ? (
                <span className={`text-xs font-medium ${isConnected && serverInfo ? 'text-cs-text' : 'text-cs-muted'}`}>
                  {`${serverInfo.players} / ${serverInfo.maxPlayers}`}
                </span>
              ) : (
                <Loader2 className="w-3 h-3 text-cs-muted animate-spin" />
              )}
            </div>
          </div>
          <button
            onClick={() => executeCommand('mp_restartgame 1')}
            disabled={!isConnected}
            className="px-4 py-2 bg-cs-red hover:brightness-110 disabled:opacity-20 text-white text-[10px] font-bold rounded shadow-lg shadow-red-900/20 active:scale-95 transition-all uppercase tracking-wider"
          >
            RESTART ROUND
          </button>
          <button
            onClick={() => confirmAction(
              'action',
              'Shutdown Server',
              'This will execute the "quit" command and stop the dedicated server process. The server will go offline.',
              () => executeCommand('quit')
            )}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-4 py-2 bg-cs-red/20 border border-cs-red/50 hover:bg-cs-red/30 disabled:opacity-20 text-cs-red text-[10px] font-bold rounded active:scale-95 transition-all uppercase tracking-wider"
            title="Shutdown Server (quit)"
          >
            <Power className="w-3.5 h-3.5" />
            SHUTDOWN
          </button>
          <div className="hidden lg:flex items-center gap-6 border-l border-cs-border pl-6 ml-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-cs-muted tracking-widest uppercase">Efficiency</span>
              <span className={`text-xs font-mono font-bold ${isConnected ? 'text-cs-blue' : 'text-cs-muted'}`}>
                {isConnected ? '99.1%' : '--'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-cs-muted tracking-widest uppercase">TPS</span>
              <span className={`text-xs font-mono font-bold ${isConnected ? 'text-cs-green' : 'text-cs-muted'}`}>
                {isConnected ? '128.0' : '--'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-cs-muted tracking-widest uppercase">VAR</span>
              <span className={`text-xs font-mono font-bold ${isConnected ? 'text-cs-text' : 'text-cs-muted'}`}>
                {isConnected ? '0.008' : '--'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <SelectMenu
              options={THEMES}
              getKey={(t) => t.id}
              getLabel={(t) => t.name}
              isActive={(t) => theme.id === t.id}
              onSelect={(t) => setTheme(t)}
              heading="Interface Theme"
              widthClass="w-48"
              placement="down"
              trigger={({ toggle }) => (
                <button
                  onClick={toggle}
                  className="p-2 hover:bg-white/5 rounded-lg text-cs-muted hover:text-white transition-colors"
                  title="Theme Settings"
                >
                  <Palette className="w-5 h-5" />
                </button>
              )}
            />

            <button 
            onClick={() => setShowConfig(true)}
            className="p-2 hover:bg-white/5 rounded-lg text-cs-muted hover:text-white transition-colors"
            title="Server Configuration"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
