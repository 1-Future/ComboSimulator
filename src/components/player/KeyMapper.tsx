import { useState, useEffect, useRef, type RefObject } from 'react'
import type { ComboInput } from '@/types/combo'
import { Button } from '@/components/ui/Button'

export const ACTION_OPTIONS = [
  { value: 'spell1', label: 'Q - Spell 1' },
  { value: 'spell2', label: 'W - Spell 2' },
  { value: 'spell3', label: 'E - Spell 3' },
  { value: 'spell4', label: 'R - Spell 4' },
  { value: 'summoner1', label: 'D - Summoner 1' },
  { value: 'summoner2', label: 'F - Summoner 2' },
  { value: 'autoattack', label: 'A - Auto Attack' },
  { value: 'item1', label: '1 - Item 1' },
  { value: 'item2', label: '2 - Item 2' },
  { value: 'item3', label: '3 - Item 3' },
  { value: 'item4', label: '4 - Item 4' },
]

export const ACTION_TO_KEY: Record<string, string> = {
  spell1: 'Q',
  spell2: 'W',
  spell3: 'E',
  spell4: 'R',
  summoner1: 'D',
  summoner2: 'F',
  autoattack: 'A',
  item1: '1',
  item2: '2',
  item3: '3',
  item4: '4',
}

export function getUnknownInputs(inputs: ComboInput[]): number[] {
  return inputs
    .map((input, i) => {
      if (input.key === '?' || input.label === '?') return i
      if (input.key === '1' && input.action === 'item1' && input.label === '1') return i
      return -1
    })
    .filter((i) => i !== -1)
}

export function applyMapping(inputs: ComboInput[], index: number, action: string): ComboInput[] {
  return inputs.map((input, i) => {
    if (i !== index) return input
    return {
      ...input,
      action,
      key: ACTION_TO_KEY[action] ?? input.key,
      label: ACTION_TO_KEY[action] ?? input.label,
    }
  })
}

interface KeyMapperProps {
  inputs: ComboInput[]
  videoRef: RefObject<HTMLVideoElement | null>
  onComplete: (mappedInputs: ComboInput[]) => void
}

export function KeyMapper({ inputs, videoRef, onComplete }: KeyMapperProps) {
  const unknowns = getUnknownInputs(inputs)
  const [mappings, setMappings] = useState<Record<number, string>>({})
  const [frames, setFrames] = useState<Record<number, string>>({})
  const captureQueue = useRef<number[]>([])
  const capturing = useRef(false)

  useEffect(() => {
    const initial: Record<number, string> = {}
    for (const idx of unknowns) {
      const input = inputs[idx]
      if (input?.action && input.action !== 'item1') {
        initial[idx] = input.action
      }
    }
    setMappings(initial)
    // Queue frame captures for all unknowns
    captureQueue.current = [...unknowns]
    captureNextFrame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs])

  function captureNextFrame() {
    if (capturing.current) return
    const video = videoRef.current
    if (!video || captureQueue.current.length === 0) return

    capturing.current = true
    const idx = captureQueue.current.shift()!
    const input = inputs[idx]
    if (!input) {
      capturing.current = false
      captureNextFrame()
      return
    }

    const onSeeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setFrames((prev) => ({ ...prev, [idx]: canvas.toDataURL('image/jpeg', 0.8) }))
      }
      video.removeEventListener('seeked', onSeeked)
      capturing.current = false
      // Capture next one
      if (captureQueue.current.length > 0) {
        setTimeout(captureNextFrame, 50)
      }
    }

    video.addEventListener('seeked', onSeeked)
    video.currentTime = input.time
  }

  const allMapped = unknowns.every((idx) => mappings[idx])

  function handleSubmit() {
    let mapped = [...inputs]
    for (const [idxStr, action] of Object.entries(mappings)) {
      mapped = applyMapping(mapped, Number(idxStr), action)
    }
    onComplete(mapped)
  }

  return (
    <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-4">
      <h3 className="mb-1 text-sm font-semibold text-amber-400">
        Unknown keys detected
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Some inputs couldn't be auto-detected. Look at the video frame and pick the correct key.
      </p>

      <div className="space-y-3">
        {unknowns.map((idx) => {
          const input = inputs[idx]
          if (!input) return null
          const frame = frames[idx]

          return (
            <div key={idx} className="flex gap-3 rounded-lg border border-slate-700/50 bg-slate-900/50 p-2">
              {/* Frame preview */}
              <div className="shrink-0">
                {frame ? (
                  <img
                    src={frame}
                    alt={`Step ${idx + 1}`}
                    className="h-20 w-36 rounded border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-36 items-center justify-center rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-600">
                    Loading frame...
                  </div>
                )}
              </div>

              {/* Info + selector */}
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">Step {idx + 1}</span>
                  <span className="text-[10px] text-slate-500">at {input.time.toFixed(2)}s</span>
                  <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-[10px] font-mono text-amber-400">
                    {input.label === '1' ? 'Item?' : input.label}
                  </span>
                </div>
                <select
                  value={mappings[idx] ?? ''}
                  onChange={(e) =>
                    setMappings((prev) => ({ ...prev, [idx]: e.target.value }))
                  }
                  className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">What key is this?</option>
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={!allMapped}>
          {allMapped ? 'Start Combo' : 'Map all keys to continue'}
        </Button>
      </div>
    </div>
  )
}
