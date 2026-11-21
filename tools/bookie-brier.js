// T52 (21 Nov 2026): is a short run of test fights (25-40) plus the formula as a prior better than the formula alone?
// AI games (all 4 teams AI, autopilot, page opened from a file). At every real fight with --minBots robots or more (copies and
// the House Robot counted), the bookie's test fights of that fight (open information only, as in the game) run --n times on the
// page, while the game goes on with the formula's odds (bot games never use test fights, so the games themselves are the
// usual AI games). Saved per fight: formula odds, test-fight wins in order, who really won (face-down and live cards in).
// Report: node tools/bookie-brier.js --report=sims/t52-brier.json
//   node tools/bookie-brier.js --tag=t52-brier --games=30 --par=2 --n=40 --minBots=3
'use strict';
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
if (arg('report', '')) {
  const d = JSON.parse(fs.readFileSync(arg('report'), 'utf8')), F = d.res.flatMap(g => g.fights || []).filter(f => f.win != null && f.win !== -1 && f.seq && f.seq.length);
  const brier = (p, w) => p.reduce((a, x, s) => a + (x - (s === w ? 1 : 0)) ** 2, 0) / p.length;   // per side, averaged over sides
  const clampP = p => p.map(x => Math.max(0.03, Math.min(0.95, x)));
  const blend = (f, k, prior) => { const seq = f.seq.slice(0, k), n = seq.length; return clampP(f.p.map((p, s) => (seq.filter(x => x === s).length + prior * p) / (n + prior))); };
  const groups = { 'all fights': F, 'duels (2 robots)': F.filter(f => f.bots === 2), '3+ robots': F.filter(f => f.bots >= 3), '4 robots': F.filter(f => f.bots >= 4) };
  const rows = [];
  for (const [g, L] of Object.entries(groups)) { if (!L.length) continue;
    const m = fn => { const v = L.map(fn), mu = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, v.length - 1)); return [mu, sd / Math.sqrt(v.length)]; };
    const fo = m(f => brier(clampP(f.p), f.win)); const r = { group: g, fights: L.length, formula: fo[0].toFixed(3) };
    for (const k of [10, 20, 25, 30, 40]) { if (L.some(f => f.seq.length < k)) continue;
      for (const pr of [0, 8, 16]) { const x = m(f => brier(blend(f, k, pr), f.win)), dlt = m(f => brier(blend(f, k, pr), f.win) - brier(clampP(f.p), f.win));
        r[k + '+' + pr] = x[0].toFixed(3) + ' (' + (dlt[0] >= 0 ? '+' : '') + dlt[0].toFixed(3) + '±' + dlt[1].toFixed(3) + ')'; } }
    rows.push(r); }
  console.log('Brier per fight (lower is better; a coin is 0.25). k+prior: k test fights, formula counted as prior fights; (change vs formula ± 1 s.e., paired)');
  for (const r of rows) console.log(JSON.stringify(r));
  process.exit(0);
}
const { chromium } = require('playwright');
const N = +arg('games', 30), PAR = +arg('par', 2), SEED0 = +arg('seed0', 1), NT = +arg('n', 40), MINB = +arg('minBots', 3), TAG = arg('tag', 't52-brier'), MAXR = 40;
const PLK = require('./planck-local.js'), PL = PLK.find(arg('planck', ''));
const OUTD = path.join(process.cwd(), 'sims'); fs.mkdirSync(OUTD, { recursive: true }); const file = path.join(OUTD, TAG + '.json');
(async () => {
  const b = await chromium.launch(), res = []; let next = SEED0; const t0 = Date.now();
  const save = () => fs.writeFileSync(file, JSON.stringify({ tag: TAG, n: NT, minBots: MINB, at: new Date().toISOString(), min: (Date.now() - t0) / 60000, res: res.slice().sort((a, b) => a.seed - b.seed) }));
  async function one(seed) {
    const p = await b.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    try {
      await PLK.route(p, PL); await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + path.resolve('prototypes/tabletop-2.html') + '?seed=' + seed); await p.waitForTimeout(150);
      await p.evaluate(([NT, MINB]) => {
        const D = window.ROBOCUS_DEBUG; window.__bk = { fights: [], jobs: 0 };
        const hook = () => { const ev = D.PT.game.events; if (ev.__bk) return; ev.__bk = 1; const push = ev.push;
          ev.push = function (e) { try {
            if (e && e.k === 'fight_start' && !e.fid) { const F = D.G.fight, bots = D.buildFight(F, 1, false).botEnt.length;
              const rec = { r: D.G.round, format: F.format, bots, p: F.p.slice(), win: null, seq: null }; window.__bk.fights.push(rec); window.__bk.cur = rec;
              if (bots >= MINB) { window.__bk.jobs++; const seq = []; rec.seq = seq;
                // the bookie's own loop, one fight at a time on this page (open information only); the order of wins kept for subsamples
                const m = D.buildFight(F, 1, false), bb = JSON.parse(JSON.stringify(m.bb)); bb.countdown = 0; let sd = (D.G.round * 7919 + 12345) >>> 0;
                const run = () => { if (seq.length >= NT) { window.__bk.jobs--; return; } sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0;
                  const S = window.DamageLab.create(Object.assign(JSON.parse(JSON.stringify(bb)), { seed: sd })); let g = 0; while (!S.over && g++ < 48000) { window.DamageLab.step(S); S.fx.length = 0; }
                  const x = S.result, side = !x ? -1 : (S.multi && S.mode === '2v2') ? (x.winTeam === 9 ? 'house' : x.winTeam) : (m.botEnt[x.winner] == null || m.botEnt[x.winner] < 0 ? 'house' : F.sides[m.botEnt[x.winner]]);
                  seq.push(side); setTimeout(run, 0); };
                setTimeout(run, 0); } }
            if (e && e.k === 'fight_end' && !e.fid && !e.sandbox && window.__bk.cur) { window.__bk.cur.win = e.winSide; window.__bk.cur = null; }
          } catch (err) { (window.__bk.err = window.__bk.err || []).push(err.message); } return push.apply(this, arguments); }; };
        window.__bk.hook = hook; hook();
      }, [NT, MINB]);
      await p.click('#pAct2'); await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
      for (let i = 0; i < 400000; i++) {
        const st = await p.evaluate(maxR => { const D = window.ROBOCUS_DEBUG, G = D.G; window.__bk.hook(); if ((G.over || G.round > maxR) && !window.__bk.jobs) return null; if (G.over) return 'wait';
          const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return 1; }, MAXR);
        if (!st) break; await p.waitForTimeout(st === 'wait' ? 500 : 5);
      }
      const r = await p.evaluate(() => ({ fights: window.__bk.fights, err: window.__bk.err || null, round: window.ROBOCUS_DEBUG.G.round }));
      r.seed = seed; r.pageErrs = errs.slice(0, 3); res.push(r);
    } catch (e) { res.push({ seed, crash: e.message }); }
    await p.close(); save();
    process.stdout.write('\r' + TAG + ': ' + res.length + '/' + N + ' games, ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min   ');
  }
  await Promise.all(Array.from({ length: PAR }, async () => { while (next < SEED0 + N) await one(next++); }));
  save(); console.log('\nsaved ' + file); await b.close();
})();
