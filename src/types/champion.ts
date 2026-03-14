export interface Champion {
  id: string
  name: string
  title: string
  roles: ChampionRole[]
  difficulty: 1 | 2 | 3
  comboCount: number
  thumbnail: string
  tags: string[]
}

export type ChampionRole =
  | 'fighter'
  | 'assassin'
  | 'mage'
  | 'marksman'
  | 'tank'
  | 'support'

export interface ChampionIndex {
  version: string
  champions: Champion[]
}
