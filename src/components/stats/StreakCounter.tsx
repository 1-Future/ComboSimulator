interface StreakCounterProps {
  current: number
  best: number
}

export function StreakCounter({ current, best }: StreakCounterProps) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-orange-400">{current}</div>
      <div className="text-xs text-neutral-500">
        Streak (Best: {best})
      </div>
    </div>
  )
}
