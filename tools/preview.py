#!/usr/bin/env python3
"""Publish a film's scenes as a live HTML preview on GitHub Pages (docs/previews/<sermon>/), no video encoding.

  python3 tools/preview.py sermons/2026-10-18-1cor5
→ docs/previews/2026-10-18-1cor5/index.html (one card per scene) + the scene pages, lib.js, shared js, soundtrack.m4a
Push, and ~1 min later it is live at https://jungrok5.github.io/word-log/previews/<sermon>/
The scenes draw themselves in the viewer's browser (portrait, ?o=v) with the soundtrack as the clock.
Encode MP4s only when asked: node ../motion-skills/canvas-film/scripts/render.mjs v --scene <id> (from the film folder).
"""
import html, json, os, re, shutil, subprocess, sys

if len(sys.argv) != 2:
    sys.exit(__doc__)
src = sys.argv[1].rstrip('/')
film = os.path.join(src, 'film')
meta = next((json.load(open(os.path.join(src, f), encoding='utf-8')) for f in ('source.json', 'sermon.json')
             if os.path.exists(os.path.join(src, f))), {})
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
out = os.path.join('docs', 'previews', os.path.basename(src))
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out)
sc = os.path.join(film, 'scenes')
for f in os.listdir(sc):
    if f.endswith('.js'):
        shutil.copy(os.path.join(sc, f), out)

# Preview harness: open on a poster frame (not the black first frame) and start from 0 on the first play.
lib = open(os.path.join(sc, 'lib.js'), encoding='utf-8').read()
for a, b in [("let cur = 0, playing = false", "let cur = (window.POSTER_T || 0), first = true, playing = false"),
             ("const setPlay = p => { playing = p;", "const setPlay = p => { if (p && first) { first = false; cur = 0; } playing = p;")]:
    assert a in lib, a
    lib = lib.replace(a, b)
open(os.path.join(out, 'lib.js'), 'w', encoding='utf-8').write(lib)

# A big centred play button over the poster (the harness's own controls sit small at the bottom).
OVERLAY = """<script>window.POSTER_T = %s;</script>
<style>#pv-play{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9;background:rgba(0,0,0,.25);
border:0;color:#fff;font:600 18px/1.4 system-ui,sans-serif;cursor:pointer}#pv-play span{display:flex;flex-direction:column;align-items:center;gap:10px}
#pv-play b{display:flex;align-items:center;justify-content:center;width:84px;height:84px;border-radius:50%%;background:rgba(0,0,0,.6);
border:2px solid rgba(255,255,255,.85);font-size:34px;padding-left:6px;box-sizing:border-box}</style>
<button id="pv-play" type="button" hidden><span><b>▶</b>탭해서 재생 · 소리 켜기</span></button>
<script>(function w(){var pp=document.getElementById('pp'),o=document.getElementById('pv-play');
if(!pp||!window.__ready)return setTimeout(w,100);o.hidden=false;o.onclick=function(){o.remove();pp.click();};})();</script>
"""

audio = cfg.get('audio')           # e.g. "scenes/door-norm.wav" (relative to film/)
if audio and not os.path.exists(os.path.join(film, audio)):
    print('(no soundtrack yet — preview without sound)'); audio = None
if audio:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(film, audio), '-c:a', 'aac', '-b:a', '128k',
                    os.path.join(out, 'soundtrack.m4a')], check=True)

cards = []
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
    page = page.replace('</body>', OVERLAY % s.get('poster', cfg.get('poster', 9.5)) + '</body>', 1)
    open(os.path.join(out, s['id'] + '.html'), 'w', encoding='utf-8').write(page)
    cards.append(f'<a class="card" href="{s["id"]}.html?o=v"><span class="k">{html.escape(s["label"])}</span>'
                 f'<span class="d">{s.get("dur", "")}초 · 탭해서 재생</span></a>')
    for cn in cuts:
        cards.append(f'<a class="card" href="{s["id"]}.html?o=v&cut={cn}"><span class="k">{html.escape(s["label"])} · {cn} 버전</span>'
                     f'<span class="d">탭해서 재생</span></a>')

title = cfg.get('title', meta.get('title', ''))
import datetime
when = ''
if meta.get('date'):
    dd = datetime.date.fromisoformat(meta['date'])
    when = ' '.join(filter(None, [dd.strftime('%Y.%m.%d'), '주일' if dd.weekday() == 6 else '', meta.get('service')]))
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>미리보기 · {html.escape(title)}</title>
<style>
:root{{--bg:#faf9f6;--fg:#1d1c1a;--muted:#6b675f;--card:#fff;--line:#e4e0d8;--acc:#9c1a1a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#141311;--fg:#ecebe7;--muted:#a19c92;--card:#1e1c19;--line:#2e2b27;--acc:#e0584f}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}}
main{{max-width:640px;margin:0 auto;padding:32px 16px 48px}}
h1{{font-size:1.35rem;margin:0 0 4px}} p{{color:var(--muted);margin:0 0 20px}}
.card{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px;margin:0 0 10px;border:1px solid var(--line);
border-radius:12px;background:var(--card);color:inherit;text-decoration:none}}
.card:active{{transform:scale(.99)}} .k{{font-weight:600}} .d{{color:var(--muted);font-size:.9rem;white-space:nowrap}}
small{{color:var(--muted)}}
</style></head><body><main>
<h1>{html.escape(title)}</h1>
<p>{html.escape(" · ".join(filter(None, [when, meta.get("passage"), meta.get("preacher"), meta.get("church"), meta.get("book") and "『" + meta["book"] + "』", meta.get("author"), meta.get("by")])))}</p>
{"".join(cards)}
<small>브라우저가 직접 그리는 미리보기예요. 영상 아래 ▶ 버튼을 누르면 소리와 함께 재생돼요. 마음에 드는 버전을 알려주시면 MP4로 만들어 드려요.</small>
</main></body></html>
''')
print('→', out, f'({len(cfg["scenes"])} scenes)')

# The list of every preview (docs/previews/index.html), newest first — rebuilt on each run so no film drops off the site.
rows = []
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pv = os.path.join(root, 'docs', 'previews')
for d in sorted((x for x in os.listdir(pv) if os.path.exists(os.path.join(pv, x, 'index.html'))), reverse=True):
    m, fc = {}, {}
    for mp in ('source.json', 'sermon.json'):
        q = os.path.join(root, 'sermons', d, mp)
        if os.path.exists(q): m = json.load(open(q, encoding='utf-8')); break
    q = os.path.join(root, 'sermons', d, 'film', 'film.json')
    if os.path.exists(q): fc = json.load(open(q, encoding='utf-8'))
    labels = ' · '.join(s.get('label', s['id']) for s in fc.get('scenes', []))
    sb = os.path.join(root, 'sermons', d, 'storyboard.md')   # the film's name: the storyboard's title (before the source)
    if os.path.exists(sb):
        h = open(sb, encoding='utf-8').readline().split('—', 1)[-1].split('(')[0].strip().strip('#').strip()
        if h: labels = h + (f' — {len(fc.get("scenes", []))}가지 스타일' if len(fc.get('scenes', [])) > 1 else '')
    rows.append(f'<a class="card" href="{d}/"><span><span class="k">{html.escape(labels or d)}</span><br>'
                f'<span class="d">{html.escape(" · ".join(filter(None, [m.get("date", "").replace("-", "."), m.get("title"), m.get("passage")])))}</span></span>'
                f'<span class="d">{len(fc.get("scenes", []))}편 →</span></a>')
open(os.path.join(pv, 'index.html'), 'w', encoding='utf-8').write(f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>미리보기 목록 · word-log</title>
<style>
:root{{--bg:#faf9f6;--fg:#1d1c1a;--muted:#6b675f;--card:#fff;--line:#e4e0d8}}
@media (prefers-color-scheme:dark){{:root{{--bg:#141311;--fg:#ecebe7;--muted:#a19c92;--card:#1e1c19;--line:#2e2b27}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}}
main{{max-width:640px;margin:0 auto;padding:32px 16px 48px}} h1{{font-size:1.35rem;margin:0 0 16px}}
.card{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px;margin:0 0 10px;border:1px solid var(--line);
border-radius:12px;background:var(--card);color:inherit;text-decoration:none}} .k{{font-weight:600}} .d{{color:var(--muted);font-size:.9rem}}
</style></head><body><main>
<h1>미리보기 목록</h1>
{"".join(rows)}
</main></body></html>
''')
print('→ docs/previews/index.html', f'({len(rows)} films)')
