import { useEngineStore } from '@/stores/engineStore'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import type { ComboInput } from '@/types/combo'
import { GRADE_COLORS } from '@/lib/constants'
import type { Grade } from '@/types/engine'
import type { MouseEvent } from 'react'

interface ComboTimelineProps {
  inputs: ComboInput[]
  onSeek: (time: number) => void
  onContextMenu?: (index: number, e: MouseEvent) => void
}

export function ComboTimeline({ inputs, onSeek, onContextMenu }: ComboTimelineProps) {
  const videoDuration = useEngineStore((s) => s.videoDuration)
  const hits = useEngineStore((s) => s.hits)
  const { getDisplayKey } = useDisplayKey()

  if (!videoDuration || inputs.length === 0) return null

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {inputs.map((input, index) => {
        const grade = hitGrades.get(index) as Grade | undefined
        const color = grade ? GRADE_COLORS[grade] : '#475569'

        return (
          <button
            key={index}
            onClick={() => onSeek(Math.max(0, input.time - 0.5))}
            onContextMenu={(e) => onContextMenu?.(index, e)}
            className="flex shrink-0 flex-col items-center rounded border px-2 py-1 transition-colors hover:bg-slate-700"
            style={{ borderColor: color }}
          >
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {getDisplayKey(input)}
            </span>
            <span className="text-[9px] text-slate-500">{input.time.toFixed(2)}s</span>
          </button>
        )
      })}
    </div>
  )
}
