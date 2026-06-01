/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronRight } from 'lucide-react';

export default function MapListRow({
  map,
  isCurrent,
  onSelect,
}: {
  map: any;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-4 bg-cs-bg-panel border border-cs-border rounded-lg cursor-pointer transition-all hover:bg-white/5 ${isCurrent ? 'border-cs-yellow/50 ring-1 ring-cs-yellow/30' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-cs-yellow animate-pulse' : 'bg-cs-muted/30'}`} />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-cs-yellow leading-tight">{map.name}</h3>
            <div className="flex gap-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${map.type === 'workshop' ? 'bg-cs-blue/20 text-cs-blue border border-cs-blue/30' : 'bg-cs-muted/10 text-cs-muted border border-cs-border'}`}>
                {map.type === 'workshop' ? 'Workshop' : 'Default'}
              </span>
              {map.tag && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${
                  map.tag === 'Defusal' ? 'bg-cs-red/20 text-cs-red border border-cs-red/30' :
                  map.tag === 'Hostage Rescue' ? 'bg-cs-green/20 text-cs-green border border-cs-green/30' :
                  'bg-cs-purple/20 text-cs-purple border border-cs-purple/30'
                }`}>
                  {map.tag}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] font-mono text-cs-muted">
            {(map.rawName || map.id).toLowerCase().replace(/cs2/g, 'CS2').replace(/cs/g, 'CS')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isCurrent && (
          <span className="text-[9px] font-bold text-cs-yellow uppercase tracking-widest bg-cs-yellow/10 px-2 py-0.5 rounded">Current</span>
        )}
        <ChevronRight className="w-4 h-4 text-cs-muted" />
      </div>
    </div>
  );
}
