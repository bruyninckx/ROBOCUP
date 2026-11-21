// T45: Hostile Buyout (price = the weakest robot's value, at least 4) and Fire Sale (value + 1) in tools/game-sim.js runs.
//   node tools/buyout-report.js <tag> [tag2 ...]    (reads sims/<tag>.json; pair tags run on the same seeds)
// Per tag: games (finished / stalled), rounds, fame per round (all four teams), end credits, Hostile Buyout per game
// (drawn / played / landed / cashed), buyouts sold vs refused, price vs value, and Fire Sale items. ± is one standard error.
const fs = require('fs'), path = require('path');
const tags = process.argv.slice(2);
const st = a => { const n = a.length; if (!n) return '-'; const m = a.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1)); return m.toFixed(2) + ' ± ' + (sd / Math.sqrt(n)).toFixed(2) + ' (n ' + n + ')'; };
for (const tag of tags) {
  const D = JSON.parse(fs.readFileSync(path.join('sims', tag + '.json'), 'utf8'));
  const all = D.res, ok = all.filter(r => !r.crash && !r.stall && r.over);
  console.log('== ' + tag + ' (' + D.page + ', bal ' + JSON.stringify(D.bal) + ')');
  console.log('games: ' + all.length + ', finished ' + ok.length + ', stalled ' + all.filter(r => r.stall).length + ', crashed ' + all.filter(r => r.crash).length + ', page errors ' + all.reduce((a, r) => a + (r.pageErrN || 0), 0));
  console.log('rounds: ' + st(ok.map(r => r.round)));
  console.log('fame per round (4 teams): ' + st(ok.map(r => r.fame.reduce((a, b) => a + b, 0) / r.round)));
  console.log('end credits per team: ' + st(ok.map(r => r.cr.reduce((a, b) => a + b, 0) / 4)));
  const hb = ok.map(r => (r.cstat || {}).hostile_buyout || {});
  for (const k of ['drawn', 'played', 'landed', 'blocked', 'cashed']) console.log('Hostile Buyout ' + k + ' / game: ' + st(hb.map(x => x[k] || 0)));
  const B = ok.flatMap(r => (r.v2 && r.v2.buyouts) || []), S = B.filter(x => x.sold), N = B.filter(x => !x.sold);
  console.log('buyouts resolved: ' + B.length + ' (sold ' + S.length + ', refused ' + N.length + (B.length ? ', ' + Math.round(100 * S.length / B.length) + '% sold' : '') + ')');
  const withV = S.filter(x => x.v != null && x.price != null);
  if (withV.length) { console.log('  sold: price ' + st(withV.map(x => x.price)) + ', value ' + st(withV.map(x => x.v)) + ', price − value ' + st(withV.map(x => x.price - x.v)));
    console.log('  sold at the 4 Cr minimum (value under 4): ' + withV.filter(x => x.v < 4).length + '; at a value of 4+: ' + withV.filter(x => x.v >= 4).length + '; levels ' + JSON.stringify(withV.reduce((o, x) => (o[x.lv] = (o[x.lv] || 0) + 1, o), {}))); }
  const NV = N.filter(x => x.v != null); if (NV.length) console.log('  refused: price ' + st(NV.map(x => x.price)) + ', value ' + st(NV.map(x => x.v)));
  console.log('scraps / game (host, debt, none left): ' + st(ok.map(r => ((r.v2 && r.v2.scraps) || []).filter(x => x.why !== 'none-left').length)) + '; trade-ins / game ' + st(ok.map(r => ((r.v2 && r.v2.tradeIns) || []).length)));
  const fs_ = ok.flatMap(r => (r.v2 && r.v2.fires) || []);
  // pump check: a fire-sold robot this team won in the Market (lot id robot:<name>): what it paid, when, and what the bank paid
  const bought = ok.flatMap(r => ((r.v2 && r.v2.fires) || []).filter(x => x.kind === 'robot').map(x => { const L = ((r.v2.snaps || []).filter(q => q.k === 'sold').flatMap(q => q.lots.map(l => Object.assign({ r: q.r }, l)))).filter(l => l.winner === x.team && l.id === 'robot:' + x.name && l.r <= x.r).pop(); return { seed: r.seed, name: x.name, soldR: x.r, got: x.price, paid: L ? L.price : null, boughtR: L ? L.r : null }; }));
  const fsc = ok.map(r => (r.cstat || {}).fire_sale || {});
  if (fsc.some(x => x.drawn)) { console.log('Fire Sale drawn / played / cashed per game: ' + ['drawn', 'played', 'cashed'].map(k => (fsc.reduce((a, x) => a + (x[k] || 0), 0) / ok.length).toFixed(2)).join(' / '));
    console.log('  items sold: ' + fs_.length + ' ' + JSON.stringify(fs_.reduce((o, x) => (o[x.kind] = (o[x.kind] || 0) + 1, o), {})) + ', paid − value always ' + [...new Set(fs_.map(x => x.price - x.v))].join(',') + ', Cr per play ' + (fs_.reduce((a, x) => a + x.price, 0) / Math.max(1, fsc.reduce((a, x) => a + (x.played || 0), 0))).toFixed(1));
    const b = bought.filter(x => x.paid != null); console.log('  robots sold: ' + bought.length + ', of them won in the Market by the seller: ' + b.length + (b.length ? ' (bank − paid ' + st(b.map(x => x.got - x.paid)) + '; same round ' + b.filter(x => x.boughtR === x.soldR).length + '): ' + JSON.stringify(b) : ''));
    console.log('  robot sales: ' + JSON.stringify(bought.map(x => x.name + ' r' + x.soldR + ' ' + x.got + ' Cr'))); }
}
