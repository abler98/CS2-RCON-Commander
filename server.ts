import 'dotenv/config';
import express from 'express';
import type { Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Rcon } from 'rcon-client';
import { createHmac, timingSafeEqual } from 'node:crypto';

// --- CS2 HTTP log ingestion (logaddress_add_http) ---------------------------
// Logs are pushed by CS2 game servers and grouped in memory per server address
// (the `x-server-addr` header). Each endpoint is protected by an HMAC-SHA256 of
// that address, so a token only grants access to one specific server's logs.

interface LogEntry {
  id: number; // monotonic per-server sequence id (Last-Event-ID target)
  ts: number; // Date.now() at ingest
  line: string; // raw log line, without trailing newline
}

interface Subscriber {
  res: Response; // the open SSE response
  heartbeat: NodeJS.Timeout; // per-subscriber keep-alive timer
}

interface ServerLogStore {
  buffer: LogEntry[]; // ring buffer, capped at LOG_MAX_LINES_PER_SERVER
  nextId: number; // never reset on eviction, so SSE ids stay monotonic
  subscribers: Set<Subscriber>; // SSE clients tailing this server
  lastSeen: number; // Date.now() of last ingest (for LRU server eviction)
}

const logStores = new Map<string, ServerLogStore>(); // key = x-server-addr

const LOG_INGEST_SECRET = process.env.LOG_INGEST_SECRET || '';
const LOG_MAX_LINES_PER_SERVER = Number(process.env.LOG_MAX_LINES_PER_SERVER) || 1000;
const LOG_MAX_SERVERS = Number(process.env.LOG_MAX_SERVERS) || 50;

// Returns lowercase hex HMAC-SHA256 of the server address, or null if no secret
// is configured (in which case ingestion/streaming are disabled).
function signServerAddr(addr: string): string | null {
  if (!LOG_INGEST_SECRET) {
    return null;
  }
  return createHmac('sha256', LOG_INGEST_SECRET).update(addr).digest('hex');
}

// Timing-safe comparison of a provided token against the expected signature.
function verifyToken(addr: string, token: unknown): boolean {
  const expected = signServerAddr(addr);
  if (!expected || typeof token !== 'string') {
    return false;
  }
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  // timingSafeEqual throws on length mismatch, so guard first.
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function getOrCreateStore(addr: string): ServerLogStore {
  let store = logStores.get(addr);
  if (store) {
    return store;
  }

  // Enforce the distinct-server cap before adding a new key by evicting the
  // least-recently-seen store that has no active subscribers.
  if (logStores.size >= LOG_MAX_SERVERS) {
    let oldestKey: string | null = null;
    let oldestSeen = Infinity;
    for (const [key, candidate] of logStores) {
      if (candidate.subscribers.size === 0 && candidate.lastSeen < oldestSeen) {
        oldestSeen = candidate.lastSeen;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) {
      logStores.delete(oldestKey);
    }
  }

  store = { buffer: [], nextId: 1, subscribers: new Set(), lastSeen: Date.now() };
  logStores.set(addr, store);
  return store;
}

function sseFrame(entry: LogEntry): string {
  return `id: ${entry.id}\nevent: log\ndata: ${JSON.stringify(entry)}\n\n`;
}

// Append new lines to a store's ring buffer and broadcast them to subscribers.
function appendAndBroadcast(store: ServerLogStore, lines: string[]): void {
  if (lines.length === 0) {
    return;
  }

  const now = Date.now();
  const newEntries: LogEntry[] = [];
  for (const line of lines) {
    const entry: LogEntry = { id: store.nextId++, ts: now, line };
    store.buffer.push(entry);
    newEntries.push(entry);
  }

  if (store.buffer.length > LOG_MAX_LINES_PER_SERVER) {
    store.buffer.splice(0, store.buffer.length - LOG_MAX_LINES_PER_SERVER);
  }

  store.lastSeen = now;

  for (const sub of store.subscribers) {
    for (const entry of newEntries) {
      try {
        sub.res.write(sseFrame(entry));
      } catch {
        // Dead socket; cleanup happens via the request 'close' handler.
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get('/api/config', (req, res) => {
    const host = process.env.SERVER_IP || '';
    const password = process.env.RCON_PASSWORD || '';
    let port = process.env.SERVER_PORT || '';

    // Default port if host and password are provided
    if (host && password && !port) {
      port = '27015';
    }

    res.json({ host, port, password });
  });

  // API Routes
  app.post('/api/rcon/test', async (req, res) => {
    let { host, port, password } = req.body;

    if (!host || !port || !password) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Sanitize host: remove http:// or https:// if provided
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 5000,
      });
      await rcon.end();

      // Provide the HMAC signature the frontend needs to read this server's logs
      // (and to build the logaddress_add_http URL). null when no secret is set.
      const serverAddr = `${host}:${port}`;
      const signature = signServerAddr(serverAddr);

      res.json({ success: true, message: 'Connected successfully', serverAddr, signature });
    } catch (error: any) {
      console.error(`RCON Test Error: ${error.message}`);
      res.status(500).json({ success: false, error: error.message || 'Connection failed' });
    }
  });

  app.post('/api/rcon/command', async (req, res) => {
    let { host, port, password, command } = req.body;

    if (!host || !port || !password || !command) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Sanitize host
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 10000,
      });
      const response = await rcon.send(command);
      await rcon.end();
      res.json({ success: true, response });
    } catch (error: any) {
      console.error(`RCON Command Error: ${error.message}`);
      res.status(500).json({ success: false, error: error.message || 'Command execution failed' });
    }
  });

  // Helper to parse CS2 status command output
  const parseCs2Status = (text: string) => {
    const lines = text.split('\n');
    const status: any = {
      hostname: '',
      map: '',
      players: 0,
      humans: 0,
      bots: 0,
      maxPlayers: 0,
      version: '',
      udp_ip: '',
      os_type: '',
      steamid: '',
      playerList: [] as any[],
    };

    let playerSectionStarted = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Header Info
      if (trimmed.match(/^hostname\s*:/i))
        status.hostname = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (trimmed.match(/^version\s*:/i))
        status.version = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (trimmed.match(/^udp\/ip\s*:/i))
        status.udp_ip = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (trimmed.match(/^os\/type\s*:/i))
        status.os_type = trimmed.slice(trimmed.indexOf(':') + 1).trim();
      if (trimmed.match(/^steamid\s*:/i))
        status.steamid = trimmed.slice(trimmed.indexOf(':') + 1).trim();

      // Map detection - handles multiple possible formats
      const mapRegexSet = [
        /map\s*:\s*(?:<[^>]+>\s*)?["']?([^\s\n\r"']+)["']?/i,
        /Loaded map\s+(?:<[^>]+>\s*)?["']?([^\s\n\r"']+)["']?/i,
        /Active map\s*:\s*(?:<[^>]+>\s*)?["']?([^\s\n\r"']+)["']?/i,
        /world\s*:\s*["']?([^\s\n\r"']+)["']?/i,
        /Current Map\s*:\s*["']?([^\s\n\r"']+)["']?/i,
        /map\s+["']?([^\s\n\r"']+)["']?/i,
        /loaded spawngroup\(\s*1\)\s*:\s*SV:\s*\[\d+:\s*([^\s|\]]+)/i,
        /SV\s*:\s*\[1:\s*([^\s|\]]+)/i,
      ];

      if (process.env.DEBUG === 'true' && trimmed.toLowerCase().includes('map')) {
        console.log(`[DEBUG] Potential map line: "${trimmed}"`);
      }

      for (const regex of mapRegexSet) {
        const match = trimmed.match(regex);
        if (match && match[1]) {
          const mapPath = match[1]
            .replace(/\.vpk$/, '')
            .replace(/["']/g, '')
            .trim();
          // Filter out obvious non-maps and prioritize spawngroup 1 or lines containing "main lump"
          const isHighConfidence =
            trimmed.includes('spawngroup(  1)') ||
            trimmed.includes('main lump') ||
            trimmed.startsWith('map :');

          if (
            mapPath &&
            mapPath.length > 2 &&
            !mapPath.includes('<') &&
            !mapPath.includes(' ') &&
            !mapPath.toLowerCase().includes('none')
          ) {
            const extractedMap = mapPath.split('/').pop() || mapPath;

            // Only update if we don't have a map yet, OR if this is a high-confidence line
            if (!status.map || isHighConfidence) {
              status.map = extractedMap;
              if (process.env.DEBUG === 'true')
                console.log(
                  `[DEBUG] Map detected: ${status.map} from "${trimmed}" (HighConf: ${isHighConfidence})`,
                );
              if (isHighConfidence) break;
            }
          }
        }
      }

      // Fallback map detection for weird lines
      if (!status.map && trimmed.includes('Loaded map') && !trimmed.includes('ERROR')) {
        const parts = trimmed.split(' ');
        const mapIdx = parts.findIndex((p) => p === 'map') + 1;
        if (mapIdx > 0 && parts[mapIdx]) {
          status.map = parts[mapIdx].replace(/[,"']/g, '');
        }
      }

      // Players line: 0 humans, 2 bots (0 max) OR 1/32 players
      if (trimmed.match(/^players\s*:\s+/i)) {
        const val = trimmed.split(':')[1]?.trim() || '';
        const humanMatch = val.match(/(\d+)\s+humans/i);
        const botMatch = val.match(/(\d+)\s+bots/i);
        const maxMatch = val.match(/\((\d+)\s+max\)/i);

        status.humans = humanMatch ? parseInt(humanMatch[1]) : 0;
        status.bots = botMatch ? parseInt(botMatch[1]) : 0;

        // Alternative format detection: 1/32
        if (!status.humans && !status.bots) {
          const slashMatch = val.match(/(\d+)\s*\/\s*(\d+)/);
          if (slashMatch) {
            status.players = parseInt(slashMatch[1]);
            status.maxPlayers = parseInt(slashMatch[2]);
            status.humans = status.players;
          }
        } else {
          status.players = status.humans + status.bots;
          status.maxPlayers = maxMatch ? parseInt(maxMatch[1]) : 0;
        }
      }

      // Player list starts: handles "# userid name" or "---------players--------"
      if (trimmed.startsWith('# userid name') || trimmed.includes('---------players--------')) {
        playerSectionStarted = true;
        return;
      }

      // Skip the column header if we're in the list
      if (playerSectionStarted && (trimmed.startsWith('id ') || trimmed.startsWith('#userid')))
        return;
      if (playerSectionStarted && trimmed.startsWith('#end')) {
        playerSectionStarted = false;
        return;
      }

      if (playerSectionStarted && trimmed.length > 5) {
        //   Columns: id  time  ping  loss  state  rate  adr  name
        //   - Human row: all 8 columns (adr = ip:port).
        //   - BOT row:   no adr column; the "time" slot literally reads "BOT".
        //   - Connecting stub: "65535 [NoChan] ... challenging ... 0unknown ''" (skip).
        if (!trimmed.startsWith('id ') && !trimmed.startsWith('#')) {
          // The name lives inside single or double quotes; everything before the
          // first quote is the fixed-position column prefix.
          let name = '';
          let prefix = trimmed;
          const quoteIdx = trimmed.search(/['"]/);
          if (quoteIdx !== -1) {
            const quoteChar = trimmed[quoteIdx];
            prefix = trimmed.slice(0, quoteIdx);
            const rest = trimmed.slice(quoteIdx + 1);
            const closeIdx = rest.indexOf(quoteChar);
            name = closeIdx !== -1 ? rest.slice(0, closeIdx) : rest;
          }

          const t = prefix.split(/\s+/).filter(Boolean);
          if (t.length >= 5) {
            const userId = t[0];
            const ping = t[2];
            const state = t[4];
            const isBot = t[1] === 'BOT';
            // For bots the "time" slot literally reads "BOT", not a play time.
            const time = isBot ? '' : t[1];

            // adr (t[6]) only exists for humans; accept it only if it is ip:port.
            let address = '';
            if (t[6] && /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(t[6])) {
              address = t[6];
            }

            // Skip connecting/disconnected stub rows that carry no real data.
            const isStub = userId === '65535' || state === 'challenging';
            if (!isStub) {
              status.playerList.push({
                userId,
                name: name.trim(),
                ping,
                time,
                address,
                state,
                isBot,
              });
            }
          }
        }
      }
    });

    return status;
  };

  const parseCs2InstalledMaps = (text: string) => {
    const lines = text.split('\n');
    const maps: { id: string; name: string; type: 'default' | 'workshop' }[] = [];

    const normalizeMapToken = (token: string) => token.trim().replace(/\.(bsp|vpk)$/i, '');

    const isValidMapToken = (token: string) => {
      const cleaned = normalizeMapToken(token);
      if (!cleaned) return false;
      if (cleaned.includes('/')) return false;

      const lower = cleaned.toLowerCase();
      if (!/^[a-z0-9_-]+$/i.test(cleaned)) return false;
      if (cleaned.length <= 3) return false;
      if (lower.includes('vanity')) return false;
      if (
        lower.match(
          /^(map|list|workshop|installed|error|usage|unknown|server|rcon|host|name|status|total)$/i,
        )
      )
        return false;
      if (
        lower.startsWith('editor') ||
        lower.startsWith('graphics') ||
        lower.startsWith('lobby') ||
        lower.startsWith('prefabs') ||
        lower.startsWith('templates') ||
        lower.startsWith('ui')
      )
        return false;
      return true;
    };

    const pushMap = (raw: string, friendly?: string) => {
      const cleaned = normalizeMapToken(raw);
      if (!isValidMapToken(cleaned)) return;
      const name = friendly?.trim() || cleaned;
      if (maps.some((m) => m.id.toLowerCase() === cleaned.toLowerCase())) return;
      maps.push({ id: cleaned, name, type: 'default' });
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const listLine = trimmed.match(
        /^(?:\d+[.)]\s*)?(?:map\s+list|installed\s+maps)\s*[:-]?\s*(.+)$/i,
      );
      if (listLine && listLine[1]) {
        listLine[1].split(/\s+/).forEach((token) => pushMap(token));
        continue;
      }

      const lower = trimmed.toLowerCase();
      if (
        lower.includes('workshop') ||
        lower.includes('rcon from') ||
        lower.includes('usage') ||
        lower.includes('error') ||
        lower.includes('unknown command') ||
        lower.includes('command not found') ||
        lower.includes('total') ||
        lower.includes('server') ||
        lower.startsWith('l ') ||
        lower.startsWith('host_') ||
        lower.startsWith('map ')
      ) {
        continue;
      }

      const tokens = trimmed.split(/\s+/);
      if (tokens.length > 1 && tokens.every((token) => isValidMapToken(token))) {
        tokens.forEach((token) => pushMap(token));
        continue;
      }

      const match = trimmed.match(/^(?:\d+[.)]\s*)?([a-z0-9_/.-]+)(?:\s*[-:]\s*(.+))?$/i);
      if (!match) continue;

      const rawName = match[1].replace(/\.(bsp|vpk)$/i, '').trim();
      const friendlyName = match[2] ? match[2].trim() : rawName;
      pushMap(rawName, friendlyName);
    }

    return maps;
  };

  const parseCs2WorkshopMaps = (text: string) => {
    const lines = text.split('\n');
    const maps: { name: string; id: string; type: 'workshop' | 'default' }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Skip empty lines, headers, or typical RCON noise
      if (
        !trimmed ||
        trimmed.toLowerCase().includes('workshop map list') ||
        trimmed.toLowerCase().includes('---') ||
        trimmed.startsWith('L ') ||
        trimmed.includes('RCON from')
      )
        return;

      // Pattern 1: [G:1:...] "name" (id)
      const matchA = trimmed.match(/"([^"]+)"\s+\((\d+)\)/);
      if (matchA) {
        maps.push({ name: matchA[1], id: matchA[2], type: 'workshop' });
        return;
      }

      // Pattern 2: id "name" or id name
      const matchB = trimmed.match(/^(\d+)\s+"?([^"\s]+)"?$/);
      if (matchB) {
        maps.push({ name: matchB[2], id: matchB[1], type: 'workshop' });
        return;
      }

      // Pattern 3: name (id)
      const matchC = trimmed.match(/^"?([^"\s]+)"?\s+\((\d+)\)$/);
      if (matchC) {
        maps.push({ name: matchC[1], id: matchC[2], type: 'workshop' });
        return;
      }

      // Pattern 4: Simple name (the format in your screenshot)
      // We accept strings that look like map names (alphanumeric, underscores, hyphens)
      if (trimmed.match(/^[a-zA-Z0-9_-]+$/)) {
        maps.push({ name: trimmed, id: trimmed, type: 'workshop' });
      }
    });

    return maps;
  };

  app.post('/api/rcon/installed-maps', async (req, res) => {
    let { host, port, password } = req.body;
    if (!host || !port || !password) return res.status(400).json({ error: 'Missing parameters' });
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 5000,
      });
      let response = await rcon.send('maps *');
      const fallbackResponse = await rcon.send('maps');
      await rcon.end();

      const shouldFallback = (text: string) => {
        const lower = String(text || '').toLowerCase();
        return (
          !lower.trim() ||
          /unknown command|command not found|invalid command|unsupported|not recognized/.test(lower)
        );
      };

      if (shouldFallback(response) && fallbackResponse && fallbackResponse.trim()) {
        response = fallbackResponse;
      }

      const maps = parseCs2InstalledMaps(response);
      res.json({ success: true, maps, raw: response });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/rcon/workshop-maps', async (req, res) => {
    let { host, port, password } = req.body;
    if (!host || !port || !password) return res.status(400).json({ error: 'Missing parameters' });
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 5000,
      });
      const response = await rcon.send('ds_workshop_listmaps');
      await rcon.end();

      const maps = parseCs2WorkshopMaps(response);
      res.json({ success: true, maps, raw: response });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/rcon/status', async (req, res) => {
    let { host, port, password } = req.body;
    if (!host || !port || !password) return res.status(400).json({ error: 'Missing parameters' });
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 5000,
      });

      const [statusRaw, gameTypeRaw, gameModeRaw] = await Promise.all([
        rcon.send('status'),
        rcon.send('game_type'),
        rcon.send('game_mode'),
      ]);

      const status = parseCs2Status(statusRaw);

      // Extensive map detection fallbacks
      if (!status.map) {
        try {
          const [hostMapRaw, mapFullNameRaw] = await Promise.all([
            rcon.send('host_map'),
            rcon.send('map_fullname'),
          ]).catch(() => ['', '']);

          const hostMapMatch =
            hostMapRaw.match(/"host_map"\s*=\s*"([^"]+)"/i) ||
            hostMapRaw.match(/host_map\s*[:=]\s*([^\s]+)/i);
          if (hostMapMatch) {
            const m = hostMapMatch[1]
              .replace(/\.vpk$/, '')
              .replace(/["']/g, '')
              .trim();
            status.map = m.split('/').pop() || m;
          }

          if (
            !status.map &&
            mapFullNameRaw &&
            !mapFullNameRaw.includes('Unknown') &&
            mapFullNameRaw.length < 50
          ) {
            status.map = mapFullNameRaw.trim().split('/').pop() || mapFullNameRaw.trim();
          }
        } catch (e) {
          if (process.env.DEBUG === 'true') console.error('Map fallback detection failed:', e);
        }
      }

      await rcon.end();

      // Extract game type and mode values
      const gameTypeMatch =
        gameTypeRaw.match(/"game_type"\s*=\s*"(\d+)"/i) ||
        gameTypeRaw.match(/game_type\s*[:=]\s*(\d+)/i) ||
        gameTypeRaw.match(/game_type\s+(\d+)/i);
      const gameModeMatch =
        gameModeRaw.match(/"game_mode"\s*=\s*"(\d+)"/i) ||
        gameModeRaw.match(/game_mode\s*[:=]\s*(\d+)/i) ||
        gameModeRaw.match(/game_mode\s+(\d+)/i);

      const gameType = gameTypeMatch ? gameTypeMatch[1] : '0';
      const gameMode = gameModeMatch ? gameModeMatch[1] : '0';

      res.json({
        success: true,
        status: { ...status, gameType, gameMode, debug_raw_status: statusRaw },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/rcon/action', async (req, res) => {
    let { host, port, password, action, target, value } = req.body;
    if (!host || !port || !password || !action)
      return res.status(400).json({ error: 'Missing parameters' });
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');

    let command: string;
    switch (action) {
      case 'kick':
        command = `kickid ${target || value} "Kicked by admin"`;
        break;
      case 'ban':
        command = `banid ${value} ${target} "Banned by admin"`;
        break;
      case 'map':
        command = `changelevel ${value || target}`;
        break;
      case 'gamemode': {
        // value expected to be "type mode" e.g. "0 0" for Casual
        // target expected to be the map name

        let finalMode = value;
        let finalMap = target || 'de_dust2';

        // Heuristic: If target looks like a mode (e.g. "0 0") and value looks like a map (starts with de_ or has no spaces)
        if (
          target &&
          target.match(/^\d+\s+\d+$/) &&
          (!value || value.startsWith('de_') || !value.includes(' '))
        ) {
          finalMode = target;
          finalMap = value || 'de_dust2';
        }

        const modeParts = finalMode.split(' ');
        const gType = modeParts[0] || '0';
        const gMode = modeParts[1] || '0';
        // Using 'map' instead of 'changelevel' is often better for mode changes in CS2
        command = `game_type ${gType}; game_mode ${gMode}; map ${finalMap}`;
        break;
      }
      case 'cvar':
        command = `${target || value} ${value && target ? value : ''}`;
        break;
      case 'say':
        command = `say "${value || target}"`;
        break;
      case 'teamname':
        command = `${target === 'ct' ? 'mp_teamname_1' : 'mp_teamname_2'} "${value}"`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    try {
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 5000,
      });
      if (process.env.DEBUG === 'true') console.log(`[DEBUG] RCON CMD: ${command}`);
      const response = await rcon.send(command);
      if (process.env.DEBUG === 'true') console.log(`[DEBUG] RCON RESP: ${response}`);
      await rcon.end();
      res.json({ success: true, response });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/rcon/cvars', async (req, res) => {
    let { host, port, password, search } = req.body;
    if (!host || !port || !password) return res.status(400).json({ error: 'Missing parameters' });
    host = host.replace(/^(http|https):\/\//, '').split('/')[0];

    try {
      const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
      const rcon = await Rcon.connect({
        host,
        port: parseInt(port),
        password: decodedPassword,
        timeout: 10000,
      });
      // In CS2, 'cvarlist' followed by a search term is very reliable for parsing
      const raw = await rcon.send(search ? `cvarlist ${search}` : 'cvarlist');
      await rcon.end();

      const lines = raw.split('\n');
      const cvars = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('---') || trimmed.includes('total convars'))
            return null;

          // 1. Try colon format: name : value : flags : description
          if (trimmed.includes(' : ')) {
            const parts = trimmed.split(' : ');
            if (parts.length >= 2) {
              return {
                name: parts[0].trim(),
                value: parts[1].trim(),
                flags: parts.length >= 3 ? parts[2].trim() : '',
                description: parts.length >= 4 ? parts.slice(3).join(' : ').trim() : '',
              };
            }
          }

          // 2. Try standard format: "name" = "value"
          const standardMatch = trimmed.match(/^"([^"]+)"\s+=\s+"([^"]*)"\s*(.*)$/);
          if (standardMatch) {
            const [_, name, value, rest] = standardMatch;
            const descMatch = rest.match(/-\s+(.*)$/);
            return {
              name,
              value,
              description: descMatch ? descMatch[1].trim() : rest.replace(/\(.*\)/, '').trim(),
              flags: rest.includes('(') ? rest.split('(')[0].trim() : '',
            };
          }

          return null;
        })
        .filter(Boolean);

      res.json({ success: true, cvars, raw });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- CS2 log endpoints ----------------------------------------------------

  // Endpoint A: receive logs pushed by CS2 via `logaddress_add_http`.
  // The token (path segment) must equal HMAC-SHA256(secret, x-server-addr).
  // Route-level text parser so the existing express.json() routes are untouched.
  app.post(
    '/api/logs/ingest/:token',
    express.text({ type: () => true, limit: '256kb' }),
    (req, res) => {
      if (!LOG_INGEST_SECRET) {
        return res
          .status(503)
          .json({ error: 'Log ingestion disabled (LOG_INGEST_SECRET not set)' });
      }

      const serverAddr = String(req.headers['x-server-addr'] || '').trim();
      if (!serverAddr) {
        return res.status(400).json({ error: 'Missing x-server-addr header' });
      }

      if (!verifyToken(serverAddr, req.params.token)) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const body = typeof req.body === 'string' ? req.body : '';
      const lines = body.split(/\r?\n/).filter((line) => line.length > 0);

      const store = getOrCreateStore(serverAddr);
      appendAndBroadcast(store, lines);

      if (process.env.DEBUG === 'true') {
        console.log(
          `[logs] +${lines.length} from ${serverAddr} (buf=${store.buffer.length}, subs=${store.subscribers.size})`,
        );
      }

      // Respond fast; CS2 ignores the body.
      res.status(200).end();
    },
  );

  // Endpoint B: tail a server's logs via SSE. HMAC-protected via ?token=.
  // `?n=` backfills the last N lines, then new lines stream in real time.
  app.get('/api/logs/stream/:addr', (req, res) => {
    if (!LOG_INGEST_SECRET) {
      return res.status(503).json({ error: 'Log streaming disabled (LOG_INGEST_SECRET not set)' });
    }

    const addr = decodeURIComponent(req.params.addr);
    if (!verifyToken(addr, req.query.token)) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const requestedN = Number(req.query.n);
    const n = Number.isFinite(requestedN)
      ? Math.max(0, Math.min(requestedN, LOG_MAX_LINES_PER_SERVER))
      : 200;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable proxy (nginx) buffering
    res.flushHeaders?.();

    const store = getOrCreateStore(addr);

    // Backfill: on reconnect replay entries after Last-Event-ID, else the last N
    // lines. The incremental replay only applies when the cursor falls inside the
    // current buffer's id range. If it's beyond the newest id, the client's cursor
    // is stale (e.g. the server restarted and ids reset) — fall back to the last N
    // so the client recovers; it de-dupes by timestamp+id on its end.
    const lastEventId = Number(req.headers['last-event-id']);
    const oldestId = store.buffer.length > 0 ? store.buffer[0].id : 0;
    const newestId = store.buffer.length > 0 ? store.buffer[store.buffer.length - 1].id : 0;
    let backfill: LogEntry[];
    if (Number.isFinite(lastEventId) && lastEventId >= oldestId - 1 && lastEventId < newestId) {
      backfill = store.buffer.filter((entry) => entry.id > lastEventId);
    } else {
      backfill = n > 0 ? store.buffer.slice(-n) : [];
    }
    for (const entry of backfill) {
      res.write(sseFrame(entry));
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // Ignore; cleanup happens on 'close'.
      }
    }, 20000);

    const subscriber: Subscriber = { res, heartbeat };
    store.subscribers.add(subscriber);

    req.on('close', () => {
      clearInterval(heartbeat);
      store.subscribers.delete(subscriber);
      if (process.env.DEBUG === 'true') {
        console.log(`[logs] SSE closed for ${addr} (subs=${store.subscribers.size})`);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    if (!LOG_INGEST_SECRET) {
      console.warn(
        '[logs] LOG_INGEST_SECRET not set; CS2 log ingestion and streaming are disabled',
      );
    }
  });
}

startServer();
