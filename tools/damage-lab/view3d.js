// ROBOCUS 3D Arena (sketch, Nov 2026): a three.js renderer on top of the unchanged 2.0 engine (engine.js + lineup.js).
// The engine stays flat (planck, top-down); this file only draws. Height, flips and tilts are acted out from
// what the engine already tracks (airborne, lifted, carried, flipped). Engine (x, y) = three (x, z); three's y is up.
(function () {
  'use strict';
  const L = window.DamageLab, LU = window.Lineup, THREE = window.THREE;
  if (LU && LU.usePK) LU.usePK();
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false; // hex colours are sRGB, like the 2D view
  const $ = id => document.getElementById(id);
  const PAL = [{ col: '#3F78A8', dark: '#2C5679' }, { col: '#C8642B', dark: '#8E431B' }, { col: '#4C8A3F', dark: '#35612C' }, { col: '#8B6BB1', dark: '#5E4580' }];
  const STEEL = '#9A9C94', STEEL_D = '#6F7169', RUBBER = '#2A2622', BELLY = '#4A4540';
  const st = { mode: '1v1', picks: ['Whirlwind', 'Forklift', 'Ramrod', 'Gyro'], arena: 'open', seed: 7, speed: 1, paused: false, tilt: 32, yaw: 0, zoom: 1, follow: true };

  // ---------- robot list ----------
  const ROBOTS = Object.assign({}, LU.ROBOTS, LU.ROBOTS4 || {});
  const byLevel = {}; for (const [n, v] of Object.entries(ROBOTS)) (byLevel[v[0]] = byLevel[v[0]] || []).push(n);
  const LVN = ['Level 0 (starters)', 'Level 1', 'Level 2', 'Level 3', 'Level 4 (end game)'];
  function pickerHtml() {
    const n = st.mode === '1v1' ? 2 : 4;
    let h = '';
    for (let i = 0; i < n; i++) {
      h += `<label for="pick${i}"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${PAL[i].col};margin-right:6px"></span>Robot ${i + 1}</label><select id="pick${i}">`;
      for (const lv of Object.keys(byLevel)) h += `<optgroup label="${LVN[lv] || 'Level ' + lv}">` + byLevel[lv].map(nm => `<option${nm === st.picks[i] ? ' selected' : ''}>${nm}</option>`).join('') + '</optgroup>';
      h += '</select>';
    }
    $('pickers').innerHTML = h;
    for (let i = 0; i < n; i++) $('pick' + i).onchange = e => { st.picks[i] = e.target.value; start(); };
  }

  // ---------- three setup ----------
  const canvas = $('gl'), stage = $('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2E2A25'); scene.fog = new THREE.Fog('#2E2A25', 20, 38);
  const camera = new THREE.PerspectiveCamera(36, 4 / 3, 0.1, 80);
  scene.add(new THREE.HemisphereLight('#FFF4E0', '#3A3128', 0.8));
  const sun = new THREE.DirectionalLight('#FFF1DA', 1.0); sun.position.set(-3.5, 9, 4.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.01;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#BCD2FF', 0.3); fill.position.set(4, 5, -4); scene.add(fill);
  const matCache = {};
  const mat = (col, o) => { const k = col + JSON.stringify(o || {}); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.75, metalness: 0.15 }, o))); };

  // ---------- floor (a canvas texture that also keeps the skid marks and scorches) ----------
  const FLOOR_M = 9, FPX = 1024, PPM = FPX / FLOOR_M;
  const fcv = document.createElement('canvas'); fcv.width = fcv.height = FPX; const fctx = fcv.getContext('2d');
  const ftex = new THREE.CanvasTexture(fcv); ftex.encoding = THREE.sRGBEncoding; ftex.anisotropy = 4;
  const toF = v => (v + FLOOR_M / 2) * PPM;
  let floorDirty = true;
  function paintFloor(arena) {
    const ice = !!arena.ice;
    fctx.fillStyle = ice ? '#8FA9B6' : '#4E4841'; fctx.fillRect(0, 0, FPX, FPX);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { // steel plates
      const sh = ((i * 7 + j * 13) % 5) * 3;
      fctx.fillStyle = ice ? `rgb(${160 + sh},${186 + sh / 2},${198})` : `rgb(${88 + sh},${82 + sh},${74 + sh})`;
      fctx.fillRect(i * PPM + 2, j * PPM + 2, PPM - 4, PPM - 4);
      if (!ice) { fctx.fillStyle = 'rgba(30,26,22,0.5)'; for (const [a, b] of [[8, 8], [PPM - 8, 8], [8, PPM - 8], [PPM - 8, PPM - 8]]) { fctx.beginPath(); fctx.arc(i * PPM + a, j * PPM + b, 2.5, 0, 6.29); fctx.fill(); } }
    }
    const inset = arena.inset || 0, e0 = toF(-4 + inset), e1 = toF(4 - inset), w = 0.18 * PPM; // hazard band inside the walls
    fctx.save(); fctx.beginPath(); fctx.rect(e0, e0, e1 - e0, e1 - e0); fctx.rect(e0 + w, e0 + w, e1 - e0 - 2 * w, e1 - e0 - 2 * w); fctx.clip('evenodd');
    fctx.fillStyle = '#E8C547'; fctx.fillRect(e0, e0, e1 - e0, e1 - e0); fctx.strokeStyle = '#2B2118'; fctx.lineWidth = w * 0.5;
    for (let x = -FPX; x < 2 * FPX; x += w * 1.6) { fctx.beginPath(); fctx.moveTo(x, 0); fctx.lineTo(x + FPX, FPX); fctx.stroke(); }
    fctx.restore();
    fctx.strokeStyle = ice ? 'rgba(80,120,140,0.35)' : 'rgba(232,197,71,0.25)'; fctx.lineWidth = 3; fctx.beginPath(); fctx.arc(toF(0), toF(0), 0.9 * PPM, 0, 6.29); fctx.stroke();
    for (const s of arena.saws) { fctx.fillStyle = '#1C1813'; fctx.beginPath(); fctx.ellipse(toF(s[0]), toF(s[1]), 0.42 * PPM, 0.07 * PPM, 0, 0, 6.29); fctx.fill(); }
    floorDirty = true;
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_M, FLOOR_M), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.85, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat('#26221E', { roughness: 1 })); outer.rotation.x = -Math.PI / 2; outer.position.y = -0.01; outer.receiveShadow = true; scene.add(outer);
  function decal(kind, x, y, a) {
    const px = toF(x), py = toF(y);
    if (kind === 'skid') { fctx.save(); fctx.translate(px, py); fctx.rotate(a); fctx.fillStyle = 'rgba(20,16,12,0.09)'; fctx.fillRect(-5, -3, 10, 6); fctx.restore(); }
    else if (kind === 'scorch') { const g = fctx.createRadialGradient(px, py, 0, px, py, 0.45 * PPM); g.addColorStop(0, 'rgba(20,14,8,0.55)'); g.addColorStop(1, 'rgba(20,14,8,0)'); fctx.fillStyle = g; fctx.beginPath(); fctx.arc(px, py, 0.45 * PPM, 0, 6.29); fctx.fill(); }
    else if (kind === 'scrape') { fctx.strokeStyle = 'rgba(235,230,220,0.3)'; fctx.lineWidth = 1.5; fctx.beginPath(); fctx.moveTo(px, py); fctx.lineTo(px + (Math.random() - 0.5) * 12, py + (Math.random() - 0.5) * 12); fctx.stroke(); }
    floorDirty = true;
  }

  // ---------- arena furniture ----------
  let arenaObj = null;
  function buildArena(S) {
    if (arenaObj) scene.remove(arenaObj.group);
    const g = new THREE.Group(), walls = [];
    for (const w of S.walls) {
      const len = 2 * (L.HALF + 0.25), hx = w.axis === 'x' ? 0.5 : len, hz = w.axis === 'y' ? 0.5 : len;
      const m = new THREE.Mesh(new THREE.BoxGeometry(hx, 0.5, hz), mat('#4A4540', { roughness: 0.6, metalness: 0.4 }));
      m.castShadow = m.receiveShadow = true; m.position.y = 0.25;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w.axis === 'x' ? 0.06 : hx, 0.05, w.axis === 'y' ? 0.06 : hz), mat('#E8C547', { roughness: 0.5 })); rail.position.y = 0.26; if (w.axis === 'x') rail.position.x = -w.sgn * 0.22; else rail.position.z = -w.sgn * 0.22; m.add(rail);
      if (S.arena.spikes) for (let k = -6; k <= 6; k++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), mat('#B9BBB4', { metalness: 0.7, roughness: 0.35 }));
        const off = k * 0.22, inward = -w.sgn * 0.35;
        if (w.axis === 'x') { c.position.set(inward, -0.08, off); c.rotation.z = w.sgn * Math.PI / 2; } else { c.position.set(off, -0.08, inward); c.rotation.x = -w.sgn * Math.PI / 2; }
        c.castShadow = true; m.add(c);
      }
      g.add(m); walls.push({ w, m });
    }
    const saws = S.sawState.map(s => { const m = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, 0.02, 28), mat('#C9CBC4', { metalness: 0.4, roughness: 0.35 })); m.castShadow = true; m.rotation.x = Math.PI / 2; const sg = new THREE.Group(); sg.add(m); g.add(sg); return sg; });
    scene.add(g); arenaObj = { group: g, walls, saws, dyn: new Map() };
    paintFloor(S.arena);
  }
  function syncArena(S) {
    for (const { w, m } of arenaObj.walls) { const p = w.body.getPosition(); m.position.x = p.x; m.position.z = p.y; }
    S.sawState.forEach((s, i) => { const g = arenaObj.saws[i]; g.position.set(s.x, s.up ? 0.12 : -0.4, s.y); g.children[0].rotation.y = (s.spin || 0); });
    // oil, mines, crates, smoke, energy walls: little props keyed by the engine's own objects
    const seen = new Set(), dyn = arenaObj.dyn;
    const prop = (key, make) => { seen.add(key); let m = dyn.get(key); if (!m) { m = make(); dyn.set(key, m); arenaObj.group.add(m); } return m; };
    for (const o of S.oils) { const m = prop(o, () => { const q = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshStandardMaterial({ color: '#15110D', roughness: 0.15, metalness: 0.6, transparent: true })); q.rotation.x = -Math.PI / 2; q.receiveShadow = true; return q; }); m.position.set(o.x, 0.004, o.y); m.scale.setScalar(o.r); m.material.opacity = Math.min(0.85, (o.life == null ? 1 : o.life) * 0.5); }
    for (const o of S.mines) { const m = prop(o, () => { const q = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 12), mat('#3A3530')); const l = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: '#FF3B2A' })); l.position.y = 0.03; q.add(l); q.castShadow = true; return q; }); m.position.set(o.x, 0.02, o.y); m.children[0].visible = (performance.now() % 500) < 250 || o.arm > 0; }
    for (const o of S.crates) { if (o.taken) continue; const m = prop(o, () => { const q = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), mat({ nitro: '#D33A2C', overcharge: '#E8C547', repair: '#4C8A3F', shield: '#3F78A8' }[o.type] || '#B08B57')); q.castShadow = true; return q; }); const drop = Math.max(0, 1 - (S.t - (o.t0 || 0)) / 0.5); m.position.set(o.x, 0.11 + drop * 2.5, o.y); m.rotation.y = S.t * 0.5; }
    for (const o of S.smokes) { const m = prop(o, () => new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: '#B4AFA6', transparent: true, depthWrite: false, roughness: 1 }))); m.position.set(o.x, 0.3, o.y); m.scale.set(o.r, o.r * 0.55, o.r); m.material.opacity = Math.min(0.8, o.life * 0.7); }
    for (const o of S.ewalls) { const m = prop(o, () => new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 1), new THREE.MeshBasicMaterial({ color: '#5AD0FF', transparent: true, opacity: 0.45, depthWrite: false }))); const p = o.body.getPosition(); m.position.set(p.x, 0.22, p.y); m.rotation.y = -o.body.getAngle(); }
    for (const [k, m] of dyn) if (!seen.has(k)) { arenaObj.group.remove(m); dyn.delete(k); }
  }

  // ---------- robots ----------
  // heights in metres; H = the robot's own height from the engine's side profile (R.prof.H)
  const CYL = { wheel: 1, vdisc: 1, drum: 1 };
  function bbox(vs) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const v of vs) { x0 = Math.min(x0, v[0]); y0 = Math.min(y0, v[1]); x1 = Math.max(x1, v[0]); y1 = Math.max(y1, v[1]); } return [x0, y0, x1, y1]; }
  function layer(part, H) {
    const k = part.key, kind = part.kind;
    if (part.high) return [H + 0.12, 0.05];
    if (kind === 'chassis') return [0.035, Math.max(0.08, H - 0.055)];
    if (kind === 'lid') return [H - 0.02, 0.024];
    if (kind === 'armour') return [0.03, Math.max(0.06, (H - 0.03) * 0.78)];
    if (kind === 'wheel') return [0, 0.06];
    const T = { blade: [H * 0.42, 0.035], wedge: [0.004, 0.03], lifter: [0.006, 0.022], flipper: [0.02, 0.045], jaws: [0.05, 0.08], spear: [H * 0.5, 0.03], glove: [0.06, 0.11], ball: [0.04, 0.12], buzz: [0.08, 0.02], shell: [0.03, H * 0.62], tail: [0.08, 0.05], batram: [0.04, 0.12], sweeper: [H * 0.45, 0.04], twinsaw: [0.06, 0.03], clapper: [0.05, 0.07], orbdisc: [H * 0.55, 0.02], gmsaw: [H * 0.5, 0.025] }[k];
    return T || [H * 0.35, 0.05];
  }
  function colourFor(part, R) {
    const pal = PAL[R.id % 4];
    if (part.lid || part.col === 'lid') return pal.dark;
    if (part.kind === 'chassis') return R.alive ? pal.col : pal.dark;
    if (part.kind === 'lid') return R.alive ? pal.dark : '#4A4540';
    if (part.kind === 'wheel') return part.leg ? '#4A4540' : RUBBER;
    if (part.kind === 'armour') return { rubber: '#34302C', spring: '#D4AF37', spiked: '#8E9088', fibre: '#4FA3A0' }[part.bumper] || STEEL;
    return { spear: '#C9CBC4', glove: '#6F7369', blade: '#B9BBB4', flipper: '#D9B43A', wedge: '#7D8078', drum: '#8C8F86', jaws: '#6F7369', lifter: '#D9B43A', vdisc: '#C9CBC4', ball: '#55524C', buzz: '#C9CBC4', shell: '#9A9C94' }[part.key] || STEEL_D;
  }
  const finish = part => part.kind === 'weapon' || part.kind === 'armour' ? { metalness: 0.35, roughness: 0.45 } : part.kind === 'wheel' ? { metalness: 0, roughness: 0.95 } : { metalness: 0.2, roughness: 0.6 };
  function partMesh(part, R, debris) {
    const H = R.prof.H, vs = part.outline && part.outline.length >= 3 ? part.outline : part.verts;
    let [z0, h] = layer(part, H); if (debris) z0 = 0.002;
    if ((CYL[part.kind] || CYL[part.key]) && !part.leg) { // wheels, drums and vertical discs: real cylinders that turn
      const [x0, y0, x1, y1] = bbox(part.verts), r = Math.max(0.03, (x1 - x0) / 2), w = Math.max(0.02, y1 - y0);
      const geo = new THREE.CylinderGeometry(r, r, w, part.kind === 'wheel' ? 18 : 24); geo.rotateX(Math.PI / 2);
      const inner = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color: colourFor(part, R) }, finish(part))));
      if (part.kind === 'wheel') {
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.004, 10), mat('#8C8F86', { metalness: 0.6, roughness: 0.4 })); hub.rotation.x = Math.PI / 2; inner.add(hub);
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(r * 0.85, 0.014, w + 0.01), mat('#C9CBC4')); inner.add(spoke);
      } else { const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.03, r * 2.1, w * 0.6), mat('#E4E1DA', { metalness: 0.8, roughness: 0.3 })); inner.add(tooth); }
      inner.castShadow = true; inner.receiveShadow = true;
      const g = new THREE.Group(); g.add(inner); inner.position.set((x0 + x1) / 2, r + (part.key === 'vdisc' ? 0.01 : 0), (y0 + y1) / 2); g.userData.spinner = inner;
      return g;
    }
    const shape = new THREE.Shape(vs.map(p => new THREE.Vector2(p[0], p[1])));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: Math.min(0.008, h * 0.2), bevelSize: 0.006, bevelSegments: 1, curveSegments: 4 });
    geo.rotateX(Math.PI / 2); geo.translate(0, z0 + h, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color: colourFor(part, R) }, finish(part))));
    m.castShadow = true; m.receiveShadow = true;
    if (part.kind === 'chassis' && !debris) { // dark belly with a hazard stripe: what you see when it lands on its back
      const bs = new THREE.Shape(part.verts.map(p => new THREE.Vector2(p[0] * 0.93, p[1] * 0.93))), bg = new THREE.ExtrudeGeometry(bs, { depth: 0.006, bevelEnabled: false }); bg.rotateX(Math.PI / 2); bg.translate(0, z0 - 0.009, 0); // under the bevel of the hull
      m.add(new THREE.Mesh(bg, mat(BELLY)));
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(R.hl * 1.2, 0.007, 0.06), mat('#E8C547')); stripe.position.y = z0 - 0.016; m.add(stripe);
    }
    return m;
  }
  function makeTurret(R) {
    const g = new THREE.Group(), w = R.spec.weapon;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.06, 18), mat('#8C8F86', { metalness: 0.5, roughness: 0.45 })); base.position.y = 0.03; base.castShadow = true; g.add(base);
    const bar = (len, wd, off) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(wd / 2, wd / 2, len, 10), mat('#55524C', { metalness: 0.6, roughness: 0.4 })); b.rotation.z = -Math.PI / 2; b.position.set(0.05 + len / 2, 0.05, off || 0); b.castShadow = true; g.add(b); };
    if (w === 'rapid') { bar(0.3, 0.035, -0.035); bar(0.3, 0.035, 0.035); }
    else if (w === 'heavy') bar(0.36, 0.09);
    else if (w === 'mortar') { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.16, 14), mat('#55524C')); t.position.set(0.1, 0.1, 0); t.rotation.z = -0.5; t.castShadow = true; g.add(t); }
    else if (w === 'rocket' || w === 'sawrocket') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.18), mat('#6F7169')); p.position.set(0.1, 0.08, 0); p.castShadow = true; g.add(p); }
    else if (w === 'laser') { bar(0.28, 0.06); const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#E04B3A' })); tip.position.set(0.35, 0.05, 0); g.add(tip); }
    else bar(w === 'flame' ? 0.26 : 0.32, w === 'flame' ? 0.07 : 0.05);
    g.position.y = R.prof.H; return g;
  }
  // one record per robot: root (floor position, heading) > tilt (roll / pitch about its middle) > body (parts in robot coordinates)
  const R3 = new Map(), P3 = new Map();
  function robotRec(R) {
    let r = R3.get(R); if (r) return r;
    const root = new THREE.Group(), tilt = new THREE.Group(), body = new THREE.Group();
    root.add(tilt); tilt.add(body); tilt.position.y = R.prof.H / 2; body.position.y = -R.prof.H / 2; scene.add(root);
    r = { root, tilt, body, roll: R.flipped ? Math.PI : 0, pitch: 0, turret: null, lastFlip: R.flipped, flipT: 0, flipDir: 1 };
    if (R.turret) { r.turret = makeTurret(R); body.add(r.turret); }
    R3.set(R, r); return r;
  }
  function partRec(part, R, onRobot) {
    let p = P3.get(part);
    const dn = part.dents ? part.dents.length : 0;
    if (p && (p.body !== part.body || p.onRobot !== onRobot || (p.dn !== dn && /chassis|armour|lid/.test(part.kind)))) { if (p.mesh.parent) p.mesh.parent.remove(p.mesh); p.mesh.traverse(o => o.geometry && o.geometry.dispose()); P3.delete(part); p = null; }
    if (!p) { p = { mesh: partMesh(part, R, !onRobot), body: part.body, onRobot, dn }; P3.set(part, p); (onRobot ? robotRec(R).body : scene).add(p.mesh); if (!onRobot) p.mesh.rotation.order = 'YXZ'; }
    p.seen = frameN; return p;
  }
  const tmpV = new THREE.Vector3();
  function syncRobots(S, rdt) {
    const ease = 1 - Math.exp(-rdt * 9);
    for (const R of S.robots) {
      const r = robotRec(R), b = R.body, pos = b.getPosition(), a = b.getAngle();
      // act out height: a hop when thrown, a roll when it ends up the other way round, a tilt when something gets under it
      const air = R.airborne > 0 ? Math.sin(Math.PI * Math.min(1, 1 - R.airborne / Math.max(R.airMax, 0.01))) : 0;
      const carried = S.robots.some(Q => Q.carry && Q.carry.robot === R);
      if (R.flipped !== r.lastFlip) { r.lastFlip = R.flipped; r.flipT = 0.5; if (!R.flipped) r.flipDir = -r.flipDir; }
      let tp = 0, tr = 0, lift = 0;
      if (R.lifted > 0 || carried) { // the end nearest the lifter goes up
        const E = R.enemy && R.enemy.body ? R.enemy : null;
        if (E) { const lp = b.getLocalPoint(E.body.getPosition()), d = Math.hypot(lp.x, lp.y) || 1; tp = 0.3 * lp.x / d * (carried ? 1.3 : 1); tr = -0.25 * lp.y / d; }
        lift = carried ? 0.12 : 0.04;
      }
      if (R.airborne > 0 && R.airMax > 0.25) tp += Math.sin(S.t * 9 + R.id) * 0.3 * air;
      r.pitch += (tp - r.pitch) * ease;
      const rollGoal = (R.flipped ? Math.PI * r.flipDir : 0) + tr * (R.flipped ? -1 : 1);
      r.roll += (rollGoal - r.roll) * (1 - Math.exp(-rdt * (r.flipT > 0 ? 7 : 9)));
      let flipHop = 0; if (r.flipT > 0) { r.flipT -= rdt; flipHop = Math.sin(Math.PI * Math.max(0, 1 - r.flipT / 0.5)) * (0.15 + R.hw * 0.5); }
      r.root.position.set(pos.x, air * (0.12 + (R.airMax || 0) * 0.9) + lift + flipHop, pos.y); r.root.rotation.y = -a;
      r.tilt.rotation.set(r.roll, 0, r.pitch);
      if (r.turret) r.turret.rotation.y = -((R.turretA == null ? a : R.turretA) - a);
      // parts on the robot body, and parts on their own bodies (spinner bars, flails, tails, ram heads) placed relative to it
      for (const part of R.parts.concat(R.lid ? [R.lid] : [])) {
        if (!part.attached || !part.verts) continue;
        const m = partRec(part, R, true).mesh;
        if (part.body === b) { m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); }
        else { const lp = b.getLocalPoint(part.body.getPosition()); m.position.set(lp.x, 0, lp.y); m.rotation.set(0, -(part.body.getAngle() - a), 0); }
        if (part.kind === 'lid' && part.state === 'loose') m.position.y = Math.abs(Math.sin(performance.now() / 40)) * 0.014;
        if (m.userData.spinner) m.userData.spinner.rotation.z = part.slot ? -part.slot.spin : part.key === 'vdisc' ? -(r.vs = (r.vs || 0) + (R.vE || 0) * rdt * 60) : -(r.ds = (r.ds || 0) + (R.drumE || 0) * rdt * 50);
        tintPart(m, part, R);
      }
    }
    for (const part of S.debris) { // torn-off parts lie on the floor and tumble on their own bodies
      if (!part.verts || !part.body) continue; const R = part.robot || S.robots[0];
      const pr = partRec(part, R, false), p = part.body.getPosition(), v = part.body.getLinearVelocity(), sp = Math.hypot(v.x, v.y);
      pr.mesh.position.set(p.x, Math.min(0.3, sp * 0.035), p.y); pr.mesh.rotation.set(Math.min(0.6, sp * 0.12) * Math.sin(p.x * 3 + p.y), -part.body.getAngle(), 0);
      tintPart(pr.mesh, part, R, true);
    }
    for (const [part, pr] of P3) if (pr.seen !== frameN) { if (pr.mesh.parent) pr.mesh.parent.remove(pr.mesh); P3.delete(part); }
  }
  const darkC = new THREE.Color('#1E1A16'), heatC = new THREE.Color('#FF6A1A'), tmpC = new THREE.Color();
  function tintPart(m, part, R, debris) {
    const mt = m.userData.spinner ? m.userData.spinner.material : m.material; if (!mt || !mt.color) return;
    const f = part.maxHp ? Math.max(0, part.hp / part.maxHp) : 1;
    mt.color.copy(tmpC.set(colourFor(part, R))).lerp(darkC, (1 - f) * 0.45 + (debris ? 0.2 : 0));
    if (mt.emissive) mt.emissive.copy(heatC).multiplyScalar(Math.max(0, Math.min(1, ((part.heat || 0) - 25) / 120)) * 0.6);
  }
  // drones and projectiles
  const droneM = new Map(), projM = new Map();
  function syncFlying(S) {
    const seen = new Set();
    for (const d of S.drones) {
      if (!d.alive) continue; seen.add(d);
      let m = droneM.get(d);
      if (!m) {
        const r = (d.H && d.H.r ? d.H.r : 0.12) * 1.2, phys = d.H && d.H.physical;
        m = new THREE.Group(); const hull = new THREE.Mesh(phys ? new THREE.CylinderGeometry(r, r, 0.08, 8) : new THREE.SphereGeometry(r * 0.7, 14, 10), mat(d.H && d.H.col ? d.H.col : '#9A9C94', { metalness: 0.3 })); hull.castShadow = true; m.add(hull);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.014, 6, 24), mat(PAL[d.owner.id % 4].col)); ring.rotation.x = Math.PI / 2; m.add(ring);
        if (!phys) for (let k = 0; k < 4; k++) { const rot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.38, r * 0.38, 0.008, 12), new THREE.MeshBasicMaterial({ color: '#DDD8CE', transparent: true, opacity: 0.35 })); const an = k * Math.PI / 2 + 0.785; rot.position.set(Math.cos(an) * r * 1.2, 0.03, Math.sin(an) * r * 1.2); m.add(rot); }
        scene.add(m); droneM.set(d, m);
      }
      const p = d.body.getPosition(); m.position.set(p.x, d.H && d.H.physical ? 0.05 : 0.45 + Math.sin(performance.now() / 300 + p.x) * 0.03, p.y); m.rotation.y = -d.body.getAngle();
    }
    for (const [d, m] of droneM) if (!seen.has(d)) { scene.remove(m); droneM.delete(d); }
    const ps = new Set();
    for (const p of S.projs) {
      if (p.dead) continue; ps.add(p); let m = projM.get(p);
      if (!m) { m = new THREE.Mesh(p.rocket ? new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8) : new THREE.SphereGeometry(Math.max(0.02, p.r || 0.03), 8, 6), p.rocket ? mat('#E4E1DA') : new THREE.MeshBasicMaterial({ color: p.cause === 'heavy' ? '#3A3530' : '#FFD86A' })); if (p.rocket) m.geometry.rotateZ(Math.PI / 2); scene.add(m); projM.set(p, m); }
      m.position.set(p.x, 0.18, p.y); m.rotation.y = -Math.atan2(p.vy, p.vx);
      if (p.rocket && Math.random() < 0.8) emit('fire', p.x - p.vx * 0.02, 0.18, p.y - p.vy * 0.02, 0, 0.3, 0, 0.3);
    }
    for (const s of S.shells) { ps.add(s); let m = projM.get(s); if (!m) { m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#3A3530')); m.castShadow = true; scene.add(m); projM.set(s, m); } const k = s.t / s.T; m.position.set(s.x0 + (s.x1 - s.x0) * k, 0.2 + 4 * k * (1 - k) * 2.2, s.y0 + (s.y1 - s.y0) * k); }
    for (const [p, m] of projM) if (!ps.has(p)) { scene.remove(m); projM.delete(p); }
  }

  // ---------- particles (sparks, fire, dust) ----------
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  // points with their own colour and fade (alpha) each; size in metres
  const PVS = 'attribute vec3 color; attribute float alpha; varying vec3 vC; varying float vA; uniform float size, scale; void main() { vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }';
  const PFS = 'uniform sampler2D map; varying vec3 vC; varying float vA; void main() { vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, vA * t.a); }';
  const pmats = [];
  function pointsSys(n, size, blending) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), al = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('alpha', new THREE.BufferAttribute(al, 1)); geo.setDrawRange(0, 0);
    const mt = new THREE.ShaderMaterial({ uniforms: { size: { value: size }, scale: { value: 600 }, map: { value: dot } }, vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, blending });
    pmats.push(mt); const m = new THREE.Points(geo, mt); m.frustumCulled = false; scene.add(m); return { geo, pos, col, al, n, list: [] };
  }
  const PS = { spark: pointsSys(1500, 0.06, THREE.AdditiveBlending), fire: pointsSys(1200, 0.2, THREE.AdditiveBlending), dust: pointsSys(900, 0.4, THREE.NormalBlending) };
  const COLS = { spark: [1, 0.85, 0.45], fire: [1, 0.5, 0.15], dust: [0.62, 0.58, 0.52] };
  function emit(t, x, y, z, vx, vy, vz, life) { const s = PS[t]; if (s.list.length < s.n) s.list.push({ x, y, z, vx, vy, vz, life, max: life }); }
  function burst(t, x, z, n, sp, up, life) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.4 + Math.random() * 0.8); emit(t, x, 0.12, z, Math.cos(a) * v, up * (0.3 + Math.random()), Math.sin(a) * v, life * (0.6 + Math.random() * 0.6)); } }
  function stepParticles(dt) {
    for (const k in PS) {
      const s = PS[k], g = k === 'spark' ? -9 : k === 'fire' ? 1.2 : 0.25, drag = k === 'dust' ? 2.5 : k === 'fire' ? 1.5 : 0.4, c = COLS[k];
      let j = 0;
      for (const p of s.list) {
        p.life -= dt; if (p.life <= 0) continue;
        p.vy += g * dt; p.vx *= 1 - drag * dt; p.vz *= 1 - drag * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.005) { p.y = 0.005; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
        const f = p.life / p.max;
        s.pos[j * 3] = p.x; s.pos[j * 3 + 1] = p.y; s.pos[j * 3 + 2] = p.z;
        s.col[j * 3] = c[0]; s.col[j * 3 + 1] = c[1] * (k === 'fire' ? 0.5 + f * 0.7 : 1); s.col[j * 3 + 2] = c[2];
        s.al[j] = k === 'dust' ? 0.45 * f : f;
        s.list[j++] = p;
      }
      s.list.length = j; s.geo.setDrawRange(0, j); s.geo.attributes.position.needsUpdate = true; s.geo.attributes.color.needsUpdate = true; s.geo.attributes.alpha.needsUpdate = true;
    }
  }
  // ---------- engine effects ----------
  let shake = 0;
  const calls = [];
  function consumeFx(S) {
    for (const e of S.fx) {
      const t = e.type;
      if (t === 'spark') { const n = Math.min(26, 3 + (e.power || 10) / 4); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 1 + Math.random() * 3 + (e.power || 0) * 0.02; emit('spark', e.x, 0.12, e.y, Math.cos(a) * v + (e.nx || 0) * 1.5, 1 + Math.random() * 2.5, Math.sin(a) * v + (e.ny || 0) * 1.5, 0.25 + Math.random() * 0.35); } }
      else if (t === 'bigHit') { burst('spark', e.x, e.y, 30, 4, 3, 0.5); shake = Math.min(0.14, shake + 0.04 + (e.power || 0) * 0.001); }
      else if (t === 'skid') decal('skid', e.x, e.y, e.a);
      else if (t === 'scrape') { decal('scrape', e.x, e.y); burst('spark', e.x, e.y, 2, 1.5, 1, 0.2); }
      else if (t === 'thud') { burst('dust', e.x, e.y, 10, 1.2, 0.2, 0.7); shake = Math.min(0.12, shake + 0.03 + (e.power || 0) * 0.04); }
      else if (t === 'detach') { burst('spark', e.x, e.y, 14, 3, 2.5, 0.45); burst('dust', e.x, e.y, 4, 0.8, 0.3, 0.6); }
      else if (t === 'boom' || t === 'shatter' || t === 'slam' || t === 'piston') { burst('fire', e.x, e.y, 26, 2.2, 1.5, 0.6); burst('dust', e.x, e.y, 14, 1.6, 0.6, 1.1); decal('scorch', e.x, e.y); shake = Math.min(0.3, shake + 0.15); }
      else if (t === 'punch' || t === 'boing' || t === 'launch') { burst('dust', e.x, e.y, 6, 1, 0.4, 0.5); burst('spark', e.x, e.y, 8, 2.5, 2, 0.3); shake = Math.min(0.15, shake + 0.05); }
      else if (t === 'smokebomb') burst('dust', e.x, e.y, 40, 2, 0.6, 2.2);
      else if (t === 'scorch') decal('scorch', e.x, e.y);
      else if (t === 'ko') shake = Math.min(0.2, shake + 0.08);
      else if (t === 'callout') { calls.push({ text: e.text, x: e.x, y: e.y, big: e.big, t: 0, el: null }); while (calls.length > 4) { const c = calls.shift(); if (c.el) c.el.remove(); } }
    }
    S.fx.length = 0;
  }
  function emitters(S) {
    for (const R of S.robots) {
      const p = R.body.getPosition(), r = R3.get(R), H = R.prof.H;
      if (R.battery && R.battery.fire && Math.random() < 0.5) { emit('fire', p.x + (Math.random() - 0.5) * 0.2, H + 0.05, p.y + (Math.random() - 0.5) * 0.2, 0, 0.8, 0, 0.5); if (Math.random() < 0.3) emit('dust', p.x, H + 0.2, p.y, 0, 0.6, 0, 1.2); }
      if (R.flameOn > 0 && R.turret && R.turret.hp > 0) { const a = R.turretA, cx = Math.cos(a), sy = Math.sin(a); for (let i = 0; i < 4; i++) emit('fire', p.x + cx * 0.32, H + 0.06, p.y + sy * 0.32, cx * (3 + Math.random() * 2) + (Math.random() - 0.5), 0.2, sy * (3 + Math.random() * 2) + (Math.random() - 0.5), 0.35); }
      if (!R.alive && Math.random() < 0.08) emit('dust', p.x, H, p.y, 0, 0.4, 0, 1.6);
      if (R.slots) for (const s of R.slots) if (s.slip && Math.random() < 0.15) { const w = R.body.getWorldPoint(planck.Vec2(s.lp[0], s.lp[1])); emit('dust', w.x, 0.04, w.y, 0, 0.15, 0, 0.6); }
      if (r && r.flipT > 0.42) burst('dust', p.x, p.y, 1, 0.8, 0.2, 0.5);
    }
  }

  // ---------- camera ----------
  const cam = { tx: 0, tz: 0, d: 1 };
  function placeCamera(S, rdt) {
    let tx = 0, tz = 0, spread = 8;
    if (st.follow && S) { const al = S.robots.filter(R => R.alive); const list = al.length ? al : S.robots; let x0 = 9, x1 = -9, z0 = 9, z1 = -9; for (const R of list) { const p = R.body.getPosition(); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.y); z1 = Math.max(z1, p.y); } tx = (x0 + x1) / 2 * 0.55; tz = (z0 + z1) / 2 * 0.55; spread = Math.max(x1 - x0, z1 - z0); }
    const k = 1 - Math.exp(-rdt * 2.5); cam.tx += (tx - cam.tx) * k; cam.tz += (tz - cam.tz) * k;
    const wantD = st.follow ? 0.74 + Math.min(1, spread / 7) * 0.26 : 1; cam.d += (wantD - cam.d) * k;
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight), tilt = Math.max(0.6, st.tilt) * Math.PI / 180;
    const fit = 9.2 / (2 * Math.tan(camera.fov * Math.PI / 360)) / Math.min(1, aspect);
    const d = fit * cam.d * st.zoom * (1 - Math.sin(tilt) * 0.08);
    const sx = (Math.random() - 0.5) * shake, sz = (Math.random() - 0.5) * shake;
    camera.position.set(cam.tx + Math.sin(tilt) * Math.sin(st.yaw) * d + sx, Math.cos(tilt) * d, cam.tz + Math.sin(tilt) * Math.cos(st.yaw) * d + sz);
    camera.up.set(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)); // screen top = the far side of the arena (engine -y at yaw 0, as in the 2D view)
    camera.lookAt(cam.tx + sx, 0, cam.tz + sz);
  }
  // drag to orbit, wheel / pinch to zoom
  const ptrs = new Map(); let pinch0 = 0;
  stage.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); stage.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 1) { st.yaw -= (e.clientX - px) * 0.008; setTilt(st.tilt + (e.clientY - py) * 0.25); }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) st.zoom = Math.max(0.45, Math.min(1.6, st.zoom * pinch0 / d)); pinch0 = d; }
  });
  const up = e => { ptrs.delete(e.pointerId); pinch0 = 0; }; stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => { e.preventDefault(); st.zoom = Math.max(0.45, Math.min(1.6, st.zoom * Math.exp(e.deltaY * 0.001))); }, { passive: false });
  function setTilt(v) { st.tilt = Math.max(0, Math.min(65, v)); $('tilt').value = Math.round(st.tilt); $('tiltV').textContent = Math.round(st.tilt) + '°'; }

  // ---------- HUD ----------
  const pctOf = R => Math.max(0, Math.min(1, Math.min(R.chassis.hp / R.chassis.maxHp, R.battery.hp / R.battery.maxHp)));
  function hud(S) {
    $('bars').innerHTML = S.robots.map(R => {
      const f = pctOf(R), chips = []; if (!R.alive) chips.push('OUT'); if (R.flipped) chips.push('UPSIDE DOWN'); if (R.airborne > 0) chips.push('IN THE AIR'); if (R.lifted > 0) chips.push('LIFTED'); if (R.battery.fire) chips.push('ON FIRE'); if (R.lid && !R.lid.attached) chips.push('LID OFF');
      return `<div class="bar1" style="--c:${PAL[R.id % 4].col}"><b>${R.name}</b> <span style="float:right">${Math.round(f * 100)}%</span><div class="meter"><i style="width:${f * 100}%"></i></div><div class="chips">${chips.join(' · ')}</div></div>`;
    }).join('');
    const t = Math.max(0, S.timeLimit - S.t); $('clock').textContent = S.countdown > 0 ? 'Get ready…' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  }
  let logN = 0;
  function pushLog(S) {
    if (S.log.length === logN) return; const ul = $('log');
    for (; logN < S.log.length; logN++) { const l = S.log[logN], li = document.createElement('li'); li.textContent = `${Math.floor(l.t / 60)}:${String(Math.floor(l.t % 60)).padStart(2, '0')}  ${l.text}`; if (l.big) li.className = 'big'; ul.prepend(li); }
    while (ul.children.length > 60) ul.lastChild.remove();
  }
  function drawCalls(rdt) {
    const box = $('calls'), w = canvas.clientWidth, h = canvas.clientHeight; let slot = 0;
    for (const c of calls) {
      c.t += rdt;
      if (!c.el) { c.el = document.createElement('div'); c.el.className = 'call' + (c.big ? ' big' : ''); c.el.textContent = c.text; c.el.style.rotate = ((Math.random() - 0.5) * 8) + 'deg'; box.appendChild(c.el); }
      tmpV.set(c.x, 0.7 + c.t * 0.5, c.y).project(camera);
      const pop = c.t < 0.12 ? 0.6 + c.t / 0.12 * 0.6 : c.t < 0.25 ? 1.2 - (c.t - 0.12) / 0.13 * 0.2 : 1;
      c.el.style.left = Math.max(70, Math.min(w - 70, (tmpV.x + 1) / 2 * w)) + 'px'; c.el.style.top = Math.max(40, (1 - tmpV.y) / 2 * h - slot * 30) + 'px';
      c.el.style.transform = `translate(-50%,-50%) scale(${pop})`; c.el.style.opacity = c.t > 1 ? Math.max(0, 1 - (c.t - 1) / 0.3) : 1; slot++;
    }
    for (let i = calls.length - 1; i >= 0; i--) if (calls[i].t > 1.3) { if (calls[i].el) calls[i].el.remove(); calls.splice(i, 1); }
  }

  // ---------- fight control ----------
  let S = null, acc = 0, frameN = 0, last = performance.now(), shown = false, called = false;
  function clearScene() {
    for (const [, r] of R3) scene.remove(r.root); R3.clear();
    for (const [, p] of P3) if (p.mesh.parent) p.mesh.parent.remove(p.mesh); P3.clear();
    for (const [, m] of droneM) scene.remove(m); droneM.clear(); for (const [, m] of projM) scene.remove(m); projM.clear();
    for (const k in PS) PS[k].list.length = 0; calls.forEach(c => c.el && c.el.remove()); calls.length = 0;
  }
  function start() {
    clearScene();
    const n = st.mode === '1v1' ? 2 : 4, specs = [], seen = {};
    for (let i = 0; i < n; i++) { const sp = LU.build(st.picks[i]); sp.name = st.picks[i]; seen[sp.name] = (seen[sp.name] || 0) + 1; if (seen[sp.name] > 1) sp.name += ' ' + ['', 'II', 'III', 'IV'][seen[sp.name] - 1]; specs.push(sp); }
    S = n > 2 ? L.create({ mode: 'ffa', robots: specs, seed: st.seed, arena: st.arena, countdown: 2 }) : L.create({ a: specs[0], b: specs[1], seed: st.seed, arena: st.arena, countdown: 2 });
    buildArena(S); logN = 0; $('log').innerHTML = ''; $('result').hidden = true; shown = false; called = false; acc = 0;
  }
  function stepOnce() { L.step(S); consumeFx(S); }
  function frame(now) {
    const rdt = Math.min(0.05, (now - last) / 1000); last = now; frameN++;
    const w = canvas.clientWidth, h = canvas.clientHeight, pr = renderer.getPixelRatio();
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) { renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); for (const m of pmats) m.uniforms.scale.value = h * pr / (2 * Math.tan(camera.fov * Math.PI / 360)); }
    let ts = 0;
    if (S && !st.paused) {
      ts = st.speed; acc += rdt * ts; let n = 0;
      while (acc >= L.DT && n < 24) { stepOnce(); acc -= L.DT; n++; }
      if (n >= 24) acc = 0;
      emitters(S);
      if (!called && S.countdown <= 0) { called = true; calls.push({ text: 'FIGHT!', x: 0, y: 0, big: true, t: 0, el: null }); }
      if (S.over && !shown && S.t > S.result.t + 1) { shown = true; const el = $('result'); el.innerHTML = `<h2>${S.result.how === 'KO' ? 'KNOCKOUT' : 'TIME'}</h2>${S.result.text}`; el.hidden = false; }
    }
    stepParticles(rdt * (ts ? Math.min(ts, 1.5) : 0));
    shake *= Math.exp(-rdt * 8);
    if (S) {
      syncArena(S); syncRobots(S, ts ? rdt * Math.min(ts, 1.5) : 0); syncFlying(S);
      if (floorDirty && frameN % 3 === 0) { ftex.needsUpdate = true; floorDirty = false; }
      placeCamera(S, rdt); renderer.render(scene, camera);
      if (frameN % 6 === 0) hud(S); pushLog(S); drawCalls(st.paused ? 0 : rdt);
    }
    requestAnimationFrame(frame);
  }

  // ---------- wiring ----------
  $('arenaSel').innerHTML = Object.entries(L.ARENAS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  $('arenaSel').onchange = e => { st.arena = e.target.value; start(); };
  $('mode').onchange = e => { st.mode = e.target.value; pickerHtml(); start(); };
  $('seed').onchange = e => { st.seed = Math.max(1, parseInt(e.target.value, 10) || 1); start(); };
  $('fight').onclick = () => { st.paused = false; $('pause').textContent = 'Pause'; $('pause').setAttribute('aria-pressed', 'false'); start(); };
  $('newseed').onclick = () => { st.seed = 1 + Math.floor(Math.random() * 99999); $('seed').value = st.seed; start(); };
  $('rand').onclick = () => { const names = Object.keys(ROBOTS); for (let i = 0; i < 4; i++) st.picks[i] = names[Math.floor(Math.random() * names.length)]; pickerHtml(); start(); };
  $('pause').onclick = () => { st.paused = !st.paused; $('pause').textContent = st.paused ? 'Go on' : 'Pause'; $('pause').setAttribute('aria-pressed', String(st.paused)); };
  document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { st.speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { setTilt(+b.dataset.view); st.yaw = 0; });
  $('tilt').oninput = e => setTilt(+e.target.value);
  $('follow').onchange = e => { st.follow = e.target.checked; };
  $('shadows').onchange = e => { renderer.shadowMap.enabled = e.target.checked; sun.castShadow = e.target.checked; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); };
  document.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); $('pause').click(); } });
  const q = new URLSearchParams(location.search);
  if (q.get('seed')) { st.seed = +q.get('seed') || 7; $('seed').value = st.seed; }
  if (q.get('a')) st.picks[0] = q.get('a'); if (q.get('b')) st.picks[1] = q.get('b');
  if (q.get('arena') && L.ARENAS[q.get('arena')]) { st.arena = q.get('arena'); $('arenaSel').value = st.arena; }
  if (q.get('tilt')) setTilt(+q.get('tilt'));
  pickerHtml(); start(); requestAnimationFrame(frame);
  // test hook: run the fight ahead without drawing (node / screenshots)
  window.ROBOCUS3D = { get S() { return S; }, st, start, skip(sec) { const n = Math.round(sec / L.DT); for (let i = 0; i < n && S && !S.over; i++) stepOnce(); } };
})();
