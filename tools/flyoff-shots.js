// T67 parts that fly off: screenshots of each robot with a breakaway piece, just before and a few seconds after it comes off,
// in the game's fight view (src2/view.js), from prototypes/flyoff-lab.html. Also the two portraits (as it comes / without the piece).
//   node tools/flyoff-shots.js [outDir=/home/claude/out] [step=t68]   -> <step>-<robot>-before.png, -after.png, -arena.png, -portraits.png
//   step t67: Buzzkill, Popcorn, Bricklayer; t68: Gyro, Railgun, Scavenger, Grandmaster, Whaler, Jukebox; t69: Pogo, Blacksmith, Lodestone,
//   Hornet, Tarantula, Hydra; t71a: Forklift, Mincer, Scythe, Snapjaw, Thumper, Wrecker. 'sheet': one picture of all the portraits (21 after T71a), with and without the piece (<step>-portraits-all.png)
const { chromium } = require('playwright'), path = require('path');
const PLK = require('./planck-local.js'), PL = PLK.find('');
const OUT = process.argv[2] || '/home/claude/out', STEP = process.argv[3] || 't68';
const PICK = STEP === 't67' ? { Buzzkill: 'Mauler', Popcorn: 'Thwacker', Bricklayer: 'Gyro' }
  : STEP === 't68' ? { Gyro: 'Mauler', Railgun: 'Ramrod', Scavenger: 'Buzzkill', Grandmaster: 'Hydra', Whaler: 'Thwacker', Jukebox: 'Hydra' }
  : STEP === 't71a' ? { Forklift: 'Haymaker', Mincer: 'Ramrod', Scythe: 'Thwacker', Snapjaw: 'Brawler', Thumper: 'Ramrod', Wrecker: 'Haymaker' }
  : { Pogo: 'Mauler', Blacksmith: 'Ramrod', Lodestone: 'Thwacker', Hornet: 'Brawler', Tarantula: 'Mauler', Hydra: 'Ramrod' };
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 2 }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await PLK.route(p, PL);
  await p.goto('file://' + path.resolve(__dirname, '../prototypes/flyoff-lab.html')); await p.waitForTimeout(300);
  if (process.argv[4] === 'sheet') { // T69: all robots with a breakaway piece, as they come and without it (Tarantula, Hydra: all pieces gone)
    const n = await p.evaluate(() => {
      const L = window.DamageLab, LU = window.Lineup, VW = window.RobocusView, who = Object.keys(L.FLYOFF).filter(k => L.PRESETS[k]), sz = 150, cols = 5, W = cols * (2 * sz + 30) + 10, rows = Math.ceil(who.length / cols);
      const c = document.createElement('canvas'); c.width = W; c.height = rows * (sz + 34) + 40; c.id = 'sheet'; const x = c.getContext('2d');
      x.fillStyle = '#EFE8DA'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#2B2118'; x.font = '700 18px system-ui'; x.fillText('Parts that fly off: ' + who.length + ' robots, as they come (left) and without the piece (right)', 12, 26);
      who.forEach((nm, k) => { const cx = 10 + (k % cols) * (2 * sz + 30), cy = 40 + Math.floor(k / cols) * (sz + 34);
        const a = VW.portrait(Object.assign(LU.build(nm), { flyoffKeep: true }), sz), b = VW.portrait(Object.assign(LU.build(nm), { flyoffGone: true }), sz);
        for (const [im, dx] of [[a, 0], [b, sz + 6]]) { x.fillStyle = '#E4DCCB'; x.fillRect(cx + dx, cy, sz, sz); x.drawImage(im, cx + dx, cy); x.strokeStyle = '#2B2118'; x.lineWidth = 1.5; x.strokeRect(cx + dx, cy, sz, sz); }
        x.fillStyle = '#2B2118'; x.font = '600 13px system-ui'; x.fillText(nm + ' · ' + L.FLYOFF[nm].label.toLowerCase() + (L.FLYOFF[nm].count > 1 ? ' x' + L.FLYOFF[nm].count : ''), cx, cy + sz + 16); });
      document.body.innerHTML = ''; document.body.appendChild(c); return who.length; });
    await p.waitForTimeout(200); const el = await p.$('#sheet'); await el.screenshot({ path: `${OUT}/${STEP}-portraits-all.png` }); console.log('sheet: ' + n + ' robots -> ' + `${OUT}/${STEP}-portraits-all.png`);
    console.log(errs.length ? 'page errors: ' + errs.join(' | ') : '0 page errors'); await b.close(); return;
  }
  for (const [who, opp] of Object.entries(PICK)) { if (process.argv[4] && !process.argv[4].split(',').includes(who)) continue;
    // a seed where the piece comes off between 8 and 70 s and both robots are still going 3 s later
    const f = await p.evaluate(([who, opp]) => {
      const L = window.DamageLab, LU = window.Lineup;
      const spill = { Scavenger: 3, Jukebox: 1 }[who] || 0; // T68: show the junk / records that pour out
      const many = { Tarantula: 2, Hydra: 2 }[who] || 1, stuck = who === 'Hornet'; // T69: two legs / both heads gone; the tip stuck in the other robot
      for (let seed = 1; seed < 400; seed++) {
        const S = L.run({ a: LU.build(who), b: LU.build(opp), seed, arena: 'open', flyoff: true }), F = S.robots[0].fo, last = F.offs && F.offs.length ? F.offs[F.offs.length - 1] : F.offT;
        if (F.off && F.offT > (spill ? 3 : 8) && last < 70 && S.t > last + 4 && (F.spilled || 0) >= spill && (F.n || 1) >= many && (!stuck || F.pieces.some(q => q.stuckIn))) { // T69: and the right way up in both pictures
          const S2 = L.create({ a: LU.build(who), b: LU.build(opp), seed, arena: 'open', flyoff: true, countdown: 0 }); let ok = true;
          for (const at of [F.offT - 1.5, last + 2.5]) { while (S2.t < at && !S2.over) { L.step(S2); S2.fx.length = 0; } if (S2.robots[0].flipped || !S2.robots[0].alive) ok = false; }
          if (ok) return { seed, offT: last, first: F.offT }; }
      }
      return null;
    }, [who, opp]);
    if (!f) { console.log(who + ': no seed found'); continue; }
    for (const [tag, at] of [['before', (f.first || f.offT) - 1.5], ['after', f.offT + 2.5]]) {
      const box = await p.evaluate(([who, opp, seed, at]) => {
        const L = window.DamageLab, LU = window.Lineup, VW = window.RobocusView;
        const S = L.create({ a: LU.build(who), b: LU.build(opp), seed, arena: 'open', flyoff: true, countdown: 0 });
        while (S.t < at && !S.over) { L.step(S); S.fx.length = 0; }
        VW.play(S, { title: who + ' vs ' + opp + ' · seed ' + seed + ' · t ' + S.t.toFixed(1) + ' s' }); document.querySelector('.fv-pause').click();
        const R = S.robots[0], F = R.fo, rp = R.body.getPosition(), pts = [[rp.x, rp.y]].concat(F.pieces.concat((R.records || []).filter(q => q.state === 'floor' && F.off)).map(q => { const v = q.body.getPosition(); return [v.x, v.y]; }).filter(v => Math.hypot(v[0] - rp.x, v[1] - rp.y) < 1.6)); // (T68: and Jukebox's records on the floor; T69: only pieces close by, so the robot fills the picture)
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const span = Math.max(1.8, Math.max(...xs) - Math.min(...xs) + 1.4, Math.max(...ys) - Math.min(...ys) + 1.4);
        const a = VW.clientOf(cx - span / 2, cy - span / 2), c = VW.clientOf(cx + span / 2, cy + span / 2), cvr = document.querySelector('.fv-arena canvas').getBoundingClientRect();
        return { x: Math.min(a[0], c[0]), y: Math.min(a[1], c[1]), w: Math.abs(c[0] - a[0]), h: Math.abs(c[1] - a[1]), cv: { x: cvr.left, y: cvr.top, w: cvr.width, h: cvr.height }, off: F.off, t: S.t };
      }, [who, opp, f.seed, at]);
      await p.waitForTimeout(250); if (process.env.DBG) console.log(JSON.stringify(box));
      const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), cv = box.cv, x = cl(box.x, cv.x, cv.x + cv.w - 50), y = cl(box.y, cv.y, cv.y + cv.h - 50);
      await p.screenshot({ path: `${OUT}/${STEP}-${who.toLowerCase()}-${tag}.png`, clip: { x, y, width: Math.min(box.w, cv.x + cv.w - x), height: Math.min(box.h, cv.y + cv.h - y) } });
      if (tag === 'after') await p.screenshot({ path: `${OUT}/${STEP}-${who.toLowerCase()}-arena.png`, clip: { x: cv.x, y: cv.y, width: cv.w, height: cv.h } });
      console.log(`${who} vs ${opp} seed ${f.seed}: ${tag} at ${box.t.toFixed(1)} s (came off at ${f.offT.toFixed(1)} s, off now: ${box.off})`);
    }
    await p.evaluate(() => window.RobocusView.close());
    await p.selectOption('#who', who); await p.waitForTimeout(200);
    const pics = await p.$('.pics'); await pics.screenshot({ path: `${OUT}/${STEP}-${who.toLowerCase()}-portraits.png` });
  }
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : '0 page errors');
  await b.close();
})();
