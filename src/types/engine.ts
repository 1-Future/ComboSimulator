export type Grade = 'Perfect' | 'Great' | 'Good' | 'Miss'

export type Difficulty = 'easy' | 'normal' | 'strict'

export interface GradeThresholds {
  perfect: number
  great: number
  good: number
}

export interface HitResult {
  stepIndex: number
  key: string
  expectedTime: number
  actualTime: number
  offset: number
  grade: Grade
}

export type ComboState = 'idle' | 'ready' | 'playing' | 'complete'

export interface EngineState {
  comboState: ComboState
  currentStep: number
  hits: HitResult[]
  comboStartTime: number | null
  accuracy: number
  streak: number
  bestStreak: number
  unstableRate: number
}

export interface CalibrationResult {
  offset: number
  samples: number[]
}
