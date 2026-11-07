/* ROBOCUS online play (Kev, 7 Nov; plan in docs/multiplayer-plan.md).
 * The host's browser runs the game; the other players' browsers are screens: they get a filtered snapshot of the
 * game, the log and the board moments, run the same fights from the seed, and send their clicks back as actions.
 * Two transports with the same messages:
 *   peer  : WebRTC through PeerJS (free public broker), for friends online. Needs internet.
 *   local : BroadcastChannel, for tabs in one browser (testing on one PC, headless bot games). No internet.
 * URL: tabletop-prototype.html?room=ABCDE            join room ABCDE (online)
 *      …?room=ABCDE&net=local                       same, between tabs of this browser
 *      …?room=ABCDE&host=1                          host that room (the 🌐 button does this for you)
 *      test options: &name=Ann  &bot=1 (plays itself)  &autostart=N (host starts when N players are ready)  &seed=N
 * Talks to the game through window.ROBOCUS_GAME (prototypes/tabletop-prototype.html). */
(function () {
  'use strict';
  const PEERJS = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const ID_PREFIX = 'robocus-v1-';
  const qs = new URLSearchParams(location.search);
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const GAME = () => window.ROBOCUS_GAME;
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const ssGet = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  const rid = n => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const myCid = ssGet('robocus.cid') || (() => { const c = rid(10); ssSet('robocus.cid', c); return c; })();

  /* ---------------- transports: send(to, data) / onmsg(from, data) / onlink(id, up) ---------------- */
  function localTransport(room, isHost) {
    const id = isHost ? 'host' : 'c-' + myCid;
    const ch = new BroadcastChannel('robocus-net-' + room);
    const T = { id, onmsg: null, onlink: null, ready: Promise.resolve() };
    ch.onmessage = e => { const m = e.data; if (!m || m.from === id || (m.to && m.to !== id)) return; if (T.onmsg) T.onmsg(m.from, m.d); };
    T.send = (to, d) => ch.postMessage({ from: id, to, d });
    T.close = () => ch.close();
    return T;
  }
  let peerLib = null;
  function loadPeerJs() {
    if (window.Peer) return Promise.resolve(window.Peer);
    if (peerLib) return peerLib;
    peerLib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = PEERJS; s.onload = () => res(window.Peer); s.onerror = () => rej(new Error('could not load PeerJS (no internet?)')); document.head.appendChild(s); });
    return peerLib;
  }
  // ICE servers: Google STUN by default; a relay (TURN) from src/net-config.js when set up (see README "Online play")
  let iceCache = null;
  function iceServers() {
    if (iceCache) return iceCache;
    const C = window.ROBOCUS_NET_CONFIG || {};
    const stun = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }];
    iceCache = (C.metered && C.metered.app && C.metered.apiKey
      ? fetch('https://' + C.metered.app + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(C.metered.apiKey)).then(r => r.ok ? r.json() : []).catch(() => [])
      : Promise.resolve([])).then(extra => stun.concat(Array.isArray(extra) ? extra : [], C.iceServers || []));
    return iceCache;
  }
  const hasRelay = list => list.some(x => /^turns?:/.test([].concat(x.urls || [])[0] || ''));
  function peerTransport(room, isHost) {
    const T = { id: isHost ? 'host' : null, onmsg: null, onlink: null, onstage: null };
    const stage = t => { T.stageText = t; if (T.onstage) T.onstage(t); };
    const conns = {};
    const wire = (c, from) => {
      conns[from] = c;
      c.on('data', d => { if (T.onmsg) T.onmsg(from, d); });
      c.on('close', () => { if (conns[from] === c) delete conns[from]; if (T.onlink) T.onlink(from, false); });
      c.on('error', () => {});
    };
    stage('loading the network library');
    T.ready = loadPeerJs().then(Peer => iceServers().then(list => new Promise((res, rej) => {
      T.relay = hasRelay(list);
      stage('reaching the matchmaking server');
      const opts = { config: { iceServers: list } };
      const peer = isHost ? new Peer(ID_PREFIX + room.toLowerCase(), opts) : new Peer(opts);
      T.peer = peer;
      peer.on('error', e => { if (T.onerror) T.onerror(e); rej(e); });
      peer.on('open', pid => {
        if (isHost) { peer.on('connection', c => c.on('open', () => wire(c, c.peer))); res(); }
        else {
          T.id = pid;
          let busy = null;
          T.connect = () => busy || (busy = new Promise((ok, no) => {
            if (peer.disconnected) { try { peer.reconnect(); } catch (e) {} }
            stage('opening a link to the host' + (T.relay ? ' (relay on)' : ''));
            const c = peer.connect(ID_PREFIX + room.toLowerCase(), { reliable: true });
            const fail = why => { clearTimeout(tm); busy = null; try { c.close(); } catch (e) {} const err = new Error(why); err.type = 'ice'; no(err); };
            const tm = setTimeout(() => fail('no direct link to the host after 15 s'), 15000);
            const watch = setInterval(() => { const pc = c.peerConnection; if (pc && (pc.iceConnectionState === 'failed' || pc.connectionState === 'failed')) { clearInterval(watch); fail('the direct link to the host failed'); } }, 500);
            c.on('open', () => { clearTimeout(tm); clearInterval(watch); busy = null; wire(c, 'host'); ok(); });
          }));
          T.connect().then(res, rej);   // a first link that fails must end "Connecting…" with a message, not hang
        }
      });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
    })));
    T.send = (to, d) => { if (to) { const c = conns[to]; if (c && c.open) c.send(d); } else Object.values(conns).forEach(c => { if (c.open) c.send(d); }); };
    T.close = () => { try { T.peer.destroy(); } catch (e) {} };
    return T;
  }

  /* ---------------- shared UI bits ---------------- */
  const css = document.createElement('style');
  css.textContent = `
  #netLobby{position:fixed;inset:0;background:rgba(20,18,14,.55);display:flex;align-items:center;justify-content:center;z-index:9000;font:13px system-ui,sans-serif}
  #netLobby .nl-box{background:#fcfbf9;border:2.5px solid #111;border-radius:10px;padding:16px 18px;width:min(520px,94vw);max-height:92vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.35)}
  #netLobby h3{margin:0 0 8px;font-size:17px}
  #netLobby .nl-row{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap}
  #netLobby input[type=text]{font:14px system-ui;padding:5px 8px;border:1.5px solid #222;border-radius:5px;width:180px}
  #netLobby button{font:700 13px system-ui;padding:6px 12px;border:1.5px solid #111;border-radius:6px;background:#111;color:#fff;cursor:pointer}
  #netLobby button.sec{background:#fff;color:#111}
  #netLobby button:disabled{opacity:.4;cursor:default}
  #netLobby .nl-seats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  #netLobby .nl-seat{border:2px solid #ccc;border-radius:8px;padding:8px;cursor:pointer;background:#fff;min-height:44px}
  #netLobby .nl-seat.mine{box-shadow:0 0 0 3px #111 inset}
  #netLobby .nl-seat .nm{font-weight:800}
  #netLobby .nl-note{color:#666;font-size:12px}
  #netLobby .nl-code{font:900 22px ui-monospace,monospace;letter-spacing:3px}
  #netBadge{font:700 12px system-ui;margin-left:8px;padding:2px 8px;border:1.5px solid #111;border-radius:12px;background:#fff;cursor:pointer;white-space:nowrap}
  #netWait{position:fixed;right:12px;bottom:12px;z-index:8000;background:#fff;border:2px solid #111;border-radius:8px;padding:6px 10px;font:12px system-ui;max-width:360px;box-shadow:0 4px 14px rgba(0,0,0,.2)}
  #netWait button{font:700 11px system-ui;margin-left:4px;padding:2px 6px;border:1.2px solid #111;border-radius:5px;background:#fff;cursor:pointer}
  #netPause{position:fixed;inset:0;background:rgba(20,18,14,.45);z-index:8500;display:flex;align-items:center;justify-content:center;font:14px system-ui}
  #netPause .np-box{background:#fff;border:2.5px solid #111;border-radius:10px;padding:16px 20px;max-width:440px;text-align:center}
  #netPause button{font:700 12px system-ui;margin:6px 4px 0;padding:5px 10px;border:1.5px solid #111;border-radius:6px;background:#fff;cursor:pointer}
  #netToast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:9500;background:#b45309;color:#fff;font:800 15px system-ui;padding:10px 18px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.3)}
  `;
  document.head.appendChild(css);
  function toast(html, ms) {
    let el = $('#netToast'); if (!el) { el = document.createElement('div'); el.id = 'netToast'; document.body.appendChild(el); }
    el.innerHTML = html; el.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => { el.hidden = true; }, ms || 4000);
  }
  function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start(); setTimeout(() => { o.stop(); a.close(); }, 220); } catch (e) {} }
  function lobbyEl() { let el = $('#netLobby'); if (!el) { el = document.createElement('div'); el.id = 'netLobby'; document.body.appendChild(el); } el.hidden = false; return el; }
  function closeLobby() { const el = $('#netLobby'); if (el) el.hidden = true; }
  function badge(text, onclick) {
    let b = $('#netBadge');
    if (!b) { b = document.createElement('span'); b.id = 'netBadge'; const bar = $('#seatSel') ? $('#seatSel').parentNode : document.body; bar.appendChild(b); }
    b.innerHTML = text; b.onclick = onclick || null;
  }
  const TEAMS = () => (GAME() ? GAME().TEAMS : [{ name: 'Steel', col: '#3F78A8' }, { name: 'Rust', col: '#C8642B' }, { name: 'Moss', col: '#5E8A3A' }, { name: 'Plum', col: '#86528F' }]);
  const linkFor = (room, local) => location.href.split('?')[0] + '?room=' + room + (local ? '&net=local' : '');

  /* ================================ HOST ================================ */
  function startHosting(room, mode) {
    const T = mode === 'local' ? localTransport(room, true) : peerTransport(room, true);
    const H = {
      room, mode, T, started: false, players: [], startFame: 4, save: null, qid: 0, pending: {},
      me: { name: qs.get('name') || lsGet('robocus.name') || 'Host', seat: 0 }
    };
    window.ROBOCUS_HOST = H;
    const seatTaken = s => s === H.me.seat || H.players.some(p => p.seat === s);
    const freeSeat = () => [0, 1, 2, 3].find(s => !seatTaken(s));
    const pBySeat = s => H.players.find(p => p.seat === s);
    const pByFrom = from => H.players.find(p => p.from === from);
    const send = (p, d) => { if (p && p.from && p.connected) T.send(p.from, d); };
    const lobbyState = () => ({ room, started: H.started, startFame: H.startFame, save: H.save ? { round: H.save.G.round, names: H.save.G.teams.map(t => t.player || null) } : null,
      seats: [0, 1, 2, 3].map(s => s === H.me.seat ? { name: H.me.name, host: true, ready: true, connected: true } : (p => p ? { name: p.name, ready: p.ready, connected: p.connected } : null)(pBySeat(s))) });
    const pushLobby = () => { const st = lobbyState(); H.players.forEach(p => send(p, { t: 'lobby', st, you: p.seat })); if (!H.started) drawHostLobby(); };

    T.onmsg = (from, d) => {
      if (!d || !d.t) return;
      let p = pByFrom(from);
      if (d.t === 'hello') {
        const name = String(d.name || 'Player').slice(0, 20);
        p = H.players.find(x => x.cid === d.cid) || H.players.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!p) {
          if (H.started) { T.send(from, { t: 'full', why: 'The game has started. To rejoin, use the same name as before.' }); return; }
          const savedSeat = H.save ? H.save.G.teams.findIndex(t => t.player && t.player.toLowerCase() === name.toLowerCase()) : -1;
          const seat = savedSeat >= 0 && !seatTaken(savedSeat) ? savedSeat : freeSeat();
          if (seat == null) { T.send(from, { t: 'full', why: 'The room is full (4 seats).' }); return; }
          p = { cid: d.cid, name, seat, ready: false };
          H.players.push(p);
        }
        p.from = from; p.cid = d.cid; p.name = name; p.connected = true; p.seen = Date.now(); p.gone = false;
        send(p, { t: 'welcome', seat: p.seat, room, started: H.started });
        if (H.started) { resync(p); GAME().notify('🔌 <b>' + esc(p.name) + '</b> is back.', '#111'); updatePause(); }
        pushLobby(); return;
      }
      if (!p || p.gone) return;   // after a "bye", only a new hello counts (a closing tab can still send a message or two)
      p.seen = Date.now();
      if (!p.connected) { p.connected = true; if (H.started) { resync(p); updatePause(); } }
      if (d.t === 'hb') return;
      if (d.t === 'bye') { p.connected = false; p.gone = true; if (H.started) updatePause(); pushLobby(); return; }
      if (!H.started) {
        if (d.t === 'seat' && d.seat >= 0 && d.seat < 4 && !seatTaken(d.seat)) { p.seat = d.seat; p.ready = false; }
        if (d.t === 'ready') p.ready = !!d.on;
        if (d.t === 'name') p.name = String(d.name || p.name).slice(0, 20);
        pushLobby(); maybeAutostart(); return;
      }
      if (d.t === 'act') { if (GAME().SEATS && GAME().SEATS[p.seat] === 'remote') GAME().runAct(p.seat, d.name, d.args || []); return; }
      if (d.t === 'ans' || d.t === 'dealans') {
        const q = H.pending[d.q]; if (!q || q.seat !== p.seat) return;
        delete H.pending[d.q]; q.resolve(d.t === 'ans' ? { k: d.k, inputs: d.inputs } : d.st || null); return;
      }
    };
    T.onlink = (from, up) => { const p = pByFrom(from); if (p && !up) { p.connected = false; if (H.started) updatePause(); pushLobby(); } };

    // the game calls these (window.ROBOCUS_NET on the host)
    window.ROBOCUS_NET = {
      ask(seat, payload) { return new Promise(resolve => { const q = ++H.qid; H.pending[q] = { seat, resolve, kind: 'ask', payload }; send(pBySeat(seat), { t: 'ask', q, ...payload }); }); },
      deal(seat, opts) { return new Promise(resolve => { const q = ++H.qid; H.pending[q] = { seat, resolve, kind: 'deal', payload: opts }; send(pBySeat(seat), { t: 'deal', q, opts }); }); },
      cancelSeat(seat) { for (const q of Object.keys(H.pending)) { const x = H.pending[q]; if (x.seat !== seat) continue; delete H.pending[q]; send(pBySeat(seat), { t: 'cancel', q: +q }); x.resolve(x.kind === 'ask' ? { k: -1 } : null); } },
      fx(o) { const c = Object.assign({}, o); delete c.t0; H.players.forEach(p => send(p, { t: 'fx', o: c })); },
      sendAct() {},
      rematch() { GAME().rematch(); H.players.forEach(resync); }
    };
    function resync(p) {   // a player (re)joins a running game: whole log, fresh snapshot, its open questions again
      p.lastSnap = null; p.logN = 0;
      const L = GAME().logFrom(0); send(p, { t: 'log', base: L.base, ops: L.ops, end: L.end, full: true }); p.logN = L.end;
      flush(p);
      for (const q of Object.keys(H.pending)) { const x = H.pending[q]; if (x.seat === p.seat) send(p, x.kind === 'ask' ? { t: 'ask', q: +q, ...x.payload } : { t: 'deal', q: +q, opts: x.payload }); }
    }
    function flush(p) {
      const G = GAME(); if (!G.G || !p.connected) return;
      const L = G.logFrom(p.logN || 0);
      if (L.ops.length) { send(p, { t: 'log', base: L.base, ops: L.ops, end: L.end }); p.logN = L.end; }
      const g = G.snapFor(p.seat), meta = G.snapMeta(p.seat), key = g + JSON.stringify(meta.paused) + (meta.names || []).join('|');
      if (key !== p.lastSnap) { p.lastSnap = key; send(p, { t: 'snap', g, meta }); }
    }
    function updatePause() {
      const away = H.players.filter(p => !p.connected && GAME().SEATS && GAME().SEATS[p.seat] === 'remote').map(p => ({ seat: p.seat, name: p.name }));
      GAME().setPaused(away);
      let el = $('#netPause');
      if (!away.length) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'netPause'; document.body.appendChild(el); }
      el.innerHTML = '<div class="np-box"><b>⏸ Game paused</b><br>Waiting for ' + away.map(a => '<b>' + esc(a.name) + '</b>').join(', ') + ' to reconnect (same link, same name).<br>' +
        away.map(a => '<button data-ai="' + a.seat + '">🤖 Let the AI play ' + esc(a.name) + '</button>').join('') + '</div>';
      el.querySelectorAll('[data-ai]').forEach(b => { b.onclick = () => { const s = +b.dataset.ai; H.players = H.players.filter(p => p.seat !== s); GAME().seatToAI(s); updatePause(); }; });
    }
    // heartbeats, snapshots, the fight clock, the "waiting for" banner
    setInterval(() => {
      const now = Date.now();
      H.players.forEach(p => { if (p.connected && now - (p.seen || 0) > 6000) { p.connected = false; if (H.started) updatePause(); pushLobby(); } });
      T.send(null, { t: 'hb' });
    }, 1000);
    setInterval(() => { if (H.started) H.players.forEach(flush); }, 100);
    setInterval(() => { if (!H.started) return; const ft = GAME().fightTick(); if (ft) H.players.forEach(p => send(p, { t: 'tick', ...ft })); }, 250);
    const busySince = {};
    setInterval(() => {
      if (!H.started) return;
      let el = $('#netWait');
      const rows = H.players.filter(p => p.connected).map(p => { const w = GAME().seatBusyWith(p.seat); if (!w) { delete busySince[p.seat]; return null; } busySince[p.seat] = busySince[p.seat] || Date.now(); return Date.now() - busySince[p.seat] > 8000 ? { p, w } : null; }).filter(Boolean);
      if (!rows.length) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'netWait'; document.body.appendChild(el); }
      const html = '⏳ ' + rows.map(r => '<div><b>' + esc(r.p.name) + '</b>: ' + esc(r.w) + '<button data-n="' + r.p.seat + '">🔔 Nudge</button><button data-s="' + r.p.seat + '">⏭ Skip</button></div>').join('');
      if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html;
        el.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { send(pBySeat(+b.dataset.n), { t: 'nudge' }); toast('🔔 Nudged ' + esc(pBySeat(+b.dataset.n).name), 1500); }; });
        el.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { const s = +b.dataset.s; GAME().skipSeat(s); delete busySince[s]; }; }); }
    }, 1000);

    function start() {
      if (H.started) return;
      H.started = true;
      const seats = [0, 1, 2, 3].map(s => s === H.me.seat ? 'local' : pBySeat(s) ? 'remote' : 'ai');
      const names = [0, 1, 2, 3].map(s => s === H.me.seat ? H.me.name : pBySeat(s) ? pBySeat(s).name : null);
      lsSet('robocus.name', H.me.name);
      GAME().startHost({ seat: H.me.seat, seats, names, startFame: H.startFame, seed: +qs.get('seed') || 0, save: H.save });
      H.players.forEach(p => { p.lastSnap = null; p.logN = 0; send(p, { t: 'start' }); resync(p); });
      closeLobby();
      hostBadge();
    }
    function hostBadge() {
      const n = H.players.filter(p => p.connected).length;
      badge('🌐 ' + room + ' · host · ' + (n + 1) + ' players', hostMenu);
    }
    setInterval(() => { if (H.started) hostBadge(); }, 2000);
    function hostMenu() {
      const el = lobbyEl();
      el.innerHTML = '<div class="nl-box"><h3>🌐 Room <span class="nl-code">' + room + '</span> (you host)</h3>' +
        '<div class="nl-row"><input type="text" readonly value="' + esc(linkFor(room, mode === 'local')) + '" style="width:100%"></div>' +
        H.players.map(p => '<div>' + (p.connected ? '🟢' : '🔴') + ' <b style="color:' + TEAMS()[p.seat].col + '">' + esc(p.name) + '</b></div>').join('') +
        '<div class="nl-row"><button id="nlSave">💾 Save game</button><button class="sec" id="nlClose">Close</button></div>' +
        '<div class="nl-note">The save is taken at the start of each round. Load it from the lobby of a new room (same names = same seats).</div></div>';
      $('#nlSave').onclick = () => GAME().saveFile();
      $('#nlClose').onclick = closeLobby;
    }
    function maybeAutostart() {
      const n = +qs.get('autostart');
      if (n && !H.started && H.players.filter(p => p.connected && p.ready).length >= n) start();
    }
    function drawHostLobby() {
      const el = lobbyEl(), st = lobbyState();
      el.innerHTML = '<div class="nl-box"><h3>🌐 Host a game</h3>' +
        '<div class="nl-row">Room <span class="nl-code">' + room + '</span><button class="sec" id="nlCopy">📋 Copy invite link</button></div>' +
        '<div class="nl-row"><input type="text" readonly id="nlLink" value="' + esc(linkFor(room, mode === 'local')) + '" style="width:100%"></div>' +
        '<div class="nl-note">' + (mode === 'local' ? 'Local test room: open the link in other tabs of this browser.' : 'Send the link to your friends (Discord). They type a name and press Ready. Keep this tab open: your browser runs the game.') + '</div>' +
        '<div class="nl-row">Your name <input type="text" id="nlName" value="' + esc(H.me.name) + '" maxlength="20"></div>' +
        '<div class="nl-note">Click a colour to sit there. Empty seats are played by the AI.</div>' +
        '<div class="nl-seats">' + st.seats.map((x, s) => '<div class="nl-seat' + (s === H.me.seat ? ' mine' : '') + '" data-seat="' + s + '" style="border-color:' + TEAMS()[s].col + '"><div class="nm" style="color:' + TEAMS()[s].col + '">' + esc(TEAMS()[s].name) + '</div>' +
          (x ? esc(x.name) + (x.host ? ' (host)' : '') + ' ' + (x.connected === false ? '🔴 away' : x.ready ? '✅ ready' : '… not ready') : '<span class="nl-note">AI' + (st.save && st.save.names[s] ? ' (saved: ' + esc(st.save.names[s]) + ')' : '') + '</span>') + '</div>').join('') + '</div>' +
        '<div class="nl-row">Start fame <select id="nlFame">' + [7, 4, 2, 1].map(v => '<option value="' + v + '"' + (v === H.startFame ? ' selected' : '') + '>' + v + (v === 4 ? ' (rulebook)' : '') + '</option>').join('') + '</select>' +
          '<label class="sec" style="cursor:pointer">💾 <u>Load saved game</u><input type="file" id="nlLoad" accept=".json" hidden></label>' + (H.save ? '<span class="nl-note">Loaded: round ' + H.save.G.round + '</span>' : '') + '</div>' +
        '<div class="nl-row"><button id="nlStart"' + (H.players.every(p => p.ready || !p.connected) ? '' : ' disabled') + '>▶ Start game</button><button class="sec" id="nlCancel">Play solo instead</button></div>' +
        '<div class="nl-note">' + (H.players.length ? H.players.filter(p => p.connected).length + ' player(s) joined.' : 'Nobody joined yet.') + ' Start is enabled when everyone who joined is ready.</div></div>';
      $('#nlCopy').onclick = () => { const i = $('#nlLink'); i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand('copy'); } toast('📋 Link copied', 1200); };
      $('#nlName').onchange = e => { H.me.name = e.target.value.trim().slice(0, 20) || 'Host'; lsSet('robocus.name', H.me.name); pushLobby(); };
      el.querySelectorAll('[data-seat]').forEach(b => { b.onclick = () => { const s = +b.dataset.seat; if (!seatTaken(s)) { H.me.seat = s; pushLobby(); } }; });
      $('#nlFame').onchange = e => { H.startFame = +e.target.value; pushLobby(); };
      $('#nlLoad').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const o = JSON.parse(t); if (!o.G || !o.G.teams) throw new Error('not a ROBOCUS save'); H.save = o; const hs = o.G.teams.findIndex(x => x.player && x.player.toLowerCase() === H.me.name.toLowerCase()); if (hs >= 0 && !H.players.some(p => p.seat === hs)) H.me.seat = hs; pushLobby(); } catch (err) { toast('⚠️ ' + esc(err.message), 3000); } }); };
      $('#nlStart').onclick = start;
      $('#nlCancel').onclick = () => { location.href = location.href.split('?')[0]; };
    }
    drawHostLobby();
    T.ready.then(() => { drawHostLobby(); maybeAutostart(); }).catch(e => { const el = lobbyEl(); el.innerHTML = '<div class="nl-box"><h3>⚠️ Could not open the room</h3>' + esc(e.message || e.type || e) + '<div class="nl-note">The room code may be in use, or there is no internet. Try another code, or a local test room.</div><div class="nl-row"><button id="nlBack">Back</button></div></div>'; $('#nlBack').onclick = () => { location.href = location.href.split('?')[0]; }; });
    if (T.onerror === undefined) T.onerror = null;
    return H;
  }

  /* ================================ CLIENT ================================ */
  function startJoining(room, mode) {
    const T = mode === 'local' ? localTransport(room, false) : peerTransport(room, false);
    const C = { room, mode, T, seat: null, started: false, name: qs.get('name') || lsGet('robocus.name') || '', ready: false, lastHost: Date.now(), asks: [], deals: [], curAsk: null, curDeal: null, lobby: null, joined: false };
    window.ROBOCUS_CLIENT = C;
    const send = d => T.send('host', d);
    const hello = () => send({ t: 'hello', cid: myCid, name: C.name });
    window.ROBOCUS_NET = {
      sendAct(name, args) { send({ t: 'act', name, args }); },
      ask() { return Promise.resolve({ k: -1 }); }, deal() { return Promise.resolve(null); }, cancelSeat() {}, fx() {}, rematch() {}
    };
    T.onmsg = (from, d) => {
      if (from !== 'host' || !d) return;
      C.lastHost = Date.now();
      if (lost) { lost = false; const el = $('#netPause'); if (el) el.remove(); hello(); }
      switch (d.t) {
        case 'hb': return;
        case 'full': drawJoin(d.why); return;
        case 'welcome': C.seat = d.seat; C.joined = true; GAME().becomeClient(d.seat); if (d.started) { C.started = true; closeLobby(); } else drawClientLobby(); clientBadge(); return;
        case 'lobby': C.lobby = d.st; C.seat = d.you; if (!C.started) drawClientLobby(); return;
        case 'start': C.started = true; closeLobby(); clientBadge(); return;
        case 'snap': if (!C.started) { C.started = true; closeLobby(); } GAME().applySnap(Object.assign({ g: d.g }, d.meta)); drawClientPause(d.meta.paused); return;
        case 'log': GAME().applyLog(d); return;
        case 'fx': GAME().showFx(d.o); return;
        case 'tick': GAME().setTick(d); return;
        case 'ask': C.asks.push(d); pump(); return;
        case 'deal': C.deals.push(d); pump(); return;
        case 'cancel':
          C.asks = C.asks.filter(x => x.q !== d.q); C.deals = C.deals.filter(x => x.q !== d.q);
          if ((C.curAsk && C.curAsk.q === d.q) || (C.curDeal && C.curDeal.q === d.q)) { if (C.curAsk && C.curAsk.q === d.q) C.curAsk.cancelled = true; if (C.curDeal && C.curDeal.q === d.q) C.curDeal.cancelled = true; GAME().closeModals(); }
          return;
        case 'nudge': beep(); toast('🔔 The host is waiting for you!', 3500); return;
      }
    };
    function pump() {   // one question at a time, then one deal panel at a time
      if (!C.curAsk && C.asks.length) {
        const q = C.curAsk = C.asks.shift();
        GAME().showAsk(q).then(a => { if (!q.cancelled) send({ t: 'ans', q: q.q, k: a ? a.k : -1, inputs: a ? a.inputs : null }); C.curAsk = null; pump(); });
      }
      if (!C.curDeal && C.deals.length) {
        const q = C.curDeal = C.deals.shift();
        GAME().showDeal(q.opts).then(st => { if (!q.cancelled) send({ t: 'dealans', q: q.q, st: st || null }); C.curDeal = null; pump(); });
      }
    }
    let lost = false;
    setInterval(() => {
      if (C.joined) send({ t: 'hb' });
      if (C.joined && Date.now() - C.lastHost > 6000 && !lost) {
        lost = true;
        let el = $('#netPause'); if (!el) { el = document.createElement('div'); el.id = 'netPause'; document.body.appendChild(el); }
        el.innerHTML = '<div class="np-box"><b>📡 Lost the host</b><br>Trying to reconnect… If the host closed the game, ask them to open it again.</div>';
      }
      if (lost && T.connect) T.connect().then(hello).catch(() => {});
      else if (lost) hello();
    }, 1000);
    window.addEventListener('beforeunload', () => { try { send({ t: 'bye' }); } catch (e) {} });
    function drawClientPause(paused) {
      let el = $('#netPause');
      if (lost) return;
      if (!paused || !paused.length) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'netPause'; document.body.appendChild(el); }
      el.innerHTML = '<div class="np-box"><b>⏸ Game paused</b><br>Waiting for ' + paused.map(a => '<b>' + esc(a.name) + '</b>').join(', ') + ' to reconnect.</div>';
    }
    function clientBadge() { badge('🌐 ' + room + (C.seat != null ? ' · ' + esc(C.name) : ''), null); }
    function drawJoin(err) {
      const el = lobbyEl();
      el.innerHTML = '<div class="nl-box"><h3>🌐 Join room <span class="nl-code">' + esc(room) + '</span></h3>' + (err ? '<div style="color:#b45309;font-weight:700">' + esc(err) + '</div>' : '') +
        '<div class="nl-row">Your name <input type="text" id="nlName" value="' + esc(C.name) + '" maxlength="20" placeholder="e.g. Kev"><button id="nlJoin">Join</button></div>' +
        '<div class="nl-note">Rejoining a game? Use the same name as before.</div><div class="nl-row"><button class="sec" id="nlSolo">Play solo instead</button></div></div>';
      const go = () => { C.name = $('#nlName').value.trim().slice(0, 20); if (!C.name) return; lsSet('robocus.name', C.name); el.querySelector('.nl-box').insertAdjacentHTML('beforeend', '<div class="nl-note" id="nlStage">Connecting… ' + esc(T.stageText || '') + '</div>');
        T.onstage = t => { const n = $('#nlStage'); if (n) n.textContent = 'Connecting… ' + t; };
        T.ready.then(hello).catch(e => { if (mode !== 'local') { try { T.close(); } catch (x) {} const T2 = peerTransport(room, false); T2.onmsg = (f, d) => T.onmsg(f, d); T2.onstage = t => { T.stageText = t; T.relay = T2.relay; if (T.onstage) T.onstage(t); }; T2.ready.catch(() => {}); Object.assign(T, { ready: T2.ready, send: T2.send, close: T2.close, connect: () => T2.connect ? T2.connect() : Promise.reject(new Error('not connected')) }); }
          const ty = String(e && (e.type || e.message));
          drawJoin(/unavailable|could not connect/i.test(ty) ? 'No game in room ' + room + ' right now. Check the code, or ask the host to open the game first.'
            : e && e.type === 'ice' ? 'Found the game, but ' + e.message + '. Some networks (mobile data, some routers and work Wi-Fi) block direct links between devices' + (T.relay ? ', even with the relay.' : '. A relay server fixes this (ask the host: README, "Online play").') + ' Try again, or try another network.'
            : /network|server-error|socket/i.test(ty) ? 'Could not reach the matchmaking server (' + esc(ty) + '). Check the internet connection.'
            : 'Could not connect: ' + (e.message || e.type || e)); }); };
      $('#nlJoin').onclick = go; $('#nlName').onkeydown = e => { if (e.key === 'Enter') go(); };
      $('#nlSolo').onclick = () => { location.href = location.href.split('?')[0]; };
      if (C.name && qs.get('name') && !err && !C.autoTried) { C.autoTried = true; go(); }   // only once: a failed join must not retry in a loop
    }
    function drawClientLobby() {
      const st = C.lobby; if (!st) return;
      const el = lobbyEl(), me = st.seats[C.seat] || {};
      C.ready = !!me.ready;
      el.innerHTML = '<div class="nl-box"><h3>🌐 Room <span class="nl-code">' + esc(room) + '</span></h3>' +
        '<div class="nl-row">Your name <input type="text" id="nlName" value="' + esc(C.name) + '" maxlength="20"></div>' +
        '<div class="nl-note">Click a free colour to sit there.</div>' +
        '<div class="nl-seats">' + st.seats.map((x, s) => '<div class="nl-seat' + (s === C.seat ? ' mine' : '') + '" data-seat="' + s + '" style="border-color:' + TEAMS()[s].col + '"><div class="nm" style="color:' + TEAMS()[s].col + '">' + esc(TEAMS()[s].name) + '</div>' +
          (x ? esc(x.name) + (x.host ? ' (host)' : '') + ' ' + (x.ready ? '✅' : '…') : '<span class="nl-note">AI' + (st.save && st.save.names[s] ? ' (saved: ' + esc(st.save.names[s]) + ')' : '') + '</span>') + '</div>').join('') + '</div>' +
        '<div class="nl-row">Start fame: <b>' + st.startFame + '</b>' + (st.save ? ' · <b>saved game, round ' + st.save.round + '</b>' : '') + '</div>' +
        '<div class="nl-row"><button id="nlReady">' + (C.ready ? '✅ Ready (click to undo)' : 'I\'m ready') + '</button></div><div class="nl-note">The host starts the game when everyone is ready.</div></div>';
      $('#nlName').onchange = e => { C.name = e.target.value.trim().slice(0, 20) || C.name; lsSet('robocus.name', C.name); send({ t: 'name', name: C.name }); };
      el.querySelectorAll('[data-seat]').forEach(b => { b.onclick = () => send({ t: 'seat', seat: +b.dataset.seat }); });
      $('#nlReady').onclick = () => send({ t: 'ready', on: !C.ready });
      if (GAME().BOT && !C.ready && !C.botReady) { C.botReady = true; send({ t: 'ready', on: true }); }
    }
    drawJoin();
    return C;
  }

  /* ---------------- the 🌐 button (solo screen) ---------------- */
  function openOnlineMenu() {
    const el = lobbyEl();
    el.innerHTML = '<div class="nl-box"><h3>🌐 Play online</h3>' +
      '<div class="nl-row"><button id="nlHost">👑 Host a game</button><span class="nl-note">You get a link for your friends. Your browser runs the game.</span></div>' +
      '<div class="nl-row"><input type="text" id="nlCode" placeholder="ROOM CODE" maxlength="8" style="text-transform:uppercase;width:120px"><button id="nlJoin">Join</button></div>' +
      '<div class="nl-row"><label><input type="checkbox" id="nlLocal"> Local test (tabs of this browser, no internet)</label></div>' +
      '<div class="nl-row"><button class="sec" id="nlClose">Close</button></div>' +
      '<div class="nl-note">Seats nobody takes are played by the AI. Talk on Discord; deals go through the deal panel.</div></div>';
    const local = () => $('#nlLocal').checked ? '&net=local' : '';
    $('#nlHost').onclick = () => { location.href = location.href.split('?')[0] + '?room=' + rid(5) + '&host=1' + local(); };
    $('#nlJoin').onclick = () => { const c = $('#nlCode').value.trim().toUpperCase(); if (c) location.href = location.href.split('?')[0] + '?room=' + c + local(); };
    $('#nlClose').onclick = closeLobby;
  }

  // optional src/net-config.js (relay server settings); missing is fine
  let cfgLoaded = false;
  function loadConfig(then) {
    if (cfgLoaded || window.ROBOCUS_NET_CONFIG) return then();
    cfgLoaded = true;
    const sc = document.createElement('script'); sc.src = '../src/net-config.js';
    sc.onload = sc.onerror = () => then(); document.head.appendChild(sc);
  }
  function boot() {
    if (!GAME()) { setTimeout(boot, 50); return; }
    if (!cfgLoaded) { loadConfig(boot); return; }
    const room = (qs.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mode = qs.get('net') === 'local' ? 'local' : 'peer';
    if (!room) { badge('🌐 Online', openOnlineMenu); return; }
    if (qs.get('host') === '1') startHosting(room, mode); else startJoining(room, mode);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
