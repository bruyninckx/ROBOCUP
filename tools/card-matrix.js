// Market robot cards: every card vs every card and vs the 9 starters.
// node tools/card-matrix.js src/sim.js <fights per pair> <engineers> <overrides.json or -> <out.json>; then node tools/card-matrix-report.js <out.json> [m]
// node run.js <simPath> <N> <eng> <overrides.json|-> <out.json>  : cards v cards and cards v starters
const fs = require('fs'), S = require(require('path').resolve(process.argv[2] || 'src/sim.js'));
const N = +process.argv[3] || 100, ENG = +process.argv[4], OV = process.argv[5] && process.argv[5] !== '-' ? JSON.parse(fs.readFileSync(process.argv[5])) : {}, OUT = process.argv[6];
const src = fs.readFileSync(require('path').join(__dirname, '../prototypes/tabletop-prototype.html'), 'utf8');
const a = src.indexOf('const STARTERS'), e = src.indexOf('};', a);
const L = (hp, armor, speed, turret, fp, acc, bullet) => ({ hp, armor, speed, turret, fp, acc, bullet });
const ST = eval('(' + src.slice(src.indexOf('{', a), e + 1) + ')');
const cards = {}; for (const [n, b] of Object.entries(S.ROBOT_CARDS)) if (n !== 'Scrap Bot') { const c = JSON.parse(JSON.stringify(b)); if (OV[n]) { Object.assign(c, OV[n]); if (OV[n].lv) c.lv = Object.assign({}, b.lv, OV[n].lv); } c.eng = ENG; c.helpers = c.helpers || []; cards[n] = c; }
const starters = {}; for (const [n, x] of Object.entries(ST)) starters[n] = Object.assign(JSON.parse(JSON.stringify(x.b)), { eng: 1 });
const duel = (A, B, n, salt) => { let w = 0; for (let s = 0; s < n; s++) { const sw = s % 2, bs = sw ? [B, A] : [A, B]; const X = S.newBattle(bs.map(q => JSON.parse(JSON.stringify(q))), 1000 + s * 7919 + salt * 31); let i = 0; while (!X.over && i < 9000) { S.step(X, 1 / 30); i++; } if (X.winner < 0) w += 0.5; else if (X.winner === (sw ? 1 : 0)) w++; } return w / n; };
const names = Object.keys(cards), res = { cc: {}, cs: {} };
names.forEach((x, i) => names.forEach((y, j) => { if (j > i) { const p = duel(cards[x], cards[y], N, i * 50 + j); res.cc[x + '|' + y] = p; res.cc[y + '|' + x] = 1 - p; } }));
if (!process.env.NOSTART) names.forEach((x, i) => Object.keys(starters).forEach((y, j) => { res.cs[x + '|' + y] = duel(cards[x], starters[y], N, 999 + i * 50 + j); }));
fs.writeFileSync(OUT, JSON.stringify(res));
