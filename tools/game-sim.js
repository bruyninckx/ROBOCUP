// Whole-game simulation: all 4 teams AI, no drawing, many games in parallel. Measures game length, Intrigue use,
// live cards, credit flow, attacks, fame sources. Results go to sims/<tag>.json; compare with tools/game-sim-report.js.
//   node tools/game-sim.js --tag=start4 --games=200 --par=8 --start=4 --win=12
// Options: --games (default 100), --par (parallel games, default 4; about your number of CPU cores),
//          --start (start fame: 1, 2, 4 or 7; default 4), --win (fame to win, default 12), --seed0 (first seed, default 1),
//          --ai (v2 or v1, default v2), --page (default prototypes/tabletop-prototype.html)
// The same seeds in two runs = the same shuffles to start with, so two settings compare like for like.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const N = +arg('games', 100), PAR = +arg('par', 4), START = +arg('start', 4), WIN = +arg('win', 12), SEED0 = +arg('seed0', 1);
const AIV = +String(arg('ai', 'v2')).replace(/\D/g, ''), PAGE = arg('page', 'prototypes/tabletop-prototype.html');
const TAG = arg('tag', 's' + START + '_w' + WIN), OUTD = path.join(process.cwd(), 'sims');
fs.mkdirSync(OUTD, { recursive: true });

(async () => {
  const b = await chromium.launch(); const res = []; let next = SEED0, done = 0; const t0 = Date.now();
  async function one(seed) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
    try {
      await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + path.resolve(PAGE) + '?seed=' + seed); await p.waitForTimeout(150);
      await p.evaluate(([v, start, win]) => {
        const D = window.ROBOCUS_DEBUG; D.ai({ versions: [v, v, v, v] }); D.tune({ win });
        const s = document.getElementById('pFame'); if (s) { if (![...s.options].some(o => +o.value === start)) s.add(new Option(start, start)); s.value = String(start); s.dispatchEvent(new Event('change')); }
        else { D.G.startFame = start; D.G.teams.forEach(t => { t.fame = start; }); }
      }, [AIV, START, WIN]);
      await p.click('#pAct2'); await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
      let last = '', same = 0, stall = false;
      for (let i = 0; i < 40000; i++) {
        const st = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > 40) return null; const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame + '/' + t.credits).join(','); });
        if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 600) { stall = true; break; } await p.waitForTimeout(5);
      }
      const r = await p.evaluate(() => {
        const D = window.ROBOCUS_DEBUG, G = D.G, ev = D.PT.game.events, C = D.CARDS_ALL();
        const w = G.teams.slice().sort((a, b) => b.fame - a.fame || b.credits - a.credits)[0];
        const ups = {}; ev.filter(e => e.k === 'phase' && e.ph === 'upkeep').forEach(e => { if (!ups[e.r]) ups[e.r] = { fame: e.teams.map(t => t.fame), cr: e.teams.map(t => t.cr), robots: e.teams.map(t => t.robots.length), hand: e.teams.map(t => t.hand) }; });
        const fights = ev.filter(e => e.k === 'fight_start' && !e.fid);
        const fends = ev.filter(e => e.k === 'fight_end' && !e.sandbox && !e.fid);
        const market = ev.filter(e => e.k === 'market').map(e => e.lots.reduce((a, l) => a + (l.winner != null && l.winner >= 0 ? (l.price || 0) : 0), 0));
        const betCr = fights.reduce((a, f) => a + (f.bets || []).reduce((s, x) => s + (x && (x.amt || x.amount) || 0), 0), 0);
        const auctions = ev.filter(e => e.k === 'card_auction');
        return { over: G.over, round: G.round, winner: G.over ? w.i : -1, fame: G.teams.map(t => t.fame), cr: G.teams.map(t => t.credits),
          fameBy: G.teams.map(t => t.fameBy || {}), ups, cstat: G.cstat || {}, cash: Object.fromEntries(Object.keys(G.cstat || {}).map(id => [id, C[id] ? { cash: C[id].cash, fam: C[id].fam, name: C[id].name, live: C[id].phase === 'fight', harmful: !!C[id].harmful } : null])),
          deckSize: D.DECK().length, fights: fights.length, fightCards: fends.map(f => (f.log || []).filter(x => x.k === 'card').length),
          formats: fights.map(f => f.format), marketCr: market, betCr, hostBids: ev.filter(e => e.k === 'host_bid').length,
          auctions: auctions.map(a => ({ cards: a.cards, wins: a.wins })), errs: D.PT.errs };
      });
      r.seed = seed; r.stall = stall; r.pageErrs = errs.slice(0, 5); res.push(r);
    } catch (e) { res.push({ seed, crash: e.message }); }
    await p.close();
    done++; if (done % 10 === 0 || done === N) process.stdout.write('\r' + TAG + ': ' + done + '/' + N + ' games, ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min   ');
  }
  await Promise.all(Array.from({ length: PAR }, async () => { while (next < SEED0 + N) await one(next++); }));
  const file = path.join(OUTD, TAG + '.json');
  fs.writeFileSync(file, JSON.stringify({ tag: TAG, start: START, win: WIN, ai: AIV, page: PAGE, games: N, at: new Date().toISOString(), min: (Date.now() - t0) / 60000, res }));
  console.log('\nsaved ' + file + '  (summary: node tools/game-sim-report.js ' + TAG + ')');
  await b.close();
})();
