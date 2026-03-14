export interface CalibrationSession {
  samples: number[]
  isRunning: boolean
  currentRound: number
  totalRounds: number
}

export function createCalibrationSession(rounds = 10): CalibrationSession {
  return {
    samples: [],
    isRunning: false,
    currentRound: 0,
    totalRounds: rounds,
  }
}

export function addSample(session: CalibrationSession, offset: number): CalibrationSession {
  const samples = [...session.samples, offset]
  const currentRound = session.currentRound + 1
  return {
    ...session,
    samples,
    currentRound,
    isRunning: currentRound < session.totalRounds,
  }
}

export function calculateCalibrationOffset(samples: number[]): number {
  if (samples.length === 0) return 0
  // Use median for robustness against outliers
  const sorted = [...samples].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
  }
  return sorted[mid] ?? 0
}
