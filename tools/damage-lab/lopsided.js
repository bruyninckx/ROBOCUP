// T72: Buzzkill's lopsided half bar: how much it shakes and drifts the robot while it spins, with nothing to hit.
// node lopsided.js [seconds=6]: Buzzkill (full bar, then the lopsided bar: spec.flyoffGone) alone in the open floor, the other robot
// parked in a far corner (asleep). The robot is told to stand still and spin. Prints: blade speed, the jiggle (mean speed of the body
// about its own 0.25 s average), how far the hub wanders (max distance from the start) and the net drift after the time.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const T = +(process.argv[2] || 6);
for (const gone of [false, true]) {
  const me = Object.assign(LU.build('Buzzkill'), gone ? { flyoffGone: true } : { flyoffKeep: true });
  const S = L.create({ a: me, b: LU.build('Brawler'), seed: 7, arena: 'open', flyoff: false, countdown: 0 });
  const R = S.robots[0], E = S.robots[1];
  E.body.setTransform({ x: 3.4, y: 3.4 }, 0); E.body.setType('static'); E.alive = false; // asleep: Buzzkill has nobody to drive at, so it stands and spins
  const p0 = R.body.getPosition(), x0 = p0.x, y0 = p0.y; let maxD = 0, jig = 0, n = 0, wS = 0; const hist = [];
  for (let k = 0; k < T * 120; k++) {
    L.step(S); S.fx.length = 0;
    const p = R.body.getPosition(), v = R.body.getLinearVelocity(); hist.push([v.x, v.y]); if (hist.length > 30) hist.shift();
    const mx = hist.reduce((a, h) => a + h[0], 0) / hist.length, my = hist.reduce((a, h) => a + h[1], 0) / hist.length;
    if (k > 240) { jig += Math.hypot(v.x - mx, v.y - my); n++; wS += R.bladeW; }
    maxD = Math.max(maxD, Math.hypot(p.x - x0, p.y - y0));
  }
  const p = R.body.getPosition();
  console.log(`${gone ? 'lopsided half bar' : 'full bar        '}: blade ${(wS / n).toFixed(0)} rad/s, jiggle ${(jig / n * 100).toFixed(1)} cm/s, hub wanders up to ${(maxD * 100).toFixed(0)} cm, net drift ${(Math.hypot(p.x - x0, p.y - y0) * 100).toFixed(0)} cm in ${T} s`);
}
