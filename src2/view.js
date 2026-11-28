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
  const MOD_ICON = { shield: ['S', '#47A8FF'], emp: ['E', '#7FD4FF'], grapple: ['G', '#C9A227'], jets: ['J', '#FF8A2A'], oil: ['O', '#3B3530'], mines: ['M', '#D24B3A'], repair: ['+', '#4CC26A'], boom: ['!', '#E0402B'], quantum: ['Q', '#F2C94C'], smoke: ['~', '#9A958C'], popper: ['P', '#D9B43A'], tow: ['T', '#C9A227'], jam: ['J', '#B07AE0'] };
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
      const damp = p.t === 'spark' || p.t === 'puff' ? 3 : p.t === 'shard' ? 4 : 0.6; p.vx *= Math.exp(-damp * dt); p.vy *= Math.exp(-damp * dt);
      if (p.t === 'smoke') p.s += dt * 0.12; else if (p.t === 'puff') p.s += dt * 0.25;
      if (p.t === 'shard' && p.life <= 0) { dctx.fillStyle = 'rgba(70,64,56,0.8)'; dctx.fillRect(toD(p.x), toD(p.y), p.s * FPX, p.s * FPX * 0.7); }
    }
    parts = parts.filter(p => p.life > 0);
  }

  // ---------- tow cable and wall slams (Kev, 16 Nov: "the tow cable was barely visible, forklift just slammed in the wall
  // without much visual effect"). View only: reads the sim, never writes it; randomness is Math.random like the rest here.
  let tows = [], dents = [], jolts = new Map(), vt = 0, flashN = { wall: 0, robot: 0 };   // impact flashes this fight (tests read RobocusView.fx)   // vt: view clock (stops while paused or in a hit stop)
  function towStart(e) {
    const R = S.robots[e.robot]; if (!R) return;
    let E = null, bd = 1e9; for (const Q of S.robots) if (Q !== R) { const q = Q.body.getPosition(), d = Math.hypot(q.x - e.x, q.y - e.y); if (d < bd) { bd = d; E = Q; } }
    if (!E) return;
    const rp = R.body.getPosition(), dl = E.body.getLocalVector(planck.Vec2(rp.x - e.x, rp.y - e.y)), m = Math.hypot(dl.x, dl.y) || 1, ux = dl.x / m, uy = dl.y / m;
    const k = Math.min(E.hl / Math.max(1e-3, Math.abs(ux)), E.hw / Math.max(1e-3, Math.abs(uy))) * 0.92;   // the hook bites the side of the victim that faces the carrier
    const tow = R.mod === 'tow';
    tows = tows.filter(w => w.R !== R); tows.push({ R, E, lp: [ux * k, uy * k], t0: vt, max: tow ? 1.1 : 0.45, rel: null, tow });
    const a = towAnchor(R); spawn({ t: 'ring', x: a.x, y: a.y, vx: 0, vy: 0, life: 0.3, max: 0.3, s: 0.06, col: HAZ });   // launcher puff
    for (let i = 0; i < 5; i++) smoke(a.x, a.y, false, 0.07);
    for (let i = 0; i < 10; i++) { const an = Math.random() * 6.28; spawn({ t: 'spark', x: e.x, y: e.y, vx: Math.cos(an) * 3, vy: Math.sin(an) * 3, life: 0.25, max: 0.3, col: HAZ }); }   // the hook bites
  }
  function towAnchor(R) { const lp = R.module ? R.module.lp : [0, 0]; return R.body.getWorldPoint(planck.Vec2(lp[0], lp[1])); }
  function wallHit(e) {
    let R = null, bd = 1e9;
    for (const Q of S.robots) { if (Q.lastWall == null || S.t - Q.lastWall > 0.02) continue; const q = Q.body.getPosition(), d = Math.hypot(q.x - e.x, q.y - e.y); if (d < Q.hl + 0.7 && d < bd) { bd = d; R = Q; } }
    if (!R) return;   // not a robot hitting a wall
    const slung = R.airborne > 0 && !!R.thrownBy, P = e.power * (slung ? 1.4 : 1), k = Math.max(0, Math.min(1, (P - 25) / 260));
    const q = R.body.getPosition(); let nx = q.x - e.x, ny = q.y - e.y; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;   // away from the wall, into the arena
    const J = jolts.get(R);
    if (J && vt - J.t0 < 0.15) { if (k > J.k) { J.k = k; J.nx = nx; J.ny = ny; } return; }   // one slam = several contacts: one effect
    jolts.set(R, { t0: vt, k, nx, ny });
    for (const w of tows) if (w.E === R && w.rel == null) w.rel = vt;   // the cable lets go on the hit
    if (k < 0.05) return;   // a light touch stays quiet (the sparks are enough)
    impactFlash(e.x, e.y, k); flashN.wall++;   // Kev, 21 Nov (voting page, T48): "a plain flash" instead of the comic star
    spawn({ t: 'ring', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3, max: 0.3, s: 0.08, col: k > 0.4 ? '#FFF2C8' : undefined });
    const base = Math.atan2(ny, nx), n = Math.round(6 + 18 * k);
    for (let i = 0; i < n; i++) { const an = base + (Math.random() - 0.5) * 2.8, v = 0.6 + Math.random() * (1 + 2.5 * k); spawn({ t: 'puff', x: e.x, y: e.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: 0.5 + Math.random() * 0.5, max: 1, s: 0.07 + 0.12 * k * Math.random() }); }
    for (let i = 0, m = Math.round(3 + 10 * k); i < m; i++) { const an = base + (Math.random() - 0.5) * 2.4, v = 1.5 + Math.random() * (2 + 3 * k); spawn({ t: 'shard', x: e.x, y: e.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: 0.8 + Math.random(), max: 1.8, s: 0.015 + Math.random() * 0.03, r: Math.random() * 6, col: Math.random() < 0.3 ? HAZ : Math.random() < 0.5 ? '#B8B1A4' : '#7d7a72' }); }
    shake = Math.min(0.4, shake + 0.03 + 0.3 * k);
    if (k > 0.35) { hitStop = Math.max(hitStop, 0.03 + 0.07 * k); flash = Math.max(flash, 0.1 * k); }
    if (k > 0.12) {   // a dent in the wall: merges with one close by (and starts fading again), keeps the newest 18
      const d0 = dents.find(d => Math.hypot(d.x - e.x, d.y - e.y) < 0.18);
      if (d0) { d0.s = Math.min(0.32, Math.max(d0.s, 0.1 + 0.2 * k) + 0.03); d0.t0 = vt; }
      else { dents.push({ x: e.x, y: e.y, a: Math.atan2(-ny, -nx), s: 0.1 + 0.2 * k, seed: Math.random() * 6, t0: vt }); if (dents.length > 18) dents.shift(); }
    }
  }
  // Kev, 21 Nov (T48): "a plain flash" where a robot slams into a wall or into another robot: a short white-hot glow at the
  // impact point, as big and as long as the hit is hard (k 0..1, the wall slam's scale); no star, no outline.
  function impactFlash(x, y, k) { const l = 0.1 + 0.12 * k; spawn({ t: 'impact', x, y, vx: 0, vy: 0, life: l, max: l, s: 0.22 + 0.4 * k }); }
  // Kev, 21 Nov (T48): "also robot against robot". The engine's robot-on-robot contact sparks (metal: part on part), hard ones
  // only: power x1.4 when one of the two was thrown, at least RR_MIN (about 2.5 a fight in 10 stock fights, 0-10; light bumps
  // and pushing stay quiet). A weapon blow at the same spot already has its own ring and flash, so it gets none. No dent.
  const RR_MIN = 100, rrLast = new Map();
  function robotHit(e, batch) {
    if (batch.some(h => h.type === 'bigHit' && Math.hypot(h.x - e.x, h.y - e.y) < 0.6)) return;
    const two = S.robots.map(R => { const q = R.body.getPosition(); return { R, d: Math.hypot(q.x - e.x, q.y - e.y) }; }).sort((a, b) => a.d - b.d).slice(0, 2);
    if (two.length < 2) return;
    const slung = two.some(o => o.R.airborne > 0 && o.R.thrownBy), P = e.power * (slung ? 1.4 : 1);
    if (P < RR_MIN) return;
    const key = Math.min(two[0].R.id, two[1].R.id) + '-' + Math.max(two[0].R.id, two[1].R.id), t0 = rrLast.get(key);
    if (t0 != null && vt - t0 < 0.15) return;   // one hit = several contacts: one flash
    rrLast.set(key, vt); flashN.robot++;
    const k = Math.max(0, Math.min(1, (P - 25) / 260));
    impactFlash(e.x, e.y, k);
    shake = Math.min(0.4, shake + 0.02 + 0.2 * k);
  }
  function joltOf(R) {   // squash and shake of a robot that just hit a wall: [dx, dy, squash, nx, ny]
    const J = jolts.get(R); if (!J) return null; const age = vt - J.t0; if (age > 0.4) { jolts.delete(R); return null; }
    const amp = (0.15 + 0.85 * J.k) * Math.exp(-age * 9);
    return [-J.nx * 0.05 * amp * Math.cos(age * 55), -J.ny * 0.05 * amp * Math.cos(age * 55), 0.22 * amp * Math.max(0, Math.cos(age * 30)), J.nx, J.ny];
  }
  // Kev, 21 Nov (T48): "dents that fade": a dent stays DENT_HOLD s, then fades out over DENT_FADE s (view clock, so it waits
  // through pauses and hit stops). Each dent fades on its own clock, so the newest stays longest; a new slam on it restarts it.
  const DENT_HOLD = 2.5, DENT_FADE = 2.5;
  function drawDents() {   // on the hazard stripe just inside the wall: a dark crater, a bright bent lip, cracks along the wall
    dents = dents.filter(d => vt - d.t0 < DENT_HOLD + DENT_FADE);
    for (const d of dents) {
      const age = vt - d.t0, al = age < DENT_HOLD ? 1 : Math.max(0, 1 - (age - DENT_HOLD) / DENT_FADE);
      ctx.save(); ctx.globalAlpha = al * al * (3 - 2 * al); ctx.translate(d.x, d.y); ctx.rotate(d.a);   // +x points into the wall, y runs along it
      ctx.fillStyle = 'rgba(20,14,8,0.75)'; ctx.beginPath(); ctx.ellipse(-0.04, 0, d.s * 0.4, d.s, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = 'rgba(235,228,212,0.85)'; ctx.lineWidth = PX * 2.5; ctx.beginPath(); ctx.ellipse(-0.04, 0, d.s * 0.4, d.s, 0, 1.9, 4.4); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
      for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, l = d.s * (1.2 + 0.8 * Math.abs(Math.sin(d.seed * 3 + i))), x1 = -0.03 - 0.12 * Math.abs(Math.sin(d.seed + i * 1.7)); ctx.beginPath(); ctx.moveTo(-0.04, sd * d.s * 0.5); ctx.lineTo((x1 - 0.04) / 2, sd * l * 0.6); ctx.lineTo(x1, sd * l); ctx.stroke(); }
      ctx.restore();
    }
  }
  function cablePath(x0, y0, x1, y1, wob) {
    ctx.beginPath(); ctx.moveTo(x0, y0);
    if (!wob) { ctx.lineTo(x1, y1); return; }
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, px = -dy / l, py = dx / l;
    for (let i = 1; i <= 10; i++) { const f = i / 10, w = Math.sin(f * Math.PI) * Math.sin(f * 9 + vt * 40) * wob; ctx.lineTo(x0 + dx * f + px * w, y0 + dy * f + py * w); }
  }
  function drawTows() {
    tows = tows.filter(w => { const age = vt - w.t0; if (w.rel == null && age > w.max) w.rel = vt; return !(w.rel != null && vt - w.rel > 0.25) && w.R.body && !w.R.inPit; });
    for (const w of tows) {
      const a = towAnchor(w.R), h = w.E.body.getWorldPoint(planck.Vec2(w.lp[0], w.lp[1]));
      const back = w.rel == null ? 0 : Math.min(1, (vt - w.rel) / 0.25);   // after the release the hook flies home
      const hx = h.x + (a.x - h.x) * back, hy = h.y + (a.y - h.y) * back, wob = w.rel == null ? 0 : 0.12 * (1 - back), ang = Math.atan2(hy - a.y, hx - a.x);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(20,14,8,0.25)'; ctx.lineWidth = 0.05; cablePath(a.x + 0.06, a.y + 0.08, hx + 0.06, hy + 0.08, wob); ctx.stroke();   // shadow on the floor
      ctx.strokeStyle = INK; ctx.lineWidth = 0.07; cablePath(a.x, a.y, hx, hy, wob); ctx.stroke();
      ctx.strokeStyle = HAZ; ctx.lineWidth = 0.042; ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 0.042; ctx.lineCap = 'butt'; ctx.setLineDash([0.05, 0.07]); ctx.lineDashOffset = -vt * 1.5; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      ctx.lineCap = 'butt';
      // the clamp at the victim's end
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
      ctx.beginPath(); ctx.rect(-0.07, -0.045, 0.06, 0.09); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.028; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0.0, -0.045, 0.05, -1.6, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(0.0, 0.045, 0.05, -0.9, 1.6); ctx.stroke();
      ctx.lineWidth = 0.014; ctx.strokeStyle = '#E4E6DE'; ctx.beginPath(); ctx.arc(0.0, -0.045, 0.05, -1.6, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(0.0, 0.045, 0.05, -0.9, 1.6); ctx.stroke();
      ctx.restore();
      if (w.rel == null && w.tow) {   // taut: a hazard ring on the hook and speed lines behind the victim
        const t = performance.now() / 1000; ctx.strokeStyle = `rgba(232,197,71,${0.5 + 0.5 * Math.sin(t * 30)})`; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(hx, hy, 0.11, 0, 6.29); ctx.stroke();
        const v = w.E.body.getLinearVelocity(), sp = Math.hypot(v.x, v.y);
        if (sp > 1.5) { const ux = v.x / sp, uy = v.y / sp, c = w.E.body.getPosition(), r = w.E.hl + 0.1; ctx.strokeStyle = 'rgba(43,33,24,0.55)'; ctx.lineWidth = PX * 2.5; for (const o of [-0.7, -0.25, 0.25, 0.7]) { const sx = c.x - ux * r - uy * o * w.E.hw * 1.6, sy = c.y - uy * r + ux * o * w.E.hw * 1.6, l = Math.min(0.9, sp * 0.08) * (1 - Math.abs(o) * 0.4); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - ux * l, sy - uy * l); ctx.stroke(); } }
      }
    }
  }
  function drawWinch(R, a) {   // the Tow cable on the robot: a yellow winch drum with the hook parked on it (empty while the cable is out)
    const [mx, my] = R.module.lp, on = R.module.hp > 0 && !(R.modOff > 0), out = tows.some(w => w.R === R && w.tow);
    ctx.save(); ctx.translate(mx, my);
    ctx.fillStyle = on ? HAZ : '#6a6358'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; rr(-0.1, -0.075, 0.2, 0.15, 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; for (const x of [-0.1, 0.07]) ctx.fillRect(x, -0.075, 0.03, 0.15);   // drum flanges
    ctx.strokeStyle = out ? 'rgba(43,33,24,0.35)' : INK; ctx.lineWidth = PX * 1.4; for (let x = -0.06; x < 0.07; x += 0.026) { ctx.beginPath(); ctx.moveTo(x, -0.06); ctx.lineTo(x + 0.012, 0.06); ctx.stroke(); }   // wound cable
    if (!out) { ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(0, 0.0, 0.035, 0, 6.29); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- camera, drama ----------
  const cam = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1 }; let shake = 0, slowT = 0, banner = null, hitStop = 0, flash = 0;
  let calls = []; // floating comic callouts
  let sndCd = -2;
  const CRATE_COL = { nitro: '#FF8A2A', overcharge: '#B266FF', repair: '#4CC26A', shield: '#47A8FF' }, CRATE_ICON = { nitro: 'N', overcharge: '⚡', repair: '+', shield: 'S' };
  function consumeFx() {
    const SND = window.RSound;
    for (const e of S.fx) {
      if (SND) {   // Kev, 11 Nov: quiet arena sound (src2/sound.js), from the same events as the effects
        const ty = e.type;
        if (ty === 'bigHit') { const w = SND.forCause(e.cause); SND.play(w || (e.power >= 20 ? 'clang' : 'hit'), e.power / 40); if (w && e.power >= 26) SND.play('clang', e.power / 50); }   // the weapon's own sound, plus a clang on a heavy one
        else if (ty === 'spark') { if (!e.small && e.power >= 30 && e.nx != null) SND.play(e.metal ? 'crash' : 'bang', e.power / 70); else if (!e.small && e.power >= 18) SND.play('hit', e.power / 60); }   // robots slamming together, a robot into the wall
        else if (ty === 'detach') SND.play('crunch');
        else if (ty === 'boom') SND.play('boom');
        else if (ty === 'thud' || ty === 'shatter') SND.play('thud', 0.5);
        else if (ty === 'punch') SND.play('thunk', 0.8);
        else if (ty === 'slam') SND.play('bang', 1);
        else if (ty === 'piston' || ty === 'boing') SND.play('boing');
        else if (ty === 'emp' || ty === 'chipzap' || ty === 'chipfry') SND.play('zap');
        else if (ty === 'scorch') { if (e.r <= 0.05) SND.play('flame'); }
        else if (ty === 'launch') SND.play('whoosh');
        else if (ty === 'grapple') SND.play('twang');
        else if (ty === 'jets' || ty === 'dash') SND.play('jet');
        else if (ty === 'shieldhit' || ty === 'ewall') SND.play('ping');
        else if (ty === 'ricochet') SND.play('shot', 0.3);
        else if (ty === 'pickup') SND.play('blip');
        else if (ty === 'smokebomb') SND.play('puff');
        else if (ty === 'ko') SND.play('ko');
      }
      if (e.type === 'spark') { sparks(e.x, e.y, e.small ? e.power * 0.5 : e.power * 0.6, e.nx, e.ny); if (!e.small && !e.metal && e.nx != null && e.power >= 25) wallHit(e); else if (e.metal && e.nx != null && e.power * 1.4 >= RR_MIN) robotHit(e, S.fx); }
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
      else if (e.type === 'grapple') { S.robots[e.robot].grappleFx = 0.35; towStart(e); }
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
    if (part.bends || part.cracks || part.grooves || part.kinks) drawWear(part);
    if (part.heat > 25) { ctx.fillStyle = `rgba(255,${120 - part.heat * 0.5},20,${Math.min(0.55, (part.heat - 25) / 150)})`; ctx.fillRect(-2, -2, 4, 4); }
    ctx.restore();
    path(part.outline); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  }
  // ---------- wear (T41: on in the game): cracks, bends, saw grooves (ported from tools/damage-lab/ui.js; keep the two in step) ----------
  function crackPath(c, w, col, ox, oy) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    for (const t of c.tips) { if (t.pts.length < 2) continue; ctx.beginPath(); ctx.moveTo(t.pts[0][0] + ox, t.pts[0][1] + oy); for (let k = 1; k < t.pts.length; k++) ctx.lineTo(t.pts[k][0] + ox, t.pts[k][1] + oy); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  function drawCracks(cracks, big) {
    for (const c of cracks) {
      const w = PX * Math.min(big ? 3.8 : 3.2, 1.4 + c.len * (big ? 8 : 20));
      if (big) crackPath(c, w * 3.2, 'rgba(14,9,5,0.16)', 0, 0); // a dirty halo along the crack so it reads at a distance
      crackPath(c, w + PX * 1.6, 'rgba(255,245,228,0.35)', PX * 0.9, PX * 0.9); // lit lower lip
      crackPath(c, w, 'rgba(14,9,5,0.92)', 0, 0);
      if (c.len > 0.04) { ctx.fillStyle = 'rgba(14,9,5,0.85)'; ctx.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = (k % 2 ? 0.012 : 0.022) * Math.min(1.6, 0.6 + c.len * 6); k ? ctx.lineTo(c.o[0] + Math.cos(a) * r, c.o[1] + Math.sin(a) * r) : ctx.moveTo(c.o[0] + r, c.o[1]); } ctx.closePath(); ctx.fill(); } // the impact point
    }
  }
  function drawWear(part) {
    if (part.bends && part.bAx) { const A = part.bAx; // folds where the plate is bent
      for (const b of part.bends) { if (b.depth < 0.006) continue; const k = Math.min(1, b.depth / 0.04);
        for (const [o, al] of [[0, 0.75], [-WEAR_R * 0.55, 0.35], [WEAR_R * 0.55, 0.35]]) { const sx = b.s + o, sh = A.inn * b.depth * (o ? 0.45 : 1);
          const P = (t, d) => A.ax === 0 ? [sx + d, t + sh] : [t + sh, sx + d];
          let q0 = P(A.tlo - 0.02, 0), q1 = P(A.thi + 0.02, 0); ctx.strokeStyle = `rgba(14,9,5,${al * k})`; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
          q0 = P(A.tlo - 0.02, 0.012); q1 = P(A.thi + 0.02, 0.012); ctx.strokeStyle = `rgba(255,248,235,${al * k * 0.6})`; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); } } }
    if (part.kinks && part.kAx) { const A = part.kAx; // a bent weapon: a fold across the beam where it gave, scuffed paint either side
      for (const kk of part.kinks) { const a = Math.abs(kk.th); if (a < 0.03) continue; const k = Math.min(1, a / 0.25);
        const P = (q, o) => A.ax === 0 ? [kk.s + o, q] : [q, kk.s + o];
        let q0 = P(A.tlo - 0.03, 0), q1 = P(A.thi + 0.03, 0); ctx.strokeStyle = `rgba(14,9,5,${0.5 + 0.4 * k})`; ctx.lineWidth = PX * (1.8 + 2 * k); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
        q0 = P(A.tlo - 0.03, kk.side * 0.012); q1 = P(A.thi + 0.03, kk.side * 0.012); ctx.strokeStyle = `rgba(255,248,235,${0.35 + 0.35 * k})`; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
        ctx.fillStyle = `rgba(60,50,40,${0.25 * k})`; const w = 0.03 + 0.05 * k; const r0 = P(A.tlo - 0.03, -w), r1 = P(A.thi + 0.03, w); ctx.fillRect(Math.min(r0[0], r1[0]), Math.min(r0[1], r1[1]), Math.abs(r1[0] - r0[0]), Math.abs(r1[1] - r0[1])); } }
    if (part.cracks) drawCracks(part.cracks, false);
    if (part.grooves) drawGrooves(part.grooves, part.attached);
  }
  function drawGrooves(grooves, live) { // bright cut metal round the notch, glowing while the saw is in it (T41: also through the top plate)
    for (const g of grooves) { if (g.depth < 0.004) continue;
      const hot = S && live ? Math.max(0, 1 - (S.t - g.hot) / 0.8) : 0, r = 0.018 + Math.min(0.02, g.depth * 0.4);
      if (hot > 0) { const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r * 2.4); gr.addColorStop(0, `rgba(255,190,80,${0.85 * hot})`); gr.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gr; ctx.fillRect(g.x - r * 2.4, g.y - r * 2.4, r * 4.8, r * 4.8); }
      ctx.strokeStyle = 'rgba(236,236,226,0.9)'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, 6.29); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,150,140,0.7)'; ctx.lineWidth = PX * 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(g.x, g.y, r * (1.25 + k * 0.08), 0, 6.29); ctx.stroke(); } }
  }
  const WEAR_R = (L.WEAR && L.WEAR.bendR) || 0.17;
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
    if (part.key === 'stump') return '#8C8F86';   // T69: Hornet's blunt spear stump
    if (part.key === 'glove') return '#6F7369';
    if (part.key === 'blade') return '#B9BBB4';
    if (part.key === 'flipper') return part.bare ? '#A9ADA8' : '#D9B43A';   // (T67: a bare flipper, its teeth plate gone, is plain steel)
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
      else if (part.key === 'spear') { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(R.hl, -0.012, 0.6, 0.012); if (R.foChip) { const [, , tx] = bbox(part.verts); ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.moveTo(tx - 0.09, -0.004); ctx.lineTo(tx - 0.05, 0.02); ctx.lineTo(tx - 0.07, 0.03); ctx.closePath(); ctx.fill(); } }   // (T69: a chip in the tip before it breaks)
      else if (part.key === 'stump') { const [x0, y0, x1, y1] = bbox(part.verts); ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const y = y0 + (y1 - y0) * k / 6; k ? ctx.lineTo(x1 - (k % 2) * 0.025, y) : ctx.moveTo(x1, y); } ctx.stroke(); }   // T69: the broken end of the stump
      else if (part.key === 'sweeper' && part.bare) { ctx.fillStyle = '#17120D'; path([[0.36, -0.034], [0.4, -0.02], [0.37, -0.005], [0.405, 0.012], [0.37, 0.034]]); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0.02, -0.012, 0.32, 0.01); for (const x of [0.1, 0.22]) bolt(x, 0); }   // T71a: Scythe's bare pole, torn where the blade was
      else if (part.key === 'sweeper' && R && R.fo && !part.foChip) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(0.32, -0.075); ctx.lineTo(0.62, -0.07); ctx.lineTo(0.645, 0); ctx.stroke(); ctx.fillStyle = '#4A4540'; ctx.fillRect(0.3, -0.06, 0.03, 0.12); }   // T71a: the scythe blade (bright edge), clamped onto the arm
      else if (part.key === 'sweeper' && part.foChip) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(0.37, -0.07); ctx.lineTo(0.39, -0.03); ctx.lineTo(0.37, 0.0); ctx.lineTo(0.395, 0.04); ctx.stroke(); }   // T71a: a crack across the blade before it snaps
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
      else if (part.key === 'flipper' && part.bare) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = PX * 1.5; for (const y of [-0.22, 0, 0.22]) { ctx.beginPath(); ctx.arc(R.hl + 0.05, y, 0.012, 0, 6.29); ctx.stroke(); } } // T67: bare flipper, the empty bolt holes of the teeth plate
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
  // the forks (Forklift's lifter, Trebuchet's scoops) lie low, under everything: the fight draws them before all robots,
  // the still picture (portrait) before its robot. One helper, so both look the same.
  function drawForks(R, i) {
    const b = R.body, p = b.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle());
    for (const q of R.forks) if (q.attached && q.body === b) { drawPart(q, fillFor(q, R, i), R, decorate(q, R, i)); ctx.strokeStyle = 'rgba(43,33,24,0.5)'; ctx.lineWidth = PX * 1.2; for (let k = 1; k < 4; k++) { const x = R.hl + k * 0.08, y = (q.verts[2][1]); ctx.beginPath(); ctx.moveTo(x, y - 0.02); ctx.lineTo(x, y + 0.02); ctx.stroke(); } }
    ctx.restore();
  }
  function drawRobot(R, i) {
    const b = R.body, p = b.getPosition(), a = b.getAngle();
    const air = R.airborne > 0 ? Math.sin(Math.PI * Math.min(1, 1 - R.airborne / Math.max(R.airMax, 0.01))) : 0;
    const carried = S.robots.some(Q => Q.carry && Q.carry.robot === R) || S.t < (R.trophyT || 0); // forks, or held up on a beak
    let sc = 1 + air * 0.28 + (carried ? 0.1 : 0), alpha = 1;
    if (R.inPit) { const k = Math.min(1, (S.t - R.inPit) / 0.8); sc = 1 - k * 0.65; alpha = 1 - k * 0.7; }
    const so = 0.05 + air * 0.35 + (carried ? 0.12 : 0);
    R.trailPts = R.trailPts || []; if (frameN % 2 === 0) { R.trailPts.push([p.x, p.y, a]); if (R.trailPts.length > 7) R.trailPts.shift(); }
    const vel = b.getLinearVelocity(), fast = Math.hypot(vel.x, vel.y) > 3.5 || R.airborne > 0;
    if (fast && !R.inPit) { R.trailPts.forEach((q, k) => { ctx.save(); ctx.globalAlpha = 0.06 + k * 0.03; ctx.translate(q[0], q[1]); ctx.rotate(q[2]); ctx.fillStyle = TC(i).light; ctx.fillRect(-R.hl, -R.hw, R.hl * 2, R.hw * 2); ctx.restore(); }); }
    const mine = R.parts.filter(q => q.attached && q.body === b && q.key !== 'lifter'); // forks are drawn first, under everything
    // shadow
    const jo = joltOf(R), squash = () => { if (jo && jo[2] > 0) { const s = jo[2], nx = jo[3], ny = jo[4]; ctx.transform(1 - s * nx * nx + s * 0.5 * ny * ny, -1.5 * s * nx * ny, -1.5 * s * nx * ny, 1 - s * ny * ny + s * 0.5 * nx * nx, 0, 0); } };   // flattened against the wall for a moment
    ctx.save(); ctx.translate(p.x + so, p.y + so); squash(); ctx.rotate(a); ctx.scale(sc, sc); ctx.fillStyle = `rgba(20,14,8,${0.28 - air * 0.12})`;
    for (const q of mine) { path(q.verts); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x + (jo ? jo[0] : 0), p.y + (jo ? jo[1] : 0)); squash(); ctx.rotate(a); ctx.scale(sc, sc);
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
      if (R.chassis.cracks && R.chassis.cracks.length) drawCracks(R.chassis.cracks, true); // cracks in the shell show through the top plate
      if (R.chassis.grooves && R.chassis.grooves.length) drawGrooves(R.chassis.grooves, R.chassis.attached); // T41: so do saw cuts in the shell
      if (R.fo) drawFoRobot(R, i);   // T68 (switch off: R.fo is never set)
      drawTop(R, i); drawLamps(R);
      if (R.module && R.mod !== 'tow') { const [ic, col] = MOD_ICON[R.mod] || ['?', '#999'], [mx, my] = R.module.lp, on = R.module.hp > 0 && !(R.modOff > 0); ctx.fillStyle = on ? col : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(mx, my, 0.065, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.save(); ctx.translate(mx, my); ctx.rotate(-a); ctx.fillStyle = on ? '#fff' : '#777'; ctx.font = `700 ${0.08}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ic, 0, 0.004); ctx.restore(); }
    }
    if (R.flipped) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `600 ${0.1}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.fillText('UNDERSIDE', 0, 0.035); }
    if (R.module && R.mod === 'tow') drawWinch(R, a);   // lid on or off, even upside down: players can see who has the Tow cable
    ctx.restore();
    if (R.blade && R.blade.attached && !R.inPit) drawBlade(R.blade, R);
    if (R.buzz && R.buzz.attached && !R.inPit) { const bp = R.buzz.body.getPosition(), cp = R.body.getWorldPoint(planck.Vec2(R.hl - 0.02, 0)); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(bp.x, bp.y); ctx.stroke(); drawBuzz(R.buzz, R); }
    if (R.tether && !R.inPit) { const T = R.tether, a1 = R.body.getPosition(), a2 = T.body.getWorldPoint(planck.Vec2(T.lp[0], T.lp[1])); ctx.strokeStyle = '#3B2F22'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = 0.018; ctx.setLineDash([0.04, 0.03]); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt'; ctx.save(); ctx.translate(a2.x, a2.y); ctx.rotate(Math.atan2(a2.y - a1.y, a2.x - a1.x)); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5; ctx.beginPath(); ctx.moveTo(0.06, 0); ctx.lineTo(-0.04, -0.04); ctx.lineTo(-0.02, 0); ctx.lineTo(-0.04, 0.04); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (R.flailArm && !R.inPit) { if (R.ball && R.ball.key === 'whip') { drawFlail(R); if (R.ball.attached) drawWhip(R); } else { drawFlail(R); if (R.ball && R.ball.attached) { if (R.ball.key === 'chainend') drawChainEnd(R.ball); else drawBall(R.ball); } } }   // (T71b: Mauler's whip)   // (T71a: Wrecker's broken chain end)
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
      // (the grapple / tow cable is drawn by drawTows, over all robots)
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
    const wp = part.warp ? part.warp / 0.45 : 0, fa = part.foldA || 0, fx = Math.cos(fa), fy = Math.sin(fa), sq = 1 - 0.42 * wp;
    const W = (x, y) => { const d = x * fx + y * fy; return d > 0 ? [x - (1 - sq) * d * fx, y - (1 - sq) * d * fy] : [x, y]; }; // the folded half, foreshortened
    if (w > 0.3) { const o = wp * 0.025; ctx.fillStyle = `rgba(220,222,215,${0.25 * w})`; ctx.beginPath(); ctx.arc(Math.cos(a + fa) * o, Math.sin(a + fa) * o, 0.17, 0, 6.29); ctx.fill();
      if (wp > 0.15) { ctx.strokeStyle = `rgba(232,197,71,${0.3 + 0.4 * w})`; ctx.lineWidth = PX * 2; ctx.setLineDash([PX * 5, PX * 4]); ctx.beginPath(); ctx.arc(0, 0, 0.15 * (1 - 0.42 * wp * 0.5), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); } } // the wobble track
    ctx.rotate(a); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath();
    for (let k = 0; k < 24; k++) { const t = k / 24 * 6.283, r = k % 2 ? 0.15 : 0.125, [x, y] = W(Math.cos(t) * r, Math.sin(t) * r); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (wp > 0.05) { ctx.fillStyle = `rgba(20,14,8,${0.18 * wp})`; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const t = fa - Math.PI / 2 + k / 12 * Math.PI, [x, y] = W(Math.cos(t) * 0.14, Math.sin(t) * 0.14); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); // the tipped half in shade
      ctx.strokeStyle = `rgba(14,9,5,${0.5 + 0.4 * wp})`; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(-fy * 0.15, fx * 0.15); ctx.lineTo(fy * 0.15, -fx * 0.15); ctx.stroke();
      ctx.strokeStyle = `rgba(255,248,235,${0.3 + 0.3 * wp})`; ctx.lineWidth = PX * 1.3; ctx.beginPath(); ctx.moveTo(-fy * 0.15 - fx * 0.01, fx * 0.15 - fy * 0.01); ctx.lineTo(fy * 0.15 - fx * 0.01, -fx * 0.15 - fy * 0.01); ctx.stroke(); } // the fold
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
    if (R.ball && R.ball.attached && R.ball.key !== 'whip') {   // (T71b: Mauler's whip draws its own chain)
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
    if (part.attached && part.robot && part.robot.foShellCrack) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.6; ctx.beginPath(); ctx.moveTo(-r1 * 1.1, -0.01); ctx.lineTo(-r1 * 0.4, 0.02); ctx.lineTo(0, -0.015); ctx.lineTo(r1 * 0.45, 0.02); ctx.lineTo(r1 * 1.1, 0); ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,235,0.6)'; ctx.lineWidth = PX * 1.2; ctx.stroke(); }   // T71b: Mauler's spiked shell cracking
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
      const J = R.foJab ? L.FLYOFF.Thumper : null; // T71a: the head is gone: a short jagged handle that stabs
      let s = 0; if (R.swing > 0) s = 1 - R.swing / (J ? J.swingT : 0.2); else if (R.recover > 0) s = R.recover / (J ? J.recT : 0.6);
      const hx = -0.12 + (hl + (J ? 0.3 : 0.44)) * s, k = 1 + 0.55 * Math.sin(Math.PI * s), ab = R.armBend || 0, kx = -0.25 + (hx + 0.25) * 0.45, ex = kx + (hx - kx) * Math.cos(ab), ey = (hx - kx) * Math.sin(ab); // bent handle: kinked partway along
      ctx.strokeStyle = INK; ctx.lineWidth = 0.07 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-0.25, 0); ctx.lineTo(kx, 0); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = 0.045 * k; ctx.stroke(); ctx.lineCap = 'butt';
      if (Math.abs(ab) > 0.03) { ctx.strokeStyle = 'rgba(14,9,5,0.8)'; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(kx, -0.035 * k); ctx.lineTo(kx, 0.035 * k); ctx.stroke(); }
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(ab); ctx.scale(k, k);
      if (J) { ctx.scale(1.7, 1.7); ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2 / k; path([[-0.03, -0.035], [0.03, -0.03], [0.06, -0.01], [0.035, 0.0], [0.07, 0.02], [0.03, 0.035], [-0.03, 0.035]]); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.ellipse(0.02, 0, 0.012, 0.022, 0, 0, 6.29); ctx.fill(); stumpSparks(0.06, 0); }   // the torn end of the tube
      else { if (R.foLoose) { ctx.translate(0.015, 0.03); ctx.rotate(0.22 + Math.sin(performance.now() / 40) * 0.05); }   // (T71a: the head wobbles loose before it flies off)
      ctx.fillStyle = '#B9BBB4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2 / k; path([[-0.05, -0.16], [0.06, -0.12], [0.06, 0.12], [-0.05, 0.16], [-0.02, 0]]); ctx.fill(); ctx.stroke(); }
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
      const w = s.wheel; if (!w || !w.attached) { ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(s.lp[0], s.side * (R.hw - 0.02), 0.025, 0, 6.29); ctx.fill();
        if (R.fo) { const hx = s.lp[0] * 0.8, hy = s.side * (R.hw - 0.04), ex = hx + 0.03, ey = s.side * (R.hw + 0.12), t = performance.now() / 1000; // T69: a sparking leg stump (T71a: bolder: a thick torn stump, wires, a scorch mark, big sparks)
          ctx.fillStyle = 'rgba(20,14,8,0.45)'; ctx.beginPath(); ctx.ellipse(hx, s.side * (R.hw - 0.09), 0.1, 0.06, 0, 0, 6.29); ctx.fill(); // scorch on the hull
          ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 0.075; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = '#6F7169'; ctx.lineWidth = 0.045; ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = '#17120D'; path([[ex - 0.045, ey - s.side * 0.01], [ex - 0.02, ey + s.side * 0.035], [ex + 0.0, ey + s.side * 0.012], [ex + 0.025, ey + s.side * 0.04], [ex + 0.045, ey - s.side * 0.01]]); ctx.fill(); // torn end
          for (const [c, dx] of [['#D8402F', -0.015], ['#2E6DB4', 0.015]]) { ctx.strokeStyle = c; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(ex + dx, ey); ctx.quadraticCurveTo(ex + dx * 3, ey + s.side * 0.06, ex + dx * 4 + Math.sin(t * 9 + dx * 99) * 0.01, ey + s.side * 0.08); ctx.stroke(); } // hanging wires
          stumpSparks(ex, ey + s.side * 0.05); ctx.strokeStyle = '#FFE14D'; ctx.lineWidth = PX * 2.2; ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = (s.side > 0 ? 0.3 : 3.44) + k * 0.6 + Math.sin(t * 13 + k) * 0.2, r = 0.09 + 0.03 * Math.sin(t * 17 + k * 2); ctx.moveTo(ex + Math.cos(a) * 0.04, ey + s.side * 0.05 + Math.sin(a) * 0.04); ctx.lineTo(ex + Math.cos(a) * r, ey + s.side * 0.05 + Math.sin(a) * r); } ctx.stroke();
        }
        continue; }
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
  // a steel record: dark disc, grooves, coloured label; spinning ones blur, flying ones glow
  function drawRecord(q, spin, lifted) {
    const b = q.body, p = b.getPosition(), a = b.getAngle(), r = 0.21, w = spin != null && spin > 0 ? spin : Math.min(1, Math.abs(b.getAngularVelocity()) / 130), fly = q.state === 'fly';
    ctx.save(); ctx.translate(p.x, p.y);
    if (lifted) { ctx.fillStyle = 'rgba(20,14,8,0.2)'; ctx.beginPath(); ctx.arc(0.1, 0.1, r, 0, 6.29); ctx.fill(); ctx.scale(1.12, 1.12); }
    if (fly && w > 0.15) { ctx.strokeStyle = `rgba(255,90,200,${0.25 + 0.4 * w})`; ctx.lineWidth = PX * 4; ctx.beginPath(); ctx.arc(0, 0, r + 0.04, 0, 6.29); ctx.stroke(); const v = b.getLinearVelocity(); ctx.strokeStyle = `rgba(255,240,250,${0.25 * w})`; ctx.lineWidth = r * 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-v.x * 0.04, -v.y * 0.04); ctx.lineTo(0, 0); ctx.stroke(); ctx.lineCap = 'butt'; }
    ctx.rotate(a);
    const wp = q.warp ? q.warp / 0.45 : 0, fa = q.foldA || 0, fx = Math.cos(fa), fy = Math.sin(fa), sq = 1 - 0.42 * wp; // a warped record (T41): the half that folded looks shorter from above
    const W = (x, y) => { const d = x * fx + y * fy; return d > 0 ? [x - (1 - sq) * d * fx, y - (1 - sq) * d * fy] : [x, y]; };
    ctx.fillStyle = q.state === 'broken' || q.hp <= 0 ? '#3A3530' : '#1C1A18'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath();
    if (wp > 0.02) { for (let k = 0; k < 32; k++) { const t = k / 32 * 6.283, [x, y] = W(Math.cos(t) * r, Math.sin(t) * r); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); } else ctx.arc(0, 0, r, 0, 6.29);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,200,190,0.22)'; ctx.lineWidth = PX; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, r * (0.5 + k * 0.12), 0, 6.29); ctx.stroke(); }
    ctx.strokeStyle = '#D9DBD4'; ctx.lineWidth = PX * 1.8; for (let k = 0; k < 8; k++) { const t = k / 8 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(t) * r * 0.93, Math.sin(t) * r * 0.93); ctx.lineTo(Math.cos(t + 0.12) * r, Math.sin(t + 0.12) * r); ctx.stroke(); } // the saw teeth on the rim
    if (w > 0.3) { ctx.strokeStyle = `rgba(255,255,255,${0.45 * w})`; ctx.lineWidth = PX * 2.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, r * 0.78, k * 2.1, k * 2.1 + 0.9); ctx.stroke(); } }
    if (wp > 0.05) { ctx.fillStyle = `rgba(120,110,100,${0.25 * wp})`; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const t = fa - Math.PI / 2 + k / 12 * Math.PI, [x, y] = W(Math.cos(t) * r * 0.95, Math.sin(t) * r * 0.95); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); // the tipped half catches the light
      ctx.strokeStyle = `rgba(255,248,235,${0.45 + 0.4 * wp})`; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(-fy * r, fx * r); ctx.lineTo(fy * r, -fx * r); ctx.stroke(); // the fold
      if (w > 0.3 && wp > 0.15) { ctx.strokeStyle = `rgba(232,197,71,${0.3 + 0.4 * w})`; ctx.lineWidth = PX * 2; ctx.setLineDash([PX * 5, PX * 4]); ctx.beginPath(); ctx.arc(0, 0, r * (1 - 0.21 * wp), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); } } // the wobble track
    ctx.fillStyle = q.col || '#E8C547'; ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 1.2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-r * 0.2, -r * 0.05, r * 0.4, r * 0.03); ctx.fillStyle = '#E4E1DA'; ctx.beginPath(); ctx.arc(0, 0, 0.012, 0, 6.29); ctx.fill();
    ctx.restore();
  }
  function drawBrick(q, up) { // a Bricklayer's iron block (on its back, on the hook, or on the floor)
    const p = q.body.getPosition(), h = 0.17 * (up ? 1.18 : 1); if (up) { ctx.fillStyle = 'rgba(20,14,8,0.3)'; ctx.save(); ctx.translate(p.x + 0.16, p.y + 0.16); ctx.rotate(q.body.getAngle()); ctx.fillRect(-0.17, -0.17, 0.34, 0.34); ctx.restore(); }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(q.body.getAngle()); ctx.fillStyle = q.hp > 0 ? '#4A4A46' : '#2B2620'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; ctx.fillRect(-h, -h, 2 * h, 2 * h); ctx.strokeRect(-h, -h, 2 * h, 2 * h);
        ctx.fillStyle = HAZ; ctx.fillRect(-h, -h, 2 * h, h * 0.28); ctx.fillStyle = INK; for (let x = -h; x < h; x += 0.07) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x + 0.035, -h); ctx.lineTo(x + 0.015, -h + h * 0.28); ctx.lineTo(x - 0.02, -h + h * 0.28); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-h * 0.8, -h * 0.55, h * 1.6, 0.03); for (const [x, y] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.7], [0.7, 0.7]]) bolt(x * h, y * h); ctx.fillStyle = '#C9A227'; ctx.beginPath(); ctx.arc(0, h * 0.2, 0.025, 0, 6.29); ctx.fill(); ctx.restore(); }
  function drawAnchor(R) { // SLINGSHOT: the cable and bungee, the grapnel (in flight, biting into the wall, flying home), wall scars, the floor spike
    const st = R.l4, t = performance.now() / 1000, b = R.body, out = (x, y) => Math.abs(x) > Math.abs(y) ? Math.atan2(0, Math.sign(x)) : Math.atan2(Math.sign(y), 0);
    for (const s of st.scars || []) { ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(out(s[0], s[1])); ctx.fillStyle = 'rgba(20,14,8,0.55)'; ctx.beginPath(); ctx.ellipse(0.02, 0, 0.05, 0.1, 0, 0, 6.29); ctx.fill(); ctx.strokeStyle = 'rgba(20,14,8,0.6)'; ctx.lineWidth = PX * 1.5; for (const a of [-0.9, -0.3, 0.4, 1.0]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-Math.cos(a) * 0.16, Math.sin(a) * 0.16); ctx.stroke(); } ctx.restore(); }
    const wp = b.getWorldPoint(planck.Vec2(R.winch.lp[0], R.winch.lp[1])), rk = st.mode === 'free' && st.ret ? (S.t - st.ret.t0) / 0.5 : 1;
    if (st.spike) { // the floor spike: two claws dug in either side, a dust ring
      ctx.save(); ctx.translate(b.getPosition().x, b.getPosition().y); ctx.rotate(b.getAngle()); ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-R.hl * 0.6, sd * (R.hw + 0.02)); ctx.lineTo(-R.hl * 0.2, sd * (R.hw + 0.02)); ctx.lineTo(-R.hl * 0.45, sd * (R.hw + 0.2)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(120,100,80,0.45)'; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 3, PX * 5]); ctx.beginPath(); ctx.arc(0, 0, Math.hypot(R.hl, R.hw) + 0.12, 0, 6.29); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    let flying = st.mode === 'shot' && st.shot, end = flying ? st.shot.at : (st.mode === 'charge' || st.mode === 'fling' || st.mode === 'zip') && st.A ? st.A : null; // (T71c: zip)
    if (!end && rk < 1) { const e = rk * rk; end = [st.ret.from[0] + (wp.x - st.ret.from[0]) * e, st.ret.from[1] + (wp.y - st.ret.from[1]) * e]; flying = true; // after it lets go the grapnel flies home on a slack cable
      ctx.strokeStyle = 'rgba(43,33,24,0.8)'; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(wp.x, wp.y); const mx = (wp.x + end[0]) / 2 + 0.25 * (1 - rk), my = (wp.y + end[1]) / 2 + 0.25 * (1 - rk); ctx.quadraticCurveTo(mx, my, end[0], end[1]); ctx.stroke(); }
    if (!end) return;
    if (!flying || st.mode === 'shot') { // the cable: steel to the grapnel, and the bungee section near the robot, thinner and redder the more it is stretched
      const ten = st.mode === 'charge' || st.mode === 'fling' ? Math.min(1, st.E / 3400) : 0, L1 = Math.hypot(end[0] - wp.x, end[1] - wp.y) || 1, ux = (end[0] - wp.x) / L1, uy = (end[1] - wp.y) / L1, bl = R.foZip ? 0 : Math.min(L1, 0.9 + 0.9 * ten); // (T71c: no bungee: steel cable all the way)
      ctx.strokeStyle = INK; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(wp.x + ux * bl, wp.y + uy * bl); ctx.lineTo(end[0], end[1]); ctx.stroke(); ctx.strokeStyle = '#D9DBD4'; ctx.lineWidth = 0.015; ctx.setLineDash([0.05, 0.03]); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 0.09 - 0.045 * ten; ctx.beginPath(); ctx.moveTo(wp.x, wp.y); ctx.lineTo(wp.x + ux * bl, wp.y + uy * bl); ctx.stroke();
      ctx.strokeStyle = ten > 0.8 && Math.sin(t * 30) > 0 ? '#FF5A3C' : `rgb(${200 + 55 * ten},${110 - 60 * ten},40)`; ctx.lineWidth = 0.06 - 0.035 * ten; ctx.stroke(); ctx.lineCap = 'butt';
      if (st.mode === 'charge') { ctx.strokeStyle = 'rgba(255,90,60,0.35)'; ctx.lineWidth = PX * 2; ctx.setLineDash([PX * 6, PX * 4]); ctx.beginPath(); ctx.moveTo(wp.x, wp.y); ctx.lineTo(end[0], end[1]); ctx.lineDashOffset = -t * 0.6; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; } // the line it will fly down
    }
    const a = flying ? Math.atan2(end[1] - wp.y, end[0] - wp.x) : out(end[0], end[1]);
    ctx.save(); ctx.translate(end[0], end[1]); ctx.rotate(a); ctx.scale(1.3, 1.3);
    if (!flying) { ctx.fillStyle = 'rgba(232,197,71,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 0.2 + 0.03 * Math.sin(t * 12), 0, 6.29); ctx.fill(); } // impact flash ring
    ctx.fillStyle = '#4A4A46'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4 / 1.3;
    ctx.beginPath(); ctx.moveTo(0.1, 0); ctx.lineTo(-0.02, -0.15); ctx.lineTo(-0.08, -0.13); ctx.lineTo(-0.02, -0.04); ctx.lineTo(-0.2, -0.04); ctx.lineTo(-0.2, 0.04); ctx.lineTo(-0.02, 0.04); ctx.lineTo(-0.08, 0.13); ctx.lineTo(-0.02, 0.15); ctx.closePath(); ctx.fill(); ctx.stroke(); // a three-pronged grapnel, point first
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-0.18, -0.03, 0.2, 0.015);
    ctx.fillStyle = '#D9DBD4'; ctx.beginPath(); ctx.arc(-0.2, 0, 0.035, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = Math.sin(t * 14) > 0 ? '#FF3B2B' : '#5A1A14'; ctx.beginPath(); ctx.arc(-0.09, 0, 0.022, 0, 6.29); ctx.fill();
    ctx.restore();
  }
  function drawL4(R, i) {
    const w = R.spec.weapon, b = R.body, t = performance.now() / 1000;
    if (w === 'mallet' && R.l4 && !R.inPit) drawMallet(R);
    if (w === 'hydra' && R.fo && !R.flipped) { // T69: the two side heads on short necks at the front corners; cut off: a sparking stump
      ctx.save(); const p = b.getPosition(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); const off = R.foHeadOff || [false, false], bob = Math.sin(t * 3) * 0.015;
      for (let k = 0; k < 2; k++) { const sg = k ? 1 : -1, mx = R.hl * 0.62, my = sg * R.hw * 0.62;
        if (!off[k]) { const hx = mx + 0.2 + bob, hy = my + sg * 0.12; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 0.075; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + 0.06, my + sg * 0.12, hx - 0.06, hy); ctx.stroke(); ctx.strokeStyle = '#6F746F'; ctx.lineWidth = 0.05; ctx.setLineDash([0.03, 0.01]); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
          ctx.save(); ctx.translate(hx, hy); ctx.rotate(sg * 0.5); hydraHead(1); ctx.restore(); }
        else { ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 0.075; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 0.06, my + sg * 0.05); ctx.stroke(); ctx.strokeStyle = '#6F746F'; ctx.lineWidth = 0.05; ctx.stroke(); ctx.lineCap = 'butt'; stumpSparks(mx + 0.07, my + sg * 0.06); }
        ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(mx, my, 0.045, 0, 6.29); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    if (w === 'hydra' && R.arms) {
      const raised = R.l4.mode === 'reach';
      drawArm(R, R.arms, ['#8C8F86', '#9A9C94', '#5B5E57'], '#FFB020', raised);
      const h = R.arms[2]; if (h.attached) onBody(h, () => { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const y of [-0.08, 0, 0.08]) { ctx.beginPath(); ctx.moveTo(0.15, y - 0.025); ctx.lineTo(0.21, y); ctx.lineTo(0.15, y + 0.025); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.fillStyle = raised ? '#FF3B2B' : '#5A1A14'; ctx.beginPath(); ctx.arc(0.02, 0, 0.025, 0, 6.29); ctx.fill(); if (raised) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(0.02, 0, 0.07, 0, 6.29); ctx.fill(); ctx.globalAlpha = 1; } });
      if (raised && R.l4.goal) { const g = b.getWorldPoint(planck.Vec2(R.l4.goal[0] + 0.12, R.l4.goal[1])); ctx.strokeStyle = 'rgba(255,59,43,0.7)'; ctx.lineWidth = PX * 2; ctx.setLineDash([PX * 4, PX * 3]); ctx.beginPath(); ctx.arc(g.x, g.y, 0.12 + 0.04 * Math.sin(t * 30), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (w === 'corkscrew' && R.auger && R.auger.attached) {
      const a1 = b.getWorldPoint(planck.Vec2(R.hl - 0.05, 0)), a2 = R.auger.body.getPosition(); ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
      if (R.foSmooth) onBody(R.auger, () => drawSmoothBar(R)); else // T71b: the screw thread is gone: a smooth hex bar
      onBody(R.auger, () => { drawPart(R.auger, '#B9BBB4', R, () => { const ph = (R.l4.spin || 0) * 0.02 % 0.06; ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = PX * 2.4; for (let x = -0.12 + ph; x < 0.36; x += 0.06) { ctx.beginPath(); ctx.moveTo(x, -0.1); ctx.lineTo(x + 0.05, 0.1); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-0.1, -0.02, 0.4, 0.015); });
        if (R.fo && R.foFray) { const t = performance.now() / 1000; ctx.lineCap = 'round'; for (const [w, c] of [[PX * 5, INK], [PX * 3, '#D9DBD4']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-0.06, 0.09); ctx.quadraticCurveTo(-0.02, 0.2 + Math.sin(t * 20) * 0.02, -0.14, 0.24); ctx.quadraticCurveTo(-0.22, 0.22, -0.18, 0.15); ctx.stroke(); } ctx.lineCap = 'butt'; } }); // (T71b: a strand of thread peels loose before it strips)
      if (R.grab && R.l4.mode === 'anchor') { const p = R.auger.body.getWorldPoint(planck.Vec2(0.3, 0)); if (Math.random() < 0.7) spawn({ t: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 0.3, max: 0.3, col: '#C9A227' }); }
    }
    if (w === 'trebuchet' && R.foBarrow) { const p = b.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.translate(-0.1 * R.hl, 0); drawArmStump(R, t); ctx.restore(); } // T71c: the arm has snapped: its stump and the gas ram
    else if (w === 'trebuchet') {
      const k = R.armAnim > 0 ? 1 - R.armAnim / 0.55 : 0, sw = Math.sin(Math.PI * Math.min(1, k * 1.6)), ang = Math.PI * Math.min(1, k * 1.8), sc = 1 + 0.6 * sw, ch = R.fx.charge || 0;
      ctx.save(); const p = b.getPosition(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.translate(-0.1 * R.hl, 0);
      ctx.rotate(ang); ctx.scale(sc, sc); ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.12, 0); ctx.lineTo(R.hl + 0.12, 0); ctx.stroke(); ctx.strokeStyle = R.tarm.hp > 0 ? '#C9A227' : '#55524C'; ctx.lineWidth = 0.045; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.fillRect(-0.24, -0.11, 0.14, 0.22); ctx.strokeRect(-0.24, -0.11, 0.14, 0.22); // counterweight
      if (R.foCrack === 1) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.4 / sc; ctx.beginPath(); ctx.moveTo(0.06, -0.035); ctx.lineTo(0.09, 0.0); ctx.lineTo(0.07, 0.035); ctx.stroke(); } // (T71c: a crack at the pivot)
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
      ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(b.getAngle());
      if (R.foCrack > 1) { // T69: the coil has unwound: a thin bare magnet core, two loose copper ends
        const hw2 = R.hw * 0.55, t2 = performance.now() / 1000; // (T71a: bolder: the empty bobbin, the core a thin rod, the wire unwound off the side of the hull)
        ctx.fillStyle = '#17120D'; ctx.fillRect(-0.3, -hw2, 0.2, 2 * hw2); // where the coil sat: an empty dark bay
        ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; for (const sg of [-1, 1]) { ctx.fillRect(-0.3, sg > 0 ? hw2 - 0.025 : -hw2, 0.2, 0.025); ctx.strokeRect(-0.3, sg > 0 ? hw2 - 0.025 : -hw2, 0.2, 0.025); } // bobbin flanges
        ctx.fillStyle = f > 0.5 ? '#9BD4FF' : '#C9CBC4'; ctx.fillRect(-0.212, -hw2, 0.024, 2 * hw2); ctx.strokeRect(-0.212, -hw2, 0.024, 2 * hw2); // the bare core: a thin rod
        ctx.lineCap = 'round'; const wire = []; for (let k = 0; k <= 40; k++) { const q = k / 40; wire.push([-0.2 + Math.cos(q * 19) * 0.04 + q * 0.18, hw2 * 0.6 + q * (R.hw * 1.2) + Math.sin(q * 19) * 0.035]); }
        for (const [w2, c] of [[PX * 5, INK], [PX * 3, '#E0903F']]) { ctx.strokeStyle = c; ctx.lineWidth = w2; ctx.beginPath(); wire.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-0.2, -hw2 * 0.8); ctx.quadraticCurveTo(-0.12, -hw2 * 1.2, -0.06, -hw2 * 0.95); ctx.stroke(); } ctx.lineCap = 'butt'; // the unwound wire hangs out over the side
        if (Math.sin(t2 * 21) > 0.2) stumpSparks(-0.06, -hw2 * 0.95);
      } else { ctx.strokeStyle = R.coil.hp > 0 ? (f > 0.5 ? '#9BD4FF' : '#B87333') : '#3a3530'; ctx.lineWidth = PX * 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-0.1 - k * 0.04, 0, 0.02, R.hw * 0.55, 0, 0, 6.29); ctx.stroke(); }
        if (R.foCrack) { ctx.strokeStyle = '#E0903F'; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(-0.1, R.hw * 0.55); ctx.quadraticCurveTo(-0.02, R.hw * 0.75, 0.05, R.hw * 0.6); ctx.stroke(); } } // (T69: a strand comes loose before the coil unwinds)
      ctx.restore();
    }
    if (w === 'orbiter' && R.discs) {
      const c0 = b.getPosition(), spin = R.fx.spin || 0;
      if (R.l4.mode !== 'docked') { ctx.strokeStyle = `rgba(255,90,60,${0.15 + 0.25 * Math.min(1, spin)})`; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(c0.x, c0.y, R.r0 + (R.l4.ext || 0), 0, 6.29); ctx.stroke(); }
      for (const q of R.discs) if (q.attached) { const p = q.body.getPosition(); if (R.l4.mode !== 'docked') { ctx.strokeStyle = INK; ctx.lineWidth = 0.045; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = 0.022; ctx.stroke(); } drawBuzz(q, { buzzW: q.spin, buzzMax: 95, buzzR: 0.13 / 0.15 * 0.14 }); }
      const a = R.rotor.getAngle(); ctx.save(); ctx.translate(c0.x, c0.y); ctx.rotate(a);
      if (R.foSpin) drawBareHub(R, t); else { if (R.foCrack === 1) { ctx.translate(0.012, -0.01); ctx.rotate(0.3); } // T71c: the lock cap (it slips before it shears off), and without it the bare hub
      ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.1, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = HAZ; ctx.fillRect(-0.02, -0.09, 0.04, 0.18);
      if (R.foCrack === 1) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(0.04, -0.09); ctx.lineTo(0.06, -0.03); ctx.lineTo(0.03, 0.02); ctx.stroke(); } }
      ctx.restore();
    }
    if (w === 'jukebox' && R.records) {
      const st = R.l4, tp = b.getWorldPoint(planck.Vec2(st.tableAt[0], st.tableAt[1]));
      // turntable platter on the nose
      ctx.fillStyle = '#2B2620'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(tp.x, tp.y, 0.235, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = PX * 1.2; ctx.beginPath(); ctx.arc(tp.x, tp.y, 0.22, 0, 6.29); ctx.stroke();
      // the stack on its back (bottom first), then the record on the loader or the platter
      for (const q of R.records.filter(x => x.state === 'stack' && x.attached && !x.gone).sort((x, y) => x.idx - y.idx)) { const k = q.idx * 0.012; ctx.save(); ctx.translate(-k, -k); drawRecord(q, 0); ctx.restore(); }
      if (R.fo && R.foCrate !== 'gone') { const sp = b.getWorldPoint(planck.Vec2(st.stackAt[0], st.stackAt[1])); ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(b.getAngle() + (R.foTilt ? 0.18 : 0)); drawCrate(0.25, true); ctx.restore(); }   // T68: the record crate (its rim; the records sit in it)
      for (const q of R.records) if ((q.state === 'table' || q.state === 'load') && q.attached) drawRecord(q, q.state === 'table' ? st.rpm : 0, q.state === 'load');
      // the tone-arm loader: pivot on the side, arm to wherever it is carrying the record
      if (R.loader.hp > 0) {
        const pv = b.getWorldPoint(planck.Vec2(R.loader.lp[0], R.loader.lp[1])), at = st.armAt ? b.getWorldPoint(planck.Vec2(st.armAt[0], st.armAt[1])) : b.getWorldPoint(planck.Vec2(st.stackAt[0] + 0.12, st.stackAt[1] + 0.12));
        ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(at.x, at.y); ctx.stroke(); ctx.strokeStyle = '#D9DBD4'; ctx.lineWidth = 0.026; ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(pv.x, pv.y, 0.055, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C9A227'; ctx.fillRect(at.x - 0.03, at.y - 0.03, 0.06, 0.06);
      }
    }
    if (w === 'bola' && R.launcher) {
      const lp = b.getWorldPoint(planck.Vec2(R.launcher.lp[0], R.launcher.lp[1])), a = R.bolaA || b.getAngle(), ok = R.launcher.hp > 0;
      if (R.gSaw && R.gSaw.attached) { const bp = R.gSaw.body.getPosition(), cp = b.getWorldPoint(planck.Vec2(R.hl - 0.02, 0)); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(bp.x, bp.y); ctx.stroke(); drawBuzz(R.gSaw, { buzzW: R.gSaw.spin, buzzMax: 110, buzzR: 0.15 }); }
      // the launcher: a turret with a bola loaded (two balls and a cord) while it is ready
      if (R.foFlick) { ctx.save(); ctx.translate(lp.x, lp.y); ctx.rotate(b.getAngle()); drawBolaBay(R, t); ctx.restore(); } else { // T71c: the turret is gone: its ring and the open magazine
      ctx.save(); ctx.translate(lp.x, lp.y); ctx.rotate(a); if (R.foTilt) { ctx.translate(0.02, 0.025); ctx.rotate(0.22 * Math.sin(t * 17)); } ctx.fillStyle = ok ? '#8C8F86' : '#55524C'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; rr(0.02, -0.06, 0.3, 0.12, 0.02); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 0.12, 0, 6.29); ctx.fill(); ctx.stroke();
      if (ok && R.cool <= 0 && !(R.bolas && R.bolas.length)) { const sp = t * 6; ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(0.2 + Math.cos(sp) * 0.09, Math.sin(sp) * 0.09); ctx.lineTo(0.2 - Math.cos(sp) * 0.09, -Math.sin(sp) * 0.09); ctx.stroke(); for (const sg of [1, -1]) { ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0.2 + sg * Math.cos(sp) * 0.09, sg * Math.sin(sp) * 0.09, 0.035, 0, 6.29); ctx.fill(); ctx.stroke(); } }
      ctx.restore(); }
      // bolas in flight or wrapped: the cord and the two balls
      for (const B of R.bolas || []) { const p0 = B.balls[0].getPosition(), p1 = B.balls[1].getPosition();
        if (B.joint) { ctx.strokeStyle = '#3B2F22'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = 0.014; ctx.setLineDash([0.03, 0.02]); ctx.stroke(); ctx.setLineDash([]); }
        for (const q of [p0, p1]) { ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; ctx.beginPath(); ctx.arc(q.x, q.y, 0.055, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(q.x - 0.015, q.y - 0.015, 0.018, 0, 6.29); ctx.fill(); } }
    }
    if (w === 'scav' && R.intake) { // SCAVENGER: a big intake bell at the nose, a glass hopper dome with the junk tumbling in it, a fat air cannon down the middle
      const st = R.l4, a0 = b.getAngle(), M = b.getWorldPoint(planck.Vec2(R.hl + 0.24, 0)), ok = R.intake.hp > 0;
      if (R.fx.suck) { for (let k = 0; k < 4; k++) { const r = 1.6 - ((t * 2.4 + k / 4) % 1) * 1.4; ctx.strokeStyle = `rgba(155,212,255,${0.65 * (1 - r / 1.6)})`; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(M.x, M.y, r, a0 - 0.75, a0 + 0.75); ctx.stroke(); }
        for (let k = 0; k < 6; k++) { const ph = (t * 1.8 + k / 6) % 1, aa = a0 + Math.sin(k * 2.3) * 0.6, rr2 = 1.3 * (1 - ph); ctx.fillStyle = `rgba(200,190,170,${0.6 * ph})`; ctx.beginPath(); ctx.arc(M.x + Math.cos(aa) * rr2, M.y + Math.sin(aa) * rr2, 0.02, 0, 6.29); ctx.fill(); } } // dust streaming in
      ctx.save(); const p0 = b.getPosition(); ctx.translate(p0.x, p0.y); ctx.rotate(a0);
      // the intake bell over the scoop: a wide dark mouth narrowing into a throat
      ctx.fillStyle = ok ? '#5B5E57' : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4;
      ctx.beginPath(); ctx.moveTo(R.hl + 0.2, -R.hw * 0.85); ctx.lineTo(R.hl + 0.2, R.hw * 0.85); ctx.lineTo(R.hl * 0.25, R.hw * 0.3); ctx.lineTo(R.hl * 0.25, -R.hw * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.moveTo(R.hl + 0.17, -R.hw * 0.72); ctx.lineTo(R.hl + 0.17, R.hw * 0.72); ctx.lineTo(R.hl * 0.35, R.hw * 0.18); ctx.lineTo(R.hl * 0.35, -R.hw * 0.18); ctx.closePath(); ctx.fill();
      if (ok) { ctx.save(); ctx.translate(R.hl * 0.5, 0); ctx.rotate(t * (R.fx.suck ? 30 : 4)); ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = PX * 2.2; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.06, 0.02, 0.09, 0.09); ctx.stroke(); } ctx.restore(); } // the fan in the throat
      // the hopper: a glass dome over the back with the junk in it
      const hx = -R.hl * 0.45, hr = Math.min(R.hw * 0.62, R.hl * 0.42);
      ctx.fillStyle = 'rgba(30,26,22,0.85)'; ctx.beginPath(); ctx.arc(hx, 0, hr, 0, 6.29); ctx.fill();
      (R.hopper || []).forEach((d, n) => { const an = n * 2.1 + t * (R.fx.suck ? 3 : 0.5), rr3 = hr * (0.25 + 0.45 * ((n * 0.37) % 1)); ctx.save(); ctx.translate(hx + Math.cos(an) * rr3, Math.sin(an) * rr3); ctx.rotate(an * 1.7); ctx.fillStyle = d.kind === 'wheel' ? '#2A2622' : d.key === 'record' ? (d.col || '#E8C547') : d.kind === 'armour' ? '#8A8C84' : '#77796F'; ctx.strokeStyle = INK; ctx.lineWidth = PX; ctx.fillRect(-0.045, -0.03, 0.09, 0.06); ctx.strokeRect(-0.045, -0.03, 0.09, 0.06); ctx.restore(); });
      ctx.fillStyle = 'rgba(190,230,255,0.22)'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(hx, 0, hr, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(hx - hr * 0.35, -hr * 0.4, hr * 0.35, hr * 0.15, -0.5, 0, 6.29); ctx.fill();
      if (R.foCrack) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(hx - hr * 0.1, -hr); ctx.lineTo(hx + hr * 0.08, -hr * 0.45); ctx.lineTo(hx - hr * 0.12, -hr * 0.1); ctx.lineTo(hx + hr * 0.1, hr * 0.3); ctx.lineTo(hx - hr * 0.05, hr); ctx.moveTo(hx + hr * 0.08, -hr * 0.45); ctx.lineTo(hx + hr * 0.6, -hr * 0.6); ctx.stroke(); } // T68: the hopper glass cracks
      if (R.foCrack > 1) { ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(hx, 0); ctx.arc(hx, 0, hr, Math.PI - 0.55, Math.PI + 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); } // ... and breaks open at the back: the junk poured out there
      // the air cannon: a fat barrel from the hopper over the throat to the nose, kicks back when it fires
      const cok = R.cannon.hp > 0, kick = Math.max(0, 0.25 - (S.t - (st.last || -9))) * 0.4;
      ctx.fillStyle = cok ? '#4A4A46' : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; rr(hx + hr * 0.5 - kick, -0.07, R.hl + 0.32 - hx - hr * 0.5, 0.14, 0.03); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(hx + hr * 0.6 - kick, -0.055, R.hl, 0.022); ctx.fillStyle = HAZ; ctx.fillRect(R.hl + 0.22 - kick, -0.07, 0.05, 0.14); ctx.strokeRect(R.hl + 0.22 - kick, -0.07, 0.05, 0.14);
      ctx.fillStyle = cok ? '#47A8FF' : '#3a3530'; for (const y of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-R.hl * 0.05, y * R.hw * 0.62, 0.12, 0.06, 0, 0, 6.29); ctx.fill(); ctx.stroke(); } // air tanks
      if (S.t - (st.last || -9) < 0.12) { ctx.fillStyle = 'rgba(230,240,255,0.85)'; ctx.beginPath(); ctx.arc(R.hl + 0.36, 0, 0.16, 0, 6.29); ctx.fill(); }
      ctx.restore();
    }
    if (w === 'bricks' && R.bricks) { // BRICKLAYER: iron blocks on its back, a big slewing crane (cab, counterweight, lattice boom, hook)
      const st = R.l4;
      for (const q of R.bricks.filter(x => x.state === 'stack' && x.attached && !x.gone).sort((x, y) => x.idx - y.idx)) { const k = q.idx * 0.016, ln = R.foLean ? q.idx * 0.045 : 0; ctx.save(); ctx.translate(-k - ln, -k + ln * 0.6); drawBrick(q, false); ctx.restore(); }   // (T67: a leaning stack, about to topple, slides over)
      const ok = R.crane.hp > 0, base = b.getWorldPoint(planck.Vec2(R.crane.lp[0], R.crane.lp[1])), rest = [-0.1 * R.hl, 0.55 * R.hw], at = st.armAt || rest, hk = b.getWorldPoint(planck.Vec2(at[0], at[1]));
      const ang = Math.atan2(hk.y - base.y, hk.x - base.x), bl = Math.max(0.3, Math.hypot(hk.x - base.x, hk.y - base.y));
      ctx.save(); ctx.translate(base.x, base.y); ctx.rotate(ang);
      ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.fillRect(-0.36, -0.13, 0.17, 0.26); ctx.strokeRect(-0.36, -0.13, 0.17, 0.26); ctx.fillStyle = HAZ; ctx.fillRect(-0.36, -0.13, 0.04, 0.26); // counterweight
      ctx.fillStyle = ok ? HAZ : '#55524C'; ctx.beginPath(); ctx.moveTo(-0.05, -0.075); ctx.lineTo(bl, -0.03); ctx.lineTo(bl, 0.03); ctx.lineTo(-0.05, 0.075); ctx.closePath(); ctx.fill(); ctx.stroke(); // the boom
      ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; for (let s2 = 0.05, k = 0; s2 < bl - 0.04; s2 += 0.08, k++) { const w0 = 0.075 - 0.045 * s2 / bl, w1 = 0.075 - 0.045 * (s2 + 0.08) / bl; ctx.beginPath(); ctx.moveTo(s2, (k % 2 ? 1 : -1) * w0); ctx.lineTo(s2 + 0.08, (k % 2 ? -1 : 1) * w1); ctx.stroke(); }
      ctx.fillStyle = '#5B5E57'; ctx.lineWidth = PX * 2.2; rr(-0.2, -0.12, 0.2, 0.24, 0.03); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9BD4FF'; ctx.fillRect(-0.06, -0.08, 0.05, 0.16); ctx.strokeRect(-0.06, -0.08, 0.05, 0.16); // the cab and its window
      ctx.restore();
      if (st.carry && st.carry.attached) { const cp = st.carry.body.getPosition(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(hk.x, hk.y); ctx.lineTo(cp.x, cp.y); ctx.stroke(); }
      ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(hk.x, hk.y, 0.04, 0, 6.29); ctx.fill(); ctx.stroke(); bolt(base.x, base.y);
      if (st.mode === 'out' && st.to) { const g = b.getWorldPoint(planck.Vec2(st.to[0], st.to[1])); ctx.strokeStyle = 'rgba(255,176,32,0.85)'; ctx.lineWidth = PX * 2.5; ctx.setLineDash([PX * 4, PX * 3]); ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(b.getAngle()); ctx.strokeRect(-0.2, -0.2, 0.4, 0.4); ctx.beginPath(); ctx.moveTo(-0.08, 0); ctx.lineTo(0.08, 0); ctx.moveTo(0, -0.08); ctx.lineTo(0, 0.08); ctx.stroke(); ctx.restore(); ctx.setLineDash([]); } // where it will land
    }
    if (w === 'anchor' && R.winch) { // SLINGSHOT: a big harpoon gun down the middle (grapnel loaded when ready), the bungee drum, spikes along the prow
      const st = R.l4, p0 = b.getPosition(), a0 = b.getAngle(), ok = R.winch.hp > 0;
      ctx.save(); ctx.translate(p0.x, p0.y); ctx.rotate(a0);
      if (R.tool && R.tool.attached) { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; const edges = [[[R.hl, -R.hw * 0.95], [R.hl + 0.24, -R.hw * 0.25]], [[R.hl + 0.24, -R.hw * 0.25], [R.hl + 0.3, 0]], [[R.hl + 0.3, 0], [R.hl + 0.24, R.hw * 0.25]], [[R.hl + 0.24, R.hw * 0.25], [R.hl, R.hw * 0.95]]];
        for (const [[x0, y0], [x1, y1]] of edges) { const L0 = Math.hypot(x1 - x0, y1 - y0), nx = (y1 - y0) / L0, ny = -(x1 - x0) / L0, n = Math.max(1, Math.round(L0 / 0.09)); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, tx = (x1 - x0) / L0, ty = (y1 - y0) / L0; ctx.beginPath(); ctx.moveTo(x - tx * 0.03, y - ty * 0.03); ctx.lineTo(x + nx * 0.09, y + ny * 0.09); ctx.lineTo(x + tx * 0.03, y + ty * 0.03); ctx.closePath(); ctx.fill(); ctx.stroke(); } } }
      const gx = -0.1 * R.hl, loaded = ok && st.mode === 'free' && R.cool <= 0;
      ctx.fillStyle = ok ? '#4A4A46' : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; rr(gx, -0.065, R.hl * 1.05, 0.13, 0.03); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(gx + 0.04, -0.05, R.hl * 0.9, 0.02);
      if (loaded) { ctx.save(); ctx.translate(gx + R.hl * 1.05 + 0.08, 0); ctx.fillStyle = '#5B5E57'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(0.1, 0); ctx.lineTo(-0.02, -0.12); ctx.lineTo(-0.06, -0.1); ctx.lineTo(-0.02, -0.03); ctx.lineTo(-0.1, -0.03); ctx.lineTo(-0.1, 0.03); ctx.lineTo(-0.02, 0.03); ctx.lineTo(-0.06, 0.1); ctx.lineTo(-0.02, 0.12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } // the grapnel loaded in the muzzle
      // the bungee drum: red rubber coils, they spin while it winches
      const wx = R.winch.lp[0];
      if (R.foZip) drawBareDrum(R, wx, st.mode === 'zip' ? t * 6 : 0); else { // T71c: the bungee has snapped: a bare drum with steel cable, torn rubber ends
      ctx.fillStyle = ok ? '#5B5E57' : '#3a3530'; ctx.lineWidth = PX * 2.4; rr(wx - 0.11, -R.hw * 0.62, 0.22, R.hw * 1.24, 0.04); ctx.fill(); ctx.stroke();
      const spin = st.mode === 'charge' ? t * 12 : 0; ctx.strokeStyle = '#D24B3A'; ctx.lineWidth = PX * 3; for (let k = 0; k < 6; k++) { const y = -R.hw * 0.55 + ((k * 0.19 * R.hw + spin * 0.02) % (R.hw * 1.1)); ctx.beginPath(); ctx.moveTo(wx - 0.09, y); ctx.lineTo(wx + 0.09, y + 0.03); ctx.stroke(); }
      if (R.foFray) { ctx.strokeStyle = INK; ctx.lineWidth = PX * 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(wx - 0.05, R.hw * 0.6); ctx.quadraticCurveTo(wx - 0.15, R.hw * 0.8 + Math.sin(t * 15) * 0.03, wx - 0.22, R.hw * 0.7); ctx.stroke(); ctx.strokeStyle = '#D24B3A'; ctx.lineWidth = PX * 3; ctx.stroke(); ctx.lineCap = 'butt'; } } // (a frayed strand flaps before it snaps)
      ctx.restore();
    }
    if (w === 'pogo' && R.leg && !R.foNoJump) { // POGO: a big coil spring on the back, squeezed flatter as it charges; the landing marker while it crouches or flies
      const st = R.l4, p0 = b.getPosition(), a0 = b.getAngle(), ok = R.leg.hp > 0, k = R.fx.spring || 0;
      if ((st.mode === 'crouch' || st.mode === 'air') && R.enemy && R.enemy.alive) {
        const tg = st.mode === 'air' ? st.to : [R.enemy.body.getPosition().x + R.enemy.body.getLinearVelocity().x * 0.8, R.enemy.body.getPosition().y + R.enemy.body.getLinearVelocity().y * 0.8];
        ctx.strokeStyle = st.mode === 'air' ? 'rgba(255,59,43,0.9)' : `rgba(255,176,32,${0.4 + 0.5 * k})`; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 5, PX * 4]); ctx.beginPath(); ctx.arc(tg[0], tg[1], R.hl * 0.9, 0, 6.29); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(tg[0] - 0.15, tg[1]); ctx.lineTo(tg[0] + 0.15, tg[1]); ctx.moveTo(tg[0], tg[1] - 0.15); ctx.lineTo(tg[0], tg[1] + 0.15); ctx.stroke();
      }
      { ctx.save(); ctx.translate(p0.x, p0.y); ctx.rotate(a0); if (st.mode === 'air') { const air = Math.sin(Math.PI * Math.min(1, st.t / 0.8)); ctx.scale(1 + 0.28 * air, 1 + 0.28 * air); }
        const rOut = Math.min(R.hw, R.hl) * 0.78, turns = 5; ctx.fillStyle = '#2B2620'; ctx.beginPath(); ctx.arc(0, 0, rOut + 0.02, 0, 6.29); ctx.fill();
        ctx.strokeStyle = ok ? (k > 0.9 && Math.sin(t * 30) > 0 ? '#FF5A3C' : '#C9A227') : '#55524C'; ctx.lineWidth = PX * (3 + 2 * k); ctx.beginPath();
        for (let s2 = 0; s2 <= 1.0001; s2 += 0.01) { const r = rOut * (0.25 + 0.75 * s2) * (1 - 0.25 * k), an = s2 * turns * 6.2832; s2 ? ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r) : ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.stroke(); // the coil seen from above, squeezed tighter as it charges
        ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, rOut * 0.22, 0, 6.29); ctx.fill(); ctx.stroke(); bolt(0, 0);
        if (R.fo && !R.fo.off) { // T69: the steel casing over the spring (two halves bolted along a seam), a slot shows the coil; cracked before it bursts
          const rc = rOut + 0.025; ctx.fillStyle = '#A9ADA8'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.arc(0, 0, rc, 0, 6.29); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.arc(-rc * 0.25, -rc * 0.25, rc * 0.45, 0, 6.29); ctx.fill();
          ctx.fillStyle = '#2B2620'; ctx.fillRect(-rc * 0.55, -0.035, rc * 1.1, 0.07); ctx.strokeStyle = ok ? (k > 0.9 && Math.sin(t * 30) > 0 ? '#FF5A3C' : '#C9A227') : '#55524C'; ctx.lineWidth = PX * 2.6; for (let x = -rc * 0.5; x < rc * 0.5; x += 0.04) { ctx.beginPath(); ctx.moveTo(x, -0.03 * (1 - 0.4 * k)); ctx.lineTo(x + 0.02, 0.03 * (1 - 0.4 * k)); ctx.stroke(); } // the coil through the slot
          ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(0, -rc); ctx.lineTo(0, -0.035); ctx.moveTo(0, 0.035); ctx.lineTo(0, rc); ctx.stroke(); for (const y of [-0.7, -0.4, 0.4, 0.7]) { bolt(-0.03, y * rc); bolt(0.03, y * rc); }
          if (R.foCrack) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(rc * 0.2, -rc * 0.95); ctx.lineTo(rc * 0.35, -rc * 0.6); ctx.lineTo(rc * 0.25, -rc * 0.4); ctx.lineTo(rc * 0.5, -rc * 0.15); ctx.stroke(); }
        }
        ctx.restore(); }
    }
    if (w === 'pogo' && R.foNoJump) { // T69: casing burst, spring gone: an empty socket, a torn stub of the spring, its winch showing
      const p0 = b.getPosition(), rOut = Math.min(R.hw, R.hl) * 0.78; ctx.save(); ctx.translate(p0.x, p0.y); ctx.rotate(b.getAngle());
      ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, rOut + 0.02, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6F7169'; ctx.lineWidth = PX * 2; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rOut * 0.85, Math.sin(a) * rOut * 0.85); ctx.lineTo(Math.cos(a) * (rOut + 0.02), Math.sin(a) * (rOut + 0.02)); ctx.stroke(); } // the torn casing lugs
      ctx.strokeStyle = '#C9A227'; ctx.lineWidth = PX * 3.5; ctx.beginPath(); for (let s2 = 0; s2 <= 1.0001; s2 += 0.02) { const r = rOut * (0.22 + 0.25 * s2), an = s2 * 1.6 * 6.2832; s2 ? ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r) : ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.stroke(); // a stub of spring left on the mount
      ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, rOut * 0.22, 0, 6.29); ctx.fill(); ctx.stroke(); bolt(0, 0);
      ctx.fillStyle = '#4A4540'; ctx.fillRect(-rOut * 0.75, -0.05, rOut * 0.4, 0.1); ctx.strokeRect(-rOut * 0.75, -0.05, rOut * 0.4, 0.1); // the winch that squeezed it
      ctx.restore();
    }
    if (w === 'rail' && R.coil) { // RAILGUN: two long rails down the middle and out past the nose, a capacitor bank that glows as it charges, arcs when full
      const st = R.l4, p0 = b.getPosition(), a0 = b.getAngle(), k = R.fx.caps || 0, ok = R.coil.hp > 0, kick = Math.max(0, 0.2 - (S.t - (st.last || -9))) * 0.5;
      ctx.save(); ctx.translate(p0.x, p0.y); ctx.rotate(a0);
      for (const y of [-1, 0, 1]) { ctx.fillStyle = R.caps.hp > 0 ? '#2B2620' : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(-R.hl * 0.85, y * 0.13 - 0.05, R.hl * 0.45, 0.1, 0.04); ctx.fill(); ctx.stroke(); ctx.fillStyle = `rgba(71,168,255,${0.25 + 0.75 * k})`; ctx.fillRect(-R.hl * 0.82, y * 0.13 - 0.03, R.hl * 0.39 * k, 0.06); } // capacitors
      const x0 = -R.hl * 0.35 - kick, x1 = R.hl + 0.32 - kick;
      ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(x0, -0.1, x1 - x0, 0.2, 0.02); ctx.fill(); ctx.stroke();
      for (const y of [-0.065, 0.065]) { ctx.save(); if (R.foPeel) { ctx.translate(x0 + 0.02, y); ctx.rotate(Math.sign(y) * 0.16); ctx.translate(-x0 - 0.02, -y); } ctx.fillStyle = ok ? '#B87333' : '#55524C'; ctx.fillRect(x0 + 0.02, y - 0.02, x1 - x0 - 0.02, 0.04); ctx.strokeRect(x0 + 0.02, y - 0.02, x1 - x0 - 0.02, 0.04); ctx.restore(); } // the copper rails (T68: peeled apart once the clamp has burst)
      if (R.foPeel) { ctx.fillStyle = '#5B5E57'; for (const x of [x0 + 0.08, x0 + 0.2]) { ctx.fillRect(x, -0.1, 0.035, 0.05); ctx.fillRect(x, 0.05, 0.035, 0.05); } } // torn clamp stubs
      else for (let x = x0 + 0.08; x < x1 - 0.05; x += 0.12) { ctx.fillStyle = '#5B5E57'; ctx.fillRect(x, -0.1, 0.035, 0.2); } // clamps
      if (k > 0.95 && ok) { ctx.strokeStyle = 'rgba(190,230,255,0.9)'; ctx.lineWidth = PX * 1.6; for (let a = 0; a < 3; a++) { const x = x0 + 0.1 + ((t * 7 + a * 0.37) % 1) * (x1 - x0 - 0.15); ctx.beginPath(); ctx.moveTo(x, -0.045); ctx.lineTo(x + (Math.random() - 0.5) * 0.04, 0); ctx.lineTo(x, 0.045); ctx.stroke(); } } // arcs between the rails
      if (R.mag && R.mag.length && ok) { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.fillRect(x0 + 0.05, -0.03, 0.25, 0.06); ctx.strokeRect(x0 + 0.05, -0.03, 0.25, 0.06); } // the next slug in the breech
      if (S.t - (st.last || -9) < 0.1) { ctx.fillStyle = 'rgba(200,235,255,0.9)'; ctx.beginPath(); ctx.arc(x1 + 0.08, 0, 0.18, 0, 6.29); ctx.fill(); }
      ctx.restore();
      for (const sh of st.fly || []) { const qp = sh.d.body.getPosition(), v = sh.d.body.getLinearVelocity(); ctx.strokeStyle = 'rgba(160,215,255,0.8)'; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(qp.x - v.x * 0.03, qp.y - v.y * 0.03); ctx.lineTo(qp.x, qp.y); ctx.stroke(); ctx.lineCap = 'butt'; } // tracer
    }
    if (w === 'yoyo' && R.yo) { // YO-YO: the winch on top, the cable to the disc, the saw disc itself
      const st = R.l4, q = R.yo;
      if (!q.gone && q.hp > 0) { const nz = b.getWorldPoint(planck.Vec2(R.hl, 0)), qp = q.body.getPosition();
        if (st.mode === 'out' || st.mode === 'reel') { ctx.strokeStyle = INK; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(nz.x, nz.y); ctx.lineTo(qp.x, qp.y); ctx.stroke(); ctx.strokeStyle = '#D9DBD4'; ctx.lineWidth = 0.012; ctx.setLineDash([0.04, 0.03]); ctx.stroke(); ctx.setLineDash([]); }
        if (st.mode !== 'loose') drawBuzz(q, { buzzW: q.spin || 0, buzzMax: 130, buzzR: 0.19 }); }
      const sp = b.getWorldPoint(planck.Vec2(R.spool.lp[0], R.spool.lp[1])); ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(b.getAngle());
      if (R.fo && R.foFree) { drawYoyoDrum(R, t); ctx.restore(); } else if (R.fo) { drawYoyoLid(0.15, R.foCrack === 1); ctx.restore(); } else { // T71c: its winch cover (and without it: the bare drum, the cable in slack loops)
      ctx.fillStyle = R.spool.hp > 0 ? '#5B5E57' : '#3a3530'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, 0.15, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.1, 0, 6.29); ctx.stroke(); ctx.save(); ctx.rotate(st.mode === 'reel' ? t * 20 : 0); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-0.12, 0); ctx.lineTo(0.12, 0); ctx.stroke(); ctx.restore(); ctx.restore(); }
    }
    // a robot with a bola round its wheels: cord coils on the tied side
    if (R.slots.some(s => s.tangled > 0)) for (const s of R.slots) if (s.tangled > 0 && s.wheel && s.wheel.attached) { const wp = b.getWorldPoint(planck.Vec2(s.lp[0], s.lp[1])); ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2.5; for (let k2 = 0; k2 < 3; k2++) { ctx.beginPath(); ctx.ellipse(wp.x, wp.y, 0.1 + k2 * 0.015, 0.06, b.getAngle() + k2 * 0.6, 0, 6.29); ctx.stroke(); } }
    if (w === 'beak' && R.beakRam) { // the upper beak: raised (drawn short and big), dropping, or closed on its victim
      const st = R.l4, k = R.grab ? 1 : st.mode === 'strike' ? 1 - st.t / 0.16 : 0, bend = R.beakBend || 0, sc = 1 + 0.45 * (1 - k), tipX = R.hl + 0.02 + 0.34 * k;
      ctx.save(); const p0 = b.getPosition(); ctx.translate(p0.x, p0.y); ctx.rotate(b.getAngle()); ctx.translate(0.15 * R.hl, 0); ctx.rotate(bend * 0.6); ctx.scale(sc, sc);
      const L0 = tipX - 0.15 * R.hl;
      if (R.beakRam.hp > 0) {
        ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2 / sc;
        path([[-0.1, -0.11], [L0 * 0.55, -0.12], [L0 * 0.92, -0.06], [L0 + 0.04, 0.02], [L0 - 0.02, 0.05], [L0 * 0.8, 0.0], [L0 * 0.55, 0.1], [-0.1, 0.11]]); ctx.fill(); ctx.stroke(); // hooked beak, the hook curls down at the tip
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-0.08, -0.1, L0 * 0.6, 0.03);
        ctx.fillStyle = R.grab ? '#FF3B2B' : '#2B2620'; ctx.beginPath(); ctx.arc(L0 + 0.02, 0.025, 0.018, 0, 6.29); ctx.fill();
        bolt(-0.04, 0);
      } else { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.moveTo(-0.08, -0.06); ctx.lineTo(0.06, 0.07); ctx.stroke(); }
      ctx.restore();
      if (R.grab) { const T = R.grab.robot, ap = T.body.getWorldPoint(planck.Vec2(st.alp[0], st.alp[1])); ctx.strokeStyle = 'rgba(255,59,43,0.75)'; ctx.lineWidth = PX * 2.5; ctx.setLineDash([PX * 4, PX * 3]); ctx.beginPath(); ctx.arc(ap.x, ap.y, 0.09 + 0.02 * Math.sin(t * 25), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (w === 'roaster' && R.pincers) {
      for (const q of R.pincers) if (q.attached) onBody(q, () => { drawPart(q, '#8C8F86', R, decorate(q, R, 0)); ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const x of [0.16, 0.28, 0.4]) { ctx.beginPath(); ctx.moveTo(x - 0.025, 0); ctx.lineTo(x, -q.side * 0.07); ctx.lineTo(x + 0.025, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); } bolt(0.03, 0); bolt(0.22, 0); }); // serrated teeth on the inside of each claw
      { const tk = b.getWorldPoint(planck.Vec2(-0.55 * R.hl, 0)); ctx.save(); ctx.translate(tk.x, tk.y); ctx.rotate(b.getAngle()); if (R.foTrail) drawTankCradle(R, t); else drawTanks(R.foTilt); ctx.restore(); } // twin fuel tanks on its back (T71c: torn out: the empty cradle and the burning fuel line)
      const nz = b.getWorldPoint(planck.Vec2(R.nozzle.lp[0], R.nozzle.lp[1])), a = b.getAngle(), on = R.nozzle.hp > 0;
      ctx.save(); ctx.translate(nz.x, nz.y); ctx.rotate(a); ctx.fillStyle = on ? '#8C8F86' : '#55524C'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; rr(0.02, -0.05, 0.3, 0.1, 0.01); ctx.fill(); ctx.stroke(); rr(0.26, -0.075, 0.08, 0.15, 0.02); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 0.1, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C0392B'; ctx.beginPath(); ctx.arc(-0.05, 0.11, 0.045, 0, 6.29); ctx.fill(); ctx.stroke();
      if (on && R.alive) { ctx.fillStyle = '#5AB0FF'; ctx.beginPath(); ctx.arc(0.3, 0, 0.012, 0, 6.29); ctx.fill(); } ctx.restore();
      if (R.flameOn > 0) { const mz = b.getWorldPoint(planck.Vec2(R.hl - 0.05, 0)), hot = R.grab ? 1.4 : 1; for (let k2 = 0; k2 < 10; k2++) { const aa = a + (Math.random() - 0.5) * 0.6, v = (3 + Math.random() * 2.5) * hot; spawn({ t: 'fire', x: mz.x, y: mz.y, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: 0.22 + Math.random() * 0.15, max: 0.37, s: 0.04 + Math.random() * 0.04 }); } }
    }
    if (w === 'smith' && R.hammerArm) { // the forge hammer: swings from the back over the anvil nose
      const s0 = R.swing > 0 ? 1 - R.swing / 0.18 : R.recover > 0 ? R.recover / (R.grab ? 0.25 : 0.5) : 0, k = 1.55 - 0.55 * s0, T = R.grab ? R.grab.robot : null; // held high (drawn big) until it comes down
      const piv = b.getWorldPoint(planck.Vec2(-0.15 * R.hl, 0)), aim = T ? T.body.getWorldPoint(planck.Vec2(-0.05 * T.hl, 0)) : b.getWorldPoint(planck.Vec2(R.hl + 0.3, 0)), rest = b.getWorldPoint(planck.Vec2(0.3 * R.hl, 0));
      const hx = rest.x + (aim.x - rest.x) * s0, hy = rest.y + (aim.y - rest.y) * s0, ang = Math.atan2(hy - piv.y, hx - piv.x);
      if (R.hammerArm.hp > 0) {
        ctx.strokeStyle = INK; ctx.lineWidth = 0.075 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(piv.x, piv.y); ctx.lineTo(hx, hy); ctx.stroke(); ctx.strokeStyle = '#8C6A3A'; ctx.lineWidth = 0.045 * k; ctx.stroke(); ctx.lineCap = 'butt';
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.scale(k, k); ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2 / k; rr(-0.1, -0.18, 0.2, 0.36, 0.03); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-0.08, -0.16, 0.04, 0.32); ctx.fillStyle = '#2B2620'; ctx.fillRect(-0.1, -0.18, 0.2, 0.05); ctx.fillRect(-0.1, 0.13, 0.2, 0.05); ctx.restore();
        bolt(piv.x, piv.y);
      }
      const an = b.getWorldPoint(planck.Vec2(R.hl - 0.04, 0)), glow = R.fx && R.fx.forge || 0; // the anvil face glows as the beats add up
      ctx.save(); ctx.translate(an.x, an.y); ctx.rotate(b.getAngle()); ctx.fillStyle = `rgba(255,${140 - 60 * glow},40,${0.15 + 0.55 * glow})`; ctx.fillRect(-0.04, -R.hw * 0.5, 0.06, R.hw); ctx.restore();
    }
    if (w === 'carousel' && R.car) {
      const c0 = R.car.getPosition(), a = R.car.getAngle();
      for (const q of [R.gmWedge, R.gmAxe]) if (q && q.attached) onBody(q, () => drawPart(q, q === R.gmWedge ? '#D9B43A' : '#8C8F86', R, q === R.gmAxe ? () => { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1, -1, 2, 0.02); } : null));
      if (R.gmSaw && R.gmSaw.attached) { const bp = R.gmSaw.body.getPosition(); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(bp.x, bp.y); ctx.stroke(); drawBuzz(R.gmSaw, { buzzW: R.gmSaw.spin, buzzMax: 110, buzzR: 0.12 }); }
      ctx.save(); ctx.translate(c0.x, c0.y); ctx.rotate(a); ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.15, 0, 6.29); ctx.fill(); ctx.stroke();
      const cols = ['#D9B43A', '#47A8FF', '#FF5A3C'], an = [0, 2.094, -2.094], st = R.l4;
      for (let k = 0; k < 3; k++) { const lit = st.sel === k ? 1 : st.want === k ? (Math.sin(t * 20) > 0 ? 1 : 0.2) : 0.15; ctx.globalAlpha = 0.3 + 0.7 * lit; ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(Math.cos(an[k]) * 0.1, Math.sin(an[k]) * 0.1, 0.028, 0, 6.29); ctx.fill(); if (lit > 0.5) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(Math.cos(an[k]) * 0.1, Math.sin(an[k]) * 0.1, 0.07, 0, 6.29); ctx.fill(); } ctx.globalAlpha = 1; }
      ctx.restore();
      if (R.fo && !R.fo.off) { ctx.save(); ctx.translate(c0.x, c0.y); ctx.rotate(b.getAngle()); if (R.foTilt) ctx.translate(0.05, 0.035); drawHat(0.21); ctx.restore(); }   // T68: the yellow hat over its brain
      else if (R.foRandom) drawBrain(c0, t);   // T68: hat off: the brain, a wheel of six tools that picks at random
      if (R.swing > 0 || R.recover > 0) { const s = R.swing > 0 ? 1 - R.swing / 0.2 : R.recover / 0.45, hx = R.hl * 0.6 + 0.35 * s, k2 = 1 + 0.5 * Math.sin(Math.PI * s); ctx.save(); const p = b.getPosition(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.strokeStyle = INK; ctx.lineWidth = 0.06 * k2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, 0); ctx.stroke(); ctx.translate(hx, 0); ctx.scale(k2, k2); ctx.fillStyle = '#B9BBB4'; ctx.lineWidth = PX * 2; path([[-0.04, -0.13], [0.05, -0.1], [0.05, 0.1], [-0.04, 0.13]]); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (st.think > 0) { const p = b.getPosition(); ctx.fillStyle = 'rgba(183,154,216,0.9)'; ctx.font = '700 0.16px IBM Plex Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('♞', p.x, p.y - R.hl - 0.12); }
    }
  }
  function drawCrate(h, onRobot) { // T68: Jukebox's wooden record crate from above: on the robot only the rim shows round the records; tipped over on the floor, its open box
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
    if (onRobot) { ctx.fillStyle = '#7A5A3A'; ctx.beginPath(); ctx.rect(-h, -h, 2 * h, 2 * h); ctx.rect(h - 0.045, -h + 0.045, -2 * h + 0.09, 2 * h - 0.09); ctx.fill('evenodd'); ctx.strokeRect(-h, -h, 2 * h, 2 * h); ctx.strokeRect(-h + 0.045, -h + 0.045, 2 * h - 0.09, 2 * h - 0.09);
      ctx.strokeStyle = 'rgba(43,33,24,0.5)'; ctx.lineWidth = PX; for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(-h, k * h); ctx.lineTo(-h + 0.045, k * h); ctx.moveTo(h - 0.045, k * h); ctx.lineTo(h, k * h); ctx.stroke(); } return; }
    ctx.fillStyle = '#7A5A3A'; ctx.fillRect(-h, -h * 0.94, 2 * h, 1.88 * h); ctx.strokeRect(-h, -h * 0.94, 2 * h, 1.88 * h); ctx.fillStyle = '#3D2C1C'; ctx.fillRect(-h + 0.035, -h * 0.94 + 0.035, 2 * h - 0.07, 1.88 * h - 0.07); ctx.strokeRect(-h + 0.035, -h * 0.94 + 0.035, 2 * h - 0.07, 1.88 * h - 0.07);
    ctx.strokeStyle = 'rgba(239,232,218,0.25)'; ctx.lineWidth = PX * 1.2; for (const k of [-0.3, 0.3]) { ctx.beginPath(); ctx.moveTo(-h + 0.05, k * h); ctx.lineTo(h - 0.05, k * h); ctx.stroke(); }
  }
  function drawHat(r) { // T68: Grandmaster's hat seen from above: a gold brim, a crown with a dark band
    ctx.fillStyle = 'rgba(20,14,8,0.25)'; ctx.beginPath(); ctx.arc(0.03, 0.03, r, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#E3B83A'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2B2118'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, 6.29); ctx.stroke();
    ctx.fillStyle = '#F0CB55'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.25, r * 0.25, r * 0.09, -0.6, 0, 6.29); ctx.fill();
  }
  function drawBrain(c0, t) { // T68: the tool wheel under Grandmaster's hat: six tools round a red "?", turning
    const r = 0.2; ctx.save(); ctx.translate(c0.x, c0.y); ctx.fillStyle = '#24211E'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.rotate(t * 1.2); ctx.strokeStyle = '#5A544D'; ctx.lineWidth = PX * 1.2; ctx.setLineDash([PX * 3, PX * 3]); ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, 6.29); ctx.stroke(); ctx.setLineDash([]);
    for (let k = 0; k < 6; k++) { ctx.save(); ctx.rotate(k / 6 * 6.283); ctx.translate(0, -r * 0.68); ctx.lineWidth = PX * 1.2; ctx.strokeStyle = '#EFE8DA';
      if (k === 0) { ctx.fillStyle = '#A9ADA8'; ctx.beginPath(); for (let j = 0; j < 12; j++) { const a = j / 12 * 6.283, rr = j % 2 ? 0.028 : 0.04; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }          // gear
      else if (k === 1) { ctx.fillStyle = '#6F746F'; ctx.fillRect(-0.03, -0.03, 0.06, 0.035); ctx.fillStyle = '#B9824A'; ctx.fillRect(-0.007, 0.005, 0.014, 0.035); }  // hammer
      else if (k === 2) { ctx.fillStyle = '#A9ADA8'; ctx.beginPath(); ctx.moveTo(0, -0.045); ctx.lineTo(-0.02, 0.03); ctx.lineTo(0.02, 0.03); ctx.closePath(); ctx.fill(); } // spike
      else if (k === 3) { ctx.strokeStyle = '#E3B83A'; ctx.lineWidth = PX * 3; ctx.beginPath(); ctx.arc(0, 0, 0.025, Math.PI, 0); ctx.lineTo(0.025, 0.025); ctx.moveTo(-0.025, 0); ctx.lineTo(-0.025, 0.025); ctx.stroke(); }   // magnet
      else if (k === 4) { ctx.fillStyle = '#C4521E'; ctx.beginPath(); ctx.moveTo(-0.022, 0.03); ctx.lineTo(0.022, 0.03); ctx.lineTo(0.01, -0.01); ctx.lineTo(0, -0.045); ctx.lineTo(-0.01, -0.01); ctx.closePath(); ctx.fill(); } // flame
      else { ctx.strokeStyle = '#A9ADA8'; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(0, 0.04); ctx.lineTo(0, -0.015); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -0.028, 0.017, 0, 6.29); ctx.stroke(); } // wrench
      ctx.restore(); }
    ctx.rotate(-t * 1.2); ctx.fillStyle = '#D8402F'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `800 ${r * 0.42}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, r * 0.02); ctx.textBaseline = 'alphabetic'; ctx.restore();
  }
  function onBody(part, f) { const b = part.body, p = b.getPosition(); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); f(); ctx.restore(); }
  function drawShell(part, R, i) {
    const rad = Math.max(...part.verts.map(v => Math.hypot(v[0], v[1]))), w = R ? R.bladeW / R.bladeMax : 0, col = R ? TC(i) : PAL.steel;
    onBody(part, () => {
      ctx.fillStyle = '#9A9C94'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2;
      for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(sg * (rad - 0.04), -sg * 0.05); ctx.lineTo(sg * (rad + 0.07), -sg * 0.025); ctx.lineTo(sg * (rad + 0.07), sg * 0.025); ctx.lineTo(sg * (rad - 0.04), sg * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      drawPart(part, '#B9BBB4', R, decorate(part, R, 0));
      if (part.warp) { const fa = part.foldA, wp = part.warp / 0.45; ctx.strokeStyle = `rgba(14,9,5,${0.45 + 0.4 * wp})`; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(-Math.sin(fa) * rad, Math.cos(fa) * rad); ctx.lineTo(Math.sin(fa) * rad, -Math.cos(fa) * rad); ctx.stroke(); }
      ctx.fillStyle = R && R.alive ? col.col : '#4A4540'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.62, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.stroke();
      ctx.fillStyle = R && R.alive ? col.dark : '#3A3530'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.22, 0, 6.29); ctx.fill(); ctx.stroke();
      for (let k = 0; k < 6; k++) { const t = k / 6 * 6.283; bolt(Math.cos(t) * rad * 0.8, Math.sin(t) * rad * 0.8); }
    });
    if (w > 0.25) { const p = part.body.getPosition(); ctx.strokeStyle = `rgba(255,255,255,${w * 0.55})`; ctx.lineWidth = PX * 2.5; for (let k = 0; k < 3; k++) { const a0 = part.body.getAngle() + k * 2.1; ctx.beginPath(); ctx.arc(p.x, p.y, rad + 0.04, a0, a0 + 0.9 * w); ctx.stroke(); } }
  }
  function drawFlywheel(part, R) { // T68: Gyro's bare gold flywheel (its shell is gone): spokes, a dark hub, out of true (it wobbles)
    const rad = Math.max(...part.verts.map(v => Math.hypot(v[0], v[1]))), w = R ? Math.min(1, R.bladeW / R.bladeMax) : 0, p = part.body.getPosition();
    if (w > 0.25) { ctx.strokeStyle = `rgba(232,197,71,${0.3 + 0.4 * w})`; ctx.lineWidth = PX * 2.2; ctx.setLineDash([PX * 5, PX * 4]); ctx.beginPath(); ctx.arc(p.x + Math.cos(part.body.getAngle()) * 0.03, p.y + Math.sin(part.body.getAngle()) * 0.03, rad + 0.04, 0, 6.29); ctx.stroke(); ctx.setLineDash([]); } // the wobble track, off centre
    onBody(part, () => {
      ctx.fillStyle = '#E3B83A'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,80,10,0.55)'; ctx.lineWidth = PX * 1.2; ctx.beginPath(); ctx.arc(0, 0, rad * 0.86, 0, 6.29); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; for (let k = 0; k < 6; k++) { const t = k / 6 * 6.283 + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(t) * rad * 0.28, Math.sin(t) * rad * 0.28); ctx.lineTo(Math.cos(t) * rad * 0.97, Math.sin(t) * rad * 0.97); ctx.stroke(); }
      ctx.fillStyle = '#2A2622'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.3, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#D8402F'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.08, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-rad * 0.35, -rad * 0.45, rad * 0.3, rad * 0.1, -0.6, 0, 6.29); ctx.fill();
    });
    if (w > 0.4) { ctx.strokeStyle = `rgba(255,255,255,${w * 0.5})`; ctx.lineWidth = PX * 2.5; for (let k = 0; k < 3; k++) { const a0 = part.body.getAngle() + k * 2.1; ctx.beginPath(); ctx.arc(p.x, p.y, rad * 0.75, a0, a0 + 0.8 * w); ctx.stroke(); } }
  }
  // T68: what a breakaway piece leaves on the robot (robot frame, under the turret): Whaler's split hull with the winch drum
  function stumpSparks(x, y) { // T69: a sparking stump (robot frame): a ragged dark end, a bright spark now and then
    ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(x, y, 0.024, 0, 6.29); ctx.fill();
    const t = performance.now() / 1000, on = Math.sin(t * 23 + x * 40) > 0.2;
    ctx.strokeStyle = on ? '#FFE14D' : '#9BE3FF'; ctx.lineWidth = PX * 1.8; ctx.beginPath();
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + t * 9 % 6.28, r = on ? 0.07 : 0.045; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a + 0.4) * r * 0.55); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.stroke(); if (on) { ctx.fillStyle = 'rgba(255,225,77,0.35)'; ctx.beginPath(); ctx.arc(x, y, 0.05, 0, 6.29); ctx.fill(); }
  }
  function hydraHead(sc) { // T69: one Hydra head from above, pointing along +x: a steel jaw of spikes, two red eyes
    ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8 / sc;
    path([[-0.1, -0.08], [0.06, -0.1], [0.02, -0.04], [0.14, -0.05], [0.07, 0], [0.14, 0.05], [0.02, 0.04], [0.06, 0.1], [-0.1, 0.08]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#D8402F'; for (const y of [-0.035, 0.035]) { ctx.beginPath(); ctx.arc(-0.03, y, 0.016, 0, 6.29); ctx.fill(); }
  }
  function drawHood(R, tilt) { // T69: Blacksmith's dark hood over the forge on its back (robot frame): a sloped box with vent slats, behind the hammer
    const hl = R.hl, hw = R.hw, x0 = -hl * 0.95, x1 = -hl * 0.18, y = hw * 0.72; ctx.save(); if (tilt) { ctx.translate(0.04, 0.03); ctx.rotate(0.08); }
    ctx.fillStyle = 'rgba(20,14,8,0.3)'; ctx.fillRect(x0 + 0.03, -y + 0.03, x1 - x0, 2 * y);
    ctx.fillStyle = '#4b4a47'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; path([[x0, -y], [x1, -y * 0.88], [x1, y * 0.88], [x0, y]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#353431'; ctx.lineWidth = PX * 1.4; const ix = x0 + 0.06, iw = x1 - x0 - 0.14; ctx.fillRect(ix, -y * 0.55, iw, y * 1.1); ctx.strokeRect(ix, -y * 0.55, iw, y * 1.1);
    ctx.strokeStyle = '#232220'; ctx.lineWidth = PX * 2; for (let k = 1; k < 5; k++) { const x = ix + iw * k / 5; ctx.beginPath(); ctx.moveTo(x, -y * 0.5); ctx.lineTo(x, y * 0.5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,140,40,0.45)'; for (let k = 0; k < 5; k++) ctx.fillRect(ix + iw * (k + 0.35) / 5, -y * 0.45, iw * 0.06, y * 0.9); // the glow shows between the slats
    bolt(x0 + 0.03, -y + 0.04); bolt(x0 + 0.03, y - 0.04); bolt(x1 - 0.03, -y * 0.88 + 0.04); bolt(x1 - 0.03, y * 0.88 - 0.04);
    ctx.restore();
  }
  function drawForge(R, heat, pause) { // T69: the open forge on its back (robot frame): glowing coals in a firebox, hotter as it heats up; when it overheats it flares
    const hl = R.hl, hw = R.hw, t = performance.now() / 1000, fl = 0.85 + 0.15 * Math.sin(t * 11), hot = pause ? 1 : 0.55 + 0.45 * heat, cx = -hl * 0.56, w2 = hl * 0.42, h2 = hw * 0.74; // (T71a: bolder: bigger firebox, brighter glow, flames, torn hood hinges)
    const g = ctx.createRadialGradient(cx, 0, 0.02, cx, 0, hl * 1.15); g.addColorStop(0, `rgba(255,227,138,${0.9 * fl})`); g.addColorStop(0.45, `rgba(240,138,43,${0.75 * hot})`); g.addColorStop(1, 'rgba(196,82,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, 0, hl * 1.15, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#3a1d10'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; ctx.fillRect(cx - w2, -h2, 2 * w2, 2 * h2); ctx.strokeRect(cx - w2, -h2, 2 * w2, 2 * h2);
    const co = [[-0.6, -0.55, 0.3, '#F08A2B'], [0.1, -0.6, 0.25, '#FFD35A'], [0.55, -0.2, 0.32, '#F08A2B'], [-0.1, 0.05, 0.36, '#FFD35A'], [-0.6, 0.4, 0.24, '#D8402F'], [0.45, 0.5, 0.22, '#D8402F'], [0.0, 0.62, 0.22, '#F08A2B'], [-0.45, -0.05, 0.2, '#FFD35A']];
    for (const [x, y, r, c] of co) { ctx.fillStyle = pause && Math.sin(t * 30 + x * 50) > 0 ? '#FFF4C2' : c; ctx.strokeStyle = '#8e3a14'; ctx.lineWidth = PX * 1.2; ctx.beginPath(); ctx.arc(cx + x * w2 * 0.8, y * h2 * 0.8, r * w2 * 0.6, 0, 6.29); ctx.fill(); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { const y = -h2 * 0.8 + k * h2 * 0.4, fh = 0.06 + 0.035 * Math.sin(t * 13 + k * 1.7); ctx.fillStyle = k % 2 ? 'rgba(255,211,90,0.9)' : 'rgba(240,138,43,0.9)'; ctx.beginPath(); ctx.moveTo(cx + w2 * 0.2, y - 0.03); ctx.quadraticCurveTo(cx + w2 * 0.2 + fh, y + Math.sin(t * 9 + k) * 0.015, cx + w2 * 0.2 + fh * 1.6, y); ctx.quadraticCurveTo(cx + w2 * 0.2 + fh, y + 0.01, cx + w2 * 0.2, y + 0.03); ctx.closePath(); ctx.fill(); } // flames lick out of the coals
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; for (const sg of [-1, 1]) { ctx.fillStyle = '#4b4a47'; path([[cx - w2 - 0.05, sg * h2 - 0.035], [cx - w2 + 0.03, sg * h2 - 0.035], [cx - w2 + 0.045, sg * h2], [cx - w2 + 0.02, sg * h2 + 0.03], [cx - w2 - 0.05, sg * h2 + 0.035]]); ctx.fill(); ctx.stroke(); bolt(cx - w2 - 0.02, sg * h2); } // torn hood hinges
    if (pause) { ctx.strokeStyle = `rgba(255,59,43,${0.5 + 0.4 * Math.sin(t * 18)})`; ctx.lineWidth = PX * 4; ctx.strokeRect(cx - w2 - 0.03, -h2 - 0.03, 2 * w2 + 0.06, 2 * h2 + 0.06); }
  }
  // ---- T71a (parts that fly off, batch A): Forklift's counterweight and engine, Snapjaw's ram cover and leaking ram, Mincer's bare spindle ----
  function hazStripes(x0, y0, w, h) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.fillStyle = '#E3B83A'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = '#2B2118'; for (let k = -6; k < 12; k++) { const y = y0 + k * 0.06; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y + w * 0.8); ctx.lineTo(x0 + w, y + w * 0.8 + 0.03); ctx.lineTo(x0, y + 0.03); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  function drawWeightBlock(hw, onRobot) { // Forklift's counterweight from above (block frame, centred): cast iron, a hazard band, two lifting eyes
    const x0 = -0.13, w = 0.27, y = hw;
    ctx.fillStyle = '#3F3D3A'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; rr(x0, -y, w, 2 * y, 0.035); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x0 + 0.02, -y + 0.02, w - 0.04, 0.025);
    hazStripes(x0 + 0.17, -y + 0.03, 0.07, 2 * y - 0.06); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.strokeRect(x0 + 0.17, -y + 0.03, 0.07, 2 * y - 0.06);
    for (const yy of [-y * 0.55, y * 0.55]) { ctx.strokeStyle = INK; ctx.lineWidth = PX * 4; ctx.beginPath(); ctx.arc(x0 + 0.06, yy, 0.025, 0, 6.29); ctx.stroke(); ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = PX * 2; ctx.stroke(); }
    ctx.fillStyle = '#F2EEE6'; ctx.font = `800 ${0.06}px IBM Plex Mono, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(x0 + 0.075, 0); ctx.rotate(-Math.PI / 2); ctx.font = `800 ${0.075}px IBM Plex Mono, monospace`; ctx.fillText('14 KG', 0, 0); ctx.restore();
  }
  function drawEngine(R) { // what the counterweight hid (robot frame): a little engine block, a radiator fan that spins, an exhaust that puffs
    const hl = R.hl, hw = R.hw, t = performance.now() / 1000, x0 = -hl - 0.02, x1 = -hl * 0.25, ey = hw * 0.62;
    ctx.fillStyle = '#17120D'; ctx.fillRect(x0, -ey - 0.03, x1 - x0, 2 * ey + 0.06); // the bay, dark
    ctx.fillStyle = '#8E3A14'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(-hl * 0.78, -ey * 0.7, hl * 0.48, ey * 1.4, 0.02); ctx.fill(); ctx.stroke(); // engine block (rust red)
    for (let k = 0; k < 4; k++) { const y = -ey * 0.52 + k * ey * 0.35; ctx.fillStyle = '#B9BBB4'; ctx.beginPath(); ctx.arc(-hl * 0.55, y, 0.035, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4A4540'; ctx.beginPath(); ctx.arc(-hl * 0.55, y, 0.012, 0, 6.29); ctx.fill(); } // cylinder heads
    const fx = -hl * 0.86, fr = Math.min(0.15, ey * 0.8); ctx.fillStyle = '#4A4540'; ctx.beginPath(); ctx.arc(fx, 0, fr, 0, 6.29); ctx.fill(); ctx.stroke(); // radiator fan
    ctx.save(); ctx.translate(fx, 0); ctx.rotate(t * 14); ctx.fillStyle = '#D9B43A'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(fr * 0.5, 0, fr * 0.42, fr * 0.16, 0.4, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 1.2; ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#2B2620'; ctx.beginPath(); ctx.arc(fx, 0, 0.02, 0, 6.29); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-hl * 0.5, ey * 0.75); ctx.lineTo(-hl * 0.95, ey + 0.02); ctx.stroke(); ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = 0.03; ctx.stroke(); ctx.lineCap = 'butt'; // exhaust pipe
    for (let k = 0; k < 3; k++) { const q = ((t * 0.8 + k / 3) % 1), px = -hl * 0.95 - q * 0.25, py = ey + 0.02 + q * 0.12; ctx.fillStyle = `rgba(90,86,80,${0.45 * (1 - q)})`; ctx.beginPath(); ctx.arc(px, py, 0.03 + q * 0.06, 0, 6.29); ctx.fill(); }
    ctx.strokeStyle = '#2B2118'; ctx.lineWidth = PX * 2.5; ctx.beginPath(); ctx.moveTo(-hl * 0.3, -ey * 0.3); ctx.quadraticCurveTo(0, -ey * 0.5, 0.25 * hl, -0.04); ctx.stroke(); ctx.strokeStyle = '#C0392B'; ctx.lineWidth = PX * 1.4; ctx.stroke(); // hose to the lift ram
  }
  function drawRamCover(R, tilt) { // Snapjaw: the steel cover over its hydraulic ram (robot frame)
    const cx = 0.15 * R.hl; ctx.save(); ctx.translate(cx, 0); ctx.scale(1.35, 1.35); if (tilt) { ctx.translate(0.03, 0.025); ctx.rotate(0.15); }
    ctx.fillStyle = 'rgba(20,14,8,0.3)'; ctx.fillRect(-0.12, -0.09, 0.3, 0.22);
    ctx.fillStyle = '#9A9C94'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; path([[-0.15, -0.11], [0.13, -0.11], [0.16, -0.07], [0.16, 0.07], [0.13, 0.11], [-0.15, 0.11]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-0.13, -0.09, 0.26, 0.025);
    hazStripes(-0.1, -0.03, 0.2, 0.06); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; ctx.strokeRect(-0.1, -0.03, 0.2, 0.06);
    for (const [x, y] of [[-0.12, -0.08], [0.11, -0.08], [-0.12, 0.08], [0.11, 0.08]]) if (!(tilt && x > 0 && y < 0)) bolt(x, y);
    ctx.restore();
  }
  function drawLeakyRam(R) { // what the cover hid: the hydraulic ram (red cylinder, chrome rod to the jaws) and a split hose spitting oil
    const hl = R.hl, t = performance.now() / 1000, cx = 0.15 * hl;
    ctx.fillStyle = '#17120D'; ctx.fillRect(cx - 0.21, -0.16, 0.44, 0.32);
    ctx.fillStyle = '#B23A2B'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(cx - 0.17, -0.08, 0.24, 0.16, 0.035); ctx.fill(); ctx.stroke(); // the ram
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx - 0.12, -0.045, 0.16, 0.015);
    ctx.fillStyle = '#E4E1DA'; ctx.fillRect(cx + 0.06, -0.018, hl - cx - 0.02, 0.036); ctx.strokeRect(cx + 0.06, -0.018, hl - cx - 0.02, 0.036); // chrome rod to the jaws
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 0.12, 0.05); ctx.quadraticCurveTo(cx - 0.2, 0.16, cx - 0.04, 0.12); ctx.stroke(); ctx.strokeStyle = '#2E2A25'; ctx.lineWidth = PX * 3.5; ctx.stroke(); ctx.lineCap = 'butt'; // the hose, split at its end
    const sx = cx - 0.04, sy = 0.12; ctx.fillStyle = '#17120D'; for (let k = 0; k < 6; k++) { const q = ((t * 1.7 + k / 6) % 1), a = 0.9 + Math.sin(k * 2.3) * 0.6; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * q * 0.2, sy + Math.sin(a) * q * 0.2, 0.012 + q * 0.02, 0, 6.29); ctx.fill(); } ctx.globalAlpha = 1; // oil spurting
    ctx.fillStyle = 'rgba(18,14,10,0.6)'; ctx.beginPath(); ctx.ellipse(sx + 0.05, sy + 0.05, 0.07, 0.035, 0.6, 0, 6.29); ctx.fill(); // a slick on the hull
    ctx.fillStyle = 'rgba(140,130,190,0.35)'; ctx.beginPath(); ctx.ellipse(sx + 0.04, sy + 0.04, 0.03, 0.012, 0.6, 0, 6.29); ctx.fill();
  }
  function drawSpindle(R) { // Mincer: the bare spindle where a grinder flew off: its drive gear, a hex nut, the torn drive belt
    const [px, py] = R.foSpindle, t = performance.now() / 1000, sg = Math.sign(py) || 1;
    ctx.strokeStyle = '#2B2620'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - 0.2, py - sg * 0.1); ctx.lineTo(px - 0.07, py - sg * 0.03); ctx.stroke(); // the belt from the motor ...
    ctx.beginPath(); ctx.moveTo(px - 0.07, py - sg * 0.03); ctx.quadraticCurveTo(px - 0.02 + Math.sin(t * 25) * 0.03, py + sg * 0.12, px + 0.08, py + sg * 0.1 + Math.cos(t * 25) * 0.03); ctx.stroke(); ctx.lineCap = 'butt'; // ... torn, flapping
    ctx.strokeStyle = INK; ctx.lineWidth = 0.045; ctx.beginPath(); ctx.moveTo(R.hl - 0.04, py); ctx.lineTo(px, py); ctx.stroke(); // the spindle arm
    ctx.save(); ctx.translate(px, py); ctx.rotate(t * 30); ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath();
    for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, r = k % 2 ? 0.1 : 0.08; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); // drive gear
    ctx.fillStyle = '#6F7169'; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; ctx.lineTo(Math.cos(a) * 0.035, Math.sin(a) * 0.035); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#17120D'; ctx.fillRect(-0.075, -0.008, 0.03, 0.016); ctx.fillRect(0.045, -0.008, 0.03, 0.016); // nut, gear holes
    ctx.restore(); stumpSparks(px + 0.02, py + sg * 0.02);
  }
  function drawChainEnd(part) { // Wrecker: the broken end of its flail chain: two links, the last one torn open
    const b = part.body, p = b.getPosition(), a = b.getAngle();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.scale(1.7, 1.7); ctx.lineCap = 'round';
    for (const [w, c] of [[PX * 6, INK], [PX * 3.5, '#8C8F86']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(-0.015, 0, 0.035, 0.022, 0, 0, 6.29); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0.035, 0, 0.035, 0.022, 1.57, 0.5, 5.6); ctx.stroke(); }
    ctx.strokeStyle = '#FFE14D'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(0.06, -0.01); ctx.lineTo(0.08, -0.03); ctx.moveTo(0.06, 0.01); ctx.lineTo(0.085, 0.02); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.restore();
  }
  // ---- T71b (batch B) ----
  function drawSmoothBar(R) { // Corkscrew without its screw thread: a smooth hex bar with a chisel point, glowing where it rubs (auger frame)
    const t = performance.now() / 1000, rub = R.l4 && R.l4.bite > 0 ? 1 : 0, vs = [[-0.1, -0.055], [0.26, -0.05], [0.34, 0], [0.26, 0.05], [-0.1, 0.055]];
    path(vs); ctx.fillStyle = '#A7AAA2'; ctx.fill();
    ctx.save(); path(vs); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fillRect(-0.1, -0.05, 0.38, 0.025); ctx.fillStyle = 'rgba(20,14,8,0.22)'; ctx.fillRect(-0.1, 0.022, 0.38, 0.03); // the hex facets
    const ph = ((R.l4.spin || 0) * 0.05) % 0.12; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = PX * 1.4; for (let x = -0.1 + ph; x < 0.3; x += 0.12) { ctx.beginPath(); ctx.moveTo(x, -0.05); ctx.lineTo(x, 0.05); ctx.stroke(); } // it spins: the facet edges flick past
    const g = 0.35 + 0.35 * rub + 0.1 * Math.sin(t * 9); const gr = ctx.createLinearGradient(0.05, 0, 0.34, 0); gr.addColorStop(0, 'rgba(255,120,30,0)'); gr.addColorStop(1, `rgba(255,${110 + 60 * rub},30,${g})`); ctx.fillStyle = gr; ctx.fillRect(0, -0.06, 0.36, 0.12); // the end is hot from rubbing
    for (const x of [0.02, 0.1]) { ctx.fillStyle = '#5B5E57'; ctx.fillRect(x - 0.004, -0.05, 0.008, 0.1); } // the torn weld seams where the thread was
    ctx.restore(); path(vs); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(0.26, -0.05); ctx.lineTo(0.26, 0.05); ctx.stroke(); // the chisel point
    if (rub && Math.sin(t * 31) > 0) { ctx.strokeStyle = '#FFB020'; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.6; ctx.moveTo(0.34, 0); ctx.lineTo(0.34 + Math.cos(a) * 0.09, Math.sin(a) * 0.09); } ctx.stroke(); }
  }
  function drawWhip(R) { // Mauler without its spiked shell: the core of the ball at the arm tip and a long light whip chain, a steel tip at the end
    const a = R.flailArm, tip = a.getWorldPoint(planck.Vec2(0.4, 0)), wt = R.ball, bp = wt.body.getPosition(), dx = bp.x - tip.x, dy = bp.y - tip.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0, t = performance.now() / 1000;
    const sw = Math.min(1, (R.bladeW || 0) / 12), pts = []; for (let k = 0; k <= 16; k++) { const q = k / 16, bow = Math.sin(q * Math.PI) * 0.06 * (1 - sw * 0.6) + Math.sin(q * 9 - t * 14) * 0.012 * q; pts.push([tip.x + dx * q + nx * bow, tip.y + dy * q + ny * bow]); }
    ctx.lineCap = 'round'; for (const [w, c] of [[0.05, INK], [0.03, '#9A9C94']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); for (let k = 1; k < 16; k++) { const [x, y] = pts[k]; ctx.moveTo(x - nx * 0.016, y - ny * 0.016); ctx.lineTo(x + nx * 0.016, y + ny * 0.016); } ctx.stroke(); ctx.lineCap = 'butt'; // the links
    ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(tip.x, tip.y, 0.06, 0, 6.29); ctx.fill(); ctx.stroke(); // the hollow core of the ball: the chain came out of it
    ctx.strokeStyle = '#8C8F86'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(tip.x, tip.y, 0.035, 0, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(tip.x, tip.y, 0.018, 1, 6); ctx.stroke();
    onBody(wt, () => { ctx.scale(1.4, 1.4); path(wt.verts); ctx.fillStyle = '#D9DBD4'; ctx.fill(); ctx.lineWidth = PX * 1.8; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#C0392B'; ctx.fillRect(-0.05, -0.025, 0.025, 0.05); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-0.02, -0.01, 0.06, 0.008); });
    const lc = (R.foCrackT || -9) - L.FLYOFF.Mauler.crackCd; if (S && S.t >= lc && S.t - lc < 0.12) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = PX * 2.5; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * 1.05; ctx.moveTo(bp.x + Math.cos(an) * 0.06, bp.y + Math.sin(an) * 0.06); ctx.lineTo(bp.x + Math.cos(an) * 0.14, bp.y + Math.sin(an) * 0.14); } ctx.stroke(); } // CRACK: a white flash at the tip
  }
  function drawStinger(R) { // Thwacker without its tail (robot frame): the torn tail socket, and the stinger that sat inside the tail root
    const hl = R.hl, t = performance.now() / 1000;
    ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(-hl + 0.02, 0, 0.09, 0, 6.29); ctx.fill(); ctx.stroke(); // the swivel socket
    ctx.fillStyle = '#17120D'; path([[-hl - 0.02, -0.08], [-hl - 0.07, -0.06], [-hl - 0.05, -0.03], [-hl - 0.08, 0.0], [-hl - 0.05, 0.035], [-hl - 0.075, 0.065], [-hl - 0.02, 0.08]]); ctx.fill(); // the torn collar where the tail broke
    const sv = [[-hl + 0.01, -0.06], [-hl - 0.2, -0.022], [-hl - 0.27, 0], [-hl - 0.2, 0.022], [-hl + 0.01, 0.06]];
    path(sv); ctx.fillStyle = '#7A2A22'; ctx.fill(); ctx.save(); path(sv); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-hl - 0.27, -0.05, 0.3, 0.025);
    ctx.strokeStyle = '#2B1410'; ctx.lineWidth = PX * 2; for (const x of [-hl - 0.03, -hl - 0.08, -hl - 0.13]) { ctx.beginPath(); ctx.moveTo(x, -0.07); ctx.lineTo(x - 0.015, 0.07); ctx.stroke(); } ctx.restore(); // armour bands
    path(sv); ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.stroke();
    ctx.fillStyle = '#F2C94C'; path([[-hl - 0.19, -0.024], [-hl - 0.27, 0], [-hl - 0.19, 0.024]]); ctx.fill(); ctx.lineWidth = PX * 1.6; ctx.stroke(); // the amber point
    stumpSparks(-hl - 0.03, -0.075 + 0.15 * (Math.sin(t * 3) > 0 ? 1 : 0));
  }
  function drawDiscForks(R) { // Vertigo (robot frame): the two forks that hold the disc's axle; one bends, then snaps; the tipped disc shows its face
    const hl = R.hl, t = performance.now() / 1000, gone = R.foThrow ? -R.foThrow : 0;
    if (gone) { // the tipped disc: from above you see its face, leaning towards the broken side
      const cx = hl + 0.17, rx = 0.19, ry = 0.135, e = R.vE || 0, sp = t * (2 + 28 * e);
      ctx.save(); ctx.translate(cx, 0); ctx.fillStyle = 'rgba(20,14,8,0.25)'; ctx.beginPath(); ctx.ellipse(0.02, gone * 0.03, rx, ry, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283 + sp, r = k % 2 ? 1 : 1.06; ctx.lineTo(Math.cos(a) * rx * r, Math.sin(a) * ry * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); // the teeth round the rim
      ctx.strokeStyle = '#6F7169'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.84, ry * 0.84, 0, 0, 6.29); ctx.stroke(); // the rim's inner edge
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-0.04, -gone * 0.03, rx * 0.6, ry * 0.4, 0, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#17120D'; for (let k = 0; k < 3; k++) { const a = sp * 0.7 + k * 2.09; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rx * 0.52, Math.sin(a) * ry * 0.52, 0.034, 0.024, 0, 0, 6.29); ctx.fill(); } // the lightening holes go round
      ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.ellipse(0, 0, 0.04, 0.025, 0, 0, 6.29); ctx.fill(); ctx.stroke(); bolt(0, 0);
      if (e > 0.3) { ctx.strokeStyle = `rgba(255,255,255,${0.4 * e})`; ctx.lineWidth = PX * 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.82, ry * 0.82, 0, sp * 2 + k * 2.1, sp * 2 + k * 2.1 + 1); ctx.stroke(); } }
      ctx.restore();
    }
    for (const sg of [-1, 1]) { const y = sg * 0.07;
      if (sg === gone) { ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; path([[hl - 0.03, y - 0.022], [hl + 0.05, y - 0.022], [hl + 0.07, y - 0.005], [hl + 0.05, y + 0.006], [hl + 0.075, y + 0.022], [hl - 0.03, y + 0.022]]); ctx.fill(); ctx.stroke(); stumpSparks(hl + 0.07, y); continue; } // the snapped fork: a stub
      ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; ctx.fillRect(hl - 0.03, y - 0.022, 0.22, 0.044); ctx.strokeRect(hl - 0.03, y - 0.022, 0.22, 0.044);
      ctx.fillStyle = HAZ; ctx.fillRect(hl + 0.0, y - 0.016, 0.05, 0.032); bolt(hl + 0.16, y);
      if (R.foCrack === 1 && sg > 0) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(hl + 0.08, y - 0.022); ctx.lineTo(hl + 0.095, y); ctx.lineTo(hl + 0.085, y + 0.022); ctx.stroke(); } }
  }
  function drawReel(R) { // Angler (robot frame): a fishing reel on its back, its line running to the hook arm; once the spool is gone, the bare reel
    const hl = R.hl, hw = R.hw, t = performance.now() / 1000, cx = -0.3 * hl, cy = -0.35 * hw, st = R.l4 || {}, hold = st.mode === 'hold' || st.mode === 'reach';
    ctx.fillStyle = 'rgba(20,14,8,0.3)'; ctx.beginPath(); ctx.arc(cx + 0.02, cy + 0.02, 0.14, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(cx, cy, 0.135, 0, 6.29); ctx.fill(); ctx.stroke(); // the reel seat
    if (!R.fo.off) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(hold ? t * 12 : 0); if (R.foCrack) ctx.translate(Math.sin(t * 40) * 0.006, 0);
      ctx.fillStyle = '#C9A227'; ctx.beginPath(); ctx.arc(0, 0, 0.11, 0, 6.29); ctx.fill(); ctx.stroke(); // the wound line
      ctx.strokeStyle = '#8E6B12'; ctx.lineWidth = PX * 1.2; for (const r of [0.085, 0.065, 0.045]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.stroke(); }
      ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; ctx.beginPath(); ctx.arc(0, 0, 0.03, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 0.022; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.1, 0.07); ctx.stroke(); ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = 0.012; ctx.stroke(); ctx.lineCap = 'butt'; // the crank handle
      ctx.fillStyle = '#D8402F'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.arc(0.1, 0.07, 0.022, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.restore();
      const bx = (st.base || [0.18 * hl])[0]; ctx.strokeStyle = 'rgba(250,240,200,0.9)'; ctx.lineWidth = PX * 1.3; ctx.beginPath(); ctx.moveTo(cx + 0.02, cy - 0.11); ctx.quadraticCurveTo(cx + 0.2, -hw * 0.95 + (R.foCrack ? Math.sin(t * 9) * 0.04 : 0), bx, -hw - 0.03); ctx.stroke(); // the fishing line to the hook arm
    } else { // the spool is gone: a gold drive gear turning freely and a broken ratchet pawl
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 7); ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); for (let k = 0; k < 20; k++) { const a = k / 20 * 6.283, r = k % 2 ? 0.08 : 0.065; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#17120D'; for (let k = 0; k < 4; k++) { const a = k * 1.571; ctx.beginPath(); ctx.arc(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.011, 0, 6.29); ctx.fill(); } ctx.fillStyle = '#8C8F86'; ctx.beginPath(); ctx.arc(0, 0, 0.02, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; path([[cx + 0.09, cy - 0.1], [cx + 0.13, cy - 0.09], [cx + 0.1, cy - 0.04], [cx + 0.115, cy - 0.01], [cx + 0.085, cy - 0.03]]); ctx.fill(); ctx.stroke(); // the broken pawl, bent off its tooth
      stumpSparks(cx + 0.1, cy - 0.04);
      ctx.strokeStyle = 'rgba(250,240,200,0.85)'; ctx.lineWidth = PX * 1.3; ctx.beginPath(); ctx.moveTo(-hl * 0.05, -hw - 0.03); ctx.quadraticCurveTo(-hl * 0.15, -hw * 0.6 + Math.sin(t * 5) * 0.03, cx + 0.12, cy + 0.12); ctx.stroke(); // the loose line end
    }
  }
  function drawTimingGears(R) { // Pincher (robot frame): two meshing gears on its nose that make the arms close together; one shatters
    const hl = R.hl, t = performance.now() / 1000, cl = R.claps || [], ang = cl[0] && cl[0].joint ? cl[0].joint.getJointAngle() : 0, gone = R.foSlap ? R.foGearSide : 0;
    ctx.fillStyle = '#2B2620'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; rr(hl - 0.22, -0.2, 0.2, 0.4, 0.03); ctx.fill(); ctx.stroke(); // the gear plate
    for (const sg of [-1, 1]) { const cy = sg * 0.095, cx = hl - 0.12;
      if (sg === gone) { ctx.fillStyle = '#17120D'; ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, r = 0.088 + ((k * 37) % 5) * 0.006; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#F08A2B'; ctx.lineWidth = PX * 2.4; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; /* (T71c: bolder: a scorched hole where the gear was, hot at the edge) */ ctx.fillStyle = '#8C8F86'; ctx.beginPath(); ctx.arc(cx, cy, 0.022, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C9A227'; for (let k = 0; k < 3; k++) { const a = k * 2.3 + 0.5; path([[cx + Math.cos(a) * 0.035, cy + Math.sin(a) * 0.035], [cx + Math.cos(a + 0.25) * 0.075, cy + Math.sin(a + 0.25) * 0.075], [cx + Math.cos(a + 0.5) * 0.05, cy + Math.sin(a + 0.5) * 0.05]]); ctx.fill(); ctx.stroke(); } stumpSparks(cx, cy); continue; } // the shattered gear: the bare axle, a few broken teeth
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((gone ? t * 2 * sg : ang * 3 * sg) + (sg > 0 ? 0.157 : 0)); ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath();
      for (let k = 0; k < 20; k++) { const a = k / 20 * 6.283, r = k % 2 ? 0.093 : 0.075; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8E6B12'; ctx.fillRect(-0.06, -0.008, 0.12, 0.016); ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0, 0, 0.022, 0, 6.29); ctx.fill(); ctx.stroke();
      if (R.foCrack === 1 && sg < 0) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.moveTo(0.02, 0.02); ctx.lineTo(0.05, 0.035); ctx.lineTo(0.07, 0.07); ctx.stroke(); }
      ctx.restore(); }
  }
  // ---- T71c (batch C): what the last six show without their piece (robot frame unless said) ----
  function drawYoyoDrum(R, t) { // Yoyo, its winch cover gone (spool frame): the bare drum, the cable off it in slack loops, the snapped brake band
    ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, 0.155, 0, 6.29); ctx.fill(); ctx.stroke(); // the open bay
    ctx.fillStyle = '#8C8F86'; ctx.beginPath(); ctx.arc(0, 0, 0.12, 0, 6.29); ctx.fill(); ctx.stroke(); // drum flange
    ctx.fillStyle = '#C9A26A'; ctx.beginPath(); ctx.arc(0, 0, 0.085, 0, 6.29); ctx.fill(); ctx.stroke(); // the last of the cable on the drum
    ctx.strokeStyle = '#8E6B3A'; ctx.lineWidth = PX * 1.1; for (const r of [0.07, 0.055, 0.04]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.stroke(); }
    ctx.save(); ctx.rotate(t * 1.3); ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; ctx.lineTo(Math.cos(a) * 0.03, Math.sin(a) * 0.03); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); // hex axle, turning freely
    ctx.lineCap = 'round'; for (const [w, c] of [[PX * 4.4, INK], [PX * 2.6, '#E0C58E']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0.06, 0.06); // slack loops of cable spilling off the drum, out over the hull
      ctx.bezierCurveTo(0.2, 0.18, 0.3, 0.02, 0.2, -0.05); ctx.bezierCurveTo(0.12, -0.12, 0.26, -0.24, 0.34, -0.14); ctx.bezierCurveTo(0.42, -0.04, 0.3, 0.1, 0.42, 0.16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.06, 0.07); ctx.bezierCurveTo(-0.16, 0.2, -0.28, 0.12, -0.22, 0.02); ctx.bezierCurveTo(-0.17, -0.06, -0.3, -0.12, -0.25, -0.2); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 4.5; ctx.beginPath(); ctx.arc(0, 0, 0.138, 0.5, 4.4); ctx.stroke(); ctx.strokeStyle = '#B23A2B'; ctx.lineWidth = PX * 2.6; ctx.stroke(); // the snapped brake band, red
    const ex = Math.cos(4.4) * 0.138, ey = Math.sin(4.4) * 0.138; ctx.lineCap = 'butt'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + 0.03, ey - 0.05); ctx.lineTo(ex + 0.05, ey - 0.03); ctx.stroke(); // its torn end, sprung out
    for (const a of [0.3, 2.2, 4.0]) bolt(Math.cos(a) * 0.15, Math.sin(a) * 0.15);
  }
  function drawYoyoLid(r, tilt) { // the round cover over the winch (spool frame); tilt: it rattles loose, one edge lifting
    ctx.save(); if (tilt) { ctx.translate(0.015, -0.012); ctx.rotate(0.25); }
    ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.45, 0, 6.29); ctx.fill();
    ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, 6.29); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + 0.4; bolt(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); }
    if (tilt) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(r * 0.2, -r); ctx.lineTo(r * 0.35, -r * 0.5); ctx.lineTo(r * 0.2, -r * 0.2); ctx.stroke(); }
    ctx.restore();
  }
  function drawBolaBay(R, t) { // Gaucho, its turret knocked off (launcher frame): the toothed turret ring, the open magazine of spare bolas, the torn feed spring
    ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; ctx.beginPath(); ctx.arc(0, 0, 0.15, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#C9A227'; ctx.lineWidth = PX * 1.4; ctx.beginPath(); for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, r = k % 2 ? 0.15 : 0.13; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
    ctx.arc(0, 0, 0.11, 0, 6.29, true); ctx.fill('evenodd'); ctx.stroke(); // the gold turret ring gear
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 0.5, cx = Math.cos(a) * 0.055, cy = Math.sin(a) * 0.055, pa = a + 1.57; // three spare bolas lying in the magazine: two balls and a cord each
      const p0 = [cx + Math.cos(pa) * 0.04, cy + Math.sin(pa) * 0.04], p1 = [cx - Math.cos(pa) * 0.04, cy - Math.sin(pa) * 0.04];
      ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cx * 0.4, cy * 0.4, p1[0], p1[1]); ctx.stroke();
      for (const q of [p0, p1]) { ctx.fillStyle = '#6F7169'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.arc(q[0], q[1], 0.022, 0, 6.29); ctx.fill(); ctx.stroke(); } }
    ctx.strokeStyle = INK; ctx.lineWidth = PX * 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.13, 0.02); for (let k = 1; k <= 6; k++) ctx.lineTo(-0.13 - k * 0.025, 0.02 + (k % 2 ? 0.035 : -0.01)); ctx.stroke(); // the torn feed spring sticks out
    ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = PX * 1.8; ctx.stroke(); ctx.lineCap = 'butt';
    if (Math.sin(t * 9) > 0.4) stumpSparks(0.13, -0.06);
  }
  function drawBareDrum(R, wx, t) { // Slingshot, its bungee snapped (robot frame): the drum wound with plain steel cable, torn red rubber ends flapping, the winch gear
    const hw = R.hw; ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.4; rr(wx - 0.11, -hw * 0.62, 0.22, hw * 1.24, 0.04); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#D9DBD4'; ctx.lineWidth = PX * 1.6; for (let y = -hw * 0.55; y < hw * 0.55; y += 0.028) { ctx.beginPath(); ctx.moveTo(wx - 0.09, y); ctx.lineTo(wx + 0.09, y + 0.012); ctx.stroke(); } // steel cable wound on it
    ctx.save(); ctx.translate(wx + 0.13, -hw * 0.45); ctx.rotate(t * 2); ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, r = k % 2 ? 0.055 : 0.042; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0, 0, 0.015, 0, 6.29); ctx.fill(); ctx.restore(); // the winch gear
    ctx.lineCap = 'round'; for (const sg of [-1, 1]) { const y0 = sg * hw * 0.62, f = Math.sin(t * 11 + sg) * 0.05; // torn bungee ends hanging off the drum
      for (const [w, c] of [[PX * 7, INK], [PX * 5, '#D24B3A']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(wx - 0.02, y0); ctx.quadraticCurveTo(wx - 0.12 + f, y0 + sg * 0.1, wx - 0.2 + f * 1.5, y0 + sg * 0.06); ctx.stroke(); }
      ctx.fillStyle = '#7A231B'; for (const dy of [-0.015, 0, 0.015]) { ctx.beginPath(); ctx.arc(wx - 0.2 + f * 1.5, y0 + sg * 0.06 + dy, 0.006, 0, 6.29); ctx.fill(); } } // frayed strands
    ctx.lineCap = 'butt';
  }
  function drawBareHub(R, t) { // Orbiter, its rotor lock gone (rotor frame): broken lock teeth round a copper slip ring, brushes, sparks
    ctx.save(); ctx.scale(1.55, 1.55); try { drawBareHub0(R, t); } finally { ctx.restore(); }
  }
  function drawBareHub0(R, t) {
    ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.12, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6F7169'; ctx.lineWidth = PX * 1.4; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, br = k % 3 === 1; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0.085, -0.02); ctx.lineTo(br ? 0.1 : 0.125, -0.02); ctx.lineTo(br ? 0.105 : 0.125, br ? 0.0 : 0.02); ctx.lineTo(0.085, 0.02); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } // the lock teeth, some sheared
    ctx.strokeStyle = '#B87333'; ctx.lineWidth = PX * 4; ctx.beginPath(); ctx.arc(0, 0, 0.06, 0, 6.29); ctx.stroke(); ctx.strokeStyle = '#E0903F'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(0, 0, 0.045, 0, 6.29); ctx.stroke(); // copper slip rings
    ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.arc(0, 0, 0.022, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.fillStyle = HAZ; ctx.fillRect(-0.012, -0.11, 0.024, 0.03); ctx.strokeRect(-0.012, -0.11, 0.024, 0.03); // a torn stub of the cap's hazard stripe
    if (Math.sin(t * 23) > 0) { ctx.strokeStyle = '#BFE6FF'; ctx.lineWidth = PX * 1.8; ctx.beginPath(); for (let k = 0; k < 4; k++) { const a = t * 5 + k * 1.6; ctx.moveTo(Math.cos(a) * 0.06, Math.sin(a) * 0.06); ctx.lineTo(Math.cos(a + 0.2) * 0.1, Math.sin(a + 0.2) * 0.1); } ctx.stroke(); } // arcs off the slip ring
  }
  function drawTanks(tilt) { // Rotisserie's twin fuel tanks (tank frame)
    ctx.save(); if (tilt) { ctx.translate(-0.03, 0.02); ctx.rotate(-0.14); }
    ctx.fillStyle = '#B8423A'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; for (const y of [-0.11, 0.11]) { rr(-0.14, y - 0.075, 0.28, 0.15, 0.07); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-0.1, y - 0.06, 0.2, 0.025); ctx.fillStyle = '#B8423A'; }
    if (tilt) { ctx.fillStyle = HAZ; ctx.fillRect(-0.03, -0.2, 0.06, 0.16); ctx.strokeRect(-0.03, -0.2, 0.06, 0.16); ctx.save(); ctx.translate(0.0, 0.1); ctx.rotate(0.6); ctx.fillRect(-0.03, 0, 0.06, 0.14); ctx.strokeRect(-0.03, 0, 0.06, 0.14); ctx.restore(); } // the strap has snapped: one end hangs off
    else { ctx.fillStyle = HAZ; ctx.fillRect(-0.03, -0.2, 0.06, 0.4); }
    ctx.restore();
  }
  function drawTankCradle(R, t) { // Rotisserie without its tanks (tank frame): the empty cradle, torn straps, the fuel pump, the torn fuel line to the tail with its flame
    ctx.fillStyle = '#17120D'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; for (const y of [-0.11, 0.11]) { rr(-0.15, y - 0.08, 0.3, 0.16, 0.08); ctx.fill(); ctx.stroke(); } // two dark troughs where the tanks sat
    ctx.strokeStyle = '#6F7169'; ctx.lineWidth = PX * 2.4; for (const y of [-0.11, 0.11]) for (const x of [-0.08, 0.08]) { ctx.beginPath(); ctx.arc(x, y, 0.07, 0.4, 2.7); ctx.stroke(); } // cradle hoops
    ctx.fillStyle = HAZ; for (const [x, y, a] of [[0, -0.21, 0.3], [0, 0.21, -0.5]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-0.03, -0.035, 0.06, 0.07); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.strokeRect(-0.03, -0.035, 0.06, 0.07); ctx.restore(); } // torn strap ends
    ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.8; ctx.fillRect(0.1, -0.05, 0.09, 0.1); ctx.strokeRect(0.1, -0.05, 0.09, 0.1); bolt(0.145, 0); // the fuel pump
    const tx = -(0.45 * R.hl) - 0.12; ctx.lineCap = 'round'; for (const [w, c] of [[PX * 6, INK], [PX * 4, '#3A3A36']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0.1, 0); ctx.bezierCurveTo(0.02, 0.06, -0.12, -0.05, tx, Math.sin(t * 7) * 0.02); ctx.stroke(); } ctx.lineCap = 'butt'; // the torn fuel line, out past the tail
    const fl = 0.05 + 0.02 * Math.sin(t * 31); ctx.fillStyle = 'rgba(255,170,40,0.9)'; ctx.beginPath(); ctx.ellipse(tx - 0.03, 0, fl, fl * 0.6, 0, 0, 6.29); ctx.fill(); ctx.fillStyle = 'rgba(255,240,150,0.95)'; ctx.beginPath(); ctx.ellipse(tx - 0.02, 0, fl * 0.45, fl * 0.3, 0, 0, 6.29); ctx.fill(); // its little flame
  }
  function drawArmStump(R, t) { // Trebuchet, its throwing arm snapped (robot frame, at the pivot): the jagged stump, the pivot boss, the bare gas ram that drove it
    ctx.save(); ctx.scale(1.35, 1.35); try { drawArmStump0(R, t); } finally { ctx.restore(); }
  }
  function drawArmStump0(R, t) {
    const ax = -0.45 * R.hl, ay = 0.2 * R.hw, px = 0, ang = -0.5, sx = Math.cos(ang) * 0.17, sy = Math.sin(ang) * 0.17;
    ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(sy * 0.4 - ay, px + sx * 0.4 - ax)); const L0 = Math.hypot(sy * 0.4 - ay, px + sx * 0.4 - ax);
    rr(-0.04, -0.035, L0 * 0.6, 0.07, 0.02); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#D9DBD4'; ctx.fillRect(L0 * 0.56 - 0.04, -0.014, L0 * 0.44, 0.028); ctx.strokeRect(L0 * 0.56 - 0.04, -0.014, L0 * 0.44, 0.028); ctx.restore(); // the gas ram: cylinder and chrome rod
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 0.075; ctx.beginPath(); ctx.moveTo(-0.08 * Math.cos(ang), -0.08 * Math.sin(ang)); ctx.lineTo(sx, sy); ctx.stroke(); ctx.strokeStyle = '#C9A227'; ctx.lineWidth = 0.048; ctx.stroke(); ctx.lineCap = 'butt'; // the stump of the arm
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.fillStyle = '#F08A2B'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; path([[-0.01, -0.03], [0.02, -0.02], [0.012, -0.005], [0.035, 0.004], [0.015, 0.012], [0.025, 0.03], [-0.01, 0.03]]); ctx.fill(); ctx.stroke(); ctx.restore(); // the jagged break, still hot
    ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, 0.065, 0, 6.29); ctx.fill(); ctx.stroke(); bolt(0, 0); // the pivot boss
    if (Math.sin(t * 13) > 0.3) stumpSparks(sx + 0.02, sy);
    if (Math.sin(t * 3) > 0.6) { ctx.fillStyle = 'rgba(230,240,255,0.5)'; ctx.beginPath(); ctx.arc(ax - 0.06, ay, 0.04 + 0.02 * Math.sin(t * 9), 0, 6.29); ctx.fill(); } // the ram hisses
  }
  function drawFuelFires(R) { // Rotisserie's trail of burning fuel on the floor (world frame)
    const t = performance.now() / 1000;
    for (const f of R.foFires || []) { const k = Math.min(1, f.life / 1.0);
      ctx.fillStyle = `rgba(40,22,10,${0.55 * k})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.8, f.x * 5, 0, 6.29); ctx.fill(); // the scorched puddle
      for (let n = 0; n < 3; n++) { const a = t * 3 + n * 2.1 + f.x * 7, r = f.r * 0.45, fl = f.r * (0.45 + 0.2 * Math.sin(t * 19 + n * 3)) * k;
        ctx.fillStyle = `rgba(255,${120 + 60 * n},40,${0.75 * k})`; ctx.beginPath(); ctx.ellipse(f.x + Math.cos(a) * r * 0.5, f.y + Math.sin(a) * r * 0.5, fl, fl * 0.7, a, 0, 6.29); ctx.fill(); }
      ctx.fillStyle = `rgba(255,240,160,${0.8 * k})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.22 * k, 0, 6.29); ctx.fill(); }
  }
  function drawFoRobot(R, i) {
    if (R.spec.weapon === 'smith' && R.fo) { if (!R.fo.off) drawHood(R, R.foTilt); else if (R.foForge) drawForge(R, R.foHeat || 0, R.foPause > 0); }   // T69
    const fk = R.fo.key; // T71a: batch A
    if (fk === 'Tarantula') for (const s of R.slots) if (!s.wheel || !s.wheel.attached) { // T71a: bolder: the torn stump sticks out over the side plate, glowing hot at the break, big sparks
      const hx = s.lp[0] * 0.8, y0 = s.side * (R.hw - 0.06), ex = hx + 0.03, ey = s.side * (R.hw + 0.17), t = performance.now() / 1000;
      ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.moveTo(hx, y0); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = '#6F7169'; ctx.lineWidth = 0.05; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#F08A2B'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; path([[ex - 0.05, ey - s.side * 0.01], [ex - 0.03, ey + s.side * 0.035], [ex - 0.005, ey + s.side * 0.012], [ex + 0.02, ey + s.side * 0.045], [ex + 0.05, ey - s.side * 0.01]]); ctx.fill(); ctx.stroke(); // the hot torn end
      ctx.strokeStyle = '#FFE14D'; ctx.lineWidth = PX * 2.6; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = (s.side > 0 ? 0.2 : 3.34) + k * 0.55 + Math.sin(t * 13 + k) * 0.2, r = 0.11 + 0.04 * Math.sin(t * 17 + k * 2); ctx.moveTo(ex + Math.cos(a) * 0.05, ey + s.side * 0.03 + Math.sin(a) * 0.05); ctx.lineTo(ex + Math.cos(a) * r, ey + s.side * 0.03 + Math.sin(a) * r); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,225,77,0.35)'; ctx.beginPath(); ctx.arc(ex, ey + s.side * 0.03, 0.08, 0, 6.29); ctx.fill(); }
    if (fk === 'Forklift') { if (R.foFlick) drawEngine(R); else { ctx.save(); ctx.translate(-R.hl + 0.02, 0); if (R.foTilt) { ctx.translate(-0.02, 0.03); ctx.rotate(-0.12); } drawWeightBlock(R.hw * 0.85, true); ctx.restore(); } }
    if (fk === 'Snapjaw') { if (R.foLeak) drawLeakyRam(R); else drawRamCover(R, R.foTilt); }
    if (fk === 'Mincer' && R.foSpindle) drawSpindle(R);
    if (fk === 'Thwacker' && R.foSting) drawStinger(R);   // T71b: batch B
    if (fk === 'Vertigo') drawDiscForks(R);
    if (fk === 'Angler') drawReel(R);
    if (fk === 'Pincher') drawTimingGears(R);
    if (fk === 'Thwacker' && R.foRoot && !R.foSting) { ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(-R.hl + 0.01, -0.06); ctx.lineTo(-R.hl - 0.03, -0.02); ctx.lineTo(-R.hl + 0.0, 0.01); ctx.lineTo(-R.hl - 0.035, 0.05); ctx.stroke(); stumpSparks(-R.hl - 0.02, 0); }   // the cracked tail root

    if (R.spec.weapon === 'harpoon' && R.foCrack) {
      const hl = R.hl, n = 9, jag = k => (((k * 37) % 7) / 7 - 0.5) * 0.035, w0 = R.foCrack > 1 ? 0.11 : 0.008;
      ctx.fillStyle = '#17120D'; ctx.beginPath();
      for (let k = 0; k <= n; k++) { const x = -hl * 0.92 + k / n * hl * 1.84; ctx.lineTo(x, -w0 + jag(k)); }
      for (let k = n; k >= 0; k--) { const x = -hl * 0.92 + k / n * hl * 1.84; ctx.lineTo(x, w0 + jag(k + 3)); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.stroke();
      if (R.foCrack > 1) { // the winch drum and the rope, in the gap
        const dx = -0.4 * hl; ctx.fillStyle = '#4A4540'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.fillRect(dx - 0.08, -0.1, 0.16, 0.2); ctx.strokeRect(dx - 0.08, -0.1, 0.16, 0.2); ctx.fillStyle = '#8C8F86'; ctx.fillRect(dx - 0.1, -0.11, 0.025, 0.22); ctx.fillRect(dx + 0.075, -0.11, 0.025, 0.22); // the winch drum between its two cheeks
        ctx.strokeStyle = '#C9915A'; ctx.lineWidth = PX * 2; for (let k = 0; k < 6; k++) { const x = dx - 0.065 + k * 0.026; ctx.beginPath(); ctx.moveTo(x, -0.095); ctx.lineTo(x + 0.01, 0.095); ctx.stroke(); } // rope coiled on it
        ctx.strokeStyle = INK; ctx.lineWidth = PX * 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx + 0.1, 0); ctx.quadraticCurveTo(dx + 0.2, 0.03, 0, 0); ctx.stroke(); ctx.strokeStyle = '#B9824A'; ctx.lineWidth = PX * 3; ctx.stroke(); ctx.lineCap = 'butt';
      }
    }
  }
  function drawMech(R, i) {
    if (R.shell && R.shell.attached) { if (R.shell.bare) drawFlywheel(R.shell, R); else drawShell(R.shell, R, i); }   // (T68: without its shell, Gyro is a bare flywheel)
    if (R.sweep && R.sweep.attached) {
      const pv = R.body.getWorldPoint(planck.Vec2(R.hl + 0.04, 0)), w = Math.abs(R.sweep.body.getAngularVelocity() - R.body.getAngularVelocity());
      if (w > 6) { const a = R.sweep.body.getAngle(); ctx.fillStyle = 'rgba(220,222,215,0.25)'; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.arc(pv.x, pv.y, 0.64, a - Math.sign(R.armSide) * 0.6, a, R.armSide < 0); ctx.closePath(); ctx.fill(); }
      onBody(R.sweep, () => { drawPart(R.sweep, '#B9BBB4', R, decorate(R.sweep, R, 0)); ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0, 0, 0.045, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke(); });
    }
    if (R.twins) for (const q of R.twins) if (q.attached) {
      const bp = q.body.getPosition(), cp = R.body.getWorldPoint(planck.Vec2(R.hl - 0.04, q.mount[1])); ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(bp.x, bp.y); ctx.stroke();
      drawBuzz(q, { buzzW: q.spin, buzzMax: R.buzzMax, buzzR: 0.12 });
    }
    if (R.tails && !R.foSting) {   // (T71b: a dropped tail: only the stinger, drawn with the robot)
      ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); const r0 = R.body.getWorldPoint(planck.Vec2(-R.hl - 0.02, 0)); ctx.moveTo(r0.x, r0.y);
      for (const q of R.tails) { if (!q.attached) break; const c = q.body.getPosition(); ctx.lineTo(c.x, c.y); } ctx.stroke(); ctx.lineCap = 'butt';
      for (const q of R.tails) if (q.attached) onBody(q, () => { drawPart(q, q.label === 'Tail mace' ? '#5B5E57' : '#8C8F86', R, decorate(q, R, 0)); if (q.label === 'Tail mace') { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const [x, y, dx, dy] of [[-0.03, -0.08, 0, -0.06], [-0.03, 0.08, 0, 0.06], [-0.13, 0, -0.06, 0], [0.04, -0.05, 0.04, -0.04], [0.04, 0.05, 0.04, 0.04]]) { ctx.beginPath(); ctx.moveTo(x - 0.02, y); ctx.lineTo(x + dx, y + dy); ctx.lineTo(x + 0.02, y); ctx.closePath(); ctx.fill(); ctx.stroke(); } } });
    }
    if (R.ramHead && R.ramHead.attached) {
      const a1 = R.body.getWorldPoint(planck.Vec2(R.hl - 0.05, 0)), a2 = R.ramHead.body.getPosition(); ctx.strokeStyle = '#4A4540'; ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); ctx.strokeStyle = '#B9BBB4'; ctx.lineWidth = 0.04; ctx.stroke();
      onBody(R.ramHead, () => { drawPart(R.ramHead, '#6F7369', R, decorate(R.ramHead, R, 0)); ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const y of [-0.1, 0, 0.1]) { ctx.beginPath(); ctx.moveTo(0.12, y - 0.03); ctx.lineTo(0.2, y); ctx.lineTo(0.12, y + 0.03); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
    }
    if (R.spec.weapon === 'vdisc' && R.tool && R.tool.attached && !R.foThrow) { // motion stripes on the spinning disc (T71b: a tipped disc shows its face instead)
      const e = R.vE || 0; if (e > 0.15) { ctx.save(); const p0 = R.body.getPosition(); ctx.translate(p0.x, p0.y); ctx.rotate(R.body.getAngle()); ctx.strokeStyle = `rgba(60,55,50,${0.3 + 0.5 * e})`; ctx.lineWidth = PX * 2; const ph = (performance.now() / (60 - 40 * e)) % 1; for (let k = 0; k < 4; k++) { const x = R.hl + 0.01 + ((k / 4 + ph) % 1) * 0.32; ctx.beginPath(); ctx.moveTo(x, -0.035); ctx.lineTo(x + 0.03, 0.035); ctx.stroke(); } ctx.restore(); }
    }
    if (R.carry) { const p0 = R.carry.robot.body.getPosition(); ctx.strokeStyle = 'rgba(232,197,71,0.8)'; ctx.lineWidth = PX * 3; ctx.setLineDash([PX * 6, PX * 4]); ctx.beginPath(); ctx.arc(p0.x, p0.y, R.carry.robot.hl + 0.12, 0, 6.29); ctx.stroke(); ctx.setLineDash([]); }
    if (R.claps) for (const q of R.claps) if (q.attached) onBody(q, () => { drawPart(q, '#8C8F86', R, decorate(q, R, 0)); ctx.fillStyle = HAZ; ctx.fillRect(0.38, -0.05, 0.1, 0.1); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.strokeRect(0.38, -0.05, 0.1, 0.1); bolt(0, 0); });
  }
  // T72: a lopsided spinner bar (Buzzkill's half bar) throws the robot about along its long arm: drawn a few cm off, the way the arm points
  function lopShake(R) { const q = R.blade; if (!R.foLop || !q || !q.attached || !R.alive) return null; const w = Math.min(1, (R.bladeW || 0) / (R.bladeMax || 1)); if (w < 0.15) return null;
    const a = q.body.getAngle(), k = 0.035 * w; return [Math.cos(a) * k, Math.sin(a) * k]; }
  function drawBlade(part, R) {
    const b = part.body, p = b.getPosition(), a = b.getAngle(), w = R ? R.bladeW / R.bladeMax : 0;
    ctx.save(); ctx.translate(p.x, p.y);
    // each arm's reach and where its tip points (a bent arm is shorter and trails): a bent bar sweeps two circles, not one
    const arm = sg => { let r = 0, an = sg > 0 ? 0 : Math.PI; for (const q of part.outline) if (q[0] * sg > 0) { const d = Math.hypot(q[0], q[1]); if (d > r) { r = d; an = Math.atan2(q[1], q[0]); } } return [r || 0.5, an]; };
    const [rA, aA] = arm(1), [rB, aB] = arm(-1), lop = !!part.lop, bent = !lop && (Math.abs(rA - rB) > 0.006 || (part.kinkSum || 0) > 0.08);
    if (w > 0.2) {
      const R0 = Math.max(rA, rB) + 0.01, off = bent ? (rA - rB) * 0.5 : 0; // the out-of-balance bar throws its swept disc off centre
      ctx.fillStyle = `rgba(200,202,196,${0.12 + w * 0.18})`; ctx.beginPath(); ctx.arc(Math.cos(a) * off, Math.sin(a) * off, R0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${w * 0.5})`; ctx.lineWidth = PX * 2;
      for (const [rr, aa] of [[rA, aA], [rB, aB]]) { ctx.beginPath(); ctx.arc(0, 0, rr - 0.02, a + aa, a + aa + 0.9); ctx.stroke(); }
      if (lop) { ctx.strokeStyle = `rgba(232,197,71,${0.35 + w * 0.4})`; ctx.lineWidth = PX * 2.2; ctx.setLineDash([PX * 6, PX * 5]); ctx.beginPath(); ctx.arc(0, 0, Math.min(rA, rB), 0, 6.29); ctx.stroke(); ctx.setLineDash([]); // T72: the stub's small track
        ctx.strokeStyle = `rgba(232,197,71,${0.5 + w * 0.4})`; ctx.lineWidth = PX * 3; for (const o of [0.25, 0.55]) { ctx.beginPath(); ctx.arc(0, 0, Math.max(rA, rB) + 0.03 + o * 0.04, a + aA - 0.5 - o, a + aA - o * 0.4); ctx.stroke(); } } // wobble marks behind the long end
      if (bent) { const rs = Math.min(rA, rB) - 0.02; ctx.strokeStyle = `rgba(232,197,71,${0.35 + w * 0.4})`; ctx.lineWidth = PX * 2.2; ctx.setLineDash([PX * 6, PX * 5]); ctx.beginPath(); ctx.arc(0, 0, rs, 0, 6.29); ctx.stroke(); ctx.setLineDash([]); } // the bent arm's shorter track
    }
    ctx.rotate(a);
    if (w > 0.4) { ctx.globalAlpha = 0.35; for (const o of [-0.25, -0.12]) { ctx.save(); ctx.rotate(o); path(part.outline); ctx.fillStyle = '#B9BBB4'; ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1; }
    drawPart(part, '#B9BBB4', R, decorate(part, R, 0));
    ctx.beginPath(); ctx.arc(0, 0, 0.05, 0, 6.29); ctx.fillStyle = '#5B5E57'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  // T67 (parts that fly off, next-gen test): the breakaway pieces on the floor, each in its robot's look
  function drawFoPiece(d) {
    if (d.foShape === 'ball') { drawBall(d); return; }   // T71a: Wrecker's flail ball rolling free
    if (d.foShape === 'tailseg') { // T71b: Thwacker's dropped tail, segment by segment, thrashing for a while
      const R0 = d.foOf, th = R0 && S && R0.foThrash && S.t < R0.foThrash;
      onBody(d, () => { drawPart(d, d.label === 'Tail mace' ? '#5B5E57' : '#8C8F86', d.robot, null);
        if (d.label === 'Tail mace') { ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; for (const [x, y, dx, dy] of [[-0.03, -0.08, 0, -0.06], [-0.03, 0.08, 0, 0.06], [-0.13, 0, -0.06, 0], [0.04, -0.05, 0.04, -0.04], [0.04, 0.05, 0.04, 0.04]]) { ctx.beginPath(); ctx.moveTo(x - 0.02, y); ctx.lineTo(x + dx, y + dy); ctx.lineTo(x + 0.02, y); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
        else if (d.label === 'Tail root') { ctx.fillStyle = '#17120D'; path([[0.15, -0.03], [0.17, -0.01], [0.155, 0.0], [0.175, 0.015], [0.15, 0.03]]); ctx.fill(); }
        if (th) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = PX * 2; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.arc(0, 0, 0.12, sg * 1.2 - 0.4, sg * 1.2 + 0.4); ctx.stroke(); } } });
      return; }
    if (d.foShape === 'disc') { drawBuzz(d, { buzzW: d.body.getAngularVelocity(), buzzMax: 100, buzzR: 0.12 }); return; }   // T71a: Mincer's loose grinder, still spinning
    const p = d.body.getPosition(), a = d.body.getAngle(), vs = d.verts, xs = vs.map(v => v[0]), ys = vs.map(v => v[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    ctx.save(); ctx.translate(p.x + 0.035, p.y + 0.035); ctx.rotate(a); ctx.fillStyle = 'rgba(20,14,8,0.25)'; path(vs); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    if (d.foShape === 'brick') { // a small rust-red brick with two holes
      path(vs); ctx.fillStyle = '#C4521E'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#8E3A14'; for (const x of [-0.22, 0.22]) { ctx.beginPath(); ctx.arc(x * (x1 - x0), 0, Math.min(0.018, (y1 - y0) * 0.22), 0, 6.29); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,230,200,0.18)'; ctx.fillRect(x0 + 0.01, y0 + 0.006, (x1 - x0) - 0.02, 0.012);
    } else if (d.foShape === 'teeth') { // Popcorn's yellow teeth plate: gold, a row of black teeth along its front edge
      drawPart(d, '#E3B83A', d.robot, () => { ctx.fillStyle = INK; const n = 5, w = (y1 - y0) * 0.8 / n; for (let k = 0; k < n; k++) { const y = y0 + (y1 - y0) * 0.1 + w * (k + 0.5); ctx.beginPath(); ctx.moveTo(x1 - 0.13, y - w * 0.4); ctx.lineTo(x1 - 0.03, y); ctx.lineTo(x1 - 0.13, y + w * 0.4); ctx.closePath(); ctx.fill(); } });
    } else if (d.foShape === 'clamp') { // T68: Railgun's burst rail clamp: a dark steel strap, bent, two bolt holes
      drawPart(d, '#5B5E57', d.robot, () => { ctx.fillStyle = '#EFE8DA'; for (const x of [x0 + 0.04, x1 - 0.05]) { ctx.beginPath(); ctx.arc(x, 0, 0.012, 0, 6.29); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + 0.02, y0 + 0.008, x1 - x0 - 0.04, 0.01); });
    } else if (d.foShape === 'glass') { // T68: a shard of Scavenger's hopper dome
      path(vs); ctx.fillStyle = 'rgba(170,215,240,0.6)'; ctx.fill(); ctx.lineWidth = PX * 1.8; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.moveTo(x0 + 0.03, y0 + 0.02); ctx.lineTo(x1 - 0.05, y0 + 0.035); ctx.stroke();
    } else if (d.foShape === 'hat') { drawHat(Math.max(x1 - x0, y1 - y0) / 2); // T68: Grandmaster's hat
    } else if (d.foShape === 'crate') { drawCrate((x1 - x0) / 2, false); // T68: Jukebox's tipped record crate
    } else if (d.foShape === 'seam') { // T68: a strip of Whaler's hull, in the robot's colour, rivets along it
      const k = S && d.robot ? S.robots.indexOf(d.robot) : 0; drawPart(d, TC(Math.max(0, k)).col, d.robot, () => { for (let x = x0 + 0.06; x < x1 - 0.03; x += 0.1) bolt(x, 0); });
    } else if (d.foShape === 'casing') { // T69: half of Pogo's burst spring casing: a steel half dome, rivets on the rim, the torn edge dark
      path(vs); ctx.fillStyle = '#A9ADA8'; ctx.fill(); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(0, 0, Math.max(x1 - x0, y1 - y0) * 0.3, 0, 6.29); ctx.fill();
      for (const v of vs.slice(1, -1)) bolt(v[0] * 0.8, v[1] * 0.8); ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2.4; ctx.beginPath(); ctx.moveTo(vs[0][0], vs[0][1]); for (let k = 1; k <= 6; k++) ctx.lineTo(vs[0][0] + (vs[vs.length - 1][0] - vs[0][0]) * k / 6 + (k % 2 ? 0.012 : -0.012), vs[0][1] + (vs[vs.length - 1][1] - vs[0][1]) * k / 6); ctx.stroke();
    } else if (d.foShape === 'spring') { // T69: Pogo's uncoiled spring: a gold coil stretched out along the floor, still curled at one end
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const L2 = (x1 - x0) / 2, pts = [];
      for (let k = 0; k <= 70; k++) { const a = k * 0.32, r = 0.012 + k * 0.0007; pts.push([-L2 * 0.55 + Math.cos(a) * r * 3.2, Math.sin(a) * r * 3.2]); }
      for (let k = 0; k <= 60; k++) { const q = k / 60; pts.push([-L2 * 0.55 + q * L2 * 1.55, Math.sin(q * 26) * 0.03 * (1 - 0.3 * q)]); }
      for (const [w, c] of [[PX * 6.5, INK], [PX * 3.5, '#E3B83A']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    } else if (d.foShape === 'hood') { // T69: Blacksmith's hood, knocked off: the dark sloped box, its vent slats
      path(vs); ctx.fillStyle = '#4b4a47'; ctx.fill(); ctx.lineWidth = PX * 2.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#353431'; ctx.fillRect(x0 * 0.6, y0 * 0.5, (x1 - x0) * 0.6, (y1 - y0) * 0.5); ctx.strokeStyle = '#232220'; ctx.lineWidth = PX * 2; for (let k = 1; k < 5; k++) { const x = x0 * 0.6 + (x1 - x0) * 0.6 * k / 5; ctx.beginPath(); ctx.moveTo(x, y0 * 0.45); ctx.lineTo(x, y1 * 0.45); ctx.stroke(); }
    } else if (d.foShape === 'wire') { // T69: Lodestone's unwound copper wire: a loose tangle along the floor
      ctx.lineCap = 'round'; const L2 = (x1 - x0) / 2, pts = []; for (let k = 0; k <= 80; k++) { const q = k / 80, a = q * 17; pts.push([-L2 + q * 2 * L2 + Math.cos(a) * 0.035, Math.sin(a) * 0.035 + Math.sin(q * 5) * 0.012]); }
      for (const [w, c] of [[PX * 5, INK], [PX * 2.8, '#E0903F']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); } ctx.lineCap = 'butt';
    } else if (d.foShape === 'tip') { // T69: Hornet's broken spear tip: bright steel, ragged at the break
      path(vs); ctx.fillStyle = '#C9CBC4'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x0 + 0.02, -0.006, (x1 - x0) * 0.6, 0.008);
      if (d.stuckIn) { const t = performance.now() / 1000; if (Math.sin(t * 17) > 0.3) { ctx.strokeStyle = '#FFE14D'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.moveTo(x1 - 0.02, 0); ctx.lineTo(x1 + 0.04, -0.03); ctx.moveTo(x1 - 0.02, 0); ctx.lineTo(x1 + 0.04, 0.03); ctx.stroke(); } }
    } else if (d.foShape === 'leg') { // T69: a Tarantula leg lying on the floor: hip, knee, foot
      const sd = d.legSide || 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const P3 = [[-0.12, -sd * 0.06], [0.0, sd * 0.04], [0.13, -sd * 0.03]];
      for (const [w, c] of [[0.05, INK], [0.03, '#6F7169']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); P3.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); }
      ctx.fillStyle = '#E3B83A'; ctx.beginPath(); ctx.arc(0, sd * 0.04, 0.022, 0, 6.29); ctx.fill(); ctx.lineWidth = PX * 1.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    } else if (d.foShape === 'head') { hydraHead(1); // T69: a cut-off Hydra head
    } else if (d.foShape === 'weight') { drawWeightBlock((y1 - y0) / 2, false); // T71a: Forklift's counterweight
    } else if (d.foShape === 'cover') { path(vs); ctx.fillStyle = '#9A9C94'; ctx.fill(); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.stroke(); hazStripes(-0.1, -0.03, 0.2, 0.06); ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.2; ctx.strokeRect(-0.1, -0.03, 0.2, 0.06); bolt(-0.12, -0.08); bolt(-0.12, 0.08); ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(0.11, 0.08, 0.014, 0, 6.29); ctx.arc(0.11, -0.08, 0.014, 0, 6.29); ctx.fill(); // T71a: Snapjaw's ram cover, two bolts torn out
    } else if (d.foShape === 'scythe') { path(vs); ctx.fillStyle = '#C9CBC4'; ctx.fill(); ctx.lineWidth = PX * 2.2; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(-0.13, -0.07); ctx.lineTo(0.1, -0.055); ctx.lineTo(0.15, -0.012); ctx.stroke(); ctx.strokeStyle = '#17120D'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(-0.14, -0.07); ctx.lineTo(-0.12, -0.03); ctx.lineTo(-0.145, 0.0); ctx.lineTo(-0.125, 0.02); ctx.stroke(); // T71a: Scythe's snapped blade: bright cutting edge, torn end
    } else if (d.foShape === 'axehead') { ctx.strokeStyle = 'rgba(20,14,8,0.55)'; ctx.lineWidth = PX * 1.8; ctx.beginPath(); for (const [ax, ay] of [[0.13, -0.08], [0.15, 0.02], [0.12, 0.1], [0.1, -0.16]]) { ctx.moveTo(0.06, ay * 0.6); ctx.lineTo(ax, ay); } ctx.stroke(); // cracks in the floor where it bit in
      path(vs); ctx.fillStyle = '#B9BBB4'; ctx.fill(); ctx.lineWidth = PX * 2.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0.045, -0.12, 0.015, 0.24); ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(-0.02, 0, 0.022, 0, 6.29); ctx.fill(); // T71a: Thumper's axe head, the empty handle socket
    } else if (d.foShape === 'thread') { // T71b: Corkscrew's stripped screw thread: a coil of bright steel ribbon, sharp edged
      ctx.lineCap = 'round'; const L2 = (x1 - x0) / 2, n = 7;
      for (const [w, c] of [[PX * 7, INK], [PX * 4.2, '#C9CBC4']]) { ctx.strokeStyle = c; ctx.lineWidth = w; for (let k = 0; k < n; k++) { const x = -L2 + 0.03 + k * (2 * L2 - 0.06) / (n - 1); ctx.beginPath(); ctx.ellipse(x, 0, 0.03, 0.045, 0.35, 0, 6.29); ctx.stroke(); } }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = PX * 1.2; for (let k = 0; k < n; k++) { const x = -L2 + 0.03 + k * (2 * L2 - 0.06) / (n - 1); ctx.beginPath(); ctx.ellipse(x, 0, 0.03, 0.045, 0.35, 3.6, 5.2); ctx.stroke(); } ctx.lineCap = 'butt';
    } else if (d.foShape === 'halfshell') { // T71b: half of Mauler's spiked ball shell, spikes out, the hollow inside dark
      ctx.fillStyle = '#D9DBD4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; const rr0 = Math.max(x1 - x0, y1 - y0) * 0.5;
      for (const v of vs.slice(1, -1)) { const a = Math.atan2(v[1], v[0]); ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.22) * rr0 * 0.9, Math.sin(a - 0.22) * rr0 * 0.9); ctx.lineTo(Math.cos(a) * rr0 * 1.6, Math.sin(a) * rr0 * 1.6); ctx.lineTo(Math.cos(a + 0.22) * rr0 * 0.9, Math.sin(a + 0.22) * rr0 * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      path(vs); ctx.fillStyle = '#5B5E57'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); path(vs); ctx.clip(); ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(0, 0, rr0 * 0.62, 0, 6.29); ctx.fill(); ctx.restore(); // hollow inside
    } else if (d.foShape === 'fork') { // T71b: Vertigo's snapped disc fork: dark steel, a hazard band, the axle hole, ragged where it broke
      path(vs); ctx.fillStyle = '#4A4540'; ctx.fill(); ctx.lineWidth = PX * 2; ctx.strokeStyle = INK; ctx.stroke(); hazStripes(-0.06, -0.018, 0.05, 0.036); ctx.fillStyle = '#EFE8DA'; ctx.beginPath(); ctx.arc(0.05, 0.002, 0.012, 0, 6.29); ctx.fill(); ctx.stroke();
    } else if (d.foShape === 'spool') { // T71b: Angler's reel spool rolling free: gold line wound on it, dark flanges
      const r = (x1 - x0) / 2; ctx.fillStyle = '#3A3A36'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#C9A227'; ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8E6B12'; ctx.lineWidth = PX * 1.2; for (const k of [0.62, 0.45]) { ctx.beginPath(); ctx.arc(0, 0, r * k, 0, 6.29); ctx.stroke(); } ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#17120D'; ctx.fillRect(-r * 0.05, -r * 0.25, r * 0.1, r * 0.5);
      ctx.strokeStyle = 'rgba(250,240,200,0.9)'; ctx.lineWidth = PX * 1.3; ctx.beginPath(); ctx.moveTo(r * 0.8, 0); ctx.quadraticCurveTo(r * 1.4, r * 0.6, r * 1.1, r * 1.3); ctx.stroke(); // a loose end of line
    } else if (d.foShape === 'gear') { // T71b: half of Pincher's shattered timing gear: gold teeth on the round edge, broken across
      ctx.fillStyle = '#C9A227'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.6; ctx.beginPath(); const r = (y1 - y0) / 2;
      for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + k / 12 * Math.PI, rr2 = k % 2 ? r : r * 0.8; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.lineTo(0.012, r * 0.5); ctx.lineTo(-0.01, r * 0.15); ctx.lineTo(0.01, -r * 0.2); ctx.lineTo(-0.008, -r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8E6B12'; ctx.fillRect(0.0, -0.008, r * 0.6, 0.016); ctx.fillStyle = '#5B5E57'; ctx.beginPath(); ctx.arc(0, 0, 0.022, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.stroke();
    } else if (d.foShape === 'lid') { drawYoyoLid((x1 - x0) / 2, false); // T71c: Yoyo's winch cover, rolling about
    } else if (d.foShape === 'turret') { // T71c: Gaucho's bola turret on its side: the barrel, the round turret, a bola still loaded
      ctx.fillStyle = '#8C8F86'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2.2; rr(0.02, -0.06, 0.28, 0.12, 0.02); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 0.12, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#17120D'; ctx.beginPath(); ctx.arc(0, 0, 0.07, 0, 6.29); ctx.fill(); ctx.strokeStyle = '#C9A227'; ctx.lineWidth = PX * 1.6; ctx.beginPath(); ctx.arc(0, 0, 0.1, 0.6, 2.2); ctx.stroke(); // the torn bearing underneath
      ctx.strokeStyle = '#C9A26A'; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.moveTo(0.18, -0.07); ctx.lineTo(0.24, 0.07); ctx.stroke(); for (const [x, y] of [[0.18, -0.07], [0.24, 0.07]]) { ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.arc(x, y, 0.03, 0, 6.29); ctx.fill(); ctx.stroke(); }
    } else if (d.foShape === 'bungee') { // T71c: Slingshot's snapped bungee: a long red rubber cord, frayed at both ends
      ctx.lineCap = 'round'; for (const [w, c] of [[0.075, INK], [0.05, '#D24B3A']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + 0.03, 0); ctx.bezierCurveTo(x0 * 0.4, -0.05, x1 * 0.3, 0.05, x1 - 0.03, 0); ctx.stroke(); } ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = PX * 1.4; ctx.beginPath(); ctx.moveTo(x0 + 0.06, -0.012); ctx.bezierCurveTo(x0 * 0.4, -0.06, x1 * 0.3, 0.035, x1 - 0.06, -0.012); ctx.stroke();
      ctx.fillStyle = '#7A231B'; for (const ex of [x0 + 0.01, x1 - 0.01]) for (const dy of [-0.02, 0, 0.02]) { ctx.beginPath(); ctx.arc(ex + (ex < 0 ? -0.01 : 0.01), dy, 0.008, 0, 6.29); ctx.fill(); }
    } else if (d.foShape === 'hubcap') { // T71c: Orbiter's rotor lock cap: a round steel cap with the hazard stripe, the sheared pin under it
      const r = (x1 - x0) / 2; ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke(); ctx.fillStyle = HAZ; ctx.fillRect(-0.02, -r * 0.9, 0.04, r * 1.8); ctx.strokeRect(-0.02, -r * 0.9, 0.04, r * 1.8);
      ctx.fillStyle = '#B9BBB4'; ctx.beginPath(); ctx.arc(r * 0.45, r * 0.35, 0.018, 0, 6.29); ctx.fill(); ctx.stroke();
    } else if (d.foShape === 'tanks') { drawTanks(true); // T71c: Rotisserie's twin fuel tanks, strap snapped
      ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.beginPath(); ctx.ellipse(-0.16, 0.0, 0.05, 0.03, 0, 0, 6.29); ctx.fill(); // a drip of fuel
    } else if (d.foShape === 'tarm') { // T71c: Trebuchet's snapped throwing arm: the gold bar, ragged at the break, the counterweight still on its end
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(-0.12, 0); ctx.lineTo(0.3, 0); ctx.stroke(); ctx.strokeStyle = '#C9A227'; ctx.lineWidth = 0.045; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#5B5E57'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 2; ctx.fillRect(-0.24, -0.11, 0.14, 0.22); ctx.strokeRect(-0.24, -0.11, 0.14, 0.22);
      ctx.fillStyle = '#17120D'; path([[0.3, -0.025], [0.33, -0.012], [0.315, 0.0], [0.34, 0.012], [0.3, 0.025]]); ctx.fill();
    } else { // Buzzkill's snapped half bar: bright steel, a sharpening stripe, ragged where it broke
      drawPart(d, '#C9CBC4', d.robot, () => { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 0.04, -0.012, (x1 - x0) - 0.08, 0.014); });
    }
    ctx.restore();
  }
  function drawDebris(d) {
    if (d.gone && !d.fellT) return;
    if (d.fellT) return;
    const b = d.body, p = b.getPosition(), a = b.getAngle(), v = b.getLinearVelocity(), sp = Math.hypot(v.x, v.y);
    if (sp > 2) { ctx.strokeStyle = `rgba(255,240,210,${Math.min(0.5, sp / 12)})`; ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - v.x * 0.07, p.y - v.y * 0.07); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.lineCap = 'butt'; }
    if (d.foShape) { if (!d.stuckIn) drawFoPiece(d); return; }   // T67: a breakaway piece on the floor (T69: a stuck one is drawn over the robots)
    if (d.key === 'blade') { drawBlade(d, null); return; }
    if (d.key === 'buzz') { drawBuzz(d, null); return; }
    if (d.key === 'record') { drawRecord(d); return; }
    if (d.key === 'brick') { drawBrick(d, false); return; }
    if (d.key === 'yoyo') { drawBuzz(d, { buzzW: d.body.getAngularVelocity(), buzzMax: 130, buzzR: 0.19 }); return; }
    if (d.key === 'orbdisc' || d.key === 'gmsaw') { drawBuzz(d, { buzzW: d.body.getAngularVelocity(), buzzMax: 95, buzzR: 0.13 }); return; }
    if (d.key === 'glove') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); gloveShape(1); ctx.restore(); return; }
    if (d.key === 'ball') { drawBall(d); return; }
    if (d.key === 'shell') { if (d.bare) drawFlywheel(d, null); else drawShell(d, null, 0); return; }
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
    for (const R of S.robots) if (R.foFires && R.foFires.length) drawFuelFires(R);   // T71c: Rotisserie's burning fuel trail
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
      const H = L.HALF, sl = A.spikeLen || 1.4, nk = Math.round(sl / 0.1); ctx.fillStyle = '#C9CBC4'; ctx.strokeStyle = INK; ctx.lineWidth = PX * 1.5;   // spikeLen: half the spiked length of each wall (Killbox, 17 Nov: nearly the whole wall)
      const strip = (x0, y0, dx, dy, nx, ny) => { for (let k = 0; k < nk; k++) { const x = x0 + dx * k * 0.2, y = y0 + dy * k * 0.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 0.1 + nx * 0.13, y + dy * 0.1 + ny * 0.13); ctx.lineTo(x + dx * 0.2, y + dy * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke(); } };
      strip(-sl, -H + 0.01, 1, 0, 0, 1); strip(-sl, H, 1, 0, 0, -1); strip(-H, -sl, 0, 1, 1, 0); strip(H, -sl, 0, 1, -1, 0);
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
      else if (p.t === 'puff') { ctx.fillStyle = `rgba(122,110,94,${0.55 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.29); ctx.fill(); ctx.fillStyle = `rgba(214,206,192,${0.5 * k})`; ctx.beginPath(); ctx.arc(p.x - p.s * 0.25, p.y - p.s * 0.25, p.s * 0.55, 0, 6.29); ctx.fill(); }
      else if (p.t === 'impact') { const r0 = p.s * (0.75 + 0.45 * (1 - k)), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r0); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(0.35, `rgba(255,248,225,${0.85 * k})`); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r0, 0, 6.29); ctx.fill(); }
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
    if (window.RSound) { const n0 = S.countdown > 0 ? Math.ceil(S.countdown) : S.t < 0.8 ? -1 : -2; if (n0 !== sndCd) { sndCd = n0; if (n0 > 0) window.RSound.play('ping'); else if (n0 === -1) window.RSound.play('bell'); } }   // 3, 2, 1, bell
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
    for (const R of S.robots) if (R.forks && !R.inPit) drawForks(R, R.id);
    for (const R of order) { const jg = lopShake(R); if (jg) { ctx.save(); ctx.translate(jg[0], jg[1]); } drawRobot(R, R.id); if (jg) ctx.restore(); } // T72: Buzzkill's lopsided bar shakes the whole robot (drawing only; the sim's shake is real but small on screen)
    for (const d of S.debris) if (d.stuckIn && d.foShape) drawFoPiece(d);   // T69: a spear tip stuck in a robot shows on top of it
    drawTows();
    for (const R of order) if (R.winch && R.spec.weapon === 'anchor' && !R.inPit) drawAnchor(R); // the anchor sits in the wall, over the wall drawing
    for (const R of order) if (R.bricks && R.l4.carry && R.l4.carry.attached && !R.inPit) drawBrick(R.l4.carry, true); // a block up on the crane hook is above everything
    drawEwalls(); drawDrones();
    for (const sn of S.snags) { const t = performance.now() / 1000, k = sn.force ? Math.min(1, sn.force / 7000) : 0; ctx.strokeStyle = `rgba(255,${200 - k * 150},60,${0.6 + 0.4 * Math.sin(t * 20)})`; ctx.lineWidth = PX * (3 + k * 4); ctx.beginPath(); ctx.arc(sn.x, sn.y, 0.07 + k * 0.05, 0, 6.29); ctx.stroke(); }
    drawWalls(); drawDents();
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
    fitPanels();
  }
  // no scrolling: a column whose robot panels are taller than the screen draws them smaller (never below half size)
  let fitTick = 0;
  function fitPanels() {
    if (fitTick++ % 12 || !root || window.matchMedia('(max-width:900px),(orientation:portrait)').matches) return;
    for (const col of [root.querySelector('.fv-left'), root.querySelector('.fv-right')]) {
      if (!col || !col.clientHeight) continue;
      let z = col._z || 1; const need = col.scrollHeight, have = col.clientHeight;
      if (need > have + 1) z = Math.max(0.5, z * have / need * 0.985);
      else if (z < 1 && need < have * 0.93) z = Math.min(1, z * 1.03);
      if (z !== col._z) { col._z = z; for (const el of col.children) el.style.zoom = z; }
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
  .fv-arena canvas{width:min(calc((100vh - 180px) * .85),calc(100vw - 650px));height:min(calc((100vh - 180px) * .85),calc(100vw - 650px));min-width:280px;min-height:280px;border-radius:3px;display:block;outline:4px dashed #E8C547;outline-offset:2px}
  /* Kev, 11 Nov: no scrolling in the fight view. The arena is 15% smaller, a wide robot panel puts its damage diagram next to
     its part list, and fitPanels() shrinks the panels of a column that still does not fit. */
  .fv-col{display:flex;flex-direction:column;gap:10px;min-height:0;overflow:hidden}
  .fv-left,.fv-right{display:flex;flex-direction:column;gap:10px;overflow:hidden;min-height:0;flex:1;container-type:inline-size}
  @container (min-width:360px){.fv-body{grid-template-columns:minmax(130px,34%) 1fr;align-items:start}.fv-diag{height:150px}}
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
  .fv-info{flex:0 0 auto;background:#FFFDF8;border:2px solid #2B2118;border-radius:6px;padding:8px 12px;font-size:12.5px;line-height:1.4;overflow:hidden;max-height:190px}
  .fv-info[hidden]{display:none}
  .fv-info h4{margin:0 0 3px;font:700 11px "IBM Plex Mono",monospace;letter-spacing:1px;color:#6E6457}
  .fv-info .fv-ib{display:flex;justify-content:space-between;gap:8px}.fv-info .fv-ib i{font:600 12px "IBM Plex Mono",monospace;font-style:normal;white-space:nowrap}
  .fv-info .fv-next{margin-top:6px;padding-top:5px;border-top:2px dashed #CFC6B7;font-weight:600}
  .fv.aiming canvas{cursor:crosshair}
  .fv.has-cards .fv-arena canvas{width:min(calc((100vh - 275px) * .85),calc(100vw - 650px));height:min(calc((100vh - 275px) * .85),calc(100vw - 650px))}
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
      <button type="button" class="fv-snd" title="Sound on or off">🔊</button><button type="button" class="fv-pause" aria-pressed="false">Pause</button><button type="button" class="fv-skip">Skip to result</button><button type="button" class="fv-done go" hidden>Continue</button></div>
      <div class="fv-main"><div class="fv-col"><div class="fv-left"></div><div class="fv-info" hidden></div></div><div class="fv-arena"><canvas aria-label="Arena"></canvas><div class="fv-feed" aria-live="off"></div></div><div class="fv-right"></div></div>
      <div class="fv-foot"><div class="fv-cards" hidden><div class="fv-hint"></div><div class="fv-tray"></div></div></div>`;
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', onCanvasDown);
    cv.addEventListener('pointermove', e => { if (aim) hover = toWorld(e.clientX, e.clientY); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && aim && root && !root.hidden) cancelAim(); });
    { const sb = root.querySelector('.fv-snd'), SND = window.RSound; if (sb) { if (!SND) sb.hidden = true; else { const show = () => { sb.textContent = SND.muted() ? '🔇' : '🔊'; }; show(); sb.onclick = () => { SND.toggle(); show(); }; } } }
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
    parts = []; calls = []; tows = []; jolts = new Map(); slowT = 0; cam.tx = cam.ty = 0; cam.tz = 1;
  }
  let running = false, last = 0, acc = 0;
  function play(S2, o = {}) {
    S = S2; opts = o; ended = false; feedN = 0; parts = []; calls = []; tows = []; dents = []; jolts = new Map(); flashN = { wall: 0, robot: 0 }; rrLast.clear(); hitStop = 0; flash = 0; shake = 0; slowT = 0; decalReset();
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
    stepParticles(rdt * ts); if (ts > 0) vt += rdt * Math.min(1, ts);
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
    let bR = R; if (spec.flyoffGone) { const s2 = Object.assign({}, spec); delete s2.flyoffGone; s2.flyoffKeep = true; bR = L.create({ a: s2, b: s2, seed: 1 }).robots[0]; } // T71c: a robot without its piece is framed like the robot as it comes (same scale, same centre)
    for (const q of bR.parts) if (q.attached || q.kind === 'chassis') for (const [x, y] of q.home) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const k = size / (Math.max(x1 - x0, y1 - y0) + 0.3), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, b = R.body, pos = b.getPosition(), ang = b.getAngle();
    const sS = S, sCtx = ctx, sPX = PX;
    try {
      S = P; ctx = c.getContext('2d'); PX = 1 / k;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(size / 2, size / 2); ctx.scale(k, k); ctx.rotate(-Math.PI / 2);
      ctx.translate(-cx, -cy); ctx.rotate(-ang); ctx.translate(-pos.x, -pos.y);
      if (R.forks) drawForks(R, 0); // forks are not drawn by drawRobot (they go under everything)
      if (R.blade && R.joint) R.blade.body.setTransform(R.blade.body.getPosition(), ang + Math.PI / 2 - 0.3); // T72: a spinner bar across the nose (a lopsided half bar: the long arm to one side, the stub to the other)
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
    tray.innerHTML = cards.map((c, i) => `<button type="button" class="fv-card" data-i="${i}" aria-pressed="${aim && aim.key === c.key}" title="${esc(c.text || '')}"${(c.target === 'bot' || c.own) && !(c.valid || []).length ? ' disabled' : ''}><b>${c.icon || '🃏'}</b><span>${esc(c.name)}</span></button>`).join('');
    const sup = aim && aim.key && (cards.find(x => x.key === aim.key) || {}).crate;
    hint.innerHTML = `<span>${esc(hintText())}</span>` + (sup ? CRATES.map(([k, l]) => `<button type="button" data-crate="${k}" aria-pressed="${crate === k}">${esc(l)}</button>`).join('') : '');
    tray.querySelectorAll('.fv-card').forEach(b => b.onclick = () => pickCard(cards[+b.dataset.i]));
    hint.querySelectorAll('[data-crate]').forEach(b => b.onclick = () => { crate = b.dataset.crate; drawCards(); });
  }
  function pickCard(c) {
    if (!c || (S && S.over)) return;
    if (aim && aim.key === c.key) { cancelAim(); return; }
    const valid = (c.valid || []).filter(i => S.robots[i] && S.robots[i].alive);
    if ((c.target === 'bot' || c.own) && !valid.length) return;   // a card for your own robot, and you have none in this fight (15 Nov: it looked playable, was refused, and on a joined screen left the tray)
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
  window.RobocusView = { mount, play, skip, close, integrity, replace(S2) { S = S2; if (root && !root.hidden) { buildPanels(); updatePanels(); } },   /* a replayed fight has new robot objects: the panels must show those, not the old copy */ portrait, drawDiagram, insideRows, V, setCards, toWorld, clientOf, get aiming() { return aim; }, get state() { return S; }, get fx() { return { flashes: flashN.wall + flashN.robot, wall: flashN.wall, robot: flashN.robot, dents: dents.length }; } };
})();
