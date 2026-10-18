# word-log

주일 설교를 30초 안팎 세로 숏츠(1080×1920)로 만드는 작업 공간. 영상은 HTML Canvas로 그리고
([motion-skills/canvas-film](https://github.com/jungrok5/motion-skills/tree/main/canvas-film)) 프레임 단위로 구워 MP4로 만든다.

1. `sermons/<날짜-본문>/sermon.json`에 유튜브 링크와 설교 정보 → Actions `summarize`가 Gemini API로 `summary.md` 생성
   (텍스트로 받은 설교는 `summary.md`에 바로 저장)
2. 스타일 검색 → 콘티(`storyboard.md`) → 컨펌 → 장면 HTML 제작 → MP4 렌더
3. (예정) 유튜브 쇼츠·인스타 릴스 자동 업로드

자세한 순서와 규칙은 `CLAUDE.md`.
