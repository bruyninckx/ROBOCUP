/* ROBOCUS battle simulator: the one shared copy (src/sim.js).
   Robot auto-battle core. Deterministic with a seed. Browser (window.Sim) + Node (require).
   Used by prototypes/arena-sandbox.html, prototypes/scrapyard-dominus.html, prototypes/tabletop-prototype.html
   and tools/watchdog.js. Live combat cards (queueCmd) come from the tabletop prototype's fork. */
(function (root) {
  'use strict';
  const W = 900, H = 560, H_ = 560, SIZE = 30;
  const STATS = ['hp', 'armor', 'speed', 'turret', 'fp', 'acc', 'bullet'];
  const LV = {
    hp: [60, 85, 110, 135, 160],
    armor: [0, 1.5, 3, 4.5, 6],        // flat damage removed from every hit; also adds weight
    speed: [60, 95, 130, 165, 200],
    turret: [30, 60, 100, 150, 220],
    fp: [7, 10, 13.5, 17.5, 22],       // firepower: damage per second if every shot hits
    acc: [45, 60, 75, 87, 97],
    bullet: [250, 350, 470, 600, 800],
  };
  // calibre trades fire rate for hit size at the same firepower
  const CAL = {
    rapid:  { rate: 4,   shell: 1.3, turret: 1.25, tol: 7 },
    medium: { rate: 1.4, shell: 1.0, turret: 1.0,  tol: 5 },
    heavy:  { rate: 0.5, shell: 0.6, turret: 0.55, tol: 3 },
  };
  const RANGES = { short: 140, mid: 250, long: 380 };
  // stat levels 5-8 exist only for bigger robots (Lone Wolf, Duo squadron cards); they continue the same steps
  for (const k in LV) { const a = LV[k], d = a[4] - a[3]; while (a.length < 9) a.push(a[a.length - 1] + d); }
  LV.acc = [45, 60, 75, 87, 97, 98, 99, 99, 99];
  // squadron leader cards: how many robots a side fields, points per robot, highest stat level, robot size
  const SQUADS = {
    lone:  { name: 'Lone Wolf', slots: 1, points: 28, cap: 8, size: 40, text: 'One titan. Big, tough and outnumbered.' },
    duo:   { name: 'Duo', slots: 2, points: 18, cap: 6, size: 34, text: 'Two heavy robots.' },
    trio:  { name: 'Trio', slots: 3, points: 14, cap: 4, size: 30, text: 'The standard: three normal robots.' },
    swarm: { name: 'Swarm', slots: 5, points: 9, cap: 3, size: 22, text: 'Five small robots. Splash and armour are their nightmare.' },
  };
  // surprise modules (one per robot)
  const MODS = {
    shield:  { name: 'Energy Shield', text: 'Bubble soaks 25 damage before anything else; recharges 10/s after 3 s without being hit. Great against chip damage.' },
    flipper: { name: 'Flipper', text: 'Charges in whenever the flipper is ready. On contact: 14 damage, throws the enemy back and stuns it 1.3 s; slamming into a wall hurts extra. Every 3 s.' },
    decoy:   { name: 'Decoy Hologram', text: 'At 60% health, a hologram copy runs off. Enemies aiming at this robot chase the decoy for 2.5 s. Once per fight.' },
    mines:   { name: 'Mine Layer', text: 'Drops a mine every 1.6 s while driving (max 5). 22 damage to anyone but the owner, teammates included.' },
    repair:  { name: 'Repair Drone', text: 'Little drone heals 6 health per second once the robot has not been hit for 1.2 s. Strong if you can break line of fire.' },
    emp:     { name: 'EMP Burst', text: 'When an enemy comes within 130 px: everything within 150 px is stunned for 1.8 s. Recharges in 12 s.' },
    boom:    { name: 'Self-Destruct', text: 'Below 30% health it rams the nearest enemy. When destroyed it explodes: up to 45 damage within 90 px, friend or foe.' },
    smoke:   { name: 'Smoke Screen', text: 'At 50% health, pops a smoke cloud for 4 s. Shots aimed into smoke spread wildly. Once per fight.' },
    reflect: { name: 'Reflective Plating', text: 'Bounces half of every laser hit back at the shooter and halves how fast flames set it alight.' },
    grapple: { name: 'Grappling Hook', text: 'Every 8 s: hooks its target (60-240 px away), yanks it about 140 px closer and stuns it 0.4 s. Great with mines, spinners and flamethrowers.' },
    jets:    { name: 'Jump Jets', text: 'When an enemy gets within 90 px or a mortar shell is about to land on it: leaps 160 px away, untouchable for 0.35 s. Every 7 s.' },
    oil:     { name: 'Oil Slick', text: 'Below 65% health, drops an oil puddle every 8 s (65 px, 5 s). Other robots on oil slide and turn at a quarter speed. Flames set it on fire: 12 damage/s for 3 s.' },
  };
  // drives: how the robot turns its movement wish into motion (spec: docs/processors-and-drives.md)
  // wheels is the original behaviour, unchanged
  const DRIVES = {
    wheels: { name: 'Standard Wheels', speedMult: 1, turnBody: 180, reverseMult: 0.65, weightMult: 1, kbMult: 1, strain: 0, text: 'Balanced all-rounder. The original drive.' },
    tracks: { name: 'Tank Tracks', speedMult: 0.9, turnBody: 260, reverseMult: 0.85, weightMult: 0.5, kbMult: 0.5, strain: 0, text: '10% slower, but turns fast, feels only half the weight of armour and health, and takes half the knockback.' },
    omni:   { name: 'Omni-Drive', speedMult: 0.92, turnBody: 200, reverseMult: 1, weightMult: 1.15, kbMult: 1.35, strain: 1, text: 'Glides in any direction without turning first. A bit slower, extra sensitive to weight, gets thrown around more.' },
    boost:  { name: 'Overboost Thrusters', speedMult: 1.15, turnBody: 135, reverseMult: 0.4, weightMult: 0.85, kbMult: 1, strain: 1, dash: true, text: '15% faster plus a 1.6x dash for 0.6 s every 4.5 s, but wide turns and a weak reverse gear.' },
  };
  // processors: the robot's movement brain
  const PROCS = {
    standard: { name: 'Stock Controller', strain: 0, text: 'Circles at its preferred range and strafes. The original behaviour.' },
    zigzag:   { name: 'Zigzag Chip', strain: 1, text: 'Fast side-to-side weave, tacks in diagonally and jukes incoming bullets, saw blades and mortar shells.' },
    kiter:    { name: 'Kiter Chip', strain: 1, text: 'Keeps its distance: backs away (firing) when enemies get close and steers out of corners.' },
    rammer:   { name: 'Rammer Chip', strain: 1, text: 'Drives straight into its target, hunts wounded enemies, and rams for damage plus knockback (more with armour and health).' },
  };

  // strain: how hard each part pushes the robot. More strain = more malfunctions and broken parts.
  // Engineers (0-3 per robot) keep it running: each one cuts the malfunction chance by 40% and the break chance in half.
  const STRAIN = {
    weapon: { gun: 1, laser: 2, mortar: 2, saw: 2, flame: 2, spinner: 3, railgun: 3 },
    cal: { rapid: 0, medium: 0, heavy: 1 },
    mod: { shield: 1, flipper: 2, decoy: 1, mines: 1, repair: 1, emp: 2, boom: 1, smoke: 0, reflect: 0, grapple: 2, jets: 2, oil: 1 },
    helper: 1,
  };
  const WNAME = { gun: 'Gun', laser: 'Laser', mortar: 'Mortar', saw: 'Saw blades', spinner: 'Spinner blade', flame: 'Flamethrower', railgun: 'Railgun' };
  const OVER = { speed: 'Speed', turret: 'Turret', fp: 'Firepower' };
  const ENG_MAX = 3;
  const engOf = b => Math.max(0, Math.min(ENG_MAX, b.eng == null ? 1 : +b.eng || 0));
  // overdrive: a stat at level 4+ strains the robot (+1), at level 7+ even more (+2)
  function strainOf(b) {
    const parts = [], w = b.weapon || 'gun';
    parts.push({ part: 'weapon', name: WNAME[w] || w, strain: STRAIN.weapon[w] || 1 });
    if (w === 'gun' && STRAIN.cal[b.cal || 'medium']) parts.push({ part: 'cal', name: 'Heavy calibre', strain: STRAIN.cal[b.cal] });
    if (b.mod && MODS[b.mod] && STRAIN.mod[b.mod]) parts.push({ part: 'mod', name: MODS[b.mod].name, strain: STRAIN.mod[b.mod] });
    (b.helpers || []).filter(h => HELPERS[h]).slice(0, 3).forEach((h, k) => parts.push({ part: 'helper', k, name: HELPERS[h].name, strain: STRAIN.helper }));
    if (DRIVES[b.drive] && DRIVES[b.drive].strain) parts.push({ part: 'drive', name: DRIVES[b.drive].name, strain: DRIVES[b.drive].strain });
    if (PROCS[b.proc] && PROCS[b.proc].strain) parts.push({ part: 'proc', name: PROCS[b.proc].name, strain: PROCS[b.proc].strain });
    for (const k in OVER) { const v = (b.lv || {})[k] || 0; if (v >= 4) parts.push({ part: 'over', stat: k, name: OVER[k] + ' overdrive', strain: v >= 7 ? 2 : 1 }); }
    return { total: parts.reduce((a, p) => a + p.strain, 0), parts };
  }
  // chance per fight: one short malfunction (stall or jam), and per part a chance to break for the rest of the fight
  function riskOf(b) {
    const st = strainOf(b), E = engOf(b);
    const overload = 1 + 0.15 * Math.max(0, st.total - 4);
    const glitch = Math.min(0.9, 0.08 * st.total * Math.pow(0.6, E));
    const breaks = st.parts.map(p => Object.assign({}, p, { p: Math.min(0.5, 0.035 * p.strain * overload * Math.pow(0.5, E)) }));
    const anyBreak = 1 - breaks.reduce((a, p) => a * (1 - p.p), 1);
    return { strain: st.total, parts: st.parts, eng: E, glitch, breaks, anyBreak };
  }
  // what a broken part does for the rest of the fight
  const BREAK_TEXT = { weapon: 'WEAPON DAMAGED', cal: 'BARREL WARPED', mod: 'MODULE FRIED', helper: 'DRONE FAILURE', speed: 'ENGINE BLOWN', turret: 'TURRET MOTOR BURNT', fp: 'OVERHEATED', drive: 'DRIVE LOCKED', proc: 'LOGIC GLITCH' };
  function breakPart(B, b, p) {
    const key = p.part === 'over' ? p.stat : p.part;
    let label = BREAK_TEXT[key];
    if (key === 'weapon') { b.s.dmg *= 0.5; b.s.fp *= 0.5; if (b.s.weapon === 'spinner') label = 'BLADE CRACKED'; }
    else if (key === 'cal') b.s.acc = Math.max(20, b.s.acc - 25);
    else if (key === 'mod') { if (!b.mod) return false; b.modBroken = b.mod; b.mod = null; b.shield = 0; b.revealed = true; }
    else if (key === 'helper') { const h = B.bots.filter(x => x.helper && x.owner === b.i)[p.k]; if (!h || h.hp <= 0) return false; h.hp = 0; B.fx.push({ k: 'hit', x: h.x, y: h.y, life: 0.2 }); }
    else if (key === 'speed') b.s.speed *= 0.6;
    else if (key === 'turret') b.s.turret *= 0.5;
    else if (key === 'fp') { b.s.dmg *= 0.7; b.s.fp *= 0.7; }
    else if (key === 'drive') { b.driveLocked = true; b.s.speed *= 0.6; }   // omni loses its sideways glide, boost its dash
    else if (key === 'proc') b.procBroken = true;                           // back to the stock controller
    (b.broken = b.broken || []).push(p.name);
    B.fx.push({ k: 'break', x: b.x, y: b.y - 34, text: label, life: 1.8 });
    logE(B, { k: 'break', who: b.i, part: p.name, text: label });
    return true;
  }
  // fight log: key moments for the recap (crits are counted, only the big ones are logged)
  function logE(B, ev) { ev.t = Math.round(B.t * 10) / 10; if (B.log.length < 300) B.log.push(ev); }

  function mkRng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const rad = d => d * Math.PI / 180;
  const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const turnToward = (a, target, maxStep) => { const d = wrapA(target - a); return a + Math.max(-maxStep, Math.min(maxStep, d)); };

  // build: {lv:{hp:0..4,...}, range:'short'|'mid'|'long', weapon:'gun'|'mortar'|'laser'|'shotgun'}
  function statsOf(b) {
    const s = {};
    for (const k of STATS) s[k] = LV[k][b.lv[k]];
    s.range = RANGES[b.range] || 250;
    s.weapon = b.weapon || 'gun';
    s.cal = b.cal || 'medium';
    const c = CAL[s.cal];
    s.fire = s.weapon === 'mortar' ? 0.45 : s.weapon === 'saw' ? 1.1 : s.weapon === 'spinner' ? 2 : s.weapon === 'flame' ? 1 : s.weapon === 'railgun' ? 0.4 : c.rate;
    s.dmg = s.fp / s.fire;
    // rapid fire gets extra firepower to make up for bouncing off armour
    if (s.weapon === 'gun' && s.cal === 'rapid') s.dmg *= 1.08;
    // saw blades can hit up to 3 times, so each hit is weaker
    if (s.weapon === 'saw') s.dmg *= 0.8;
    // railgun: every slug lands and outranges everything, so each one hits softer (legendary, but beatable)
    if (s.weapon === 'railgun') s.dmg *= 0.55;
    if (s.weapon === 'gun') { s.bullet *= c.shell; s.turret *= c.turret; s.tol = c.tol; } else s.tol = 5;
    // weight: armour and health slow you down (tracks feel half of it)
    const D = DRIVES[b.drive] || DRIVES.wheels;
    s.drive = DRIVES[b.drive] ? b.drive : 'wheels';
    s.proc = PROCS[b.proc] ? b.proc : 'standard';
    if (D.weightMult === 1) s.speed *= Math.max(0.3, 1 - 0.09 * Math.min(4, b.lv.armor) - 0.04 * Math.min(4, b.lv.hp) - 0.04 * Math.max(0, b.lv.armor - 4) - 0.02 * Math.max(0, b.lv.hp - 4));
    else s.speed *= Math.max(0.3, 1 - D.weightMult * (0.09 * Math.min(4, b.lv.armor) + 0.04 * Math.min(4, b.lv.hp) + 0.04 * Math.max(0, b.lv.armor - 4) + 0.02 * Math.max(0, b.lv.hp - 4)));
    if (D.speedMult !== 1) s.speed *= D.speedMult;
    s.turnBody = D.turnBody;
    s.mod = b.mod && MODS[b.mod] ? b.mod : null;
    return s;
  }
  // helper drones that roll in with a main robot (max 3)
  const HELPERS = {
    medic:  { icon: '➕', name: 'Medic', hp: 18, speed: 150, text: 'Stays behind its robot and heals it 4 health/s with a beam (range 130). Fragile. Two medics heal 8/s at most.' },
    waller: { icon: '🧱', name: 'Waller', hp: 40, speed: 130, text: 'Rides in front and drops an energy wall every 5 s (lasts 6 s, 40 health). Walls stop enemy bullets and lasers; your own shots pass through. Mortars lob over.' },
    bodyguard: { icon: '🛡️', name: 'Bodyguard', hp: 60, armor: 2, size: 26, speed: 140, text: 'Big armoured drone that parks between its robot and the enemy and soaks bullets. Lasers go straight through.' },
    spotter: { icon: '📡', name: 'Spotter', hp: 25, speed: 160, text: 'Hovers behind. Its robot gets +15% accuracy and sees through smoke; reveals hidden modules of enemies within 220 px.' },
    jammer:  { icon: '📻', name: 'Jammer', hp: 25, speed: 150, text: 'Flies toward the enemy. Enemy robots within 160 px turn their turrets at half speed.' },
    gunner:  { icon: '🔫', name: 'Gun Drone', hp: 30, speed: 160, text: 'Circles its robot and plinks at the same target: 2 shots/s of 3 damage. Useless against armour.' },
    bomber:  { icon: '💣', name: 'Bomber', hp: 20, speed: 190, text: 'Waits 2 s, then dives at its robot\'s target and explodes: 24 damage within 50 px. One use.' },
    miner:  { icon: '⛏️', name: 'Miner', hp: 30, speed: 160, text: 'Circles its robot dropping a mine every 1.6 s (max 5). 24 damage to anyone outside its own squad, teammates included.' },
  };
  function cost(b) { return STATS.reduce((a, k) => a + b.lv[k], 0); }

  // spawn spots per bot count (team mode puts teammates on the same side)
  function spawns(n, teams, W, H) {
    if (teams && (n > 4 || teams.some((t, i) => t !== [0, 0, 1, 1][i]))) {
      // team fights: team 0 in a column on the left, team 1 on the right, each spread evenly (sides may be uneven)
      const out = [], cnt = [0, 0], tot = [teams.filter(t => t === 0).length, teams.filter(t => t !== 0).length];
      teams.forEach(t => { const s = t === 0 ? 0 : 1; out.push([s ? W - 110 : 110, H * (++cnt[s]) / (tot[s] + 1)]); });
      return out;
    }
    const teamMode = !!teams;
    if (n === 2) return [[120, H / 2 - 80], [W - 120, H / 2 + 80]];
    if (n === 3) return [[120, 110], [W - 120, 110], [W / 2, H - 80]];
    if (teamMode) return [[110, 140], [110, H - 140], [W - 110, 140], [W - 110, H - 140]];
    return [[110, 100], [W - 110, H - 100], [W - 110, 100], [110, H - 100]];
  }
  // opts.teams: array of team ids per bot (default: everyone for themselves)
  function newBattle(builds, seed, opts) {
    const rng = mkRng(seed);
    const n = builds.length;
    const teams = (opts && opts.teams) || builds.map((_, i) => i);
    // bigger battles get a bigger arena
    const W = n > 4 ? 1200 : 900, H = n > 4 ? 750 : 560, H_ = H;
    const sp = spawns(n, opts && opts.teams, W, H);
    const bots = builds.map((b, i) => {
      const s = statsOf(b);
      const x = sp[i][0], y = sp[i][1] + (n === 2 ? (rng() - 0.5) * 220 : (rng() - 0.5) * (n > 4 ? 30 : 60));
      const face = Math.atan2(H / 2 - y, W / 2 - x);
      return { i, squad: i, size: b.size || SIZE, focus: ['helpers', 'medics'].includes(b.focus) ? b.focus : 'main', team: teams[i], s, hp: s.hp, x, y, body: face, turret: face, target: -1,
        vx: 0, vy: 0, cd: 0.3 + rng() * 0.4, strafe: rng() < 0.5 ? 1 : -1, strafeT: 1 + rng() * 2, hitT: 0, shots: 0, hits: 0, beam: 0, dealt: 0, kills: 0, ff: 0, teamKills: 0, lastBy: -1,
        mod: s.mod, shield: s.mod === 'shield' ? 25 : 0, lastHit: -9, stun: 0, kx: 0, ky: 0, modCd: 0, modUsed: false, revealed: false, healed: 0,
        lv: b.lv, drive: s.drive, proc: s.proc, kb: DRIVES[s.drive].kbMult, dashCd: 1.5, dashT: 0, ramCd: 0, jukeCd: 0, air: 0, wpX: null, wpY: null, wpT: 0, overclockT: 0 };
    });
    // malfunctions and broken parts come from strain; engineers make them rarer and shorter
    for (const b of bots) {
      const R = riskOf(builds[b.i]);
      b.eng = R.eng; b.strain = R.strain;
      if (rng() < R.glitch) b.glitch = { t: 3 + rng() * 12, kind: rng() < 0.5 ? 'stall' : 'jam', done: false };
      b.breaks = [];
      for (const p of R.breaks) if (rng() < p.p) b.breaks.push({ t: 5 + rng() * 20, p, done: false });
      b.crits = 0; b.critDmg = 0; b.rear = {};
    }
    // helpers join after the main robots
    builds.forEach((b, i) => {
      (b.helpers || []).filter(h => HELPERS[h]).slice(0, 3).forEach((h, k) => {
        const H = HELPERS[h], m = bots[i], a = m.body + Math.PI + (k - 1) * 0.9;
        bots.push({ i: bots.length, helper: h, owner: i, squad: i, size: H.size || 20, team: m.team, s: { hp: H.hp, armor: H.armor || 0, speed: H.speed }, hp: H.hp,
          x: Math.max(20, Math.min(W - 20, m.x + Math.cos(a) * 40)), y: Math.max(20, Math.min(H_ - 20, m.y + Math.sin(a) * 40)), body: m.body, target: -1, vx: 0, vy: 0,
          hitT: 0, dealt: 0, kills: 0, ff: 0, teamKills: 0, lastBy: -1, mod: null, shield: 0, lastHit: -9, stun: 0, kx: 0, ky: 0, cd: 1 + k * 0.7, phase: k * 2.1, beam: 0 });
      });
    });
    return { W, H, bots, saws: [], bullets: [], shells: [], fx: [], mines: [], decoys: [], smokes: [], walls: [], oils: [], zones: [], banners: [], cmdQueue: [], tick: 0, t: 0, over: false, winner: null, rng, n, log: [], trace: [], how: null };
  }
  // is a teammate standing in the line of fire (before the target)?
  function allyInLine(B, b, a, len) {
    for (const p of B.bots) {
      if (p === b || p.hp <= 0 || p.team !== b.team || p.squad === b.squad) continue;
      const ex = p.x - b.x, ey = p.y - b.y;
      const along = ex * Math.cos(a) + ey * Math.sin(a), perp = Math.abs(-ex * Math.sin(a) + ey * Math.cos(a));
      if (along > 0 && along < len && perp < p.size / 2 + 6) return true;
    }
    return false;
  }
  const enemies = (B, b) => B.bots.filter(o => o.hp > 0 && o.team !== b.team);
  function pickTarget(B, b) {
    let es = enemies(B, b);
    // targeting order: go for the main robots, or clear the helpers first
    const helpers = es.filter(e => e.helper), mains = es.filter(e => !e.helper);
    const medics = helpers.filter(e => e.helper === 'medic');
    es = b.focus === 'helpers' && helpers.length ? helpers : b.focus === 'medics' && medics.length ? medics : mains.length ? mains : es;
    if (!es.length) return null;
    // rammers treat wounded enemies (below 45% health) as if they were closer and switch targets more easily
    const ram = b.proc === 'rammer' && !b.procBroken;
    const dOf = o => Math.hypot(o.x - b.x, o.y - b.y) * (ram && o.hp < o.s.hp * 0.45 ? 0.75 : 1);
    let best = null, bd = Infinity;
    for (const o of es) { const d = dOf(o); if (d < bd) { bd = d; best = o; } }
    const cur = b.target >= 0 ? B.bots[b.target] : null;
    // sticky: only switch if the new one is clearly closer
    if (cur && cur.hp > 0 && cur.team !== b.team && es.includes(cur) && dOf(cur) < bd * (ram ? 1.15 : 1.35)) return cur;
    b.target = best.i;
    return best;
  }

  function explode(B, x, y, r, dmg, src, kind, sparesSquad) {
    B.fx.push({ k: kind || 'boom', x, y, r, life: 0.35 });
    for (const e of B.bots) {
      if (e.hp <= 0 || e === src || (sparesSquad && e.squad === src.squad)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < r) { const was = B.how; B.how = B.how || (kind === 'bigboom' ? 'self-destruct' : src.helper === 'bomber' ? 'bomber' : 'mine'); hitBot(B, e, dmg * (1 - 0.5 * d / r), src, true); B.how = was; }
    }
  }
  // push a robot away along angle a; tracks shrug half of it off, omni-drives fly further
  function push(e, a, v) { const k = v * (e.kb || 1); e.kx = Math.cos(a) * k; e.ky = Math.sin(a) * k; }
  function hitBot(B, tgt, dmg, src, pierce) {
    if (tgt.hp <= 0 || tgt.air > 0) return 0;   // mid-leap (jump jets) nothing touches it
    tgt.lastHit = B.t;
    if (tgt.shield > 0) {
      const a = Math.min(tgt.shield, dmg); tgt.shield -= a; dmg -= a; tgt.revealed = true;
      if (dmg <= 0.0001) { tgt.hitT = 0.05; return; }
    }
    if (pierce === 0.5) dmg = Math.max(dmg * 0.25, dmg - tgt.s.armor * 0.5);   // railgun: half the armour
    else if (!pierce) dmg = Math.max(dmg * 0.25, dmg - tgt.s.armor);
    tgt.hp -= dmg; tgt.hitT = 0.08; tgt.lastBy = src.i;
    const friendly = tgt.team === src.team;
    if (friendly) src.ff += dmg; else src.dealt += dmg;
    // flank: hit from the blind side, more than 110 degrees away from where this robot's turret points
    if (!friendly && !src.helper && !tgt.helper && tgt.rear) {
      const off = Math.abs(wrapA(Math.atan2(src.y - tgt.y, src.x - tgt.x) - tgt.turret));
      if (off > rad(110)) {
        const r0 = tgt.rear[src.i] || 0; tgt.rear[src.i] = r0 + dmg;
        if (r0 < 20 && r0 + dmg >= 20) logE(B, { k: 'flank', who: src.i, tgt: tgt.i });
      }
    }
    if (tgt.hp <= 0) {
      if (friendly) { if (tgt !== src) src.teamKills++; } else src.kills++;
      const how = B.how || (src.helper ? HELPERS[src.helper].name.toLowerCase() : WNAME[src.s.weapon] ? WNAME[src.s.weapon].toLowerCase() : 'hit');
      if (tgt.helper) logE(B, { k: 'drone', who: tgt.i, owner: tgt.owner, by: src.i, how });
      else logE(B, { k: 'ko', who: tgt.i, by: src.i, how, friendly: friendly && tgt !== src, self: tgt === src });
      B.fx.push({ k: 'boom', x: tgt.x, y: tgt.y, life: 0.25 });
      if (tgt.mod === 'boom') { tgt.revealed = true; explode(B, tgt.x, tgt.y, 90, 45, tgt, 'bigboom'); }
      if (!tgt.helper) for (const h of B.bots) if (h.helper && h.owner === tgt.i && h.hp > 0) { h.hp = 0; B.fx.push({ k: 'hit', x: h.x, y: h.y, life: 0.2 }); }
    }
    return dmg;
  }
  // a hit that can crit (10%: double damage). Crits are counted; big ones and finishing blows go in the log.
  function critHit(B, tgt, dmg, src, pierce) {
    const crit = B.rng() < 0.1, alive = tgt.hp > 0;
    const d = hitBot(B, tgt, dmg * (crit ? 2 : 1), src, pierce) || 0;
    if (crit) {
      B.fx.push({ k: 'crit', x: tgt.x, y: tgt.y - 20, life: 0.6 });
      if (src.crits != null) { src.crits++; src.critDmg += d / 2; }
      if (alive && tgt.hp <= 0 && !tgt.helper && tgt.team !== src.team) logE(B, { k: 'critko', who: src.i, tgt: tgt.i, dmg: Math.round(d) });
      else if (d >= 15 && !tgt.helper && tgt.team !== src.team) logE(B, { k: 'bigcrit', who: src.i, tgt: tgt.i, dmg: Math.round(d) });
    }
    return crit;
  }

  // ---- live combat cards (tabletop): queue a command, it runs on the next tick ----
  function queueCmd(B, cmd) {
    B.cmdQueue.push(Object.assign({}, cmd, { execTick: cmd.tick != null ? cmd.tick : B.tick + 1 }));
  }
  function triggerModuleNow(B, b) {
    b.revealed = true;
    const e = B.bots.find(x => x.hp > 0 && x.team !== b.team && !x.helper);
    const m = b.mod, W = B.W, H = B.H;
    const say = (text, col) => B.banners.push({ x: b.x, y: b.y - 38, text, col, life: 1.4 });
    if (m === 'smoke') { B.smokes.push({ x: b.x, y: b.y, r: 100, life: 4.5 }); say('💨 SMOKE TRIGGERED!', '#444'); }
    else if (m === 'decoy') {
      const a = b.body + (B.rng() < 0.5 ? 1 : -1) * Math.PI / 2;
      B.decoys.push({ owner: b.i, x: b.x, y: b.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 3.0, fooled: B.bots.filter(x => x.team !== b.team).map(x => x.i), body: b.body });
      say('👥 DECOY DEPLOYED!', '#6d28d9');
    } else if (m === 'emp') {
      for (const f of B.bots) if (f !== b && f.hp > 0 && Math.hypot(f.x - b.x, f.y - b.y) < 210) f.stun = Math.max(f.stun, 2.0);
      B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 200, life: 0.45, col: '#1f6feb' }); say('⚡ EMP DETONATED!', '#1f6feb');
    } else if (m === 'mines') {
      for (let k = -1; k <= 1; k++) { const a = b.body + Math.PI + k * 0.55;
        B.mines.push({ x: Math.max(25, Math.min(W - 25, b.x + Math.cos(a) * 32)), y: Math.max(25, Math.min(H - 25, b.y + Math.sin(a) * 32)), owner: b.i, squad: b.squad, age: 0.4, dmg: 22 }); }
      say('💣 MINE CLUSTER!', '#d62828');
    } else if (m === 'repair') { b.hp = Math.min(b.s.hp, b.hp + 28); B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 60, life: 0.35, col: '#2a9d3a' }); say('🔧 +28 HP BURST!', '#2a9d3a'); }
    else if (m === 'flipper') { b.modCd = 0; if (e) { const a = Math.atan2(e.y - b.y, e.x - b.x); b.kx += Math.cos(a) * 380; b.ky += Math.sin(a) * 380; } say('🚀 FLIPPER LUNGE!', '#e07b00'); }
    else if (m === 'jets') { b.modCd = 0; say('🦘 JETS PRIMED!', '#e07b00'); }
    else if (m === 'grapple') { b.modCd = 0; say('🪝 HOOK READY!', '#e07b00'); }
    else if (m === 'oil') { B.oils.push({ x: b.x, y: b.y, r: 65, life: 5, fire: 0, owner: b.i, by: -1 }); say('🛢️ OIL DUMP!', '#111'); }
    else { b.shield = Math.min(40, (b.shield || 0) + 25); B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 75, life: 0.35, col: '#0284c7' }); say('🛡️ SHIELD SURGE!', '#0284c7'); }
  }
  function applyCardCmd(B, c) {
    const W = B.W, H = B.H, b = c.bot != null ? B.bots[c.bot] : null;
    if (['waypoint', 'trigger', 'overclock', 'field_eng'].includes(c.card) && (!b || b.hp <= 0)) return;
    if (c.card === 'waypoint') {
      b.wpX = Math.max(40, Math.min(W - 40, c.x)); b.wpY = Math.max(40, Math.min(H - 40, c.y)); b.wpT = 3.8;
      B.banners.push({ x: b.wpX, y: b.wpY - 18, text: '📍 WAYPOINT ORDER', col: '#1f6feb', life: 1.4 });
    } else if (c.card === 'trigger') triggerModuleNow(B, b);
    else if (c.card === 'overclock') {
      b.overclockT = 3.5; B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 65, life: 0.35, col: '#d99000' });
      B.banners.push({ x: b.x, y: b.y - 38, text: '🎯 OVERCLOCK +45%!', col: '#d99000', life: 1.4 });
    } else if (c.card === 'field_eng') {
      b.glitchT = 0; if (b.glitch) b.glitch.done = true;
      if (b.breaks) b.breaks.forEach(br => { if (!br.done) br.t += 12; });
      b.hp = Math.min(b.s.hp, b.hp + 18); B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 60, life: 0.35, col: '#2a9d3a' });
      B.banners.push({ x: b.x, y: b.y - 38, text: '👷 FIELD ENGINEER PATCH!', col: '#2a9d3a', life: 1.5 });
    } else if (c.card === 'oil_card') {
      const x = Math.max(50, Math.min(W - 50, c.x)), y = Math.max(50, Math.min(H - 50, c.y));
      B.oils.push({ x, y, r: 80, life: 5.5, fire: 0, owner: -1, by: -1 });      // same physics as the Oil Slick module
      B.zones.push({ kind: 'oil', x, y, r: 80, life: 5.5 });                    // kept for the tabletop renderer
      B.banners.push({ x, y: y - 24, text: '🛢️ OIL SLICK!', col: '#111', life: 1.3 });
    } else if (c.card === 'emp_card') {
      const x = Math.max(50, Math.min(W - 50, c.x)), y = Math.max(50, Math.min(H - 50, c.y));
      B.zones.push({ kind: 'emp_bomb', x, y, r: 105, fuse: 0.75, maxFuse: 0.75 });
      B.banners.push({ x, y: y - 24, text: '🧲 EMP DROP!', col: '#1f6feb', life: 1.1 });
    }
  }
  function liveTick(B, dt) {
    B.tick = (B.tick || 0) + 1;
    for (let i = B.cmdQueue.length - 1; i >= 0; i--) if (B.cmdQueue[i].execTick <= B.tick) applyCardCmd(B, B.cmdQueue.splice(i, 1)[0]);
    for (let k = B.zones.length - 1; k >= 0; k--) {
      const z = B.zones[k];
      if (z.kind === 'emp_bomb') {
        z.fuse -= dt;
        if (z.fuse <= 0) {
          B.fx.push({ k: 'emp', x: z.x, y: z.y, r: z.r, life: 0.4, col: '#1f6feb' });
          for (const b of B.bots) if (b.hp > 0 && Math.hypot(b.x - z.x, b.y - z.y) < z.r) { b.stun = Math.max(b.stun, 1.35); hitBot(B, b, 10, null, true); }
          B.zones.splice(k, 1);
        }
        continue;
      }
      z.life -= dt; if (z.life <= 0) B.zones.splice(k, 1);
    }
    for (const b of B.bots) {
      if (b.overclockT > 0) b.overclockT = Math.max(0, b.overclockT - dt);
      if (b.wpT > 0) { b.wpT = Math.max(0, b.wpT - dt); if (b.wpT <= 0 || Math.hypot(b.wpX - b.x, b.wpY - b.y) < 22) { b.wpT = 0; b.wpX = b.wpY = null; } }
    }
  }

  function step(B, dt) {
    if (B.over) return;
    liveTick(B, dt);
    const W = B.W, H = B.H;
    // helper auras: spotters help their robot aim, jammers slow enemy turrets
    for (const b of B.bots) { b.spotted = false; b.jam = 1; }
    for (const h of B.bots) {
      if (!h.helper || h.hp <= 0 || h.stun > 0) continue;
      if (h.helper === 'spotter') { const m = B.bots[h.owner]; if (Math.hypot(m.x - h.x, m.y - h.y) < 200) m.spotted = true;
        for (const e of B.bots) if (e.team !== h.team && e.hp > 0 && e.mod && Math.hypot(e.x - h.x, e.y - h.y) < 220) e.revealed = true; }
      if (h.helper === 'jammer') for (const e of B.bots) if (e.team !== h.team && !e.helper && e.hp > 0 && Math.hypot(e.x - h.x, e.y - h.y) < 160) e.jam = 0.45;
    }
    const rng = B.rng;
    B.t += dt;
    for (const b of B.bots) b.healAcc = 0;
    for (const b of B.bots) {
      if (b.hp <= 0) continue;
      // knockback (from a flipper) slides the robot; walls hurt
      if (b.kx || b.ky) {
        const nx = b.x + b.kx * dt, ny = b.y + b.ky * dt;
        const cx = Math.max(SIZE / 2, Math.min(W - SIZE / 2, nx)), cy = Math.max(SIZE / 2, Math.min(H - SIZE / 2, ny));
        if ((cx !== nx || cy !== ny) && Math.hypot(b.kx, b.ky) > 150) { B.how = 'wall slam'; hitBot(B, b, 8, B.bots[b.lastBy >= 0 ? b.lastBy : b.i], true); B.how = null; B.fx.push({ k: 'hit', x: cx, y: cy, life: 0.15 }); b.kx = b.ky = 0; }
        b.x = cx; b.y = cy;
        const f = Math.exp(-6 * dt); b.kx *= f; b.ky *= f; if (Math.hypot(b.kx, b.ky) < 10) b.kx = b.ky = 0;
      }
      if (b.hp <= 0) continue;
      if (b.burn > 0) {
        // burning ignores armour; touching another robot spreads the fire (friend or foe)
        b.burn -= dt; B.how = 'fire'; hitBot(B, b, 5 * dt, B.bots[b.burnBy] || b, true); B.how = null;
        if (Math.floor(B.t * 4) !== Math.floor((B.t - dt) * 4)) B.fx.push({ k: 'ember', x: b.x + (B.rng() - 0.5) * 14, y: b.y - 6, life: 0.4 });
        for (const o of B.bots) if (o !== b && o.hp > 0 && (o.burn || 0) < 0.8 && Math.hypot(o.x - b.x, o.y - b.y) < (o.size + b.size) / 2 + 6) { o.burn = 2; o.burnBy = b.burnBy; }
        if (b.hp <= 0) continue;
      }
      if (b.helper) { runHelper(B, b, dt); continue; }
      if (b.air > 0) {
        // jump jets: flying, untouchable, can't act
        b.air -= dt; b.x = Math.max(SIZE / 2, Math.min(W - SIZE / 2, b.x + b.jx * dt)); b.y = Math.max(SIZE / 2, Math.min(H - SIZE / 2, b.y + b.jy * dt));
        b.vx = b.jx; b.vy = b.jy; b.beam = 0; b.flame = 0; continue;
      }
      if (b.glitch && !b.glitch.done && B.t >= b.glitch.t) {
        b.glitch.done = true; b.glitchT = 2.5 / (1 + 0.4 * (b.eng || 0)); b.glitchKind = b.glitch.kind;
        const text = b.glitch.kind === 'stall' ? 'ENGINE STALL' : 'TURRET JAMMED';
        B.fx.push({ k: 'glitch', x: b.x, y: b.y - 34, text, life: 1.6 });
        logE(B, { k: 'glitch', who: b.i, text, dur: Math.round(b.glitchT * 10) / 10 });
      }
      if (b.breaks) for (const br of b.breaks) if (!br.done && B.t >= br.t) { br.done = true; breakPart(B, b, br.p); }
      if (b.glitchT > 0) b.glitchT -= dt;
      const stalled = b.glitchT > 0 && b.glitchKind === 'stall', jammed = b.glitchT > 0 && b.glitchKind === 'jam';
      runModule(B, b, dt);
      if (b.stun > 0) { b.stun -= dt; b.vx = b.vy = 0; b.beam = 0; continue; }
      const real = pickTarget(B, b);
      if (!real) continue;
      const dec = B.decoys.find(d => d.owner === real.i && d.fooled.includes(b.i));
      const o = dec || real;
      const fog = !b.spotted && B.smokes.some(sm => Math.hypot(o.x - sm.x, o.y - sm.y) < sm.r) ? 1 : 0;
      const accE = b.spotted ? Math.min(99, b.s.acc + 15) : b.s.acc;
      const dx = o.x - b.x, dy = o.y - b.y, dist = Math.hypot(dx, dy);
      // when shooting a helper, keep driving relative to its main robot instead of chasing the drone
      const anchor = real.helper ? B.bots[real.owner] : o;
      const adist = Math.hypot(anchor.x - b.x, anchor.y - b.y), toO = Math.atan2(anchor.y - b.y, anchor.x - b.x);
      const proc = b.procBroken ? 'standard' : b.proc;
      b.strafeT -= dt;
      if (b.strafeT <= 0) { b.strafe *= -1; b.strafeT = proc === 'zigzag' ? 0.35 + rng() * 0.25 : proc === 'kiter' ? 0.9 + rng() * 0.9 : proc === 'rammer' ? 1.2 + rng() : 0.8 + rng() * 1.7; }
      // flipper robots charge in when their flipper is ready; self-destruct robots go kamikaze when nearly dead
      let want_r = b.s.range;
      if (b.mod === 'flipper' && b.modCd <= 0) want_r = 25;
      if (b.s.weapon === 'spinner') want_r = b.cd <= 0.15 ? 0 : 55;   // charge in, bounce off, charge again
      if (b.s.weapon === 'flame') want_r = Math.min(want_r, 85);
      if (b.mod === 'boom' && b.hp < b.s.hp * 0.3) { want_r = 0; b.revealed = true; }
      // spinners keep their own charge-and-bounce rhythm: on them the Rammer Chip only adds wounded-target hunting
      // (with full pursuit a boosted spinner never left contact and won 100% of its fights)
      if (proc === 'rammer' && b.s.weapon !== 'spinner') want_r = 0;
      let mx, my;
      if (proc === 'zigzag') {
        // juke: flip the weave away from an incoming bullet, saw blade or a shell about to land close
        b.jukeCd -= dt;
        if (b.jukeCd <= 0) {
          let th = null;
          for (const q of B.bullets.concat(B.saws)) {
            if (B.bots[q.owner].team === b.team) continue;
            const ex = b.x - q.x, ey = b.y - q.y, d = Math.hypot(ex, ey);
            if (d < 95 && ex * q.vx + ey * q.vy > 0) { th = q; break; }
          }
          if (!th) th = B.shells.find(q => B.bots[q.owner].team !== b.team && Math.hypot(q.tx - b.x, q.ty - b.y) < 60);
          if (th) {
            const tx = th.tx != null ? th.tx : th.x, ty = th.ty != null ? th.ty : th.y;
            // step to whichever side of our facing line the threat is NOT on
            b.strafe = -Math.sin(toO) * (tx - b.x) + Math.cos(toO) * (ty - b.y) > 0 ? -1 : 1;
            b.strafeT = 0.45; b.jukeCd = 0.6;
          }
        }
        const closing = adist > want_r + 25, dirA = closing ? toO + b.strafe * rad(35) : toO;
        const radial = Math.max(-1, Math.min(1, (adist - want_r) / 70)) * 0.95, sw = closing ? 0.95 : 1.25;
        mx = Math.cos(dirA) * radial + Math.cos(toO + Math.PI / 2) * b.strafe * sw;
        my = Math.sin(dirA) * radial + Math.sin(toO + Math.PI / 2) * b.strafe * sw;
      } else if (proc === 'kiter') {
        const minSafe = Math.max(150, want_r * 0.78), maxBand = want_r + 45;
        let radial, sw;
        if (adist < minSafe) { radial = -1.15; sw = 0.45; }
        else if (adist <= maxBand) { radial = (adist - want_r) / 120 * 0.5; sw = 0.85; }
        else { radial = Math.min(0.85, (adist - maxBand) / 90); sw = 0.75; }
        if (b.x < 120 || b.x > W - 120 || b.y < 120 || b.y > H - 120) {
          // corner escape: circle toward the middle of the arena instead of backing into the wall
          const cx = W / 2 - b.x, cy = H / 2 - b.y;
          b.strafe = -Math.sin(toO) * cx + Math.cos(toO) * cy >= 0 ? 1 : -1; b.strafeT = 0.7; sw = 1.1;
        }
        mx = Math.cos(toO) * radial + Math.cos(toO + Math.PI / 2) * b.strafe * sw;
        my = Math.sin(toO) * radial + Math.sin(toO + Math.PI / 2) * b.strafe * sw;
      } else if (proc === 'rammer' && want_r === 0 && b.s.weapon !== 'spinner') {
        // aim at where the target will be in 0.25 s and floor it
        const toL = Math.atan2(anchor.y + (anchor.vy || 0) * 0.25 - b.y, anchor.x + (anchor.vx || 0) * 0.25 - b.x);
        mx = Math.cos(toL) * 1.3 + Math.cos(toL + Math.PI / 2) * b.strafe * 0.15;
        my = Math.sin(toL) * 1.3 + Math.sin(toL + Math.PI / 2) * b.strafe * 0.15;
      } else {
        const radial = Math.max(-1, Math.min(1, (adist - want_r) / 80));
        mx = Math.cos(toO) * radial + Math.cos(toO + Math.PI / 2) * b.strafe * 0.8;
        my = Math.sin(toO) * radial + Math.sin(toO + Math.PI / 2) * b.strafe * 0.8;
      }
      for (const p of B.bots) {
        if (p === b || p.hp <= 0 || (p.helper && p.squad === b.squad)) continue;
        // robots that want contact (spinner, ready flipper, rammer) don't keep their distance from enemies
        if (p.team !== b.team && (b.s.weapon === 'spinner' || (b.mod === 'flipper' && b.modCd <= 0) || proc === 'rammer')) continue;
        const sx = b.x - p.x, sy = b.y - p.y, sd = Math.hypot(sx, sy), RR = p.helper ? 32 : proc === 'kiter' && p.team !== b.team ? 95 : 60;
        if (sd < RR && sd > 0.01) { mx += sx / sd * (RR - sd) / 30; my += sy / sd * (RR - sd) / 30; }
      }
      const m = 70;
      if (b.x < m) mx += (m - b.x) / m * 2; if (b.x > W - m) mx -= (b.x - (W - m)) / m * 2;
      if (b.y < m) my += (m - b.y) / m * 2; if (b.y > H - m) my -= (b.y - (H - m)) / m * 2;
      if (b.wpT > 0 && b.wpX != null) { const wdx = b.wpX - b.x, wdy = b.wpY - b.y, wd = Math.hypot(wdx, wdy) || 1; mx = wdx / wd * 1.4; my = wdy / wd * 1.4; }
      const oc = b.overclockT > 0 ? 1.45 : 1;   // Target Overclock live card
      const want = Math.atan2(my, mx), mag = Math.min(1, Math.hypot(mx, my));
      const D = DRIVES[b.drive];
      // overboost: dash every 4.5 s while moving with purpose
      if (D.dash && !b.driveLocked) { b.dashCd -= dt; if (b.dashT > 0) b.dashT -= dt; else if (b.dashCd <= 0 && mag > 0.4 && !stalled) { b.dashT = 0.6; b.dashCd = 4.5; } }
      const oil = B.oils.find(q => q.owner !== b.i && Math.hypot(q.x - b.x, q.y - b.y) < q.r);
      const turn = rad(b.s.turnBody) * oc * (oil ? 0.25 : 1) * dt;
      // spinners get a burst of speed while charging in
      const top = stalled ? 0 : oc * b.s.speed * (b.s.weapon === 'spinner' && want_r === 0 ? 1.15 : 1) * (b.dashT > 0 ? 1.6 : 1);
      let vx, vy;
      if (b.drive === 'omni' && !b.driveLocked) {
        // holonomic: moves where it wants, the hull turns along at its own pace
        b.body = turnToward(b.body, want, turn);
        vx = Math.cos(want) * top * mag; vy = Math.sin(want) * top * mag;
      } else if (proc === 'kiter' && Math.abs(wrapA(want - b.body)) > rad(105)) {
        // kiters back away nose-first, so the turret stays on the enemy
        b.body = turnToward(b.body, wrapA(want + Math.PI), turn);
        const sp = top * D.reverseMult * Math.max(0, Math.cos(wrapA(want + Math.PI - b.body))) * mag;
        vx = -Math.cos(b.body) * sp; vy = -Math.sin(b.body) * sp;
      } else {
        b.body = turnToward(b.body, want, turn);
        const sp = top * Math.max(0, Math.cos(wrapA(want - b.body))) * mag;
        vx = Math.cos(b.body) * sp; vy = Math.sin(b.body) * sp;
      }
      // on oil: slide, most of the old motion carries on
      if (oil) { const k = 1 - Math.exp(-2.5 * dt); vx = b.vx + (vx - b.vx) * k; vy = b.vy + (vy - b.vy) * k; }
      b.x = Math.max(SIZE / 2, Math.min(W - SIZE / 2, b.x + vx * dt));
      b.y = Math.max(SIZE / 2, Math.min(H - SIZE / 2, b.y + vy * dt));
      b.vx = vx; b.vy = vy;
      // rammer impact: blunt damage + knockback when it slams into an enemy at speed (a spinner's blade already does the hitting)
      if (proc === 'rammer' && b.s.weapon !== 'spinner') {
        b.ramCd -= dt;
        if (b.ramCd <= 0 && !stalled) for (const e of B.bots) {
          if (e.hp <= 0 || e.team === b.team || e.air > 0) continue;
          const ex = e.x - b.x, ey = e.y - b.y, d = Math.hypot(ex, ey);
          if (d > (b.size + e.size) / 2 + 4 || d < 0.01) continue;
          if (((b.vx - (e.vx || 0)) * ex + (b.vy - (e.vy || 0)) * ey) / d < 100) continue;
          const a = Math.atan2(ey, ex), first = !b.rammed;
          B.how = 'ram'; hitBot(B, e, 4 + 1.5 * b.lv.armor + 1.0 * b.lv.hp, b); B.how = null;
          push(e, a, 240); e.stun = Math.max(e.stun, 0.25); e.lastBy = b.i;
          b.kx = -Math.cos(a) * 90; b.ky = -Math.sin(a) * 90; b.ramCd = 1.8; b.rammed = true;
          B.fx.push({ k: 'flip', x: (b.x + e.x) / 2, y: (b.y + e.y) / 2, life: 0.2 });
          if (first && !e.helper) logE(B, { k: 'mod', who: b.i, text: 'first ram into', tgt: e.i });
          break;
        }
      }

      const w = b.s.weapon;
      const pspeed = w === 'mortar' ? b.s.bullet * 0.55 : w === 'saw' ? b.s.bullet * 0.95 : b.s.bullet;
      const tt = w === 'laser' || w === 'railgun' ? 0 : dist / Math.max(50, pspeed);   // beams and the railgun hit instantly
      const aim = Math.atan2(o.y + o.vy * tt - b.y, o.x + o.vx * tt - b.x);
      if (!jammed) b.turret = turnToward(b.turret, aim, rad(b.s.turret) * oc * b.jam * dt);
      b.cd -= dt * oc;
      if (jammed) b.cd = Math.max(b.cd, 0.05);
      b.beam = 0;
      const err = Math.abs(wrapA(aim - b.turret));
      if (w === 'gun' || w === 'shotgun') {
        if (b.cd <= 0 && err < rad(b.s.tol) && !allyInLine(B, b, b.turret, dist)) {
          const pellets = w === 'shotgun' ? 5 : 1;
          b.cd = 1 / b.s.fire * (w === 'shotgun' ? 1.6 : 1) * (0.9 + rng() * 0.2);
          const spread = rad(25) * (1 - accE / 100) + (w === 'shotgun' ? rad(9) : 0) + fog * rad(22);
          for (let k = 0; k < pellets; k++) {
            const a = b.turret + (rng() * 2 - 1) * spread;
            const sx = b.x + Math.cos(b.turret) * 26, sy = b.y + Math.sin(b.turret) * 26;
            B.bullets.push({ x: sx, y: sy, vx: Math.cos(a) * pspeed, vy: Math.sin(a) * pspeed, owner: b.i,
              dmg: w === 'shotgun' ? b.s.dmg * 0.42 : b.s.dmg, life: w === 'shotgun' ? 260 / pspeed : 3 });
          }
          B.fx.push({ k: 'flash', x: b.x + Math.cos(b.turret) * 26, y: b.y + Math.sin(b.turret) * 26, life: 0.06 });
          b.shots += pellets;
        }
      } else if (w === 'spinner') {
        b.spin = (b.spin || 0) + dt * 18;
        if (b.cd <= 0) {
          let hit = null, hd = Infinity;
          for (const e of B.bots) {
            if (e.hp <= 0 || e.squad === b.squad || e.air > 0) continue;
            const d = Math.hypot(e.x - b.x, e.y - b.y);
            if (d < (b.size + e.size) / 2 + 8 && d < hd) { hd = d; hit = e; }
          }
          if (hit && !jammed) {
            const a = Math.atan2(hit.y - b.y, hit.x - b.x);
            critHit(B, hit, b.s.fp * 0.75, b);
            push(hit, a, 340); hit.stun = Math.max(hit.stun, 0.35); hit.lastBy = b.i;
            b.kx = -Math.cos(a) * 200; b.ky = -Math.sin(a) * 200;
            b.cd = 1 / b.s.fire; b.hits++; b.shots++;
            B.fx.push({ k: 'spark', x: (b.x + hit.x) / 2, y: (b.y + hit.y) / 2, life: 0.2 });
          }
        }
      } else if (w === 'flame') {
        b.flame = 0;
        if (dist < 140 && err < rad(25) && !jammed && !allyInLine(B, b, b.turret, dist)) {
          b.flame = 1;
          for (const e of B.bots) {
            if (e.hp <= 0 || e.squad === b.squad) continue;
            const ex = e.x - b.x, ey = e.y - b.y, d = Math.hypot(ex, ey);
            if (d > 140 + e.size / 2 || Math.abs(wrapA(Math.atan2(ey, ex) - b.turret)) > rad(22)) continue;
            if (B.walls.some(wl => wl.team !== b.team && rayHitsSeg(b.x, b.y, ex / d, ey / d, wl) != null && rayHitsSeg(b.x, b.y, ex / d, ey / d, wl) < d)) continue;
            hitBot(B, e, b.s.fp * 0.5 * oc * dt, b, true);
            if (e.mod === 'reflect' && !e.revealed) { e.revealed = true; logE(B, { k: 'mod', who: e.i, text: 'reflective plating vs flames of', tgt: b.i }); }
            e.burn = Math.min(4, (e.burn || 0) + dt * 2 * (e.mod === 'reflect' ? 0.5 : 1)); e.burnBy = b.i;
            b.hits += dt;
          }
          // oil in the cone catches fire
          for (const q of B.oils) {
            if (q.fire > 0) continue;
            const ex = q.x - b.x, ey = q.y - b.y, d = Math.hypot(ex, ey);
            if (d < 140 + q.r * 0.5 && Math.abs(wrapA(Math.atan2(ey, ex) - b.turret)) < rad(30)) { q.fire = 3; q.life = Math.max(q.life, 3); q.by = b.i; logE(B, { k: 'mod', who: b.i, text: 'set the oil slick on fire' }); }
          }
          b.shots += dt;
        }
      } else if (w === 'railgun') {
        // hitscan slug: needs near-perfect aim, goes through every robot and wall in its 450 px path, ignores half the armour
        if (b.cd <= 0 && err < rad(2) && dist < 450 && !jammed && !allyInLine(B, b, b.turret, dist)) {
          b.cd = 1 / b.s.fire;
          const a = b.turret + (rng() * 2 - 1) * (rad(18) * (1 - accE / 100) + fog * rad(12));
          for (const e of B.bots) {
            if (e.squad === b.squad || e.hp <= 0 || e.air > 0) continue;
            const ex = e.x - b.x, ey = e.y - b.y;
            const along = ex * Math.cos(a) + ey * Math.sin(a), perp = Math.abs(-ex * Math.sin(a) + ey * Math.cos(a));
            if (along > 0 && along < 450 && perp < e.size / 2 + 2) { critHit(B, e, b.s.dmg, b, 0.5); push(e, a, 120); b.hits++; }
          }
          B.fx.push({ k: 'rail', x: b.x, y: b.y, a, len: 450, squad: b.squad, life: 0.3 });
          b.shots++;
        }
      } else if (w === 'saw') {
        if (b.cd <= 0 && err < rad(6) && !allyInLine(B, b, b.turret, dist)) {
          b.cd = 1 / b.s.fire * (0.9 + rng() * 0.2);
          const spread = rad(18) * (1 - accE / 100) + fog * rad(22);
          const a = b.turret + (rng() * 2 - 1) * spread, v = pspeed;
          B.saws.push({ x: b.x + Math.cos(b.turret) * 24, y: b.y + Math.sin(b.turret) * 24, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            owner: b.i, squad: b.squad, dmg: b.s.dmg, life: 4, hits: 0, bounces: 0, last: -1, lastT: -9 });
          b.shots++;
        }
      } else if (w === 'mortar') {
        if (b.cd <= 0 && err < rad(8) && dist > 110) {
          b.cd = 1 / b.s.fire;
          const flight = dist / pspeed;
          const scatter = 90 * (1 - accE / 100) + fog * 70;
          const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * scatter;
          const tx = o.x + o.vx * flight + Math.cos(a) * r, ty = o.y + o.vy * flight + Math.sin(a) * r;
          // hold fire if a teammate is near the planned impact
          if (B.bots.some(p => p !== b && p.hp > 0 && p.team === b.team && Math.hypot(p.x - o.x, p.y - o.y) < 60)) { b.cd = 0.2; continue; }
          B.shells.push({ sx: b.x, sy: b.y, tx, ty, t: 0, T: flight, owner: b.i, dmg: b.s.dmg });
          b.shots++;
        }
      } else if (w === 'laser') {
        if (dist < 280 && !jammed && !allyInLine(B, b, b.turret, dist)) {
          const wob = (rad(14) * (1 - accE / 100) + fog * rad(18)) * Math.sin(B.t * 9 + b.i * 2);
          const a = b.turret + wob;
          // perpendicular distance from target centre to the beam
          b.beam = 1; b.beamA = a;
          // enemy walls cut the beam short
          let len = 280, wallHit = null;
          for (const wl of B.walls) {
            if (wl.team === b.team) continue;
            const t = rayHitsSeg(b.x, b.y, Math.cos(a), Math.sin(a), wl);
            if (t != null && t < len) { len = t; wallHit = wl; }
          }
          b.beamLen = len;
          if (wallHit) wallHit.hp -= b.s.fp * 0.6 * oc * dt;
          // the beam goes through everything in its path, friend or foe (not its own squad)
          for (const e of B.bots) {
            if (e.squad === b.squad || e.hp <= 0) continue;
            const ex = e.x - b.x, ey = e.y - b.y;
            const along = ex * Math.cos(a) + ey * Math.sin(a), perp = Math.abs(-ex * Math.sin(a) + ey * Math.cos(a));
            if (along > 0 && along < len && perp < e.size / 2 && !(e.air > 0)) {
              if (e.mod === 'reflect') {
                // half the beam bounces back at the shooter
                if (!e.revealed) { e.revealed = true; logE(B, { k: 'mod', who: e.i, text: 'reflected the laser of', tgt: b.i }); }
                hitBot(B, e, b.s.fp * 0.3 * dt, b, true); B.how = 'reflected laser'; hitBot(B, b, b.s.fp * 0.3 * dt, e, true); B.how = null;
              } else hitBot(B, e, b.s.fp * 0.6 * oc * dt, b, true);
              b.hits += dt;
            }
          }
          b.shots += dt;
        }
      }
      b.hitT = Math.max(0, b.hitT - dt);
    }
    for (let k = B.bullets.length - 1; k >= 0; k--) {
      const q = B.bullets[k];
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      const own = B.bots[q.owner];
      const wl = B.walls.find(w => w.team !== own.team && segDist(q.x, q.y, w) < 5);
      if (wl) { wl.hp -= q.dmg; B.fx.push({ k: 'hit', x: q.x, y: q.y, life: 0.08 }); B.bullets.splice(k, 1); continue; }
      let tgt = null;
      for (const e of B.bots) if (e.hp > 0 && !(e.air > 0) && e.squad !== own.squad && Math.abs(q.x - e.x) < e.size / 2 + 2 && Math.abs(q.y - e.y) < e.size / 2 + 2) { tgt = e; break; }
      if (tgt && tgt.s.weapon === 'spinner' && B.rng() < 0.25) {
        // glances off the spinning disc
        const nx = q.x - tgt.x, ny = q.y - tgt.y, nl = Math.hypot(nx, ny) || 1, dot = (q.vx * nx + q.vy * ny) / nl;
        q.vx -= 2 * dot * nx / nl; q.vy -= 2 * dot * ny / nl; q.owner = tgt.i;
        B.fx.push({ k: 'spark', x: q.x, y: q.y, life: 0.15 }); continue;
      }
      if (tgt) {
        critHit(B, tgt, q.dmg, own); own.hits++;
        B.fx.push({ k: 'hit', x: q.x, y: q.y, life: 0.1 });
        B.bullets.splice(k, 1); continue;
      }
      if (q.life <= 0 || q.x < 0 || q.y < 0 || q.x > W || q.y > H) B.bullets.splice(k, 1);
    }
    // saw blades: bounce off the arena edge, energy walls and robots, up to 3 robot hits
    for (let k = B.saws.length - 1; k >= 0; k--) {
      const q = B.saws[k];
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.x < 7 || q.x > W - 7) { q.vx *= -0.9; q.vy *= 0.9; q.x = Math.max(7, Math.min(W - 7, q.x)); q.bounces++; q.dmg *= 0.75; B.fx.push({ k: 'hit', x: q.x, y: q.y, life: 0.06 }); }
      if (q.y < 7 || q.y > H - 7) { q.vy *= -0.9; q.vx *= 0.9; q.y = Math.max(7, Math.min(H - 7, q.y)); q.bounces++; q.dmg *= 0.75; B.fx.push({ k: 'hit', x: q.x, y: q.y, life: 0.06 }); }
      const own = B.bots[q.owner];
      for (const wl of B.walls) {
        if (wl.team === own.team || segDist(q.x, q.y, wl) > 8) continue;
        const ex = wl.x2 - wl.x1, ey = wl.y2 - wl.y1, el = Math.hypot(ex, ey), nx = -ey / el, ny = ex / el;
        const dot = q.vx * nx + q.vy * ny; q.vx -= 2 * dot * nx; q.vy -= 2 * dot * ny; q.x += nx * Math.sign(-dot) * 4; q.y += ny * Math.sign(-dot) * 4;
        wl.hp -= q.dmg * 0.5; q.bounces++;
      }
      for (const e of B.bots) {
        if (e.hp <= 0 || e.air > 0 || e.squad === q.squad || (q.last === e.i && B.t - q.lastT < 0.4)) continue;
        const dx = q.x - e.x, dy = q.y - e.y, d = Math.hypot(dx, dy);
        if (d > e.size / 2 + 7) continue;
        if (e.s.weapon === 'spinner' && B.rng() < 0.25) { const nx = dx / (d || 1), ny = dy / (d || 1), dot = q.vx * nx + q.vy * ny; if (dot < 0) { q.vx -= 2 * dot * nx; q.vy -= 2 * dot * ny; } q.last = e.i; q.lastT = B.t; B.fx.push({ k: 'spark', x: q.x, y: q.y, life: 0.15 }); break; }
        critHit(B, e, q.dmg, own); own.hits++;
        B.fx.push({ k: 'hit', x: q.x, y: q.y, life: 0.1 });
        // ricochet away from the robot it hit
        const nx = dx / (d || 1), ny = dy / (d || 1), dot = q.vx * nx + q.vy * ny;
        if (dot < 0) { q.vx -= 2 * dot * nx; q.vy -= 2 * dot * ny; }
        q.vx *= 0.85; q.vy *= 0.85; q.hits++; q.dmg *= 0.75; q.last = e.i; q.lastT = B.t;
        break;
      }
      if (q.life <= 0 || q.hits >= 3 || Math.hypot(q.vx, q.vy) < 110) B.saws.splice(k, 1);
    }
    for (let k = B.shells.length - 1; k >= 0; k--) {
      const q = B.shells[k];
      q.t += dt;
      if (q.t >= q.T) {
        const own = B.bots[q.owner];
        for (const e of B.bots) {
          if (e.hp <= 0 || (e.squad === own.squad && e !== own)) continue;   // splash hits everyone except your own helpers, the shooter included
          const d = Math.hypot(e.x - q.tx, e.y - q.ty);
          if (d < 45) { critHit(B, e, q.dmg * (d < 22 ? 1 : 0.5), own); own.hits++; }
        }
        B.fx.push({ k: 'boom', x: q.tx, y: q.ty, life: 0.25 });
        B.shells.splice(k, 1);
      }
    }
    for (let k = B.mines.length - 1; k >= 0; k--) {
      const m = B.mines[k]; m.age += dt;
      if (m.age < 0.6) continue;
      const hit = B.bots.find(e => e.hp > 0 && !(e.air > 0) && e.squad !== m.squad && Math.hypot(e.x - m.x, e.y - m.y) < 20);
      if (hit) { B.mines.splice(k, 1); B.bots[m.owner].revealed = true; explode(B, m.x, m.y, 40, m.dmg || 22, B.bots[m.owner], 'boom', true); }
    }
    for (let k = B.decoys.length - 1; k >= 0; k--) {
      const d = B.decoys[k]; d.life -= dt;
      d.x = Math.max(SIZE / 2, Math.min(W - SIZE / 2, d.x + d.vx * dt)); d.y = Math.max(SIZE / 2, Math.min(H - SIZE / 2, d.y + d.vy * dt));
      if (d.x <= SIZE / 2 || d.x >= W - SIZE / 2) d.vx *= -1; if (d.y <= SIZE / 2 || d.y >= H - SIZE / 2) d.vy *= -1;
      if (d.life <= 0 || B.bots[d.owner].hp <= 0) B.decoys.splice(k, 1);
    }
    for (let k = B.walls.length - 1; k >= 0; k--) { const wl = B.walls[k]; wl.life -= dt; if (wl.life <= 0 || wl.hp <= 0) { if (wl.hp <= 0) B.fx.push({ k: 'hit', x: (wl.x1 + wl.x2) / 2, y: (wl.y1 + wl.y2) / 2, life: 0.2 }); B.walls.splice(k, 1); } }
    for (let k = B.smokes.length - 1; k >= 0; k--) { B.smokes[k].life -= dt; if (B.smokes[k].life <= 0) B.smokes.splice(k, 1); }
    for (let k = B.oils.length - 1; k >= 0; k--) {
      const q = B.oils[k]; q.life -= dt;
      if (q.fire > 0) {
        q.fire -= dt;
        // burning oil: 12 damage/s to every robot in it, friend or foe
        for (const e of B.bots) if (e.hp > 0 && Math.hypot(e.x - q.x, e.y - q.y) < q.r) { B.how = 'oil fire'; hitBot(B, e, 12 * dt, B.bots[q.by >= 0 ? q.by : q.owner], true); B.how = null; }
        if (q.fire <= 0) q.life = 0;
      }
      if (q.life <= 0) B.oils.splice(k, 1);
    }
    for (let k = B.fx.length - 1; k >= 0; k--) { B.fx[k].life -= dt; if (B.fx[k].life <= 0) B.fx.splice(k, 1); }
    for (let k = B.banners.length - 1; k >= 0; k--) { const bn = B.banners[k]; bn.life -= dt; bn.y -= 18 * dt; if (bn.life <= 0) B.banners.splice(k, 1); }
    if (Math.floor(B.t * 4) !== Math.floor((B.t - dt) * 4)) B.trace.push({ t: B.t, sh: teamShares(B) });
    const alive = [...new Set(B.bots.filter(b => b.hp > 0 && !b.helper).map(b => b.team))];
    if (alive.length <= 1) {
      B.over = true;
      B.winner = alive.length ? alive[0] : -1;
    } else if (B.t >= 60 + (B.n - 2) * 30) {
      B.over = true; B.timeout = true;
      const score = {};
      for (const b of B.bots) if (!b.helper) score[b.team] = (score[b.team] || 0) + Math.max(0, b.hp) / b.s.hp;
      let best = -1, bv = -1, tie = false;
      for (const t in score) { if (score[t] > bv) { bv = score[t]; best = +t; tie = false; } else if (score[t] === bv) tie = true; }
      B.winner = tie ? -1 : best;
    }
  }

  // share of each team's starting health that is left (main robots only)
  function teamShares(B) {
    const hp = {}, max = {};
    for (const b of B.bots) if (!b.helper) { hp[b.team] = (hp[b.team] || 0) + Math.max(0, b.hp); max[b.team] = (max[b.team] || 0) + b.s.hp; }
    const out = {}; for (const t in hp) out[t] = Math.round(hp[t] / max[t] * 1000) / 1000;
    return out;
  }
  function segDist(px, py, w) {
    const vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy;
    const t = Math.max(0, Math.min(1, ((px - w.x1) * vx + (py - w.y1) * vy) / L2));
    return Math.hypot(px - (w.x1 + vx * t), py - (w.y1 + vy * t));
  }
  function rayHitsSeg(ox, oy, dx, dy, w) {
    const ex = w.x2 - w.x1, ey = w.y2 - w.y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((w.x1 - ox) * ey - (w.y1 - oy) * ex) / den, u = ((w.x1 - ox) * dy - (w.y1 - oy) * dx) / den;
    return t > 0 && u >= 0 && u <= 1 ? t : null;
  }
  function runHelper(B, h, dt) {
    const W = B.W, H = B.H;
    const m = B.bots[h.owner];
    if (m.hp <= 0) { h.hp = 0; return; }
    h.beam = 0;
    if (h.stun > 0) { h.stun -= dt; h.vx = h.vy = 0; return; }
    const tgt = m.target >= 0 && B.bots[m.target].hp > 0 ? B.bots[m.target] : null;
    const ax = tgt ? tgt.x - m.x : Math.cos(m.body), ay = tgt ? tgt.y - m.y : Math.sin(m.body), al = Math.hypot(ax, ay) || 1;
    const ux = ax / al, uy = ay / al;
    let gx, gy;
    if (h.helper === 'medic') { gx = m.x - ux * 45 - uy * 12; gy = m.y - uy * 45 + ux * 12; }
    else if (h.helper === 'waller') { gx = m.x + ux * 55; gy = m.y + uy * 55; }
    else if (h.helper === 'bodyguard') { gx = m.x + ux * 38; gy = m.y + uy * 38; }
    else if (h.helper === 'spotter') { gx = m.x - ux * 60 + uy * 30; gy = m.y - uy * 60 - ux * 30; }
    else if (h.helper === 'jammer') { const d2 = tgt ? Math.max(40, Math.min(al - 60, 130)) : 50; gx = m.x + ux * d2 - uy * 25; gy = m.y + uy * d2 + ux * 25; }
    else if (h.helper === 'gunner') { const a = B.t * 1.4 + h.phase; gx = m.x + Math.cos(a) * 55; gy = m.y + Math.sin(a) * 55; }
    else if (h.helper === 'bomber') {
      if (tgt && B.t > 2) { gx = tgt.x; gy = tgt.y; h.diving = true; } else { gx = m.x - ux * 40; gy = m.y - uy * 40; }
    }
    else { const a = B.t * 0.9 + h.phase; gx = m.x + Math.cos(a) * 85; gy = m.y + Math.sin(a) * 85; }
    let mx = gx - h.x, my = gy - h.y;
    for (const p of B.bots) { if (p === h || p.hp <= 0) continue; const sx = h.x - p.x, sy = h.y - p.y, sd = Math.hypot(sx, sy); if (sd < 26 && sd > 0.01) { mx += sx / sd * 20; my += sy / sd * 20; } }
    if (h.diving) { mx = gx - h.x; my = gy - h.y; }   // bombers ignore spacing
    const d = Math.hypot(mx, my), sp = Math.min(h.s.speed, d * 4);
    if (d > 0.5) { h.vx = mx / d * sp; h.vy = my / d * sp; h.body = Math.atan2(my, mx); } else { h.vx = h.vy = 0; }
    h.x = Math.max(10, Math.min(W - 10, h.x + h.vx * dt)); h.y = Math.max(10, Math.min(H - 10, h.y + h.vy * dt));
    h.cd -= dt;
    if (h.helper === 'medic') {
      // several medics don't stack fully: the robot can take at most 6 health/s of healing in total
      if (m.hp < m.s.hp && Math.hypot(m.x - h.x, m.y - h.y) < 130 && (m.healT || 0) < B.t) { const room = 8 - (m.healAcc || 0); const amt = Math.min(4, Math.max(0, room)); if (amt > 0) { m.hp = Math.min(m.s.hp, m.hp + amt * dt); m.healAcc = (m.healAcc || 0) + amt; h.beam = 1; } }
    } else if (h.helper === 'waller') {
      if (h.cd <= 0 && tgt && al < 480) {
        const own = B.walls.filter(w => w.owner === h.i);
        if (own.length >= 2) B.walls.splice(B.walls.indexOf(own[0]), 1);
        const px = -uy, py = ux, cx = h.x + ux * 8, cy = h.y + uy * 8;
        B.walls.push({ x1: cx - px * 34, y1: cy - py * 34, x2: cx + px * 34, y2: cy + py * 34, hp: 40, life: 6, team: h.team, squad: h.squad, owner: h.i });
        h.cd = 5;
      }
    } else if (h.helper === 'gunner') {
      if (h.cd <= 0 && tgt) {
        const tt = Math.hypot(tgt.x - h.x, tgt.y - h.y) / 500;
        const a = Math.atan2(tgt.y + tgt.vy * tt - h.y, tgt.x + tgt.vx * tt - h.x) + (B.rng() * 2 - 1) * rad(8);
        B.bullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * 500, vy: Math.sin(a) * 500, owner: h.i, dmg: 3, life: 1.2 });
        h.cd = 0.5;
      }
    } else if (h.helper === 'bomber') {
      if (h.diving && tgt && Math.hypot(tgt.x - h.x, tgt.y - h.y) < 24) { h.hp = 0; explode(B, h.x, h.y, 50, 24, h, 'boom', true); }
    } else if (h.helper === 'miner') {
      if (h.cd <= 0) {
        const own = B.mines.filter(x => x.owner === h.i);
        if (own.length >= 5) B.mines.splice(B.mines.indexOf(own[0]), 1);
        B.mines.push({ x: h.x, y: h.y, owner: h.i, squad: h.squad, age: 0, dmg: 24 });
        h.cd = 1.6;
      }
    }
  }

  function runModule(B, b, dt) {
    const m = b.mod; if (!m) return;
    b.modCd -= dt;
    const foes = B.bots.filter(e => e.hp > 0 && e.team !== b.team);
    const near = foes.reduce((best, e) => { const d = Math.hypot(e.x - b.x, e.y - b.y); return d < best.d ? { e, d } : best; }, { e: null, d: Infinity });
    if (m === 'shield') { if (B.t - b.lastHit > 3) b.shield = Math.min(25, b.shield + 10 * dt); }
    else if (m === 'repair') { if (B.t - b.lastHit > 1.2 && b.hp < b.s.hp) { const h = Math.min(b.s.hp - b.hp, 6 * dt); b.hp += h; b.healed += h; b.revealed = true; } }
    else if (m === 'flipper') {
      if (b.stun <= 0 && b.modCd <= 0 && near.e && near.d < 48) {
        const e = near.e, a = Math.atan2(e.y - b.y, e.x - b.x);
        hitBot(B, e, 14, b, true); push(e, a, 480); e.stun = Math.max(e.stun, 1.3); e.lastBy = b.i;
        if (!b.revealed) logE(B, { k: 'mod', who: b.i, text: 'first flip on', tgt: e.i });
        b.modCd = 3; b.revealed = true; B.fx.push({ k: 'flip', x: (b.x + e.x) / 2, y: (b.y + e.y) / 2, life: 0.25 });
      }
    }
    else if (m === 'emp') {
      if (b.stun <= 0 && b.modCd <= 0 && near.e && near.d < 130) {
        let nStun = 0;
        for (const e of B.bots) if (e !== b && e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < 150) { e.stun = Math.max(e.stun, 1.8); if (e.team !== b.team && !e.helper) nStun++; }
        if (nStun) logE(B, { k: 'mod', who: b.i, text: 'EMP stunned ' + nStun + ' enem' + (nStun > 1 ? 'ies' : 'y') });
        b.modCd = 12; b.revealed = true; B.fx.push({ k: 'emp', x: b.x, y: b.y, r: 150, life: 0.4 });
      }
    }
    else if (m === 'mines') {
      if (b.modCd <= 0 && Math.hypot(b.vx, b.vy) > 30) {
        const own = B.mines.filter(x => x.owner === b.i);
        if (own.length >= 5) B.mines.splice(B.mines.indexOf(own[0]), 1);
        B.mines.push({ x: b.x - Math.cos(b.body) * 22, y: b.y - Math.sin(b.body) * 22, owner: b.i, squad: b.squad, age: 0 });
        b.modCd = 1.6;
      }
    }
    else if (m === 'decoy') {
      if (!b.modUsed && b.hp < b.s.hp * 0.6) {
        b.modUsed = true; b.revealed = true;
        logE(B, { k: 'mod', who: b.i, text: 'decoy hologram' });
        const a = b.body + (B.rng() < 0.5 ? 1 : -1) * Math.PI / 2;
        // every enemy currently aiming at this robot gets fooled
        const fooled = B.bots.filter(e => e.team !== b.team && e.target === b.i).map(e => e.i);
        B.decoys.push({ owner: b.i, x: b.x, y: b.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 2.5, fooled, body: b.body });
      }
    }
    else if (m === 'grapple') {
      const t = b.target >= 0 ? B.bots[b.target] : null;
      if (b.stun <= 0 && b.modCd <= 0 && t && t.hp > 0 && !(t.air > 0) && t.team !== b.team) {
        const d = Math.hypot(t.x - b.x, t.y - b.y);
        if (d > 60 && d < 240) {
          const a = Math.atan2(b.y - t.y, b.x - t.x);
          push(t, a, 840); t.stun = Math.max(t.stun, 0.4); t.lastBy = b.i;
          if (!b.revealed) logE(B, { k: 'mod', who: b.i, text: 'first grapple on', tgt: t.i });
          b.modCd = 8; b.revealed = true; B.fx.push({ k: 'tether', x: b.x, y: b.y, x2: t.x, y2: t.y, squad: b.squad, life: 0.3 });
        }
      }
    }
    else if (m === 'jets') {
      if (b.stun <= 0 && b.modCd <= 0) {
        let tx = null, ty = null;
        // brawlers (spinner, rammer, flamethrower, ready flipper) want contact, so only shells make them jump
        const brawler = b.s.weapon === 'spinner' || b.s.weapon === 'flame' || (b.proc === 'rammer' && !b.procBroken) || (b.mod === 'flipper');
        if (!brawler && near.e && near.d < 90 && !near.e.helper) { tx = near.e.x; ty = near.e.y; }
        else { const sh = B.shells.find(q => B.bots[q.owner].team !== b.team && q.T - q.t < 0.4 && Math.hypot(q.tx - b.x, q.ty - b.y) < 50); if (sh) { tx = sh.tx; ty = sh.ty; } }
        if (tx != null) {
          let a = Math.atan2(b.y - ty, b.x - tx);
          // don't jump into a wall: if the landing spot is outside, jump sideways instead
          for (const turn of [0, 0.9, -0.9, 1.8, -1.8]) { const lx = b.x + Math.cos(a + turn) * 160, ly = b.y + Math.sin(a + turn) * 160; if (lx > 30 && lx < B.W - 30 && ly > 30 && ly < B.H - 30) { a += turn; break; } }
          b.jx = Math.cos(a) * 160 / 0.35; b.jy = Math.sin(a) * 160 / 0.35; b.air = 0.35;
          if (!b.revealed) logE(B, { k: 'mod', who: b.i, text: 'jump jets' });
          b.modCd = 7; b.revealed = true; B.fx.push({ k: 'boom', x: b.x, y: b.y, r: 30, life: 0.25 });
        }
      }
    }
    else if (m === 'oil') {
      if (b.modCd <= 0 && b.hp < b.s.hp * 0.65) {
        B.oils.push({ x: b.x, y: b.y, r: 65, life: 5, fire: 0, owner: b.i, by: -1 });
        if (!b.revealed) logE(B, { k: 'mod', who: b.i, text: 'oil slick' });
        b.modCd = 8; b.revealed = true;
      }
    }
    else if (m === 'smoke') {
      if (!b.modUsed && b.hp < b.s.hp * 0.5) { b.modUsed = true; b.revealed = true; B.smokes.push({ x: b.x, y: b.y, r: 90, life: 4 }); logE(B, { k: 'mod', who: b.i, text: 'smoke screen' }); }
    }
  }

  function fight(a, b, seed, dt) {
    const B = newBattle([a, b], seed);
    dt = dt || 1 / 60;
    while (!B.over) step(B, dt);
    return B;
  }

  // recap: the key moments of a finished fight in plain English.
  // nameOf(i) names main robot i; teamName(t) names team t (team fights). Returns { headline, turning, lines, summary }.
  function recap(B, nameOf, teamName) {
    nameOf = nameOf || (i => 'Robot ' + (i + 1));
    const bots = B.bots, mains = bots.filter(b => !b.helper);
    const teamFight = new Set(mains.map(b => b.team)).size < mains.length;
    const nm = i => { const b = bots[i]; return b.helper ? nameOf(b.owner) + "'s " + HELPERS[b.helper].name : nameOf(i); };
    const side = t => teamFight && teamName ? teamName(t) : nameOf(mains.find(b => b.team === t).i);
    const all = [];
    const add = (ev, pri, k, text, extra) => all.push(Object.assign({ t: ev.t, pri, k, who: ev.who != null ? (bots[ev.who].helper ? bots[ev.who].owner : ev.who) : null, text }, extra));
    for (const ev of B.log) {
      if (ev.k === 'ko') add(ev, 10, 'ko', ev.self ? nm(ev.who) + ' blew itself up (' + ev.how + ')' : nm(ev.who) + ' destroyed by ' + nm(ev.by) + ' (' + (ev.friendly ? 'friendly fire, ' : '') + ev.how + ')');
      else if (ev.k === 'break') add(ev, 9, 'break', nm(ev.who) + ': ' + ev.text + ', ' + ev.part.toLowerCase() + ' broke');
      else if (ev.k === 'critko') add(ev, 8, 'crit', nm(ev.who) + ' finished ' + nm(ev.tgt) + ' with a ' + ev.dmg + ' damage crit');
      else if (ev.k === 'glitch') add(ev, 6, 'glitch', nm(ev.who) + ': ' + ev.text + ' for ' + ev.dur + ' s');
      else if (ev.k === 'flank') { const tot = Math.round(bots[ev.tgt].rear[ev.who]); add(ev, tot >= 30 ? 7 : 5, 'flank', nm(ev.who) + ' flanked ' + nm(ev.tgt) + ': ' + tot + ' damage on its blind side', { size: tot }); }
      else if (ev.k === 'mod') add(ev, 5, 'mod', nm(ev.who) + ': ' + ev.text + (ev.tgt != null ? ' ' + nm(ev.tgt) : ''));
      else if (ev.k === 'bigcrit') add(ev, 4, 'crit', nm(ev.who) + ' crit ' + nm(ev.tgt) + ' for ' + ev.dmg, { size: ev.dmg });
      else if (ev.k === 'drone') add(ev, 3, 'drone', nm(ev.who) + ' shot down by ' + nm(ev.by));
    }
    // keep it short: only the biggest crits and flanks, a few module and drone moments, at most 12 lines
    const cap = { crit: 3, flank: 3, mod: 3, drone: 3 };
    const bySize = (a, b) => (b.pri - a.pri) || ((b.size || 0) - (a.size || 0)) || (a.t - b.t);
    let keep = [];
    for (const k of ['ko', 'break', 'glitch', 'crit', 'flank', 'mod', 'drone']) {
      const ls = all.filter(l => l.k === k).sort(bySize);
      keep = keep.concat(cap[k] ? ls.slice(0, cap[k]) : ls);
    }
    keep = keep.sort(bySize).slice(0, 12).sort((a, b) => a.t - b.t);
    // turning point: the last time the eventual winner took the health lead
    let turning = null, comeback = null;
    if (B.winner >= 0 && B.trace.length) {
      const lead = sh => { let best = null, bv = -1, second = -1; for (const t in sh) { if (sh[t] > bv) { second = bv; bv = sh[t]; best = +t; } else if (sh[t] > second) second = sh[t]; } return bv - second > 0.02 ? best : null; };
      let prev = null, tp = null;
      for (const s of B.trace) { const l = lead(s.sh); if (l == null) continue; if (l === B.winner && prev !== B.winner && prev != null) tp = s.t; prev = l; }
      if (tp != null) {
        const near = keep.filter(l => l.pri >= 5 && l.t <= tp + 0.5 && l.t >= tp - 5);
        turning = { t: Math.round(tp * 10) / 10, line: near.length ? near[near.length - 1] : null };
        if (turning.line) turning.line.turn = true;
      }
      let low = 1, lowT = 0;
      for (const s of B.trace) if (s.sh[B.winner] < low) { low = s.sh[B.winner]; lowT = s.t; }
      const at = B.trace.find(s => s.t === lowT);
      if (low < 0.4 && at && Object.keys(at.sh).some(t => +t !== B.winner && at.sh[t] > low)) comeback = Math.round(low * 100);
    }
    const left = mains.filter(b => b.team === B.winner && b.hp > 0).length, of = mains.filter(b => b.team === B.winner).length;
    let headline = B.winner < 0 ? 'Draw after ' + B.t.toFixed(1) + ' s.' :
      side(B.winner) + ' wins' + (B.timeout ? ' on health at the time limit (' + B.t.toFixed(0) + ' s)' : ' in ' + B.t.toFixed(1) + ' s') + (of > 1 ? ', ' + left + ' of ' + of + ' robots left' : '') + '.';
    if (comeback != null) headline += ' Comeback: was down to ' + comeback + '% health.';
    else if (B.winner >= 0 && !turning) headline += ' Led from start to finish.';
    // per side: crits, malfunctions, broken parts
    const teams = [...new Set(mains.map(b => b.team))], summary = [];
    const per = f => teams.map(t => side(t) + ' ' + f(mains.filter(b => b.team === t))).join(' · ');
    summary.push('Crits: ' + per(ms => { const c = ms.reduce((a, b) => a + b.crits, 0); return c + (c ? ' (+' + Math.round(ms.reduce((a, b) => a + b.critDmg, 0)) + ' damage)' : ''); }));
    summary.push('Malfunctions: ' + per(ms => ms.filter(b => b.glitch && b.glitch.done).length) + '. Broken parts: ' + per(ms => ms.reduce((a, b) => a + (b.broken || []).length, 0)) + '.');
    return { headline, turning, lines: keep, summary };
  }

  const WEAPONS = ['gun', 'laser', 'mortar', 'saw', 'spinner', 'flame', 'railgun'];
  const Sim = { SQUADS, WEAPONS, HELPERS, MODS, CAL, W, H, SIZE, STATS, LV, RANGES, STRAIN, ENG_MAX, DRIVES, PROCS, newBattle, step, fight, statsOf, cost, mkRng, strainOf, riskOf, recap, queueCmd };
  if (typeof module !== 'undefined' && module.exports) module.exports = Sim; else root.Sim = Sim;
})(this);

