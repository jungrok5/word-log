// Paste-in helper for YouTube Studio (Claude in Chrome's javascript tool), channel @word-log: uploads the film's Short with
// everything from upload.md (via /plan.json) — as PRIVATE (default) or SCHEDULED at the plan's time. Nothing goes public.
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>   (127.0.0.1:8766)
//
//   1. open https://studio.youtube.com/channel/UCrzEUsnUGuptKGVs-z2j1Ig/videos/upload?d=ud (a fresh page load is safest)
//   2. paste THIS FILE's text (Studio's Trusted Types block eval/fetched code — paste the code itself)
//   3. __wlUpload().then(r => window.__wlResult = r)                       private
//      __wlUpload({ mode: 'schedule' }).then(r => window.__wlResult = r)   scheduled at plan.at (owner's yes first)
//      The tool times out after 45 s: start it without awaiting, then read window.__wlResult (and __wlStep for progress).
//   4. run the result's `cmd` locally (node tools/publish/posted.mjs …) so posted.json has the video id.
// It refuses: another channel, a plan that is not ready (✍️ drafts, "(질문)", no MP4), a film already uploaded
// (posted.json), a schedule time in the past or off Studio's 15-minute list, a PC not on Korea time.
// Ported from one-scroll-bible motion/youtube/studio-upload.js + studio-shorts.js (2026-10-22/23 lessons kept):
// - the schedule TIME box only commits a value PICKED FROM ITS LIST (typing "오후 7:00" shows it but saves 0:00)
// - the schedule DATE box lives in a popup outside the upload dialog: open #datepicker-trigger, then type into it
// - the language dropdown sometimes ignores the first click: retry until the label reads 한국어
// - a reload drops these functions — reopen the dialog through the SPA router instead (__wlReopen)
(() => {
  const SRV = 'http://127.0.0.1:8766', CHANNEL = 'UCrzEUsnUGuptKGVs-z2j1Ig', LANG = '한국어';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const wait = async (fn, ms = 20000) => { for (let t = 0; t < ms; t += 250) { const v = fn(); if (v) return v; await sleep(250); } return null; };
  const norm = s => String(s || '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '').trim();
  const step = s => { window.__wlStep = s; };
  window.__wlChannel = () => {   // the channel this Studio tab works on: the URL, else the nav links
    const ids = [location.pathname, ...[...document.querySelectorAll('a[href*="/channel/UC"]')].map(a => a.getAttribute('href') || '')]
      .map(h => (h.match(/\/channel\/(UC[\w-]{22})/) || [])[1]).filter(Boolean);
    const n = {}; for (const i of ids) n[i] = (n[i] || 0) + 1; const c = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    if (c) window.__wlSeen = c; return c || window.__wlSeen || null;   // an edit page's URL has no channel: keep the last one seen
  };
  window.__wlPlan = async () => { const r = await fetch(SRV + '/plan.json', { cache: 'no-store' }); const j = await r.json(); if (!r.ok || j.error) throw new Error('plan.json: ' + (j.error || r.status)); return j; };
  const koreaTime = () => Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Seoul' || new Date().getTimezoneOffset() === -540;

  window.__wlPickTime = async (scope, time) => {   // the time box only commits a value picked from its list
    const pk = [...scope.querySelectorAll('ytcp-datetime-picker')].find(p => p.offsetParent); const ti = pk.querySelector('input');
    ti.click(); ti.focus(); await sleep(700);
    let it = [...document.querySelectorAll('tp-yt-paper-item')].filter(i => i.offsetParent).find(i => i.innerText.trim() === time);
    if (!it) { pk.querySelector('tp-yt-paper-input, #input-container, .container')?.click(); await sleep(700); it = [...document.querySelectorAll('tp-yt-paper-item')].filter(i => i.offsetParent).find(i => i.innerText.trim() === time); }
    it?.click(); await sleep(600); return ti.value;
  };

  window.__wlReopen = async () => {   // pushing the same "?d=ud" again does nothing — leave to the bare list first
    for (let a = 0; a < 3 && !document.querySelector('ytcp-uploads-dialog input[type=file]'); a++) {
      [...document.querySelectorAll('ytcp-button, button')].filter(x => x.offsetParent && x.innerText?.trim() === '닫기').forEach(x => x.click());
      history.pushState({}, '', `/channel/${CHANNEL}/videos/upload`); dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(1500);
      history.pushState({}, '', `/channel/${CHANNEL}/videos/upload?d=ud`); dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(3000);
    }
    return !!document.querySelector('ytcp-uploads-dialog input[type=file]');
  };

  window.__wlUpload = async ({ mode = 'private', save = true, force = false } = {}) => {
    const r = { mode };
    const done = x => (window.__wlResult = { ...r, ...x });
    try {
      step('checks');
      const ch = window.__wlChannel(); if (ch !== CHANNEL) return done({ error: `Studio is on channel ${ch || '(unknown)'}, not @word-log — switch account (top right) and open /channel/${CHANNEL}/videos/upload?d=ud` });
      const p = await window.__wlPlan(); r.folder = p.folder; r.scene = p.scene;
      if (!p.ready.youtube) return done({ error: 'plan not ready: ' + p.problems.youtube.join(' / ') });
      const y = p.youtube;
      for (const k of ['title', 'description']) if (typeof y[k] !== 'string' || !y[k].trim() || /\bundefined\b/.test(y[k])) return done({ error: `plan.youtube.${k} is empty — not uploading` });
      if (!force && p.posted.youtube?.id && p.posted.youtube.status !== 'deleted') return done({ error: `already uploaded: ${p.posted.youtube.id} (${p.posted.youtube.status}) in posted.json — {force:true} only if that video was deleted` });
      if (!['private', 'schedule'].includes(mode)) return done({ error: 'mode is private or schedule' });
      if (mode === 'schedule' && !p.schedulable) return done({ error: `cannot schedule at ${p.kst} (past, or not on the 15-minute list) — restart serve.mjs with --at` });
      if (mode === 'schedule' && !koreaTime()) return done({ error: 'this PC is not on Korea time (Asia/Seoul) — Studio would schedule in the wrong zone' });
      if (!p.video?.url) return done({ error: 'no video in the plan' });

      step('file');
      let fileInput = document.querySelector('ytcp-uploads-dialog input[type=file]');
      if (!fileInput && await window.__wlReopen()) fileInput = document.querySelector('ytcp-uploads-dialog input[type=file]');
      if (!fileInput) return done({ error: `upload dialog not open — open /channel/${CHANNEL}/videos/upload?d=ud` });
      const b = await (await fetch(SRV + p.video.url, { cache: 'no-store' })).blob();
      if (b.size !== p.video.bytes) return done({ error: `video fetched ${b.size} bytes, plan says ${p.video.bytes}` });
      const dt = new DataTransfer(); dt.items.add(new File([b], p.video.name, { type: 'video/mp4' }));
      fileInput.files = dt.files; fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      const D = await wait(() => document.querySelectorAll('ytcp-uploads-dialog #textbox').length >= 2 && document.querySelector('ytcp-uploads-dialog'));
      if (!D) return done({ error: 'details did not open' });
      await sleep(1500);

      step('details');
      const put = (el, t) => { el.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, t); el.dispatchEvent(new Event('input', { bubbles: true })); };
      const [title, desc] = D.querySelectorAll('#textbox'); put(title, y.title); await sleep(300); put(desc, y.description); await sleep(500);
      r.titleOk = norm(title.innerText) === norm(y.title); r.descOk = norm(desc.innerText).replace(/\s+/g, ' ') === norm(y.description).replace(/\s+/g, ' ');
      D.querySelector('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').click();
      D.querySelector('#toggle-button').click(); await sleep(1200);   // 자세히 보기
      D.querySelector('[name=VIDEO_HAS_ALTERED_CONTENT_NO]').click(); D.querySelector('[name=VIDEO_PAID_PRODUCT_PLACEMENT_NO]').click();   // by name: the label text is not in innerText
      // tags: one chip each, then drop from the end until YouTube's own counter is under 500
      const ti = D.querySelector('ytcp-chip-bar input#text-input'); ti.focus();
      for (const t of y.tags) { ti.value = t; ti.dispatchEvent(new Event('input', { bubbles: true })); ti.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); await sleep(120); }
      const count = () => +(D.innerText.match(/(\d+)\/500/) || [])[1];
      for (let n = 0; count() > 480 && n < 15; n++) { [...D.querySelectorAll('ytcp-chip')].pop()?.querySelector('#delete-icon, tp-yt-iron-icon, yt-icon')?.click(); await sleep(200); }
      // subscriber notification: ON (one Korean channel — every video notifies)
      const notify = [...D.querySelectorAll('ytcp-checkbox-lit')].find(e => e.innerText.includes('구독 피드에 게시'));
      const nbox = notify?.querySelector('[role=checkbox]') || notify; if (nbox && nbox.getAttribute('aria-checked') === 'false') { nbox.click(); await sleep(300); }
      // video language, retried (the dropdown sometimes ignores the first click)
      const langNow = () => (D.innerText.match(/동영상 언어\s*\n\s*(.+)/) || [])[1];
      for (let a = 0; a < 3 && langNow() !== LANG; a++) { document.body.click(); await sleep(300);
        D.querySelector('#language-input ytcp-dropdown-trigger, ytcp-form-language-input ytcp-dropdown-trigger')?.click(); await sleep(1200);
        [...document.querySelectorAll('tp-yt-paper-item')].find(e => e.innerText.trim() === LANG)?.click(); await sleep(900); }
      Object.assign(r, { title: title.innerText.slice(0, 60), tags: count(), language: langNow(), notify: nbox?.getAttribute('aria-checked'),
        ai: D.querySelector('[name=VIDEO_HAS_ALTERED_CONTENT_NO]').getAttribute('aria-checked'), kids: D.querySelector('[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').getAttribute('aria-checked') });

      step('visibility');
      for (let i = 0; i < 3; i++) { D.querySelector('#next-button').click(); await sleep(1500); }
      if (mode === 'schedule') {
        const { date, time } = y.studio;
        if (!D.querySelector('ytcp-datetime-picker')?.offsetParent) { D.querySelector('#second-container')?.click(); await sleep(1200); }   // 예약
        const setIn = async (i, v) => { i.focus(); i.select(); document.execCommand('insertText', false, v); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); await sleep(700); };
        const vis = () => [...document.querySelectorAll('input')].filter(i => i.offsetParent);
        let di = vis().find(i => /^\d{4}\. \d/.test(i.value)); if (!di) { D.querySelector('#datepicker-trigger')?.click(); await sleep(800); di = await wait(() => vis().find(i => /^\d{4}\. \d/.test(i.value)), 5000); }
        if (!di) return done({ error: 'no date input' });
        await setIn(di, date); document.body.click(); await sleep(500);
        r.time = await window.__wlPickTime(D, time); document.body.click(); await sleep(400);
        r.when = (D.querySelector('ytcp-datetime-picker #datepicker-trigger')?.innerText.trim() || '') + ' ' + r.time;
        r.whenOk = r.when === `${date} ${time}`;
      } else {
        D.querySelector('tp-yt-paper-radio-button[name="PRIVATE"]').click(); await sleep(500);
        r.private = D.querySelector('tp-yt-paper-radio-button[name="PRIVATE"]').getAttribute('aria-checked');
      }
      const ok = r.titleOk && r.descOk && r.language === LANG && r.ai === 'true' && r.kids === 'true' && (mode === 'schedule' ? r.whenOk : r.private === 'true');
      if (!ok) return done({ error: 'check failed — nothing saved; look at the fields (the dialog is still open)' });

      step('uploading');
      await wait(() => /업로드 완료|처리|검사/.test(D.querySelector('ytcp-video-upload-progress')?.innerText || ''), 600000);
      r.url = [...D.querySelectorAll('a')].map(a => a.href).find(h => /youtube\.com\/shorts\/|youtu\.be\//.test(h));
      r.id = r.url?.split('/').pop()?.split('?')[0];
      if (!save) return done({ saved: false, note: 'save:false — the dialog is left open' });
      const btn = D.querySelector('#done-button'); r.button = btn.innerText.trim();
      if (r.button !== (mode === 'schedule' ? '예약' : '저장')) return done({ error: `the final button reads "${r.button}" — not clicking` });
      step('saving'); btn.click(); await sleep(3500);
      [...document.querySelectorAll('ytcp-button, button')].filter(x => x.offsetParent && x.innerText?.trim() === '닫기').forEach(x => x.click());
      r.saved = true;
      if (r.id) r.cmd = `node tools/publish/posted.mjs ${p.folder} youtube --scene ${p.scene} id=${r.id} status=${mode === 'schedule' ? 'scheduled' : 'private'}${mode === 'schedule' ? ' at=' + p.at : ''} via=studio`;
      step('done'); return done({});
    } catch (e) { step('error'); return done({ error: String(e && e.message || e) }); }
  };
  return 'studio-upload ready — __wlUpload().then(r => window.__wlResult = r)  (or { mode: "schedule" })';
})();
