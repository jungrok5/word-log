// Sample a scene's frames and print mean luminance (0–255) per sample: used by check-film.py for the hook / dead-air rules.
//   node tools/scan-frames.mjs <film>/scenes/<id>.html [fps=4] [cut]
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [page$, fps = 4, cut = ''] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 270, height: 480 } });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(pathToFileURL(page$).href + '?render=1&o=v' + (cut ? '&cut=' + cut : ''));
await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const dur = await p.evaluate(() => window.DURATION);
const out = [];
for (let t = 0; t < dur; t += 1 / fps) {
  out.push([+t.toFixed(2), await p.evaluate(t => { window.seek(t); const c = document.querySelector('canvas'), s = document.createElement('canvas');
    s.width = 54; s.height = 96; const x = s.getContext('2d'); x.drawImage(c, 0, 0, 54, 96); const d = x.getImageData(0, 0, 54, 96).data;
    let m = 0; for (let i = 0; i < d.length; i += 4) m += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; return m / (d.length / 4); }, t)]);
}
console.log(JSON.stringify({ dur, samples: out })); await b.close();
