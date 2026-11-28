// T67 parts that fly off: screenshots of each robot with a breakaway piece, just before and a few seconds after it comes off,
// in the game's fight view (src2/view.js), from prototypes/flyoff-lab.html. Also the two portraits (as it comes / without the piece).
//   node tools/flyoff-shots.js [outDir=/home/claude/out]     -> t67-<robot>-before.png, -after.png, -arena.png, -portraits.png
const { chromium } = require('playwright'), path = require('path');
const PLK = require('./planck-local.js'), PL = PLK.find('');
const OUT = process.argv[2] || '/home/claude/out';
const PICK = { Buzzkill: 'Mauler', Popcorn: 'Thwacker', Bricklayer: 'Gyro' };
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 2 }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await PLK.route(p, PL);
  await p.goto('file://' + path.resolve(__dirname, '../prototypes/flyoff-lab.html')); await p.waitForTimeout(300);
  for (const [who, opp] of Object.entries(PICK)) {
    // a seed where the piece comes off between 8 and 70 s and both robots are still going 3 s later
    const f = await p.evaluate(([who, opp]) => {
      const L = window.DamageLab, LU = window.Lineup;
      for (let seed = 1; seed < 200; seed++) {
        const S = L.run({ a: LU.build(who), b: LU.build(opp), seed, arena: 'open', flyoff: true }), F = S.robots[0].fo;
        if (F.off && F.offT > 8 && F.offT < 70 && S.t > F.offT + 4) return { seed, offT: F.offT };
      }
      return null;
    }, [who, opp]);
    if (!f) { console.log(who + ': no seed found'); continue; }
    for (const [tag, at] of [['before', f.offT - 1.5], ['after', f.offT + 2.5]]) {
      const box = await p.evaluate(([who, opp, seed, at]) => {
        const L = window.DamageLab, LU = window.Lineup, VW = window.RobocusView;
        const S = L.create({ a: LU.build(who), b: LU.build(opp), seed, arena: 'open', flyoff: true, countdown: 0 });
        while (S.t < at && !S.over) { L.step(S); S.fx.length = 0; }
        VW.play(S, { title: who + ' vs ' + opp + ' · seed ' + seed + ' · t ' + S.t.toFixed(1) + ' s' }); document.querySelector('.fv-pause').click();
        const R = S.robots[0], F = R.fo, rp = R.body.getPosition(), pts = [[rp.x, rp.y]].concat(F.pieces.map(q => { const v = q.body.getPosition(); return [v.x, v.y]; }));
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const span = Math.max(2.4, Math.max(...xs) - Math.min(...xs) + 1.4, Math.max(...ys) - Math.min(...ys) + 1.4);
        const a = VW.clientOf(cx - span / 2, cy - span / 2), c = VW.clientOf(cx + span / 2, cy + span / 2), cvr = document.querySelector('.fv-arena canvas').getBoundingClientRect();
        return { x: Math.min(a[0], c[0]), y: Math.min(a[1], c[1]), w: Math.abs(c[0] - a[0]), h: Math.abs(c[1] - a[1]), cv: { x: cvr.left, y: cvr.top, w: cvr.width, h: cvr.height }, off: F.off, t: S.t };
      }, [who, opp, f.seed, at]);
      await p.waitForTimeout(250); if (process.env.DBG) console.log(JSON.stringify(box));
      const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), cv = box.cv, x = cl(box.x, cv.x, cv.x + cv.w - 50), y = cl(box.y, cv.y, cv.y + cv.h - 50);
      await p.screenshot({ path: `${OUT}/t67-${who.toLowerCase()}-${tag}.png`, clip: { x, y, width: Math.min(box.w, cv.x + cv.w - x), height: Math.min(box.h, cv.y + cv.h - y) } });
      if (tag === 'after') await p.screenshot({ path: `${OUT}/t67-${who.toLowerCase()}-arena.png`, clip: { x: cv.x, y: cv.y, width: cv.w, height: cv.h } });
      console.log(`${who} vs ${opp} seed ${f.seed}: ${tag} at ${box.t.toFixed(1)} s (came off at ${f.offT.toFixed(1)} s, off now: ${box.off})`);
    }
    await p.evaluate(() => window.RobocusView.close());
    await p.selectOption('#who', who); await p.waitForTimeout(200);
    const pics = await p.$('.pics'); await pics.screenshot({ path: `${OUT}/t67-${who.toLowerCase()}-portraits.png` });
  }
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : '0 page errors');
  await b.close();
})();
