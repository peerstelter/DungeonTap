// Web Audio API synthesizer — no audio files, all procedural
let _ctx = null

function ctx() {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
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
  attack()  { tone({ freq: 280, freqEnd: 120, type: 'sawtooth', dur: 0.1,  vol: 0.35 }) },
  special() {
    tone({ freq: 440, type: 'sawtooth', dur: 0.15, vol: 0.4 })
    tone({ freq: 660, type: 'sawtooth', dur: 0.2,  vol: 0.3, delay: 0.08 })
    tone({ freq: 880, type: 'sine',     dur: 0.25, vol: 0.25, delay: 0.18 })
  },
  hit()     { noise({ dur: 0.12, vol: 0.5, cutoff: 600 }) },       // player takes damage
  block()   { tone({ freq: 180, type: 'square',   dur: 0.08, vol: 0.4 }) },
  dodge()   { tone({ freq: 350, freqEnd: 700, type: 'sine', dur: 0.09, vol: 0.2 }) },
  coin()    { tone({ freq: 880, freqEnd: 1320, type: 'sine', dur: 0.1, vol: 0.25 }) },
  heal()    {
    tone({ freq: 523, type: 'sine', dur: 0.1,  vol: 0.2 })
    tone({ freq: 659, type: 'sine', dur: 0.1,  vol: 0.2, delay: 0.09 })
    tone({ freq: 784, type: 'sine', dur: 0.15, vol: 0.2, delay: 0.18 })
  },
  victory() {
    [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]].forEach(([f, d]) =>
      tone({ freq: f, type: 'square', dur: 0.15, vol: 0.25, delay: d })
    )
  },
  death() {
    [[300, 0], [250, 0.1], [180, 0.2], [100, 0.32]].forEach(([f, d]) =>
      tone({ freq: f, type: 'sawtooth', dur: 0.12, vol: 0.3, delay: d })
    )
  },
  monsterDeath() {
    noise({ dur: 0.1, vol: 0.5, cutoff: 800 })
    tone({ freq: 350, freqEnd: 60, type: 'sawtooth', dur: 0.35, vol: 0.4, delay: 0.05 })
  },
  bossIntro() {
    // Ominous low drone + three impact hits
    tone({ freq: 55,  type: 'sawtooth', dur: 1.2,  vol: 0.35 })
    tone({ freq: 110, type: 'sawtooth', dur: 0.8,  vol: 0.20, delay: 0.1 })
    noise({ dur: 0.18, vol: 0.6, cutoff: 200, delay: 0.5 })
    noise({ dur: 0.18, vol: 0.6, cutoff: 200, delay: 0.85 })
    noise({ dur: 0.25, vol: 0.7, cutoff: 150, delay: 1.1 })
    tone({ freq: 80, freqEnd: 40, type: 'square', dur: 0.5, vol: 0.4, delay: 1.2 })
  },
  event() {
    tone({ freq: 660,  type: 'sine', dur: 0.08, vol: 0.2 })
    tone({ freq: 880,  type: 'sine', dur: 0.1,  vol: 0.2, delay: 0.07 })
    tone({ freq: 1100, type: 'sine', dur: 0.12, vol: 0.15, delay: 0.15 })
  },
  trap() {
    noise({ dur: 0.06, vol: 0.6, cutoff: 1200 })
    tone({ freq: 220, freqEnd: 110, type: 'sawtooth', dur: 0.2, vol: 0.35, delay: 0.04 })
  },
  shieldCounter() {
    tone({ freq: 800, freqEnd: 400, type: 'square',   dur: 0.08, vol: 0.4 })
    tone({ freq: 180, freqEnd: 100, type: 'sawtooth', dur: 0.15, vol: 0.45, delay: 0.06 })
  },
}
