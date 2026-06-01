/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Parse a CS2 `status` SteamID line, e.g. "[G:1:1234] (90071996...)", into its
// SteamID3 token plus the type/universe/account/steamId64 parts. Returns null
// when the value doesn't match the expected shape.
export const parseSteamId = (steamid: string) => {
  const match = steamid.match(/\[([G|A]):(\d+):(\d+)\]\s+\((\d+)\)/);
  if (!match) {
    return null;
  }
  const [, type, universe, accountId, steamId64] = match;
  return { steamId3: match[0].split(' ')[0], type, universe, accountId, steamId64 };
};
