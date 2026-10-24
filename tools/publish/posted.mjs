#!/usr/bin/env node
// The posting log, sermons/<folder>/posted.json (committed): which scene went to which platform, ids, URLs, times.
//   node tools/publish/posted.mjs                                   → every film's status in one table
//   node tools/publish/posted.mjs sermons/<folder>                  → that film's posted.json
//   node tools/publish/posted.mjs sermons/<folder> <platform> [--scene <id>] key=value … [--note "…"]
//     platform: youtube · instagram · threads · tiktok
//     keys: id (YouTube video id) · url · status (private · scheduled · public · posted · deleted) · at (time it goes / went
//           public, ISO or "2026-10-26T19:00+09:00") · comment (e.g. pinned) · playlist · via (studio · api · business-suite · app · web)
//   e.g. node tools/publish/posted.mjs sermons/2026-10-11-1cor4 youtube --scene cross-blueprint id=AbCdEfGhIjK status=scheduled at=2026-10-26T19:00+09:00 via=studio
// The browser helpers print the exact command to run in their result (cmd). The first record fixes the film's scene.
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, PLATFORMS, postedOf, recordPosted } from './sheet.mjs';

const a = process.argv.slice(2);
const flag = k => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : undefined; };
const scene = flag('--scene'), note = flag('--note'), [folder, platform, ...kv] = a;
try {
  if (!folder) {
    const dir = join(ROOT, 'sermons'), rows = [];
    for (const d of readdirSync(dir).sort()) {
      if (!existsSync(join(dir, d, 'film', 'film.json'))) continue;
      const p = postedOf(join(dir, d)), cell = k => p[k] ? `${p[k].status || '?'}${p[k].at ? ' ' + new Date(Date.parse(p[k].at) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') : ''}` : '·';
      rows.push([d, p.scene || '·', ...PLATFORMS.map(cell)]);
    }
    const head = ['folder', 'scene', ...PLATFORMS], w = head.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
    for (const r of [head, ...rows]) console.log(r.map((c, i) => c.padEnd(w[i])).join('  '));
    console.log('(times: Korea time)');
  } else if (!platform) console.log(JSON.stringify(postedOf(resolve(folder)), null, 1));
  else {
    const fields = {};
    for (const x of kv) { const m = x.match(/^(\w+)=(.*)$/s); if (!m) throw new Error(`not key=value: ${x}`); fields[m[1]] = m[2]; }
    if (!Object.keys(fields).length) throw new Error('nothing to record — give key=value pairs');
    const o = recordPosted(folder, platform, fields, { scene, note });
    console.log(`→ ${folder}/posted.json · ${platform}: ${JSON.stringify(o[platform])}`);
  }
} catch (e) { console.error('✗ ' + e.message); process.exit(1); }
