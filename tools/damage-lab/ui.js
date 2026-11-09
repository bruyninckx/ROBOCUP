// Damage Lab UI + renderer. Visual randomness (sparks, smoke) uses Math.random: it never feeds back into the sim.
(function () {
  'use strict';
  const L = window.DamageLab;
  const LU = window.Lineup || null; // ROBOCUS 2.0 Lineup Arena: robots with levels and power grades, 2.0 part cards
  if (LU) LU.usePK();
  if (LU && LU.ROBOTS4) { Object.assign(LU.ROBOTS, LU.ROBOTS4); if (LU.LEVELS.length < 5) LU.LEVELS.push('Level 4 (end game)'); } // Lineup Arena only: the end-game wave (the tabletop does not load this file)
  // robot colours: 1v1 and FFA use one colour per robot; in 2v2 robots 0 & 2 are team Steel (blues), 1 & 3 team Rust (oranges)
  const PAL = { steel: { name: 'Steel', col: '#3F78A8', dark: '#2C5679', light: '#79A4CB' }, rust: { name: 'Rust', col: '#C8642B', dark: '#8E431B', light: '#E59866' },
    moss: { name: 'Moss', col: '#4C8A3F', dark: '#35612C', light: '#8BC07A' }, violet: { name: 'Violet', col: '#8B6BB1', dark: '#5E4580', light: '#B79AD8' },
    teal: { name: 'Steel', col: '#2E8F9E', dark: '#1F6470', light: '#6CC0CC' }, red: { name: 'Rust', col: '#B8423A', dark: '#80281F', light: '#E07C72' } };
  const curMode = () => S && S.multi ? S.mode : st.mode;
  const TC = i => (typeof S !== 'undefined' && S && S.robots && S.robots[i] && S.robots[i].spec.pal) || (curMode() === '2v2' ? [PAL.steel, PAL.rust, PAL.teal, PAL.red] : [PAL.steel, PAL.rust, PAL.moss, PAL.violet])[i] || PAL.steel;
  const nBots = () => st.mode === '1v1' ? 2 : 4;
  const INK = '#2B2118', STEEL = '#9A9C94', STEEL_D = '#6F7169', RUBBER = '#2A2622', HAZ = '#E8C547';
  const INT_COL = { battery: '#E8C547', radio: '#4C9A5A', motor: '#B87333', wmotor: '#8B6BB1', turret: '#8C8F86', arm: '#8C8F86', module: '#47A8FF', thruster: '#FF8A2A' };
  const MOD_ICON = { shield: ['S', '#47A8FF'], emp: ['E', '#7FD4FF'], grapple: ['G', '#C9A227'], jets: ['J', '#FF8A2A'], oil: ['O', '#3B3530'], mines: ['M', '#D24B3A'], repair: ['+', '#4CC26A'], boom: ['!', '#E0402B'], quantum: ['Q', '#F2C94C'], smoke: ['~', '#9A958C'], popper: ['P', '#D9B43A'] };
  const $ = id => document.getElementById(id);
  const st = { mode: '1v1', spec: [{ preset: 'Brawler' }, { preset: 'Juggernaut' }, { preset: 'Whirlwind' }, { preset: 'Mauler' }], seed: 7, arena: 'open', speed: 1, drama: true, paused: false };
  let S = null, reported = false, logN = 0;
  window.labState = () => S; window.labScreen = (x, y) => toScreen(x, y); // for test scripts (screenshots)

  // ---------- builder ----------
  const OPTS = {
    weapon: Object.entries(L.WEAPONS).map(([k, v]) => [k, v.label]),
    chassis: Object.entries(L.CHASSIS).map(([k, v]) => [k, v.label]),
    drive: Object.entries(L.DRIVES).map(([k, v]) => [k, v.label]),
    motor: Object.entries(L.MOTORS).map(([k, v]) => [k, v.label]),
    battery: Object.entries(L.BATTERIES).map(([k, v]) => [k, v.label]),
    bumper: Object.entries(L.BUMPERS).map(([k, v]) => [k, v.label]),
    proc: Object.entries(L.PROCS).map(([k, v]) => [k, v.label]),
    shape: Object.entries(L.SHAPES).map(([k, v]) => [k, v.label]),
    mod: Object.entries(L.MODULES).map(([k, v]) => [k, v.label]),
  };
  const LBL = { weapon: 'Weapon', chassis: 'Frame', drive: 'Drive', motor: 'Motors', battery: 'Battery', bumper: 'Bumpers', proc: 'Processor', mod: 'Module', shape: 'Hull' };
  const FIELDS = ['weapon', 'chassis', 'shape', 'drive', 'motor', 'battery', 'bumper', 'proc', 'mod'];
  const opt = (list, v) => list.map(([k, l]) => `<option value="${k}"${k === v ? ' selected' : ''}>${l}</option>`).join('');
  if (LU) st.spec = [{ robot: 'Thumper', parts: [] }, { robot: 'Hornet', parts: [] }, { robot: 'Juggernaut', parts: [] }, { robot: 'Forklift', parts: [] }];
  function fullSpec(i) { if (LU) { const s = st.spec[i]; return L.normSpec(LU.build(s.robot, s.parts)); }
    return fullSpecLab(i); }
  function fullSpecLab(i) { const s = st.spec[i]; const base = L.PRESETS[s.preset] || {}; return L.normSpec(Object.assign({}, base, s, { armour: Object.assign({}, base.armour, s.armour) })); }
  const strainOf = sp => L.DRIVES[sp.drive].strain + L.PROCS[sp.proc].strain + L.MODULES[sp.mod].strain + (sp.helpers || []).length;
  function nameOf(i) { if (LU) { const s = st.spec[i], n = s.parts.filter(Boolean).length; return s.robot + (n ? ' +' + n : ''); } return nameOfLab(i); }
  function nameOfLab(i) { const s = st.spec[i]; return s.custom ? (s.cname || 'Custom ' + L.WEAPONS[fullSpec(i).weapon].label.toLowerCase()) : s.preset + (s.wd && s.wd !== 'std' ? ' Mk II' : '') + ((s.helpers || []).length ? '+' + s.helpers.length : ''); }
  // Lineup Arena card: robot by level, two parts and a legendary
  function buildLineupCard(i) {
    const el = $('bot' + i), s = st.spec[i], sp = fullSpec(i), lv = LU.ROBOTS[s.robot][0], P = LU.PARTS;
    el.style.borderTopColor = TC(i).col;
    const robotOpts = LU.LEVELS.map((lab, t) => `<optgroup label="${lab}">${Object.entries(LU.ROBOTS).filter(([, v]) => v[0] === t).map(([k, v]) => `<option value="${k}"${k === s.robot ? ' selected' : ''}>${k} (${L.WEAPONS[L.PRESETS[k].weapon].label.toLowerCase()}, power x${v[1].toFixed(2)})</option>`).join('')}</optgroup>`).join('');
    const partOpts = (cur, leg) => '<option value="">none</option>' + ['drone', 'module', 'stat', 'legendary'].filter(k => leg ? k === 'legendary' : k !== 'legendary').map(kind => `<optgroup label="${kind === 'stat' ? 'Stat cards' : kind === 'legendary' ? 'Legendary' : kind[0].toUpperCase() + kind.slice(1) + 's'}">${Object.entries(P).filter(([, v]) => v.kind === kind).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${v.name} (${v.vs}%)</option>`).join('')}</optgroup>`).join('');
    const parts = s.parts.filter(Boolean);
    el.innerHTML = `
      <div class="bot-head"><div><div class="team" style="color:${TC(i).col}">${st.mode === '2v2' ? 'Team ' + TC(i).name : TC(i).name} · <b>level ${lv}</b></div><h2 id="nm${i}">${nameOf(i)}</h2></div><span class="kg" id="kg${i}"></span></div>
      <div class="grid2" style="grid-template-columns:1fr"><label for="lr${i}">Robot<select id="lr${i}">${robotOpts}</select></label></div>
      <div class="grid2"><label for="lp0${i}">Part 1<select id="lp0${i}" data-slot="0">${partOpts(s.parts[0])}</select></label><label for="lp1${i}">Part 2<select id="lp1${i}" data-slot="1">${partOpts(s.parts[1])}</select></label></div>
      <div class="grid2" style="grid-template-columns:1fr"><label for="lp2${i}">Legendary<select id="lp2${i}" data-slot="2">${partOpts(s.parts[2], true)}</select></label></div>
      <p class="wdesc">${L.WEAPONS[sp.weapon].d}${sp.proc !== 'standard' ? ` <span class="small">${L.PROCS[sp.proc].label}.</span>` : ''}${sp.mod !== 'none' ? ` <span class="small">${L.MODULES[sp.mod].label}.</span>` : ''}</p>
      ${parts.length ? `<p class="wdesc small">${parts.map(k => `<b>${P[k].name}:</b> ${P[k].d}`).join(' ')}</p>` : '<p class="wdesc small">The % next to a part: how often a robot with it beats robots one level up (legendary: two levels up). Stock: about 38% / 25%.</p>'}
      <canvas class="diag" id="dg${i}" width="480" height="300" aria-label="Part health diagram"></canvas>
      <details id="pd${i}"><summary>Parts</summary><div class="parts" id="pl${i}"></div></details>`;
    $('lr' + i).onchange = e => { st.spec[i] = { robot: e.target.value, parts: s.parts.slice() }; buildCard(i); restart(); };
    el.querySelectorAll('[data-slot]').forEach(sel => sel.onchange = () => { const ps = s.parts.slice(); ps[+sel.dataset.slot] = sel.value || null; st.spec[i] = { robot: s.robot, parts: ps }; buildCard(i); restart(); });
    const kg = L.weightOf(sp); $('kg' + i).textContent = kg + ' kg';
  }
  function buildCard(i) {
    if (LU) return buildLineupCard(i);
    const el = $('bot' + i), sp = fullSpec(i), s = st.spec[i];
    el.style.borderTopColor = TC(i).col;
    const pl = keys => keys.map(k => [k, `${k} (${L.WEAPONS[L.PRESETS[k].weapon].label.toLowerCase()})`]);
    const all = Object.keys(L.PRESETS), cur = s.custom ? '' : s.preset;
    const presetOpts = `<optgroup label="Market robots (balanced)">${opt(pl(all.filter(k => L.PRESETS[k].market)), cur)}</optgroup><optgroup label="New weapon trials">${opt(pl(all.filter(k => L.PRESETS[k].trial)), cur)}</optgroup><optgroup label="Older robots (earlier rosters, retired)">${opt(pl(all.filter(k => L.PRESETS[k].classic)), cur)}</optgroup><optgroup label="Level 4 (end game)">${opt(pl(all.filter(k => L.PRESETS[k].l4)), cur)}</optgroup><optgroup label="Test builds (not balanced)">${opt(pl(all.filter(k => !L.PRESETS[k].market && !L.PRESETS[k].classic && !L.PRESETS[k].trial && !L.PRESETS[k].l4)), cur)}</optgroup>`;
    const frontTool = L.frontTool(sp.weapon);
    el.innerHTML = `
      <div class="bot-head"><div><div class="team" style="color:${TC(i).col}">${st.mode === '2v2' ? 'Team ' + TC(i).name + (i > 1 ? ' · robot 2' : ' · robot 1') : st.mode === 'ffa' ? TC(i).name + ' · free-for-all' : TC(i).name}</div><h2 id="nm${i}">${nameOf(i)}</h2></div><span class="kg" id="kg${i}"></span></div>
      <div class="grid2" style="grid-template-columns:1fr"><label for="pre${i}">Preset<select id="pre${i}">${s.custom ? '<option value="" selected>Custom build</option>' : ''}${presetOpts}</select></label></div>
      <div class="grid2">${FIELDS.map(f => `<label for="${f}${i}">${LBL[f]}<select id="${f}${i}" data-f="${f}">${opt(OPTS[f], sp[f])}</select></label>`).join('')}${L.DESIGNS[sp.weapon] ? `<label for="wd${i}">Weapon design<select id="wd${i}" data-w="1">${opt([['std', 'Stock']].concat(Object.entries(L.DESIGNS[sp.weapon]).map(([k, v]) => [k, v.label + ' (Mk II)'])), sp.wd)}</select></label>` : ''}</div>
      <p class="wdesc">${L.WEAPONS[sp.weapon].d} ${sp.wd !== 'std' && L.DESIGNS[sp.weapon] ? `<b>${L.DESIGNS[sp.weapon][sp.wd].label}:</b> ${L.DESIGNS[sp.weapon][sp.wd].d} ` : ''}<span class="small">${L.BUMPERS[sp.bumper || 'steel'].label}: ${L.BUMPERS[sp.bumper || 'steel'].d}${sp.shape && sp.shape !== 'box' ? ` ${L.SHAPES[sp.shape].label}: ${L.SHAPES[sp.shape].d}` : ''}${L.DRIVES[sp.drive].d ? ` ${L.DRIVES[sp.drive].label}: ${L.DRIVES[sp.drive].d}` : ''}${sp.proc !== 'standard' ? ` ${L.PROCS[sp.proc].label}: ${L.PROCS[sp.proc].d}` : ''}${sp.mod !== 'none' ? ` ${L.MODULES[sp.mod].label}: ${L.MODULES[sp.mod].d}` : ''}${strainOf(sp) ? ` <b>Strain ${'⚡'.repeat(strainOf(sp))}</b> (malfunctions)` : ''}</span></p>
      <div class="arm">${['front', 'side', 'rear', 'top'].map(a => `<label for="ar${a}${i}">${a} armour<select id="ar${a}${i}" data-a="${a}"${a === 'front' && frontTool ? ' disabled title="The front tool is the front armour"' : ''}>${[0, 1, 2, 3].map(n => `<option value="${n}"${n === sp.armour[a] ? ' selected' : ''}>${a === 'front' && frontTool ? 'tool' : n === 0 ? 'none' : n}</option>`).join('')}</select></label>`).join('')}</div>
      <canvas class="diag" id="dg${i}" width="480" height="300" aria-label="Part health diagram"></canvas>
      <div class="grid2 drones">${[0, 1, 2].map(k => `<label for="hp${k}${i}">Drone ${k + 1}<select id="hp${k}${i}" data-h="${k}"><option value="">none</option>${Object.entries(L.HELPERS).map(([key, v]) => `<option value="${key}"${(sp.helpers || [])[k] === key ? ' selected' : ''}>${v.label}</option>`).join('')}</select></label>`).join('')}</div>
      ${(sp.helpers || []).length ? `<p class="wdesc small">${sp.helpers.map(key => `<b>${L.HELPERS[key].label}:</b> ${L.HELPERS[key].d}`).join(' ')}</p>` : '<p class="wdesc small">Helper drones are upgrades on top of a build (not in the market deck): up to 3, each adds 1 strain.</p>'}
      <details id="pd${i}"${st.mode === '1v1' ? ' open' : ''}><summary>Parts</summary><div class="parts" id="pl${i}"></div></details>`;
    $('pre' + i).onchange = e => { if (!e.target.value) return; st.spec[i] = { preset: e.target.value, helpers: (s.helpers || []).slice() }; buildCard(i); restart(); };
    el.querySelectorAll('[data-f]').forEach(sel => sel.onchange = () => { const cur = fullSpec(i); st.spec[i] = Object.assign({}, cur, { [sel.dataset.f]: sel.value, custom: true, preset: s.preset }); buildCard(i); restart(); });
    el.querySelectorAll('[data-w]').forEach(sel => sel.onchange = () => { const cur = fullSpec(i); st.spec[i] = s.custom ? Object.assign({}, cur, { wd: sel.value, custom: true, preset: s.preset }) : { preset: s.preset, helpers: (s.helpers || []).slice(), wd: sel.value }; buildCard(i); restart(); });
    el.querySelectorAll('[data-h]').forEach(sel => sel.onchange = () => { const cur = fullSpec(i), hs = [0, 1, 2].map(k => $('hp' + k + i).value).filter(Boolean); st.spec[i] = s.custom ? Object.assign({}, cur, { helpers: hs, custom: true, preset: s.preset }) : { preset: s.preset, helpers: hs, wd: s.wd }; buildCard(i); restart(); });
    el.querySelectorAll('[data-a]').forEach(sel => sel.onchange = () => { const cur = fullSpec(i); cur.armour[sel.dataset.a] = +sel.value; st.spec[i] = Object.assign({}, cur, { custom: true, preset: s.preset }); buildCard(i); restart(); });
    const kg = L.weightOf(sp), k = $('kg' + i);
    k.textContent = kg + ' kg'; k.classList.toggle('over', kg > 120); k.title = kg > 120 ? 'Over the 120 kg class limit (the lab does not stop you)' : 'Heavyweight class limit: 120 kg';
  }

  // ---------- canvas ----------
  const cv = $('arena'), ctx = cv.getContext('2d');
  const VIEW = 8.8; // metres shown edge to edge
  let W = 600, dpr = 1, K = 50;
  const floorC = document.createElement('canvas'), decal = document.createElement('canvas');
  const FPX = 120; floorC.width = floorC.height = decal.width = decal.height = VIEW * FPX;
  const dctx = decal.getContext('2d');
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(200, Math.round(cv.clientWidth * dpr));
    if (cv.width !== w) { cv.width = w; cv.height = w; }
    W = w; K = W / VIEW;
  }
  window.addEventListener('resize', resize);
  function vrng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function paintFloor() {
    const g = floorC.getContext('2d'), r = vrng(99), P = FPX, H = L.HALF;
    g.fillStyle = '#4A443D'; g.fillRect(0, 0, floorC.width, floorC.height);
    const o = (VIEW / 2 - H) * P, sz = 2 * H * P;
    g.fillStyle = '#BDB5A7'; g.fillRect(o, o, sz, sz);
    for (let i = 0; i < 900; i++) { // concrete blotches
      const x = o + r() * sz, y = o + r() * sz, rr = 4 + r() * 40;
      g.fillStyle = r() < 0.5 ? `rgba(80,66,50,${0.015 + r() * 0.03})` : `rgba(255,250,240,${0.015 + r() * 0.035})`;
      g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 9; i++) { const x = o + r() * sz, y = o + r() * sz; g.fillStyle = 'rgba(40,30,20,0.10)'; g.beginPath(); g.ellipse(x, y, 30 + r() * 50, 20 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(60,48,36,0.35)'; g.lineWidth = 2;
    for (let k = -H + 1; k < H; k++) { const p = o + (k + H) * P; g.beginPath(); g.moveTo(p, o); g.lineTo(p, o + sz); g.moveTo(o, p); g.lineTo(o + sz, p); g.stroke(); }
    g.fillStyle = 'rgba(60,48,36,0.45)';
    for (let a = -H + 1; a < H; a++) for (let b = -H + 1; b < H; b++) { g.beginPath(); g.arc(o + (a + H) * P, o + (b + H) * P, 3.5, 0, Math.PI * 2); g.fill(); }
    // hazard stripe along the walls
    g.save(); g.beginPath(); g.rect(o, o, sz, sz); g.rect(o + 14, o + 14, sz - 28, sz - 28); g.clip('evenodd');
    for (let t = -sz; t < sz * 2; t += 28) { g.fillStyle = (t / 28) % 2 ? '#2B2118' : HAZ; g.beginPath(); g.moveTo(o + t, o); g.lineTo(o + t + 14, o); g.lineTo(o + t + 14 - sz, o + sz); g.lineTo(o + t - sz, o + sz); g.fill(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(o, o, sz, sz);
  }
  const toD = v => (v + VIEW / 2) * FPX;
  function decalReset() { dctx.clearRect(0, 0, decal.width, decal.height); }

  // ---------- particles ----------
  let parts = [];
  function spawn(p) { if (parts.length < 1400) parts.push(p); }
  function sparks(x, y, power, nx, ny) {
    const n = Math.min(26, 2 + power / 5);
    for (let i = 0; i < n; i++) {
      const a = (nx != null ? Math.atan2(ny, nx) + (Math.random() < 0.5 ? 0 : Math.PI) : Math.random() * 6.28) + (Math.random() - 0.5) * 2.2, v = 1.5 + Math.random() * (2 + power * 0.08);
      spawn({ t: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.15 + Math.random() * 0.35, max: 0.5 });
    }
  }
  function smoke(x, y, dark, size) { spawn({ t: 'smoke', x, y, vx: (Math.random() - 0.5) * 0.3 + 0.12, vy: (Math.random() - 0.5) * 0.3 - 0.1, life: 1.4 + Math.random(), max: 2.2, s: size || 0.08, dark }); }
  function fire(x, y) { spawn({ t: 'fire', x, y, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, life: 0.35 + Math.random() * 0.3, max: 0.65, s: 0.05 + Math.random() * 0.05 }); }
  function shards(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 1 + Math.random() * 3; spawn({ t: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + Math.random(), max: 2.2, s: 0.015 + Math.random() * 0.025, r: Math.random() * 6, col: col || (Math.random() < 0.5 ? '#7d7a72' : '#4a4540') }); } }
  function stepParticles(dt) {
    for (const p of parts) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const damp = p.t === 'spark' ? 3 : p.t === 'shard' ? 4 : 0.6; p.vx *= Math.exp(-damp * dt); p.vy *= Math.exp(-damp * dt);
      if (p.t === 'smoke') p.s += dt * 0.12;
      if (p.t === 'shard' && p.life <= 0) { dctx.fillStyle = 'rgba(70,64,56,0.8)'; dctx.fillRect(toD(p.x), toD(p.y), p.s * FPX, p.s * FPX * 0.7); }
    }
    parts = parts.filter(p => p.life > 0);
  }

  // ---------- camera, drama ----------
  const cam = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1 }; let shake = 0, slowT = 0, banner = null, hitStop = 0, flash = 0;
  let calls = []; // floating comic callouts
  const CRATE_COL = { nitro: '#FF8A2A', overcharge: '#B266FF', repair: '#4CC26A', shield: '#47A8FF' }, CRATE_ICON = { nitro: 'N', overcharge: '⚡', repair: '+', shield: 'S' };
  function consumeFx() {
    for (const e of S.fx) {
      if (e.type === 'spark') sparks(e.x, e.y, e.small ? e.power * 0.5 : e.power * 0.6, e.nx, e.ny);
      else if (e.type === 'bigHit') {
        shake = Math.min(0.2, shake + e.power * 0.005); shards(e.x, e.y, Math.min(12, e.power / 4));
        if (e.power >= 20) { hitStop = Math.max(hitStop, 0.07); flash = Math.max(flash, 0.12); spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3, max: 0.3, s: 0.15 }); }
        if (st.drama && e.power >= 13 && slowT <= 0) { slowT = 0.75; cam.tx = e.x * 0.6; cam.ty = e.y * 0.6; cam.tz = 1.45; }
      } else if (e.type === 'detach') { shards(e.x, e.y, 6); for (let i = 0; i < 4; i++) smoke(e.x, e.y, false, 0.06); }
      else if (e.type === 'boom') { shake = Math.min(0.2, shake + 0.08); for (let i = 0; i < 14; i++) fire(e.x + (Math.random() - 0.5) * 0.3, e.y + (Math.random() - 0.5) * 0.3); for (let i = 0; i < 8; i++) smoke(e.x, e.y, true, 0.12); spawn({ t: 'flash', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.18, max: 0.18, s: 0.7 }); sparks(e.x, e.y, 60); }
      else if (e.type === 'scorch') { const g = dctx.createRadialGradient(toD(e.x), toD(e.y), 0, toD(e.x), toD(e.y), e.r * FPX); g.addColorStop(0, 'rgba(30,22,14,0.55)'); g.addColorStop(1, 'rgba(30,22,14,0)'); dctx.fillStyle = g; dctx.beginPath(); dctx.arc(toD(e.x), toD(e.y), e.r * FPX, 0, 6.29); dctx.fill(); }
      else if (e.type === 'skid') { dctx.save(); dctx.translate(toD(e.x), toD(e.y)); dctx.rotate(e.a); dctx.fillStyle = 'rgba(30,26,22,0.06)'; dctx.fillRect(-5, -3, 10, 6); dctx.restore(); }
      else if (e.type === 'scrape') { dctx.strokeStyle = 'rgba(240,236,228,0.35)'; dctx.lineWidth = 1.2; dctx.beginPath(); dctx.moveTo(toD(e.x), toD(e.y)); dctx.lineTo(toD(e.x) + (Math.random() - 0.5) * 10, toD(e.y) + (Math.random() - 0.5) * 10); dctx.stroke(); if (Math.random() < 0.5) sparks(e.x, e.y, 6); }
      else if (e.type === 'thud') { for (let i = 0; i < 6; i++) spawn({ t: 'dust', x: e.x, y: e.y, vx: Math.cos(i) * 0.8, vy: Math.sin(i) * 0.8, life: 0.6, max: 0.6, s: 0.1 }); shake = Math.min(0.12, shake + 0.03); }
      else if (e.type === 'callout') calls.push({ text: e.text, x: e.x, y: e.y, big: e.big, t: 0, rot: (Math.random() - 0.5) * 0.3, center: e.x === 0 && e.y === 0 });
      else if (e.type === 'punch') { shake = Math.min(0.2, shake + 0.08); hitStop = Math.max(hitStop, 0.09); spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.25, max: 0.25, s: 0.1 }); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; spawn({ t: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, life: 0.2, max: 0.3 }); } }
      else if (e.type === 'boing') { spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.35, max: 0.35, s: 0.08, col: '#E8C547' }); shake = Math.min(0.2, shake + 0.04); }
      else if (e.type === 'shatter') { for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, v = 1 + Math.random() * 5; spawn({ t: 'shard', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.8 + Math.random(), max: 1.8, s: 0.012 + Math.random() * 0.02, r: Math.random() * 6, col: Math.random() < 0.5 ? '#7FD1CC' : '#3E8E8A' }); } }
      else if (e.type === 'dash') { const R = S.robots[e.robot]; R.dashFx = 0.5; }
      else if (e.type === 'piston') { shake = Math.min(0.25, shake + 0.1); for (let i = 0; i < 10; i++) spawn({ t: 'dust', x: e.x, y: e.y, vx: Math.cos(i) * 1.5, vy: Math.sin(i) * 1.5, life: 0.7, max: 0.7, s: 0.15 }); spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.4, max: 0.4, s: 0.3, col: '#E8C547' }); }
      else if (e.type === 'slam') { shake = Math.min(0.35, shake + 0.25); hitStop = Math.max(hitStop, 0.12); flash = Math.max(flash, 0.2); for (let i = 0; i < 16; i++) spawn({ t: 'dust', x: e.x, y: e.y, vx: Math.cos(i * 0.4) * 2.2, vy: Math.sin(i * 0.4) * 2.2, life: 0.9, max: 0.9, s: 0.2 }); shards(e.x, e.y, 14); }
      else if (e.type === 'pickup') { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; spawn({ t: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, life: 0.4, max: 0.4, col: CRATE_COL[e.kind] }); } spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.4, max: 0.4, s: 0.2, col: CRATE_COL[e.kind] }); }
      else if (e.type === 'emp') { shake = Math.min(0.2, shake + 0.06); flash = Math.max(flash, 0.08); for (const s2 of [0.2, 0.5, 0.8]) spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3 + s2 * 0.3, max: 0.3 + s2 * 0.3, s: s2, col: '#7FD4FF' }); for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28; spawn({ t: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, life: 0.35, max: 0.35, col: '#BFEAFF' }); } }
      else if (e.type === 'ricochet') sparks(e.x, e.y, 10);
      else if (e.type === 'rtrail') { spawn({ t: 'smoke', x: e.x, y: e.y, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, life: 0.9, max: 1.2, s: 0.05, dark: false }); }
      else if (e.type === 'launch') { for (let i = 0; i < 6; i++) smoke(e.x, e.y, false, 0.06); sparks(e.x, e.y, 10); }
      else if (e.type === 'ewall') { spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.35, max: 0.35, s: 0.2, col: '#7FD1CC' }); }
      else if (e.type === 'chipzap') { const R = S.robots[e.robot], q = R.body.getPosition(); R.zap = 0.5; for (let k = 0; k < 12; k++) { const a = Math.random() * 6.28; spawn({ t: 'spark', x: q.x, y: q.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 0.3, max: 0.3, col: '#9BE38A' }); } }
      else if (e.type === 'chipfry') { const q = S.robots[e.robot].body.getPosition(); for (let k = 0; k < 10; k++) smoke(q.x, q.y, true, 0.08); sparks(q.x, q.y, 30); }
      else if (e.type === 'grapple') { S.robots[e.robot].grappleFx = 0.35; }
      else if (e.type === 'jets') { for (let i = 0; i < 14; i++) fire(e.x + (Math.random() - 0.5) * 0.4, e.y + (Math.random() - 0.5) * 0.4); for (let i = 0; i < 8; i++) spawn({ t: 'dust', x: e.x, y: e.y, vx: Math.cos(i) * 1.2, vy: Math.sin(i) * 1.2, life: 0.6, max: 0.6, s: 0.12 }); }
      else if (e.type === 'smokebomb') { for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, r = Math.random() * 1.1; spawn({ t: 'smoke', x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, vx: Math.cos(a) * 0.2, vy: Math.sin(a) * 0.2, life: 2 + Math.random() * 1.5, max: 3.5, s: 0.25 + Math.random() * 0.2, dark: false }); } }
      else if (e.type === 'shieldhit') { const R = S.robots[e.robot]; R.shieldFlash = 0.15; }
      else if (e.type === 'ko') { shake = Math.min(0.2, shake + 0.08); if (st.drama) { slowT = 1.2; const R = S.robots[e.robot], p = R.body.getPosition(); cam.tx = p.x * 0.6; cam.ty = p.y * 0.6; cam.tz = 1.5; } }
    }
    S.fx.length = 0;
  }
  // smoke and fire coming off damaged robots (sim-time based)
  function emitters(dt) {
    for (const R of S.robots) {
      const b = R.body;
      const wp = lp => b.getWorldPoint(planck.Vec2(lp[0], lp[1]));
      if (!R.alive && !R.inPit && Math.random() < dt * 14) { const p = b.getPosition(); smoke(p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3, true, 0.1); }
      for (const q of R.internals) {
        if (R.inPit) break;
        if ((q.hp <= 0 && q.key !== 'arm') || q.heat > 60) { if (Math.random() < dt * (q.hp <= 0 ? 4 : 6)) { const p = wp(q.lp); smoke(p.x, p.y, q.hp <= 0, 0.05); } }
      }
      if (R.chipExposed && !R.inPit) { const q = wp(R.chipPart.lp); if (R.chipPart.hp <= 0) { if (Math.random() < dt * 6) smoke(q.x, q.y, true, 0.05); } else if (Math.random() < dt * 1.5) sparks(q.x, q.y, 3); }
      if (R.battery.fire && !R.inPit) { const p = wp(R.battery.lp); for (let i = 0; i < 2; i++) if (Math.random() < dt * 30) fire(p.x + (Math.random() - 0.5) * 0.12, p.y + (Math.random() - 0.5) * 0.12); if (Math.random() < dt * 8) smoke(p.x, p.y, true, 0.08); }
      for (const p of R.parts) if (p.attached && p.hp / p.maxHp < 0.3 && Math.random() < dt * 2 && !R.inPit) { const c = L.centroid(p.verts), w = p.body.getWorldPoint(planck.Vec2(c[0], c[1])); smoke(w.x, w.y, false, 0.04); if (Math.random() < 0.3) sparks(w.x, w.y, 4); }
      for (const s of R.slots) if (s.motor.stuck > 0 && Math.random() < dt * 10) { const p = wp(s.lp); sparks(p.x, p.y, 5); }
      if (R.flameOn > 0 && R.turret) {
        const p = b.getPosition(), a = R.turretA;
        for (let i = 0; i < 5; i++) { const aa = a + (Math.random() - 0.5) * 0.6, v = 3 + Math.random() * 2.5; spawn({ t: 'fire', x: p.x + Math.cos(a) * 0.28, y: p.y + Math.sin(a) * 0.28, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: 0.25 + Math.random() * 0.15, max: 0.4, s: 0.04 + Math.random() * 0.04, grow: true }); }
      }
    }
  }

  // ---------- drawing helpers ----------
  let PX = 0.02; // one screen pixel in metres
  function path(pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function bolt(x, y) { ctx.beginPath(); ctx.arc(x, y, 0.016, 0, 6.29); ctx.fillStyle = '#E4E1DA'; ctx.fill(); ctx.lineWidth = PX * 1.2; ctx.strokeStyle = INK; ctx.stroke(); }
  function bbox(vs) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of vs) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }
  // draws one part in its body's local frame (ctx already transformed)
  function drawPart(part, fill, R, extra) {
    path(part.outline);
    ctx.fillStyle = fill; ctx.fill();
    ctx.save(); path(part.outline); ctx.clip();
    if (extra) extra();
    const f = part.attached ? Math.max(0, part.hp / part.maxHp) : 0.3;
    if (f < 1) { ctx.fillStyle = `rgba(45,30,15,${(1 - f) * 0.35})`; ctx.fillRect(-2, -2, 4, 4); }
    for (const d of part.dents) {
      const k = Math.min(1, d.a / 25);
      ctx.fillStyle = `rgba(20,14,8,${0.18 + 0.3 * k})`; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.7, d.r * 0.45, d.x * 7 + d.y * 3, 0, 6.29); ctx.fill();
      ctx.strokeStyle = `rgba(255,250,240,${0.22 + 0.2 * k})`; ctx.lineWidth = PX * 1.3; ctx.beginPath(); ctx.ellipse(d.x + d.r * 0.08, d.y + d.r * 0.08, d.r * 0.7, d.r * 0.45, d.x * 7 + d.y * 3, 3.6, 5.8); ctx.stroke();
      if (d.a > 12) { ctx.strokeStyle = 'rgba(25,18,10,0.55)'; ctx.lineWidth = PX; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = (d.x * 31 + d.y * 17 + i * 2.1) % 6.28; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + Math.cos(a) * d.r * 1.3, d.y + Math.sin(a) * d.r * 1.3); } ctx.stroke(); }
    }
    if (part.heat > 25) { ctx.fillStyle = `rgba(255,${120 - part.heat * 0.5},20,${Math.min(0.55, (part.heat - 25) / 150)})`; ctx.fillRect(-2, -2, 4, 4); }
    ctx.restore();
    path(part.outline); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function wheelTread(part, spin) {
    const [x0, y0, x1, y1] = bbox(part.verts), len = x1 - x0, step = 0.035, off = ((spin * 0.07) % step + step) % step;
    ctx.strokeStyle = '#4E4740'; ctx.lineWidth = PX * 2;
    for (let x = x0 - step + off; x < x1 + step; x += step) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 0.01, y1); ctx.stroke(); }
    ctx.fillStyle = '#8C8F86'; ctx.fillRect((x0 + x1) / 2 - len * 0.12, (y0 + y1) / 2 - (y1 - y0) * 0.18, len * 0.24, (y1 - y0) * 0.36);
  }
  function fillFor(part, R, i) {
    if (part.kind === 'chassis') return R.flipped ? '#4A4540' : R.alive ? TC(i).col : TC(i).dark;
    if (part.kind === 'wheel') return part.leg ? '#4A4540' : RUBBER;
    if (part.kind === 'armour') return { rubber: '#34302C', spring: '#D4AF37', spiked: '#8E9088', fibre: 'rgba(79,163,160,0.85)' }[part.bumper] || STEEL;
    if (part.key === 'spear') return '#C9CBC4';
    if (part.key === 'glove') return '#6F7369';
    if (part.key === 'blade') return '#B9BBB4';
    if (part.key === 'flipper') return '#D9B43A';
    if (part.key === 'wedge') return '#7D8078';
    if (part.key === 'drum') return '#8C8F86';
    if (part.key === 'jaws') return '#6F7369';
    if (part.key === 'lifter') return '#D9B43A';
    if (part.key === 'vdisc') return '#C9CBC4';
    return STEEL_D;
  }
  function decorate(part, R, i) {
    return () => {
      if (part.kind === 'wheel' && part.leg) { const [x0, y0, x1, y1] = bbox(part.verts); ctx.fillStyle = '#9A9C94'; ctx.fillRect((x0 + x1) / 2 - 0.02, y0, 0.04, y1 - y0); } // a walker's foot
      else if (part.kind === 'wheel') {
        wheelTread(part, part.slot ? part.slot.spin : part.spin || 0);
        const dk = R.spec.drive, [x0, y0, x1, y1] = bbox(part.verts);
        if (dk === 'tracks') { ctx.fillStyle = '#6F7169'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; const r = (y1 - y0) * 0.38; for (const xx of [x0 + r * 1.3, (x0 + x1) / 2, x1 - r * 1.3]) { ctx.beginPath(); ctx.arc(xx, (y0 + y1) / 2, r, 0, 6.29); ctx.fill(); ctx.stroke(); } }
        else if (dk === 'omni') { ctx.strokeStyle = '#9A9C94'; ctx.lineWidth = PX * 2.2; const sp = part.slot ? part.slot.spin : 0, st = 0.03, off = ((sp * 0.05) % st + st) % st; for (let x = x0 - st + off; x < x1 + st; x += st) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (y1 - y0) * 0.8, y1); ctx.stroke(); } }
      }
      else if (part.kind === 'armour') {
        const [x0, y0, x1, y1] = bbox(part.verts), lx = x1 - x0 > y1 - y0, bk = part.bumper || 'steel';
        if (bk === 'rubber') { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = PX * 2; for (let t = 0; t < 1; t += 0.08) { ctx.beginPath(); if (lx) { ctx.moveTo(x0 + (x1 - x0) * t, y0); ctx.lineTo(x0 + (x1 - x0) * t, y1); } else { ctx.moveTo(x0, y0 + (y1 - y0) * t); ctx.lineTo(x1, y0 + (y1 - y0) * t); } ctx.stroke(); } }
        else if (bk === 'spring') { ctx.strokeStyle = '#5A4A12'; ctx.lineWidth = PX * 2; ctx.beginPath(); const n = 14; for (let k = 0; k <= n; k++) { const t = k / n, z = k % 2 ? 1 : 0; lx ? (k ? ctx.lineTo(x0 + (x1 - x0) * t, z ? y1 : y0) : ctx.moveTo(x0, y0)) : (k ? ctx.lineTo(z ? x1 : x0, y0 + (y1 - y0) * t) : ctx.moveTo(x0, y0)); } ctx.stroke(); }
        else if (bk === 'fibre') { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = PX; for (let t = -1; t < 2; t += 0.06) { ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * t, y0); ctx.lineTo(x0 + (x1 - x0) * (t + 0.05), y1); ctx.stroke(); } }
        else { ctx.fillStyle = 'rgba(255,255,255,0.18)'; lx ? ctx.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.3) : ctx.fillRect(x0, y0, (x1 - x0) * 0.3, y1 - y0); }
      }
      else if (part.key === 'spear') { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(R.hl, -0.012, 0.6, 0.012); }
      else if (part.key === 'ball') { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(-0.03, -0.03, 0.04, 0, 6.29); ctx.fill(); }
      else if (part.kind === 'chassis') {
        const [x0, y0, x1, y1] = bbox(part.home);
        if (!R.flipped) { ctx.strokeStyle = TC(i).dark; ctx.lineWidth = PX * 1.6; ctx.strokeRect(x0 + 0.06, y0 + 0.06, x1 - x0 - 0.12, y1 - y0 - 0.12); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0, x1 - x0, 0.05); }
        else { ctx.fillStyle = TC(i).dark; ctx.fillRect(x0 + 0.05, -0.04, x1 - x0 - 0.1, 0.08); }
        // torn holes show what's inside
        const holes = part.dents.filter(d => d.a > 11).sort((a, b) => b.a - a.a).slice(0, 4);
        if (part.hp / part.maxHp < 0.6) for (const d of holes) {
          const r = d.r * 0.75; ctx.fillStyle = '#17120D'; ctx.beginPath();
          for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, rad = r * (0.7 + ((d.x * 50 + k * 13) % 1 + 1) % 1 * 0.5); k ? ctx.lineTo(d.x + Math.cos(a) * rad, d.y + Math.sin(a) * rad) : ctx.moveTo(d.x + Math.cos(a) * rad, d.y + Math.sin(a) * rad); }
          ctx.closePath(); ctx.fill();
          let best = null, bd = 1e9; for (const q of R.internals) { const dd = Math.hypot(q.lp[0] - d.x, q.lp[1] - d.y); if (dd < bd) { bd = dd; best = q; } }
          if (best && bd < 0.3) { ctx.fillStyle = best.hp > 0 ? (INT_COL[best.key] || '#999') : '#3a3530'; ctx.fillRect(d.x - r * 0.4, d.y - r * 0.3, r * 0.8, r * 0.6); }
          ctx.strokeStyle = '#C0392B'; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.moveTo(d.x - r * 0.5, d.y); ctx.quadraticCurveTo(d.x, d.y + r * 0.9, d.x + r * 0.6, d.y + r * 0.2); ctx.stroke();
          ctx.strokeStyle = '#2E6DB4'; ctx.beginPath(); ctx.moveTo(d.x - r * 0.3, d.y - r * 0.5); ctx.quadraticCurveTo(d.x + r * 0.2, d.y - r, d.x + r * 0.5, d.y - r * 0.3); ctx.stroke();
        }
      } else if (part.key === 'wedge') { ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = PX * 1.5; for (let k = -0.6; k < 0.6; k += 0.07) { ctx.beginPath(); ctx.moveTo(R.hl, k); ctx.lineTo(R.hl + 0.3, k + 0.05); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(R.hl + 0.26, -0.7, 0.02, 1.4); }
      else if (part.key === 'drum') { const ph = ((R.drumSpin || 0) % 0.06); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = R.hl - 0.06 + ph; x < R.hl + 0.25; x += 0.06) ctx.fillRect(x, -0.6, 0.015, 1.2); ctx.fillStyle = '#E4E1DA'; for (const y of [-0.22, 0, 0.22]) ctx.fillRect(R.hl + 0.17, y - 0.03, 0.04, 0.06); }
      else if (part.key === 'flipper') { ctx.fillStyle = INK; for (let y = -0.3; y < 0.3; y += 0.12) { ctx.beginPath(); ctx.moveTo(R.hl + 0.04, y); ctx.lineTo(R.hl + 0.12, y + 0.05); ctx.lineTo(R.hl + 0.04, y + 0.1); ctx.fill(); } ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(R.hl + 0.01, -0.5); ctx.lineTo(R.hl + 0.01, 0.5); ctx.stroke(); }
      else if (part.key === 'blade') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-0.55, -0.045, 1.1, 0.02); }
    };
  }

  // Lineup Arena: the robot's level pressed into its lid as small stars (level 0 starters have none)
  function starPath(cx, cy, r) { ctx.beginPath(); for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } ctx.closePath(); }
  function stamp(R, i, x0, y0, x1, y1) {
    if (!LU || !st.spec[i] || !LU.ROBOTS[st.spec[i].robot]) return; const n = LU.ROBOTS[st.spec[i].robot][0]; if (!n) return;
    const h = y1 - y0, r = Math.min(0.048, h / (n * 2.4 + 0.8)), gap = r * 2.35, cx = x0 + Math.min(0.09, (x1 - x0) * 0.22), d = Math.max(PX, 0.005);
    for (let k = 0; k < n; k++) { const cy = (k - (n - 1) / 2) * gap + (y0 + y1) / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2); // stars point to the robot's front
      starPath(d, d, r); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill(); // lit lower edge of the dent
      starPath(0, 0, r); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); ctx.restore(); }
  }
  function drawRobot(R, i) {
    const b = R.body, p = b.getPosition(), a = b.getAngle();
    const air = R.airborne > 0 ? Math.sin(Math.PI * Math.min(1, 1 - R.airborne / Math.max(R.airMax, 0.01))) : 0;
    const carried = S.robots.some(Q => Q.carry && Q.carry.robot === R);
    let sc = 1 + air * 0.28 + (carried ? 0.1 : 0), alpha = 1;
    if (R.inPit) { const k = Math.min(1, (S.t - R.inPit) / 0.8); sc = 1 - k * 0.65; alpha = 1 - k * 0.7; }
    const so = 0.05 + air * 0.35 + (carried ? 0.12 : 0);
    R.trailPts = R.trailPts || []; if (frameN % 2 === 0) { R.trailPts.push([p.x, p.y, a]); if (R.trailPts.length > 7) R.trailPts.shift(); }
    const vel = b.getLinearVelocity(), fast = Math.hypot(vel.x, vel.y) > 3.5 || R.airborne > 0;
    if (fast && !R.inPit) { R.trailPts.forEach((q, k) => { ctx.save(); ctx.globalAlpha = 0.06 + k * 0.03; ctx.translate(q[0], q[1]); ctx.rotate(q[2]); ctx.fillStyle = TC(i).light; ctx.fillRect(-R.hl, -R.hw, R.hl * 2, R.hw * 2); ctx.restore(); }); }
    const mine = R.parts.filter(q => q.attached && q.body === b && q.key !== 'lifter'); // forks are drawn first, under everything
    // shadow
    ctx.save(); ctx.translate(p.x + so, p.y + so); ctx.rotate(a); ctx.scale(sc, sc); ctx.fillStyle = `rgba(20,14,8,${0.28 - air * 0.12})`;
    for (const q of mine) { path(q.verts); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(a); ctx.scale(sc, sc);
    // struts holding the side plates
    ctx.fillStyle = '#4A4540';
    for (const q of mine) if (q.kind === 'armour' && /Left|Right/.test(q.label)) { const sd = q.label.startsWith('Left') ? -1 : 1, [, y0, , y1] = bbox(q.home), yin = sd < 0 ? y1 : y0; for (const xx of [-R.hl * 0.78, R.hl * 0.78]) { const ya = sd * R.hw, yb = yin; ctx.fillRect(xx - 0.025, Math.min(ya, yb), 0.05, Math.abs(yb - ya)); } }
    if (R.spec.drive === 'legs') drawLegs(R);
    const order = ['wheel', 'armour', 'weapon', 'chassis'];
    for (const kind of order) for (const q of mine) if (q.kind === kind) drawPart(q, fillFor(q, R, i), R, decorate(q, R, i));
    for (const q of mine) if (q.kind === 'armour' && q.bumper === 'spiked') spikesOn(q);
    if (R.spec.weapon === 'glove' && R.tool && R.tool.attached) drawGlove(R);
    if (R.thruster) { const ok = R.thruster.hp > 0; ctx.fillStyle = ok ? '#5C5650' : '#1C1813'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; for (const y of [-0.09, 0.09]) { ctx.beginPath(); ctx.moveTo(-R.hl + 0.02, y - 0.05); ctx.lineTo(-R.hl - 0.08, y - 0.065); ctx.lineTo(-R.hl - 0.08, y + 0.065); ctx.lineTo(-R.hl + 0.02, y + 0.05); ctx.closePath(); ctx.fill(); ctx.stroke(); if (ok) { ctx.fillStyle = R.dashT > 0 ? '#FFD27A' : '#2B2118'; ctx.fillRect(-R.hl - 0.082, y - 0.04, 0.012, 0.08); } } }
    if (!R.flipped) {
      const C = R.chassis, [x0, y0, x1, y1] = bbox(C.home);
      for (const [bx, by] of [[x0 + 0.035, y0 + 0.035], [x1 - 0.035, y0 + 0.035], [x0 + 0.035, y1 - 0.035], [x1 - 0.035, y1 - 0.035]]) bolt(bx, by);
      if (R.lid.attached) {
        const lo = R.lid.state === 'loose' ? Math.sin(performance.now() / 25) * 0.008 : 0; ctx.save(); ctx.translate(lo, -lo);
        drawPart(R.lid, R.alive ? TC(i).dark : '#4A4540', R, () => { ctx.fillStyle = 'rgba(255,255,255,0.1)'; const [x0, y0, x1] = bbox(R.lid.home); ctx.fillRect(x0, y0, x1 - x0, 0.03); });
        const [x0, y0, x1, y1] = bbox(R.lid.home); for (const [bx, by] of [[x0 + 0.03, y0 + 0.03], [x1 - 0.03, y0 + 0.03], [x0 + 0.03, y1 - 0.03], [x1 - 0.03, y1 - 0.03]]) if (!(R.lid.state === 'loose' && bx > 0 && by < 0)) bolt(bx, by);
        stamp(R, i, x0, y0, x1, y1);
        ctx.restore();
      } else {
        const [cx, cy] = R.chipPart.lp, dead = R.chipPart.hp <= 0, z = (R.zap || 0) > 0;
        ctx.fillStyle = '#17120D'; ctx.fillRect(-R.hl * 0.7, -R.hw * 0.75, R.hl * 1.35, R.hw * 1.5);
        ctx.strokeStyle = '#C9A227'; ctx.lineWidth = PX * 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx - 0.09, cy + k * 0.022); ctx.lineTo(cx + 0.09, cy + k * 0.022); ctx.moveTo(cx + k * 0.022, cy - 0.09); ctx.lineTo(cx + k * 0.022, cy + 0.09); ctx.stroke(); }
        ctx.fillStyle = dead ? '#2B2620' : z ? '#E8FFF0' : '#2F8A4A'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.fillRect(cx - 0.06, cy - 0.06, 0.12, 0.12); ctx.strokeRect(cx - 0.06, cy - 0.06, 0.12, 0.12);
        if (!dead) { ctx.fillStyle = Math.sin(performance.now() / 90) > 0 ? '#9BE38A' : '#2F8A4A'; ctx.fillRect(cx - 0.02, cy - 0.02, 0.04, 0.04); }
        for (const q of R.internals) if (q.key !== 'chip' && q.key !== 'module' && q.key !== 'thruster') { ctx.fillStyle = q.hp > 0 ? (INT_COL[q.key] || '#999') : '#3a3530'; ctx.globalAlpha = 0.85; ctx.fillRect(q.lp[0] - 0.035, q.lp[1] - 0.025, 0.07, 0.05); ctx.globalAlpha = 1; }
      }
      drawTop(R, i); drawLamps(R);
      if (R.module) { const [ic, col] = MOD_ICON[R.mod] || ['?', '#999'], [mx, my] = R.module.lp, on = R.module.hp > 0 && !(R.modOff > 0); ctx.fillStyle = on ? col : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(mx, my, 0.065, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.save(); ctx.translate(mx, my); ctx.rotate(-a); ctx.fillStyle = on ? '#fff' : '#777'; ctx.font = `700 ${0.08}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ic, 0, 0.004); ctx.restore(); }
    } else { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `600 ${0.1}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.fillText('UNDERSIDE', 0, 0.035); }
    ctx.restore();
    if (R.blade && R.blade.attached && !R.inPit) drawBlade(R.blade, R);
    if (R.buzz && R.buzz.attached && !R.inPit) { const bp = R.buzz.body.getPosition(), cp = R.body.getWorldPoint(planck.Vec2(R.hl - 0.02, 0)); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(bp.x, bp.y); ctx.stroke(); drawBuzz(R.buzz, R); }
    if (R.tether && !R.inPit) { const T = R.tether, a1 = R.body.getPosition(), a2 = T.body.getWorldPoint(planck.Vec2(T.lp[0], T.lp[1])); ctx.strokeStyle = '#3B2F22'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = 0.018; ctx.setLineDash([0.04, 0.03]); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt'; ctx.save(); ctx.translate(a2.x, a2.y); ctx.rotate(Math.atan2(a2.y - a1.y, a2.x - a1.x)); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5; ctx.beginPath(); ctx.moveTo(0.06, 0); ctx.lineTo(-0.04, -0.04); ctx.lineTo(-0.02, 0); ctx.lineTo(-0.04, 0.04); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (R.flailArm && !R.inPit) { drawFlail(R); if (R.ball && R.ball.attached) drawBall(R.ball); }
    if (!R.inPit) { drawMech(R, i); drawL4(R, i); }
    // power-up and rage effects
    if (!R.inPit) {
      const t = performance.now() / 1000;
      if (R.shield > 0) { ctx.strokeStyle = `rgba(71,168,255,${0.5 + (R.shieldFlash > 0 ? 0.5 : 0.2 * Math.sin(t * 8))})`; ctx.fillStyle = 'rgba(71,168,255,0.12)'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.32, 0, 6.29); ctx.fill(); ctx.stroke(); }
      if (R.rage > 0) { ctx.strokeStyle = `rgba(255,60,30,${0.45 + 0.3 * Math.sin(t * 14)})`; ctx.lineWidth = PX * 5; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.22 + 0.03 * Math.sin(t * 20), 0, 6.29); ctx.stroke(); if (Math.random() < 0.5) fire(p.x + (Math.random() - 0.5) * 0.6, p.y + (Math.random() - 0.5) * 0.6); }
      if (R.over > 0) { ctx.strokeStyle = `rgba(178,102,255,${0.6 + 0.3 * Math.sin(t * 18)})`; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 6, PX * 5]); ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.12, t * 3, t * 3 + 6.29); ctx.stroke(); ctx.setLineDash([]); }
      if (R.eSh > 0) { const k = R.eSh / R.eShMax; ctx.strokeStyle = `rgba(120,220,255,${0.25 + 0.5 * k + (R.shieldFlash > 0 ? 0.3 : 0)})`; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k2 = 0; k2 <= 6; k2++) { const an = a + k2 / 6 * 6.283, rr2 = R.hl + 0.27; k2 ? ctx.lineTo(p.x + Math.cos(an) * rr2, p.y + Math.sin(an) * rr2) : ctx.moveTo(p.x + Math.cos(an) * rr2, p.y + Math.sin(an) * rr2); } ctx.stroke(); ctx.fillStyle = `rgba(120,220,255,${0.06 * k})`; ctx.fill(); }
      if (R.quantumT > 0) { ctx.strokeStyle = `rgba(242,201,76,${0.6 + 0.4 * Math.sin(t * 25)})`; ctx.fillStyle = 'rgba(242,201,76,0.18)'; ctx.lineWidth = PX * 4; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.3, 0, 6.29); ctx.fill(); ctx.stroke(); }
      if (R.stun > 0) { ctx.strokeStyle = '#9BE3FF'; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k2 = 0; k2 < 5; k2++) { const an = Math.random() * 6.28, r1 = R.hl * 0.4, r2 = R.hl + 0.15; ctx.moveTo(p.x + Math.cos(an) * r1, p.y + Math.sin(an) * r1); ctx.lineTo(p.x + Math.cos(an + 0.3) * (r1 + r2) / 2, p.y + Math.sin(an - 0.2) * (r1 + r2) / 2); ctx.lineTo(p.x + Math.cos(an) * r2, p.y + Math.sin(an) * r2); } ctx.stroke(); }
      if (R.boomArm > 0) { ctx.strokeStyle = Math.sin(t * (10 + (4 - R.boomArm) * 8)) > 0 ? '#FF3B2B' : '#FFE14D'; ctx.lineWidth = PX * 5; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.18, 0, 6.29); ctx.stroke(); if (Math.random() < 0.4) sparks(p.x, p.y, 6); }
      if (R.healing && Math.random() < 0.15) spawn({ t: 'spark', x: p.x + (Math.random() - 0.5) * 0.5, y: p.y + (Math.random() - 0.5) * 0.5, vx: 0, vy: -0.6, life: 0.6, max: 0.6, col: '#4CC26A' });
      if (R.grappleFx > 0) { const E = R.enemy.body.getPosition(); ctx.strokeStyle = '#2B2118'; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 4, PX * 3]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(E.x, E.y); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#C9A227'; ctx.lineWidth = PX * 1.5; ctx.stroke(); ctx.fillStyle = '#C9A227'; ctx.beginPath(); ctx.arc(E.x, E.y, 0.05, 0, 6.29); ctx.fill(); }
      if ((R.nitro > 0 || R.dashFx > 0 || R.dashT > 0) && Math.random() < 0.9) { const back = b.getWorldPoint(planck.Vec2(-R.hl - 0.05, (Math.random() - 0.5) * 0.3)), f = b.getWorldVector(planck.Vec2(-1, 0)); spawn({ t: 'fire', x: back.x, y: back.y, vx: f.x * 3 + (Math.random() - 0.5), vy: f.y * 3 + (Math.random() - 0.5), life: 0.25, max: 0.25, s: 0.06, grow: true }); }
    }
  }
  function spikesOn(q) {
    const [x0, y0, x1, y1] = bbox(q.home), lx = x1 - x0 > y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const out = lx ? (cy < 0 ? -1 : 1) : (cx < 0 ? -1 : 1);
    ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2;
    for (let t = 0.08; t < 0.95; t += 0.14) { ctx.beginPath(); if (lx) { const x = x0 + (x1 - x0) * t, y = out < 0 ? y0 : y1; ctx.moveTo(x - 0.025, y); ctx.lineTo(x, y + out * 0.06); ctx.lineTo(x + 0.025, y); } else { const y = y0 + (y1 - y0) * t, x = out < 0 ? x0 : x1; ctx.moveTo(x, y - 0.025); ctx.lineTo(x + out * 0.06, y); ctx.lineTo(x, y + 0.025); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  function gloveShape(sc) {
    ctx.fillStyle = '#D33A2C'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4 / sc;
    ctx.beginPath(); ctx.ellipse(0.05, 0, 0.1, 0.13, 0, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.02, -0.12, 0.05, 0.035, 0.5, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(0.08, -0.04, 0.03, 0.05, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#F2EEE6'; ctx.fillRect(-0.06, -0.1, 0.04, 0.2); ctx.strokeRect(-0.06, -0.1, 0.04, 0.2);
  }
  function drawBuzz(part, R) {
    const b = part.body, p = b.getPosition(), a = b.getAngle(), w = R ? Math.abs(R.buzzW || 0) / (R.buzzMax || 110) : 0;
    ctx.save(); ctx.translate(p.x, p.y);
    const bk = R && R.buzzR ? R.buzzR / 0.14 : 1; ctx.scale(bk, bk);
    if (w > 0.3) { ctx.fillStyle = `rgba(220,222,215,${0.25 * w})`; ctx.beginPath(); ctx.arc(0, 0, 0.17, 0, 6.29); ctx.fill(); }
    ctx.rotate(a); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath();
    for (let k = 0; k < 24; k++) { const t = k / 24 * 6.283, r = k % 2 ? 0.15 : 0.125; k ? ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r) : ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6F7169'; ctx.beginPath(); ctx.arc(0, 0, 0.04, 0, 6.29); ctx.fill(); ctx.stroke();
    if (w > 0.3) { ctx.strokeStyle = `rgba(255,255,255,${0.5 * w})`; ctx.lineWidth = PX * 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, 0.09, k * 2.1, k * 2.1 + 1.2); ctx.stroke(); } }
    ctx.restore();
  }
  function drawGlove(R) {
    const gk = R.gloveK || 1, hl = R.hl, ext = R.gjoint ? Math.max(0, R.gjoint.getJointTranslation()) : 0, gx = hl + 0.09 * gk + ext, k = Math.min(1, ext / (R.stroke || 0.5));
    ctx.strokeStyle = '#4A4540'; ctx.lineWidth = PX * 3; ctx.beginPath();
    for (let j = 0; j < 4; j++) { const xa = hl + 0.1 + ext * j / 4, xb = hl + 0.1 + ext * (j + 1) / 4; ctx.moveTo(xa, -0.06); ctx.lineTo(xb, 0.06); ctx.moveTo(xa, 0.06); ctx.lineTo(xb, -0.06); }
    ctx.stroke();
    ctx.save(); ctx.translate(gx - 0.03 * gk, 0); const sc = (1 + k * 0.15) * gk; ctx.scale(sc, sc); gloveShape(sc); ctx.restore();
  }
  function drawFlail(R) {
    if (!R.flailArm) return;
    const a = R.flailArm, p = a.getPosition(), ang = a.getAngle(), tip = a.getWorldPoint(planck.Vec2(0.4, 0));
    ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = 0.035; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(p.x, p.y, 0.06, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke();
    if (R.ball && R.ball.attached) {
      const bp = R.ball.body.getPosition(), dx = bp.x - tip.x, dy = bp.y - tip.y;
      ctx.fillStyle = '#6E6A62'; ctx.strokeStyle = INK; ctx.lineWidth = PX;
      for (let k = 1; k < 7; k++) { const t = k / 7; ctx.beginPath(); ctx.ellipse(tip.x + dx * t, tip.y + dy * t, 0.03, 0.018, Math.atan2(dy, dx) + (k % 2 ? 0 : 1.57), 0, 6.29); ctx.fill(); ctx.stroke(); }
    }
  }
  function drawBall(part) {
    const b = part.body, p = b.getPosition(), a = b.getAngle(), q = (part.robot && part.robot.ballK) || 1, r1 = 0.1 * q, r2 = 0.17 * q;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4;
    for (let k = 0; k < 8; k++) { const t = k / 8 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(t - 0.25) * r1, Math.sin(t - 0.25) * r1); ctx.lineTo(Math.cos(t) * r2, Math.sin(t) * r2); ctx.lineTo(Math.cos(t + 0.25) * r1, Math.sin(t + 0.25) * r1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    drawPart(part, '#5B5E57', part.robot, decorate(part, part.robot, 0));
    ctx.restore();
  }
  function drawTop(R, i) {
    const w = R.spec.weapon, hl = R.hl;
    if (R.turret) {
      const ta = R.turretA - R.body.getAngle(), dead = R.turret.hp <= 0;
      ctx.save(); ctx.rotate(ta);
      ctx.fillStyle = dead ? '#55524C' : '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2;
      const barrel = (len, wd, off = 0) => { rr(0.04, off - wd / 2, len, wd, 0.01); ctx.fill(); ctx.stroke(); };
      if (w === 'rapid') { barrel(0.3, 0.035, -0.035); barrel(0.3, 0.035, 0.035); }
      else if (w === 'medium') barrel(0.34, 0.05);
      else if (w === 'heavy') barrel(0.36, 0.09);
      else if (w === 'laser') { barrel(0.28, 0.06); ctx.fillStyle = '#E04B3A'; ctx.beginPath(); ctx.arc(0.32, 0, 0.03, 0, 6.29); ctx.fill(); }
      else if (w === 'mortar') { ctx.beginPath(); ctx.arc(0.12, 0, 0.09, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1C1813'; ctx.beginPath(); ctx.arc(0.12, 0, 0.055, 0, 6.29); ctx.fill(); ctx.fillStyle = '#8C8F86'; }
      else if (w === 'saw') { barrel(0.2, 0.18); ctx.fillStyle = '#B9BBB4'; ctx.beginPath(); ctx.arc(0.18, 0, 0.06, 0, 6.29); ctx.fill(); ctx.stroke(); }
      else if (w === 'flame') { barrel(0.26, 0.07); ctx.fillStyle = '#C0392B'; ctx.beginPath(); ctx.arc(-0.06, 0.1, 0.05, 0, 6.29); ctx.fill(); ctx.stroke(); if (!dead) { ctx.fillStyle = '#5AB0FF'; ctx.beginPath(); ctx.arc(0.32, 0, 0.012, 0, 6.29); ctx.fill(); } }
      ctx.fillStyle = dead ? '#55524C' : '#8C8F86'; ctx.beginPath(); ctx.arc(0, 0, 0.13, 0, 6.29); ctx.fill(); ctx.stroke();
      bolt(-0.06, 0); bolt(0.06, 0);
      if (R.muzzle > 0 && !dead) { ctx.fillStyle = '#FFE58A'; ctx.beginPath(); ctx.arc(0.4, 0, 0.06, 0, 6.29); ctx.fill(); }
      if (dead) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(-0.08, -0.06); ctx.lineTo(0.05, 0.08); ctx.stroke(); }
      ctx.restore();
    }
    if (w === 'hammer' && R.arm.hp > 0) {
      let s = 0; if (R.swing > 0) s = 1 - R.swing / 0.2; else if (R.recover > 0) s = R.recover / 0.6;
      const hx = -0.12 + (hl + 0.44) * s, k = 1 + 0.55 * Math.sin(Math.PI * s);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.07 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.25, 0); ctx.lineTo(hx, 0); ctx.stroke();
      ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = 0.045 * k; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.save(); ctx.translate(hx, 0); ctx.scale(k, k);
      ctx.fillStyle = '#B9BBB4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2 / k; path([[-0.05, -0.16], [0.06, -0.12], [0.06, 0.12], [-0.05, 0.16], [-0.02, 0]]); ctx.fill(); ctx.stroke();
      ctx.restore(); bolt(-0.25, 0);
    }
    if (w === 'crusher' && R.tool && R.tool.attached) {
      const open = R.grab ? 0.02 : 0.16;
      ctx.fillStyle = '#6F7369'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2;
      for (const sd of [-1, 1]) { path([[hl + 0.06, sd * 0.2], [hl + 0.12, sd * 0.24], [hl + 0.44, sd * open], [hl + 0.4, sd * (open - 0.03)]]); ctx.fill(); ctx.stroke(); }
      bolt(hl + 0.09, 0);
    }
    if (R.wmotor && R.wmotor.jam > 0) { ctx.fillStyle = HAZ; ctx.font = '600 0.09px IBM Plex Mono, monospace'; ctx.textAlign = 'center'; }
  }
  // ---------- ROBOCUS 2.0 level 4 robots: mechanisms, lamps, legs ----------
  // lamps: a dark socket plus a glow; brightness from the robot's state (R.fx), dead or fried robots go dark
  function lampLevel(R, q, t) {
    if (!R.alive) return 0;
    const fx = R.fx || {}; let v = 1;
    if (q.mode === 'pulse') v = 0.5 + 0.5 * Math.sin(t * 3);
    else if (q.mode === 'strobe') v = Math.sin(t * 25) > 0 ? 1 : 0.1;
    else if (q.mode === 'state') { const s = fx[q.src] || 0; v = q.at != null ? (s > q.at + 0.01 ? 1 : 0.08) : s; if (q.strobe && s > 0.05) v *= Math.sin(t * (14 + 20 * s)) > 0 ? 1 : 0.15; }
    else if (q.mode === 'chase') { const s = fx[q.src] || 0; v = s > 0 ? (((t * 10 - q.idx) % q.n + q.n) % q.n < 1.2 ? 1 : 0.2) : 0.1; }
    else if (q.mode === 'beacon') v = (fx[q.src] || 0) > 0 ? 0.6 + 0.4 * Math.sin(t * 12) : 0.08;
    else if (q.mode === 'eyes') v = fx.tell ? 1 : fx.hunt ? 0.85 : 0.25 + 0.75 * Math.max(0, Math.sin(t * 4 - q.idx * 0.8));
    if (R.fried || R.chipFreeze > 0) v *= Math.random() < 0.3 ? 1 : 0.1;
    return Math.max(0, Math.min(1, v));
  }
  function drawLamps(R) {
    if (!R.lamps || R.flipped) return;
    const t = performance.now() / 1000;
    for (const q of R.lamps) {
      const v = lampLevel(R, q, t);
      ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 1.25, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 0.25 + 0.75 * v; ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.29); ctx.fill();
      if (v > 0.5) { ctx.globalAlpha = 0.28 * v; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 2.6, 0, 6.29); ctx.fill(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(q.x - q.r * 0.3, q.y - q.r * 0.3, q.r * 0.3, 0, 6.29); ctx.fill(); }
      if (q.mode === 'beacon' && v > 0.3) { const a0 = t * 7; ctx.globalAlpha = 0.25; ctx.fillStyle = q.col; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.arc(q.x, q.y, 0.35, a0, a0 + 0.5); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  // walker legs: hip on the hull, knee out, foot on the floor; feet step with the gait
  function drawLegs(R) {
    const t = performance.now() / 1000;
    for (const s of R.slots) {
      const w = s.wheel; if (!w || !w.attached) { ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(s.lp[0], s.side * (R.hw - 0.02), 0.025, 0, 6.29); ctx.fill(); continue; }
      const ph = s.spin * 0.7 + (s.tri ? Math.PI : 0), lift = Math.max(0, Math.sin(ph)), sw = Math.cos(ph) * 0.06;
      const hx = s.lp[0] * 0.8, hy = s.side * (R.hw - 0.04), fx = s.lp[0] + sw, fy = s.side * (R.hw + 0.13 + lift * 0.03), kx = (hx + fx) / 2 + sw * 0.3, ky = s.side * (R.hw + 0.2 + lift * 0.05);
      ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = w.hp / w.maxHp < 0.5 ? '#8A5A3A' : '#6F7169'; ctx.lineWidth = 0.03; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#9A9C94'; ctx.beginPath(); ctx.arc(kx, ky, 0.022, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 1.4; ctx.strokeStyle = INK; ctx.stroke();
    }
  }
  function chaseDots(q, n, on, col, t, off) { // little lights along a segment (segment frame)
    for (let k = 0; k < n; k++) { const x = -q.len / 2 + (k + 0.5) * q.len / n, lit = on > 0 && ((t * 12 - k - off) % 6 + 6) % 6 < 1.5; ctx.fillStyle = lit ? col : '#2B2620'; ctx.beginPath(); ctx.arc(x, 0, 0.013, 0, 6.29); ctx.fill(); if (lit) { ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x, 0, 0.035, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; } }
  }
  function drawArm(R, segs, cols, lampCol, raised) {
    const t = performance.now() / 1000, on = (R.fx && R.fx.chase) || (R.fx && R.fx.hook) || 0;
    // shadow: a raised arm throws its shadow further
    for (const q of segs) if (q.attached) { const b = q.body, p = b.getPosition(), o = raised ? 0.14 : 0.05; ctx.save(); ctx.translate(p.x + o, p.y + o); ctx.rotate(b.getAngle()); ctx.fillStyle = 'rgba(20,14,8,0.22)'; path(q.verts); ctx.fill(); ctx.restore(); }
    segs.forEach((q, k) => { if (!q.attached) return; onBody(q, () => { drawPart(q, cols[k] || cols[cols.length - 1], R, decorate(q, R, 0)); if (q.len && k < segs.length - 1) chaseDots(q, 5, on, lampCol, t, k * 5); bolt(-q.len / 2, 0); }); });
  }
  // the House Robot: hazard stripes on its deck, the aim ring while the mallet winds up (the tell), the giant mallet itself
  function hazardBand(x0, y0, x1, y1) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.fillStyle = HAZ; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillStyle = '#1C1813'; for (let x = x0 - (y1 - y0); x < x1; x += 0.09) { ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + 0.045, y1); ctx.lineTo(x + 0.045 + (y1 - y0), y0); ctx.lineTo(x + (y1 - y0), y0); ctx.closePath(); ctx.fill(); } ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); }
  function drawMallet(R) {
    const st = R.l4, b = R.body, p = b.getPosition(), a = b.getAngle(), t = performance.now() / 1000, HS = L.HOUSE, hl = R.hl, hw = R.hw, alive = R.alive && R.arm.hp > 0;
    if (!R.flipped) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); hazardBand(-hl * 0.97, -hw * 0.92, -hl * 0.8, hw * 0.92); hazardBand(hl * 0.8, -hw * 0.92, hl * 0.97, hw * 0.92); ctx.restore(); }
    if (!alive || R.flipped) return;
    const W2 = (x, y) => b.getWorldPoint(planck.Vec2(x, y)), PIV = -0.55 * hl, REST = 0.45 * hl;
    let hx, hy, sc, k = 0;
    if (st.mode === 'wind' && st.aim) { // the tell: a red ring where it will land; the head swings up and back over the robot, shaking at the top
      k = Math.max(0, Math.min(1, 1 - st.t / HS.wind)); const [ax, ay] = st.aim, rr = 0.45 - 0.17 * k, on = Math.sin(t * (8 + 22 * k)) > 0;
      ctx.save(); ctx.fillStyle = `rgba(255,59,43,${0.07 + 0.16 * k})`; ctx.beginPath(); ctx.arc(ax, ay, rr, 0, 6.29); ctx.fill();
      ctx.strokeStyle = `rgba(255,59,43,${on ? 0.95 : 0.45})`; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 7, PX * 4]); ctx.beginPath(); ctx.arc(ax, ay, rr, t * 2, t * 2 + 6.29); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(ax - rr * 0.55, ay); ctx.lineTo(ax + rr * 0.55, ay); ctx.moveTo(ax, ay - rr * 0.55); ctx.lineTo(ax, ay + rr * 0.55); ctx.stroke(); ctx.restore();
      const e = Math.min(1, k * 1.6), q = W2(REST + (PIV - 0.05 - REST) * e, 0); hx = q.x; hy = q.y; sc = 1.05 + 0.75 * Math.sin(Math.PI / 2 * e);
      if (k > 0.75) { hx += (Math.random() - 0.5) * 0.025; hy += (Math.random() - 0.5) * 0.025; }
    } else if (st.mode === 'slam' && st.aim) { // down it comes on the spot, rests on the floor, then lifts back onto the deck
      const e = HS.rec - st.t, down = Math.min(1, e / 0.08), up = Math.max(0, (e - (HS.rec - 0.3)) / 0.3), q0 = W2(PIV - 0.05, 0), rest = W2(REST, 0);
      const tx = st.aim[0] + (rest.x - st.aim[0]) * up, ty = st.aim[1] + (rest.y - st.aim[1]) * up;
      hx = q0.x + (tx - q0.x) * down; hy = q0.y + (ty - q0.y) * down; sc = 1.8 - 0.85 * down + 0.1 * up;
    } else { const q = W2(REST, 0); hx = q.x; hy = q.y; sc = 1.05; } // at rest: folded forward on the deck
    const pv = W2(PIV, 0), dx = hx - pv.x, dy = hy - pv.y, ang = Math.hypot(dx, dy) > 0.05 ? Math.atan2(dy, dx) : a, hgt = Math.max(0, sc - 0.95);
    // shadow of the head: the higher it is, the further off
    ctx.save(); ctx.translate(hx + 0.05 + hgt * 0.4, hy + 0.05 + hgt * 0.4); ctx.rotate(ang); ctx.fillStyle = 'rgba(20,14,8,0.25)'; ctx.fillRect(-0.18 * sc, -0.3 * sc, 0.36 * sc, 0.6 * sc); ctx.restore();
    // the arm: a thick beam from the pivot to the head
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 0.13; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = '#6F7169'; ctx.lineWidth = 0.09; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.025; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#4A4540'; ctx.beginPath(); ctx.arc(pv.x, pv.y, 0.085, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke(); bolt(pv.x, pv.y);
    // the head: a big steel block with hazard-striped faces
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.scale(sc, sc);
    ctx.fillStyle = '#7D8078'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.6 / sc; ctx.fillRect(-0.18, -0.3, 0.36, 0.6); ctx.strokeRect(-0.18, -0.3, 0.36, 0.6);
    hazardBand(-0.18, -0.3, 0.18, -0.2); hazardBand(-0.18, 0.2, 0.18, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-0.18, -0.2, 0.07, 0.4);
    bolt(-0.09, -0.12); bolt(-0.09, 0.12); bolt(0.09, -0.12); bolt(0.09, 0.12);
    if (k > 0.05) { ctx.globalAlpha = Math.sin(t * (8 + 22 * k)) > 0 ? 0.95 : 0.25; ctx.fillStyle = '#FF3B2B'; ctx.beginPath(); ctx.arc(0, 0, 0.045, 0, 6.29); ctx.fill(); ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(0, 0, 0.11, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; } // a strobe on the head too
    ctx.restore();
  }
  function drawL4(R, i) {
    const w = R.spec.weapon, b = R.body, t = performance.now() / 1000;
    if (w === 'mallet' && R.l4 && !R.inPit) drawMallet(R);
    if (w === 'hydra' && R.arms) {
      const raised = R.l4.mode === 'reach';
      drawArm(R, R.arms, ['#8C8F86', '#9A9C94', '#5B5E57'], '#FFB020', raised);
      const h = R.arms[2]; if (h.attached) onBody(h, () => { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const y of [-0.08, 0, 0.08]) { ctx.beginPath(); ctx.moveTo(0.15, y - 0.025); ctx.lineTo(0.21, y); ctx.lineTo(0.15, y + 0.025); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.fillStyle = raised ? '#FF3B2B' : '#5A1A14'; ctx.beginPath(); ctx.arc(0.02, 0, 0.025, 0, 6.29); ctx.fill(); if (raised) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(0.02, 0, 0.07, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; } });
      if (raised && R.l4.goal) { const g = b.getWorldPoint(planck.Vec2(R.l4.goal[0] + 0.12, R.l4.goal[1])); ctx.strokeStyle = 'rgba(255,59,43,0.7)'; ctx.lineWidth = PX * 2; ctx.setLineDash([PX * 4, PX * 3]); ctx.beginPath(); ctx.arc(g.x, g.y, 0.12 + 0.04 * Math.sin(t * 30), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (w === 'corkscrew' && R.auger && R.auger.attached) {
      const a1 = b.getWorldPoint(planck.Vec2(R.hl - 0.05, 0)), a2 = R.auger.body.getPosition(); ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
      onBody(R.auger, () => { drawPart(R.auger, '#B9BBB4', R, () => { const ph = (R.l4.spin || 0) * 0.02 % 0.06; ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = PX * 2.4; for (let x = -0.12 + ph; x < 0.36; x += 0.06) { ctx.beginPath(); ctx.moveTo(x, -0.1); ctx.lineTo(x + 0.05, 0.1); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-0.1, -0.02, 0.4, 0.015); }); });
      if (R.grab && R.l4.mode === 'anchor') { const p = R.auger.body.getWorldPoint(planck.Vec2(0.3, 0)); if (Math.random() < 0.7) spawn({ t: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 0.3, max: 0.3, col: '#C9A227' }); }
    }
    if (w === 'trebuchet') {
      const k = R.armAnim > 0 ? 1 - R.armAnim / 0.55 : 0, sw = Math.sin(Math.PI * Math.min(1, k * 1.6)), ang = Math.PI * Math.min(1, k * 1.8), sc = 1 + 0.6 * sw, ch = R.fx.charge || 0;
      ctx.save(); const p = b.getPosition(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.translate(-0.1 * R.hl, 0);
      ctx.rotate(ang); ctx.scale(sc, sc); ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.12, 0); ctx.lineTo(R.hl + 0.12, 0); ctx.stroke(); ctx.strokeStyle = R.tarm.hp > 0 ? '#C9A227' : '#55524C'; ctx.lineWidth = 0.045; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.fillRect(-0.24, -0.11, 0.14, 0.22); ctx.strokeRect(-0.24, -0.11, 0.14, 0.22); // counterweight
      if (ch > 0) { ctx.strokeStyle = Math.sin(t * 40) > 0 ? '#FFB020' : '#FF3B2B'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(0, 0, 0.12 + ch * 0.08, 0, 6.29); ctx.stroke(); }
      ctx.restore(); bolt(b.getWorldPoint(planck.Vec2(-0.1 * R.hl, 0)).x, b.getWorldPoint(planck.Vec2(-0.1 * R.hl, 0)).y);
    }
    if (w === 'angler' && R.arms) {
      drawArm(R, R.arms, ['#8C8F86', '#C9A227'], '#3CFF8A', R.l4.mode === 'reach');
      if (R.grab && R.l4.mode === 'hold') { const h = R.arms[1].body.getWorldPoint(planck.Vec2(0.15, -0.05)), d = b.getWorldPoint(planck.Vec2(R.hl + 0.1, 0)); ctx.strokeStyle = `rgba(60,255,138,${0.5 + 0.4 * Math.sin(t * 20)})`; ctx.lineWidth = PX * 2.5; ctx.setLineDash([PX * 5, PX * 3]); ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (w === 'lodestone' && R.coil) {
      const C = b.getWorldPoint(planck.Vec2(R.hl + 0.02, 0)), f = R.fx.field || 0, rp = R.fx.repulse || 0;
      if (f > 0) { for (let k = 0; k < 3; k++) { const r = 0.25 + ((t * 1.6 + k / 3) % 1) * 1.3; ctx.strokeStyle = `rgba(71,168,255,${0.45 * (1 - (r - 0.25) / 1.3) * f})`; ctx.lineWidth = PX * 2.5; ctx.beginPath(); ctx.arc(C.x, C.y, r, b.getAngle() - 0.85, b.getAngle() + 0.85); ctx.stroke(); } }
      if (R.grab) { const E = R.grab.robot.body.getPosition(); ctx.strokeStyle = 'rgba(200,235,255,0.9)'; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const q = k / 8, x = C.x + (E.x - C.x) * q + (Math.random() - 0.5) * 0.08, y = C.y + (E.y - C.y) * q + (Math.random() - 0.5) * 0.08; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      if (rp > 0) { ctx.strokeStyle = `rgba(255,70,50,${rp})`; ctx.lineWidth = PX * 6 * rp; ctx.beginPath(); ctx.arc(C.x, C.y, 0.3 + (1 - rp) * 1.6, 0, 6.29); ctx.stroke(); }
      ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(b.getAngle()); ctx.strokeStyle = R.coil.hp > 0 ? (f > 0.5 ? '#9BD4FF' : '#B87333') : '#3a3530'; ctx.lineWidth = PX * 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-0.1 - k * 0.04, 0, 0.02, R.hw * 0.55, 0, 0, 6.29); ctx.stroke(); } ctx.restore();
    }
    if (w === 'orbiter' && R.discs) {
      const c0 = b.getPosition(), spin = R.fx.spin || 0;
      if (R.l4.mode !== 'docked') { ctx.strokeStyle = `rgba(255,90,60,${0.15 + 0.25 * Math.min(1, spin)})`; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(c0.x, c0.y, R.r0 + (R.l4.ext || 0), 0, 6.29); ctx.stroke(); }
      for (const q of R.discs) if (q.attached) { const p = q.body.getPosition(); if (R.l4.mode !== 'docked') { ctx.strokeStyle = INK; ctx.lineWidth = 0.045; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = 0.022; ctx.stroke(); } drawBuzz(q, { buzzW: q.spin, buzzMax: 95, buzzR: 0.13 / 0.15 * 0.14 }); }
      const a = R.rotor.getAngle(); ctx.save(); ctx.translate(c0.x, c0.y); ctx.rotate(a); ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.1, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = HAZ; ctx.fillRect(-0.02, -0.09, 0.04, 0.18); ctx.restore();
    }
    if (w === 'carousel' && R.car) {
      const c0 = R.car.getPosition(), a = R.car.getAngle();
      for (const q of [R.gmWedge, R.gmAxe]) if (q && q.attached) onBody(q, () => drawPart(q, q === R.gmWedge ? '#D9B43A' : '#8C8F86', R, q === R.gmAxe ? () => { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1, -1, 2, 0.02); } : null));
      if (R.gmSaw && R.gmSaw.attached) { const bp = R.gmSaw.body.getPosition(); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(bp.x, bp.y); ctx.stroke(); drawBuzz(R.gmSaw, { buzzW: R.gmSaw.spin, buzzMax: 110, buzzR: 0.12 }); }
      ctx.save(); ctx.translate(c0.x, c0.y); ctx.rotate(a); ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.15, 0, 6.29); ctx.fill(); ctx.stroke();
      const cols = ['#D9B43A', '#47A8FF', '#FF5A3C'], an = [0, 2.094, -2.094], st = R.l4;
      for (let k = 0; k < 3; k++) { const lit = st.sel === k ? 1 : st.want === k ? (Math.sin(t * 20) > 0 ? 1 : 0.2) : 0.15; ctx.globalAlpha = 0.3 + 0.7 * lit; ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(Math.cos(an[k]) * 0.1, Math.sin(an[k]) * 0.1, 0.028, 0, 6.29); ctx.fill(); if (lit > 0.5) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(Math.cos(an[k]) * 0.1, Math.sin(an[k]) * 0.1, 0.07, 0, 6.29); ctx.fill(); } ctx.globalAlpha = 1; }
      ctx.restore();
      if (R.swing > 0 || R.recover > 0) { const s = R.swing > 0 ? 1 - R.swing / 0.2 : R.recover / 0.45, hx = R.hl * 0.6 + 0.35 * s, k2 = 1 + 0.5 * Math.sin(Math.PI * s); ctx.save(); const p = b.getPosition(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.strokeStyle = INK; ctx.lineWidth = 0.06 * k2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, 0); ctx.stroke(); ctx.translate(hx, 0); ctx.scale(k2, k2); ctx.fillStyle = '#B9BBB4'; ctx.lineWidth = PX * 2; path([[-0.04, -0.13], [0.05, -0.1], [0.05, 0.1], [-0.04, 0.13]]); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (st.think > 0) { const p = b.getPosition(); ctx.fillStyle = 'rgba(183,154,216,0.9)'; ctx.font = '700 0.16px IBM Plex Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('♞', p.x, p.y - R.hl - 0.12); }
    }
  }
  // the new mechanical weapons (separate bodies on joints)
  function onBody(part, f) { const b = part.body, p = b.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); f(); ctx.restore(); }
  function drawShell(part, R, i) {
    const rad = Math.max(...part.verts.map(v => Math.hypot(v[0], v[1]))), w = R ? R.bladeW / R.bladeMax : 0, col = R ? TC(i) : PAL.steel;
    onBody(part, () => {
      ctx.fillStyle = '#9A9C94'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
      for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(sg * (rad - 0.04), -sg * 0.05); ctx.lineTo(sg * (rad + 0.07), -sg * 0.025); ctx.lineTo(sg * (rad + 0.07), sg * 0.025); ctx.lineTo(sg * (rad - 0.04), sg * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      drawPart(part, '#B9BBB4', R, decorate(part, R, 0));
      ctx.fillStyle = R && R.alive ? col.col : '#4A4540'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.62, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.stroke();
      ctx.fillStyle = R && R.alive ? col.dark : '#3A3530'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.22, 0, 6.29); ctx.fill(); ctx.stroke();
      for (let k = 0; k < 6; k++) { const t = k / 6 * 6.283; bolt(Math.cos(t) * rad * 0.8, Math.sin(t) * rad * 0.8); }
    });
    if (w > 0.25) { const p = part.body.getPosition(); ctx.strokeStyle = `rgba(255,255,255,${w * 0.55})`; ctx.lineWidth = PX * 2.5; for (let k = 0; k < 3; k++) { const a0 = part.body.getAngle() + k * 2.1; ctx.beginPath(); ctx.arc(p.x, p.y, rad + 0.04, a0, a0 + 0.9 * w); ctx.stroke(); } }
  }
  function drawMech(R, i) {
    if (R.shell && R.shell.attached) drawShell(R.shell, R, i);
    if (R.sweep && R.sweep.attached) {
      const pv = R.body.getWorldPoint(planck.Vec2(R.hl + 0.04, 0)), w = Math.abs(R.sweep.body.getAngularVelocity() - R.body.getAngularVelocity());
      if (w > 6) { const a = R.sweep.body.getAngle(); ctx.fillStyle = 'rgba(220,222,215,0.25)'; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.arc(pv.x, pv.y, 0.64, a - Math.sign(R.armSide) * 0.6, a, R.armSide < 0); ctx.closePath(); ctx.fill(); }
      onBody(R.sweep, () => { drawPart(R.sweep, '#B9BBB4', R, decorate(R.sweep, R, 0)); ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0, 0, 0.045, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke(); });
    }
    if (R.twins) for (const q of R.twins) if (q.attached) {
      const bp = q.body.getPosition(), cp = R.body.getWorldPoint(planck.Vec2(R.hl - 0.04, q.mount[1])); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(bp.x, bp.y); ctx.stroke();
      drawBuzz(q, { buzzW: q.spin, buzzMax: R.buzzMax, buzzR: 0.12 });
    }
    if (R.tails) {
      ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); const r0 = R.body.getWorldPoint(planck.Vec2(-R.hl - 0.02, 0)); ctx.moveTo(r0.x, r0.y);
      for (const q of R.tails) { if (!q.attached) break; const c = q.body.getPosition(); ctx.lineTo(c.x, c.y); } ctx.stroke(); ctx.lineCap = 'butt';
      for (const q of R.tails) if (q.attached) onBody(q, () => { drawPart(q, q.label === 'Tail mace' ? '#5B5E57' : '#8C8F86', R, decorate(q, R, 0)); if (q.label === 'Tail mace') { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const [x, y, dx, dy] of [[-0.03, -0.08, 0, -0.06], [-0.03, 0.08, 0, 0.06], [-0.13, 0, -0.06, 0], [0.04, -0.05, 0.04, -0.04], [0.04, 0.05, 0.04, 0.04]]) { ctx.beginPath(); ctx.moveTo(x - 0.02, y); ctx.lineTo(x + dx, y + dy); ctx.lineTo(x + 0.02, y); ctx.closePath(); ctx.fill(); ctx.stroke(); } } });
    }
    if (R.ramHead && R.ramHead.attached) {
      const a1 = R.body.getWorldPoint(planck.Vec2(R.hl - 0.05, 0)), a2 = R.ramHead.body.getPosition(); ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = 0.04; ctx.stroke();
      onBody(R.ramHead, () => { drawPart(R.ramHead, '#6F7369', R, decorate(R.ramHead, R, 0)); ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const y of [-0.1, 0, 0.1]) { ctx.beginPath(); ctx.moveTo(0.12, y - 0.03); ctx.lineTo(0.2, y); ctx.lineTo(0.12, y + 0.03); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
    }
    if (R.spec.weapon === 'vdisc' && R.tool && R.tool.attached) { // motion stripes on the spinning disc
      const e = R.vE || 0; if (e > 0.15) { ctx.save(); const p0 = R.body.getPosition(); ctx.translate(p0.x, p0.y); ctx.rotate(R.body.getAngle()); ctx.strokeStyle = `rgba(60,55,50,${0.3 + 0.5 * e})`; ctx.lineWidth = PX * 2; const ph = (performance.now() / (60 - 40 * e)) % 1; for (let k = 0; k < 4; k++) { const x = R.hl + 0.01 + ((k / 4 + ph) % 1) * 0.32; ctx.beginPath(); ctx.moveTo(x, -0.035); ctx.lineTo(x + 0.03, 0.035); ctx.stroke(); } ctx.restore(); }
    }
    if (R.carry) { const p0 = R.carry.robot.body.getPosition(); ctx.strokeStyle = 'rgba(232,197,71,0.8)'; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 6, PX * 4]); ctx.beginPath(); ctx.arc(p0.x, p0.y, R.carry.robot.hl + 0.12, 0, 6.29); ctx.stroke(); ctx.setLineDash([]); }
    if (R.claps) for (const q of R.claps) if (q.attached) onBody(q, () => { drawPart(q, '#8C8F86', R, decorate(q, R, 0)); ctx.fillStyle = HAZ; ctx.fillRect(0.38, -0.05, 0.1, 0.1); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.strokeRect(0.38, -0.05, 0.1, 0.1); bolt(0, 0); });
  }
  function drawBlade(part, R) {
    const b = part.body, p = b.getPosition(), a = b.getAngle(), w = R ? R.bladeW / R.bladeMax : 0;
    ctx.save(); ctx.translate(p.x, p.y);
    if (w > 0.2) { ctx.fillStyle = `rgba(200,202,196,${0.12 + w * 0.18})`; ctx.beginPath(); ctx.arc(0, 0, 0.53, 0, 6.29); ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${w * 0.5})`; ctx.lineWidth = PX * 2; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(0, 0, 0.5, a + k * Math.PI, a + k * Math.PI + 0.9); ctx.stroke(); } }
    ctx.rotate(a);
    if (w > 0.4) { ctx.globalAlpha = 0.35; for (const o of [-0.25, -0.12]) { ctx.save(); ctx.rotate(o); path(part.outline); ctx.fillStyle = '#B9BBB4'; ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1; }
    drawPart(part, '#B9BBB4', R, decorate(part, R, 0));
    ctx.beginPath(); ctx.arc(0, 0, 0.05, 0, 6.29); ctx.fillStyle = '#5B5E57'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  function drawDebris(d) {
    if (d.gone && !d.fellT) return;
    if (d.fellT) return;
    const b = d.body, p = b.getPosition(), a = b.getAngle(), v = b.getLinearVelocity(), sp = Math.hypot(v.x, v.y);
    if (sp > 2) { ctx.strokeStyle = `rgba(255,240,210,${Math.min(0.5, sp / 12)})`; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - v.x * 0.07, p.y - v.y * 0.07); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.lineCap = 'butt'; }
    if (d.key === 'blade') { drawBlade(d, null); return; }
    if (d.key === 'buzz') { drawBuzz(d, null); return; }
    if (d.key === 'orbdisc' || d.key === 'gmsaw') { drawBuzz(d, { buzzW: d.body.getAngularVelocity(), buzzMax: 95, buzzR: 0.13 }); return; }
    if (d.key === 'glove') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); gloveShape(1); ctx.restore(); return; }
    if (d.key === 'ball') { drawBall(d); return; }
    if (d.key === 'shell') { drawShell(d, null, 0); return; }
    if (d.key === 'twinsaw') { drawBuzz(d, { buzzW: 0, buzzMax: 100, buzzR: 0.12 }); return; }
    ctx.save(); ctx.translate(p.x + 0.03, p.y + 0.03); ctx.rotate(a); ctx.fillStyle = 'rgba(20,14,8,0.25)'; path(d.verts); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    const fill = d.lid ? '#5C5650' : d.kind === 'wheel' ? RUBBER : d.kind === 'armour' ? '#8A8C84' : d.key === 'chassis' ? '#5B554D' : d.key === 'flipper' ? '#B89A35' : '#77796F';
    drawPart(d, fill, d.robot, d.kind === 'wheel' ? () => wheelTread(d, d.spin || 0) : null);
    ctx.restore();
  }
  function drawEwalls() {
    for (const w of S.ewalls) {
      const k = Math.min(1, w.life / 0.6), fl = w.life < 0.8 && Math.sin(performance.now() / 40) > 0 ? 0.4 : 1;
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.a); ctx.globalAlpha = k * fl;
      ctx.fillStyle = 'rgba(127,209,204,0.35)'; ctx.fillRect(-0.05, -0.5, 0.1, 1); ctx.strokeStyle = '#BFF5F0'; ctx.lineWidth = PX * 2.5; ctx.strokeRect(-0.035, -0.5, 0.07, 1);
      ctx.strokeStyle = 'rgba(191,245,240,0.6)'; ctx.lineWidth = PX; for (let y = -0.45; y < 0.5; y += 0.1) { ctx.beginPath(); ctx.moveTo(-0.035, y); ctx.lineTo(0.035, y + 0.05); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawDrones() {
    const t = performance.now() / 1000;
    for (const d of S.drones) {
      if (!d.alive) continue;
      const p = d.body.getPosition(), H = d.H, r = H.r * 1.45, off = d.off > 0 || !d.owner.alive || d.owner.fried || d.owner.chipFreeze > 0 || d.owner.stun > 0, team = TC(d.owner.id);
      if (d.beam) { const B = d.beam; ctx.lineCap = 'round'; if (B.heal) { ctx.strokeStyle = 'rgba(76,194,106,0.55)'; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 5, PX * 4]); ctx.lineDashOffset = -t * 40 * PX; ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x1, B.y1); ctx.stroke(); ctx.setLineDash([]); } else { ctx.strokeStyle = 'rgba(255,60,40,0.35)'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x1, B.y1); ctx.stroke(); ctx.strokeStyle = '#FFD9D0'; ctx.lineWidth = 0.01; ctx.stroke(); if (Math.random() < 0.3) sparks(B.x1, B.y1, 2); } ctx.lineCap = 'butt'; }
      const hov = H.physical ? 0.04 : 0.16;
      ctx.fillStyle = 'rgba(20,14,8,0.22)'; ctx.beginPath(); ctx.arc(p.x + hov, p.y + hov, r * 1.1, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y);
      if (!H.physical) for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.785, ax = Math.cos(a) * r * 1.15, ay = Math.sin(a) * r * 1.15; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax, ay); ctx.stroke(); ctx.fillStyle = 'rgba(200,200,190,0.35)'; ctx.beginPath(); ctx.ellipse(ax, ay, r * 0.55, r * 0.14, d.spin + k, 0, 6.29); ctx.fill(); }
      ctx.beginPath(); if (H.physical) { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.39; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); } else ctx.arc(0, 0, r * 0.7, 0, 6.29);
      ctx.fillStyle = d.hitT > 0 ? '#FFF4D6' : off ? '#6F7169' : H.col; ctx.fill(); ctx.lineWidth = PX * 2.4; ctx.strokeStyle = team.col; ctx.stroke();
      ctx.fillStyle = off ? '#3a3530' : '#fff'; ctx.font = `700 ${r * 0.9}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(H.ic, 0, r * 0.05);
      const f = d.hp / d.maxHp; if (f < 1) { ctx.strokeStyle = f > 0.5 ? '#79B46A' : f > 0.25 ? '#E0B848' : '#E06A58'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, r * 1.35, -1.57, -1.57 + 6.283 * f); ctx.stroke(); if (f < 0.35 && Math.random() < 0.1) smoke(p.x, p.y, true, 0.04); }
      if (d.key === 'booster' && !off && Math.random() < 0.6) { const fv = d.owner.body.getWorldVector(planck.Vec2(-1, 0)); spawn({ t: 'fire', x: p.x + fv.x * r, y: p.y + fv.y * r, vx: fv.x * 2.5, vy: fv.y * 2.5, life: 0.2, max: 0.2, s: 0.04, grow: true }); }
      if (off && Math.random() < 0.05) sparks(p.x, p.y, 3);
      ctx.restore();
    }
  }
  function drawWalls() {
    const moving = S.evt && S.evt.type === 'walls', t = performance.now() / 1000;
    for (const w of S.walls) {
      const p = w.body.getPosition(), hx = w.axis === 'x' ? 0.25 : L.HALF + 0.25, hy = w.axis === 'y' ? 0.25 : L.HALF + 0.25;
      const off = Math.abs(w.axis === 'x' ? p.x - w.home[0] : p.y - w.home[1]); if (off < 0.01) continue;
      ctx.fillStyle = '#5C5650'; ctx.fillRect(p.x - hx, p.y - hy, hx * 2, hy * 2);
      ctx.save(); ctx.beginPath(); ctx.rect(p.x - hx, p.y - hy, hx * 2, hy * 2); ctx.clip();
      for (let k = -6; k < 6; k += 0.3) { ctx.fillStyle = Math.round(k / 0.3) % 2 ? INK : (moving && Math.sin(t * 10) > 0 ? '#FF5A3C' : HAZ); ctx.beginPath(); ctx.moveTo(p.x + k, p.y - 6); ctx.lineTo(p.x + k + 0.15, p.y - 6); ctx.lineTo(p.x + k + 0.15 + 6, p.y + 6); ctx.lineTo(p.x + k + 6, p.y + 6); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 3; ctx.strokeRect(p.x - hx, p.y - hy, hx * 2, hy * 2);
    }
  }
  function drawCratesAndWarnings() {
    const t = performance.now() / 1000;
    for (const o of S.oils) { const k = Math.min(1, o.life / 1.5); ctx.fillStyle = `rgba(18,14,10,${0.75 * k})`; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.82, o.x * 3, 0, 6.29); ctx.fill(); ctx.fillStyle = `rgba(120,110,160,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(o.x - o.r * 0.25, o.y - o.r * 0.2, o.r * 0.35, o.r * 0.15, 0.5, 0, 6.29); ctx.fill(); }
    if (S.spikes) for (const k of S.spikes) { // Floor Spikes: warning ring, then a plate of steel spikes
      if (k.t < k.warn) { ctx.save(); ctx.strokeStyle = `rgba(220,38,38,${0.5 + 0.4 * Math.sin(k.t * 25)})`; ctx.lineWidth = 0.05; ctx.setLineDash([0.12, 0.08]); ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 6.29); ctx.stroke(); ctx.restore(); continue; }
      const f = Math.min(1, (k.t - k.warn) / 0.15, (k.warn + k.dur - k.t) / 0.3);
      ctx.fillStyle = `rgba(60,56,52,${0.55 * f})`; ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 6.29); ctx.fill();
      ctx.fillStyle = `rgba(200,200,205,${f})`; ctx.strokeStyle = `rgba(40,40,40,${f})`; ctx.lineWidth = 0.012;
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const sx = k.x + i * 0.2 + (j % 2 ? 0.1 : 0), sy = k.y + j * 0.18; if (Math.hypot(sx - k.x, sy - k.y) > k.r - 0.08) continue; const h = 0.08 * f; ctx.beginPath(); ctx.moveTo(sx - 0.06, sy + 0.04); ctx.lineTo(sx + 0.06, sy + 0.04); ctx.lineTo(sx, sy + 0.04 - h * 1.6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    for (const m of S.mines) { ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(m.x, m.y, 0.07, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = m.arm > 0 ? '#E8C547' : (Math.sin(t * 10 + m.x) > 0 ? '#FF3B2B' : '#5A1A12'); ctx.beginPath(); ctx.arc(m.x, m.y, 0.025, 0, 6.29); ctx.fill(); ctx.strokeStyle = m.owner.id ? '#C8642B' : '#3F78A8'; ctx.lineWidth = PX * 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, 0.1, 0, 6.29); ctx.stroke(); }
    for (const c of S.crates) {
      const age = S.t - c.t0, drop = Math.max(0, 1 - age / 0.5), sc = 1 + drop * 2.5, bob = Math.sin(t * 4) * 0.02;
      ctx.fillStyle = `rgba(20,14,8,${0.3 * (1 - drop)})`; ctx.beginPath(); ctx.ellipse(c.x + 0.05, c.y + 0.07, 0.2, 0.12, 0, 0, 6.29); ctx.fill();
      ctx.save(); ctx.translate(c.x, c.y - drop * 1.2 + bob); ctx.scale(sc, sc); ctx.rotate(drop * 2);
      ctx.fillStyle = '#A0723F'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4 / sc; rr(-0.17, -0.17, 0.34, 0.34, 0.03); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6E4A24'; ctx.lineWidth = PX * 2 / sc; ctx.beginPath(); ctx.moveTo(-0.17, -0.17); ctx.lineTo(0.17, 0.17); ctx.moveTo(0.17, -0.17); ctx.lineTo(-0.17, 0.17); ctx.stroke();
      ctx.fillStyle = CRATE_COL[c.type]; ctx.beginPath(); ctx.arc(0, 0, 0.1, 0, 6.29); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${0.13}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(CRATE_ICON[c.type], 0, 0.005);
      ctx.restore();
      ctx.strokeStyle = CRATE_COL[c.type]; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(c.x, c.y, 0.26, -1.57, -1.57 + 6.28 * c.life / 12); ctx.stroke();
    }
    const E = S.evt;
    if (E && E.warnPts && E.t < E.warn) for (const [x, y, r] of E.warnPts) {
      const k = E.t / E.warn, pulse = 0.5 + 0.5 * Math.sin(t * 16);
      ctx.fillStyle = `rgba(220,40,30,${0.12 + 0.18 * k})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
      ctx.strokeStyle = `rgba(255,80,50,${0.5 + 0.5 * pulse})`; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 10, PX * 6]); ctx.beginPath(); ctx.arc(x, y, r, t * 2, t * 2 + 6.29); ctx.stroke(); ctx.setLineDash([]);
      if (E.type === 'hammer') { ctx.fillStyle = `rgba(20,14,8,${0.15 + 0.45 * k})`; ctx.beginPath(); ctx.arc(x, y, r * (0.3 + 0.7 * k), 0, 6.29); ctx.fill(); }
      else { ctx.fillStyle = '#E8C547'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, r * 0.2, 0, 6.29); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.font = `700 ${0.28}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y);
    }
    if (E && E.type === 'hammer' && E.fired && E.t < E.warn + 0.4) { const [x, y, r] = E.warnPts[0], k = (E.t - E.warn) / 0.4; ctx.fillStyle = `rgba(90,86,80,${1 - k})`; ctx.strokeStyle = INK; ctx.lineWidth = PX * 3; rr(x - r * 0.9, y - r * 0.6, r * 1.8, r * 1.2, 0.05); ctx.fill(); ctx.stroke(); }
  }
  function drawArena() {
    ctx.drawImage(floorC, -VIEW / 2, -VIEW / 2, VIEW, VIEW);
    ctx.drawImage(decal, -VIEW / 2, -VIEW / 2, VIEW, VIEW);
    const A = S.arena, P = L.PIT;
    if (A.pit) {
      const g = ctx.createLinearGradient(-P, -P, P, P); g.addColorStop(0, '#0E0B08'); g.addColorStop(1, '#2A2420');
      ctx.fillStyle = g; ctx.fillRect(-P, -P, 2 * P, 2 * P);
      ctx.save(); ctx.beginPath(); ctx.rect(-P - 0.12, -P - 0.12, 2 * P + 0.24, 2 * P + 0.24); ctx.rect(-P, -P, 2 * P, 2 * P); ctx.clip('evenodd');
      for (let t = -3; t < 3; t += 0.16) { ctx.fillStyle = Math.round(t / 0.16) % 2 ? INK : HAZ; ctx.beginPath(); ctx.moveTo(t, -1.5); ctx.lineTo(t + 0.08, -1.5); ctx.lineTo(t + 0.08 + 3, 1.5); ctx.lineTo(t + 3, 1.5); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 3; ctx.strokeRect(-P - 0.12, -P - 0.12, 2 * P + 0.24, 2 * P + 0.24);
    }
    if (A.spikes) {
      const H = L.HALF; ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5;
      const strip = (x0, y0, dx, dy, nx, ny) => { for (let k = 0; k < 14; k++) { const x = x0 + dx * k * 0.2, y = y0 + dy * k * 0.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 0.1 + nx * 0.13, y + dy * 0.1 + ny * 0.13); ctx.lineTo(x + dx * 0.2, y + dy * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke(); } };
      strip(-1.4, -H + 0.01, 1, 0, 0, 1); strip(-1.4, H, 1, 0, 0, -1); strip(-H, -1.4, 0, 1, 1, 0); strip(H, -1.4, 0, 1, -1, 0);
    }
    for (const s of S.sawState) {
      ctx.fillStyle = '#5B554D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(s.x - 0.42, s.y - 0.08, 0.84, 0.16, 0.04); ctx.fill(); ctx.stroke();
      if (s.up) {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin);
        ctx.fillStyle = '#C9CBC4'; ctx.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28, r = k % 2 ? s.r : s.r * 0.85; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6F7169'; ctx.beginPath(); ctx.arc(0, 0, 0.07, 0, 6.29); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else { ctx.fillStyle = '#1C1813'; ctx.fillRect(s.x - 0.36, s.y - 0.025, 0.72, 0.05); }
    }
  }
  function drawProjectiles() {
    ctx.lineCap = 'round';
    for (const p of S.projs) {
      if (p.dead) continue;
      const a = Math.atan2(p.vy, p.vx);
      if (p.rocket) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},40,${0.8 - k * 0.2})`; ctx.beginPath(); ctx.arc(-0.1 - k * 0.04 - Math.random() * 0.03, 0, 0.03 - k * 0.006, 0, 6.29); ctx.fill(); }
        ctx.fillStyle = '#E4E1DA'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(0.08, 0); ctx.lineTo(0.04, -0.03); ctx.lineTo(-0.08, -0.03); ctx.lineTo(-0.08, 0.03); ctx.lineTo(0.04, 0.03); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#D33A2C'; ctx.beginPath(); ctx.moveTo(0.08, 0); ctx.lineTo(0.04, -0.03); ctx.lineTo(0.04, 0.03); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6F7169'; ctx.fillRect(-0.09, -0.05, 0.04, 0.1);
        ctx.restore(); continue;
      }
      if (p.harpoon) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.strokeStyle = '#3B2F22'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.moveTo(-0.25, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5; ctx.beginPath(); ctx.moveTo(0.07, 0); ctx.lineTo(-0.03, -0.04); ctx.lineTo(-0.01, 0); ctx.lineTo(-0.03, 0.04); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); const o = p.owner.body.getPosition(); ctx.strokeStyle = 'rgba(59,47,34,0.8)'; ctx.lineWidth = 0.015; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(p.x, p.y); ctx.stroke(); continue; }
      ctx.strokeStyle = p.cause === 'heavy' ? 'rgba(255,154,60,0.6)' : 'rgba(255,229,138,0.6)'; ctx.lineWidth = p.r * 1.4; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = p.cause === 'heavy' ? '#3A3530' : '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    for (const s of S.shells) {
      const k = s.t / s.T, x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - s.y0) * k, h = 4 * k * (1 - k);
      ctx.strokeStyle = `rgba(200,40,30,${0.4 + 0.4 * Math.sin(S.t * 20)})`; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(s.x1, s.y1, 0.35, 0, 6.29); ctx.stroke();
      ctx.fillStyle = 'rgba(20,14,8,0.3)'; ctx.beginPath(); ctx.arc(x, y, 0.05, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#3A3530'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x - h * 0.4, y - h * 0.6, 0.05 * (1 + h * 1.4), 0, 6.29); ctx.fill(); ctx.stroke();
    }
    for (const d of S.discs) {
      const p = d.body.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(d.body.getAngle());
      ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath();
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28, r = k % 2 ? 0.085 : 0.068; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    for (const R of S.robots) if (R.beam) {
      const B = R.beam; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,60,40,0.35)'; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x1, B.y1); ctx.stroke();
      ctx.strokeStyle = '#FFD9D0'; ctx.lineWidth = 0.018; ctx.stroke(); ctx.lineCap = 'butt';
      if (Math.random() < 0.5) sparks(B.x1, B.y1, 3);
    }
  }
  function drawParticles() {
    for (const p of parts) {
      const k = Math.max(0, p.life / p.max);
      if (p.t === 'ring') { ctx.strokeStyle = p.col || `rgba(255,245,220,${k})`; ctx.globalAlpha = k; ctx.lineWidth = PX * 4 * k + PX; ctx.beginPath(); ctx.arc(p.x, p.y, p.s + (1 - k) * 0.6, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (p.t === 'spark' && p.col) { ctx.strokeStyle = p.col; ctx.globalAlpha = k; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (p.t === 'spark') { ctx.strokeStyle = `rgba(255,${180 + 60 * k},80,${k})`; ctx.lineWidth = PX * 1.8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke(); }
      else if (p.t === 'smoke') { ctx.fillStyle = p.dark ? `rgba(40,36,32,${0.35 * k})` : `rgba(150,145,138,${0.3 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.29); ctx.fill(); }
      else if (p.t === 'fire') { const s = p.grow ? p.s * (2 - k) : p.s * k + 0.01; ctx.fillStyle = `rgba(255,${100 + 120 * k},30,${0.8 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.29); ctx.fill(); }
      else if (p.t === 'shard') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r + p.life * 6); ctx.fillStyle = p.col; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); ctx.restore(); }
      else if (p.t === 'dust') { ctx.strokeStyle = `rgba(120,105,85,${0.5 * k})`; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.s + (1 - k) * 0.3, 0, 6.29); ctx.stroke(); }
      else if (p.t === 'flash') { ctx.fillStyle = `rgba(255,240,200,${k * 0.8})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1.2 - k * 0.5), 0, 6.29); ctx.fill(); }
    }
  }
  function integrity(R) {
    const f = p => p ? Math.max(0, p.hp) / p.maxHp : 0;
    const wheels = R.slots.map(s => s.wheel ? f(s.wheel) * (s.motor.hp > 0 ? 1 : 0.3) : 0);
    const wep = R.blade || R.tool || R.turret || R.arm;
    return R.alive ? Math.max(0.02, f(R.chassis) * 0.35 + f(R.battery) * 0.2 + f(R.radio) * 0.1 + wheels.reduce((a, b) => a + b, 0) / wheels.length * 0.2 + (wep ? f(wep) : 1) * 0.15) : 0;
  }
  function hud() {
    const s = W / 700;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textBaseline = 'middle';
    // timer
    const left = Math.max(0, S.timeLimit - S.t), m = Math.floor(left / 60), sec = Math.floor(left % 60);
    ctx.fillStyle = 'rgba(43,33,24,0.85)'; ctx.fillRect(W / 2 - 46 * s, 8 * s, 92 * s, 30 * s);
    ctx.fillStyle = '#F6F2EA'; ctx.font = `600 ${18 * s}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.fillText(`${m}:${String(sec).padStart(2, '0')}`, W / 2, 23 * s);
    for (const R of S.robots) {
      const i0 = R.id, i = S.multi ? (R.home[0] > 0 ? 1 : 0) : i0, bot = S.multi && R.home[1] > 0; // i = right side
      if (bot) { ctx.save(); ctx.translate(0, W - 60 * s); }
      const x = i ? W - 12 * s - 200 * s : 12 * s, f = integrity(R);
      if (S.multi && !R.alive) ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(43,33,24,0.85)'; ctx.fillRect(x, 8 * s, 200 * s, 30 * s);
      ctx.fillStyle = TC(i0).light; ctx.font = `400 ${15 * s}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = i ? 'right' : 'left'; ctx.fillText(R.name, i ? x + 192 * s : x + 8 * s, 18 * s);
      ctx.fillStyle = '#4A443D'; ctx.fillRect(x + 8 * s, 28 * s, 184 * s, 5 * s);
      ctx.fillStyle = f > 0.5 ? '#79B46A' : f > 0.25 ? '#E0B848' : '#E06A58'; const bw = 184 * s * f; ctx.fillRect(i ? x + 192 * s - bw : x + 8 * s, 28 * s, bw, 5 * s);
      ctx.font = `600 ${10 * s}px IBM Plex Mono, monospace`; ctx.fillStyle = '#CFC6B7'; ctx.textAlign = i ? 'left' : 'right'; ctx.fillText(S.multi && !R.alive ? 'OUT' : S.multi && R.stats.kos ? `${R.stats.kos} KO · ${R.stats.lost.length} lost` : `${R.stats.lost.length} parts lost`, i ? x + 8 * s : x + 192 * s, 18 * s);
      // hype meter: full = rage
      const hy = R.rage > 0 ? 1 : (R.hype || 0) / 100;
      ctx.fillStyle = 'rgba(43,33,24,0.85)'; ctx.fillRect(x, 40 * s, 200 * s, 10 * s);
      ctx.fillStyle = '#4A443D'; ctx.fillRect(i ? x + 48 * s : x + 8 * s, 43 * s, 144 * s, 4 * s);
      ctx.fillStyle = R.rage > 0 ? (Math.sin(performance.now() / 60) > 0 ? '#FF5A3C' : '#FFB03C') : '#E8C547'; const hw = 144 * s * hy; ctx.fillRect(i ? x + 192 * s - hw : x + 8 * s, 43 * s, hw, 4 * s);
      ctx.font = `600 ${8 * s}px IBM Plex Mono, monospace`; ctx.fillStyle = R.rage > 0 ? '#FF8A5C' : '#CFC6B7'; ctx.textAlign = i ? 'left' : 'right'; ctx.fillText(R.rage > 0 ? 'RAGE!' : 'HYPE', i ? x + 8 * s : x + 192 * s, 45.5 * s);
      ctx.globalAlpha = 1; if (bot) ctx.restore();
    }
    if (S.t > S.timeLimit - 30 && !S.over && S.countdown <= 0) { ctx.fillStyle = Math.sin(performance.now() / 120) > 0 ? '#FF5A3C' : HAZ; ctx.font = `400 ${13 * s}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('SUDDEN DEATH', W / 2, 48 * s); }
    if (S.countdown > 0) {
      const n = Math.ceil(S.countdown), k = S.countdown % 1;
      ctx.font = `400 ${(90 + 40 * k) * s}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(43,33,24,0.6)'; ctx.fillText(n, W / 2 + 4 * s, W / 2 + 4 * s); ctx.fillStyle = HAZ; ctx.fillText(n, W / 2, W / 2);
    } else if (S.t < 0.8) { ctx.font = `400 ${84 * s}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = HAZ; ctx.globalAlpha = 1 - S.t / 0.8; ctx.fillText('FIGHT!', W / 2, W / 2); ctx.globalAlpha = 1; }
    if (S.over && S.result) {
      const R = S.robots[S.result.winner];
      const by = W * 0.24; ctx.fillStyle = 'rgba(43,33,24,0.82)'; ctx.fillRect(0, by - 52 * s, W, 104 * s);
      ctx.textAlign = 'center'; ctx.fillStyle = S.result.how === 'KO' ? HAZ : '#F6F2EA'; ctx.font = `400 ${46 * s}px "Saira Stencil One", Impact, sans-serif`;
      ctx.fillText(S.result.how === 'KO' ? (S.multi ? (S.mode === '2v2' ? 'TEAM WINS' : 'LAST ONE STANDING') : 'KNOCKOUT') : 'TIME', W / 2, by - 16 * s);
      const wn = S.multi && S.mode === '2v2' ? S.result.winners.map(k => S.robots[k].name).join(' & ') + ' win' : `${R.name} wins`;
      ctx.fillStyle = TC(R.id).light; ctx.font = `600 ${15 * s}px IBM Plex Sans, sans-serif`; ctx.fillText(wn, W / 2, by + 22 * s);
    }
    if (slowT > 0 && !S.over) { ctx.fillStyle = HAZ; ctx.font = `600 ${12 * s}px IBM Plex Mono, monospace`; ctx.textAlign = S.multi ? 'center' : 'left'; ctx.fillText('SLOW-MO', S.multi ? W / 2 : 12 * s, S.multi ? W - 34 * s : W - 16 * s); }
    if (st.paused) { ctx.fillStyle = '#F6F2EA'; ctx.font = `600 ${13 * s}px IBM Plex Mono, monospace`; ctx.textAlign = S.multi ? 'center' : 'right'; ctx.fillText('PAUSED · space to go', S.multi ? W / 2 : W - 12 * s, W - 16 * s); }
    ctx.restore();
  }
  function tags() {
    const s = W / 700;
    for (const R of S.robots) {
      if (R.inPit && S.t - R.inPit > 0.8) continue;
      const p = R.body.getPosition(), [sx, sy] = toScreen(p.x, p.y - R.hl - 0.42);
      const chips = [];
      if (R.flipped) chips.push('UPSIDE DOWN'); if (R.battery.fire) chips.push('ON FIRE'); if (R.glitch > 0) chips.push('GLITCH');
      if (R.wmotor && R.wmotor.jam > 0) chips.push('JAMMED'); if (R.slots.some(q => q.motor.stuck > 0)) chips.push('MOTOR STUCK'); if (R.slots.some(q => q.motor.heat > 85 && q.motor.hp > 0)) chips.push('OVERHEAT');
      if (R.snagged) chips.push('STUCK!');
      if (R.fried) chips.push('BRAIN FRIED'); else if (R.chipExposed) chips.push('CHIP EXPOSED'); if (R.chipFreeze > 0) chips.push('REBOOTING'); if (R.crossed > 0) chips.push('WIRES CROSSED'); if (R.berserk > 0) chips.push('BERSERK'); if (R.misfire > 0) chips.push('MISFIRE'); if (R.jammed > 0) chips.push('JAMMED');
      if (R.stun > 0) chips.push('STUNNED'); if (R.malf > 0) chips.push('MALFUNCTION'); if (R.quantumT > 0) chips.push('QUANTUM'); if (R.boomArm > 0) chips.push('SELF-DESTRUCT'); if (R.oiled > 0) chips.push('OILED');
      if (R.nitro > 0) chips.push('NITRO'); if (R.over > 0) chips.push('OVERCHARGE'); if (R.shield > 0) chips.push('SHIELD');
      if (!R.alive) chips.length = 0;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${10 * s}px IBM Plex Mono, monospace`;
      chips.forEach((c, k) => { const w = ctx.measureText(c).width + 10 * s, y = sy - k * 15 * s; ctx.fillStyle = c === 'ON FIRE' ? '#B23A2B' : '#2B2118'; ctx.fillRect(sx - w / 2, y - 6.5 * s, w, 13 * s); ctx.fillStyle = c === 'ON FIRE' ? '#FFF' : HAZ; ctx.fillText(c, sx, y); });
      ctx.restore();
    }
  }
  function drawCalls() {
    const s = W / 700;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    calls.forEach((c, ci) => { c.slot = c.slot != null ? c.slot : calls.slice(0, ci).filter(o => o.t < 0.7).length; });
    for (const c of calls) {
      const k = c.t, pop = k < 0.12 ? k / 0.12 * 1.3 : k < 0.25 ? 1.3 - (k - 0.12) / 0.13 * 0.3 : 1, alpha = k > 0.9 ? Math.max(0, 1 - (k - 0.9) / 0.4) : 1;
      let [sx, sy] = c.center ? [W / 2, W * 0.36] : toScreen(c.x, c.y - 0.5); sy -= k * 40 * s + c.slot * 36 * s; sx = Math.max(90 * s, Math.min(W - 90 * s, sx)); sy = Math.max(60 * s, sy);
      const size = (c.big ? 40 : 26) * s * pop;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(c.rot); ctx.globalAlpha = alpha;
      ctx.font = `400 ${size}px "Saira Stencil One", Impact, sans-serif`;
      ctx.lineWidth = size * 0.18; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(c.text, 0, 0);
      ctx.fillStyle = c.big ? HAZ : '#FFF4D6'; ctx.fillText(c.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    calls = calls.filter(c => c.t < 1.3);
  }
  function toScreen(x, y) { return [W / 2 + ((x - cam.x) * cam.z) * K, W / 2 + ((y - cam.y) * cam.z) * K]; }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#3A3530'; ctx.fillRect(0, 0, W, W);
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(K * cam.z, 0, 0, K * cam.z, W / 2 - (cam.x + sx) * K * cam.z, W / 2 - (cam.y + sy) * K * cam.z);
    PX = 1 / (K * cam.z) * Math.max(1, dpr * 0.75);
    drawArena();
    drawCratesAndWarnings();
    for (const d of S.debris) drawDebris(d);
    // robot in the air is drawn last
    const order = S.robots.slice().sort((a, b) => (a.airborne > 0) - (b.airborne > 0) || (b.inPit ? 1 : 0) - (a.inPit ? 1 : 0));
    for (const R of S.robots) if (R.forks && !R.inPit) { const b = R.body, p = b.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); for (const q of R.forks) if (q.attached && q.body === b) { drawPart(q, fillFor(q, R, R.id), R, decorate(q, R, R.id)); ctx.strokeStyle = 'rgba(43,33,24,0.5)'; ctx.lineWidth = PX * 1.2; for (let k = 1; k < 4; k++) { const x = R.hl + k * 0.08, y = (q.verts[2][1]); ctx.beginPath(); ctx.moveTo(x, y - 0.02); ctx.lineTo(x, y + 0.02); ctx.stroke(); } } ctx.restore(); }
    for (const R of order) drawRobot(R, R.id);
    drawEwalls(); drawDrones();
    for (const sn of S.snags) { const t = performance.now() / 1000, k = sn.force ? Math.min(1, sn.force / 7000) : 0; ctx.strokeStyle = `rgba(255,${200 - k * 150},60,${0.6 + 0.4 * Math.sin(t * 20)})`; ctx.lineWidth = PX * (3 + k * 4); ctx.beginPath(); ctx.arc(sn.x, sn.y, 0.07 + k * 0.05, 0, 6.29); ctx.stroke(); }
    drawWalls();
    drawProjectiles();
    drawParticles();
    for (const c of S.smokes) { const k = Math.min(1, c.life / 1), g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); g.addColorStop(0, `rgba(175,170,160,${0.85 * k})`); g.addColorStop(0.7, `rgba(165,160,150,${0.6 * k})`); g.addColorStop(1, 'rgba(160,155,145,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.29); ctx.fill(); }
    tags();
    drawCalls();
    hud();
    if (flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,250,235,${flash * 2})`; ctx.fillRect(0, 0, W, W); }
  }

  // ---------- side panel ----------
  function hpCol(f) { return f > 0.6 ? 'var(--good)' : f > 0.3 ? 'var(--warn)' : 'var(--bad)'; }
  function partState(p, R) {
    if (p.kind === 'lid') return !p.attached ? ['flew off', 'bad'] : p.state === 'loose' ? ['loose', 'warn'] : ['ok', ''];
    if (p.kind === 'drone') return !p.attached ? ['shot down', 'bad'] : p.off ? ['offline', 'warn'] : p.hp / p.maxHp < 0.4 ? ['damaged', 'warn'] : ['ok', ''];
    if (p.key === 'chip' && p.hp > 0) return R.chipExposed ? (p.hp / p.maxHp < 0.5 ? ['sparking', 'bad'] : ['exposed', 'warn']) : ['covered', ''];
    if (p.kind === 'internal') {
      if (p.hp <= 0) return ['dead', 'bad'];
      if (p.key === 'battery' && p.fire) return ['on fire', 'bad'];
      if (p.stuck > 0) return ['stuck on', 'bad'];
      if (p.jam > 0) return ['jammed', 'warn'];
      if (p.heat > 85) return ['overheat', 'bad'];
      if (p.heat > 55) return ['hot', 'warn'];
      return p.hp / p.maxHp < 0.4 ? ['failing', 'warn'] : ['ok', ''];
    }
    if (!p.attached) return [p.kind === 'wheel' ? 'torn off' : 'ripped off', 'bad'];
    if (p.state === 'bent') return ['bent', 'warn'];
    return p.hp / p.maxHp < 0.4 ? ['damaged', 'warn'] : ['ok', ''];
  }
  function sidePanel(i) {
    const R = S.robots[i], list = $('pl' + i);
    if (!list) return;
    const extra = [R.lid].concat(R.drones.map(d => ({ label: d.H.label, hp: Math.max(0, d.hp), maxHp: d.maxHp, kind: 'drone', attached: d.alive, off: d.off > 0 })));
    const rows = R.parts.concat(extra, R.internals).map(p => {
      const f = Math.max(0, p.hp / p.maxHp), [s, c] = partState(p, R);
      return `<div class="prow"><span>${p.label}</span><span class="hpb"><i style="width:${(f * 100).toFixed(0)}%;background:${hpCol(f)}"></i></span><span class="st ${c}">${s}</span></div>`;
    });
    list.innerHTML = rows.join('');
    diagram(i);
  }
  function diagram(i) {
    const c = $('dg' + i); if (!c) return; const g = c.getContext('2d'), R = S.robots[i];
    const css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim() || INK, muted = css.getPropertyValue('--muted').trim();
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    const sc = 175; g.setTransform(0, -sc, sc, 0, c.width / 2, c.height / 2 + 6); // forward = up
    const col = f => f > 0.6 ? '#79B46A' : f > 0.3 ? '#E0B848' : '#E06A58';
    const all = R.parts.slice().sort((a, b) => (a.kind === 'chassis') - (b.kind === 'chassis'));
    for (const p of all) {
      const vs = p.home; g.beginPath(); vs.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath();
      g.lineWidth = 2 / sc;
      if (p.attached) { g.globalAlpha = p.kind === 'chassis' ? 0.55 : 0.9; g.fillStyle = col(Math.max(0, p.hp / p.maxHp)); g.fill(); g.globalAlpha = 1; g.setLineDash([]); g.strokeStyle = ink; g.stroke(); }
      else { g.setLineDash([5 / sc, 4 / sc]); g.strokeStyle = muted; g.stroke(); g.setLineDash([]); }
    }
    for (const q of R.internals) {
      const f = Math.max(0, q.hp / q.maxHp), r = q.key === 'turret' ? 0.08 : 0.05;
      g.beginPath(); g.arc(q.lp[0] + (q.key === 'arm' ? -0.15 : 0), q.lp[1], r, 0, 6.29); g.fillStyle = q.hp > 0 ? col(f) : '#3a3530'; g.fill(); g.lineWidth = 2 / sc; g.strokeStyle = ink; g.stroke();
      if (q.fire || q.heat > 55) { g.lineWidth = 4 / sc; g.strokeStyle = '#E04B3A'; g.stroke(); }
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '600 18px IBM Plex Mono, monospace'; g.fillStyle = muted; g.textAlign = 'left'; g.fillText('FRONT ↑', 10, 24);
    g.textAlign = 'right'; g.fillText(`${Math.round(R.body.getMass())} kg now`, c.width - 10, 24);
  }
  function fmtT(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; }
  function pushLog() {
    const ol = $('log'), box = $('logbox');
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 8;
    while (logN < S.log.length) {
      const e = S.log[logN++], li = document.createElement('li'); if (e.big) li.className = 'big';
      li.innerHTML = `<time>${fmtT(e.t)}</time><span class="dot" style="background:${e.side != null ? TC(e.side).col : 'var(--muted)'}"></span><span></span>`;
      li.lastChild.textContent = e.text; ol.appendChild(li);
    }
    if (atBottom) box.scrollTop = box.scrollHeight;
  }
  function showReport() {
    reported = true;
    const r = S.result, el = $('report');
    const card = R => {
      const by = Object.entries(R.stats.dealtBy).sort((a, b) => b[1] - a[1]), mx = by.length ? by[0][1] : 1;
      return `<div class="card"><div class="team" style="color:${TC(R.id).col}">${S.multi ? (S.mode === '2v2' ? 'Team ' + TC(R.id).name : '#' + (r.order.indexOf(R.id) + 1)) : TC(R.id).name}${(S.multi ? r.winners.includes(R.id) : R.id === r.winner) ? ' · winner' : ''}</div><h3>${R.name}</h3>
        <div class="kv">${S.multi ? `<span>Knockouts</span><b>${R.stats.kos || 0}</b><span>Knocked out by</span><b>${R.alive ? 'still standing' : R.koBy ? R.koBy.name : 'the arena'}</b>` : ''}<span>Damage dealt</span><b>${Math.round(R.stats.dealt)}</b><span>Damage taken</span><b>${Math.round(R.stats.taken)}</b><span>Biggest hit</span><b>${Math.round(R.stats.biggest)} (${L.causeLabel(R.stats.biggestBy)})</b><span>Aggression</span><b>${(R.stats.aggr || 0).toFixed(0)} s</b><span>Weight left</span><b>${Math.round(R.body.getMass())} of ${Math.round(R.massStart)} kg</b><span>Result</span><b>${R.alive ? 'still running' : R.ko}</b></div>
        ${by.length ? `<div class="causes">${by.map(([k, v]) => `<div><span>${L.causeLabel(k)}</span><i style="width:${(v / mx * 100).toFixed(0)}%;background:${TC(R.id).col}"></i><b class="kg">${Math.round(v)}</b></div>`).join('')}</div>` : ''}
        <div class="small">Parts lost (${R.stats.lost.length})</div>
        ${R.stats.lost.length ? `<ol class="lost">${R.stats.lost.map(q => `<li>${fmtT(q.t)} ${q.label}: ${L.causeLabel(q.cause)}${q.by ? ' by ' + q.by : ''}</li>`).join('')}</ol>` : '<div class="small">Nothing. Clean.</div>'}</div>`;
    };
    el.innerHTML = `<div class="bar" style="justify-content:space-between"><h2>Damage report</h2><span class="small">Seed ${S.seed} · ${L.ARENAS[S.arenaKey].label} · ${fmtT(r.t)}</span></div><div class="rep-head">${escapeHtml(r.text)}</div><div class="rep-grid">${(S.multi ? r.order.map(k => S.robots[k]) : S.robots).map(card).join('')}</div>
      <div class="bar"><button type="button" id="rpAgain">Replay this fight</button><button type="button" id="rpNew">Next fight (new seed)</button></div>`;
    $('reportCard').hidden = false;
    $('rpAgain').onclick = () => start(); $('rpNew').onclick = newSeed;
  }
  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- control ----------
  function start() {
    const n = nBots(), specs = [], seen = {};
    for (let i = 0; i < n; i++) { const sp = Object.assign(fullSpec(i), { name: nameOf(i) }); seen[sp.name] = (seen[sp.name] || 0) + 1; if (seen[sp.name] > 1) sp.name += ' ' + ['', 'II', 'III', 'IV'][seen[sp.name] - 1]; if (st.mode === '2v2') sp.team = i % 2; specs.push(sp); }
    S = n > 2 ? L.create({ mode: st.mode, robots: specs, seed: st.seed, arena: st.arena, countdown: 2.99 }) : L.create({ a: specs[0], b: specs[1], seed: st.seed, arena: st.arena, countdown: 2.99 });
    reported = false; logN = 0; parts = []; calls = []; hitStop = 0; flash = 0; decalReset(); $('log').innerHTML = ''; $('reportCard').hidden = true;
    cam.x = cam.y = cam.tx = cam.ty = 0; cam.z = cam.tz = 1; slowT = 0; shake = 0;
    for (let i = 0; i < 4; i++) { const el = $('bot' + i); if (el) el.hidden = i >= n; }
    for (let i = 0; i < n; i++) sidePanel(i);
  }
  function setMode(m) {
    st.mode = m; document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === m)));
    S = null; for (let i = 0; i < nBots(); i++) buildCard(i); start();
  }
  document.querySelectorAll('[data-mode]').forEach(bn => bn.onclick = () => setMode(bn.dataset.mode));
  function restart() { start(); }
  function newSeed() { st.seed = 1 + Math.floor(Math.random() * 99999); $('seed').value = st.seed; start(); }
  $('fight').onclick = () => { st.paused = false; $('pause').setAttribute('aria-pressed', 'false'); $('pause').textContent = 'Pause'; start(); };
  $('replay').onclick = () => start();
  $('newseed').onclick = newSeed;
  $('seed').onchange = e => { st.seed = Math.max(1, parseInt(e.target.value, 10) || 1); start(); };
  const togglePause = () => { st.paused = !st.paused; $('pause').setAttribute('aria-pressed', String(st.paused)); $('pause').textContent = st.paused ? 'Go on' : 'Pause'; };
  $('pause').onclick = togglePause;
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|SELECT|BUTTON|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); togglePause(); } });
  document.querySelectorAll('[data-speed]').forEach(bn => bn.onclick = () => { st.speed = +bn.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === bn))); });
  $('drama').onchange = e => { st.drama = e.target.checked; };
  $('arenaSel').innerHTML = Object.entries(L.ARENAS).map(([k, v]) => `<option value="${k}"${k === st.arena ? ' selected' : ''}>${v.label}</option>`).join('');
  $('arenaSel').onchange = e => { st.arena = e.target.value; start(); };

  let last = performance.now(), acc = 0, frameN = 0;
  function frame(now) {
    const rdt = Math.min(0.05, (now - last) / 1000); last = now; frameN++;
    resize();
    let ts = 0;
    if (S && !st.paused) {
      ts = st.speed * (slowT > 0 ? 0.25 : 1);
      if (slowT > 0) slowT -= rdt; else { cam.tx = 0; cam.ty = 0; cam.tz = 1; }
      if (hitStop > 0) { hitStop -= rdt; ts = 0; }
      acc += rdt * ts; let n = 0;
      while (acc >= L.DT && n < 16) { L.step(S); consumeFx(); acc -= L.DT; n++; }
      if (n >= 16) acc = 0;
      emitters(rdt * ts);
      if (S.over && !reported && S.t > S.result.t + 1.2) showReport();
    }
    stepParticles(rdt * (ts || (hitStop > 0 ? 0 : 0)));
    for (const c of calls) c.t += rdt; flash = Math.max(0, flash - rdt);
    if (S) for (const R of S.robots) { if (R.dashFx > 0) R.dashFx -= rdt; if (R.shieldFlash > 0) R.shieldFlash -= rdt; if (R.grappleFx > 0) R.grappleFx -= rdt; if (R.zap > 0) R.zap -= rdt; }
    const kk = 1 - Math.exp(-rdt * 6); cam.x += (cam.tx - cam.x) * kk; cam.y += (cam.ty - cam.y) * kk; cam.z += (cam.tz - cam.z) * kk;
    for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz']) if (!Number.isFinite(cam[k])) cam[k] = k.endsWith('z') ? 1 : 0; // never lose the arena to a bad number
    if (!Number.isFinite(shake)) shake = 0;
    shake *= Math.exp(-rdt * 8);
    if (S) {
      for (const R of S.robots) R.drumSpin = (R.drumSpin || 0) + (R.drumE || 0) * rdt * ts * 3;
      draw(); pushLog();
      if (frameN % 8 === 0) for (let i = 0; i < S.robots.length; i++) sidePanel(i);
    }
    requestAnimationFrame(frame);
  }
  // market matchup table: click a cell to load that fight
  function marketTable() {
    const T = L.MARKET_TABLE, el = $('market'); if (!el) return;
    const n = T.names, w = T.wins;
    const avg = w.map(r => Math.round(r.filter(x => x != null).reduce((a, b) => a + b, 0) / (r.length - 1)));
    const cell = (v, i, j) => v == null ? '<td class="self">–</td>' : `<td><button type="button" class="mcell" data-i="${i}" data-j="${j}" style="--k:${(v - 50) / 50}" aria-label="${n[i]} versus ${n[j]}: ${n[i]} wins ${v}%">${v}</button></td>`;
    const notes = n.map((name, i) => { const r = w[i].map((v, j) => [v, j]).filter(x => x[0] != null).sort((a, b) => b[0] - a[0]); const b = L.PRESETS[name]; return `<li><b>${name}</b> <span class="small">${L.WEAPONS[b.weapon].label.toLowerCase()} · ${L.CHASSIS[b.chassis].label.toLowerCase()} · ${L.DRIVES[b.drive || '2wd'].label.replace(/ \(.*/, '').toLowerCase()} · ${(L.PROCS[b.proc || 'standard']).label.toLowerCase()} · ${L.MODULES[b.mod || 'none'].label.toLowerCase()} · ${L.weightOf(b)} kg</span><br>Beats ${n[r[0][1]]} (${r[0][0]}%), struggles vs ${n[r[r.length - 1][1]]} (${r[r.length - 1][0]}%)</li>`; }).join('');
    el.innerHTML = `<div class="tblwrap"><table class="mtab"><thead><tr><th scope="col"><span class="small">row beats column</span></th>${n.map(x => `<th scope="col">${x}</th>`).join('')}<th scope="col">avg</th></tr></thead><tbody>${n.map((x, i) => `<tr><th scope="row">${x}</th>${w[i].map((v, j) => cell(v, i, j)).join('')}<td class="avg">${avg[i]}</td></tr>`).join('')}</tbody></table></div><ul class="mnotes">${notes}</ul>`;
    el.querySelectorAll('.mcell').forEach(bn => bn.onclick = () => { if (st.mode !== '1v1') { st.mode = '1v1'; document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === '1v1'))); S = null; } st.spec[0] = { preset: n[+bn.dataset.i] }; st.spec[1] = { preset: n[+bn.dataset.j] }; buildCard(0); buildCard(1); start(); $('arena').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }
  marketTable();
  if (LU && $('qs')) {
    const out = $('qsOut'); let busy = false;
    const quick = async () => {
      if (busy) return; busy = true; const N = +$('qsN').value || 20, a = fullSpec(0), b = fullSpec(1), na = nameOf(0), nb = nameOf(1) === na ? nameOf(1) + ' II' : nameOf(1);
      let wa = 0, ko = 0; const T = [];
      for (let k = 0; k < N; k++) {
        const swap = k % 2 === 1, seed = 4000 + st.seed * 97 + k;
        const S2 = L.run(swap ? { a: Object.assign({}, b, { name: nb }), b: Object.assign({}, a, { name: na }), seed, arena: st.arena } : { a: Object.assign({}, a, { name: na }), b: Object.assign({}, b, { name: nb }), seed, arena: st.arena }, 200);
        if ((S2.result.winner === 0) !== swap) wa++; if (S2.result.how === 'KO') ko++; T.push(S2.t);
        out.textContent = `Running ${k + 1} of ${N}…`; await new Promise(r => setTimeout(r, 0));
      }
      T.sort((x, y) => x - y);
      out.innerHTML = `<b style="color:${TC(0).col}">${na}</b> wins <b>${wa} of ${N}</b> (${Math.round(100 * wa / N)}%) against <b style="color:${TC(1).col}">${nb}</b> · median fight ${Math.round(T[T.length >> 1])} s · ${Math.round(100 * ko / N)}% knockouts · ${L.ARENAS[st.arena].label}`;
      busy = false;
    };
    $('qsRun').onclick = quick;
    const pick = gap => {
      const names = Object.keys(LU.ROBOTS), lo = Math.floor(Math.random() * (LU.LEVELS.length - gap));
      const of = t => names.filter(k => LU.ROBOTS[k][0] === t), A = of(lo), B = of(lo + gap).filter(k => gap || k !== '');
      let a = A[Math.floor(Math.random() * A.length)], b = B[Math.floor(Math.random() * B.length)]; if (!gap) while (b === a) b = B[Math.floor(Math.random() * B.length)];
      st.mode = '1v1'; document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === '1v1'))); S = null;
      st.spec[0] = { robot: a, parts: [] }; st.spec[1] = { robot: b, parts: [] }; buildCard(0); buildCard(1); start(); out.textContent = `${a} (level ${lo}) vs ${b} (level ${lo + gap}). Watch it, or test ${$('qsN').value} fights.`;
    };
    $('qsSame').onclick = () => pick(0); $('qsOne').onclick = () => pick(1); $('qsTwo').onclick = () => pick(2);
    $('qsClear').onclick = () => { for (let i = 0; i < 4; i++) st.spec[i] = { robot: st.spec[i].robot, parts: [] }; for (let i = 0; i < 4; i++) buildCard(i); start(); };
  }
  // what each helper drone is worth: click a cell to watch that robot with that drone
  (function droneTable() {
    const el = $('market'); if (!el || !L.DRONE_VALUE) return;
    const T = L.DRONE_VALUE.drones, n = L.MARKET_TABLE.names, keys = Object.keys(T).sort((a, b) => T[b].avg - T[a].avg);
    const box = document.createElement('div');
    box.innerHTML = `<h3 class="dvh">Helper drones (upgrades, not in the market deck)</h3><p class="small">Win points a drone adds when you bolt it onto a market robot (that robot + 1 drone vs the other six, ${L.DRONE_VALUE.fights} fights each). Click a number to watch it.</p>
      <div class="tblwrap"><table class="mtab"><thead><tr><th scope="col">drone</th>${n.map(x => `<th scope="col">${x}</th>`).join('')}<th scope="col">avg</th></tr></thead><tbody>${keys.map(k => `<tr><th scope="row" title="${L.HELPERS[k].d}">${L.HELPERS[k].label}</th>${n.map((x, j) => { const v = T[k].per[x]; return `<td><button type="button" class="mcell dcell" data-r="${x}" data-k="${k}" style="--k:${Math.max(-1, Math.min(1, v / 30))}" aria-label="${x} with ${L.HELPERS[k].label}: ${v >= 0 ? '+' : ''}${v} win points">${v >= 0 ? '+' : ''}${v}</button></td>`; }).join('')}<td class="avg">+${T[k].avg}</td></tr>`).join('')}</tbody></table></div>`;
    el.appendChild(box);
    box.querySelectorAll('.dcell').forEach(bn => bn.onclick = () => { if (st.mode !== '1v1') { st.mode = '1v1'; document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === '1v1'))); S = null; } const r = bn.dataset.r, others = n.filter(x => x !== r); st.spec[0] = { preset: r, helpers: [bn.dataset.k] }; st.spec[1] = { preset: others[Math.floor(Math.random() * others.length)] }; buildCard(0); buildCard(1); start(); $('arena').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  })();
  buildCard(0); buildCard(1); buildCard(2); buildCard(3); paintFloor(); resize(); start();
  requestAnimationFrame(frame);
  // after the fight the sim keeps running so debris settles; we keep stepping until 4 s after the end
  const _step = L.step; L.step = function (S2) { if (S2.over && S2.t > S2.result.t + 4) return; _step(S2); };
})();
