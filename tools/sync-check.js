// ROBOCUS 2.0 sync check (9 Nov): do two browsers play the same fight bit for bit?
// Online play can either stream fights from the host, or let every browser run the fight itself from the seed (much less
// network, the 1.0 way). The second only works if the physics comes out identical on every browser.
// This runs a fixed set of fights and prints a code per fight; open prototypes/sync-check.html in two browsers and compare.
// Node: node tools/sync-check.js   (needs planck: see docs/robocus-2.0-sim.md)
(function (root) {
  'use strict';
  // FNV-1a over the bits of doubles: any last-digit difference changes the code
  function hasher() {
    let h = 0x811c9dc5 >>> 0;
    const f = new Float64Array(1), u = new Uint32Array(f.buffer);
    const add32 = x => { for (let k = 0; k < 4; k++) { h ^= (x >>> (k * 8)) & 255; h = Math.imul(h, 16777619) >>> 0; } };
    return { num(x) { f[0] = x; add32(u[0]); add32(u[1]); }, int(x) { add32(x | 0); }, get hex() { return ('0000000' + h.toString(16)).slice(-8); } };
  }
  // the Math functions the engine uses: browsers may round these differently in the last bit
  function mathCode() {
    const H = hasher();
    for (let i = 1; i <= 2000; i++) {
      const x = i * 0.0137 - 9.3, y = i * 0.0071 + 0.2;
      H.num(Math.sin(x)); H.num(Math.cos(x)); H.num(Math.atan2(x, y)); H.num(Math.hypot(x, y)); H.num(Math.exp(x * 0.3));
      H.num(Math.pow(y, 1.7)); H.num(Math.sqrt(y)); H.num(Math.tan(x * 0.1)); H.num(Math.log(y)); H.num(Math.asin(Math.sin(x)));
    }
    return H.hex;
  }
  // the fights: duels across the levels (some with parts), level 4, 2v2, free-for-all, the House Robot, and live cards
  function fights(LU) {
    const N = Object.keys(LU.ROBOTS), N4 = Object.keys(LU.ROBOTS4 || {}), P = Object.keys(LU.PARTS);
    const out = [];
    for (let i = 0; i < 10; i++) out.push({ kind: 'duel', a: [N[(i * 7) % N.length], i % 3 ? [] : [P[i % P.length]]], b: [N[(i * 11 + 3) % N.length], i % 4 ? [] : [P[(i * 5 + 2) % P.length]]], seed: 101 + i });
    for (let i = 0; i < 4 && N4.length; i++) out.push({ kind: 'level 4', a: [N4[i % N4.length], []], b: [N[(i * 5 + 15) % N.length], [P[(i * 3) % P.length]]], seed: 201 + i });
    for (let i = 0; i < 3; i++) out.push({ kind: '2v2', list: [0, 1, 2, 3].map(k => [N[(i * 4 + k * 6 + 1) % N.length], []]), seed: 301 + i });
    for (let i = 0; i < 2; i++) out.push({ kind: 'ffa', list: [0, 1, 2, 3].map(k => [N[(i * 9 + k * 5 + 2) % N.length], []]), seed: 401 + i });
    out.push({ kind: 'house', list: [[N[3], []], [N[12], []], [N[20], []]], house: true, seed: 501 });
    const cards = ['spikes', 'emp', 'hammer', 'magnet', 'oil', 'field_eng'];
    for (let i = 0; i < 3; i++) out.push({ kind: 'live cards', a: [N[(i * 3 + 9) % N.length], []], b: [N[(i * 3 + 10) % N.length], []], seed: 601 + i, cards: [cards[i * 2], cards[i * 2 + 1]] });
    return out;
  }
  function runOne(DL, LU, F) {
    const sp = ([n, parts]) => LU.build(n, parts);
    let S;
    if (F.list) {
      const list = F.list.map((r, k) => Object.assign(sp(r), { team: F.kind === '2v2' ? k % 2 : k }));
      if (F.house) list.push(Object.assign(LU.build('Big Mallet'), { name: 'Big Mallet', level: 0, teamName: 'House', team: 9 }));
      S = DL.create({ mode: F.kind === '2v2' ? '2v2' : 'ffa', robots: list, seed: F.seed });
    } else S = DL.create({ a: sp(F.a), b: sp(F.b), seed: F.seed });
    const H = hasher();
    while (!S.over && S.t < 200) {
      if (F.cards && (S.step === 600 || S.step === 1500)) {
        const t = F.cards[S.step === 600 ? 0 : 1], L0 = DL.LIVE[t], B = S.robots[1], p = B.body.getPosition();
        DL.command(S, L0.target === 'arena' ? { type: t, x: p.x, y: p.y } : { type: t, robot: L0.own ? 0 : 1 });
      }
      DL.step(S);
      if (S.step % 120 === 0) for (const R of S.robots) { const p = R.body.getPosition(); H.num(p.x); H.num(p.y); H.num(R.body.getAngle()); H.num(R.chassis.hp); }
    }
    H.int(S.step); H.int(S.result && S.result.winner != null ? S.result.winner : -9);
    return { code: H.hex, steps: S.step, secs: Math.round(S.t * 10) / 10 };
  }
  function run(DL, LU, onEach) {
    if (LU.usePK) LU.usePK();
    const list = fights(LU), res = [], all = hasher();
    list.forEach((F, i) => { const r = runOne(DL, LU, F); r.kind = F.kind; res.push(r); for (const c of r.code) all.int(c.charCodeAt(0)); if (onEach) onEach(i, list.length, r); });
    return { math: mathCode(), total: all.hex, fights: res };
  }
  const API = { run, mathCode };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
    if (require.main === module) {
      const DL = require('./damage-lab/engine.js'), LU = require('./damage-lab/lineup.js');
      const r = run(DL, LU, (i, n, x) => process.stdout.write(`${String(i + 1).padStart(2)}/${n} ${x.kind.padEnd(10)} ${x.code}  (${x.secs} s)\n`));
      console.log('math code ' + r.math + '\nTOTAL CODE ' + r.total);
    }
  } else root.SyncCheck = API;
})(typeof window !== 'undefined' ? window : globalThis);
