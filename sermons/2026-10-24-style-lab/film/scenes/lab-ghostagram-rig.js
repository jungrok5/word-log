/* lab-ghostagram-rig.js — the two figure rigs of lab-ghostagram, COPIED from the house kits (the kits are not edited) and
   restyled for the neon subway: a clean ink outline under every shape, one flat cel colour, one hard shadow tone, and two
   inner neon rim bands (the album's edge light) instead of the kits' offset rim / pencil grain.
     Rig.me(ctx, F, Lt, back, mid)   ← styles/cavesil figure(): 2-bone IK arms and legs with fixed bone lengths, hands drawn
                                       AT their grip points, a hood with a pale profile face; here a long hoodie and chunky sneakers.
     Rig.ghost(ctx, F, Lt, o)        ← styles/graphite drawFig(): the sheet ghost (dome head, sleeves with round mittens, oval
                                       eyes, pink cheeks); here flat lavender-white, sneakers, accessories, a phone in the mittens.
   Poses are the kits' plain data { s, f, gy, hip, ang, feet, hands, hand, tilt, eye, sway } (walk/stand/mix as in the kits).
   Lt = rim lighting { A, B: css colours, vA, vB: [dx, dy] px at s = 1 } — B shows on the edges facing away from vB, A on the
   edges facing away from vA (see cel()). */
(function () {
  const { clamp, lerp } = Pilot; const TAU = Math.PI * 2; const R = {};
  const INK = R.INK = '#0c0722';

  // ---------------- geometry (cavesil / graphite, unchanged) ----------------
  const ik = R.ik = function (a, t, l1, l2, pick) {
    let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy) || 1e-6; const dd = clamp(d, Math.abs(l1 - l2) + .5, l1 + l2 - .5);
    const tx = a[0] + dx / d * dd, ty = a[1] + dy / d * dd, an = Math.atan2(ty - a[1], tx - a[0]), b = Math.acos(clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1));
    const j1 = [a[0] + Math.cos(an + b) * l1, a[1] + Math.sin(an + b) * l1], j2 = [a[0] + Math.cos(an - b) * l1, a[1] + Math.sin(an - b) * l1];
    return [pick(j1, j2), [tx, ty]];
  };
  const frame = R.frame = function (F) {
    const up = [Math.sin(F.ang), -Math.cos(F.ang)], fw = [F.f * Math.cos(F.ang), F.f * Math.sin(F.ang)], s = F.s;
    return { up, fw, P: (a, b) => [F.hip[0] + fw[0] * a * s + up[0] * b * s, F.hip[1] + fw[1] * a * s + up[1] * b * s] };
  };
  const pathOf = R.pathOf = (pts, closed = true) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); if (closed) p.closePath(); return p; };
  const blobPath = R.blobPath = function (pts) {
    const g = new Path2D(), n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m = mid(pts[n - 1], pts[0]); g.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mm = mid(p, q); g.quadraticCurveTo(p[0], p[1], mm[0], mm[1]); }
    g.closePath(); return g;
  };
  const capsule = R.capsule = function (a, b, wa, wb, n = 7) {
    const dx = b[0] - a[0], dy = b[1] - a[1], an = Math.atan2(dy, dx), pts = [];
    for (let i = 0; i <= n; i++) { const q = an + Math.PI / 2 + Math.PI * i / n; pts.push([a[0] + Math.cos(q) * wa / 2, a[1] + Math.sin(q) * wa / 2]); }
    for (let i = 0; i <= n; i++) { const q = an - Math.PI / 2 + Math.PI * i / n; pts.push([b[0] + Math.cos(q) * wb / 2, b[1] + Math.sin(q) * wb / 2]); }
    return pts;
  };
  // graphite's line toolkit (subset): Catmull-Rom resample + variable-width ribbon
  const spline = (P, step = 3) => {
    const n = P.length, get = i => P[clamp(i, 0, n - 1)], out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2), L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < m; j++) { const t = j / m, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
    }
    out.push(P[n - 1].slice()); return out;
  };
  const ribbon = (pts, wf) => {
    const n = pts.length, N = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    const Sx = [0]; for (let i = 1; i < n; i++) Sx.push(Sx[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = Sx[n - 1] || 1, Lf = [], Rt = [], ws = [];
    for (let i = 0; i < n; i++) { const w = Math.max(0, wf(Sx[i] / L)) / 2; ws.push(w); Lf.push([pts[i][0] + N[i][0] * w, pts[i][1] + N[i][1] * w]); Rt.push([pts[i][0] - N[i][0] * w, pts[i][1] - N[i][1] * w]); }
    const p = new Path2D(); p.moveTo(Lf[0][0], Lf[0][1]); for (let i = 1; i < n; i++) p.lineTo(Lf[i][0], Lf[i][1]);
    const ae = Math.atan2(N[n - 1][1], N[n - 1][0]); p.arc(pts[n - 1][0], pts[n - 1][1], ws[n - 1], ae, ae + Math.PI, true);
    for (let i = n - 1; i >= 0; i--) p.lineTo(Rt[i][0], Rt[i][1]);
    const a0 = Math.atan2(N[0][1], N[0][0]); p.arc(pts[0][0], pts[0][1], ws[0], a0 + Math.PI, a0, true);
    p.closePath(); return p;
  };
  R.spline = spline; R.ribbon = ribbon;

  /* cel(ctx, p, base, s, Lt, detail, ow) — the album's cel look for one shape: the ink outline stroked UNDER the fill (so
     overlapping sub-shapes merge into one clean contour), the flat colour, and two neon rim bands inside the edge:
     B where p is not covered by p+vB, then A where p+vB is not covered by p+vB+vA. detail() draws inside the base area. */
  const cel = R.cel = function (ctx, p, base, s, Lt, detail, ow = 2.4) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2 * ow * s; ctx.stroke(p);
    ctx.save(); ctx.clip(p);
    if (Lt) { ctx.fillStyle = Lt.B; ctx.fill(p); ctx.translate(Lt.vB[0] * s, Lt.vB[1] * s); ctx.fillStyle = Lt.A; ctx.fill(p); ctx.translate(Lt.vA[0] * s, Lt.vA[1] * s); }
    ctx.fillStyle = base; ctx.fill(p);
    if (detail) { ctx.clip(p); detail(); }
    ctx.restore();
  };

  // ---------------- the commuter ("me") — styles/cavesil figure() ----------------
  /* hand AT point hd (cavesil handShape + an ink outline): 'fist' closed with a thumb bump and knuckles, 'open' fingers along the forearm */
  function hand(ctx, hd, an, type, f, s, col) {
    let pts;
    if (type === 'open') pts = [[-6, -8], [16, -9], [26, -4], [18, -2], [27, 2], [16, 5], [-2, 9], [-8, 2]].map(([u, v]) => [hd[0] + (Math.cos(an) * u - Math.sin(an) * v) * s, hd[1] + (Math.sin(an) * u + Math.cos(an) * v) * s]);
    else { pts = []; for (let i = 0; i < 10; i++) { const q = i / 10 * TAU; pts.push([hd[0] + Math.cos(q) * 11.5 * s, hd[1] + Math.sin(q) * 10 * s]); }
      pts.splice(7, 0, [hd[0] + Math.cos(an - 1.9 * f) * 14.5 * s, hd[1] + Math.sin(an - 1.9 * f) * 14.5 * s]); }
    cel(ctx, blobPath(pts), col, s, null, null, 1.8);
    if (type === 'fist') { ctx.strokeStyle = 'rgba(60,30,110,.8)'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); for (let i = 0; i < 3; i++) { const q = an + (.45 + i * .45) * f; ctx.moveTo(hd[0] + Math.cos(q) * 4 * s, hd[1] + Math.sin(q) * 4 * s); ctx.lineTo(hd[0] + Math.cos(q) * 9.5 * s, hd[1] + Math.sin(q) * 9.5 * s); } ctx.stroke(); }
  }
  R.hand = hand;
  /* chunky sneaker at the ankle an, toe angle toe (local units: x forward) */
  function sneaker(ctx, an, f, s, toe, Lt, c) {
    const T = (u, v) => { const cu = Math.cos(toe), su = Math.sin(toe); return [an[0] + f * (u * cu - v * su) * s, an[1] + (u * su + v * cu) * s]; };
    const up = [[-15, -2], [-14, -14], [-2, -19], [10, -15], [26, -9], [38, -3], [40, 6], [-17, 6]].map(([u, v]) => T(u, v + 8));
    cel(ctx, blobPath(up), c.shoe, s, Lt, () => {
      ctx.fillStyle = c.sole; ctx.fill(pathOf([[-20, 3], [44, 3], [44, 16], [-20, 16]].map(([u, v]) => T(u, v + 8))));
      ctx.strokeStyle = c.lace; ctx.lineWidth = 2 * s; ctx.beginPath(); const a = T(4, -4 + 8), b = T(20, -2 + 8); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }, 2);
  }
  /* me(ctx, F, Lt, back, mid) — F.col (hoodie), F.colFar (far limbs), F.colNear (near arm), F.colD (hard shadow tone),
     F.skin, F.shoe {shoe, sole, lace}; back() is drawn first (a carried beam rides behind the head and arms) */
  R.me = function (ctx, F, Lt, back, mid) {
    const s = F.s, f = F.f, { P } = frame(F), skin = F.skin;
    const sh = P(4, 136), shF = P(-3, 134);
    const elbowPick = (a, b) => (a[1] - f * a[0] * .35) > (b[1] - f * b[0] * .35) ? a : b, kneePick = (a, b) => f * a[0] > f * b[0] ? a : b;
    const arm = (S0, T, c, type, lt) => {
      if (!T) T = [S0[0] - f * 8 * s, S0[1] + 140 * s];
      const [el, hd] = ik(S0, T, 78 * s, 74 * s, elbowPick);
      const p = new Path2D(); p.addPath(pathOf(capsule(S0, el, 23 * s, 18 * s))); p.addPath(pathOf(capsule(el, hd, 18 * s, 13 * s)));
      cel(ctx, p, c, s, lt);
      hand(ctx, hd, Math.atan2(hd[1] - el[1], hd[0] - el[0]), type, f, s, skin);
    };
    const leg = (T, c, i, lt) => {
      const hp = P(-2, -2), ank = [T[0], T[1] - 8 * s];
      const [kn, an] = ik(hp, ank, 96 * s, 90 * s, kneePick);
      const p = new Path2D(); p.addPath(pathOf(capsule(hp, kn, 22 * s, 17 * s))); p.addPath(pathOf(capsule(kn, an, 17 * s, 14 * s)));
      cel(ctx, p, c, s, lt);
      const lift = Math.max(0, F.gy - T[1]), toe = lift > 6 * s ? .3 : 0;
      sneaker(ctx, an, f, s, f * toe, lt, F.shoe);
    };
    const LtF = Lt && { ...Lt, A: Lt.Af || Lt.A };
    if (back) back();
    arm(shF, F.hands[0], F.colFar, F.hand?.[0] || 'fist', LtF);
    leg(F.feet[0], F.colFar, 0, LtF); leg(F.feet[1], F.colLeg || F.col, 1, Lt);
    // the long hoodie: cavesil's cape silhouette from the shoulders to a soft hem below the knees (trails with the step)
    const hemD = Math.max(40 * s, F.gy - F.hip[1] - 70 * s), sw = (F.sway || 0) * s;
    const skx = (a, b) => [F.hip[0] + f * a * s + sw * b / hemD, F.hip[1] + b];
    const capePts = [P(16, 152), P(29, 118), P(33, 62), P(31, 4), skx(36, hemD * .5), skx(42, hemD - 4), skx(28, hemD + 2), skx(6, hemD - 2), skx(-14, hemD + 2), skx(-34, hemD - 2),
      [F.hip[0] - f * 46 * s + sw * 1.4, F.hip[1] + hemD - 8 * s], skx(-42, hemD * .45), P(-40, 36), P(-37, 96), P(-30, 138), P(-12, 154)];
    const cape = blobPath(capePts);
    cel(ctx, cape, F.col, s, Lt, () => {
      // one hard shadow tone: the back half of the hoodie (away from the light ahead)
      ctx.fillStyle = F.colD; ctx.fill(blobPath([P(-6, 160), P(-12, 100), P(-6, 40), skx(-2, hemD * .5), skx(-8, hemD + 20), skx(-90, hemD + 30), P(-90, 170)]));
      // the hoodie's front pocket seam + drawstring (graphic accents)
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2 * s; ctx.beginPath(); const a = skx(30, 18 * s), b = skx(4, 26 * s), c = skx(-6, 70 * s); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); ctx.stroke();
      const d0 = P(22, 132), d1 = P(25, 92); ctx.strokeStyle = F.cord || '#f6f0ff'; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.stroke();
    });
    if (mid) mid();
    // a hand up on a carried beam: that arm goes behind the head, not across the face (cavesil nearUp)
    const nearUp = !!(F.hands[1] && F.hands[1][1] < sh[1] - 6 * s);
    if (nearUp) arm(sh, F.hands[1], F.colNear, F.hand?.[1] || 'fist', Lt);
    // head on a short neck (cavesil hood head, x forward / y down in head space)
    const tilt = F.ang + (F.tilt || 0), hu = [Math.sin(tilt), -Math.cos(tilt)], hf = [f * Math.cos(tilt), f * Math.sin(tilt)], N = P(6, 146);
    const Hc = [N[0] + hu[0] * 30 * s + hf[0] * 4 * s, N[1] + hu[1] * 30 * s + hf[1] * 4 * s];
    ctx.save(); ctx.transform(hf[0] * s, hf[1] * s, -hu[0] * s, -hu[1] * s, Hc[0], Hc[1]);
    const hood = new Path2D(); hood.arc(-2, -1, 35, 0, TAU); hood.moveTo(-35, 2); hood.quadraticCurveTo(-46, 34, -32, 50); hood.lineTo(16, 48); hood.lineTo(22, 20); hood.closePath();
    // rim offsets live in head space (x forward): flip x for the facing so the bands stay on the same screen side
    const LtH = Lt && { ...Lt, vA: [Lt.vA[0] * f, Lt.vA[1]], vB: [Lt.vB[0] * f, Lt.vB[1]] };
    cel(ctx, hood, F.col, 1, LtH, () => { ctx.fillStyle = F.colD; ctx.beginPath(); ctx.arc(-2, -1, 35, Math.PI * .55, Math.PI * 1.45); ctx.lineTo(-2, -1); ctx.fill(); });
    // the face opening: pale, ghost-like skin; a dark fringe; a dot eye; a small mouth
    const face = new Path2D(); face.ellipse(13, 6, 17, 22, .08, -Math.PI / 2, Math.PI / 2); face.quadraticCurveTo(10, 30, 4, 22); face.lineTo(4, -14); face.closePath();
    const nose = new Path2D(); nose.ellipse(29, 5, 4, 5, .2, 0, TAU);
    ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke(face); ctx.stroke(nose);
    ctx.fillStyle = skin; ctx.fill(face); ctx.fill(nose);
    ctx.save(); ctx.clip(face); ctx.fillStyle = F.skinD; ctx.fillRect(-20, -30, 26, 70); ctx.fillRect(-20, 17, 60, 20); ctx.restore();   // hard shadow under the hood
    ctx.fillStyle = 'rgba(255,110,170,.55)'; ctx.beginPath(); ctx.ellipse(16, 12, 5.5, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-2, -26); ctx.quadraticCurveTo(22, -30, 31, -9); ctx.quadraticCurveTo(22, -14, 16, -10); ctx.quadraticCurveTo(10, -16, 0, -12); ctx.fill();   // fringe
    const eye = F.eye || 'calm'; ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    if (eye === 'strain') { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(19, 2.5); ctx.lineTo(25, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, -7); ctx.lineTo(25, -5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(20, 0, 3.4, 4.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(21.2, -1.6, 1.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(15, -8); ctx.lineTo(25, -7); ctx.stroke(); }
    ctx.lineWidth = 2.2; ctx.beginPath();
    if (F.mouth === 'o') { ctx.ellipse(24, 14, 2.2, 2.8, 0, 0, TAU); ctx.fill(); }
    else { ctx.moveTo(20, 14); ctx.quadraticCurveTo(24, F.mouth === 'soft' ? 15.5 : 12.5, 27, 13); ctx.stroke(); }
    ctx.restore();
    if (!nearUp) arm(sh, F.hands[1], F.colNear, F.hand?.[1] || 'fist', Lt);
  };

  // ---------------- the passengers — styles/graphite drawFig() sheet ghost ----------------
  /* ghost(ctx, F, Lt, o) — F: graphite pose + F.sheet / F.sheetD (flat + hard shadow), F.front (extra hem reach, units: a
     lap over the knees when sitting), F.acc { glasses, cap, phones }, F.look [dx, dy] eye shift (units), F.up {x, y, k}
     a light from below (the phone) as a screen glow, o.mid() drawn between the face and the near sleeve (the phone) */
  R.ghost = function (ctx, F, Lt, o = {}) {
    const s = F.s, f = F.f, { P } = frame(F), SH = F.sheet, SHD = F.sheetD, OW = 2.2;
    if (F.shadow !== false) { ctx.fillStyle = 'rgba(6,3,28,.5)'; ctx.beginPath(); ctx.ellipse(F.hip[0] + f * 10 * s, F.gy + 2 * s, 92 * s, 13 * s, 0, 0, TAU); ctx.fill(); }
    const sh = P(56, 84), shF = P(8, 128);
    const elbowPick = (a, b) => (a[1] - f * a[0] * .35) > (b[1] - f * b[0] * .35) ? a : b, kneePick = (a, b) => f * a[0] > f * b[0] ? a : b;
    const mitten = (hd, el, type) => {
      const an = Math.atan2(hd[1] - el[1], hd[0] - el[0]); let n1 = [-Math.sin(an), Math.cos(an)]; if (n1[1] > 0) n1 = [-n1[0], -n1[1]];
      const p = new Path2D(); p.ellipse(hd[0], hd[1], 12.5 * s, 11.5 * s, an, 0, TAU);
      if (type !== 'flat') p.ellipse(hd[0] + n1[0] * 10 * s + Math.cos(an) * 3 * s, hd[1] + n1[1] * 10 * s + Math.sin(an) * 3 * s, 6.5 * s, 5 * s, an, 0, TAU);
      cel(ctx, p, SH, s, null, null, 1.8);
    };
    const arm = (S0, T, type) => {
      if (!T) T = [S0[0] - f * 8 * s, S0[1] + 140 * s];
      const [el, hd] = ik(S0, T, 78 * s, 74 * s, elbowPick), pts = spline([S0, el, hd], 3);
      const wf = w => u => w * (1 - .45 * u);
      ctx.fillStyle = INK; ctx.fill(ribbon(pts, wf(31 * s)));
      ctx.fillStyle = SH; ctx.fill(ribbon(pts, wf(25.5 * s)));
      ctx.beginPath(); ctx.arc(S0[0], S0[1], 13 * s, 0, TAU); ctx.fill();
      ctx.strokeStyle = SHD; ctx.lineWidth = 2.2 * s; ctx.beginPath(); const a = [lerp(S0[0], el[0], .5), lerp(S0[1], el[1], .5)], b = [lerp(el[0], hd[0], .35), lerp(el[1], hd[1], .35)]; ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(el[0], el[1], b[0], b[1]); ctx.stroke();
      mitten(hd, el, type);
    };
    const leg = (T, lt) => {
      const hp = P(-2, -2), ank = [T[0], T[1] - 9 * s];
      const [kn, an] = ik(hp, ank, 96 * s, 90 * s, kneePick);
      const pts = spline([hp, kn, an], 3); ctx.fillStyle = INK; ctx.fill(ribbon(pts, () => 14 * s)); ctx.fillStyle = F.sock || '#2b1d63'; ctx.fill(ribbon(pts, () => 9 * s));
      const lift = Math.max(0, F.gy - T[1]); sneaker(ctx, an, f, s * .8, f * (lift > 6 * s ? .35 : 0), lt, F.shoe);
    };
    arm(shF, F.hands[0], F.hand?.[0] || 'fist');
    leg(F.feet[0], null); leg(F.feet[1], Lt);
    // the sheet: graphite's dome head + body + scalloped hem; F.front reaches the hem forward over a lap
    const fr = F.front || 0, hemD = Math.max(44 * s, F.gy - F.hip[1] - (F.hemUp ?? 30) * s), sw = (F.sway || 0) * s;
    const skx = (a, b) => [F.hip[0] + f * a * s + sw * b / hemD, F.hip[1] + b];
    const tilt = F.ang + (F.tilt || 0), hu = [Math.sin(tilt), -Math.cos(tilt)], hf = [f * Math.cos(tilt), f * Math.sin(tilt)], N0 = P(2, 128);
    const Q = (a, b) => [N0[0] + (hf[0] * a + hu[0] * b) * s, N0[1] + (hf[1] * a + hu[1] * b) * s];
    const dome = []; for (let i = 0; i <= 16; i++) { const th = lerp(-.12, Math.PI + .12, i / 16); dome.push(Q(Math.cos(th) * 62, 50 + Math.sin(th) * 60)); }
    // F.lap (units forward) / F.lapY: seated or squatting — the sheet runs down the chest, out along the thighs, over the
    // knees and drapes; the shins and sneakers show below it
    const front = F.lap ? [skx(F.lap + 6, hemD * .8), skx(F.lap + 2, (F.lapY ?? -8) + 4), skx(F.lap - 14, (F.lapY ?? -8) - 8), skx(54, Math.min(-12, (F.lapY ?? -8) - 4)), P(60, 50)]
      : [skx(72 + fr, hemD * .5), skx(66 + fr * .7, 0), P(62, 60)];
    const side = spline([...front, ...dome, P(-64, 60), skx(-68, 0), skx(-80, hemD * .45)], 5);
    const hem = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = lerp(-90, F.lap ? F.lap + 6 : 90 + fr, u), y = hemD - 6 * Math.cos(u * 3 * TAU + (F.sway || 0) * 1.6) - 3; hem.push(skx(a, y)); }
    const body = pathOf(side.concat(hem));
    cel(ctx, body, SH, s, Lt, () => {
      ctx.fillStyle = SHD; ctx.fill(blobPath([Q(-22, 120), Q(-34, 60), P(-26, 64), skx(-30, 0), skx(-40, hemD * .6), skx(-42, hemD + 30), skx(-160, hemD + 30), Q(-160, 160)]));
      if (F.up && F.up.k > 0) { const u = F.up, g = ctx.createRadialGradient(u.x, u.y, 4, u.x, u.y, 150 * s); g.addColorStop(0, `rgba(190,252,255,${.95 * u.k})`); g.addColorStop(.4, `rgba(120,215,255,${.42 * u.k})`); g.addColorStop(1, 'rgba(90,160,255,0)');
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(u.x - 160 * s, u.y - 160 * s, 320 * s, 320 * s); ctx.globalCompositeOperation = 'source-over'; }
    }, OW);
    // face: dark oval eyes with a glint (or round sunglasses), pink cheeks
    const lk = F.look || [0, 0], acc = F.acc || {};
    for (const ex of [17, 41]) { const e = Q(ex + lk[0], 58 + lk[1]);
      if (acc.glasses) continue;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(e[0], e[1], 7 * s, (F.eye === 'half' ? 5 : 10) * s, tilt, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(e[0] + 2 * s, e[1] - 3.6 * s, 2.2 * s, 0, TAU); ctx.fill(); }
    for (const ex of [7, 53]) { const e = Q(ex, 36); ctx.fillStyle = 'rgba(255,110,180,.5)'; ctx.beginPath(); ctx.ellipse(e[0], e[1], 9.5 * s, 5.5 * s, tilt, 0, TAU); ctx.fill(); }
    if (F.mouth === 'grin') { const m0 = Q(20, 28), m1 = Q(44, 30); const p = pathOf([m0, Q(32, 24), m1, Q(32, 36)]); cel(ctx, p, '#fff', s, null, () => { ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * s; ctx.beginPath(); for (const a of [26, 32, 38]) { const q0 = Q(a, 24), q1 = Q(a, 36); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); } ctx.stroke(); }, 1.4); }
    else if (F.mouth === 'o') { const m = Q(32, 30); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(m[0], m[1], 4 * s, 5 * s, 0, 0, TAU); ctx.fill(); }
    if (acc.glasses) {   // round sunglasses: two dark lenses, a bridge, a magenta glint
      const a = Q(15, 60), b = Q(43, 60);
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); const tmp = Q(-30, 66); ctx.moveTo(a[0], a[1]); ctx.lineTo(tmp[0], tmp[1]); ctx.stroke();
      for (const c of [a, b]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(c[0], c[1], 12.5 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1a6a'; ctx.beginPath(); ctx.arc(c[0], c[1], 10 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = acc.glint || '#ff6be0'; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.arc(c[0], c[1], 6.5 * s, -2.6, -1.4); ctx.stroke(); }
    }
    if (acc.cap) {   // a cap worn backwards: crown on the dome, the brim behind
      const crown = []; for (let i = 0; i <= 12; i++) { const th = lerp(-.05, Math.PI + .05, i / 12); crown.push(Q(Math.cos(th) * 66, 64 + Math.sin(th) * 50 + 6)); }
      const brim = [Q(-58, 72), Q(-108, 66), Q(-112, 78), Q(-60, 86)];
      cel(ctx, pathOf(brim), acc.cap2 || '#2b2a8f', s, null, null, 2);
      cel(ctx, pathOf(crown), acc.cap, s, Lt, () => { ctx.fillStyle = 'rgba(30,10,80,.35)'; ctx.fill(pathOf([Q(-70, 70), Q(-10, 70), Q(-10, 130), Q(-70, 130)])); const b = Q(0, 116); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b[0], b[1], 4 * s, 0, TAU); ctx.fill(); }, 2);
    }
    if (acc.phones) {   // over-ear headphones: a band over the dome and a cup on the near side
      const band = []; for (let i = 0; i <= 14; i++) { const th = lerp(.25, Math.PI - .25, i / 14); band.push(Q(Math.cos(th) * 52 - 8, 50 + Math.sin(th) * 66)); }
      ctx.strokeStyle = INK; ctx.lineWidth = 9 * s; ctx.beginPath(); band.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = acc.phones; ctx.lineWidth = 5 * s; ctx.stroke();
      const c = Q(-30, 50); const cup = new Path2D(); cup.roundRect(c[0] - 13 * s, c[1] - 19 * s, 26 * s, 38 * s, 11 * s);
      cel(ctx, cup, '#2a1f7a', s, null, () => { ctx.fillStyle = acc.phones; ctx.fillRect(c[0] + 4 * s, c[1] - 19 * s, 9 * s, 38 * s); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(c[0] - 9 * s, c[1] - 12 * s, 3 * s, 10 * s); }, 2);
    }
    if (o.mid) o.mid();
    arm(sh, F.hands[1], F.hand?.[1] || 'fist');
  };
  window.Rig = R;
})();
