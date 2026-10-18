/* 문틈 — shared script and timeline for all four style versions (door-a … door-d).
   Every version tells the same 30 s story on the same beats with the same words; only the drawing differs.
   Portrait 1080×1920 (Shorts/Reels). Keep words out of the bottom 380 px and the right 140 px (platform UI),
   and nothing important in the top 160 px. Captions live in the upper third (y ≈ 330–640) unless a style says otherwise. */
const DOOR = {
  DUR: 30,
  // story beats (seconds)
  beat: {
    hookIn: 0.0,          // fade in from black, a thread of light at the door's edge
    open: [4.0, 6.3, 8.6],// three small openings — each one a creak; the light wedge on the floor widens
    breath: 7.4,          // something breathing behind the door (from here, rising)
    shadowIn: 10.6,       // a long horned shadow slides into the light wedge on the floor
    claw: 12.6,           // long-nailed fingers curl around the door's edge
    burst: 15.4,          // the door slams wide open; darkness floods across the floor toward the camera
    black: 16.6,          // full black, silence until 18.0
    blood: [20.8, 21.6, 22.3], // red stroke: lintel, left post, right post (the ONLY colour in the film)
    recoil: 23.0,         // the shadow flinches and withdraws
    close: 24.0,          // the door swings shut (done by 25.2); the thread of light at the edge turns warm
    end: 25.8,            // end card
  },
  // on-screen words: [from, to, text, source?]. Line breaks are fixed so all versions match.
  lines: [
    [0.5, 3.8, '이 정도는… 괜찮겠지?'],
    [4.0, 6.2, '한 번쯤은'],
    [6.3, 8.5, '다들 하잖아'],
    [8.6, 10.5, '아무도 모를 거야'],
    [10.9, 15.3, '죄가 문에 엎드려 있느니라', '창세기 4:7 (개역개정)'],
    [16.1, 20.5, '적은 누룩이 온 덩어리에 퍼지는 것을\n알지 못하느냐', '고린도전서 5:6 (개역개정)'],
    [21.0, 25.6, '우리의 유월절 양 곧\n그리스도께서 희생되셨느니라', '고린도전서 5:7 (개역개정)'],
  ],
  endCard: { title: '절대로 괜찮다고\n넘기면 안 되는 것', passage: '고린도전서 5:1-8', by: '김인환 담임목사 · 더라이프지구촌교회', cta: '전체 설교는 채널에서' },
  RED: '#9c1a1a',
};
/* Captions and end card come from the shared story.js (load it before this file); kept here under the old names. */
DOOR.captions = (ctx, t, o = {}) => Story.captions(ctx, t, DOOR.lines, o);
DOOR.endCardDraw = (ctx, t, o = {}) => Story.endCard(ctx, t, DOOR.endCard, DOOR.beat.end, o);
window.DOOR = DOOR;
