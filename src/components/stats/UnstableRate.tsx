import { UR_THRESHOLDS } from '@/lib/constants'

interface UnstableRateProps {
  ur: number
}

export function UnstableRate({ ur }: UnstableRateProps) {
  const color =
    ur < UR_THRESHOLDS.excellent
      ? 'text-yellow-400'
      : ur < UR_THRESHOLDS.good
        ? 'text-green-400'
        : ur < UR_THRESHOLDS.average
          ? 'text-cyan-400'
          : 'text-red-400'

  const label =
    ur < UR_THRESHOLDS.excellent
      ? 'Excellent'
      : ur < UR_THRESHOLDS.good
        ? 'Good'
        : ur < UR_THRESHOLDS.average
          ? 'Average'
          : 'Needs Practice'

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{ur.toFixed(1)}</div>
      <div className="text-xs text-neutral-500">UR ({label})</div>
    </div>
  )
}
