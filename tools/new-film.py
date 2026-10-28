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
meta = {}
for mp in (os.path.join(a.folder, 'source.json'), os.path.join(a.folder, 'sermon.json')):
    if os.path.exists(mp): meta = json.load(open(mp, encoding='utf-8')); break
if not meta.get('type'): meta['type'] = 'sermon' if meta.get('preacher') else 'topic'
open(os.path.join(sc, 'source.js'), 'w', encoding='utf-8').write(
    '/* The film\'s source (from source.json): the end card and the upload text are built from it. */\n'
    f'window.SOURCE = {json.dumps(meta, ensure_ascii=False, indent=1)};\n')
# every script: end card from the source, loop seam on, a default short cut slot (edit to the film's beats)
TAIL = """
/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ~4 s on screen (beat.end = DUR − 4); links/CTA go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
"""
# One style: scenes/script.js. Several styles: each template keeps its own placeholder (script-<slug>.js) because the
# templates use different beat names; once the storyboard is final, write ONE script.js and point every scene at it.
scenes = []
for s in a.style:
    shutil.copy(os.path.join(st, s, 'kit.js'), os.path.join(sc, f'kit-{s}.js'))
    sid = f'{a.id}-{s}'
    sname = 'script.js' if len(a.style) == 1 else f'script-{s}.js'
    if not os.path.exists(os.path.join(sc, sname)):
        shutil.copy(os.path.join(st, s, 'script.example.js'), os.path.join(sc, sname))
    page = open(os.path.join(st, s, 'template.html'), encoding='utf-8').read()
    assert 'src="script.js"' in page, f'{s}/template.html must load script.js'
    open(os.path.join(sc, sid + '.html'), 'w', encoding='utf-8').write(page.replace('<script src="script.js"></script>', f'<script src="source.js"></script><script src="{sname}"></script>').replace('src="script.js"', f'src="{sname}"'))
    label = open(os.path.join(st, s, 'STYLE.md'), encoding='utf-8').readline().lstrip('# ').strip() or s
    scenes.append({'id': sid, 'label': label, 'dur': 30})   # set to SCRIPT.DUR once the script is written
for f in os.listdir(sc):
    if f.startswith('script') and f.endswith('.js'):
        p = os.path.join(sc, f); body = open(p, encoding='utf-8').read()
        if 'added by new-film.py' not in body: open(p, 'a', encoding='utf-8').write(TAIL)
fonts = {'Noto Serif KR': 'NotoSerifKR[wght].ttf', 'Noto Sans KR': 'NotoSansKR[wght].ttf'}
if 'mograph' in a.style: fonts['Do Hyeon'] = 'DoHyeon-Regular.ttf'   # its chunky 3-D type (install locally for stills/export)
json.dump({'title': a.title or meta.get('title', ''), 'source': 'ko', 'scenes': scenes, 'audio': 'scenes/soundtrack.wav', 'poster': 12,
           'fonts': {'local': fonts}},
          open(os.path.join(film, 'film.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('→', film, '·', ', '.join(x['id'] for x in scenes))
print('next: write scenes/script.js, then draw your image in each scene (see styles/<slug>/STYLE.md)')
