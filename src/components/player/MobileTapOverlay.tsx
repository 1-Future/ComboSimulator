import { useEngineStore } from '@/stores/engineStore'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

interface MobileTapOverlayProps {
  inputs: ComboInput[]
}

export function MobileTapOverlay({ inputs }: MobileTapOverlayProps) {
  const comboState = useEngineStore((s) => s.comboState)
  const currentStep = useEngineStore((s) => s.currentStep)
  const hits = useEngineStore((s) => s.hits)
  const lastHit = useEngineStore((s) => s.lastHit)
  const accuracy = useEngineStore((s) => s.accuracy)
  const { getDisplayKey } = useDisplayKey()

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between py-4">
      {/* Top: accuracy */}
      {hits.length > 0 && (
        <div className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-neutral-300 backdrop-blur-sm">
          {accuracy.toFixed(0)}% accuracy
        </div>
      )}
      {hits.length === 0 && <div />}

      {/* Center: grade flash */}
      {lastHit ? (
        <div
          key={`${lastHit.stepIndex}-${lastHit.offset}`}
          className="animate-[fadeOut_0.6s_ease-out_forwards] text-center"
        >
          <div
            className="text-6xl font-black drop-shadow-lg"
            style={{ color: GRADE_COLORS[lastHit.grade] }}
          >
            {lastHit.grade}
          </div>
          <div className="mt-1 text-xl font-bold text-white/60">
            {lastHit.offset > 0 ? '+' : ''}{lastHit.offset.toFixed(0)}ms
          </div>
        </div>
      ) : comboState === 'ready' ? (
        <div className="text-center">
          <div className="text-3xl font-black text-white">TAP</div>
          <div className="mt-1 text-sm text-neutral-400">to start</div>
        </div>
      ) : comboState === 'complete' ? (
        <div className="text-center">
          <div className="text-3xl font-black text-green-400">Done!</div>
          <div className="mt-1 text-sm text-neutral-400">TAP to reset</div>
        </div>
      ) : (
        <div />
      )}

      {/* Bottom: combo step dots */}
      <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
        {inputs.map((input, index) => {
          const hit = hits.find((h) => h.stepIndex === index)
          const isCurrent = index === currentStep && comboState === 'playing'
          const grade = hit?.grade as Grade | undefined
          const color = grade ? GRADE_COLORS[grade] : undefined

          return (
            <div
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                isCurrent
                  ? 'scale-125 border-cyan-400 bg-cyan-950 text-cyan-400'
                  : hit
                    ? 'border-transparent'
                    : 'border-neutral-600 bg-neutral-800/80 text-neutral-500'
              }`}
              style={color ? { borderColor: color, color, backgroundColor: `${color}22` } : undefined}
            >
              {getDisplayKey(input)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
