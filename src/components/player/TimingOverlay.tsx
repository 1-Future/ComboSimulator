import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { timingEngine } from '@/engine/TimingEngine'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

interface TimingOverlayProps {
  inputs: ComboInput[]
}

export function TimingOverlay({ inputs }: TimingOverlayProps) {
  const markerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const videoDuration = useEngineStore((s) => s.videoDuration)
  const { getDisplayKey } = useDisplayKey()
  const hits = useEngineStore((s) => s.hits)
  const currentStep = useEngineStore((s) => s.currentStep)
  const comboState = useEngineStore((s) => s.comboState)
  const speed = useSettingsStore((s) => s.playbackSpeed)

  const { rangeStart, rangeDuration } = useMemo(() => {
    if (inputs.length === 0) return { rangeStart: 0, rangeDuration: 1 }
    const times = inputs.map((i) => i.time)
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const span = maxTime - minTime
    const padding = Math.max(span * 0.15, 0.3)
    const rs = Math.max(0, minTime - padding)
    const re = Math.min(videoDuration || maxTime + padding, maxTime + padding)
    return { rangeStart: rs, rangeDuration: re - rs }
  }, [inputs, videoDuration])

  const timeToPercent = useCallback(
    (time: number) => {
      if (rangeDuration <= 0) return 0
      return ((time - rangeStart) / rangeDuration) * 100
    },
    [rangeStart, rangeDuration],
  )

  // Label staggering
  const labelRows = useMemo(() => {
    const percents = inputs.map((input) => timeToPercent(input.time))
    const rows: number[] = new Array(inputs.length).fill(0)
    const minGap = 4

    for (let i = 1; i < percents.length; i++) {
      const prevPercent = percents[i - 1]!
      const currPercent = percents[i]!
      const prevRow = rows[i - 1]!

      if (Math.abs(currPercent - prevPercent) < minGap) {
        rows[i] = (prevRow + 1) % 3
      } else {
        rows[i] = 0
      }
    }
    return rows
  }, [inputs, timeToPercent])

  // Unified rAF loop — updates marker + draws approach rings on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const approachDuration = 1200 / speed

    function tick() {
      if (!ctx || !canvas || !container) return

      // Size canvas to match container
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)
      }

      const w = rect.width
      const h = rect.height

      // Update playhead marker
      if (markerRef.current) {
        const t = timingEngine.getVideoCurrentTime()
        const pct = ((t - rangeStart) / rangeDuration) * 100
        markerRef.current.style.left = `${Math.max(0, Math.min(100, pct))}%`
      }

      // Clear canvas
      ctx.clearRect(0, 0, w, h)

      // Draw approach rings for upcoming steps
      if (comboState === 'playing' || comboState === 'ready') {
        const engineState = timingEngine.getState()
        const now = performance.now()
        const comboStart = engineState.comboStartTime
        const firstTime = inputs[0]?.time ?? 0
        const step = engineState.currentStep

        for (let si = step; si < Math.min(step + 4, inputs.length); si++) {
          const input = inputs[si]
          if (!input) continue

          const percent = timeToPercent(input.time)
          const cx = (percent / 100) * w
          // Match the stagger rows from the DOM labels
          const rowIdx = labelRows[si] ?? 0
          const rowPcts = [50, 25, 75]
          const cy = (rowPcts[rowIdx]! / 100) * h

          let progress: number
          if (comboStart === null) {
            progress = si === step ? 0.8 : 0
          } else {
            const expectedTimeMs = ((input.time - firstTime) * 1000) / speed
            const elapsed = now - comboStart
            const remaining = expectedTimeMs - elapsed
            progress = 1 - Math.max(0, Math.min(1, remaining / approachDuration))
          }

          if (progress <= 0) continue

          const maxRadius = h * 0.45
          const innerRadius = 12
          const outerRadius = innerRadius + (maxRadius - innerRadius) * (1 - progress)

          // Ring color
          let ringColor: string = GRADE_COLORS.Good
          if (progress > 0.85) ringColor = GRADE_COLORS.Great
          if (progress > 0.93) ringColor = GRADE_COLORS.Perfect

          // Outer approach ring
          ctx.beginPath()
          ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2)
          ctx.strokeStyle = ringColor
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.3 + progress * 0.7
          ctx.stroke()
          ctx.globalAlpha = 1

          // Inner target circle (only for current step)
          if (si === step) {
            ctx.beginPath()
            ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
            ctx.fillStyle = `${ringColor}33`
            ctx.fill()
            ctx.strokeStyle = ringColor
            ctx.lineWidth = 2
            ctx.stroke()
          }
        }

        // Hit flash for recent hits
        const lastHit = hits[hits.length - 1]
        if (lastHit && now - lastHit.actualTime < 250) {
          const flashProgress = (now - lastHit.actualTime) / 250
          const color = GRADE_COLORS[lastHit.grade]
          const input = inputs[lastHit.stepIndex]
          if (input) {
            const percent = timeToPercent(input.time)
            const cx = (percent / 100) * w
            const hitRowIdx = labelRows[lastHit.stepIndex] ?? 0
            const hitRowPcts = [50, 25, 75]
            const hitCy = (hitRowPcts[hitRowIdx]! / 100) * h
            const radius = 12 + flashProgress * 30

            ctx.beginPath()
            ctx.arc(cx, hitCy, radius, 0, Math.PI * 2)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.globalAlpha = 1 - flashProgress
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rangeStart, rangeDuration, inputs, comboState, currentStep, hits, speed, timeToPercent])

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))
  const rowOffsets = [50, 25, 75] // % from top — stagger vertically

  return (
    <div ref={containerRef} className="relative h-28 w-full overflow-hidden rounded-b-lg bg-slate-800/90">
      {/* Canvas for approach circles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* Current time marker */}
      <div
        ref={markerRef}
        className="absolute top-0 z-10 h-full w-0.5 bg-yellow-400"
        style={{ left: '0%' }}
      />

      {/* Step markers and circle labels */}
      {inputs.map((input, index) => {
        const percent = timeToPercent(input.time)
        const grade = hitGrades.get(index) as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : '#94a3b8'
        const row = labelRows[index] ?? 0
        const isCurrent = index === currentStep && (comboState === 'playing' || comboState === 'ready')
        const topPercent = rowOffsets[row] ?? 50

        return (
          <div key={index}>
            {/* Vertical marker line */}
            <div
              className="absolute top-0 h-full w-px"
              style={{ left: `${percent}%`, backgroundColor: color, opacity: 0.15 }}
            />
            {/* Circle note */}
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all"
              style={{ left: `${percent}%`, top: `${topPercent}%` }}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  isCurrent ? 'scale-125' : ''
                }`}
                style={{
                  borderColor: color,
                  color,
                  backgroundColor: grade ? `${color}22` : 'rgba(10, 44, 74, 0.9)',
                }}
              >
                {getDisplayKey(input)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
