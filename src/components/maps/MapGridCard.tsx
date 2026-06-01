/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import NoThumbnail from './NoThumbnail';

export default function MapGridCard({
  map,
  isCurrent,
  hasThumb,
  thumbUrl,
  onSelect,
}: {
  map: any;
  isCurrent: boolean;
  hasThumb: boolean;
  thumbUrl: string;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative bg-cs-bg-panel border border-cs-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-cs-yellow/50 ${isCurrent ? 'ring-2 ring-cs-yellow border-cs-yellow' : ''}`}
    >
      <div className="aspect-video w-full bg-black/40 relative overflow-hidden flex items-center justify-center">
        {hasThumb ? (
          <img
            src={thumbUrl}
            alt={map.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement
                ?.querySelector('.fallback')
                ?.classList.remove('hidden');
            }}
          />
        ) : (
          <NoThumbnail className="absolute inset-0 flex flex-col items-center justify-center bg-cs-bg-console/50 p-4 text-center" />
        )}

        <NoThumbnail className="fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-cs-bg-console/50 p-4 text-center" />

        {isCurrent && (
          <div className="absolute top-2 right-2 bg-cs-yellow text-black text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase shadow-lg">
            Active
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex gap-1 flex-wrap">
            <span
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ${map.type === 'workshop' ? 'bg-cs-blue/80 text-white' : 'bg-white/10 text-white border border-white/10'}`}
            >
              {map.type === 'workshop' ? 'Workshop' : 'Default'}
            </span>
            {map.tag && (
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase shadow-sm ${
                  map.tag === 'Defusal'
                    ? 'bg-cs-red/80 text-white'
                    : map.tag === 'Hostage Rescue'
                      ? 'bg-cs-green/80 text-white'
                      : 'bg-cs-purple/80 text-white'
                }`}
              >
                {map.tag}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-cs-yellow leading-tight mb-1 truncate">{map.name}</h3>
        <p className="text-[10px] font-mono text-cs-muted truncate">
          {(map.rawName || map.id).toLowerCase().replace(/cs2/g, 'CS2').replace(/cs/g, 'CS')}
        </p>
      </div>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
