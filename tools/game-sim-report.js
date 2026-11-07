// Summary of tools/game-sim.js runs, side by side: node tools/game-sim-report.js start4 start1 [more tags]
// Reads sims/<tag>.json. Add --cards to also list each Intrigue card (drawn / played / landed / blocked / cashed per game).
const fs = require('fs'), path = require('path');
const tags = process.argv.slice(2).filter(x => !x.startsWith('--')), showCards = process.argv.includes('--cards');
if (!tags.length) { console.log('usage: node tools/game-sim-report.js <tag> [tag2 ...] [--cards]   (files in sims/)'); process.exit(1); }
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f1 = x => isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1), pc = x => isNaN(x) ? '-' : Math.round(x * 100) + '%';
const rows = [], cols = [];
for (const tag of tags) {
  const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json')));
  const all = D.res, ok = all.filter(r => r.over && !r.stall && !r.crash), n = ok.length;
  const rounds = ok.map(r => r.round);
  const sumC = (r, pred, k) => Object.entries(r.cstat).filter(([id]) => r.cash[id] && pred(r.cash[id], id)).reduce((a, [, s]) => a + (s[k] || 0), 0);
  const intr = c => !c.live, live = c => c.live, harm = c => c.harmful && !c.live;
  const drawn = ok.map(r => sumC(r, intr, 'drawn') + sumC(r, live, 'drawn'));
  const cashCr = ok.map(r => Object.entries(r.cstat).reduce((a, [id, s]) => a + (r.cash[id] ? s.cashed * r.cash[id].cash : 0), 0));
  const fights = ok.map(r => r.fights), liveP = ok.map(r => sumC(r, live, 'played'));
  const atkL = ok.map(r => sumC(r, harm, 'landed')), atkB = ok.map(r => sumC(r, harm, 'blocked'));
  const crPerRound = ok.map(r => { const R = Object.values(r.ups); return R.length ? mean(R.map(u => u.cr.reduce((a, b) => a + b, 0) / 4)) : NaN; });
  const market = ok.map(r => r.marketCr.reduce((a, b) => a + b, 0)), bets = ok.map(r => r.betCr || 0);
  const auct = ok.flatMap(r => r.auctions || []), auctWon = auct.reduce((a, x) => a + (x.wins || []).length, 0), auctCr = auct.reduce((a, x) => a + (x.wins || []).reduce((s, w) => s + (w.price || 0), 0), 0);
  const fame = {}; ok.forEach(r => r.fameBy.forEach(fb => Object.entries(fb).forEach(([k, v]) => { if (k === 'phase:setup') return; const kk = k.startsWith('card:') ? (v > 0 ? 'cards +' : 'cards −') : k; fame[kk] = (fame[kk] || 0) + v; })));
  const hist = {}; rounds.forEach(x => hist[x] = (hist[x] || 0) + 1);
  const seatWins = [0, 1, 2, 3].map(i => ok.filter(r => r.winner === i).length / n);
  cols.push(tag);
  rows.push({
    'settings': 'start ' + D.start + ', win ' + D.win + ', AI v' + D.ai,
    'games finished / run': n + ' / ' + all.length + (all.length - n ? ' (' + all.filter(r => r.stall).length + ' stalls, ' + all.filter(r => r.crash).length + ' crashes)' : ''),
    'page errors': all.reduce((a, r) => a + (r.errs || 0) + (r.pageErrs || []).length, 0),
    'rounds: mean': f1(mean(rounds)), 'rounds: median (10%–90%)': q(rounds, .5) + ' (' + q(rounds, .1) + '–' + q(rounds, .9) + ')',
    'rounds histogram': Object.entries(hist).map(([k, v]) => k + ':' + v).join(' '),
    'Intrigue deck size': ok[0] ? ok[0].deckSize : '-',
    'Intrigue cards drawn / game': f1(mean(drawn)), 'share of the deck seen': ok[0] ? pc(mean(drawn) / ok[0].deckSize) : '-',
    'cards cashed in / game (Cr)': f1(mean(ok.map(r => sumC(r, () => true, 'cashed')))) + ' (' + f1(mean(cashCr)) + ' Cr)',
    'attacks played / game': f1(mean(atkL.map((x, i) => x + atkB[i]))), 'attacks that land': pc(mean(atkL) / (mean(atkL) + mean(atkB))),
    'Security Bot rolls / game': f1(mean(ok.map(r => (r.cstat.security_bot || {}).played || 0))),
    'fights / game': f1(mean(fights)), 'live cards played / fight': f1(mean(liveP) / mean(fights)),
    'auction: cards won / fight (Cr each)': auct.length ? f1(auctWon / mean(fights) / n) + ' (' + f1(auctCr / Math.max(1, auctWon)) + ' Cr)' : '-',
    'avg credits held per team (upkeep)': f1(mean(crPerRound)),
    'Market spend / game (all teams)': f1(mean(market)), 'bets staked / game': f1(mean(bets)),
    'win share by seat 1-4': seatWins.map(pc).join(' '),
    'fame / game by source': Object.entries(fame).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 7).map(([k, v]) => k + ' ' + f1(v / n)).join(', '),
    _cards: (() => { const c = {}; ok.forEach(r => Object.entries(r.cstat).forEach(([id, s]) => { if (!r.cash[id]) return; const x = c[r.cash[id].name] = c[r.cash[id].name] || { drawn: 0, played: 0, landed: 0, blocked: 0, cashed: 0 }; for (const k in x) x[k] += s[k] || 0; })); for (const k in c) for (const kk in c[k]) c[k][kk] /= n; return c; })()
  });
}
const keys = Object.keys(rows[0]).filter(k => k !== '_cards'), w0 = Math.max(...keys.map(k => k.length)) + 2;
const cw = cols.map((c, i) => Math.max(c.length, ...keys.map(k => String(rows[i][k]).length)) + 2);
console.log(''.padEnd(w0) + cols.map((c, i) => c.padEnd(cw[i])).join(''));
for (const k of keys) console.log(k.padEnd(w0) + rows.map((r, i) => String(r[k]).padEnd(cw[i])).join(''));
if (showCards) rows.forEach((r, i) => {
  console.log('\n' + cols[i] + ': per game  drawn / played / landed / blocked / cashed');
  Object.entries(r._cards).sort((a, b) => b[1].drawn - a[1].drawn).forEach(([k, s]) => console.log('  ' + k.padEnd(26) + [s.drawn, s.played, s.landed, s.blocked, s.cashed].map(f1).join(' / ')));
});
