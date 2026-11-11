// ROBOCUS Arena Looks (Nov 2026): three top-down art directions drawing the same live 2.0 fight.
// The engine (engine.js + lineup.js) is unchanged; this file only draws. Flips are shown from above as a roll
// (the robot narrows across its width, then shows its belly); height shows as scale and a longer shadow.
(function () {
  'use strict';
  const L = window.DamageLab, LU = window.Lineup; LU.usePK();
  const $ = id => document.getElementById(id);
  const st = { a: 'Vertigo', b: 'Juggernaut', arena: 'open', seed: 1, speed: 1, paused: false };
  const ROBOTS = Object.assign({}, LU.ROBOTS, LU.ROBOTS4 || {});
  const LVN = ['Level 0 (starters)', 'Level 1', 'Level 2', 'Level 3', 'Level 4 (end game)'];
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const LIGHT = (() => { const x = -0.6, y = -0.8; return [x, y]; })(); // light from the top left: shadows fall down and right

  // ---------- small helpers ----------
  function path(c, vs) { c.beginPath(); c.moveTo(vs[0][0], vs[0][1]); for (let i = 1; i < vs.length; i++) c.lineTo(vs[i][0], vs[i][1]); c.closePath(); }
  function bbox(vs) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const v of vs) { x0 = Math.min(x0, v[0]); y0 = Math.min(y0, v[1]); x1 = Math.max(x1, v[0]); y1 = Math.max(y1, v[1]); } return [x0, y0, x1, y1]; }
  function cen(vs) { let x = 0, y = 0; for (const v of vs) { x += v[0]; y += v[1]; } return [x / vs.length, y / vs.length]; }
  function shade(hex, k) { // k > 0 lighter, k < 0 darker
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return hex6(r, g, b);
  }
  const hex6 = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function mix(hex, hex2, k) { const a = parseInt(hex.slice(1), 16), b = parseInt(hex2.slice(1), 16); const f = (s) => ((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k; return hex6(f(16), f(8), f(0)); }
  function addPoly(c, vs, dx, dy) { dx = dx || 0; dy = dy || 0; c.moveTo(vs[0][0] + dx, vs[0][1] + dy); for (let i = 1; i < vs.length; i++) c.lineTo(vs[i][0] + dx, vs[i][1] + dy); c.closePath(); }
  function crescent(c, vs, ld, d, fill) { c.save(); path(c, vs); c.clip(); c.beginPath(); c.rect(-3, -3, 6, 6); addPoly(c, vs, ld[0] * d, ld[1] * d); c.fillStyle = fill; c.fill('evenodd'); c.restore(); } // the far side from the lamp
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const vsOf = p => (p.outline && p.outline.length >= 3 ? p.outline : p.verts);
  const isSpin = p => p.kind === 'wheel' && !p.leg;

  // ---------- shared view state: height, roll, wobble, eyes ----------
  const VS = new Map();
  function vis(R) { let v = VS.get(R); if (!v) { v = { roll: R.flipped ? Math.PI : 0, flipT: 0, last: R.flipped, wob: 0, ph: 0, blink: 2 + Math.random() * 3, squint: 0 }; VS.set(R, v); } return v; }
  function updateVis(S, dt) {
    for (const R of S.robots) {
      const v = vis(R);
      const air = R.airborne > 0 ? Math.sin(Math.PI * Math.min(1, 1 - R.airborne / Math.max(R.airMax, 0.01))) : 0;
      const carried = S.robots.some(Q => Q.carry && Q.carry.robot === R);
      if (R.flipped !== v.last) { v.last = R.flipped; v.flipT = 0.5; }
      v.roll += ((R.flipped ? Math.PI : 0) - v.roll) * (1 - Math.exp(-dt * 8));
      let hop = 0; if (v.flipT > 0) { v.flipT -= dt; hop = Math.sin(Math.PI * Math.max(0, 1 - v.flipT / 0.5)) * 0.22; }
      v.h = air * (0.12 + (R.airMax || 0) * 0.9) + (R.lifted > 0 ? 0.05 : 0) + (carried ? 0.12 : 0) + hop;
      v.wob *= Math.exp(-dt * 5); v.ph += dt * 26; v.squint = Math.max(0, v.squint - dt);
      v.blink -= dt; if (v.blink < -0.12) v.blink = 2 + Math.random() * 4;
    }
  }
  function nudge(S, x, y, k) { for (const R of S.robots) { const p = R.body.getPosition(); if (Math.hypot(p.x - x, p.y - y) < R.hl + 0.35) { const v = vis(R); v.wob = Math.min(1, v.wob + k); v.squint = 0.35; } } }

  // ---------- shared particles, words and callouts ----------
  const P = [], WORDS = [], CALLS = [];
  let shake = 0;
  function emit(t, x, y, vx, vy, life, s) { if (P.length < 900) P.push({ t, x, y, vx, vy, life, max: life, s: s || 1, r: Math.random() }); }
  function burst(t, x, y, n, sp, life, s) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.9); emit(t, x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.7), s); } }
  let lastWord = -9;
  function word(x, y, w, big) { const now = performance.now() / 1000; if (!big && (now - lastWord < 0.45 || WORDS.length >= 2)) return; lastWord = now; WORDS.push({ x, y, w, big: !!big, t: 0, rot: (Math.random() - 0.5) * 0.5, seed: Math.random() * 1e6 | 0 }); if (WORDS.length > 2) WORDS.shift(); }
  const HITW = ['KRANG!', 'WHAM!', 'CRUNCH!', 'BONK!', 'SKRANG!', 'THWACK!'];
  function stepFx(dt) {
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life -= dt; if (p.life <= 0) { P.splice(i, 1); continue; } const dr = p.t === 'spark' ? 1.2 : 3; p.vx *= 1 - dr * dt; p.vy *= 1 - dr * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    for (let i = WORDS.length - 1; i >= 0; i--) { WORDS[i].t += dt; if (WORDS[i].t > 0.9) WORDS.splice(i, 1); }
    for (let i = CALLS.length - 1; i >= 0; i--) { CALLS[i].t += dt; if (CALLS[i].t > 1.4) CALLS.splice(i, 1); }
    shake *= Math.exp(-dt * 9);
  }
  function consumeFx(S) {
    for (const e of S.fx) {
      const t = e.type;
      if (t === 'spark') { const n = Math.min(14, 2 + (e.power || 10) / 6); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * 3; emit('spark', e.x, e.y, Math.cos(a) * v + (e.nx || 0) * 2, Math.sin(a) * v + (e.ny || 0) * 2, 0.18 + Math.random() * 0.25); } if ((e.power || 0) > 25) nudge(S, e.x, e.y, 0.25); }
      else if (t === 'bigHit') { burst('spark', e.x, e.y, 18, 4.5, 0.4); burst('bit', e.x, e.y, 4, 2, 0.6); shake = Math.min(0.12, shake + 0.03 + (e.power || 0) * 0.0008); nudge(S, e.x, e.y, 0.6); word(e.x, e.y, (e.power || 0) > 45 ? 'KA-BLAM!' : HITW[Math.random() * HITW.length | 0], (e.power || 0) > 45); }
      else if (t === 'skid') for (const s of STYLES) s.decal('skid', e.x, e.y, e.a);
      else if (t === 'scrape') { for (const s of STYLES) s.decal('scrape', e.x, e.y); emit('spark', e.x, e.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.15); }
      else if (t === 'thud') { burst('dust', e.x, e.y, 9, 1.3, 0.6); shake = Math.min(0.1, shake + 0.03); if ((e.power || 0) > 0.4) word(e.x, e.y, 'THUD!'); }
      else if (t === 'detach') { burst('spark', e.x, e.y, 10, 3, 0.35); burst('bit', e.x, e.y, 5, 2.5, 0.7); word(e.x, e.y, 'SNAP!'); }
      else if (t === 'boom' || t === 'shatter' || t === 'slam' || t === 'piston') { burst('fire', e.x, e.y, 16, 2, 0.5); burst('smoke', e.x, e.y, 10, 1, 1.2, 1.5); for (const s of STYLES) s.decal('scorch', e.x, e.y); shake = Math.min(0.25, shake + 0.12); word(e.x, e.y, t === 'slam' ? 'SLAM!' : 'BOOM!', true); }
      else if (t === 'punch') { burst('dust', e.x, e.y, 5, 1, 0.4); word(e.x, e.y, 'POW!'); nudge(S, e.x, e.y, 0.5); }
      else if (t === 'boing') word(e.x, e.y, 'BOING!');
      else if (t === 'launch') { burst('dust', e.x, e.y, 6, 1.2, 0.5); word(e.x, e.y, 'WHOOSH!'); }
      else if (t === 'smokebomb') burst('smoke', e.x, e.y, 30, 1.8, 2, 2);
      else if (t === 'scorch') for (const s of STYLES) s.decal('scorch', e.x, e.y);
      else if (t === 'callout') { CALLS.push({ text: e.text, x: e.x, y: e.y, big: !!e.big, t: 0, rot: (Math.random() - 0.5) * 0.12 }); if (CALLS.length > 2) CALLS.shift(); }
    }
    S.fx.length = 0;
  }
  function emitters(S) {
    for (const R of S.robots) {
      const p = R.body.getPosition();
      if (R.battery && R.battery.fire && Math.random() < 0.4) { emit('fire', p.x + (Math.random() - 0.5) * 0.2, p.y + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3, -0.4, 0.5); if (Math.random() < 0.3) emit('smoke', p.x, p.y, 0.1, -0.5, 1.4, 1.2); }
      if (R.flameOn > 0 && R.turret && R.turret.hp > 0) { const a = R.turretA, cx = Math.cos(a), sy = Math.sin(a); for (let i = 0; i < 3; i++) emit('fire', p.x + cx * 0.32, p.y + sy * 0.32, cx * (3 + Math.random() * 2) + (Math.random() - 0.5), sy * (3 + Math.random() * 2) + (Math.random() - 0.5), 0.32); }
      if (!R.alive && Math.random() < 0.06) emit('smoke', p.x, p.y, 0.05, -0.3, 1.6, 1.2);
    }
    for (const pr of S.projs) if (!pr.dead && pr.rocket && Math.random() < 0.7) emit('fire', pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02, 0, 0, 0.25, 0.7);
  }

  // ---------- one style = floor painter + part painter + effects painter ----------
  const FM = 9.2, FPX = 1024, PPM = FPX / FM; // floor canvas covers 9.2 m
  function makeFloorCanvas() { const c = document.createElement('canvas'); c.width = c.height = FPX; return c; }
  const toF = v => (v + FM / 2) * PPM;

  // ======== WORKSHOP: painted steel under one work lamp ========
  const WS = {
    team: ['#3F78A8', '#C8642B', '#4C8A3F', '#8B6BB1'],
    paint(c, arena) {
      const r = rng(7), ice = !!arena.ice;
      c.fillStyle = ice ? '#9FB6C2' : '#3B3631'; c.fillRect(0, 0, FPX, FPX);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
        const x = (i - 4.5 + 0.1) * PPM + FPX / 2 - 4.5 * PPM + 4.5 * PPM, y = (j - 4.5 + 0.1) * PPM + FPX / 2;
        const px = toF(i - 4.5), py = toF(j - 4.5), sh = (r() - 0.5) * 10;
        const g = c.createLinearGradient(px, py, px + PPM, py + PPM);
        if (ice) { g.addColorStop(0, `rgb(${200 + sh},${222 + sh},${232})`); g.addColorStop(1, `rgb(${180 + sh},${204 + sh},${218})`); }
        else { g.addColorStop(0, `rgb(${96 + sh},${90 + sh},${82 + sh})`); g.addColorStop(1, `rgb(${78 + sh},${73 + sh},${66 + sh})`); }
        c.fillStyle = g; c.fillRect(px + 2, py + 2, PPM - 4, PPM - 4);
        c.fillStyle = ice ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.07)'; c.fillRect(px + 2, py + 2, PPM - 4, 2); c.fillRect(px + 2, py + 2, 2, PPM - 4);
        if (!ice) for (const [a, b] of [[9, 9], [PPM - 9, 9], [9, PPM - 9], [PPM - 9, PPM - 9]]) { c.fillStyle = 'rgba(20,16,12,0.6)'; c.beginPath(); c.arc(px + a + 0.6, py + b + 0.8, 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,190,175,0.35)'; c.beginPath(); c.arc(px + a - 0.5, py + b - 0.6, 2, 0, TAU); c.fill(); }
      }
      for (let k = 0; k < 2500; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'; c.fillRect(r() * FPX, r() * FPX, 1 + r() * 2, 1 + r() * 2); }
      for (let k = 0; k < 120; k++) { c.strokeStyle = `rgba(${ice ? '255,255,255' : '210,200,185'},${0.05 + r() * 0.08})`; c.lineWidth = 1; const x = r() * FPX, y = r() * FPX, a = r() * TAU, l = 10 + r() * 60; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
      if (!ice) for (let k = 0; k < 6; k++) { const x = toF((r() - 0.5) * 6), y = toF((r() - 0.5) * 6), rr = (0.2 + r() * 0.4) * PPM, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(15,12,8,0.35)'); g.addColorStop(1, 'rgba(15,12,8,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
      hazardBand(c, arena, '#E2B93B', '#1E1A15');
      for (const s of arena.saws) { c.fillStyle = '#14110D'; c.beginPath(); c.ellipse(toF(s[0]), toF(s[1]), 0.44 * PPM, 0.08 * PPM, 0, 0, TAU); c.fill(); c.strokeStyle = '#E2B93B'; c.lineWidth = 2; c.stroke(); }
      const g = c.createRadialGradient(toF(-1.5), toF(-1.8), 0.5 * PPM, toF(0), toF(0), 7 * PPM); g.addColorStop(0, 'rgba(255,240,210,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.38)'); c.fillStyle = g; c.fillRect(0, 0, FPX, FPX);
    },
    decal(c, kind, x, y, a) {
      const px = toF(x), py = toF(y);
      if (kind === 'skid') { c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = 'rgba(12,10,8,0.09)'; c.fillRect(-6, -3.5, 12, 7); c.restore(); }
      else if (kind === 'scrape') { c.strokeStyle = 'rgba(230,224,212,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (Math.random() - 0.5) * 14, py + (Math.random() - 0.5) * 14); c.stroke(); }
      else if (kind === 'scorch') { const g = c.createRadialGradient(px, py, 0, px, py, 0.5 * PPM); g.addColorStop(0, 'rgba(10,6,2,0.6)'); g.addColorStop(1, 'rgba(10,6,2,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, 0.5 * PPM, 0, TAU); c.fill(); }
    },
    colour(part, R) {
      const team = this.team[R.id % 4];
      if (part.lid || part.col === 'lid') return shade(team, -0.3);
      if (part.kind === 'chassis') return R.alive ? team : shade(team, -0.45);
      if (part.kind === 'lid') return R.alive ? shade(team, -0.28) : '#4A4540';
      if (part.kind === 'wheel') return part.leg ? '#4A4540' : '#26221E';
      if (part.kind === 'armour') return { rubber: '#34302C', spring: '#C9A23A', spiked: '#7E8078', fibre: '#3E8E8B' }[part.bumper] || '#8E9088';
      return { flipper: '#D2A933', lifter: '#D2A933', wedge: '#777A72', blade: '#B4B6AF', spear: '#C3C5BE', vdisc: '#C3C5BE', buzz: '#C3C5BE' }[part.key] || '#6E7068';
    },
    part(c, part, R, ld, under) {
      const vs = vsOf(part), col = under && part.kind === 'chassis' ? '#3E3A35' : this.colour(part, R), [x0, y0, x1, y1] = bbox(vs), m = cen(vs), rr = Math.max(x1 - x0, y1 - y0) * 0.6;
      const f = part.maxHp ? clamp(part.hp / part.maxHp, 0, 1) : 1, base = f < 1 ? mix(col.startsWith('#') ? col : '#555555', '#1E1A16', (1 - f) * 0.4) : col;
      const g = c.createLinearGradient(m[0] + ld[0] * rr, m[1] + ld[1] * rr, m[0] - ld[0] * rr, m[1] - ld[1] * rr);
      const hex = base.startsWith('#') ? base : null;
      g.addColorStop(0, hex ? shade(hex, 0.22) : base); g.addColorStop(1, hex ? shade(hex, -0.3) : base);
      path(c, vs); c.fillStyle = g; c.fill();
      if (isSpin(part)) { // tread that moves with the wheel
        c.save(); path(c, vs); c.clip(); const step = 0.035, off = (((part.slot ? part.slot.spin : 0) * 0.07) % step + step) % step;
        c.strokeStyle = 'rgba(90,82,74,0.9)'; c.lineWidth = 0.012; for (let x = x0 - step + off; x < x1 + step; x += step) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 0.008, y1); c.stroke(); } c.restore();
      }
      // bevel: light on the lamp side, shade on the far side
      c.save(); path(c, vs); c.clip();
      c.translate(-ld[0] * 0.011, -ld[1] * 0.011); path(c, vs); c.strokeStyle = 'rgba(255,248,235,0.42)'; c.lineWidth = 0.014; c.stroke();
      c.translate(ld[0] * 0.022, ld[1] * 0.022); path(c, vs); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 0.014; c.stroke(); c.restore();
      path(c, vs); c.strokeStyle = 'rgba(16,12,9,0.85)'; c.lineWidth = 0.006; c.lineJoin = 'round'; c.stroke();
      if (part.dents && part.dents.length && /chassis|armour|lid/.test(part.kind)) for (const d of part.dents) { c.save(); path(c, vs); c.clip(); const gg = c.createRadialGradient(d.x + ld[0] * d.r * 0.3, d.y + ld[1] * d.r * 0.3, 0, d.x, d.y, d.r); gg.addColorStop(0, 'rgba(0,0,0,0.35)'); gg.addColorStop(0.8, 'rgba(0,0,0,0.1)'); gg.addColorStop(1, 'rgba(255,255,255,0.12)'); c.fillStyle = gg; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill(); c.restore(); }
      if ((part.heat || 0) > 30) { path(c, vs); c.fillStyle = `rgba(255,110,30,${Math.min(0.5, (part.heat - 30) / 140)})`; c.fill(); }
      if (part.kind === 'chassis' && !under) { // bolts and a seam
        const [a0, b0, a1, b1] = bbox(part.verts);
        for (const [bx, by] of [[a0 + 0.04, b0 + 0.04], [a1 - 0.04, b0 + 0.04], [a0 + 0.04, b1 - 0.04], [a1 - 0.04, b1 - 0.04]]) bolt(c, bx, by, ld);
      }
      if (part.kind === 'chassis' && under) { c.fillStyle = '#E2B93B'; c.fillRect(-R.hl * 0.5, -0.025, R.hl, 0.05); c.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 4; k++) c.fillRect(-R.hl * 0.45 + k * R.hl * 0.27, -0.025, 0.06, 0.05); }
      if ((part.key === 'wedge' || part.key === 'flipper') && !under) { c.save(); path(c, vs); c.clip(); c.strokeStyle = 'rgba(20,16,12,0.5)'; c.lineWidth = 0.02; for (let k = -6; k < 8; k++) { c.beginPath(); c.moveTo(x0 + k * 0.06, y0); c.lineTo(x0 + k * 0.06 + 0.1, y1); c.stroke(); } c.restore(); }
    },
    lid(c, R, ld) {
      const L0 = R.lid, vs = vsOf(L0);
      c.save(); c.translate(-ld[0] * 0.014, -ld[1] * 0.014); path(c, vs); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill(); c.restore();
      const lo = L0.state === 'loose' ? Math.sin(performance.now() / 30) * 0.006 : 0; c.save(); c.translate(lo, -lo);
      this.part(c, L0, R, ld); const [x0, y0, x1, y1] = bbox(L0.verts); for (const [bx, by] of [[x0 + 0.03, y0 + 0.03], [x1 - 0.03, y0 + 0.03], [x0 + 0.03, y1 - 0.03], [x1 - 0.03, y1 - 0.03]]) if (!(L0.state === 'loose' && bx > 0 && by < 0)) bolt(c, bx, by, ld);
      c.fillStyle = 'rgba(255,248,235,0.55)'; c.font = '700 0.09px "Saira Stencil One", Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.save(); c.rotate(Math.PI / 2); c.fillText(String(R.id + 1).padStart(2, '0'), (y0 + y1) / 2, -(x0 + x1) / 2); c.restore();
      c.restore();
    },
    guts(c, R) { // lid gone: you see inside
      const vs = vsOf(R.chassis), [x0, y0, x1, y1] = bbox(R.chassis.verts);
      c.fillStyle = 'rgba(14,12,10,0.75)'; c.fillRect(x0 * 0.7, y0 * 0.7, (x1 - x0) * 0.7, (y1 - y0) * 0.7);
      for (const q of R.internals) { if (!q.lp) continue; const dead = q.hp <= 0, w = q.key === 'battery' ? 0.12 : q.key === 'chip' ? 0.05 : 0.07, h = q.key === 'battery' ? 0.08 : 0.05; c.fillStyle = dead ? '#2A2622' : { battery: '#3E7D45', chip: '#2F6B3A', radio: '#5A5650', motor: '#7A7C74', wmotor: '#7A7C74' }[q.key] || '#6A6660'; c.fillRect(q.lp[0] - w / 2, q.lp[1] - h / 2, w, h); if (q.key === 'battery' && q.fire) { c.fillStyle = 'rgba(255,120,30,0.6)'; c.fillRect(q.lp[0] - w / 2, q.lp[1] - h / 2, w, h); } }
    },
    turret(c, R, ld) {
      const w = R.spec.weapon, dead = R.turret.hp <= 0, col = dead ? '#4A4743' : '#8C8F86';
      c.save(); c.rotate(R.turretA - R.body.getAngle());
      const bar = (len, wd, off) => { c.fillStyle = shade('#55524C', 0); c.fillRect(0.05, (off || 0) - wd / 2, len, wd); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0.05, (off || 0) - wd / 2, len, wd * 0.3); };
      if (w === 'rapid') { bar(0.3, 0.035, -0.035); bar(0.3, 0.035, 0.035); } else if (w === 'heavy') bar(0.36, 0.09); else if (w === 'mortar') { c.fillStyle = '#4A4743'; c.beginPath(); c.arc(0.12, 0, 0.09, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(0.12, 0, 0.055, 0, TAU); c.fill(); } else bar(w === 'flame' ? 0.26 : 0.32, w === 'flame' ? 0.07 : 0.05);
      const g = c.createRadialGradient(ld[0] * 0.05, ld[1] * 0.05, 0.01, 0, 0, 0.14); g.addColorStop(0, shade(col.startsWith('#') ? col : '#8C8F86', 0.3)); g.addColorStop(1, shade('#5A5C55', -0.2)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 0.13, 0, TAU); c.fill(); c.strokeStyle = 'rgba(16,12,9,0.85)'; c.lineWidth = 0.006; c.stroke();
      if (w === 'laser') { c.fillStyle = '#E04B3A'; c.beginPath(); c.arc(0.35, 0, 0.025, 0, TAU); c.fill(); }
      c.restore();
    },
    shadow(c, R, v, sil) { const h = v.h || 0, off = 0.035 + h * 0.9; c.save(); c.translate(-LIGHT[0] * off, -LIGHT[1] * off); c.globalAlpha = 0.42 - Math.min(0.25, h * 0.4); sil('#0B0906'); c.globalAlpha *= 0.5; c.translate(-LIGHT[0] * 0.025, -LIGHT[1] * 0.025); sil('#0B0906'); c.restore(); },
    particles(c) {
      for (const p of P) { const f = p.life / p.max;
        if (p.t === 'spark') { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,${200 + 50 * f | 0},120,${f})`; c.lineWidth = 0.014; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); c.globalCompositeOperation = 'source-over'; }
        else if (p.t === 'fire') { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 0.09 * p.s); g.addColorStop(0, `rgba(255,220,120,${f})`); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, 0.09 * p.s, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }
        else if (p.t === 'dust') { c.fillStyle = `rgba(150,138,120,${0.35 * f})`; c.beginPath(); c.arc(p.x, p.y, 0.05 + (1 - f) * 0.14, 0, TAU); c.fill(); }
        else if (p.t === 'smoke') { c.fillStyle = `rgba(55,50,45,${0.4 * f})`; c.beginPath(); c.arc(p.x, p.y, (0.08 + (1 - f) * 0.3) * p.s, 0, TAU); c.fill(); }
        else if (p.t === 'bit') { c.fillStyle = `rgba(120,122,115,${f})`; c.fillRect(p.x - 0.012, p.y - 0.012, 0.024, 0.024); } }
    },
    font: big => `400 ${big ? 46 : 30}px "Saira Stencil One", Impact, sans-serif`,
    call(c, s, x, y, text, big, k) { c.font = this.font(big); c.lineJoin = 'round'; c.lineWidth = big ? 8 : 6; c.strokeStyle = '#1E1A15'; c.strokeText(text, x, y); c.fillStyle = big ? '#E8C547' : '#FFF4D6'; c.fillText(text, x, y); },
    word() { },
    wall: { fill: '#3A3530', top: '#E2B93B', edge: '#1E1A15' },
  };
  function bolt(c, x, y, ld) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(x - ld[0] * 0.004, y - ld[1] * 0.004, 0.013, 0, TAU); c.fill(); c.fillStyle = '#B8B4AA'; c.beginPath(); c.arc(x, y, 0.011, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(x + ld[0] * 0.004, y + ld[1] * 0.004, 0.004, 0, TAU); c.fill(); }
  function hazardBand(c, arena, yel, blk) {
    const inset = arena.inset || 0, e0 = toF(-4 + inset), e1 = toF(4 - inset), w = 0.17 * PPM;
    c.save(); c.beginPath(); c.rect(e0, e0, e1 - e0, e1 - e0); c.rect(e0 + w, e0 + w, e1 - e0 - 2 * w, e1 - e0 - 2 * w); c.clip('evenodd');
    c.fillStyle = yel; c.fillRect(e0, e0, e1 - e0, e1 - e0); c.strokeStyle = blk; c.lineWidth = w * 0.5;
    for (let x = -FPX; x < 2 * FPX; x += w * 1.6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + FPX, FPX); c.stroke(); }
    c.restore();
  }

  // ======== TOY BOX: vinyl toys on a play mat ========
  const INKT = '#2A2140';
  const TB = {
    team: ['#3D9BFF', '#FF8A3D', '#45C979', '#AE7BFF'],
    paint(c, arena) {
      const ice = !!arena.ice;
      c.fillStyle = ice ? '#D9F1FF' : '#FFF1D6'; c.fillRect(0, 0, FPX, FPX);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i + j) % 2) { c.fillStyle = ice ? '#C8E8FA' : '#FFE5BD'; c.fillRect(toF(i - 4.5), toF(j - 4.5), PPM, PPM); }
      c.strokeStyle = ice ? 'rgba(90,150,200,0.25)' : 'rgba(220,150,90,0.25)'; c.lineWidth = 3; c.setLineDash([10, 12]);
      c.beginPath(); c.arc(toF(0), toF(0), 1.1 * PPM, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(toF(0), toF(-4)); c.lineTo(toF(0), toF(4)); c.stroke(); c.setLineDash([]);
      const r = rng(3); for (let k = 0; k < 26; k++) { star(c, toF((r() - 0.5) * 7.6), toF((r() - 0.5) * 7.6), 6 + r() * 8, 5, ice ? 'rgba(120,180,230,0.35)' : 'rgba(255,170,110,0.35)'); }
      const inset = arena.inset || 0, e0 = toF(-4 + inset), e1 = toF(4 - inset);
      c.strokeStyle = ice ? '#8CC8F0' : '#FFB36B'; c.lineWidth = 8; c.strokeRect(e0 + 10, e0 + 10, e1 - e0 - 20, e1 - e0 - 20);
      for (const s of arena.saws) { c.fillStyle = '#5A4E72'; c.beginPath(); c.ellipse(toF(s[0]), toF(s[1]), 0.44 * PPM, 0.09 * PPM, 0, 0, TAU); c.fill(); c.strokeStyle = INKT; c.lineWidth = 4; c.stroke(); }
    },
    decal(c, kind, x, y, a) {
      const px = toF(x), py = toF(y);
      if (kind === 'skid') { c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = 'rgba(120,90,150,0.07)'; c.fillRect(-6, -3, 12, 6); c.restore(); }
      else if (kind === 'scorch') { c.fillStyle = 'rgba(70,50,90,0.18)'; c.beginPath(); for (let k = 0; k < 10; k++) { const an = k / 10 * TAU, rr = (0.25 + Math.random() * 0.15) * PPM; c.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr); } c.fill(); }
    },
    colour(part, R) {
      const team = this.team[R.id % 4];
      if (part.lid || part.col === 'lid') return shade(team, -0.2);
      if (part.kind === 'chassis') return R.alive ? team : mix(team, '#9A93A8', 0.6);
      if (part.kind === 'lid') return R.alive ? shade(team, 0.25) : '#B9B2C6';
      if (part.kind === 'wheel') return '#4A4060';
      if (part.kind === 'armour') return { rubber: '#5A5070', spring: '#FFD23F', spiked: '#C7C2D6', fibre: '#58D6C9' }[part.bumper] || '#D9D4E6';
      return { flipper: '#FFD23F', lifter: '#FFD23F', wedge: '#C7C2D6', blade: '#E8E6F0', spear: '#E8E6F0', vdisc: '#E8E6F0', buzz: '#E8E6F0', drum: '#FF6FA8', jaws: '#FF6FA8', glove: '#FF5A5A', ball: '#7A6FA0' }[part.key] || '#B4AECB';
    },
    part(c, part, R, ld, under) {
      const vs = vsOf(part), base = under && part.kind === 'chassis' ? '#7A7090' : this.colour(part, R), f = part.maxHp ? clamp(part.hp / part.maxHp, 0, 1) : 1;
      const col = f < 1 && base.startsWith('#') ? mix(base, '#6E6480', (1 - f) * 0.5) : base;
      c.lineJoin = 'round'; path(c, vs); c.fillStyle = col; c.fill();
      crescent(c, vs, ld, 0.03, 'rgba(40,20,70,0.16)'); // soft shade on the far side
      if (isSpin(part)) { const [x0, y0, x1, y1] = bbox(vs); c.fillStyle = 'rgba(255,255,255,0.25)'; const off = (((part.slot ? part.slot.spin : 0) * 0.07) % 0.05 + 0.05) % 0.05; c.save(); path(c, vs); c.clip(); for (let x = x0 - 0.05 + off; x < x1; x += 0.05) c.fillRect(x, y0, 0.018, y1 - y0); c.restore(); }
      if (part.kind === 'chassis' && !under) { const [x0, y0, x1, y1] = bbox(part.verts); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x0 + (x1 - x0) * 0.32 + ld[0] * 0.02, y0 + (y1 - y0) * 0.3 + ld[1] * 0.02, (x1 - x0) * 0.16, (y1 - y0) * 0.09, 0.3, 0, TAU); c.fill(); }
      if (part.kind === 'chassis' && under) { c.fillStyle = '#FFD23F'; c.beginPath(); c.arc(0, 0, 0.07, 0, TAU); c.fill(); c.lineWidth = 0.018; c.strokeStyle = INKT; c.stroke(); }
      if (part.dents && part.dents.length && /chassis|armour|lid/.test(part.kind)) { c.save(); path(c, vs); c.clip(); for (const d of part.dents) { c.strokeStyle = 'rgba(42,33,64,0.45)'; c.lineWidth = 0.012; c.beginPath(); c.arc(d.x, d.y, d.r * 0.6, 0.3, 2.6); c.stroke(); } c.restore(); }
      if ((part.heat || 0) > 30) { path(c, vs); c.fillStyle = `rgba(255,80,60,${Math.min(0.45, (part.heat - 30) / 150)})`; c.fill(); }
      path(c, vs); c.lineWidth = 0.022; c.strokeStyle = INKT; c.stroke();
    },
    lid(c, R, ld) { const L0 = R.lid, lo = L0.state === 'loose' ? Math.sin(performance.now() / 30) * 0.008 : 0; c.save(); c.translate(lo, -lo); this.part(c, L0, R, ld); c.restore(); },
    guts(c, R) { const [x0, y0, x1, y1] = bbox(R.chassis.verts); c.fillStyle = '#3A2F55'; roundRect(c, x0 * 0.65, y0 * 0.65, (x1 - x0) * 0.65, (y1 - y0) * 0.65, 0.04); c.fill(); for (const q of R.internals) if (q.lp) { c.fillStyle = q.hp <= 0 ? '#2A2140' : { battery: '#7CFF8A', chip: '#5BE0FF' }[q.key] || '#B4AECB'; c.beginPath(); c.arc(q.lp[0], q.lp[1], 0.028, 0, TAU); c.fill(); } },
    eyes(c, R, v, S) {
      if (!R.chassis.attached) return; const hl = R.hl, hw = R.hw, E = R.enemy && R.enemy.body;
      let lx = 1, ly = 0; if (E) { const lp = R.body.getLocalPoint(E.getPosition()), d = Math.hypot(lp.x, lp.y) || 1; lx = lp.x / d; ly = lp.y / d; }
      const ex = hl * 0.5, er = Math.min(0.06, hw * 0.2);
      for (const sy of [-1, 1]) {
        const ey = sy * hw * 0.34;
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, er, er * 1.1, 0, 0, TAU); c.fill(); c.lineWidth = 0.014; c.strokeStyle = INKT; c.stroke();
        if (!R.alive) { c.beginPath(); c.moveTo(ex - er * 0.6, ey - er * 0.6); c.lineTo(ex + er * 0.6, ey + er * 0.6); c.moveTo(ex + er * 0.6, ey - er * 0.6); c.lineTo(ex - er * 0.6, ey + er * 0.6); c.stroke(); continue; }
        const closed = v.blink < 0 || v.squint > 0;
        if (closed) { c.beginPath(); c.moveTo(ex - er * 0.7, ey); c.lineTo(ex + er * 0.7, ey); c.lineWidth = 0.016; c.stroke(); continue; }
        c.fillStyle = INKT; c.beginPath(); c.arc(ex + lx * er * 0.45, ey + ly * er * 0.45, er * 0.5, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + lx * er * 0.45 - er * 0.18, ey + ly * er * 0.45 - er * 0.18, er * 0.16, 0, TAU); c.fill();
      }
    },
    turret(c, R) { c.save(); c.rotate(R.turretA - R.body.getAngle()); c.fillStyle = '#8F86A8'; roundRect(c, 0.04, -0.03, 0.3, 0.06, 0.03); c.fill(); c.lineWidth = 0.018; c.strokeStyle = INKT; c.stroke(); c.fillStyle = R.turret.hp > 0 ? '#D9D4E6' : '#7A7090'; c.beginPath(); c.arc(0, 0, 0.12, 0, TAU); c.fill(); c.stroke(); c.restore(); },
    shadow(c, R, v) { const p = R.body.getPosition(), h = v.h || 0, rr = Math.max(R.hl, R.hw) * (1.15 + h * 0.4); c.fillStyle = `rgba(70,40,110,${0.2 - Math.min(0.1, h * 0.15)})`; c.beginPath(); c.ellipse(p.x + 0.02 + h * 0.3, p.y + 0.05 + h * 0.5, rr, rr * 0.82, 0, 0, TAU); c.fill(); return true; },
    particles(c) {
      for (const p of P) { const f = p.life / p.max;
        if (p.t === 'spark') { star(c, p.x, p.y, 0.035 * (0.5 + f), 4, `rgba(255,214,64,${f})`, INKT, 0.008); }
        else if (p.t === 'fire') { c.fillStyle = f > 0.5 ? '#FFD23F' : '#FF7A3D'; c.globalAlpha = f; c.beginPath(); c.arc(p.x, p.y, 0.05 * p.s * (0.6 + f), 0, TAU); c.fill(); c.lineWidth = 0.01; c.strokeStyle = INKT; c.stroke(); c.globalAlpha = 1; }
        else if (p.t === 'dust' || p.t === 'smoke') { c.globalAlpha = 0.85 * f; c.fillStyle = p.t === 'dust' ? '#FFFFFF' : '#B9B2C6'; const rr = (0.04 + (1 - f) * 0.1) * p.s; c.beginPath(); c.arc(p.x, p.y, rr, 0, TAU); c.fill(); c.lineWidth = 0.01; c.strokeStyle = 'rgba(42,33,64,0.5)'; c.stroke(); c.globalAlpha = 1; }
        else if (p.t === 'bit') { c.fillStyle = '#B4AECB'; c.globalAlpha = f; c.beginPath(); c.arc(p.x, p.y, 0.02, 0, TAU); c.fill(); c.globalAlpha = 1; } }
    },
    font: big => `700 ${big ? 42 : 28}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`,
    call(c, s, x, y, text, big, k) { const sz = (big ? 42 : 28) * (k < 0.15 ? 0.5 + k / 0.15 * 0.7 : k < 0.3 ? 1.2 - (k - 0.15) / 0.15 * 0.2 : 1); c.font = `700 ${sz}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`; c.lineJoin = 'round'; c.lineWidth = 9; c.strokeStyle = INKT; c.strokeText(text, x, y); c.fillStyle = big ? '#FFD23F' : '#FFFFFF'; c.fillText(text, x, y); },
    word() { },
    wall: { toy: true },
  };
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function star(c, x, y, r, n, fill, stroke, lw) { c.beginPath(); for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * TAU - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); } }

  // ======== COMIC: inked panels on newsprint ========
  const INK = '#141210';
  let dotsPat = null, hatchPat = null;
  function patterns(c) {
    if (dotsPat) return;
    const d = document.createElement('canvas'); d.width = d.height = 8; const x = d.getContext('2d'); x.fillStyle = 'rgba(20,18,16,0.55)'; x.beginPath(); x.arc(4, 4, 1.7, 0, TAU); x.fill(); dotsPat = c.createPattern(d, 'repeat');
    const h = document.createElement('canvas'); h.width = h.height = 8; const y = h.getContext('2d'); y.strokeStyle = 'rgba(20,18,16,0.8)'; y.lineWidth = 1.3; y.beginPath(); y.moveTo(0, 8); y.lineTo(8, 0); y.moveTo(-2, 2); y.lineTo(2, -2); y.moveTo(6, 10); y.lineTo(10, 6); y.stroke(); hatchPat = c.createPattern(h, 'repeat');
  }
  const CM = {
    team: ['#2E6FD8', '#E0432E', '#2FA05A', '#8E45C9'],
    paint(c, arena) {
      const ice = !!arena.ice, r = rng(11);
      c.fillStyle = ice ? '#E4F0F2' : '#F2E8D0'; c.fillRect(0, 0, FPX, FPX);
      for (let y = 0; y < FPX; y += 9) for (let x = (y / 9) % 2 ? 4.5 : 0; x < FPX; x += 9) { const dx = (x - FPX / 2) / (FPX / 2), dy = (y - FPX / 2) / (FPX / 2), k = clamp(Math.hypot(dx, dy) - 0.45, 0, 1); if (k <= 0) continue; c.fillStyle = ice ? 'rgba(40,90,120,0.35)' : 'rgba(120,80,40,0.35)'; c.beginPath(); c.arc(x, y, 0.4 + k * 2.6, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(20,18,16,0.28)'; c.lineWidth = 2;
      for (let i = -4; i <= 4; i++) { c.beginPath(); for (let t = -4; t <= 4.01; t += 0.5) c.lineTo(toF(i + (r() - 0.5) * 0.02), toF(t)); c.stroke(); c.beginPath(); for (let t = -4; t <= 4.01; t += 0.5) c.lineTo(toF(t), toF(i + (r() - 0.5) * 0.02)); c.stroke(); }
      const inset = arena.inset || 0, e0 = toF(-4 + inset), e1 = toF(4 - inset);
      c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(e0 + 12, e0 + 12, e1 - e0 - 24, e1 - e0 - 24);
      for (const s of arena.saws) { c.fillStyle = INK; c.beginPath(); c.ellipse(toF(s[0]), toF(s[1]), 0.44 * PPM, 0.08 * PPM, 0, 0, TAU); c.fill(); }
    },
    decal(c, kind, x, y, a) {
      const px = toF(x), py = toF(y);
      if (kind === 'skid') { if (Math.random() < 0.5) return; c.save(); c.translate(px, py); c.rotate(a); c.strokeStyle = 'rgba(20,18,16,0.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.moveTo(-6, 2); c.lineTo(6, 2); c.stroke(); c.restore(); }
      else if (kind === 'scorch') { c.fillStyle = 'rgba(20,18,16,0.3)'; c.beginPath(); for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, rr = (k % 2 ? 0.18 : 0.42) * PPM; c.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr); } c.fill(); }
    },
    colour(part, R) {
      const team = this.team[R.id % 4];
      if (part.lid || part.col === 'lid') return shade(team, -0.25);
      if (part.kind === 'chassis') return R.alive ? team : '#9A9488';
      if (part.kind === 'lid') return R.alive ? shade(team, -0.25) : '#7A756B';
      if (part.kind === 'wheel') return '#2A2724';
      if (part.kind === 'armour') return { rubber: '#3A3632', spring: '#F2C230', spiked: '#B8B4A8', fibre: '#3FA7A0' }[part.bumper] || '#C9C4B6';
      return { flipper: '#F2C230', lifter: '#F2C230', wedge: '#B8B4A8', blade: '#E6E1D3', spear: '#E6E1D3', vdisc: '#E6E1D3', buzz: '#E6E1D3' }[part.key] || '#A39E92';
    },
    part(c, part, R, ld, under) {
      patterns(c);
      const vs = vsOf(part), col = under && part.kind === 'chassis' ? '#5A554D' : this.colour(part, R), f = part.maxHp ? clamp(part.hp / part.maxHp, 0, 1) : 1;
      c.lineJoin = 'round'; path(c, vs); c.fillStyle = col; c.fill();
      crescent(c, vs, ld, 0.045, shade(col, -0.32)); crescent(c, vs, ld, 0.045, dotsPat); // hard cel shadow on the far side, with halftone
      c.save(); path(c, vs); c.clip();
      if (f < 0.7) { c.fillStyle = hatchPat; c.globalAlpha = (0.7 - f) * 1.2; path(c, vs); c.fill(); c.globalAlpha = 1; }
      if (isSpin(part)) { const [x0, y0, x1, y1] = bbox(vs), off = (((part.slot ? part.slot.spin : 0) * 0.07) % 0.04 + 0.04) % 0.04; c.strokeStyle = '#6A655C'; c.lineWidth = 0.01; for (let x = x0 - 0.04 + off; x < x1; x += 0.04) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); } }
      c.restore();
      if (part.dents && part.dents.length && /chassis|armour|lid/.test(part.kind)) { c.save(); path(c, vs); c.clip(); c.strokeStyle = INK; c.lineWidth = 0.008; for (const d of part.dents) { c.beginPath(); c.moveTo(d.x - d.r * 0.5, d.y); c.lineTo(d.x, d.y - d.r * 0.3); c.lineTo(d.x + d.r * 0.4, d.y + d.r * 0.2); c.stroke(); } c.restore(); }
      if ((part.heat || 0) > 30) { path(c, vs); c.fillStyle = `rgba(255,90,20,${Math.min(0.5, (part.heat - 30) / 140)})`; c.fill(); }
      if (part.kind === 'chassis' && under) { c.strokeStyle = INK; c.lineWidth = 0.02; c.beginPath(); c.moveTo(-R.hl * 0.5, -R.hw * 0.4); c.lineTo(R.hl * 0.5, R.hw * 0.4); c.moveTo(-R.hl * 0.5, R.hw * 0.4); c.lineTo(R.hl * 0.5, -R.hw * 0.4); c.stroke(); }
      path(c, vs); c.lineWidth = part.kind === 'chassis' ? 0.026 : 0.018; c.strokeStyle = INK; c.stroke();
    },
    lid(c, R, ld) { const L0 = R.lid, lo = L0.state === 'loose' ? Math.sin(performance.now() / 30) * 0.008 : 0; c.save(); c.translate(lo, -lo); this.part(c, L0, R, ld); c.restore(); },
    guts(c, R) { const [x0, y0, x1, y1] = bbox(R.chassis.verts); c.fillStyle = INK; c.fillRect(x0 * 0.68, y0 * 0.68, (x1 - x0) * 0.68, (y1 - y0) * 0.68); for (const q of R.internals) if (q.lp) { c.fillStyle = q.hp <= 0 ? '#3A3632' : { battery: '#F2C230', chip: '#3FA7A0' }[q.key] || '#C9C4B6'; c.fillRect(q.lp[0] - 0.03, q.lp[1] - 0.022, 0.06, 0.044); } },
    turret(c, R, ld) { c.save(); c.rotate(R.turretA - R.body.getAngle()); c.fillStyle = '#8A857A'; c.fillRect(0.04, -0.03, 0.3, 0.06); c.lineWidth = 0.016; c.strokeStyle = INK; c.strokeRect(0.04, -0.03, 0.3, 0.06); c.fillStyle = R.turret.hp > 0 ? '#C9C4B6' : '#6A655C'; c.beginPath(); c.arc(0, 0, 0.12, 0, TAU); c.fill(); c.fillStyle = dotsPat; c.beginPath(); c.arc(-ld[0] * 0.04, -ld[1] * 0.04, 0.09, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 0, 0.12, 0, TAU); c.stroke(); c.restore(); },
    shadow(c, R, v, sil) { const h = v.h || 0, off = 0.04 + h * 0.9; patterns(c); c.save(); c.translate(-LIGHT[0] * off, -LIGHT[1] * off); sil(hatchPat); c.restore(); },
    before(c, S) { // speed lines behind fast robots
      for (const R of S.robots) { const vv = R.body.getLinearVelocity(), sp = Math.hypot(vv.x, vv.y); if (sp < 2.2) continue; const p = R.body.getPosition(), ux = vv.x / sp, uy = vv.y / sp, nx = -uy, ny = ux, len = Math.min(1.2, sp * 0.22);
        c.strokeStyle = INK; c.lineWidth = 0.012; for (let k = -2; k <= 2; k++) { const o = k * R.hw * 0.42, back = R.hl * 1.05 + Math.abs(k) * 0.05; c.beginPath(); c.moveTo(p.x - ux * back + nx * o, p.y - uy * back + ny * o); c.lineTo(p.x - ux * (back + len * (0.6 + 0.4 * ((k + 7) % 3) / 2)) + nx * o, p.y - uy * (back + len) + ny * o); c.stroke(); } }
    },
    particles(c) {
      for (const p of P) { const f = p.life / p.max;
        if (p.t === 'spark') { c.strokeStyle = INK; c.lineWidth = 0.014; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); c.stroke(); c.strokeStyle = '#F2C230'; c.lineWidth = 0.007; c.stroke(); }
        else if (p.t === 'fire') { const rr = 0.06 * p.s * (0.5 + f); c.fillStyle = f > 0.5 ? '#F2C230' : '#E0432E'; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + p.r * 6, q = k % 2 ? rr * 0.6 : rr; c.lineTo(p.x + Math.cos(a) * q, p.y + Math.sin(a) * q); } c.closePath(); c.fill(); c.lineWidth = 0.008; c.strokeStyle = INK; c.stroke(); }
        else if (p.t === 'dust' || p.t === 'smoke') { const rr = (0.04 + (1 - f) * 0.12) * p.s; c.globalAlpha = f; c.fillStyle = p.t === 'smoke' ? '#8A857A' : '#F2E8D0'; c.beginPath(); c.arc(p.x, p.y, rr, 0, TAU); c.fill(); c.lineWidth = 0.01; c.strokeStyle = INK; c.stroke(); c.globalAlpha = 1; }
        else if (p.t === 'bit') { c.fillStyle = INK; c.globalAlpha = f; c.fillRect(p.x - 0.014, p.y - 0.01, 0.028, 0.02); c.globalAlpha = 1; } }
    },
    font: big => `400 ${big ? 34 : 24}px Bangers, Impact, sans-serif`,
    call(c, s, x, y, text, big, k) { // caption box
      c.font = `400 ${big ? 34 : 24}px Bangers, Impact, sans-serif`; const w = c.measureText(text).width + 18, h = big ? 42 : 30;
      c.fillStyle = big ? '#F2C230' : '#FFFDF5'; c.fillRect(x - w / 2, y - h / 2, w, h); c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(x - w / 2, y - h / 2, w, h); c.fillStyle = INK; c.fillText(text, x, y + 2);
    },
    word(c, s, x, y, w, big, k, seed) { // sound effect burst
      const r = rng(seed), sc = (k < 0.1 ? 0.4 + k / 0.1 * 0.8 : k < 0.2 ? 1.2 - (k - 0.1) : 1.1) * s * (big ? 1.35 : 1), R0 = 40 * sc, n = 14;
      c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? R0 * (0.55 + r() * 0.15) : R0 * (0.95 + r() * 0.35); c.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr); } c.closePath();
      c.fillStyle = big ? '#E0432E' : '#F2C230'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'miter'; c.stroke();
      c.font = `400 ${Math.round(26 * sc)}px Bangers, Impact, sans-serif`; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(w, x, y + 2); c.fillStyle = big ? '#F2C230' : '#FFFDF5'; c.fillText(w, x, y + 2);
    },
    wall: { comic: true },
  };

  // ---------- drawing a whole frame in one style ----------
  const STYLES = [WS, TB, CM];
  STYLES.forEach((s, i) => { s.canvas = $('c' + i); s.ctx = s.canvas.getContext('2d'); s.floor = makeFloorCanvas(); s.fctx = s.floor.getContext('2d'); const d = s.decal; s.decal = (k, x, y, a) => d.call(s, s.fctx, k, x, y, a); });
  function paintFloors(arena) { for (const s of STYLES) s.paint(s.fctx, arena); }
  function robotParts(R) { const b = R.body, on = [], sep = []; for (const q of R.parts) if (q.attached && q.verts) (q.body === b ? on : sep).push(q); return { on, sep }; }
  const ORDER = { wheel: 0, armour: 1, weapon: 2, chassis: 3 };
  function drawRobot(s, c, R, S) {
    const v = vis(R), b = R.body, p = b.getPosition(), a = b.getAngle(), h = v.h || 0;
    const cr = Math.cos(v.roll), under = cr < 0, sy = Math.sign(cr || 1) * Math.max(0.06, Math.abs(cr));
    let sc = 1 + h * 0.55, wx = 1, wy = 1;
    if (s === TB && v.wob > 0.02) { const q = Math.sin(v.ph) * v.wob * 0.16; wx = 1 + q; wy = 1 - q; }
    const { on, sep } = robotParts(R);
    on.sort((x, y) => (ORDER[x.kind] || 0) - (ORDER[y.kind] || 0));
    const tf = () => { c.translate(p.x, p.y); c.rotate(a); c.scale(sc * wx, sc * wy * sy); };
    // light direction in the robot's own frame (the lamp stays put as the robot turns)
    const ca = Math.cos(-a), sa = Math.sin(-a); let ld = [LIGHT[0] * ca - LIGHT[1] * sa, LIGHT[0] * sa + LIGHT[1] * ca]; if (sy < 0) ld = [ld[0], -ld[1]];
    const sil = fill => { c.save(); tf(); c.fillStyle = fill; for (const q of on) { path(c, vsOf(q)); c.fill(); } for (const q of sep) { const lp = b.getLocalPoint(q.body.getPosition()); c.save(); c.translate(lp.x, lp.y); c.rotate(q.body.getAngle() - a); path(c, vsOf(q)); c.fill(); c.restore(); } c.restore(); };
    s.shadow(c, R, v, sil);
    c.save(); tf();
    const sepDraw = () => { for (const q of sep) { const lp = b.getLocalPoint(q.body.getPosition()); c.save(); c.translate(lp.x, lp.y); c.rotate(q.body.getAngle() - a); s.part(c, q, R, rot(ld, -(q.body.getAngle() - a))); c.restore(); } };
    if (!under) {
      for (const q of on) if (q.kind !== 'chassis') s.part(c, q, R, ld);
      for (const q of on) if (q.kind === 'chassis') s.part(c, q, R, ld);
      if (R.lid && R.lid.attached) s.lid(c, R, ld); else if (R.chassis.attached) s.guts(c, R);
      if (s.eyes) s.eyes(c, R, v, S);
      if (R.turret) s.turret(c, R, ld);
      sepDraw();
    } else { // on its back: belly up, wheels on top
      for (const q of on) if (q.kind === 'chassis') s.part(c, q, R, ld, true);
      for (const q of on) if (q.kind !== 'chassis') s.part(c, q, R, ld, true);
      sepDraw();
    }
    c.restore();
  }
  const rot = (d, an) => { const c0 = Math.cos(an), s0 = Math.sin(an); return [d[0] * c0 - d[1] * s0, d[0] * s0 + d[1] * c0]; };
  function drawDebris(s, c, q, S) {
    const b = q.body, p = b.getPosition(), a = b.getAngle(), R = q.robot || S.robots[0];
    const ca = Math.cos(-a), sa = Math.sin(-a), ld = [LIGHT[0] * ca - LIGHT[1] * sa, LIGHT[0] * sa + LIGHT[1] * ca];
    c.save(); c.translate(p.x - LIGHT[0] * 0.02, p.y - LIGHT[1] * 0.02); c.rotate(a); path(c, vsOf(q)); c.fillStyle = s === TB ? 'rgba(70,40,110,0.15)' : 'rgba(0,0,0,0.3)'; c.fill(); c.restore();
    c.save(); c.translate(p.x, p.y); c.rotate(a); s.part(c, q, R, ld); c.restore();
  }
  function drawWalls(s, c, S) {
    for (const w of S.walls) {
      const p = w.body.getPosition(), hx = w.axis === 'x' ? 0.25 : L.HALF + 0.25, hy = w.axis === 'y' ? 0.25 : L.HALF + 0.25;
      if (s === WS) { const g = c.createLinearGradient(p.x - hx, p.y - hy, p.x + hx, p.y + hy); g.addColorStop(0, '#5A544C'); g.addColorStop(1, '#2C2824'); c.fillStyle = g; c.fillRect(p.x - hx, p.y - hy, hx * 2, hy * 2); c.fillStyle = '#E2B93B'; const ix = w.axis === 'x' ? p.x - w.sgn * 0.25 - (w.sgn > 0 ? 0.05 : 0) : p.x - hx, iy = w.axis === 'y' ? p.y - w.sgn * 0.25 - (w.sgn > 0 ? 0.05 : 0) : p.y - hy; c.fillRect(ix, iy, w.axis === 'x' ? 0.05 : hx * 2, w.axis === 'y' ? 0.05 : hy * 2); }
      else if (s === TB) { const cols = ['#FF5A5A', '#FFD23F', '#3D9BFF', '#45C979']; const n = 12, len = (w.axis === 'x' ? hy : hx) * 2 / n; for (let k = 0; k < n; k++) { const x = w.axis === 'x' ? p.x - hx : p.x - hx + k * len, y = w.axis === 'y' ? p.y - hy : p.y - hy + k * len, ww = w.axis === 'x' ? hx * 2 : len, hh = w.axis === 'y' ? hy * 2 : len; c.fillStyle = cols[(k + (w.axis === 'x' ? 1 : 0) + (w.sgn > 0 ? 2 : 0)) % 4]; roundRect(c, x + 0.01, y + 0.01, ww - 0.02, hh - 0.02, 0.05); c.fill(); c.lineWidth = 0.02; c.strokeStyle = INKT; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x + ww / 2, y + hh / 2, Math.min(ww, hh) * 0.22, 0, TAU); c.fill(); } }
      else { c.fillStyle = INK; c.fillRect(p.x - hx, p.y - hy, hx * 2, hy * 2); }
      if (S.arena.spikes) { c.fillStyle = s === TB ? '#D9D4E6' : s === CM ? '#FFFDF5' : '#B4B6AF'; for (let k = -6; k <= 6; k++) { const o = k * 0.22, ins = -w.sgn * 0.25; c.beginPath(); if (w.axis === 'x') { c.moveTo(p.x + ins, p.y + o - 0.07); c.lineTo(p.x + ins - w.sgn * 0.16, p.y + o); c.lineTo(p.x + ins, p.y + o + 0.07); } else { c.moveTo(p.x + o - 0.07, p.y + ins); c.lineTo(p.x + o, p.y + ins - w.sgn * 0.16); c.lineTo(p.x + o + 0.07, p.y + ins); } c.closePath(); c.fill(); c.lineWidth = 0.01; c.strokeStyle = s === WS ? 'rgba(0,0,0,0.6)' : s === TB ? INKT : INK; c.stroke(); } }
    }
  }
  function drawProps(s, c, S) {
    const ink = s === TB ? INKT : s === CM ? INK : 'rgba(10,8,6,0.85)', lw = s === WS ? 0.008 : 0.016;
    for (const sw of S.sawState) if (sw.up) { c.save(); c.translate(sw.x, sw.y); c.rotate(sw.spin || 0); c.beginPath(); for (let k = 0; k < 24; k++) { const an = k / 24 * TAU, rr = k % 2 ? sw.r * 0.86 : sw.r; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fillStyle = s === TB ? '#E8E6F0' : s === CM ? '#E6E1D3' : '#BFC1BA'; c.fill(); c.lineWidth = lw; c.strokeStyle = ink; c.stroke(); c.fillStyle = ink; c.beginPath(); c.arc(0, 0, sw.r * 0.2, 0, TAU); c.fill(); c.restore(); }
    for (const o of S.oils) { c.fillStyle = s === TB ? 'rgba(60,40,90,0.55)' : 'rgba(10,8,6,0.7)'; c.globalAlpha = Math.min(1, (o.life == null ? 1 : o.life) * 0.6); c.beginPath(); c.ellipse(o.x, o.y, o.r, o.r * 0.85, 0.4, 0, TAU); c.fill(); c.globalAlpha = 1; }
    for (const m of S.mines) { c.fillStyle = s === TB ? '#5A4E72' : '#3A3530'; c.beginPath(); c.arc(m.x, m.y, 0.08, 0, TAU); c.fill(); c.lineWidth = lw; c.strokeStyle = ink; c.stroke(); if ((performance.now() % 500) < 250 || m.arm > 0) { c.fillStyle = '#FF3B2A'; c.beginPath(); c.arc(m.x, m.y, 0.025, 0, TAU); c.fill(); } }
    for (const o of S.crates) { if (o.taken) continue; const col = { nitro: '#D33A2C', overcharge: '#E8C547', repair: '#4C8A3F', shield: '#3F78A8' }[o.type] || '#B08B57'; c.fillStyle = col; c.fillRect(o.x - 0.14, o.y - 0.14, 0.28, 0.28); c.lineWidth = lw; c.strokeStyle = ink; c.strokeRect(o.x - 0.14, o.y - 0.14, 0.28, 0.28); c.beginPath(); c.moveTo(o.x - 0.14, o.y - 0.14); c.lineTo(o.x + 0.14, o.y + 0.14); c.moveTo(o.x + 0.14, o.y - 0.14); c.lineTo(o.x - 0.14, o.y + 0.14); c.stroke(); }
  }
  function drawFlying(s, c, S) {
    const ink = s === TB ? INKT : s === CM ? INK : 'rgba(10,8,6,0.85)', lw = s === WS ? 0.008 : 0.016;
    for (const o of S.ewalls) { const p = o.body.getPosition(); c.save(); c.translate(p.x, p.y); c.rotate(o.body.getAngle()); c.fillStyle = 'rgba(90,208,255,0.55)'; c.fillRect(-0.035, -0.5, 0.07, 1); c.restore(); }
    for (const d of S.drones) { if (!d.alive) continue; const p = d.body.getPosition(), r = (d.H && d.H.r ? d.H.r : 0.12) * 1.3, team = s.team[d.owner.id % 4], fl = d.H && d.H.physical ? 0 : 0.12;
      c.fillStyle = s === TB ? 'rgba(70,40,110,0.18)' : 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(p.x - LIGHT[0] * fl, p.y - LIGHT[1] * fl, r, 0, TAU); c.fill();
      c.fillStyle = (d.H && d.H.col) || '#9A9C94'; c.beginPath(); c.arc(p.x, p.y, r * 0.75, 0, TAU); c.fill(); c.lineWidth = s === WS ? 0.02 : 0.024; c.strokeStyle = team; c.stroke(); c.lineWidth = lw; c.strokeStyle = ink; c.beginPath(); c.arc(p.x, p.y, r * 0.75 + 0.012, 0, TAU); c.stroke();
      if (fl) for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + 0.785 + d.body.getAngle(); c.fillStyle = s === CM ? 'rgba(20,18,16,0.2)' : 'rgba(230,225,215,0.35)'; c.beginPath(); c.arc(p.x + Math.cos(an) * r * 1.15, p.y + Math.sin(an) * r * 1.15, r * 0.4, 0, TAU); c.fill(); } }
    for (const pr of S.projs) { if (pr.dead) continue; if (pr.rocket) { const an = Math.atan2(pr.vy, pr.vx); c.save(); c.translate(pr.x, pr.y); c.rotate(an); c.fillStyle = s === TB ? '#FF5A5A' : '#E4E1DA'; c.fillRect(-0.08, -0.03, 0.16, 0.06); c.lineWidth = lw; c.strokeStyle = ink; c.strokeRect(-0.08, -0.03, 0.16, 0.06); c.restore(); continue; }
      c.fillStyle = s === TB ? '#FFD23F' : s === CM ? INK : '#FFE08A'; c.beginPath(); c.arc(pr.x, pr.y, Math.max(0.02, pr.r || 0.03), 0, TAU); c.fill(); }
    for (const sh of S.shells) { const k = sh.t / sh.T, x = sh.x0 + (sh.x1 - sh.x0) * k, y = sh.y0 + (sh.y1 - sh.y0) * k, hh = 4 * k * (1 - k); c.strokeStyle = 'rgba(220,50,40,0.6)'; c.lineWidth = 0.02; c.beginPath(); c.arc(sh.x1, sh.y1, 0.35, 0, TAU); c.stroke(); c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.arc(x, y, 0.05, 0, TAU); c.fill(); c.fillStyle = '#3A3530'; c.beginPath(); c.arc(x - hh * 0.3, y - hh * 0.5, 0.05 * (1 + hh * 1.3), 0, TAU); c.fill(); c.lineWidth = lw; c.strokeStyle = ink; c.stroke(); }
    for (const sm of S.smokes) { c.fillStyle = s === TB ? `rgba(240,236,250,${Math.min(0.85, sm.life * 0.6)})` : s === CM ? `rgba(200,195,185,${Math.min(0.85, sm.life * 0.6)})` : `rgba(160,155,145,${Math.min(0.8, sm.life * 0.6)})`; for (let k = 0; k < 7; k++) { const an = k / 7 * TAU; c.beginPath(); c.arc(sm.x + Math.cos(an) * sm.r * 0.5, sm.y + Math.sin(an) * sm.r * 0.5, sm.r * 0.5, 0, TAU); c.fill(); } }
  }
  // one shared camera: follows the robots, closes in when they are near each other
  const cam = { x: 0, y: 0, w: FM };
  function moveCam(S, dt) {
    const list = S.robots;
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const R of list) { const p = R.body.getPosition(); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const w = clamp(Math.max(x1 - x0, y1 - y0) + 2.6, 4.4, FM), lim = (FM - w) / 2, k = 1 - Math.exp(-dt * 2.2);
    cam.w += (w - cam.w) * k; cam.x += (clamp((x0 + x1) / 2, -lim, lim) - cam.x) * k; cam.y += (clamp((y0 + y1) / 2, -lim, lim) - cam.y) * k;
  }
  function drawStyle(s, S) {
    const cv = s.canvas, dpr = Math.min(2, window.devicePixelRatio || 1), size = cv.clientWidth;
    if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
    const c = s.ctx, k = cv.width / cam.w, sx = (Math.random() - 0.5) * shake - cam.x, sy2 = (Math.random() - 0.5) * shake - cam.y;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = s === TB ? '#FFF1D6' : s === CM ? '#F2E8D0' : '#2E2A25'; c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(k, 0, 0, k, cv.width / 2 + sx * k, cv.height / 2 + sy2 * k);
    c.drawImage(s.floor, -FM / 2, -FM / 2, FM, FM);
    drawProps(s, c, S);
    for (const q of S.debris) if (q.verts && q.body) drawDebris(s, c, q, S);
    if (s.before) s.before(c, S);
    const order = S.robots.slice().sort((x, y) => (vis(x).h || 0) - (vis(y).h || 0));
    for (const R of order) drawRobot(s, c, R, S);
    drawWalls(s, c, S);
    drawFlying(s, c, S);
    s.particles(c);
    // words and callouts in screen pixels
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.textAlign = 'center'; c.textBaseline = 'middle';
    const scr = (x, y) => [size / 2 + (x + sx) * size / cam.w, size / 2 + (y + sy2) * size / cam.w], u = size / 520;
    if (s === CM) for (const w of WORDS) { let [x, y] = scr(w.x, w.y); x = clamp(x, 70 * u, size - 70 * u); y = clamp(y, 90 * u, size - 50 * u); c.save(); c.translate(x, y - 30 * u); c.rotate(w.rot); s.word(c, u, 0, 0, w.w, w.big, w.t, w.seed); c.restore(); }
    let slot = 0; for (const cl of CALLS) { let [x, y] = scr(cl.x, cl.y - 0.55); y -= cl.t * 24 * u + slot * (cl.big ? 52 : 38) * u; x = clamp(x, 90 * u, size - 90 * u); y = Math.max(40 * u, y); c.font = s.font(cl.big); const hw = (c.measureText(cl.text).width / 2 + 14) * u; x = hw * 2 < size ? clamp(x, hw, size - hw) : size / 2; c.save(); c.globalAlpha = cl.t > 1.1 ? Math.max(0, 1 - (cl.t - 1.1) / 0.3) : 1; c.translate(x, y); c.rotate(cl.rot); c.scale(u, u); s.call(c, u, 0, 0, cl.text, cl.big, cl.t); c.restore(); slot++; }
    if (S.over && S.t > S.result.t + 0.8) { c.save(); c.translate(size / 2, size * 0.5); c.scale(u, u); s.call(c, u, 0, -24, S.result.how === 'KO' ? 'KNOCKOUT!' : 'TIME!', true, 1); c.font = '600 15px "IBM Plex Sans", system-ui, sans-serif'; let tw = c.measureText(S.result.text).width; const room = size / u - 30; if (tw > room) { c.font = `600 ${Math.floor(15 * room / tw)}px "IBM Plex Sans", system-ui, sans-serif`; tw = room; } c.fillStyle = 'rgba(20,16,12,0.78)'; c.fillRect(-tw / 2 - 10, 10, tw + 20, 28); c.fillStyle = '#FFF4D6'; c.fillText(S.result.text, 0, 25); c.restore(); }
  }

  // ---------- HUD ----------
  const pctOf = R => clamp(Math.min(R.chassis.hp / R.chassis.maxHp, R.battery.hp / R.battery.maxHp), 0, 1);
  function hud(S) { $('hp').innerHTML = S.robots.map(R => { const f = pctOf(R), chips = []; if (!R.alive) chips.push('out'); if (R.flipped) chips.push('upside down'); if (R.lid && !R.lid.attached) chips.push('lid off'); if (R.battery.fire) chips.push('on fire'); return `<div><b style="color:${WS.team[R.id]}">${R.name}</b> ${Math.round(f * 100)}% <span style="color:var(--muted)">${chips.join(' · ')}</span><div class="meter"><i style="width:${f * 100}%;background:${WS.team[R.id]}"></i></div></div>`; }).join(''); }

  // ---------- fight control ----------
  let S = null, acc = 0, last = performance.now(), frameN = 0, endT = 0;
  function start() {
    const A = LU.build(st.a), B = LU.build(st.b); A.name = st.a; B.name = st.b === st.a ? st.b + ' II' : st.b;
    S = L.create({ a: A, b: B, seed: st.seed, arena: st.arena, countdown: 1.2 });
    VS.clear(); cam.x = cam.y = 0; cam.w = FM; P.length = 0; WORDS.length = 0; CALLS.length = 0; endT = 0; paintFloors(S.arena); hud(S);
  }
  function frame(now) {
    const rdt = Math.min(0.05, (now - last) / 1000); last = now; frameN++;
    let ts = 0;
    if (S && !st.paused) {
      ts = st.speed; acc += rdt * ts; let n = 0;
      while (acc >= L.DT && n < 24) { L.step(S); consumeFx(S); acc -= L.DT; n++; }
      if (n >= 24) acc = 0;
      emitters(S);
      if (S.over) { endT += rdt; if (endT > 5) { st.seed = 1 + Math.floor(Math.random() * 99999); $('seed').value = st.seed; start(); } }
    }
    if (S) { moveCam(S, rdt); updateVis(S, rdt * (ts ? Math.min(ts, 1.5) : 0)); stepFx(rdt * (ts ? Math.min(ts, 1.5) : 0)); for (const s of STYLES) drawStyle(s, S); if (frameN % 6 === 0) hud(S); }
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  const byLevel = {}; for (const [n, v] of Object.entries(ROBOTS)) (byLevel[v[0]] = byLevel[v[0]] || []).push(n);
  const opts = sel => Object.keys(byLevel).map(lv => `<optgroup label="${LVN[lv] || 'Level ' + lv}">` + byLevel[lv].map(nm => `<option${nm === sel ? ' selected' : ''}>${nm}</option>`).join('') + '</optgroup>').join('');
  const q = new URLSearchParams(location.search);
  if (q.get('a') && ROBOTS[q.get('a')]) st.a = q.get('a'); if (q.get('b') && ROBOTS[q.get('b')]) st.b = q.get('b'); if (q.get('seed')) st.seed = +q.get('seed') || 1; if (q.get('arena') && L.ARENAS[q.get('arena')]) st.arena = q.get('arena');
  $('pa').innerHTML = opts(st.a); $('pb').innerHTML = opts(st.b); $('seed').value = st.seed;
  $('arenaSel').innerHTML = Object.entries(L.ARENAS).map(([k, v]) => `<option value="${k}"${k === st.arena ? ' selected' : ''}>${v.label}</option>`).join('');
  $('pa').onchange = e => { st.a = e.target.value; start(); }; $('pb').onchange = e => { st.b = e.target.value; start(); };
  $('arenaSel').onchange = e => { st.arena = e.target.value; start(); };
  $('seed').onchange = e => { st.seed = Math.max(1, parseInt(e.target.value, 10) || 1); start(); };
  $('fight').onclick = () => { st.paused = false; $('pause').textContent = 'Pause'; start(); };
  $('newseed').onclick = () => { st.seed = 1 + Math.floor(Math.random() * 99999); $('seed').value = st.seed; start(); };
  $('rand').onclick = () => { const n = Object.keys(ROBOTS); st.a = n[Math.random() * n.length | 0]; st.b = n[Math.random() * n.length | 0]; $('pa').innerHTML = opts(st.a); $('pb').innerHTML = opts(st.b); start(); };
  $('pause').onclick = () => { st.paused = !st.paused; $('pause').textContent = st.paused ? 'Go on' : 'Pause'; $('pause').setAttribute('aria-pressed', String(st.paused)); };
  document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { st.speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  start();
  if (document.fonts && document.fonts.load) Promise.all(['30px "Saira Stencil One"', '700 30px Fredoka', '30px Bangers'].map(f => document.fonts.load(f).catch(() => 0))).then(() => 0);
  requestAnimationFrame(frame);
  window.ROBOCUS_LOOKS = { get S() { return S; }, st, start, skip(sec) { const n = Math.round(sec / L.DT); for (let i = 0; i < n && S && !S.over; i++) { L.step(S); consumeFx(S); } } };
})();
