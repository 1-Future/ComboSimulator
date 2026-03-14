import { forwardRef, useEffect } from 'react'
import { getVideoUrl } from '@/lib/video-url'
import { useSettingsStore } from '@/stores/settingsStore'

interface VideoPlayerProps {
  filename: string | null
  onLoadedMetadata?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ filename, onLoadedMetadata }, ref) {
    const videoVolume = useSettingsStore((s) => s.videoVolume)

    // Sync volume to video element
    useEffect(() => {
      if (typeof ref === 'function' || !ref?.current) return
      ref.current.volume = videoVolume
    }, [videoVolume, ref])

    if (!filename) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-slate-800 text-slate-500">
          Select a combo to load the video
        </div>
      )
    }

    return (
      <video
        ref={ref}
        src={getVideoUrl(filename)}
        className="aspect-video w-full bg-black"
        preload="auto"
        playsInline
        onLoadedMetadata={onLoadedMetadata}
      />
    )
  },
)
