export interface Game {
  id: string
  name: string
  shortName: string
  image: string
  color: string
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
    image: '/images/games/league.jpg',
    color: '#C89B3C',
    description: '150 champions, 800+ combos with video',
    status: 'live',
    characterCount: 150,
    comboCount: 794,
  },
  {
    id: 'sf6',
    name: 'Street Fighter 6',
    shortName: 'SF6',
    image: '/images/games/sf6.jpg',
    color: '#E2342D',
    description: 'Frame-perfect combos from notation. No video needed.',
    status: 'coming-soon',
  },
  {
    id: 'ggst',
    name: 'Guilty Gear -Strive-',
    shortName: 'GGST',
    image: '/images/games/ggst.jpg',
    color: '#E83535',
    description: '898 combos from Dustloop with frame-data timing.',
    status: 'live',
    characterCount: 34,
    comboCount: 898,
  },
  {
    id: 'tekken8',
    name: 'Tekken 8',
    shortName: 'T8',
    image: '/images/games/tekken8.jpg',
    color: '#FF6B00',
    description: 'String combos with frame data timing.',
    status: 'coming-soon',
  },
  {
    id: 'mk1',
    name: 'Mortal Kombat 1',
    shortName: 'MK1',
    image: '/images/games/mk1.jpg',
    color: '#F5C518',
    description: 'Kombos with dial-a-combo timing.',
    status: 'coming-soon',
  },
  {
    id: 'smash',
    name: 'Super Smash Bros. Ultimate',
    shortName: 'SSBU',
    image: '/images/games/smash.jpg',
    color: '#E60012',
    description: 'True combos and kill confirms.',
    status: 'coming-soon',
  },
]
