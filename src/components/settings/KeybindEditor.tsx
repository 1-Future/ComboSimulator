import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { GAMEPAD_BUTTON_NAMES } from '@/types/settings'
import { MOUSE_DISPLAY_NAMES } from '@/engine/InputHandler'

function formatKeyDisplay(key: string): string {
  if (MOUSE_DISPLAY_NAMES[key]) return MOUSE_DISPLAY_NAMES[key]
  return key.toUpperCase()
}

const ACTIONS = [
  { id: 'spell1', label: 'Spell 1' },
  { id: 'spell2', label: 'Spell 2' },
  { id: 'spell3', label: 'Spell 3' },
  { id: 'spell4', label: 'Spell 4' },
  { id: 'summoner1', label: 'Summoner 1' },
  { id: 'summoner2', label: 'Summoner 2' },
  { id: 'autoattack', label: 'Auto Attack' },
  { id: 'item1', label: 'Item 1' },
  { id: 'item2', label: 'Item 2' },
  { id: 'item3', label: 'Item 3' },
  { id: 'item4', label: 'Item 4' },
]

interface Conflict {
  newAction: string
  newKey: string
  displacedAction: string
}

export function KeybindEditor() {
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const gamepadMap = useSettingsStore((s) => s.gamepadMap)
  const setHotkey = useSettingsStore((s) => s.setHotkey)
  const [listening, setListening] = useState<string | null>(null)
  const [listeningGamepad, setListeningGamepad] = useState<string | null>(null)
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const gamepadRafRef = useRef<number>(0)
  const prevButtonState = useRef<boolean[]>([])

  // Get the gamepad button name for an action
  function getGamepadButtonForAction(action: string): string {
    for (const [btn, act] of Object.entries(gamepadMap)) {
      if (act === action) return GAMEPAD_BUTTON_NAMES[Number(btn)] ?? btn
    }
    return '—'
  }

  // Keyboard binding
  function findConflict(action: string, key: string): string | null {
    for (const [existingAction, existingKey] of Object.entries(hotkeys)) {
      if (existingAction !== action && existingKey === key) return existingAction
    }
    return null
  }

  function handleStartListening(action: string) {
    setListening(action)
    setListeningGamepad(null)
    setTimeout(() => {
      function applyKey(newKey: string) {
        const displaced = findConflict(action, newKey)
        if (displaced) {
          setHotkey(displaced, '')
          setHotkey(action, newKey)
          setConflict({ newAction: action, newKey, displacedAction: displaced })
          setListening(displaced)
          cleanup()
          setTimeout(() => handleStartListening(displaced), 100)
          return
        }
        setHotkey(action, newKey)
        setConflict(null)
        setListening(null)
        cleanup()
      }

      const keyHandler = (e: KeyboardEvent) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (e.key === 'Escape') {
          setListening(null)
          cleanup()
          return
        }
        if (e.key.length === 1) {
          applyKey(e.key.toLowerCase())
        }
      }

      const mouseHandler = (e: MouseEvent) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        const mouseNames: Record<number, string> = { 0: 'mouse1', 1: 'mouse3', 2: 'mouse2', 3: 'mouse4', 4: 'mouse5' }
        const mouseKey = mouseNames[e.button]
        if (mouseKey) {
          applyKey(mouseKey)
        }
      }

      function cleanup() {
        document.removeEventListener('keydown', keyHandler, true)
        document.removeEventListener('mousedown', mouseHandler, true)
        document.removeEventListener('contextmenu', preventCtx, true)
      }

      const preventCtx = (e: Event) => { e.preventDefault(); e.stopImmediatePropagation() }

      document.addEventListener('keydown', keyHandler, true)
      document.addEventListener('mousedown', mouseHandler, true)
      document.addEventListener('contextmenu', preventCtx, true)
    }, 100)
  }

  // Gamepad binding — poll for button press
  function handleStartGamepadListening(action: string) {
    setListeningGamepad(action)
    setListening(null)
    prevButtonState.current = []
  }

  useEffect(() => {
    if (!listeningGamepad) {
      cancelAnimationFrame(gamepadRafRef.current)
      return
    }

    function poll() {
      const gamepads = navigator.getGamepads()
      for (const gp of gamepads) {
        if (!gp) continue
        for (let i = 0; i < gp.buttons.length; i++) {
          const pressed = gp.buttons[i]?.pressed ?? false
          const wasPressed = prevButtonState.current[i] ?? false
          if (pressed && !wasPressed && i !== 8 && i !== 9) {
            // Remove old mapping for this button
            // and remove this action from any other button
            const newMap = { ...useSettingsStore.getState().gamepadMap }
            // Clear any existing mapping of this button
            // Clear any button that already maps to this action
            for (const [btn, act] of Object.entries(newMap)) {
              if (act === listeningGamepad) delete newMap[Number(btn)]
            }
            newMap[i] = listeningGamepad!
            useSettingsStore.getState().setGamepadMap(newMap)
            setListeningGamepad(null)
            return
          }
          prevButtonState.current[i] = pressed
        }
      }
      gamepadRafRef.current = requestAnimationFrame(poll)
    }

    gamepadRafRef.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(gamepadRafRef.current)
  }, [listeningGamepad])

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-300">Keybinds</h3>

      {conflict && (
        <div className="rounded border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-400">
          <strong>{ACTIONS.find((a) => a.id === conflict.newAction)?.label}</strong> took{' '}
          <strong>{conflict.newKey.toUpperCase()}</strong> from{' '}
          <strong>{ACTIONS.find((a) => a.id === conflict.displacedAction)?.label}</strong>
          {' — press a new key for it'}
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-600">Action</span>
        <div className="flex items-center justify-center gap-1">
          <svg className="h-3 w-3 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
          </svg>
          <span className="text-[10px] text-neutral-600">Key</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <svg className="h-3 w-3 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
            <rect x="2" y="6" width="20" height="12" rx="4" />
          </svg>
          <span className="text-[10px] text-neutral-600">Pad</span>
        </div>
      </div>

      {/* Rows */}
      {ACTIONS.map(({ id, label }) => {
        const isKbListening = listening === id
        const isGpListening = listeningGamepad === id
        const isDisplaced = conflict?.displacedAction === id
        const isEmpty = !hotkeys[id]

        return (
          <div key={id} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
            <span className={`text-xs ${isDisplaced ? 'font-semibold text-amber-400' : 'text-neutral-400'}`}>
              {label}
            </span>

            {/* Keyboard */}
            <button
              onClick={() => handleStartListening(id)}
              className={`rounded border px-2 py-1 text-center text-xs font-mono transition-colors ${
                isKbListening
                  ? 'animate-pulse border-cyan-500 bg-cyan-950 text-cyan-400'
                  : isDisplaced || isEmpty
                    ? 'border-amber-600 bg-amber-950/50 text-amber-400'
                    : 'border-neutral-600 bg-neutral-800 text-white hover:border-neutral-500'
              }`}
            >
              {isKbListening ? '...' : isEmpty ? '—' : formatKeyDisplay(hotkeys[id] ?? '')}
            </button>

            {/* Gamepad */}
            <button
              onClick={() => handleStartGamepadListening(id)}
              className={`rounded border px-2 py-1 text-center text-xs font-mono transition-colors ${
                isGpListening
                  ? 'animate-pulse border-cyan-500 bg-cyan-950 text-cyan-400'
                  : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {isGpListening ? '...' : getGamepadButtonForAction(id)}
            </button>
          </div>
        )
      })}

      {listeningGamepad && (
        <div className="rounded border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-400">
          Press a button on your controller for <strong>{ACTIONS.find((a) => a.id === listeningGamepad)?.label}</strong>
        </div>
      )}
    </div>
  )
}
