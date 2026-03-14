import { useEffect } from 'react'

export function useKeyboard(
  keyMap: Record<string, () => void>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const action = keyMap[e.key]
      if (action) {
        e.preventDefault()
        action()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [keyMap, enabled])
}
