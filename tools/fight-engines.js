// Do fights come out the same in every browser? (15 Nov, after the Friday playtest: "people see different things".)
// Online, every screen runs the fight itself from the same start (src2/engine.js), so a browser that rounds one number
// differently would show another fight. This runs the same fights in every browser engine Playwright has on this PC
// (Chromium = Chrome and Edge, Firefox, WebKit = Safari) and compares the outcome down to the last digit.
//   node tools/fight-engines.js [fights=40] [seed=1]
// Needs once, for the other engines:  npx playwright install firefox webkit
// (With Chromium only it still checks that the same fight twice gives the same result.)
const pw = require('playwright');
const path = require('path'), fs = require('fs');
const N = +(process.argv[2] || 40), seed = +(process.argv[3] || 1);
const url = require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=1';
const runFights = ([N, seed]) => {
  const DL = window.DamageLab, LU = window.Lineup, names = Object.keys(LU.ROBOTS).concat(Object.keys(LU.ROBOTS4 || {})).filter(n => DL.PRESETS[n]).sort();
  const arenas = Object.keys(DL.ARENAS).sort(), parts = Object.keys(LU.PARTS).sort();
  let s = seed >>> 0; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }, pick = a => a[Math.floor(rnd() * a.length)];
  const lvl = n => (LU.ROBOTS[n] || LU.ROBOTS4[n] || [0])[0];
  const spec = (n, team) => { const ps = rnd() < 0.5 ? [pick(parts)] : []; let sp; try { sp = LU.build(n, ps); } catch (e) { sp = LU.build(n); } return Object.assign(JSON.parse(JSON.stringify(sp)), { name: n, level: lvl(n), teamName: 'T' + team, team }); };
  const out = [];
  for (let k = 0; k < N; k++) {
    const four = k % 5 === 4, arena = four && pick(arenas) === 'cage' ? 'open' : pick(arenas), fseed = (rnd() * 4294967296) >>> 0;
    const list = four ? [spec(pick(names), 0), spec(pick(names), 0), spec(pick(names), 1), spec(pick(names), 1)] : [spec(pick(names), 0), spec(pick(names), 1)];
    const what = list.map(x => x.name).join(four ? ' + ' : ' vs ') + ' · ' + (arena === 'cage' && four ? 'open' : arena);
    let fp;
    try {
      const S = DL.create(four ? { mode: '2v2', robots: list, seed: fseed, countdown: 0, arena: arena === 'cage' ? 'open' : arena } : { a: list[0], b: list[1], seed: fseed, countdown: 0, arena });
      let g = 0; while (!S.over && g++ < 120 * 400) { DL.step(S); S.fx.length = 0; }
      fp = S.step + '|' + (S.result ? S.result.winner + ':' + S.result.how : 'none') + '|' + S.robots.map(R => { const p = R.body.getPosition(); return (R.alive ? 1 : 0) + ',' + (R.chassis ? R.chassis.hp : 0) + ',' + p.x + ',' + p.y + ',' + R.body.getAngle() + ',' + R.stats.lost.length; }).join(';');
    } catch (e) { fp = 'ERROR ' + e.message; }
    out.push({ what, fp });
  }
  return out;
};
(async () => {
  const res = {}, skipped = [];
  for (const name of ['chromium', 'firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { skipped.push(name); continue; }
    const ctx = await b.newContext(); if (fs.existsSync('vendor/planck-1.4.3.min.js')) await ctx.route(/^https?:/, r => r.abort());
    for (const run of name === 'chromium' ? ['chromium', 'chromium again'] : [name]) {
      const p = await ctx.newPage(); const t0 = Date.now();
      try { await p.goto(url); await p.waitForFunction(() => window.DamageLab && window.Lineup && window.planck, null, { timeout: 30000 }); res[run] = await p.evaluate(runFights, [N, seed]); console.log(run + ': ' + N + ' fights in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
      catch (e) { console.log(run + ': could not run the fights (' + String(e.message).split('\n')[0] + ')'); }
      await p.close();
    }
    await b.close();
  }
  if (skipped.length) console.log('Not installed here: ' + skipped.join(', ') + '. For the full check: npx playwright install ' + skipped.join(' '));
  const runs = Object.keys(res), base = res[runs[0]]; let bad = 0;
  if (!base) { console.log('FAIL: no browser could run the fights'); process.exit(1); }
  const errors = base.filter(x => /^ERROR/.test(x.fp)); if (errors.length) console.log(errors.length + ' fights could not be built: ' + errors.slice(0, 3).map(x => x.what + ' (' + x.fp + ')').join('; '));
  for (const r of runs.slice(1)) { const diff = res[r].map((x, i) => x.fp !== base[i].fp ? i : -1).filter(i => i >= 0);
    console.log(runs[0] + ' against ' + r + ': ' + (N - diff.length) + ' of ' + N + ' fights identical' + (diff.length ? ' · DIFFERENT: ' + diff.slice(0, 6).map(i => '#' + i + ' ' + base[i].what + ' (ends at step ' + base[i].fp.split('|')[0] + ' against ' + res[r][i].fp.split('|')[0] + ')').join('; ') : ''));
    bad += diff.length; }
  const engines = [...new Set(runs.map(r => r.split(' ')[0]))];
  console.log(bad ? 'FAIL: ' + bad + ' fights differ' : 'OK: every fight came out the same' + (engines.length > 1 ? ' in ' + engines.join(', ') : ' twice in Chromium (other engines not installed: the cross-browser question is still open)'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
