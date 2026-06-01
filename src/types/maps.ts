/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MapListEntry {
  id: string;
  name: string;
}

export type MapTag = 'Defusal' | 'Hostage Rescue' | 'Arms Race';

export type MapTagFilter = 'all' | MapTag;
