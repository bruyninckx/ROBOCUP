// ROBOCUS 2.0 lineup (from the Damage Lab analysis, 8 Nov 2026): robots with their level and power grade,
// the 25 part cards and their 2.0 strengths. Used by the Lineup Arena page and by node scripts.
(function (root) {
  'use strict';
  const L = root.DamageLab || (typeof require !== 'undefined' ? require('./engine.js') : null);
  // power grade p: weapon damage x p and every part's HP x p
  const ROBOTS = {
    Haymaker: [0, 0.761], Rumbler: [0, 0.881], Thumper: [0, 0.935], Jouster: [0, 0.925], Popcorn: [0, 0.947], Blowtorch: [0, 1.037], Buzzkill: [0, 0.971], Snapjaw: [0, 0.963], Wrecker: [0, 1.1],
    Hornet: [1, 0.984], Whirlwind: [1, 1.021], Mincer: [1, 1.137], Scythe: [1, 1.081], Mauler: [1, 1.093], Rocketeer: [1, 1.014],
    Juggernaut: [2, 1.138], Gyro: [2, 1.034], Pincher: [2, 1.185], Brawler: [2, 1.056], Thwacker: [2, 1.022],
    Whaler: [3, 1.136], Forklift: [3, 1.141], Vertigo: [3, 1.163], Sawblast: [3, 1.175], Ramrod: [3, 1.213],
  };
  // level 4 (end game, plan docs/robocus-2.0-level4-plan.md): kept apart so the tabletop's waves and the tier tools don't pick them up; the Lineup Arena merges them in
  const ROBOTS4 = { Hydra: [4, 1.18], Corkscrew: [4, 0.97], Trebuchet: [4, 1.16], Angler: [4, 1.1], Lodestone: [4, 1.01], Orbiter: [4, 1.18], Tarantula: [4, 1.17], Grandmaster: [4, 1.05] };
  const LEVELS = ['Level 0 (starters)', 'Level 1', 'Level 2', 'Level 3'];
  // part strengths (ARC.pk): how strong each part is in 2.0
  const PK = { medic: 0.6, gunner: 1.8, laser: 1.6, bodyguard: 1.8, popper: 1.8, emp: 1.6, repair: 4, shield: 1.5, mines: 1.4, blocker: 1.5, waller: 1.5 };
  const plates = sp => { const a = Object.assign({}, sp.armour); for (const k of ['front', 'side', 'rear', 'top']) if (!(k === 'front' && L.frontTool(sp.weapon))) a[k] = Math.min(3, a[k] + 1); return a; };
  const drone = k => (sp) => ({ helpers: (sp.helpers || []).concat([k]).slice(0, 3) });
  // kind: drone / module / stat / legendary. copies = cards in the deck. vs = win % of a level-n robot with it vs level n+1 (legendary: n+2), stock 38% / 25%
  const PARTS = {
    medic: { name: 'Medic drone', kind: 'drone', copies: 2, vs: 50, d: 'Patches the robot up while it stays close (heals at 60% of the 1.0 medic).', apply: drone('medic') },
    gunner: { name: 'Gun drone', kind: 'drone', copies: 1, vs: 57, d: 'Orbits and shoots the enemy (shots x1.8).', apply: drone('gunner') },
    laser: { name: 'Laser drone', kind: 'drone', copies: 1, vs: 54, d: 'Burns the enemy from 2 m (beam x1.6).', apply: drone('laser') },
    booster: { name: 'Booster drone', kind: 'drone', copies: 1, vs: 56, d: 'Docks on the back and pushes: more speed, push and a nitro kick.', apply: drone('booster') },
    waller: { name: 'Waller drone', kind: 'drone', copies: 1, vs: 51, d: 'Raises energy walls towards the enemy (walls last x1.5).', apply: drone('waller') },
    bodyguard: { name: 'Bodyguard drone', kind: 'drone', copies: 1, vs: 50, d: 'Takes 40% of every hit for its robot (drone HP x1.8).', apply: drone('bodyguard') },
    spotter: { name: 'Spotter drone', kind: 'drone', copies: 1, vs: 48, d: 'Marks weak spots: +25% damage.', apply: drone('spotter') },
    jammer: { name: 'Jammer drone', kind: 'drone', copies: 1, vs: 47, d: 'Slows the enemy weapon and blocks its module.', apply: drone('jammer') },
    blocker: { name: 'Blocker drone', kind: 'drone', copies: 1, vs: 46, d: 'Heavy disc that throws itself in the way (drone HP x1.5).', apply: drone('blocker') },
    shield: { name: 'Energy shield', kind: 'module', copies: 2, vs: 48, d: '45 HP bubble that recharges (replaces the robot\'s own module).', apply: () => ({ mod: 'shield' }) },
    emp: { name: 'EMP burst', kind: 'module', copies: 1, vs: 47, d: 'Stuns the enemy up close for 2.9 s, every 10 s (replaces the module).', apply: () => ({ mod: 'emp' }) },
    mines: { name: 'Mine layer', kind: 'module', copies: 1, vs: 49, d: 'Drops mines behind it (blast x1.4; replaces the module).', apply: () => ({ mod: 'mines' }) },
    popper: { name: 'Pop-up flipper', kind: 'module', copies: 1, vs: 45, d: 'On contact: hit and shove x1.8 (replaces the module).', apply: () => ({ mod: 'popper' }) },
    tow: { name: 'Tow cable', kind: 'module', copies: 1, vs: 52, d: 'Hooks the enemy up close and slings it into the nearest wall, every 8 s (replaces the module).', apply: () => ({ mod: 'tow' }) },
    jam: { name: 'Sensor scrambler', kind: 'module', copies: 1, vs: 48, d: 'Scrambles the enemy within 3 m: it steers haywire and its module goes offline for 3 s, every 6 s (replaces the module).', apply: () => ({ mod: 'jam' }) },
    overdrive: { name: 'Overdrive', kind: 'stat', copies: 1, vs: 49, d: 'Weapon damage x1.6, but every hit it lands strains its own weapon motor.', apply: (sp, b) => ({ dmgK: b.dmgK * 1.6, overdrive: 0.12 }) },
    repair: { name: 'Repair kit', kind: 'module', copies: 1, vs: 42, d: 'Repairs the robot when it is not being hit (x4; replaces the module).', apply: () => ({ mod: 'repair' }) },
    weapon: { name: 'Weapon overhaul', kind: 'stat', copies: 2, vs: 52, d: 'Weapon damage x1.35.', apply: (sp, b) => ({ dmgK: b.dmgK * 1.35 }) },
    hull: { name: 'Reinforced hull', kind: 'stat', copies: 2, vs: 52, d: 'Every part x1.45 HP.', apply: (sp, b) => ({ hpK: b.hpK * 1.45 }) },
    powerkit: { name: 'Power kit', kind: 'stat', copies: 1, vs: 50, d: 'Hot-wound motors, big battery, HP x1.2.', apply: (sp, b) => ({ motor: 'hot', battery: 'big', hpK: b.hpK * 1.2 }) },
    armourkit: { name: 'Armour kit', kind: 'stat', copies: 1, vs: 46, d: '+1 on every armour plate, HP x1.25.', apply: (sp, b) => ({ armour: plates(sp), hpK: b.hpK * 1.25 }) },
    core: { name: 'Prototype core', kind: 'legendary', copies: 1, vs: 50, d: 'Legendary: weapon damage x1.3 and every part x1.3 HP.', apply: (sp, b) => ({ dmgK: b.dmgK * 1.3, hpK: b.hpK * 1.3 }) },
    hospital: { name: 'Field hospital', kind: 'legendary', copies: 1, vs: 55, d: 'Legendary: a full-strength medic drone and HP x1.1.', apply: (sp, b) => ({ helpers: (sp.helpers || []).concat(['fieldmedic']).slice(0, 3), hpK: b.hpK * 1.1 }) },
    quantum: { name: 'Quantum shield', kind: 'legendary', copies: 1, vs: 48, d: 'Legendary: the first real hit after it recharges is cancelled and the robot phases out for 1.5 s; recharges in 8 s.', apply: () => ({ qshield: true }) },
    // tuning chips (Kev, 9 Nov): routines worked out for light robots; from level 2 up they can overload (engine CHIP_GLITCH)
    matador: { name: 'Matador chip', kind: 'chip', copies: 1, vs: 50, d: 'Tuning chip: waits in front of the enemy, sidesteps its charge and hits its side. On a level 0-1 robot it also drives nimbly: +25% push, +20% speed, sharper turns. May glitch on heavier robots.', apply: () => ({ chip: 'matador' }) },
    bait: { name: 'Wall Bait chip', kind: 'chip', copies: 1, vs: 50, d: 'Tuning chip: stands in front of a wall or hazard and sidesteps at the last moment, so the enemy crashes in. On a level 0-1 robot it also drives nimbly: +25% push, +20% speed, sharper turns. May glitch on heavier robots.', apply: () => ({ chip: 'bait' }) },
    pester: { name: 'Pester chip', kind: 'chip', copies: 1, vs: 50, d: 'Tuning chip: circles at the edge of the enemy\'s reach and darts in when it is turned away. On a level 0-1 robot it also drives nimbly: +25% push, +20% speed, sharper turns. May glitch on heavier robots.', apply: () => ({ chip: 'pester' }) },
  };
  // a lineup robot with parts, as an engine spec
  // level gap (Kev, 9 Nov: test wider gaps between levels): every level's power grade x (1 + levelBoost) ^ level, the same step
  // between any two neighbouring levels (a flat 1 + boost x level widened the low gaps most); 0 = as measured
  let levelBoost = 0;
  const grade = name => { const r = ROBOTS[name] || ROBOTS4[name]; return r ? r[1] * Math.pow(1 + levelBoost, r[0]) : 1; };
  function build(name, parts = []) {
    const P = L.PRESETS[name], p = grade(name);
    let spec = { preset: name, dmgK: (P.dmgK || 1) * p, hpK: p };
    if (parts.some(k => PARTS[k] && PARTS[k].kind === 'chip')) spec.lv = (ROBOTS[name] || ROBOTS4[name] || [0])[0];   // a tuning chip needs to know the frame it is on
    for (const k of parts) { if (!k || !PARTS[k]) continue; const sp = L.normSpec(spec); spec = Object.assign({}, spec, PARTS[k].apply(sp, spec)); }
    return spec;
  }
  function usePK() { Object.assign(L.ARC.pk, PK); }
  const API = { ROBOTS, ROBOTS4, LEVELS, PK, PARTS, build, usePK, grade, get levelBoost() { return levelBoost; }, set levelBoost(x) { levelBoost = +x || 0; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Lineup = API;
})(typeof window !== 'undefined' ? window : globalThis);
