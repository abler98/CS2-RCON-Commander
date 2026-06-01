import { StringDecoder } from 'node:string_decoder';
import type { IncomingMessage } from 'node:http';

// Streams the request body and returns only the last `maxLines` non-empty
// lines (tail semantics), so memory stays bounded regardless of body size.
// CS2 can push a large burst when log forwarding is enabled mid-game; the ring
// buffer only keeps LOG_MAX_LINES_PER_SERVER anyway, so reading more is waste.
//
// Uses StringDecoder (not naive chunk.toString()) so a multibyte UTF-8 char
// split across a chunk boundary is decoded correctly. Always drains the stream
// on error so a keep-alive socket isn't left half-read.
export function readTailLines(
  req: IncomingMessage,
  maxLines: number,
  maxSingleLineBytes: number,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf8');
    const tail: string[] = []; // completed lines, length <= maxLines
    let pending = ''; // current not-yet-terminated line
    let settled = false;

    const pushLine = (line: string): void => {
      if (line.length === 0) {
        return; // preserve the existing non-empty filter
      }
      tail.push(line);
      if (tail.length > maxLines) {
        tail.shift(); // discard oldest -> bounded memory
      }
    };

    req.on('data', (chunk: Buffer) => {
      pending += decoder.write(chunk);
      let nl = pending.indexOf('\n');
      while (nl !== -1) {
        let line = pending.slice(0, nl);
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }
        pushLine(line);
        pending = pending.slice(nl + 1);
        nl = pending.indexOf('\n');
      }
      // Safeguard against a pathological no-newline body growing `pending`.
      if (pending.length > maxSingleLineBytes) {
        pending = pending.slice(pending.length - maxSingleLineBytes);
      }
    });

    req.on('end', () => {
      if (settled) {
        return;
      }
      settled = true;
      pending += decoder.end();
      if (pending.length > 0) {
        pushLine(pending);
      }
      resolve(tail);
    });

    const fail = (err: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      req.resume(); // drain so the socket can be reused/closed cleanly
      reject(err);
    };

    req.on('error', fail);
    req.on('aborted', () => fail(new Error('request aborted')));
  });
}
