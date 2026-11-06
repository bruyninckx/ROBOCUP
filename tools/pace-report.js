// summary of tools/pace.js runs: node tools/pace-report.js <tag>
const OUTD = process.env.PACE_OUT || require('os').tmpdir() + '/robocus-pace';
const fs = require('fs'), tag = process.argv[2];
const files = fs.readdirSync(OUTD).filter(f => f.startsWith(tag + '_'));
const G = files.flatMap(f => JSON.parse(fs.readFileSync(OUTD + '/' + f)));
const ok = G.filter(g => g.over && !g.stall);
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rounds = ok.map(g => g.round);
console.log(`${tag}: ${G.length} games, ${ok.length} finished, stalls ${G.filter(g => g.stall).length}, errors ${G.reduce((a, g) => a + g.errors.length + g.errs.length, 0)}`);
console.log(`rounds: median ${q(rounds, .5)}, p10 ${q(rounds, .1)}, p90 ${q(rounds, .9)}, mean ${(rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(1)}`);
const hist = {}; rounds.forEach(r => hist[r] = (hist[r] || 0) + 1); console.log('hist', JSON.stringify(hist));
// fame by source per game (sum over teams, positives and negatives)
const src = {}; ok.forEach(g => g.fameBy.forEach(fb => Object.entries(fb).forEach(([k, v]) => { const kk = k.startsWith('card:') ? (v > 0 ? 'cards +' : 'cards -') : k; src[kk] = (src[kk] || 0) + v; })));
console.log('fame per game by source:', Object.entries(src).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([k, v]) => k + ' ' + (v / ok.length).toFixed(1)).join(', '));
const cards = {}; ok.forEach(g => g.fameBy.forEach(fb => Object.entries(fb).forEach(([k, v]) => { if (k.startsWith('card:')) cards[k.slice(5)] = (cards[k.slice(5)] || 0) + v; })));
console.log('top cards (fame/game):', Object.entries(cards).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8).map(([k, v]) => k + ' ' + (v / ok.length).toFixed(2)).join(', '));
// leader after round 4/5 wins?
for (const R of [3, 5]) { let n = 0, w = 0; ok.forEach(g => { const f = g.byR[R + 1] || null; if (!f || g.round <= R) return; const mx = Math.max(...f); const lead = f.indexOf(mx); if (f.filter(x => x === mx).length > 1) return; n++; const win = g.fame.indexOf(Math.max(...g.fame)); if (win === lead) w++; }); console.log(`leader after round ${R} wins: ${(100 * w / Math.max(1, n)).toFixed(0)}% of ${n}`); }
const spread = ok.map(g => { const s = g.fame.slice().sort((a, b) => b - a); return s[0] - s[3]; });
console.log('final fame gap 1st-4th: median', q(spread, .5), '| scrapped per game', (ok.reduce((a, g) => a + g.scrapped, 0) / ok.length).toFixed(1), '| debts', (ok.reduce((a, g) => a + g.debts, 0) / ok.length).toFixed(2));
const fmts = {}; ok.forEach(g => g.fights.forEach(f => fmts[f] = (fmts[f] || 0) + 1)); console.log('fights:', JSON.stringify(fmts), '| robots at end avg', (ok.reduce((a, g) => a + g.robots.reduce((x, y) => x + y, 0), 0) / ok.length / 4).toFixed(2), '| credits at end avg', (ok.reduce((a, g) => a + g.cr.reduce((x, y) => x + y, 0), 0) / ok.length / 4).toFixed(1));
console.log('secs/game', (G.reduce((a, g) => a + g.secs, 0) / G.length).toFixed(1));
{ const M = ok.filter(g => g.markets); if (M.length) {
  const early = [], late = []; M.forEach(g => g.markets.forEach((m, i) => (i < 5 ? early : late).push(m)));
  const f = a => a.length ? `robots/market ${(a.reduce((x, m) => x + m.robots, 0) / a.length).toFixed(2)}, none ${(100 * a.filter(m => !m.robots).length / a.length).toFixed(0)}%, sold ${(100 * a.reduce((x, m) => x + m.sold, 0) / Math.max(1, a.reduce((x, m) => x + m.robots, 0))).toFixed(0)}%` : '-';
  console.log('market R1-5:', f(early), '| R6+:', f(late));
  let one = 0, tot = 0; M.forEach(g => Object.values(g.robR || {}).forEach(rs => rs.forEach(n => { tot++; if (n <= 1) one++; })));
  console.log('team-rounds with only 1 robot:', (100 * one / Math.max(1, tot)).toFixed(0) + '%');
} }
