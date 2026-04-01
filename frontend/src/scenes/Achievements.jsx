import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ACHIEVEMENTS, loadAchievements } from '../game/achievements'

export default function Achievements() {
  const navigate  = useNavigate()
  const unlocked  = loadAchievements()
  const total     = ACHIEVEMENTS.length
  const doneCount = Object.keys(unlocked).length

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-dungeon-border">
        <button onClick={() => navigate('/')} className="text-gray-600 text-xs pixel">← ZURÜCK</button>
        <div className="pixel text-gold text-xs">ERRUNGENSCHAFTEN</div>
        <div className="pixel text-gray-600 text-xs">{doneCount}/{total}</div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span className="pixel" style={{ fontSize: '0.5rem' }}>FORTSCHRITT</span>
          <span className="pixel" style={{ fontSize: '0.5rem' }}>{Math.round((doneCount / total) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-dungeon-gray border border-dungeon-border overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Achievement grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 mt-4">
          {ACHIEVEMENTS.map((a, i) => {
            const isUnlocked = !!unlocked[a.id]
            const unlockedAt = unlocked[a.id]?.unlockedAt

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`
                  flex flex-col items-center gap-2 p-4 border-2 text-center
                  ${isUnlocked
                    ? 'border-gold bg-dungeon-dark shadow-md shadow-yellow-900/20'
                    : 'border-dungeon-border bg-dungeon-dark opacity-50'
                  }
                `}
              >
                <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                  {isUnlocked ? a.icon : '❓'}
                </div>
                <div className={`pixel text-center leading-snug ${isUnlocked ? 'text-gold-light' : 'text-gray-600'}`}
                  style={{ fontSize: '0.5rem' }}
                >
                  {isUnlocked ? a.title : '???'}
                </div>
                {isUnlocked && (
                  <div className="text-gray-600 text-center leading-snug" style={{ fontSize: '0.55rem' }}>
                    {a.desc}
                  </div>
                )}
                {isUnlocked && unlockedAt && (
                  <div className="text-gray-700 leading-none" style={{ fontSize: '0.5rem' }}>
                    {new Date(unlockedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
