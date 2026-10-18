#!/usr/bin/env python3
"""Start a new film from one or more house styles (styles/<slug>/).

  python3 tools/new-film.py sermons/2026-10-25-matt13 --style charcoal [--style bass …] [--id seed] [--title "…"]
→ sermons/<folder>/film/
     film.json                    one scene per style: <id>-<slug>, 30 s, soundtrack slot
     scenes/lib.js, story.js      shared harness + captions/end card (from styles/_shared/)
     scenes/script.js             THE STORY: beats, on-screen lines, end card — write this first (starts from the style's example)
     scenes/kit-<slug>.js         the style kit (vendored, so later kit changes never break this film)
     scenes/<id>-<slug>.html      a scene started from the style's template — replace the placeholder subject with your image
Then: draw → stills (render.mjs --stills) → python3 tools/preview.py sermons/<folder> → link → MP4 only on request.
"""
import argparse, json, os, shutil, sys

ap = argparse.ArgumentParser()
ap.add_argument('folder'); ap.add_argument('--style', action='append', required=True); ap.add_argument('--id', default='film')
ap.add_argument('--title', default='')
a = ap.parse_args()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
st = os.path.join(root, 'styles')
film = os.path.join(a.folder, 'film'); sc = os.path.join(film, 'scenes')
if os.path.exists(os.path.join(film, 'film.json')):
    sys.exit(f'{film}/film.json already exists — edit it instead')
for s in a.style:
    if not os.path.exists(os.path.join(st, s, 'kit.js')):
        sys.exit(f'no style kit styles/{s}/kit.js (have: {", ".join(d for d in sorted(os.listdir(st)) if os.path.exists(os.path.join(st, d, "kit.js")))})')
os.makedirs(os.path.join(sc, 'audio'), exist_ok=True); os.makedirs(os.path.join(film, 'out'), exist_ok=True)
for f in ('lib.js', 'story.js'):
    shutil.copy(os.path.join(st, '_shared', f), sc)
if not os.path.exists(os.path.join(sc, 'script.js')):
    shutil.copy(os.path.join(st, a.style[0], 'script.example.js'), os.path.join(sc, 'script.js'))
scenes = []
for s in a.style:
    shutil.copy(os.path.join(st, s, 'kit.js'), os.path.join(sc, f'kit-{s}.js'))
    sid = f'{a.id}-{s}'
    shutil.copy(os.path.join(st, s, 'template.html'), os.path.join(sc, sid + '.html'))
    label = open(os.path.join(st, s, 'STYLE.md'), encoding='utf-8').readline().lstrip('# ').strip() or s
    scenes.append({'id': sid, 'label': label, 'dur': 30})
meta = {}
mp = os.path.join(a.folder, 'sermon.json')
if os.path.exists(mp): meta = json.load(open(mp, encoding='utf-8'))
json.dump({'title': a.title or meta.get('title', ''), 'source': 'ko', 'scenes': scenes, 'audio': 'scenes/soundtrack.wav',
           'fonts': {'local': {'Noto Serif KR': 'NotoSerifKR[wght].ttf', 'Noto Sans KR': 'NotoSansKR[wght].ttf'}}},
          open(os.path.join(film, 'film.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('→', film, '·', ', '.join(x['id'] for x in scenes))
print('next: write scenes/script.js, then draw your image in each scene (see styles/<slug>/STYLE.md)')
