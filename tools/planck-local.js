// A local planck.js for the test tools (16 Nov). The 2.0 pages load planck from cdn.jsdelivr.net (then unpkg, then
// ../vendor/); on a PC or sandbox that can't reach the CDN the tools serve a local copy of the same version instead.
// Where it looks, in this order:
//   1. what you name: --planck=<file> (tools with -- options) or the env PLANCK=<file>; --planck=cdn / PLANCK=cdn: always the network
//   2. node_modules/planck/dist/planck.min.js   (npm install --no-package-lock; package.json lists planck 1.4.3)
//   3. vendor/planck-1.4.3.min.js                (not in git)
// Use:
//   const PL = require('./planck-local.js').find(optionValue);   // { body, source }  (body null = the network)
//   await require('./planck-local.js').route(contextOrPage, PL); // every page of that context gets the local copy
//   await require('./planck-local.js').check(page, PL);          // throws a clear error if a 2.0 page has no planck
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const RE = /planck(\.min)?\.js(\?|$)/;

exports.find = (opt) => {
  const want = opt || process.env.PLANCK || '';
  if (want === 'cdn') return { body: null, source: 'cdn (forced)' };
  const list = [want, path.join(ROOT, 'node_modules/planck/dist/planck.min.js'), path.join(ROOT, 'vendor/planck-1.4.3.min.js')];
  for (const f of list) if (f && fs.existsSync(f)) return { body: fs.readFileSync(f), source: path.relative(process.cwd(), f) || f };
  if (want) { console.log('planck: ' + want + ' does not exist'); process.exit(2); }
  return { body: null, source: 'cdn (no local copy)' };
};

// a BrowserContext or a Page: requests for planck(.min).js on any address get the local file
exports.route = async (target, PL) => {
  if (!PL || !PL.body) return;
  await target.route(u => /^https?:/.test(String(u)) && RE.test(String(u)), r => r.fulfill({ contentType: 'application/javascript', body: PL.body }));
};

// after page.goto: a page that loads planck (the 2.0 game, the labs) must have it, else a clear message
exports.check = async (page, PL) => {
  const s = await page.evaluate(() => ({ wants: [...document.scripts].some(x => /planck/.test(x.src)), has: !!window.planck }));
  if (s.wants && !s.has) throw new Error('planck.js did not load (' + (PL ? PL.source : '?') + '). Offline? Run: npm install --no-package-lock'
    + '  (or name a file: PLANCK=<path>/planck.min.js / --planck=<file>)');
  return s.wants;
};
