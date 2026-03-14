import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ChampionBrowser } from '@/components/champion/ChampionBrowser'
import { ComboPlayer } from '@/components/player/ComboPlayer'
import { ComboEditor } from '@/components/editor/ComboEditor'
import { initAudio } from '@/lib/audio'

function HomePage() {
  const navigate = useNavigate()

  return (
    <ChampionBrowser
      onComboSelect={(champion, comboId) => {
        navigate(`/play/${champion.id}/${comboId}`)
      }}
    />
  )
}

function PlayPage() {
  return <ComboPlayer />
}

export default function App() {
  useEffect(() => {
    initAudio()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play/:championId/:comboId" element={<PlayPage />} />
          <Route path="/editor" element={<ComboEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
