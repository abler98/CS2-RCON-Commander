/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConsoleEntry {
  type: 'command' | 'response' | 'error';
  content: string;
  timestamp: Date;
}
