/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAME_MODES } from '../constants/gameModes';

export const getGameModeName = (type: string, mode: string) => {
  const found = GAME_MODES.find((m) => m.type === String(type) && m.mode === String(mode));
  if (found) return found.name;
  if (type === undefined || mode === undefined) return 'Unknown';
  return `Custom (${type}:${mode})`;
};
