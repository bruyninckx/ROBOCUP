// ROBOCUS Damage Lab engine (beta sandbox). Top-down rigid-body sim on planck.js (Box2D port).
// Robots are built from parts: every part has its own HP; outer parts are physics fixtures that tear off
// and become debris, inner parts (battery, motors, radio, weapon motor) are hit through the hull.
// Deterministic: fixed 120 Hz step and the seeded RNG only (no Math.random in here).
(function (root) {
  'use strict';
  const pl = root.planck || (typeof require !== 'undefined' ? require('planck') : null);
  const V = (x, y) => pl.Vec2(x, y);
  // tuning knobs: dmg = global damage scale, other keys = damage multiplier per cause (weapon key)
  const TUNE = { dmg: 0.68, spinner: 1.15, drum: 0.62, flipper: 1.6, hammer: 0.75, crusher: 1.5, medium: 0.8, flame: 0.72, glove: 0.85, spear: 0.9, flail: 1.25 };
  const NOKNOB = { ram: 1, wall: 1, spikes: 1, floorsaw: 1, debris: 1, impact: 1, spikeplate: 1, ceiling: 1, piston: 1 };
  // arcade knobs: knock = extra knockback from weapon hits, fly = how far torn-off parts fly
  const ARC = { knock: 1, fly: 2, events: true, crates: true };
  const DT = 1 / 120, G = 9.8, HALF = 4; // arena is 8 x 8 m, centred on 0,0
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  function mkRng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- Parts catalogue ----------
  const CHASSIS = {
    light: { hl: 0.34, hw: 0.27, mass: 26, hp: 160, force: 330, vmax: 5.0, label: 'Light' },
    medium: { hl: 0.40, hw: 0.31, mass: 38, hp: 220, force: 450, vmax: 4.4, label: 'Medium' },
    heavy: { hl: 0.46, hw: 0.36, mass: 54, hp: 290, force: 600, vmax: 3.8, label: 'Heavy' },
  };
  const DRIVES = { '2wd': { label: '2 wheels (nimble)' }, '4wd': { label: '4 wheels (grip)' } };
  const MOTORS = { std: { label: 'Standard', f: 1, heat: 1, mass: 0 }, hot: { label: 'Hot-wound (+35%)', f: 1.35, heat: 1.9, mass: 3 } };
  const BATTERIES = { std: { label: 'Standard', hp: 50, mass: 6, p: 1 }, big: { label: 'Big (tough, heavy)', hp: 80, mass: 10, p: 1.08 } };
  // cat: spin (physical bar), front (front-mounted tool), top (overhead / turret, can't work upside down)
  const WEAPONS = {
    spinner: { label: 'Bar spinner', cat: 'spin', mass: 14, invert: true, d: 'A steel bar on a motor. Takes time to spin up, then every hit is pure kinetic energy. Hits push it back too.' },
    drum: { label: 'Drum', cat: 'front', mass: 12, invert: true, d: 'Spinning drum on the nose: kicks robots into the air.' },
    flipper: { label: 'Flipper', cat: 'front', mass: 10, invert: true, d: 'Gas-powered plate (12 shots of gas): throws robots, flips them over. Can self-right.' },
    hammer: { label: 'Axe hammer', cat: 'top', mass: 11, invert: false, d: 'Overhead axe: slow, hits from above, goes through the top armour. Can self-right.' },
    crusher: { label: 'Crusher', cat: 'front', mass: 12, invert: false, d: 'Hydraulic jaws: grabs, crushes through armour and drags the victim around.' },
    wedge: { label: 'Wedge (rammer)', cat: 'front', mass: 10, invert: true, d: 'Low steel wedge and strong motors: gets under robots and shoves them into hazards.' },
    glove: { label: 'Boxing glove', cat: 'front', mass: 11, invert: true, d: 'Spring-loaded glove on a scissor arm: one punch sends a robot across the arena.' },
    spear: { label: 'Spear', cat: 'front', mass: 9, invert: true, d: 'Long steel lance: lines up, dashes in and skewers straight through armour. Can snap off.' },
    flail: { label: 'Flail', cat: 'spin', mass: 15, invert: true, d: 'Spiked ball on a chain, swung round on a motor arm: wild, heavy hits from every side.' },
    rapid: { label: 'Rapid gun', cat: 'top', mass: 7, invert: false, gun: { rate: 8, dmg: 2.4, speed: 26, spread: 0.07, range: 3.2, r: 0.025 }, d: 'Bullet hose. Armour shrugs most of it off.' },
    medium: { label: 'Medium gun', cat: 'top', mass: 8, invert: false, gun: { rate: 2, dmg: 8, speed: 22, spread: 0.035, range: 3.6, r: 0.035 }, d: 'All-rounder.' },
    heavy: { label: 'Heavy cannon', cat: 'top', mass: 11, invert: false, gun: { rate: 0.5, dmg: 28, speed: 16, spread: 0.02, range: 3.6, r: 0.06, kick: 30 }, d: 'Slow shells, punch through plating, knock robots back.' },
    laser: { label: 'Laser', cat: 'top', mass: 6, invert: false, d: 'Continuous beam, burns a hole in whatever it hits and heats it up.' },
    mortar: { label: 'Mortar', cat: 'top', mass: 9, invert: false, d: 'Lobbed shells, blast hits everything nearby from above. Not up close.' },
    saw: { label: 'Saw launcher', cat: 'top', mass: 8, invert: false, d: 'Fires saw discs that bounce around the arena.' },
    flame: { label: 'Flamethrower', cat: 'top', mass: 7, invert: false, invertDrive: true, d: 'Short cone of fire: heats parts until they cook. Batteries can catch fire.' },
  };
  const ARENAS = {
    open: { label: 'Open floor', pit: false, saws: [], spikes: false },
    pit: { label: 'Centre pit', pit: true, saws: [], spikes: false },
    saws: { label: 'Floor saws', pit: false, saws: [[-1.7, -1.7], [1.7, 1.7], [-1.7, 1.7], [1.7, -1.7]], spikes: false },
    killbox: { label: 'Killbox (pit, saws, spiked walls)', pit: true, saws: [[0, -2.5], [0, 2.5]], spikes: true },
  };
  const PIT = 0.65; // half size of the centre pit
  // bumpers: the material of the armour plates. blunt / sharp = damage taken from blunt / sharp hits
  const BUMPERS = {
    steel: { label: 'Steel plate', hpK: 1, thrK: 1, massK: 1, rest: 0.2, blunt: 1, sharpK: 1, d: 'Tough and heavy, dents but holds.' },
    rubber: { label: 'Rubber bumper', hpK: 1.15, thrK: 0.3, massK: 0.7, rest: 0.75, blunt: 0.35, sharpK: 1.5, d: 'Soaks rams, punches and drums, bounces, but blades cut right through.' },
    spring: { label: 'Spring bumper', hpK: 0.9, thrK: 0.6, massK: 0.9, rest: 0.95, blunt: 0.7, sharpK: 1.1, d: 'Throws whatever hits it back across the arena.' },
    spiked: { label: 'Spiked plate', hpK: 0.9, thrK: 1, massK: 1.2, rest: 0.2, blunt: 1, sharpK: 1, d: 'Whoever rams it gets hurt.' },
    fibre: { label: 'Fibreglass shell', hpK: 0.55, thrK: 0.5, massK: 0.35, rest: 0.3, blunt: 1.2, sharpK: 1.2, d: 'Very light (faster robot), shatters in a shower of shards.' },
  };
  const SHARP = { spinner: 1, saw: 1, spear: 1, spikes: 1, floorsaw: 1, flame: 1, laser: 1, crusher: 1, flail: 1 };
  const frontTool = w => WEAPONS[w].cat === 'front' || w === 'spinner';
  const CALL = { spinner: 'SHREDDED!', flail: 'WRECKED!', glove: 'KAPOW!', spear: 'SKEWERED!', hammer: 'BONK!', drum: 'LAUNCHED!', crusher: 'CRUNCH!', slam: 'INTO THE WALL!', spikeplate: 'OUCH!', heavy: 'BOOM!', mortar: 'BOOM!', ceiling: 'FLATTENED!', saw: 'SLICED!' };
  function callout(S, text, x, y, big) { if (!big && S.t - (S.lastCall == null ? -9 : S.lastCall) < 0.7) return; S.lastCall = S.t; S.fx.push({ type: 'callout', text, x, y, big: !!big }); }

  // The 10 market robots: balanced together for the arcade rules (8 Nov, 80 fights per matchup over open floor + centre pit, see docs/damage-lab.md).
  // The rest are test builds, not balanced.
  const PRESETS = {
    Buzzkill: { weapon: 'spinner', chassis: 'medium', drive: '4wd', motor: 'hot', battery: 'std', bumper: 'spiked', armour: { front: 0, side: 3, rear: 1, top: 2 }, market: true },
    Rumbler: { weapon: 'drum', chassis: 'heavy', drive: '2wd', motor: 'std', battery: 'big', bumper: 'steel', armour: { front: 0, side: 2, rear: 1, top: 1 }, market: true },
    Popcorn: { weapon: 'flipper', chassis: 'light', drive: '4wd', motor: 'std', battery: 'std', bumper: 'steel', armour: { front: 0, side: 2, rear: 2, top: 2 }, market: true },
    Thumper: { weapon: 'hammer', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'big', bumper: 'spiked', armour: { front: 2, side: 2, rear: 0, top: 2 }, market: true },
    Snapjaw: { weapon: 'crusher', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'std', bumper: 'steel', armour: { front: 0, side: 3, rear: 0, top: 1 }, market: true },
    Peppershot: { weapon: 'medium', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'std', bumper: 'steel', armour: { front: 1, side: 2, rear: 1, top: 1 }, market: true },
    Blowtorch: { weapon: 'flame', chassis: 'light', drive: '4wd', motor: 'std', battery: 'big', bumper: 'steel', armour: { front: 2, side: 1, rear: 0, top: 1 }, market: true },
    Haymaker: { weapon: 'glove', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'std', bumper: 'rubber', armour: { front: 0, side: 2, rear: 1, top: 1 }, market: true },
    Jouster: { weapon: 'spear', chassis: 'medium', drive: '2wd', motor: 'hot', battery: 'std', bumper: 'fibre', armour: { front: 0, side: 2, rear: 1, top: 1 }, market: true },
    Wrecker: { weapon: 'flail', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'big', bumper: 'spiked', armour: { front: 1, side: 3, rear: 0, top: 2 }, market: true },
    Doorstop: { weapon: 'wedge', chassis: 'heavy', drive: '4wd', motor: 'hot', battery: 'big', armour: { front: 0, side: 3, rear: 2, top: 2 } },
    Rattler: { weapon: 'rapid', chassis: 'light', drive: '2wd', motor: 'std', battery: 'std', armour: { front: 1, side: 1, rear: 1, top: 1 } },
    Boomer: { weapon: 'heavy', chassis: 'heavy', drive: '4wd', motor: 'std', battery: 'std', armour: { front: 2, side: 2, rear: 1, top: 1 } },
    Sparky: { weapon: 'laser', chassis: 'light', drive: '2wd', motor: 'std', battery: 'std', armour: { front: 1, side: 1, rear: 0, top: 1 } },
    Lobster: { weapon: 'mortar', chassis: 'medium', drive: '2wd', motor: 'std', battery: 'std', armour: { front: 1, side: 1, rear: 1, top: 2 } },
    Grinder: { weapon: 'saw', chassis: 'medium', drive: '4wd', motor: 'std', battery: 'std', armour: { front: 2, side: 1, rear: 1, top: 1 } },
  };

  // ---------- geometry helpers ----------
  const rect = (cx, cy, hx, hy) => [[cx - hx, cy - hy], [cx + hx, cy - hy], [cx + hx, cy + hy], [cx - hx, cy + hy]];
  function area(vs) { let a = 0; for (let i = 0; i < vs.length; i++) { const p = vs[i], q = vs[(i + 1) % vs.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; }
  function centroid(vs) { let x = 0, y = 0; for (const p of vs) { x += p[0]; y += p[1]; } return [x / vs.length, y / vs.length]; }
  function subdivide(vs, step = 0.035) { // outline used for drawing dents
    const out = [];
    for (let i = 0; i < vs.length; i++) {
      const p = vs[i], q = vs[(i + 1) % vs.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) out.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]);
    }
    return out;
  }

  // ---------- spec helpers ----------
  function normSpec(s) {
    const p = PRESETS[s.preset] || {};
    const o = Object.assign({ weapon: 'spinner', chassis: 'medium', drive: '2wd', motor: 'std', battery: 'std', bumper: 'steel' }, p, s);
    o.armour = Object.assign({ front: 1, side: 1, rear: 1, top: 1 }, p.armour || {}, s.armour || {});
    if (frontTool(o.weapon)) o.armour.front = 0; // the front tool is the front armour
    return o;
  }
  function weightOf(spec) {
    const s = normSpec(spec), C = CHASSIS[s.chassis], a = s.armour;
    const wheels = s.drive === '4wd' ? 4 : 2;
    return Math.round(C.mass + wheels * 2.2 + (s.drive === '4wd' ? 4 : 0) + MOTORS[s.motor].mass + BATTERIES[s.battery].mass + WEAPONS[s.weapon].mass +
      (a.front * 2.5 + a.rear * 2.5 + a.side * 2 * 3.5) * BUMPERS[s.bumper].massK + a.top * 4 + 2);
  }

  // ---------- world ----------
  function create(opts) {
    const S = {
      t: 0, step: 0, rng: mkRng(opts.seed || 1), seed: opts.seed || 1, arenaKey: opts.arena || 'open', arena: ARENAS[opts.arena || 'open'],
      world: pl.World({ gravity: V(0, 0) }), robots: [], debris: [], projs: [], shells: [], discs: [], hitQ: [], contactQ: [], beginQ: [],
      fx: [], log: [], over: false, result: null, timeLimit: opts.timeLimit || 120, countdown: opts.countdown == null ? 0 : opts.countdown,
      sawState: [], slowmo: 0,
    };
    const world = S.world;
    // walls
    // four walls on kinematic bodies so arena events can move them in (they crush whatever is in the way)
    const T = 0.25;
    S.walls = []; S.sq = { x: 0, y: 0 }; S.crates = []; S.nextCrate = 9 + S.rng() * 4; S.evt = null; S.nextEvt = 18 + S.rng() * 4;
    for (const [cx, cy, hx, hy, axis, sgn] of [[0, -HALF - T, HALF + T, T, 'y', -1], [0, HALF + T, HALF + T, T, 'y', 1], [-HALF - T, 0, T, HALF + T, 'x', -1], [HALF + T, 0, T, HALF + T, 'x', 1]]) {
      const wb = world.createBody({ type: 'kinematic', position: V(cx, cy) });
      wb.createFixture({ shape: pl.Box(hx, hy), friction: 0.5, restitution: 0.5, userData: { wall: true } });
      if (S.arena.spikes) { const sx = axis === 'x' ? -sgn * (T + 0.06) : 0, sy = axis === 'y' ? -sgn * (T + 0.06) : 0; wb.createFixture({ shape: pl.Box(axis === 'x' ? 0.06 : 1.4, axis === 'y' ? 0.06 : 1.4, V(sx, sy)), friction: 0.6, restitution: 0.3, userData: { wall: true, spike: true } }); }
      S.walls.push({ body: wb, axis, sgn, home: [cx, cy] });
    }
    S.arena.saws.forEach((p, i) => S.sawState.push({ x: p[0], y: p[1], r: 0.36, up: false, t: i * 1.3, spin: 0 }));
    world.on('post-solve', (c, imp) => {
      const m = c.getManifold(); let J = 0;
      for (let i = 0; i < m.pointCount; i++) J += imp.normalImpulses[i];
      if (J < 4) return;
      const wm = c.getWorldManifold(null); if (!wm || !wm.points.length) return;
      let px = 0, py = 0; const n = Math.max(1, m.pointCount);
      for (let i = 0; i < n; i++) { px += wm.points[i].x; py += wm.points[i].y; }
      S.contactQ.push({ fa: c.getFixtureA(), fb: c.getFixtureB(), J, x: px / n, y: py / n, nx: wm.normal.x, ny: wm.normal.y });
    });
    world.on('begin-contact', c => { S.beginQ.push({ fa: c.getFixtureA(), fb: c.getFixtureB() }); });
    world.on('pre-solve', c => { // airborne robots sail over saw discs and debris lying on the floor
      const ua = c.getFixtureA().getUserData() || {}, ub = c.getFixtureB().getUserData() || {};
      const ra = ua.part && ua.part.attached ? ua.part.robot : null, rb = ub.part && ub.part.attached ? ub.part.robot : null;
      if ((ra && ra.airborne > 0.12 && ub.part && !ub.part.attached) || (rb && rb.airborne > 0.12 && ua.part && !ua.part.attached)) c.setEnabled(false);
    });
    const r = S.rng, jy = (r() - 0.5) * 1.2;
    const A = makeRobot(S, normSpec(opts.a), 0, -2.5, jy, (r() - 0.5) * 0.5), B = makeRobot(S, normSpec(opts.b), 1, 2.5, -jy, Math.PI + (r() - 0.5) * 0.5);
    A.orbit = r() < 0.5 ? 1 : -1; B.orbit = r() < 0.5 ? 1 : -1;
    A.enemy = B; B.enemy = A; S.robots.push(A, B);
    return S;
  }

  function makeRobot(S, spec, id, x, y, ang) {
    const C = CHASSIS[spec.chassis], hl = C.hl, hw = C.hw, W = WEAPONS[spec.weapon], a = spec.armour;
    const body = S.world.createBody({ type: 'dynamic', position: V(x, y), angle: ang, linearDamping: 0.12, angularDamping: 0.5 });
    const group = -(id + 1);
    const R = {
      id, spec, body, group, name: spec.name || spec.preset || W.label, parts: [], internals: [], slots: [], hl, hw, C, W,
      ctl: { L: 0, R: 0 }, alive: true, ko: null, airborne: 0, airMax: 0, lifted: 0, flipped: false, selfRight: 0,
      stats: { dealt: 0, taken: 0, biggest: 0, biggestBy: '', lost: [], dealtBy: {} }, stuckT: 0, unstick: 0, glitch: 0, glitchCtl: null,
      noDrive: 0, turretA: ang, cool: 0, gas: 12, swing: 0, grab: null, drumE: 0, bladeW: 0, beam: null, flameOn: 0, orbit: id ? 1 : -1, mortarAim: null,
    };
    const parts = R.parts;
    const addPart = (key, label, kind, verts, o) => {
      const ar = area(verts), mass = o.mass;
      const fx = (o.body || body).createFixture({ shape: pl.Polygon(verts.map(p => V(p[0], p[1]))), density: mass / ar, friction: o.friction == null ? 0.45 : o.friction, restitution: o.rest == null ? 0.15 : o.rest, filterGroupIndex: group });
      const part = { key, label, kind, verts, home: verts.map(q => q.slice()), outline: subdivide(verts), dents: [], scratches: [], fx, body: o.body || body, robot: R, attached: true, hp: o.hp, maxHp: o.hp, heat: 0, thr: o.thr || 0, sharp: o.sharp == null ? 0.35 : o.sharp, tough: o.tough || 1, mass, state: '', jam: 0, z: o.z || 0 };
      fx.setUserData({ part }); parts.push(part); return part;
    };
    const addInt = (key, label, lp, hp, o = {}) => { const p = Object.assign({ key, label, kind: 'internal', lp, hp, maxHp: hp, heat: 0, robot: R, attached: true, state: '', jam: 0, stuck: 0, stuckDir: 1 }, o); R.internals.push(p); return p; };
    // internals first (their mass goes into the chassis)
    const bat = BATTERIES[spec.battery];
    R.battery = addInt('battery', 'Battery', [-0.45 * hl, 0.2 * hw], bat.hp);
    R.radio = addInt('radio', 'Radio receiver', [0.12 * hl, -0.4 * hw], 26);
    const wheelsN = spec.drive === '4wd' ? 4 : 2;
    const wx = wheelsN === 4 ? [0.55 * hl, -0.55 * hl] : [0];
    const wy = hw + 0.075, whx = wheelsN === 4 ? 0.11 : 0.135, why = wheelsN === 4 ? 0.05 : 0.056;
    const extraMass = MOTORS[spec.motor].mass + bat.mass + a.top * 4 + 2 + (wheelsN === 4 ? 4 : 0) + (W.cat === 'top' ? W.mass : W.cat === 'spin' ? 5 : 0);
    const chassis = addPart('chassis', 'Chassis', 'chassis', rect(0, 0, hl, hw), { mass: C.mass + extraMass, hp: C.hp, thr: 2, z: 1 });
    R.chassis = chassis;
    // wheels + their motors
    for (const side of [-1, 1]) for (const xx of wx) {
      const nm = (side < 0 ? 'Left' : 'Right') + (wheelsN === 4 ? (xx > 0 ? ' front' : ' rear') : '');
      const wheel = addPart('wheel', nm + ' wheel', 'wheel', rect(xx, side * wy, whx, why), { mass: 2.2, hp: 38, friction: 0.7, tough: 1.1 });
      const motor = addInt('motor', nm + ' motor', [xx, side * (hw - 0.09)], 34);
      const slot = { lp: [xx, side * wy], side, wheel, motor, spin: 0, r: why * 0 + 0.07, slip: 0 };
      wheel.slot = slot; motor.slot = slot; R.slots.push(slot);
    }
    // armour plates (t = thickness grows with level)
    const plate = lvl => 0.022 + 0.016 * lvl;
    const BK = BUMPERS[spec.bumper] ? spec.bumper : 'steel', BB = BUMPERS[BK];
    const amat = lvl => ({ hp: 30 * lvl * BB.hpK, thr: 3 * lvl * BB.thrK, rest: BB.rest, sharp: BK === 'spiked' ? 1.6 : 0.35 });
    if (a.side > 0) for (const side of [-1, 1]) {
      const t = plate(a.side), yy = side * (hw + 0.15 + t / 2);
      addPart('armour', (side < 0 ? 'Left' : 'Right') + ' armour', 'armour', rect(0, yy, hl * 0.97, t / 2), Object.assign({ mass: 3.5 * a.side * BB.massK }, amat(a.side)));
    }
    if (a.rear > 0) { const t = plate(a.rear); addPart('armour', 'Rear armour', 'armour', rect(-hl - t / 2, 0, t / 2, hw + 0.15), Object.assign({ mass: 2.5 * a.rear * BB.massK }, amat(a.rear))); }
    if (a.front > 0) { const t = plate(a.front); addPart('armour', 'Front armour', 'armour', rect(hl + t / 2, 0, t / 2, hw + 0.15), Object.assign({ mass: 2.5 * a.front * BB.massK }, amat(a.front))); }
    R.topArmour = a.top; R.bumper = BK;
    for (const q of parts) if (q.kind === 'armour') q.bumper = BK;
    // weapon
    const w = spec.weapon;
    if (w === 'spinner') {
      const px = hl + 0.1;
      const blade = S.world.createBody({ type: 'dynamic', position: body.getWorldPoint(V(px, 0)), angle: ang + 0.4, bullet: true, angularDamping: 0.05, linearDamping: 0.1 });
      const L = 0.52, H = 0.045;
      R.blade = addPart('blade', 'Spinner bar', 'weapon', [[-L, -H * 0.6], [-L + 0.06, -H], [L - 0.06, -H], [L, -H * 0.6], [L, H * 0.6], [L - 0.06, H], [-L + 0.06, H], [-L, H * 0.6]], { mass: 9, hp: 120, sharp: 3.4, tough: 0.12, rest: 0.25, friction: 0.3, body: blade, z: 2 });
      R.blade.home = R.blade.verts.map(q => [px + q[1], q[0] * 0.8]);
      R.joint = S.world.createJoint(pl.RevoluteJoint({ enableMotor: true, motorSpeed: 0, maxMotorTorque: 16 }, body, blade, body.getWorldPoint(V(px, 0))));
      R.wmotor = addInt('wmotor', 'Spinner motor', [0.62 * hl, 0], 40);
      R.bladeMax = 72;
    } else if (w === 'drum') {
      R.tool = addPart('drum', 'Drum', 'weapon', rect(hl + 0.1, 0, 0.1, hw + 0.03), { mass: 12, hp: 120, sharp: 0.6, tough: 0.4, z: 2 });
      R.wmotor = addInt('wmotor', 'Drum motor', [0.62 * hl, 0], 40);
    } else if (w === 'flipper') {
      R.tool = addPart('flipper', 'Flipper', 'weapon', [[hl, -hw - 0.12], [hl + 0.24, -hw + 0.0], [hl + 0.24, hw - 0.0], [hl, hw + 0.12]], { mass: 10, hp: 130, sharp: 0.3, tough: 0.6, friction: 0.15, z: 2 });
      R.wmotor = addInt('wmotor', 'Gas ram', [0.3 * hl, 0], 40);
    } else if (w === 'crusher') {
      R.tool = addPart('jaws', 'Crusher jaws', 'weapon', rect(hl + 0.06, 0, 0.06, hw), { mass: 12, hp: 100, sharp: 0.5, tough: 0.5, z: 2 });
      R.wmotor = addInt('wmotor', 'Hydraulic pump', [0.2 * hl, 0], 40);
    } else if (w === 'wedge') {
      R.tool = addPart('wedge', 'Wedge', 'weapon', [[hl, -hw - 0.16], [hl + 0.28, -hw - 0.2], [hl + 0.28, hw + 0.2], [hl, hw + 0.16]], { mass: 10, hp: 150, sharp: 0.25, tough: 0.35, friction: 0.05, z: 2 });
      R.wedgeBoost = 1.25;
    } else if (w === 'glove') {
      R.tool = addPart('glove', 'Glove piston', 'weapon', rect(hl + 0.06, 0, 0.06, 0.17), { mass: 11, hp: 110, sharp: 0.35, tough: 0.6, z: 2 });
      R.wmotor = addInt('wmotor', 'Spring winder', [0.4 * hl, 0], 40);
    } else if (w === 'spear') {
      R.tool = addPart('spear', 'Spear', 'weapon', [[hl, -0.05], [hl + 0.5, -0.035], [hl + 0.72, 0], [hl + 0.5, 0.035], [hl, 0.05]], { mass: 9, hp: 85, sharp: 3.2, tough: 0.55, friction: 0.2, z: 2 });
    } else if (w === 'flail') {
      const arm = S.world.createBody({ type: 'dynamic', position: body.getWorldPoint(V(0, 0)), angle: ang, angularDamping: 0.05 });
      arm.createFixture({ shape: pl.Box(0.2, 0.03, V(0.2, 0)), density: 40, filterMaskBits: 0, filterCategoryBits: 0 });
      const tip = arm.getWorldPoint(V(0.4, 0)), bp = V(tip.x + Math.cos(ang) * 0.42, tip.y + Math.sin(ang) * 0.42);
      const ballBody = S.world.createBody({ type: 'dynamic', position: bp, bullet: true, linearDamping: 0.3, angularDamping: 0.3 });
      const oct = []; for (let k = 0; k < 8; k++) oct.push([Math.cos(k / 8 * TAU) * 0.11, Math.sin(k / 8 * TAU) * 0.11]);
      R.ball = addPart('ball', 'Flail ball', 'weapon', oct, { mass: 7, hp: 150, sharp: 1.3, tough: 0.25, rest: 0.4, body: ballBody, z: 2 });
      R.ball.home = oct.map(q => [q[0] + hl + 0.3, q[1]]);
      R.flailArm = arm;
      R.joint = S.world.createJoint(pl.RevoluteJoint({ enableMotor: true, motorSpeed: 0, maxMotorTorque: 60 }, body, arm, body.getWorldPoint(V(0, 0))));
      R.rope = S.world.createJoint(pl.DistanceJoint({ frequencyHz: 0, dampingRatio: 0 }, arm, ballBody, tip, bp));
      R.wmotor = addInt('wmotor', 'Flail motor', [0, 0.25 * hw], 45);
      R.bladeMax = 16;
    } else if (w === 'hammer') {
      R.arm = addInt('arm', 'Axe arm', [0, 0], 75, { top: true });
      R.wmotor = addInt('wmotor', 'Arm actuator', [-0.3 * hl, -0.2 * hw], 40);
    } else {
      R.turret = addInt('turret', w === 'flame' ? 'Flame nozzle' : w === 'laser' ? 'Laser emitter' : w === 'mortar' ? 'Mortar tube' : 'Gun turret', [0, 0], 48, { top: true });
    }
    R.massStart = body.getMass();
    return R;
  }

  // ---------- helpers on robots ----------
  const alivePart = p => p && p.attached && p.hp > 0;
  function power(R) { const b = R.battery; if (b.hp <= 0) return 0; const f = b.hp / b.maxHp; return (f > 0.5 ? 1 : 0.45 + f * 1.1) * BATTERIES[R.spec.battery].p * (b.fire ? 0.8 : 1); }
  function canDrive(R) { return !(R.flipped && !R.W.invert && !R.W.invertDrive) && R.slots.some(s => alivePart(s.wheel) && s.motor.hp > 0); }
  function weaponOk(R) {
    if (!R.alive) return false;
    if (R.flipped && !R.W.invert) return false;
    if (R.wmotor && R.wmotor.hp <= 0) return false;
    if (R.turret && R.turret.hp <= 0) return false;
    if (R.arm && R.arm.hp <= 0) return false;
    if (R.tool && !alivePart(R.tool)) return false;
    if (R.blade && !alivePart(R.blade)) return false;
    if (R.ball && !alivePart(R.ball)) return false;
    return true;
  }
  function say(S, text, side, big) { S.log.push({ t: S.t, text, side, big: !!big }); }
  const nameOf = R => R.name;

  // queue a hit on a part. lp = local point on the part's body.
  function hit(S, part, dmg, o) { if (part && dmg > 0) S.hitQ.push(Object.assign({ part, dmg }, o)); }

  function applyHit(S, h) {
    const part = h.part, R = part.robot;
    if (!R.alive && !h.post) { /* wrecks still dent */ }
    if (!part.attached && part.kind !== 'internal') { // debris: just dents
      if (h.lp) addDent(part, h.lp, h.dmg); return;
    }
    // weapon knob: scales everything a robot's weapon causes (incl. flame heat/fire and landings after a flip/kick)
    const own = h.src && !NOKNOB[h.cause] ? h.src.spec.weapon : null;
    let d = h.dmg * TUNE.dmg * (own && TUNE[own] != null ? TUNE[own] : 1);
    if (h.top && (part.kind === 'chassis' || part.kind === 'internal')) d *= 1 - 0.18 * R.topArmour;
    if (part.kind === 'armour' && part.thr && d < part.thr && !h.ignoreThr) d *= 0.3;
    if (part.kind === 'armour' && part.bumper) { const B = BUMPERS[part.bumper]; d *= SHARP[h.cause] ? B.sharpK : B.blunt; }
    const atk = h.src && h.src !== R ? h.src : null;
    if (atk) d *= (atk.over > 0 ? 1.8 : 1) * (atk.rage > 0 ? 1.4 : 1);
    if (R.shield > 0 && h.cause !== 'heat' && h.cause !== 'fire') { const ab = Math.min(R.shield, d); R.shield -= ab; d -= ab; if (S.step % 6 === 0) S.fx.push({ type: 'shieldhit', robot: R.id }); if (R.shield <= 0) { R.shieldT = 0; say(S, `${R.name}: shield popped`, R.id); } if (d <= 0) return; }
    if (part.hp <= 0) { if (part.kind === 'chassis' || part.kind === 'internal') return; }
    if (part.kind === 'chassis') d *= 0.5;
    const before = part.hp;
    part.hp -= d;
    const src = h.src && h.src !== R ? h.src : null;
    R.stats.taken += d;
    if (src) {
      src.stats.dealt += d; src.lastHit = S.t; const k = h.cause || 'impact'; src.stats.dealtBy[k] = (src.stats.dealtBy[k] || 0) + d;
      if (d > src.stats.biggest) { src.stats.biggest = d; src.stats.biggestBy = k; }
      src.hype = Math.min(100, (src.hype || 0) + d * 0.3 + (d > 15 ? 5 : 0));
      if (src.hype >= 100 && !(src.rage > 0) && src.alive) { src.hype = 0; src.rage = 6; say(S, `${src.name} goes into RAGE MODE`, src.id, true); const sp = src.body.getPosition(); callout(S, 'RAGE MODE!', sp.x, sp.y, true); }
      if (d >= 16 && !h.inner && h.x != null) callout(S, CALL[k] || 'SMASH!', h.x, h.y, d >= 30);
    }
    if (h.lp && part.kind !== 'internal') addDent(part, h.lp, d);
    if (d >= 18) S.fx.push({ type: 'bigHit', x: h.x, y: h.y, power: d });
    // damage travels inwards
    const pen = h.noPen ? 0 : h.pen == null ? 1 : h.pen;
    const toInternal = (amt) => {
      if (amt <= 0.3) return;
      const blp = h.blp || (h.lp && part.body === R.body ? h.lp : null);
      const target = nearestInternal(R, blp);
      if (target) hit(S, target, amt, { src: h.src, cause: h.cause, top: h.top, x: h.x, y: h.y, inner: true });
    };
    if (part.kind === 'chassis') toInternal(d * 0.55 * pen);
    else if (part.kind === 'armour' && d > part.thr * 3) toInternal((d - part.thr * 3) * 0.25 * pen);
    else if (part.kind === 'wheel' && part.slot) hit(S, part.slot.motor, d * 0.25, { src: h.src, cause: h.cause, x: h.x, y: h.y });
    else if (part.kind === 'weapon' && R.wmotor && d > 10) hit(S, R.wmotor, d * 0.15, { src: h.src, cause: h.cause, x: h.x, y: h.y });
    // jolts: big hits shake things loose
    if (d >= 22 && R.alive && !h.inner) {
      const r = S.rng();
      if (r < 0.12) { const s = R.slots[Math.floor(S.rng() * R.slots.length)]; if (s.motor.hp > 0 && alivePart(s.wheel)) { s.motor.stuck = 2 + S.rng() * 3; s.motor.stuckDir = S.rng() < 0.5 ? 1 : -1; say(S, `${R.name}: ${s.motor.label.toLowerCase()} jammed on`, R.id); } }
      else if (r < 0.22 && R.wmotor && R.wmotor.hp > 0) { R.wmotor.jam = 1.5 + S.rng() * 2.5; say(S, `${R.name}: weapon jammed`, R.id); }
      else if (r < 0.28 && R.radio.hp > 0) { R.glitch = 1 + S.rng() * 1.5; say(S, `${R.name}: radio glitch`, R.id); }
    }
    // state labels
    const f = part.hp / part.maxHp;
    if (part.hp <= 0 && before > 0) destroyPart(S, part, h, -part.hp);
    else if (part.kind === 'wheel' && f < 0.5 && part.state !== 'bent') { part.state = 'bent'; say(S, `${R.name}: ${part.label.toLowerCase()} bent`, R.id); }
    else if (part.kind === 'weapon' && part.key === 'blade' && f < 0.6 && part.state !== 'bent') { part.state = 'bent'; say(S, `${R.name}: spinner bar bent, it shakes the whole robot`, R.id); }
  }

  function nearestInternal(R, lp) {
    let best = null, bd = 1e9;
    for (const p of R.internals) {
      if (p.hp <= 0) continue;
      const d = lp ? Math.hypot(p.lp[0] - lp[0], p.lp[1] - lp[1]) + (p.key === 'radio' ? 0.08 : 0) : 0;
      if (d < bd) { bd = d; best = p; }
    }
    return lp && bd > 0.5 ? null : best;
  }

  function addDent(part, lp, d) {
    if (d < 2.5 || !part.outline) return;
    const r = Math.min(0.12, 0.035 + d * 0.0025), depth = Math.min(0.045, 0.004 + d * 0.0011);
    if (part.dents.length < 40) part.dents.push({ x: lp[0], y: lp[1], r, d: depth, a: d });
    else { const k = part.dents.findIndex(q => q.a < d); if (k >= 0) part.dents[k] = { x: lp[0], y: lp[1], r, d: depth, a: d }; }
    const c = centroid(part.verts);
    for (const p of part.outline) {
      const dist = Math.hypot(p[0] - lp[0], p[1] - lp[1]);
      if (dist < r * 1.6) {
        const k = depth * Math.pow(1 - dist / (r * 1.6), 2), vx = c[0] - p[0], vy = c[1] - p[1], L = Math.hypot(vx, vy) || 1;
        const room = L * 0.45; const mv = Math.min(k, room);
        p[0] += vx / L * mv; p[1] += vy / L * mv;
      }
    }
  }

  function destroyPart(S, part, h, overflow) {
    const R = part.robot, by = h.src && h.src !== R ? ` (${h.src.name}'s ${causeLabel(h.cause)})` : h.cause && h.cause !== 'impact' ? ` (${causeLabel(h.cause)})` : '';
    part.hp = 0;
    R.stats.lost.push({ t: S.t, label: part.label, cause: h.cause || 'impact', by: h.src && h.src !== R ? h.src.name : '' });
    const kick = h.dir ? [h.dir[0] * 2.5, h.dir[1] * 2.5] : [0, 0];
    if (part.kind === 'internal') {
      part.state = 'dead';
      if (part.key === 'battery') { ko(S, R, 'battery destroyed' + by); for (const q of R.parts.slice()) if (q.attached && q.kind !== 'chassis') detach(S, q, [(S.rng() - 0.5) * 7, (S.rng() - 0.5) * 7]); S.fx.push({ type: 'boom', x: R.body.getWorldPoint(V(part.lp[0], part.lp[1])).x, y: R.body.getWorldPoint(V(part.lp[0], part.lp[1])).y, power: 30 }); }
      else if (part.key === 'radio') ko(S, R, 'radio receiver destroyed, no control' + by);
      else if (part.key === 'motor') say(S, `${R.name}: ${part.label.toLowerCase()} burned out, that wheel just freewheels${by}`, R.id, true);
      else if (part.key === 'wmotor') say(S, `${R.name}: ${part.label.toLowerCase()} dead, weapon is out${by}`, R.id, true);
      else if (part.key === 'turret') say(S, `${R.name}: ${part.label.toLowerCase()} smashed, can't shoot${by}`, R.id, true);
      else if (part.key === 'arm') { say(S, `${R.name}: axe arm snapped off${by}`, R.id, true); spawnLoose(S, R, 'Axe head', [[-0.12, -0.06], [0.12, -0.08], [0.12, 0.08], [-0.12, 0.06]], [R.hl + 0.25, 0], 4, kick); }
      return;
    }
    if (h.src && h.src !== R) h.src.hype = Math.min(100, (h.src.hype || 0) + 8);
    if (part.kind === 'chassis') {
      ko(S, R, 'chassis torn apart' + by);
      // everything falls off
      for (const p of R.parts.slice()) if (p.attached && p !== part) detach(S, p, [(S.rng() - 0.5) * 6, (S.rng() - 0.5) * 6]);
      return;
    }
    if (part.kind === 'armour' && part.bumper === 'fibre') { // shatters into shards
      const c0 = centroid(part.home); for (let i = 0; i < 3; i++) spawnLoose(S, R, 'Fibreglass shard', [[-0.05, -0.02], [0.05, -0.03], [0.01, 0.04]], c0, 0.2, [(S.rng() - 0.5) * 8, (S.rng() - 0.5) * 8]);
      const wpS = R.body.getWorldPoint(V(c0[0], c0[1])); S.fx.push({ type: 'shatter', x: wpS.x, y: wpS.y });
    }
    detach(S, part, kick);
    { const wpC = part.body.getPosition(); callout(S, part.kind === 'wheel' ? 'WHEEL GONE!' : part.key === 'blade' || part.key === 'ball' ? 'WEAPON GONE!' : part.kind === 'armour' ? 'ARMOUR OFF!' : 'RIPPED OFF!', wpC.x, wpC.y, false); }
    const verb = part.kind === 'wheel' ? 'torn off' : part.kind === 'armour' ? 'ripped off' : part.key === 'blade' ? 'snapped off and flies away' : 'broken off';
    say(S, `${R.name}: ${part.label.toLowerCase()} ${verb}${by}`, R.id, true);
    if (part.kind === 'armour' && overflow > 0) hit(S, R.chassis, overflow * 0.6, { src: h.src, cause: h.cause, lp: h.blp, blp: h.blp, x: h.x, y: h.y });
  }

  function spawnLoose(S, R, label, verts, lp, mass, kick) { // a loose chunk that was not a fixture (axe head)
    const b = R.body, wp = b.getWorldPoint(V(lp[0], lp[1])), v = b.getLinearVelocityFromWorldPoint(wp);
    const body = S.world.createBody({ type: 'dynamic', position: wp, angle: b.getAngle(), linearDamping: 1.4, angularDamping: 1.6 });
    body.setLinearVelocity(V(v.x + kick[0], v.y + kick[1])); body.setAngularVelocity((S.rng() - 0.5) * 14);
    const part = { key: 'chunk', label, kind: 'debris', verts, outline: subdivide(verts), dents: [], fx: null, body, robot: R, attached: false, hp: 0, maxHp: 1, heat: 0, sharp: 0.4, tough: 1, wheelRoll: false };
    part.fx = body.createFixture({ shape: pl.Polygon(verts.map(p => V(p[0], p[1]))), density: mass / area(verts), friction: 0.5, restitution: 0.2, userData: { part } });
    S.debris.push(part);
    const chunks = S.debris.filter(d => d.kind === 'debris' && !d.gone);
    if (chunks.length > 24) { const old = chunks[0]; old.gone = true; S.world.destroyBody(old.body); }
  }

  function detach(S, part, kick) {
    const R = part.robot, b = part.body;
    part.attached = false;
    if (part.key === 'blade' || part.key === 'ball') { // separate body already
      const jk = part.key === 'blade' ? 'joint' : 'rope';
      if (R[jk]) { S.world.destroyJoint(R[jk]); R[jk] = null; }
      part.fx.setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0xffff });
      b.setLinearDamping(1.0); b.setAngularDamping(0.8); b.setBullet(true);
      const v = b.getLinearVelocity(); b.setLinearVelocity(V(v.x + kick[0] * 1.5, v.y + kick[1] * 1.5));
      S.debris.push(part); return;
    }
    const c = centroid(part.verts), wp = b.getWorldPoint(V(c[0], c[1])), v = b.getLinearVelocityFromWorldPoint(wp);
    const shift = p => [p[0] - c[0], p[1] - c[1]];
    const verts = part.verts.map(shift);
    const nb = S.world.createBody({ type: 'dynamic', position: wp, angle: b.getAngle(), linearDamping: part.kind === 'wheel' ? 0.25 : 0.9, angularDamping: part.kind === 'wheel' ? 0.6 : 1.0, bullet: false });
    const spin = (S.rng() - 0.5) * 24 + b.getAngularVelocity(), F = ARC.fly;
    nb.setLinearVelocity(V(v.x + kick[0] * F + (S.rng() - 0.5) * 1.5 * F, v.y + kick[1] * F + (S.rng() - 0.5) * 1.5 * F)); nb.setAngularVelocity(spin);
    b.destroyFixture(part.fx);
    part.verts = verts; part.outline = part.outline.map(shift); part.dents = part.dents.map(d => Object.assign({}, d, { x: d.x - c[0], y: d.y - c[1] }));
    part.body = nb; part.wheelRoll = part.kind === 'wheel';
    part.fx = nb.createFixture({ shape: pl.Polygon(verts.map(p => V(p[0], p[1]))), density: part.mass / area(verts), friction: 0.5, restitution: 0.2, userData: { part } });
    if (part.slot) part.slot.wheel = null;
    S.debris.push(part);
    S.fx.push({ type: 'detach', x: wp.x, y: wp.y });
  }

  function ko(S, R, why) {
    if (!R.alive) return;
    R.alive = false; R.ko = why; R.koT = S.t;
    say(S, `KO! ${R.name}: ${why}`, R.id, true);
    S.fx.push({ type: 'ko', robot: R.id });
  }

  const CAUSES = { glove: 'boxing glove', spear: 'spear', flail: 'flail', spikeplate: 'spiked bumper', ceiling: 'ceiling hammer', piston: 'floor bumper', spinner: 'spinner', drum: 'drum', flipper: 'flipper', hammer: 'axe', crusher: 'crusher', wedge: 'wedge', rapid: 'rapid gun', medium: 'gun', heavy: 'cannon', laser: 'laser', mortar: 'mortar', saw: 'saw disc', flame: 'flames', ram: 'ram', wall: 'wall', spikes: 'spikes', floorsaw: 'floor saw', landing: 'hard landing', slam: 'thrown into the wall', debris: 'debris', fire: 'fire', heat: 'heat', impact: 'impact' };
  const causeLabel = c => CAUSES[c] || c || 'hit';

  // ---------- contacts -> damage ----------
  function processContacts(S) {
    for (const c of S.contactQ) {
      const ua = c.fa.getUserData() || {}, ub = c.fb.getUserData() || {};
      if (ua.disc || ub.disc || ua.shrap || ub.shrap) { if (c.J > 8) S.fx.push({ type: 'spark', x: c.x, y: c.y, power: c.J * 0.3 }); continue; }
      sideDamage(S, ua, ub, c); sideDamage(S, ub, ua, c);
      if (c.J > 10) S.fx.push({ type: 'spark', x: c.x, y: c.y, power: c.J, nx: c.nx, ny: c.ny, metal: !!(ua.part && ub.part) });
      // flipped robots can roll back over when they bash into a wall
      for (const [u, o] of [[ua, ub], [ub, ua]]) if (u.part && u.part.attached && o.wall && u.part.robot.flipped && c.J > 14 && S.rng() < 0.3) { u.part.robot.flipped = false; u.part.robot.airborne = 0.25; say(S, `${u.part.robot.name} rolls back onto its wheels off the wall`, u.part.robot.id); }
    }
    S.contactQ.length = 0;
  }
  function sideDamage(S, ux, uy, c) {
    const px = ux.part; if (!px) return;
    let sharp, src = null, cause = 'impact';
    if (uy.wall) { sharp = uy.spike ? 1.8 : 0.25; cause = uy.spike ? 'spikes' : 'wall'; if (px.attached && px.robot.airborne > 0 && px.robot.thrownBy) { src = px.robot.thrownBy; cause = 'slam'; sharp = uy.spike ? 2.2 : 0.7; } }
    else if (uy.part) {
      const py = uy.part;
      sharp = py.sharp; if (py.attached) { src = py.robot; cause = py.kind === 'weapon' ? ({ blade: 'spinner', jaws: 'crusher', ball: 'flail' }[py.key] || py.key) : py.bumper === 'spiked' ? 'spikeplate' : 'ram'; } else { src = null; cause = 'debris'; sharp = Math.min(sharp, 0.45); }
      if (py.attached && px.attached && py.robot === px.robot) return;
      // spring bumper: whatever hits it gets thrown back
      if (px.attached && px.bumper === 'spring' && py.attached && c.J > 10 && px.robot.alive && S.step - (px.robot.boingStep || -99) > 20) {
        px.robot.boingStep = S.step;
        const ob = py.robot.body, oc = ob.getWorldCenter(), mc = px.robot.body.getWorldCenter(); let kx = oc.x - mc.x, ky = oc.y - mc.y; const kl = Math.hypot(kx, ky) || 1;
        const mag = Math.min(150, 25 + c.J * 1.1) * ARC.knock; ob.applyLinearImpulse(V(kx / kl * mag, ky / kl * mag), oc, true);
        py.robot.airborne = Math.max(py.robot.airborne, 0.2); py.robot.airMax = Math.max(py.robot.airMax, 0.2); py.robot.thrownBy = px.robot;
        S.fx.push({ type: 'boing', x: c.x, y: c.y }); if (mag > 60) callout(S, 'BOING!', c.x, c.y, false);
      }
      // wedge gets under: the other robot loses grip for a moment
      if (py.attached && py.key === 'wedge' && px.attached && px.robot !== py.robot) {
        const W = py.robot.body, fwd = W.getWorldVector(V(1, 0)), vv = W.getLinearVelocity();
        if (fwd.x * vv.x + fwd.y * vv.y > 0.6) px.robot.lifted = Math.max(px.robot.lifted, 0.4);
      }
    } else return;
    const J = c.J, Jd = cause === 'wall' || cause === 'debris' || cause === 'spikes' ? Math.min(J, 45) : J; // walls and loose junk can crush, but not infinitely
    let d = Math.max(0, Jd - 7) * 0.2 * sharp * px.tough;
    if (!px.attached && cause !== 'spinner' && cause !== 'flail') return; // debris barely matters
    if (d < 0.8) return;
    const lp = px.body.getLocalPoint(V(c.x, c.y));
    const blp = px.attached && px.body === px.robot.body ? [lp.x, lp.y] : null;
    let dir = null; if (uy.part && uy.part.body) { const v = uy.part.body.getLinearVelocityFromWorldPoint(V(c.x, c.y)); const L = Math.hypot(v.x, v.y) || 1; dir = [v.x / L, v.y / L]; }
    // arcade knockback: weapon hits throw the victim
    if (src && px.attached && (cause === 'spinner' || cause === 'flail' || cause === 'spear') && J > 12 && uy.part && uy.part.body) {
      const tb = px.robot.body, tp = tb.getWorldCenter(), spp = uy.part.body.getWorldCenter(); let kx = tp.x - spp.x, ky = tp.y - spp.y; const kl = Math.hypot(kx, ky) || 1;
      const mag = Math.min(140, J * 0.8) * ARC.knock; tb.applyLinearImpulse(V(kx / kl * mag, ky / kl * mag), tp, true);
      if (mag > 40) { px.robot.airborne = Math.max(px.robot.airborne, 0.15); px.robot.airMax = Math.max(px.robot.airMax, 0.15); px.robot.thrownBy = src; }
    }
    hit(S, px, d, { src, cause, lp: [lp.x, lp.y], blp, x: c.x, y: c.y, dir, pen: cause === 'spinner' ? 1.2 : cause === 'spear' ? 1.7 : cause === 'flail' ? 1.1 : 0.8, ignoreThr: cause === 'spear' });
  }

  // begin-contacts: drum kicks and saw discs
  function processBegins(S) {
    for (const b of S.beginQ) {
      const ua = b.fa.getUserData() || {}, ub = b.fb.getUserData() || {};
      for (const [u, o, fu, fo] of [[ua, ub, b.fa, b.fb], [ub, ua, b.fb, b.fa]]) {
        if (u.disc) discHit(S, u, o, fu, fo);
        if (u.part && u.part.attached && u.part.key === 'drum' && o.part && o.part.attached && o.part.robot !== u.part.robot) drumKick(S, u.part.robot, o.part);
      }
    }
    S.beginQ.length = 0;
  }
  function discHit(S, u, o, fu, fo) {
    const d = u.disc; if (d.dead) return;
    const v = fu.getBody().getLinearVelocity(), sp = Math.hypot(v.x, v.y);
    if (o.part && o.part.attached && o.part.robot !== d.owner) {
      const p = fu.getBody().getPosition(), lp = o.part.body.getLocalPoint(p);
      hit(S, o.part, 9 * d.power * Math.min(1.3, sp / 12), { src: d.owner, cause: 'saw', lp: [lp.x, lp.y], blp: o.part.body === o.part.robot.body ? [lp.x, lp.y] : null, x: p.x, y: p.y, pen: 0.9 });
      d.hits++; S.fx.push({ type: 'spark', x: p.x, y: p.y, power: 18 });
    }
    d.power *= 0.75;
    if (d.hits >= 3 || d.power < 0.3) d.dead = true;
  }
  function drumKick(S, R, target) {
    if (!weaponOk(R) || R.drumE < 0.3 || R.cool > 0) return;
    const T = target.robot, e = R.drumE, b = R.body, fwd = b.getWorldVector(V(1, 0));
    const mRatio = clamp(R.body.getMass() / T.body.getMass(), 0.5, 1.6);
    // a low plate (flipper, wedge) deflects the drum: the drum rides up instead of kicking
    let dk = 1;
    if (target.key === 'flipper' || target.key === 'wedge') { dk = 0.5; b.applyLinearImpulse(V(-fwd.x * 20 * e, -fwd.y * 20 * e), b.getWorldCenter(), true); launch(S, R, 0.15 + 0.15 * e, T); }
    const imp = 70 * e * mRatio * dk;
    T.body.applyLinearImpulse(V(fwd.x * imp, fwd.y * imp), T.body.getWorldCenter(), true);
    T.body.applyAngularImpulse((S.rng() - 0.5) * 30 * e, true);
    b.applyLinearImpulse(V(-fwd.x * imp * 0.45, -fwd.y * imp * 0.45), b.getWorldCenter(), true);
    launch(S, T, (0.2 + 0.36 * e * mRatio) * dk, R);
    const p = target.body.getWorldCenter(), lp = target.body.getLocalPoint(p);
    hit(S, target, 30 * e, { src: R, cause: 'drum', lp: [lp.x, lp.y], blp: target.body === T.body ? [lp.x, lp.y] : null, x: p.x, y: p.y, dir: [fwd.x, fwd.y], pen: 1 });
    R.drumE -= 0.75; R.cool = 0.25;
    S.fx.push({ type: 'spark', x: p.x, y: p.y, power: 40 });
  }
  function launch(S, T, air, by) {
    if (by) T.thrownBy = by;
    if (T.airborne > 0) { T.airborne = Math.max(T.airborne, air); T.airMax = Math.max(T.airMax, air); return; }
    T.airborne = air; T.airMax = air; T.flipChance = clamp(air * 0.65, 0.1, 0.6);
  }

  // ---------- floor point query ----------
  function partsAt(S, x, y, r, notRobot) {
    const out = [];
    S.world.queryAABB(pl.AABB(V(x - r, y - r), V(x + r, y + r)), fx => {
      const u = fx.getUserData(); if (!u || !u.part || !u.part.attached || u.part.robot === notRobot) return true;
      if (r <= 0.02 ? fx.testPoint(V(x, y)) : true) out.push(u.part);
      return true;
    });
    return out;
  }
  function topPartAt(S, x, y, notRobot) { // what an overhead hit lands on
    let best = null;
    S.world.queryAABB(pl.AABB(V(x - 0.01, y - 0.01), V(x + 0.01, y + 0.01)), fx => {
      const u = fx.getUserData(); if (!u || !u.part || !u.part.attached || u.part.robot === notRobot) return true;
      if (fx.testPoint(V(x, y)) && (!best || u.part.z > best.z || (u.part.kind === 'armour' && best.kind !== 'chassis'))) best = u.part;
      return true;
    });
    return best;
  }

  // ---------- driving ----------
  function drive(S, R) {
    const b = R.body, m = b.getMass(), fwd = b.getWorldVector(V(1, 0)), right = b.getWorldVector(V(0, 1));
    const ground = R.airborne > 0 ? 0 : R.lifted > 0 ? 0.25 : 1;
    const onBack = R.flipped && !R.W.invert && !R.W.invertDrive; // lying on its back, wheels spin in the air
    const n = R.slots.length, load = m * G / n;
    const pw = R.alive ? power(R) : 0, mot = MOTORS[R.spec.motor];
    const Fw = R.C.force * mot.f * (R.wedgeBoost || 1) * (n === 4 ? 1.25 : 1) / n * (R.nitro > 0 ? 1.6 : 1) * (R.rage > 0 ? 1.2 : 1);
    const vmax = R.C.vmax * Math.sqrt(R.massStart / m) ** 0.5 * (R.nitro > 0 ? 1.5 : 1);
    for (const s of R.slots) {
      const p = b.getWorldPoint(V(s.lp[0], s.lp[1])), v = b.getLinearVelocityFromWorldPoint(p);
      const vf = v.x * fwd.x + v.y * fwd.y, vl = v.x * right.x + v.y * right.y;
      const mo = s.motor;
      if (alivePart(s.wheel) && !onBack) {
        const bent = s.wheel.state === 'bent';
        const mu = (bent ? 0.6 : 1) * ground;
        let thr = s.side < 0 ? R.ctl.L : R.ctl.R;
        if (!R.alive) thr = 0;
        if (mo.stuck > 0 && mo.hp > 0) thr = mo.stuckDir;
        let mf = mo.hp > 0 ? (mo.hp / mo.maxHp < 0.35 ? 0.55 : 1) : 0;
        if (mo.heat > 85) mf *= 0.4;
        let F = thr * Fw * mf * pw * clamp(1 - (vf * Math.sign(thr)) / vmax, 0, 1);
        if (bent) F *= 1 + 0.6 * Math.sin(s.spin * 1.0);
        const tmax = mu * load * 1.15;
        s.slip = Math.abs(F) > tmax ? 1 : 0;
        F = clamp(F, -tmax, tmax);
        if (F && ground > 0) b.applyForce(V(fwd.x * F, fwd.y * F), p, true);
        // wheel spin for the drawing: ground speed, or flat out when it slips or is in the air
        const spinV = ground > 0 && !s.slip ? vf : thr * vmax * mf * pw;
        s.spin += spinV * DT / 0.07;
        if (mo.hp > 0) mo.heat += Math.abs(thr) * mf * (1 - Math.min(1, Math.abs(vf) / vmax)) * 3 * mot.heat * DT;
        // side grip + rolling resistance / motor brake
        if (ground > 0) {
          const me = m / n, jl = clamp(-vl * me, -mu * load * DT, mu * load * DT);
          b.applyLinearImpulse(V(right.x * jl, right.y * jl), p, true);
          const brake = thr === 0 && mo.hp > 0 && R.alive ? 0.12 : 0.012;
          const jr = clamp(-vf * me * brake, -mu * load * DT, mu * load * DT);
          b.applyLinearImpulse(V(fwd.x * jr, fwd.y * jr), p, true);
        }
      } else if (ground > 0) { // missing wheel: that corner scrapes the floor
        const mu = 0.5, me = m / n, mx = mu * load * DT;
        let jx = -v.x * me, jy = -v.y * me; const L = Math.hypot(jx, jy); if (L > mx) { jx *= mx / L; jy *= mx / L; }
        b.applyLinearImpulse(V(jx, jy), p, true);
        if (Math.hypot(v.x, v.y) > 0.6 && S.step % 4 === 0) S.fx.push({ type: 'scrape', x: p.x, y: p.y });
      }
      if (ground > 0 && alivePart(s.wheel) && (Math.abs(vl) > 0.9 || s.slip) && S.step % 2 === 0) S.fx.push({ type: 'skid', x: p.x, y: p.y, a: b.getAngle(), id: R.id });
    }
  }

  // ---------- AI ----------
  function think(S, R) {
    const b = R.body, p = b.getPosition(), a = b.getAngle(), E = R.enemy;
    if (!R.alive) { R.ctl.L = R.ctl.R = 0; return; }
    const ep = E.body.getPosition(), ev = E.body.getLinearVelocity();
    const dx = ep.x - p.x, dy = ep.y - p.y, dist = Math.hypot(dx, dy) || 0.001;
    const w = R.spec.weapon, W = R.W;
    let tx = ep.x + ev.x * 0.25, ty = ep.y + ev.y * 0.25, speed = 1, face = true;
    const ok = weaponOk(R);
    const orbitPt = (r0) => { const ang = Math.atan2(p.y - ep.y, p.x - ep.x) + 0.55 * R.orbit; return [ep.x + Math.cos(ang) * r0, ep.y + Math.sin(ang) * r0]; };
    if (!E.alive) { speed = 0; }
    else if (W.gun || w === 'laser' || w === 'saw' || w === 'mortar' || w === 'flame') {
      const r0 = (w === 'flame' ? 0.9 : w === 'mortar' ? 3.4 : w === 'laser' ? 2.8 : 2.6) + (w !== 'flame' && (E.spec.weapon === 'flame' || E.spec.weapon === 'spinner') ? 0.6 : 0); // gunners keep well clear of flamethrowers and spinners
      if (!ok) { [tx, ty] = [ep.x, ep.y]; } // nothing left but ramming
      else { [tx, ty] = orbitPt(r0); if (Math.abs(dist - r0) < 0.6) speed = 0.6; }
      if (S.step % 360 === R.id * 180) R.orbit = S.rng() < 0.3 ? -R.orbit : R.orbit;
    } else if (w === 'spinner' || w === 'flail') {
      const spun = R.bladeW / R.bladeMax;
      if (ok && spun < 0.65 && dist < 2.6) { [tx, ty] = orbitPt(2.4); }
    } else if (w === 'wedge' || (w === 'crusher' && R.grab)) {
      // push the victim towards the closest hazard (pit, saw, or the wall)
      const hz = nearestHazard(S, ep.x, ep.y);
      const hx = hz[0] - ep.x, hy = hz[1] - ep.y, hl = Math.hypot(hx, hy) || 1;
      if (dist < 1.4) { tx = ep.x + hx / hl * 1.2; ty = ep.y + hy / hl * 1.2; }
      if (w === 'crusher' && R.grab) { tx = p.x + hx / hl * 2; ty = p.y + hy / hl * 2; }
    }
    const HX = HALF - S.sq.x, HY = HALF - S.sq.y;
    // power-up crates: grab one when it is closer to you than to the enemy
    if (S.crates.length && E.alive && !R.grab) { const cr = S.crates[0], dm = Math.hypot(cr.x - p.x, cr.y - p.y), de = Math.hypot(cr.x - ep.x, cr.y - ep.y); const want = cr.type !== 'repair' || R.chassis.hp / R.chassis.maxHp < 0.7; if (want && dm < de * 0.9 && dm < 3.5 && dist > 1.3) { tx = cr.x; ty = cr.y; speed = 1; } }
    // spinners keep the bar off the walls while it spins up
    if ((w === 'spinner' || w === 'flail') && ok && R.bladeW < R.bladeMax * 0.5 && (Math.abs(p.x) > HX - 1.1 || Math.abs(p.y) > HY - 1.1) && dist > 1.2) { tx = p.x * 0.3; ty = p.y * 0.3; }
    // never aim for a point hugging the wall
    if (!(w === 'wedge' && dist < 1.4) && !R.grab) { tx = clamp(tx, -(HX - 0.85), HX - 0.85); ty = clamp(ty, -(HY - 0.85), HY - 0.85); }
    // get out from under a ceiling hammer or off a floor bumper that is about to fire
    if (S.evt && S.evt.warnPts && S.evt.t < S.evt.warn) for (const q of S.evt.warnPts) { const dq = Math.hypot(p.x - q[0], p.y - q[1]); if (dq < q[2] + R.hl + 0.25) { tx = p.x + (p.x - q[0]) / (dq || 1) * 1.5; ty = p.y + (p.y - q[1]) / (dq || 1) * 1.5; speed = 1; } }
    // keep clear of floor saws that are up (unless shoving the enemy onto one)
    for (const sw of S.sawState) { const ds = Math.hypot(p.x - sw.x, p.y - sw.y); if ((sw.up || (sw.t % 4) > 3.3) && ds < sw.r + R.hl + 0.7 && !(w === 'wedge' && dist < 1.4)) { tx = p.x + (p.x - sw.x) / ds * 1.5; ty = p.y + (p.y - sw.y) / ds * 1.5; } }
    // flipped and can self-right? do it
    if (R.flipped && (w === 'flipper' || w === 'hammer') && R.wmotor && R.wmotor.hp > 0 && R.airborne <= 0) {
      R.selfRight += DT; if (R.selfRight > 0.9) { R.flipped = false; R.selfRight = 0; R.airborne = 0.3; if (w === 'flipper') R.gas = Math.max(0, R.gas - 1); say(S, `${R.name} self-rights with its ${w === 'flipper' ? 'flipper' : 'axe'}`, R.id); }
    }
    // path round the pit instead of dancing on its edge: if the straight line to the target crosses it, aim for a point beside it
    if (S.arena.pit && !R.grab) {
      const sx = tx - p.x, sy = ty - p.y, sl = Math.hypot(sx, sy) || 1, tt = clamp(-(p.x * sx + p.y * sy) / (sl * sl), 0, 1), cx = p.x + sx * tt, cy = p.y + sy * tt;
      if (Math.hypot(cx, cy) < PIT + 0.55 && Math.hypot(p.x, p.y) > PIT + 0.4) {
        const am = Math.atan2(p.y, p.x), at = Math.atan2(ty, tx), sg = wrap(at - am) >= 0 ? 1 : -1, wa = am + sg * 0.85, rr = PIT + 1.15;
        tx = Math.cos(wa) * rr; ty = Math.sin(wa) * rr; speed = 1;
      }
    }
    // stay out of the pit
    if (S.arena.pit) {
      const v = b.getLinearVelocity(), lx = p.x + v.x * 0.45 + Math.cos(a) * 0.3, ly = p.y + v.y * 0.45 + Math.sin(a) * 0.3;
      if (Math.max(Math.abs(lx), Math.abs(ly)) < PIT + 0.4 || Math.max(Math.abs(p.x), Math.abs(p.y)) < PIT + 0.55) { const away = Math.atan2(p.y, p.x); tx = p.x + Math.cos(away) * 2; ty = p.y + Math.sin(away) * 2; speed = 1; }
    }
    // stuck against a wall or in a corner: head for the middle for a moment and swap orbit direction
    const vv0 = b.getLinearVelocity(), sp0 = Math.hypot(vv0.x, vv0.y);
    if (R.escape > 0) { R.escape -= DT; tx = p.x * 0.2; ty = p.y * 0.2; speed = 1; }
    else if ((Math.abs(p.x) > HX - 0.75 || Math.abs(p.y) > HY - 0.75) && sp0 < 0.3 && !R.grab && !(dist < R.hl + E.hl + 0.9 && w === "wedge")) { R.wallT = (R.wallT || 0) + DT; if (R.wallT > 1.5) { R.escape = 1.1; R.wallT = 0; R.orbit = -R.orbit; } }
    else R.wallT = 0;
    let err = wrap(Math.atan2(ty - p.y, tx - p.x) - a);
    let fwdC;
    // gunners may back up instead of turning around
    let rev = false;
    if (Math.abs(err) > 2.2 && (W.gun || w === 'laser' || w === 'mortar' || w === 'saw') && Math.hypot(tx - p.x, ty - p.y) < 2) { rev = true; err = wrap(err + Math.PI); }
    const turn = clamp(err * 2.2, -1, 1);
    fwdC = clamp(1 - Math.abs(err) / 1.1, -0.2, 1) * speed * (rev ? -1 : 1);
    let L = fwdC + turn, Rr = fwdC - turn;
    const mx = Math.max(1, Math.abs(L), Math.abs(Rr)); L /= mx; Rr /= mx;
    // unstick: pushing hard but not moving -> back off and turn
    const sp = Math.hypot(b.getLinearVelocity().x, b.getLinearVelocity().y);
    // a spinner whose bar got stopped backs off to spin up again
    if (R.backCool > 0) R.backCool -= DT;
    if ((w === 'spinner' || w === 'flail') && ok && R.bladeW < R.bladeMax * 0.35 && dist < R.hl + E.hl + 1.0 && R.unstick <= 0 && !(R.backCool > 0)) { R.unstick = 0.9; R.backCool = 2.5; }
    // close in but nothing is happening (both shoving, no damage): back off and come in again
    const close = dist < R.hl + E.hl + 0.9; if (!close) R.closeSince = null; else if (R.closeSince == null) R.closeSince = S.t;
    if (E.alive && close && S.t - Math.max(R.closeSince, R.lastHit || 0, E.lastHit || 0, R.reengaged || 0) > 2.5 && R.unstick <= 0 && !R.grab && !(w === 'wedge')) { R.unstick = 0.7 + S.rng() * 0.4; R.reengaged = S.t; R.orbit = -R.orbit; }
    const effort = (Math.abs(L) + Math.abs(Rr)) / 2, wv = Math.abs(b.getAngularVelocity());
    if (R.unstick > 0) { R.unstick -= DT; L = -0.9 + (R.orbit > 0 ? 0.6 : 0); Rr = -0.9 + (R.orbit > 0 ? 0 : 0.6); }
    else if (effort > 0.45 && sp < 0.15 && wv < 0.4 && !R.grab) {
      // pushing but going nowhere. Pinning the enemy is allowed for 3 s, otherwise back off after 1 s
      R.stuckT += DT;
      const pinning = dist < R.hl + E.hl + 0.6 && Math.abs(err) < 0.6;
      if (R.stuckT > (pinning ? 2 : 1)) { R.unstick = 0.6 + S.rng() * 0.5; R.stuckT = 0; R.orbit = -R.orbit; }
    } else R.stuckT = Math.max(0, R.stuckT - DT * 0.5);
    // a damaged radio scrambles the commands
    if (R.radio.hp / R.radio.maxHp < 0.45 && S.rng() < 0.004) R.glitch = 0.5 + S.rng();
    if (R.glitch > 0) { R.glitch -= DT; if (!R.glitchCtl || S.step % 30 === 0) R.glitchCtl = [S.rng() * 2 - 1, S.rng() * 2 - 1]; [L, Rr] = R.glitchCtl; }
    R.ctl.L = L; R.ctl.R = Rr;
  }
  function nearestHazard(S, x, y) {
    let best = null, bd = 1e9;
    const cand = [];
    if (S.arena.pit) cand.push([0, 0]);
    for (const s of S.sawState) cand.push([s.x, s.y]);
    if (S.arena.spikes) cand.push([0, -HALF], [0, HALF], [-HALF, 0], [HALF, 0]);
    // the nearest wall
    const wx = x > 0 ? HALF - S.sq.x : -(HALF - S.sq.x), wy = y > 0 ? HALF - S.sq.y : -(HALF - S.sq.y);
    cand.push(Math.abs(wx - x) < Math.abs(wy - y) ? [wx, y] : [x, wy]);
    for (const c of cand) { const d = Math.hypot(c[0] - x, c[1] - y) * (c[0] === 0 && c[1] === 0 ? 0.6 : 1); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  // ---------- weapons ----------
  function weapons(S, R) {
    if (R.cool > 0) R.cool -= DT;
    if (R.flipAnim > 0) R.flipAnim -= DT;
    const b = R.body, E = R.enemy, w = R.spec.weapon, ok = weaponOk(R) && R.alive && (!R.wmotor || R.wmotor.jam <= 0);
    if (R.wmotor && R.wmotor.jam > 0) R.wmotor.jam -= DT;
    const pw = power(R);
    const fwd = b.getWorldVector(V(1, 0)), pos = b.getPosition();
    const front = (dx, dy) => b.getWorldPoint(V(R.hl + dx, dy));
    if (w === 'flail') {
      if (R.joint && R.ball && R.ball.attached) {
        const mf = R.wmotor.hp > 0 ? (R.wmotor.hp / R.wmotor.maxHp < 0.4 ? 0.6 : 1) : 0;
        R.joint.setMotorSpeed(ok ? R.bladeMax * mf * Math.min(1, pw) * (R.rage > 0 ? 1.2 : 1) : 0); R.joint.setMaxMotorTorque(ok ? 60 * Math.min(1, pw) : 3);
        R.bladeW = Math.abs(R.flailArm.getAngularVelocity() - b.getAngularVelocity());
      } else R.bladeW = 0;
      return;
    }
    if (w === 'glove') {
      if (R.punch > 0) R.punch -= DT;
      if (!ok || R.cool > 0 || !E.alive) return;
      const pts = [front(0.42, 0), front(0.42, 0.14), front(0.42, -0.14), front(0.26, 0)];
      const target = pts.map(q => topPartAt(S, q.x, q.y, R)).find(Boolean);
      if (target) {
        const T = target.robot, m = clamp(R.body.getMass() / T.body.getMass(), 0.6, 1.6), imp = 120 * m * ARC.knock * (R.rage > 0 ? 1.3 : 1);
        T.body.applyLinearImpulse(V(fwd.x * imp, fwd.y * imp), T.body.getWorldCenter(), true);
        T.body.applyAngularImpulse((S.rng() - 0.5) * 25, true);
        launch(S, T, 0.3 + 0.15 * m, R); T.flipChance = Math.min(T.flipChance || 0, 0.15);
        b.applyLinearImpulse(V(-fwd.x * imp * 0.25, -fwd.y * imp * 0.25), b.getWorldCenter(), true);
        const q = pts[0], lp = target.body.getLocalPoint(q);
        hit(S, target, 22, { src: R, cause: 'glove', lp: [lp.x, lp.y], blp: target.body === T.body ? [lp.x, lp.y] : null, x: q.x, y: q.y, dir: [fwd.x, fwd.y], pen: 0.9 });
        R.cool = 1.3; R.punch = 0.22; S.fx.push({ type: 'punch', x: q.x, y: q.y, power: 30 });
        say(S, `${R.name} punches ${T.name} across the arena`, R.id);
      }
      return;
    }
    if (w === 'spear') {
      if (R.dash > 0) R.dash -= DT;
      if (!ok || R.cool > 0 || !E.alive) return;
      const ep2 = E.body.getPosition(), d2 = Math.hypot(ep2.x - pos.x, ep2.y - pos.y), er = Math.abs(wrap(Math.atan2(ep2.y - pos.y, ep2.x - pos.x) - b.getAngle()));
      if (d2 > 1.0 && d2 < 2.8 && er < 0.18) { const m = b.getMass(); b.applyLinearImpulse(V(fwd.x * m * 3.2, fwd.y * m * 3.2), b.getWorldCenter(), true); R.dash = 0.6; R.cool = 2.6; S.fx.push({ type: 'dash', robot: R.id }); }
      return;
    }
    if (w === 'spinner') {
      if (R.joint) {
        const mf = R.wmotor.hp > 0 ? (R.wmotor.hp / R.wmotor.maxHp < 0.4 ? 0.6 : 1) : 0;
        const target = ok ? R.bladeMax * mf * Math.min(1, pw) * (R.blade.state === 'bent' ? 0.8 : 1) : 0;
        R.joint.setMotorSpeed(target); R.joint.setMaxMotorTorque(ok ? 16 * Math.min(1, pw) : 0.6);
        R.bladeW = Math.abs(R.blade.body.getAngularVelocity() - b.getAngularVelocity());
        if (R.wmotor.hp > 0 && ok) R.wmotor.heat += 1.2 * DT;
        if (R.blade.state === 'bent' && R.bladeW > 10) { // imbalance shakes the robot
          const imb = (1 - R.blade.hp / R.blade.maxHp) * 0.035, F = Math.min(900, R.blade.mass * R.bladeW * R.bladeW * imb), ba = R.blade.body.getAngle();
          b.applyForce(V(Math.cos(ba) * F, Math.sin(ba) * F), R.blade.body.getPosition(), true);
        }
      } else R.bladeW = 0;
      return;
    }
    if (w === 'drum') { if (ok) R.drumE = Math.min(1, R.drumE + DT / 1.6 * Math.min(1, pw)); else R.drumE = Math.max(0, R.drumE - DT / 3); return; }
    if (!E.alive && !R.grab) return;
    if (w === 'flipper') {
      if (!ok || R.cool > 0 || R.gas <= 0) return;
      if (E.flipped && !E.W.invert && !E.W.invertDrive) return; // already helpless on its back: don't flip it back over
      const pts = [front(0.31, 0), front(0.31, R.hw * 0.6), front(0.31, -R.hw * 0.6)];
      const target = pts.map(q => topPartAt(S, q.x, q.y, R)).find(Boolean);
      if (target) {
        const T = target.robot, m = clamp(R.body.getMass() / T.body.getMass(), 0.6, 1.5);
        T.body.applyLinearImpulse(V(fwd.x * 68 * m, fwd.y * 68 * m), T.body.getWorldCenter(), true);
        T.body.applyAngularImpulse((S.rng() - 0.5) * 40, true);
        launch(S, T, 0.55 + 0.4 * m * S.rng(), R);
        const lp = target.body.getLocalPoint(pts[0]);
        hit(S, target, 6, { src: R, cause: 'flipper', lp: [lp.x, lp.y], x: pts[0].x, y: pts[0].y });
        R.gas--; R.cool = 2.2; R.flipAnim = 0.35;
        say(S, `${R.name} flips ${T.name} into the air` + (R.gas <= 3 ? ` (${R.gas} gas left)` : ''), R.id);
      }
      return;
    }
    if (w === 'hammer') {
      if (R.swing > 0) {
        R.swing -= DT;
        if (R.swing <= 0) { // the axe lands
          const q = front(0.32, 0), target = topPartAt(S, q.x, q.y, R);
          if (target) {
            const lp = target.body.getLocalPoint(q);
            hit(S, target, 34 * Math.min(1, pw), { src: R, cause: 'hammer', top: true, lp: [lp.x, lp.y], blp: target.body === target.robot.body ? [lp.x, lp.y] : null, x: q.x, y: q.y, pen: 1.4 });
            target.robot.lifted = 0.3;
            S.fx.push({ type: 'spark', x: q.x, y: q.y, power: 50 });
          } else S.fx.push({ type: 'thud', x: q.x, y: q.y });
          R.cool = 1.0; R.recover = 0.6;
        }
        return;
      }
      if (R.recover > 0) { R.recover -= DT; return; }
      if (!ok || R.cool > 0) return;
      const q = front(0.32, 0); if (topPartAt(S, q.x, q.y, R)) { R.swing = 0.2; }
      return;
    }
    if (w === 'crusher') {
      if (R.grab) {
        const g = R.grab; g.t -= DT;
        const q = front(0.3, 0), target = topPartAt(S, q.x, q.y, R);
        if (ok && target && target.robot === g.robot) {
          const lp = target.body.getLocalPoint(q);
          hit(S, target, 36 * DT * Math.min(1, pw), { src: R, cause: 'crusher', top: true, lp: [lp.x, lp.y], blp: target.body === target.robot.body ? [lp.x, lp.y] : null, x: q.x, y: q.y, pen: 1.5, ignoreThr: true });
        }
        if (g.t <= 0 || !ok || !g.robot.alive && g.t < 1.5) { if (g.joint) S.world.destroyJoint(g.joint); R.grab = null; R.cool = 1.8; }
        return;
      }
      if (!ok || R.cool > 0) return;
      const q = front(0.3, 0), target = topPartAt(S, q.x, q.y, R);
      if (target && target.robot.airborne <= 0) {
        // reaching for a spinning drum or bar: the jaws get kicked away instead
        if (target.key === 'drum' && target.robot.drumE > 0.3) { R.cool = 0.8; drumKick(S, target.robot, R.tool); return; }
        if (target.key === 'blade' && target.robot.bladeW > 25) { R.cool = 0.8; return; }
        const joint = S.world.createJoint(pl.WeldJoint({ frequencyHz: 6, dampingRatio: 0.7 }, b, target.robot.body, q));
        R.grab = { robot: target.robot, joint, t: 2.6 };
        say(S, `${R.name} grabs ${target.robot.name}'s ${target.label.toLowerCase()}`, R.id);
      }
      return;
    }
    if (w === 'wedge') return;
    // turret weapons
    if (!R.turret) return;
    const E2 = E.body.getPosition(), ev = E.body.getLinearVelocity();
    const dist = Math.hypot(E2.x - pos.x, E2.y - pos.y);
    const gun = R.W.gun;
    const lead = gun ? dist / gun.speed : w === 'mortar' ? 1.1 : w === 'saw' ? dist / 11 : 0;
    const ax = E2.x + ev.x * lead, ay = E2.y + ev.y * lead;
    const want = Math.atan2(ay - pos.y, ax - pos.x);
    const tr = (R.turret.hp / R.turret.maxHp < 0.4 ? 1.4 : 3.2) * DT;
    R.turretA += clamp(wrap(want - R.turretA), -tr, tr);
    // a turret with no body rotation is in body space; keep it world-based but drag it a bit with the body
    R.turretA += b.getAngularVelocity() * DT * 0.3;
    const aimErr = Math.abs(wrap(want - R.turretA));
    R.beam = null; R.flameOn = Math.max(0, R.flameOn - DT);
    if (!ok) return;
    const ta = R.turretA, dx = Math.cos(ta), dy = Math.sin(ta);
    const muzzle = [pos.x + dx * 0.25, pos.y + dy * 0.25];
    const wobble = R.turret.hp / R.turret.maxHp < 0.5 ? 2 : 1;
    if (gun) {
      if (R.cool > 0 || aimErr > 0.18 || dist > gun.range + 0.6) return;
      if (R.turret.hp / R.turret.maxHp < 0.4 && S.rng() < 0.15) { R.cool = 1.2; say(S, `${R.name}: gun jams`, R.id); return; }
      const sa = ta + (S.rng() - 0.5) * 2 * gun.spread * wobble;
      S.projs.push({ x: muzzle[0], y: muzzle[1], vx: Math.cos(sa) * gun.speed, vy: Math.sin(sa) * gun.speed, dmg: gun.dmg, owner: R, cause: w, life: 0.6, r: gun.r, kick: gun.kick || 2 });
      R.cool = 1 / gun.rate; R.muzzle = 0.06;
      if (gun.kick) b.applyLinearImpulse(V(-dx * gun.kick * 0.4, -dy * gun.kick * 0.4), pos, true);
      return;
    }
    if (w === 'laser') {
      if (aimErr > 0.12 || dist > 4.6) return;
      const end = [muzzle[0] + dx * 4.6, muzzle[1] + dy * 4.6];
      const h = ray(S, muzzle, end, R.group);
      R.beam = { x0: muzzle[0], y0: muzzle[1], x1: h ? h.x : end[0], y1: h ? h.y : end[1] };
      if (h && h.part) {
        const lp = h.part.body.getLocalPoint(V(h.x, h.y));
        hit(S, h.part, 14 * DT * Math.min(1, pw), { src: R, cause: 'laser', lp: [lp.x, lp.y], blp: h.part.attached && h.part.body === h.part.robot.body ? [lp.x, lp.y] : null, x: h.x, y: h.y, ignoreThr: true, pen: 1.2 });
        h.part.heat += 30 * DT;
        if (S.step % 6 === 0) S.fx.push({ type: 'scorch', x: h.x, y: h.y, r: 0.03 });
      }
      return;
    }
    if (w === 'flame') {
      if (aimErr > 0.35 || dist > 1.8) return;
      R.flameOn = 0.1;
      for (let i = -3; i <= 3; i++) {
        const fa = ta + i * 0.11, end = [muzzle[0] + Math.cos(fa) * 1.5, muzzle[1] + Math.sin(fa) * 1.5];
        const h = ray(S, muzzle, end, R.group);
        if (h && h.part && h.part.attached) {
          h.part.heat += 6 * DT; const lp = h.part.body.getLocalPoint(V(h.x, h.y));
          hit(S, h.part, 1.0 * DT, { src: R, cause: 'flame', ignoreThr: true, noPen: true }); h.part.robot.lastHeater = R;
          // heat soaks through to the parts inside
          if (h.part.robot && h.part.body === h.part.robot.body) { const inn = nearestInternal(h.part.robot, [lp.x, lp.y]); if (inn) inn.heat += 2.2 * DT; }
        }
      }
      return;
    }
    if (w === 'mortar') {
      if (R.cool > 0 || aimErr > 0.2 || dist < 1.4) return;
      const tx = ax + (S.rng() - 0.5) * 0.5 * wobble, ty = ay + (S.rng() - 0.5) * 0.5 * wobble;
      S.shells.push({ x0: muzzle[0], y0: muzzle[1], x1: tx, y1: ty, t: 0, T: 1.1, owner: R });
      R.cool = 2.2; R.muzzle = 0.1;
      return;
    }
    if (w === 'saw') {
      if (R.cool > 0 || aimErr > 0.15 || dist > 5) return;
      const body = S.world.createBody({ type: 'dynamic', position: V(muzzle[0] + dx * 0.1, muzzle[1] + dy * 0.1), bullet: true, linearDamping: 0.15, angularDamping: 0 });
      const disc = { owner: R, hits: 0, power: 1, dead: false, life: 4, body };
      body.createFixture({ shape: pl.Circle(0.085), density: 30, restitution: 0.85, friction: 0.05, filterGroupIndex: R.group, userData: { disc } });
      body.setLinearVelocity(V(dx * 11, dy * 11)); body.setAngularVelocity(40);
      S.discs.push(disc); R.cool = 1.1;
    }
  }
  function ray(S, a, b, group) {
    let best = null;
    S.world.rayCast(V(a[0], a[1]), V(b[0], b[1]), (fx, pt, n, frac) => {
      if (fx.getFilterGroupIndex() === group && group !== 0) return -1;
      const u = fx.getUserData() || {}; if (u.disc) return -1;
      best = { x: pt.x, y: pt.y, part: u.part || null, wall: !!u.wall, frac };
      return frac;
    });
    return best;
  }

  function projectiles(S) {
    for (const pr of S.projs) {
      const nx = pr.x + pr.vx * DT, ny = pr.y + pr.vy * DT;
      const h = ray(S, [pr.x, pr.y], [nx, ny], pr.owner.group);
      pr.px = pr.x; pr.py = pr.y;
      if (h) {
        pr.dead = true;
        if (h.part) {
          const b = h.part.body, lp = b.getLocalPoint(V(h.x, h.y)), sp = Math.hypot(pr.vx, pr.vy);
          b.applyLinearImpulse(V(pr.vx / sp * pr.kick, pr.vy / sp * pr.kick), V(h.x, h.y), true);
          hit(S, h.part, pr.dmg, { src: pr.owner, cause: pr.cause, lp: [lp.x, lp.y], blp: h.part.attached && b === h.part.robot.body ? [lp.x, lp.y] : null, x: h.x, y: h.y, dir: [pr.vx / sp, pr.vy / sp], pen: pr.cause === 'heavy' ? 1.3 : 0.8 });
        }
        S.fx.push({ type: 'spark', x: h.x, y: h.y, power: pr.dmg * 1.5, small: true });
      } else { pr.x = nx; pr.y = ny; }
      pr.life -= DT; if (pr.life <= 0) pr.dead = true;
    }
    S.projs = S.projs.filter(p => !p.dead);
    for (const s of S.shells) {
      s.t += DT;
      if (s.t >= s.T) { s.dead = true; explode(S, s.x1, s.y1, s.owner); }
    }
    S.shells = S.shells.filter(s => !s.dead);
    for (const d of S.discs) { d.life -= DT; if (d.life <= 0 || d.dead) { S.world.destroyBody(d.body); d.gone = true; } }
    S.discs = S.discs.filter(d => !d.gone);
  }
  function explode(S, x, y, owner) {
    const R0 = 0.85;
    S.fx.push({ type: 'boom', x, y, power: 26 }); S.fx.push({ type: 'scorch', x, y, r: 0.32 });
    const seen = new Set();
    S.world.queryAABB(pl.AABB(V(x - R0, y - R0), V(x + R0, y + R0)), fx => {
      const u = fx.getUserData(); if (!u || !u.part) return true;
      const part = u.part, b = part.body, c = centroid(part.verts), wp = b.getWorldPoint(V(c[0], c[1]));
      const d = Math.hypot(wp.x - x, wp.y - y); if (d > R0) return true;
      const f = 1 - d / R0;
      const L = d || 1; b.applyLinearImpulse(V((wp.x - x) / L * 45 * f, (wp.y - y) / L * 45 * f), wp, true);
      if (part.attached && !seen.has(part)) { seen.add(part); hit(S, part, 15 * f, { src: owner, cause: 'mortar', top: true, lp: c, blp: b === part.robot.body ? c : null, x: wp.x, y: wp.y, pen: 1 }); }
      return true;
    });
    for (const R of S.robots) { const p = R.body.getPosition(); if (Math.hypot(p.x - x, p.y - y) < R0 * 0.7) R.lifted = Math.max(R.lifted, 0.3); }
  }

  // ---------- heat, fire, hazards, airtime ----------
  function heatAndHazards(S) {
    for (const R of S.robots) {
      const all = R.parts.concat(R.internals);
      for (const p of all) {
        if (p.heat > 0) {
          if (p.heat > 75 && (p.hp > 0)) hit(S, p, (p.heat - 75) * 0.3 * DT, { cause: 'heat', src: R.lastHeater || null, noPen: true });
          p.heat = Math.max(0, p.heat - (p.kind === 'internal' ? 2.5 : 9) * DT);
          if (p.heat > 120) p.heat = 120;
        }
      }
      // battery fire
      const bt = R.battery;
      if (bt.hp > 0 && !bt.fire && ((bt.heat > 70) || (bt.hp / bt.maxHp < 0.3 && S.rng() < 0.0015))) { bt.fire = 4 + S.rng() * 4; say(S, `${R.name}: battery is on fire!`, R.id, true); }
      if (bt.fire) { bt.fire -= DT; bt.heat = Math.max(bt.heat, 60); hit(S, bt, 2.2 * DT, { cause: 'fire', src: R.lastHeater || null, noPen: true }); for (const q of R.internals) if (q !== bt) q.heat += 4 * DT; if (bt.fire <= 0) bt.fire = 0; }
      for (const s of R.slots) if (s.motor.stuck > 0) s.motor.stuck -= DT;
      if (R.nitro > 0) R.nitro -= DT; if (R.over > 0) R.over -= DT; if (R.rage > 0) R.rage -= DT;
      if (R.shieldT > 0) { R.shieldT -= DT; if (R.shieldT <= 0) R.shield = 0; }
      R.hype = Math.max(0, (R.hype || 0) - 1.5 * DT);
      // pick up a crate
      if (R.alive && R.airborne <= 0) for (const cr of S.crates) { const pp = R.body.getPosition(); if (!cr.taken && Math.hypot(pp.x - cr.x, pp.y - cr.y) < R.hl + 0.2) pickUp(S, R, cr); }
      // in the air
      if (R.airborne > 0) {
        R.airborne -= DT;
        if (R.airborne <= 0) { // landing
          R.airborne = 0;
          const hard = R.airMax;
          if (hard > 0.35) {
            const n = 1 + Math.floor(S.rng() * 2);
            for (let i = 0; i < n; i++) { const cand = R.parts.filter(p => p.attached && p.body === R.body); const p = cand[Math.floor(S.rng() * cand.length)]; if (p) hit(S, p, hard * 22, { cause: 'landing', src: R.enemy, lp: centroid(p.verts), blp: centroid(p.verts) }); }
            S.fx.push({ type: 'thud', x: R.body.getPosition().x, y: R.body.getPosition().y, power: hard });
          }
          if (S.rng() < (R.flipChance || 0)) { R.flipped = !R.flipped; if (R.flipped) say(S, `${R.name} lands upside down` + (R.W.invert ? ', keeps driving' : R.W.invertDrive ? ', drives on but the weapon points at the floor' : ', weapon is useless now'), R.id, true); }
          R.airMax = 0; R.flipChance = 0;
        }
      }
      if (R.lifted > 0) R.lifted -= DT;
      // pit
      if (S.arena.pit && R.airborne <= 0 && !R.inPit) {
        const p = R.body.getPosition();
        if (Math.abs(p.x) < PIT && Math.abs(p.y) < PIT) { R.inPit = S.t; R.body.setLinearVelocity(V(0, 0)); R.body.setAngularVelocity(0); R.body.setType('static'); if (R.blade) { R.blade.body.setType('static'); } if (R.ball) { R.ball.body.setType('static'); R.flailArm.setType('static'); } ko(S, R, 'fell into the pit'); }
      }
      // count-out: no way left to drive
      if (R.alive && R.flipped && !R.W.invert && R.airborne <= 0 && !(R.spec.weapon === 'hammer' && R.wmotor.hp > 0) && S.rng() < 0.12 * DT) { R.flipped = false; R.airborne = 0.25; say(S, `${R.name} wriggles back onto its wheels`, R.id); }
      if (R.alive) { if (!canDrive(R) || power(R) <= 0) { R.noDrive += DT; if (R.noDrive > 6) ko(S, R, R.flipped && !R.W.invert && !R.W.invertDrive ? 'stuck upside down, counted out' : 'immobilised (no working wheels), counted out'); } else R.noDrive = 0; }
      // refs count out a robot that shows no controlled movement for 12 s (not while it is being pinned or attacked up close)
      if (R.alive && S.step % 120 === 0) {
        const q = R.body.getPosition(); (R.trail = R.trail || []).push([q.x, q.y]); if (R.trail.length > 13) R.trail.shift();
        const eq = R.enemy.body.getPosition(), near = Math.hypot(eq.x - q.x, eq.y - q.y) < R.hl + R.enemy.hl + 0.7;
        const crippled = R.slots.some(s2 => !(alivePart(s2.wheel) && s2.motor.hp > 0));
        if (R.trail.length === 13 && crippled && !near && !R.grab) { let mx = 0; for (const t of R.trail) mx = Math.max(mx, Math.hypot(t[0] - q.x, t[1] - q.y)); if (mx < 0.45) ko(S, R, 'crippled, no controlled movement for 12 s, counted out'); }
      }
      // aggression for the judges: closing in on the enemy
      if (R.alive && R.enemy.alive) { const p = R.body.getPosition(), q = R.enemy.body.getPosition(), v = R.body.getLinearVelocity(), dx = q.x - p.x, dy = q.y - p.y, dd = Math.hypot(dx, dy) || 1; if (dd < 1.8 && (v.x * dx + v.y * dy) / dd > 0.25) R.stats.aggr = (R.stats.aggr || 0) + DT; }
    }
    S.crates = S.crates.filter(c => !c.taken && (c.life -= DT) > 0);
    if (ARC.crates && !S.over && S.t >= S.nextCrate) { S.nextCrate = S.t + 13 + S.rng() * 6; spawnCrate(S); }
    if (ARC.events && !S.over) arenaEvents(S);
    // floor saws: up 2 s, down 2 s
    for (const s of S.sawState) {
      s.t += DT; const ph = s.t % 4; s.up = ph < 1.5; s.spin += DT * (s.up ? 40 : 4);
      if (!s.up || S.step % 6) continue;
      for (const part of partsAt(S, s.x, s.y, s.r, null)) {
        const R = part.robot; if (R.airborne > 0 || !part.attached) continue;
        const c = centroid(part.verts), wp = part.body.getWorldPoint(V(c[0], c[1]));
        if (Math.hypot(wp.x - s.x, wp.y - s.y) > s.r + 0.08) continue;
        hit(S, part, 1.1, { cause: 'floorsaw', lp: c, blp: part.body === R.body ? c : null, x: wp.x, y: wp.y, ignoreThr: true, src: R.enemy });
        part.body.applyLinearImpulse(V((S.rng() - 0.5) * 30, (S.rng() - 0.5) * 30), wp, true);
        R.lifted = Math.max(R.lifted, 0.2);
        S.fx.push({ type: 'spark', x: wp.x, y: wp.y, power: 20 });
      }
    }
    // debris over the pit falls in; loose wheels roll
    for (const d of S.debris) {
      if (d.gone) continue;
      const b = d.body, p = b.getPosition();
      if (S.arena.pit && Math.abs(p.x) < PIT && Math.abs(p.y) < PIT) { d.gone = true; d.fellT = S.t; S.world.destroyBody(b); continue; }
      if (d.wheelRoll) { // a loose wheel keeps rolling along its own axis
        const right = b.getWorldVector(V(0, 1)), v = b.getLinearVelocity(), vl = v.x * right.x + v.y * right.y;
        const j = -vl * b.getMass() * 0.25; b.applyLinearImpulse(V(right.x * j, right.y * j), b.getWorldCenter(), true);
        const fwd = b.getWorldVector(V(1, 0)); d.spin = (d.spin || 0) + (v.x * fwd.x + v.y * fwd.y) * DT / 0.07;
      }
    }
    S.debris = S.debris.filter(d => !d.gone || d.fellT);
  }

  // ---------- power-ups ----------
  const CRATES = [['nitro', 3], ['overcharge', 3], ['repair', 2], ['shield', 2]];
  function spawnCrate(S) {
    for (let k = 0; k < 25; k++) {
      const lim = Math.min(HALF - S.sq.x, HALF - S.sq.y) - 1.1, x = (S.rng() * 2 - 1) * lim, y = (S.rng() * 2 - 1) * lim;
      if (S.arena.pit && Math.abs(x) < PIT + 0.6 && Math.abs(y) < PIT + 0.6) continue;
      if (S.robots.some(R => { const p = R.body.getPosition(); return Math.hypot(p.x - x, p.y - y) < 1.2; })) continue;
      if (S.sawState.some(sw => Math.hypot(sw.x - x, sw.y - y) < 0.9)) continue;
      let r = S.rng() * 10, type = 'nitro'; for (const [t, wgt] of CRATES) { if ((r -= wgt) < 0) { type = t; break; } }
      S.crates.push({ x, y, type, life: 12, t0: S.t }); S.fx.push({ type: 'crate', x, y }); say(S, `A ${type} crate drops into the arena`, null); return;
    }
  }
  function pickUp(S, R, cr) {
    cr.taken = true; const p = R.body.getPosition();
    if (cr.type === 'nitro') { R.nitro = 5; callout(S, 'NITRO!', p.x, p.y, true); }
    else if (cr.type === 'overcharge') { R.over = 6; callout(S, 'OVERCHARGE!', p.x, p.y, true); }
    else if (cr.type === 'shield') { R.shield = 60; R.shieldT = 10; callout(S, 'SHIELD!', p.x, p.y, true); }
    else { R.chassis.hp = Math.min(R.chassis.maxHp, R.chassis.hp + R.chassis.maxHp * 0.35); for (const q of R.internals) if (q.hp > 0) { q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.3); q.heat = 0; } for (const q of R.parts) if (q.attached && q.hp > 0) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.4); R.battery.fire = 0; callout(S, 'REPAIRED!', p.x, p.y, true); }
    say(S, `${R.name} grabs the ${cr.type} crate`, R.id, true); S.fx.push({ type: 'pickup', x: cr.x, y: cr.y, kind: cr.type });
  }
  // ---------- arena events: closing walls, floor bumpers, ceiling hammer ----------
  function arenaEvents(S) {
    const sudden = S.t > S.timeLimit - 30;
    if (!S.evt && S.t >= S.nextEvt && !S.robots.some(R => !R.alive)) {
      const types = ['walls', 'bumpers', 'hammer'], type = types[Math.floor(S.rng() * 3)];
      if (type === 'walls') { S.evt = { type, axis: S.rng() < 0.5 ? 'x' : 'y', t: 0, dur: 11 }; callout(S, 'WALLS CLOSING!', 0, 0, true); say(S, 'Arena: the walls are closing in!', null, true); }
      else if (type === 'bumpers') { const pts = []; for (let k = 0; k < 4; k++) { const R = S.robots[k % 2], p = R.body.getPosition(), v = R.body.getLinearVelocity(); pts.push([clamp(p.x + v.x * 0.8 + (S.rng() - 0.5) * 1.6, -HALF + 0.8, HALF - 0.8), clamp(p.y + v.y * 0.8 + (S.rng() - 0.5) * 1.6, -HALF + 0.8, HALF - 0.8), 0.45]); } S.evt = { type, t: 0, warn: 1.2, dur: 1.8, warnPts: pts }; callout(S, 'FLOOR BUMPERS!', 0, 0, true); say(S, 'Arena: floor bumpers armed', null, true); }
      else { const R = S.robots[S.rng() < 0.5 ? 0 : 1], p = R.body.getPosition(), v = R.body.getLinearVelocity(); S.evt = { type, t: 0, warn: 1.5, dur: 2.1, warnPts: [[clamp(p.x + v.x * 1.2, -HALF + 0.7, HALF - 0.7), clamp(p.y + v.y * 1.2, -HALF + 0.7, HALF - 0.7), 0.6]] }; callout(S, 'CEILING HAMMER!', 0, 0, true); say(S, 'Arena: the ceiling hammer is coming down', null, true); }
    }
    const E = S.evt; if (!E) { for (const w of S.walls) w.body.setLinearVelocity(V(0, 0)); return; }
    E.t += DT;
    if (E.type === 'walls') {
      const t = E.t, want = t < 2.5 ? 1.1 * t / 2.5 : t < 8.5 ? 1.1 : t < 11 ? 1.1 * (11 - t) / 2.5 : 0;
      for (const w of S.walls) { if (w.axis !== E.axis) { w.body.setLinearVelocity(V(0, 0)); continue; } const pos = w.body.getPosition(), cur = w.axis === 'x' ? (w.home[0] - pos.x) * w.sgn : (w.home[1] - pos.y) * w.sgn; const vel = clamp((want - cur) / DT, -0.6, 0.6) * -w.sgn; w.body.setLinearVelocity(w.axis === 'x' ? V(vel, 0) : V(0, vel)); S.sq[w.axis] = Math.max(0, cur); }
      if (t >= E.dur + 0.6) { for (const w of S.walls) w.body.setLinearVelocity(V(0, 0)); S.sq.x = S.sq.y = 0; S.evt = null; }
    } else if (E.type === 'bumpers') {
      if (!E.fired && E.t >= E.warn) { E.fired = true;
        for (const q of E.warnPts) { S.fx.push({ type: 'piston', x: q[0], y: q[1] });
          for (const R of S.robots) { const p = R.body.getPosition(); if (R.airborne <= 0 && !R.inPit && Math.hypot(p.x - q[0], p.y - q[1]) < q[2] + 0.2) { const a = S.rng() * TAU; R.body.applyLinearImpulse(V(Math.cos(a) * 80, Math.sin(a) * 80), R.body.getWorldCenter(), true); R.body.applyAngularImpulse((S.rng() - 0.5) * 40, true); launch(S, R, 0.75, null); R.thrownBy = R.enemy; callout(S, 'SENT FLYING!', p.x, p.y, true); } }
          for (const d of S.debris) if (!d.gone) { const p = d.body.getPosition(); if (Math.hypot(p.x - q[0], p.y - q[1]) < 0.6) d.body.applyLinearImpulse(V((S.rng() - 0.5) * 8, (S.rng() - 0.5) * 8), p, true); } }
      }
      if (E.t >= E.dur) S.evt = null;
    } else if (E.type === 'hammer') {
      if (!E.fired && E.t >= E.warn) { E.fired = true; const [x, y, r] = E.warnPts[0];
        S.fx.push({ type: 'slam', x, y, power: 40 }); S.fx.push({ type: 'scorch', x, y, r: 0.4 });
        S.world.queryAABB(pl.AABB(V(x - r, y - r), V(x + r, y + r)), fx => { const u = fx.getUserData(); if (!u || !u.part) return true; const part = u.part, c = centroid(part.verts), wp = part.body.getWorldPoint(V(c[0], c[1])); if (Math.hypot(wp.x - x, wp.y - y) > r) return true; if (part.attached && !part.robot.inPit) hit(S, part, 30, { cause: 'ceiling', top: true, lp: c, blp: part.body === part.robot.body ? c : null, x: wp.x, y: wp.y, pen: 1.2, src: part.robot.enemy }); else if (!part.attached) part.body.applyLinearImpulse(V((S.rng() - 0.5) * 6, (S.rng() - 0.5) * 6), wp, true); return true; });
        for (const R of S.robots) { const p = R.body.getPosition(); if (Math.hypot(p.x - x, p.y - y) < r + 0.2) R.lifted = Math.max(R.lifted, 0.5); }
      }
      if (E.t >= E.dur) S.evt = null;
    }
    if (!S.evt) S.nextEvt = S.t + (sudden ? 7 : 16 + S.rng() * 6);
  }

  // ---------- main step ----------
  function step(S) {
    if (S.countdown > 0) { S.countdown -= DT; return; }
    for (const R of S.robots) { think(S, R); drive(S, R); weapons(S, R); }
    S.world.step(DT, 8, 3);
    processContacts(S); processBegins(S);
    projectiles(S);
    heatAndHazards(S);
    let guard = 0; while (S.hitQ.length && guard++ < 50) { const q = S.hitQ; S.hitQ = []; for (const h of q) applyHit(S, h); }
    S.t += DT; S.step++;
    for (const R of S.robots) if (R.muzzle > 0) R.muzzle -= DT;
    // end of the fight
    if (!S.over) {
      const [A, B] = S.robots;
      if (!A.alive || !B.alive) {
        if (S.endT == null) S.endT = S.t + 1.5; // let the debris settle a little
        if (S.t >= S.endT) finish(S, !A.alive && !B.alive ? (A.koT <= B.koT ? B : A) : (A.alive ? A : B), 'KO');
      } else if (S.t >= S.timeLimit) {
        const sa = judge(A), sb = judge(B);
        finish(S, sa >= sb ? A : B, 'judges');
      }
    }
  }
  function judge(R) { return R.stats.dealt + R.enemy.stats.lost.length * 12 + (R.stats.aggr || 0) * 3; }
  function finish(S, W, how) {
    S.over = true;
    const L = W.enemy;
    S.result = { winner: W.id, how, text: how === 'KO' ? `${W.name} wins by KO: ${L.name} ${L.ko}` : `Time! Judges pick ${W.name} (${Math.round(judge(W))} to ${Math.round(judge(L))})`, t: S.t };
    say(S, S.result.text, W.id, true);
  }

  function run(opts, maxT = 200) { const S = create(Object.assign({ countdown: 0 }, opts)); while (!S.over && S.t < maxT) { step(S); S.fx.length = 0; } return S; }

  const MARKET_TABLE = { names: ["Buzzkill", "Rumbler", "Popcorn", "Thumper", "Snapjaw", "Peppershot", "Blowtorch", "Haymaker", "Jouster", "Wrecker"], wins: [[null, 52, 62, 68, 46, 60, 54, 68, 52, 51], [48, null, 42, 22, 68, 49, 62, 70, 60, 43], [39, 58, null, 52, 46, 56, 68, 25, 39, 32], [33, 78, 48, null, 35, 59, 66, 58, 58, 44], [54, 32, 54, 65, null, 34, 44, 48, 83, 42], [40, 52, 44, 42, 66, null, 45, 61, 14, 65], [46, 39, 33, 34, 56, 55, null, 33, 58, 43], [32, 30, 75, 42, 52, 39, 68, null, 20, 44], [48, 40, 62, 43, 18, 86, 42, 80, null, 52], [49, 58, 68, 56, 58, 35, 58, 56, 48, null]], fights: 80 };
  const API = { MARKET_TABLE, TUNE, ARC, BUMPERS, frontTool, DT, HALF, PIT, CHASSIS, DRIVES, MOTORS, BATTERIES, WEAPONS, ARENAS, PRESETS, create, step, run, normSpec, weightOf, power, canDrive, weaponOk, centroid, causeLabel, mkRng, judge };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DamageLab = API;
})(typeof window !== 'undefined' ? window : globalThis);
