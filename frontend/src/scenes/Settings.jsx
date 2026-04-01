import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadSettings, saveSettings } from '../game/settings'
import { sfx } from '../game/sound'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    saveSettings(next)
    // Play a test sound when sound is turned ON
    if (key === 'soundEnabled' && next.soundEnabled) {
      setTimeout(() => sfx.coin(), 50)
    }
  }

  const rows = [
    {
      key: 'soundEnabled',
      icon: '🔊',
      title: 'Sound',
      desc: settings.soundEnabled ? 'Prozeduraler Audio-Synthesizer aktiv' : 'Kein Sound',
    },
    {
      key: 'vibrationEnabled',
      icon: '📳',
      title: 'Vibration',
      desc: settings.vibrationEnabled ? 'Haptisches Feedback aktiv (Android)' : 'Vibration deaktiviert',
    },
  ]

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-600 text-xs pixel">← ZURÜCK</button>
        <div className="pixel text-gold text-sm flex-1 text-center">EINSTELLUNGEN</div>
        <div className="w-14" />
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row, idx) => (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07 }}
            className={`flex items-center gap-4 border-2 px-4 py-4 transition-colors
              ${settings[row.key] ? 'border-dungeon-border bg-dungeon-dark' : 'border-gray-800 bg-dungeon opacity-60'}
            `}
          >
            <span className="text-2xl">{row.icon}</span>
            <div className="flex-1">
              <div className="pixel text-xs text-gold-light">{row.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{row.desc}</div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => toggle(row.key)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                ${settings[row.key] ? 'bg-green-700' : 'bg-gray-700'}
              `}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                  ${settings[row.key] ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-gray-700 text-xs text-center leading-relaxed">
        Einstellungen werden lokal gespeichert.
      </div>
    </div>
  )
}
