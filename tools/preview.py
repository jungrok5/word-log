#!/usr/bin/env python3
"""Publish a film's scenes as a live HTML preview on GitHub Pages, no video encoding. Every run ADDS a version — tries
are never overwritten, so all of them stay watchable side by side.

  python3 tools/preview.py sermons/2026-10-18-lie --note "손·팔 수정"      → docs/previews/2026-10-18-lie/v3/
  python3 tools/preview.py sermons/2026-10-18-lie --replace               → rewrites the latest version (a tiny fix)

docs/previews/<folder>/
  versions.json         [{v, date, note, scenes: [{id, label, dur, cuts, poster}]}]
  v1/, v2/, …           the scene pages, lib.js, shared js, soundtrack.m4a, <scene>.jpg (thumbnail of the poster frame)
  index.html            every version, newest first, each with its thumbnails
  <scene>.html          a stub that forwards to the newest version (so links sent earlier keep working)
docs/previews/index.html  every film (newest first) with its number of versions.
Push, and ~1 min later it is live at https://jungrok5.github.io/word-log/previews/<folder>/
The scenes draw themselves in the viewer's browser (portrait, ?o=v) with the soundtrack as the clock.
Encode MP4s only when asked: node ../motion-skills/canvas-film/scripts/render.mjs v --scene <id> (from the film folder).
"""
import argparse, datetime, html, json, os, shutil, subprocess

ap = argparse.ArgumentParser(usage=__doc__)
ap.add_argument('folder'); ap.add_argument('--note', default=''); ap.add_argument('--replace', action='store_true')
ap.add_argument('--no-poster', action='store_true', help='skip the thumbnail stills (they need Playwright)')
ap.add_argument('--mute', action='store_true', help='picture only (before the sound is made — CLAUDE.md: sound comes last)')
ap.add_argument('--index-only', action='store_true', help='only (re)build the list pages (and move an old flat preview into v1)')
a = ap.parse_args()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = a.folder.rstrip('/'); name = os.path.basename(src)
film = os.path.join(src, 'film')
meta = next((json.load(open(os.path.join(src, f), encoding='utf-8')) for f in ('source.json', 'sermon.json')
             if os.path.exists(os.path.join(src, f))), {})
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
base = os.path.join(root, 'docs', 'previews', name)
vj = os.path.join(base, 'versions.json')
versions = json.load(open(vj, encoding='utf-8')) if os.path.exists(vj) else []
if not versions and os.path.exists(os.path.join(base, 'lib.js')):   # an old flat preview → keep it as v1
    os.makedirs(os.path.join(base, 'v1'), exist_ok=True)
    for f in os.listdir(base):
        if f != 'v1': shutil.move(os.path.join(base, f), os.path.join(base, 'v1', f))
    versions = [{'v': 1, 'date': '', 'note': '첫 버전', 'scenes': [{'id': s['id'], 'label': s['label'], 'dur': s.get('dur', '')} for s in cfg['scenes']]}]
rec = None
if not a.index_only:
    if a.replace and versions:
        rec = versions[-1]
    else:
        rec = {'v': (versions[-1]['v'] + 1) if versions else 1}; versions.append(rec)
    rec.update({'date': datetime.date.today().isoformat(), 'note': a.note or rec.get('note', ''), 'scenes': [], 'stamp': datetime.datetime.now().strftime('%Y%m%d%H%M%S')})
    out = os.path.join(base, f"v{rec['v']}")
    shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    sc = os.path.join(film, 'scenes')
    for f in os.listdir(sc):
        if f.endswith('.js'):
            shutil.copy(os.path.join(sc, f), out)

    # Preview harness: open on a poster frame (not the black first frame) and start from 0 on the first play.
    lib = open(os.path.join(sc, 'lib.js'), encoding='utf-8').read()
    for x, y in [("let cur = 0, playing = false", "let cur = (window.POSTER_T || 0), first = true, playing = false"),
                 ("const setPlay = p => { playing = p;", "const setPlay = p => { if (p && first) { first = false; cur = 0; } playing = p;")]:
        assert x in lib, x
        lib = lib.replace(x, y)
    open(os.path.join(out, 'lib.js'), 'w', encoding='utf-8').write(lib)

    # A big centred play button over the poster (the harness's own controls sit small at the bottom).
    OVERLAY = """<script>window.POSTER_T = %s;</script>
    <style>#pv-play{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9;background:rgba(0,0,0,.25);
    border:0;color:#fff;font:600 18px/1.4 system-ui,sans-serif;cursor:pointer}#pv-play span{display:flex;flex-direction:column;align-items:center;gap:10px}
    #pv-play b{display:flex;align-items:center;justify-content:center;width:84px;height:84px;border-radius:50%%;background:rgba(0,0,0,.6);
    border:2px solid rgba(255,255,255,.85);font-size:34px;padding-left:6px;box-sizing:border-box}#pv-play[hidden]{display:none}</style>
    <button id="pv-play" type="button" hidden><span><b>▶</b>탭해서 재생 · 소리 켜기</span></button>
    <script>(function w(){var pp=document.getElementById('pp'),o=document.getElementById('pv-play');
    if(!pp||!window.__ready)return setTimeout(w,100);o.hidden=false;o.onclick=function(){o.remove();pp.click();};})();</script>
    """

    audio = cfg.get('audio')           # e.g. "scenes/soundtrack.wav" (relative to film/)
    if a.mute: audio = None
    if audio and not os.path.exists(os.path.join(film, audio)):
        print('(no soundtrack yet — preview without sound)'); audio = None
    if audio:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(film, audio), '-c:a', 'aac', '-b:a', '128k',
                        os.path.join(out, 'soundtrack.m4a')], check=True)

    render = os.path.join(root, '..', 'motion-skills', 'canvas-film', 'scripts', 'render.mjs')
    for s in cfg['scenes']:
        page = open(os.path.join(sc, s['id'] + '.html'), encoding='utf-8').read()
        cuts = []
        for f in sorted(os.listdir(sc)):   # cut versions (SCRIPT.cuts) whose soundtrack tools/cut-audio.py has made
            pre = s['id'] + '-'
            if f.startswith(pre) and f.endswith('.wav') and not os.path.islink(os.path.join(sc, f)):
                cn = f[len(pre):-4]; cuts.append(cn)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(sc, f), '-c:a', 'aac', '-b:a', '128k',
                                os.path.join(out, f'{s["id"]}-{cn}.m4a')], check=True)
        if audio:   # the harness plays cfg.audio in sync with the picture (a cut plays its own cut soundtrack)
            page = page.replace('Pilot.run({', f"Pilot.run({{ audio: (Pilot.cut ? '{s['id']}-' + Pilot.cut + '.m4a' : 'soundtrack.m4a'),", 1)
        pt = s.get('poster', cfg.get('poster', 9.5))
        page = page.replace('</body>', OVERLAY % pt + '</body>', 1)
        open(os.path.join(out, s['id'] + '.html'), 'w', encoding='utf-8').write(page)
        poster = False
        if not a.no_poster and os.path.exists(render):   # a 360 px thumbnail of the poster frame, for the version list
            tt = str(pt)[:-2] if str(pt).endswith('.0') else str(pt)
            png = os.path.join(film, 'out', f"still-{s['id']}-v-{tt.replace('.', '_')}.png")
            if os.path.exists(png): os.remove(png)                # an old still must never pass for a new one
            r = subprocess.run(['node', os.path.abspath(render), 'v', '--scene', s['id'], '--stills', str(pt)], cwd=film, capture_output=True, text=True, timeout=300)
            if r.returncode != 0 or not os.path.exists(png):      # the scene did not render (a script error, a missing file …)
                raise SystemExit(f"✖ {s['id']}: the scene failed to render — fix it before publishing (a page that won't open must never go up).\n{(r.stderr or r.stdout)[-1500:]}")
            if True:
                poster = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=360:-2', '-q:v', '5',
                                         os.path.join(out, s['id'] + '.jpg')]).returncode == 0
        rec['scenes'].append({'id': s['id'], 'label': s['label'], 'dur': s.get('dur', ''), 'cuts': cuts, 'poster': poster})
json.dump(versions, open(vj, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

CSS = """:root{--bg:#faf9f6;--fg:#1d1c1a;--muted:#6b675f;--card:#fff;--line:#e4e0d8;--acc:#9c1a1a}
@media (prefers-color-scheme:dark){:root{--bg:#141311;--fg:#ecebe7;--muted:#a19c92;--card:#1e1c19;--line:#2e2b27;--acc:#e0584f}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}
main{max-width:640px;margin:0 auto;padding:32px 16px 48px} h1{font-size:1.35rem;margin:0 0 4px} p{color:var(--muted);margin:0 0 20px}
h2{font-size:1rem;margin:28px 0 10px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap} h2 .n{color:var(--muted);font-weight:400;font-size:.9rem}
.new{font-size:.75rem;color:#fff;background:var(--acc);border-radius:6px;padding:1px 7px}
.card{display:flex;align-items:center;gap:14px;padding:12px;margin:0 0 10px;border:1px solid var(--line);
border-radius:12px;background:var(--card);color:inherit;text-decoration:none}
.card:active{transform:scale(.99)} .card img{width:72px;height:128px;object-fit:cover;border-radius:6px;flex:none;background:var(--line)}
.k{font-weight:600} .d{color:var(--muted);font-size:.9rem} small{color:var(--muted)} a{color:inherit}"""
page_head = lambda title: f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title><style>{CSS}</style></head><body><main>'''

def film_name(d):   # the film's name: its storyboard title (before the source in brackets)
    sb = os.path.join(root, 'sermons', d, 'storyboard.md')
    if os.path.exists(sb):
        h = open(sb, encoding='utf-8').readline().split('—', 1)[-1].split('(')[0].strip().strip('#').strip()
        if h: return h
    return d

# the film's page: every version, newest first
title = cfg.get('title', meta.get('title', ''))
when = ''
if meta.get('date'):
    dd = datetime.date.fromisoformat(meta['date'])
    when = ' '.join(filter(None, [dd.strftime('%Y.%m.%d'), '주일' if dd.weekday() == 6 else '', meta.get('service')]))
secs = []
for i, v in enumerate(reversed(versions)):
    cards = []
    for s in v['scenes']:
        img = f'<img src="v{v["v"]}/{s["id"]}.jpg?r={v.get("stamp", "")}" alt="" loading="lazy">' if s.get('poster') else ''
        bust = f'&r={v["stamp"]}' if v.get('stamp') else ''
        cards.append(f'<a class="card" href="v{v["v"]}/{s["id"]}.html?o=v{bust}">{img}<span><span class="k">{html.escape(s["label"])}</span><br>'
                     f'<span class="d">{s.get("dur", "")}초 · 탭해서 재생</span></span></a>')
        for cn in s.get('cuts', []):
            cards.append(f'<a class="card" href="v{v["v"]}/{s["id"]}.html?o=v&cut={cn}">{img}<span><span class="k">{html.escape(s["label"])} · {cn}</span></span></a>')
    secs.append(f'<h2>v{v["v"]}{" <span class=new>최신</span>" if i == 0 else ""} <span class="n">{html.escape(" · ".join(filter(None, [v.get("date", "").replace("-", "."), v.get("note")])))}</span></h2>' + ''.join(cards))
open(os.path.join(base, 'index.html'), 'w', encoding='utf-8').write(page_head(f'미리보기 · {film_name(name)}') + f'''
<p><a href="../">← 모든 영상</a></p>
<h1>{html.escape(film_name(name))}</h1>
<p>{html.escape(" · ".join(filter(None, [title, when, meta.get("passage"), meta.get("preacher"), meta.get("church"), meta.get("book") and "『" + meta["book"] + "』", meta.get("author"), meta.get("by")])))}</p>
{"".join(secs)}
<small>브라우저가 직접 그리는 미리보기예요. 영상의 ▶를 누르면 소리와 함께 재생돼요. 만든 버전은 모두 여기 남아요 — 마음에 드는 버전을 알려 주시면 MP4로 만들어 드려요.</small>
</main></body></html>
''')
# stubs at the film's root: old links (…/<folder>/<scene>.html?o=v) open the newest version of that scene
latest = {}
for v in versions:
    for s in v['scenes']: latest[s['id']] = v['v']
for sid, vn in latest.items():
    open(os.path.join(base, sid + '.html'), 'w', encoding='utf-8').write(
        f'<!doctype html><meta charset="utf-8"><script>location.replace("v{vn}/{sid}.html"+location.search)</script>'
        f'<a href="v{vn}/{sid}.html?o=v">v{vn}</a>\n')
if rec: print('→', os.path.relpath(out, root), f"(v{rec['v']}, {len(cfg['scenes'])} scenes)")

# the list of every film (docs/previews/index.html), newest first — rebuilt on each run so no film drops off the site
pv = os.path.join(root, 'docs', 'previews'); rows = []
for d in sorted((x for x in os.listdir(pv) if os.path.exists(os.path.join(pv, x, 'index.html'))), reverse=True):
    vs = json.load(open(os.path.join(pv, d, 'versions.json'), encoding='utf-8')) if os.path.exists(os.path.join(pv, d, 'versions.json')) else []
    m = next((json.load(open(os.path.join(root, 'sermons', d, f), encoding='utf-8')) for f in ('source.json', 'sermon.json')
              if os.path.exists(os.path.join(root, 'sermons', d, f))), {})
    last = vs[-1] if vs else {'v': 1, 'scenes': []}
    th = next((f'<img src="{d}/v{last["v"]}/{s["id"]}.jpg" alt="" loading="lazy">' for s in last['scenes'] if s.get('poster')), '')
    styles = f' · 스타일 {len(last["scenes"])}가지' if len(last['scenes']) > 1 else ''
    rows.append(f'<a class="card" href="{d}/">{th}<span><span class="k">{html.escape(film_name(d))}</span><br>'
                f'<span class="d">{html.escape(" · ".join(filter(None, [m.get("date", "").replace("-", "."), m.get("title")])))}</span><br>'
                f'<span class="d">버전 {len(vs) or 1}개{styles}</span></span></a>')
open(os.path.join(pv, 'index.html'), 'w', encoding='utf-8').write(page_head('미리보기 목록 · word-log') + f'''
<h1>미리보기 목록</h1><p>만든 영상과 그 버전들 — 최신이 위</p>
{"".join(rows)}
</main></body></html>
''')
print('→ docs/previews/index.html', f'({len(rows)} films)')
