// ROBOCUS 2.0 fight view: the Damage Lab renderer (from tools/damage-lab/ui.js) without the builder, plus the
// full-screen damage panels for the tabletop game. Visual randomness (sparks, smoke) uses Math.random: it never
// feeds back into the sim. API: RobocusView.mount(rootEl) and .play(S, opts) (see the bottom of this file).
(function () {
  'use strict';
  const L = window.DamageLab;
  let S = null, frameN = 0;
  const V = { drama: true, paused: false, speed: 2 };   // Kev, 9 Nov: fights play at 2× by default
  const PAL = { steel: { name: 'Steel', col: '#3F78A8', dark: '#2C5679', light: '#79A4CB' }, rust: { name: 'Rust', col: '#C8642B', dark: '#8E431B', light: '#E59866' },
    moss: { name: 'Moss', col: '#4C8A3F', dark: '#35612C', light: '#8BC07A' }, violet: { name: 'Violet', col: '#8B6BB1', dark: '#5E4580', light: '#B79AD8' },
    teal: { name: 'Steel', col: '#2E8F9E', dark: '#1F6470', light: '#6CC0CC' }, red: { name: 'Rust', col: '#B8423A', dark: '#80281F', light: '#E07C72' } };
  const curMode = () => S && S.multi ? S.mode : '1v1';
  // a robot can bring its team's colours (spec.pal); otherwise the lab colours
  const TC = i => (S && S.robots[i] && S.robots[i].spec.pal) || (curMode() === '2v2' ? [PAL.steel, PAL.rust, PAL.teal, PAL.red] : [PAL.steel, PAL.rust, PAL.moss, PAL.violet])[i] || PAL.steel;
  const INK = '#2B2118', STEEL = '#9A9C94', STEEL_D = '#6F7169', RUBBER = '#2A2622', HAZ = '#E8C547';
  const INT_COL = { battery: '#E8C547', radio: '#4C9A5A', motor: '#B87333', wmotor: '#8B6BB1', turret: '#8C8F86', arm: '#8C8F86', module: '#47A8FF', thruster: '#FF8A2A' };
  const MOD_ICON = { shield: ['S', '#47A8FF'], emp: ['E', '#7FD4FF'], grapple: ['G', '#C9A227'], jets: ['J', '#FF8A2A'], oil: ['O', '#3B3530'], mines: ['M', '#D24B3A'], repair: ['+', '#4CC26A'], boom: ['!', '#E0402B'], quantum: ['Q', '#F2C94C'], smoke: ['~', '#9A958C'], popper: ['P', '#D9B43A'] };
  // ---------- canvas ----------
  let cv = null, ctx = null;
  const VIEW = 8.8; // metres shown edge to edge
  let W = 600, dpr = 1, K = 50;
  const floorC = document.createElement('canvas'), decal = document.createElement('canvas');
  const FPX = 120; floorC.width = floorC.height = decal.width = decal.height = VIEW * FPX;
  const dctx = decal.getContext('2d');
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(200, Math.round(Math.min(cv.clientWidth, cv.clientHeight || cv.clientWidth) * dpr));
    if (cv.width !== w) { cv.width = w; cv.height = w; }
    W = w; K = W / VIEW;
  }
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
        if (V.drama && e.power >= 13 && slowT <= 0) { slowT = 0.75; cam.tx = e.x * 0.6; cam.ty = e.y * 0.6; cam.tz = 1.45; }
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
      else if (e.type === 'ko') { shake = Math.min(0.2, shake + 0.08); if (V.drama) { slowT = 1.2; const R = S.robots[e.robot], p = R.body.getPosition(); cam.tx = p.x * 0.6; cam.ty = p.y * 0.6; cam.tz = 1.5; } }
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
    const n = R.spec.level || 0; if (!n) return;
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
  // the new mechanical weapons (separate bodies on joints)
  // ---------- ROBOCUS 2.0 level 4 robots: mechanisms, lamps, legs (ported from tools/damage-lab/ui.js; keep the two in step) ----------
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
    if (A.ice) {   // ice rink: a pale blue sheen with a few scratch marks (Kev, 9 Nov)
      const H = L.HALF; ctx.fillStyle = 'rgba(160,210,240,0.38)'; ctx.fillRect(-H, -H, 2 * H, 2 * H);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.02;
      for (let k = 0; k < 14; k++) { const a = ((k * 37) % 17) / 17 * 6.28, x = ((k * 53) % 13) / 13 * 6 - 3, y = ((k * 29) % 11) / 11 * 6 - 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 0.4, y + Math.sin(a) * 0.4 + 0.2, x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9); ctx.stroke(); }
    }
    if (A.inset) {   // The Cage: dark ground outside the walls, with hazard stripes along them
      const H = L.HALF, h = H - A.inset;
      ctx.fillStyle = '#1B1712'; ctx.beginPath(); ctx.rect(-H - 1, -H - 1, 2 * H + 2, 2 * H + 2); ctx.rect(-h, -h, 2 * h, 2 * h); ctx.fill('evenodd');
      ctx.strokeStyle = '#E8C547'; ctx.lineWidth = 0.06; ctx.setLineDash([0.18, 0.14]); ctx.strokeRect(-h - 0.03, -h - 0.03, 2 * h + 0.06, 2 * h + 0.06); ctx.setLineDash([]);
    }
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
    if (V.bars) for (const R of S.robots) { // name bars on the canvas (off when the side panels show them)
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
    if (V.paused) { ctx.fillStyle = '#F6F2EA'; ctx.font = `600 ${13 * s}px IBM Plex Mono, monospace`; ctx.textAlign = S.multi ? 'center' : 'right'; ctx.fillText('PAUSED · space to go', S.multi ? W / 2 : W - 12 * s, W - 16 * s); }
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
    drawAim();
    for (const c of S.smokes) { const k = Math.min(1, c.life / 1), g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); g.addColorStop(0, `rgba(175,170,160,${0.85 * k})`); g.addColorStop(0.7, `rgba(165,160,150,${0.6 * k})`); g.addColorStop(1, 'rgba(160,155,145,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.29); ctx.fill(); }
    tags();
    drawCalls();
    hud();
    if (flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,250,235,${flash * 2})`; ctx.fillRect(0, 0, W, W); }
  }

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

  // ---------- 2.0 damage panels ----------
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function chipsOf(R) {
    const c = [];
    if (!R.alive) return ['OUT: ' + (R.ko || 'knocked out')];
    if (R.flipped) c.push('UPSIDE DOWN'); if (R.battery.fire) c.push('ON FIRE'); if (R.glitch > 0) c.push('GLITCH');
    if (R.wmotor && R.wmotor.jam > 0) c.push('JAMMED'); if (R.slots.some(q => q.motor.heat > 85 && q.motor.hp > 0)) c.push('OVERHEAT'); if (R.snagged) c.push('STUCK');
    if (R.fried) c.push('BRAIN FRIED'); else if (R.chipExposed) c.push('CHIP EXPOSED'); if (R.chipFreeze > 0) c.push('REBOOTING'); if (R.crossed > 0) c.push('WIRES CROSSED'); if (R.berserk > 0) c.push('BERSERK');
    if (R.stun > 0) c.push('STUNNED'); if (R.quantumT > 0) c.push('PHASED'); if (R.oiled > 0) c.push('OILED'); if (R.rage > 0) c.push('RAGE'); if (R.nitro > 0) c.push('NITRO'); if (R.shield > 0) c.push('SHIELD');
    return c;
  }
  const PCOL = f => f > 0.6 ? '#79B46A' : f > 0.3 ? '#E0B848' : '#E06A58';
  // KO meters (Kev, 9 Nov): the health bar is an average, but fights end on one weak link. Show what ends a fight:
  // Drive (wheels + their motors: none left = counted out), Power (battery and radio: either destroyed = out), Chassis (torn apart = out),
  // and the count-outs as they tick: no drive for 6 s, or crippled and not moving for 12 s
  const hpf = p => p && p.attached !== false && p.hp > 0 ? Math.max(0, p.hp) / p.maxHp : 0;
  function koRisk(R) {
    const n = R.slots.length, live = R.slots.filter(q => hpf(q.wheel) > 0 && q.motor.hp > 0);
    const drive = n ? R.slots.reduce((a, q) => a + Math.min(hpf(q.wheel), q.motor.hp > 0 ? Math.max(0, q.motor.hp) / q.motor.maxHp : 0), 0) / n : 1;
    const pw = Math.min(hpf(R.battery), R.radio ? hpf(R.radio) : 1), ch = hpf(R.chassis);
    const crippled = R.spec.drive === 'legs' ? live.length < 3 : live.length < n;
    let still = 0;   // seconds the refs have seen it standing still while crippled (their count-out is 12 s)
    if (crippled && R.trail && R.trail.length) { const q = R.body.getPosition(); for (let i = R.trail.length - 1; i >= 0; i--) { const t = R.trail[i]; if (Math.hypot(t[0] - q.x, t[1] - q.y) < 0.45) still++; else break; } }
    return { meters: [['⚙ Drive', 'Drive', drive, live.length + '/' + n], ['🔋 Power', 'Power', pw, ''], ['⛨ Chassis', 'Chassis', ch, '']], noDrive: R.noDrive || 0, still: crippled ? Math.max(0, still - 1) : 0, flipped: R.flipped && !R.W.invert && !R.W.invertDrive };
  }
  function koHTML(R) {
    if (!R.alive || R.house) return '';
    const k = koRisk(R), low = Math.min(...k.meters.map(m => m[2]));
    let h = k.meters.map(m => `<span class="${m[2] === low && low < 0.5 ? 'weak' : ''}" title="${m[1]}: ${Math.round(m[2] * 100)}%${m[1] === 'Drive' ? ' · working wheels ' + m[3] + '. None left for 6 s = counted out' : m[1] === 'Power' ? ' (battery and radio). Either destroyed = out' : ' (frame). Torn apart = out'}"><em>${m[0]}</em><b><i style="width:${Math.round(m[2] * 100)}%;background:${PCOL(m[2])}"></i></b></span>`).join('');
    if (k.noDrive > 0.4) h += `<div class="fv-count">${k.flipped ? 'ON ITS BACK' : 'CAN\'T DRIVE'} · COUNT-OUT ${Math.max(0, Math.ceil(6 - k.noDrive))} s<b><i style="width:${Math.min(100, k.noDrive / 6 * 100).toFixed(0)}%"></i></b></div>`;
    else if (k.still >= 3) h += `<div class="fv-count">CRIPPLED, NOT MOVING · REFS COUNT ${Math.max(0, 12 - k.still)} s<b><i style="width:${Math.min(100, k.still / 12 * 100).toFixed(0)}%"></i></b></div>`;
    return h;
  }
  // the robot seen from above, front up: every part coloured by its health, lost parts dashed
  function drawDiagram(c, R, opts = {}) {
    const g = c.getContext('2d'), dp = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(c.clientWidth * dp), ch = Math.round(c.clientHeight * dp);
    if (!cw || !ch) return; if (c.width !== cw) c.width = cw; if (c.height !== ch) c.height = ch;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of R.parts) for (const [x, y] of p.home) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sc = Math.min(cw / (y1 - y0 + 0.2), ch / (x1 - x0 + 0.2)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    g.setTransform(0, -sc, sc, 0, cw / 2 - cy * sc, ch / 2 + cx * sc); // forward = up
    const lw = 1.6 * dp / sc, all = R.parts.slice().sort((a, b) => (a.kind === 'chassis' ? 0 : 1) - (b.kind === 'chassis' ? 0 : 1));
    const out = q => { g.beginPath(); q.home.forEach((v, k) => k ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.closePath(); };
    for (const p of all) {
      out(p); g.lineWidth = lw;
      if (p.attached) { g.fillStyle = p.kind === 'chassis' ? 'rgba(90,84,76,1)' : PCOL(Math.max(0, p.hp / p.maxHp)); g.globalAlpha = p.kind === 'chassis' ? 1 : 0.92; g.fill(); g.globalAlpha = 1; g.setLineDash([]); g.strokeStyle = '#15110D'; g.stroke(); }
      else { g.setLineDash([4 * dp / sc, 3 * dp / sc]); g.strokeStyle = '#E06A58'; g.stroke(); g.setLineDash([]); }
    }
    // chassis health as an inner tint, the lid as an outline
    { const f = Math.max(0, R.chassis.hp / R.chassis.maxHp); out(R.chassis); g.fillStyle = PCOL(f); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; }
    const lid = R.lid; g.beginPath(); lid.home.forEach((v, k) => k ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])); g.closePath(); g.lineWidth = lw;
    if (lid.attached) { g.setLineDash([]); g.strokeStyle = lid.state === 'loose' ? '#E0B848' : 'rgba(240,235,225,0.55)'; g.stroke(); } else { g.setLineDash([3 * dp / sc, 3 * dp / sc]); g.strokeStyle = '#E06A58'; g.stroke(); g.setLineDash([]); }
    for (const q of R.internals) {
      const f = Math.max(0, q.hp / q.maxHp), r = (q.key === 'turret' || q.key === 'arm' ? 0.07 : 0.045);
      g.beginPath(); g.arc(q.lp[0], q.lp[1], r, 0, 6.29); g.fillStyle = q.hp > 0 ? PCOL(f) : '#2a2520'; g.fill(); g.lineWidth = lw; g.strokeStyle = q.hp > 0 ? '#15110D' : '#E06A58'; g.stroke();
      if (q.fire || q.heat > 55) { g.lineWidth = lw * 2.4; g.strokeStyle = '#FF6A3C'; g.stroke(); }
    }
  }
  // the inside: one row per internal part, plus top plate and drones
  function insideRows(R) {
    const rows = [], st = p => partState(p, R);
    const add = (label, f, s) => rows.push({ label, f, s });
    add('Chassis', R.chassis.hp / R.chassis.maxHp, R.chassis.hp / R.chassis.maxHp < 0.4 ? ['buckling', 'warn'] : ['ok', '']);
    add('Top plate', R.lid.attached ? R.lid.hp / R.lid.maxHp : 0, st(R.lid));
    for (const q of R.internals) if (q.key !== 'motor') add(q.label, q.hp / q.maxHp, st(q));
    const mot = R.internals.filter(q => q.key === 'motor'), live = mot.filter(q => q.hp > 0).length;
    if (mot.length) add('Drive motors', mot.reduce((a, q) => a + Math.max(0, q.hp) / q.maxHp, 0) / mot.length, live < mot.length ? [`${live} of ${mot.length} work`, live ? 'warn' : 'bad'] : mot.some(q => q.heat > 55) ? ['hot', 'warn'] : ['ok', '']);
    const wh = R.parts.filter(p => p.kind === 'wheel'), on = wh.filter(p => p.attached).length;
    if (wh.length) add(R.spec.drive === 'tracks' ? 'Tracks' : 'Wheels', wh.reduce((a, p) => a + (p.attached ? Math.max(0, p.hp) / p.maxHp : 0), 0) / wh.length, on < wh.length ? [`${on} of ${wh.length} left`, on ? 'warn' : 'bad'] : ['ok', '']);
    const ar = R.parts.filter(p => p.kind === 'armour'), arOn = ar.filter(p => p.attached).length;
    if (ar.length) add('Armour plates', ar.reduce((a, p) => a + (p.attached ? Math.max(0, p.hp) / p.maxHp : 0), 0) / ar.length, arOn < ar.length ? [`${arOn} of ${ar.length} left`, arOn ? 'warn' : 'bad'] : ['ok', '']);
    const wp = R.parts.filter(p => p.kind === 'weapon');
    if (wp.length) { const wOn = wp.filter(p => p.attached).length; add('Weapon', wp.reduce((a, p) => a + (p.attached ? Math.max(0, p.hp) / p.maxHp : 0), 0) / wp.length, wOn < wp.length ? [wOn ? 'pieces missing' : 'gone', 'bad'] : st(wp[0])); }
    for (const d of R.drones || []) add(d.H.label, d.alive ? d.hp / d.maxHp : 0, !d.alive ? ['shot down', 'bad'] : d.off > 0 ? ['offline', 'warn'] : d.hp / d.maxHp < 0.4 ? ['damaged', 'warn'] : ['ok', '']);
    return rows;
  }
  const stars = n => n ? '<span class="fv-stars" title="Level ' + n + '">' + '★'.repeat(n) + '</span>' : '<span class="fv-stars dim" title="Starter">starter</span>';
  let root = null, panels = [], feedN = 0, ended = false, opts = {};
  function buildPanels() {
    const Lc = root.querySelector('.fv-left'), Rc = root.querySelector('.fv-right');
    Lc.innerHTML = ''; Rc.innerHTML = ''; panels = [];
    for (const R of S.robots) {
      const right = S.multi ? R.home[0] > 0 : R.id === 1, el = document.createElement('section'); el.className = 'fv-panel';
      const pal = TC(R.id);
      el.style.setProperty('--tc', pal.col); el.style.setProperty('--tl', pal.light);
      el.innerHTML = `<header><div><div class="fv-team">${esc(R.spec.teamName || pal.name || '')} ${R.house ? '<span class="fv-stars dim" title="Neutral: it does not count for the result">neutral</span>' : stars(R.spec.level || 0)}</div><h3>${esc(R.name)}</h3></div><div class="fv-kg"></div></header>
        <div class="fv-bars"><div class="fv-hp"><i></i></div><div class="fv-hype"><i></i></div></div>
        <div class="fv-ko"></div>
        <div class="fv-chips"></div>
        <div class="fv-body"><canvas class="fv-diag" aria-label="Damage diagram of ${esc(R.name)}"></canvas><div class="fv-rows"></div></div>
        <div class="fv-lost"></div>`;
      (right ? Rc : Lc).appendChild(el);
      panels.push({ R, el, hp: el.querySelector('.fv-hp i'), hype: el.querySelector('.fv-hype i'), chips: el.querySelector('.fv-chips'), ko: el.querySelector('.fv-ko'), koLast: '', diag: el.querySelector('.fv-diag'), rows: el.querySelector('.fv-rows'), lost: el.querySelector('.fv-lost'), kg: el.querySelector('.fv-kg'), last: '' });
    }
  }
  function updatePanels() {
    for (const P of panels) {
      const R = P.R, f = integrity(R);
      P.el.classList.toggle('out', !R.alive);
      P.hp.style.width = (f * 100).toFixed(0) + '%'; P.hp.style.background = PCOL(f);
      P.hype.style.width = (R.rage > 0 ? 100 : (R.hype || 0)).toFixed(0) + '%'; P.hype.classList.toggle('rage', R.rage > 0);
      { const kh = koHTML(R); if (kh !== P.koLast) { P.ko.innerHTML = kh; P.koLast = kh; } }
      const ch = chipsOf(R).map(c => `<span class="${c === 'ON FIRE' || c.startsWith('OUT') ? 'bad' : ''}">${esc(c)}</span>`).join('');
      if (P.chips.innerHTML !== ch) P.chips.innerHTML = ch;
      P.kg.textContent = Math.round(R.body.getMass()) + ' kg';
      const rows = insideRows(R).map(r => `<div class="fv-row"><span>${esc(r.label)}</span><b><i style="width:${(Math.max(0, r.f) * 100).toFixed(0)}%;background:${PCOL(Math.max(0, r.f))}"></i></b><em class="${r.s[1]}">${esc(r.s[0])}</em></div>`).join('');
      if (rows !== P.last) { P.rows.innerHTML = rows; P.last = rows; }
      const lost = R.stats.lost.length; P.lost.textContent = lost ? `Lost this fight: ${R.stats.lost.slice(-3).map(q => q.label).join(', ')}${lost > 3 ? ` +${lost - 3} more` : ''}` : 'Nothing lost this fight';
      drawDiagram(P.diag, R);
    }
  }
  function pushFeed() {
    const box = root.querySelector('.fv-feed');
    while (feedN < S.log.length) {
      const e = S.log[feedN++]; if (!e.big) continue;
      const li = document.createElement('div'); li.className = 'fv-ev'; li.style.setProperty('--c', e.side != null && S.robots[e.side] ? TC(e.side).col : '#9A958C');
      li.textContent = fmtT(e.t) + '  ' + e.text; box.prepend(li);
      while (box.children.length > 30) box.lastChild.remove();
    }
  }
  function fmtT(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; }
  // Layout B "Workshop Bench" (Kev, 9 Nov 2026): the fight screen on the bench. The arena is drawn as before; only the frame
  // changes: light bench, paper fighter cards with a team-coloured top, the arena in the dark pit frame with the moments under
  // it, the fight cards on hazard stripes, and a bets / what's-next card next to them (opts.info from the game).
  const CSS = `
  .fv{position:fixed;inset:0;z-index:50;background:#E9E4DA;color:#2B2118;display:flex;flex-direction:column;font:14px "IBM Plex Sans",system-ui,sans-serif}
  .fv[hidden]{display:none}
  .fv-top{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#E9E4DA;border-bottom:3px solid #2B2118;flex-wrap:wrap}
  .fv-top h2{margin:0 auto 0 0;font:400 24px "Saira Stencil One",Impact,sans-serif;letter-spacing:.02em;color:#2B2118}
  .fv-top button{font:700 12.5px "IBM Plex Mono",monospace;background:#F6F2EA;color:#2B2118;border:2px solid #2B2118;border-radius:5px;padding:6px 11px;cursor:pointer;min-height:36px}
  .fv-top button[aria-pressed=true]{background:#2B2118;color:#E8C547}
  .fv-top button.go{font:400 16px "Saira Stencil One",Impact,sans-serif;letter-spacing:1px;background:#2B2118;color:#E8C547;border-color:#2B2118}
  .fv-main{flex:1;display:grid;grid-template-columns:minmax(270px,1fr) auto minmax(270px,1fr);gap:12px;padding:12px;min-height:0}
  .fv-arena{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-width:0;min-height:0;background:#3A3530;border:3px solid #2B2118;border-radius:6px;padding:10px;align-self:center}
  .fv-arena canvas{width:min(calc(100vh - 180px),calc(100vw - 650px));height:min(calc(100vh - 180px),calc(100vw - 650px));min-width:280px;min-height:280px;border-radius:3px;display:block;outline:4px dashed #E8C547;outline-offset:2px}
  .fv-col{display:flex;flex-direction:column;gap:10px;min-height:0;overflow:auto}
  .fv-left,.fv-right{display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0}
  .fv-panel{background:#F6F2EA;border:2px solid #2B2118;border-top:10px solid var(--tc);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:7px}
  .fv-panel.out{opacity:.55}
  .fv-panel header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
  .fv-panel h3{margin:0;font:400 24px "Saira Stencil One",Impact,sans-serif;color:#2B2118;line-height:1.05}
  .fv-team{font:700 11px "IBM Plex Mono",monospace;color:var(--tc);text-transform:uppercase;letter-spacing:.06em}
  .fv-stars{color:#B07A10;letter-spacing:2px;margin-left:4px}.fv-stars.dim{color:#6E6457;letter-spacing:0;text-transform:none}
  .fv-kg{font:600 11px "IBM Plex Mono",monospace;color:#6E6457}
  .fv-bars{display:grid;gap:3px}.fv-ko{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.fv-ko:empty{display:none}.fv-ko>span{display:flex;align-items:center;gap:4px;font:700 11px "IBM Plex Mono",monospace}.fv-ko>span b{flex:1;height:7px;background:#CFC6B7;border-radius:2px;overflow:hidden}.fv-ko>span b i{display:block;height:100%}.fv-ko>span.weak{outline:2px solid #B23A2B;outline-offset:1px;border-radius:2px}.fv-count{grid-column:1/-1;background:#B23A2B;color:#fff;font:700 11.5px "IBM Plex Mono",monospace;padding:3px 6px;border-radius:3px;animation:fvPulse .8s infinite alternate}.fv-count b{display:block;height:4px;background:rgba(255,255,255,.3);margin-top:2px}.fv-count b i{display:block;height:100%;background:#E8C547}@keyframes fvPulse{to{background:#7d1f15}}.fv-hp,.fv-hype{height:9px;background:#CFC6B7;border-radius:2px;overflow:hidden}.fv-hype{height:4px}
  .fv-hp i,.fv-hype i{display:block;height:100%;transition:width .2s}.fv-hype i{background:#C99A1E}.fv-hype i.rage{background:#B23A2B}
  .fv-chips{display:flex;flex-wrap:wrap;gap:4px;min-height:18px}.fv-chips span{font:700 10px "IBM Plex Mono",monospace;background:#2B2118;color:#E8C547;padding:2px 6px;border-radius:2px}.fv-chips span.bad{background:#B23A2B;color:#fff}
  .fv-body{display:grid;gap:8px}
  .fv-diag{width:100%;height:130px;background:#3A3530;border-radius:4px}
  .fv-rows{display:grid;gap:2px}
  .fv-row{display:grid;grid-template-columns:1fr 60px 84px;gap:6px;align-items:center;font-size:12px;line-height:1.25}
  .fv-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fv-row b{height:7px;background:#CFC6B7;border-radius:2px;overflow:hidden}.fv-row b i{display:block;height:100%}
  .fv-row em{font:600 10px "IBM Plex Mono",monospace;font-style:normal;color:#6E6457;text-align:right;white-space:nowrap}.fv-row em.warn{color:#8A6A10}.fv-row em.bad{color:#B23A2B}
  .fv-lost{font-size:11px;color:#6E6457}
  .fv-foot{display:flex;gap:12px;padding:0 12px 12px;align-items:stretch}
  .fv-foot:not(:has(> :not([hidden]))){display:none}
  .fv-cards{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:9px 12px;background:#2B2118;border-radius:6px}
  .fv-cards[hidden]{display:none}
  .fv-hint{font:700 12px "IBM Plex Mono",monospace;color:#E8C547;display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-height:20px}
  .fv-hint button{font:700 12px "IBM Plex Mono",monospace;background:#F6F2EA;color:#2B2118;border:2px solid #F6F2EA;border-radius:4px;padding:3px 8px;cursor:pointer;min-height:28px}
  .fv-hint button[aria-pressed=true]{background:#E8C547;color:#1A1A12;border-color:#E8C547}
  .fv-tray{display:flex;gap:10px;overflow-x:auto;padding:3px}
  .fv-card{flex:0 0 auto;display:flex;align-items:center;gap:7px;max-width:240px;font:400 15px "Saira Stencil One",Impact,sans-serif;letter-spacing:.3px;background:#1A1A12;color:#F4EDE2;border:5px solid transparent;border-image:repeating-linear-gradient(-45deg,#E8C547 0 8px,#1A1A12 8px 16px) 5;padding:5px 10px;cursor:pointer;min-height:44px;text-align:left}
  .fv-card b{font-size:18px}.fv-card span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fv-card[aria-pressed=true]{background:#E8C547;color:#1A1A12;outline:3px solid #E8C547}
  .fv-card:disabled{opacity:.45;cursor:default}
  .fv-info{flex:0 0 auto;background:#FFFDF8;border:2px solid #2B2118;border-radius:6px;padding:8px 12px;font-size:12.5px;line-height:1.4;overflow:auto;max-height:150px}
  .fv-info[hidden]{display:none}
  .fv-info h4{margin:0 0 3px;font:700 11px "IBM Plex Mono",monospace;letter-spacing:1px;color:#6E6457}
  .fv-info .fv-ib{display:flex;justify-content:space-between;gap:8px}.fv-info .fv-ib i{font:600 12px "IBM Plex Mono",monospace;font-style:normal;white-space:nowrap}
  .fv-info .fv-next{margin-top:6px;padding-top:5px;border-top:2px dashed #CFC6B7;font-weight:600}
  .fv.aiming canvas{cursor:crosshair}
  .fv.has-cards .fv-arena canvas{width:min(calc(100vh - 275px),calc(100vw - 650px));height:min(calc(100vh - 275px),calc(100vw - 650px))}
  .fv-feed{width:100%;height:52px;overflow:auto;padding:0 2px;font:12px "IBM Plex Mono",monospace}
  .fv-ev{border-left:4px solid var(--c);padding:1px 7px;margin:2px 0;color:#EDE6DA;background:rgba(0,0,0,.3);border-radius:0 3px 3px 0}
  @media (max-width:900px),(orientation:portrait){
    .fv-main{display:flex;flex-direction:column;overflow:auto;padding:8px}
    .fv-main>*,.fv-panel{flex-shrink:0}
    .fv-top{padding:6px 8px;gap:6px}.fv-top h2{font-size:17px;flex-basis:100%}.fv-top button{padding:5px 9px;min-height:34px}
    .fv-arena{padding:6px;align-self:stretch}
    .fv-arena canvas{width:min(100vw - 40px,58vh);height:min(100vw - 40px,58vh)}
    .fv-left,.fv-right,.fv-col{overflow:visible}
    .fv-arena{order:-1}
    .fv-body{grid-template-columns:96px 1fr}
    .fv-diag{height:128px}
    .fv-feed{height:44px}
    .fv-foot{flex-direction:column;padding:0 8px 8px;gap:8px}
    .fv-col{order:1}.fv-right{order:2}
    .fv-cards{padding:6px 8px}.fv-card{font-size:13px;padding:4px 8px;min-height:40px}
    .fv.has-cards .fv-arena canvas{width:min(100vw - 40px,52vh);height:min(100vw - 40px,52vh)}
  }`;
  function mount(el) {
    root = el; if (!document.getElementById('fv-css')) { const s = document.createElement('style'); s.id = 'fv-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.className = 'fv'; root.hidden = true;
    root.innerHTML = `<div class="fv-top"><h2 class="fv-title">Fight</h2>
      <button type="button" data-sp="1" aria-pressed="false">1×</button><button type="button" data-sp="2" aria-pressed="true">2×</button><button type="button" data-sp="4" aria-pressed="false">4×</button>
      <button type="button" class="fv-pause" aria-pressed="false">Pause</button><button type="button" class="fv-skip">Skip to result</button><button type="button" class="fv-done go" hidden>Continue</button></div>
      <div class="fv-main"><div class="fv-col"><div class="fv-left"></div><div class="fv-info" hidden></div></div><div class="fv-arena"><canvas aria-label="Arena"></canvas><div class="fv-feed" aria-live="off"></div></div><div class="fv-right"></div></div>
      <div class="fv-foot"><div class="fv-cards" hidden><div class="fv-hint"></div><div class="fv-tray"></div></div></div>`;
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', onCanvasDown);
    cv.addEventListener('pointermove', e => { if (aim) hover = toWorld(e.clientX, e.clientY); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && aim && root && !root.hidden) cancelAim(); });
    root.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { V.speed = +b.dataset.sp; root.querySelectorAll('[data-sp]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    const pb = root.querySelector('.fv-pause'); pb.onclick = () => { V.paused = !V.paused; pb.setAttribute('aria-pressed', String(V.paused)); pb.textContent = V.paused ? 'Go on' : 'Pause'; };
    root.querySelector('.fv-skip').onclick = skip;
    root.querySelector('.fv-done').onclick = () => { root.hidden = true; running = false; const cb = opts.onEnd; if (cb) cb(S); };
    paintFloor();
  }
  function skip() {
    if (!S || S.over) return;
    let n = 0; while (!S.over && n < 120 * 400) { L.step(S); if (opts.onStep) opts.onStep(S); S.fx.length = 0; n++; }
    aim = null; cards = []; drawCards();
    parts = []; calls = []; slowT = 0; cam.tx = cam.ty = 0; cam.tz = 1;
  }
  let running = false, last = 0, acc = 0;
  function play(S2, o = {}) {
    S = S2; opts = o; ended = false; feedN = 0; parts = []; calls = []; hitStop = 0; flash = 0; shake = 0; slowT = 0; decalReset();
    cam.x = cam.y = cam.tx = cam.ty = 0; cam.z = cam.tz = 1; V.paused = false; V.bars = false;
    root.querySelector('.fv-title').textContent = o.title || 'Fight';
    { const inf = root.querySelector('.fv-info'); inf.innerHTML = o.info || ''; inf.hidden = !o.info; }   // the game's bets / what's next card
    root.querySelector('.fv-feed').innerHTML = ''; root.querySelector('.fv-done').hidden = true; root.querySelector('.fv-skip').hidden = false;
    const pb = root.querySelector('.fv-pause'); pb.setAttribute('aria-pressed', 'false'); pb.textContent = 'Pause';
    aim = null; cards = []; onPlayCb = null; drawCards();
    // online client: the host runs the clock, so no speed, pause or skip buttons here (o.client); the client plays at the
    // host's speed (the host sends it with every tick, Kev 9 Nov: only the host sets the speed, fair for live cards)
    root.querySelectorAll('[data-sp], .fv-pause, .fv-skip').forEach(b => { b.hidden = !!o.client; });
    if (!o.client) root.querySelectorAll('[data-sp]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.sp === V.speed)));
    root.hidden = false; buildPanels(); resize(); updatePanels();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }
  function frame(now) {
    if (!running) return;
    const rdt = Math.min(0.05, (now - last) / 1000); last = now; frameN++;
    resize();
    let ts = 0;
    if (S && !V.paused) {
      ts = V.speed * (slowT > 0 ? 0.25 : 1);
      if (slowT > 0) slowT -= rdt; else { cam.tx = 0; cam.ty = 0; cam.tz = 1; }
      if (hitStop > 0) { hitStop -= rdt; ts = 0; }
      // online: a client follows the host's step. It runs on its own clock (with its own slow motion and hit stops) and nudges
      // its speed towards where the host should be: up to 1.5× when behind, down to 0.6× when ahead, a quick catch-up when far behind.
      const goal = opts.pace && S.countdown <= 0 ? opts.pace(S) : null;
      if (goal != null) {
        const err = goal - S.step;
        if (err > 240) { let n = 0; while (S.step < goal - 30 && n < 600 && !S.over) { L.step(S); if (opts.onStep) opts.onStep(S); consumeFx(); n++; } acc = 0; }
        else ts *= err < -90 ? 0 : Math.max(0.6, Math.min(1.5, 1 + err / 120));
      }
      acc += rdt * ts; let n = 0;
      while (acc >= L.DT && n < 64) { if (!(S.over && S.t > S.result.t + 4)) { L.step(S); if (opts.onStep) opts.onStep(S); } consumeFx(); acc -= L.DT; n++; }
      if (n >= 64) acc = 0;
      emitters(rdt * ts);
      if (S.over && cards.length) { aim = null; cards = []; drawCards(); }
      if (S.over && !ended && S.t > S.result.t + 1.2) { ended = true; root.querySelector('.fv-done').hidden = false; root.querySelector('.fv-skip').hidden = true; }
    }
    stepParticles(rdt * ts);
    for (const c of calls) c.t += rdt; flash = Math.max(0, flash - rdt);
    for (const R of S.robots) { if (R.dashFx > 0) R.dashFx -= rdt; if (R.shieldFlash > 0) R.shieldFlash -= rdt; if (R.grappleFx > 0) R.grappleFx -= rdt; if (R.zap > 0) R.zap -= rdt; R.drumSpin = (R.drumSpin || 0) + (R.drumE || 0) * rdt * ts * 3; }
    const kk = 1 - Math.exp(-rdt * 6); cam.x += (cam.tx - cam.x) * kk; cam.y += (cam.ty - cam.y) * kk; cam.z += (cam.tz - cam.z) * kk;
    for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz']) if (!Number.isFinite(cam[k])) cam[k] = k.endsWith('z') ? 1 : 0;
    if (!Number.isFinite(shake)) shake = 0; shake *= Math.exp(-rdt * 8);
    draw(); pushFeed();
    if (frameN % 6 === 0) updatePanels();
    requestAnimationFrame(frame);
  }
  // close the view without its Continue button (the game skipped the fight)
  function close() { if (!root) return; root.hidden = true; running = false; }
  // a still picture of a robot as it stands (lost parts missing, the lid as it is), drawn with the fight renderer.
  // Returns a square canvas (cached by spec), front up. The tabletop game draws it on its garage bays and lots.
  const PCACHE = new Map();
  function portrait(spec, size) {
    size = Math.max(32, Math.round(size || 160));
    const key = size + '|' + JSON.stringify(spec);
    if (PCACHE.has(key)) return PCACHE.get(key);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const P = L.create({ a: spec, b: spec, seed: 1 }), R = P.robots[0];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const q of R.parts) if (q.attached || q.kind === 'chassis') for (const [x, y] of q.home) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const k = size / (Math.max(x1 - x0, y1 - y0) + 0.3), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, b = R.body, pos = b.getPosition(), ang = b.getAngle();
    const sS = S, sCtx = ctx, sPX = PX;
    try {
      S = P; ctx = c.getContext('2d'); PX = 1 / k;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(size / 2, size / 2); ctx.scale(k, k); ctx.rotate(-Math.PI / 2);
      ctx.translate(-cx, -cy); ctx.rotate(-ang); ctx.translate(-pos.x, -pos.y);
      drawRobot(R, 0);
    } catch (e) { /* a picture must never break the game */ }
    finally { S = sS; ctx = sCtx; PX = sPX; }
    if (PCACHE.size > 300) PCACHE.clear();
    PCACHE.set(key, c);
    return c;
  }
  // ---------- live combat cards (ROBOCUS 2.0): a tray under the arena; tap a card, then a robot or a spot ----------
  // setCards(list, onPlay): list = [{ key, icon, name, text, target: 'bot'|'arena', own, valid: [robot ids], radius }];
  // onPlay(key, { robot, x, y, crate }) is called once the card is aimed. The game then calls setCards again.
  let cards = [], aim = null, hover = null, onPlayCb = null, crate = 'repair';
  const CRATES = [['repair', '+ Repair'], ['shield', 'S Shield'], ['nitro', 'N Nitro'], ['overcharge', '⚡ Power']];
  function toWorld(cx, cy) { const r = cv.getBoundingClientRect(), px = (cx - r.left) * W / r.width, py = (cy - r.top) * W / r.height; return [(px - W / 2) / (K * cam.z) + cam.x, (py - W / 2) / (K * cam.z) + cam.y]; }
  function clientOf(x, y) { const r = cv.getBoundingClientRect(), [sx, sy] = toScreen(x, y); return [r.left + sx * r.width / W, r.top + sy * r.height / W]; }
  function setCards(list, onPlay) { cards = (list || []).slice(); onPlayCb = onPlay || onPlayCb; if (aim && !cards.some(c => c.key === aim.key)) aim = null; drawCards(); }
  function hintText() {
    if (!aim) return cards.length ? 'Your fight cards: tap one to play it' : '';
    const c = cards.find(x => x.key === aim.key); if (!c) return '';
    return (aim.stage === 'bot' ? (c.own ? 'Tap your robot' : 'Tap a robot') : c.own ? 'Now tap a spot to drive to' : 'Tap a spot in the arena') + ' · ' + c.name + ' · Esc or tap the card to cancel';
  }
  function drawCards() {
    if (!root) return;
    const box = root.querySelector('.fv-cards'), tray = root.querySelector('.fv-tray'), hint = root.querySelector('.fv-hint');
    box.hidden = !cards.length; root.classList.toggle('aiming', !!aim); root.classList.toggle('has-cards', !!cards.length);
    if (!cards.length) { tray.innerHTML = ''; hint.innerHTML = ''; return; }
    tray.innerHTML = cards.map((c, i) => `<button type="button" class="fv-card" data-i="${i}" aria-pressed="${aim && aim.key === c.key}" title="${esc(c.text || '')}"${c.target === 'bot' && !(c.valid || []).length ? ' disabled' : ''}><b>${c.icon || '🃏'}</b><span>${esc(c.name)}</span></button>`).join('');
    const sup = aim && aim.key && (cards.find(x => x.key === aim.key) || {}).crate;
    hint.innerHTML = `<span>${esc(hintText())}</span>` + (sup ? CRATES.map(([k, l]) => `<button type="button" data-crate="${k}" aria-pressed="${crate === k}">${esc(l)}</button>`).join('') : '');
    tray.querySelectorAll('.fv-card').forEach(b => b.onclick = () => pickCard(cards[+b.dataset.i]));
    hint.querySelectorAll('[data-crate]').forEach(b => b.onclick = () => { crate = b.dataset.crate; drawCards(); });
  }
  function pickCard(c) {
    if (!c || (S && S.over)) return;
    if (aim && aim.key === c.key) { cancelAim(); return; }
    const valid = (c.valid || []).filter(i => S.robots[i] && S.robots[i].alive);
    if (c.target === 'bot' && !valid.length) return;
    aim = { key: c.key, stage: c.target === 'bot' || (c.own && valid.length > 1) ? 'bot' : 'spot', robot: c.own && c.target === 'arena' && valid.length === 1 ? valid[0] : null };
    if (c.crate) crate = 'repair';
    drawCards();
  }
  function cancelAim() { aim = null; hover = null; drawCards(); }
  function onCanvasDown(e) {
    if (!aim || !S || S.over) return;
    e.preventDefault();
    const c = cards.find(x => x.key === aim.key); if (!c) { cancelAim(); return; }
    const [x, y] = toWorld(e.clientX, e.clientY); hover = [x, y];
    if (aim.stage === 'bot') {
      let best = null, bd = 1e9;
      for (const i of c.valid || []) { const R = S.robots[i]; if (!R || !R.alive) continue; const p = R.body.getPosition(), d = Math.hypot(p.x - x, p.y - y); if (d < bd && d < R.hl + 0.55) { bd = d; best = i; } }
      if (best == null) { const h = root.querySelector('.fv-hint span'); if (h) h.textContent = (c.own ? 'Tap your robot' : 'Tap a robot') + ' (it glows)'; return; }
      if (c.target === 'arena') { aim.robot = best; aim.stage = 'spot'; drawCards(); return; }
      playCard(c, { robot: best });
      return;
    }
    const H = L.HALF - 0.3;
    playCard(c, { robot: aim.robot, x: Math.max(-H, Math.min(H, x)), y: Math.max(-H, Math.min(H, y)), crate: c.crate ? crate : undefined });
  }
  // (was also called fire(), which hid the fire-particle fire(x, y): burning robots played cards instead of showing flames)
  function playCard(c, o) { aim = null; hover = null; const cb = onPlayCb; cards = cards.filter(x => x !== c); drawCards(); if (cb) cb(c.key, o); }
  function drawAim() {
    if (!aim || !S) return;
    const c = cards.find(x => x.key === aim.key); if (!c) return;
    const t = performance.now() / 1000, pulse = 0.5 + 0.5 * Math.sin(t * 8);
    if (aim.stage === 'bot') for (const i of c.valid || []) {
      const R = S.robots[i]; if (!R || !R.alive) continue; const p = R.body.getPosition();
      ctx.strokeStyle = `rgba(232,197,71,${0.55 + 0.45 * pulse})`; ctx.lineWidth = PX * 4; ctx.setLineDash([PX * 9, PX * 6]);
      ctx.beginPath(); ctx.arc(p.x, p.y, R.hl + 0.22 + 0.04 * pulse, t, t + 6.29); ctx.stroke(); ctx.setLineDash([]);
    }
    if (aim.stage === 'spot') {
      if (aim.robot != null && S.robots[aim.robot]) { const p = S.robots[aim.robot].body.getPosition(); ctx.strokeStyle = '#E8C547'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(p.x, p.y, S.robots[aim.robot].hl + 0.2, 0, 6.29); ctx.stroke(); if (hover) { ctx.setLineDash([PX * 8, PX * 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(hover[0], hover[1]); ctx.stroke(); ctx.setLineDash([]); } }
      if (hover) { const r = c.radius || 0.4; ctx.fillStyle = 'rgba(232,197,71,0.16)'; ctx.strokeStyle = `rgba(232,197,71,${0.6 + 0.4 * pulse})`; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(hover[0], hover[1], r, 0, 6.29); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hover[0] - 0.15, hover[1]); ctx.lineTo(hover[0] + 0.15, hover[1]); ctx.moveTo(hover[0], hover[1] - 0.15); ctx.lineTo(hover[0], hover[1] + 0.15); ctx.stroke(); }
    }
  }
  window.RobocusView = { mount, play, skip, close, integrity, replace(S2) { S = S2; }, portrait, drawDiagram, insideRows, V, setCards, toWorld, clientOf, get aiming() { return aim; }, get state() { return S; } };
})();
