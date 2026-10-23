/* 잘라 낸 건 다리였다 — 고전 4:6-21 「이것을 잃어버렸다고요?」 (storyboard.md). ONE story for all four style versions.
   A procession of pilgrims, each carrying a cross. I (in front, nearest) stagger under mine, saw a piece off, go lighter
   and faster, overtake the others, saw twice more. The road ends at a chasm; across it a gate leaks light. The others
   lay their crosses across — each spans it exactly — and walk into the light. Mine falls short and drops. I look back:
   the pieces I cut lie on the road behind me — together, exactly a bridge. Loop → frame 0 (my whole cross, before cutting). */
window.SCRIPT = {
  DUR: 30.5,
  /* v2 (viewer reviews, reviews/2026-10-23-1cor4-v1.md): the others TAKE THEIR CROSS BACK after crossing (each bridge is
     only its owner's), so the chasm is empty when I arrive; frame 0 is a close-up of me with the saw already in my hand;
     my short cross hangs short for a full second before it tips; the cut pieces glow and fly into the missing span. */
  beat: {
    hook: 0,                // frame 0: CLOSE on me — bent under my cross, a saw already in my hand (→ "뭐 하려고?"); by ~2.6 the view widens to the procession
    saw: [3.2, 9.0, 10.4],  // I put the cross down and saw the foot off (sawing ≈0.4 s; the piece drops ≈0.8 s after the beat start and stays on the road)
    run: [4.6, 8.6],        // lighter: I stride ahead and overtake the others (exaggerate it — big strides, they fall behind)
    gap: 12.0,              // the road ends: a chasm; across it a gate with light leaking through
    bridges: [14.2, 15.4, 16.6], // each other pilgrim, one at a time: lays the cross across (t) → walks over (t+.3…t+.9) → from the far
                            //   side pulls it back and shoulders it (t+.9…t+1.4) → carries it into the light (by t+1.8). Only one bridge at a time;
                            //   when the last one has gone (≈18.2) the chasm is EMPTY again.
    mine: 18.4,             // THE moment: I lay mine across the empty chasm — short: it hangs off the near lip, clearly short of the far side
    tip: 19.3,              // …held short for ~1 s, then it tips
    fall: 19.6,             // it falls into the chasm (the hit). I do NOT fall.
    back: 21.2,             // I turn: the pieces I cut lie on the road behind me
    fill: [22.2, 24.4],     // they glow, lift and fly into the missing span one by one (a dashed outline of my whole cross shows the gap) — exactly filling it
    end: 26.5,              // end card (4 s), then the loop into frame 0
  },
  /* how much of my cross is left after each cut (1 = the full length the gap needs) */
  left: [1, 0.8, 0.62, 0.48],
  lines: [   /* v3 copy: an inner voice, not narration — fewer declaratives, one turn per line */
    [0.3, 2.9, '왜 나만\n이렇게 무거울까'],
    [3.1, 5.0, '조금만 덜어 내면\n괜찮겠지'],
    [5.2, 8.6, '이렇게 가벼운데,\n왜 진작 안 했을까'],
    [8.9, 11.6, '한 번만 더'],
    [12.0, 14.0, '그런데—\n길이 없다'],
    [14.2, 18.2, '그들은\n지고 온 것을 건너갔다'],
    [18.6, 20.8, '내 것만,\n모자랐다'],
    [21.2, 26.2, '덜어 낸 건 짐이 아니었다.\n건너갈 다리였다', '“자기 십자가를 지고 나를 따를 것이니라” 마태복음 16:24 (개역개정)'],
  ],
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ~4 s on screen (beat.end = DUR − 4); links/CTA go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
