import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

// --- Types ---

interface PanelLayout {
  x: number
  y: number
  w: number
  h: number
  visible: boolean
}

interface PanelConfig {
  id: string
  title: string
  defaultLayout: PanelLayout
  minW?: number
  minH?: number
  content: ReactNode
}

interface PanelManagerState {
  layouts: Record<string, PanelLayout>
  unlocked: boolean
  gridX: number
  gridY: number
}

interface PanelManagerContextType {
  state: PanelManagerState
  setLayout: (id: string, layout: Partial<PanelLayout>) => void
  togglePanel: (id: string) => void
  toggleLock: () => void
  resetLayout: () => void
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null)

const STORAGE_KEY = 'combosim-panel-layout'

// --- Hook ---

export function usePanelManager() {
  const ctx = useContext(PanelManagerContext)
  if (!ctx) throw new Error('usePanelManager must be used within PanelManagerProvider')
  return ctx
}

// --- Snap Logic ---

function snapToGrid(value: number, gridSize: number, threshold = 12): number {
  const snapped = Math.round(value / gridSize) * gridSize
  return Math.abs(value - snapped) < threshold ? snapped : value
}

// --- Draggable Panel ---

function DraggablePanel({
  id,
  title,
  layout,
  unlocked,
  minW = 100,
  minH = 50,
  gridCellW,
  gridCellH,
  onLayoutChange,
  children,
}: {
  id: string
  title: string
  layout: PanelLayout
  unlocked: boolean
  minW?: number
  minH?: number
  gridCellW: number
  gridCellH: number
  onLayoutChange: (id: string, layout: Partial<PanelLayout>) => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!unlocked) return
      e.preventDefault()
      const startX = e.clientX - layout.x
      const startY = e.clientY - layout.y

      const onMove = (ev: MouseEvent) => {
        const rawX = ev.clientX - startX
        const rawY = ev.clientY - startY
        onLayoutChange(id, {
          x: snapToGrid(rawX, gridCellW),
          y: snapToGrid(rawY, gridCellH),
        })
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [unlocked, layout.x, layout.y, id, gridCellW, gridCellH, onLayoutChange],
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!unlocked) return
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startY = e.clientY
      const startW = layout.w
      const startH = layout.h

      const onMove = (ev: MouseEvent) => {
        const rawW = Math.max(minW, startW + (ev.clientX - startX))
        const rawH = Math.max(minH, startH + (ev.clientY - startY))
        onLayoutChange(id, {
          w: snapToGrid(rawW, gridCellW),
          h: snapToGrid(rawH, gridCellH),
        })
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [unlocked, layout.w, layout.h, id, minW, minH, gridCellW, gridCellH, onLayoutChange],
  )

  if (!layout.visible) return null

  return (
    <div
      ref={panelRef}
      className={`absolute overflow-hidden rounded-lg ${
        unlocked
          ? 'border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
          : 'border border-white/5'
      }`}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.w,
        height: layout.h,
      }}
    >
      {/* Title bar — only shows when unlocked */}
      {unlocked && (
        <div
          className="flex cursor-move items-center justify-between bg-slate-800/90 px-2 py-0.5"
          onMouseDown={handleDragStart}
        >
          <span className="text-[9px] font-medium text-slate-400">{title}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLayoutChange(id, { visible: false })}
              className="text-[10px] text-slate-500 hover:text-red-400"
            >
              &#x2715;
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`h-full overflow-hidden ${unlocked ? 'h-[calc(100%-20px)]' : ''}`}>
        {children}
      </div>

      {/* Resize grip — bottom right */}
      {unlocked && (
        <div
          className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg className="h-3 w-3 text-cyan-500/50" viewBox="0 0 12 12">
            <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5v6H5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  )
}

// --- Grid Overlay ---

function GridOverlay({ gridX, gridY }: { gridX: number; gridY: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Vertical lines */}
      {Array.from({ length: gridX + 1 }, (_, i) => (
        <div
          key={`v${i}`}
          className="absolute top-0 h-full w-px bg-cyan-500/10"
          style={{ left: `${(i / gridX) * 100}%` }}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: gridY + 1 }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute left-0 h-px w-full bg-cyan-500/10"
          style={{ top: `${(i / gridY) * 100}%` }}
        />
      ))}
      {/* Intersection dots */}
      {Array.from({ length: (gridX + 1) * (gridY + 1) }, (_, idx) => {
        const col = idx % (gridX + 1)
        const row = Math.floor(idx / (gridX + 1))
        return (
          <div
            key={`d${idx}`}
            className="absolute h-1 w-1 -translate-x-0.5 -translate-y-0.5 rounded-full bg-cyan-500/20"
            style={{ left: `${(col / gridX) * 100}%`, top: `${(row / gridY) * 100}%` }}
          />
        )
      })}
    </div>
  )
}

// --- Provider ---

interface PanelManagerProviderProps {
  panels: PanelConfig[]
  children?: ReactNode
}

export function PanelManagerProvider({ panels, children }: PanelManagerProviderProps) {
  // Build default layouts
  const defaults = panels.reduce(
    (acc, p) => ({ ...acc, [p.id]: p.defaultLayout }),
    {} as Record<string, PanelLayout>,
  )

  // Load saved layouts
  const [state, setState] = useState<PanelManagerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          layouts: { ...defaults, ...parsed.layouts },
          unlocked: false,
          gridX: parsed.gridX ?? 6,
          gridY: parsed.gridY ?? 4,
        }
      }
    } catch {}
    return { layouts: defaults, unlocked: false, gridX: 6, gridY: 4 }
  })

  // Save on change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ layouts: state.layouts, gridX: state.gridX, gridY: state.gridY }),
    )
  }, [state.layouts, state.gridX, state.gridY])

  const setLayout = useCallback((id: string, partial: Partial<PanelLayout>) => {
    setState((s) => ({
      ...s,
      layouts: { ...s.layouts, [id]: { ...s.layouts[id]!, ...partial } },
    }))
  }, [])

  const togglePanel = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      layouts: {
        ...s.layouts,
        [id]: { ...s.layouts[id]!, visible: !s.layouts[id]?.visible },
      },
    }))
  }, [])

  const toggleLock = useCallback(() => {
    setState((s) => ({ ...s, unlocked: !s.unlocked }))
  }, [])

  const resetLayout = useCallback(() => {
    setState((s) => ({ ...s, layouts: defaults }))
  }, [defaults])

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 1, h: 1 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const gridCellW = containerSize.w / state.gridX
  const gridCellH = containerSize.h / state.gridY

  return (
    <PanelManagerContext.Provider value={{ state, setLayout, togglePanel, toggleLock, resetLayout }}>
      <div ref={containerRef} className="relative h-full w-full">
        {/* Grid overlay when unlocked */}
        {state.unlocked && <GridOverlay gridX={state.gridX} gridY={state.gridY} />}

        {/* Panels */}
        {panels.map((panel) => {
          const layout = state.layouts[panel.id]
          if (!layout) return null
          return (
            <DraggablePanel
              key={panel.id}
              id={panel.id}
              title={panel.title}
              layout={layout}
              unlocked={state.unlocked}
              minW={panel.minW}
              minH={panel.minH}
              gridCellW={gridCellW}
              gridCellH={gridCellH}
              onLayoutChange={setLayout}
            >
              {panel.content}
            </DraggablePanel>
          )
        })}

        {/* Extra content (like video background) */}
        {children}

        {/* Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-white/10 bg-slate-900/95 px-3 py-1 backdrop-blur-sm">
          {/* Panel toggles */}
          <div className="flex items-center gap-1.5">
            {panels.map((panel) => {
              const layout = state.layouts[panel.id]
              const isVisible = layout?.visible
              return (
                <button
                  key={panel.id}
                  onClick={() => togglePanel(panel.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isVisible
                      ? 'bg-slate-700/80 text-slate-200'
                      : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {panel.title}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {state.unlocked && (
              <button
                onClick={resetLayout}
                className="rounded-md px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                Reset Layout
              </button>
            )}
            <button
              onClick={toggleLock}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                state.unlocked
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {state.unlocked ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Lock Layout
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Edit Layout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PanelManagerContext.Provider>
  )
}
