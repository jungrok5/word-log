// Paste-in helper for threads.com to schedule the film's video post from /plan.json (upload.md "## 스레드" — or, when
// that section is missing, the Instagram caption with the sermon link added and one topic tag: Threads links are
// clickable and Threads takes one topic tag per post). Needs: node tools/publish/serve.mjs sermons/<folder> --scene <id>;
// files come through the relay popup (tools/publish/relay.html) like meta-reels.js, since threads.com's CSP blocks 127.0.0.1.
// First check the signed-in Threads profile is word-log's, and the PC is on Korea time.
// Per post (what worked on one-scroll-bible, 2026-10-23, 21 posts):
//   0. paste this, real click WL RELAY → await __loadPlan()
//   1. real click the "+" composer · real click the text box · TYPE __plan.threads.caption (real keystrokes) · Escape
//   2. await __attach(); wait ~8-12 s (upload) · __capOk() === 'caption ok'
//   3. real click the composer's ⋯ · __press(__menuItem()) (a synthetic pointer press opens "예약…"; a plain click often
//      did nothing) · await __waitCal()
//   4. __focusT('hh') + type __plan.threads.hh · __focusT('mm') + type __plan.threads.mm — never click the time fields by
//      coordinate: when the click missed, the digits went into the caption ("#성경1900"); fix with Backspace first
//   5. await __pickDate() (pages "다음 달" itself; cells are role=gridcell whose text starts "YYYY년 M월 D일 ") · __dateOk().ok
//   6. in a SEPARATE tool call: real click 완료 (a 6-row month moves it ~31 px down) · __bannerOk() checks
//      "… 오후 7:00 GMT+9에 게시 예정" · real click 예약 → run the printed cmd.
//      Clicking 완료 right after the date pick in the same batch often closed the picker without saving.
// Check: composer → 임시 저장본 lists every scheduled post with its time.
// Ported from one-scroll-bible motion/social/threads-reels.js — one post per film, time from the plan instead of 19:00.
(() => {
  const SRV = 'http://127.0.0.1:8766', sleep = ms => new Promise(r => setTimeout(r, ms));
  const oc = HTMLInputElement.prototype.click;
  if (!window.__fiHook) { window.__fiHook = 1; HTMLInputElement.prototype.click = function () { if (this.type === 'file') { window.__fi = this; return; } return oc.call(this); }; }
  window.__relay = window.__relay || { pend: {}, ready: false, win: null };
  if (!window.__relayL) { window.__relayL = 1; addEventListener('message', e => {
    if (e.origin !== SRV || !e.data) return; const R = window.__relay;
    if (e.data.wl === 'ready') R.ready = true;
    else if (e.data.wl === 'file' || e.data.wl === 'err') { const p = R.pend[e.data.id]; if (p) { delete R.pend[e.data.id]; e.data.wl === 'file' ? p.res(e.data) : p.rej(new Error(e.data.msg)); } }
  }); }
  window.__get = path => new Promise((res, rej) => { if (!window.__relay.win) return rej(new Error('click WL RELAY first'));
    const id = Math.random().toString(36).slice(2); window.__relay.pend[id] = { res, rej };
    window.__relay.win.postMessage({ wl: 'get', id, path }, SRV); setTimeout(() => rej(new Error('relay timeout ' + path)), 120000); });
  window.__putR = async (path, name, type, input) => { const d = await window.__get(path);
    const f = new File([d.buf], name, { type }), dt = new DataTransfer(); dt.items.add(f);
    input.files = dt.files; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
    return name + ' ' + (f.size / 1e6).toFixed(1) + 'MB'; };
  window.__loadPlan = async () => {
    const d = await window.__get('plan.json'), p = JSON.parse(new TextDecoder().decode(d.buf));
    if (p.error) throw new Error('plan.json: ' + p.error);
    if (!p.ready.threads) throw new Error('Threads not ready: ' + p.problems.threads.join(' / '));
    if (!p.schedulable) throw new Error(`cannot schedule at ${p.kst} — restart serve.mjs with --at`);
    if (p.posted.threads?.status && p.posted.threads.status !== 'deleted') throw new Error(`posted.json already has Threads: ${p.posted.threads.status}`);
    if (!(Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Seoul' || new Date().getTimezoneOffset() === -540)) throw new Error('this PC is not on Korea time');
    window.__plan = p; return `${p.folder} · ${p.scene} · ${p.kst} — type __plan.threads.caption`;
  };
  const P = () => { if (!window.__plan) throw new Error('await __loadPlan() first'); return window.__plan; };
  const T = () => P().threads;
  window.__press = el => { const r = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); el.dispatchEvent(new MouseEvent('click', o)); };
  window.__menuItem = () => { const it = [...document.querySelectorAll('[role=button],[role=menuitem],div')].filter(e => e.offsetParent !== null && /^예약…?\.*$/.test(e.textContent.trim())); return it[it.length - 1]; };
  window.__attach = async () => { const i = [...document.querySelectorAll('input[type=file]')].find(x => x.accept.includes('video')); if (!i) return 'no input';
    return await window.__putR('video.mp4', P().video.name, 'video/mp4', i); };
  window.__capOk = () => { const ed = document.querySelector('[contenteditable=true]'), t = ed ? ed.innerText.replace(/\n\n\n/g, '\n\n').trim() : '';
    return t === T().caption.trim() ? 'caption ok' : 'MISMATCH ' + JSON.stringify(t); };
  window.__waitCal = async () => { for (let i = 0; i < 15; i++) { if (document.querySelector('[role=gridcell]')) return 'calendar open'; await sleep(200); } throw new Error('calendar not open'); };
  window.__focusT = k => { const el = document.querySelector(`input[placeholder="${k}"]`); if (!el) throw new Error('no ' + k + ' input'); el.focus(); el.select(); return 'focused ' + k + ' — type ' + T()[k]; };
  const cell = (y, m, d) => [...document.querySelectorAll('[role=gridcell]')].find(c => c.textContent.startsWith(`${y}년 ${m}월 ${d}일 `));
  window.__pickDate = async () => { const { y, m, d } = T();
    for (let i = 0; i < 3 && !cell(y, m, d); i++) { window.__press(document.querySelector('[aria-label="다음 달"]')); await sleep(600); }
    const c = cell(y, m, d); if (!c) return 'no cell'; (c.firstElementChild || c).click(); await sleep(400);
    return 'picked ' + c.textContent + (c.textContent.includes('선택됨') ? ' (selected)' : ''); };
  window.__dateOk = () => { const { y, m, d, hh, mm } = T(), c = cell(y, m, d), vh = document.querySelector('input[placeholder="hh"]')?.value, vm = document.querySelector('input[placeholder="mm"]')?.value;
    return { ok: !!c && c.textContent.includes('선택됨') && vh === hh && vm === mm, hh: vh, mm: vm, want: `${hh}:${mm}` }; };
  window.__bannerOk = () => { const { m, d, wd, banner } = T(), w = '일월화수목금토'[wd] + '요일', b = (document.body.innerText.match(/[^\n]*게시 예정/) || [''])[0];
    if (!b.includes(banner) || !(b.includes(w) || b.includes(`${m}월 ${d}일`) || b.startsWith('내일'))) throw new Error('banner: ' + b + ' — want ' + banner);
    if (window.__capOk() !== 'caption ok') throw new Error(window.__capOk());
    const p = P(); return b + ` — real click 예약, then: node tools/publish/posted.mjs ${p.folder} threads --scene ${p.scene} status=scheduled at=${p.at} via=web`; };
  let b = document.getElementById('wlRelayBtn');
  if (!b) { b = document.createElement('button'); b.id = 'wlRelayBtn'; b.textContent = 'WL RELAY';
    b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;padding:12px 18px;background:#c00;color:#fff;font:16px sans-serif';
    b.onclick = () => { window.__relay.win = window.open(SRV + '/relay.html', 'wlrelay', 'width=320,height=120'); }; document.body.appendChild(b); }
  return 'threads helper ready — real click WL RELAY, then await __loadPlan()';
})();
