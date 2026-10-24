#!/usr/bin/env python3
"""Body check pack for one scene (tools/REVIEW.md 4 · canvas-film references/BODY-CHECK.md): full-size stills every
0.2 s around every beat in script.js (where figures act) + one per second, and index sheets. A fresh "rigger" agent
then checks joints, hands and held things (bent-back elbows, stretching forearms, hands floating off what they hold).

  python3 tools/body-check.py sermons/<folder> [--scene ID] [--skip end]   → film/out/body/<id>/ (not committed)
"""
import argparse, json, os, subprocess, sys
ap = argparse.ArgumentParser(usage=__doc__)
ap.add_argument('folder'); ap.add_argument('--scene'); ap.add_argument('--skip', default='end,hook', help='beats without acting figures')
a = ap.parse_args()
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
film = os.path.join(os.path.abspath(a.folder), 'film')
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
sid = a.scene or cfg['scenes'][0]['id']
d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
page = open(os.path.join(film, 'scenes', sid + '.html'), encoding='utf-8').read()
S = next((v for n, v in d['scripts'].items() if f'src="{n}"' in page), None) or next(iter(d['scripts'].values()))
skip = set(a.skip.split(',')); ts = []
def flat(v):
    if isinstance(v, (int, float)): ts.append(float(v))
    elif isinstance(v, list):
        for x in v: flat(x)
for k, v in (S.get('beat') or {}).items():
    if k not in skip: flat(v)
skill = os.path.join(root, '..', 'motion-skills', 'canvas-film', 'scripts', 'body-check.py')
if not os.path.exists(skill): sys.exit('needs ../motion-skills (canvas-film scripts/body-check.py)')
end = (S.get('beat') or {}).get('end', S['DUR'])
subprocess.run([sys.executable, skill, film, '--scene', sid, '--around', ','.join(f'{t:g}' for t in sorted(set(ts))),
                '--dur', f'{end:g}'], check=True)
