import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Hotkeys, GamepadMap } from '@/types/settings'
import type { Difficulty } from '@/types/engine'
import { DEFAULT_SETTINGS } from '@/types/settings'

interface SettingsState extends Settings {
  setHotkeys: (hotkeys: Hotkeys) => void
  setHotkey: (action: string, key: string) => void
  setGamepadMap: (map: GamepadMap) => void
  setGamepadButton: (button: number, action: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  setVolume: (volume: number) => void
  setPingEnabled: (enabled: boolean) => void
  setGradeSoundsEnabled: (enabled: boolean) => void
  setCalibrationOffset: (offset: number) => void
  setPlaybackSpeed: (speed: number) => void
  resetToDefaults: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
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
      setPingEnabled: (pingEnabled) => set({ pingEnabled }),
      setGradeSoundsEnabled: (gradeSoundsEnabled) => set({ gradeSoundsEnabled }),
      setCalibrationOffset: (calibrationOffset) => set({ calibrationOffset }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      resetToDefaults: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: 'combo-simulator-settings' },
  ),
)
