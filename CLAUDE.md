# word-log

주일 설교 → 30초 안팎 세로 숏츠(1080×1920). 영상은 HTML Canvas 장면으로 그리고 프레임 단위로 구워 MP4로 만든다.
도구는 motion-skills 레포의 **canvas-film** 스킬(`../motion-skills/canvas-film/`, 없으면 github.com/jungrok5/motion-skills).

## 순서 (컨펌 전에는 만들지 않는다)
1. **입력**: 유튜브 링크, 또는 설교 텍스트/설명.
   - 링크 → `sermons/<YYYY-MM-DD>-<본문>/sermon.json`(url, date, series, title, passage, preacher, church) 푸시 →
     Actions `summarize`가 Gemini API로 `summary.md` 생성(실패하면 3시간마다 재시도). Secret `GEMINI_API_KEY`.
   - 텍스트/설명 → 그 내용을 그대로 `summary.md`에 저장(url 없이 sermon.json만).
   - API가 영상을 거부하면 사용자에게 Gemini 앱 요약이나 스크립트를 받아 `summary.md`에 넣는다(출처를 맨 위에 적기).
2. **스타일 검색**: canvas-film `references/STYLE-INDEX.md`의 170개 전체에서 장면별 의미에 맞는 후보를 고른다(문서의 5단계).
3. **제안**: 추천 스타일 1개 + 대안 2–3개, 장면별 콘티(시간·화면·자막·소리)를 `sermons/.../storyboard.md`에 쓰고 사용자에게 보여준다.
4. **컨펌 후 제작**: `sermons/.../film/`(film.json, scenes/*.html, sound) → 스틸 확인 → MP4(`out/`, git에 넣지 않음).
5. **업로드**(예정): 유튜브 쇼츠·인스타 릴스.

## 규칙
- 성경 구절은 공식 본문(개역개정, 대한성서공회 bskorea.or.kr)에서 가져와 글자 그대로, 출처 줄을 붙인다.
- 설교자의 말로 자막에 넣는 문장은 영상/스크립트에서 확인된 것만. 요약문 표현은 '정리'로만 쓴다.
- 엔딩 카드: 설교 제목 · 본문 · 설교자 · 교회 · "전체 설교 보기".
- MP4·오디오 원본 같은 큰 파일은 커밋하지 않는다.
