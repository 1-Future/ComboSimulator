/**
 * Panel-based combo player — wraps all sections as draggable panels
 * managed by PanelManager with snap grid.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useComboStore } from '@/stores/comboStore'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEngine } from '@/hooks/useEngine'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { PanelManagerProvider } from '@/components/ui/PanelManager'
import { VideoPlayer } from './VideoPlayer'
import { TimingOverlay } from './TimingOverlay'
import { GradePopup } from './GradePopup'
import { EarlyLateIndicator } from './EarlyLateIndicator'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { Button } from '@/components/ui/Button'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'
import { KeyMapper, getUnknownInputs, applyMapping, ACTION_OPTIONS } from './KeyMapper'

// Speed + difficulty control bar
const SPEEDS = [0.5, 0.75, 1.0]
const DIFFICULTIES: Array<{ value: 'easy' | 'normal' | 'strict'; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'strict', label: 'Strict' },
]

function ControlBar() {
  const sfxVol = useSettingsStore((s) => s.volume)
  const vidVol = useSettingsStore((s) => s.videoVolume)
  const speed = useSettingsStore((s) => s.playbackSpeed)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const setVolume = useSettingsStore((s) => s.setVolume)
  const setVideoVolume = useSettingsStore((s) => s.setVideoVolume)
  const setSpeed = useSettingsStore((s) => s.setPlaybackSpeed)
  const setDifficulty = useSettingsStore((s) => s.setDifficulty)

  return (
    <div className="flex flex-wrap items-center gap-2 p-2">
      <div className="flex items-center gap-1">
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => setSpeed(s)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${speed === s ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
          >{s}x</button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {DIFFICULTIES.map((d) => (
          <button key={d.value} onClick={() => setDifficulty(d.value)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${difficulty === d.value ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
          >{d.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-neutral-500">SFX</span>
        <input type="range" min="0" max="1" step="0.05" value={sfxVol}
          onChange={(e) => setVolume(Number(e.target.value))} className="h-1 w-12 accent-cyan-500" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-neutral-500">Vid</span>
        <input type="range" min="0" max="1" step="0.05" value={vidVol}
          onChange={(e) => setVideoVolume(Number(e.target.value))} className="h-1 w-12 accent-cyan-500" />
      </div>
    </div>
  )
}

// Combo step keys display
function ComboSteps({ inputs, onReassign }: { inputs: ComboInput[]; onReassign: (idx: number, action: string) => void }) {
  const hits = useEngineStore((s) => s.hits)
  const currentStep = useEngineStore((s) => s.currentStep)
  const comboState = useEngineStore((s) => s.comboState)
  const { getKeyboardKey } = useDisplayKey()
  const [editingStep, setEditingStep] = useState<number | null>(null)

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  return (
    <div className="flex flex-wrap items-center gap-2 p-2">
      {inputs.map((input, index) => {
        const grade = hitGrades.get(index) as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : undefined
        const isCurrent = index === currentStep && comboState === 'playing'
        const borderColor = color ?? (isCurrent ? '#22d3ee' : '#334155')

        return (
          <div key={index} className="relative flex flex-col items-center">
            {isCurrent && <div className="absolute inset-0 m-auto h-10 w-10 animate-ping rounded-full opacity-30" style={{ backgroundColor: '#22d3ee' }} />}
            <button
              onClick={() => setEditingStep(editingStep === index ? null : index)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-mono font-bold ${isCurrent ? 'scale-110' : ''}`}
              style={{ borderColor, color: color ?? (isCurrent ? '#22d3ee' : '#94a3b8'), backgroundColor: color ? `${color}15` : 'rgba(10,20,40,0.9)' }}
            >
              {getKeyboardKey(input)}
            </button>
            {grade && <span className="mt-0.5 text-[8px] font-medium" style={{ color }}>{grade}</span>}

            {editingStep === index && (
              <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-neutral-600 bg-neutral-800 py-1 shadow-xl">
                {ACTION_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={(e) => { e.stopPropagation(); onReassign(index, opt.value); setEditingStep(null) }}
                    className={`block w-full px-2 py-1 text-left text-[10px] hover:bg-neutral-700 ${input.action === opt.value ? 'text-cyan-400' : 'text-neutral-300'}`}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Main Component ---

export function PanelComboPlayer() {
  const selectedCombo = useComboStore((s) => s.selectedCombo)
  const selectedChampion = useComboStore((s) => s.selectedChampion)
  const selectCombo = useComboStore((s) => s.selectCombo)
  const comboState = useEngineStore((s) => s.comboState)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { attachVideo, loadCombo, resetCombo } = useEngine()
  const [needsMapping, setNeedsMapping] = useState(false)
  const mappingDoneRef = useRef(false)
  const { getDisplayKey } = useDisplayKey()

  useEffect(() => {
    if (videoRef.current) attachVideo(videoRef.current)
  }, [attachVideo, selectedCombo])

  useEffect(() => {
    if (!selectedCombo) return
    if (mappingDoneRef.current) {
      mappingDoneRef.current = false
      setNeedsMapping(false)
      loadCombo()
      return
    }
    const unknowns = getUnknownInputs(selectedCombo.inputs)
    if (unknowns.length > 0) setNeedsMapping(true)
    else { setNeedsMapping(false); loadCombo() }
  }, [selectedCombo, loadCombo])

  const handleReset = useCallback(() => resetCombo(), [resetCombo])

  const handleReassign = useCallback((idx: number, action: string) => {
    if (!selectedCombo) return
    mappingDoneRef.current = true
    selectCombo({ ...selectedCombo, inputs: applyMapping(selectedCombo.inputs, idx, action) })
  }, [selectedCombo, selectCombo])

  const handleMappingComplete = useCallback((mapped: ComboInput[]) => {
    if (!selectedCombo) return
    mappingDoneRef.current = true
    selectCombo({ ...selectedCombo, inputs: mapped })
  }, [selectedCombo, selectCombo])

  useKeyboard({ ' ': handleReset }, !!selectedCombo && !needsMapping)

  if (!selectedCombo || !selectedChampion) {
    return (
      <div className="flex h-96 items-center justify-center text-neutral-500">
        {window.location.pathname.startsWith('/play/') ? 'Loading combo...' : 'Select a champion and combo'}
      </div>
    )
  }

  if (needsMapping) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <KeyMapper inputs={selectedCombo.inputs} videoRef={videoRef} onComplete={handleMappingComplete} />
        <div className="relative mt-4 overflow-hidden rounded-xl border border-neutral-700">
          <VideoPlayer ref={videoRef} filename={selectedCombo.video.filename} />
        </div>
      </div>
    )
  }

  // Default panel positions — tiled, no overlap
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  const h = typeof window !== 'undefined' ? window.innerHeight - 56 : 700

  // Layout math — everything tiles perfectly
  const sidebarW = Math.min(350, w * 0.28)
  const videoW = w - sidebarW
  const timelineH = 140
  const earlyLateH = 30
  const taskbarH = 24
  const bottomH = timelineH + earlyLateH + taskbarH
  const topH = h - bottomH
  const controlsH = 60
  const keysH = Math.floor((topH - controlsH) * 0.5)
  const statsH = topH - controlsH - keysH

  return (
    <div className="relative" style={{ height: `calc(100vh - 56px)` }}>
      {/* Splash bg */}
      {selectedChampion.splash && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `url(${selectedChampion.splash})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      )}

      <PanelManagerProvider
        panels={[
          {
            id: 'video',
            title: 'Video',
            defaultLayout: { x: 0, y: 0, w: videoW, h: topH, visible: true },
            minW: 320, minH: 200,
            content: (
              <div className="relative h-full">
                <VideoPlayer ref={videoRef} filename={selectedCombo.video.filename} fill />
                <GradePopup />
                {comboState === 'ready' && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">Press <span className="text-cyan-400">{getDisplayKey(selectedCombo.inputs[0]!)}</span></div>
                      <div className="mt-1 text-xs text-neutral-400">SPACE to reset</div>
                    </div>
                  </div>
                )}
                {comboState === 'complete' && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-2xl font-black text-green-400">Complete!</div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'controls',
            title: 'Controls',
            defaultLayout: { x: videoW, y: 0, w: sidebarW, h: controlsH, visible: true },
            minW: 200, minH: 50,
            content: (
              <div className="flex items-center gap-2 p-1">
                <ControlBar />
                <Button variant="secondary" size="sm" onClick={handleReset}>Reset</Button>
              </div>
            ),
          },
          {
            id: 'keys',
            title: 'Keys',
            defaultLayout: { x: videoW, y: controlsH, w: sidebarW, h: keysH, visible: true },
            minW: 200, minH: 60,
            content: <ComboSteps inputs={selectedCombo.inputs} onReassign={handleReassign} />,
          },
          {
            id: 'stats',
            title: 'Stats',
            defaultLayout: { x: videoW, y: controlsH + keysH, w: sidebarW, h: statsH, visible: true },
            minW: 200, minH: 100,
            content: <StatsPanel />,
          },
          {
            id: 'timeline',
            title: 'Timeline',
            defaultLayout: { x: 0, y: topH, w: w, h: timelineH, visible: true },
            minW: 300, minH: 80,
            content: <TimingOverlay inputs={selectedCombo.inputs} />,
          },
          {
            id: 'earlylate',
            title: 'Early/Late',
            defaultLayout: { x: 0, y: topH + timelineH, w: w, h: earlyLateH, visible: true },
            minW: 200, minH: 25,
            content: <EarlyLateIndicator />,
          },
        ]}
      />
    </div>
  )
}
