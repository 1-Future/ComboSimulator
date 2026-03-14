import { create } from 'zustand'
import type { Champion } from '@/types/champion'
import type { Combo, ChampionCombos } from '@/types/combo'

interface ComboState {
  champions: Champion[]
  selectedChampion: Champion | null
  championCombos: ChampionCombos | null
  selectedCombo: Combo | null
  isLoadingChampions: boolean
  isLoadingCombos: boolean
  searchQuery: string
  roleFilter: string | null
  difficultyFilter: number | null

  setChampions: (champions: Champion[]) => void
  selectChampion: (champion: Champion | null) => void
  setChampionCombos: (combos: ChampionCombos | null) => void
  selectCombo: (combo: Combo | null) => void
  setLoadingChampions: (loading: boolean) => void
  setLoadingCombos: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  setRoleFilter: (role: string | null) => void
  setDifficultyFilter: (difficulty: number | null) => void
}

export const useComboStore = create<ComboState>()((set) => ({
  champions: [],
  selectedChampion: null,
  championCombos: null,
  selectedCombo: null,
  isLoadingChampions: false,
  isLoadingCombos: false,
  searchQuery: '',
  roleFilter: null,
  difficultyFilter: null,

  setChampions: (champions) => set({ champions }),
  selectChampion: (champion) =>
    set({ selectedChampion: champion, selectedCombo: null, championCombos: null }),
  setChampionCombos: (combos) => set({ championCombos: combos }),
  selectCombo: (combo) => set({ selectedCombo: combo }),
  setLoadingChampions: (loading) => set({ isLoadingChampions: loading }),
  setLoadingCombos: (loading) => set({ isLoadingCombos: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty }),
}))
