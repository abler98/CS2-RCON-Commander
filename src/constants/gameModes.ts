/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GameMode } from '../types/gameModes';

export const GAME_MODES: GameMode[] = [
  { name: 'Competitive', type: '0', mode: '1', desc: 'The classic 5v5 experience' },
  { name: 'Wingman', type: '0', mode: '2', desc: 'Fast-paced 2v2 on small maps' },
  { name: 'Casual', type: '0', mode: '0', desc: 'Low-stakes gameplay with friends' },
  { name: 'Deathmatch', type: '1', mode: '2', desc: 'Instant respawns, free-for-all' },
  { name: 'Arms Race', type: '1', mode: '0', desc: 'Slay your way to the golden knife' },
  { name: 'Custom', type: '3', mode: '0', desc: 'User-defined community rules' },
];
