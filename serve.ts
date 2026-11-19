// Solmar Cover Studio — local dev server (Node 22, standard library only).
// Serves app/ on http://localhost:8080 so the cover maker can be tried without a
// build step: `node serve.ts` (or `node serve.ts --port 8081`). It only reads files
// from app/, answers with the right MIME type for each, and refuses anything that
// would climb out of app/. Nothing here is part of the entry itself.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const cli = process.argv.slice(2);
const flagAt = cli.indexOf('--port');
const wanted = flagAt === -1 ? 8080 : Number(cli[flagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

function fail(response, code, message) {
  response.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}

createServer((request, response) => {
  let path = '/';
  try {
    path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    fail(response, 400, 'bad request');
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(appDir, normalize(path)));
  if (file !== appDir && !file.startsWith(appDir + sep)) {
    fail(response, 403, 'forbidden');
    return;
  }
  let bytes = 0;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    bytes = info.size;
  } catch {
    fail(response, 404, 'not found');
    return;
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': bytes,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Solmar Cover Studio is on http://localhost:${port}`);
});
