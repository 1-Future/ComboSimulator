import { useRef, useEffect, useMemo } from 'react'
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

// How many seconds of the combo are visible at once
const WINDOW_SECONDS = 5

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

  // Full combo time range (for the mini progress bar)
  const { comboStart, comboEnd } = useMemo(() => {
    if (inputs.length === 0) return { comboStart: 0, comboEnd: 1 }
    const times = inputs.map((i) => i.time)
    return { comboStart: Math.min(...times), comboEnd: Math.max(...times) }
  }, [inputs])

  // Stagger rows for overlapping labels
  const labelRows = useMemo(() => {
    if (inputs.length === 0) return []
    const rows: number[] = new Array(inputs.length).fill(0)
    // Use time gaps to determine stagger
    for (let i = 1; i < inputs.length; i++) {
      const gap = inputs[i]!.time - inputs[i - 1]!.time
      const prevRow = rows[i - 1]!
      if (gap < 0.4) {
        rows[i] = (prevRow + 1) % 3
      } else {
        rows[i] = 0
      }
    }
    return rows
  }, [inputs])

  // Pre-compute display keys
  const displayKeys = useMemo(() => inputs.map((i) => getDisplayKey(i)), [inputs, getDisplayKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const noteRadius = 16
    const rowYOffsets = [0.75, 0.45, 0.18]

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

      const videoTime = timingEngine.getVideoCurrentTime()
      const engineState = timingEngine.getState()
      const now = performance.now()
      const hitGradesMap = new Map(hits.map((ht) => [ht.stepIndex, ht.grade as Grade]))

      // Sliding window: show WINDOW_SECONDS centered slightly ahead of current time
      // 30% of the window is behind (past), 70% is ahead (future)
      const windowSize = WINDOW_SECONDS / speed
      const windowStart = videoTime - windowSize * 0.3
      const windowEnd = videoTime + windowSize * 0.7

      // Convert time to x position within the window
      function timeToX(t: number): number {
        return ((t - windowStart) / (windowEnd - windowStart)) * w
      }

      // Draw "consumed" background — dark overlay on the left (past)
      const nowX = timeToX(videoTime)
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, nowX, h)

      // Draw playhead
      ctx.beginPath()
      ctx.moveTo(nowX, 0)
      ctx.lineTo(nowX, h)
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw each note (only if within visible window)
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        if (!input) continue

        // Skip notes outside visible window
        if (input.time < windowStart - 1 || input.time > windowEnd + 1) continue

        const cx = timeToX(input.time)
        const row = labelRows[i] ?? 0
        const cy = (rowYOffsets[row] ?? 0.75) * h
        const grade = hitGradesMap.get(i)
        const color = grade ? GRADE_COLORS[grade] : '#94a3b8'
        const isCurrentStep = i === engineState.currentStep
        const isHit = !!grade
        const isPast = input.time < videoTime
        const key = displayKeys[i] ?? '?'

        // Fade past notes
        const alpha = isPast && isHit ? 0.4 : isPast && !isHit ? 0.2 : 1
        ctx.globalAlpha = alpha

        // Vertical guide line
        ctx.beginPath()
        ctx.moveTo(cx, 0)
        ctx.lineTo(cx, h)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.globalAlpha = alpha * 0.1
        ctx.stroke()
        ctx.globalAlpha = alpha

        // Approach ring — collapses to match the drawn circle size
        if (!isHit && comboState === 'playing' && i >= engineState.currentStep) {
          const timeUntilNote = input.time - videoTime
          const progress = 1 - Math.max(0, Math.min(1, timeUntilNote / 0.8))
          // Target radius matches the actual drawn note (scaled for current step)
          const targetR = isCurrentStep ? noteRadius * 1.2 : noteRadius

          if (progress > 0) {
            const outerR = targetR + (noteRadius * 2.5) * (1 - progress)
            let ringColor: string = GRADE_COLORS.Good
            if (progress > 0.85) ringColor = GRADE_COLORS.Great
            if (progress > 0.93) ringColor = GRADE_COLORS.Perfect

            ctx.beginPath()
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
            ctx.strokeStyle = ringColor
            ctx.lineWidth = 2.5
            ctx.globalAlpha = alpha * (0.3 + progress * 0.7)
            ctx.stroke()
            ctx.globalAlpha = alpha
          }
        }

        // Hit glow
        if (isHit) {
          const hitData = hits.find((ht) => ht.stepIndex === i)
          if (hitData && now - hitData.actualTime < 200) {
            const flashProgress = (now - hitData.actualTime) / 200
            ctx.beginPath()
            ctx.arc(cx, cy, noteRadius, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.globalAlpha = 0.4 * (1 - flashProgress)
            ctx.fill()
            ctx.globalAlpha = alpha
          }
        }

        // Note circle
        const scale = isCurrentStep ? 1.2 : 1
        const r = noteRadius * scale

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = isHit ? `${color}33` : isCurrentStep ? 'rgba(8,145,178,0.2)' : 'rgba(10,20,40,0.9)'
        ctx.fill()

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

        ctx.globalAlpha = 1
      }

      // Mini progress bar at the bottom — shows position in the full combo
      const progressBarH = 3
      const progressBarY = h - progressBarH
      ctx.fillStyle = 'rgba(51,65,85,0.5)'
      ctx.fillRect(0, progressBarY, w, progressBarH)

      if (comboEnd > comboStart) {
        const progressFrac = Math.max(0, Math.min(1, (videoTime - comboStart) / (comboEnd - comboStart)))
        ctx.fillStyle = '#22d3ee'
        ctx.fillRect(0, progressBarY, w * progressFrac, progressBarH)

        // Dot markers for each note on the progress bar
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i]
          if (!input) continue
          const dotX = ((input.time - comboStart) / (comboEnd - comboStart)) * w
          const grade = hitGradesMap.get(i)
          ctx.fillStyle = grade ? GRADE_COLORS[grade] : '#475569'
          ctx.fillRect(dotX - 1, progressBarY, 2, progressBarH)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [inputs, comboState, currentStep, hits, speed, comboStart, comboEnd, labelRows, displayKeys, videoDuration])

  return (
    <div ref={containerRef} className="relative h-28 w-full rounded-b-lg bg-neutral-800/90">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
