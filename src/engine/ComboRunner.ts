import type { ComboInput } from '@/types/combo'
import type { ComboState, Difficulty, HitResult } from '@/types/engine'
import { scoreHit, calculateAccuracy, calculateUnstableRate } from './Scorer'

export interface ComboRunnerState {
  comboState: ComboState
  currentStep: number
  hits: HitResult[]
  comboStartTime: number | null
  accuracy: number
  unstableRate: number
}

export class ComboRunner {
  private state: ComboRunnerState
  private inputs: ComboInput[] = []
  private difficulty: Difficulty = 'normal'
  private calibrationOffset = 0

  constructor() {
    this.state = this.initialState()
  }

  private initialState(): ComboRunnerState {
    return {
      comboState: 'idle',
      currentStep: 0,
      hits: [],
      comboStartTime: null,
      accuracy: 0,
      unstableRate: 0,
    }
  }

  loadCombo(inputs: ComboInput[], difficulty: Difficulty, calibrationOffset = 0): void {
    this.inputs = inputs
    this.difficulty = difficulty
    this.calibrationOffset = calibrationOffset
    this.state = { ...this.initialState(), comboState: 'ready' }
  }

  reset(): void {
    this.state = {
      ...this.initialState(),
      comboState: this.inputs.length > 0 ? 'ready' : 'idle',
    }
  }

  getState(): ComboRunnerState {
    return { ...this.state }
  }

  getInputs(): ComboInput[] {
    return this.inputs
  }

  handleKeyPress(key: string, timestamp: number, action?: string): HitResult | null {
    if (this.state.comboState === 'idle' || this.state.comboState === 'complete') {
      return null
    }

    const step = this.inputs[this.state.currentStep]
    if (!step) return null

    // Match by action (hotkey-aware) or by raw key as fallback
    let matched = false
    if (step.action && action) {
      matched = step.action === action
    }
    if (!matched) {
      matched = key.toLowerCase() === step.key.toLowerCase()
    }
    if (!matched) return null

    // First key press starts the combo — always Perfect (it's the trigger)
    const isFirstStep = this.state.comboStartTime === null
    if (isFirstStep) {
      this.state.comboStartTime = timestamp
      this.state.comboState = 'playing'
    }

    const firstStepTime = this.inputs[0]?.time ?? 0
    const expectedTimeMs = (step.time - firstStepTime) * 1000
    const actualTimeMs = timestamp - (this.state.comboStartTime ?? timestamp) - this.calibrationOffset
    const offset = isFirstStep ? 0 : actualTimeMs - expectedTimeMs
    const grade = isFirstStep ? 'Perfect' as const : scoreHit(offset, this.difficulty)

    const hit: HitResult = {
      stepIndex: this.state.currentStep,
      key: step.key,
      expectedTime: step.time,
      actualTime: timestamp,
      offset,
      grade,
    }

    this.state.hits = [...this.state.hits, hit]
    this.state.currentStep++

    // Recalculate stats
    const grades = this.state.hits.map((h) => h.grade)
    const offsets = this.state.hits.map((h) => h.offset)
    this.state.accuracy = calculateAccuracy(grades)
    this.state.unstableRate = calculateUnstableRate(offsets)

    // Check if combo is complete
    if (this.state.currentStep >= this.inputs.length) {
      this.state.comboState = 'complete'
    }

    return hit
  }
}
