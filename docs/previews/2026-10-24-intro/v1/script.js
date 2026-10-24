/* word-log 채널 소개 · 「word-log 교실」 7장면 30초 (storyboard.md, confirmed 2026-10-24).
   After the reference short's structure: the same character keeps dancing while the whole world (background, medium, graphics)
   swaps on the beat. Owner-requested one-off test: the dance is two video-model clips (art/dance/, keyed; each starts and ends
   on the same pose, so A→B and B→(loop)→A join without a jump). Everything else is code.
   Music grid: 128 BPM, 4/4 → a bar = 1.875 s; every scene change lands on a bar line (30 s = 16 bars). */
window.SCRIPT = {
  DUR: 30,
  BPM: 128,
  // scene starts (bars 0, 2, 4, 6, 10, 11, 13) — the storyboard's 0/4/8/12/17/21/25 s snapped to bar lines; ④ runs one bar longer
  // (to 18.75) so all six jamo come from real footfalls in the clip, ⑤ is one bar
  scenes: [
    { id: 'shelf',  at: 0 },        // ① 책장 격자 · 가운데 금빛 창 'word-log – 말씀' · 손끝 스파크 · '톡'
    { id: 'stage',  at: 3.75 },     // ② 빨간 원형 무대 · 입체 글자 '말씀' '쇼츠' '30초' 공전 → '한 장면!'
    { id: 'draft',  at: 7.5 },      // ③ 크림 종이 위 파란 콘티 도면 · 선으로 그려지고 색이 입혀짐 · '콘티'
    { id: 'keys',   at: 11.25 },    // ④ 노란 배경 + 3D 키보드 · ㅁ ㅏ ㄹ ㅆ ㅡ ㅁ → '말씀!' (4 bars: the clips have six real footfalls by 16.6 s)
    { id: 'bubble', at: 18.75 },    // ⑤ 분홍 비눗방울 · '묵상 중…' · 네온 '한 장면'
    { id: 'manga',  at: 20.625 },   // ⑥ 흑백 만화 칸 · 스크린톤 · 집중선 · '두근!' · 잉크 폭발 '쿵!'
    { id: 'kaleido', at: 24.375 },  // ⑦ 만화경 · word-log + '말씀 한 장면' · 큰 별 → 첫 창으로 줌아웃 (반복)
  ],
  jamo: ['ㅁ', 'ㅏ', 'ㄹ', 'ㅆ', 'ㅡ', 'ㅁ'],
  beat: {
    tok: 1.875,          // '톡' pops at her fingertip (bar 1)
    hanjang: 6.56,       // '한 장면!' (bar 3, beat 3)
    assemble: 17.34,     // the six jamo snap into 말 · 씀 (bar 9, beat 2)
    neon: [19.22, 19.69, 20.16],   // 한 · 장 · 면 typed on beats
    dugeun: 21.56, kung: 23.44,    // manga onomatopoeia
    title: 25.31,        // word-log
    out: 28.125,         // zoom back out into the first window (bar 15)
  },
  lines: [],
};
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;
