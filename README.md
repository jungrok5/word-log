# word-log

주일 설교를 30초 세로 숏츠(1080×1920)로 만드는 작업 공간. 영상은 HTML Canvas로 그리고
([motion-skills/canvas-film](https://github.com/jungrok5/motion-skills/tree/main/canvas-film)) 프레임 단위로 구워 MP4로 만든다.

## 흐름
1. `sermons/<날짜-본문>/sermon.json`에 유튜브 링크와 설교 정보를 넣고 푸시
2. GitHub Actions `transcribe`가 Gemini API로 설교 받아쓰기 → `transcript.md` 커밋 (Secret `GEMINI_API_KEY` 필요)
3. 콘티·스타일 제안 → 컨펌 → 장면 HTML 제작 → MP4 렌더
4. (예정) 유튜브 쇼츠·인스타 릴스 자동 업로드
