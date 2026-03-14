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

  const timeToFraction = useCallback(
    (time: number) => {
      if (rangeDuration <= 0) return 0
      return (time - rangeStart) / rangeDuration
    },
    [rangeStart, rangeDuration],
  )

  // Stagger rows for overlapping labels
  const labelRows = useMemo(() => {
    const fracs = inputs.map((input) => timeToFraction(input.time))
    const rows: number[] = new Array(inputs.length).fill(0)
    const minGap = 0.04

    for (let i = 1; i < fracs.length; i++) {
      const prev = fracs[i - 1]!
      const curr = fracs[i]!
      const prevRow = rows[i - 1]!
      if (Math.abs(curr - prev) < minGap) {
        rows[i] = (prevRow + 1) % 3
      } else {
        rows[i] = 0
      }
    }
    return rows
  }, [inputs, timeToFraction])

  // Pre-compute display keys (can't call hook inside rAF)
  const displayKeys = useMemo(() => inputs.map((i) => getDisplayKey(i)), [inputs, getDisplayKey])

  // All rendering on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hitGradesMap = new Map(hits.map((h) => [h.stepIndex, h.grade as Grade]))
    const approachDuration = 1200 / speed
    const noteRadius = 16
    const rowYOffsets = [0.78, 0.48, 0.18] // fraction from top for each stagger row

    function tick() {
      if (!ctx || !canvas || !container) return

      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const w = rect.width
      const h = rect.height

      ctx.clearRect(0, 0, w, h)

      // Draw playhead
      const videoTime = timingEngine.getVideoCurrentTime()
      const playheadX = timeToFraction(videoTime) * w
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, h)
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 2
      ctx.stroke()

      const engineState = timingEngine.getState()
      const now = performance.now()

      // Draw each note
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        if (!input) continue

        const frac = timeToFraction(input.time)
        const cx = frac * w
        const row = labelRows[i] ?? 0
        const cy = (rowYOffsets[row] ?? 0.78) * h
        const grade = hitGradesMap.get(i)
        const color = grade ? GRADE_COLORS[grade] : '#94a3b8'
        const isCurrentStep = i === engineState.currentStep
        const isHit = !!grade
        const key = displayKeys[i] ?? '?'

        // Vertical guide line
        ctx.beginPath()
        ctx.moveTo(cx, 0)
        ctx.lineTo(cx, h)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.1
        ctx.stroke()
        ctx.globalAlpha = 1

        // Approach ring (for upcoming steps) — driven by video time, not wall clock
        if (!isHit && (comboState === 'playing' || comboState === 'ready') && i >= engineState.currentStep) {
          const approachWindow = 1.2 // seconds before the note to start showing ring
          const timeUntilNote = input.time - videoTime
          let progress: number
          if (engineState.comboStartTime === null) {
            progress = isCurrentStep ? 0.6 : 0
          } else {
            progress = 1 - Math.max(0, Math.min(1, timeUntilNote / approachWindow))
          }

          if (progress > 0) {
            const outerR = noteRadius + (noteRadius * 2.5) * (1 - progress)

            // Ring color based on proximity
            let ringColor: string = GRADE_COLORS.Good
            if (progress > 0.85) ringColor = GRADE_COLORS.Great
            if (progress > 0.93) ringColor = GRADE_COLORS.Perfect

            ctx.beginPath()
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
            ctx.strokeStyle = ringColor
            ctx.lineWidth = 2.5
            ctx.globalAlpha = 0.3 + progress * 0.7
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }

        // Hit flash
        if (isHit) {
          const hitData = hits.find((h) => h.stepIndex === i)
          if (hitData && now - hitData.actualTime < 300) {
            const flashProgress = (now - hitData.actualTime) / 300
            const flashR = noteRadius + flashProgress * 25
            ctx.beginPath()
            ctx.arc(cx, cy, flashR, 0, Math.PI * 2)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.globalAlpha = 1 - flashProgress
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }

        // Note circle
        const scale = isCurrentStep ? 1.2 : 1
        const r = noteRadius * scale

        // Fill
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = isHit ? `${color}33` : isCurrentStep ? 'rgba(8,145,178,0.2)' : 'rgba(10,20,40,0.9)'
        ctx.fill()

        // Border
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = isCurrentStep ? '#22d3ee' : color
        ctx.lineWidth = isCurrentStep ? 2.5 : 1.5
        ctx.stroke()

        // Key text
        ctx.fillStyle = isCurrentStep ? '#22d3ee' : color
        ctx.font = `bold ${scale * 11}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(key, cx, cy)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rangeStart, rangeDuration, inputs, comboState, currentStep, hits, speed, timeToFraction, labelRows, displayKeys])

  return (
    <div ref={containerRef} className="relative h-28 w-full rounded-b-lg bg-slate-800/90">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
      />
    </div>
  )
}
