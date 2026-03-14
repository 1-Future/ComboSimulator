import { type ReactNode } from 'react'

interface FullscreenModeProps {
  videoElement: ReactNode
  timeline: ReactNode
  earlyLate: ReactNode
  controls: ReactNode
  stats: ReactNode
  onExit: () => void
}

export function FullscreenMode({
  videoElement,
  timeline,
  earlyLate,
  controls,
  stats,
  onExit,
}: FullscreenModeProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar — controls left, stats right */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-900/80 px-3 py-1 backdrop-blur-sm">
        <div>{controls}</div>
        <div className="flex items-center gap-3">
          {stats}
          <button
            onClick={onExit}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Exit Fullscreen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Video — fills remaining space */}
      <div className="relative flex-1 overflow-hidden">
        {videoElement}
      </div>

      {/* Early/Late — thin strip above timeline */}
      <div className="shrink-0">{earlyLate}</div>

      {/* Timeline — anchored to bottom */}
      <div className="shrink-0">{timeline}</div>
    </div>
  )
}
