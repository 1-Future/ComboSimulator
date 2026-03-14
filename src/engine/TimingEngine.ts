import type { ComboInput } from '@/types/combo'
import type { Difficulty, HitResult } from '@/types/engine'
import type { Hotkeys } from '@/types/settings'
import { ComboRunner } from './ComboRunner'
import { InputHandler } from './InputHandler'
import { VideoSync } from './VideoSync'

export interface TimingEngineCallbacks {
  onHit: (hit: HitResult) => void
  onComboComplete: (hits: HitResult[]) => void
  onStateChange: (state: ReturnType<ComboRunner['getState']>) => void
  onVideoTick: (currentTime: number) => void
}

export class TimingEngine {
  private runner = new ComboRunner()
  private inputHandler = new InputHandler()
  private videoSync = new VideoSync()
  private callbacks: TimingEngineCallbacks | null = null
  private pingCallback: ((stepIndex: number) => void) | null = null
  private lastPingedStep = -1

  init(callbacks: TimingEngineCallbacks): void {
    this.callbacks = callbacks
  }

  setHotkeys(hotkeys: Hotkeys): void {
    this.inputHandler.setHotkeys(hotkeys)
  }

  attachVideo(video: HTMLVideoElement): void {
    this.videoSync.attach(video)
  }

  detachVideo(): void {
    this.videoSync.detach()
  }

  loadCombo(inputs: ComboInput[], difficulty: Difficulty, calibrationOffset = 0): void {
    this.runner.loadCombo(inputs, difficulty, calibrationOffset)
    this.lastPingedStep = -1
    this.callbacks?.onStateChange(this.runner.getState())
  }

  start(): void {
    this.inputHandler.start((key, timestamp) => {
      const hit = this.runner.handleKeyPress(key, timestamp)
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
    const inputs = this.runner.getInputs()
    const firstInput = inputs[0]
    if (firstInput) {
      this.videoSync.seek(Math.max(0, firstInput.time - 0.5))
    }
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
