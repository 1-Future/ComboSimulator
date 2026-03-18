import { useState, type ReactNode } from 'react'
import { SettingsModal } from '@/components/settings/SettingsModal'

interface FullscreenModeProps {
  videoElement: ReactNode
  timeline: ReactNode
  earlyLate: ReactNode
  controls: ReactNode
  stats: ReactNode
  comboSteps?: ReactNode
  championName: string
  comboName: string
  onExit: () => void
}

export function FullscreenMode({
  videoElement,
  timeline,
  earlyLate,
  controls,
  stats,
  comboSteps,
  championName,
  comboName,
  onExit,
}: FullscreenModeProps) {
  const [showTimeline, setShowTimeline] = useState(true)
  const [showEarlyLate, setShowEarlyLate] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const [showSteps, setShowSteps] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-black/80 px-3 py-1.5 backdrop-blur-sm">
        {/* Left: champion info + controls */}
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="font-bold text-white">{championName}</span>
            <span className="mx-1 text-neutral-600">|</span>
            <span className="text-neutral-400">{comboName}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          {controls}
        </div>

        {/* Right: stats + toggles + settings + exit */}
        <div className="flex items-center gap-2">
          {showStats && stats}

          <div className="h-4 w-px bg-slate-700" />

          {/* Panel toggles */}
          <div className="flex items-center gap-0.5">
            <ToggleBtn label="Timeline" active={showTimeline} onClick={() => setShowTimeline(!showTimeline)} />
            <ToggleBtn label="E/L" active={showEarlyLate} onClick={() => setShowEarlyLate(!showEarlyLate)} />
            <ToggleBtn label="Stats" active={showStats} onClick={() => setShowStats(!showStats)} />
            {comboSteps && <ToggleBtn label="Keys" active={showSteps} onClick={() => setShowSteps(!showSteps)} />}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            title="Settings"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Exit */}
          <button
            onClick={onExit}
            className="rounded p-1 text-neutral-400 hover:bg-red-900/50 hover:text-red-400"
            title="Exit Fullscreen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Combo steps — optional panel below top bar */}
      {showSteps && comboSteps && (
        <div className="shrink-0 border-b border-white/5 bg-black/60 px-4 py-2">
          {comboSteps}
        </div>
      )}

      {/* Video — fills all remaining space */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          {videoElement}
        </div>
      </div>

      {/* Early/Late */}
      {showEarlyLate && (
        <div className="shrink-0 bg-black/60">{earlyLate}</div>
      )}

      {/* Timeline — anchored to bottom */}
      {showTimeline && (
        <div className="shrink-0">{timeline}</div>
      )}

      {/* Settings modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
        active
          ? 'bg-cyan-600/30 text-cyan-400'
          : 'text-neutral-600 hover:text-neutral-400'
      }`}
    >
      {label}
    </button>
  )
}
