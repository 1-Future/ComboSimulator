import { useState, useCallback, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  createCalibrationSession,
  addSample,
  calculateCalibrationOffset,
  type CalibrationSession,
} from '@/engine/Calibration'
import { Button } from '@/components/ui/Button'

function triggerFlash(
  setShowFlash: (v: boolean) => void,
  setFlashTime: (v: number) => void,
) {
  setTimeout(() => {
    setShowFlash(true)
    setFlashTime(performance.now())
    setTimeout(() => setShowFlash(false), 100)
  }, 1000 + Math.random() * 2000)
}

export function CalibrationWizard() {
  const calibrationOffset = useSettingsStore((s) => s.calibrationOffset)
  const setCalibrationOffset = useSettingsStore((s) => s.setCalibrationOffset)
  const [session, setSession] = useState<CalibrationSession | null>(null)
  const [flashTime, setFlashTime] = useState<number | null>(null)
  const [showFlash, setShowFlash] = useState(false)

  const startCalibration = useCallback(() => {
    setSession(createCalibrationSession(10))
    triggerFlash(setShowFlash, setFlashTime)
  }, [])

  useEffect(() => {
    if (!session?.isRunning) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && flashTime !== null) {
        e.preventDefault()
        const offset = performance.now() - flashTime
        const updated = addSample(session, offset)
        setSession(updated)
        setFlashTime(null)

        if (updated.isRunning) {
          triggerFlash(setShowFlash, setFlashTime)
        } else {
          const result = calculateCalibrationOffset(updated.samples)
          setCalibrationOffset(Math.round(result))
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [session, flashTime, setCalibrationOffset])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-300">Input Calibration</h3>
      <p className="mb-2 text-xs text-slate-400">
        Current offset: <strong className="text-white">{calibrationOffset}ms</strong>
      </p>

      {!session ? (
        <Button size="sm" variant="secondary" onClick={startCalibration}>
          Start Calibration
        </Button>
      ) : session.isRunning ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Round {session.currentRound + 1}/{session.totalRounds} — Press SPACE when you see the flash
          </p>
          <div
            className={`h-16 w-full rounded-lg transition-colors ${
              showFlash ? 'bg-cyan-400' : 'bg-slate-700'
            }`}
          />
        </div>
      ) : (
        <div>
          <p className="text-xs text-green-400">
            Calibration complete! Offset: {calibrationOffset}ms
          </p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={startCalibration}>
            Recalibrate
          </Button>
        </div>
      )}
    </div>
  )
}
