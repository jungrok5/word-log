#!/usr/bin/env node
// What will be posted, per platform, from upload.md — and whether it may be (✍️ drafts / placeholders / missing files block).
//   node tools/publish/plan.mjs sermons/<folder> [--scene <id>] [--at 2026-10-26T19:00] [--json] [--need youtube,instagram]
//     --scene  the style version to publish (required when film.json has several; then fixed by posted.json)
//     --at     Korea time for every platform (default: the YouTube time already set, else tomorrow 19:00 KST)
//     --json   the plan exactly as serve.mjs hands it to the browser helpers (/plan.json)
//     --need   exit 1 unless these platforms are ready (youtube · comment · instagram · threads · tiktok)
import { readFileSync } from 'node:fs';
import { buildPlan, publicPlan } from './sheet.mjs';

const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const folder = a.find((x, i) => !x.startsWith('--') && !['--scene', '--at', '--need'].includes(a[i - 1]));
if (!folder) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); process.exit(1); }
let p;
try { p = buildPlan(folder, { scene: opt('--scene'), at: opt('--at') }); } catch (e) { console.error('✗ ' + e.message); process.exit(1); }
if (a.includes('--json')) console.log(JSON.stringify(publicPlan(p), null, 1));
else {
  const mark = k => p.ready[k] ? '✓' : '✗', ind = s => s.split('\n').map(l => '      ' + l).join('\n');
  console.log(`${p.folder} · scene ${p.scene} · ${p.film}`);
  console.log(`  video ${p.video ? `${p.video.name} (${(p.video.bytes / 1e6).toFixed(1)} MB)` : '—'} · cover ${p.cover ? p.cover.name : '—'}`);
  console.log(`  time  ${p.kst}${p.schedulable ? '' : '  (예약 불가 — --at)'}  · Studio "${p.youtube.studio.date}" "${p.youtube.studio.time}"`);
  console.log(`\n${mark('youtube')} youtube  제목: ${p.youtube.title || '—'}\n    태그: ${p.youtube.tags.join(', ') || '—'}${p.youtube.playlist ? `\n    재생목록: ${p.youtube.playlist}` : ''}\n    설명:\n${ind(p.youtube.description || '—')}`);
  console.log(`${mark('comment')} 고정 댓글:\n${ind(p.youtube.comment?.want || '—')}`);
  console.log(`${mark('instagram')} instagram 캡션:\n${ind(p.instagram.caption || '—')}`);
  console.log(`${mark('threads')} threads 글${p.threads.built ? ' (upload.md에 "## 스레드"가 없어 인스타 캡션 + 링크로 만듦)' : ''}:\n${ind(p.threads.caption || '—')}`);
  console.log(`${mark('tiktok')} tiktok 캡션:\n${ind(p.tiktok.caption || '—')}`);
  const probs = Object.entries(p.problems).flatMap(([k, v]) => v.map(x => `  ✗ ${k}: ${x}`));
  if (probs.length) console.log('\n막힌 것:\n' + [...new Set(probs)].join('\n'));
  if (p.warnings.length) console.log('\n참고:\n' + p.warnings.map(w => '  · ' + w).join('\n'));
}
const need = (opt('--need') || '').split(',').filter(Boolean), bad = need.filter(k => !p.ready[k]);
if (bad.length) { console.error(`not ready: ${bad.join(', ')}`); process.exit(1); }
