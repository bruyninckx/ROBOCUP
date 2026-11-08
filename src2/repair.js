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
  function zoneOfPart(q) {
    if (q.kind === 'wheel') return 'drive';
    if (q.kind === 'weapon') return 'weapon';
    if (q.kind === 'internal') return q.key === 'motor' || q.key === 'thruster' ? 'drive' : q.key === 'wmotor' || q.key === 'turret' || q.key === 'arm' ? 'weapon' : 'body';
    return 'body'; // chassis, armour, lid
  }
  // per zone: health 0..1 (worst part), broken (something lost or dead), damaged (shown on the card), labels
  function zones(spec) {
    const R = probe(spec), w = spec.wear || {}, Z = {};
    for (const z of ZONES) Z[z.key] = { key: z.key, f: 1, broken: false, labels: [], lost: [] };
    const f = q => Math.max(0, q.hp) / q.maxHp;
    for (const q of R.parts) { const z = Z[zoneOfPart(q)]; z.labels.push(q.label); if (!q.attached) { z.broken = true; z.f = 0; z.lost.push(q.label); } else z.f = Math.min(z.f, f(q)); }
    for (const q of R.internals) { const z = Z[zoneOfPart(q)]; z.labels.push(q.label); if (q.hp <= 0) { z.broken = true; z.f = 0; z.lost.push(q.label); } else z.f = Math.min(z.f, f(q)); }
    const B = Z.body; B.labels.push('Top plate'); if (!R.lid.attached) { B.broken = true; B.f = 0; B.lost.push('Top plate'); } else B.f = Math.min(B.f, f(R.lid));
    (w.drones || []).forEach((d, i) => { if (d <= 0) { B.broken = true; B.f = 0; B.lost.push('drone ' + (i + 1)); } else B.f = Math.min(B.f, d); });
    for (const z of Object.values(Z)) z.damaged = z.broken || z.f < BAD;
    return Z;
  }
  // a crew action: the whole zone back to new (dents on its parts go too)
  function repairZone(spec, key) {
    const w = spec.wear; if (!w) return;
    const Z = zones(spec), labels = new Set(Z[key].labels);
    for (const m of ['parts', 'ints', 'dents']) if (w[m]) for (const k of Object.keys(w[m])) if (labels.has(k)) delete w[m][k];
    if (w.lost) w.lost = w.lost.filter(k => !labels.has(k));
    if (key === 'body') { delete w.lid; if (w.drones) w.drones = w.drones.map(() => 1); }
  }
  // every Upkeep for free: body parts that are still there come back to at least half (lost ones stay lost)
  function bodyHeal(spec) {
    const w = spec.wear; if (!w) return;
    const R = probe(spec), body = new Set(R.parts.filter(q => zoneOfPart(q) === 'body').map(q => q.label).concat(R.internals.filter(q => zoneOfPart(q) === 'body').map(q => q.label)));
    for (const m of ['parts', 'ints']) if (w[m]) for (const k of Object.keys(w[m])) if (body.has(k) && w[m][k] > 0) w[m][k] = Math.max(0.5, w[m][k]);
    for (const k of ['Battery', 'Radio receiver', 'Chassis']) { if (w.ints && w.ints[k] != null) w.ints[k] = Math.max(0.5, w.ints[k]); if (w.parts && w.parts[k] != null) w.parts[k] = Math.max(0.5, w.parts[k]); }
    if (w.lid != null && w.lid > 0) w.lid = Math.max(0.5, w.lid);
    if (w.drones) w.drones = w.drones.map(d => d > 0 ? Math.max(0.5, d) : 0);
  }
  // ---- strength model (logit units; one level = 0.62, see docs/robocus-2.0-lineup.md) ----
  // measured: a part closes about one level, a legendary two; damage (tools/damage-lab/wearcost.js):
  // a lost wheel 51%->24%, weapon motor dead 13%, weapon lost 6%, armour/lid/chassis ~48-50%
  const LEVEL = 0.62, PART = 0.62, LEG = 1.24, ZONE_COST = { drive: 1.2, weapon: 2.2, body: 0.15 };
  function strength(spec, name, level, parts) {
    let s = (level || 0) * LEVEL + (LU && LU.ROBOTS[name] ? Math.log(LU.ROBOTS[name][1]) * 0.6 : 0);
    for (const k of parts || []) if (k) s += LU && LU.PARTS[k] && LU.PARTS[k].kind === 'legendary' ? LEG : PART;
    if (spec && spec.wear) { const Z = zones(spec); for (const z of ZONES) { const q = Z[z.key]; s -= ZONE_COST[z.key] * (q.broken ? 1 : Math.max(0, (1 - q.f) * 0.8)); } }
    return s;
  }
  const winP = (sa, sb) => 1 / (1 + Math.exp(-(sa - sb)));
  const API = { ZONES, zones, repairZone, bodyHeal, zoneOfPart, strength, winP, LEVEL, PART, LEG, ZONE_COST };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Repair2 = API;
})(typeof window !== 'undefined' ? window : globalThis);
