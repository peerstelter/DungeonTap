import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Menu from './scenes/Menu'
import ClassSelect from './scenes/ClassSelect'
import Game from './scenes/Game'
import Leaderboard from './scenes/Leaderboard'
import Profile from './scenes/Profile'
import Achievements from './scenes/Achievements'

// Redirect to /profile if player hasn't set up a name+PIN yet
function RequireProfile({ children }) {
  const location = useLocation()
  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')
  if (!profile) {
    return <Navigate to={`/profile?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}

export default function App() {
  // Lock orientation to portrait in PWA standalone / fullscreen mode
  useEffect(() => {
    if (screen.orientation?.lock) {
      screen.orientation.lock('portrait').catch(() => {})
    }
  }, [])

  return (
    <BrowserRouter>
      {/* Landscape guard — shown when phone is rotated sideways */}
      <div className="landscape-overlay">
        <div style={{ fontSize: '3rem' }}>📱</div>
        <p className="pixel text-gold text-center" style={{ fontSize: '0.6rem', lineHeight: 2 }}>
          BITTE GERÄT<br />DREHEN
        </p>
      </div>

      <div className="h-full bg-dungeon overflow-hidden">
        <Routes>
          <Route path="/"            element={<Menu />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/class-select" element={<RequireProfile><ClassSelect /></RequireProfile>} />
          <Route path="/game"        element={<RequireProfile><Game /></RequireProfile>} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
