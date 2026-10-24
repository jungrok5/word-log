#!/usr/bin/env python3
"""Cut the film's soundtrack for each SCRIPT.cuts version and link per-scene audio for render.mjs.
  python3 tools/cut-audio.py sermons/<folder>
→ scenes/<id>.wav (link to the soundtrack) and scenes/<id>-<cut>.wav (same ranges as the picture, 30 ms cross-fades)."""
import json, os, subprocess, sys, wave
import numpy as np
folder = sys.argv[1].rstrip('/'); film = os.path.join(folder, 'film'); here = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
def write(path, y):
    with wave.open(path, 'wb') as o: o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr); o.writeframes(np.clip(y, -32768, 32767).astype('<i2').tobytes())
for sc in cfg['scenes']:   # a scene may have its own soundtrack (film.json scenes[].audio), else the film's
    au = os.path.join(film, sc.get('audio') or cfg.get('audio', 'scenes/soundtrack.wav'))
    if not os.path.exists(au): sys.exit(f'no soundtrack at {au}')
    w = wave.open(au); sr = w.getframerate(); ch = w.getnchannels(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, ch).astype(float)
    link = os.path.join(film, 'scenes', sc['id'] + '.wav')
    if os.path.islink(link) and os.path.realpath(link) != os.path.realpath(au): os.remove(link)
    if not os.path.exists(link): os.symlink(os.path.relpath(au, os.path.dirname(link)), link)
    page = open(os.path.join(film, 'scenes', sc['id'] + '.html'), encoding='utf-8').read()
    sname = next((n for n in d['scripts'] if f'src="{n}"' in page), None)
    for cn, segs in ((d['scripts'].get(sname) or {}).get('cuts') or {}).items():
        xf = int(.03 * sr); parts = []
        for a, b in segs:
            p = x[int(a * sr):int(b * sr)].copy(); n = min(xf, len(p) // 2)
            p[:n] *= np.linspace(0, 1, n)[:, None]; p[-n:] *= np.linspace(1, 0, n)[:, None]; parts.append(p)
        write(os.path.join(film, 'scenes', f"{sc['id']}-{cn}.wav"), np.concatenate(parts)); print('→', sc['id'], cn, f'{sum(b - a for a, b in segs):.1f} s')
