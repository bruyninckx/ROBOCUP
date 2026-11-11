// ROBOCUS 3D Arena: procedural textures (Nov 2026). No image files: every surface is painted on canvases at load
// (tileable value noise, scratches, rivets, chips, tread) and turned into colour, roughness and normal maps for three.js.
(function (root) {
  'use strict';
  const THREE = root.THREE;
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  // tileable fractal value noise, 0..1
  function fbm(w, h, seed, cells, oct, gain) {
    const out = new Float32Array(w * h), r = rng(seed); let amp = 1, tot = 0; gain = gain || 0.5;
    for (let o = 0; o < oct; o++) {
      const cx = cells << o, cy = Math.max(1, Math.round(cells * h / w)) << o, g = new Float32Array(cx * cy);
      for (let i = 0; i < g.length; i++) g[i] = r();
      for (let y = 0; y < h; y++) {
        const fy = y / h * cy, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), r0 = (y0 % cy) * cx, r1 = ((y0 + 1) % cy) * cx;
        for (let x = 0; x < w; x++) {
          const fx = x / w * cx, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % cx;
          const a = g[r0 + x0] + (g[r0 + x1] - g[r0 + x0]) * sx, b = g[r1 + x0] + (g[r1 + x1] - g[r1 + x0]) * sx;
          out[y * w + x] += (a + (b - a) * sy) * amp;
        }
      }
      tot += amp; amp *= gain;
    }
    for (let i = 0; i < out.length; i++) out[i] /= tot;
    return out;
  }
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  // write colour / roughness / height arrays into canvases
  function toCanvas(w, h, fn) { const c = cvs(w, h), x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data; for (let i = 0, p = 0; i < w * h; i++, p += 4) { const v = fn(i); d[p] = v[0]; d[p + 1] = v[1]; d[p + 2] = v[2]; d[p + 3] = 255; } x.putImageData(id, 0, 0); return c; }
  function grey(w, h, arr, lo, hi) { return toCanvas(w, h, i => { const v = Math.max(0, Math.min(255, (lo + (hi - lo) * arr[i]) * 255)); return [v, v, v]; }); }
  // normal map from a height canvas (wraps at the edges so it tiles)
  function normalFrom(hc, strength) {
    const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, H = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) H[i] = src[i * 4] / 255;
    return toCanvas(w, h, i => { const x = i % w, y = (i / w) | 0, l = H[y * w + (x + w - 1) % w], r = H[y * w + (x + 1) % w], u = H[((y + h - 1) % h) * w + x], d = H[((y + 1) % h) * w + x];
      let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L; return [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255]; });
  }
  function tex(c, srgb, rep) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
  function scratches(ctx, r, n, w, h, col, lw, maxLen, curve) {
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) { const x = r() * w, y = r() * h, a = r() * Math.PI * 2, l = (0.2 + r()) * maxLen; ctx.strokeStyle = col(r()); ctx.lineWidth = lw * (0.4 + r());
      ctx.beginPath(); ctx.moveTo(x, y); if (curve) ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); else ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- arena floor: worn steel plates (one texture for the whole 9 m floor) ----------
  function floorSet(ice, M) {
    const W = 2048, PPM = W / M, r = rng(ice ? 77 : 41), N = 1024;
    const g1 = fbm(N, N, 3, 6, 6, 0.55), g2 = fbm(N, N, 9, 3, 5, 0.6), g3 = fbm(N, N, 21, 24, 3, 0.5), g4 = fbm(N, N, 51, 4, 4, 0.5);
    const tone = []; for (let i = 0; i < 100; i++) tone.push(0.93 + r() * 0.14);
    const plateOf = (x, y) => tone[(Math.floor(x / N * M) * 13 + Math.floor(y / N * M) * 7) % 100];
    // colour at 1024, then upscaled into 2048 with the fine details drawn on top
    const base = toCanvas(N, N, i => {
      const x = i % N, y = (i / N) | 0, t = plateOf(x, y), gr = g1[i], ru = ice ? 0 : sm(0.6, 0.75, g2[i] * 0.7 + g3[i] * 0.3), oil = ice ? 0 : sm(0.72, 0.78, g4[i]);
      if (ice) { const v = 0.84 + gr * 0.12; return [158 * v * t, 182 * v, 196 * v]; }
      let c = [74 * t, 71 * t, 66 * t]; const k = 0.8 + gr * 0.35; c = c.map(v => v * k);
      c = [c[0] + (96 - c[0]) * ru * 0.55, c[1] + (64 - c[1]) * ru * 0.55, c[2] + (42 - c[2]) * ru * 0.55];
      return c.map(v => v * (1 - oil * 0.35));
    });
    const col = cvs(W), cx = col.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(base, 0, 0, W, W);
    const rough = grey(N, N, g1.map((v, i) => ice ? 0.12 + v * 0.15 : 0.5 + v * 0.3 - sm(0.72, 0.78, g4[i]) * 0.3), 0, 1);
    const rc = cvs(W), rx = rc.getContext('2d'); rx.drawImage(rough, 0, 0, W, W);
    const hc = cvs(N), hx = hc.getContext('2d'); hx.drawImage(grey(N, N, g3, 0.45, 0.55), 0, 0);
    const hp = N / M; // height map pixels per metre
    // plate seams, rivets
    for (let i = 0; i <= M; i++) {
      const p = i * PPM, q = i * hp;
      cx.fillStyle = ice ? 'rgba(120,160,180,0.5)' : 'rgba(18,15,12,0.85)'; cx.fillRect(p - 3, 0, 6, W); cx.fillRect(0, p - 3, W, 6);
      cx.fillStyle = ice ? 'rgba(255,255,255,0.4)' : 'rgba(200,190,175,0.18)'; cx.fillRect(p + 3, 0, 2, W); cx.fillRect(0, p + 3, W, 2);
      hx.fillStyle = '#000'; hx.fillRect(q - 1.5, 0, 3, N); hx.fillRect(0, q - 1.5, N, 3);
    }
    if (!ice) for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) for (const [a, b] of [[0.06, 0.06], [0.94, 0.06], [0.06, 0.94], [0.94, 0.94], [0.5, 0.06], [0.5, 0.94], [0.06, 0.5], [0.94, 0.5]]) {
      const x = (i + a) * PPM, y = (j + b) * PPM; cx.fillStyle = 'rgba(12,10,8,0.7)'; cx.beginPath(); cx.arc(x + 1.5, y + 2, 6.5, 0, 7); cx.fill();
      const gg = cx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 6); gg.addColorStop(0, '#CFC8BA'); gg.addColorStop(1, '#5E5850'); cx.fillStyle = gg; cx.beginPath(); cx.arc(x, y, 5.5, 0, 7); cx.fill();
      const hg = hx.createRadialGradient((i + a) * hp, (j + b) * hp, 0, (i + a) * hp, (j + b) * hp, 3.2); hg.addColorStop(0, '#fff'); hg.addColorStop(1, 'rgba(255,255,255,0)'); hx.fillStyle = hg; hx.beginPath(); hx.arc((i + a) * hp, (j + b) * hp, 3.2, 0, 7); hx.fill();
    }
    // scratches: long straight ones, and arcs from robots turning on the spot
    scratches(cx, r, ice ? 900 : 1400, W, W, v => ice ? `rgba(255,255,255,${0.12 + v * 0.2})` : `rgba(200,192,180,${0.03 + v * 0.06})`, 1.2, 70, false);
    scratches(cx, r, 300, W, W, () => 'rgba(10,8,6,0.08)', 1.5, 50, false);
    scratches(rx, rng(5), 900, W, W, v => `rgba(${ice ? 150 : 95},${ice ? 150 : 95},${ice ? 150 : 95},${0.2 + v * 0.25})`, 1.2, 70, false);
    scratches(hx, rng(6), 600, N, N, v => `rgba(0,0,0,${0.1 + v * 0.15})`, 0.7, 35, false);
    // dents from hits
    if (!ice) for (let k = 0; k < 40; k++) { const x = r() * N, y = r() * N, rr = 3 + r() * 9, hg = hx.createRadialGradient(x, y, 0, x, y, rr); hg.addColorStop(0, 'rgba(0,0,0,0.5)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); hx.fillStyle = hg; hx.beginPath(); hx.arc(x, y, rr, 0, 7); hx.fill(); }
    // the painted ring in the middle and the ROBOCUS stencil, faded and worn
    cx.save(); cx.globalAlpha = ice ? 0.35 : 0.22; cx.strokeStyle = ice ? '#3A6F8C' : '#E8C547'; cx.lineWidth = 14; cx.beginPath(); cx.arc(W / 2, W / 2, 1.0 * PPM, 0, 7); cx.stroke();
    cx.font = `${Math.round(0.42 * PPM)}px "Saira Stencil One", Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = ice ? '#3A6F8C' : '#E8C547'; cx.fillText('ROBOCUS', W / 2, W / 2 + 2.1 * PPM); cx.restore();
    cx.save(); cx.globalCompositeOperation = 'multiply'; cx.globalAlpha = 0.55; cx.drawImage(grey(N, N, g1, 0.55, 1.05), 0, 0, W, W); cx.restore();
    const normal = normalFrom(hc, ice ? 3 : 6);
    return { colour: col, rough: rc, normal, PPM };
  }

  // ---------- painted metal for a team (tiles; about 0.7 m per tile on the robots) ----------
  function paintSet(hex, seed, opt) {
    opt = opt || {}; const N = 512, r = rng(seed), g = fbm(N, N, seed, 4, 5, 0.55), gc = fbm(N, N, seed + 7, 16, 3, 0.5), [R, G, B] = hexRgb(hex);
    const chipT = opt.chips == null ? 0.74 : opt.chips;
    const col = toCanvas(N, N, i => { const chip = sm(chipT, chipT + 0.03, gc[i] * 0.65 + g[i] * 0.35), k = 0.9 + g[i] * 0.18; return [R * k * (1 - chip) + 150 * chip, G * k * (1 - chip) + 150 * chip, B * k * (1 - chip) + 146 * chip]; });
    const cx = col.getContext('2d');
    if (opt.stripes) { cx.save(); cx.globalAlpha = 0.92; cx.fillStyle = '#1C1915'; for (let x = -N; x < N * 2; x += 96) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x + 48, 0); cx.lineTo(x + 48 + N, N); cx.lineTo(x + N, N); cx.closePath(); cx.fill(); } cx.restore(); }
    scratches(cx, r, 140, N, N, v => `rgba(185,185,180,${0.25 + v * 0.35})`, 1.1, 60, false);
    cx.save(); cx.globalCompositeOperation = 'multiply'; cx.globalAlpha = 0.35; cx.drawImage(grey(N, N, fbm(N, N, seed + 3, 3, 4, 0.6), 0.6, 1.0), 0, 0); cx.restore();
    const rough = grey(N, N, gc.map((v, i) => { const chip = sm(chipT, chipT + 0.03, v * 0.65 + g[i] * 0.35); return 0.28 + g[i] * 0.18 + chip * 0.25; }), 0, 1);
    scratches(rough.getContext('2d'), rng(seed + 1), 140, N, N, () => 'rgba(140,140,140,0.6)', 1.1, 60, false);
    const hc = grey(N, N, gc.map((v, i) => 1 - sm(chipT, chipT + 0.03, v * 0.65 + g[i] * 0.35) * 0.6), 0, 1);
    return { colour: col, rough, normal: normalFrom(hc, 2.5) };
  }
  // ---------- bare steel: brushed, scratched, a little grime ----------
  function steelSet(seed, tint, opt) {
    opt = opt || {}; const N = 512, r = rng(seed), g = fbm(N, N, seed, 4, 5, 0.55), [R, G, B] = hexRgb(tint || '#9C9E98');
    const rows = new Float32Array(N); for (let y = 0; y < N; y++) rows[y] = r();
    const brush = new Float32Array(N * N); for (let i = 0; i < N * N; i++) { const y = (i / N) | 0; brush[i] = rows[y] * 0.6 + rows[(y * 7 + 3) % N] * 0.4; }
    const col = toCanvas(N, N, i => { const k = (0.82 + brush[i] * 0.12 + g[i] * 0.16) * (opt.dark ? 0.55 : 1); return [R * k, G * k, B * k]; });
    const cx = col.getContext('2d'); scratches(cx, r, 260, N, N, v => v < 0.7 ? `rgba(225,225,220,${0.15 + v * 0.3})` : `rgba(30,28,25,${0.2 + v * 0.2})`, 1.2, 80, true);
    if (opt.bolts) for (let k = 0; k < 4; k++) { const x = (k % 2 ? 0.85 : 0.15) * N, y = (k < 2 ? 0.15 : 0.85) * N, gg = cx.createRadialGradient(x - 3, y - 3, 1, x, y, 13); gg.addColorStop(0, '#E0DDD5'); gg.addColorStop(1, '#4A4743'); cx.fillStyle = gg; cx.beginPath(); cx.arc(x, y, 12, 0, 7); cx.fill(); }
    const rough = grey(N, N, brush.map((v, i) => (opt.polish ? 0.18 : 0.32) + v * 0.12 + g[i] * 0.2), 0, 1);
    scratches(rough.getContext('2d'), rng(seed + 2), 260, N, N, () => 'rgba(70,70,70,0.6)', 1.2, 80, true);
    const hc = grey(N, N, brush.map((v, i) => 0.5 + (v - 0.5) * 0.25 + (g[i] - 0.5) * 0.3), 0, 1); scratches(hc.getContext('2d'), rng(seed + 2), 260, N, N, () => 'rgba(0,0,0,0.5)', 1.2, 80, true);
    return { colour: col, rough, normal: normalFrom(hc, 3) };
  }
  // ---------- tyre rubber: tread blocks round the wheel (u = round, v = across) ----------
  function rubberSet() {
    const W = 512, H = 128, g = fbm(W, H, 13, 8, 4, 0.5), hc = grey(W, H, g, 0.75, 0.85), hx = hc.getContext('2d');
    const col = toCanvas(W, H, i => { const v = 34 + g[i] * 16; return [v, v * 0.97, v * 0.94]; }), cx = col.getContext('2d');
    const chevron = (x2, fill) => { x2.fillStyle = fill; for (let k = 0; k < 24; k++) { const x = k / 24 * W; x2.beginPath(); x2.moveTo(x, 0); x2.lineTo(x + 8, 0); x2.lineTo(x + 18, H / 2); x2.lineTo(x + 8, H); x2.lineTo(x, H); x2.lineTo(x + 10, H / 2); x2.closePath(); x2.fill(); } };
    chevron(hx, '#111'); chevron(cx, 'rgba(8,7,6,0.75)');
    const rough = grey(W, H, g, 0.82, 0.95);
    return { colour: col, rough, normal: normalFrom(hc, 8) };
  }
  // ---------- concrete round the arena ----------
  function concreteSet() {
    const N = 512, g = fbm(N, N, 31, 8, 6, 0.6), g2 = fbm(N, N, 37, 64, 2, 0.5);
    const col = toCanvas(N, N, i => { const v = 46 + g[i] * 30 + g2[i] * 10; return [v, v * 0.97, v * 0.93]; });
    return { colour: col, rough: grey(N, N, g, 0.8, 1), normal: normalFrom(grey(N, N, g2, 0.3, 0.7), 2) };
  }
  // ---------- woven composite (fibre bumpers) ----------
  function weaveSet(hex) {
    const N = 256, [R, G, B] = hexRgb(hex), hc = cvs(N), hx = hc.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const g = hx.createLinearGradient(x * 16, y * 16, x * 16 + ((x + y) % 2 ? 16 : 0), y * 16 + ((x + y) % 2 ? 0 : 16)); g.addColorStop(0, '#333'); g.addColorStop(0.5, '#ddd'); g.addColorStop(1, '#333'); hx.fillStyle = g; hx.fillRect(x * 16, y * 16, 16, 16); }
    const d = hx.getImageData(0, 0, N, N).data; const col = toCanvas(N, N, i => { const v = 0.55 + d[i * 4] / 255 * 0.5; return [R * v, G * v, B * v]; });
    return { colour: col, rough: grey(N, N, new Float32Array(N * N).fill(0.35), 0, 1), normal: normalFrom(hc, 2) };
  }
  // ---------- polycarbonate screen: scuffs only ----------
  function scuffMap() { const N = 512, c = cvs(N), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, N, N); scratches(x, rng(91), 400, N, N, v => `rgba(255,255,255,${0.2 + v * 0.5})`, 1, 70, true); return c; }

  const cache = {};
  function set(key, make, rep, srgbCol) { if (cache[key]) return cache[key]; const s = make(); const out = { map: tex(s.colour, true, rep), roughnessMap: tex(s.rough, false, rep), normalMap: tex(s.normal, false, rep) }; cache[key] = out; return out; }
  root.RTEX = {
    floor: (ice, M) => { const s = floorSet(ice, M); return { colourCanvas: s.colour, roughnessMap: tex(s.rough, false), normalMap: tex(s.normal, false), PPM: s.PPM }; },
    paint: (hex, seed, opt) => set('p' + hex + (opt && opt.stripes ? 's' : ''), () => paintSet(hex, seed || 5, opt), [1.4, 1.4]),
    steel: (key, seed, tint, opt) => set('s' + key, () => steelSet(seed, tint, opt), [1.6, 1.6]),
    rubber: () => set('rubber', rubberSet, [1, 1]),
    track: () => set('track', rubberSet, [5, 5]),
    concrete: () => set('concrete', concreteSet, [12, 12]),
    weave: hex => set('w' + hex, () => weaveSet(hex), [4, 4]),
    scuffs: () => cache.scuffs || (cache.scuffs = tex(scuffMap(), false, [3, 1])),
  };
})(window);
