/* 가위를 내려놓았다 — 단 4:28-37 「광야의 시간을 어떻게 견뎌내야 할까?」 (storyboard.md). Beats (s) and words.
   A cocoon on a twig strains. My hand brings scissors and snips its neck: the moth slides out easily, but its wings stay
   crumpled, it falls. The lamp gutters; relit, the same cocoon — my hand stops and lays the scissors down. The moth squeezes
   out through the narrow neck, light fills its wing veins push by push, the wings open (the one colour: eyespots) and it
   flies into the lamp. The empty cocoon sways; the end card; the loop returns to the straining cocoon. */
window.SCRIPT = {
  DUR: 29,
  beat: {
    near: 2.5,              // my hand's shadow (with scissors) comes in from the lower right, big and soft
    press: 4.2,             // it presses onto the cloth — sharp — blades at the cocoon's neck
    spread: 4.9,            // the thumb opens the blades
    snip: 6.0,              // 싹둑: the blades close, the neck cap flies off (crash zoom)
    out: [6.3, 7.3],        // the moth slides out easily — fat body, crumpled wings
    climb: [7.3, 8.8],      // it climbs onto the twig above the cocoon
    tries: [10.1, 10.9, 11.5], // it shivers its crumpled wings — they don't open
    fall: 12.0,             // it loses the twig and drops to the ground strip (lands 12.55), crawls
    dark: 13.3,             // the lamp gutters (to 13.9; not silent)
    relight: 14.0,          // relit: the same cocoon, still closed, straining
    hand2: 14.3,            // my hand with the scissors comes again
    press2: 15.0,           // pressed sharp at the neck — and stops (trembles)
    down: 16.0,             // it lowers the scissors to the ground
    set: 16.8,              // the scissors touch the ground; the hand lets go (lifts off the cloth)
    push: [17.7, 18.5, 19.2, 19.9], // the moth squeezes out, a little each push; light fills the wing veins
    free: 20.4,             // out, clinging on the twig
    open: 20.7,             // the wings open (to 22.2); the eyespots bloom red (the one colour)
    fly: 23.3,              // it lifts off the cloth toward the lamp (to 24.8)
    pull: 25.5,             // gentle pull back to the little stage
    end: 26.5,              // end card (2.5 s), loops into frame 0 (the straining cocoon)
  },
  lines: [
    [0.3, 2.9, '이 시간,\n빨리 끝났으면'],
    [3.1, 5.8, '조금만 잘라 내면'],
    [6.6, 9.6, '쉽게 나왔다'],
    [10.0, 13.2, '그런데,\n날개가 펴지지 않는다'],
    [14.6, 17.4, '가위를 내려놓았다'],
    [17.7, 20.5, '좁은 틈이\n날개를 만든다'],
    [21.0, 24.6, '그 기한이 차매', '다니엘 4:34 (개역개정)'],
  ],
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ≤ 2.5 s on screen; details go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
