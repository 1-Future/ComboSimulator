import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Hotkeys, GamepadMap } from '@/types/settings'
import type { Difficulty } from '@/types/engine'
import { DEFAULT_SETTINGS } from '@/types/settings'
import { GAME_INPUTS } from '@/types/gameInputs'

// Per-game keybinds
export interface GameKeybinds {
  keyboard: Record<string, string>    // buttonId → keyboard key
  directions: Record<string, string>  // directionId → keyboard key
  gamepad: Record<number, string>     // gamepad button → buttonId
}

interface SettingsState extends Settings {
  // Global settings
  setHotkeys: (hotkeys: Hotkeys) => void
  setHotkey: (action: string, key: string) => void
  setGamepadMap: (map: GamepadMap) => void
  setGamepadButton: (button: number, action: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  setVolume: (volume: number) => void
  setVideoVolume: (volume: number) => void
  setPingEnabled: (enabled: boolean) => void
  setGradeSoundsEnabled: (enabled: boolean) => void
  setCalibrationOffset: (offset: number) => void
  setPlaybackSpeed: (speed: number) => void
  resetToDefaults: () => void

  // Per-game keybinds
  gameKeybinds: Record<string, GameKeybinds>
  getGameKeybinds: (gameId: string) => GameKeybinds
  setGameKeybind: (gameId: string, buttonId: string, key: string) => void
  setGameDirection: (gameId: string, directionId: string, key: string) => void
  setGameGamepadButton: (gameId: string, gpButton: number, buttonId: string) => void
  resetGameKeybinds: (gameId: string) => void
}

function getDefaultGameKeybinds(gameId: string): GameKeybinds {
  const config = GAME_INPUTS[gameId]
  if (!config) return { keyboard: {}, directions: {}, gamepad: {} }
  return {
    keyboard: { ...config.defaultKeyboard },
    directions: { ...config.defaultDirections },
    gamepad: { ...config.defaultGamepad },
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      gameKeybinds: {},

      setHotkeys: (hotkeys) => set({ hotkeys }),
      setHotkey: (action, key) =>
        set((state) => ({
          hotkeys: { ...state.hotkeys, [action]: key },
        })),
      setGamepadMap: (gamepadMap) => set({ gamepadMap }),
      setGamepadButton: (button, action) =>
        set((state) => ({
          gamepadMap: { ...state.gamepadMap, [button]: action },
        })),
      setDifficulty: (difficulty) => set({ difficulty }),
      setVolume: (volume) => set({ volume }),
      setVideoVolume: (videoVolume) => set({ videoVolume }),
      setPingEnabled: (pingEnabled) => set({ pingEnabled }),
      setGradeSoundsEnabled: (gradeSoundsEnabled) => set({ gradeSoundsEnabled }),
      setCalibrationOffset: (calibrationOffset) => set({ calibrationOffset }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      resetToDefaults: () => set({ ...DEFAULT_SETTINGS, gameKeybinds: {} }),

      // Per-game keybinds
      getGameKeybinds: (gameId: string) => {
        const saved = get().gameKeybinds[gameId]
        if (saved) return saved
        return getDefaultGameKeybinds(gameId)
      },

      setGameKeybind: (gameId, buttonId, key) =>
        set((state) => {
          const current = state.gameKeybinds[gameId] ?? getDefaultGameKeybinds(gameId)
          return {
            gameKeybinds: {
              ...state.gameKeybinds,
              [gameId]: { ...current, keyboard: { ...current.keyboard, [buttonId]: key } },
            },
          }
        }),

      setGameDirection: (gameId, directionId, key) =>
        set((state) => {
          const current = state.gameKeybinds[gameId] ?? getDefaultGameKeybinds(gameId)
          return {
            gameKeybinds: {
              ...state.gameKeybinds,
              [gameId]: { ...current, directions: { ...current.directions, [directionId]: key } },
            },
          }
        }),

      setGameGamepadButton: (gameId, gpButton, buttonId) =>
        set((state) => {
          const current = state.gameKeybinds[gameId] ?? getDefaultGameKeybinds(gameId)
          return {
            gameKeybinds: {
              ...state.gameKeybinds,
              [gameId]: { ...current, gamepad: { ...current.gamepad, [gpButton]: buttonId } },
            },
          }
        }),

      resetGameKeybinds: (gameId) =>
        set((state) => ({
          gameKeybinds: {
            ...state.gameKeybinds,
            [gameId]: getDefaultGameKeybinds(gameId),
          },
        })),
    }),
    { name: 'combo-simulator-settings' },
  ),
)
