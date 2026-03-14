import { Howl } from 'howler'

let pingSound: Howl | null = null
let perfectSound: Howl | null = null
let gradeSounds: Record<string, Howl> = {}

export function initAudio(): void {
  pingSound = new Howl({
    src: ['/audio/ping.mp3'],
    volume: 0.5,
    preload: true,
  })

  perfectSound = new Howl({
    src: ['/audio/perfect.mp3'],
    volume: 0.6,
    preload: true,
  })

  gradeSounds = {
    Perfect: new Howl({ src: ['/audio/grades/perfect.mp3'], volume: 0.5 }),
    Great: new Howl({ src: ['/audio/grades/great.mp3'], volume: 0.5 }),
    Good: new Howl({ src: ['/audio/grades/good.mp3'], volume: 0.4 }),
    Miss: new Howl({ src: ['/audio/grades/miss.mp3'], volume: 0.3 }),
  }
}

export function playPing(): void {
  pingSound?.play()
}

export function playPerfect(): void {
  perfectSound?.play()
}

export function playGradeSound(grade: string): void {
  gradeSounds[grade]?.play()
}

export function setVolume(volume: number): void {
  Howler.volume(volume)
}
