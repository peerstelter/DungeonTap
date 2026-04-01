// Web Audio API synthesizer — no audio files, all procedural
// Haptic feedback runs alongside every sfx call via navigator.vibrate()

function vibe(pattern) {
  // Only on touch devices that support the Vibration API
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

let _ctx = null

// Must be called from a direct DOM event handler (click / pointerdown / touchstart).
// Creates the AudioContext and plays a 1-sample silent buffer — the only reliable
// way to unlock Web Audio on Chrome, Firefox and Safari desktop + mobile.
export function unlockAudio() {
  if (_ctx && _ctx.state === 'running') return
  if (!_ctx) _ctx = new AudioContext()
  _ctx.resume().then(() => {
    // Silent 1-sample buffer — "tricks" browsers that need an actual source node
    const buf = _ctx.createBuffer(1, 1, _ctx.sampleRate)
    const src = _ctx.createBufferSource()
    src.buffer = buf
    src.connect(_ctx.destination)
    src.start(0)
  }).catch(() => {})
}

function ctx() {
  if (!_ctx) _ctx = new AudioContext()
  // resume() is a no-op if already running; non-awaited is fine after unlock
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {})
  return _ctx
}

function tone({ freq = 440, freqEnd = null, type = 'square', dur = 0.12, vol = 0.3, delay = 0 }) {
  const c = ctx()
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t)
  osc.stop(t + dur + 0.01)
}

function noise({ dur = 0.1, vol = 0.3, delay = 0, cutoff = 1000 }) {
  const c = ctx()
  const t = c.currentTime + delay
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = cutoff
  filter.Q.value = 0.5
  const gain = c.createGain()
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
  src.stop(t + dur + 0.01)
}

export const sfx = {
  attack() {
    // Short crisp tap — sword swing
    vibe([25])
    tone({ freq: 280, freqEnd: 120, type: 'sawtooth', dur: 0.1, vol: 0.35 })
  },
  special() {
    // Charging buildup → strong final burst (matches 3-tone sound)
    vibe([20, 15, 35, 15, 80])
    tone({ freq: 440, type: 'sawtooth', dur: 0.15, vol: 0.4 })
    tone({ freq: 660, type: 'sawtooth', dur: 0.2,  vol: 0.3, delay: 0.08 })
    tone({ freq: 880, type: 'sine',     dur: 0.25, vol: 0.25, delay: 0.18 })
  },
  hit() {
    // Heavy thud — player takes damage
    vibe([70])
    noise({ dur: 0.12, vol: 0.5, cutoff: 600 })
  },
  block() {
    // Two sharp taps — shield deflect
    vibe([15, 10, 20])
    tone({ freq: 180, type: 'square', dur: 0.08, vol: 0.4 })
  },
  dodge() {
    // Tiny flick — barely grazed
    vibe([8])
    tone({ freq: 350, freqEnd: 700, type: 'sine', dur: 0.09, vol: 0.2 })
  },
  coin() {
    // Soft reward tap
    vibe([15])
    tone({ freq: 880, freqEnd: 1320, type: 'sine', dur: 0.1, vol: 0.25 })
  },
  heal() {
    // Three gentle rising pulses — warmth of healing
    vibe([10, 8, 10, 8, 15])
    tone({ freq: 523, type: 'sine', dur: 0.1,  vol: 0.2 })
    tone({ freq: 659, type: 'sine', dur: 0.1,  vol: 0.2, delay: 0.09 })
    tone({ freq: 784, type: 'sine', dur: 0.15, vol: 0.2, delay: 0.18 })
  },
  victory() {
    // Joyful ascending celebration (4 beats)
    vibe([25, 12, 25, 12, 25, 12, 80])
    ;[[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]].forEach(([f, d]) =>
      tone({ freq: f, type: 'square', dur: 0.15, vol: 0.25, delay: d })
    )
  },
  death() {
    // Long dying rattle — progressive weight
    vibe([40, 25, 70, 40, 180])
    ;[[300, 0], [250, 0.1], [180, 0.2], [100, 0.32]].forEach(([f, d]) =>
      tone({ freq: f, type: 'sawtooth', dur: 0.12, vol: 0.3, delay: d })
    )
  },
  monsterDeath() {
    // Quick impact + dissolve rumble
    vibe([18, 12, 55])
    noise({ dur: 0.1, vol: 0.5, cutoff: 800 })
    tone({ freq: 350, freqEnd: 60, type: 'sawtooth', dur: 0.35, vol: 0.4, delay: 0.05 })
  },
  bossIntro() {
    // Dramatic 3-beat warning — synced to the three noise hits in the audio
    vibe([90, 45, 90, 45, 250])
    tone({ freq: 55,  type: 'sawtooth', dur: 1.2,  vol: 0.35 })
    tone({ freq: 110, type: 'sawtooth', dur: 0.8,  vol: 0.20, delay: 0.1 })
    noise({ dur: 0.18, vol: 0.6, cutoff: 200, delay: 0.5 })
    noise({ dur: 0.18, vol: 0.6, cutoff: 200, delay: 0.85 })
    noise({ dur: 0.25, vol: 0.7, cutoff: 150, delay: 1.1 })
    tone({ freq: 80, freqEnd: 40, type: 'square', dur: 0.5, vol: 0.4, delay: 1.2 })
  },
  midBoss() {
    // Slightly lighter than full boss — two beats
    vibe([65, 35, 65, 35, 140])
    tone({ freq: 110, type: 'sawtooth', dur: 0.8,  vol: 0.30 })
    noise({ dur: 0.15, vol: 0.5, cutoff: 300, delay: 0.4 })
    noise({ dur: 0.2,  vol: 0.6, cutoff: 200, delay: 0.7 })
    tone({ freq: 90, freqEnd: 50, type: 'square', dur: 0.4, vol: 0.35, delay: 0.8 })
  },
  event() {
    // Three curious soft taps — mystery
    vibe([10, 10, 10])
    tone({ freq: 660,  type: 'sine', dur: 0.08, vol: 0.2 })
    tone({ freq: 880,  type: 'sine', dur: 0.1,  vol: 0.2, delay: 0.07 })
    tone({ freq: 1100, type: 'sine', dur: 0.12, vol: 0.15, delay: 0.15 })
  },
  trap() {
    // Single sharp jolt — pain!
    vibe([120])
    noise({ dur: 0.06, vol: 0.6, cutoff: 1200 })
    tone({ freq: 220, freqEnd: 110, type: 'sawtooth', dur: 0.2, vol: 0.35, delay: 0.04 })
  },
  shieldCounter() {
    // Snap + delayed counter hit
    vibe([15, 10, 55])
    tone({ freq: 800, freqEnd: 400, type: 'square',   dur: 0.08, vol: 0.4 })
    tone({ freq: 180, freqEnd: 100, type: 'sawtooth', dur: 0.15, vol: 0.45, delay: 0.06 })
  },
  poison() {
    // Slow creeping two-pulse sting
    vibe([18, 50, 18])
    tone({ freq: 220, freqEnd: 180, type: 'sine', dur: 0.15, vol: 0.2 })
    tone({ freq: 180, freqEnd: 140, type: 'sine', dur: 0.15, vol: 0.15, delay: 0.12 })
  },
  burn() {
    // Three quick fire crackle taps
    vibe([10, 10, 10])
    noise({ dur: 0.1, vol: 0.35, cutoff: 1500 })
    tone({ freq: 440, freqEnd: 220, type: 'sawtooth', dur: 0.12, vol: 0.2, delay: 0.05 })
  },
}
