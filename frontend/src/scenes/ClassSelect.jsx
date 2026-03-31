import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CLASSES } from '../game/classes'

// Pixel-art SVG icons per class
const CLASS_ICONS = {
  warrior: (
    <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
      {/* shield body */}
      <rect x="3" y="2" width="10" height="10" fill="#2980b9"/>
      <rect x="4" y="3" width="8"  height="8"  fill="#3498db"/>
      {/* shield point */}
      <rect x="4" y="12" width="8" height="1" fill="#2980b9"/>
      <rect x="5" y="13" width="6" height="1" fill="#2980b9"/>
      <rect x="6" y="14" width="4" height="1" fill="#2980b9"/>
      <rect x="7" y="15" width="2" height="1" fill="#2980b9"/>
      {/* cross emblem */}
      <rect x="7" y="4" width="2" height="6" fill="#c9a227"/>
      <rect x="5" y="6" width="6" height="2" fill="#c9a227"/>
      {/* rim */}
      <rect x="3" y="2" width="1" height="10" fill="#1a6090"/>
      <rect x="12" y="2" width="1" height="10" fill="#1a6090"/>
      <rect x="3" y="2" width="10" height="1" fill="#1a6090"/>
    </svg>
  ),
  mage: (
    <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
      {/* staff */}
      <rect x="7" y="5" width="2" height="11" fill="#8b4513"/>
      <rect x="8" y="5" width="1" height="11" fill="#a0522d"/>
      {/* orb */}
      <rect x="5" y="2" width="6" height="6" fill="#8e44ad"/>
      <rect x="4" y="3" width="1" height="4" fill="#8e44ad"/>
      <rect x="11" y="3" width="1" height="4" fill="#8e44ad"/>
      <rect x="5" y="1" width="6" height="1" fill="#8e44ad"/>
      <rect x="5" y="8" width="6" height="1" fill="#8e44ad"/>
      {/* orb glow */}
      <rect x="6" y="3" width="2" height="2" fill="#c39bd3"/>
      <rect x="6" y="3" width="1" height="1" fill="#e8d5f0"/>
      {/* orb shimmer */}
      <rect x="9" y="5" width="1" height="1" fill="#c39bd3"/>
      {/* sparkles */}
      <rect x="2"  y="1"  width="1" height="1" fill="#f0c040"/>
      <rect x="13" y="2"  width="1" height="1" fill="#f0c040"/>
      <rect x="1"  y="5"  width="1" height="1" fill="#c39bd3"/>
      <rect x="14" y="6"  width="1" height="1" fill="#c39bd3"/>
    </svg>
  ),
  rogue: (
    <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
      {/* blade */}
      <rect x="9" y="1"  width="2" height="1" fill="#c0c0c0"/>
      <rect x="8" y="2"  width="3" height="1" fill="#d0d0d0"/>
      <rect x="7" y="3"  width="3" height="1" fill="#d8d8d8"/>
      <rect x="6" y="4"  width="3" height="1" fill="#e0e0e0"/>
      <rect x="5" y="5"  width="3" height="1" fill="#d0d0d0"/>
      <rect x="4" y="6"  width="3" height="1" fill="#c0c0c0"/>
      <rect x="3" y="7"  width="3" height="1" fill="#b0b0b0"/>
      {/* edge shine */}
      <rect x="9" y="2"  width="1" height="1" fill="#ffffff"/>
      <rect x="8" y="3"  width="1" height="1" fill="#f0f0f0"/>
      <rect x="7" y="4"  width="1" height="1" fill="#ffffff"/>
      {/* guard */}
      <rect x="2" y="8"  width="7" height="2" fill="#c9a227"/>
      <rect x="2" y="8"  width="7" height="1" fill="#f0c040"/>
      {/* handle */}
      <rect x="3" y="10" width="2" height="5" fill="#6e3b1e"/>
      <rect x="3" y="10" width="1" height="5" fill="#8b4d26"/>
      {/* pommel */}
      <rect x="2" y="14" width="4" height="2" fill="#c9a227"/>
      {/* second dagger (shadow) */}
      <rect x="10" y="4"  width="1" height="1" fill="#888"/>
      <rect x="11" y="5"  width="1" height="1" fill="#888"/>
      <rect x="12" y="6"  width="1" height="1" fill="#888"/>
      <rect x="11" y="4"  width="1" height="1" fill="#aaa"/>
      <rect x="12" y="5"  width="1" height="1" fill="#aaa"/>
      <rect x="13" y="6"  width="1" height="1" fill="#aaa"/>
    </svg>
  ),
}

export default function ClassSelect() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  function startGame() {
    if (!selected) return
    sessionStorage.setItem('playerClass', selected)
    navigate('/game')
  }

  return (
    <div className="flex flex-col h-full safe-top safe-bottom px-4 py-8 bg-dungeon">
      <button onClick={() => navigate('/')} className="text-gray-500 text-sm mb-6 text-left pixel">
        ← ZURÜCK
      </button>

      <h2 className="pixel text-gold text-base text-center mb-8">KLASSE WÄHLEN</h2>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {Object.entries(CLASSES).map(([id, cls]) => (
          <motion.button
            key={id}
            onClick={() => setSelected(id)}
            whileTap={{ scale: 0.97 }}
            className={`
              p-4 border-2 text-left transition-all duration-150
              ${selected === id
                ? 'border-gold bg-dungeon-gray'
                : 'border-dungeon-border bg-dungeon-dark hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-1 border ${selected === id ? 'border-gold' : 'border-dungeon-border'}`}
                style={{ imageRendering: 'pixelated' }}>
                {CLASS_ICONS[id]}
              </div>
              <div>
                <div className="pixel text-gold-light text-xs">{cls.name}</div>
                <div className="text-gray-400 text-xs mt-1">{cls.tagline}</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <Stat label="HP"  value={cls.baseHp}  max={150} color="bg-red-700"    />
              <Stat label="ATK" value={cls.baseAtk} max={30}  color="bg-orange-600" />
              <Stat label="DEF" value={cls.baseDef} max={20}  color="bg-blue-700"   />
            </div>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">{cls.special}</p>
          </motion.button>
        ))}
      </div>

      <button
        onClick={startGame}
        disabled={!selected}
        className={`
          mt-6 py-4 pixel text-sm tracking-wider border-2 transition-all duration-150
          ${selected
            ? 'bg-dungeon-gold text-dungeon-black border-dungeon-gold-light active:scale-95'
            : 'bg-dungeon-dark text-gray-700 border-dungeon-border cursor-not-allowed'
          }
        `}
      >
        ABENTEUER BEGINNEN
      </button>
    </div>
  )
}

function Stat({ label, value, max, color }) {
  return (
    <div className="flex-1">
      <div className="text-gray-600 mb-1">{label}</div>
      <div className="bar-track">
        <div className={`bar-fill ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}
