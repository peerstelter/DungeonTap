// Procedural canvas dungeon background — one per biome.
// Drawn once on mount / biome change; purely decorative.

import { useEffect, useRef } from 'react'

const CFG = {
  cave: {
    sky1: '#0a0a0f', sky2: '#14141e',
    brick: '#1c1c2c', mortar: '#0e0e18',
    floor1: '#1a1a2a', floor2: '#121220',
    torch: '#c0660a',
  },
  crypt: {
    sky1: '#0f0a1a', sky2: '#1a1028',
    brick: '#1c1428', mortar: '#0f0a1a',
    floor1: '#1a1228', floor2: '#100a1c',
    torch: '#6b2fa0',
  },
  abyss: {
    sky1: '#050510', sky2: '#080c18',
    brick: '#0d1525', mortar: '#06090f',
    floor1: '#0d1525', floor2: '#060a14',
    torch: '#1e4a8a',
  },
  inferno: {
    sky1: '#1a0500', sky2: '#280800',
    brick: '#2a0a00', mortar: '#180500',
    floor1: '#2a0800', floor2: '#1a0500',
    torch: '#c0390a',
  },
}

function hexAlpha(hex, alpha) {
  // Appends 2-digit alpha hex to 6-char hex color
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return hex + a
}

function drawBiome(ctx, biome, w, h) {
  const c = CFG[biome] ?? CFG.cave

  // ── Background gradient ──────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, c.sky1)
  bgGrad.addColorStop(1, c.sky2)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // ── Stone brick wall (top 65%) ───────────────────────────────────────────
  const wallH = h * 0.65
  const bW = 38, bH = 19
  for (let row = 0; row < Math.ceil(wallH / bH) + 1; row++) {
    const offset = (row % 2) * (bW / 2)
    for (let col = -1; col <= Math.ceil(w / bW) + 1; col++) {
      const bx = col * bW + offset
      const by = row * bH
      // Slight brightness variation per brick (deterministic)
      const brightness = ((row * 7 + col * 13) % 5) / 40
      ctx.fillStyle = shiftBrightness(c.brick, brightness)
      ctx.fillRect(bx + 1, by + 1, bW - 2, bH - 2)
    }
    // Horizontal mortar line
    ctx.fillStyle = c.mortar
    ctx.fillRect(0, row * bH, w, 1)
  }
  // Vertical mortar lines (alternating offset per row)
  for (let row = 0; row < Math.ceil(wallH / bH) + 1; row++) {
    const offset = (row % 2) * (bW / 2)
    for (let col = -1; col <= Math.ceil(w / bW) + 1; col++) {
      ctx.fillStyle = c.mortar
      ctx.fillRect(col * bW + offset, row * bH, 1, bH)
    }
  }

  // ── Floor ────────────────────────────────────────────────────────────────
  const floorY = h * 0.65
  // Floor accent strip
  ctx.fillStyle = c.torch  // narrow colored strip = ground line
  ctx.fillRect(0, floorY, w, 2)
  // Floor fill
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h)
  floorGrad.addColorStop(0, c.floor1)
  floorGrad.addColorStop(1, c.floor2)
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, floorY + 2, w, h - floorY - 2)
  // Floor tile grid
  ctx.fillStyle = c.mortar
  const tileW = 36, tileH = 22
  for (let x = 0; x < w; x += tileW) ctx.fillRect(x, floorY + 2, 1, h)
  for (let y = floorY + 2; y < h; y += tileH) ctx.fillRect(0, y, w, 1)

  // ── Torch glow (two wall sconces) ───────────────────────────────────────
  const torchY  = wallH * 0.45
  const torchXL = w * 0.14
  const torchXR = w * 0.86
  const torchR  = w * 0.38
  ;[torchXL, torchXR].forEach(tx => {
    const g = ctx.createRadialGradient(tx, torchY, 0, tx, torchY, torchR)
    g.addColorStop(0,   hexAlpha(c.torch, 0.28))
    g.addColorStop(0.4, hexAlpha(c.torch, 0.12))
    g.addColorStop(1,   hexAlpha(c.torch, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, wallH)
  })

  // ── Biome-specific decorations ───────────────────────────────────────────
  if (biome === 'crypt') {
    // Gothic arch at top-center
    ctx.save()
    ctx.strokeStyle = hexAlpha('#6b2fa0', 0.6)
    ctx.lineWidth   = 2.5
    const ax = w / 2, aw = 90, ah = 55
    ctx.beginPath()
    ctx.moveTo(ax - aw / 2, ah)
    ctx.lineTo(ax - aw / 2, ah * 0.45)
    ctx.quadraticCurveTo(ax - aw / 2, 0, ax, 4)
    ctx.quadraticCurveTo(ax + aw / 2, 0, ax + aw / 2, ah * 0.45)
    ctx.lineTo(ax + aw / 2, ah)
    ctx.stroke()
    // Purple wisps
    for (let i = 0; i < 4; i++) {
      const wx = w * (0.15 + i * 0.23)
      const wy = wallH * (0.25 + (i % 2) * 0.12)
      const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 18)
      wg.addColorStop(0, 'rgba(107,47,160,0.35)')
      wg.addColorStop(1, 'rgba(107,47,160,0)')
      ctx.fillStyle = wg
      ctx.beginPath()
      ctx.ellipse(wx, wy, 18, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (biome === 'abyss') {
    // Stars in background
    ctx.fillStyle = '#4a6aaa'
    for (let i = 0; i < 35; i++) {
      const sx = ((i * 137 + 29) % w)
      const sy = ((i * 79  + 11) % (wallH * 0.9))
      const sr = 0.5 + (i % 3) * 0.4
      ctx.globalAlpha = 0.4 + (i % 5) * 0.1
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    // Blue void glow from below floor
    const voidGrad = ctx.createRadialGradient(w / 2, floorY + 30, 0, w / 2, floorY + 30, w * 0.55)
    voidGrad.addColorStop(0, 'rgba(30,74,138,0.45)')
    voidGrad.addColorStop(1, 'rgba(30,74,138,0)')
    ctx.fillStyle = voidGrad
    ctx.fillRect(0, floorY, w, h - floorY)
  }

  if (biome === 'inferno') {
    // Lava cracks in floor with orange glow
    const lavaGrad = ctx.createLinearGradient(0, floorY, 0, h)
    lavaGrad.addColorStop(0,   'rgba(192,57,10,0.15)')
    lavaGrad.addColorStop(0.4, 'rgba(192,57,10,0.45)')
    lavaGrad.addColorStop(1,   'rgba(192,57,10,0.7)')
    ctx.fillStyle = lavaGrad
    ctx.fillRect(0, floorY + 2, w, h - floorY - 2)
    // Crack lines
    ctx.save()
    ctx.strokeStyle = 'rgba(230,126,34,0.7)'
    ctx.lineWidth   = 1.5
    const cracks = [
      [[w*0.28, floorY+4], [w*0.38, floorY+14], [w*0.33, floorY+24]],
      [[w*0.55, floorY+6], [w*0.65, floorY+18]],
      [[w*0.72, floorY+3], [w*0.68, floorY+12], [w*0.75, floorY+22]],
    ]
    cracks.forEach(pts => {
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
      ctx.stroke()
    })
    ctx.restore()
  }

  // ── Vignette — darken edges to focus on center ───────────────────────────
  const vig = ctx.createRadialGradient(w / 2, h * 0.38, h * 0.08, w / 2, h * 0.38, w * 0.85)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.72)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

// Slightly shift a hex color's brightness
function shiftBrightness(hex, delta) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const clamp = v => Math.min(255, Math.max(0, Math.round(v + v * delta)))
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`
}

export default function BiomeBg({ biome }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawBiome(ctx, biome ?? 'cave', canvas.width, canvas.height)
  }, [biome])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={520}
      style={{
        position: 'absolute',
        inset:    0,
        width:    '100%',
        height:   '100%',
        zIndex:   0,
      }}
    />
  )
}
