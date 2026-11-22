// T49: the Repair kit extras on a big PC (tools\kit-extra.cmd). Runs kitextra.js for every variant below on N cores, F fights a pair
// (seeds 0..F-1; the build box ran 0..11 for the main variants), then writes kit-extra-pc/report.md: the one file to send back.
// Stop it any time (close the window) and start it again: it goes on where it stopped.   node tools/damage-lab/kitextra-pc.js [cores 15] [F 16]
const { spawn, execFileSync } = require('child_process'), path = require('path'), fs = require('fs');
const N = +(process.argv[2] || 15), F = +(process.argv[3] || 16), D = __dirname, OUT = path.join(D, 'kit-extra-pc');
const VARIANTS = (process.env.VARIANTS || 'none,kit,shield,medic,hull,tow,kit+repairBatt=1+repairBattAny=1,kit+repairFix=1.5,kit+repairWear=0.5,kit+repairScore=2').split(',');
fs.mkdirSync(OUT, { recursive: true });
const jobs = []; for (const v of VARIANTS) for (let s = 0; s < 4; s++) jobs.push([v, s]);   // 4 shards a variant
let run = 0, left = jobs.length; const t0 = Date.now();
function next() {
  if (!jobs.length) { if (!run) finish(); return; }
  const [v, s] = jobs.shift(); run++;
  const p = spawn(process.execPath, [path.join(D, 'kitextra.js'), v, s, 4, 0, F, path.join(OUT, v.replace(/[+=]/g, '_') + '.jsonl')], { stdio: 'inherit' });
  p.on('exit', () => { run--; left--; console.log(`${new Date().toTimeString().slice(0, 8)}  ${v} part ${s + 1}/4 done, ${left} of ${VARIANTS.length * 4} left (${((Date.now() - t0) / 60000).toFixed(0)} min)`); next(); });
}
function finish() {
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.jsonl')).map(f => path.join(OUT, f));
  let rep = '';
  for (const a of [['--robots', 'kit'], ['--vs', 'kit']]) { try { rep += execFileSync('python3', [path.join(D, 'kitextra-report.py'), ...files, ...a]).toString() + '\n'; } catch (e) { try { rep += execFileSync('python', [path.join(D, 'kitextra-report.py'), ...files, ...a]).toString() + '\n'; } catch (e2) { rep += '(python missing: send the .jsonl files instead)\n'; } } }
  fs.writeFileSync(path.join(OUT, 'report.md'), rep);
  console.log('\nDone. Send this one file back to Claude: ' + path.join(OUT, 'report.md') + '\n(or zip the folder ' + OUT + ')');
}
for (let i = 0; i < N; i++) next();
