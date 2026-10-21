#!/usr/bin/env python3
"""Draft the upload text for each platform from the film's source and script → sermons/<folder>/upload.md.
The end card on screen stays short; credits, the full verse, the link and the CTA live here. Claude refines the hook
title and the pinned question by hand before uploading (the draft marks them ✍️).
  python3 tools/upload-meta.py sermons/<folder>"""
import json, os, subprocess, sys
folder = sys.argv[1].rstrip('/'); film = os.path.join(folder, 'film'); here = os.path.dirname(os.path.abspath(__file__))
d = json.loads(subprocess.run(['node', os.path.join(here, 'script-json.mjs'), film], capture_output=True, text=True, check=True).stdout)
src = d['source'] or {}; S = next((v for v in d['scripts'].values() if v), {})
lines = S.get('lines', []); verses = [(s.replace('\n', ' '), r) for _, _, s, *r in lines if r]
date = str(src.get('date', '')).replace('-', '.')
t = src.get('type')
if t == 'sermon':
    credit = ' · '.join(filter(None, [src.get('title'), src.get('passage'), date, src.get('church'), src.get('preacher')]))
    link = f"전체 설교 ▶ {src['url']}" if src.get('url') else '전체 설교는 채널에서'
elif t == 'book':
    credit = ' · '.join(filter(None, [f"『{src.get('book')}』", src.get('where'), src.get('author'), src.get('publisher')]))
    link = src.get('url', '')
else:
    credit = ' · '.join(filter(None, [src.get('title'), src.get('passage'), src.get('by')])); link = src.get('url', '')
hook = (lines[0][2].replace('\n', ' ') if lines else src.get('title', ''))
verse_block = '\n'.join(f'"{v}" — {r[0]}' for v, r in verses)
tags = src.get('tags') or ['말씀', '묵상', '쇼츠']
ht = ' '.join('#' + x.replace(' ', '') for x in tags[:5])
md = f"""# 업로드 문구 — {src.get('title', '')}

> 초안: tools/upload-meta.py. ✍️ 표시는 올리기 전에 다듬는다. 화면의 엔딩 카드는 짧게, 출처·링크·전체 구절은 여기에.

## 공통
- 출처: {credit}
- 링크: {link or '(없음)'}
- 성경 구절(화면에 나온 그대로):
{verse_block or '(없음)'}

## 유튜브 쇼츠
- 제목 ✍️ (40자 안쪽, 첫 화면의 질문을 그대로 — 클릭보다 '끝까지 보기'를 위한 제목): {hook}
- 설명:
{hook}

{verse_block}

{credit}
{link}

{ht}
- 고정 댓글 ✍️ (영상의 메시지를 보는 사람 자신에게 묻는 한 줄 질문 + 링크): (질문) · {link}

## 인스타 릴스
- 캡션(첫 줄 = 훅, 125자 안에서 잘림): {hook}
  {verse_block.splitlines()[0] if verse_block else ''}
  {credit}
  {ht}
- 파일: film/out/<장면>-upload.mp4 (tools/export.py, H.264) · 앱 설정에서 \"최고 화질로 업로드\" 켜기
- 커버: film/out/<장면>-cover.jpg — 얼굴·제목이 가운데 3:4(y 240–1680) 안에 있는지 확인(프로필 격자는 그만큼만 보임)

## 틱톡
- 캡션: {hook} {ht}

## 올린 뒤 (metrics.md에 기록)
- 48시간·7일 뒤: 조회수, 평균 시청 비율(%), 넘김 비율, 다시 보기, 공유·저장 — 어디서 넘기는지(유지 그래프의 급락 지점과 장면)
"""
open(os.path.join(folder, 'upload.md'), 'w', encoding='utf-8').write(md); print('→', os.path.join(folder, 'upload.md'))
