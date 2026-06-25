import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { GameModeA } from './pages/GameModeA'
import { GameModeB } from './pages/GameModeB'
import { Settings } from './pages/Settings'
import { HowToPlay } from './pages/HowToPlay'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/a" element={<GameModeA />} />
        <Route path="/game/b" element={<GameModeB />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
      </Routes>
    </BrowserRouter>
  )
}
