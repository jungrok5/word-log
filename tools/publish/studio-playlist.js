// Paste-in helpers for YouTube Studio (channel @word-log): keep each sermon series in one playlist (plan.youtube.playlist =
// source.json "playlist", else "series" without its number — e.g. "고린도전서 강해 13" → "고린도전서 강해").
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>, and the Short's id in posted.json.
//
// A. The series' FIRST Short — create the playlist (adapted from one-scroll-bible studio-playlist.js, 2026-10-23):
//   1. real click Studio's top-right 만들기 → 새 재생목록 (the page's own "새 재생목록" button only exists while the channel
//      has no playlist at all)
//   2. __wlPlaylistCreate().then(r => window.__plr = r)
//        fills title/description, order 게시된 날짜(오래된순), language 한국어, opens 동영상 추가 and ticks the Short
//        (found by title search — the picker's search does not match descriptions or ids; its list lazy-loads ~30 videos)
//   3. real click the picker's 완료, check "동영상 1개" in the dialog, real click 만들기
//   4. node tools/publish/posted.mjs sermons/<folder> youtube playlist=<name>
// B. Later Shorts of the series — add to the existing playlist on the Short's edit page:
//   __wlPlaylistAdd('<videoId>').then(r => window.__pla = r)       ⚠ NOT yet tried on a real page (2026-10-24) — the
//   playlist dropdown's markup is a guess; if it returns an error, tick the playlist by hand in the edit page's 재생목록 box.
(() => {
  const SRV = 'http://127.0.0.1:8766', CHANNEL = 'UCrzEUsnUGuptKGVs-z2j1Ig';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const wait = async (fn, ms = 15000) => { for (let t = 0; t < ms; t += 250) { const v = fn(); if (v) return v; await sleep(250); } return null; };
  const plan = async () => { const r = await fetch(SRV + '/plan.json', { cache: 'no-store' }); const j = await r.json(); if (!r.ok || j.error) throw new Error('plan.json: ' + (j.error || r.status)); return j; };
  const put = (el, v) => { el.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, v); el.dispatchEvent(new Event('input', { bubbles: true })); };

  async function tickBySearch(p, query, id) {
    const idOf = img => ((img.src || '').match(/\/vi(?:_webp)?\/([^/]+)\//) || [])[1];   // the row thumbnail carries the video id
    const inp = p.querySelector('input'); inp.focus(); inp.value = query; inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); await sleep(2300);
    for (const img of p.querySelectorAll('img')) { if (idOf(img) !== id) continue; let row = img; for (let k = 0; k < 10 && row && !row.querySelector('[role=checkbox]'); k++) row = row.parentElement;
      const cb = row && row.querySelector('[role=checkbox]'); if (!cb) continue; if (cb.getAttribute('aria-checked') !== 'true') { cb.click(); await sleep(200); } return true; }
    return false;
  }

  window.__wlPlaylistCreate = async ({ description } = {}) => {
    try {
      const P = await plan(), name = P.youtube.playlist, id = P.posted.youtube?.id;
      if (!name) return { err: 'no playlist name — add "playlist" (or "series") to source.json' };
      if (!id) return { err: 'no YouTube id in posted.json yet — upload first' };
      const r = { name, id };
      const d = await wait(() => [...document.querySelectorAll('ytcp-dialog')].find(e => e.offsetParent && /새 재생목록 만들기/.test(e.innerText))); if (!d) return { ...r, err: 'open the 새 재생목록 dialog first (만들기 → 새 재생목록, real click)' };
      await sleep(800);
      const [t, ds] = d.querySelectorAll('#textbox');
      put(t, name); await sleep(300); put(ds, description || `${name} — 설교 한 편의 메시지를 그림 하나로 (@word-log)`); await sleep(300);
      const pick = async (re, item) => { const tr = [...d.querySelectorAll('ytcp-dropdown-trigger')].find(e => re.test(e.innerText)); if (!tr) return; (tr.querySelector('#right-icon, tp-yt-iron-icon, #trigger') || tr).click(); await sleep(900);
        const it = [...document.querySelectorAll('tp-yt-paper-item')].find(e => e.offsetParent !== null && e.innerText.trim() === item); if (it) { it.scrollIntoView({ block: 'center' }); it.click(); await sleep(600); } };
      await pick(/기본 동영상 순서/, '게시된 날짜(오래된순)'); r.order = /오래된순/.test(d.innerText);
      await pick(/제목 및 설명/, '한국어'); r.lang = (d.innerText.match(/제목 및 설명\s*\n\s*(.+)/) || [])[1];
      [...d.querySelectorAll('ytcp-button')].find(b => b.innerText.trim() === '동영상 추가')?.click();
      const pk = await wait(() => [...document.querySelectorAll('ytcp-dialog')].filter(e => e.offsetParent).find(e => /^동영상 추가/.test(e.innerText.trim()))); if (!pk) return { ...r, err: 'no picker' };
      await sleep(1500);
      r.ticked = await tickBySearch(pk, P.youtube.title.slice(0, 40), id);
      r.next = 'real click 완료 → check "동영상 1개" → real click 만들기 → ' + `node tools/publish/posted.mjs ${P.folder} youtube playlist="${name}"`;
      return r;
    } catch (e) { return { err: String(e && e.message || e) }; }
  };

  window.__wlPlaylistAdd = async id => {   // untested markup — see the header
    try {
      const P = await plan(), name = P.youtube.playlist; if (!name) return { err: 'no playlist name in the plan' };
      if (P.posted.youtube?.id && P.posted.youtube.id !== id) return { err: `posted.json has ${P.posted.youtube.id}, not ${id}` };
      history.pushState({}, '', `/channel/${CHANNEL}/videos/short`); dispatchEvent(new PopStateEvent('popstate', { state: {} })); await sleep(1500);
      history.pushState({}, '', `/video/${id}/edit`); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      const ok = await wait(() => document.querySelector('ytcp-video-metadata-editor')?.video?.videoId === id && document.querySelector('ytcp-button#save'), 15000); if (!ok) return { err: 'edit page did not load' };
      await sleep(2000);
      const box = document.querySelector('ytcp-video-metadata-playlists ytcp-dropdown-trigger, ytcp-video-metadata-playlists [role=button]'); if (!box) return { err: 'no 재생목록 box found (markup changed?) — tick it by hand' };
      box.click(); await sleep(1200);
      const lab = await wait(() => [...document.querySelectorAll('ytcp-checkbox-group *, ytcp-playlist-dialog *, tp-yt-paper-dialog *')].filter(e => e.offsetParent && e.children.length === 0).find(e => e.textContent.trim() === name), 6000);
      if (!lab) return { err: `no playlist "${name}" in the list — create it once with __wlPlaylistCreate` };
      let row = lab; for (let k = 0; k < 6 && row && !row.querySelector('[role=checkbox]'); k++) row = row.parentElement;
      const cb = row?.querySelector('[role=checkbox]'); if (!cb) return { err: 'no checkbox next to the playlist name' };
      if (cb.getAttribute('aria-checked') !== 'true') { cb.click(); await sleep(400); }
      [...document.querySelectorAll('ytcp-button, button')].filter(b => b.offsetParent && b.innerText.trim() === '완료').at(-1)?.click(); await sleep(1000);
      const s = document.querySelector('ytcp-button#save'); if (s && !s.hasAttribute('disabled')) { s.click(); await wait(() => s.hasAttribute('disabled'), 20000); }
      return { id, name, ticked: cb.getAttribute('aria-checked') === 'true', saved: !!s?.hasAttribute('disabled'), cmd: `node tools/publish/posted.mjs ${P.folder} youtube playlist="${name}"` };
    } catch (e) { return { err: String(e && e.message || e) }; }
  };
  return 'studio-playlist ready — __wlPlaylistCreate() (first Short of a series) / __wlPlaylistAdd(id)';
})();
