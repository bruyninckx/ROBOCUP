// T26 (17 Nov): solo games with a test-bot person in seat 0 (?bot=1) and 3 AI teams, to compare two builds of the Market.
// Per game: rounds, finished or not, trades (all, and with the person), bank sales by the person, AI offers to the person,
// Market spend (lots won, all teams), and how often the game waited for the person to click per round, by step
// (seatBusyWith(0) polled; 'lots', 'open', 'hostbid', 'bets' are "everyone must click" steps; 'mres', 'mres2', 'next' go on by
// themselves; 'upkeep' only when there is something to repair). The game runs with G.fast (no animations, headless fights,
// the formula bookie) and draws nothing, so a game takes about a minute; the bot still plays seat 0 through the real actions.
//   node tools/market-step-measure.js --page=prototypes/tabletop-2.html --games=60 --par=2 --seed0=1 --tag=after
//   node tools/market-step-measure.js --report=before,after
//   --bal='{...}' merged into the page's BAL (T55: --bal='{"tradeFloor":false}' for the old Market flow)
// Results: sims/market-<tag>.json.
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const OUTD = path.join(process.cwd(), 'sims'); fs.mkdirSync(OUTD, { recursive: true });
const CLICK = ['open', 'lots', 'hostbid', 'bets'];
if (arg('report')) {
  const runs = arg('report').split(',').map(t => ({ t, R: JSON.parse(fs.readFileSync(path.join(OUTD, 'market-' + t + '.json'), 'utf8')) }));
  const seeds = runs.map(x => new Set(x.R.res.filter(g => g.over).map(g => g.seed)));
  const both = [...seeds[0]].filter(s => seeds.every(S => S.has(s)));
  const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2)) * a.length / Math.max(1, a.length - 1)); };
  const pm = a => mean(a).toFixed(2) + ' ± ' + (1.96 * sd(a) / Math.sqrt(a.length || 1)).toFixed(2);
  const rows = [
    ['games finished / run', R => R.res.filter(g => g.over).length + ' / ' + R.res.length],
    ['page errors', R => R.res.reduce((a, g) => a + g.errs.length, 0)],
  ];
  for (const [n, f] of rows) console.log(n.padEnd(46) + runs.map(x => String(f(x.R)).padEnd(22)).join(''));
  console.log('(below: the ' + both.length + ' seeds that finished in every run; ± = 95% interval of the mean)');
  const per = (R, f) => both.map(s => f(R.res.find(g => g.seed === s)));
  const m = [
    ['rounds per game', g => g.round],
    ['trades per game (all teams)', g => g.trades],
    ['  of them with the person', g => g.tradesMe],
    ['AI offers to the person per game', g => g.offers],
    ['  accepted', g => g.offersYes],
    ['bank sales by the person per game', g => g.salesMe],
    ['Market spend per game (lots, all teams)', g => g.spend],
    ['  the person', g => g.spendMe],
    ['click waits per round (open+lots+hostbid+bets)', g => CLICK.reduce((a, k) => a + (g.waits[k] || 0), 0) / g.round],
    ['  open market', g => (g.waits.open || 0) / g.round],
    ['  lots', g => (g.waits.lots || 0) / g.round],
    ['  host bid', g => (g.waits.hostbid || 0) / g.round],
    ['  bets', g => (g.waits.bets || 0) / g.round],
    ['upkeep waits per round', g => (g.waits.upkeep || 0) / g.round],
    ['auto steps per round (results, next)', g => ((g.waits.mres || 0) + (g.waits.mres2 || 0) + (g.waits.next || 0)) / g.round],
    ['market seconds per round (wall, fast mode)', g => g.mktMs / 1000 / g.round],
  ];
  for (const [n, f] of m) console.log(n.padEnd(46) + runs.map(x => pm(per(x.R, f)).padEnd(22)).join(''));
  if (runs.length === 2) { const d = both.map(s => { const a = runs[0].R.res.find(g => g.seed === s), b = runs[1].R.res.find(g => g.seed === s); return b.round - a.round; }); console.log('paired rounds difference (2nd − 1st)'.padEnd(46) + pm(d)); }
  process.exit(0);
}
const PAGE = arg('page', 'prototypes/tabletop-2.html'), N = +arg('games', 60), PAR = +arg('par', 2), SEED0 = +arg('seed0', 1), TAG = arg('tag', 'run'), MAXR = +arg('maxRound', 30);
const PLK = require('./planck-local.js'), PL = PLK.find(arg('planck', ''));
(async () => {
  const { chromium } = require('playwright');
  // results are saved after every game; a run that was stopped carries on where it was (same tag, same page)
  const OUT = path.join(OUTD, 'market-' + TAG + '.json'), old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const res = old && old.page === PAGE ? old.res.filter(g => g.over || g.errs.every(e => !/^crash/.test(e))) : [], have = new Set(res.map(g => g.seed));
  const save = () => fs.writeFileSync(OUT, JSON.stringify({ tag: TAG, page: PAGE, games: N, seed0: SEED0, res }, null, 0));
  const b = await chromium.launch(); let next = SEED0; const t0 = Date.now();
  async function one(seed) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    try {
      await PLK.route(p, PL);
      await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + path.resolve(PAGE) + '?seed=' + seed + '&bot=1&bal=' + encodeURIComponent(JSON.stringify(Object.assign({ autoMs: 400 }, JSON.parse(arg('bal', '{}')))))); await p.waitForTimeout(200);
      await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.ai({ versions: [2, 2, 2, 2] }); D.tune({ win: 12 }); });
      // the test bot starts the solo game by itself
      await p.evaluate(() => {   // watch seat 0: which step the game waits on, AI offers it gets, its market time
        const D = window.ROBOCUS_DEBUG, GM = window.ROBOCUS_GAME, X = window.__m = { waits: {}, seen: {}, offers: 0, qs: {}, mktMs: 0 };
        let mk = null;
        setInterval(() => { const G = D.G; if (!G || G.over) return; G.fast = true;
          const busy = GM.seatBusyWith(0), key = G.round + ':' + busy;
          if (busy && !X.seen[key]) { X.seen[key] = 1; X.waits[busy] = (X.waits[busy] || 0) + 1; }
          const q = D.RX.q; if (q && !X.qs[q.id] && /Offer from/.test(q.title)) { X.qs[q.id] = 1; X.offers++; }   // T55: on the trading floor an AI offer is a ticket
          for (const o of (G.offers || [])) if (o.to === 0 && o.kind !== 'trade' && !X.qs['f' + G.gid + ':' + o.id]) { X.qs['f' + G.gid + ':' + o.id] = 1; X.offers++; }
          const inMk = G.phase === 'market' && !G.marketResolved && !G.marketAuction && G.marketStage !== 'host';
          if (inMk && mk == null) mk = Date.now(); if (!inMk && mk != null) { X.mktMs += Date.now() - mk; mk = null; } }, 25);
      });
      let last = '', same = 0;
      for (let i = 0; i < 20000; i++) {
        const st = await p.evaluate(maxR => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > maxR) return null;
          const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); }
          return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame + '/' + t.credits).join(','); }, MAXR);
        if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 1500) { errs.push('stall at ' + st); break; } await p.waitForTimeout(40);
      }
      const r = await p.evaluate(() => {
        const D = window.ROBOCUS_DEBUG, G = D.G, ev = D.PT.game.events, X = window.__m, me = G.teams[0].name;
        const msgs = ev.filter(e => e.k === 'msg').map(e => e.text || '');
        const tr = msgs.filter(t => /^🤝 (Trade:|.* buys .* from |.* sells (its robot )?.* to )/.test(t));
        const lots = ev.filter(e => e.k === 'market').flatMap(e => e.lots || []);
        return { over: !!G.over, round: G.round, trades: tr.length, tradesMe: tr.filter(t => t.includes(me)).length,
          offers: X.offers, offersYes: tr.filter(t => t.includes(me) && !/^🤝 Trade:/.test(t)).length,
          salesMe: msgs.filter(t => t.startsWith('🏦 ' + me + ' sells')).length,
          spend: lots.reduce((a, l) => a + (l.winner != null && l.winner >= 0 ? l.price || 0 : 0), 0), spendMe: lots.reduce((a, l) => a + (l.winner === 0 ? l.price || 0 : 0), 0),
          waits: X.waits, mktMs: X.mktMs, errs: (D.PT.errs || []).map(e => String(e.msg || e).slice(0, 200)) };
      });
      r.seed = seed; r.errs = errs.concat(r.errs); res.push(r);
      process.stdout.write(`\r${TAG}: ${res.length}/${N} games, ${((Date.now() - t0) / 60000).toFixed(1)} min   `);
    } catch (e) { res.push({ seed, over: false, errs: errs.concat(['crash: ' + e.message]), waits: {} }); }
    finally { await p.close().catch(() => {}); save(); }
  }
  await Promise.all(Array.from({ length: PAR }, async () => { while (next < SEED0 + N) { const sd = next++; if (!have.has(sd)) await one(sd); } }));
  await b.close();
  res.sort((x, y) => x.seed - y.seed); save();
  console.log('\nsaved sims/market-' + TAG + '.json');
})();
