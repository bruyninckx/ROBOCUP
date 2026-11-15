// ROBOCUS Damage Lab: pixel layer (Noita-style). Built into prototypes/damage-lab-pixel.html by build-pixel.py.
// Visual only: it reads the sim state and S.fx after every step and never writes to the sim, so fights stay
// identical to the normal Damage Lab (same seed, same result). Math.random is fine in here.
(function () {
  'use strict';
  const L = window.DamageLab; if (!L) return;
  const VIEW = 8.8, GW = 352, G = GW / VIEW, N = GW * GW; // must match the canvas size patched into ui.js
  const EMPTY = 0, GRIT = 1, CHUNK = 2, OIL = 3, HOT = 4, FIRE = 5;
  const mat = new Uint8Array(N), col = new Uint32Array(N), life = new Uint8Array(N);
  const stain = new Uint8Array(N), stainC = new Uint32Array(N);
  const NB4 = [-1, 1, -GW, GW], NB8 = [-1, 1, -GW, GW, -GW - 1, -GW + 1, GW - 1, GW + 1];
  const pk = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const hex = (h, a = 255) => { const n = parseInt(h.slice(1), 16); return pk(n >> 16, (n >> 8) & 255, n & 255, a); };
  const shade = (c, f) => pk(Math.min(255, (c & 255) * f) | 0, Math.min(255, ((c >> 8) & 255) * f) | 0, Math.min(255, ((c >> 16) & 255) * f) | 0, c >>> 24);
  const GRITC = [pk(124, 122, 114), pk(98, 96, 90), pk(152, 150, 142), pk(78, 74, 68), pk(170, 168, 160)];
  const STEELC = [hex('#8A8C84'), hex('#6F7169'), hex('#A6A8A0'), hex('#4E4740')];
  const HOTC = [pk(255, 244, 180), pk(255, 206, 96), pk(255, 150, 48), pk(214, 86, 30)];
  const FIREC = [pk(255, 214, 90), pk(255, 150, 40), pk(255, 96, 30), pk(255, 240, 160)];
  const OILC = pk(26, 22, 18, 240), OILS = pk(78, 72, 64, 240);
  const toG = v => (v + VIEW / 2) * G;
  const lo = toG(-L.HALF) + 1, hi = toG(L.HALF) - 1;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
  let parts = [], curS = null, sub = 0, frame = 0;
  const oily = new WeakMap();
  const cv = document.createElement('canvas'); cv.width = cv.height = GW;
  const g = cv.getContext('2d'), img = g.createImageData(GW, GW), buf = new Uint32Array(img.data.buffer);
  const teamCol = R => { try { return hex(window.__TC(R.id).col); } catch (e) { return STEELC[0]; } };

  function reset() { mat.fill(0); life.fill(0); stain.fill(0); parts = []; }
  function put(x, y, m, c, l) {
    x |= 0; y |= 0; if (x < lo || y < lo || x > hi || y > hi) return false;
    let i = y * GW + x;
    if (mat[i]) { const o = (Math.random() * 8) | 0; let ok = false; for (let k = 0; k < 8; k++) { const j = i + NB8[(k + o) & 7]; if (!mat[j]) { i = j; ok = true; break; } } if (!ok) return false; }
    mat[i] = m; col[i] = c; life[i] = l || 0; return true;
  }
  function fly(x, y, vx, vy, m, c, l) { if (parts.length < 7000) parts.push({ x, y, vx, vy, m, c, l: l || 0 }); }
  function burst(wx, wy, n, speed, m, cols, l, dir) {
    const x = toG(wx), y = toG(wy);
    for (let k = 0; k < n; k++) { const a = dir != null ? dir + rnd(-1.1, 1.1) : Math.random() * 6.283, v = rnd(0.3, 1) * speed;
      fly(x + rnd(-1, 1), y + rnd(-1, 1), Math.cos(a) * v, Math.sin(a) * v, m, pick(cols), typeof l === 'function' ? l() : l); }
  }
  function blast(wx, wy, r, power) { // loose pixels in the radius are thrown outwards
    const cx = toG(wx), cy = toG(wy), R = r * G, x0 = Math.max(lo, cx - R) | 0, x1 = Math.min(hi, cx + R) | 0, y0 = Math.max(lo, cy - R) | 0, y1 = Math.min(hi, cy + R) | 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * GW + x, m = mat[i]; if (!m || m === OIL || m === FIRE) continue;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > R) continue;
      const f = (1 - d / R) * power, ux = dx / (d || 1), uy = dy / (d || 1);
      fly(x + 0.5, y + 0.5, ux * f * rnd(0.6, 1.2) + rnd(-0.3, 0.3), uy * f * rnd(0.6, 1.2) + rnd(-0.3, 0.3), m, col[i], life[i]); mat[i] = 0;
    }
  }
  function mark(wx, wy, r, dark, c) { // persistent floor stain
    const cx = toG(wx), cy = toG(wy), R = Math.max(1, r * G);
    for (let y = (cy - R) | 0; y <= cy + R; y++) for (let x = (cx - R) | 0; x <= cx + R; x++) {
      if (x < lo || y < lo || x > hi || y > hi) continue; const d = Math.hypot(x - cx, y - cy); if (d > R) continue;
      const i = y * GW + x, a = dark * (1 - d / R * 0.7) * rnd(0.7, 1.1); if (a > stain[i]) { stain[i] = Math.min(230, a); stainC[i] = c; }
    }
  }
  function nearestRobot(S, x, y) { let best = null, bd = 1e9; for (const R of S.robots) { const p = R.body.getPosition(), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = R; } } return best; }

  function onFx(S) {
    for (const e of S.fx) {
      const t = e.type;
      if (t === 'spark') { const n = Math.min(12, 1 + (e.power || 0) / 9) | 0, dir = e.nx != null ? Math.atan2(e.ny, e.nx) + (Math.random() < 0.5 ? 0 : Math.PI) : null;
        burst(e.x, e.y, n, 2.2 + Math.min(4, (e.power || 0) / 25), HOT, [0], () => 18 + Math.random() * 50, dir);
        if (e.metal || e.power > 12) burst(e.x, e.y, Math.min(10, n) | 0, 1.6, GRIT, GRITC, 0, dir); }
      else if (t === 'bigHit') { const R = nearestRobot(S, e.x, e.y), tc = R ? teamCol(R) : STEELC[0], n = Math.min(120, 10 + e.power * 2.6) | 0;
        burst(e.x, e.y, n, 1.5 + Math.min(3, e.power / 14), GRIT, GRITC, 0);
        burst(e.x, e.y, (n * 0.35) | 0, 1.4 + Math.min(3, e.power / 16), CHUNK, [tc, shade(tc, 0.75), shade(tc, 1.15)], 0);
        burst(e.x, e.y, (n * 0.3) | 0, 3, HOT, [0], () => 20 + Math.random() * 40);
        if (e.power > 18) blast(e.x, e.y, 0.35, 2.5); }
      else if (t === 'detach') { blast(e.x, e.y, 0.45, 3); burst(e.x, e.y, 90, 2.6, CHUNK, STEELC, 0); burst(e.x, e.y, 50, 2.2, GRIT, GRITC, 0); burst(e.x, e.y, 30, 1.3, OIL, [OILC], 0); }
      else if (t === 'boom') { const r = 0.25 + (e.power || 20) / 80; blast(e.x, e.y, r * 2.2, 5); mark(e.x, e.y, r * 1.3, 200, pk(22, 16, 10));
        burst(e.x, e.y, 50, 2.5, FIRE, [0], () => 40 + Math.random() * 80); burst(e.x, e.y, 30, 1.6, OIL, [OILC], 0); burst(e.x, e.y, 40, 4, HOT, [0], () => 30 + Math.random() * 60); }
      else if (t === 'scorch') mark(e.x, e.y, e.r, 150, pk(26, 18, 10));
      else if (t === 'slam' || t === 'piston') { blast(e.x, e.y, 1.0, 4); mark(e.x, e.y, 0.35, 70, pk(40, 34, 28)); }
      else if (t === 'thud') blast(e.x, e.y, 0.5, 2);
      else if (t === 'punch') blast(e.x, e.y, 0.45, 3);
      else if (t === 'shatter') burst(e.x, e.y, 50, 3, CHUNK, [hex('#7FD1CC'), hex('#3E8E8A'), hex('#BDEDEA')], 0);
      else if (t === 'scrape') burst(e.x, e.y, 2, 1, GRIT, GRITC, 0);
      else if (t === 'ricochet') burst(e.x, e.y, 4, 3, HOT, [0], () => 15 + Math.random() * 20);
      else if (t === 'emp') blast(e.x, e.y, 1.2, 2);
    }
  }

  function inPoly(vs, x, y) { let c = false; for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) { const a = vs[i], b = vs[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function plough(part) { // a body driving through loose pixels shoves them along
    const b = part.body; if (!b || !part.verts) return;
    const p = b.getPosition(), a = b.getAngle(), c = Math.cos(a), s = Math.sin(a), v = b.getLinearVelocity(), w = b.getAngularVelocity();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [lx, ly] of part.verts) { const wx = p.x + lx * c - ly * s, wy = p.y + lx * s + ly * c; x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); y0 = Math.min(y0, wy); y1 = Math.max(y1, wy); }
    const gx0 = Math.max(lo, toG(x0) | 0), gx1 = Math.min(hi, toG(x1) | 0), gy0 = Math.max(lo, toG(y0) | 0), gy1 = Math.min(hi, toG(y1) | 0);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const i = gy * GW + gx, m = mat[i]; if (!m || m === OIL || m === FIRE) continue;
      const wx = (gx + 0.5) / G - VIEW / 2, wy = (gy + 0.5) / G - VIEW / 2, dx = wx - p.x, dy = wy - p.y;
      if (!inPoly(part.verts, dx * c + dy * s, -dx * s + dy * c)) continue;
      const pvx = (v.x - w * dy) * G / 60, pvy = (v.y + w * dx) * G / 60, d = Math.hypot(dx, dy) || 1;
      fly(gx + 0.5, gy + 0.5, pvx * 1.15 + dx / d * 0.5 + rnd(-0.2, 0.2), pvy * 1.15 + dy / d * 0.5 + rnd(-0.2, 0.2), m, col[i], life[i]); mat[i] = 0;
    }
  }
  function robots(S) {
    for (const R of S.robots) {
      if (R.inPit) continue;
      for (const q of R.parts) if (q.attached) plough(q);
      const b = R.body, wp = (x, y) => b.getWorldPoint(planck.Vec2(x, y));
      // wheels through oil leave dark tracks for a while
      let o = oily.get(R) || 0;
      for (const q of R.parts) if (q.attached && q.kind === 'wheel') {
        const c = L.centroid(q.verts), w = q.body.getWorldPoint(planck.Vec2(c[0], c[1])), gx = toG(w.x) | 0, gy = toG(w.y) | 0, i = gy * GW + gx;
        if (gx < lo || gy < lo || gx > hi || gy > hi) continue;
        for (const n of [0, 1, -1, GW, -GW]) if (mat[i + n] === OIL) { o = 150; if (Math.random() < 0.25) mat[i + n] = 0; }
        if (o > 0) { const a = 40 + o; for (const n of [0, 1, GW, GW + 1]) if (a > stain[i + n]) { stain[i + n] = Math.min(170, a); stainC[i + n] = pk(30, 26, 22); } }
      }
      oily.set(R, Math.max(0, o - 1));
      // leaks: a badly hurt or dead robot drips oil, a burning battery drips fire
      const hurt = R.chassis ? R.chassis.hp / R.chassis.maxHp : 1;
      const leak = !R.alive ? 0.25 : hurt < 0.45 ? (0.45 - hurt) * 0.5 : 0;
      if (Math.random() < leak) { const q = wp(rnd(-R.hl, R.hl) * 0.8, rnd(-R.hw, R.hw) * 0.8); put(toG(q.x), toG(q.y), OIL, OILC, 0); }
      if (R.battery && R.battery.fire && Math.random() < 0.35) { const q = wp(R.battery.lp[0], R.battery.lp[1]); fly(toG(q.x), toG(q.y), rnd(-0.6, 0.6), rnd(-0.6, 0.6), FIRE, 0, 40 + Math.random() * 60); }
    }
    for (const d of S.debris) if (!d.gone && !d.fellT && d.body) plough(d);
  }

  function stepParts() {
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k], fr = p.m === HOT ? 0.93 : p.m === FIRE ? 0.85 : 0.87;
      p.vx *= fr; p.vy *= fr;
      if (p.m === HOT && p.l > 0) p.l--;
      const sp = Math.max(Math.abs(p.vx), Math.abs(p.vy)), n = Math.max(1, Math.ceil(sp));
      for (let s = 0; s < n; s++) {
        p.x += p.vx / n; p.y += p.vy / n;
        if (p.x < lo) { p.x = lo; p.vx = Math.abs(p.vx) * 0.35; } else if (p.x > hi) { p.x = hi; p.vx = -Math.abs(p.vx) * 0.35; }
        if (p.y < lo) { p.y = lo; p.vy = Math.abs(p.vy) * 0.35; } else if (p.y > hi) { p.y = hi; p.vy = -Math.abs(p.vy) * 0.35; }
      }
      if (sp < 0.12 || (p.m === HOT && p.l <= 0)) {
        if (p.m === HOT) { if (p.l > 0 || Math.random() < 0.35) put(p.x, p.y, p.l > 0 ? HOT : GRIT, p.l > 0 ? 0 : pick(GRITC), p.l); }
        else if (p.m === FIRE) { const i = (p.y | 0) * GW + (p.x | 0); if (mat[i] === OIL || !mat[i]) { mat[i] = FIRE; life[i] = p.l; } }
        else put(p.x, p.y, p.m, p.c, p.l);
        parts.splice(k, 1);
      }
    }
  }
  function stepCells() {
    for (let i = GW; i < N - GW; i++) {
      const m = mat[i]; if (m < HOT) continue;
      if (m === HOT) { if (life[i] > 0) life[i]--; else { mat[i] = GRIT; col[i] = pick(GRITC); } continue; }
      // fire: burns down, spreads through oil, leaves a scorch mark
      if (life[i] > 0) life[i]--;
      const n = i + NB4[(Math.random() * 4) | 0];
      if (mat[n] === OIL && Math.random() < 0.14) { mat[n] = FIRE; life[n] = 50 + Math.random() * 70; }
      if (!life[i]) { mat[i] = EMPTY; if (stain[i] < 150) { stain[i] = 150; stainC[i] = pk(24, 16, 10); } }
    }
  }

  function step(S) {
    if (S !== curS) { curS = S; reset(); }
    onFx(S);
    if (++sub % 2) return; // pixel physics at 60 Hz
    robots(S); stepParts(); stepCells();
  }
  const _step = L.step;
  L.step = function (S) { _step(S); try { step(S); } catch (e) { console.warn('pixel layer', e); } };

  function draw(ctx) {
    frame++;
    for (let i = 0; i < N; i++) {
      const m = mat[i];
      if (m === EMPTY) { buf[i] = stain[i] ? ((stain[i] << 24) | (stainC[i] & 0xffffff)) >>> 0 : 0; continue; }
      if (m === GRIT || m === CHUNK) buf[i] = col[i];
      else if (m === OIL) buf[i] = ((i * 2654435761) >>> 28) === 0 ? OILS : OILC;
      else if (m === HOT) buf[i] = HOTC[Math.min(3, (4 - life[i] / 18) | 0)];
      else buf[i] = FIREC[(Math.random() * 4) | 0];
    }
    for (const p of parts) { const x = p.x | 0, y = p.y | 0; if (x < 0 || y < 0 || x >= GW || y >= GW) continue;
      buf[y * GW + x] = p.m === HOT ? HOTC[Math.min(3, (4 - p.l / 18) | 0)] : p.m === FIRE ? FIREC[(Math.random() * 4) | 0] : p.m === OIL ? OILC : p.c; }
    g.putImageData(img, 0, 0);
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, -VIEW / 2, -VIEW / 2, VIEW, VIEW);
    ctx.imageSmoothingEnabled = sm;
  }
  function glow(ctx) { // fire and hot metal glow, drawn over the robots
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let n = 0;
    for (let i = 0; i < N && n < 60; i += 7) if (mat[i] === FIRE && Math.random() < 0.3) { const x = (i % GW + 0.5) / G - VIEW / 2, y = ((i / GW) | 0) / G - VIEW / 2, r = 0.12;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,150,50,0.35)'); gr.addColorStop(1, 'rgba(255,150,50,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); n++; }
    ctx.restore();
  }
  window.PIX = { draw, glow, GW, VIEW };
})();
