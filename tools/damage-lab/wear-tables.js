// T41 (Kev, 21 Nov: "let me know if you want a big one to run on my pc"): every table the game reads, measured again with
// wear on (cracks, fragments, bends, saw grooves) and the retuned lineup. Started by tools\wear-tables.cmd (double-click).
//   node tools/damage-lab/wear-tables.js [workers] [--games=120] [--no-games]
// Runs the jobs below on <workers> processes (default: logical cores - 1), shows progress and the time left, and can be stopped
// and started again (finished jobs are kept in wear-results\). At the end it packs everything into ONE file to send back:
// wear-results\wear-tables-results.json.gz
// Jobs (fights with the game's own robots and part strengths, wear on as in the game):
//   matrix  open floor, every pair, 20 fights (10,560)   -> the bookie's matchup table, style tags, hard hitters, counter tags
//   arenas  the four arenas, every same-level pair, 20 fights (7,920) -> the arena part of the matchup table
//   arenafit every robot vs its own level on all five floors, 16 seeds (15,840) -> ARENA_FIT, arena tags
//   parts   every part on every robot vs 4 robots a level up, 4 fights (14,784) -> part levels, great / poor fit candidates
//   fits    the 58 fit / epic candidates of 15 Nov vs every robot a level up, with and without the part, 8 fights (10,496)
//   ffa, tv 750 free-for-alls and 750 2v2 (four robots each)          -> Brawl master / Lost in a melee, Lone wolf / Team player
//   games   120 whole AI games of the game page (needs Playwright's Chromium; skipped with a note if it is missing)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), DL = __dirname, OUT = path.join(ROOT, 'wear-results');
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k)); return a ? (a.split('=')[1] || true) : null; };
const NW = Math.max(1, +(args.find(a => /^\d+$/.test(a)) || Math.max(1, os.cpus().length - 1)));
const GAMES = opt('no-games') ? 0 : +(opt('games') || 120);
fs.mkdirSync(OUT, { recursive: true });
const sub = d => { const p = path.join(OUT, d); fs.mkdirSync(p, { recursive: true }); return p; };
// the lineup as the game has it (power dials, levels) for tag-sim2.js
const LU = require('./lineup.js'), ALL = Object.assign({}, LU.ROBOTS, LU.ROBOTS4);
const LN = { lv: {}, p: {} }; for (const n of Object.keys(ALL)) { LN.lv[n] = ALL[n][0]; LN.p[n] = ALL[n][1]; }
fs.writeFileSync(path.join(OUT, 'lineup.json'), JSON.stringify(LN));
fs.copyFileSync(path.join(DL, 'tag-tuned', 'cand-fit.json'), path.join(OUT, 'cand-fit.json'));
// ---- the jobs: { id, args (node), cwd, env, w = fights (for the time estimate), done(): did it finish } ----
const jobs = [];
const node = (id, script, a, w, o = {}) => jobs.push(Object.assign({ id, args: [path.join(DL, script)].concat(a), cwd: o.cwd || OUT, env: o.env || {}, w }, o));
{ const P = 48, d = sub('matrix'); for (let i = 0; i < P; i++) node('matrix ' + i, 'matrix.js', ['open', 'all', String(i), String(P), '20'], 220, { cwd: d, file: path.join(d, `matrix-open-all-${i}.json`) }); }
for (const ar of ['saws', 'killbox', 'cage', 'ice']) { const P = 8, d = sub('matrix'); for (let i = 0; i < P; i++) node('arena matrix ' + ar + ' ' + i, 'matrix.js', [ar, 'same', String(i), String(P), '20'], 250, { cwd: d, file: path.join(d, `matrix-${ar}-same-${i}.json`) }); }
{ const d = sub('arenafit'); for (const ar of ['open', 'saws', 'killbox', 'cage', 'ice']) for (let s = 0; s < 16; s++) { const f = path.join(d, `${ar}_${s}.json`); node(`arenafit ${ar} ${s}`, 'arenafit.js', [ar, '1', String(s), '--out=' + f], 198, { file: f }); } }
const tag = (sec, nsh, w, env = {}) => { const d = sub('tags'); for (let i = 0; i < nsh; i++) node(`${sec} ${i}`, 'tag-sim2.js', [path.join(OUT, 'lineup.json'), String(i), String(nsh), d, sec], w, { env, file: path.join(d, `${sec}_${i}.json.done`) }); };
tag('parts', 48, 308);
tag('confirm', 32, 656, { CAND: path.join(OUT, 'cand-fit.json') });
tag('ffa', 8, 190, { N: '750' });
tag('tv', 8, 190, { N: '750' });
if (opt('only')) { const o = String(opt('only')); for (let i = jobs.length - 1; i >= 0; i--) if (!jobs[i].id.startsWith(o)) jobs.splice(i, 1); }   // testing: only jobs whose name starts so
// ---- the pool ----
const donef = j => j.file && fs.existsSync(j.file);
const W = jobs.reduce((a, j) => a + j.w, 0); let doneW = jobs.filter(donef).reduce((a, j) => a + j.w, 0), startW = doneW;
const queue = jobs.filter(j => !donef(j)), t0 = Date.now(); let running = 0, failed = [];
const fmt = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${m} min` : m ? `${m} min` : `${s} s`; };
const show = () => { const frac = doneW / W, rate = (doneW - startW) / Math.max(1, (Date.now() - t0) / 1000);
  process.stdout.write(`\r  fights done: ${Math.round(100 * frac)}% (${doneW} of ${W})` + (rate > 0 ? `, about ${fmt((W - doneW) / rate)} left    ` : '    ')); };
console.log(`ROBOCUS wear tables: ${jobs.length} jobs, about ${W} fights, ${NW} at a time. Results: ${OUT}`);
if (startW) console.log(`  (going on from an earlier run: ${Math.round(100 * startW / W)}% was done already)`);
function next(resolve) {
  if (!queue.length && !running) return resolve();
  while (running < NW && queue.length) {
    const j = queue.shift(); running++;
    const p = spawn(process.execPath, j.args, { cwd: j.cwd, env: Object.assign({}, process.env, j.env), stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => { err += d; });
    p.on('close', code => { running--; if (code === 0 && (!j.file || fs.existsSync(j.file))) doneW += j.w; else failed.push(j.id + ': ' + err.split('\n').slice(0, 3).join(' ')); show(); next(resolve); });
  }
}
(async () => {
  show(); await new Promise(next); console.log('');
  if (failed.length) { console.log(`\n${failed.length} jobs failed (start this again to retry them):\n  ` + failed.slice(0, 8).join('\n  ')); }
  // whole AI games of the game page (the branch's tabletop-2.html), like docs/robocus-part-levels.md "Whole games"
  if (GAMES && !failed.length) {
    const tagName = 'wear_games', simFile = path.join(ROOT, 'sims', tagName + '.json');
    if (!fs.existsSync(simFile)) {
      let pw = true; try { require.resolve('playwright', { paths: [ROOT] }); } catch (e) { pw = false; }
      if (!pw) console.log('\nWhole games skipped: Playwright is not installed here (the tables above are what matters most).');
      else {
        console.log(`\nNow ${GAMES} whole AI games of the game (${NW} at a time; about 1-2 minutes per game per worker)...`);
        await new Promise(res => { const p = spawn(process.execPath, [path.join(ROOT, 'tools', 'game-sim.js'), '--page=prototypes/tabletop-2.html', '--tag=' + tagName, '--games=' + GAMES, '--par=' + NW], { cwd: ROOT, stdio: 'inherit' }); p.on('close', res); });
      }
    }
    if (fs.existsSync(simFile)) fs.copyFileSync(simFile, path.join(sub('games'), tagName + '.json'));
  }
  // one file to send back
  const pack = {}; const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.json$/.test(f)) pack[path.relative(OUT, p).replace(/\\/g, '/')] = fs.readFileSync(p, 'utf8'); } };
  walk(OUT); delete pack['wear-tables-results.json'];
  const rev = (() => { try { return fs.readFileSync(path.join(ROOT, 'wear-results-rev.txt'), 'utf8').trim(); } catch (e) { return ''; } })();
  const outF = path.join(OUT, 'wear-tables-results.json.gz');
  fs.writeFileSync(outF, zlib.gzipSync(JSON.stringify({ made: new Date().toISOString(), rev, cores: os.cpus().length, workers: NW, failed, files: pack })));
  console.log(`\nDONE${failed.length ? ' (with ' + failed.length + ' failed jobs: run it again first)' : ''}. Send this one file back to Claude:\n\n  ${outF}\n`);
})();
