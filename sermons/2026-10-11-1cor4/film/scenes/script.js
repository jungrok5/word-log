/* 잘라 낸 건 다리였다 — 고전 4:6-21 「이것을 잃어버렸다고요?」 (storyboard.md). ONE story for all four style versions.
   A procession of pilgrims, each carrying a cross. I (in front, nearest) stagger under mine, saw a piece off, go lighter
   and faster, overtake the others, saw twice more. The road ends at a chasm; across it a gate leaks light. The others
   lay their crosses across — each spans it exactly — and walk into the light. Mine falls short and drops. I look back:
   the pieces I cut lie on the road behind me — together, exactly a bridge. Loop → frame 0 (my whole cross, before cutting). */
window.SCRIPT = {
  DUR: 30.5,
  beat: {
    hook: 0,                // frame 0: the procession on the road; me in front, staggering under my cross (the marked one)
    saw: [3.2, 9.0, 10.4],  // I put the cross down and saw the foot off (each cut: saw 0.4 s… piece drops at +0.8)
    run: [4.6, 8.6],        // lighter: I stride ahead and overtake the others (they keep their pace)
    gap: 12.0,              // the road ends: a chasm; across it a gate with light leaking through
    bridges: [14.2, 15.4, 16.6], // the others, one by one, lay their crosses across — each spans the gap exactly — and walk into the light
    mine: 18.4,             // THE moment: I lay mine across — it's short (18.9 it tips) and falls into the chasm (19.2 crash)
    back: 21.0,             // I turn: on the road behind me lie the pieces I cut — together exactly a bridge's length
    end: 26.5,              // end card (4 s), then the loop into frame 0
  },
  /* how much of my cross is left after each cut (1 = the full length the gap needs) */
  left: [1, 0.8, 0.62, 0.48],
  lines: [
    [0.3, 2.9, '이 십자가,\n너무 무겁다'],
    [3.1, 5.0, '조금만 짧게 하면'],
    [5.2, 8.6, '가볍다.\n먼저 간다'],
    [8.9, 11.6, '조금만 더'],
    [12.0, 14.0, '길이 끊겼다'],
    [14.2, 18.2, '그들의 십자가는\n다리가 되었다'],
    [18.6, 20.8, '내 것은…\n닿지 않았다'],
    [21.2, 26.2, '잘라 낸 건 무게가 아니라,\n다리였다', '“자기 십자가를 지고 나를 따를 것이니라” 마태복음 16:24 (개역개정)'],
  ],
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);   // ~4 s on screen (beat.end = DUR − 4); links/CTA go in the description
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;                             // cross-fade the last 0.6 s into frame 0 (replays seamlessly)
