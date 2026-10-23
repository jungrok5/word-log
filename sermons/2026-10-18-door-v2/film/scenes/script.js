/* 문틈 — "열어 준 건 나였다". Beats (s) and words. The end card comes from source.json (Story.card).
   v2 (viewer reviews, reviews/2026-10-20-door-v2-vs-lie-v3.md): every push shows something new behind the door; it is MY
   push that opens it the last time; I can't shut it again (the other side pulls, my hand slips); then a man's hand from
   the OTHER side of the door — where the claws were — pushes it shut, and leaves red fingermarks on my side of the door. */
window.SCRIPT = {
  DUR: 29.0,
  beat: {
    hookIn: 0,               // frame 0: my hand on the lever, the door a hair open, a thread of light
    shadow: 1.2,             // something crosses the light under the door (→ "뭐지?")
    push: [3.4, 5.6, 7.8],   // my hand pushes the door a little further each time; each time more is seen behind it:
    breath: 5.6,             //   ② its shadow crosses the threshold onto my floor, breathing starts
    claw: 7.8,               //   ③ long-nailed fingers wrap the door's edge
    hold: 9.8,               // a taut stillness; my hand grips the lever harder
    open: 12.2,              // THE moment: MY hand shoves the door open as far as my arm reaches; it lets go of the edge
    mine: 12.7,              // the horned shape stands in the gap, the room goes dark: 열어 준 건 나였다
    tug: 15.4,               // I try to pull it shut — the other side pulls back, harder
    slip: 16.3,              // my hand is dragged and slips off the lever
    light: 17.8,             // warm light comes up in the corridor behind the shape; it turns and shrinks back
    grab: 18.2,              // a man's hand reaches round the door's edge from the corridor side (a nail wound on its back)
    close: 18.6,             // that hand pushes the door shut (done by 19.8); the shape is pushed out of the light
    marks: 19.9,             // the fingers let go: four red fingermarks stay on my side of the door, a warm thread under it
    rest: 22.2,              // my hand comes to the shut door and lies flat beside the marks (I won't open it)
    end: 25.0,               // end card (4 s — long enough to read the source), loops into frame 0
  },
  lines: [
    [0.3, 3.2, '이 정도는… 괜찮겠지?'],
    [3.4, 5.4, '한 번쯤은'],
    [5.6, 7.6, '다들 하잖아'],
    [7.8, 9.6, '아무도 모를 거야'],
    [9.8, 12.1, '죄가 문에 엎드려 있느니라', '창세기 4:7 (개역개정)'],
    [12.7, 15.2, '열어 준 건 나였다'],
    [15.5, 17.6, '닫히지 않는다'],
    [18.4, 21.8, '그 손에는 못 자국이 있었다'],
  ],
  accent: '#9c1a1a',
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;
