// ROBOCUS 2.0: do repair zones add to the game? AI-only games with the real fights.
// node zonesim.js <variant> <games> <seed>   variants: zones | fullrepair | norepair ; env ACTS = repair actions per team per round
const path = require('path'), DL = path.join(__dirname, '../damage-lab');
globalThis.DamageLab = require(DL + '/engine.js'); globalThis.Lineup = require(DL + '/lineup.js');
const L = globalThis.DamageLab, LU = globalThis.Lineup, RP = require('../../src2/repair.js'); LU.usePK();
const [variant = 'zones', games = 20, seed0 = 1] = process.argv.slice(2), ACTS = +(process.env.ACTS || 2);
const byLv = n => Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === n);
const st = { games: 0, rounds: 0, fights: 0, afterLoss: [0, 0], afterWin: [0, 0], favWins: [0, 0], brokenFights: 0, robotFights: 0, repairs: 0, zoneBroken: { drive: 0, weapon: 0, body: 0 } };
for (let g = 0; g < +games; g++) {
  const rng = L.mkRng(+seed0 * 1000 + g), s0 = byLv(0).slice(), s1 = byLv(1).slice(), draw = a => a.splice(Math.floor(rng() * a.length), 1)[0];
  const T = [0, 1, 2, 3].map(t => ({ t, fame: 0, last: null, robots: [draw(s0), draw(s1)].map(n => ({ name: n, level: LU.ROBOTS[n][0], wear: null })) }));
  const spec = r => Object.assign(LU.build(r.name), { wear: r.wear });
  const str = r => RP.strength(spec(r), r.name, r.level);
  let round = 0, freeAct = new Set();
  while (!T.some(t => t.fame >= 5) && round < 30) {
    round++;
    // upkeep
    for (const t of T) for (const r of t.robots) {
      if (variant === 'fullrepair') r.wear = null; else if (r.wear) { const sp = spec(r); RP.bodyHeal(sp); r.wear = sp.wear; }
    }
    if (variant === 'zones') for (const t of T) {
      let acts = ACTS + (freeAct.has(t.t) ? 1 : 0);
      while (acts > 0) { // fix the zone that costs the most strength, on the robot most likely to fight
        let best = null;
        for (const r of t.robots) { if (!r.wear) continue; const sp = spec(r), Z = RP.zones(sp); for (const z of RP.ZONES) if (Z[z.key].damaged) { const v = RP.ZONE_COST[z.key] * (Z[z.key].broken ? 1 : 0.6) + str(r) * 0.01; if (!best || v > best.v) best = { r, k: z.key, v }; } }
        if (!best) break; const sp = spec(best.r); RP.repairZone(sp, best.k); best.r.wear = sp.wear; acts--; st.repairs++;
      }
    }
    freeAct = new Set();
    // two fights: pairs rotate
    const pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][round % 3];
    for (const [a, b] of pairs) {
      const ra = T[a].robots.slice().sort((x, y) => str(y) - str(x))[0], rb = T[b].robots.slice().sort((x, y) => str(y) - str(x))[0];
      const pA = RP.winP(str(ra), str(rb));
      for (const r of [ra, rb]) { st.robotFights++; if (r.wear) { const Z = RP.zones(spec(r)); let any = false; for (const z of RP.ZONES) if (Z[z.key].broken) { st.zoneBroken[z.key]++; any = true; } if (any) st.brokenFights++; } }
      const S = L.run({ a: spec(ra), b: spec(rb), seed: 1 + Math.floor(rng() * 1e6) }, 200), aw = S.result.winner === 0;
      ra.wear = L.wearOf(S.robots[0]); rb.wear = L.wearOf(S.robots[1]);
      for (const [t, won] of [[T[a], aw], [T[b], !aw]]) { if (t.last != null) { const k = t.last ? st.afterWin : st.afterLoss; k[1]++; if (won) k[0]++; } t.last = won; if (won) t.fame++; else freeAct.add(t.t); }
      if (Math.abs(pA - 0.5) > 0.1) { st.favWins[1]++; if ((pA > 0.5) === aw) st.favWins[0]++; }
      st.fights++;
    }
  }
  st.games++; st.rounds += round;
}
const pc = ([a, b]) => b ? Math.round(100 * a / b) + '%' : '-';
console.log(JSON.stringify({ variant, acts: ACTS, games: st.games, rounds: (st.rounds / st.games).toFixed(1), winAfterLoss: pc(st.afterLoss), winAfterWin: pc(st.afterWin), favouriteWins: pc(st.favWins) + ' of ' + st.favWins[1], fightsWithBrokenZone: Math.round(100 * st.brokenFights / st.robotFights) + '%', broken: st.zoneBroken, repairsPerRound: (st.repairs / st.rounds / 4).toFixed(2) }));
