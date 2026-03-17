import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ChampionBrowser } from '@/components/champion/ChampionBrowser'
import { PanelComboPlayer } from '@/components/player/PanelComboPlayer'
import { ComboEditor } from '@/components/editor/ComboEditor'
import { useComboStore } from '@/stores/comboStore'
import { initAudio } from '@/lib/audio'
import type { ChampionCombos } from '@/types/combo'

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
  const { championId, comboId } = useParams()
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    const key = `${championId}/${comboId}`
    if (loadedRef.current === key) return
    if (!championId || !comboId) return

    // Check if already loaded in store
    const state = useComboStore.getState()
    if (state.selectedChampion?.id === championId && state.selectedCombo?.id === comboId) {
      loadedRef.current = key
      return
    }

    loadedRef.current = key

    async function loadFromUrl() {
      const store = useComboStore.getState()

      // Load champion index if needed
      let champions = store.champions
      if (champions.length === 0) {
        const champRes = await fetch('/data/champions.json')
        const champData = await champRes.json()
        champions = champData.champions
        useComboStore.getState().setChampions(champions)
      }

      const champion = champions.find((c) => c.id === championId)
      if (!champion) return
      useComboStore.getState().selectChampion(champion)

      // Load combos
      const comboRes = await fetch(`/data/combos/${championId}.json`)
      const comboData: ChampionCombos = await comboRes.json()
      useComboStore.getState().setChampionCombos(comboData)

      const combo = comboData.combos.find((c) => c.id === comboId)
      if (combo) useComboStore.getState().selectCombo(combo)
    }

    loadFromUrl()
  }, [championId, comboId])

  return <PanelComboPlayer />
}

export default function App() {
  useEffect(() => {
    initAudio()
    // Check auth on mount (handles OAuth redirect token)
    import('@/stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().checkAuth()
    })
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
