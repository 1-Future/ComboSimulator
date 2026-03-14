import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useEngineStore } from '@/stores/engineStore'
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
  const rafRef = useRef<number>(0)
  const videoDuration = useEngineStore((s) => s.videoDuration)
  const { getDisplayKey } = useDisplayKey()
  const hits = useEngineStore((s) => s.hits)

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

  // Calculate vertical rows for labels to avoid overlap
  // Labels that are too close get staggered to different rows
  const labelRows = useMemo(() => {
    const percents = inputs.map((input) => timeToPercent(input.time))
    const rows: number[] = new Array(inputs.length).fill(0)
    const minGap = 4 // minimum % gap before labels overlap (~40px on 1000px bar)

    for (let i = 1; i < percents.length; i++) {
      const prevPercent = percents[i - 1]!
      const currPercent = percents[i]!
      const prevRow = rows[i - 1]!

      if (Math.abs(currPercent - prevPercent) < minGap) {
        // Too close — put on a different row
        rows[i] = (prevRow + 1) % 3
      } else {
        rows[i] = 0
      }
    }
    return rows
  }, [inputs, timeToPercent])

  // Update marker via rAF — reads engine directly, no Zustand
  useEffect(() => {
    function tick() {
      if (markerRef.current) {
        const t = timingEngine.getVideoCurrentTime()
        const pct = ((t - rangeStart) / rangeDuration) * 100
        markerRef.current.style.left = `${Math.max(0, Math.min(100, pct))}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rangeStart, rangeDuration])

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  // Row positions: row 0 = bottom, row 1 = middle, row 2 = top
  const rowPositions = ['bottom-1', 'bottom-7', 'bottom-13']

  return (
    <div className="relative h-20 w-full overflow-hidden rounded-b-lg bg-slate-700/80">
      {/* Current time marker */}
      <div
        ref={markerRef}
        className="absolute top-0 h-full w-0.5 bg-yellow-400"
        style={{ left: '0%' }}
      />

      {inputs.map((input, index) => {
        const percent = timeToPercent(input.time)
        const grade = hitGrades.get(index) as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : '#ffffff'
        const row = labelRows[index] ?? 0

        return (
          <div key={index}>
            {/* Marker line */}
            <div
              className="absolute top-0 h-full w-0.5"
              style={{ left: `${percent}%`, backgroundColor: color, opacity: 0.5 }}
            />
            {/* Key label — staggered vertically */}
            <div
              className={`absolute -translate-x-1/2 rounded border px-1.5 py-0.5 text-[10px] font-bold ${rowPositions[row]}`}
              style={{
                left: `${percent}%`,
                borderColor: color,
                color: color,
                backgroundColor: grade ? `${color}22` : 'rgba(10, 44, 74, 0.9)',
              }}
            >
              {getDisplayKey(input)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
