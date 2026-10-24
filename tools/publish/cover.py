#!/usr/bin/env python3
"""Instagram Reels cover check (and an optional title line) for the film's chosen scene.

  python3 tools/publish/cover.py sermons/<folder> --scene <id> [--title | --text "첫 화면의 질문"] [--y 300]
→ film/out/<scene>-grid.jpg         how the cover sits in the profile grid: the centre 3:4 crop (y 240–1680) next to the
                                    covers of films already on Instagram (posted.json), newest first, 3 across
  film/out/<scene>-cover-insta.jpg  only with --title/--text: export.py's cover (<scene>-cover.jpg, the poster frame) with
                                    one line on top, inside the 3:4 — then serve.mjs hands this one to Business Suite

--title uses upload.md's YouTube title (the first screen's question — the cover text must be what the film says,
CLAUDE.md "썸네일·설명의 문구는 영상 그대로 사실"). Without either, the poster frame is used as it is (the usual case: the
film's first picture already carries the hook). Ported from one-scroll-bible motion/social/insta_reel_covers.py."""
import argparse, glob, json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
W, H, TOP, BOT = 1080, 1920, 240, 1680
ap = argparse.ArgumentParser(usage=__doc__)
ap.add_argument('folder'); ap.add_argument('--scene'); ap.add_argument('--title', action='store_true'); ap.add_argument('--text')
ap.add_argument('--y', type=int, default=300, help='top of the text line (stay inside 240–1680; the Reels UI covers the bottom)')
a = ap.parse_args()
folder = os.path.abspath(a.folder); film = os.path.join(folder, 'film'); out = os.path.join(film, 'out')
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
posted = json.load(open(os.path.join(folder, 'posted.json'), encoding='utf-8')) if os.path.exists(os.path.join(folder, 'posted.json')) else {}
ids = [s['id'] for s in cfg['scenes']]
sid = a.scene or posted.get('scene') or (ids[0] if len(ids) == 1 else None)
if not sid: sys.exit(f'film.json has {len(ids)} scenes — pick one with --scene ({", ".join(ids)})')
if sid not in ids: sys.exit(f'no scene {sid} in film.json')
if posted.get('scene') and posted['scene'] != sid: sys.exit(f'posted.json: this film went out as {posted["scene"]}')
src = os.path.join(out, f'{sid}-cover.jpg')
if not os.path.exists(src): sys.exit(f'no {src} — python3 tools/export.py {a.folder} --scene {sid}')

def font(size):
    names = ['NotoSerifKR[wght].ttf', 'NotoSerifKR-Black.otf', 'NotoSerifKR-Bold.otf', 'NanumMyeongjoExtraBold.ttf', 'malgunbd.ttf']
    dirs = [os.path.expanduser('~/.local/share/fonts'), '/root/.local/share/fonts', '/usr/share/fonts/truetype/nanum',
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'Windows', 'Fonts'), 'C:/Windows/Fonts']
    for n in names:
        for d in dirs:
            p = os.path.join(d, n)
            if os.path.exists(p):
                f = ImageFont.truetype(p, size)
                try: f.set_variation_by_axes([900])   # variable Noto: Black
                except Exception: pass
                return f
    sys.exit('no Korean font found (Noto Serif KR / Nanum Myeongjo / Malgun Gothic)')

def wrap(text, f, width):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if f.getlength(t) <= width or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]

def glow(im, xy, s, f, fill=(250, 246, 236), r=16):
    L = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(L).text(xy, s, font=f, fill=(0, 0, 0, 235), anchor='ma')
    L = L.filter(ImageFilter.GaussianBlur(r)); im.alpha_composite(L); im.alpha_composite(L)
    ImageDraw.Draw(im).text(xy, s, font=f, fill=fill, anchor='ma')

text = a.text
if a.title:
    p = json.loads(subprocess.run(['node', os.path.join(HERE, 'plan.mjs'), a.folder, '--scene', sid, '--json'], capture_output=True, text=True, check=True).stdout)
    text = p['youtube']['title'] or sys.exit('upload.md has no finished YouTube title yet (✍️ → **…**)')
cover = src
if text:
    im = Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS).convert('RGBA')
    for size in (76, 66, 58):   # at most 2 lines, 900 px wide
        f = font(size); lines = wrap(text, f, 900)
        if len(lines) <= 2: break
    y = max(a.y, TOP + 20)
    for ln in lines[:2]: glow(im, (W // 2, y), ln, f); y += int(size * 1.35)
    if y > BOT: sys.exit('text runs below the 3:4 safe area — use a smaller --y')
    cover = os.path.join(out, f'{sid}-cover-insta.jpg'); im.convert('RGB').save(cover, quality=90); print('→', os.path.relpath(cover, ROOT))

# the profile grid: this cover first, then films already on Instagram (newest first), centre 3:4 crops
tiles = [cover]
others = []
for pj in glob.glob(os.path.join(ROOT, 'sermons', '*', 'posted.json')):
    d = os.path.dirname(pj)
    if d == folder: continue
    q = json.load(open(pj, encoding='utf-8')); ig = q.get('instagram') or {}
    if not ig.get('status') or ig['status'] == 'deleted': continue
    for c in (f'{q.get("scene")}-cover-insta.jpg', f'{q.get("scene")}-cover.jpg'):
        f = os.path.join(d, 'film', 'out', c)
        if os.path.exists(f): others.append((ig.get('at') or '', f)); break
tiles += [f for _, f in sorted(others, reverse=True)][:8]
crops = [Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS).crop((0, TOP, W, BOT)).resize((270, 360), Image.LANCZOS) for f in tiles]
g = Image.new('RGB', (3 * 270 + 4, ((len(crops) + 2) // 3) * 362), (255, 255, 255))
for i, t in enumerate(crops): g.paste(t, ((i % 3) * 272, (i // 3) * 362))
gp = os.path.join(out, f'{sid}-grid.jpg'); g.save(gp, quality=88)
print('→', os.path.relpath(gp, ROOT), f'({len(crops)} tiles; first = this film; others missing on this PC are left out)')
