export class VideoSync {
  private videoElement: HTMLVideoElement | null = null
  private animationFrameId: number | null = null
  private onTick: ((currentTime: number) => void) | null = null

  attach(video: HTMLVideoElement): void {
    this.videoElement = video
  }

  detach(): void {
    this.stop()
    this.videoElement = null
  }

  start(onTick: (currentTime: number) => void): void {
    this.onTick = onTick
    this.tick()
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.onTick = null
  }

  private tick = (): void => {
    if (this.videoElement && this.onTick) {
      this.onTick(this.videoElement.currentTime)
    }
    this.animationFrameId = requestAnimationFrame(this.tick)
  }

  getCurrentTime(): number {
    return this.videoElement?.currentTime ?? 0
  }

  getDuration(): number {
    return this.videoElement?.duration ?? 0
  }

  seek(time: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = time
    }
  }

  play(): void {
    this.videoElement?.play()
  }

  pause(): void {
    this.videoElement?.pause()
  }

  setPlaybackRate(rate: number): void {
    if (this.videoElement) {
      this.videoElement.playbackRate = rate
    }
  }
}
