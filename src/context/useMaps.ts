/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import type { ServerDetails } from '../types/server';
import type { MapTagFilter } from '../types/maps';
import { MAP_LIST } from '../constants/maps';
import { sanitizeConfig } from '../lib/config';
import { formatMapLabel, isValidServerMap } from '../lib/map';

interface UseMapsParams {
  isConnected: boolean;
  config: ServerDetails;
  addLog: (type: 'command' | 'response' | 'error', content: string) => void;
}

// The maps data layer behind MapsContext: the installed/workshop map lists, the
// list/search/filter view state, and the available-thumbnail set. Wrapped by
// MapsProvider (not tab-local) because the data outlives the Maps tab — Header
// reads workshopMaps for the current-map label and the provider seeds the lists
// on connect — and the provider exposes this return via useMapsContext().
export function useMaps({ isConnected, config, addLog }: UseMapsParams) {
  const [workshopMaps, setWorkshopMaps] = useState<any[]>([]);
  const [serverMaps, setServerMaps] = useState<any[]>([]);
  const [rawWorkshopOutput, setRawWorkshopOutput] = useState<string>('');
  const [showRawWorkshop, setShowRawWorkshop] = useState(false);
  const [isFetchingMaps, setIsFetchingMaps] = useState(false);
  const [mapSortOrder, setMapSortOrder] = useState<'name' | 'source'>('name');
  const [mapSearch, setMapSearch] = useState('');
  const [mapTagFilter, setMapTagFilter] = useState<MapTagFilter>('all');
  const [mapViewMode, setMapViewMode] = useState<'list' | 'grid'>('grid');
  const [availableThumbnails, setAvailableThumbnails] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAvailableThumbnails = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/ggMartinez/CS2-Maps-Images/main/list.json');
        if (response.ok) {
          const list = await response.json();
          if (Array.isArray(list)) {
            // Normalize names to lowercase and remove extensions for easier matching
            setAvailableThumbnails(new Set(list.map(name => name.toLowerCase().replace(/\.(png|jpg|jpeg)$/, ''))));
          }
        }
      } catch (err) {
        console.error("Failed to fetch thumbnail list", err);
      }
    };
    fetchAvailableThumbnails();
  }, []);

  const fetchWorkshopMaps = async () => {
    if (!isConnected) {
      return;
    }
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/workshop-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password)))
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkshopMaps(data.maps);
        setRawWorkshopOutput(data.raw || '');
        addLog('response', `Workshop maps loaded (${data.maps.length || 0} entries)`);
        console.debug('Workshop maps response:', data.raw || data.maps);
      } else {
        addLog('error', `Workshop maps failed: ${data.error || 'Unknown error'}`);
        console.error('Failed to fetch workshop maps:', data.error);
      }
    } catch (err: any) {
      addLog('error', `Workshop maps fetch error: ${err.message}`);
      console.error("Failed to fetch workshop maps", err);
    }
  };

  const fetchInstalledMaps = async () => {
    if (!isConnected) {
      return;
    }
    const sanitized = sanitizeConfig(config);
    try {
      const res = await fetch(`${window.location.origin}/api/rcon/installed-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitized,
          password: btoa(unescape(encodeURIComponent(config.password)))
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerMaps(data.maps);
        addLog('response', `Installed maps loaded (${data.maps.length || 0} entries)`);
        if (!data.maps || data.maps.length === 0) {
          addLog('error', 'No installed maps were returned by the server');
        }
        console.debug('Installed maps response:', data);
      } else {
        addLog('error', `Installed maps failed: ${data.error || 'Unknown error'}`);
        console.error('Failed to fetch installed maps:', data.error);
      }
    } catch (err: any) {
      addLog('error', `Installed maps fetch error: ${err.message}`);
      console.error("Failed to fetch installed maps", err);
    }
  };

  const syncMaps = async () => {
    if (!isConnected) {
      return;
    }
    setIsFetchingMaps(true);
    try {
      await Promise.allSettled([fetchInstalledMaps(), fetchWorkshopMaps()]);
    } finally {
      setIsFetchingMaps(false);
    }
  };

  const defaultMapOptions = serverMaps.length > 0
    ? serverMaps.filter(isValidServerMap).filter(m =>
        !workshopMaps.some(wm =>
          wm.id?.toLowerCase() === (m.id || m.name)?.toLowerCase() ||
          wm.name?.toLowerCase() === (m.id || m.name)?.toLowerCase()
        )
      ).map(m => ({ ...m, type: 'default' as const, name: formatMapLabel(m.name || m.id) }))
    : MAP_LIST.map(m => ({ ...m, type: 'default' as const }));

  return {
    workshopMaps,
    serverMaps,
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
    fetchWorkshopMaps,
    fetchInstalledMaps,
    syncMaps,
  };
}
