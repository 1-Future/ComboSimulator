import type { Hotkeys } from '@/types/settings'

export type KeyCallback = (key: string, timestamp: number) => void

export class InputHandler {
  private callback: KeyCallback | null = null
  private hotkeys: Hotkeys | null = null
  private inverseMap: Map<string, string> = new Map()
  private boundHandler: ((e: KeyboardEvent) => void) | null = null

  setHotkeys(hotkeys: Hotkeys): void {
    this.hotkeys = hotkeys
    this.inverseMap.clear()
    for (const [action, key] of Object.entries(hotkeys)) {
      if (key) this.inverseMap.set(key.toLowerCase(), action)
    }
  }

  resolveKey(key: string): string {
    // If the key is mapped to a hotkey action, return the display key
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
      // Ignore modifier keys and repeated events
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      // Ignore input elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()
      if (key.length === 1) {
        e.preventDefault()
        this.callback?.(key, performance.now())
      }
    }
    document.addEventListener('keydown', this.boundHandler)
  }

  stop(): void {
    if (this.boundHandler) {
      document.removeEventListener('keydown', this.boundHandler)
      this.boundHandler = null
    }
    this.callback = null
  }
}
