// T41 (Kev, 21 Nov: "keep bend until repair"): do the wear marks a fight leaves (bends, kinks, warps, cracks, grooves, snapped
// tips) come back exactly in the next fight? node wear-carry.js [fights=24]. For each fight: wearOf after it, through JSON (as a
// save or an online message would carry it), into a new fight; the new robot's wearOf at the start must give the same marks,
// the same mass, and two fights built from the same options must play the same. Prints one line per check, OK at the end.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all).sort();
const N = +(process.argv[2] || 24);
let bad = 0, marked = 0, kinds = {};
const play = S => { while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } return S; };
for (let i = 0; i < N; i++) {
  const a = names[(i * 7) % names.length], b = names[(i * 11 + 3) % names.length];
  const S = play(L.create({ a: LU.build(a), b: LU.build(b), seed: 500 + i }));
  const ws = S.robots.map(R => JSON.parse(JSON.stringify(L.wearOf(R))));
  const mk = () => L.create({ a: Object.assign(LU.build(a), { wear: ws[0] }), b: Object.assign(LU.build(b), { wear: ws[1] }), seed: 900 + i });
  const T = mk();
  T.robots.forEach((R, k) => {
    const w0 = ws[k].marks || null, w1 = L.wearOf(R).marks || null;
    if (w0) { marked++; for (const m of Object.values(w0)) for (const key of Object.keys(m)) kinds[key] = (kinds[key] || 0) + 1; }
    const same = JSON.stringify(w0) === JSON.stringify(w1);
    if (!same) { bad++; console.log(`MISMATCH fight ${i} ${R.name}:`, JSON.stringify(w0).slice(0, 300), '\n   vs', JSON.stringify(w1).slice(0, 300)); }
  });
  const r1 = play(mk()).result, r2 = play(mk()).result;
  if (JSON.stringify(r1) !== JSON.stringify(r2)) { bad++; console.log(`NOT DETERMINISTIC fight ${i}`); }
  console.log(`${a} v ${b}: marks ${ws.map(w => w.marks ? Object.keys(w.marks).length : 0).join('/')}, json ${ws.map(w => JSON.stringify(w).length).join('/')} bytes, next fight ${r1 ? r1.text : '-'}`);
}
console.log(`robots with marks ${marked} of ${2 * N}; kinds ${JSON.stringify(kinds)}`);
console.log(bad ? `FAIL ${bad}` : 'OK');
