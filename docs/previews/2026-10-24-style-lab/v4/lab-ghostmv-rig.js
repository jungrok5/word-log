/* lab-ghostmv-rig.js — "me" for lab-ghostmv: the mograph kit's code figure (styles/mograph/kit.js — ik2, rig copied verbatim;
   the kit is not edited) drawn in the MV's cel look: a bold even ink outline under every shape, one flat colour, ONE hard
   shadow step, flatnight-style neon rim bands inside the edges (cyan top/back, magenta front → amber in the station), a dark
   indigo hoodie with hood strings, black hair, a pale face with tired half-lidded eyes (they lift and open on the look).
   MV.rig(pose) → joints (local y-up px, x forward); MV.drawMe(ctx, rig, o) draws it at screen (o.x, o.y) scale o.s.
   Limited animation lives in the caller (poses sampled at 8 fps) + o.f8 (the drawing index: bangs and strings ping-pong). */
(function () {
  const { clamp, lerp, eio } = Pilot; const TAU = Math.PI * 2; const M = {};
  const INK = M.INK = '#120a24';

  // ---------------- mograph rig (verbatim) ----------------
  const BODY = { thigh: 210, shin: 205, ankle: 14, torso: 235, neck: 18, head: 70, ua: 165, fa: 155, hand: 28, hipW: 10, stride: 80, lift: 46 };
  M.BODY = BODY;
  M.ik2 = function (root, target, l1, l2, bend) {
    let dx = target[0] - root[0], dy = target[1] - root[1], d = Math.hypot(dx, dy);
    const dmax = (l1 + l2) * .9995, dmin = Math.abs(l1 - l2) + 1e-3;
    if (d > dmax || d < dmin) { const k = clamp(d, dmin, dmax) / (d || 1); dx *= k; dy *= k; d = Math.hypot(dx, dy); }
    const a = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * bend;
    const mid = [root[0] + l1 * Math.cos(a + A), root[1] + l1 * Math.sin(a + A)];
    return [mid, [root[0] + dx, root[1] + dy]];
  };
  M.rig = function (P = {}) {
    const B = BODY, wa = P.walkAmt ?? (P.walk != null ? 1 : 0), ma = P.marchAmt ?? (P.march != null ? 1 : 0), kn = eio(P.kneel || 0);
    const S = B.stride, ph = (P.walk || 0) / (4 * S);
    const legFoot = (q, side) => {
      q = ((q % 1) + 1) % 1; let x, y;
      if (q < .5) { x = S * (1 - 4 * q); y = 0; } else { const v = (q - .5) / .5; x = -S + 2 * S * eio(v); y = B.lift * Math.sin(Math.PI * v); }
      const st = side ? -16 : 16;
      let fx = lerp(st, x, wa), fy = y * wa;
      if (ma > 0) { const m = (((P.march || 0) + (side ? .5 : 0)) % 1 + 1) % 1, up = m < .5 ? Math.sin(Math.PI * m / .5) : 0; fy += 70 * up * ma; fx += 18 * up * ma; }
      return [fx, fy + B.ankle];
    };
    let hipY = B.thigh + B.shin + B.ankle - 4 + (P.bounce || 0);
    hipY += 7 * Math.cos(4 * Math.PI * (ph - .25)) * wa;
    if (ma > 0) hipY -= 10 * Math.abs(Math.sin(2 * Math.PI * (P.march || 0))) * ma;
    let hip = [0, hipY], fN = legFoot(ph, 0), fF = legFoot(ph + .5, 1);
    if (kn > 0) {
      hip = [lerp(hip[0], -10, kn), lerp(hip[1], 250, kn)];
      const st = Math.sin(Math.PI * kn) * 40;
      fN = [lerp(fN[0], 150, kn), lerp(fN[1], 14, kn) + st]; fF = [lerp(fF[0], -210, kn), lerp(fF[1], 40, kn) + st];
    }
    const [kN, aN] = M.ik2(hip, fN, B.thigh, B.shin, 1), [kF, aF] = M.ik2(hip, fF, B.thigh, B.shin, 1);
    const lean = (P.lean || 0) + .04 * wa, td = [Math.sin(lean), Math.cos(lean)];
    const sh = [hip[0] + td[0] * B.torso, hip[1] + td[1] * B.torso];
    const neck = [sh[0] + td[0] * B.neck, sh[1] + td[1] * B.neck];
    const hl = lean * .55 - (P.look || 0), hd = [Math.sin(hl), Math.cos(hl)];
    const head = [neck[0] + hd[0] * (B.head - 6), neck[1] + hd[1] * (B.head - 6)];
    const arm = (side, grip, amt) => {
      const s0 = [sh[0] + (side ? -8 : 0), sh[1] - 6];
      const sw = (P.swing || 0) + (-Math.cos(2 * Math.PI * (ph + (side ? .5 : 0))) * .42 * (P.armSwing ?? wa)), ch = P.cheer || 0;
      let ua = lerp(-Math.PI / 2 + sw, side ? .45 : -.1, ch);
      const fa = ua + lerp(.32 + .25 * Math.max(0, sw), side ? .55 : .9, ch);
      const el = [s0[0] + Math.cos(ua) * B.ua, s0[1] + Math.sin(ua) * B.ua];
      let hand = [el[0] + Math.cos(fa) * (B.fa + B.hand * .5), el[1] + Math.sin(fa) * (B.fa + B.hand * .5)];
      if (grip && amt > 0) hand = [lerp(hand[0], grip[0], eio(amt)), lerp(hand[1], grip[1], eio(amt))];
      const [e, hnd] = M.ik2(s0, hand, B.ua, B.fa + B.hand * .5, -1);
      return { s: s0, e, h: hnd };
    };
    return { hip, kN, aN, kF, aF, sh, neck, head, hd, td, lean, aNear: arm(0, P.reach, P.reachAmt ?? (P.reach ? 1 : 0)),
      aFar: arm(1, P.reachFar, P.reachFarAmt ?? (P.reachFar ? 1 : 0)), face: P.face ?? 1, look: P.look || 0, blink: P.blink || 0, mouth: P.mouth ?? .3 };
  };

  // ---------------- colours ----------------
  M.C = { hood: '#2c2068', hoodD: '#1b1348', hoodF: '#211857', cuff: '#ff2a85', cord: '#f3ecff', pants: '#261c52', pantsD: '#181038', pantsF: '#1d1544',
    shoe: '#f6f2ff', shoeF: '#d6cdf0', shoe2: '#ff2a85', skin: '#f4ecff', skinD: '#c9b5ef', blush: '#ff7ab4', hair: '#17102e', shine: '#00f0ff', eyeW: '#fdfaff' };

  // capsule-chain outline as ONE path (all sub-shapes wound the same way so nonzero fill/clip = their union)
  function capPath(pts) {
    const p = new Path2D(), quad = q => { let a = 0; for (let i = 0; i < 4; i++) { const u = q[i], v = q[(i + 1) % 4]; a += u[0] * v[1] - v[0] * u[1]; } if (a < 0) q.reverse(); p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) p.lineTo(q[i][0], q[i][1]); p.closePath(); };
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0, w0] = pts[i], [x1, y1, w1] = pts[i + 1], a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
      quad([[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]]); }
    for (const [x, y, w, flat] of pts) if (!flat) { p.moveTo(x + w / 2, y); p.arc(x, y, w / 2, 0, TAU); }
    return p;
  }
  M.capPath = capPath;
  const ell = (x, y, rx, ry, r = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, r, 0, TAU); return p; };
  const quadPath = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const q = pts[i], n = pts[(i + 1) % pts.length]; p.quadraticCurveTo(q[0], q[1], (q[0] + n[0]) / 2, (q[1] + n[1]) / 2); } p.closePath(); return p; };

  /* drawMe(ctx, r, o): o = { x, y (screen point of the ground anchor), s (scale: 820 rig px = figure height), lw (outline px on
     screen), Lt { A, B, vA, vB } (rim colours + screen offsets), glow (css: draw only a glowing silhouette — for the bloom
     pass), f8 (drawing index), open (eye 0..1), pupil [dx, dy], mouth 'flat'|'o'|'soft', warmFace 0..1, back(shape) (an
     object behind the body, local coords), C (colours) } */
  M.drawMe = function (ctx, r, o) {
    const C = Object.assign({}, M.C, { eyeW: '#ffffff' }, o.C || {}), s = o.s, fc = r.face, LW = (o.lw || 5) / s, GLOW = o.glow, Lt = o.Lt;
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(fc * s, -s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const loc = v => [v[0] / (fc * s), -v[1] / s];
    let rot = 0;   // extra rotation of the current local frame (head space), so rim offsets stay in screen directions
    const rimV = v => { const l = loc(v), c = Math.cos(-rot), sn = Math.sin(-rot); return [l[0] * c - l[1] * sn, l[0] * sn + l[1] * c]; };
    const shape = (p, fill, rim = true, detail) => {
      if (GLOW) { if (rim) { ctx.strokeStyle = GLOW; ctx.lineWidth = LW * 3.2; ctx.stroke(p); } ctx.fillStyle = '#000'; ctx.fill(p); return; }   // halo outside, interiors blocked
      ctx.strokeStyle = INK; ctx.lineWidth = LW * 2; ctx.stroke(p);
      ctx.save(); ctx.clip(p);
      if (rim && Lt) { const vB = rimV(Lt.vB), vA = rimV(Lt.vA); ctx.fillStyle = Lt.B; ctx.fill(p); ctx.translate(vB[0], vB[1]); ctx.fillStyle = Lt.A; ctx.fill(p); ctx.translate(vA[0], vA[1]); }
      ctx.fillStyle = fill; ctx.fill(p);
      if (detail) { ctx.clip(p); detail(); }
      ctx.restore();
    };
    M._shape = shape;
    if (o.back) o.back(shape, LW);
    const f8 = o.f8 || 0, pp = [0, 1, 2, 1][f8 % 4];   // ping-pong drawing index
    const shoe = (a, far) => {
      const tilt = clamp((a[1] - BODY.ankle) / 60, 0, 1) * -.35, c = Math.cos(tilt), sn = Math.sin(tilt), P = (x, y) => [a[0] + x * c - y * sn, a[1] - 10 + x * sn + y * c];
      const pts = [P(-34, -4), P(86, -4), P(96, 18), P(74, 44), P(18, 50), P(-36, 34)], p = new Path2D(); p.moveTo(...pts[0]); for (const q of pts.slice(1)) p.lineTo(...q); p.closePath();
      shape(p, far ? C.shoeF : C.shoe, !far, () => { ctx.fillStyle = C.shoe2; const q0 = P(-36, -4), q1 = P(90, -4), q2 = P(92, 8), q3 = P(-36, 8); ctx.beginPath(); ctx.moveTo(...q0); ctx.lineTo(...q1); ctx.lineTo(...q2); ctx.lineTo(...q3); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = LW * .7; ctx.beginPath(); const z0 = P(26, 26), z1 = P(64, 34); ctx.moveTo(...z0); ctx.lineTo(...z1); ctx.stroke(); });
    };
    const leg = (k, a, far) => {
      shoe(a, far);
      shape(capPath([[r.hip[0], r.hip[1], 84], [k[0], k[1], 78], [a[0] - 6, a[1] + 20, 90, 1]]), far ? C.pantsF : C.pants, !far, far ? null : () => {
        ctx.fillStyle = C.pantsD; ctx.beginPath(); ctx.moveTo(r.hip[0] - 60, r.hip[1] + 40); ctx.lineTo(r.hip[0] - 10, r.hip[1]); ctx.lineTo(k[0] - 14, k[1]); ctx.lineTo(a[0] - 20, a[1] + 20); ctx.lineTo(a[0] - 80, a[1]); ctx.closePath(); ctx.fill(); });
    };
    const armDraw = (A, far, type) => {
      const dx = A.h[0] - A.e[0], dy = A.h[1] - A.e[1], dl = Math.hypot(dx, dy) || 1, wr = [A.h[0] - dx / dl * (BODY.hand * .5 + 4), A.h[1] - dy / dl * (BODY.hand * .5 + 4)];
      shape(capPath([[A.s[0], A.s[1], 58], [A.e[0], A.e[1], 50], [wr[0], wr[1], 46]]), far ? C.hoodF : C.hood, !far);
      const cf = [wr[0] - dx / dl * 14, wr[1] - dy / dl * 14];
      shape(capPath([[cf[0], cf[1], 47], [wr[0], wr[1], 47]]), C.cuff, false);
      // the hand AT its point: a fist (thumb bump) or open
      const an = Math.atan2(dy, dx), hr = BODY.hand * .64, hp = new Path2D();
      hp.moveTo(A.h[0] + hr, A.h[1]); hp.arc(A.h[0], A.h[1], hr, 0, TAU);
      if (type === 'open') for (const k of [-.5, 0, .5]) { const fx = A.h[0] + Math.cos(an + k) * hr * 1.5, fy = A.h[1] + Math.sin(an + k) * hr * 1.5; hp.moveTo(fx + hr * .45, fy); hp.arc(fx, fy, hr * .45, 0, TAU); }
      else { const tx = A.h[0] + Math.cos(an + 1.7) * hr * .95, ty = A.h[1] + Math.sin(an + 1.7) * hr * .95; hp.moveTo(tx + hr * .5, ty); hp.arc(tx, ty, hr * .5, 0, TAU); }
      shape(hp, far ? C.skinD : C.skin, false);
    };
    // far side first
    armDraw(r.aFar, 1, o.handFar); leg(r.kF, r.aF, 1); leg(r.kN, r.aN, 0);
    const T = (v, u) => [r.hip[0] + r.td[0] * u + r.td[1] * v, r.hip[1] + r.td[1] * u - r.td[0] * v];
    const body = quadPath([T(-78, -40), T(84, -40), T(88, 20), T(76, 170), T(52, 228), T(14, 248), T(-40, 250), T(-80, 214), T(-86, 120)]);
    shape(body, C.hood, true, () => {
      ctx.fillStyle = C.hoodD; ctx.beginPath(); ctx.moveTo(...T(-120, -60)); ctx.lineTo(...T(-14, -60)); ctx.lineTo(...T(-4, 110)); ctx.lineTo(...T(-26, 280)); ctx.lineTo(...T(-120, 280)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.hoodD; ctx.beginPath(); ctx.moveTo(...T(-90, -40)); ctx.lineTo(...T(96, -40)); ctx.lineTo(...T(96, -14)); ctx.lineTo(...T(-90, -14)); ctx.closePath(); ctx.fill();   // rib hem
      ctx.strokeStyle = INK; ctx.lineWidth = LW * .7; ctx.beginPath(); ctx.moveTo(...T(-80, -14)); ctx.lineTo(...T(86, -14)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...T(10, 30)); ctx.quadraticCurveTo(...T(40, 90), ...T(80, 70)); ctx.stroke();   // pocket
    });
    if (!GLOW) {   // hood strings: two drawings ping-pong (limited animation)
      const sw = [-6, 4, 12][pp];
      for (const [v0, k] of [[40, 0], [58, 1]]) { const a = T(v0, 232), b = T(v0 + 6 + sw * (k ? .7 : 1), 146 - k * 10), m = T(v0 + 2 + sw * .4, 190);
        ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.9 + 6; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(...m, ...b); ctx.stroke();
        ctx.strokeStyle = C.cord; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = C.cord; ctx.strokeStyle = INK; ctx.lineWidth = LW * .8; ctx.beginPath(); ctx.arc(b[0], b[1], 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
    shape(ell(...T(-46, 246), 54, 31, Math.atan2(r.td[1], r.td[0]) - Math.PI / 2 - .3), C.hood, true, () => { ctx.fillStyle = C.hoodD; ctx.fillRect(T(-46, 246)[0] - 80, T(-46, 246)[1] - 60, 160, 50); });   // the hood (down)
    if (o.nearBehind) armDraw(r.aNear, 0, o.handNear);   // a hand up on a carried beam: the arm goes behind the head, not across the face
    // head
    const hdA = Math.atan2(r.hd[0], r.hd[1]);
    ctx.save(); ctx.translate(r.head[0], r.head[1]); ctx.rotate(-hdA); rot = -hdA * fc;
    if (!GLOW) { ctx.fillStyle = C.skinD; ctx.beginPath(); ctx.ellipse(14, -50, 20, 26, 0, 0, TAU); ctx.fill(); }   // neck (in the head's shade)
    const hb = [0, 3, -2][pp];
    const hair = quadPath([[-72, -50], [-86, 30], [-40, 72], [12, 94], [54, 64], [70, 28], [64, 0], [-30, -62]]);
    shape(hair, C.hair, true);
    const face = new Path2D(); face.moveTo(-8, 40); face.quadraticCurveTo(66, 52, 70, 2); face.quadraticCurveTo(76, -10, 70, -16); face.quadraticCurveTo(72, -44, 40, -60); face.quadraticCurveTo(0, -70, -14, -40); face.closePath();
    shape(face, C.skin, false, () => {
      ctx.fillStyle = C.skinD;   // one hard shadow step: under the bangs and the back of the jaw
      ctx.beginPath(); ctx.moveTo(-30, 60); ctx.lineTo(80, 60); ctx.lineTo(80, 24); ctx.quadraticCurveTo(40, 30, 10, 18); ctx.lineTo(-30, 20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20, 30); ctx.quadraticCurveTo(6, -10, 0, -70); ctx.lineTo(-30, -70); ctx.closePath(); ctx.fill();
      if (o.warmFace > 0) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,160,70,${.55 * o.warmFace})`; ctx.fillRect(-40, -80, 140, 160); ctx.globalCompositeOperation = 'source-over'; }
    });
    if (!GLOW) {
      ctx.fillStyle = C.blush; ctx.globalAlpha = .5; ctx.beginPath(); ctx.ellipse(48, -24, 12, 6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      // the eye: white, a dot pupil, a heavy upper lid (tired → lifts on the look), a dark circle under it
      const open = clamp(o.open ?? .6, 0, 1), pu = o.pupil || [0, 0], E = [40, 2], rx = 13, ry = 17, lidY = E[1] - ry + 2 * ry * open;
      if (open > .05) { ctx.save(); const ew = ell(E[0], E[1], rx, ry); ctx.clip(ew); ctx.fillStyle = C.eyeW; ctx.fill(ew);
        ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(E[0] + 2 + pu[0], E[1] - 1 + pu[1], 7.5, 9.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(E[0] + 5 + pu[0], E[1] + 3.5 + pu[1], 2.8, 0, TAU); ctx.fill();
        ctx.fillStyle = C.skinD; ctx.fillRect(E[0] - 20, lidY, 40, 40); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(E[0] - 30, E[1] - 40, 60, lidY - E[1] + 40); ctx.clip();
        ctx.strokeStyle = INK; ctx.lineWidth = LW * .8; ctx.beginPath(); ctx.ellipse(E[0], E[1], rx, ry, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.5; ctx.beginPath(); ctx.moveTo(E[0] - rx - 4, lidY - 1); ctx.quadraticCurveTo(E[0], lidY + 4, E[0] + rx + 5, lidY - 3); ctx.stroke();   // the lid line
      ctx.strokeStyle = 'rgba(110,60,170,.75)'; ctx.lineWidth = LW * .7; ctx.beginPath(); ctx.moveTo(E[0] - 8, E[1] - ry - 4); ctx.quadraticCurveTo(E[0] + 2, E[1] - ry - 8, E[0] + 12, E[1] - ry - 3); ctx.stroke();   // dark circle
      ctx.strokeStyle = INK; ctx.lineWidth = LW * .8; ctx.beginPath(); ctx.moveTo(68, -8); ctx.lineTo(74, -16); ctx.lineTo(68, -18); ctx.stroke();   // nose tick
      ctx.lineWidth = LW * .9; ctx.beginPath();
      if (o.mouth === 'o') { ctx.fillStyle = '#4a1430'; ctx.ellipse(56, -38, 5, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (o.mouth === 'soft') { ctx.moveTo(48, -36); ctx.quadraticCurveTo(56, -42, 64, -35); ctx.stroke(); }
      else { ctx.moveTo(48, -38); ctx.lineTo(63, -37); ctx.stroke(); }
    }
    const bangs = new Path2D(); bangs.moveTo(-44, 50); bangs.quadraticCurveTo(10, 100, 68, 60); bangs.lineTo(74, 26 + hb); bangs.lineTo(56, 38); bangs.lineTo(50, 14 + hb); bangs.lineTo(34, 34); bangs.lineTo(22, 18 - hb); bangs.lineTo(-2, 38); bangs.quadraticCurveTo(-30, 30, -44, 0); bangs.closePath();
    shape(bangs, C.hair, true, () => { ctx.strokeStyle = C.shine; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-24, 66); ctx.quadraticCurveTo(4, 82, 34, 76); ctx.stroke(); });
    ctx.restore(); rot = 0;
    if (!o.nearBehind) armDraw(r.aNear, 0, o.handNear);
    ctx.restore();
  };
  window.MV = M;
})();
