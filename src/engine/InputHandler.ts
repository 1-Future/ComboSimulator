import type { Hotkeys, GamepadMap } from '@/types/settings'

export type InputSource = 'keyboard' | 'gamepad'
export type KeyCallback = (key: string, timestamp: number, source: InputSource) => void

// These buttons always trigger reset regardless of mapping
const GAMEPAD_SPECIAL: Record<number, string> = {
  8: 'reset',   // Back/View
  9: 'reset',   // Start/Menu
}

// Mouse button names used as key identifiers
export const MOUSE_BUTTON_NAMES: Record<number, string> = {
  0: 'mouse1',  // Left click
  1: 'mouse3',  // Middle click
  2: 'mouse2',  // Right click
  3: 'mouse4',  // Back
  4: 'mouse5',  // Forward
}

export const MOUSE_DISPLAY_NAMES: Record<string, string> = {
  mouse1: 'M1 (Left)',
  mouse2: 'M2 (Right)',
  mouse3: 'M3 (Middle)',
  mouse4: 'M4 (Back)',
  mouse5: 'M5 (Forward)',
}

export class InputHandler {
  private callback: KeyCallback | null = null
  private hotkeys: Hotkeys | null = null
  private gamepadMap: GamepadMap = {}
  private inverseMap: Map<string, string> = new Map()
  private boundHandler: ((e: KeyboardEvent) => void) | null = null
  private boundMouseHandler: ((e: MouseEvent) => void) | null = null
  private gamepadRafId: number | null = null
  private gamepadButtonState: boolean[] = []

  setHotkeys(hotkeys: Hotkeys): void {
    this.hotkeys = hotkeys
    this.inverseMap.clear()
    for (const [action, key] of Object.entries(hotkeys)) {
      if (key) this.inverseMap.set(key.toLowerCase(), action)
    }
  }

  setGamepadMap(map: GamepadMap): void {
    this.gamepadMap = { ...map }
  }

  resolveKey(key: string): string {
    return key.toLowerCase()
  }

  getActionForKey(key: string): string | undefined {
    return this.inverseMap.get(key.toLowerCase())
  }

  getKeyForAction(action: string): string | undefined {
    return this.hotkeys?.[action]
  }

  start(callback: KeyCallback): void {
    this.callback = callback

    this.boundHandler = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toLowerCase()
      if (key.length === 1) {
        e.preventDefault()
        this.callback?.(key, performance.now(), 'keyboard')
      }
    }
    document.addEventListener('keydown', this.boundHandler)

    // Mouse button listener
    this.boundMouseHandler = (e: MouseEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return
      const mouseKey = MOUSE_BUTTON_NAMES[e.button]
      if (mouseKey) {
        e.preventDefault()
        this.callback?.(mouseKey, performance.now(), 'keyboard')
      }
    }
    document.addEventListener('mousedown', this.boundMouseHandler)
    // Prevent context menu for right-click bindings
    document.addEventListener('contextmenu', this.preventContextMenu)

    this.gamepadButtonState = []
    this.pollGamepad()
  }

  private preventContextMenu = (e: Event): void => {
    // Only prevent if right-click is bound to an action
    if (this.inverseMap.has('mouse2')) {
      e.preventDefault()
    }
  }

  stop(): void {
    if (this.boundHandler) {
      document.removeEventListener('keydown', this.boundHandler)
      this.boundHandler = null
    }
    if (this.boundMouseHandler) {
      document.removeEventListener('mousedown', this.boundMouseHandler)
      document.removeEventListener('contextmenu', this.preventContextMenu)
      this.boundMouseHandler = null
    }
    if (this.gamepadRafId !== null) {
      cancelAnimationFrame(this.gamepadRafId)
      this.gamepadRafId = null
    }
    this.callback = null
  }

  private pollGamepad = (): void => {
    const gamepads = navigator.getGamepads()
    for (const gp of gamepads) {
      if (!gp) continue

      for (let i = 0; i < gp.buttons.length; i++) {
        const pressed = gp.buttons[i]?.pressed ?? false
        const wasPressed = this.gamepadButtonState[i] ?? false

        if (pressed && !wasPressed) {
          const special = GAMEPAD_SPECIAL[i]
          if (special === 'reset') {
            this.callback?.(' ', performance.now(), 'gamepad')
          } else {
            const action = this.gamepadMap[i]
            if (action && this.hotkeys) {
              const key = this.hotkeys[action]
              if (key) {
                this.callback?.(key, performance.now(), 'gamepad')
              }
            }
          }
        }
        this.gamepadButtonState[i] = pressed
      }
    }

    this.gamepadRafId = requestAnimationFrame(this.pollGamepad)
  }
}
