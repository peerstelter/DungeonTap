// Canvas-based animated monster sprite — Option B: Hybrid Canvas 2D
// Replaces MonsterSprite.jsx inside CombatScreen only.
// Animations: idle (bob), attack (lunge), hurt (shake+flash), death (static, Framer Motion handles it)

import { useEffect, useRef } from 'react'
import { getSpriteRects } from '../game/spriteData'

function drawRects(ctx, rects, cell) {
  for (const [x, y, w, h, fill] of rects) {
    ctx.fillStyle = fill
    ctx.fillRect(x * cell, y * cell, w * cell, h * cell)
  }
}

export default function AnimatedSprite({ id, anim = 'idle', size = 96 }) {
  const canvasRef = useRef(null)
  const tickRef   = useRef(0)

  useEffect(() => {
    tickRef.current = 0
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    const rects = getSpriteRects(id)
    const cell  = size / 16

    const interval = setInterval(() => {
      const tick = ++tickRef.current
      ctx.clearRect(0, 0, size, size)
      ctx.save()

      if (anim === 'idle') {
        // Gentle vertical bob
        ctx.translate(0, Math.sin(tick * 0.05) * 1.5)
      } else if (anim === 'attack') {
        // Quick lunge toward player (left), then snap back
        const phase = tick % 28
        const shift = phase < 8  ? -(phase * 1.8)
                    : phase < 16 ? -((16 - phase) * 1.8)
                    : 0
        ctx.translate(shift, 0)
      } else if (anim === 'hurt') {
        // Horizontal shake — dampens over time
        const shake = Math.sin(tick * 2.5) * Math.max(0, 3 - tick * 0.3)
        ctx.translate(shake, 0)
      }
      // 'death': no transform — parent (Framer Motion) handles the visual

      drawRects(ctx, rects, cell)

      // Hurt: white overlay that fades quickly
      if (anim === 'hurt') {
        const alpha = Math.max(0, 0.85 - tick * 0.07)
        if (alpha > 0) {
          ctx.globalCompositeOperation = 'source-atop'
          ctx.fillStyle = `rgba(255,255,255,${alpha})`
          ctx.fillRect(0, 0, size, size)
          ctx.globalCompositeOperation = 'source-over'
        }
      }

      ctx.restore()
    }, 16) // ~60 fps

    return () => clearInterval(interval)
  }, [id, anim, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}
