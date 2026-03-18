import { useEffect, useMemo, useState } from 'react'
import { useCombo } from '@/hooks/useCombo'
import { useComboStore } from '@/stores/comboStore'
import { ChampionCard } from './ChampionCard'
import { ChampionSearch } from './ChampionSearch'
import { ComboList } from './ComboList'
import type { Champion } from '@/types/champion'

interface ChampionBrowserProps {
  onComboSelect: (champion: Champion, comboId: string) => void
}

export function ChampionBrowser({ onComboSelect }: ChampionBrowserProps) {
  const { champions, selectedChampion, championCombos, selectedCombo, loadChampions, loadChampionCombos, selectCombo } = useCombo()
  const searchQuery = useComboStore((s) => s.searchQuery)
  const roleFilter = useComboStore((s) => s.roleFilter)
  const difficultyFilter = useComboStore((s) => s.difficultyFilter)
  const [showHero, setShowHero] = useState(true)

  useEffect(() => {
    loadChampions()
  }, [loadChampions])

  const filtered = useMemo(() => {
    return champions.filter((c) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (roleFilter && !c.roles.includes(roleFilter as Champion['roles'][number])) return false
      if (difficultyFilter && c.difficulty !== difficultyFilter) return false
      return true
    })
  }, [champions, searchQuery, roleFilter, difficultyFilter])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero / Intro */}
      {showHero && (
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-cyan-900/30 bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-900 p-4 md:mb-8 md:p-8">
          <button
            onClick={() => setShowHero(false)}
            className="absolute right-4 top-4 text-neutral-500 hover:text-white"
          >
            &#x2715;
          </button>
          <div className="max-w-2xl">
            <h1 className="mb-2 text-2xl font-black tracking-tight text-white md:text-3xl">
              <img src="/images/logo.png?v=2" alt="" className="mr-2 inline h-8 w-8 align-middle" />
              Combo<span className="text-cyan-400">Sim</span>
            </h1>
            <p className="mb-3 text-sm text-neutral-300 md:mb-4 md:text-base">
              Practice League of Legends champion combos with timing-graded keypresses synced to video. Like osu! but for LoL combos.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">1</div>
                <span className="text-neutral-300">Pick a champion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">2</div>
                <span className="text-neutral-300">Choose a combo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">3</div>
                <span className="text-neutral-300">Press keys in time with the video</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
              <span className="rounded border border-neutral-700 px-2 py-1">SPACE = reset combo</span>
              <span className="rounded border border-neutral-700 px-2 py-1">First key = starts video</span>
              <span className="rounded border border-neutral-700 px-2 py-1">Right-click timeline = edit keys</span>
            </div>
          </div>
          {/* Decorative gradient orb */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {champions.length} Champions
          </h2>
          <p className="text-xs text-neutral-500">Click a champion, then pick a combo to start practicing</p>
        </div>
        {!showHero && (
          <button
            onClick={() => setShowHero(true)}
            className="text-xs text-neutral-500 hover:text-cyan-400"
          >
            How does this work?
          </button>
        )}
      </div>

      <ChampionSearch />

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Champion grid */}
        <div className="flex-1">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 md:gap-3 lg:grid-cols-8">
            {filtered.map((champion) => (
              <ChampionCard
                key={champion.id}
                champion={champion}
                onClick={loadChampionCombos}
                isSelected={selectedChampion?.id === champion.id}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              No champions match your filters.
            </div>
          )}
        </div>

        {/* Combo sidebar / bottom panel on mobile */}
        {selectedChampion && (
          <div className="w-full shrink-0 md:w-80">
            <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-4 md:sticky md:top-20">
              <div className="mb-3 flex items-center gap-3">
                {selectedChampion.portrait && (
                  <img
                    src={selectedChampion.portrait}
                    alt={selectedChampion.name}
                    className="h-12 w-12 rounded-lg"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedChampion.name}</h2>
                  <p className="text-xs text-neutral-400">{selectedChampion.title}</p>
                </div>
              </div>
              <p className="mb-3 text-[10px] text-neutral-500">Click a combo below to start practicing</p>
              {championCombos ? (
                <ComboList
                  combos={championCombos.combos}
                  selectedComboId={selectedCombo?.id ?? null}
                  onSelect={(combo) => {
                    selectCombo(combo)
                    onComboSelect(selectedChampion, combo.id)
                  }}
                />
              ) : (
                <div className="text-sm text-neutral-500">Loading combos...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
