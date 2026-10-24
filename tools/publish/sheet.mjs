// The upload bridge: sermons/<folder>/upload.md (tools/upload-meta.py, finished by hand) + film.json + posted.json
// → one plan object that every publish tool reads (serve.mjs hands it to the browser helpers as /plan.json, fresh on
// every request; plan.mjs prints it; tools/youtube.mjs uses the same parser for the API path).
//
// upload.md rules (the ✍️ lines are drafts until they are written as "✍️ → **…**"):
//   ## 유튜브 쇼츠   - 제목 ✍️ → **제목**          - 설명: <block until the next "- " line>
//                    - 고정 댓글 ✍️ → **질문** · 링크
//   ## 인스타 릴스   - 캡션(…): first line + the indented lines under it
//   ## 스레드        - 글: first line + indented lines   (optional — else built from the Instagram caption + 링크)
//   ## 틱톡          - 캡션: …
//   ## 공통          - 링크: …
// A platform is "ready" only when its text has no draft marks or placeholders ("(질문)", "✍️", "TODO", "undefined" …)
// and the files exist; every upload/schedule helper refuses a platform that is not ready.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHANNEL = { id: 'UCrzEUsnUGuptKGVs-z2j1Ig', handle: '@word-log' };
export const TZ = { offset: '+09:00', name: 'Asia/Seoul', hours: 9 };
export const DEFAULT_TIME = '19:00';   // proposed default (README 공개 정책) — change per film with --at
export const PLATFORMS = ['youtube', 'instagram', 'threads', 'tiktok'];
export const STATUS = ['private', 'scheduled', 'public', 'posted', 'deleted'];

// "(질문)"-style slots, draft marks, and strings that only appear when a value went missing
const PLACEHOLDER = /\((?:질문|제목|링크|문구|캡션|내용|설명|출처)\)|✍️|\bTODO\b|\bTBD\b|\bundefined\b|\bnull\b|\bNaN\b|<장면>|\?\?\?|\[\[|\]\]/;
const readJSON = f => JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''));

export function folderOf(arg) {
  const f = resolve(arg || '');
  if (!arg || !existsSync(join(f, 'film', 'film.json'))) throw new Error(`not a film folder: ${arg || '(none)'} — want sermons/<folder> with film/film.json`);
  return f;
}

function section(md, name) {
  const m = md.match(new RegExp(`^## ${name}[^\\n]*$`, 'm')); if (!m) return null;
  const rest = md.slice(m.index + m[0].length + 1), end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}
// "- label …" → { line, done, text, after, lines } — done=false when it is still a ✍️ draft
function field(sec, label) {
  if (sec == null) return null;
  const ls = sec.split('\n'), i = ls.findIndex(l => l.startsWith('- ' + label)); if (i < 0) return null;
  const line = ls[i], rest = line.slice(2 + label.length);
  const bold = rest.match(/→\s*\*\*(.+?)\*\*(.*)$/);
  const more = []; for (let k = i + 1; k < ls.length && /^ {2,}/.test(ls[k]); k++) more.push(ls[k].replace(/^ {2}/, '').replace(/^\s+$/, ''));
  if (bold) return { line, done: true, text: bold[1].trim(), after: bold[2].trim(), more };
  if (rest.includes('✍️')) return { line, done: false, text: '', after: '', more };
  let s = rest.trimStart();
  while (s.startsWith('(')) { let d = 0, j = 0; for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')' && --d === 0) break; } s = s.slice(j + 1).trimStart(); }
  s = s.replace(/^:\s?/, '');
  return { line, done: true, text: s.trim(), after: '', more };
}
function block(sec, label) {   // "- 설명:" then every line up to the next "- " line
  if (sec == null) return null;
  const m = sec.match(new RegExp(`^- ${label}:?[^\\n]*\\n([\\s\\S]*?)(?=^- |(?![\\s\\S]))`, 'm'));
  return m ? m[1].replace(/\s+$/, '') : null;
}
const caption = f => f ? [f.text, ...f.more].join('\n').replace(/\n{3,}/g, '\n\n').trim() : '';
const hashtags = s => [...new Set((s.match(/#[^\s#]+/g) || []))];
const len = s => [...s].length;
function check(name, s, probs, { max, noAngle } = {}) {
  if (!s) { probs.push(`${name}: 비어 있음`); return; }
  const m = s.match(PLACEHOLDER); if (m) probs.push(`${name}: 아직 채우지 않은 자리 "${m[0]}"`);
  if (max && len(s) > max) probs.push(`${name}: ${len(s)}자 (최대 ${max})`);
  if (noAngle && /[<>]/.test(s)) probs.push(`${name}: < > 는 유튜브가 거부함`);
}

// upload.md → per-platform texts + problems (blocking) + warnings (not blocking)
export function readUpload(folder) {
  const f = join(folder, 'upload.md');
  if (!existsSync(f)) throw new Error(`no ${f} — run python3 tools/upload-meta.py ${folder}`);
  const md = readFileSync(f, 'utf8').replace(/\r/g, '');
  const P = { youtube: [], comment: [], instagram: [], threads: [], tiktok: [] }, W = [];
  const common = section(md, '공통'), linkF = field(common, '링크');
  const linkText = linkF && !/^\(없음\)$/.test(linkF.text) ? linkF.text : '', link = (linkText.match(/https?:\/\/\S+/) || [])[0] || '';

  const yt = section(md, '유튜브 쇼츠'), tF = field(yt, '제목'), cF = field(yt, '고정 댓글');
  if (!yt) P.youtube.push('upload.md에 "## 유튜브 쇼츠" 없음');
  const title = tF?.done ? tF.text : '';
  if (tF && !tF.done) P.youtube.push('제목이 아직 초안 — "- 제목 ✍️ → **제목**" 꼴로 확정');
  if (!tF || tF.done) check('유튜브 제목', title, P.youtube, { max: 100, noAngle: true });
  if (title && len(title) > 40) W.push(`유튜브 제목 ${len(title)}자 (템플릿 기준 40자 안쪽)`);
  const description = block(yt, '설명') || '';
  check('유튜브 설명', description, P.youtube, { max: 5000, noAngle: true });
  if (title && description && !description.split('\n')[0].trim()) W.push('유튜브 설명 첫 줄이 비어 있음');
  const tags = []; for (const t of hashtags(description).map(t => t.slice(1))) if ([...tags, t].join(',').length <= 480) tags.push(t);
  let comment = null;
  if (!cF) P.comment.push('"- 고정 댓글" 줄 없음');
  else if (!cF.done) P.comment.push('고정 댓글이 아직 초안 — "- 고정 댓글 ✍️ → **질문** · 링크" 꼴로 확정');
  else {
    const cl = cF.after.replace(/^·\s*/, '').trim();
    comment = { text: cF.text, link: cl, want: [cF.text, cl].filter(Boolean).join('\n') };
    check('고정 댓글', comment.want, P.comment, { max: 10000 });
  }
  P.youtube.push(...P.comment.map(p => p + ' (업로드 전에 함께 확정)'));

  const ig = section(md, '인스타 릴스'), iF = field(ig, '캡션');
  if (iF && !iF.done) P.instagram.push('인스타 캡션이 아직 초안');
  const igCap = iF?.done ? caption(iF) : '';
  if (!iF) P.instagram.push('"## 인스타 릴스"의 "- 캡션" 줄 없음');
  else if (iF.done) check('인스타 캡션', igCap, P.instagram, { max: 2200 });
  if (hashtags(igCap).length > 5) W.push(`인스타 해시태그 ${hashtags(igCap).length}개 — 인스타는 2025-12부터 5개까지만 받는 것으로 알려짐 — 앞 5개만 남기길 권함`);
  if (igCap && len(igCap.split('\n')[0]) > 125) W.push('인스타 캡션 첫 줄이 125자 넘음 (잘림)');

  const th = section(md, '스레드'), hF = field(th, '글');
  let thCap = '';
  if (hF) { if (!hF.done) P.threads.push('스레드 글이 아직 초안'); else thCap = caption(hF); }
  else if (igCap) {   // built: the Instagram caption, links are clickable on Threads, one topic tag
    const ls = igCap.split('\n'), body = ls.filter(l => !/^(#[^\s#]+\s*)+$/.test(l.trim())), tag = hashtags(igCap)[0];
    thCap = [...body, ...(linkText ? [linkText] : []), ...(tag ? ['', tag] : [])].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  if (!hF && !igCap) P.threads.push('인스타 캡션이 아직 없어 스레드 글을 만들 수 없음 (또는 "## 스레드"에 "- 글:" 추가)');
  else if (!hF || hF.done) check('스레드 글', thCap, P.threads, { max: 500 });
  if (hashtags(thCap).length > 1) W.push('스레드 글에 주제 태그가 2개 이상 — 스레드는 글마다 하나');

  const tk = section(md, '틱톡'), kF = field(tk, '캡션');
  if (kF && !kF.done) P.tiktok.push('틱톡 캡션이 아직 초안');
  const tkCap = kF?.done ? caption(kF) : '';
  if (!kF) P.tiktok.push('"## 틱톡"의 "- 캡션" 줄 없음'); else if (kF.done) check('틱톡 캡션', tkCap, P.tiktok, { max: 2200 });

  return { file: f, link, linkText, youtube: { title, description, tags, comment }, instagram: { caption: igCap }, threads: { caption: thCap, built: !hF }, tiktok: { caption: tkCap }, problems: P, warnings: W };
}

export function postedOf(folder) { const f = join(folder, 'posted.json'); return existsSync(f) ? readJSON(f) : {}; }

// which scene (style version) to publish: --scene, else the one already posted, else the only one
export function pickScene(folder, scene) {
  const cfg = readJSON(join(folder, 'film', 'film.json')), ids = cfg.scenes.map(s => s.id), posted = postedOf(folder);
  if (scene && !ids.includes(scene)) throw new Error(`no scene "${scene}" in film.json (${ids.join(', ')})`);
  if (scene && posted.scene && posted.scene !== scene) throw new Error(`posted.json: this film was already posted as "${posted.scene}" — every platform gets the same scene (fix posted.json by hand if that was a mistake)`);
  const sid = scene || posted.scene || (ids.length === 1 ? ids[0] : null);
  if (!sid) throw new Error(`film.json has ${ids.length} scenes — pick one with --scene <id> (${ids.join(', ')})`);
  return { sid, cfg, scene: cfg.scenes.find(s => s.id === sid) };
}

// time → the strings each site's date/time fields show (Korea time; the browser on the PC must be in Asia/Seoul)
export function parseAt(at, now = new Date()) {
  let ms;
  if (at) {
    const s = String(at).trim().replace(' ', 'T');
    ms = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : (/T/.test(s) ? s : s + 'T' + DEFAULT_TIME) + (s.length <= 16 ? ':00' : '') + TZ.offset);
    if (isNaN(ms)) throw new Error(`--at "${at}": want 2026-10-26T19:00 (Korea time) or a full ISO time`);
  } else {   // tomorrow at DEFAULT_TIME, Korea time
    const k = new Date(now.getTime() + TZ.hours * 3600e3 + 864e5), d = k.toISOString().slice(0, 10);
    ms = Date.parse(`${d}T${DEFAULT_TIME}:00${TZ.offset}`);
  }
  const k = new Date(ms + TZ.hours * 3600e3), y = k.getUTCFullYear(), mo = k.getUTCMonth() + 1, d = k.getUTCDate(), wd = k.getUTCDay();
  const H = k.getUTCHours(), Mi = k.getUTCMinutes(), h12 = H % 12 || 12, ampm = H < 12 ? '오전' : '오후', p2 = n => String(n).padStart(2, '0');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    iso: new Date(ms).toISOString(), future: ms > now.getTime() + 15 * 60e3,
    kst: { y, m: mo, d, wd, hh: p2(H), mm: p2(Mi), text: `${y}-${p2(mo)}-${p2(d)} ${p2(H)}:${p2(Mi)} (${'일월화수목금토'[wd]}) KST` },
    studio: { date: `${y}. ${mo}. ${d}.`, time: `${ampm} ${h12}:${p2(Mi)}`, listed: Mi % 15 === 0 },   // Studio's time list is in 15-min steps
    meta: { type: `${p2(mo)}/${p2(d)}/${y}`, want: `${MON[mo - 1]} ${d}, ${y}`, hour: String(h12), minute: String(Mi), meridiem: H < 12 ? 'AM' : 'PM', typeHour: p2(h12), typeMinute: p2(Mi), typeMeridiem: H < 12 ? 'A' : 'P' },
    threads: { y, m: mo, d, wd, hh: p2(H), mm: p2(Mi), banner: `${ampm} ${h12}:${p2(Mi)} GMT+9` },
  };
}

// the whole plan for one film + scene
export function buildPlan(folderArg, { scene, at, now } = {}) {
  const folder = folderOf(folderArg), rel = relative(ROOT, folder).replace(/\\/g, '/');
  const { sid, cfg } = pickScene(folder, scene), up = readUpload(folder), posted = postedOf(folder);
  const out = join(folder, 'film', 'out'), file = n => { const p = join(out, n); return existsSync(p) ? { name: n, local: p, bytes: statSync(p).size, mtime: statSync(p).mtime.toISOString() } : null; };
  const video = file(`${sid}-upload.mp4`), cover = file(`${sid}-cover-insta.jpg`) || file(`${sid}-cover.jpg`);
  const P = up.problems, W = [...up.warnings];
  const noVideo = `영상 없음: ${rel}/film/out/${sid}-upload.mp4 — python3 tools/export.py ${rel} --scene ${sid}`;
  if (!video) for (const k of PLATFORMS) P[k].push(noVideo);
  if (!cover) P.instagram.push(`커버 없음: ${rel}/film/out/${sid}-cover.jpg (export.py가 만듦)`);
  // the time: --at, else the YouTube time already set (so every platform goes out together), else tomorrow 19:00 KST
  const ytAt = ['scheduled', 'public'].includes(posted.youtube?.status) ? posted.youtube?.at : null;
  const T = parseAt(at || ytAt, now);
  if (!T.future) W.push(`시각 ${T.kst.text}은 이미 지났거나 15분 안 — 예약할 수 없음 (--at)`);
  if (!T.studio.listed) W.push(`유튜브 예약 시각은 15분 단위만 목록에 있음 (${T.studio.time})`);
  if (video && video.bytes > 4e9) P.youtube.push('영상이 4 GB 넘음');
  const src = existsSync(join(folder, 'source.json')) ? readJSON(join(folder, 'source.json')) : {};
  const playlist = src.playlist || (src.series ? String(src.series).replace(/\s*\d+\s*$/, '').trim() : null);
  const ready = {}; for (const k of [...PLATFORMS, 'comment']) ready[k] = P[k].length === 0;
  for (const k of PLATFORMS) if (posted[k] && posted[k].status && posted[k].status !== 'deleted') W.push(`${k}: 이미 기록됨 (${posted[k].status}${posted[k].id ? ' ' + posted[k].id : ''}) — 다시 올리지 말 것`);
  return {
    folder: rel, scene: sid, film: cfg.title || '', generated: new Date().toISOString(), channel: CHANNEL,
    at: T.iso, kst: T.kst.text, schedulable: T.future && T.studio.listed,
    video: video && { url: '/video.mp4', name: video.name, bytes: video.bytes, mtime: video.mtime },
    cover: cover && { url: '/cover.jpg', name: cover.name, bytes: cover.bytes },
    youtube: { ...up.youtube, language: '한국어', notify: true, playlist, studio: T.studio },
    instagram: { caption: up.instagram.caption, meta: T.meta },
    threads: { caption: up.threads.caption, built: up.threads.built, ...T.threads },
    tiktok: { caption: up.tiktok.caption },
    link: up.link, posted, ready, problems: P, warnings: W,
    _files: { video: video?.local, cover: cover?.local },   // dropped by serve.mjs before it reaches a browser
  };
}

// posted.json — what went where (one file per film, committed; small)
export function recordPosted(folderArg, platform, fields, { scene, note } = {}) {
  const folder = folderOf(folderArg);
  if (!PLATFORMS.includes(platform)) throw new Error(`platform must be one of ${PLATFORMS.join(', ')}`);
  if (fields.status && !STATUS.includes(fields.status)) throw new Error(`status must be one of ${STATUS.join(', ')}`);
  if (platform === 'youtube' && fields.id && !/^[\w-]{11}$/.test(fields.id)) throw new Error(`not a YouTube video id: ${fields.id}`);
  if (fields.url && !/^https:\/\/\S+$/.test(fields.url)) throw new Error(`url must be https://…: ${fields.url}`);
  if (fields.at) { const t = Date.parse(fields.at); if (isNaN(t)) throw new Error(`at: not a time: ${fields.at}`); fields.at = new Date(t).toISOString(); }
  for (const [k, v] of Object.entries(fields)) if (v === undefined || v === '' || /^(undefined|null)$/.test(String(v))) delete fields[k];
  const { sid } = pickScene(folder, scene), f = join(folder, 'posted.json'), o = postedOf(folder);
  if (platform === 'youtube' && fields.id && !fields.url) fields.url = `https://youtube.com/shorts/${fields.id}`;
  const when = new Date().toISOString();
  const next = { _note: o._note || `What of this film is posted where (tools/publish). Channel ${CHANNEL.handle} · one scene for every platform.`,
    scene: o.scene || sid, ...o, [platform]: { ...(o[platform] || {}), ...fields, updated: when } };
  next.log = [...(o.log || []), { when, platform, ...fields, ...(note ? { note } : {}) }];
  writeFileSync(f, JSON.stringify(next, null, 1) + '\n');
  return next;
}

export const publicPlan = p => { const { _files, ...rest } = p; return rest; };
export { basename };
