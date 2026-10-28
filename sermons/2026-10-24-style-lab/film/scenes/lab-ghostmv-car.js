/* lab-ghostmv-car.js — the neon subway car of lab-ghostagram (its scene file is left untouched), rebuilt so any camera can
   look down it: Car(cam) → { bg, pr, WINP, FLOORP, drawWindows, drawTube, drawStraps, floorLights }.
   cam = { FOC, VX, VY, E (eye height above the floor, m), cx, cz (camera offset, m), zn (nearest z drawn) }.
   Coordinates are lab-ghostagram's: x across (± HW), y with the floor at −1.5 (as if the eye were 1.5 m up), z down the car. */
(function () {
  const { lerp, ss } = Pilot, W = 1080, H = 1920, TAU = Math.PI * 2;
  const HW = 1.45, FL = -1.5, WT = .42, CL = .80, CX = .98, ZE = 21;
  const SEG = [['bench', .6, 3.9], ['door', 4.0, 5.3], ['bench', 5.45, 9.55], ['door', 9.7, 11.0], ['bench', 11.15, 15.25], ['door', 15.4, 16.7], ['bench', 16.85, ZE]];
  const INK = '#120a24';
  const COL = {
    navy: '#0a0827', ceil: '#2b2378', ceil2: '#3d2f9c', cove: '#4a35b4', wall: '#3e1f5c', wall2: '#2a1546', kick: '#22123c',
    win: '#100c3a', door: '#5a3a9a', doorD: '#3a2470', seat: '#c0307a', seatF: '#7a1f5a', seatB: '#9a2a70', floor: '#2a1650', floor2: '#5a2f8c',
    pole: '#c9d2ff', rail: '#9fb0ff', strap: '#ff2a85', strapB: '#ff7ab4',
  };
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const P2 = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
  const grad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };

  window.Car = function (cam) {
    const { FOC, VX, VY } = cam, E = cam.E ?? 1.5, cx = cam.cx || 0, cz = cam.cz || 0, zn = cam.zn ?? .45;
    const pr = (x, y, z) => { const zz = Math.max(.04, z - cz); return [VX + FOC * (x - cx) / zz, VY - FOC * (y + 1.5 - E) / zz]; };
    const wallQ = (sd, y0, y1, z0, z1) => [pr(sd * HW, y0, z0), pr(sd * HW, y1, z0), pr(sd * HW, y1, z1), pr(sd * HW, y0, z1)];
    const lwz = (k, z) => Math.max(.7, k * 2.75 * (FOC / 900) / Math.max(.2, z - cz));
    function edge(g, a, z0, z1, k = 2.6, col = INK) {
      const n = Math.max(2, Math.ceil((z1 - z0) / .5)); g.strokeStyle = col; g.lineCap = 'round';
      for (let i = 0; i < n; i++) { const za = lerp(z0, z1, i / n), zb = lerp(z0, z1, (i + 1) / n), p = a(za), q = a(zb); g.lineWidth = lwz(k, za); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
    }
    const vline = (g, x, y0, y1, z, k = 2.6) => { const a = pr(x, y0, z), b = pr(x, y1, z); g.strokeStyle = INK; g.lineWidth = lwz(k, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    const C = {};
    // ---------------- the static car ----------------
    const bg = Pilot.canvas(W, H), g = bg.getContext('2d'); g.lineJoin = 'round'; const LATE = [];
    g.fillStyle = COL.navy; g.fillRect(0, 0, W, H);
    const e = (x, y) => pr(x, y, ZE);
    poly(g, [e(-HW, FL), e(-HW, WT), e(-CX, CL), e(CX, CL), e(HW, WT), e(HW, FL)]); g.fillStyle = '#5a2f8c'; g.fill();
    poly(g, [e(-.42, FL), e(-.42, .45), e(.42, .45), e(.42, FL)]); g.fillStyle = '#6a3aa8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.4; g.stroke();
    poly(g, [e(-.3, -.3), e(-.3, .35), e(.3, .35), e(.3, -.3)]); g.fillStyle = '#1a1350'; g.fill(); g.stroke();
    poly(g, [pr(-CX, CL, zn), pr(CX, CL, zn), pr(CX, CL, ZE), pr(-CX, CL, ZE)]);
    g.fillStyle = grad(g, 0, 0, 0, VY, [[0, '#1a0f3c'], [.7, '#2e1a5e'], [1, '#4a2a86']]); g.fill();
    for (const sd of [-1, 1]) {
      poly(g, [pr(sd * CX, CL, zn), pr(sd * HW, WT, zn), pr(sd * HW, WT, ZE), pr(sd * CX, CL, ZE)]); g.fillStyle = grad(g, 0, 0, 0, VY, [[0, '#26144a'], [1, '#4a2a86']]); g.fill();
      for (let z = 1.9; z < ZE - .5; z += 1.6) { if (z - cz < .3) continue;
        poly(g, [pr(sd * .38, CL - .005, z), pr(sd * .7, CL - .005, z), pr(sd * .7, CL - .005, z + 1.1), pr(sd * .38, CL - .005, z + 1.1)]); g.fillStyle = '#8fe8ff'; g.fill(); g.strokeStyle = INK; g.lineWidth = lwz(2.2, z); g.stroke();
        const yr = 2 * FL - CL; LATE.push(() => { g.globalAlpha = .13; poly(g, [pr(sd * .38, yr, z), pr(sd * .7, yr, z), pr(sd * .7, yr, z + 1.1), pr(sd * .38, yr, z + 1.1)]); g.fillStyle = '#9ff4ff'; g.fill(); }); }
      const cv = (u, z) => pr(lerp(sd * HW, sd * CX, u), lerp(WT, CL, u), z);
      let i = 0; for (const [kd, z0, z1] of SEG) { if (kd !== 'bench') continue; for (let z = Math.max(z0 + .2, 1.6); z + 1.0 < z1; z += 1.25) { i++; if (z - cz < .3) continue;
        const q = [cv(.12, z), cv(.88, z), cv(.88, z + .95), cv(.12, z + .95)]; poly(g, q);
        const cc = [['#ff2a85', '#ffd6e8'], ['#00f0ff', '#d6fbff'], ['#b48cff', '#efe4ff'], ['#ff7ab4', '#fff0f6']][(i + (sd > 0 ? 2 : 0)) % 4];
        g.fillStyle = cc[1]; g.fill(); g.strokeStyle = INK; g.lineWidth = lwz(2.6, z); g.stroke();
        g.save(); g.clip(); g.fillStyle = cc[0]; const m = cv(.5, z + .45); g.beginPath(); g.arc(m[0], m[1], 70 * (FOC / 900) / (z - cz), 0, TAU); g.fill(); g.restore();
        const cr = (u, zz) => pr(lerp(sd * HW, sd * CX, u), 2 * FL - lerp(WT, CL, u), zz);
        LATE.push(() => { g.globalAlpha = .2; poly(g, [cr(.12, z), cr(.88, z), cr(.88, z + .95), cr(.12, z + .95)]); g.fillStyle = cc[0]; g.fill(); }); } }
    }
    const WINP = new Path2D(), WINS = [];
    for (const sd of [-1, 1]) {
      poly(g, wallQ(sd, FL, WT, zn, ZE)); g.fillStyle = grad(g, sd < 0 ? 0 : W, 0, VX, 0, [[0, COL.wall2], [1, COL.wall]]); g.fill();
      for (const [kd, z0, z1] of SEG) {
        if (kd === 'bench') {
          for (let z = z0 + .25; z + .5 < z1; z += 1.45) { const za = z, zb = Math.min(z1 - .25, z + 1.3); const q = wallQ(sd, -.5, .3, za, zb); WINP.addPath(P2(q)); WINS.push([sd, za, zb]);
            poly(g, q); g.fillStyle = COL.win; g.fill(); g.strokeStyle = INK; g.lineWidth = lwz(2.6, za); g.stroke();
            poly(g, wallQ(sd, -.56, -.5, za, zb)); g.fillStyle = '#c9d2ff'; g.fill(); }
        } else {
          const zm = (z0 + z1) / 2;
          for (const [a, b] of [[z0, zm], [zm, z1]]) { const q = wallQ(sd, FL, .36, a, b); poly(g, q); g.fillStyle = grad(g, 0, pr(0, .36, a)[1], 0, pr(0, FL, a)[1], [[0, COL.door], [1, COL.doorD]]); g.fill(); g.strokeStyle = INK; g.lineWidth = lwz(3, a); g.stroke();
            const wq = wallQ(sd, -.3, .26, a + (b - a) * .22, b - (b - a) * .22); WINP.addPath(P2(wq)); poly(g, wq); g.fillStyle = COL.win; g.fill(); g.stroke(); }
          for (const zp of [z0 - .08, z1 + .08]) { const a = pr(sd * 1.02, FL, zp), b = pr(sd * 1.02, CL - .05, zp), w = Math.max(1.5, 22 * (FOC / 900) / (zp - cz));
            g.fillStyle = INK; g.fillRect(a[0] - w * .7, b[1], w * 1.4, a[1] - b[1]); g.fillStyle = COL.pole; g.fillRect(a[0] - w * .45, b[1], w * .9, a[1] - b[1]); g.fillStyle = '#ffffff'; g.fillRect(a[0] - w * .15, b[1], w * .25, a[1] - b[1]); }
        }
      }
      poly(g, wallQ(sd, FL, -1.05, zn, ZE)); g.fillStyle = COL.kick; g.fill();
      edge(g, z => pr(sd * HW, WT, z), Math.max(1.2, cz + .3), ZE); edge(g, z => pr(sd * CX, CL, z), Math.max(1.2, cz + .3), ZE); edge(g, z => pr(sd * HW, FL, z), Math.max(1.2, cz + .3), ZE);
    }
    for (const sd of [-1, 1]) for (const [kd, z0, z1] of SEG) { if (kd !== 'bench') continue;
      const za = Math.max(z0, .7, cz + .25);
      poly(g, wallQ(sd, -1.05, -.6, za, z1)); g.fillStyle = COL.seatB; g.fill(); g.strokeStyle = INK; g.lineWidth = lwz(2.6, za); g.stroke();
      poly(g, [pr(sd * HW, -1.05, za), pr(sd * 1.0, -1.05, za), pr(sd * 1.0, -1.05, z1), pr(sd * HW, -1.05, z1)]); g.fillStyle = COL.seat; g.fill(); g.stroke();
      poly(g, [pr(sd * 1.0, -1.05, za), pr(sd * 1.0, FL + .1, za), pr(sd * 1.0, FL + .1, z1), pr(sd * 1.0, -1.05, z1)]); g.fillStyle = COL.seatF; g.fill(); g.stroke();
      poly(g, [pr(sd * 1.06, -1.04, za), pr(sd * 1.02, -1.04, za), pr(sd * 1.02, -1.04, z1), pr(sd * 1.06, -1.04, z1)]); g.fillStyle = '#ff9bc8'; g.fill();
      for (let z = za + .55; z < z1 - .2; z += .55) vline(g, sd * 1.0, -1.05, FL + .1, z, 1.2); }
    const FLOORP = P2([pr(-HW, FL, Math.max(zn, cz + .05)), pr(HW, FL, Math.max(zn, cz + .05)), pr(HW, FL, ZE), pr(-HW, FL, ZE)]);
    g.fillStyle = grad(g, 0, H, 0, VY, [[0, '#140a30'], [.45, COL.floor], [1, COL.floor2]]); g.fill(FLOORP);
    g.save(); g.clip(FLOORP); g.strokeStyle = 'rgba(10,6,40,.35)';
    for (let z = Math.max(1, cz + .3); z < ZE; z += .9) { const a = pr(-HW, FL, z), b = pr(HW, FL, z); g.lineWidth = lwz(1, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.globalCompositeOperation = 'screen'; g.filter = 'blur(3px)'; for (const f of LATE) f(); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.restore();
    for (const sd of [-1, 1]) { edge(g, z => pr(sd * .72, .56, z), Math.max(1.0, cz + .3), ZE - .3, 4.2, INK); edge(g, z => pr(sd * .72, .56, z), Math.max(1.0, cz + .3), ZE - .3, 2.2, COL.rail); }
    g.globalCompositeOperation = 'screen';
    const rg = g.createRadialGradient(VX, VY, 10, VX, VY, 700); rg.addColorStop(0, 'rgba(255,42,133,.5)'); rg.addColorStop(.25, 'rgba(170,60,220,.22)'); rg.addColorStop(1, 'rgba(62,31,92,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';

    // ---------------- per frame ----------------
    // warmZ(z, t) 0..1: the station's amber at depth z (the one warm colour)
    C.drawWindows = function (ctx, t, warmZ) {
      ctx.save(); ctx.clip(WINP);
      ctx.fillStyle = '#0d0a33'; ctx.fillRect(-200, -200, W + 400, H + 400);
      ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const z = ZE + 1 - ((t * 16 + i * 4 + (sd > 0 ? 2 : 0)) % 24); if (z - cz < .6) continue;
        const a = pr(sd * 2.0, .05, z), b = pr(sd * 2.0, .05, z + 1.6), k = FOC / 900 / (z - cz);
        ctx.strokeStyle = 'rgba(0,240,255,.9)'; ctx.lineWidth = Math.max(1.5, 60 * k); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = Math.max(.8, 22 * k); ctx.stroke(); }
      if (warmZ) for (const sd of [-1, 1]) for (const [kd, z0, z1] of SEG) { const zm = Math.max(1.2, (z0 + z1) / 2), wk = warmZ(zm, t); if (wk <= .01) continue;
        const q = wallQ(sd, -.6, .4, Math.max(z0, .8, cz + .2), z1); ctx.globalAlpha = wk * .9; poly(ctx, q);
        ctx.fillStyle = grad(ctx, 0, pr(0, .4, zm)[1], 0, pr(0, -.6, zm)[1], [[0, '#ffd08a'], [.45, '#ff9f3a'], [1, '#c8502e']]); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.restore();
    };
    C.drawTube = function (ctx, k) {
      const z0 = Math.max(.5, cz + .3), a = pr(-.06, CL - .01, z0), b = pr(.06, CL - .01, z0), c = pr(.06, CL - .01, ZE - .5), d = pr(-.06, CL - .01, ZE - .5);
      ctx.save(); ctx.fillStyle = `rgba(0,240,255,${.95 * k})`; poly(ctx, [a, b, c, d]); ctx.fill();
      const a2 = pr(-.02, CL - .01, z0), b2 = pr(.02, CL - .01, z0); ctx.fillStyle = `rgba(255,255,255,${k})`; poly(ctx, [a2, b2, c, d]); ctx.fill(); ctx.restore();
    };
    // straps: swing(z, t) → angle (rad)
    C.drawStraps = function (ctx, t, swing, near, zSplit = 2.6) {
      for (const sd of [-1, 1]) for (let z = 1.25; z < ZE - .6; z += .55) {
        if (z - cz < .5 || near !== (z < zSplit)) continue;
        const th = swing(z, t), x = sd * .72, y0 = .56, Ls = .24, rr = .085;
        const bt = [x, y0 - Ls * Math.cos(th), z + Ls * Math.sin(th)], top = pr(x, y0, z), mid = pr(...bt), lw = Math.max(1, 26 * (FOC / 900) / (z - cz));
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 2.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(mid[0], mid[1]); ctx.stroke();
        ctx.strokeStyle = COL.strapB; ctx.lineWidth = lw; ctx.stroke();
        const ring = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, ry = -rr - rr * Math.cos(a), rz = rr * .9 * Math.sin(a);
          ring.push(pr(x + sd * .012 * Math.sin(a), bt[1] + ry * Math.cos(th), bt[2] + rz * Math.cos(th) + ry * Math.sin(th))); }
        ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 2.6; ctx.stroke(); ctx.strokeStyle = COL.strap; ctx.lineWidth = lw * 1.3; ctx.stroke();
      }
    };
    C.floorLights = function (ctx, t, tk, jig, warmZ) {
      ctx.save(); ctx.clip(FLOORP); ctx.globalCompositeOperation = 'screen';
      const yr = 2 * FL - CL;
      for (const [hw, col] of [[.22, `rgba(0,240,255,${.22 * tk})`], [.09, `rgba(120,250,255,${.32 * tk})`], [.03, `rgba(255,255,255,${.45 * tk})`]]) {
        const Lp = [], Rp = [];
        for (let z = Math.max(3.0, cz + .6); z < ZE; z *= 1.06) { const p = pr(0, yr, z), w = FOC * hw / (z - cz), jx = jig * 26 * Math.sin(p[1] * .05 - t * 34) * (p[1] - VY) / 900 + 2 * Math.sin(p[1] * .02 + t * 3);
          Lp.push([p[0] - w + jx, p[1]]); Rp.push([p[0] + w + jx, p[1]]); }
        ctx.fillStyle = col; poly(ctx, Lp.concat(Rp.reverse())); ctx.fill(); }
      for (const sd of [-1, 1]) for (const [kd, z0, z1] of SEG) { const za = Math.max(z0, 1.0, cz + .3), zm = (za + z1) / 2, wk = warmZ ? warmZ(zm, t) : 0;
        const col = Pilot.mix([140, 70, 255], [255, 170, 80], wk), al = .16 + .3 * wk, jx = jig * 14 * Math.sin(zm * 3 - t * 30);
        const q = [pr(sd * HW, FL, za), pr(sd * (HW - .7), FL, za), pr(sd * (HW - .7), FL, z1), pr(sd * HW, FL, z1)].map(p => [p[0] + jx, p[1]]);
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${al})`; poly(ctx, q); ctx.fill(); }
      ctx.restore();
    };
    Object.assign(C, { bg, pr, WINP, FLOORP, cam, FL, CL, HW, ZE });
    return C;
  };
})();
