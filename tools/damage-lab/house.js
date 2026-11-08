// node house.js [fights] : the House Robot ("Big Mallet") in duels. Same seeds with and without it.
// Measures: mallet hit rate per swing, damage per hit, share of time other robots spend within 1.5 m of it,
// and how it moves the duel (favourite's win %, fight length, judges). Env: SEED0 (default 20001), FFA=1 adds 3-team free-for-alls.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const N = +process.argv[2] || 60, SEED0 = +process.env.SEED0 || 20001, HOUSE = 'Big Mallet';
const names = Object.keys(LU.ROBOTS).filter(n => LU.ROBOTS[n][0] >= 1), rng = L.mkRng(SEED0);
const pick = () => names[Math.floor(rng() * names.length)];
const strong = n => LU.ROBOTS[n][0] * 0.62 + Math.log(LU.ROBOTS[n][1]) * 0.6;
const st = { swings: 0, hits: 0, dmg: [], near: 0, nearN: 0, fav: [0, 0], favH: [0, 0], T: [], TH: [], jd: 0, jdH: 0, houseWin: 0, houseKO: 0, flips: 0, hitBy: {}, lids: 0, sameWinner: 0 };
function watch(S) {
  const H = S.house; let last = null, wasDown = false;
  while (!S.over && S.t < 200) {
    L.step(S); S.fx.length = 0;
    if (!H) continue;
    const ls = H.l4.lastSlam; if (ls && ls !== last) { last = ls; st.swings++; if (ls.hit) { st.hits++; st.dmg.push(H.stats.dealt - ls.dealt0); } }
    const down = H.flipped || H.stun > 0; if (down && !wasDown) st.flips++; wasDown = down;
    if (S.step % 12 === 0 && H.alive) { const hp = H.body.getPosition(); for (const R of S.robots) if (R !== H && R.alive) { const p = R.body.getPosition(); st.nearN++; if (Math.hypot(p.x - hp.x, p.y - hp.y) < 1.5) st.near++; } }
  }
  if (H) { if (!H.alive) st.houseKO++; st.lids += S.robots.filter(R => R !== H && R.stats.lost.some(l => l.label === 'Top plate' && l.by === H.name)).length; }
  return S;
}
for (let k = 0; k < N; k++) {
  const seed = SEED0 + k; let a = pick(), b = pick(); while (b === a) b = pick();
  const A = Object.assign(LU.build(a), { name: a }), B = Object.assign(LU.build(b), { name: b + (a === b ? ' II' : '') });
  const fav = strong(a) >= strong(b) ? 0 : 1;
  const S0 = watch(L.create({ a: A, b: B, seed })), w0 = S0.result.winner;
  const S1 = watch(L.create({ mode: 'ffa', robots: [A, B, Object.assign(LU.build(HOUSE), { name: 'Big Mallet' })], seed }));
  const w1 = S1.result.winner;
  st.fav[1]++; if (w0 === fav) st.fav[0]++;
  if (w1 === 2) st.houseWin++; else { st.favH[1]++; if (w1 === fav) st.favH[0]++; if (w1 === w0) st.sameWinner++; }
  st.T.push(S0.t); st.TH.push(S1.t); if (S0.result.how !== 'KO') st.jd++; if (S1.result.how !== 'KO') st.jdH++;
}
if (process.env.FFA) for (let k = 0; k < Math.ceil(N / 3); k++) {
  const seed = SEED0 + 5000 + k, rs = [pick(), pick(), pick()].map((n, i) => Object.assign(LU.build(n), { name: n + ' ' + i }));
  watch(L.create({ mode: 'ffa', robots: rs.concat([Object.assign(LU.build(HOUSE), { name: 'Big Mallet' })]), seed }));
}
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], pc = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
console.log(`House Robot (${HOUSE}), ${N} duels on the same seeds with and without it${process.env.FFA ? ` (+ ${Math.ceil(N / 3)} 3-team free-for-alls for the mallet numbers)` : ''}`);
console.log(`mallet: ${st.swings} swings, ${st.hits} hits = ${pc(st.hits, st.swings)} per swing (target 8-12%), ${(st.swings / (st.TH.reduce((x, y) => x + y, 0) / 60)).toFixed(1)} swings per fight-minute`);
console.log(`damage per hit: mean ${st.dmg.length ? Math.round(st.dmg.reduce((x, y) => x + y, 0) / st.dmg.length) : '-'}, median ${st.dmg.length ? Math.round(med(st.dmg)) : '-'}; lids knocked off by it ${st.lids}`);
console.log(`time other robots spend within 1.5 m of it: ${pc(st.near, st.nearN)} (target < 20%)`);
console.log(`it was flipped or stunned ${st.flips} times, KO'd ${st.houseKO} times; it outlasted every team ${st.houseWin} times`);
console.log(`favourite (higher level/grade) wins: ${pc(st.fav[0], st.fav[1])} without, ${pc(st.favH[0], st.favH[1])} with it; same winner on the same seed ${pc(st.sameWinner, st.favH[1])}`);
console.log(`median fight ${Math.round(med(st.T))} s without, ${Math.round(med(st.TH))} s with; judges ${pc(st.jd, N)} without, ${pc(st.jdH, N)} with`);
if (process.env.OUT) require('fs').writeFileSync(process.env.OUT, JSON.stringify(st));
