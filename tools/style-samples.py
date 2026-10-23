#!/usr/bin/env python3
"""A sample sheet for a style proposal (CLAUDE.md 순서 4): one picture per style, so the choice isn't made from words.

  python3 tools/style-samples.py sermons/<folder> "bass=추천 · 솔 바스 그래픽" "woodcut=대안 1 · 목판화" "puppet=대안 2 · 그림자극"
→ sermons/<folder>/style-samples.jpg (send it with the storyboard)
A house style (styles/samples.json) is rendered full size from its films (first sample, or slug#2 for the second).
Any other style in canvas-film references/STYLE-INDEX.md (all 170 have a picture):
  - a Lemo-Opuscar slug (pixel-rpg, blueprint, paper-popup, woodcut, ukiyoe, …) → ../lemo-opuscar/docs/frames/<slug>.jpg
  - an OPUSCAR film look by number, op:30 (The Bridge on the River Kwai — Cyanotype Blueprint) → styleboard/img/opuscar98/30.jpg
  - a canvas-film look by its English name ("illuminated manuscript") → ../motion-skills/docs/canvas-film/styles/*.jpg
  ../lemo-opuscar is a clone (pictures only): git clone --depth 1 --filter=blob:none --no-checkout
  https://github.com/lemomo-ai/lemo-opuscar.git ../lemo-opuscar && git -C ../lemo-opuscar checkout HEAD -- docs/frames styleboard/img/opuscar98
  (Lemo-Opuscar © LemoLab, demo films CC BY 4.0 — the sheet credits it; it is for choosing, not for publishing.)
"""
import html, json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
if len(sys.argv) < 3: sys.exit(__doc__)
folder = os.path.abspath(sys.argv[1]); specs = [a.split('=', 1) if '=' in a else (a, a) for a in sys.argv[2:]]
samples = json.load(open(os.path.join(root, 'styles', 'samples.json'), encoding='utf-8'))
ms = os.path.join(root, '..', 'motion-skills'); site = os.path.join(ms, 'docs', 'canvas-film'); lemo = os.path.join(root, '..', 'lemo-opuscar')
render = os.path.join(ms, 'canvas-film', 'scripts', 'render.mjs')
font = next((p for p in [os.path.expanduser('~/.local/share/fonts/NotoSansKR[wght].ttf'), '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc'] if os.path.exists(p)), None)
F = lambda n: ImageFont.truetype(font, n) if font else ImageFont.load_default()

def house(slug, k):
    fo, sc, t = samples[slug][k]; film = os.path.join(root, 'sermons', fo, 'film'); tt = str(t)[:-2] if str(t).endswith('.0') else str(t)
    png = os.path.join(film, 'out', f'still-{sc}-v-{tt.replace(".", "_")}.png')
    if not os.path.exists(png):
        subprocess.run(['node', render, 'v', '--scene', sc, '--stills', str(t)], cwd=film, check=True, capture_output=True)
    return Image.open(png).convert('RGB'), f'{fo} · {sc}'

def site_pic(name):
    if name.startswith('op:'):
        p = os.path.join(lemo, 'styleboard', 'img', 'opuscar98', f'{int(name[3:]):02d}.jpg')
        if os.path.exists(p): return Image.open(p).convert('RGB'), f'OPUSCAR {name[3:]} · Lemo-Opuscar (CC BY 4.0)'
    p = os.path.join(lemo, 'docs', 'frames', name + '.jpg')
    if os.path.exists(p): return Image.open(p).convert('RGB'), f'{name} · Lemo-Opuscar (CC BY 4.0)'
    idx = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
    for m in re.finditer(r'<img src="(styles/[^"]+)"[^>]*>\s*<div class="cap">.*?<b>(.*?)</b><span class="en">(.*?)</span>', idx, re.S):
        if name.lower() in html.unescape(m.group(3)).lower() or name == html.unescape(m.group(2)):
            return Image.open(os.path.join(site, m.group(1))).convert('RGB'), 'canvas-film 샘플 · ' + html.unescape(m.group(2))
    return None, '샘플 이미지 없음'

W, H, TOP, COLS = 600, 560, 92, 4
rows = (len(specs) + COLS - 1) // COLS
sheet = Image.new('RGB', (W * min(COLS, len(specs)), (H + TOP) * rows), (246, 243, 236)); d = ImageDraw.Draw(sheet)
for i, (key, label) in enumerate(specs):
    slug, k = (key.split('#') + ['1'])[:2]
    im, src = house(slug, int(k) - 1) if slug in samples else site_pic(slug)
    cell = Image.new('RGB', (W, H), (30, 28, 26))
    if im:
        s = min(W / im.width, H / im.height); r = im.resize((int(im.width * s), int(im.height * s)))
        cell.paste(r, ((W - r.width) // 2, (H - r.height) // 2))
    else:
        ImageDraw.Draw(cell).text((W // 2, H // 2), '샘플 이미지 없음', fill=(200, 196, 188), font=F(30), anchor='mm')
    x, y = (i % COLS) * W, (i // COLS) * (H + TOP)
    sheet.paste(cell, (x, y + TOP))
    d.text((x + 18, y + 14), label, fill=(20, 18, 16), font=F(32)); d.text((x + 18, y + 58), src, fill=(110, 104, 96), font=F(19))
out = os.path.join(folder, 'style-samples.jpg'); sheet.save(out, quality=86)
print('→', os.path.relpath(out, root), f'({os.path.getsize(out) // 1024} KB)')
