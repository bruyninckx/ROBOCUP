// Card-by-card report from tools/game-sim.js runs: node tools/card-report.js <tag> [tag2 ...] [--csv out.csv]
// For each card (all runs pooled): copies seen per game, how often it is played / lands / is cashed, what a landed
// play does (fame and credits for the player, fame for the others), and the win share of teams that played it
// (25% = no effect; read it with care: a card that is played by teams that are already winning looks strong).
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), csvAt = args.indexOf('--csv'), csv = csvAt >= 0 ? args[csvAt + 1] : null;
const tags = args.filter((x, i) => !x.startsWith('--') && (csvAt < 0 || i !== csvAt + 1));
const games = tags.flatMap(t => JSON.parse(fs.readFileSync(path.join('sims', t + '.json'))).res).filter(r => r.over && !r.stall && !r.crash);
const n = games.length, C = {};
for (const g of games) for (const [id, s] of Object.entries(g.cstat || {})) {
  const m = g.cash[id]; if (!m) continue;
  const c = C[id] = C[id] || { id, name: m.name, fam: m.fam, auction: m.auction, live: m.live, drawn: 0, played: 0, landed: 0, blocked: 0, cashed: 0, selfFame: 0, otherFame: 0, selfCr: 0, otherCr: 0, plTeams: 0, plWins: 0, games: 0 };
  for (const k of ['drawn', 'played', 'landed', 'blocked', 'cashed', 'selfFame', 'otherFame', 'selfCr', 'otherCr']) c[k] += s[k] || 0;
  c.games++;
  (s.playedBy || []).forEach((v, ti) => { if (v > 0) { c.plTeams++; if (g.winner === ti) c.plWins++; } });
}
const f1 = x => isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1) : '-', pc = x => isFinite(x) ? Math.round(x * 100) + '%' : '-';
const rows = Object.values(C).map(c => ({
  card: c.name, fam: c.auction ? 'Auction' : c.fam,
  'seen/g': f1(c.drawn / n), 'played/g': f1(c.played / n), 'play%': pc(c.played / c.drawn), 'cash%': pc(c.cashed / c.drawn),
  'lands': pc(c.landed / c.played), 'fame+/land': f1(c.selfFame / c.landed), 'rivals fame/land': f1(c.otherFame / c.landed), 'Cr/land': f1(c.selfCr / c.landed),
  'win% of players': c.plTeams >= 20 ? pc(c.plWins / c.plTeams) : '(few)', _p: c.played / n
})).sort((a, b) => a.fam.localeCompare(b.fam) || b._p - a._p);
const cols = Object.keys(rows[0]).filter(k => k[0] !== '_'), w = cols.map(k => Math.max(k.length, ...rows.map(r => String(r[k]).length)) + 2);
console.log(n + ' games: ' + tags.join(', '));
console.log(cols.map((k, i) => k.padEnd(w[i])).join(''));
for (const r of rows) console.log(cols.map((k, i) => String(r[k]).padEnd(w[i])).join(''));
if (csv) fs.writeFileSync(csv, cols.join(',') + '\n' + rows.map(r => cols.map(k => JSON.stringify(String(r[k]))).join(',')).join('\n'));
