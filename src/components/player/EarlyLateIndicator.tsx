import { useEngineStore } from '@/stores/engineStore'
import { GRADE_COLORS } from '@/lib/constants'

export function EarlyLateIndicator() {
  const lastHit = useEngineStore((s) => s.lastHit)

  if (!lastHit || lastHit.stepIndex === 0) return null

  const { offset, grade } = lastHit
  const color = GRADE_COLORS[grade]
  const abs = Math.abs(offset)
  const isEarly = offset < 0
  const isPerfect = grade === 'Perfect'

  return (
    <div
      key={`${lastHit.stepIndex}-${lastHit.offset}`}
      className="flex animate-[fadeOut_1s_ease-out_forwards] items-center justify-center gap-1 py-1"
    >
      {/* Early arrow */}
      {!isPerfect && isEarly && (
        <svg className="h-3 w-3" style={{ color }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      )}

      {/* Offset text */}
      <span className="text-xs font-bold" style={{ color }}>
        {isPerfect ? 'PERFECT' : `${isEarly ? 'EARLY' : 'LATE'} ${abs.toFixed(0)}ms`}
      </span>

      {/* Late arrow */}
      {!isPerfect && !isEarly && (
        <svg className="h-3 w-3" style={{ color }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 5l7 7-7 7" />
        </svg>
      )}

      {/* Visual bar showing offset magnitude */}
      <div className="relative ml-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
        <div className="absolute top-0 left-1/2 h-full w-px bg-white/50" />
        <div
          className="absolute top-0 h-full rounded-full transition-all"
          style={{
            backgroundColor: color,
            width: `${Math.min(50, (abs / 100) * 50)}%`,
            left: isEarly ? `${50 - Math.min(50, (abs / 100) * 50)}%` : '50%',
          }}
        />
      </div>
    </div>
  )
}
