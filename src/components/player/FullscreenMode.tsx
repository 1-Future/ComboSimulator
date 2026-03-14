import { useState, type RefObject, type ReactNode } from 'react'
import { FloatingPanel } from './FloatingPanel'

interface TaskbarItem {
  id: string
  label: string
  icon: ReactNode
}

interface FullscreenModeProps {
  videoRef: RefObject<HTMLVideoElement | null>
  panels: Record<string, { title: string; content: ReactNode; defaultX: number; defaultY: number; defaultW: number; defaultH: number }>
  onExit: () => void
  children?: ReactNode
}

export function FullscreenMode({ panels, onExit, children }: FullscreenModeProps) {
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set(Object.keys(panels)))

  function togglePanel(id: string) {
    setVisiblePanels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const taskbarItems: TaskbarItem[] = Object.entries(panels).map(([id, p]) => ({
    id,
    label: p.title,
    icon: <span className="text-[10px]">{p.title[0]}</span>,
  }))

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Background content (video) */}
      {children}

      {/* Floating panels */}
      {Object.entries(panels).map(([id, panel]) =>
        visiblePanels.has(id) ? (
          <FloatingPanel
            key={id}
            id={id}
            title={panel.title}
            defaultX={panel.defaultX}
            defaultY={panel.defaultY}
            defaultW={panel.defaultW}
            defaultH={panel.defaultH}
          >
            {panel.content}
          </FloatingPanel>
        ) : null,
      )}

      {/* Bottom taskbar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-white/10 bg-slate-900/90 px-3 py-1 backdrop-blur-md">
        {/* Panel toggles */}
        <div className="flex items-center gap-1">
          {taskbarItems.map((item) => {
            const isActive = visiblePanels.has(item.id)
            return (
              <button
                key={item.id}
                onClick={() => togglePanel(item.id)}
                className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-600/30 text-cyan-400'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Exit fullscreen */}
        <button
          onClick={onExit}
          className="rounded px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          Exit Fullscreen
        </button>
      </div>
    </div>
  )
}
