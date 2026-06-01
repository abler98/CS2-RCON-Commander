/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2, LayoutDashboard, Sliders, Search, RefreshCw } from 'lucide-react';
import { buildMapList, thumbnailUrl } from '../../lib/map';
import { useRconContext } from '../../context/RconContext';
import { useStatusContext } from '../../context/StatusContext';
import { useMapsContext } from '../../context/MapsContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import MapGridCard from '../maps/MapGridCard';
import MapListRow from '../maps/MapListRow';

export default function MapsTab() {
  const { executeAction, executeCommand } = useRconContext();
  const { serverInfo } = useStatusContext();
  const {
    workshopMaps,
    rawWorkshopOutput,
    showRawWorkshop,
    setShowRawWorkshop,
    isFetchingMaps,
    mapSortOrder,
    setMapSortOrder,
    mapSearch,
    setMapSearch,
    mapTagFilter,
    setMapTagFilter,
    mapViewMode,
    setMapViewMode,
    availableThumbnails,
    defaultMapOptions,
    syncMaps,
  } = useMapsContext();
  const { confirmAction } = useConfirmModal();

  // The map lists are seeded on connect by MapsProvider and persist across tab
  // switches, so there's no fetch on mount here — the manual refresh button
  // (syncMaps) re-syncs on demand.

  const filtered = buildMapList({
    defaultMapOptions,
    workshopMaps,
    mapSearch,
    mapTagFilter,
    mapSortOrder,
  });

  // Confirm + apply a map change. The only difference between grid and list is
  // whether the confirmation warns about lost progress.
  const handleMapChange = (
    map: any,
    hasThumb: boolean,
    thumbUrl: string,
    withProgressWarning: boolean,
  ) => {
    const mapName = map.name;
    const changeAction = () => {
      if (map.type === 'workshop') {
        executeCommand(`ds_workshop_changelevel ${map.rawName || map.id}`);
      } else {
        executeAction('map', map.id);
      }
    };
    const description = withProgressWarning
      ? `The server will restart to load "${mapName}". Current progress will be lost.`
      : `The server will restart to load "${mapName}".`;
    confirmAction('map', `Change Map to ${mapName}?`, description, changeAction, {
      thumb: hasThumb ? thumbUrl : null,
    });
  };

  // Per-map display values shared by both views.
  const mapDisplay = (map: any) => {
    const isCurrent =
      serverInfo?.map?.toLowerCase() === map.rawName?.toLowerCase() ||
      serverInfo?.map?.toLowerCase() === map.id?.toLowerCase();
    const rawId = (map.rawName || map.id).toLowerCase();
    const hasThumb = availableThumbnails.has(rawId);
    const thumbUrl = thumbnailUrl(rawId);
    return { isCurrent, hasThumb, thumbUrl };
  };

  return (
    <>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Map List</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMapSortOrder((prev) => (prev === 'name' ? 'source' : 'name'))}
              className="px-3 py-1 bg-cs-bg-panel border border-cs-border hover:bg-white/5 rounded text-[10px] font-bold tracking-widest uppercase transition-colors"
              title="Toggle Sort Order"
            >
              Sort: {mapSortOrder === 'name' ? 'Alphabetical' : 'By Source'}
            </button>
            <div className="flex bg-cs-bg-panel border border-cs-border rounded overflow-hidden">
              <button
                onClick={() => setMapViewMode('list')}
                className={`p-1.5 transition-colors ${mapViewMode === 'list' ? 'bg-cs-yellow text-black' : 'text-cs-muted hover:bg-white/5'}`}
                title="List View"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapViewMode('grid')}
                className={`p-1.5 transition-colors ${mapViewMode === 'grid' ? 'bg-cs-yellow text-black' : 'text-cs-muted hover:bg-white/5'}`}
                title="Grid View"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => void syncMaps()}
              disabled={isFetchingMaps}
              className="p-2 bg-cs-bg-panel border border-cs-border hover:bg-white/5 rounded text-cs-muted hover:text-white transition-colors disabled:opacity-50"
              title="Sync Maps"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingMaps ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-3 py-1 bg-cs-yellow/10 border border-cs-yellow/20 rounded-full text-cs-yellow text-[10px] font-bold tracking-widest flex items-center">
              Change Server Map
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cs-muted" />
            <input
              type="text"
              placeholder="Search maps by name or ID..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full bg-cs-bg-panel border border-cs-border rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cs-yellow/50 transition-all font-mono"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {(['all', 'Defusal', 'Hostage Rescue', 'Arms Race'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => setMapTagFilter(tag)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all whitespace-nowrap ${
                  mapTagFilter === tag
                    ? 'bg-cs-yellow text-black border-cs-yellow'
                    : 'bg-cs-bg-panel text-cs-muted border-cs-border hover:border-cs-muted/50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-center">
              No maps matching "{mapSearch}" in{' '}
              {mapTagFilter === 'all' ? 'all categories' : mapTagFilter}
            </p>
          </div>
        ) : mapViewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filtered.map((map: any) => {
              const { isCurrent, hasThumb, thumbUrl } = mapDisplay(map);
              return (
                <MapGridCard
                  key={map.id}
                  map={map}
                  isCurrent={isCurrent}
                  hasThumb={hasThumb}
                  thumbUrl={thumbUrl}
                  onSelect={() => handleMapChange(map, hasThumb, thumbUrl, true)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 pb-8">
            {filtered.map((map: any) => {
              const { isCurrent, hasThumb, thumbUrl } = mapDisplay(map);
              return (
                <MapListRow
                  key={map.id}
                  map={map}
                  isCurrent={isCurrent}
                  onSelect={() => handleMapChange(map, hasThumb, thumbUrl, false)}
                />
              );
            })}
          </div>
        )}

        {isFetchingMaps && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Scanning Workshop Repositories...
            </p>
          </div>
        )}

        {!isFetchingMaps && workshopMaps.length === 0 && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-cs-bg-panel/50 border border-cs-border border-dashed rounded-lg text-center">
              <p className="text-[10px] text-cs-muted font-bold tracking-widest uppercase">
                No Workshop Maps Found on Server
              </p>
            </div>

            <button
              onClick={() => setShowRawWorkshop(!showRawWorkshop)}
              className="text-[9px] font-bold text-cs-muted hover:text-cs-yellow uppercase tracking-tighter self-center transition-colors"
            >
              {showRawWorkshop ? 'Hide Raw Output' : 'Show Server Response'}
            </button>

            {showRawWorkshop && rawWorkshopOutput && (
              <div className="bg-black/40 p-4 rounded border border-cs-border font-mono text-[10px] whitespace-pre overflow-x-auto text-cs-muted">
                {rawWorkshopOutput}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
