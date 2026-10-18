# Brief for scene authors — 문틈 (The Door), 30 s portrait short

## The film
A 30-second vertical short (1080×1920, Shorts/Reels) that makes one sermon point felt, not explained:
"small sins you wave through as 'this much is fine' are a door you open a little each time — until evil walks in."
(The preacher's illustration, after C.S. Lewis: a small gap keeps widening until a demon opens the door and comes in.)
Turn: the Passover — blood on the lintel and doorposts; the destroyer cannot enter (Exodus 12:23); "Christ our Passover lamb
has been sacrificed" (1 Cor 5:7).

## Story beats (identical in all four versions — read scenes/door-common.js, it is the source of truth)
- 0–3.8  dark; a closed door, a hair-thin thread of light at its edge. Caption: 이 정도는… 괜찮겠지?
- 4.0 / 6.3 / 8.6  the door opens a little more each time (a creak each), the wedge of light on the floor widens.
  Captions: 한 번쯤은 · 다들 하잖아 · 아무도 모를 거야. From 7.4 something breathes behind the door.
- 10.6  a long horned SHADOW slides into the light wedge on the floor; 12.6 long-nailed fingers curl around the door's edge.
  Caption: 죄가 문에 엎드려 있느니라 — 창세기 4:7
- 15.4  the door slams wide open; darkness floods across the floor toward the camera; 16.6–18.0 full black, silence.
  Caption (over black / darkness): 적은 누룩이 온 덩어리에 퍼지는 것을 / 알지 못하느냐 — 고린도전서 5:6
- 20.8 / 21.6 / 22.3  in the dark, a RED stroke is painted on the lintel, then the left post, then the right post
  (the ONLY colour in the whole film, DOOR.RED #9c1a1a or close). 23.0 the shadow flinches and withdraws.
  24.0–25.2 the door swings shut; the thread of light at its edge turns warm (hope, not threat).
  Caption: 우리의 유월절 양 곧 / 그리스도께서 희생되셨느니라 — 고린도전서 5:7
- 25.8–30  end card (DOOR.endCardDraw): title, passage, preacher · church, "전체 설교는 채널에서". Fade to black in the last ~0.6 s.
The demon is NEVER shown fully: only its shadow, silhouette and fingers. Scary by suggestion, tasteful (church audience,
all ages). No gore, no face close-ups. The blood is a painted stroke on wood, not dripping gore.

## Files
- Project: /home/user/word-log/sermons/2026-10-18-1cor5/film/  (scenes/lib.js = harness, scenes/door-common.js = script)
- Write ONLY your own scene file: scenes/door-<letter>.html (and, if you need it, scenes/door-<letter>.js helpers). Do not
  edit lib.js or door-common.js (tell me if you think they need a change). Do not git commit; I will.
- Load order in your page: <script src="lib.js"></script><script src="door-common.js"></script> then your code;
  Pilot.run({ W: Pilot.W, H: Pilot.H, dur: DOOR.DUR, fonts: [...], init, draw }).
- Harness contract and rules: /home/user/motion-skills/canvas-film/SKILL.md and references/SCENE-RULES.md (read both).
  Example scene: /home/user/motion-skills/canvas-film/examples/hello/scenes/dawn.html.
- Your style's full brief lives in the Lemo-Opuscar clone at /home/user/lemomo-ai/lemo-opuscar (path given in your task).
  Borrow the craft; write your own renderer; don't copy demo shots/characters; ignore "Clawd" (their mascot) and its orange.

## Rules that matter most here
- Portrait only (?o=v, 1080×1920) — you don't need a landscape composition (just don't crash in 'h').
- Safe zones: no words in the bottom 380 px or right 140 px (platform UI), nothing important in the top 160 px.
  Captions: use DOOR.captions(ctx, t, {…}) — you may pass your own colour/font/size/y to fit the style, but keep the
  exact text, timing and an upper-third position (y ≈ 330–640). End card: DOOR.endCardDraw(ctx, t, {…}) likewise.
  Text must be readable over the picture (darken behind it if needed).
- Deterministic pure draw(ctx, t): seeded randomness only (Pilot.rng / Pilot.noise / Pilot.fbm); anything accumulating must
  be rebuildable for any seek order. Build heavy textures once in init. Fonts installed locally: 'Noto Serif KR',
  'Noto Sans KR' (variable, all weights), 'Gowun Batang', 'NanumMyeongjo'. No network, no external images.
- Performance: we render 900 frames; keep one draw under ~150 ms at 1080×1920 (measure: time 20 seeks in the page).
- The machine has 4 CPUs shared with 3 other authors: render STILLS only, never a full video:
  cd /home/user/word-log/sermons/2026-10-18-1cor5/film && node /home/user/motion-skills/canvas-film/scripts/render.mjs v --scene door-<letter> --stills 1.5,5,7.5,9.5,12,14,15.9,17,19.5,22,23.6,25,27.5
  then LOOK at the PNGs in out/ (make a contact sheet with PIL to view several at once) and fix what you see:
  the door must read as a door, the light wedge on the floor must be believable perspective, the shadow must read as a
  horned figure, fingers must read as fingers on the door edge, the red strokes must be clearly on lintel + both posts,
  text must not sit on the key subject. Iterate until it is genuinely good — this is a pilot that sets the quality bar.
- Sound is handled separately (shared soundtrack on the same beats) — no audio in your page.

## Report back
Scene file path, a short description of how it looks beat by beat, measured ms per frame, the still paths of your final
check, and anything you'd still improve.
