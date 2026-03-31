import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Menu from './scenes/Menu'
import ClassSelect from './scenes/ClassSelect'
import Game from './scenes/Game'
import Leaderboard from './scenes/Leaderboard'
import Profile from './scenes/Profile'

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
  return (
    <BrowserRouter>
      <div className="h-full bg-dungeon overflow-hidden">
        <Routes>
          <Route path="/"            element={<Menu />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/class-select" element={<RequireProfile><ClassSelect /></RequireProfile>} />
          <Route path="/game"        element={<RequireProfile><Game /></RequireProfile>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
