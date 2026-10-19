#!/usr/bin/env python3
"""Check a film against word-log's video strategy (CLAUDE.md 영상 전략) before sending the preview.

  python3 tools/check-film.py sermons/<folder>            # script rules
  python3 tools/check-film.py sermons/<folder> --frames   # + rendered frames and soundtrack (hook, dead air, loop seam)
Prints ✅ / ⚠️ per rule; exit code 1 if any ❌.
"""
import json, os, subprocess, sys, wave

folder = sys.argv[1].rstrip('/'); film = os.path.join(folder, 'film'); FR = '--frames' in sys.argv
here = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
bad = 0
def say(ok, msg, hard=False):
    global bad
    print(('✅' if ok else ('❌' if hard else '⚠️ ')), msg); bad += (not ok and hard)

src = d['source'] or {}
say(bool(src.get('type')), f"source type: {src.get('type')}", True)
need = {'sermon': ['title', 'passage', 'date', 'church', 'preacher'], 'book': ['book', 'author']}.get(src.get('type'), ['title'])
miss = [k for k in need if not src.get(k)]
say(not miss, 'end-card fields ' + ('complete' if not miss else 'missing: ' + ', '.join(miss)), True)
for name, S in d['scripts'].items():
    if not S: say(False, f'{name}: no window.SCRIPT', True); continue
    D = S.get('DUR', 0); lines = S.get('lines', []); ec = S.get('endCard') or {}
    print(f'— {name}: {D} s, {len(lines)} lines')
    say(25 <= D <= 35, f'main length {D} s (target 25–35)', not (20 <= D <= 40))
    end = (S.get('beat') or {}).get('end')
    if end is not None: say(D - end <= 2.6, f'end card {D - end:.1f} s on screen (≤ 2.5)')
    say(bool(ec.get('title')), 'end card built from source' if ec.get('title') else 'end card has no title', True)
    say(not ec.get('cta'), 'no CTA on screen (link/CTA belong in the description)')
    if lines: say(lines[0][0] <= 0.5, f'first words at {lines[0][0]} s (≤ 0.5 — the hook must speak at once)')
    short = [b - a for a, b, *_ in lines if (b - a) < 1.6]
    say(not short, 'every line ≥ 1.6 s on screen' if not short else f'{len(short)} line(s) shorter than 1.6 s')
    say(all(s.count('\n') <= 1 for _, _, s, *__ in lines), '≤ 2 lines per caption', True)
    nv = sum(1 for l in lines if len(l) > 3 and l[3])
    say(nv <= 2, f'{nv} scripture line(s) on screen (≤ 2 — MESSAGE-CHECK #4)')
    say((S.get('loop') or 0) > 0, f"loop seam {S.get('loop')} s")
    for cn, segs in (S.get('cuts') or {}).items():
        L = sum(b - a for a, b in segs); say(10 <= L <= 20 if cn == 'short' else True, f'cut "{cn}": {L:.1f} s')

if FR:
    au = cfg.get('audio'); silent = set()
    if au and os.path.exists(os.path.join(film, au)):
        import numpy as np
        w = wave.open(os.path.join(film, au)); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, w.getnchannels()) / 32768
        sr = w.getframerate()
        for i in range(0, len(x), sr // 4):
            if 20 * np.log10(np.sqrt((x[i:i + sr // 4] ** 2).mean()) + 1e-9) < -50: silent.add(round(i / sr * 4) / 4)
    else: print('   (no soundtrack yet — dead-air check uses picture only)')
    for sc in cfg['scenes']:
        r = json.loads(subprocess.run(['node', os.path.join(here, 'scan-frames.mjs'), os.path.join(film, 'scenes', sc['id'] + '.html'), '4'],
                                      capture_output=True, text=True, check=True).stdout)
        lum = r['samples']; print(f"— frames {sc['id']}")
        say(lum[0][1] > 12 and lum[1][1] > 12, f'frame 0 shows a picture (lum {lum[0][1]:.0f}) — no fade-in from black on Shorts')
        run = best = 0
        for t, l in lum:
            dead = l < 8 and (not silent or round(t * 4) / 4 in silent)
            run = run + 1 if dead else 0; best = max(best, run)
        say(best / 4 <= 0.8, f'longest dead air (black{" + silent" if silent else ""}) {best / 4:.2f} s (≤ 0.8)')
        say(abs(lum[-1][1] - lum[0][1]) < 25, f'loop seam: last {lum[-1][1]:.0f} vs first {lum[0][1]:.0f} luminance')
sys.exit(1 if bad else 0)
