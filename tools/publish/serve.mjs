#!/usr/bin/env node
// Local read-only file server for the paste-in browser helpers (tools/publish/studio-*.js, meta-reels.js, threads-reels.js).
// It serves ONE film's upload: the Chrome extension's file upload caps at 10 MB, so the page fetches the MP4 from here.
//   node tools/publish/serve.mjs sermons/<folder> --scene <id> [--at 2026-10-26T19:00]   (leave it running; Ctrl+C stops)
// → http://127.0.0.1:8766
//   /plan.json    tools/publish/sheet.mjs buildPlan — rebuilt from upload.md on EVERY request (never a stale copy in a tab)
//   /video.mp4    film/out/<scene>-upload.mp4        /cover.jpg   film/out/<scene>-cover-insta.jpg or -cover.jpg
//   /relay.html   popup for pages whose CSP blocks 127.0.0.1 (Meta Business Suite, Threads)
// Nothing else is served (no directory listing, no other files). CORS only for YouTube's own pages and Business Suite;
// Access-Control-Allow-Private-Network lets an https page reach 127.0.0.1. Port 8766, not one-scroll-bible's 8765, so the
// two projects' servers never answer for each other.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlan, publicPlan } from './sheet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const folder = a.find((x, i) => !x.startsWith('--') && !['--scene', '--at', '--port'].includes(a[i - 1]));
const PORT = +(opt('--port') || process.env.PORT || 8766), args = { scene: opt('--scene'), at: opt('--at') };
const ORIGINS = new Set(['https://studio.youtube.com', 'https://www.youtube.com', 'https://business.facebook.com']);
if (!folder) { console.error('usage: node tools/publish/serve.mjs sermons/<folder> --scene <id> [--at 2026-10-26T19:00] [--port 8766]'); process.exit(1); }

const plan = () => buildPlan(folder, args);
let first;
try { first = plan(); } catch (e) { console.error('✗ ' + e.message); process.exit(1); }   // wrong folder / scene: do not start
args.scene = first.scene;   // fixed for this run

createServer((req, res) => {
  const o = req.headers.origin;
  if (o && ORIGINS.has(o)) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  const path = new URL(req.url, 'http://x').pathname;
  const send = (f, type) => {
    if (!f || !existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': statSync(f).size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(f).pipe(res);
  };
  try {
    if (path === '/plan.json') {
      const body = JSON.stringify(publicPlan(plan()));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(req.method === 'HEAD' ? undefined : body);
    }
    if (path === '/video.mp4') return send(plan()._files.video, 'video/mp4');
    if (path === '/cover.jpg') return send(plan()._files.cover, 'image/jpeg');
    if (path === '/relay.html') return send(join(HERE, 'relay.html'), 'text/html; charset=utf-8');
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('not found');
  } catch (e) {   // e.g. upload.md edited into a broken state while running: the helpers see an error, never old text
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: e.message }));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${first.folder} · scene ${first.scene} on http://127.0.0.1:${PORT}  (/plan.json /video.mp4 /cover.jpg /relay.html)`);
  console.log(`  time ${first.kst} · ready: ${Object.entries(first.ready).map(([k, v]) => (v ? '✓' : '✗') + k).join(' ')}`);
  for (const [k, v] of Object.entries(first.problems)) for (const x of v) console.log(`  ✗ ${k}: ${x}`);
  for (const w of first.warnings) console.log(`  · ${w}`);
});
