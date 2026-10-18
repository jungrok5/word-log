# Brief: turn a finished scene into a reusable house-style kit

word-log makes ~30 s portrait (1080×1920) shorts that show ONE sermon point as ONE strong image. The first film
("문틈", sermons/2026-10-18-1cor5/film/) was built in four styles. Each scene file mixes two things:
(1) the STYLE — materials, rendering pipeline, palette, texture, light, motion grammar, typography, post passes — and
(2) the STORY — the door, the light wedge, the horned shadow, the claw, the red doorposts, the beat timing.
Next week's film will tell a different story (a seed, a mirror, a road, a crowd…) in one of these styles. Your job:
pull (1) out into a kit that a new scene can use in 10–15 minutes, and leave (2) in the door scene as the worked example.

## Deliverables (write only these; don't commit — I will)
1. `styles/<slug>/kit.js` — one global (e.g. `window.Charcoal`) exposing the style as functions/classes:
   - setup: `init(opts)` building heavy textures once (paper, grain, weave, screen…), sized to Pilot.W/H;
   - the material primitives a NEW story needs, generalised from what the door scene does — e.g. for charcoal:
     tone a region, stick stroke, smudge fill, eraser lift, light wedge/beam lifted from tone, fog bands, the final
     paper-tooth pass; for Hopper: a perspective room/box helper in metres, flat-plane fill with brush texture,
     projected light from a point through an opening onto floor/wall, cast shadow of a silhouette, canvas weave +
     vignette; for Saul Bass: hand-cut polygon/strip edges, paper texture, cut-paper caption strip, snap/ease timing on
     beats, line-draw-on; for shadow puppet: backlit screen + lamp flicker, a puppet piece (path) with perforation
     punch pattern + rods + distance blur (sharp on screen, soft & larger off it), articulated joints;
   - camera helpers the style uses (push, shake, pull-back), its caption and end-card call (wrapping Story.captions /
     Story.endCard from styles/_shared/story.js with the style's fonts/colours), and its single accent colour;
   - small and documented: a short comment on every exported function (args, units, what it draws).
   Pure, deterministic, seek-safe (seeded randomness only; rebuildable for any seek order). No network, no images.
2. `styles/<slug>/STYLE.md` — the style card: what it looks like and what meanings it carries well (and badly);
   palette (hex), fonts, caption placement; the kit API with a 10-line usage example; the motion grammar and native
   moves that worked; performance numbers; pitfalls you hit (from the door scene and from this refactor); what a
   scene author must still draw themselves.
3. `styles/<slug>/template.html` — a minimal NEW scene using the kit with a placeholder 30 s story (no door): e.g. one
   simple subject (a single object, a figure, a light) that appears, changes on a beat, and resolves, plus captions
   from a placeholder `script.js` and the end card. It must load like a film scene: `lib.js`, `story.js`,
   `script.js`, `kit-<slug>.js` from the same folder. Provide that placeholder as `styles/<slug>/script.example.js`
   (`window.SCRIPT = { DUR: 30, beat: {...}, lines: [...], endCard: {...} }`, short neutral Korean text).
4. Refactor the door scene `sermons/2026-10-18-1cor5/film/scenes/door-<letter>.html` to use the kit (copy the kit
   into that folder as `scenes/kit-<slug>.js` and load it), keeping only door-specific drawing in the scene.
   **The output must stay visually identical**: before you change anything, render reference stills, and after the
   refactor render the same times and diff them (PIL ImageChops; max channel diff ≤ 3 is fine). Keep per-frame time
   within ±15 % of before.

## How to check
- Stills: `cd sermons/2026-10-18-1cor5/film && node /home/user/motion-skills/canvas-film/scripts/render.mjs v --scene door-<letter> --stills 1.5,5,9.5,12,14,15.9,19.5,22,25,27.5`
  (outputs to out/still-door-<letter>-v-<t>.png — copy the "before" set to your own folder first; the scratchpad and
  out/ are shared with 3 other agents, so keep your files under a folder named after your slug).
- Template: copy lib.js + story.js from the film's scenes/, your kit, script.example.js → script.js and template.html
  into a temp folder, render stills with `--root <folder> --page <folder>/template.html` (render.mjs takes --root/--page),
  and LOOK at them: the template must look like the style, not like a placeholder.
- 4 CPUs shared with 3 other agents: stills only, never full videos.
- Harness docs: /home/user/motion-skills/canvas-film/SKILL.md, references/SCENE-RULES.md; shared story code:
  styles/_shared/story.js; the film's script: scenes/door-common.js (DOOR = beats + lines).

## Report back
Files written, the kit's API in one list, before/after diff numbers and ms/frame, template still paths, and anything a
future author should know.
