/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ConsoleEntry } from '../types/console';

// Collapse the flat console history into display rows: a command immediately
// followed by a response becomes a single 'pair'; everything else passes
// through unchanged. Pure — the caller handles reverse/slice/render.
export const groupConsoleHistory = (consoleHistory: ConsoleEntry[]): any[] => {
  const grouped: any[] = [];
  const history = [...consoleHistory];
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    if (entry.type === 'command') {
      // Look ahead for response
      const next = history[i + 1];
      if (next && next.type === 'response') {
        grouped.push({
          type: 'pair',
          command: entry.content,
          response: next.content,
          timestamp: next.timestamp,
        });
        i++; // Skip next
      } else {
        grouped.push({
          type: 'command',
          content: entry.content,
          timestamp: entry.timestamp,
        });
      }
    } else {
      grouped.push(entry);
    }
  }
  return grouped;
};
