interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  color = 'bg-cyan-500',
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(100, (value / max) * 100)

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-700 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-200 ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
