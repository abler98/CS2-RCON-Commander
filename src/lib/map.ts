/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MapTag } from '../types/maps';

export const getMapMetadata = (id: string) => {
  const lowId = id.toLowerCase();

  let tag: MapTag | undefined = undefined;
  let cleanName = id;

  // CS2/CS:GO conventions
  if (lowId.includes('de_')) {
    tag = 'Defusal';
  } else if (lowId.includes('cs_') || lowId.includes('cs2_')) {
    tag = 'Hostage Rescue';
  } else if (lowId.includes('ar_')) {
    tag = 'Arms Race';
  }

  // Clean name: remove prefixes like de_, cs_, cs2_, ar_ or mirror_cs_
  // we want to remove the specific tag markers
  // Example: de_dust2 -> dust2, mirror_cs_office -> mirror office
  cleanName = cleanName.replace(/^(de_|cs_|cs2_|ar_)/i, '');
  cleanName = cleanName.replace(/(_de_|_cs_|_cs2_|_ar_)/i, ' ');

  // Final polish on name
  cleanName = cleanName.split(/[_\/]/).map((part: string) => {
    const lower = part.toLowerCase();
    if (lower === 'cs2') return 'CS2';
    if (lower === 'cs') return 'CS';
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join(' ').replace(/\s+/g, ' ').trim();

  return { tag, name: cleanName };
};

export const formatMapLabel = (rawName: string) => {
  return rawName.split(/[_\/]/).map((part: string) => {
    const lower = part.toLowerCase();
    if (lower === 'cs2') return 'CS2';
    if (lower === 'cs') return 'CS';
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join(' ');
};

export const isValidServerMap = (map: any) => {
  const id = String(map.id || map.name || '').toLowerCase();
  return /^[a-z0-9_-]+$/.test(id)
    && !id.includes('/')
    && !id.includes('vanity')
    && !/(^editor|^graphics|^lobby|^prefabs|^templates|^ui|^workshop|^server)/.test(id);
};

export const thumbnailUrl = (rawId: string) =>
  `https://raw.githubusercontent.com/ggMartinez/CS2-Maps-Images/main/maps/${rawId}.png`;

// Merge the default + workshop map sources, tag each via getMapMetadata, then
// filter by search/tag and sort by name (or grouped by source). Pure.
export const buildMapList = (opts: {
  defaultMapOptions: any[];
  workshopMaps: any[];
  mapSearch: string;
  mapTagFilter: string;
  mapSortOrder: string;
}) => {
  const { defaultMapOptions, workshopMaps, mapSearch, mapTagFilter, mapSortOrder } = opts;

  const allMaps = [
    ...defaultMapOptions.map(m => {
      const meta = getMapMetadata(m.id || m.name);
      return { ...m, ...meta, rawName: m.id || m.name, type: 'default' as const };
    }),
    ...workshopMaps.map(m => {
      const meta = getMapMetadata(m.name);
      return { ...m, ...meta, rawName: m.name.toLowerCase(), id: m.id.toLowerCase(), type: 'workshop' as const };
    })
  ];

  return allMaps.filter(map => {
    const matchesSearch = map.name.toLowerCase().includes(mapSearch.toLowerCase()) ||
                        map.rawName.toLowerCase().includes(mapSearch.toLowerCase());
    const matchesTag = mapTagFilter === 'all' || map.tag === mapTagFilter;
    return matchesSearch && matchesTag;
  }).sort((a: any, b: any) => {
    if (mapSortOrder === 'source') {
      if (a.type !== b.type) return a.type === 'default' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};
