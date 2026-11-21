// ROBOCUS 2.0 repairs in three zones (Kev, 8 Nov): Drive, Weapon and Body.
// The engine keeps every part's damage (spec.wear, see engine.js wearOf/applyWear); here a crew action
// restores a whole zone. Body heals back to half on its own every Upkeep (lost body parts stay lost).
// Also: a quick strength model for odds and the AI (no fights needed). UMD: browser (window.Repair2) and node.
(function (root) {
  'use strict';
  const L = root.DamageLab || (typeof require !== 'undefined' ? require('./engine.js') : null);
  const LU = root.Lineup || (typeof require !== 'undefined' ? require('./lineup.js') : null);
  const ZONES = [
    { key: 'drive', label: 'Drive', icon: '⚙', d: 'wheels, tracks, drive motors, thruster' },
    { key: 'weapon', label: 'Weapon', icon: '⚔', d: 'the weapon, its motor, turret or arm' },
    { key: 'body', label: 'Body', icon: '⛨', d: 'chassis, armour, top plate, battery, radio, chip, module, drones' },
  ];
  const BAD = 0.7; // a zone counts as damaged when something in it is lost/dead or below 70%
  // the robot as it stands (an engine robot with the wear applied)
  function probe(spec) { return L.create({ a: spec, b: spec, seed: 1 }).robots[0]; }
  // level 4 parts (engine "ROBOCUS 2.0 LEVEL 4"): legs are wheels (Drive); arm segments, booms, discs, the carousel and its tools,
  // the coil, auger, hook and throwing arm are weapon parts or weapon internals (Weapon); the huge chassis is Body
  const WEAPON_INT = new Set(['wmotor', 'turret', 'arm', 'ring', 'reel', 'coil', 'auger', 'rotor', 'carousel', 'tarm', 'winch', 'boom', 'fang', 'hook', 'beakram', 'nozzle', 'smitharm', 'loader', 'launcher', 'intake', 'aircan', 'crane', 'pogo', 'rails', 'caps', 'spool']);
  function zoneOfPart(q) {
    if (q.kind === 'wheel' || q.leg) return 'drive';
    if (q.kind === 'weapon') return 'weapon';
    if (q.kind === 'internal') return q.key === 'motor' || q.key === 'thruster' ? 'drive' : WEAPON_INT.has(q.key) ? 'weapon' : 'body';
    return 'body'; // chassis, armour, lid
  }
  // per zone: health 0..1 (worst part), broken (something lost or dead), damaged (shown on the card), labels
  function zones(spec) {
    const R = probe(spec), w = spec.wear || {}, Z = {};
    for (const z of ZONES) Z[z.key] = { key: z.key, f: 1, broken: false, labels: [], lost: [], mods: [] };
    const f = q => Math.max(0, q.hp) / q.maxHp;
    for (const q of R.parts) { const z = Z[zoneOfPart(q)]; z.labels.push(q.label); if (!q.attached) { z.broken = true; z.f = 0; z.lost.push(q.label); } else z.f = Math.min(z.f, f(q)); }
    for (const q of R.internals) { const z = Z[zoneOfPart(q)]; z.labels.push(q.label); if (q.key === 'module') z.mods.push(q.label); if (q.hp <= 0) { z.broken = true; z.f = 0; z.lost.push(q.label); } else z.f = Math.min(z.f, f(q)); }
    const B = Z.body; B.labels.push('Top plate'); if (!R.lid.attached) { B.broken = true; B.f = 0; B.lost.push('Top plate'); } else B.f = Math.min(B.f, f(R.lid));
    (w.drones || []).forEach((d, i) => { if (d <= 0) { B.broken = true; B.f = 0; B.lost.push('drone ' + (i + 1)); } else B.f = Math.min(B.f, d); });
    if (w.marks) marksIn(R, Z);
    for (const z of Object.values(Z)) z.damaged = z.broken || z.f < BAD || z.marked;
    return Z;
  }
  /* T41 (Kev, 21 Nov: "keep bend until repair"): wear marks (bends, warps, cracks, saw grooves; engine wearOf marks) stay until
   * the zone they are in is repaired. Per zone: mk = how bad, in plain numbers (most bent weapon arm in degrees, warp 0..1 of the
   * most a disc warps, wheels a bent plate drags on, crack length in metres, saw cut depth in metres, a snapped tip), marks = the
   * words for the card ("bent 23°"). A mark the engine would call out in a fight (BENT! WARPED! WHEEL RUB! SAWN OPEN!, a snapped
   * tip, a crack 10 cm or longer) makes the zone count as damaged, so the repair button is there even at full health. */
  const MARK = { bendDeg: 10, warp: 0.27, crack: 0.1 };
  function marksIn(R, Z) {
    const DEG = 180 / Math.PI;
    for (const z of Object.values(Z)) z.mk = { bend: 0, warp: 0, rub: 0, crack: 0, cut: 0, snap: 0, open: 0 };
    for (const q of R.parts) {
      if (!q.attached) continue; const m = Z[zoneOfPart(q)].mk;
      if (q.kinks) for (const k of q.kinks) m.bend = Math.max(m.bend, Math.abs(k.th) * DEG);
      if (q.warp) m.warp = Math.max(m.warp, q.warp / 0.45);
      if (q.cracks) m.crack += q.cracks.reduce((a, c) => a + c.len, 0);
      if (q.grooves) for (const g of q.grooves) { m.cut = Math.max(m.cut, g.depth); if (g.open) m.open = 1; }
      if (q.v0 && q.m0 && q.mass < q.m0 * 0.995 && q.kind === 'weapon') m.snap = 1;   // a piece broke off the weapon (snapped or sawn off)
    }
    for (const sl of R.slots || []) if (sl.rub && sl.rubBy) Z[zoneOfPart(sl.rubBy)].mk.rub++;
    if (R.arm && R.armBend) Z.weapon.mk.bend = Math.max(Z.weapon.mk.bend, Math.abs(R.armBend) * DEG);
    if (R.beakRam && R.beakBend) Z.weapon.mk.bend = Math.max(Z.weapon.mk.bend, Math.abs(R.beakBend) * DEG);
    for (const z of Object.values(Z)) {
      const m = z.mk, t = [];
      if (m.snap) t.push(z.key === 'weapon' ? 'tip broken off' : 'piece broken off');
      if (m.bend >= 3) t.push('bent ' + Math.round(m.bend) + '°');
      if (m.warp >= 0.1) t.push('warped');
      if (m.rub) t.push(m.rub > 1 ? 'plates bent into ' + m.rub + ' wheels' : 'a plate bent into a wheel');
      if (m.open) t.push('sawn open'); else if (m.cut >= 0.01) t.push('saw cuts');
      if (m.crack >= 0.04) t.push('cracked');
      z.marks = t;
      z.marked = !!(m.snap || m.bend >= MARK.bendDeg || m.warp >= MARK.warp || m.rub || m.open || m.crack >= MARK.crack);
    }
  }
  // a crew action: the whole zone back to new (dents on its parts go too)
  function repairZone(spec, key) {
    const w = spec.wear; if (!w) return;
    const Z = zones(spec), labels = new Set(Z[key].labels);
    for (const m of ['parts', 'ints', 'dents', 'marks']) if (w[m]) for (const k of Object.keys(w[m])) if (labels.has(k)) delete w[m][k];   // marks: T41, a repair straightens what it mends
    if (w.marks && !Object.keys(w.marks).length) delete w.marks;
    if (w.lost) w.lost = w.lost.filter(k => !labels.has(k));
    if (key === 'body') { delete w.lid; if (w.drones) w.drones = w.drones.map(() => 1); }
  }
  // every Upkeep for free: body parts that are still there come back to at least half (lv; lost ones stay lost)
  function bodyHeal(spec, lv = 0.5) {
    const w = spec.wear; if (!w) return;
    const R = probe(spec), body = new Set(R.parts.filter(q => zoneOfPart(q) === 'body').map(q => q.label).concat(R.internals.filter(q => zoneOfPart(q) === 'body').map(q => q.label)));
    for (const m of ['parts', 'ints']) if (w[m]) for (const k of Object.keys(w[m])) if (body.has(k) && w[m][k] > 0) w[m][k] = Math.max(lv, w[m][k]);
    for (const k of ['Battery', 'Radio receiver', 'Chassis']) { if (w.ints && w.ints[k] != null) w.ints[k] = Math.max(lv, w.ints[k]); if (w.parts && w.parts[k] != null) w.parts[k] = Math.max(lv, w.parts[k]); }
    if (w.lid != null && w.lid > 0) w.lid = Math.max(lv, w.lid);
    if (w.drones) w.drones = w.drones.map(d => d > 0 ? Math.max(lv, d) : 0);
  }
  // ---- strength model (logit units; one level = 0.62, see docs/robocus-2.0-lineup.md) ----
  // measured: a part closes about one level, a legendary two; damage (tools/damage-lab/wearcost.js):
  // a lost wheel 51%->24%, weapon motor dead 13%, weapon lost 6%, armour/lid/chassis ~48-50%
  // level 4 (docs/robocus-2.0-level4.md): measured about 0.3 above level 3 vs levels 2-3 (59% vs L3) and no more than level 3 vs
  // levels 0-1, so it counts as 4 levels minus L4_OFF (level 3 + 0.27 logits)
  const BOOST_K = 2.85;
  // tuning chips (9 Nov): worth about 1.2 levels on a level 0-1 frame (level 1 + chip vs level 3: 37-43% instead of 22%), less on
  // heavier frames because they overload (engine CHIP_GLITCH); measured with tools/damage-lab/chipfit.js
  // Kev, 15 Nov (parts levelled, docs/robocus-part-levels.md): a chip is worth about 0.9 of a level on a level 0-1 robot, 0.35 on 2-3, nothing on 4
  const CHIP = [0.5, 0.5, 0.2, 0.2, -0.05];   // was 0.55 / 0.55 / 0.25 / 0 / -0.2   // Kev, 9 Nov: lowered (was 0.8 / 0.8 / 0.4): round 6 sims, chip robots won 4-8 points below the bookie's odds
  const LEVEL = 0.62, PART = 0.42, LEG = 0.9,   /* Kev, 15 Nov: measured on the levelled parts: a part about 0.72 of a level, a legendary 1.56 (was 0.62 / 1.24) */ L4_OFF = 0.35, ZONE_COST = { drive: 1.2, weapon: 3.0, body: 0.15 };   // body: see BODY_COST below
  const gradeOf = name => { const r = LU && (LU.ROBOTS[name] || (LU.ROBOTS4 || {})[name]); return r ? r[1] : null; };
  function strength(spec, name, level, parts) {
    const g = gradeOf(name);
    const tuned = LU && LU.TUNED;   // 15 Nov: tuned lineup: every robot of a level is as strong as the level (its grade is what makes it so), and level 4 is a full step
    let s = (level || 0) * LEVEL - (level >= 4 && !tuned ? L4_OFF : 0) + (g && !tuned ? Math.log(g) * 0.6 : 0);
    // level gap test (Lineup.levelBoost, Kev 9 Nov): measured about +0.22 logits per level step for a boost of 8% (2.85 x ln(1 + boost))
    if (LU && LU.levelBoost) s += (level || 0) * BOOST_K * Math.log(1 + LU.levelBoost);
    for (const k of parts || []) if (k) s += LU && LU.PARTS[k] && LU.PARTS[k].kind === 'legendary' ? LEG : LU && LU.PARTS[k] && LU.PARTS[k].kind === 'chip' ? CHIP[Math.min(4, Math.max(0, level || 0))] : PART;
    if (spec && spec.wear) s -= wearCost(spec, name);
    return s;
  }
  /* Kev, 11 Nov: what carried-over damage really costs (tools/damage-lab/wear-study.js: 623 damaged states out of real fights, each
   * sent into 16 fights next to the same robot as new; wear-fit.js). The old flat charge for a broken Body (0.15) was far too low:
   * on average it costs 0.74, and it differs a lot by robot. A dead processor chip ("brain fried": it wanders on backup control)
   * is the worst of it. BODY_COST[robot] = [all armour and the top plate gone, processor chip dead]; in between by pieces lost.
   * Drive: one wheel or motor gone 1.5, two 2.6, three or more 3.4. Weapon gone 3.0 (lab values 1.2 / 2.2 / 3.0 and 2.6, raised below). */
  const BODY_COST = { Angler: [0.8, 0.6], Blacksmith: [0, 1], Bricklayer: [1.0, 1], Buzzkill: [0, 1], Corkscrew: [0, 1.6], Forklift: [0.4, 1.4], Gaucho: [0.3, 1], Grandmaster: [0, 1.1], Gyro: [0, 0.6], Hornet: [1.0, 0.9], Hydra: [0.6, 0.6], Jukebox: [1.0, 1], Lodestone: [0.3, 0.5], Mauler: [1.2, 0.7], Mincer: [0, 1.1], Orbiter: [0, 1], Pincher: [0.1, 1], Pogo: [0, 1], Popcorn: [0.2, 0.6], Railgun: [0.1, 1], Rotisserie: [0.1, 1], Scavenger: [0.3, 1], Scythe: [1.2, 1], Slingshot: [0.2, 1], Snapjaw: [0, 0.9], Tarantula: [0.1, 1.3], Thumper: [1.0, 1.2], Thwacker: [0, 0.9], Trebuchet: [0.3, 1.5], Vertigo: [0.6, 1.1], Whaler: [1.2, 0.7], Wrecker: [1.1, 1], Yoyo: [1.1, 1] };   // 15 Nov: armour re-measured on the tuned lineup (tag-tuned/final.json bodyCost); chip as before, 1 for new robots
  const BODY_DEF = [0.8, 1.0], DRIVE_LOST = [0, 1.5, 2.6, 3.4], DRONE_COST = 0.4, MODULE_COST = 0.4;
  // in whole games (100 AI games, 11 Nov) damaged robots still won 6-9 points less than these lab costs said (they also meet
  // parts and cards): armour x 1.2, a dead chip + 0.6, drive and weapon a step up
  const ARM_K = 1.2, CHIP_ADD = 0.6;
  const bodyCostOf = name => BODY_COST[name] || BODY_DEF;
  function wearCost(spec, name) {
    const Z = zones(spec); let c = 0;
    const d = Z.drive; c += d.broken ? DRIVE_LOST[Math.min(3, Math.max(1, d.lost.length))] : ZONE_COST.drive * Math.max(0, 1 - d.f) * 0.5;
    const w = Z.weapon; c += w.broken ? ZONE_COST.weapon : ZONE_COST.weapon * Math.max(0, 1 - w.f) * 0.8;
    const b = Z.body, bc = bodyCostOf(name);
    if (b.broken) { const chip = b.lost.some(l => /chip/i.test(l)), dr = b.lost.filter(l => /^drone /.test(l)).length, mod = b.lost.filter(l => b.mods.includes(l)).length, arm = b.lost.length - (chip ? 1 : 0) - dr - mod;
      c += ARM_K * bc[0] * Math.min(4, arm) / 4 + (chip ? bc[1] + CHIP_ADD : 0) + dr * DRONE_COST + mod * MODULE_COST; }
    else c += 0.4 * Math.max(0, 1 - b.f);
    return c + markCost(Z);
  }
  // T41: what the wear marks a robot carries cost it (logits), per zone (zones().mk); measured with tools/damage-lab/markcost.js
  const MARK_COST = { bend: 0.02, warp: 0.6, snap: 0.5, rub: 0.4, crack: 1.0, open: 0.3 };
  function markCost(Z) {
    let c = 0;
    for (const z of Object.values(Z)) { const m = z.mk; if (!m || z.broken && z.key !== 'body') continue;
      c += MARK_COST.bend * Math.min(34, m.bend) + MARK_COST.warp * m.warp + MARK_COST.snap * m.snap + MARK_COST.rub * Math.min(2, m.rub) + MARK_COST.crack * Math.min(1, m.crack) + MARK_COST.open * m.open; }
    return c;
  }
  const chipDead = spec => !!(spec && spec.wear && zones(spec).body.lost.some(l => /chip/i.test(l)));
  const winP = (sa, sb) => 1 / (1 + Math.exp(-(sa - sb)));
  const API = { ZONES, zones, repairZone, bodyHeal, zoneOfPart, strength, winP, LEVEL, PART, LEG, L4_OFF, ZONE_COST, BODY_COST, wearCost, chipDead, bodyCostOf, markCost, MARK_COST, MARK };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Repair2 = API;
})(typeof window !== 'undefined' ? window : globalThis);
