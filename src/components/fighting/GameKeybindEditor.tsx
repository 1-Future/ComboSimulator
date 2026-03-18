import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { GAME_INPUTS, NUMPAD_DIRECTIONS } from '@/types/gameInputs'
import { GAMEPAD_BUTTON_NAMES } from '@/types/settings'

interface GameKeybindEditorProps {
  gameId: string
}

export function GameKeybindEditor({ gameId }: GameKeybindEditorProps) {
  const config = GAME_INPUTS[gameId]
  const keybinds = useSettingsStore((s) => s.getGameKeybinds(gameId))
  const setKeybind = useSettingsStore((s) => s.setGameKeybind)
  const setDirection = useSettingsStore((s) => s.setGameDirection)
  const resetKeybinds = useSettingsStore((s) => s.resetGameKeybinds)
  const [listening, setListening] = useState<{ type: 'button' | 'direction'; id: string } | null>(null)

  if (!config) return null

  function startListening(type: 'button' | 'direction', id: string) {
    setListening({ type, id })
    setTimeout(() => {
      const handler = (e: KeyboardEvent) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (e.key === 'Escape') {
          setListening(null)
          cleanup()
          return
        }
        if (e.key.length === 1) {
          if (type === 'button') {
            setKeybind(gameId, id, e.key.toLowerCase())
          } else {
            setDirection(gameId, id, e.key.toLowerCase())
          }
          setListening(null)
          cleanup()
        }
      }
      function cleanup() {
        document.removeEventListener('keydown', handler, true)
      }
      document.addEventListener('keydown', handler, true)
    }, 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300">
          {config.gameId.toUpperCase()} Keybinds
        </h3>
        <button
          onClick={() => resetKeybinds(gameId)}
          className="text-[10px] text-neutral-500 hover:text-white"
        >
          Reset to defaults
        </button>
      </div>

      {/* Attack buttons */}
      <div>
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Buttons</div>
        <div className="grid grid-cols-[1fr_4rem_4rem] gap-1">
          <span className="text-[10px] text-neutral-600">Action</span>
          <span className="text-center text-[10px] text-neutral-600">Key</span>
          <span className="text-center text-[10px] text-neutral-600">Pad</span>

          {config.buttons.map((btn) => {
            const isListening = listening?.type === 'button' && listening.id === btn.id
            const key = keybinds.keyboard[btn.id] ?? ''
            const gpBtn = Object.entries(keybinds.gamepad).find(([, v]) => v === btn.id)?.[0]
            const gpName = gpBtn ? GAMEPAD_BUTTON_NAMES[Number(gpBtn)] ?? gpBtn : '—'

            return (
              <div key={btn.id} className="col-span-3 grid grid-cols-[1fr_4rem_4rem] items-center gap-1">
                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                  {btn.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: btn.color }} />}
                  {btn.name} ({btn.label})
                </span>
                <button
                  onClick={() => startListening('button', btn.id)}
                  className={`rounded border px-1 py-0.5 text-center text-xs font-mono ${
                    isListening
                      ? 'animate-pulse border-cyan-500 bg-cyan-950 text-cyan-400'
                      : 'border-neutral-700 bg-neutral-800 text-white hover:border-neutral-500'
                  }`}
                >
                  {isListening ? '...' : key.toUpperCase() || '—'}
                </button>
                <div className="rounded border border-neutral-800 bg-neutral-800/50 px-1 py-0.5 text-center text-xs font-mono text-neutral-500">
                  {gpName}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Directions */}
      <div>
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Directions</div>
        <div className="grid grid-cols-[1fr_4rem] gap-1">
          {Object.entries(config.defaultDirections).map(([dir]) => {
            const isListening = listening?.type === 'direction' && listening.id === dir
            const key = keybinds.directions[dir] ?? ''
            const arrow = NUMPAD_DIRECTIONS[dir] ?? dir

            return (
              <div key={dir} className="col-span-2 grid grid-cols-[1fr_4rem] items-center gap-1">
                <span className="text-xs text-neutral-400">{arrow} ({dir})</span>
                <button
                  onClick={() => startListening('direction', dir)}
                  className={`rounded border px-1 py-0.5 text-center text-xs font-mono ${
                    isListening
                      ? 'animate-pulse border-cyan-500 bg-cyan-950 text-cyan-400'
                      : 'border-neutral-700 bg-neutral-800 text-white hover:border-neutral-500'
                  }`}
                >
                  {isListening ? '...' : key.toUpperCase() || '—'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-[10px] text-neutral-600">
        Click a key slot then press any key to rebind. Escape to cancel.
      </div>
    </div>
  )
}
