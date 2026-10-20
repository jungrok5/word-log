/* 아빠 없다고 해 — beats (s) and words. The end card comes from source.json (Story.card).
   One table, one phone, the same push across three generations. POV: I am the father at the near side of the table. */
window.SCRIPT = {
  DUR: 28.5,
  beat: {
    ring0: 0,                // frame 0: the phone buzzing on the table near my hand, the child across the table
    push1: [0.5, 1.9],       // MY hand slides the phone across to the child (it leaves a red smear)
    back1: [2.0, 2.8],       // my hand comes back to rest
    pick: [3.2, 3.9],        // the child lifts the phone to its ear and looks at me
    down: [6.6, 7.2],        // puts it down; looks at its own (now red) fingertips — the camera pushes in
    grow1: [10.4, 11.3],     // erased and redrawn in the same chair: the child becomes a teenager (clock spins, plant grows)
    ring1: 11.0,             // the phone buzzes again
    push2: [11.6, 12.9],     // the teen slides it back across to ME (a wider red smear)
    reach: [13.4, 14.4],     // my hand reaches for it and stops above it — my own fingertips are red
    grow2: [18.2, 19.1],     // erased and redrawn again: the teen is a father, his own child beside him
    push3: [19.4, 20.6],     // he slides the phone to his child; the red spreads over the table
    back: [22.9, 23.7],      // the eraser takes it all back to the first morning
    answer: [23.9, 25.0],    // this time my hand picks the phone up myself
    end: 26.0,               // end card (2.5 s), loops into frame 0
  },
  lines: [
    [0.3, 2.9, '“아빠 없다고 해”'],
    [3.3, 6.5, '“아빠… 없어요”'],
    [7.0, 10.3, '아, 이래도 되는구나'],
    [11.5, 14.6, '“나 없다고 해”'],
    [15.0, 18.1, '그 말, 어디서 배웠을까'],
    [18.9, 22.8, '적은 누룩이 온 덩어리에\n퍼지는 것을 알지 못하느냐', '고린도전서 5:6 (개역개정)'],
    [23.5, 25.8, '“여보세요, 접니다”'],
  ],
  accent: '#9c1a1a',
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ≤ 2.5 s on screen; details go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
