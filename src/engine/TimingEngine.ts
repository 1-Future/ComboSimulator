import type { ComboInput } from '@/types/combo'
import type { Difficulty, HitResult } from '@/types/engine'
import type { Hotkeys, GamepadMap } from '@/types/settings'
import { ComboRunner } from './ComboRunner'
import { InputHandler } from './InputHandler'
import { VideoSync } from './VideoSync'

export type InputSource = 'keyboard' | 'gamepad'

export interface TimingEngineCallbacks {
  onHit: (hit: HitResult) => void
  onComboComplete: (hits: HitResult[]) => void
  onStateChange: (state: ReturnType<ComboRunner['getState']>) => void
  onVideoTick: (currentTime: number) => void
  onReset?: () => void
  onInputDevice?: (source: InputSource) => void
}

export class TimingEngine {
  private runner = new ComboRunner()
  private inputHandler = new InputHandler()
  private videoSync = new VideoSync()
  private callbacks: TimingEngineCallbacks | null = null
  private pingCallback: ((stepIndex: number) => void) | null = null
  private lastPingedStep = -1
  private comboStartTime = 0 // video timestamp where combo begins

  init(callbacks: TimingEngineCallbacks): void {
    this.callbacks = callbacks
  }

  setHotkeys(hotkeys: Hotkeys): void {
    this.inputHandler.setHotkeys(hotkeys)
  }

  setGamepadMap(map: GamepadMap): void {
    this.inputHandler.setGamepadMap(map)
  }

  attachVideo(video: HTMLVideoElement): void {
    this.videoSync.attach(video)
  }

  detachVideo(): void {
    this.videoSync.detach()
  }

  loadCombo(inputs: ComboInput[], difficulty: Difficulty, calibrationOffset = 0, videoComboStart?: number): void {
    this.runner.loadCombo(inputs, difficulty, calibrationOffset)
    this.comboStartTime = videoComboStart ?? inputs[0]?.time ?? 0
    this.lastPingedStep = -1
    this.callbacks?.onStateChange(this.runner.getState())
  }

  start(): void {
    // Stop any existing listeners before starting new ones
    this.inputHandler.stop()
    this.videoSync.stop()

    this.inputHandler.start((key, timestamp, source) => {
      this.callbacks?.onInputDevice?.(source)
      // Handle reset (space from keyboard or gamepad Back/Start)
      if (key === ' ') {
        this.callbacks?.onReset?.()
        return
      }
      const action = this.inputHandler.getActionForKey(key)
      const hit = this.runner.handleKeyPress(key, timestamp, action)
      if (hit) {
        this.callbacks?.onHit(hit)
        const state = this.runner.getState()
        this.callbacks?.onStateChange(state)

        if (state.comboState === 'complete') {
          this.callbacks?.onComboComplete(state.hits)
        }
      }
    })

    this.videoSync.start((currentTime) => {
      this.callbacks?.onVideoTick(currentTime)

      // Check if we should ping for upcoming steps
      if (this.pingCallback) {
        const inputs = this.runner.getInputs()
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i]
          if (input && currentTime >= input.time && i > this.lastPingedStep) {
            this.lastPingedStep = i
            this.pingCallback(i)
          }
        }
      }
    })
  }

  stop(): void {
    this.inputHandler.stop()
    this.videoSync.stop()
  }

  reset(): void {
    this.runner.reset()
    this.lastPingedStep = -1
    this.callbacks?.onStateChange(this.runner.getState())
  }

  seekToComboStart(): void {
    this.videoSync.seek(this.comboStartTime)
  }

  play(): void {
    this.videoSync.play()
  }

  pause(): void {
    this.videoSync.pause()
  }

  seek(time: number): void {
    this.videoSync.seek(time)
  }

  setPlaybackRate(rate: number): void {
    this.videoSync.setPlaybackRate(rate)
  }

  setPingCallback(callback: ((stepIndex: number) => void) | null): void {
    this.pingCallback = callback
  }

  getState() {
    return this.runner.getState()
  }

  getVideoCurrentTime(): number {
    return this.videoSync.getCurrentTime()
  }

  getVideoDuration(): number {
    return this.videoSync.getDuration()
  }
}

// Singleton instance
export const timingEngine = new TimingEngine()
