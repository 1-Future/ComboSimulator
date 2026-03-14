import { describe, it, expect } from 'vitest'
import {
  createCalibrationSession,
  addSample,
  calculateCalibrationOffset,
} from '../Calibration'

describe('CalibrationSession', () => {
  it('creates a session with defaults', () => {
    const session = createCalibrationSession()
    expect(session.totalRounds).toBe(10)
    expect(session.currentRound).toBe(0)
    expect(session.samples).toHaveLength(0)
  })

  it('adds samples and tracks rounds', () => {
    let session = createCalibrationSession(3)
    session = addSample(session, 15)
    expect(session.samples).toHaveLength(1)
    expect(session.currentRound).toBe(1)
    expect(session.isRunning).toBe(true)

    session = addSample(session, 20)
    session = addSample(session, 25)
    expect(session.currentRound).toBe(3)
    expect(session.isRunning).toBe(false)
  })
})

describe('calculateCalibrationOffset', () => {
  it('returns 0 for empty samples', () => {
    expect(calculateCalibrationOffset([])).toBe(0)
  })

  it('returns the single sample for one entry', () => {
    expect(calculateCalibrationOffset([42])).toBe(42)
  })

  it('returns median for odd number of samples', () => {
    expect(calculateCalibrationOffset([10, 20, 30])).toBe(20)
  })

  it('returns median for even number of samples', () => {
    expect(calculateCalibrationOffset([10, 20, 30, 40])).toBe(25)
  })

  it('handles outliers well (median is robust)', () => {
    // With a big outlier, median stays sensible
    expect(calculateCalibrationOffset([10, 15, 20, 500])).toBe(17.5)
  })
})
