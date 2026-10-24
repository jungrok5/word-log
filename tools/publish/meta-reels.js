// Paste-in helper for Meta Business Suite (business.facebook.com) to schedule the film's Instagram Reel from /plan.json
// (upload.md "## 인스타 릴스" caption · film/out/<scene>-upload.mp4 · <scene>-cover(-insta).jpg · plan time, Korea time).
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id> [--at …]
// Business Suite's CSP blocks fetching 127.0.0.1, so files come through a popup (tools/publish/relay.html, same origin as
// the server) that posts the bytes back. Opening that popup needs a real click: the red "WL RELAY" button this adds.
// First check the business account at the top left is word-log's (not one-scroll-bible's), and the PC is on Korea time.
//   1. paste this, real click WL RELAY (once per full page load; SPA moves keep it) → __relay.ready === true
//      → await __loadPlan()  (refuses when the Instagram caption is a draft / has placeholders, or posted.json has it)
//   2. __ct('Create reel') · real click the caption box and TYPE __plan.instagram.caption with real keystrokes (scripted
//      insertText scrambles the editor's hashtag nodes and can crash it: "Reel details are temporarily unavailable") ·
//      Escape · await __media() · __capOk() · await __toSchedule() (→ 'on schedule') ·
//      real clicks + typing: date field (triple-click, ctrl+a, type __plan.instagram.meta.type, Enter), then hour
//      meta.typeHour, minutes meta.typeMinute, meridiem meta.typeMeridiem ·
//      __finish() — checks date/time against the plan and clicks Schedule only if they match → run the printed cmd.
// Start from the Content page's "Create reel" (an SPA move keeps the helper); opening the composer by URL reloads the page
// and the helper + relay must be set up again. A paused-upload "copyright may be found" note clears in ~10 s.
// The Planner (week view) is the reliable check; the Scheduled list lags by minutes.
// Ported from one-scroll-bible motion/social/meta-reels.js (21 reels, 2026-10-23) — one reel per film here.
(() => {
  const SRV = 'http://127.0.0.1:8766';
  const oc = HTMLInputElement.prototype.click;   // a file input's click() is captured instead of opening the OS picker
  if (!window.__fiHook) { window.__fiHook = 1; HTMLInputElement.prototype.click = function () { if (this.type === 'file') { window.__fi = this; return; } return oc.call(this); }; }
  window.__relay = window.__relay || { pend: {}, ready: false, win: null };
  if (!window.__relayL) { window.__relayL = 1; addEventListener('message', e => {
    if (e.origin !== SRV || !e.data) return; const R = window.__relay;
    if (e.data.wl === 'ready') R.ready = true;
    else if (e.data.wl === 'file' || e.data.wl === 'err') { const p = R.pend[e.data.id]; if (p) { delete R.pend[e.data.id]; e.data.wl === 'file' ? p.res(e.data) : p.rej(new Error(e.data.msg)); } }
  }); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  window.__get = path => new Promise((res, rej) => { if (!window.__relay.win) return rej(new Error('click WL RELAY first'));
    const id = Math.random().toString(36).slice(2); window.__relay.pend[id] = { res, rej };
    window.__relay.win.postMessage({ wl: 'get', id, path }, SRV); setTimeout(() => rej(new Error('relay timeout ' + path)), 120000); });
  window.__putR = async (path, name, type, input) => { const d = await window.__get(path);
    const f = new File([d.buf], name, { type }), dt = new DataTransfer(); dt.items.add(f);
    input.files = dt.files; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
    return name + ' ' + (f.size / 1e6).toFixed(1) + 'MB'; };
  const vis = t => [...document.querySelectorAll('[role=button],button,a')].filter(e => e.offsetParent !== null && e.textContent.trim() === t);
  window.__ct = t => { const e = vis(t)[0]; if (!e) return 'not found: ' + t; e.click(); return 'clicked ' + t; };
  window.__ctLast = t => { const l = vis(t), e = l[l.length - 1]; if (!e) return 'not found: ' + t; e.click(); return 'clicked last ' + t; };
  window.__loadPlan = async () => {
    const d = await window.__get('plan.json'), p = JSON.parse(new TextDecoder().decode(d.buf));
    if (p.error) throw new Error('plan.json: ' + p.error);
    if (!p.ready.instagram) throw new Error('Instagram not ready: ' + p.problems.instagram.join(' / '));
    if (!p.schedulable) throw new Error(`cannot schedule at ${p.kst} — restart serve.mjs with --at`);
    if (p.posted.instagram?.status && p.posted.instagram.status !== 'deleted') throw new Error(`posted.json already has Instagram: ${p.posted.instagram.status}`);
    if (!(Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Seoul' || new Date().getTimezoneOffset() === -540)) throw new Error('this PC is not on Korea time');
    window.__plan = p; return `${p.folder} · ${p.scene} · ${p.kst} · caption ${p.instagram.caption.length} chars — type it: __plan.instagram.caption`;
  };
  const P = () => { if (!window.__plan) throw new Error('await __loadPlan() first'); return window.__plan; };
  window.__media = async () => { const p = P(), out = [];
    window.__fi = null; window.__ct('Add Video'); await sleep(500); if (!window.__fi) return 'no video input';
    out.push(await window.__putR('video.mp4', p.video.name, 'video/mp4', window.__fi)); await sleep(8000);
    window.__fi = null; window.__ct('Upload image'); await sleep(800); window.__ctLast('Upload image'); await sleep(500); if (!window.__fi) return out.concat('no image input').join(' | ');
    out.push(await window.__putR('cover.jpg', p.cover.name, 'image/jpeg', window.__fi)); return out.join(' | '); };
  window.__capOk = () => { const t = (document.querySelector('[contenteditable=true]')?.innerText || '').replace(/\n\n\n/g, '\n\n').trim();
    return t === P().instagram.caption.trim() ? 'caption ok' : 'CAPTION MISMATCH ' + JSON.stringify(t); };
  // Next can stay disabled while the upload finishes: keep clicking until the Share step shows, then pick Schedule
  window.__toSchedule = async () => { for (let i = 0; i < 12; i++) {
      if (document.querySelector('input[placeholder="mm/dd/yyyy"]')) return 'on schedule';
      if (vis('Share now').length) { window.__ct('Schedule'); await sleep(1500); continue; }
      window.__ct('Next'); await sleep(2500); }
    return document.querySelector('input[placeholder="mm/dd/yyyy"]') ? 'on schedule' : 'STUCK'; };
  window.__finish = () => { const m = P().instagram.meta, date = document.querySelector('input[placeholder="mm/dd/yyyy"]')?.value,
      sp = l => document.querySelector(`[role=spinbutton][aria-label="${l}"]`),   // the segments are empty; values live in aria-*
      h = sp('hours')?.getAttribute('aria-valuenow'), mi = sp('minutes')?.getAttribute('aria-valuenow'), ap = sp('meridiem')?.getAttribute('aria-valuetext');
    if (window.__capOk() !== 'caption ok') return 'NOT scheduled: ' + window.__capOk();
    if (date !== m.want || h !== m.hour || mi !== m.minute || ap !== m.meridiem) return `NOT scheduled: field ${date} ${h}:${mi} ${ap}, want ${m.want} ${m.hour}:${m.minute} ${m.meridiem}`;
    window.__ctLast('Schedule'); const p = P();
    return `scheduled: ${date} ${h}:${mi} ${ap} — check the Planner, then: node tools/publish/posted.mjs ${p.folder} instagram --scene ${p.scene} status=scheduled at=${p.at} via=business-suite`; };
  let b = document.getElementById('wlRelayBtn');
  if (!b) { b = document.createElement('button'); b.id = 'wlRelayBtn'; b.textContent = 'WL RELAY';
    b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;padding:12px 18px;background:#c00;color:#fff;font:16px sans-serif';
    b.onclick = () => { window.__relay.win = window.open(SRV + '/relay.html', 'wlrelay', 'width=320,height=120'); }; document.body.appendChild(b); }
  return 'meta-reels helper ready — real click WL RELAY, then await __loadPlan()';
})();
