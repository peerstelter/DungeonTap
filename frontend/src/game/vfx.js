// Canvas VFX particle system — no React, pure JS
// Used by VfxCanvas.jsx

export function createVfxState() {
  return { particles: [], floats: [] }
}

const PALETTES = {
  hit:    ['#ff8c00', '#ffd700', '#ff6040'],
  magic:  ['#c39bd3', '#9b59b6', '#e8d5ff', '#d980ff'],
  poison: ['#27ae60', '#2ecc71', '#a8e6cf'],
  fire:   ['#e74c3c', '#e67e22', '#f39c12', '#ff5500'],
  coin:   ['#ffd700', '#c9a227', '#ffec80'],
  heal:   ['#2ecc71', '#27ae60', '#c8ffc8'],
  shield: ['#3498db', '#5dade2', '#aed6f1'],
}

export function spawnParticles(state, type, x, y, count) {
  const palette = PALETTES[type] ?? PALETTES.hit
  const n = count ?? (type === 'magic' ? 14 : 9)
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.8
    const speed = 1.5 + Math.random() * 3
    const upBias = type === 'coin' ? 0 : -1.2
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + upBias,
      r:  2 + Math.random() * 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      life:    35 + Math.floor(Math.random() * 25),
      maxLife: 60,
    })
  }
}

export function spawnFloatText(state, text, x, y, color) {
  state.floats.push({
    text,
    x,
    y: y - 5,
    vy:      -1.4,
    color,
    life:    52,
    maxLife: 52,
    fontSize: 13,
  })
}

export function tickVfx(ctx, state) {
  // Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x  += p.vx
    p.y  += p.vy
    p.vy += 0.14  // gravity
    p.vx *= 0.97  // drag
    p.life--
    if (p.life <= 0) { state.particles.splice(i, 1); continue }
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle   = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, Math.max(0.5, p.r * alpha), 0, Math.PI * 2)
    ctx.fill()
  }

  // Floating texts
  ctx.textBaseline = 'middle'
  for (let i = state.floats.length - 1; i >= 0; i--) {
    const f = state.floats[i]
    f.y   += f.vy
    f.vy  *= 0.94  // slow down
    f.life--
    if (f.life <= 0) { state.floats.splice(i, 1); continue }
    const alpha = f.life / f.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle   = f.color
    ctx.font        = `bold ${f.fontSize}px monospace`
    ctx.textAlign   = 'center'
    ctx.fillText(f.text, f.x, f.y)
  }

  ctx.globalAlpha = 1
}
