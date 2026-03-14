export interface ComboInput {
  key: string
  time: number
  label: string
  window: number
  action?: string
}

export interface ComboVideo {
  filename: string
  duration: number
  fps: number
  comboStart?: number
}

export type ComboDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type ComboCategory =
  | 'bread-and-butter'
  | 'all-in'
  | 'trade'
  | 'poke'
  | 'escape'
  | 'animation-cancel'
  | 'signature'

export interface Combo {
  id: string
  name: string
  description: string
  difficulty: ComboDifficulty
  category: ComboCategory
  tags: string[]
  video: ComboVideo
  inputs: ComboInput[]
  tips: string[]
}

export interface ChampionCombos {
  championId: string
  patch: string
  lastVerified: string
  combos: Combo[]
}
