import { useCallback, useRef } from 'react'

export function useVideoFrame(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const captureFrame = useCallback(
    (time: number): string | null => {
      const video = videoRef.current
      if (!video) return null

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
      }
      const canvas = canvasRef.current
      // Small thumbnail size
      canvas.width = 240
      canvas.height = 135

      // Save current time, seek, draw, restore
      const savedTime = video.currentTime
      video.currentTime = time

      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      video.currentTime = savedTime

      return canvas.toDataURL('image/jpeg', 0.7)
    },
    [videoRef],
  )

  return captureFrame
}
