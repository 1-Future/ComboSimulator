import { useRef, useEffect } from 'react'
import { useEngineStore } from '@/stores/engineStore'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

interface TimingOverlayProps {
  inputs: ComboInput[]
}

export function TimingOverlay({ inputs }: TimingOverlayProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const videoCurrentTime = useEngineStore((s) => s.videoCurrentTime)
  const videoDuration = useEngineStore((s) => s.videoDuration)
  const hits = useEngineStore((s) => s.hits)

  // Update marker position via direct DOM manipulation (no React re-render per frame)
  useEffect(() => {
    if (!markerRef.current || !videoDuration) return
    const percent = (videoCurrentTime / videoDuration) * 100
    markerRef.current.style.left = `${percent}%`
  }, [videoCurrentTime, videoDuration])

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  return (
    <div
      ref={barRef}
      className="relative h-12 w-full cursor-pointer overflow-hidden bg-slate-700/80"
    >
      {/* Current time marker */}
      <div
        ref={markerRef}
        className="absolute top-0 h-full w-0.5 bg-yellow-400"
        style={{ left: '0%' }}
      />

      {/* Combo step markers and labels */}
      {inputs.map((input, index) => {
        const percent = videoDuration ? (input.time / videoDuration) * 100 : 0
        const grade = hitGrades.get(index) as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : '#ffffff'

        return (
          <div key={index}>
            {/* Marker line */}
            <div
              className="absolute top-0 h-full w-1"
              style={{
                left: `${percent}%`,
                backgroundColor: color,
              }}
            />
            {/* Key label */}
            <div
              className="absolute bottom-1 -translate-x-1/2 rounded border px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                left: `${percent}%`,
                borderColor: color,
                color: color,
                backgroundColor: grade ? `${color}22` : 'rgba(10, 44, 74, 0.9)',
              }}
            >
              {input.key}
            </div>
          </div>
        )
      })}
    </div>
  )
}
