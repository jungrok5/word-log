#!/usr/bin/env python3
"""Make the pack the viewer agents review (tools/REVIEW.md): what a viewer sees and hears, nothing about the intent.

  python3 tools/review-pack.py sermons/<folder> [--out DIR] [--step 0.75] [--scene ID]
→ DIR/sheet-1.png, sheet-2.png, …   stills every `step` s (12 per sheet, 4×3, time stamped), captions included
  DIR/timeline.md                   the on-screen words with times, and the sound as a listener would describe it
DIR defaults to the scratch folder film/out/review/ (not committed). The review itself goes in reviews/.
"""
import argparse, glob, json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser(usage=__doc__)
ap.add_argument('folder'); ap.add_argument('--out'); ap.add_argument('--step', type=float, default=.75); ap.add_argument('--scene')
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
film = os.path.join(os.path.abspath(a.folder), 'film')
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
sid = a.scene or cfg['scenes'][0]['id']
render = os.path.join(root, '..', 'motion-skills', 'canvas-film', 'scripts', 'render.mjs')
if not os.path.exists(render): sys.exit('needs ../motion-skills (canvas-film render.mjs) next to word-log')
d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
S = next(iter(d['scripts'].values())); D = S['DUR']
out = os.path.abspath(a.out or os.path.join(film, 'out', 'review')); os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(film, 'out', f'still-{sid}-v-*.png')): os.remove(f)
ts = [round(i * a.step, 2) for i in range(int(D / a.step) + 1)]
subprocess.run(['node', render, 'v', '--scene', sid, '--stills', ','.join(str(t) for t in ts)], cwd=film, check=True, capture_output=True)
key = lambda f: float(re.search(r'-v-([\d_]+)\.png$', f).group(1).replace('_', '.'))
fs = sorted(glob.glob(os.path.join(film, 'out', f'still-{sid}-v-*.png')), key=key)
if len(fs) != len(ts): sys.exit(f'rendered {len(fs)} of {len(ts)} stills')
try: font = ImageFont.truetype('DejaVuSans-Bold.ttf', 28)
except OSError: font = ImageFont.load_default()
for f in glob.glob(os.path.join(out, 'sheet-*.png')): os.remove(f)
w, h, cols, per = 360, 640, 4, 12
for k in range(0, len(fs), per):
    grp = fs[k:k + per]; rows = (len(grp) + cols - 1) // cols
    sheet = Image.new('RGB', (w * cols, h * rows), 'white')
    for i, f in enumerate(grp):
        im = Image.open(f).convert('RGB').resize((w, h)); g = ImageDraw.Draw(im)
        g.rectangle((0, 0, 92, 38), fill=(0, 0, 0)); g.text((8, 4), f'{key(f):.2f}s', fill=(255, 230, 0), font=font)
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(os.path.join(out, f'sheet-{k // per + 1}.png'))
for f in fs: os.remove(f)

L = [f'# 보는 것 · 듣는 것 — {D} s (세로 1080×1920, 끝나면 처음부터 다시 재생)', '', '## 화면 자막 (시간)']
for ln in S.get('lines', []):
    L.append(f"- {ln[0]:.1f}–{ln[1]:.1f}s: “{ln[2].replace(chr(10), ' / ')}”" + (f'  ({ln[3]})' if len(ln) > 3 and ln[3] else ''))
ec = S.get('endCard') or {}
L += [f"- {S['beat'].get('end', D - 4):.1f}s–끝: 엔딩 카드 — {' / '.join(x.replace(chr(10), ' ') for x in [ec.get('kicker'), ec.get('title'), ec.get('passage'), ec.get('by')] if x)}", '', '## 소리']
snd = os.path.join(film, 'scenes', 'soundtrack.sound.json')
if os.path.exists(snd) and os.path.exists(os.path.join(film, cfg.get('audio', 'scenes/soundtrack.wav'))):
    sp = json.load(open(snd, encoding='utf-8'))
    for c in sorted(sp.get('music', []) + sp.get('sfx', []), key=lambda c: c['at']):
        if c.get('prompt'): L.append(f"- {c['at']:.1f}s~ ({c.get('len', 0):.1f}s): {c['prompt']}")
else:
    L.append('- (아직 소리 없음 — 그림이 확정된 뒤 마지막에 넣는다. 그림과 자막만으로 판단할 것)')
open(os.path.join(out, 'timeline.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('→', os.path.relpath(out, root), '·', len(fs), 'stills on', (len(fs) + per - 1) // per, 'sheets + timeline.md')
