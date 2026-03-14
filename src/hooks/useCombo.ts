import { useCallback } from 'react'
import { useComboStore } from '@/stores/comboStore'
import type { Champion } from '@/types/champion'
import type { ChampionCombos } from '@/types/combo'

export function useCombo() {
  const {
    champions,
    selectedChampion,
    championCombos,
    selectedCombo,
    setChampions,
    selectChampion,
    setChampionCombos,
    selectCombo,
    setLoadingChampions,
    setLoadingCombos,
  } = useComboStore()

  const loadChampions = useCallback(async () => {
    setLoadingChampions(true)
    try {
      const res = await fetch('/data/champions.json')
      const data = await res.json()
      setChampions(data.champions)
    } catch (err) {
      console.error('Failed to load champions:', err)
    } finally {
      setLoadingChampions(false)
    }
  }, [setChampions, setLoadingChampions])

  const loadChampionCombos = useCallback(
    async (champion: Champion) => {
      setLoadingCombos(true)
      selectChampion(champion)
      try {
        const res = await fetch(`/data/combos/${champion.id}.json`)
        const data: ChampionCombos = await res.json()
        setChampionCombos(data)
      } catch (err) {
        console.error(`Failed to load combos for ${champion.id}:`, err)
        setChampionCombos(null)
      } finally {
        setLoadingCombos(false)
      }
    },
    [selectChampion, setChampionCombos, setLoadingCombos],
  )

  return {
    champions,
    selectedChampion,
    championCombos,
    selectedCombo,
    loadChampions,
    loadChampionCombos,
    selectCombo,
  }
}
