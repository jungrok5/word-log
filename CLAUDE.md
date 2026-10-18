# word-log

말씀(설교·묵상·주제) 하나를 **30초 안팎의 임팩트 있는 세로 영상**(1080×1920)으로 만든다. 요약 영상이 아니다:
메시지 하나를 **하나의 강한 그림(비유·장면)**으로 보여 줘서, 처음 보는 사람도 30초 안에 느끼게 하는 것이 목표.
예) "작은 죄가 번진다" → 문틈이 조금씩 벌어지다 그 틈으로 악마가 문을 열고 들어온다.
영상은 HTML Canvas 장면으로 그리고 프레임 단위로 구워 MP4로 만든다.
도구는 motion-skills 레포의 **canvas-film** 스킬(`../motion-skills/canvas-film/`, 없으면 github.com/jungrok5/motion-skills).

## 순서 (컨펌 전에는 만들지 않는다)
1. **입력**: 유튜브 링크, 또는 텍스트/설명/주제 한 줄(주일 설교만이 아님).
   - 링크 → `sermons/<YYYY-MM-DD>-<본문>/sermon.json`(url, date, series, title, passage, preacher, church) 푸시 →
     Actions `summarize`가 Gemini API로 `summary.md` 생성(실패하면 3시간마다 재시도). Secret `GEMINI_API_KEY`.
   - 텍스트/설명 → 그 내용을 그대로 `summary.md`에 저장(url 없이 sermon.json만).
   - API가 영상을 거부하면 사용자에게 Gemini 앱 요약이나 스크립트를 받아 `summary.md`에 넣는다(출처를 맨 위에 적기).
2. **한 장면 찾기**: 자료에서 메시지 하나와 그것을 보여 줄 그림 하나를 고른다. 설교자가 직접 쓴 예화·비유·인용이 1순위
   (그 그림이 사람들 기억에 남는다), 없으면 직접 제안. 30초 구조: 훅(3초) → 점점 커짐 → 결정적 한 순간 → 메시지 → 출처.
   설명하지 말고 보여 준다. 자막은 짧게, 화면이 말하게.
3. **스타일 검색**: canvas-film `references/STYLE-INDEX.md`의 170개 전체에서 장면별 의미에 맞는 후보를 고른다(문서의 5단계).
4. **제안**: 추천 스타일 1개 + 대안 2–3개, 장면별 콘티(시간·화면·자막·소리)를 `sermons/.../storyboard.md`에 쓰고 사용자에게 보여준다.
5. **컨펌 후 제작 → HTML 미리보기 먼저**: `sermons/.../film/`(film.json, scenes/*.html, 사운드) → 스틸로 직접 확인 →
   `python3 tools/preview.py sermons/<폴더>` → 커밋·푸시 → 사용자에게 **미리보기 링크**
   `https://jungrok5.github.io/word-log/previews/<폴더>/`를 보낸다(브라우저가 직접 그림, 소리 포함, 인코딩 없음).
   **MP4는 사용자가 요청한 버전만** 굽는다: film 폴더에서 `node ../../../motion-skills/canvas-film/scripts/render.mjs v --scene <id>`
   (`scenes/<id>.wav`가 있으면 소리가 합쳐짐; `out/`은 git에 넣지 않음).
6. **업로드**(예정, OAuth 준비 중): 유튜브 쇼츠·인스타 릴스.

## 규칙
- 성경 구절은 공식 본문(개역개정, 대한성서공회 bskorea.or.kr)에서 가져와 글자 그대로, 출처 줄을 붙인다.
- 설교자의 말로 자막에 넣는 문장은 영상/스크립트에서 확인된 것만. 요약문 표현은 '정리'로만 쓴다.
- 엔딩 카드: 설교 제목 · 본문 · 설교자 · 교회 · "전체 설교 보기".
- MP4·오디오 원본 같은 큰 파일은 커밋하지 않는다.
