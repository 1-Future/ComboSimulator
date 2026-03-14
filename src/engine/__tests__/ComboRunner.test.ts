import { describe, it, expect } from 'vitest'
import { ComboRunner } from '../ComboRunner'
import type { ComboInput } from '@/types/combo'

const sampleInputs: ComboInput[] = [
  { key: 'E', time: 0.4, label: 'E (dash)', window: 100 },
  { key: 'Q', time: 0.55, label: 'Q (tornado)', window: 80 },
  { key: 'R', time: 1.35, label: 'Last Breath', window: 150 },
]

describe('ComboRunner', () => {
  it('starts in idle state', () => {
    const runner = new ComboRunner()
    expect(runner.getState().comboState).toBe('idle')
  })

  it('transitions to ready when combo is loaded', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'normal')
    expect(runner.getState().comboState).toBe('ready')
    expect(runner.getState().currentStep).toBe(0)
  })

  it('ignores key presses when idle', () => {
    const runner = new ComboRunner()
    const result = runner.handleKeyPress('e', 1000)
    expect(result).toBeNull()
  })

  it('ignores wrong keys', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'normal')
    const result = runner.handleKeyPress('q', 1000) // Expects 'e' first
    expect(result).toBeNull()
    expect(runner.getState().currentStep).toBe(0)
  })

  it('processes correct key press and starts combo', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'easy')
    const hit = runner.handleKeyPress('e', 1000)

    expect(hit).not.toBeNull()
    expect(hit?.stepIndex).toBe(0)
    expect(hit?.key).toBe('E')
    expect(hit?.grade).toBe('Perfect') // First hit is always Perfect (0ms offset)
    expect(runner.getState().comboState).toBe('playing')
    expect(runner.getState().currentStep).toBe(1)
  })

  it('completes combo after all steps', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'easy')

    // First hit at t=1000
    runner.handleKeyPress('e', 1000)

    // Second hit at t=1150 (expected at 150ms after start in easy mode)
    runner.handleKeyPress('q', 1150)

    // Third hit at t=1950 (expected at 950ms after start)
    const lastHit = runner.handleKeyPress('r', 1950)

    expect(lastHit).not.toBeNull()
    expect(runner.getState().comboState).toBe('complete')
    expect(runner.getState().hits).toHaveLength(3)
  })

  it('resets properly', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'normal')
    runner.handleKeyPress('e', 1000)
    runner.reset()

    expect(runner.getState().comboState).toBe('ready')
    expect(runner.getState().currentStep).toBe(0)
    expect(runner.getState().hits).toHaveLength(0)
    expect(runner.getState().comboStartTime).toBeNull()
  })

  it('calculates accuracy correctly', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'easy')

    runner.handleKeyPress('e', 1000)
    runner.handleKeyPress('q', 1150)
    runner.handleKeyPress('r', 1950)

    expect(runner.getState().accuracy).toBeGreaterThan(0)
  })

  it('ignores key presses after combo is complete', () => {
    const runner = new ComboRunner()
    runner.loadCombo(sampleInputs, 'easy')

    runner.handleKeyPress('e', 1000)
    runner.handleKeyPress('q', 1150)
    runner.handleKeyPress('r', 1950)

    const result = runner.handleKeyPress('e', 2000)
    expect(result).toBeNull()
  })
})
