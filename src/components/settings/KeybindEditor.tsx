import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const HOTKEY_LABELS: Record<string, string> = {
  spell1: 'Q - Spell 1',
  spell2: 'W - Spell 2',
  spell3: 'E - Spell 3',
  spell4: 'R - Spell 4',
  summoner1: 'D - Summoner 1',
  summoner2: 'F - Summoner 2',
  autoattack: 'A - Auto Attack',
  item1: '1 - Item 1',
  item2: '2 - Item 2',
  item3: '3 - Item 3',
  item4: '4 - Item 4',
}

export function KeybindEditor() {
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const setHotkey = useSettingsStore((s) => s.setHotkey)
  const [listening, setListening] = useState<string | null>(null)

  function handleStartListening(action: string) {
    setListening(action)
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.key.length === 1) {
        setHotkey(action, e.key.toLowerCase())
      }
      setListening(null)
      document.removeEventListener('keydown', handler)
    }
    document.addEventListener('keydown', handler)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300">Keybinds</h3>
      {Object.entries(HOTKEY_LABELS).map(([action, label]) => (
        <div key={action} className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{label}</span>
          <button
            onClick={() => handleStartListening(action)}
            className={`rounded border px-3 py-1 text-xs font-mono transition-colors ${
              listening === action
                ? 'animate-pulse border-cyan-500 bg-cyan-950 text-cyan-400'
                : 'border-slate-600 bg-slate-800 text-white hover:border-slate-500'
            }`}
          >
            {listening === action ? 'Press key...' : hotkeys[action]?.toUpperCase()}
          </button>
        </div>
      ))}
    </div>
  )
}
