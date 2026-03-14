import { useEffect, useRef, useCallback } from 'react'
import { timingEngine } from '@/engine/TimingEngine'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStatsStore } from '@/stores/statsStore'
import { useComboStore } from '@/stores/comboStore'
import { playPing, playGradeSound, playPerfect } from '@/lib/audio'
import type { HitResult } from '@/types/engine'

export function useEngine() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const engineStore = useEngineStore()
  const settings = useSettingsStore()
  const recordAttempt = useStatsStore((s) => s.recordAttempt)
  const selectedCombo = useComboStore((s) => s.selectedCombo)
  const selectedChampion = useComboStore((s) => s.selectedChampion)

  // Initialize engine callbacks
  useEffect(() => {
    timingEngine.init({
      onHit: (hit: HitResult) => {
        engineStore.addHit(hit)
        engineStore.setCurrentStep(hit.stepIndex + 1)
        if (settings.gradeSoundsEnabled) {
          playGradeSound(hit.grade)
        }
      },
      onComboComplete: (hits: HitResult[]) => {
        engineStore.setComboState('complete')
        const allPerfect = hits.every((h) => h.grade === 'Perfect')
        const success = hits.every((h) => h.grade !== 'Miss')
        if (allPerfect) playPerfect()

        recordAttempt({
          comboId: selectedCombo?.id ?? '',
          championId: selectedChampion?.id ?? '',
          hits,
          accuracy: engineStore.accuracy,
          unstableRate: engineStore.unstableRate,
          allPerfect,
          success,
        })
      },
      onStateChange: (state) => {
        engineStore.setComboState(state.comboState)
        engineStore.setAccuracy(state.accuracy)
        engineStore.setUnstableRate(state.unstableRate)
      },
      onVideoTick: (currentTime) => {
        engineStore.setVideoCurrentTime(currentTime)
      },
    })

    timingEngine.setHotkeys(settings.hotkeys)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update hotkeys when they change
  useEffect(() => {
    timingEngine.setHotkeys(settings.hotkeys)
  }, [settings.hotkeys])

  // Set ping callback
  useEffect(() => {
    if (settings.pingEnabled) {
      timingEngine.setPingCallback(() => playPing())
    } else {
      timingEngine.setPingCallback(null)
    }
  }, [settings.pingEnabled])

  const attachVideo = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video
    timingEngine.attachVideo(video)
    video.addEventListener('loadedmetadata', () => {
      useEngineStore.getState().setVideoDuration(video.duration)
    })
  }, [])

  const loadCombo = useCallback(() => {
    if (!selectedCombo) return
    engineStore.reset()
    timingEngine.loadCombo(selectedCombo.inputs, settings.difficulty, settings.calibrationOffset)
    timingEngine.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCombo, settings.difficulty, settings.calibrationOffset])

  const resetCombo = useCallback(() => {
    timingEngine.reset()
    timingEngine.seekToComboStart()
    timingEngine.pause()
    engineStore.reset()
    engineStore.setComboState('ready')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const play = useCallback(() => timingEngine.play(), [])
  const pause = useCallback(() => timingEngine.pause(), [])
  const seek = useCallback((time: number) => timingEngine.seek(time), [])

  return {
    attachVideo,
    loadCombo,
    resetCombo,
    play,
    pause,
    seek,
    videoRef,
  }
}
