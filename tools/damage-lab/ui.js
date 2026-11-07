// Damage Lab UI + renderer. Visual randomness (sparks, smoke) uses Math.random: it never feeds back into the sim.
(function () {
  'use strict';
  const L = window.DamageLab;
  const TEAM = [{ name: 'Steel', col: '#3F78A8', dark: '#2C5679', light: '#79A4CB' }, { name: 'Rust', col: '#C8642B', dark: '#8E431B', light: '#E59866' }];
  const INK = '#2B2118', STEEL = '#9A9C94', STEEL_D = '#6F7169', RUBBER = '#2A2622', HAZ = '#E8C547';
  const INT_COL = { battery: '#E8C547', radio: '#4C9A5A', motor: '#B87333', wmotor: '#8B6BB1', turret: '#8C8F86', arm: '#8C8F86' };
  const $ = id => document.getElementById(id);
  const st = { spec: [{ preset: 'Haymaker' }, { preset: 'Buzzkill' }], seed: 7, arena: 'pit', speed: 1, drama: true, paused: false };
  let S = null, reported = false, logN = 0;

  // ---------- builder ----------
  const OPTS = {
    weapon: Object.entries(L.WEAPONS).map(([k, v]) => [k, v.label]),
    chassis: Object.entries(L.CHASSIS).map(([k, v]) => [k, v.label]),
    drive: Object.entries(L.DRIVES).map(([k, v]) => [k, v.label]),
    motor: Object.entries(L.MOTORS).map(([k, v]) => [k, v.label]),
    battery: Object.entries(L.BATTERIES).map(([k, v]) => [k, v.label]),
    bumper: Object.entries(L.BUMPERS).map(([k, v]) => [k, v.label]),
  };
  const LBL = { weapon: 'Weapon', chassis: 'Frame', drive: 'Drive', motor: 'Motors', battery: 'Battery', bumper: 'Bumpers' };
  const opt = (list, v) => list.map(([k, l]) => `<option value="${k}"${k === v ? ' selected' : ''}>${l}</option>`).join('');
  function fullSpec(i) { const s = st.spec[i]; const base = L.PRESETS[s.preset] || {}; return L.normSpec(Object.assign({}, base, s, { armour: Object.assign({}, base.armour, s.armour) })); }
  function nameOf(i) { const s = st.spec[i]; return s.custom ? (s.cname || 'Custom ' + L.WEAPONS[fullSpec(i).weapon].label.toLowerCase()) : s.preset; }
  function buildCard(i) {
    const el = $('bot' + i), sp = fullSpec(i), s = st.spec[i];
    const pl = keys => keys.map(k => [k, `${k} (${L.WEAPONS[L.PRESETS[k].weapon].label.toLowerCase()})`]);
    const all = Object.keys(L.PRESETS), cur = s.custom ? '' : s.preset;
    const presetOpts = `<optgroup label="Market robots (balanced)">${opt(pl(all.filter(k => L.PRESETS[k].market)), cur)}</optgroup><optgroup label="Test builds (not balanced)">${opt(pl(all.filter(k => !L.PRESETS[k].market)), cur)}</optgroup>`;
    const frontTool = L.frontTool(sp.weapon);
    el.innerHTML = `
      <div class="bot-head"><div><div class="team">${TEAM[i].name}</div><h2 id="nm${i}">${nameOf(i)}</h2></div><span class="kg" id="kg${i}"></span></div>
      <div class="grid2" style="grid-template-columns:1fr"><label for="pre${i}">Preset<select id="pre${i}">${s.custom ? '<option value="" selected>Custom build</option>' : ''}${presetOpts}</select></label></div>
      <div class="grid2">${['weapon', 'chassis', 'drive', 'motor', 'battery', 'bumper'].map(f => `<label for="${f}${i}">${LBL[f]}<select id="${f}${i}" data-f="${f}">${opt(OPTS[f], sp[f])}</select></label>`).join('')}</div>
      <p class="wdesc">${L.WEAPONS[sp.weapon].d} <span class="small">${L.BUMPERS[sp.bumper || 'steel'].label}: ${L.BUMPERS[sp.bumper || 'steel'].d}</span></p>
      <div class="arm">${['front', 'side', 'rear', 'top'].map(a => `<label for="ar${a}${i}">${a} armour<select id="ar${a}${i}" data-a="${a}"${a === 'front' && frontTool ? ' disabled title="The front tool is the front armour"' : ''}>${[0, 1, 2, 3].map(n => `<option value="${n}"${n === sp.armour[a] ? ' selected' : ''}>${a === 'front' && frontTool ? 'tool' : n === 0 ? 'none' : n}</option>`).join('')}</select></label>`).join('')}</div>
      <canvas class="diag" id="dg${i}" width="480" height="300" aria-label="Part health diagram"></canvas>
      <details id="pd${i}" open><summary>Parts</summary><div class="parts" id="pl${i}"></div></details>`;
    $('pre' + i).onchange = e => { if (!e.target.value) return; st.spec[i] = { preset: e.target.value }; buildCard(i); restart(); };
    el.querySelectorAll('[data-f]').forEach(sel => sel.onchange = () => { const cur = fullSpec(i); st.spec[i] = Object.assign({}, cur, { [sel.dataset.f]: sel.value, custom: true, preset: s.preset }); buildCard(i); restart(); });
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
    if (part.kind === 'chassis') return R.flipped ? '#4A4540' : R.alive ? TEAM[i].col : TEAM[i].dark;
    if (part.kind === 'wheel') return RUBBER;
    if (part.kind === 'armour') return { rubber: '#34302C', spring: '#D4AF37', spiked: '#8E9088', fibre: 'rgba(79,163,160,0.85)' }[part.bumper] || STEEL;
    if (part.key === 'spear') return '#C9CBC4';
    if (part.key === 'glove') return '#6F7369';
    if (part.key === 'blade') return '#B9BBB4';
    if (part.key === 'flipper') return '#D9B43A';
    if (part.key === 'wedge') return '#7D8078';
    if (part.key === 'drum') return '#8C8F86';
    if (part.key === 'jaws') return '#6F7369';
    return STEEL_D;
  }
  function decorate(part, R, i) {
    return () => {
      if (part.kind === 'wheel') wheelTread(part, part.slot ? part.slot.spin : part.spin || 0);
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
        if (!R.flipped) { ctx.strokeStyle = TEAM[i].dark; ctx.lineWidth = PX * 1.6; ctx.strokeRect(x0 + 0.06, y0 + 0.06, x1 - x0 - 0.12, y1 - y0 - 0.12); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0, x1 - x0, 0.05); }
        else { ctx.fillStyle = TEAM[i].dark; ctx.fillRect(x0 + 0.05, -0.04, x1 - x0 - 0.1, 0.08); }
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

  function drawRobot(R, i) {
    const b = R.body, p = b.getPosition(), a = b.getAngle();
    const air = R.airborne > 0 ? Math.sin(Math.PI * Math.min(1, 1 - R.airborne / Math.max(R.airMax, 0.01))) : 0;
    let sc = 1 + air * 0.28, alpha = 1;
    if (R.inPit) { const k = Math.min(1, (S.t - R.inPit) / 0.8); sc = 1 - k * 0.65; alpha = 1 - k * 0.7; }
    const so = 0.05 + air * 0.35;
    R.trailPts = R.trailPts || []; if (frameN % 2 === 0) { R.trailPts.push([p.x, p.y, a]); if (R.trailPts.length > 7) R.trailPts.shift(); }
    const vel = b.getLinearVelocity(), fast = Math.hypot(vel.x, vel.y) > 3.5 || R.airborne > 0;
    if (fast && !R.inPit) { R.trailPts.forEach((q, k) => { ctx.save(); ctx.globalAlpha = 0.06 + k * 0.03; ctx.translate(q[0], q[1]); ctx.rotate(q[2]); ctx.fillStyle = TEAM[i].light; ctx.fillRect(-R.hl, -R.hw, R.hl * 2, R.hw * 2); ctx.restore(); }); }
    const mine = R.parts.filter(q => q.attached && q.body === b);
    // shadow
    ctx.save(); ctx.translate(p.x + so, p.y + so); ctx.rotate(a); ctx.scale(sc, sc); ctx.fillStyle = `rgba(20,14,8,${0.28 - air * 0.12})`;
    for (const q of mine) { path(q.verts); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(a); ctx.scale(sc, sc);
    // struts holding the side plates
    ctx.fillStyle = '#4A4540';
    for (const q of mine) if (q.kind === 'armour' && /Left|Right/.test(q.label)) { const sd = q.label.startsWith('Left') ? -1 : 1, [, y0, , y1] = bbox(q.home), yin = sd < 0 ? y1 : y0; for (const xx of [-R.hl * 0.78, R.hl * 0.78]) { const ya = sd * R.hw, yb = yin; ctx.fillRect(xx - 0.025, Math.min(ya, yb), 0.05, Math.abs(yb - ya)); } }
    const order = ['wheel', 'armour', 'weapon', 'chassis'];
    for (const kind of order) for (const q of mine) if (q.kind === kind) drawPart(q, fillFor(q, R, i), R, decorate(q, R, i));
    for (const q of mine) if (q.kind === 'armour' && q.bumper === 'spiked') spikesOn(q);
    if (R.spec.weapon === 'glove' && R.tool && R.tool.attached) drawGlove(R);
    if (!R.flipped) {
      const C = R.chassis, [x0, y0, x1, y1] = bbox(C.home);
      for (const [bx, by] of [[x0 + 0.035, y0 + 0.035], [x1 - 0.035, y0 + 0.035], [x0 + 0.035, y1 - 0.035], [x1 - 0.035, y1 - 0.035]]) bolt(bx, by);
      drawTop(R, i);
    } else { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `600 ${0.1}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.fillText('UNDERSIDE', 0, 0.035); }
    ctx.restore();
    if (R.blade && R.blade.attached && !R.inPit) drawBlade(R.blade, R);
    if (R.flailArm && !R.inPit) { drawFlail(R); if (R.ball && R.ball.attached) drawBall(R.ball); }
    // power-up and rage effects
    if (!R.inPit) {
      const t = performance.now() / 1000;
      if (R.shield > 0) { ctx.strokeStyle = `rgba(71,168,255,${0.5 + (R.shieldFlash > 0 ? 0.5 : 0.2 * Math.sin(t * 8))})`; ctx.fillStyle = 'rgba(71,168,255,0.12)'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.32, 0, 6.29); ctx.fill(); ctx.stroke(); }
      if (R.rage > 0) { ctx.strokeStyle = `rgba(255,60,30,${0.45 + 0.3 * Math.sin(t * 14)})`; ctx.lineWidth = PX * 5; ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.22 + 0.03 * Math.sin(t * 20), 0, 6.29); ctx.stroke(); if (Math.random() < 0.5) fire(p.x + (Math.random() - 0.5) * 0.6, p.y + (Math.random() - 0.5) * 0.6); }
      if (R.over > 0) { ctx.strokeStyle = `rgba(178,102,255,${0.6 + 0.3 * Math.sin(t * 18)})`; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 6, PX * 5]); ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.12, t * 3, t * 3 + 6.29); ctx.stroke(); ctx.setLineDash([]); }
      if ((R.nitro > 0 || R.dashFx > 0) && Math.random() < 0.9) { const back = b.getWorldPoint(planck.Vec2(-R.hl - 0.05, (Math.random() - 0.5) * 0.3)), f = b.getWorldVector(planck.Vec2(-1, 0)); spawn({ t: 'fire', x: back.x, y: back.y, vx: f.x * 3 + (Math.random() - 0.5), vy: f.y * 3 + (Math.random() - 0.5), life: 0.25, max: 0.25, s: 0.06, grow: true }); }
    }
  }
  function spikesOn(q) {
    const [x0, y0, x1, y1] = bbox(q.home), lx = x1 - x0 > y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const out = lx ? (cy < 0 ? -1 : 1) : (cx < 0 ? -1 : 1);
    ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2;
    for (let t = 0.08; t < 0.95; t += 0.14) { ctx.beginPath(); if (lx) { const x = x0 + (x1 - x0) * t, y = out < 0 ? y0 : y1; ctx.moveTo(x - 0.025, y); ctx.lineTo(x, y + out * 0.06); ctx.lineTo(x + 0.025, y); } else { const y = y0 + (y1 - y0) * t, x = out < 0 ? x0 : x1; ctx.moveTo(x, y - 0.025); ctx.lineTo(x + out * 0.06, y); ctx.lineTo(x, y + 0.025); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  function drawGlove(R) {
    const hl = R.hl, k = R.punch > 0 ? Math.sin(Math.PI * (1 - R.punch / 0.22)) : 0, ext = 0.06 + k * 0.38, gx = hl + 0.12 + ext;
    ctx.strokeStyle = '#4A4540'; ctx.lineWidth = PX * 3; ctx.beginPath();
    for (let j = 0; j < 4; j++) { const xa = hl + 0.1 + ext * j / 4, xb = hl + 0.1 + ext * (j + 1) / 4; ctx.moveTo(xa, -0.06); ctx.lineTo(xb, 0.06); ctx.moveTo(xa, 0.06); ctx.lineTo(xb, -0.06); }
    ctx.stroke();
    ctx.save(); ctx.translate(gx, 0); const sc = 1 + k * 0.25; ctx.scale(sc, sc);
    ctx.fillStyle = '#D33A2C'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4 / sc;
    ctx.beginPath(); ctx.ellipse(0.05, 0, 0.1, 0.13, 0, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.02, -0.12, 0.05, 0.035, 0.5, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(0.08, -0.04, 0.03, 0.05, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#F2EEE6'; ctx.fillRect(-0.06, -0.1, 0.04, 0.2); ctx.strokeRect(-0.06, -0.1, 0.04, 0.2);
    ctx.restore();
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
    const b = part.body, p = b.getPosition(), a = b.getAngle();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4;
    for (let k = 0; k < 8; k++) { const t = k / 8 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(t - 0.25) * 0.1, Math.sin(t - 0.25) * 0.1); ctx.lineTo(Math.cos(t) * 0.17, Math.sin(t) * 0.17); ctx.lineTo(Math.cos(t + 0.25) * 0.1, Math.sin(t + 0.25) * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
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
    if (d.key === 'ball') { drawBall(d); return; }
    ctx.save(); ctx.translate(p.x + 0.03, p.y + 0.03); ctx.rotate(a); ctx.fillStyle = 'rgba(20,14,8,0.25)'; path(d.verts); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    const fill = d.kind === 'wheel' ? RUBBER : d.kind === 'armour' ? '#8A8C84' : d.key === 'chassis' ? '#5B554D' : d.key === 'flipper' ? '#B89A35' : '#77796F';
    drawPart(d, fill, d.robot, d.kind === 'wheel' ? () => wheelTread(d, d.spin || 0) : null);
    ctx.restore();
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
    for (const p of S.projs) { ctx.strokeStyle = p.cause === 'heavy' ? '#FF9A3C' : '#FFE58A'; ctx.lineWidth = p.r * 1.6; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.012, p.y - p.vy * 0.012); ctx.lineTo(p.x, p.y); ctx.stroke(); }
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
      const i = R.id, x = i ? W - 12 * s - 200 * s : 12 * s, f = integrity(R);
      ctx.fillStyle = 'rgba(43,33,24,0.85)'; ctx.fillRect(x, 8 * s, 200 * s, 30 * s);
      ctx.fillStyle = TEAM[i].light; ctx.font = `400 ${15 * s}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = i ? 'right' : 'left'; ctx.fillText(R.name, i ? x + 192 * s : x + 8 * s, 18 * s);
      ctx.fillStyle = '#4A443D'; ctx.fillRect(x + 8 * s, 28 * s, 184 * s, 5 * s);
      ctx.fillStyle = f > 0.5 ? '#79B46A' : f > 0.25 ? '#E0B848' : '#E06A58'; const bw = 184 * s * f; ctx.fillRect(i ? x + 192 * s - bw : x + 8 * s, 28 * s, bw, 5 * s);
      ctx.font = `600 ${10 * s}px IBM Plex Mono, monospace`; ctx.fillStyle = '#CFC6B7'; ctx.textAlign = i ? 'left' : 'right'; ctx.fillText(`${R.stats.lost.length} parts lost`, i ? x + 8 * s : x + 192 * s, 18 * s);
      // hype meter: full = rage
      const hy = R.rage > 0 ? 1 : (R.hype || 0) / 100;
      ctx.fillStyle = 'rgba(43,33,24,0.85)'; ctx.fillRect(x, 40 * s, 200 * s, 10 * s);
      ctx.fillStyle = '#4A443D'; ctx.fillRect(i ? x + 48 * s : x + 8 * s, 43 * s, 144 * s, 4 * s);
      ctx.fillStyle = R.rage > 0 ? (Math.sin(performance.now() / 60) > 0 ? '#FF5A3C' : '#FFB03C') : '#E8C547'; const hw = 144 * s * hy; ctx.fillRect(i ? x + 192 * s - hw : x + 8 * s, 43 * s, hw, 4 * s);
      ctx.font = `600 ${8 * s}px IBM Plex Mono, monospace`; ctx.fillStyle = R.rage > 0 ? '#FF8A5C' : '#CFC6B7'; ctx.textAlign = i ? 'left' : 'right'; ctx.fillText(R.rage > 0 ? 'RAGE!' : 'HYPE', i ? x + 8 * s : x + 192 * s, 45.5 * s);
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
      ctx.fillText(S.result.how === 'KO' ? 'KNOCKOUT' : 'TIME', W / 2, by - 16 * s);
      ctx.fillStyle = TEAM[R.id].light; ctx.font = `600 ${15 * s}px IBM Plex Sans, sans-serif`; ctx.fillText(`${R.name} wins`, W / 2, by + 22 * s);
    }
    if (slowT > 0 && !S.over) { ctx.fillStyle = HAZ; ctx.font = `600 ${12 * s}px IBM Plex Mono, monospace`; ctx.textAlign = 'left'; ctx.fillText('SLOW-MO', 12 * s, W - 16 * s); }
    if (st.paused) { ctx.fillStyle = '#F6F2EA'; ctx.font = `600 ${13 * s}px IBM Plex Mono, monospace`; ctx.textAlign = 'right'; ctx.fillText('PAUSED · space to go', W - 12 * s, W - 16 * s); }
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
    for (const R of order) drawRobot(R, R.id);
    drawWalls();
    drawProjectiles();
    drawParticles();
    tags();
    drawCalls();
    hud();
    if (flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,250,235,${flash * 2})`; ctx.fillRect(0, 0, W, W); }
  }

  // ---------- side panel ----------
  function hpCol(f) { return f > 0.6 ? 'var(--good)' : f > 0.3 ? 'var(--warn)' : 'var(--bad)'; }
  function partState(p, R) {
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
    const rows = R.parts.concat(R.internals).map(p => {
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
      li.innerHTML = `<time>${fmtT(e.t)}</time><span class="dot" style="background:${e.side != null ? TEAM[e.side].col : 'var(--muted)'}"></span><span></span>`;
      li.lastChild.textContent = e.text; ol.appendChild(li);
    }
    if (atBottom) box.scrollTop = box.scrollHeight;
  }
  function showReport() {
    reported = true;
    const r = S.result, el = $('report');
    const card = R => {
      const by = Object.entries(R.stats.dealtBy).sort((a, b) => b[1] - a[1]), mx = by.length ? by[0][1] : 1;
      return `<div class="card"><div class="team" style="color:${TEAM[R.id].col}">${TEAM[R.id].name}${R.id === r.winner ? ' · winner' : ''}</div><h3>${R.name}</h3>
        <div class="kv"><span>Damage dealt</span><b>${Math.round(R.stats.dealt)}</b><span>Damage taken</span><b>${Math.round(R.stats.taken)}</b><span>Biggest hit</span><b>${Math.round(R.stats.biggest)} (${L.causeLabel(R.stats.biggestBy)})</b><span>Aggression</span><b>${(R.stats.aggr || 0).toFixed(0)} s</b><span>Weight left</span><b>${Math.round(R.body.getMass())} of ${Math.round(R.massStart)} kg</b><span>Result</span><b>${R.alive ? 'still running' : R.ko}</b></div>
        ${by.length ? `<div class="causes">${by.map(([k, v]) => `<div><span>${L.causeLabel(k)}</span><i style="width:${(v / mx * 100).toFixed(0)}%;background:${TEAM[R.id].col}"></i><b class="kg">${Math.round(v)}</b></div>`).join('')}</div>` : ''}
        <div class="small">Parts lost (${R.stats.lost.length})</div>
        ${R.stats.lost.length ? `<ol class="lost">${R.stats.lost.map(q => `<li>${fmtT(q.t)} ${q.label}: ${L.causeLabel(q.cause)}${q.by ? ' by ' + q.by : ''}</li>`).join('')}</ol>` : '<div class="small">Nothing. Clean.</div>'}</div>`;
    };
    el.innerHTML = `<div class="bar" style="justify-content:space-between"><h2>Damage report</h2><span class="small">Seed ${S.seed} · ${L.ARENAS[S.arenaKey].label} · ${fmtT(r.t)}</span></div><div class="rep-head">${escapeHtml(r.text)}</div><div class="rep-grid">${card(S.robots[0])}${card(S.robots[1])}</div>
      <div class="bar"><button type="button" id="rpAgain">Replay this fight</button><button type="button" id="rpNew">Next fight (new seed)</button></div>`;
    $('reportCard').hidden = false;
    $('rpAgain').onclick = () => start(); $('rpNew').onclick = newSeed;
  }
  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- control ----------
  function start() {
    const a = Object.assign(fullSpec(0), { name: nameOf(0) }), b = Object.assign(fullSpec(1), { name: nameOf(1) });
    if (a.name === b.name) b.name += ' II';
    S = L.create({ a, b, seed: st.seed, arena: st.arena, countdown: 2.99 });
    reported = false; logN = 0; parts = []; calls = []; hitStop = 0; flash = 0; decalReset(); $('log').innerHTML = ''; $('reportCard').hidden = true;
    cam.x = cam.y = cam.tx = cam.ty = 0; cam.z = cam.tz = 1; slowT = 0; shake = 0;
    sidePanel(0); sidePanel(1);
  }
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
    if (S) for (const R of S.robots) { if (R.dashFx > 0) R.dashFx -= rdt; if (R.shieldFlash > 0) R.shieldFlash -= rdt; }
    const kk = 1 - Math.exp(-rdt * 6); cam.x += (cam.tx - cam.x) * kk; cam.y += (cam.ty - cam.y) * kk; cam.z += (cam.tz - cam.z) * kk;
    shake *= Math.exp(-rdt * 8);
    if (S) {
      for (const R of S.robots) R.drumSpin = (R.drumSpin || 0) + (R.drumE || 0) * rdt * ts * 3;
      draw(); pushLog();
      if (frameN % 8 === 0) { sidePanel(0); sidePanel(1); }
    }
    requestAnimationFrame(frame);
  }
  // market matchup table: click a cell to load that fight
  function marketTable() {
    const T = L.MARKET_TABLE, el = $('market'); if (!el) return;
    const n = T.names, w = T.wins;
    const avg = w.map(r => Math.round(r.filter(x => x != null).reduce((a, b) => a + b, 0) / (r.length - 1)));
    const cell = (v, i, j) => v == null ? '<td class="self">–</td>' : `<td><button type="button" class="mcell" data-i="${i}" data-j="${j}" style="--k:${(v - 50) / 50}" aria-label="${n[i]} versus ${n[j]}: ${n[i]} wins ${v}%">${v}</button></td>`;
    const notes = n.map((name, i) => { const r = w[i].map((v, j) => [v, j]).filter(x => x[0] != null).sort((a, b) => b[0] - a[0]); const b = L.PRESETS[name]; return `<li><b>${name}</b> <span class="small">${L.WEAPONS[b.weapon].label.toLowerCase()} · ${L.CHASSIS[b.chassis].label.toLowerCase()} · ${L.weightOf(b)} kg</span><br>Beats ${n[r[0][1]]} (${r[0][0]}%), struggles vs ${n[r[r.length - 1][1]]} (${r[r.length - 1][0]}%)</li>`; }).join('');
    el.innerHTML = `<div class="tblwrap"><table class="mtab"><thead><tr><th scope="col"><span class="small">row beats column</span></th>${n.map(x => `<th scope="col">${x}</th>`).join('')}<th scope="col">avg</th></tr></thead><tbody>${n.map((x, i) => `<tr><th scope="row">${x}</th>${w[i].map((v, j) => cell(v, i, j)).join('')}<td class="avg">${avg[i]}</td></tr>`).join('')}</tbody></table></div><ul class="mnotes">${notes}</ul>`;
    el.querySelectorAll('.mcell').forEach(bn => bn.onclick = () => { st.spec[0] = { preset: n[+bn.dataset.i] }; st.spec[1] = { preset: n[+bn.dataset.j] }; buildCard(0); buildCard(1); start(); $('arena').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }
  marketTable();
  buildCard(0); buildCard(1); paintFloor(); resize(); start();
  requestAnimationFrame(frame);
  // after the fight the sim keeps running so debris settles; we keep stepping until 4 s after the end
  const _step = L.step; L.step = function (S2) { if (S2.over && S2.t > S2.result.t + 4) return; _step(S2); };
})();
