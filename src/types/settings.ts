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

export type GamepadMap = Record<number, string>

export interface Settings {
  hotkeys: Hotkeys
  gamepadMap: GamepadMap
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

export const DEFAULT_GAMEPAD_MAP: GamepadMap = {
  0: 'spell1',     // A
  1: 'spell2',     // B
  2: 'spell3',     // X
  3: 'spell4',     // Y
  4: 'summoner1',  // LB
  5: 'summoner2',  // RB
  6: 'item1',      // LT
  7: 'item2',      // RT
  12: 'autoattack', // D-pad Up
  13: 'autoattack', // D-pad Down
}

export const GAMEPAD_BUTTON_NAMES: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'Back',
  9: 'Start',
  10: 'L3',
  11: 'R3',
  12: 'D\u2191',
  13: 'D\u2193',
  14: 'D\u2190',
  15: 'D\u2192',
}

export const DEFAULT_SETTINGS: Settings = {
  hotkeys: { ...DEFAULT_HOTKEYS },
  gamepadMap: { ...DEFAULT_GAMEPAD_MAP },
  difficulty: 'normal',
  volume: 0.7,
  pingEnabled: true,
  gradeSoundsEnabled: true,
  calibrationOffset: 0,
  playbackSpeed: 1.0,
}
