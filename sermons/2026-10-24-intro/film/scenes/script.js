/* word-log 채널 소개 — 키보드 위의 말씀 (storyboard.md). Owner-requested one-off test: the character's dance comes from a
   video model (keyed sprite sequence in art/dance/), everything else is code.
   0 s: yellow, the big black keyboard, she is already dancing. Each footfall presses the key under that foot: it glows magenta and
   a jamo pops out — ㅁ ㅏ ㄹ ㅆ ㅡ ㅁ — and they assemble into 「말씀」 above her. Last ~3 s: word-log + 「말씀 한 장면」; loop. */
window.SCRIPT = {
  DUR: 13,
  beat: {
    hook: 0,            // frame 0: keyboard + her mid-dance, no letters yet
    jamo: [0.55, 1.6, 2.65, 3.7, 4.75, 5.8],   // overwritten from the dance's foot contacts (art/dance/meta.js) when they exist
    assemble: 7.1,      // the six jamo fly together → 말 · 씀
    logo: 9.6,          // word-log + 「말씀 한 장면」
    out: 12.2,          // letters lift away, so the loop lands on a clean frame 0
  },
  jamo: ['ㅁ', 'ㅏ', 'ㄹ', 'ㅆ', 'ㅡ', 'ㅁ'],
  lines: [],
};
if (window.SCRIPT.loop == null) window.SCRIPT.loop = 0.6;
