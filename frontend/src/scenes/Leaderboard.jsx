import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CLASSES } from '../game/classes'

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-orange-500']
const RANK_ICONS  = ['🥇', '🥈', '🥉']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [scores, setScores]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [offline, setOffline]       = useState(false)
  const [tab, setTab]               = useState('global')
  const [refreshKey, setRefreshKey] = useState(0)

  // Highlight the run just submitted
  const lastRunId = Number(sessionStorage.getItem('lastRunId') || 0)

  const todayLabel = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })

  function getISOWeek() {
    const date = new Date()
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }
  const weekLabel = `KW${getISOWeek()}`

  const load = useCallback(() => {
    setLoading(true)
    setOffline(false)
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setScores(data); setLoading(false) })
      .catch(() => { setScores(MOCK_SCORES); setOffline(true); setLoading(false) })
  }, [tab])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="text-gray-500 pixel text-xs">←</button>
        <h2 className="pixel text-gold text-sm flex-1">BESTENLISTE</h2>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="text-gray-600 hover:text-gray-400 transition-colors text-xl leading-none disabled:opacity-30"
          title="Aktualisieren"
        >
          ↻
        </button>
      </div>

      {/* Offline banner */}
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="px-3 py-2 border border-yellow-900 bg-yellow-950/50 text-yellow-600 text-xs">
              ⚠ Offline – Beispieldaten werden angezeigt
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'global', label: 'GLOBAL' },
          { id: 'daily',  label: `DAILY · ${todayLabel}` },
          { id: 'weekly', label: `WOCHE · ${weekLabel}` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 pixel text-xs border transition-all ${
              tab === t.id
                ? 'border-gold text-gold bg-dungeon-gray'
                : 'border-dungeon-border text-gray-600 hover:border-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      {!loading && scores.length > 0 && (
        <div className="flex items-center gap-2 px-3 mb-1">
          <span className="w-7" />
          <span className="w-7" />
          <span className="flex-1 pixel text-xs text-gray-700">NAME</span>
          <span className="w-16 text-right pixel text-xs text-gray-700">ETG / ⚔</span>
          <span className="w-16 text-right pixel text-xs text-gray-700">SCORE</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="pixel text-gray-600 text-xs animate-pulse">LÄDT...</div>
        </div>
      ) : scores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl opacity-20">🏰</div>
          <div className="pixel text-gray-600 text-xs leading-relaxed">
            {tab === 'daily'
              ? 'Noch keine Runs heute.\nSei der Erste!'
              : tab === 'weekly'
                ? `Noch keine Runs diese Woche (${weekLabel}).\nSei der Erste!`
                : 'Noch keine Einträge.'}
          </div>
          <button
            onClick={() => navigate('/class-select')}
            className="mt-2 py-3 px-6 pixel text-xs border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95"
          >
            JETZT SPIELEN
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {scores.map((entry, i) => {
              const isOwn = entry.id === lastRunId
              const cls   = CLASSES[entry.class]

              return (
                <motion.div
                  key={entry.id ?? i}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.5) }}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 border transition-all
                    ${isOwn
                      ? 'border-gold bg-dungeon-gray shadow-md shadow-yellow-900/20'
                      : 'border-dungeon-border bg-dungeon-dark'
                    }
                  `}
                >
                  {/* Rank */}
                  <span className={`pixel text-xs w-7 text-center ${RANK_COLORS[i] ?? 'text-gray-700'}`}>
                    {i < 3 ? RANK_ICONS[i] : i + 1}
                  </span>

                  {/* Class icon */}
                  <span className="text-base w-7 text-center">{cls?.icon ?? '⚔️'}</span>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate font-medium ${isOwn ? 'text-gold-light' : 'text-white'}`}>
                      {entry.name}
                      {isOwn && <span className="pixel text-gold text-xs ml-2">← du</span>}
                    </div>
                    <div className="text-xs text-gray-600 flex gap-1.5 items-center">
                      <span>{cls?.name ?? entry.class}</span>
                      <span>·</span>
                      <span>LV{entry.level ?? 1}</span>
                      {entry.created_at && (
                        <>
                          <span>·</span>
                          <span className="text-gray-700">{formatDate(entry.created_at)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Floor / Kills */}
                  <div className="w-16 text-right">
                    <div className="pixel text-xs text-gray-400">E{entry.floor}</div>
                    <div className="text-xs text-gray-600">⚔ {entry.kills ?? 0}</div>
                  </div>

                  {/* Score */}
                  <div className={`pixel text-xs w-16 text-right ${isOwn ? 'text-gold' : 'text-gold-light'}`}>
                    {entry.score.toLocaleString('de-DE')}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Score formula hint */}
      {scores.length > 0 && (
        <div className="mt-3 text-center text-gray-700 text-xs leading-relaxed">
          Score = Etage×100 + XP×2 + Gold + Kills×15
        </div>
      )}
    </div>
  )
}

const MOCK_SCORES = [
  { id: 1, name: 'Peer', class: 'rogue',   floor: 14, xp: 420, gold: 180, kills: 23, level: 5, score: 1755, created_at: new Date().toISOString() },
  { id: 2, name: 'Alex', class: 'warrior', floor: 11, xp: 310, gold: 120, kills: 18, level: 4, score: 1390, created_at: new Date().toISOString() },
  { id: 3, name: 'Sam',  class: 'mage',    floor: 9,  xp: 260, gold:  90, kills: 14, level: 3, score: 1130, created_at: new Date().toISOString() },
  { id: 4, name: 'Max',  class: 'rogue',   floor: 7,  xp: 190, gold:  60, kills: 10, level: 3, score:  880, created_at: new Date().toISOString() },
  { id: 5, name: 'Kim',  class: 'mage',    floor: 5,  xp: 120, gold:  40, kills:  7, level: 2, score:  665, created_at: new Date().toISOString() },
]
