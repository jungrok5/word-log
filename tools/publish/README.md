# 올리기 도구 (tools/publish) — 관리자 PC에서

영상 하나(고른 장면 하나)를 **유튜브 쇼츠 · 인스타 릴스 · 스레드 · 틱톡**에 올리는 도구입니다. one-scroll-bible의
`motion/youtube/studio-*.js`, `motion/social/*`에서 실제로 써 본 방식을 그대로 옮기고, word-log 구조(`sermons/<폴더>`,
`upload.md`, 장면 여러 개 중 하나, 한국어 채널 @word-log 하나)에 맞췄습니다.

구글 API 감사를 통과하기 전에는 API로 올린 영상이 비공개로 잠기므로(`tools/youtube.mjs` 머리말), **실제 업로드는 이 브라우저
도우미로** 합니다. 도우미는 이미 로그인된 브라우저를 쓰고 **API 키·비밀번호를 쓰지 않습니다**. 클라우드 세션은 관리자 PC의
브라우저를 움직일 수 없으므로, 이 과정은 **관리자 PC의 로컬 Claude Code 세션 + Chrome의 Claude in Chrome 확장**으로 합니다.

| 파일 | 하는 일 |
|---|---|
| `sheet.mjs` | 다리: `upload.md` + `film.json` + `posted.json` → 플랫폼별 문구·파일·시각·**준비 여부**(✍️ 초안, "(질문)" 같은 빈자리, MP4 없음 → 막음). `tools/youtube.mjs`도 같은 것을 씀 |
| `plan.mjs` | 무엇이 올라갈지 보여 주고 점검 (`--json` = 도우미가 받는 것과 같음, `--need youtube,instagram` = 안 되면 exit 1) |
| `serve.mjs` · `relay.html` | 로컬 파일 서버 `127.0.0.1:8766` — `/plan.json`(요청마다 upload.md에서 새로 만듦) `/video.mp4` `/cover.jpg`, 그리고 CSP가 막는 사이트용 중계 팝업 |
| `studio-upload.js` | 유튜브 스튜디오: 비공개 업로드 또는 예약 업로드 (제목·설명·태그·아동용 아님·AI 아님·한국어·알림 켬) |
| `studio-publish.js` | 비공개로 올린 쇼츠를 지금 공개 |
| `studio-comment.js` | 시청 페이지에서 고정 댓글 달기·고치기 |
| `studio-playlist.js` | 설교 시리즈 재생목록 (첫 영상: 만들기 · 다음부터: 추가) |
| `studio-describe.js` | upload.md를 고친 뒤 올라간 제목·설명을 다시 맞추고 읽어서 확인 |
| `meta-reels.js` | Meta 비즈니스 도구에서 인스타 릴스 예약 |
| `threads-reels.js` | threads.com에서 스레드 예약 |
| `cover.py` | (선택) 인스타 프로필 격자 미리보기, 커버에 한 줄 얹기 |
| `posted.mjs` | 기록 `sermons/<폴더>/posted.json` (어느 장면을, 어디에, id·URL·시각) + 전체 현황표 |

## 준비 (PC에서 한 번)
- word-log 클론, 그 옆에 `motion-skills` 클론(MP4 만들 때 `tools/export.py`가 씀). Node 22, Python 3 + Pillow, ffmpeg.
  윈도우에서는 `python3` 대신 `python`.
- Chrome + **Claude in Chrome** 확장, 그리고 word-log 폴더에서 연 로컬 Claude Code 세션.
- **PC 시간대 = 한국(Asia/Seoul)**. 예약 도우미는 아니면 멈춥니다(스튜디오·비즈니스 도구는 브라우저 시간대로 예약).
- 계정 (one-scroll-bible과 같은 브라우저라 **페이지마다 먼저 확인**):
  - 유튜브: 오른쪽 위 계정 전환 → **word-log** 브랜드 계정. 스튜디오 주소가 `/channel/UCrzEUsnUGuptKGVs-z2j1Ig/…`여야 함
    (도우미가 다른 채널이면 거부).
  - Meta 비즈니스 도구: 왼쪽 위 비즈니스가 word-log 인스타가 연결된 곳인지. 처음 한 번 인스타 계정을 연결해야 할 수 있음.
    게시 위치에 페이스북 페이지도 켜져 있는지 확인(인스타만 올릴지는 관리자 결정).
  - 스레드: 로그인한 프로필이 word-log인지.

## 순서 — 영상 하나
**0. 확정** (클라우드 세션에서 해도 됨): 관리자가 장면(`--scene`)을 고르고, `upload.md`의 ✍️를 확정합니다.
확정된 줄은 `- 제목 ✍️ → **제목**`, `- 고정 댓글 ✍️ → **질문** · 전체 설교 ▶ 링크` 꼴. 초안이 남아 있거나 "(질문)" 같은
빈자리가 있으면 모든 도구가 거부합니다. 인스타 해시태그는 5개까지(그 이상이면 경고). 스레드 글은 upload.md에 `## 스레드`가
있으면 그것을, 없으면 인스타 캡션 + 설교 링크 + 주제 태그 하나로 만듭니다.

**1. MP4** — `film/out/`은 git에 없습니다. PC에서:
```
python tools/export.py sermons/<폴더> --scene <id>        # → film/out/<id>-upload.mp4 + <id>-cover.jpg (몇 분)
```
(PC에 렌더 환경이 없으면 클라우드 세션이 만들어 GitHub 릴리즈로 넘길 수도 있습니다:
`gh release create up-<폴더> film/out/<id>-upload.mp4 film/out/<id>-cover.jpg` → PC에서
`gh release download up-<폴더> -D sermons/<폴더>/film/out`. 공개 저장소면 릴리즈도 누구나 받을 수 있으니 다 올린 뒤 지웁니다.)

**2. 점검**
```
node tools/publish/plan.mjs sermons/<폴더> --scene <id> --at 2026-10-26T19:00     # 시각은 한국 시간
python tools/publish/cover.py sermons/<폴더> --scene <id>                           # (선택) film/out/<id>-grid.jpg
```
✗가 있으면 고치고 다시. `--at`을 빼면 이미 정한 유튜브 시각, 그것도 없으면 내일 19:00. 유튜브 예약은 15분 단위만.
커버에 글을 얹는 `--title`/`--text`는 화면 자막과 겹치기 쉬우니 결과 그림을 꼭 보고 씁니다(보통은 포스터 장면 그대로).

**3. 서버 켜기** (다른 터미널에서, 끝날 때까지 켜 둠)
```
node tools/publish/serve.mjs sermons/<폴더> --scene <id> --at 2026-10-26T19:00
```

**4. 도우미 쓰는 법 (Claude in Chrome)** — 로컬 Claude가 도우미 파일을 **읽어서 그 내용 전체를** 확장의 javascript 도구로
그 페이지에 실행합니다(스튜디오는 Trusted Types 때문에 받아 온 코드를 eval할 수 없음 — 코드 자체를 붙여 넣어야 함).
도구는 45초에 끊기므로 긴 작업은 `.then(r => window.__wlResult = r)`로 시작만 하고, 나중에 `window.__wlResult`를 읽습니다.
페이지를 새로 고치면 함수가 사라지니 다시 붙여 넣습니다. 결과에 나온 `cmd`(posted.mjs 명령)를 로컬에서 실행해 기록합니다.

| # | 어디서 | 할 일 |
|---|---|---|
| 1 | `studio.youtube.com/channel/UCrzEUsnUGuptKGVs-z2j1Ig/videos/upload?d=ud` | `studio-upload.js` → `__wlUpload()` (비공개) 또는 `__wlUpload({ mode: 'schedule' })` (예약 — 관리자 "예" 후) → `cmd` 실행 |
| 2 | 스튜디오 | 처리가 끝날 때까지 기다려 확인: 쇼츠로 잡혔는지, HD, 저작권 검사, 제목·설명 |
| 3 | 스튜디오 콘텐츠 페이지 | (비공개로 올렸을 때만) `studio-publish.js` → `__wlPublish('<id>')` — **관리자 허락 후** |
| 4 | `www.youtube.com/watch?v=<id>` (`/shorts/` 아님) | 공개된 뒤 `studio-comment.js` → 파일 머리말 순서(⋮ 메뉴·고정 확인은 **실제 클릭**) → `cmd` |
| 5 | 스튜디오 | `studio-playlist.js` — 시리즈 첫 영상: 만들기 → 새 재생목록(실제 클릭) → `__wlPlaylistCreate()`; 다음부터 `__wlPlaylistAdd('<id>')` |
| 6 | `business.facebook.com` 콘텐츠 | `meta-reels.js` → 빨간 **WL RELAY** 실제 클릭 → `await __loadPlan()` → 파일 머리말 순서(캡션은 **실제 키 입력**) → `__finish()` → `cmd` |
| 7 | `threads.com` | `threads-reels.js` → WL RELAY → `await __loadPlan()` → 머리말 순서 → `__bannerOk()` → 예약 실제 클릭 → `cmd` |
| 8 | `tiktok.com/upload` | 손으로: `-upload.mp4` + `plan.tiktok.caption`(plan.mjs가 보여 줌), 같은 시각 예약 → `node tools/publish/posted.mjs sermons/<폴더> tiktok status=scheduled at=… via=web` |
| 9 | upload.md를 고쳤다면 | `studio-describe.js` → `__wlDescribe('<id>')` (제목·설명을 다시 맞추고 읽어서 확인) |

**5. 기록과 수치**: `node tools/publish/posted.mjs` → 모든 영상의 현황표. 48시간·7일 뒤
`node tools/youtube.mjs stats sermons/<폴더>`(id는 posted.json에서) → `metrics.md`. posted.json은 커밋합니다(작은 파일).

## 공개 정책 (word-log) — 관리자 확정 전 기본값
| | |
|---|---|
| 한 영상 = 한 장면 | 고른 장면 하나를 모든 플랫폼에. 처음 기록한 장면이 posted.json에 고정되어 다른 장면은 거부 |
| 순서 | 유튜브 비공개 업로드 → 처리·화질 확인 → 공개(또는 예약) → 같은 시각에 인스타·스레드 예약 → 틱톡(손으로) |
| 시각 | 기본 저녁 7시(한국) — one-scroll-bible 릴스와 같은 시각. 영상마다 `--at`으로 바꿈 |
| 간격 | 다음 영상은 앞 영상의 48시간 수치(metrics.md)가 쌓인 뒤 — 어느 영상이 왜 잘됐는지 섞이지 않게 |
| 허락 | 공개·예약·고정 댓글·게시는 공개적인 행동 — **그 영상에 대해 관리자가 "예"한 뒤에만**. 비공개 업로드는 준비 단계 |
| 알림 | 구독자 알림 켬 (한국어 채널 하나) |
| 표시 | 아동용 아님 · 변경/합성 콘텐츠 "아니요"(그림은 코드로 그린 것 — 실제처럼 보이는 합성 인물·사건이 아님. 키아트·영상 모델을 쓴 영상이면 다시 판단) |
| 링크 | 화면에는 없음. 설명란·고정 댓글·스레드 글에 설교 원본 링크. 인스타 캡션은 링크가 안 눌림 |
| 고정 댓글 | 공개 직후 (공개 전에는 댓글이 닫혀 있음) |

## 함정 (one-scroll-bible에서 겪은 것만)
- **탭에 남은 예전 자료를 쓰면 안 된다** — 공개 영상 설명에 `…: undefined`가 1~2분 저장된 적이 있다. 그래서 `/plan.json`은
  요청마다 upload.md에서 새로 만들고(`no-store`), 도우미는 빈 값·"undefined"면 저장하지 않는다. `includes(undefined)`는 검사가 아니다.
- 확장의 파일 올리기는 10 MB까지라 MP4는 로컬 서버에서 페이지가 직접 받는다. https 페이지가 127.0.0.1에 닿도록 서버가
  `Access-Control-Allow-Private-Network`를 보낸다. 시청 페이지(www.youtube.com)도 허용해야 한다(빠져 있어 "Failed to fetch"가 났었다).
- 비즈니스 도구·스레드는 CSP가 127.0.0.1을 막는다 → `relay.html` 팝업이 받아 넘긴다. 팝업은 **실제 클릭**으로만 열린다(WL RELAY).
- 예약 **시간 칸은 목록에서 골라야** 저장된다(입력하면 0시로 저장). 날짜 칸은 업로드 창 밖 팝업에 있다.
- 언어 드롭다운은 첫 클릭을 무시할 때가 있다 → "한국어"가 될 때까지 다시.
- 편집 페이지는 pushState로 가면 덜 그려지거나 앞 영상이 남아 있을 수 있다 → 목록을 거쳐 다시 열고, 그 영상 id인지 확인.
- 업로드 창을 같은 `?d=ud`로 다시 밀면 아무 일도 없다 → 목록으로 갔다가 다시(`__wlReopen`).
- 댓글의 ⋮ 메뉴와 고정 확인 버튼은 스크립트 클릭에 반응하지 않을 때가 많다 → 위치만 스크립트로 구하고 **실제 클릭**.
  글 넣기·저장은 `execCommand('insertText')` + `insertLineBreak` 후 스크립트 클릭으로 된다.
- **저장 확인 전에 다음으로 넘어가면 저장이 사라진다** — 결과를 읽은 뒤 넘어간다.
- 비즈니스 도구 캡션은 **실제 키 입력**으로. 스크립트로 넣으면 해시태그가 뒤섞이고 편집기가 멈춘다("Reel details are
  temporarily unavailable"). 작성 창은 콘텐츠 페이지의 "Create reel"로 연다(주소로 열면 새로 고침 → 도우미·중계 다시).
  "copyright may be found" 안내는 10초쯤 뒤 사라진다. 확인은 Planner(주간 보기)로 — 예약 목록은 몇 분 늦다.
- 스레드: "예약…" 메뉴는 합성 포인터 누르기(`__press`)로 열린다. 시간 칸은 좌표로 누르지 말고 `__focusT`로 — 빗나가면 숫자가
  캡션에 들어간다("#성경1900"). 날짜 고른 뒤 "완료"는 **다른 도구 호출에서** 실제 클릭(같은 묶음이면 저장 없이 닫힘).
- 인스타: 앱의 "최고 화질로 업로드"를 켠다. 프로필 링크는 앱에서만 바뀐다. 비즈니스 도구 예약에는 스레드 동시 게시가 없다.
- 도우미는 대화나 임시 폴더에만 두지 않는다 — 다음 세션이 다시 만들다 실수한다(one-scroll-bible의 serve.mjs·studio-publish.js가 그랬다).

## one-scroll-bible에서 바꾼 것
- 다국어 매니페스트(`manifest.mjs/json/md`, `shorts-titles.md`) → `sheet.mjs`가 upload.md를 읽어 `/plan.json`을 그때그때 만든다.
- `uploaded.json`·`instagram.json` → 영상마다 `posted.json` (+ `posted.mjs` 현황표).
- `studio-shorts.js`의 예약 업로드는 `studio-upload.js`의 `mode: 'schedule'`로 합침. 21편 연속·언어별 알림 끄기·관련 동영상
  연결은 뺌(한 편씩, 한국어 채널; 관련 동영상은 자기 채널 영상에서 고르는데 설교 원본은 교회 채널 영상 — 필요해지면 다시).
- `studio-publish.js`의 썸네일 A/B 테스트는 뺌 — 쇼츠는 맞춤 썸네일을 받지 않는다.
- 서버는 저장소 전체가 아니라 **그 영상의 파일 세 개만** 내준다. 포트 8766(one-scroll-bible은 8765) — 두 서버가 섞이지 않게.
- 모든 도우미가 채널(@word-log)·준비 여부·이미 올렸는지(posted.json)·영상 id 일치를 먼저 확인하고, 예약은 한국 시간인지도 본다.
- 함수 이름 `__osb*` → `__wl*`, 중계 버튼 OSB RELAY → WL RELAY.

## 확인 상태
- 클라우드에서 확인함 (2026-10-24): upload.md 읽기(1cor4 — 제목·고정 댓글 초안 거부, "(질문)" 거부; lie — 통과), 장면 여러 개일 때
  `--scene` 요구, 시각 변환(스튜디오·비즈니스 도구·스레드 형식), posted.json 기록·검증·장면 고정, serve.mjs 응답(파일 크기·바이트 일치,
  CORS 허용/거부, 사전 요청, 다른 경로 404, POST 405, 실행 중 upload.md 수정 즉시 반영), 도우미들의 거부 경로(다른 채널, 초안,
  지난 시각, 15분 단위 아님, 한국 시간 아님, 이미 올림, 다른 영상 id), `node --check`, `youtube.mjs upload --dry`.
- **PC에서 처음 확인할 것**: 실제 페이지에서의 모든 클릭·입력 — 특히 쇼츠 업로드 창(긴 영상과 같은 창이라고 가정),
  `__wlPlaylistAdd`(재생목록 칸 마크업은 추측 — 안 되면 손으로 체크), word-log 계정으로의 비즈니스 도구·스레드 흐름,
  스튜디오 메뉴 링크에서 채널 id를 읽는 부분(편집 페이지).
