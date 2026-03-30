import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Menu() {
  const navigate = useNavigate()

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
          DAILY DUNGEON
        </MenuButton>
        <MenuButton onClick={() => navigate('/leaderboard')}>
          BESTENLISTE
        </MenuButton>
      </motion.div>

      <p className="text-gray-700 text-xs pixel">v0.1.0</p>
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
