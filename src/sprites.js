// ROBOCUS robot sprites: Kev's "B · Scrapyard" design (6 Nov 2026), shared by the tabletop prototype and the arena sandbox.
// Needs src/sim.js first. RobotSprite.draw(ctx, x, y, bodyAngle, turretAngle, hullColour, build, hpFrac, name, nameTag, stunned, overclocked, nowMs, scale, simBot)
(function () {
  'use strict';
  // ---------- Robot sprites: Kev's "B · Scrapyard" design (6 Nov) ----------
  // Chunky, bolted, thick ink lines, seen from above. Only the hull takes the team colour; frame = hull shape,
  // drive = wheels / omni rollers / tracks / thruster, weapon on a grey turret. Damage shows on the hull:
  // scorch marks and dents grow as health drops, a broken part sparks and smokes (a broken weapon is bent),
  // and a destroyed robot is a grey, smoking wreck with a torn-off track.
  const SY = { ink: '#2B2118', turret: '#8C8F86', dark: '#3A3530', tread: '#807868', accent: '#E8C547', blade: '#A9AAA2', bolt: '#E4E1DA', wreck: '#7A746B', wreckT: '#6E6A62' };
  const SCORCH = [[-0.42, 0.27, 0.19, 0.1], [0.27, -0.33, 0.13, 0.07], [0.12, 0.37, 0.11, 0.05], [-0.3, -0.2, 0.12, 0.07], [0.33, 0.15, 0.1, 0.06], [-0.05, 0.05, 0.1, 0.06]];
  const DENTS = [[-0.42, -0.07, -0.25, 0, -0.38, 0.1], [0.33, 0.07, 0.21, 0.17, 0.37, 0.23], [-0.2, 0.33, -0.08, 0.4, -0.15, 0.47], [0.1, -0.42, 0.25, -0.35, 0.18, -0.28]];
  function syPath(ctx, fill, stroke, lw, f) { ctx.beginPath(); f(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); } }
  const syRR = (ctx, x, y, w, h, r) => { if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  function syBolts(ctx, pts) { for (const [bx, by] of pts) syPath(ctx, SY.bolt, SY.ink, 1.5, () => ctx.arc(bx, by, 2.3, 0, Math.PI * 2)); }
  function draw(ctx, x, y, bodyA, turretA, col, b, hpFrac, name, modTag, stunned, overclocked, now, scale = 1, simBot = null) {
    const frameSz = simBot && simBot.size ? simBot.size : b.size || Sim.frameOf(b).size;
    const SIZE = frameSz * scale, fs = frameSz / 30;
    const w = b.weapon || 'gun', cal = b.cal || 'medium', fr = Sim.frameOf(b).key, drv = b.drive || 'wheels';
    const dead = hpFrac <= 0, spin = w === 'spinner';
    const brk = simBot ? (simBot.brokenParts || []).map(p => p.key) : (b.brk || []);
    const wepBroken = brk.some(k => /^(weapon|wup|cal)/.test(k)) || (simBot && (simBot.broken || []).some(n => /blade|barrel|weapon|rail|gun/i.test(n)));
    // body size in design units (the hull's width maps to the frame size)
    const dim = spin ? { W: 84, H: 84 } : fr === 'light' ? { W: 48, H: 56 } : fr === 'medium' ? { W: 44, H: 54 } : fr === 'heavy' ? { W: 48, H: 60 } : { W: 68, H: 80 };
    const k = spin ? (28 * scale * fs) / 62 : SIZE * 1.12 / dim.W, W2 = dim.W / 2, H2 = dim.H / 2;
    const hull = dead ? SY.wreck : col, tur = dead ? SY.wreckT : SY.turret;
    ctx.save();
    ctx.translate(x, y);
    if (overclocked && !dead) { ctx.strokeStyle = '#d99000'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, (23 + Math.sin(now / 60) * 2.5) * scale * Math.max(1, fs), 0, Math.PI * 2); ctx.stroke(); }

    // ---- hull, drive and bolts (rotate with the body; the design faces up, the game faces +x)
    ctx.save();
    ctx.rotate(bodyA + Math.PI / 2 + (dead ? 0.24 : 0));
    ctx.scale(k, k);
    if (spin) {
      syPath(ctx, SY.dark, SY.ink, 2, () => ctx.arc(0, 0, 56, 0, Math.PI * 2));
      if (!dead) {
        const sa = simBot ? (simBot.spin || now / 45) : now / 90, bladeBrk = wepBroken;
        ctx.save(); ctx.rotate(sa); ctx.globalAlpha = bladeBrk ? 0.45 : 1;
        for (let n = 0; n < 3; n++) { ctx.save(); ctx.rotate(n * 2.0944); syPath(ctx, SY.blade, SY.ink, 2.5, () => { ctx.moveTo(-9, -62); ctx.lineTo(9, -62); ctx.lineTo(5, -44); ctx.lineTo(-5, -44); ctx.closePath(); }); ctx.restore(); }
        ctx.restore(); ctx.globalAlpha = 1;
      }
      syPath(ctx, hull, SY.ink, 3.5, () => ctx.arc(0, 0, 42, 0, Math.PI * 2));
      ctx.setLineDash([6, 3]); syPath(ctx, null, SY.ink, 2, () => ctx.arc(0, 0, 32, 0, Math.PI * 2)); ctx.setLineDash([]);
      syBolts(ctx, [[0, -24], [21, 12], [-21, 12]]);
    } else {
      // drive
      if (drv === 'tracks') {
        const tx = W2 + 7, th = dim.H + 12, off = simBot ? ((simBot.x + simBot.y) * 0.5) % 7 : 0;
        for (const sx of [-1, 1]) {
          const torn = dead && sx > 0;
          ctx.save(); if (torn) { ctx.translate(10, 6); ctx.rotate(0.16); }
          syPath(ctx, SY.dark, SY.ink, 2, () => syRR(ctx, sx * tx - 7, -th / 2, 14, th, 3));
          ctx.strokeStyle = SY.tread; ctx.lineWidth = 9; ctx.setLineDash([4, 3]); ctx.lineDashOffset = off;
          ctx.beginPath(); ctx.moveTo(sx * tx, -th / 2 + 3); ctx.lineTo(sx * tx, th / 2 - 3); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
        }
      } else if (drv === 'omni') {
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (!(dead && sx > 0 && sy > 0)) syPath(ctx, SY.dark, SY.ink, 2, () => ctx.arc(sx * W2, sy * H2 * 0.72, 7, 0, Math.PI * 2));
      } else {
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (!(dead && sx > 0 && sy > 0)) syPath(ctx, SY.dark, SY.ink, 2, () => syRR(ctx, sx * (W2 + 4.5) - 4.5, sy * H2 * 0.62 - 8, 9, 16, 3));
        if (drv === 'boost') {   // rear thruster, lit while dashing
          const dash = simBot && simBot.dashT > 0;
          syPath(ctx, SY.dark, SY.ink, 2, () => syRR(ctx, -8, H2 - 2, 16, 9, 2));
          if (dash) syPath(ctx, SY.accent, SY.ink, 1.5, () => { ctx.moveTo(-7, H2 + 7); ctx.lineTo(7, H2 + 7); ctx.lineTo(0, H2 + 22 + Math.sin(now / 40) * 3); ctx.closePath(); });
        }
      }
      // hull by frame
      syPath(ctx, hull, SY.ink, 3.5, () => {
        if (fr === 'light') { ctx.moveTo(0, -H2); ctx.lineTo(W2, -H2 / 2); ctx.lineTo(W2, H2 / 2); ctx.lineTo(0, H2); ctx.lineTo(-W2, H2 / 2); ctx.lineTo(-W2, -H2 / 2); ctx.closePath(); }
        else syRR(ctx, -W2, -H2, dim.W, dim.H, fr === 'medium' ? 12 : 6);
      });
      const ar = b.lv ? b.lv.armor : 0;
      if (fr === 'titan' || ar >= 2) { ctx.setLineDash([6, 3]); syPath(ctx, null, SY.ink, 2, () => syRR(ctx, -W2 + 8, -H2 + 8, dim.W - 16, dim.H - 16, 4)); ctx.setLineDash([]); }
      syBolts(ctx, fr === 'light' ? [[-14, -10], [14, -10], [-14, 12], [14, 12]] : fr === 'medium' ? [[-14, -H2 + 8], [14, -H2 + 8]] : [[-W2 + 7, -H2 + 7], [W2 - 7, -H2 + 7], [-W2 + 7, H2 - 7], [W2 - 7, H2 - 7]]);
    }
    // battle damage on the hull: more scorch marks and dents the lower the health
    const hurt = dead ? 1 : Math.max(0, 1 - hpFrac);
    const nScorch = dead ? 4 : Math.min(SCORCH.length, Math.floor(hurt * 7)), nDent = dead ? 3 : Math.min(DENTS.length, Math.floor(hurt * 5));
    ctx.fillStyle = 'rgba(43, 33, 24, 0.38)';
    for (let n = 0; n < nScorch; n++) { const [sx, sy, rx, ry] = SCORCH[n]; ctx.beginPath(); ctx.ellipse(sx * dim.W, sy * dim.H, rx * dim.W, ry * dim.H, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = SY.ink; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let n = 0; n < nDent; n++) { const d = DENTS[n]; ctx.beginPath(); ctx.moveTo(d[0] * dim.W, d[1] * dim.H); ctx.lineTo(d[2] * dim.W, d[3] * dim.H); ctx.lineTo(d[4] * dim.W, d[5] * dim.H); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.restore();

    // ---- turret and weapon (turn with the turret)
    ctx.save();
    ctx.rotate((spin ? bodyA : turretA) + Math.PI / 2 + (dead ? 0.24 : 0));
    ctx.scale(k, k);
    const bend = wepBroken && !spin ? 0.5 : 0;   // a broken weapon is bent / snapped
    const barrel = (bx, by, bw, bh, r) => { ctx.save(); if (bend && by < -20) { ctx.translate(bx + bw / 2, by + bh); ctx.rotate(bend); ctx.translate(-(bx + bw / 2), -(by + bh)); } syPath(ctx, SY.dark, SY.ink, 1.5, () => syRR(ctx, bx, by, bw, bh, r || 1)); ctx.restore(); };
    if (!spin) {
      if (w === 'railgun') {
        barrel(-7, -62, 4, 50); barrel(3, -62, 4, 50);
        if (!bend) for (const ay of [-54, -44, -34]) syPath(ctx, SY.accent, SY.ink, 1.5, () => ctx.rect(-9, ay, 18, 3));
      } else if (w === 'laser') {
        barrel(-2.5, -54, 5, 42);
        if (!bend) syPath(ctx, '#7fd3e6', SY.ink, 1.5, () => ctx.arc(0, -55, 4.5, 0, Math.PI * 2));
      } else if (w === 'mortar') {
        syPath(ctx, SY.dark, SY.ink, 2, () => syRR(ctx, -8, -32, 16, 20, 3)); syPath(ctx, SY.ink, null, 0, () => ctx.arc(0, -30, 4.5, 0, Math.PI * 2));
      } else if (w === 'saw') {
        syPath(ctx, SY.dark, SY.ink, 1.5, () => syRR(ctx, -11, -34, 22, 13, 3));
        ctx.save(); ctx.translate(bend ? 6 : 0, -44); ctx.rotate(simBot ? B_SAW(simBot, now) : now / 120);
        ctx.setLineDash([5, 3]); syPath(ctx, SY.blade, SY.ink, 3, () => ctx.arc(0, 0, 12, 0, Math.PI * 2)); ctx.setLineDash([]);
        syPath(ctx, SY.dark, SY.ink, 1.5, () => ctx.arc(0, 0, 3, 0, Math.PI * 2)); ctx.restore();
      } else if (w === 'flame') {
        const fl = simBot ? (simBot.flame > 0 || simBot.firing) : false, flick = Math.sin(now / 50) * 3;
        if (!bend) syPath(ctx, SY.accent, SY.ink, 1.5, () => { ctx.moveTo(-9, -49); ctx.lineTo(9, -49); ctx.lineTo(15, -61 - (fl ? 6 + flick : 0)); ctx.lineTo(0, -56 - (fl ? 8 : 0)); ctx.lineTo(-15, -61 - (fl ? 6 - flick : 0)); ctx.closePath(); });
        ctx.save(); if (bend) { ctx.translate(0, -20); ctx.rotate(bend); ctx.translate(0, 20); }
        syPath(ctx, SY.dark, SY.ink, 1.5, () => { ctx.moveTo(-5, -20); ctx.lineTo(5, -20); ctx.lineTo(9, -48); ctx.lineTo(-9, -48); ctx.closePath(); }); ctx.restore();
      } else {   // guns by calibre
        if (cal === 'rapid') { barrel(-6, -46, 4, 32); barrel(2, -46, 4, 32); }
        else if (cal === 'burst') { barrel(-8, -44, 4, 30); barrel(-2, -48, 4, 34); barrel(4, -44, 4, 30); }
        else if (cal === 'heavy') { barrel(-7, -60, 14, 44, 2); if (!bend) syPath(ctx, SY.accent, SY.ink, 1.5, () => syRR(ctx, -9, -62, 18, 6, 2)); }
        else barrel(-3.5, -50, 7, 38, 1.5);
      }
    }
    // turret
    if (w === 'railgun') syPath(ctx, tur, SY.ink, 3, () => syRR(ctx, -12, -12, 24, 24, 4));
    else syPath(ctx, tur, SY.ink, 3, () => ctx.arc(0, 0, spin ? 15 : fr === 'titan' ? 16 : 11, 0, Math.PI * 2));
    if (!dead && w !== 'railgun') syPath(ctx, SY.accent, SY.ink, 1.5, () => ctx.arc(0, 0, spin ? 5 : 4, 0, Math.PI * 2));
    // a broken part sparks and smokes (by the weapon)
    if (brk.length && !dead) {
      const fl = 0.75 + 0.25 * Math.sin(now / 70);
      ctx.save(); ctx.translate(spin ? 20 : 9, spin ? -30 : -40); ctx.scale(fl, fl);
      syPath(ctx, SY.accent, SY.ink, 1.2, () => { const pts = [[0, -7], [3, -2], [9, -5], [5, 1], [9, 6], [2, 4], [0, 10], [-2, 4], [-8, 6], [-4, 0], [-8, -5], [-2, -2]]; pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); });
      ctx.restore();
    }
    ctx.restore();
    // smoke drifts up from broken parts and wrecks (screen-up, not rotated)
    if (dead || brk.length) {
      const t = now / 1000, n = dead ? 3 : 2;
      for (let s = 0; s < n; s++) {
        const ph = (t * 0.6 + s / n) % 1, r = (4 + ph * 7) * k * 1.6;
        ctx.fillStyle = 'rgba(110, 106, 98, ' + (0.55 * (1 - ph)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc((dead ? 0 : 6 * k) + Math.sin(t * 2 + s) * 3 * k, -ph * 40 * k - (dead ? 0 : 20 * k), r, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (Sim.twinOf(b) && !dead) {   // 🌟 Twin Turret: a small second turret at the back of the hull
      const tA = simBot && simBot.tw ? simBot.tw.turret : turretA, w2 = b.twin.weapon, off = (simBot && simBot.twBroken) ? 0.4 : 1;
      ctx.save(); ctx.rotate(bodyA); ctx.translate(-SIZE * 0.32, 0); ctx.rotate(tA - bodyA + Math.PI / 2); ctx.scale(k, k); ctx.globalAlpha = off;
      syPath(ctx, SY.dark, SY.ink, 1.3, () => syRR(ctx, -2.5, -26, 5, 18, 1));
      if (w2 === 'flame') syPath(ctx, SY.accent, SY.ink, 1, () => { ctx.moveTo(-5, -26); ctx.lineTo(5, -26); ctx.lineTo(0, -34); ctx.closePath(); });
      syPath(ctx, SY.turret, SY.ink, 2, () => ctx.arc(0, 0, 8, 0, Math.PI * 2));
      syPath(ctx, SY.accent, SY.ink, 1, () => ctx.arc(0, 0, 3, 0, Math.PI * 2));
      ctx.restore();
    }
    ctx.restore();

    if (name) {
      ctx.fillStyle = col;
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const top = Math.max(15 * scale, (spin ? 28 * fs : SIZE * 0.62 / scale + 4) * scale);   // clear of a big frame or spinner blade
      ctx.fillText(name + (modTag || ''), x, y - top - 13 * scale);
      if (!dead) {
        ctx.fillStyle = '#111'; ctx.fillRect(x - 23, y - top - 9 * scale, 46, 6);
        ctx.fillStyle = '#e5e2da'; ctx.fillRect(x - 22, y - top - 8 * scale, 44, 4);
        ctx.fillStyle = col; ctx.fillRect(x - 22, y - top - 8 * scale, 44 * Math.max(0, hpFrac), 4);
      }
    }
    if (stunned && !dead) {
      ctx.fillStyle = '#1f6feb'; ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('STUNNED', x, y + 28 * scale);
    }
  }
  const B_SAW = (sb, now) => (sb.sawA != null ? sb.sawA : now / 90);

  const PALETTE = { steel: '#3F78A8', rust: '#C8642B', moss: '#5E8A3A', plum: '#86528F' };   // team hull colours (B · Team colours)
  const api = { draw, PALETTE, INK: SY.ink, COLORS: SY };
  if (typeof window !== 'undefined') window.RobotSprite = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
