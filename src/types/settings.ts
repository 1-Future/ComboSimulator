import type { Difficulty } from './engine'

export interface Hotkeys {
  spell1: string
  spell2: string
  spell3: string
  spell4: string
  summoner1: string
  summoner2: string
  autoattack: string
  item1: string
  item2: string
  item3: string
  item4: string
  [key: string]: string
}

export interface Settings {
  hotkeys: Hotkeys
  difficulty: Difficulty
  volume: number
  pingEnabled: boolean
  gradeSoundsEnabled: boolean
  calibrationOffset: number
  playbackSpeed: number
}

export const DEFAULT_HOTKEYS: Hotkeys = {
  spell1: 'q',
  spell2: 'w',
  spell3: 'e',
  spell4: 'r',
  summoner1: 'd',
  summoner2: 'f',
  autoattack: 'a',
  item1: '1',
  item2: '2',
  item3: '3',
  item4: '4',
}

export const DEFAULT_SETTINGS: Settings = {
  hotkeys: { ...DEFAULT_HOTKEYS },
  difficulty: 'normal',
  volume: 0.7,
  pingEnabled: true,
  gradeSoundsEnabled: true,
  calibrationOffset: 0,
  playbackSpeed: 1.0,
}
