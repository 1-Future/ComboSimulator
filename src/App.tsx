import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { GameSelector } from '@/components/GameSelector'
import { ChampionBrowser } from '@/components/champion/ChampionBrowser'
import { PanelComboPlayer } from '@/components/player/PanelComboPlayer'
import { ComboEditor } from '@/components/editor/ComboEditor'
import { useComboStore } from '@/stores/comboStore'
import { initAudio } from '@/lib/audio'
import type { ChampionCombos } from '@/types/combo'

function LeagueBrowser() {
  const navigate = useNavigate()

  return (
    <ChampionBrowser
      onComboSelect={(champion, comboId) => {
        navigate(`/league/${champion.id}/${comboId}`)
      }}
    />
  )
}

function LeaguePlayPage() {
  const { championId, comboId } = useParams()
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    const key = `${championId}/${comboId}`
    if (loadedRef.current === key) return
    if (!championId || !comboId) return

    const state = useComboStore.getState()
    if (state.selectedChampion?.id === championId && state.selectedCombo?.id === comboId) {
      loadedRef.current = key
      return
    }

    loadedRef.current = key

    async function loadFromUrl() {
      const store = useComboStore.getState()

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

function ComingSoon() {
  const { gameId } = useParams()
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-3xl font-black text-white">{gameId?.toUpperCase()}</h1>
      <p className="mt-4 text-neutral-400">Coming soon — frame data combos with timing practice</p>
      <a href="/" className="mt-6 inline-block text-sm text-red-500 hover:text-red-400">
        ← Back to games
      </a>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    initAudio()
    import('@/stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().checkAuth()
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Game selector */}
          <Route path="/" element={<GameSelector />} />

          {/* League of Legends */}
          <Route path="/league" element={<LeagueBrowser />} />
          <Route path="/league/:championId/:comboId" element={<LeaguePlayPage />} />

          {/* Coming soon games */}
          <Route path="/sf6/*" element={<ComingSoon />} />
          <Route path="/tekken8/*" element={<ComingSoon />} />
          <Route path="/ggst/*" element={<ComingSoon />} />
          <Route path="/mk1/*" element={<ComingSoon />} />
          <Route path="/smash/*" element={<ComingSoon />} />

          {/* Legacy routes — redirect old URLs */}
          <Route path="/play/:championId/:comboId" element={<LeaguePlayPage />} />

          {/* Editor */}
          <Route path="/editor" element={<ComboEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
