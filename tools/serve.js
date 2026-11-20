#!/usr/bin/env node
// ROBOCUS: a small web server for this folder, for this PC only (Kev, 20 Nov 2026, TASKS.md T32).
// Why: a game opened as a file (file://...) can't start background helpers (web workers), so the fight bookie and the
// odds overview run their test fights on the page itself: slow, and four-robot fights fall back to the formula.
// From a web address the helpers run on all cores but two. play-latest.cmd starts this script.
//
//   node tools/serve.js                         serve the repo folder at http://127.0.0.1:8765/ (or the next free port)
//   node tools/serve.js --open                  ... and open the game (prototypes/tabletop-2.html) in the default browser
//   node tools/serve.js --open=rules.html       ... and open that page instead
//   node tools/serve.js --port=9000             start looking for a free port at 9000 (default 8765, tries 20 ports)
//   node tools/serve.js --check                 only say whether a ROBOCUS server already runs (exit 0 yes, 1 no)
//
// Safety: listens on 127.0.0.1 only (no other PC can reach it, so Windows Firewall has nothing to ask), read-only (GET and
// HEAD only), serves files under the repo folder only (no "..", no hidden files or folders such as .git, no links that
// lead outside), answers only requests addressed to 127.0.0.1 or localhost (a web page elsewhere can't use it through a
// renamed address), no folder listings. Every answer says "Cache-Control: no-cache", so the browser asks again each time
// and the files stamp (tools/stamp.py) keeps working.
// Already running for this folder (a second double-click): it does not start a second server, it only opens the game.
// No dependencies; works on old Node versions too (no syntax newer than Node 10).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = fs.realpathSync(path.join(__dirname, '..'));
const HOST = '127.0.0.1';
const arg = (k, d) => { const a = process.argv.find(x => x === '--' + k || x.indexOf('--' + k + '=') === 0); return a == null ? d : a.indexOf('=') < 0 ? true : a.slice(a.indexOf('=') + 1); };
const FIRST = +arg('port', 8765) || 8765, TRIES = 20;
const OPEN = arg('open', false), PAGE = OPEN === true ? 'prototypes/tabletop-2.html' : OPEN || '';
const QUIET = !!arg('quiet', false);
const ID = 'robocus-serve 1';   // what /__robocus answers, so a second start knows this is ours (tools/serve.py answers the same)

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json'
};

function send(res, code, text, extra) {
  const body = Buffer.from(text + '\n');
  res.writeHead(code, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }, extra || {}));
  res.end(res.req.method === 'HEAD' ? undefined : body);
}

function handle(req, res, port) {
  res.req = req;
  // only requests addressed to this PC by name or number (guards against a web page that points its own name at 127.0.0.1)
  const host = String(req.headers.host || '').toLowerCase();
  if (host !== HOST + ':' + port && host !== 'localhost:' + port) return send(res, 403, 'Forbidden: this server only answers http://' + HOST + ':' + port + '/');
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Only GET and HEAD', { Allow: 'GET, HEAD' });
  let rel;
  try { rel = decodeURIComponent(String(req.url).split('?')[0].split('#')[0]); } catch (e) { return send(res, 400, 'Bad address'); }
  if (rel === '/__robocus') return send(res, 200, JSON.stringify({ id: ID, root: ROOT, pid: process.pid }), { 'Content-Type': 'application/json; charset=utf-8' });
  if (rel === '/' || rel === '') { res.writeHead(302, { Location: '/prototypes/tabletop-2.html', 'Cache-Control': 'no-cache', 'Content-Length': 0 }); return res.end(); }
  const parts = rel.split(/[\\/]+/).filter(Boolean);
  if (rel.indexOf('\0') >= 0 || parts.some(p => p === '..' || p.charAt(0) === '.' || /:/.test(p))) return send(res, 403, 'Forbidden');
  let file = path.join(ROOT, parts.join(path.sep));
  fs.realpath(file, (err, real) => {
    if (err) return send(res, 404, 'Not found: ' + rel);
    if (real !== ROOT && real.indexOf(ROOT + path.sep) !== 0) return send(res, 403, 'Forbidden');   // a link that leads outside the folder
    fs.stat(real, (err2, st) => {
      if (err2) return send(res, 404, 'Not found: ' + rel);
      if (st.isDirectory()) {   // no listings: a folder's index.html, else 404
        if (!/\/$/.test(rel)) { res.writeHead(301, { Location: encodeURI(rel) + '/', 'Content-Length': 0 }); return res.end(); }
        const idx = path.join(real, 'index.html');
        return fs.stat(idx, (e3, s3) => e3 || !s3.isFile() ? send(res, 404, 'Not found: ' + rel) : stream(req, res, idx, s3));
      }
      if (!st.isFile()) return send(res, 404, 'Not found: ' + rel);
      stream(req, res, real, st);
    });
  });
}

function stream(req, res, file, st) {
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': st.size, 'Last-Modified': st.mtime.toUTCString(),
    'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff'
  });
  if (req.method === 'HEAD') return res.end();
  const s = fs.createReadStream(file);
  s.on('error', () => res.destroy());
  s.pipe(res);
}

// is one of our servers already answering on this port? -> its root folder, or null
function probe(port) {
  return new Promise(resolve => {
    const r = http.get({ host: HOST, port, path: '/__robocus', timeout: 1500, headers: { Host: HOST + ':' + port } }, res => {
      let b = ''; res.setEncoding('utf8'); res.on('data', d => { b += d; });
      res.on('end', () => { try { const j = JSON.parse(b); resolve(j && j.id && /^robocus-serve/.test(j.id) ? j : null); } catch (e) { resolve(null); } });
    });
    r.on('timeout', () => { r.destroy(); resolve(null); });
    r.on('error', () => resolve(null));
  });
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((q, s) => { try { handle(q, s, port); } catch (e) { try { send(s, 500, 'Server error'); } catch (x) {} } });
    srv.once('error', reject);
    srv.listen(port, HOST, () => resolve(srv));
  });
}

function openBrowser(url) {
  if (process.env.ROBOCUS_NO_BROWSER) { console.log('(not opening a browser: ROBOCUS_NO_BROWSER is set) ' + url); return; }
  try {
    let c;
    if (process.platform === 'win32') c = cp.spawn('cmd.exe', ['/d', '/s', '/c', 'start "" "' + url.replace(/&/g, '^&') + '"'], { windowsVerbatimArguments: true, stdio: 'ignore', detached: true });
    else if (process.platform === 'darwin') c = cp.spawn('open', [url], { stdio: 'ignore', detached: true });
    else c = cp.spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
    c.on('error', () => console.log('Could not open the browser by itself. Open this address: ' + url));
    c.unref();
  } catch (e) { console.log('Could not open the browser by itself. Open this address: ' + url); }
}

(async function main() {
  const same = j => j && path.resolve(j.root) === ROOT;
  for (let port = FIRST; port < FIRST + TRIES; port++) {
    const j = await probe(port);
    if (same(j)) {   // already running for this folder: reuse it
      const url = 'http://' + HOST + ':' + port + '/' + PAGE;
      if (arg('check', false)) { console.log(url); process.exit(0); }
      console.log('The game server is already running in another window (' + HOST + ':' + port + '). Opening the game there.');
      if (PAGE) openBrowser(url);
      return process.exit(0);
    }
    if (j) continue;   // a ROBOCUS server for another folder: leave it alone
    if (arg('check', false)) continue;
    let srv;
    try { srv = await listen(port); } catch (e) { if (e.code === 'EADDRINUSE' || e.code === 'EACCES') continue; throw e; }
    const url = 'http://' + HOST + ':' + port + '/' + PAGE;
    console.log('');
    console.log('ROBOCUS game server: http://' + HOST + ':' + port + '/  (this PC only; folder ' + ROOT + ')');
    if (port !== FIRST) console.log('Port ' + FIRST + ' was busy, so this is ' + port + '. Saved settings and logs in the browser belong to one port: the next time it is ' + FIRST + ' again if that is free.');
    console.log('Leave this window open while you play. Close it when you are done.');
    if (PAGE) { console.log('Opening ' + url); openBrowser(url); }
    if (!QUIET) srv.on('request', (q) => { if (q.method !== 'GET' && q.method !== 'HEAD') console.log(q.method + ' ' + q.url + ' refused'); });
    const stop = () => { srv.close(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop); process.on('SIGHUP', stop);
    return;
  }
  if (arg('check', false)) { console.log('no ROBOCUS server running'); process.exit(1); }
  console.log('No free port between ' + FIRST + ' and ' + (FIRST + TRIES - 1) + '.');
  process.exit(3);
})().catch(e => { console.log('Could not start the game server: ' + (e && e.message || e)); process.exit(2); });
