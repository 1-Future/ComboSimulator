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
  const { getDisplayKey } = useDisplayKey()

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end pb-8">
      {/* Grade flash */}
      {lastHit && (
        <div
          key={`${lastHit.stepIndex}-${lastHit.offset}`}
          className="absolute top-1/3 animate-[fadeOut_0.6s_ease-out_forwards] text-center"
        >
          <div
            className="text-5xl font-black drop-shadow-lg"
            style={{ color: GRADE_COLORS[lastHit.grade] }}
          >
            {lastHit.grade}
          </div>
          <div className="text-lg font-bold text-white/70">
            {lastHit.offset > 0 ? '+' : ''}{lastHit.offset.toFixed(0)}ms
          </div>
        </div>
      )}

      {/* Current state */}
      {comboState === 'ready' && (
        <div className="mb-4 text-center">
          <div className="text-lg font-bold text-white">TAP to start</div>
          <div className="text-xs text-slate-400">Tap anywhere to the rhythm</div>
        </div>
      )}
      {comboState === 'complete' && (
        <div className="mb-4 text-center">
          <div className="text-2xl font-black text-green-400">Complete!</div>
          <div className="text-xs text-slate-400">TAP to reset</div>
        </div>
      )}

      {/* Combo step dots */}
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur">
        {inputs.map((input, index) => {
          const hit = hits.find((h) => h.stepIndex === index)
          const isCurrent = index === currentStep && comboState === 'playing'
          const grade = hit?.grade as Grade | undefined
          const color = grade ? GRADE_COLORS[grade] : undefined

          return (
            <div
              key={index}
              className={`flex flex-col items-center transition-all ${
                isCurrent ? 'scale-125' : ''
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950 text-cyan-400'
                    : hit
                      ? 'border-transparent'
                      : 'border-slate-600 bg-slate-800/80 text-slate-400'
                }`}
                style={color ? { borderColor: color, color, backgroundColor: `${color}22` } : undefined}
              >
                {getDisplayKey(input)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
