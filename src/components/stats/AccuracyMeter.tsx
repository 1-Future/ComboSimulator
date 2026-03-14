interface AccuracyMeterProps {
  accuracy: number
}

export function AccuracyMeter({ accuracy }: AccuracyMeterProps) {
  const color =
    accuracy >= 90 ? 'text-yellow-400' : accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-cyan-400' : 'text-red-400'

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{accuracy.toFixed(1)}%</div>
      <div className="text-xs text-slate-500">Accuracy</div>
    </div>
  )
}
