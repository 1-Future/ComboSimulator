import { forwardRef, useEffect, useState } from 'react'
import { getVideoUrl } from '@/lib/video-url'
import { useSettingsStore } from '@/stores/settingsStore'

interface VideoPlayerProps {
  filename: string | null
  fill?: boolean
  onLoadedMetadata?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ filename, fill, onLoadedMetadata }, ref) {
    const videoVolume = useSettingsStore((s) => s.videoVolume)
    const [muted, setMuted] = useState(true)

    // Sync volume to video element
    useEffect(() => {
      if (typeof ref === 'function' || !ref?.current) return
      ref.current.volume = videoVolume
      ref.current.muted = muted
    }, [videoVolume, muted, ref])

    if (!filename) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-slate-800 text-slate-500">
          Select a combo to load the video
        </div>
      )
    }

    return (
      <div className="relative">
        <video
          ref={ref}
          src={getVideoUrl(filename)}
          className={fill ? 'h-full w-full object-contain bg-black' : 'aspect-video w-full bg-black'}
          preload="auto"
          playsInline
          muted={muted}
          onLoadedMetadata={onLoadedMetadata}
        />
        {/* Mute/unmute button */}
        <button
          onClick={() => setMuted(!muted)}
          className="absolute bottom-2 right-2 z-20 rounded-full bg-black/60 p-1.5 text-white/70 backdrop-blur-sm hover:text-white"
        >
          {muted ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
    )
  },
)
