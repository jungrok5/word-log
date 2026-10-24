# Brief 2: package the 2026-10 styles as house-style kits (so any future topic can start from them)

Read `styles/KIT-BRIEF.md` first — the method, deliverables, check and report are the same. This round packages the styles
made since then. The owner's goal: later he picks a style by name, and a new film on a NEW topic is made in exactly that
look, starting from the kit (`python3 tools/new-film.py sermons/<folder> --style <slug>`), not from an old scene.

## What changes from brief 1
- **Worked example scenes** (the proven, reviewed, body-checked look — the kit must reproduce them exactly):
  - 1cor4 film (`sermons/2026-10-11-1cor4/film/scenes/`): `cross-blueprint.html` → `blueprint`, `cross-ukiyoe.html` →
    `ukiyoe`, `cross-papercut.html` → `papercut`, `cross-glass.html` → `glass`.
  - 17-style film (`sermons/2026-10-24-cross-styles/film/scenes/cs-<id>.html`) → slug = `<id>`: fogforest, spiritglow,
    cavesil, flatnight, flatcamp, storybook, risoline, monoroom, minicat, pastelbook, clover, inkwash, graphite,
    pendoodle, brushline, inkcomic, gamecartoon. (Their 6-s origins are in `sermons/2026-10-24-style-lab/` — reference only.)
  - channel intro (`sermons/2026-10-24-intro/film/scenes/intro-class.html`) → `mograph` (see its own section below).
- **The figure rig is part of the style.** These styles draw characters (pilgrims, foxes, bears, cats, birds, ghosts…).
  Two rounds of body checks (`/home/user/motion-skills/canvas-film/references/BODY-CHECK.md`; reports in
  `/tmp/claude-0/-home-user/d180dc74-da17-5fd4-b795-8a281ce524a8/scratchpad/rigrep/`) fixed arms from shoulders,
  2-bone IK with fixed bone lengths, hands drawn AT the grip point, one hand one object, near/far arm layering, set-down /
  pick-up in-betweens. Put the character drawing and rig in the kit as general functions (a figure with a pose: walk
  phase, crouch, kneel, look-up, arms reaching to given grip points, holding a long object on the shoulder / in front /
  upright, turning with a squash) so a new story gets correct bodies for free. Keep the species/design as the style's
  default character, with options (colours, accessory) where cheap.
- Kit also exports the style's world pieces generalised (ground/road, a gap/edge, a lit doorway/arch, sky, weather,
  light pools/glow, the style's texture/grain pass, caption and end-card styling, camera moves, the "hit" effect).
- **Template story (the same for every kit, so templates are comparable):** `script.example.js` =
  `{ DUR: 30, beat: { walk: [0, 4], kneel: 4.6, plant: 6.0, wait: [8, 13], sprout: 14.0, rise: 18.0, end: 26.0 }, lines: [[0.3, 3.8,
  '아무것도\n보이지 않아도'], [6.0, 9.5, '묻어 둔 것은'], [14.0, 17.6, '자라고 있었다']] }` + end card defaults.
  The style's character walks in, kneels and plants a seed in the ground, waits (the style's ambient motion), a sprout rises
  with the style's accent light at 14, the character stands and looks at it at 18, end card at 26. Draw it properly in the
  style (it's the style's demo card) — no placeholder boxes.
- **Register the kit** (write only inside `styles/<slug>/`; I merge shared files): put in your report (a) the README row
  `| \`<slug>\` | <look in Korean> | [<film> <id>](../sermons/...) | <carries well, Korean> |` and (b) a samples.json entry
  `{ "<slug>": { "film": "sermons/…/film", "scene": "<scene id>", "t": [3 good still times], "label": "…" } }`
  (check the format of the existing entries in `styles/samples.json`).
- **Refactor + identical output:** re-point the worked example scene at the kit (copy as `scenes/kit-<slug>.js` in that
  film's folder) and diff before/after stills — max channel diff ≤ 3 — at `0.5,3.7,7,10.6,14.8,18.9,19.7,22.4,24.3,28`
  (cross films) or the brief-1 times. ms/frame within ±15 %. If an exact refactor is impossible for a part, say which.
- Only touch: `styles/<slug>/*` and the worked example scene (+ its `kit-<slug>.js`). Other agents are doing other kits
  at the same time; keep scratch files under `/tmp/claude-0/-home-user/d180dc74-da17-5fd4-b795-8a281ce524a8/scratchpad/kits/<slug>/`.
  Don't commit.

## mograph (the intro) — a hybrid kit
The intro is a video-model dance (keyed sprite sequence in `scenes/art/dance/` + `meta.js` with foot contacts) over code
motion graphics. Package as `styles/mograph/`: (1) `kit.js` with a sprite-sequence player (deterministic frame by t, alpha
frames, contact-shadow), footfall hooks, and the scene modules generalised — window grid, red stage with orbiting 3D text
blocks, blueprint "drawn-in" filter (line extraction → colour), 3D keyboard with key press/glow and jamo pop + Korean
syllable assembly, bubbles + status pill + neon typing, manga filter (threshold + screentone, speed lines, onomatopoeia,
ink burst), kaleidoscope of earlier scenes + title, beat grid (BPM → bar lines) for cuts; (2) `tools/` inside the kit
folder: the keyer and footfall detector from
`/tmp/claude-0/-home-user/d180dc74-da17-5fd4-b795-8a281ce524a8/scratchpad/intro/tools/` (prep_dance.py, contacts.py) cleaned up
with usage; (3) STYLE.md including the video-model step (owner's rule: video models only when the owner asks — say so),
models/costs used (Kling 3 Pro ≈ 680 credits/s, start frame = end frame for seamless joins), and keying pitfalls; (4) a
template that runs WITHOUT a dance (a code placeholder figure) so the kit works with or without the video model.
