import { useState, useRef, useCallback } from 'react'

export function useScreenRecord() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      })

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      })

      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `combo-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        stream.getTracks().forEach((t) => t.stop())
        setIsRecording(false)
      }

      // Stop recording if user stops sharing
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        recorder.stop()
      })

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      // User cancelled the screen share picker
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  return { isRecording, startRecording, stopRecording }
}
