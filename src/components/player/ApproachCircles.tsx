import { useRef, useEffect } from 'react'
import { timingEngine } from '@/engine/TimingEngine'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { GRADE_COLORS, GRADE_THRESHOLDS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'

interface ApproachCirclesProps {
  inputs: ComboInput[]
}

export function ApproachCircles({ inputs }: ApproachCirclesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const currentStep = useEngineStore((s) => s.currentStep)
  const comboState = useEngineStore((s) => s.comboState)
  const hits = useEngineStore((s) => s.hits)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const speed = useSettingsStore((s) => s.playbackSpeed)
  const { getDisplayKey } = useDisplayKey()

  const thresholds = GRADE_THRESHOLDS[difficulty]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const approachDuration = 1000 / speed // ms before the hit to start showing approach

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

      if (comboState !== 'playing' && comboState !== 'ready') {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const engineState = timingEngine.getState()
      const now = performance.now()
      const comboStart = engineState.comboStartTime
      const firstTime = inputs[0]?.time ?? 0

      // Show approach circles for next 3 upcoming steps
      const step = engineState.currentStep
      const visibleCount = Math.min(3, inputs.length - step)

      for (let i = 0; i < visibleCount; i++) {
        const stepIdx = step + i
        const input = inputs[stepIdx]
        if (!input) continue

        // Calculate how far away this step is in time
        let progress: number
        if (comboStart === null) {
          // Not started yet — show first step at center, ready
          progress = i === 0 ? 1 : 0
        } else {
          const expectedTimeMs = (input.time - firstTime) * 1000
          const elapsed = now - comboStart
          const remaining = expectedTimeMs - elapsed
          progress = 1 - Math.max(0, Math.min(1, remaining / approachDuration))
        }

        if (progress <= 0) continue

        // Position: spread across the width
        const cx = w / 2 + (i - 1) * (w / 4)
        const cy = h / 2

        const maxRadius = Math.min(w, h) * 0.35
        const innerRadius = maxRadius * 0.3
        const outerRadius = innerRadius + (maxRadius - innerRadius) * (1 - progress)

        // Determine color based on how close to perfect
        let ringColor: string = GRADE_COLORS.Good
        if (progress > 0.9) ringColor = GRADE_COLORS.Great
        if (progress > 0.95) ringColor = GRADE_COLORS.Perfect

        // Approach ring (shrinks inward)
        ctx.beginPath()
        ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2)
        ctx.strokeStyle = ringColor
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.4 + progress * 0.6
        ctx.stroke()
        ctx.globalAlpha = 1

        // Inner circle (fixed, the target)
        if (i === 0) {
          ctx.beginPath()
          ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
          ctx.fillStyle = `${ringColor}22`
          ctx.fill()
          ctx.strokeStyle = ringColor
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Key label
        const key = getDisplayKey(input)
        ctx.fillStyle = i === 0 ? '#ffffff' : '#94a3b8'
        ctx.font = `bold ${i === 0 ? 20 : 14}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(key, cx, cy)
      }

      // Show hit flash for recent hits
      const lastHit = hits[hits.length - 1]
      if (lastHit && now - lastHit.actualTime < 300) {
        const flashProgress = (now - lastHit.actualTime) / 300
        const color = GRADE_COLORS[lastHit.grade]
        const cx = w / 2 - (w / 4) // position where the hit happened
        const radius = 30 + flashProgress * 40

        ctx.beginPath()
        ctx.arc(cx, h / 2, radius, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.globalAlpha = 1 - flashProgress
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [inputs, comboState, currentStep, hits, difficulty, speed, getDisplayKey, thresholds])

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
