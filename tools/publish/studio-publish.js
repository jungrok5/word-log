// Paste-in helper for YouTube Studio (channel @word-log): make an uploaded Short PUBLIC now, then save and confirm.
// Publishing is a public act — only after the owner said yes for this video. For a set time, upload with
// __wlUpload({ mode: 'schedule' }) instead (studio-upload.js); this one is for "now" (or to publish a private upload).
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>
//   start on any Studio page of the channel (e.g. /channel/UCrzEUsnUGuptKGVs-z2j1Ig/videos/short), paste this file, then
//   __wlPublish('<videoId>').then(r => window.__wlPub = r)     (wait for the processing to finish first)
// It opens /video/<id>/edit through the SPA router, refuses if the video's title is not upload.md's title (wrong video,
// or the text changed — run studio-describe.js first), and saves only when the visibility reads 공개.
// Ported from one-scroll-bible motion/youtube/studio-publish.js — the thumbnail A/B test is dropped: Shorts take no
// custom thumbnail.
(() => {
  const SRV = 'http://127.0.0.1:8766', CHANNEL = 'UCrzEUsnUGuptKGVs-z2j1Ig';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const wait = async (fn, ms = 20000) => { for (let t = 0; t < ms; t += 250) { const v = fn(); if (v) return v; await sleep(250); } return null; };
  const norm = s => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  window.__wlChannel = window.__wlChannel || (() => {
    const ids = [location.pathname, ...[...document.querySelectorAll('a[href*="/channel/UC"]')].map(a => a.getAttribute('href') || '')]
      .map(h => (h.match(/\/channel\/(UC[\w-]{22})/) || [])[1]).filter(Boolean);
    const n = {}; for (const i of ids) n[i] = (n[i] || 0) + 1; const c = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    if (c) window.__wlSeen = c; return c || window.__wlSeen || null;   // an edit page's URL has no channel: keep the last one seen
  });
  window.__wlPlan = window.__wlPlan || (async () => { const r = await fetch(SRV + '/plan.json', { cache: 'no-store' }); const j = await r.json(); if (!r.ok || j.error) throw new Error('plan.json: ' + (j.error || r.status)); return j; });
  // the edit page reached by pushState can be half-rendered or still show the previous video: list → edit, wait for it
  window.__wlOpenEdit = async id => {
    for (let a = 0; a < 3; a++) {
      [...document.querySelectorAll('ytcp-button, button')].filter(x => x.offsetParent && x.innerText?.trim() === '닫기').forEach(x => x.click());
      history.pushState({}, '', `/channel/${CHANNEL}/videos/short`); dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(1500);
      history.pushState({}, '', `/video/${id}/edit`); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      const v = await wait(() => { const x = document.querySelector('ytcp-video-metadata-editor')?.video;
        return x?.videoId === id && document.querySelectorAll('#textbox').length >= 2 && document.querySelector('ytcp-button#save') && document.querySelector('[aria-label="동영상 공개 상태 수정"]') && x; }, 12000);
      if (v) { await sleep(2000); return v; }
    }
    return null;
  };

  window.__wlPublish = async id => {
    const r = { id };
    try {
      const ch = window.__wlChannel(); if (ch !== CHANNEL) return { ...r, error: `Studio is on channel ${ch || '(unknown)'}, not @word-log` };
      const p = await window.__wlPlan(); r.folder = p.folder;
      if (p.posted.youtube?.id && p.posted.youtube.id !== id) return { ...r, error: `posted.json has ${p.posted.youtube.id} for this film, not ${id}` };
      const v = await window.__wlOpenEdit(id); if (!v) return { ...r, error: 'edit page did not load' };
      r.title = document.querySelector('#textbox')?.innerText.slice(0, 60);
      if (norm(r.title) !== norm(p.youtube.title)) return { ...r, error: `Studio title "${r.title}" ≠ upload.md "${p.youtube.title}" — wrong video, or run __wlDescribe first` };
      document.querySelector('[aria-label="동영상 공개 상태 수정"]').click(); await sleep(1500);
      const pub = await wait(() => [...document.querySelectorAll('tp-yt-paper-radio-button[name=PUBLIC]')].find(x => x.offsetParent)); if (!pub) return { ...r, error: 'no 공개 option' };
      pub.click(); await sleep(800);
      [...document.querySelectorAll('ytcp-button, button')].filter(b => b.offsetParent && b.innerText.trim() === '완료').at(-1)?.click(); await sleep(1200);
      r.vis = document.querySelector('ytcp-video-metadata-visibility')?.innerText.replace(/\s+/g, ' ').trim();
      if (!/공개 상태 공개/.test(r.vis || '')) return { ...r, error: 'visibility does not read 공개 — not saving' };
      document.querySelector('ytcp-button#save').click(); await sleep(1000);
      r.saved = !!(await wait(() => /저장됨/.test(document.querySelector('tp-yt-paper-toast, ytcp-toast')?.innerText || '') || document.querySelector('ytcp-button#save')?.hasAttribute('disabled'), 25000));
      if (r.saved) r.cmd = `node tools/publish/posted.mjs ${p.folder} youtube id=${id} status=public at=${new Date().toISOString()} via=studio`;
      await sleep(2500); return r;   // wait for the save before navigating away (leaving early lost a save once)
    } catch (e) { return { ...r, error: String(e && e.message || e) }; }
  };
  return 'studio-publish ready — __wlPublish(id).then(r => window.__wlPub = r)';
})();
