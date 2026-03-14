import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEngineStore } from '@/stores/engineStore'
import { GAMEPAD_BUTTON_NAMES } from '@/types/settings'
import type { ComboInput } from '@/types/combo'

const MOUSE_SHORT: Record<string, string> = {
  mouse1: 'M1',
  mouse2: 'M2',
  mouse3: 'M3',
  mouse4: 'M4',
  mouse5: 'M5',
}

function formatKey(key: string): string {
  return MOUSE_SHORT[key] ?? key.toUpperCase()
}

export function useDisplayKey() {
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const gamepadMap = useSettingsStore((s) => s.gamepadMap)
  const activeDevice = useEngineStore((s) => s.activeDevice)

  const getDisplayKey = useCallback(
    (input: ComboInput): string => {
      if (activeDevice === 'gamepad' && input.action) {
        // Find which gamepad button maps to this action
        for (const [btn, act] of Object.entries(gamepadMap)) {
          if (act === input.action) {
            return GAMEPAD_BUTTON_NAMES[Number(btn)] ?? btn
          }
        }
      }
      // Keyboard
      if (input.action) {
        const mapped = hotkeys[input.action]
        if (mapped) return formatKey(mapped)
      }
      return formatKey(input.key)
    },
    [hotkeys, gamepadMap, activeDevice],
  )

  const getKeyboardKey = useCallback(
    (input: ComboInput): string => {
      if (input.action) {
        const mapped = hotkeys[input.action]
        if (mapped) return formatKey(mapped)
      }
      return formatKey(input.key)
    },
    [hotkeys],
  )

  const getGamepadButton = useCallback(
    (input: ComboInput): string => {
      if (input.action) {
        for (const [btn, act] of Object.entries(gamepadMap)) {
          if (act === input.action) {
            return GAMEPAD_BUTTON_NAMES[Number(btn)] ?? btn
          }
        }
      }
      return '?'
    },
    [gamepadMap],
  )

  return { getDisplayKey, getKeyboardKey, getGamepadButton, activeDevice }
}
