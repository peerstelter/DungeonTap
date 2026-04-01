import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { version } from '../../package.json'
import { loadStoryProgress } from '../game/story'

export default function Menu() {
  const navigate  = useNavigate()
  const [online, setOnline]     = useState(navigator.onLine)
  const [installEvt, setInstallEvt] = useState(null)
  const storyProgress = loadStoryProgress()

  // Track online/offline status
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Capture PWA install prompt
  useEffect(() => {
    function handler(e) { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleInstall() {
    if (!installEvt) return
    installEvt.prompt()
    installEvt.userChoice.then(() => setInstallEvt(null))
  }

  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
    <div className="flex flex-col items-center justify-between h-full safe-top safe-bottom px-6 py-10 bg-dungeon">

      {/* Logo */}
      <motion.div
        className="flex flex-col items-center gap-4 mt-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-6xl">⚔️</div>
        <h1 className="pixel text-gold text-xl text-center leading-relaxed">
          DUNGEON<br />TAP
        </h1>
        <p className="text-gray-500 text-sm text-center">Swipe. Fight. Survive.</p>

        {/* Online/offline dot */}
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-600">{online ? 'Online' : 'Offline'}</span>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-4 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <MenuButton onClick={() => navigate('/class-select')} primary>
          NEUES SPIEL
        </MenuButton>

        <MenuButton onClick={() => navigate('/game?mode=daily')}>
          <span>DAILY DUNGEON</span>
          <span className="block text-xs text-gray-500 mt-0.5 font-normal pixel" style={{ fontSize: '0.55rem' }}>
            {today}
          </span>
        </MenuButton>

        <MenuButton onClick={() => navigate('/leaderboard')}>
          BESTENLISTE
        </MenuButton>

        <MenuButton onClick={() => navigate('/game?mode=story')}>
          <span>STORY MODE {storyProgress.completed ? '✓' : ''}</span>
          <span className="block text-xs text-gray-500 mt-0.5 font-normal pixel" style={{ fontSize: '0.55rem' }}>
            {storyProgress.completed ? 'ABGESCHLOSSEN!' : `AKT ${Math.max(1, storyProgress.highestAct + 1)} VON 3`}
          </span>
        </MenuButton>

        {/* PWA install prompt — only shows if browser fires beforeinstallprompt */}
        {installEvt && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MenuButton onClick={handleInstall}>
              📲 AUF HOMESCREEN
            </MenuButton>
          </motion.div>
        )}
      </motion.div>

      <div className="flex flex-col items-center gap-1">
        {profile && (
          <button onClick={() => navigate('/profile')} className="text-gray-600 text-xs hover:text-gray-400 transition-colors">
            ✎ {profile.name}
          </button>
        )}
        <p className="text-gray-700 text-xs pixel">v{version}</p>
      </div>
    </div>
  )
}

function MenuButton({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-4 pixel text-sm tracking-wider
        border-2 transition-all duration-150 active:scale-95
        ${primary
          ? 'bg-dungeon-gold text-dungeon-black border-dungeon-gold-light shadow-lg shadow-yellow-900/30'
          : 'bg-transparent text-gold border-dungeon-border hover:border-gold'
        }
      `}
    >
      {children}
    </button>
  )
}
