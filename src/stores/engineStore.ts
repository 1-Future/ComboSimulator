import { create } from 'zustand'
import type { ComboState, HitResult } from '@/types/engine'

interface EngineStoreState {
  comboState: ComboState
  currentStep: number
  hits: HitResult[]
  lastHit: HitResult | null
  accuracy: number
  unstableRate: number
  videoCurrentTime: number
  videoDuration: number

  setComboState: (state: ComboState) => void
  setCurrentStep: (step: number) => void
  addHit: (hit: HitResult) => void
  setHits: (hits: HitResult[]) => void
  setLastHit: (hit: HitResult | null) => void
  setAccuracy: (accuracy: number) => void
  setUnstableRate: (ur: number) => void
  setVideoCurrentTime: (time: number) => void
  setVideoDuration: (duration: number) => void
  reset: () => void
}

export const useEngineStore = create<EngineStoreState>()((set) => ({
  comboState: 'idle',
  currentStep: 0,
  hits: [],
  lastHit: null,
  accuracy: 0,
  unstableRate: 0,
  videoCurrentTime: 0,
  videoDuration: 0,

  setComboState: (comboState) => set({ comboState }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  addHit: (hit) => set((s) => ({ hits: [...s.hits, hit], lastHit: hit })),
  setHits: (hits) => set({ hits }),
  setLastHit: (lastHit) => set({ lastHit }),
  setAccuracy: (accuracy) => set({ accuracy }),
  setUnstableRate: (unstableRate) => set({ unstableRate }),
  setVideoCurrentTime: (videoCurrentTime) => set({ videoCurrentTime }),
  setVideoDuration: (videoDuration) => set({ videoDuration }),
  reset: () =>
    set({
      comboState: 'idle',
      currentStep: 0,
      hits: [],
      lastHit: null,
      accuracy: 0,
      unstableRate: 0,
    }),
}))
