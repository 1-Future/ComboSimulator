import { forwardRef } from 'react'
import { getVideoUrl } from '@/lib/video-url'

interface VideoPlayerProps {
  filename: string | null
  onLoadedMetadata?: () => void
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ filename, onLoadedMetadata }, ref) {
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
        controls
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
      />
    )
  },
)
