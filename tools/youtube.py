#!/usr/bin/env python3
"""YouTube Data API for the word-log Brand channel (CLAUDE.md 업로드). Reads credentials from the environment only:
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN_WORDLOG   (never print them, never put them in a file or the chat)

  python3 tools/youtube.py whoami                         # which channel the token uploads to (must be word-log)
  python3 tools/youtube.py upload sermons/<folder> [--scene ID] [--privacy private|unlisted|public] [--dry-run]
        → film/out/<scene>-upload.mp4 with title/description/tags from upload.md, then the cover as thumbnail and the
          on-screen lines as a Korean caption track (SRT, from script.js). Writes sermons/<folder>/youtube.json.
  python3 tools/youtube.py caption sermons/<folder> --video VIDEO_ID [--scene ID]    # (re)upload the caption track only

Notes (motion-skills canvas-film LESSONS "Social platforms"):
- A Google API project that has not passed the YouTube audit uploads every video as private and LOCKED (even the owner
  can't publish it). Until the audit passes, upload by hand, or use the API for captions/descriptions/playlists only.
- OAuth consent screen in "Testing" → refresh tokens expire after 7 days (invalid_grant). Publish it to Production.
- A Brand Account: the token must have been granted while that channel was picked on the consent screen — `whoami`.
- Quota: upload ≈ 1,600 units, captions.insert ≈ 400, thumbnails.set ≈ 50 (10,000/day default).
"""
import argparse, json, os, re, subprocess, sys, urllib.error, urllib.parse, urllib.request

ENV = ('YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN_WORDLOG')
API = 'https://www.googleapis.com/youtube/v3'
UP = 'https://www.googleapis.com/upload/youtube/v3'
here = os.path.dirname(os.path.abspath(__file__))


def token():
    miss = [k for k in ENV if not os.environ.get(k)]
    if miss: sys.exit(f'missing environment variable(s): {", ".join(miss)} — set them in the environment settings (a new session picks them up)')
    body = urllib.parse.urlencode({'client_id': os.environ[ENV[0]], 'client_secret': os.environ[ENV[1]],
                                   'refresh_token': os.environ[ENV[2]], 'grant_type': 'refresh_token'}).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request('https://oauth2.googleapis.com/token', data=body), timeout=30) as r:
            return json.load(r)['access_token']
    except urllib.error.HTTPError as e:
        err = e.read().decode(errors='replace')
        hint = ' (refresh token expired or revoked — a consent screen in "Testing" expires them after 7 days)' if 'invalid_grant' in err else ''
        sys.exit(f'token refresh failed: HTTP {e.code} {json.loads(err).get("error", "") if err.startswith("{") else ""}{hint}')


def call(tok, method, url, data=None, headers=None, raw=False):
    h = {'Authorization': f'Bearer {tok}'}; h.update(headers or {})
    if data is not None and not raw: data = json.dumps(data).encode(); h.setdefault('Content-Type', 'application/json; charset=utf-8')
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            b = r.read(); return (json.loads(b) if b else {}), r.headers
    except urllib.error.HTTPError as e:
        sys.exit(f'{method} {url.split("?")[0]} → HTTP {e.code}: {e.read().decode(errors="replace")[:600]}')


def whoami(tok):
    d, _ = call(tok, 'GET', f'{API}/channels?part=snippet,status&mine=true')
    for c in d.get('items', []): print(f"channel: {c['snippet']['title']} ({c['id']}) · madeForKids={c.get('status', {}).get('madeForKids')}")
    if not d.get('items'): print('no channel for this token')
    return d.get('items', [])


def meta(folder):
    """title / description / tags from upload.md (the 유튜브 쇼츠 section)."""
    md = open(os.path.join(folder, 'upload.md'), encoding='utf-8').read()
    sec = md.split('## 유튜브 쇼츠', 1)[1].split('\n## ', 1)[0]
    title = re.search(r'- 제목[^\n]*?\):\s*(.+)', sec).group(1).strip()
    desc = re.search(r'- 설명:\n(.*?)\n- 고정 댓글', sec, re.S).group(1).strip()
    tags = [t.lstrip('#') for t in re.findall(r'#\S+', desc)]
    pin = re.search(r'- 고정 댓글[^\n]*?\):\s*(.+)', sec)
    return {'title': title[:100], 'description': desc[:4900], 'tags': tags[:15], 'pin': pin.group(1).strip() if pin else ''}


def srt(film):
    d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
    S = next(iter(d['scripts'].values())); out = []
    ts = lambda s: f'{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)):03d}'
    for i, ln in enumerate(S.get('lines', []), 1):
        text = ln[2] + (f'\n{ln[3]}' if len(ln) > 3 and ln[3] else '')
        out.append(f'{i}\n{ts(ln[0])} --> {ts(ln[1])}\n{text}\n')
    return '\n'.join(out)


def multipart(meta_obj, blob, ctype):
    b = 'wordlog' + os.urandom(8).hex()
    body = (f'--{b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(meta_obj, ensure_ascii=False)}\r\n'
            f'--{b}\r\nContent-Type: {ctype}\r\n\r\n').encode() + blob + f'\r\n--{b}--\r\n'.encode()
    return body, {'Content-Type': f'multipart/related; boundary={b}'}


def caption(tok, vid, film):
    body, h = multipart({'snippet': {'videoId': vid, 'language': 'ko', 'name': '한국어', 'isDraft': False}}, srt(film).encode('utf-8'), 'application/x-subrip')
    d, _ = call(tok, 'POST', f'{UP}/captions?uploadType=multipart&part=snippet', body, h, raw=True)
    print('caption track:', d.get('id'))


def upload(a):
    folder = os.path.abspath(a.folder); film = os.path.join(folder, 'film')
    cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8')); sid = a.scene or cfg['scenes'][0]['id']
    mp4 = os.path.join(film, 'out', f'{sid}-upload.mp4'); cover = os.path.join(film, 'out', f'{sid}-cover.jpg')
    if not os.path.exists(mp4): sys.exit(f'no {os.path.relpath(mp4)} — run tools/export.py first')
    m = meta(folder)
    body = {'snippet': {'title': m['title'], 'description': m['description'], 'tags': m['tags'], 'categoryId': '29',
                        'defaultLanguage': 'ko', 'defaultAudioLanguage': 'zxx'},
            'status': {'privacyStatus': a.privacy, 'selfDeclaredMadeForKids': False}}
    print(json.dumps({'file': os.path.relpath(mp4), **body}, ensure_ascii=False, indent=1))
    if a.dry_run: print('--dry-run: nothing sent'); return
    tok = token(); ch = whoami(tok)
    if not ch: sys.exit('this token has no channel — re-grant it with the word-log Brand channel picked')
    size = os.path.getsize(mp4)
    _, hd = call(tok, 'POST', f'{UP}/videos?uploadType=resumable&part=snippet,status', body,
                 {'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(size)})
    loc = hd['Location']
    with open(mp4, 'rb') as f: d, _ = call(tok, 'PUT', loc, f.read(), {'Content-Type': 'video/mp4'}, raw=True)
    vid = d['id']; print('uploaded:', f'https://youtu.be/{vid}', '·', d.get('status', {}).get('privacyStatus'), d.get('status', {}).get('uploadStatus'))
    if os.path.exists(cover):
        try:
            with open(cover, 'rb') as f: call(tok, 'POST', f'{UP}/thumbnails/set?videoId={vid}', f.read(), {'Content-Type': 'image/jpeg'}, raw=True)
            print('thumbnail set')
        except SystemExit as e: print('thumbnail not set (needs a verified channel):', str(e)[:200])
    caption(tok, vid, film)
    rec = os.path.join(folder, 'youtube.json'); log = json.load(open(rec)) if os.path.exists(rec) else []
    log.append({'scene': sid, 'video': vid, 'privacy': a.privacy, 'title': m['title']}); json.dump(log, open(rec, 'w'), ensure_ascii=False, indent=1)
    print('pinned-comment text (pin it in Studio — no API for pinning):', m['pin'])
    print('note: an unaudited API project leaves the video private and locked — check Studio.')


ap = argparse.ArgumentParser(usage=__doc__); sub = ap.add_subparsers(dest='cmd', required=True)
sub.add_parser('whoami')
u = sub.add_parser('upload'); u.add_argument('folder'); u.add_argument('--scene'); u.add_argument('--privacy', default='private', choices=['private', 'unlisted', 'public']); u.add_argument('--dry-run', action='store_true')
c = sub.add_parser('caption'); c.add_argument('folder'); c.add_argument('--video', required=True); c.add_argument('--scene')
a = ap.parse_args()
if a.cmd == 'whoami': whoami(token())
elif a.cmd == 'upload': upload(a)
elif a.cmd == 'caption': caption(token(), a.video, os.path.join(os.path.abspath(a.folder), 'film'))
