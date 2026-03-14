import type { Grade } from '@/types/engine'
import { GRADE_COLORS } from './constants'

export function formatMs(ms: number): string {
  const abs = Math.abs(ms)
  const sign = ms >= 0 ? '+' : '-'
  return `${sign}${abs.toFixed(0)}ms`
}

export function formatAccuracy(hits: number, total: number): string {
  if (total === 0) return '0%'
  return `${((hits / total) * 100).toFixed(1)}%`
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function gradeColor(grade: Grade): string {
  return GRADE_COLORS[grade]
}

export function gradeLabel(grade: Grade): string {
  return grade
}

export function formatUR(ur: number): string {
  return ur.toFixed(1)
}
