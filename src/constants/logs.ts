/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogLimitOption } from '../types/logs';

// Options for how many log lines the Logs tab keeps in view (Infinity = unlimited).
export const LOG_LIMIT_OPTIONS: LogLimitOption[] = [
  { label: '500', value: 500 },
  { label: '1000', value: 1000 },
  { label: '2000', value: 2000 },
  { label: '5000', value: 5000 },
  { label: 'Unlimited', value: Infinity },
];
