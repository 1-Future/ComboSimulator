import { useEffect, useRef, useCallback } from 'react'
import { useComboStore } from '@/stores/comboStore'
import { useEngineStore } from '@/stores/engineStore'
import { useEngine } from '@/hooks/useEngine'
import { VideoPlayer } from './VideoPlayer'
import { TimingOverlay } from './TimingOverlay'
import { InputDisplay } from './InputDisplay'
import { GradePopup } from './GradePopup'
import { ComboTimeline } from './ComboTimeline'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { Button } from '@/components/ui/Button'

export function ComboPlayer() {
  const selectedCombo = useComboStore((s) => s.selectedCombo)
  const selectedChampion = useComboStore((s) => s.selectedChampion)
  const comboState = useEngineStore((s) => s.comboState)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { attachVideo, loadCombo, resetCombo, seek } = useEngine()

  useEffect(() => {
    if (videoRef.current) {
      attachVideo(videoRef.current)
    }
  }, [attachVideo, selectedCombo])

  useEffect(() => {
    if (selectedCombo) {
      loadCombo()
    }
  }, [selectedCombo, loadCombo])

  const handleReset = useCallback(() => {
    resetCombo()
  }, [resetCombo])

  if (!selectedCombo || !selectedChampion) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        Select a champion and combo to start practicing
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {selectedChampion.name} — {selectedCombo.name}
          </h2>
          <p className="text-sm text-slate-400">{selectedCombo.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Reset
          </Button>
          {comboState === 'complete' && (
            <span className="rounded bg-green-900/50 px-2 py-1 text-xs font-medium text-green-400">
              Complete!
            </span>
          )}
        </div>
      </div>

      {/* Video + Overlay */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700">
        <VideoPlayer
          ref={videoRef}
          filename={selectedCombo.video.filename}
        />
        <GradePopup />
      </div>

      {/* Timing Bar */}
      <TimingOverlay inputs={selectedCombo.inputs} />

      {/* Input Display */}
      <InputDisplay inputs={selectedCombo.inputs} />

      {/* Timeline */}
      <ComboTimeline inputs={selectedCombo.inputs} onSeek={seek} />

      {/* Tips */}
      {selectedCombo.tips.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">Tips</h3>
          <ul className="space-y-1">
            {selectedCombo.tips.map((tip, i) => (
              <li key={i} className="text-xs text-slate-400">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <StatsPanel />
    </div>
  )
}
