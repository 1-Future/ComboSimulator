import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { timingEngine } from '@/engine/TimingEngine'
import { TimingOverlay } from '@/components/player/TimingOverlay'
import { EarlyLateIndicator } from '@/components/player/EarlyLateIndicator'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { GameKeybindEditor } from './GameKeybindEditor'
import { Button } from '@/components/ui/Button'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

interface FightingCombo {
  id: string
  name: string
  notation: string
  description: string
  difficulty: string
  inputs: ComboInput[]
  damage: string
}

interface CharacterData {
  characterId: string
  game: string
  gameName: string
  name: string
  combos: FightingCombo[]
}

const SPEEDS = [0.5, 0.75, 1.0]

export function NotationComboPlayer() {
  const { gameId, characterId } = useParams()
  const [charData, setCharData] = useState<CharacterData | null>(null)
  const [selectedCombo, setSelectedCombo] = useState<FightingCombo | null>(null)
  const [comboSearch, setComboSearch] = useState('')
  const [showKeybinds, setShowKeybinds] = useState(false)

  const comboState = useEngineStore((s) => s.comboState)
  const hits = useEngineStore((s) => s.hits)
  const currentStep = useEngineStore((s) => s.currentStep)
  const accuracy = useEngineStore((s) => s.accuracy)

  const speed = useSettingsStore((s) => s.playbackSpeed)
  const setSpeed = useSettingsStore((s) => s.setPlaybackSpeed)
  const difficulty = useSettingsStore((s) => s.difficulty)

  // Load character data
  useEffect(() => {
    if (!gameId || !characterId) return
    fetch(`/data/fighting/${gameId}/${characterId}.json`)
      .then((r) => r.json())
      .then((data: CharacterData) => {
        setCharData(data)
        if (data.combos.length > 0) {
          setSelectedCombo(data.combos[0]!)
        }
      })
      .catch(() => setCharData(null))
  }, [gameId, characterId])

  // Load combo into engine (no video — we simulate time progression)
  useEffect(() => {
    if (!selectedCombo || selectedCombo.inputs.length === 0) return

    const store = useEngineStore.getState()
    store.reset()

    // Set up the combo in the engine
    timingEngine.loadCombo(
      selectedCombo.inputs,
      difficulty,
      0,
      selectedCombo.inputs[0]?.time,
    )
    timingEngine.start()

    // Set video duration to combo duration + padding
    const lastInput = selectedCombo.inputs[selectedCombo.inputs.length - 1]
    const comboDuration = lastInput ? lastInput.time + 2 : 5
    store.setVideoDuration(comboDuration)

    // Seek to combo start
    timingEngine.seekToComboStart()
    timingEngine.pause()
    store.setComboState('ready')
  }, [selectedCombo, difficulty])

  // Simulate video time progression when "playing"
  // Since there's no video, we manually advance the video time via rAF
  useEffect(() => {
    if (comboState !== 'playing') return

    let rafId: number
    const startTime = performance.now()
    const startVideoTime = timingEngine.getVideoCurrentTime()
    let lastStore = 0

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000 * speed
      const newTime = startVideoTime + elapsed
      // Only update store at ~4fps to avoid re-render spam
      const now = performance.now()
      if (now - lastStore > 250) {
        useEngineStore.getState().setVideoCurrentTime(newTime)
        lastStore = now
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [comboState, speed])

  const handleReset = useCallback(() => {
    timingEngine.reset()
    timingEngine.seekToComboStart()
    timingEngine.pause()
    useEngineStore.getState().reset()
    useEngineStore.getState().setComboState('ready')
  }, [])

  // Space to reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        handleReset()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleReset])

  // First key starts the "playback" — use a ref to avoid re-subscribing
  const startedRef = useRef(false)
  useEffect(() => {
    startedRef.current = false
    const unsub = useEngineStore.subscribe((state) => {
      if (!startedRef.current && state.hits.length === 1 && state.comboState !== 'playing') {
        startedRef.current = true
        // Defer to avoid setState during render
        setTimeout(() => useEngineStore.getState().setComboState('playing'), 0)
      }
    })
    return unsub
  }, [selectedCombo])

  if (!charData) {
    return <div className="flex h-96 items-center justify-center text-neutral-500">Loading...</div>
  }

  const filteredCombos = charData.combos.filter(
    (c) => c.notation.toLowerCase().includes(comboSearch.toLowerCase()) || c.name.toLowerCase().includes(comboSearch.toLowerCase()),
  )

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/" className="hover:text-white">Games</Link>
        <span>/</span>
        <Link to={`/${gameId}`} className="hover:text-white">{charData.gameName}</Link>
        <span>/</span>
        <span className="text-white">{charData.name}</span>
      </div>

      <div className="flex gap-6">
        {/* Combo list sidebar */}
        <div className="w-72 shrink-0">
          <h2 className="mb-2 text-lg font-bold text-white">{charData.name}</h2>
          <p className="mb-3 text-xs text-neutral-500">{charData.combos.length} combos</p>

          <input
            type="text"
            placeholder="Search combos..."
            value={comboSearch}
            onChange={(e) => setComboSearch(e.target.value)}
            className="mb-2 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
          />

          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {filteredCombos.map((combo) => (
              <button
                key={combo.id}
                onClick={() => setSelectedCombo(combo)}
                className={`w-full rounded-lg border p-2 text-left transition-all ${
                  selectedCombo?.id === combo.id
                    ? 'border-red-500 bg-red-950/30'
                    : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className="truncate text-xs font-mono text-neutral-300">{combo.notation}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  {combo.damage && <span className="text-[10px] text-neutral-500">{combo.damage} dmg</span>}
                  <span className={`text-[10px] ${
                    combo.difficulty === 'beginner' ? 'text-green-500' :
                    combo.difficulty === 'intermediate' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>{combo.difficulty}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main player area */}
        <div className="flex-1">
          {selectedCombo ? (
            <>
              {/* Combo info + controls */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Combo</h3>
                  <p className="mt-1 max-w-lg font-mono text-sm text-neutral-300">{selectedCombo.notation}</p>
                  {selectedCombo.description && (
                    <p className="mt-1 text-xs text-neutral-500">{selectedCombo.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => setSpeed(s)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${speed === s ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                    >{s}x</button>
                  ))}
                  <Button variant="secondary" size="sm" onClick={handleReset}>Reset</Button>
                </div>
              </div>

              {/* State overlay */}
              {comboState === 'ready' && (
                <div className="mb-4 rounded-lg border border-neutral-700 bg-neutral-900 p-6 text-center">
                  <div className="text-lg font-black text-white">
                    Press the first input to start
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    SPACE to reset — inputs are timed from frame data
                  </div>
                </div>
              )}
              {comboState === 'complete' && (
                <div className="mb-4 rounded-lg border border-green-900 bg-green-950/30 p-6 text-center">
                  <div className="text-2xl font-black text-green-400">Combo Complete!</div>
                  <div className="mt-1 text-sm text-neutral-400">
                    {accuracy.toFixed(0)}% accuracy — SPACE to retry
                  </div>
                </div>
              )}

              {/* Notation input sequence */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {selectedCombo.inputs.map((input, index) => {
                  const grade = hitGrades.get(index) as Grade | undefined
                  const color = grade ? GRADE_COLORS[grade] : undefined
                  const isCurrent = index === currentStep && comboState === 'playing'

                  return (
                    <div key={index} className="relative flex flex-col items-center">
                      {isCurrent && (
                        <div className="absolute inset-0 m-auto h-10 w-10 animate-ping rounded-full opacity-20" style={{ backgroundColor: '#ef4444' }} />
                      )}
                      <div
                        className={`flex h-9 min-w-9 items-center justify-center rounded-full border-2 px-2 text-[10px] font-mono font-bold transition-all ${
                          isCurrent ? 'scale-110' : ''
                        }`}
                        style={{
                          borderColor: color ?? (isCurrent ? '#ef4444' : '#404040'),
                          color: color ?? (isCurrent ? '#ef4444' : '#9ca3af'),
                          backgroundColor: color ? `${color}15` : isCurrent ? 'rgba(239,68,68,0.1)' : 'rgba(23,23,23,0.9)',
                        }}
                      >
                        {input.label || input.key}
                      </div>
                      {grade && (
                        <span className="mt-0.5 text-[8px] font-medium" style={{ color }}>{grade}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Timeline */}
              <TimingOverlay inputs={selectedCombo.inputs} />

              {/* Early/Late */}
              <EarlyLateIndicator />

              {/* Controls hint + keybind toggle */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                  <span><kbd className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-neutral-400">SPACE</kbd> reset</span>
                  <span>Timing from frame data</span>
                </div>
                <button
                  onClick={() => setShowKeybinds(!showKeybinds)}
                  className="text-[11px] text-neutral-500 hover:text-white"
                >
                  {showKeybinds ? 'Hide Keybinds' : 'Keybinds'}
                </button>
              </div>

              {/* Per-game keybind editor */}
              {showKeybinds && gameId && (
                <div className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
                  <GameKeybindEditor gameId={gameId} />
                </div>
              )}

              {/* Stats */}
              <StatsPanel />
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-neutral-500">
              Select a combo from the left
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
