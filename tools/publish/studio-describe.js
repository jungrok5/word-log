// Paste-in helper for YouTube Studio (channel @word-log): after upload.md's YouTube title/description changed, make the
// uploaded Short say exactly that again, save, then read the video back from Studio and check that the text matches and
// that a scheduled time did not move.
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>
//   on any Studio page of the channel, paste this file, then
//   __wlDescribe('<videoId>').then(r => window.__wlDesc = r)          (add { title: false } to leave the title)
// Ported from one-scroll-bible motion/youtube/studio-describe.js (there it replaced one link line per language; here the
// whole title/description comes from upload.md). Lessons kept: always a fresh /plan.json (a tab once kept an old manifest
// and wrote "…: undefined" into a public description), never save an empty or "undefined" value, read back to confirm.
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
  window.__wlOpenEdit = window.__wlOpenEdit || (async id => {
    for (let a = 0; a < 3; a++) {
      [...document.querySelectorAll('ytcp-button, button')].filter(x => x.offsetParent && x.innerText?.trim() === '닫기').forEach(x => x.click());
      history.pushState({}, '', `/channel/${CHANNEL}/videos/short`); dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(1500);
      history.pushState({}, '', `/video/${id}/edit`); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      const v = await wait(() => { const x = document.querySelector('ytcp-video-metadata-editor')?.video;
        return x?.videoId === id && document.querySelectorAll('#textbox').length >= 2 && document.querySelector('ytcp-button#save') && document.querySelector('[aria-label="동영상 공개 상태 수정"]') && x; }, 12000);
      if (v) { await sleep(2000); return v; }
    }
    return null;
  });

  window.__wlDescribe = async (id, { title: doTitle = true } = {}) => {
    const r = { id };
    try {
      const ch = window.__wlChannel(); if (ch !== CHANNEL) return { ...r, error: `Studio is on channel ${ch || '(unknown)'}, not @word-log` };
      const p = await window.__wlPlan(); r.folder = p.folder; const y = p.youtube;
      if (!p.ready.youtube) return { ...r, error: 'plan not ready: ' + p.problems.youtube.join(' / ') };
      for (const k of ['title', 'description']) if (typeof y[k] !== 'string' || !y[k].trim() || /\bundefined\b/.test(y[k])) return { ...r, error: `plan.youtube.${k} is empty — not saving` };
      if (p.posted.youtube?.id && p.posted.youtube.id !== id) return { ...r, error: `posted.json has ${p.posted.youtube.id} for this film, not ${id}` };
      const v = await window.__wlOpenEdit(id); if (!v) return { ...r, error: 'edit page did not load' };
      const at = x => x?.scheduledPublishingDetails?.scheduledPublishings?.[0]?.scheduledTimeSeconds;
      r.before = { title: v.title, at: at(v) };
      const [tb, db] = document.querySelectorAll('#textbox');
      if (norm(v.title) === norm(y.title) && norm(v.description) === norm(y.description)) return { ...r, unchanged: true };
      const put = (el, t) => { el.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, t); el.dispatchEvent(new Event('input', { bubbles: true })); };
      if (doTitle && norm(v.title) !== norm(y.title)) { put(tb, y.title); await sleep(300); }
      if (norm(v.description) !== norm(y.description)) { put(db, y.description); await sleep(600); }
      const save = document.querySelector('ytcp-button#save'); if (!save || save.hasAttribute('disabled')) return { ...r, error: 'save not enabled' };
      save.click(); for (let k = 0; k < 80 && !save.hasAttribute('disabled'); k++) await sleep(250);
      await sleep(1500);
      const w = await window.__wlOpenEdit(id);   // read back from the server-side video object
      r.after = { title: w?.title, at: at(w) };
      r.ok = !!w && norm(w.description) === norm(y.description) && (!doTitle || norm(w.title) === norm(y.title)) && r.after.at === r.before.at;
      return r;
    } catch (e) { return { ...r, error: String(e && e.message || e) }; }
  };
  return 'studio-describe ready — __wlDescribe(id).then(r => window.__wlDesc = r)';
})();
