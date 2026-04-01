import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PRESTIGE_UPGRADES, loadPrestige, buyPrestigeUpgrade } from '../game/prestige'

export default function Prestige() {
  const navigate = useNavigate()
  const [prestige, setPrestige] = useState(loadPrestige)
  const [flash, setFlash] = useState(null)

  function handleBuy(upgradeId) {
    if (buyPrestigeUpgrade(upgradeId)) {
      setPrestige(loadPrestige())
      setFlash(upgradeId)
      setTimeout(() => setFlash(null), 600)
    }
  }

  const points = prestige.points ?? 0

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => navigate('/')} className="text-gray-600 text-xs pixel">← ZURÜCK</button>
        <div className="pixel text-gold text-sm">PRESTIGE</div>
        <div className="pixel text-xs text-amber-400">⭐ {points}</div>
      </div>

      <p className="text-gray-600 text-xs text-center mb-5 leading-relaxed">
        Dauerhafte Boni — aktiv bei <span className="text-gray-500">jedem</span> Run.
        <br />Punkte durch Runs verdienen.
      </p>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {PRESTIGE_UPGRADES.map((upg, idx) => {
          const currentLevel = prestige[upg.id] ?? 0
          const isMaxed = currentLevel >= upg.maxLevel
          const cost = isMaxed ? null : upg.cost[currentLevel]
          const canAfford = !isMaxed && points >= cost

          return (
            <motion.div
              key={upg.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`flex items-center gap-4 border-2 px-4 py-4 transition-colors duration-300
                ${flash === upg.id
                  ? 'border-gold bg-yellow-950/60'
                  : isMaxed
                    ? 'border-green-900 bg-green-950/20'
                    : 'border-dungeon-border bg-dungeon-dark'}
              `}
            >
              <span className="text-2xl flex-shrink-0">{upg.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="pixel text-xs text-gold-light">{upg.title}</div>
                <div className="text-gray-500 text-xs mt-0.5 leading-snug">{upg.desc}</div>
                {/* Level indicator dots */}
                <div className="flex gap-1.5 mt-2">
                  {Array.from({ length: upg.maxLevel }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${i < currentLevel ? 'bg-gold' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
              </div>

              {isMaxed ? (
                <div className="pixel text-xs text-green-500 flex-shrink-0">✓ MAX</div>
              ) : (
                <button
                  onClick={() => handleBuy(upg.id)}
                  disabled={!canAfford}
                  className={`pixel text-xs border px-3 py-2 flex-shrink-0 transition-all active:scale-95
                    ${canAfford
                      ? 'border-gold text-gold-light hover:bg-yellow-950/40'
                      : 'border-gray-700 text-gray-600 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  ⭐{cost}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      <p className="text-gray-700 text-xs text-center mt-4 leading-relaxed">
        Punkte: ⌀1 pro 3 Etagen · +3 bei Sieg · +1–2 Meilenstein-Bonus
      </p>
    </div>
  )
}
