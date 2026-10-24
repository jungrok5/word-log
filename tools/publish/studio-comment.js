// Paste-in helpers for the Short's WATCH page — https://www.youtube.com/watch?v=<id> (not /shorts/<id>: the Shorts player
// has a different comment panel) — signed in as @word-log: post or update the channel's pinned comment from upload.md's
// "- 고정 댓글 ✍️ → **질문** · 링크" (via /plan.json). The video must be public (comments are closed before that).
// It is a public post in the channel's name — get the owner's yes first. Check the top-right avatar is word-log first.
// Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>
//
// What works (one-scroll-bible, 2026-10-23, 16 films): typing and the post/save buttons react to script clicks, but the
// comment's ⋮ menu and the pin dialog's confirm button often do NOT — so the script finds where they are and you click them
// for real (Claude in Chrome: computer left_click at the returned coordinates, or the find tool + ref for the confirm
// button). Coordinates are in a 1044-px-wide screenshot frame (scale = 1044 / innerWidth); change W below if yours differs.
//
//   1. __wlCommentPrep().then(r => window.__cr = r)
//        → { state: 'unchanged' }                       done (already there, same text)
//        → { state: 'posted', menu: [x, y] }            new comment posted → step 2 with 고정
//        → { state: 'edit', menu: [x, y] }              the channel's comment differs → step 2 with 수정
//   2. real click on menu → __wlMenuItems() → [[label, x, y], …] → real click on 고정 or 수정
//   3a. pin: the dialog's 고정 button — real click → __wlCommentCheck()   → { pinned: true, text: true }
//   3b. edit: __wlCommentType().then(r => window.__cr = r)               → 'updated pinned'
//   4. run the printed cmd (posted.json: comment=pinned).
// Wait for each result before navigating away: leaving before the save confirms loses it (happened once).
(() => {
  const SRV = 'http://127.0.0.1:8766', W = 1044, ME = /@word-log\b/i;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const at = el => { const b = el.getBoundingClientRect(), s = W / innerWidth; return [Math.round((b.x + b.width / 2) * s), Math.round((b.y + b.height / 2) * s)]; };
  const vid = () => new URL(location.href).searchParams.get('v');
  let P = null;
  const pinned = async () => {
    const r = await fetch(SRV + '/plan.json', { cache: 'no-store' }); const p = await r.json(); if (!r.ok || p.error) throw new Error('plan.json: ' + (p.error || r.status));
    if (!p.ready.comment) throw new Error('pinned comment not ready: ' + p.problems.comment.join(' / '));
    const c = p.youtube.comment; if (!c?.text || /\bundefined\b/.test(c.want)) throw new Error('plan has no pinned text');
    if (location.pathname !== '/watch') throw new Error('open https://www.youtube.com/watch?v=<id> (not /shorts/)');
    if (p.posted.youtube?.id && p.posted.youtube.id !== vid()) throw new Error(`this page is ${vid()}, posted.json has ${p.posted.youtube.id}`);
    P = p; return c;
  };
  const mine = () => [...document.querySelectorAll('ytd-comment-thread-renderer')].find(t => ME.test(t.querySelector('#author-text')?.innerText || ''));
  const typeInto = (ed, c) => { ed.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, c.text);
    if (c.link) { document.execCommand('insertLineBreak'); document.execCommand('insertText', false, c.link); } ed.dispatchEvent(new Event('input', { bubbles: true })); };
  const same = (a, b) => String(a || '').replace(/\s+/g, ' ').trim() === String(b || '').replace(/\s+/g, ' ').trim();
  const cmd = () => P && `node tools/publish/posted.mjs ${P.folder} youtube comment=pinned`;

  window.__wlCommentPrep = async () => {
    try {
      const c = await pinned();
      document.querySelector('video')?.pause();
      for (let k = 0; k < 30 && !document.querySelector('#simplebox-placeholder'); k++) { window.scrollBy(0, 400); await sleep(400); }
      const ph = document.querySelector('#simplebox-placeholder'); if (!ph) return { state: 'error', error: 'comments did not load (video not public yet, or comments off?)' };
      await sleep(1500);
      let th = mine();
      if (th) {
        if (same(th.querySelector('#content-text')?.innerText, c.want)) return { state: 'unchanged', pinned: window.__wlIsPinned(), cmd: cmd() };
        th.scrollIntoView({ block: 'center' }); await sleep(700); return { state: 'edit', menu: at(th.querySelector('#action-menu button')) };
      }
      ph.scrollIntoView({ block: 'center' }); ph.click(); await sleep(900);
      const ed = document.querySelector('#contenteditable-root'); if (!ed) return { state: 'error', error: 'no editor' };
      typeInto(ed, c); await sleep(600); if (!same(ed.innerText, c.want)) return { state: 'error', error: 'text mismatch — not posting' };
      document.querySelector('#submit-button button, #submit-button').click();
      for (let k = 0; k < 40 && !(th = mine()); k++) await sleep(300);
      if (!th) return { state: 'error', error: 'posted? no @word-log comment found — check which account posted it (delete it if it is not word-log)' };
      th.scrollIntoView({ block: 'center' }); await sleep(700);
      return { state: 'posted', menu: at(th.querySelector('#action-menu button')) };
    } catch (e) { return { state: 'error', error: String(e && e.message || e) }; }
  };

  window.__wlMenuItems = () => [...document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item')].filter(e => e.offsetParent).map(e => [e.innerText.trim(), ...at(e)]);

  window.__wlCommentType = async () => {
    try {
      const c = await pinned(), th = mine();
      const ed = th?.querySelector('#contenteditable-root'); if (!ed) return 'no inline editor — click 수정 first';
      typeInto(ed, c); await sleep(600); if (!same(ed.innerText, c.want)) return 'text mismatch — not saving';
      th.querySelector('#submit-button button, #submit-button').click();
      for (let k = 0; k < 30; k++) { await sleep(400); const t = mine(); if (same(t?.querySelector('#content-text')?.innerText, c.want)) return 'updated ' + (window.__wlIsPinned() ? 'pinned · ' + cmd() : 'NOT pinned'); }
      return 'saved? text not confirmed';
    } catch (e) { return 'error: ' + (e && e.message || e); }
  };

  window.__wlIsPinned = () => !!(mine()?.querySelector('#pinned-comment-badge')?.innerText || '').trim();
  window.__wlCommentCheck = async () => { const c = await pinned(); const r = { pinned: window.__wlIsPinned(), text: same(mine()?.querySelector('#content-text')?.innerText, c.want) }; if (r.pinned && r.text) r.cmd = cmd(); return r; };
  return 'studio-comment ready — __wlCommentPrep().then(r => window.__cr = r)';
})();
