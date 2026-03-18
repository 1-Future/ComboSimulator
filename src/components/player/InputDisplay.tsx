import { useEngineStore } from '@/stores/engineStore'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

interface InputDisplayProps {
  inputs: ComboInput[]
}

export function InputDisplay({ inputs }: InputDisplayProps) {
  const hits = useEngineStore((s) => s.hits)
  const currentStep = useEngineStore((s) => s.currentStep)
  const { getDisplayKey } = useDisplayKey()

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-3">
      {inputs.map((input, index) => {
        const hit = hits.find((h) => h.stepIndex === index)
        const isCurrent = index === currentStep
        const grade = hit?.grade as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : undefined

        return (
          <div
            key={index}
            className={`flex flex-col items-center rounded-lg border px-3 py-2 transition-all ${
              isCurrent
                ? 'scale-110 border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/20'
                : hit
                  ? 'border-transparent'
                  : 'border-neutral-600 bg-neutral-800/50'
            }`}
            style={color ? { borderColor: color, backgroundColor: `${color}15` } : undefined}
          >
            <span
              className="text-lg font-mono font-bold"
              style={{ color: color ?? (isCurrent ? '#22d3ee' : '#94a3b8') }}
            >
              {getDisplayKey(input)}
            </span>
            {hit && (
              <span className="mt-0.5 text-[10px] font-medium" style={{ color }}>
                {hit.grade} ({hit.offset > 0 ? '+' : ''}{hit.offset.toFixed(0)}ms)
              </span>
            )}
            {!hit && (
              <span className="mt-0.5 text-[10px] text-neutral-500">{input.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
