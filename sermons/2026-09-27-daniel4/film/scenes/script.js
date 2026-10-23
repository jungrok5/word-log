/* 가위를 내려놓았다 — 단 4:28-37 「광야의 시간을 어떻게 견뎌내야 할까?」 (storyboard.md). Beats (s) and words.
   A cocoon on a twig strains. My hand brings scissors and snips its neck: the moth slides out easily, but its wings stay
   crumpled, it falls. The lamp gutters; relit, the same cocoon — my hand stops and lays the scissors down. The moth squeezes
   out through the narrow neck, light fills its wing veins push by push, the wings open (the one colour: eyespots) and it
   flies into the lamp. The empty cocoon sways; the end card; the loop returns to the straining cocoon. */
window.SCRIPT = {
  DUR: 29,
  /* v2 (viewer reviews, reviews/2026-10-23-daniel4-v1.md): my hand's shadow is there from frame 0; the failure is quicker;
     no blackout — the film REWINDS to before the snip ("다시, 그 시간 앞에서"); the squeeze is long, with stalls; the climax
     line is mine, the verse goes small beneath it; no theatre/audience pull-back. */
  beat: {
    press: 3.2,             // my hand (a big soft shadow from frame 0) presses onto the cloth — sharp — blades at the neck
    spread: 3.6,            // the thumb opens the blades
    snip: 4.6,              // 싹둑: the neck cap flies off (crash zoom)
    out: [4.9, 5.6],        // the moth slides out easily — fat body, crumpled wings
    climb: [5.6, 6.6],      // onto the twig above the cocoon
    tries: [7.0, 7.6, 8.2], // it heaves its crumpled wings up — they flop back
    fall: 8.9,              // it drops to the ground (lands 9.45) and lies there
    rw: [10.4, 12.4],       // REWIND: everything runs backwards to before the snip (scene time 10.4 → 2.6)
    again: 12.4,            // the same moment again: my hand coming with the scissors
    press2: 13.0,           // it reaches the neck — and stops (trembles)
    down: 14.0,             // it lowers the scissors to the ground
    set: 14.8,              // the scissors touch the ground; the hand lets go (lifts off the cloth)
    push: [15.6, 16.4, 17.5, 18.3, 19.3], // the moth squeezes out: push, push, stall (the lamp breathes), push, push, push
    free: 20.0,             // out, clinging on the twig
    open: 20.4,             // the wings open (to 21.9); the eyespots bloom red (the one colour)
    fly: 23.0,              // it lifts off the cloth toward the lamp (to 24.5); the empty cocoon sways
    end: 26.5,              // end card (2.5 s) over the dimmed screen, loops into frame 0
  },
  rewindTo: 2.6,
  lines: [
    [0.3, 2.6, '이 시간,\n빨리 끝났으면'],
    [2.8, 4.6, '조금만 잘라 내면'],
    [5.0, 6.9, '쉽게 나왔다'],
    [7.1, 10.2, '그런데,\n날개가 펴지지 않는다'],
    [10.5, 12.4, '다시,\n그 시간 앞에서'],
    [13.4, 15.5, '가위를 내려놓았다'],
    [15.7, 19.8, '좁은 틈이\n날개를 만든다'],
    [20.6, 24.6, '지금 이 시간도,\n날개를 만드는 중', '“그 기한이 차매” 다니엘 4:34 (개역개정)'],
  ],
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ≤ 2.5 s on screen; details go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
