// ROBOCUS 2.0 sound (Kev, 11 Nov): small, quiet, made in the browser (Web Audio, no files).
// Arena: hits, big impacts, parts coming off, explosions, KO. Board: fame gained or lost, the win.
// Every screen plays its own sound, so nothing is sent online. Off until the first click or key (browsers ask for that).
// window.RSound: play(name, power 0..1), fame(change, mine), win(mine), toggle(), muted(), volume(v), onChange(fn)
(function (root) {
  'use strict';
  const AC = root.AudioContext || root.webkitAudioContext;
  let ctx = null, master = null, noiseBuf = null, mute = false, vol = 0.5;   // Kev, 11 Nov: 0.22 was too quiet
  const subs = [], last = {};
  try { const s = JSON.parse(root.localStorage.getItem('robocusSound2') || 'null'); if (s) { mute = !!s.mute; if (typeof s.vol === 'number') vol = Math.max(0, Math.min(1, s.vol)); } } catch (e) {}
  const save = () => { try { root.localStorage.setItem('robocusSound2', JSON.stringify({ mute, vol })); } catch (e) {} subs.forEach(f => { try { f(mute); } catch (e) {} }); };
  function init() {
    if (ctx || !AC) return;
    try {
      ctx = new AC(); master = ctx.createGain(); master.gain.value = mute ? 0 : vol;
      const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);   // many hits at once stay soft
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }
  const wake = () => { init(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
  if (root.addEventListener) for (const ev of ['pointerdown', 'keydown', 'touchstart']) root.addEventListener(ev, wake, { passive: true });
  const ok = () => ctx && ctx.state === 'running' && !mute && !root.__noRender && !(root.document && root.document.hidden);
  // a burst of filtered noise
  function noise(t, dur, type, freq, q, gain) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5, dur + 0.02);
  }
  // a tone that slides from f0 to f1
  function tone(t, dur, wave, f0, f1, gain, attack) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = wave; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  // a tone with a wobble (saws, motors)
  function buzzTone(t, dur, f, rate, gain) {
    const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; l.frequency.value = rate; lg.gain.value = f * 0.12; l.connect(lg); lg.connect(o.frequency);
    fl.type = 'bandpass'; fl.frequency.value = f * 4; fl.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + dur + 0.03); l.stop(t + dur + 0.03);
  }
  // noise whose filter slides (whooshes, hisses)
  function sweep(t, dur, type, f0, f1, q, gain) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.4, dur + 0.02);
  }
  const rr = (a, b) => a + (b - a) * Math.random();
  // [least seconds between two of the same sound, how to make it]
  const SOUNDS = {
    // general
    hit:    [0.10, (t, p) => noise(t, 0.05, 'bandpass', rr(2600, 5000), 3, 0.2 + 0.4 * p)],
    clang:  [0.10, (t, p) => { noise(t, 0.08, 'bandpass', rr(1800, 2700), 6, 0.35 + 0.4 * p); tone(t, 0.2, 'triangle', rr(620, 860), 480, 0.1 + 0.12 * p); }],
    thud:   [0.14, (t, p) => { tone(t, 0.22, 'sine', 110, 46, 0.5 + 0.4 * p); noise(t, 0.1, 'lowpass', 500, 0.7, 0.3 + 0.25 * p); }],
    crunch: [0.16, (t, p) => { noise(t, 0.07, 'bandpass', 1300, 1.2, 0.6); noise(t + 0.05, 0.13, 'bandpass', 800, 1, 0.45); tone(t, 0.12, 'square', 190, 90, 0.08); }],
    boom:   [0.25, (t, p) => { noise(t, 0.55, 'lowpass', 420, 0.6, 0.9); tone(t, 0.5, 'sine', 90, 34, 0.8); noise(t, 0.08, 'highpass', 2500, 0.7, 0.25); }],
    zap:    [0.25, (t, p) => { tone(t, 0.18, 'sawtooth', 1400, 220, 0.14); noise(t, 0.13, 'highpass', 3000, 0.7, 0.2); }],
    ko:     [0.8,  (t, p) => { tone(t, 0.6, 'triangle', 330, 70, 0.4); tone(t + 0.05, 0.32, 'sine', 100, 40, 0.6); noise(t, 0.22, 'lowpass', 600, 0.7, 0.4); }],
    // crashes: two robots slamming together, a robot into the wall
    crash:  [0.18, (t, p) => { noise(t, 0.16, 'bandpass', rr(700, 1200), 0.8, 0.45 + 0.4 * p); noise(t + 0.03, 0.22, 'highpass', 3500, 0.5, 0.15 + 0.2 * p); tone(t, 0.18, 'sine', 140, 60, 0.3 + 0.3 * p); tone(t, 0.25, 'triangle', rr(380, 520), 300, 0.06 + 0.08 * p); }],
    bang:   [0.20, (t, p) => { tone(t, 0.2, 'sine', 95, 42, 0.5 + 0.4 * p); noise(t, 0.12, 'lowpass', 900, 0.8, 0.4 + 0.3 * p); noise(t + 0.06, 0.2, 'bandpass', 320, 2, 0.12); }],
    // weapons
    ring:   [0.12, (t, p) => { const f = rr(520, 760); noise(t, 0.05, 'bandpass', 3200, 4, 0.4 + 0.3 * p); tone(t, 0.45, 'sine', f, f * 0.985, 0.16 + 0.14 * p); tone(t, 0.3, 'sine', f * 2.76, f * 2.7, 0.06 + 0.06 * p); }],   // spinners, drums, flails
    buzz:   [0.20, (t, p) => { buzzTone(t, 0.28, rr(170, 230), 38, 0.22 + 0.2 * p); noise(t, 0.25, 'bandpass', 4200, 2, 0.12 + 0.15 * p); }],   // saws, grinders
    thunk:  [0.14, (t, p) => { tone(t, 0.16, 'sine', 150, 55, 0.6 + 0.35 * p); noise(t, 0.05, 'bandpass', 900, 1.5, 0.45 + 0.3 * p); }],   // hammers, gloves, rams, spears
    hiss:   [0.20, (t, p) => { sweep(t, 0.2, 'highpass', 5000, 1500, 0.7, 0.3 + 0.2 * p); tone(t + 0.02, 0.14, 'sine', 160, 70, 0.45 + 0.3 * p); }],   // flippers, lifters
    laser:  [0.15, (t, p) => { tone(t, 0.14, 'sawtooth', 2200, 700, 0.1 + 0.08 * p); tone(t, 0.14, 'sine', 3000, 900, 0.08); }],
    shot:   [0.09, (t, p) => { noise(t, 0.04, 'highpass', 1800, 0.7, 0.35 + 0.3 * p); tone(t, 0.07, 'square', 260, 90, 0.12); }],   // guns
    squeeze:[0.30, (t, p) => { buzzTone(t, 0.4, rr(70, 95), 14, 0.3 + 0.2 * p); noise(t + 0.15, 0.2, 'bandpass', 1100, 2, 0.25); }],   // crushers, jaws, fangs
    flame:  [0.45, (t, p) => sweep(t, 0.5, 'bandpass', 500, 1400, 0.6, 0.22)],
    whoosh: [0.25, (t, p) => { sweep(t, 0.35, 'bandpass', 500, 2600, 1.2, 0.35); tone(t, 0.3, 'sine', 180, 520, 0.08); }],   // rockets, mortars, harpoons
    twang:  [0.30, (t, p) => { tone(t, 0.3, 'triangle', 300, 150, 0.25); sweep(t, 0.15, 'bandpass', 2500, 900, 3, 0.2); }],   // grappling hook, tow cable
    jet:    [0.40, (t, p) => { sweep(t, 0.45, 'lowpass', 600, 2400, 0.7, 0.5); tone(t, 0.4, 'sawtooth', 70, 140, 0.1); }],   // jump jets, boosters, dashes
    ping:   [0.15, (t, p) => { tone(t, 0.22, 'sine', 1500, 1450, 0.12); tone(t, 0.12, 'sine', 2250, 2200, 0.06); }],   // energy shield
    boing:  [0.25, (t, p) => { tone(t, 0.28, 'sine', 180, 520, 0.4); tone(t + 0.02, 0.2, 'triangle', 360, 900, 0.1); }],   // floor bumpers, launch pads
    blip:   [0.20, (t, p) => { tone(t, 0.09, 'square', 880, 880, 0.08); tone(t + 0.08, 0.12, 'square', 1320, 1320, 0.08); }],   // crates
    puff:   [0.40, (t, p) => sweep(t, 0.5, 'lowpass', 1200, 300, 0.6, 0.4)],   // smoke
    bell:   [1.0,  (t, p) => { for (const k of [0, 0.22]) { tone(t + k, 0.7, 'sine', 990, 985, 0.22); tone(t + k, 0.5, 'sine', 2480, 2470, 0.08); } }],   // the fight starts
  };
  // which sound a weapon makes when it lands a big hit (the engine's damage causes)
  const CAUSE = { spinner: 'ring', shell: 'ring', vdisc: 'ring', drum: 'ring', sweeper: 'ring', tail: 'ring', flail: 'ring', orbiter: 'ring', carousel: 'ring',
    saw: 'buzz', buzzsaw: 'buzz', twinsaw: 'buzz', floorsaw: 'buzz', sawrocket: 'buzz', corkscrew: 'buzz',
    hammer: 'thunk', mallet: 'thunk', ceiling: 'thunk', glove: 'thunk', batram: 'thunk', ram: 'thunk', spear: 'thunk', wedge: 'thunk', spikeplate: 'thunk', spikes: 'thunk', trebuchet: 'thunk',
    flipper: 'hiss', lifter: 'hiss', popper: 'hiss', piston: 'boing',
    laser: 'laser', dronelaser: 'laser', rapid: 'shot', medium: 'shot', heavy: 'shot', dronegun: 'shot', drone: 'shot',
    crusher: 'squeeze', clapper: 'squeeze', fangs: 'squeeze', jaws: 'squeeze', hydra: 'squeeze', angler: 'squeeze',
    flame: 'flame', rocket: 'boom', mortar: 'boom', mine: 'boom', boom: 'boom', harpoon: 'twang', lodestone: 'zap', strain: 'zap',
    wall: 'bang', landing: 'bang', wrench: 'crunch' };
  function play(name, power) {
    if (!ok() || !SOUNDS[name]) return;
    const t = ctx.currentTime; if (t - (last[name] || -9) < SOUNDS[name][0]) return; last[name] = t;
    try { SOUNDS[name][1](t, Math.max(0, Math.min(1, power == null ? 0.5 : power))); } catch (e) {}
  }
  function notes(list, wave, gain, step, len) { if (!ok()) return; const t = ctx.currentTime + 0.02; try { list.forEach((f, i) => tone(t + i * step, len, wave, f, f, gain, 0.012)); } catch (e) {} }
  // fame: a short rising chime (brighter when it is yours), a falling pair when fame is lost
  function fame(d, mine) {
    if (!d) return;
    if (d > 0) notes(mine ? [784, 988, 1319] : [659, 880], 'sine', mine ? 0.45 : 0.25, 0.085, 0.3);
    else notes(mine ? [523, 392] : [440, 349], 'triangle', mine ? 0.35 : 0.2, 0.11, 0.32);
  }
  function win(mine) { notes(mine ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047], 'triangle', mine ? 0.45 : 0.32, 0.13, 0.5); }
  const API = {
    play, fame, win, forCause: c => CAUSE[c] || null,
    muted: () => mute,
    toggle() { mute = !mute; wake(); if (master) master.gain.value = mute ? 0 : vol; save(); return mute; },
    volume(v) { if (v != null) { vol = Math.max(0, Math.min(1, +v)); if (master && !mute) master.gain.value = vol; save(); } return vol; },
    onChange(f) { subs.push(f); },
    get ready() { return !!ctx && ctx.state === 'running'; },
  };
  root.RSound = API;
})(typeof window !== 'undefined' ? window : globalThis);
