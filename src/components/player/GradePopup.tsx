import { useEngineStore } from '@/stores/engineStore'
import { GRADE_COLORS } from '@/lib/constants'

export function GradePopup() {
  const lastHit = useEngineStore((s) => s.lastHit)

  if (!lastHit) return null

  const color = GRADE_COLORS[lastHit.grade]

  // Use key to force re-mount and re-trigger CSS animation on each new hit
  return (
    <div
      key={`${lastHit.stepIndex}-${lastHit.offset}`}
      className="pointer-events-none absolute inset-0 flex animate-[fadeOut_0.8s_ease-out_forwards] items-center justify-center"
    >
      <div className="animate-bounce text-center" style={{ color }}>
        <div className="text-4xl font-black drop-shadow-lg">{lastHit.grade}</div>
        <div className="text-lg font-semibold opacity-80">
          {lastHit.offset > 0 ? '+' : ''}
          {lastHit.offset.toFixed(0)}ms
        </div>
      </div>
    </div>
  )
}
