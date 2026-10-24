/* Style lab — ONE 6-second micro-scene drawn in 17 styles, to judge each style's craft level (not a film).
   A small figure (me) trudges in carrying a heavy load on the back, stops, looks up as a warm light appears ahead,
   and lets the load slip down. One caption. Loops. */
window.SCRIPT = {
  DUR: 6,
  beat: {
    walk: [0, 2.6],     // frame 0: the figure already in view, trudging under the load (no fade-in)
    stop: 2.6,          // it stops, sags
    look: 3.2,          // it lifts its head: a warm light appears ahead (the style's one accent)
    drop: 4.4,          // the load slips off its back and lands
    hold: [4.6, 6.0],   // a breath: the style's native ambient motion (fog, rain, sparkles, grain, glow…)
  },
  lines: [
    [0.3, 5.6, '왜 나만\n이렇게 무거울까'],
  ],
  loop: 0.5,
};
