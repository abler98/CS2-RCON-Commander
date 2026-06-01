/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ServerDetails } from '../types/server';

export const sanitizeConfig = (c: ServerDetails) => ({
  ...c,
  host: c.host
    .trim()
    .replace(/^(http|https):\/\//, '')
    .split('/')[0],
  port: c.port.trim(),
  password: c.password.trim(),
});
