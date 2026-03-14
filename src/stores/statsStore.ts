import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HitResult } from '@/types/engine'

interface ComboAttempt {
  comboId: string
  championId: string
  hits: HitResult[]
  accuracy: number
  unstableRate: number
  timestamp: number
  allPerfect: boolean
  success: boolean
}

interface StatsState {
  totalAttempts: number
  successfulCombos: number
  currentStreak: number
  bestStreak: number
  sessionAttempts: ComboAttempt[]
  allTimeAttempts: ComboAttempt[]

  recordAttempt: (attempt: Omit<ComboAttempt, 'timestamp'>) => void
  resetSession: () => void
  resetStreak: () => void
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      totalAttempts: 0,
      successfulCombos: 0,
      currentStreak: 0,
      bestStreak: 0,
      sessionAttempts: [],
      allTimeAttempts: [],

      recordAttempt: (attempt) =>
        set((state) => {
          const fullAttempt: ComboAttempt = {
            ...attempt,
            timestamp: Date.now(),
          }
          const newStreak = attempt.success ? state.currentStreak + 1 : 0
          return {
            totalAttempts: state.totalAttempts + 1,
            successfulCombos: state.successfulCombos + (attempt.success ? 1 : 0),
            currentStreak: newStreak,
            bestStreak: Math.max(state.bestStreak, newStreak),
            sessionAttempts: [...state.sessionAttempts, fullAttempt],
            allTimeAttempts: [...state.allTimeAttempts.slice(-99), fullAttempt],
          }
        }),

      resetSession: () => set({ sessionAttempts: [] }),
      resetStreak: () => set({ currentStreak: 0 }),
    }),
    {
      name: 'combo-simulator-stats',
      partialize: (state) => ({
        totalAttempts: state.totalAttempts,
        successfulCombos: state.successfulCombos,
        bestStreak: state.bestStreak,
        allTimeAttempts: state.allTimeAttempts,
      }),
    },
  ),
)
