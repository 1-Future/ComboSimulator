import { useSettingsStore } from '@/stores/settingsStore'
import type { Difficulty } from '@/types/engine'
import { GRADE_THRESHOLDS } from '@/lib/constants'

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'strict', label: 'Strict' },
]

export function DifficultySelector() {
  const difficulty = useSettingsStore((s) => s.difficulty)
  const setDifficulty = useSettingsStore((s) => s.setDifficulty)
  const thresholds = GRADE_THRESHOLDS[difficulty]

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-neutral-300">Difficulty</h3>
      <div className="flex gap-2">
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => setDifficulty(d.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              difficulty === d.value
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-neutral-300 hover:bg-slate-600'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-neutral-500">
        Perfect: &le;{thresholds.perfect}ms | Great: &le;{thresholds.great}ms | Good: &le;{thresholds.good}ms
      </div>
    </div>
  )
}
