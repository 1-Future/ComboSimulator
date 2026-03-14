import type { Difficulty, Grade, GradeThresholds } from '@/types/engine'
import { GRADE_THRESHOLDS } from '@/lib/constants'

export function getThresholds(difficulty: Difficulty): GradeThresholds {
  return GRADE_THRESHOLDS[difficulty]
}

export function scoreHit(offsetMs: number, difficulty: Difficulty): Grade {
  const abs = Math.abs(offsetMs)
  const thresholds = getThresholds(difficulty)

  if (abs <= thresholds.perfect) return 'Perfect'
  if (abs <= thresholds.great) return 'Great'
  if (abs <= thresholds.good) return 'Good'
  return 'Miss'
}

export function calculateAccuracy(
  grades: Grade[],
): number {
  if (grades.length === 0) return 0
  const hits = grades.filter((g) => g !== 'Miss').length
  return (hits / grades.length) * 100
}

export function calculateUnstableRate(offsets: number[]): number {
  if (offsets.length < 2) return 0
  const mean = offsets.reduce((sum, o) => sum + o, 0) / offsets.length
  const variance = offsets.reduce((sum, o) => sum + (o - mean) ** 2, 0) / offsets.length
  return Math.sqrt(variance) * 10
}
