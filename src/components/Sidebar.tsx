/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Terminal, Users, Map as MapIcon, Zap, Activity, LayoutDashboard, Sliders, ChevronLeft, ScrollText } from 'lucide-react';
import { useActiveTab } from '../context/ActiveTabContext';

export default function Sidebar() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('cs2_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cs2_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);
  
  const { activeTab, setActiveTab } = useActiveTab();

  return (
    <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-56'} border-r border-cs-border bg-cs-bg-console flex flex-col items-center py-6 gap-2 shrink-0 transition-all duration-300 overflow-hidden`}>
      <div className="w-full px-3 mb-6">
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-cs-muted hover:bg-white/5 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            {!isSidebarCollapsed && <span className="text-[10px] font-bold tracking-widest">Collapse</span>}
          </div>
        </button>
      </div>

      <div className="w-full px-3 flex flex-col gap-2">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Status' },
          { id: 'console', icon: Terminal, label: 'Console' },
          { id: 'logs', icon: ScrollText, label: 'Logs' },
          { id: 'players', icon: Users, label: 'Players' },
          { id: 'maps', icon: MapIcon, label: 'Maps' },
          { id: 'gamemodes', icon: Zap, label: 'Modes' },
          { id: 'actions', icon: Sliders, label: 'Actions' },
          { id: 'cvars', icon: Activity, label: 'Variables' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center p-2 rounded-lg transition-colors cursor-pointer group relative ${
              activeTab === item.id 
                ? 'bg-cs-border text-cs-yellow' 
                : 'text-cs-muted hover:bg-white/5 hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'}`}
            title={isSidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold tracking-widest whitespace-nowrap">
                {item.label}
              </span>
            )}
            {isSidebarCollapsed && (
              <div className="absolute left-16 bg-cs-bg-panel border border-cs-border px-3 py-1 rounded text-[10px] font-bold tracking-widest text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto w-full px-3 pb-4">
        {/* Action Bar or Spacer */}
      </div>
    </aside>
  );
}
