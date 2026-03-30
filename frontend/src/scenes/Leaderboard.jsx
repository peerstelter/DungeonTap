import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CLASSES } from '../game/classes'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [tab, setTab] = useState('global') // 'global' | 'daily'

  useEffect(() => {
    setLoading(true)
    setOffline(false)
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => { if (!r.ok) throw new Error('not ok'); return r.json() })
      .then(data => { setScores(data); setLoading(false) })
      .catch(() => { setScores(MOCK_SCORES); setOffline(true); setLoading(false) })
  }, [tab])

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-500 pixel text-xs">←</button>
        <h2 className="pixel text-gold text-sm">BESTENLISTE</h2>
      </div>

      {offline && (
        <div className="mb-3 px-3 py-2 border border-yellow-900 bg-yellow-950 text-yellow-600 text-xs">
          ⚠ Kein Backend – zeige Beispieldaten
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {['global', 'daily'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true) }}
            className={`flex-1 py-2 pixel text-xs border transition-all ${
              tab === t ? 'border-gold text-gold bg-dungeon-gray' : 'border-dungeon-border text-gray-600'
            }`}
          >
            {t === 'global' ? 'GLOBAL' : 'DAILY'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel text-gray-600 text-xs animate-pulse">LÄDT...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {scores.map((entry, i) => (
            <motion.div
              key={entry.id ?? i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 border border-dungeon-border bg-dungeon-dark"
            >
              <span className={`pixel text-xs w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-500' : 'text-gray-600'}`}>
                {i + 1}
              </span>
              <span className="text-lg">{CLASSES[entry.class]?.icon ?? '⚔️'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{entry.name}</div>
                <div className="text-xs text-gray-500">
                  Etage {entry.floor} · {entry.xp} XP
                </div>
              </div>
              <div className="pixel text-xs text-gold-light">{entry.score}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const MOCK_SCORES = [
  { id: 1, name: 'Peer', class: 'rogue',   floor: 14, xp: 420, score: 1200 },
  { id: 2, name: 'Alex', class: 'warrior', floor: 11, xp: 310, score: 980  },
  { id: 3, name: 'Sam',  class: 'mage',    floor: 9,  xp: 260, score: 820  },
  { id: 4, name: 'Max',  class: 'rogue',   floor: 7,  xp: 190, score: 640  },
  { id: 5, name: 'Kim',  class: 'mage',    floor: 5,  xp: 120, score: 430  },
]
