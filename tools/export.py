#!/usr/bin/env python3
"""Make the MP4 to upload (only for the version the user picked — CLAUDE.md 제작 7).

  python3 tools/export.py sermons/2026-10-18-lie [--scene lie-charcoal] [--rerender]
→ film/out/<scene>-v.mp4          the frame-by-frame master (canvas-film render.mjs; skipped if newer than the scene)
  film/out/<scene>-upload.mp4     the copy to upload to YouTube Shorts / Instagram Reels / TikTok:
                                  H.264 High, 1080×1920, 30 fps, ~12 Mbps cap, closed GOP, a keyframe every 2 s,
                                  no B-frames, AAC 48 kHz 192k, faststart
  film/out/<scene>-cover.jpg      the cover (the poster frame), 1080×1920

Why these settings (motion-skills canvas-film LESSONS "Social platforms"): video sites re-encode uploads in chunks cut
at keyframes; open-GOP / B-frame files can show a later frame for a moment after a cut on some phones. Instagram
re-compresses hard and plays H.264 best (and turn on "최고 화질로 업로드" in the app). The soundtrack is already −14 LUFS.
Rendering takes minutes of CPU — run it as a tracked background task, never a detached process.
"""
import argparse, json, os, subprocess, sys

ap = argparse.ArgumentParser(usage=__doc__)
ap.add_argument('folder'); ap.add_argument('--scene'); ap.add_argument('--rerender', action='store_true')
a = ap.parse_args()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
film = os.path.join(os.path.abspath(a.folder), 'film')
cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8'))
sid = a.scene or cfg['scenes'][0]['id']
sc = next((s for s in cfg['scenes'] if s['id'] == sid), None) or sys.exit(f'no scene {sid} in film.json')
render = os.path.join(root, '..', 'motion-skills', 'canvas-film', 'scripts', 'render.mjs')
if not os.path.exists(render): sys.exit('needs ../motion-skills (canvas-film render.mjs) next to word-log')
out = os.path.join(film, 'out'); os.makedirs(out, exist_ok=True)
master = os.path.join(out, f'{sid}-v.mp4')
scenes = os.path.join(film, 'scenes')
newest = max(os.path.getmtime(os.path.join(scenes, f)) for f in os.listdir(scenes) if f.endswith(('.html', '.js', '.wav')))
if a.rerender or not os.path.exists(master) or os.path.getmtime(master) < newest:
    print(f'rendering {sid} (frame by frame — minutes) …', flush=True)
    subprocess.run(['node', os.path.abspath(render), 'v', '--scene', sid], cwd=film, check=True)
up = os.path.join(out, f'{sid}-upload.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', master,
                '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-maxrate', '12M', '-bufsize', '24M',
                '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-bf', '0',
                '-flags', '+cgop', '-x264-params', 'open-gop=0',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', up], check=True)
pt = sc.get('poster', cfg.get('poster', 9.5))
subprocess.run(['node', os.path.abspath(render), 'v', '--scene', sid, '--stills', str(pt)], cwd=film, check=True, capture_output=True)
tt = str(pt)[:-2] if str(pt).endswith('.0') else str(pt)
cover = os.path.join(out, f'{sid}-cover.jpg')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(out, f'still-{sid}-v-{tt.replace(".", "_")}.png'), '-q:v', '3', cover], check=True)
probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,has_b_frames',
                        '-of', 'compact=p=0:nk=1', up], capture_output=True, text=True).stdout.split()
print('→', os.path.relpath(up, root), '·', ' '.join(probe))
print('→', os.path.relpath(cover, root), '(cover: keep the title/face inside the centre 3:4, y 240–1680, for the Instagram grid)')
