import { describe, it, expect } from 'vitest'
import { scoreHit, calculateAccuracy, calculateUnstableRate } from '../Scorer'

describe('scoreHit', () => {
  describe('easy mode', () => {
    it('scores Perfect for ≤30ms offset', () => {
      expect(scoreHit(0, 'easy')).toBe('Perfect')
      expect(scoreHit(15, 'easy')).toBe('Perfect')
      expect(scoreHit(30, 'easy')).toBe('Perfect')
      expect(scoreHit(-30, 'easy')).toBe('Perfect')
    })

    it('scores Great for 31-65ms offset', () => {
      expect(scoreHit(31, 'easy')).toBe('Great')
      expect(scoreHit(65, 'easy')).toBe('Great')
      expect(scoreHit(-50, 'easy')).toBe('Great')
    })

    it('scores Good for 66-120ms offset', () => {
      expect(scoreHit(66, 'easy')).toBe('Good')
      expect(scoreHit(120, 'easy')).toBe('Good')
      expect(scoreHit(-100, 'easy')).toBe('Good')
    })

    it('scores Miss for >120ms offset', () => {
      expect(scoreHit(121, 'easy')).toBe('Miss')
      expect(scoreHit(500, 'easy')).toBe('Miss')
      expect(scoreHit(-200, 'easy')).toBe('Miss')
    })
  })

  describe('normal mode', () => {
    it('scores Perfect for ≤16ms offset', () => {
      expect(scoreHit(0, 'normal')).toBe('Perfect')
      expect(scoreHit(16, 'normal')).toBe('Perfect')
      expect(scoreHit(-16, 'normal')).toBe('Perfect')
    })

    it('scores Great for 17-40ms offset', () => {
      expect(scoreHit(17, 'normal')).toBe('Great')
      expect(scoreHit(40, 'normal')).toBe('Great')
    })

    it('scores Good for 41-80ms offset', () => {
      expect(scoreHit(41, 'normal')).toBe('Good')
      expect(scoreHit(80, 'normal')).toBe('Good')
    })

    it('scores Miss for >80ms offset', () => {
      expect(scoreHit(81, 'normal')).toBe('Miss')
    })
  })

  describe('strict mode', () => {
    it('scores Perfect for ≤10ms offset', () => {
      expect(scoreHit(0, 'strict')).toBe('Perfect')
      expect(scoreHit(10, 'strict')).toBe('Perfect')
    })

    it('scores Great for 11-25ms offset', () => {
      expect(scoreHit(11, 'strict')).toBe('Great')
      expect(scoreHit(25, 'strict')).toBe('Great')
    })

    it('scores Good for 26-50ms offset', () => {
      expect(scoreHit(26, 'strict')).toBe('Good')
      expect(scoreHit(50, 'strict')).toBe('Good')
    })

    it('scores Miss for >50ms offset', () => {
      expect(scoreHit(51, 'strict')).toBe('Miss')
    })
  })
})

describe('calculateAccuracy', () => {
  it('returns 0 for empty array', () => {
    expect(calculateAccuracy([])).toBe(0)
  })

  it('returns 100 for all non-miss grades', () => {
    expect(calculateAccuracy(['Perfect', 'Great', 'Good'])).toBe(100)
  })

  it('returns 0 for all misses', () => {
    expect(calculateAccuracy(['Miss', 'Miss', 'Miss'])).toBe(0)
  })

  it('calculates correctly for mixed grades', () => {
    expect(calculateAccuracy(['Perfect', 'Miss', 'Great', 'Miss'])).toBe(50)
  })
})

describe('calculateUnstableRate', () => {
  it('returns 0 for fewer than 2 samples', () => {
    expect(calculateUnstableRate([])).toBe(0)
    expect(calculateUnstableRate([5])).toBe(0)
  })

  it('returns 0 for identical offsets', () => {
    expect(calculateUnstableRate([10, 10, 10])).toBe(0)
  })

  it('calculates correctly for varied offsets', () => {
    const ur = calculateUnstableRate([0, 10, 20, 30])
    expect(ur).toBeGreaterThan(0)
    // SD of [0,10,20,30] = sqrt(((−15)²+(−5)²+(5)²+(15)²)/4) = sqrt(125) ≈ 11.18
    // UR = 11.18 * 10 ≈ 111.8
    expect(ur).toBeCloseTo(111.8, 0)
  })
})
