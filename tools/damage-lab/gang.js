// ROBOCUS 2.0 gang test (Kev, 11 Nov): how many starters does it take to beat one stacked robot?
// node gang.js '<boss name>' '<parts json>' arena Nlist fights [pick] [lane nlanes]  -> one JSON line per N
// pick = 'mix' (the 9 starters shuffled by seed, no repeats until all are in) or a starter name (all the same)
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const [boss, partsJ, arena, Ns, F, pick = 'mix'] = process.argv.slice(2), parts = JSON.parse(partsJ);
const ST = Object.keys(LU.ROBOTS).filter(n => LU.ROBOTS[n][0] === 0);
const shuffle = (seed, n) => { const r = L.mkRng(seed), deck = []; while (deck.length < n) { const d = ST.slice(); for (let k = d.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [d[k], d[j]] = [d[j], d[k]]; } deck.push(...d); } return deck.slice(0, n); };
for (const N of Ns.split(',').map(Number)) {
  let bw = 0, gko = 0, bko = 0, judges = 0, surv = 0, bossHp = 0; const T = [], who = {};
  for (let f = 0; f < +F; f++) { const seed = (+process.env.SEED0 || 52000) + N * 1000 + f, gang = pick === 'mix' ? shuffle(seed, N) : Array(N).fill(pick);
    const S = L.create({ mode: 'gang', robots: [LU.build(boss, parts)].concat(gang.map(g => LU.build(g))), seed, arena, timeLimit: 180 });
    while (!S.over && S.t < 260) { L.step(S); S.fx.length = 0; }
    const won = S.result.winTeam === 1; if (won) { bw++; if (S.result.how === 'KO') bko++; } else if (S.result.how === 'KO') gko++; if (S.result.how !== 'KO') judges++;
    surv += S.robots.filter(R => R.id && R.alive).length; T.push(S.t);
    for (const R of S.robots) if (R.id) { const k = R.spec.preset; who[k] = who[k] || [0, 0]; who[k][0]++; if (R.koBy === S.robots[0]) who[k][1]++; } }
  T.sort((a, b) => a - b);
  console.log(JSON.stringify({ boss, parts, arena, pick, N, fights: +F, bossWin: Math.round(100 * bw / F), bossKO: bko, gangKO: gko, judges, gangLeft: +(surv / F).toFixed(2), medianT: Math.round(T[T.length >> 1]) }));
}
