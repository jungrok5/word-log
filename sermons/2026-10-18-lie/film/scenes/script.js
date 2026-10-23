/* 아빠 없다고 해 — beats (s) and words. The end card comes from source.json (Story.card).
   One table, one phone, the same push across three generations. POV: I am the father at the near side of the table.
   v4 (viewer reviews): the teen says it TO me ("아빠, 나 없다고 해"), the red reads as a smudge (not nail polish), the
   hit shot keeps the teen's face (the red creeps up my fingers instead of a still), the grandchild gets more time,
   and the return is a real REWIND of the whole drawing (clock backwards, the red drawn back in) before I answer. */
window.SCRIPT = {
  DUR: 31.0,
  beat: {
    ring0: 0,                // frame 0: the phone buzzing on the table near my hand, the child across the table
    push1: [0.5, 1.9],       // MY hand slides the phone across to the child (it leaves a red smear)
    back1: [2.0, 2.8],       // my hand comes back to rest
    pick: [3.2, 3.9],        // the child lifts the phone to its ear and looks at me
    face: [3.4, 4.2],        // the camera closes in on the child's face (the lie, eye to eye)
    down: [6.6, 7.2],        // puts it down; looks at its own red fingertips…
    smile: 8.6,              // …then up at me, with a small smile
    grow1: [10.2, 11.0],     // erased and redrawn in the same chair: the child becomes a teenager (clock spins, plant grows)
    ring1: 10.8,             // the phone buzzes again — louder
    push2: [11.3, 12.8],     // the teen shoves it back across, at ME
    hit: 12.8,               // it stops against my fingers: one hard hit, the room goes dark
    reach: [13.2, 13.9],     // my hand lifts off the table and hangs there, trembling; the red creeps up my fingers
    grow2: [16.9, 17.8],     // erased and redrawn again, darker: the teen is a father, his own child beside him
    push3: [18.4, 19.6],     // he sweeps the phone to his child
    flood: [19.0, 21.8],     // the red floods the table toward me and swallows my hand
    back: [21.9, 23.9],      // REWIND: the whole drawing runs backwards to the first morning (clock backwards, red drawn back in)
    answer: [24.0, 25.2],    // this time my hand picks the phone up myself
    end: 27.0,               // end card (4 s — long enough to read the source), loops into frame 0
  },
  lines: [
    [0.3, 2.9, '“아빠 없다고 해”'],
    [3.3, 6.5, '“아빠… 없어요”'],
    [7.0, 10.0, '아, 이래도 되는구나'],
    [11.0, 12.8, '“아빠, 나 없다고 해”'],
    [13.9, 16.6, '그 말, 어디서 배웠을까'],
    [17.9, 21.8, '적은 누룩이 온 덩어리에\n퍼지는 것을 알지 못하느냐', '고린도전서 5:6 (개역개정)'],
    [24.1, 26.7, '“여보세요, 접니다”'],
  ],
  accent: '#9c1a1a',
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ≤ 2.5 s on screen; details go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
