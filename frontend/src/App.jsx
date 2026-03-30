import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Menu from './scenes/Menu'
import ClassSelect from './scenes/ClassSelect'
import Game from './scenes/Game'
import Leaderboard from './scenes/Leaderboard'

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-full bg-dungeon overflow-hidden">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/class-select" element={<ClassSelect />} />
          <Route path="/game" element={<Game />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
