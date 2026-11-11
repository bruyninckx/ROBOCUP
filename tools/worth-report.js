// ROBOCUS 2.0 (Kev, 11 Nov): node tools/worth-report.js <tag> [<tag> ...]   (game-sim runs of normal AI games)
// What is fame worth in credits? For every round of every game: the four teams' fame, credits, robots and cards in hand at the
// start of the round, and who won in the end. A 4-way logit (the winner is one of the four) gives the weight of each;
// fame weight / credit weight = credits one fame is worth for winning the game. Then the cards: how often each is played or cashed.
const fs = require('fs'), tags = process.argv.slice(2);
const G = tags.flatMap(t => JSON.parse(fs.readFileSync('sims/' + t + '.json')).res.filter(g => g.over && g.ups));
const K = ['fame', 'cr', 'robots', 'hand'], pad = (s, n) => String(s).padEnd(n);
function fit(rows) {
  const w = [0, 0, 0, 0];
  for (let it = 0; it < 12000; it++) { const g = [0, 0, 0, 0];
    for (const r of rows) { const z = r.x.map(x => x.reduce((a, v, k) => a + v * w[k], 0)), m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) g[k] += ((i === r.win ? 1 : 0) - e[i] / s) * r.x[i][k] / rows.length; }
    for (let k = 0; k < 4; k++) w[k] += (k === 1 ? 0.004 : 0.2) * g[k]; }
  return w;
}
console.log(G.length + ' games (' + tags.join(', ') + ')\n\n1. WHAT WINS THE GAME  (by the fame of the leader at the start of a round; weights per unit; "1 fame =" is the fame weight in credits)');
console.log(pad('leader at', 10) + pad('fame', 8) + pad('1 credit', 10) + pad('1 robot', 9) + pad('1 card', 8) + pad('1 fame =', 12) + pad('1 robot =', 11) + '1 card =');
for (const [lab, lo, hi] of [['0-3', 0, 3], ['4-6', 4, 6], ['7-9', 7, 9], ['10-11', 10, 11], ['all', 0, 99]]) {
  const rows = []; for (const g of G) for (const r in g.ups) if (+r >= 2 && Math.max(...g.ups[r].fame) >= lo && Math.max(...g.ups[r].fame) <= hi) { const u = g.ups[r]; rows.push({ win: g.winner, x: [0, 1, 2, 3].map(i => K.map(k => u[k][i])) }); }
  const w = fit(rows); console.log(pad(lab, 10) + pad(w[0].toFixed(2), 8) + pad(w[1].toFixed(3), 10) + pad(w[2].toFixed(2), 9) + pad(w[3].toFixed(2), 8) + pad((w[0] / w[1]).toFixed(1) + ' Cr', 12) + pad((w[2] / w[1]).toFixed(1) + ' Cr', 11) + (w[3] / w[1]).toFixed(1) + ' Cr'); }
// 2. cards
const C = {}; for (const g of G) for (const id in g.cstat) { const s = g.cstat[id], c = (g.cash || {})[id] || {}, o = C[id] = C[id] || { name: c.name || id, cash: c.cash, fam: c.fam, drawn: 0, played: 0, landed: 0, blocked: 0, cashed: 0, selfCr: 0, selfFame: 0, otherCr: 0, otherFame: 0 }; for (const k of ['drawn', 'played', 'landed', 'blocked', 'cashed', 'selfCr', 'selfFame', 'otherCr', 'otherFame']) o[k] += s[k] || 0; }
const FW = +process.env.FAME || 6;
console.log('\n2. CARDS  (per play: what the player and the others gained; "worth" = own credits + own fame x ' + FW + ' Cr - half of what the others gained, against the cash-in value)');
console.log(pad('card', 26) + pad('family', 14) + pad('drawn/g', 9) + pad('played', 8) + pad('cashed', 8) + pad('blocked', 9) + pad('own Cr', 8) + pad('own fame', 10) + pad('others Cr', 11) + pad('others fame', 13) + pad('worth', 7) + 'cash');
Object.values(C).filter(o => o.drawn >= G.length * 0.05).map(o => { const n = Math.max(1, o.played); o.w = (o.selfCr + FW * o.selfFame - 0.5 * (o.otherCr + FW * o.otherFame)) / n; return o; }).sort((a, b) => b.w - a.w)
  .forEach(o => { const n = Math.max(1, o.played), pc = x => Math.round(100 * x / Math.max(1, o.drawn)) + '%'; console.log(pad(o.name, 26) + pad(o.fam || '', 14) + pad((o.drawn / G.length).toFixed(2), 9) + pad(pc(o.played), 8) + pad(pc(o.cashed), 8) + pad(o.played ? Math.round(100 * o.blocked / o.played) + '%' : '-', 9) + pad((o.selfCr / n).toFixed(1), 8) + pad((o.selfFame / n).toFixed(2), 10) + pad((o.otherCr / n).toFixed(1), 11) + pad((o.otherFame / n).toFixed(2), 13) + pad(o.played >= 5 ? o.w.toFixed(1) : '-', 7) + (o.cash != null ? o.cash : '')); });
