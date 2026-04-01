import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadStats, mostPlayedClass } from '../game/stats'
import { CLASSES } from '../game/classes'

export default function Stats() {
  const navigate = useNavigate()
  const s = loadStats()

  const topClass = mostPlayedClass(s.classCounts)
  const topCls   = topClass ? CLASSES[topClass] : null
  const winRate  = s.totalRuns
    ? Math.round((s.totalWins ?? 0) / s.totalRuns * 100)
    : 0

  const rows = [
    { icon: '🎮', label: 'Runs gesamt',         value: s.totalRuns   ?? 0 },
    { icon: '🏅', label: 'Siege',               value: s.totalWins   ?? 0 },
    { icon: '💀', label: 'Tode',                value: s.totalDeaths ?? 0 },
    { icon: '📊', label: 'Siegesrate',          value: `${winRate}%`      },
    { icon: '🏰', label: 'Höchste Etage',       value: s.maxFloor    ?? 0 },
    { icon: '⚔️', label: 'Kills gesamt',         value: s.totalKills  ?? 0 },
    { icon: '💰', label: 'Gold gesamt',          value: s.totalGold   ?? 0 },
    { icon: '🧙', label: 'Lieblingsklasse',      value: topCls ? `${topCls.icon} ${topCls.name}` : '–' },
  ]

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-600 text-xs pixel">← ZURÜCK</button>
        <div className="pixel text-gold text-sm flex-1 text-center">STATISTIKEN</div>
        <div className="w-14" />
      </div>

      {s.totalRuns ? (
        <div className="grid grid-cols-2 gap-3">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-dungeon-border bg-dungeon-dark px-4 py-4 text-center"
            >
              <div className="text-2xl mb-1">{row.icon}</div>
              <div className="pixel text-gold text-sm">{row.value}</div>
              <div className="text-gray-600 text-xs mt-1 leading-tight">{row.label}</div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl opacity-20">📊</div>
          <div className="pixel text-gray-600 text-xs leading-relaxed">
            Noch keine Statistiken.
            <br />Spiele deinen ersten Run!
          </div>
          <button
            onClick={() => navigate('/class-select')}
            className="mt-2 py-3 px-6 pixel text-xs border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95"
          >
            JETZT SPIELEN
          </button>
        </div>
      )}

      {s.classCounts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 border border-dungeon-border bg-dungeon-dark px-4 py-3"
        >
          <div className="text-gray-700 pixel text-xs mb-2" style={{ fontSize: '0.5rem' }}>
            KLASSEN-VERTEILUNG
          </div>
          <div className="flex gap-3">
            {Object.entries(s.classCounts).map(([cls, count]) => {
              const c = CLASSES[cls]
              return c ? (
                <div key={cls} className="flex items-center gap-1.5 text-xs">
                  <span>{c.icon}</span>
                  <span className="text-gray-400">{c.name}</span>
                  <span className="pixel text-gold-light">{count}×</span>
                </div>
              ) : null
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
