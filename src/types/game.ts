export interface Game {
  id: string
  name: string
  shortName: string
  image: string
  description: string
  status: 'live' | 'coming-soon'
  characterCount?: number
  comboCount?: number
}

export const GAMES: Game[] = [
  {
    id: 'league',
    name: 'League of Legends',
    shortName: 'LoL',
    image: 'https://cdn.communitydragon.org/latest/champion/generic/square',
    description: '150 champions, 800+ combos with video',
    status: 'live',
    characterCount: 150,
    comboCount: 794,
  },
  {
    id: 'sf6',
    name: 'Street Fighter 6',
    shortName: 'SF6',
    image: '',
    description: 'Frame-perfect combos from notation. No video needed.',
    status: 'coming-soon',
  },
  {
    id: 'tekken8',
    name: 'Tekken 8',
    shortName: 'T8',
    image: '',
    description: 'String combos with frame data timing.',
    status: 'coming-soon',
  },
  {
    id: 'ggst',
    name: 'Guilty Gear Strive',
    shortName: 'GGST',
    image: '',
    description: 'Gatling combos with Dustloop frame data.',
    status: 'coming-soon',
  },
  {
    id: 'mk1',
    name: 'Mortal Kombat 1',
    shortName: 'MK1',
    image: '',
    description: 'Kombos with dial-a-combo timing.',
    status: 'coming-soon',
  },
  {
    id: 'smash',
    name: 'Super Smash Bros. Ultimate',
    shortName: 'SSBU',
    image: '',
    description: 'True combos and kill confirms.',
    status: 'coming-soon',
  },
]
