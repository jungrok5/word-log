// Print a film's SOURCE and SCRIPT(s) as JSON, evaluated the way the scene pages see them.
//   node tools/script-json.mjs sermons/<folder>/film      → { source, scripts: { "script.js": {...}, "script-bass.js": {...} } }
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const sc = path.join(process.argv[2], 'scenes');
const out = { source: null, scripts: {} };
for (const f of fs.readdirSync(sc).filter(f => /^script(-[\w-]+)?\.js$/.test(f)).sort()) {
  const ctx = vm.createContext({ Pilot: {}, console }); ctx.window = ctx; const win = ctx;   // like a browser: window === global
  for (const pre of ['story.js', 'source.js']) if (fs.existsSync(path.join(sc, pre))) vm.runInContext(fs.readFileSync(path.join(sc, pre), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(sc, f), 'utf8'), ctx);
  out.source = win.SOURCE || out.source; out.scripts[f] = win.SCRIPT || null;
}
console.log(JSON.stringify(out, null, 1));
