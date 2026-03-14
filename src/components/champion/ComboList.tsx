import type { Combo } from '@/types/combo'

interface ComboListProps {
  combos: Combo[]
  selectedComboId: string | null
  onSelect: (combo: Combo) => void
}

const difficultyColors = {
  beginner: 'bg-green-900/50 text-green-400 border-green-700',
  intermediate: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  advanced: 'bg-orange-900/50 text-orange-400 border-orange-700',
  expert: 'bg-red-900/50 text-red-400 border-red-700',
}

export function ComboList({ combos, selectedComboId, onSelect }: ComboListProps) {
  if (combos.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 p-6 text-center text-sm text-slate-500">
        No combos available for this champion yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {combos.map((combo) => (
        <button
          key={combo.id}
          onClick={() => onSelect(combo)}
          className={`w-full rounded-lg border p-3 text-left transition-all ${
            selectedComboId === combo.id
              ? 'border-cyan-500 bg-cyan-950/40'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-white">{combo.name}</h4>
              <p className="mt-0.5 truncate text-xs text-slate-400">{combo.description}</p>
            </div>
            <span
              className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${difficultyColors[combo.difficulty]}`}
            >
              {combo.difficulty}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {combo.inputs.map((input, i) => (
              <span
                key={i}
                className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
              >
                {input.key}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
