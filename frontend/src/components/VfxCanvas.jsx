// Transparent canvas overlay for CombatScreen VFX (particles + floating text)
// Replaces DOM floating-number divs with canvas-rendered effects.

import { useEffect, useRef } from 'react'
import { createVfxState, spawnParticles, spawnFloatText, tickVfx } from '../game/vfx'

// Monster occupies roughly top-35% of the canvas, player area ~75%
const MONSTER_Y_RATIO = 0.32
const PLAYER_Y_RATIO  = 0.76

export default function VfxCanvas({ lastLogEntry }) {
  const canvasRef  = useRef(null)
  const stateRef   = useRef(createVfxState())
  const rafRef     = useRef(null)

  // Spawn effects whenever a new log entry arrives
  useEffect(() => {
    if (!lastLogEntry) return
    const canvas = canvasRef.current
    if (!canvas) return
    const s  = stateRef.current
    const cx = canvas.width  / 2
    const my = canvas.height * MONSTER_Y_RATIO
    const py = canvas.height * PLAYER_Y_RATIO
    const jitter = () => (Math.random() - 0.5) * 36

    switch (lastLogEntry.type) {
      case 'player_attack':
        spawnParticles(s, 'hit', cx + jitter(), my)
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx + jitter(), my - 22, '#ff8c00')
        break
      case 'player_special':
        spawnParticles(s, 'magic', cx, my)
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, my - 22, '#c39bd3')
        break
      case 'enemy_attack':
        spawnParticles(s, 'hit', cx + jitter(), py)
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, py - 18, '#e74c3c')
        break
      case 'player_blocked':
        spawnParticles(s, 'shield', cx + jitter(), py)
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, py - 18, '#3498db')
        if (lastLogEntry.heavy) spawnParticles(s, 'hit', cx, py, 5)
        break
      case 'player_grazed':
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, py - 18, '#f0c040')
        break
      case 'player_dodged':
        spawnFloatText(s, 'DODGE!', cx, py - 24, '#2ecc71')
        break
      case 'shield_counter':
        spawnParticles(s, 'shield', cx, py, 6)
        spawnFloatText(s, `\u{1F6E1} -${lastLogEntry.dmg}`, cx, py - 18, '#5dade2')
        break
      case 'shield_counter_dmg':
        spawnParticles(s, 'shield', cx + jitter(), my, 5)
        spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, my - 18, '#5dade2')
        break
      case 'status_tick':
        if (lastLogEntry.effect === 'poison' && lastLogEntry.target === 'player') {
          spawnParticles(s, 'poison', cx + jitter(), py, 7)
          spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, py - 18, '#2ecc71')
        }
        if (lastLogEntry.effect === 'burn' && lastLogEntry.target === 'monster') {
          spawnParticles(s, 'fire', cx + jitter(), my, 8)
          spawnFloatText(s, `-${lastLogEntry.dmg}`, cx, my - 18, '#e67e22')
        }
        break
      case 'status_apply':
        if (lastLogEntry.effect === 'poison')
          spawnParticles(s, 'poison', cx, py, 10)
        if (lastLogEntry.effect === 'burn')
          spawnParticles(s, 'fire',   cx, my, 10)
        break
      default: break
    }
  }, [lastLogEntry])

  // rAF draw loop
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      tickVfx(ctx, stateRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={520}
      style={{
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        45,
      }}
    />
  )
}
