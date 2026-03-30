import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CLASSES } from '../game/classes'

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
      <button
        onClick={() => navigate('/')}
        className="text-gray-500 text-sm mb-6 text-left pixel"
      >
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{cls.icon}</span>
              <div>
                <div className="pixel text-gold-light text-xs">{cls.name}</div>
                <div className="text-gray-400 text-xs mt-1">{cls.tagline}</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-3">
              <Stat label="HP" value={cls.baseHp} max={150} color="bg-red-700" />
              <Stat label="ATK" value={cls.baseAtk} max={30} color="bg-orange-600" />
              <Stat label="DEF" value={cls.baseDef} max={20} color="bg-blue-700" />
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
        <div
          className={`bar-fill ${color}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  )
}
