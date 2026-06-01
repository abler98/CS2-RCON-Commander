/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LogLine {
  id: number;
  timestamp: Date;
  line: string;
}

export interface LogLimitOption {
  label: string;
  value: number;
}

export type SseStatus = 'idle' | 'connecting' | 'open' | 'error';
