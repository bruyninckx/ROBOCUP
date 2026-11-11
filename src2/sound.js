// ROBOCUS 2.0 sound (Kev, 11 Nov): small, quiet, made in the browser (Web Audio, no files).
// Arena: hits, big impacts, parts coming off, explosions, KO. Board: fame gained or lost, the win.
// Every screen plays its own sound, so nothing is sent online. Off until the first click or key (browsers ask for that).
// window.RSound: play(name, power 0..1), fame(change, mine), win(mine), toggle(), muted(), volume(v), onChange(fn)
(function (root) {
  'use strict';
  const AC = root.AudioContext || root.webkitAudioContext;
  let ctx = null, master = null, noiseBuf = null, mute = false, vol = 0.22;
  const subs = [], last = {};
  try { const s = JSON.parse(root.localStorage.getItem('robocusSound') || 'null'); if (s) { mute = !!s.mute; if (typeof s.vol === 'number') vol = Math.max(0, Math.min(1, s.vol)); } } catch (e) {}
  const save = () => { try { root.localStorage.setItem('robocusSound', JSON.stringify({ mute, vol })); } catch (e) {} subs.forEach(f => { try { f(mute); } catch (e) {} }); };
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
  // [least seconds between two of the same sound, how to make it]
  const SOUNDS = {
    hit:    [0.10, (t, p) => noise(t, 0.045, 'bandpass', 2600 + 2400 * Math.random(), 3, 0.10 + 0.25 * p)],
    clang:  [0.10, (t, p) => { noise(t, 0.07, 'bandpass', 1800 + 900 * Math.random(), 6, 0.2 + 0.3 * p); tone(t, 0.16, 'triangle', 620 + 240 * Math.random(), 480, 0.05 + 0.08 * p); }],
    thud:   [0.14, (t, p) => { tone(t, 0.2, 'sine', 110, 46, 0.35 + 0.35 * p); noise(t, 0.09, 'lowpass', 500, 0.7, 0.2 + 0.2 * p); }],
    crunch: [0.16, (t, p) => { noise(t, 0.06, 'bandpass', 1300, 1.2, 0.4); noise(t + 0.05, 0.11, 'bandpass', 800, 1, 0.3); tone(t, 0.12, 'square', 190, 90, 0.05); }],
    boom:   [0.25, (t, p) => { noise(t, 0.5, 'lowpass', 420, 0.6, 0.7); tone(t, 0.45, 'sine', 90, 34, 0.6); }],
    zap:    [0.25, (t, p) => { tone(t, 0.16, 'sawtooth', 1400, 220, 0.08); noise(t, 0.12, 'highpass', 3000, 0.7, 0.12); }],
    ko:     [0.8,  (t, p) => { tone(t, 0.55, 'triangle', 330, 70, 0.3); tone(t + 0.05, 0.3, 'sine', 100, 40, 0.5); noise(t, 0.2, 'lowpass', 600, 0.7, 0.3); }],
  };
  function play(name, power) {
    if (!ok() || !SOUNDS[name]) return;
    const t = ctx.currentTime; if (t - (last[name] || -9) < SOUNDS[name][0]) return; last[name] = t;
    try { SOUNDS[name][1](t, Math.max(0, Math.min(1, power == null ? 0.5 : power))); } catch (e) {}
  }
  function notes(list, wave, gain, step, len) { if (!ok()) return; const t = ctx.currentTime + 0.02; try { list.forEach((f, i) => tone(t + i * step, len, wave, f, f, gain, 0.012)); } catch (e) {} }
  // fame: a short rising chime (brighter when it is yours), a falling pair when fame is lost
  function fame(d, mine) {
    if (!d) return;
    if (d > 0) notes(mine ? [784, 988, 1319] : [659, 880], 'sine', mine ? 0.3 : 0.16, 0.085, 0.28);
    else notes(mine ? [523, 392] : [440, 349], 'triangle', mine ? 0.22 : 0.12, 0.11, 0.3);
  }
  function win(mine) { notes(mine ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047], 'triangle', mine ? 0.32 : 0.22, 0.13, 0.5); }
  const API = {
    play, fame, win,
    muted: () => mute,
    toggle() { mute = !mute; wake(); if (master) master.gain.value = mute ? 0 : vol; save(); return mute; },
    volume(v) { if (v != null) { vol = Math.max(0, Math.min(1, +v)); if (master && !mute) master.gain.value = vol; save(); } return vol; },
    onChange(f) { subs.push(f); },
    get ready() { return !!ctx && ctx.state === 'running'; },
  };
  root.RSound = API;
})(typeof window !== 'undefined' ? window : globalThis);
