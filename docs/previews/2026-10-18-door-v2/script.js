/* 문틈 v2 — "열어 준 건 나였다". Beats (s) and words. The end card comes from source.json (Story.card). */
window.SCRIPT = {
  DUR: 27.3,
  beat: {
    hookIn: 0,               // frame 0: my hand already on the handle, a thread of light at the edge (no fade from black)
    push: [3.4, 5.6, 7.8],   // MY hand pushes the door open a little each time (a creak each); the light on the floor widens
    breath: 9.6,             // something breathes behind the door; the light dims in rhythm
    claw: 10.2,              // long-nailed fingers hook the door edge FROM THE OTHER SIDE
    letGo: 11.4,             // my hand flinches and lets go of the handle
    yank: 14.0,              // the door is yanked wide open from the other side; the horned shadow floods the floor toward me
    mine: 14.4,              // caption: 열어 준 건 나였다 (the room stays dimly visible — no black, no silence)
    blood: [17.6, 18.3, 19.0], // red strokes: lintel, left post, right post (the only saturated colour)
    recoil: 19.6,            // the shadow flinches and withdraws
    close: 20.6,             // the door swings shut (done by 21.8) — not by my hand; warm thread of light at the edge
    rest: 22.4,              // my hand returns and rests on the closed door (mirrors frame 0 for the loop)
    end: 24.8,               // end card (2.5 s), over the closed door
  },
  lines: [
    [0.3, 3.2, '이 정도는… 괜찮겠지?'],
    [3.4, 5.4, '한 번쯤은'],
    [5.6, 7.6, '다들 하잖아'],
    [7.8, 9.8, '아무도 모를 거야'],
    [10.2, 14.0, '죄가 문에 엎드려 있느니라', '창세기 4:7 (개역개정)'],
    [14.4, 17.4, '열어 준 건 나였다'],
    [17.8, 22.6, '우리의 유월절 양 곧\n그리스도께서 희생되셨느니라', '고린도전서 5:7 (개역개정)'],
  ],
  accent: '#9c1a1a',
};

/* — added by new-film.py: strategy defaults (see CLAUDE.md 영상 전략) — */
if (window.SOURCE && window.Story) window.SCRIPT.endCard = Story.card(window.SOURCE);
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;
