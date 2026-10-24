#!/usr/bin/env node
// YouTube Data API for the word-log channel (@word-log, a Brand Account channel of the same owner as @one-scroll-bible).
// It uses the same Google Cloud project and OAuth client as one-scroll-bible ("one-scroll-bible tools"), so one API audit
// covers both channels; each channel has its own refresh token.
//
// Credentials (environment only — never in the repo, never printed):
//   YT_CLIENT_ID, YT_CLIENT_SECRET          the OAuth client (same values as one-scroll-bible)
//   YT_REFRESH_TOKEN_WORDLOG                word-log's token (falls back to YT_REFRESH_TOKEN)
// The token is made once on the maintainer's PC: one-scroll-bible `node motion/youtube/yt-auth.mjs --as WORDLOG`
// (consent page → one-scroll-bible account → choose the word-log brand account). In a cloud session the three values are
// environment variables of the cloud environment.
//
//   node tools/youtube.mjs whoami                       → the channel the token acts as (must be @word-log)
//   node tools/youtube.mjs upload sermons/<folder> [--scene <id>] [--publish-at 2026-11-01T10:00:00Z] [--dry]
//        film/out/<scene>-upload.mp4 + the YouTube section of upload.md (title, description, hashtags → tags),
//        Korean, not made for kids, private (or scheduled with --publish-at) → sermons/<folder>/youtube.json
//   node tools/youtube.mjs comment sermons/<folder> [--dry]   → post upload.md's 고정 댓글 (pin it in the app: no API)
//   node tools/youtube.mjs stats sermons/<folder>|<videoId> → views, avg % viewed, avg seconds, likes, shares (Analytics)
//
// Until Google's API audit passes (one-scroll-bible motion/youtube/API-AUDIT.md), YouTube locks every API upload as
// private and even the owner cannot make it public — keep uploading by hand until then; whoami/stats work already.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CHANNEL = 'UCrzEUsnUGuptKGVs-z2j1Ig';   // @word-log
const env = process.env, RT = env.YT_REFRESH_TOKEN_WORDLOG || env.YT_REFRESH_TOKEN;
const need = ['YT_CLIENT_ID', 'YT_CLIENT_SECRET'].filter(k => !env[k]).concat(RT ? [] : ['YT_REFRESH_TOKEN_WORDLOG']);
let tok;
async function token() {
  if (tok) return tok;
  if (need.length) { console.error(`missing ${need.join(', ')} — see the top of tools/youtube.mjs`); process.exit(1); }
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.YT_CLIENT_ID, client_secret: env.YT_CLIENT_SECRET, refresh_token: RT, grant_type: 'refresh_token' }) });
  const j = await r.json();
  if (!j.access_token) { console.error('token refresh failed:', j.error || r.status, j.error === 'invalid_grant' ? '(token expired or revoked — make a new one with yt-auth --as WORDLOG)' : ''); process.exit(1); }
  return (tok = j.access_token);
}
async function api(url, opt = {}) {
  const r = await fetch(url.startsWith('http') ? url : 'https://www.googleapis.com/youtube/v3/' + url, { ...opt, headers: { Authorization: 'Bearer ' + await token(), ...(opt.headers || {}) } });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message || t.slice(0, 300)}`);
  return Object.assign(j, { _location: r.headers.get('location') });
}
async function me() { const j = await api('channels?part=snippet&mine=true'); return (j.items || [])[0]; }
async function guard() {
  const c = await me();
  if (c?.id !== CHANNEL) { console.error(`this token acts as ${c ? c.snippet.title + ' ' + c.id : 'no channel'}, not @word-log — refusing`); process.exit(1); }
}

// upload.md (tools/upload-meta.py) → the YouTube fields; the ✍️ lines must have been finished ("✍️ → **…**")
function sheet(folder) {
  const f = join(folder, 'upload.md'); if (!existsSync(f)) throw new Error(`no ${f} — run python3 tools/upload-meta.py ${folder}`);
  const md = readFileSync(f, 'utf8').replace(/\r/g, ''), yt = (md.split(/^## 유튜브 쇼츠\s*$/m)[1] || '').split(/^## /m)[0];
  const title = (yt.match(/^- 제목[^\n]*?→\s*\*\*(.+?)\*\*/m) || [])[1];
  if (!title) throw new Error('upload.md: the title is still a draft — write it as "- 제목 ✍️ → **제목**"');
  const desc = (yt.match(/^- 설명:\s*\n([\s\S]*?)(?=^- 고정 댓글)/m) || [])[1]?.trim();
  if (!desc) throw new Error('upload.md: no "- 설명:" block in the YouTube section');
  const pin = yt.match(/^- 고정 댓글[^\n]*?→\s*\*\*(.+?)\*\*\s*(?:·\s*(.+))?$/m);
  const tags = [...new Set((desc.match(/#[^\s#]+/g) || []).map(t => t.slice(1)))];
  if (title.length > 100) throw new Error(`title is ${title.length} characters (YouTube allows 100)`);
  return { title, description: desc, tags, comment: pin ? [pin[1], pin[2]].filter(Boolean).join('\n') : null };
}
function film(folder, scene) {
  const cfg = JSON.parse(readFileSync(join(folder, 'film', 'film.json'), 'utf8')), sid = scene || cfg.scenes[0].id;
  const mp4 = join(folder, 'film', 'out', `${sid}-upload.mp4`);
  if (!existsSync(mp4)) throw new Error(`no ${mp4} — run python3 tools/export.py ${folder}${scene ? ' --scene ' + scene : ''}`);
  return { sid, mp4 };
}
const record = (folder, add) => { const f = join(folder, 'youtube.json'), o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  writeFileSync(f, JSON.stringify({ ...o, ...add }, null, 2) + '\n'); };
const videoId = a => existsSync(join(a, 'youtube.json')) ? JSON.parse(readFileSync(join(a, 'youtube.json'), 'utf8')).id : a;

const [cmd, ...rest] = process.argv.slice(2), opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
const dry = rest.includes('--dry'), folder = rest.find(a => !a.startsWith('--') && a !== opt('--scene') && a !== opt('--publish-at'));
try {
  if (cmd === 'whoami') {
    const c = await me(); console.log(c ? `${c.id} ${c.snippet.title} ${c.snippet.customUrl || ''}${c.id === CHANNEL ? '' : '  ← not @word-log'}` : 'no channel');
  } else if (cmd === 'upload') {
    if (!folder) throw new Error('usage: node tools/youtube.mjs upload sermons/<folder> [--scene id] [--publish-at ISO] [--dry]');
    const s = sheet(resolve(folder)), { sid, mp4 } = film(resolve(folder), opt('--scene')), at = opt('--publish-at');
    if (at && !(new Date(at) > new Date())) throw new Error('--publish-at must be a future ISO time, e.g. 2026-11-01T10:00:00Z');
    const meta = { snippet: { title: s.title, description: s.description, tags: s.tags, categoryId: '22', defaultLanguage: 'ko', defaultAudioLanguage: 'ko' },
      status: { privacyStatus: 'private', ...(at ? { publishAt: new Date(at).toISOString() } : {}), selfDeclaredMadeForKids: false } };
    const size = statSync(mp4).size;
    console.log(`${sid}: ${mp4} (${(size / 1e6).toFixed(1)} MB)\n  title: ${s.title}\n  tags: ${s.tags.join(', ')}\n  ${at ? 'scheduled ' + meta.status.publishAt : 'private'}`);
    if (dry) process.exit(0);
    await guard();
    const init = await api('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', { method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) }, body: JSON.stringify(meta) });
    if (!init._location) throw new Error('no upload URL returned');
    const v = await api(init._location, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: readFileSync(mp4) });
    record(resolve(folder), { id: v.id, url: `https://youtube.com/shorts/${v.id}`, scene: sid, title: s.title, uploaded: new Date().toISOString(), status: v.status?.privacyStatus, publishAt: v.status?.publishAt });
    console.log(`uploaded → https://youtube.com/shorts/${v.id} (${v.status?.privacyStatus}) — recorded in ${folder}/youtube.json`);
  } else if (cmd === 'comment') {
    if (!folder) throw new Error('usage: node tools/youtube.mjs comment sermons/<folder> [--dry]');
    const s = sheet(resolve(folder)), id = videoId(resolve(folder));
    if (!s.comment) throw new Error('upload.md: the pinned comment is still a draft — "- 고정 댓글 ✍️ → **질문** · 링크"');
    if (!id || id === resolve(folder)) throw new Error('no youtube.json — upload first');
    console.log(`${id}:\n${s.comment}`); if (dry) process.exit(0);
    await guard();
    const c = await api('commentThreads?part=snippet', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snippet: { channelId: CHANNEL, videoId: id, topLevelComment: { snippet: { textOriginal: s.comment } } } }) });
    record(resolve(folder), { comment: c.id });
    console.log(`posted comment ${c.id} — pin it in YouTube Studio or the app (the API cannot pin)`);
  } else if (cmd === 'stats') {
    if (!folder) throw new Error('usage: node tools/youtube.mjs stats sermons/<folder>|<videoId>');
    const id = videoId(resolve(folder)) === resolve(folder) ? folder : videoId(resolve(folder));
    const v = (await api(`videos?part=snippet,statistics&id=${id}`)).items?.[0]; if (!v) throw new Error(`no video ${id}`);
    const start = v.snippet.publishedAt.slice(0, 10), end = new Date().toISOString().slice(0, 10);
    const r = await api(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&filters=video==${id}` +
      '&metrics=views,averageViewPercentage,averageViewDuration,likes,shares,subscribersGained');
    const row = r.rows?.[0] || [], h = (r.columnHeaders || []).map(c => c.name);
    console.log(`${v.snippet.title} (${id}, since ${start})\n  public counts: views ${v.statistics.viewCount}, likes ${v.statistics.likeCount ?? '-'}, comments ${v.statistics.commentCount ?? '-'}`);
    console.log('  analytics: ' + (row.length ? h.map((k, i) => `${k} ${row[i]}`).join(', ') : 'no data yet (Analytics lags 1–2 days)'));
  } else {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'));
  }
} catch (e) { console.error(e.message); process.exit(1); }
