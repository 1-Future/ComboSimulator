import type { Difficulty, GradeThresholds } from '@/types/engine'

export const GRADE_THRESHOLDS: Record<Difficulty, GradeThresholds> = {
  easy: { perfect: 30, great: 65, good: 120 },
  normal: { perfect: 16, great: 40, good: 80 },
  strict: { perfect: 10, great: 25, good: 50 },
}

export const GRADE_COLORS = {
  Perfect: '#FFD700',
  Great: '#00FF88',
  Good: '#4488FF',
  Miss: '#FF4444',
} as const

export const UR_THRESHOLDS = {
  excellent: 80,
  good: 120,
  average: 180,
} as const

export const VIDEO_BASE_URL =
  import.meta.env.VITE_VIDEO_BASE_URL ?? '/videos'
