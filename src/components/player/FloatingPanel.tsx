import { useRef, useState, useCallback, type ReactNode } from 'react'

interface FloatingPanelProps {
  id: string
  title: string
  children: ReactNode
  defaultX: number
  defaultY: number
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
}

export function FloatingPanel({
  title,
  children,
  defaultX,
  defaultY,
  defaultW,
  defaultH,
  minW = 200,
  minH = 80,
}: FloatingPanelProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const [size, setSize] = useState({ w: defaultW, h: defaultH })
  const dragging = useRef(false)
  const resizing = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.resize) return
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: ev.clientX - offset.current.x, y: ev.clientY - offset.current.y })
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    resizing.current = true
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      setSize({
        w: Math.max(minW, startW + (ev.clientX - startX)),
        h: Math.max(minH, startH + (ev.clientY - startY)),
      })
    }
    const onUp = () => {
      resizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [size, minW, minH])

  return (
    <div
      className="absolute z-30 overflow-hidden rounded-lg border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar — draggable */}
      <div
        className="flex cursor-move items-center justify-between bg-slate-800/90 px-2 py-1"
        onMouseDown={handleDragStart}
      >
        <span className="text-[10px] font-medium text-slate-400">{title}</span>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-24px)] overflow-auto">
        {children}
      </div>

      {/* Resize handle */}
      <div
        data-resize="true"
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
        onMouseDown={handleResizeStart}
      >
        <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12">
          <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 5v6H5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}
