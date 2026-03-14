import { useEffect, useMemo } from 'react'
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
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-white">Champions</h1>
        <p className="text-sm text-slate-400">
          Select a champion to practice their combos ({champions.length} champions, browse all combos)
        </p>
      </div>

      <ChampionSearch />

      <div className="mt-6 flex gap-6">
        {/* Champion grid */}
        <div className="flex-1">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
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
            <div className="py-12 text-center text-slate-500">
              No champions match your filters.
            </div>
          )}
        </div>

        {/* Combo sidebar */}
        {selectedChampion && (
          <div className="w-80 shrink-0">
            <div className="sticky top-20">
              <h2 className="mb-3 text-lg font-semibold text-white">{selectedChampion.name}</h2>
              <p className="mb-4 text-xs text-slate-400">{selectedChampion.title}</p>
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
                <div className="text-sm text-slate-500">Loading combos...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
