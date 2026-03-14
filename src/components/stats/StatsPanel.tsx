import { useEngineStore } from '@/stores/engineStore'
import { useStatsStore } from '@/stores/statsStore'
import { AccuracyMeter } from './AccuracyMeter'
import { StreakCounter } from './StreakCounter'
import { UnstableRate } from './UnstableRate'

export function StatsPanel() {
  const accuracy = useEngineStore((s) => s.accuracy)
  const unstableRate = useEngineStore((s) => s.unstableRate)
  const currentStreak = useStatsStore((s) => s.currentStreak)
  const bestStreak = useStatsStore((s) => s.bestStreak)
  const totalAttempts = useStatsStore((s) => s.totalAttempts)
  const successfulCombos = useStatsStore((s) => s.successfulCombos)

  return (
    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Session Stats</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AccuracyMeter accuracy={accuracy} />
        <StreakCounter current={currentStreak} best={bestStreak} />
        <UnstableRate ur={unstableRate} />
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-300">
            {successfulCombos}/{totalAttempts}
          </div>
          <div className="text-xs text-slate-500">Successful</div>
        </div>
      </div>
    </div>
  )
}
