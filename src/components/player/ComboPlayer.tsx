import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComboStore } from '@/stores/comboStore'
import { useEngineStore } from '@/stores/engineStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEngine } from '@/hooks/useEngine'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useDisplayKey } from '@/hooks/useDisplayKey'
import { VideoPlayer } from './VideoPlayer'
import { TimingOverlay } from './TimingOverlay'
import { GradePopup } from './GradePopup'
import { EarlyLateIndicator } from './EarlyLateIndicator'
import { KeyMapper, getUnknownInputs, applyMapping, ACTION_OPTIONS } from './KeyMapper'
import { MobileTapOverlay } from './MobileTapOverlay'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { Button } from '@/components/ui/Button'
import { GRADE_COLORS } from '@/lib/constants'
import type { ComboInput } from '@/types/combo'
import type { Grade } from '@/types/engine'

function SectionToggle({ label, visible, onToggle }: { label: string; visible: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
    >
      <span className={`transition-transform ${visible ? '' : '-rotate-90'}`}>&#x25BE;</span>
      {label}
    </button>
  )
}

const SPEEDS = [0.5, 0.75, 1.0]
const DIFFICULTIES: Array<{ value: 'easy' | 'normal' | 'strict'; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'strict', label: 'Strict' },
]

function ControlBar() {
  const sfxVol = useSettingsStore((s) => s.volume)
  const vidVol = useSettingsStore((s) => s.videoVolume)
  const speed = useSettingsStore((s) => s.playbackSpeed)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const setVolume = useSettingsStore((s) => s.setVolume)
  const setVideoVolume = useSettingsStore((s) => s.setVideoVolume)
  const setSpeed = useSettingsStore((s) => s.setPlaybackSpeed)
  const setDifficulty = useSettingsStore((s) => s.setDifficulty)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Speed */}
      <div className="flex items-center gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              speed === s
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      {/* Difficulty */}
      <div className="flex items-center gap-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => setDifficulty(d.value)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              difficulty === d.value
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {/* Volume */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-500">SFX</span>
        <input type="range" min="0" max="1" step="0.05" value={sfxVol}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 w-14 cursor-pointer accent-cyan-500" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-500">Vid</span>
        <input type="range" min="0" max="1" step="0.05" value={vidVol}
          onChange={(e) => setVideoVolume(Number(e.target.value))}
          className="h-1 w-14 cursor-pointer accent-cyan-500" />
      </div>
    </div>
  )
}

export function ComboPlayer() {
  const navigate = useNavigate()
  const selectedCombo = useComboStore((s) => s.selectedCombo)
  const selectedChampion = useComboStore((s) => s.selectedChampion)
  const championCombos = useComboStore((s) => s.championCombos)
  const champions = useComboStore((s) => s.champions)
  const selectCombo = useComboStore((s) => s.selectCombo)
  const comboState = useEngineStore((s) => s.comboState)
  const hits = useEngineStore((s) => s.hits)
  const currentStep = useEngineStore((s) => s.currentStep)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { attachVideo, loadCombo, resetCombo, seek } = useEngine()
  const [champSearch, setChampSearch] = useState('')
  const [showChampSearch, setShowChampSearch] = useState(false)
  const [needsMapping, setNeedsMapping] = useState(false)
  const mappingDoneRef = useRef(false)
  const [editingStep, setEditingStep] = useState<number | null>(null)
  const [editFrame, setEditFrame] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTopBar, setShowTopBar] = useState(false)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [showTimeline, setShowTimeline] = useState(true)
  const [showEarlyLate, setShowEarlyLate] = useState(true)
  const [showComboSteps, setShowComboSteps] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const { getDisplayKey, getKeyboardKey, getGamepadButton, activeDevice } = useDisplayKey()
  const isMobile = useMediaQuery('(max-width: 768px)') || ('ontouchstart' in window && navigator.maxTouchPoints > 0)

  useEffect(() => {
    if (videoRef.current) {
      attachVideo(videoRef.current)
    }
  }, [attachVideo, selectedCombo])

  useEffect(() => {
    if (!selectedCombo) return
    if (mappingDoneRef.current) {
      mappingDoneRef.current = false
      setNeedsMapping(false)
      loadCombo()
      return
    }
    const unknowns = getUnknownInputs(selectedCombo.inputs)
    if (unknowns.length > 0) {
      setNeedsMapping(true)
    } else {
      setNeedsMapping(false)
      loadCombo()
    }
  }, [selectedCombo, loadCombo])

  const handleReset = useCallback(() => {
    resetCombo()
  }, [resetCombo])

  const handleMappingComplete = useCallback(
    (mappedInputs: ComboInput[]) => {
      if (!selectedCombo) return
      mappingDoneRef.current = true
      selectCombo({ ...selectedCombo, inputs: mappedInputs })
    },
    [selectedCombo, selectCombo],
  )

  const handleReassignKey = useCallback(
    (index: number, action: string) => {
      if (!selectedCombo) return
      const newInputs = applyMapping(selectedCombo.inputs, index, action)
      mappingDoneRef.current = true
      selectCombo({ ...selectedCombo, inputs: newInputs })
      setEditingStep(null)
      setEditFrame(null)
    },
    [selectedCombo, selectCombo],
  )

  const handleEditStep = useCallback(
    (index: number | null) => {
      if (index === editingStep) {
        setEditingStep(null)
        setEditFrame(null)
        return
      }
      setEditingStep(index)
      if (index !== null && selectedCombo && videoRef.current) {
        const time = selectedCombo.inputs[index]?.time
        if (time !== undefined) {
          // Seek video to this step's timestamp
          seek(time)
          // Capture frame after seek
          const video = videoRef.current
          const onSeeked = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 320
            canvas.height = 180
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              setEditFrame(canvas.toDataURL('image/jpeg', 0.8))
            }
            video.removeEventListener('seeked', onSeeked)
          }
          video.addEventListener('seeked', onSeeked)
        }
      }
    },
    [editingStep, selectedCombo, seek],
  )

  useKeyboard({ ' ': handleReset }, !!selectedCombo && !needsMapping && !showChampSearch)

  // Combo navigation
  const comboList = championCombos?.combos ?? []
  const currentComboIndex = comboList.findIndex((c) => c.id === selectedCombo?.id)

  const goToCombo = useCallback(
    (index: number) => {
      const combo = comboList[index]
      if (combo && selectedChampion) {
        selectCombo(combo)
        navigate(`/play/${selectedChampion.id}/${combo.id}`)
      }
    },
    [comboList, selectedChampion, selectCombo, navigate],
  )

  const goPrev = useCallback(() => {
    if (currentComboIndex > 0) goToCombo(currentComboIndex - 1)
  }, [currentComboIndex, goToCombo])

  const goNext = useCallback(() => {
    if (currentComboIndex < comboList.length - 1) goToCombo(currentComboIndex + 1)
  }, [currentComboIndex, comboList.length, goToCombo])

  // Filtered champion search results
  const filteredChampions = useMemo(() => {
    if (!champSearch) return []
    return champions
      .filter((c) => c.name.toLowerCase().includes(champSearch.toLowerCase()))
      .slice(0, 8)
  }, [champions, champSearch])

  // Fullscreen: listen for exit + mouse hover for top bar
  useEffect(() => {
    const fsHandler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    const mouseHandler = (e: MouseEvent) => {
      if (isFullscreen) {
        setShowTopBar(e.clientY < 50)
      }
    }
    document.addEventListener('fullscreenchange', fsHandler)
    document.addEventListener('mousemove', mouseHandler)
    return () => {
      document.removeEventListener('fullscreenchange', fsHandler)
      document.removeEventListener('mousemove', mouseHandler)
    }
  }, [isFullscreen])

  if (!selectedCombo || !selectedChampion) {
    const hasUrlParams = window.location.pathname.startsWith('/play/')
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        {hasUrlParams ? 'Loading combo...' : 'Select a champion and combo to start practicing'}
      </div>
    )
  }

  const hitGrades = new Map(hits.map((h) => [h.stepIndex, h.grade]))

  return (
    <>
    {/* Splash art — full page background */}
    {selectedChampion.splash && (
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: `url(${selectedChampion.splash})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 90%)',
        }}
      />
    )}
    <div
      ref={playerContainerRef}
      className={`relative mx-auto ${isFullscreen ? 'flex h-screen max-w-none flex-col bg-black px-2 py-1' : `max-w-4xl ${isMobile ? 'px-2 py-2' : 'px-4 py-6'}`}`}
    >
      {/* Header — auto-hides in fullscreen */}
      <div className={`flex items-center justify-between transition-all ${
        isFullscreen
          ? `absolute left-0 right-0 top-0 z-30 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm ${showTopBar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`
          : `mb-2 ${isMobile ? 'gap-2' : 'mb-4 gap-3'}`
      }`}>
        <div className="flex min-w-0 items-center gap-2">
          {selectedChampion.portrait && (
            <img src={selectedChampion.portrait} alt="" className={`rounded-lg ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`} />
          )}
          <div className="min-w-0">
            <h2 className={`truncate font-bold text-white ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {isMobile ? selectedCombo.name : `${selectedChampion.name} — ${selectedCombo.name}`}
            </h2>
            {!isMobile && <p className="text-xs text-slate-400">{selectedCombo.description}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isMobile && <ControlBar />}
          <button
            onClick={() => setShowChampSearch(!showChampSearch)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {!isMobile && (
            <button
              onClick={() => {
                if (!isFullscreen && playerContainerRef.current) {
                  playerContainerRef.current.requestFullscreen()
                  setIsFullscreen(true)
                } else if (document.fullscreenElement) {
                  document.exitFullscreen()
                  setIsFullscreen(false)
                }
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Fullscreen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Champion quick search */}
      {showChampSearch && (
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search champions..."
            value={champSearch}
            onChange={(e) => setChampSearch(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-3 pr-8 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowChampSearch(false)
                setChampSearch('')
              }
            }}
          />
          <button
            onClick={() => { setShowChampSearch(false); setChampSearch('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            &#x2715;
          </button>
          {filteredChampions.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
              {filteredChampions.map((champ) => (
                <button
                  key={champ.id}
                  onClick={async () => {
                    setShowChampSearch(false)
                    setChampSearch('')
                    // Load the champion's combos to find the first combo ID
                    try {
                      const res = await fetch(`/data/combos/${champ.id}.json`)
                      const data = await res.json()
                      const firstCombo = data.combos?.[0]
                      if (firstCombo) {
                        window.location.href = `/play/${champ.id}/${firstCombo.id}`
                      } else {
                        navigate('/')
                      }
                    } catch {
                      navigate('/')
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-700"
                >
                  {champ.portrait && (
                    <img src={champ.portrait} alt="" className="h-6 w-6 rounded" />
                  )}
                  <span className="text-sm text-slate-300">{champ.name}</span>
                  <span className="ml-auto text-[10px] text-slate-500">{champ.comboCount} combos</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Combo navigation arrows — hidden in fullscreen */}
      {!isFullscreen && comboList.length > 1 && (
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentComboIndex <= 0}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {!isMobile && 'Prev'}
          </button>
          <span className="text-[10px] text-slate-500">
            {currentComboIndex + 1} / {comboList.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentComboIndex >= comboList.length - 1}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
          >
            {!isMobile && 'Next'}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* First load hint — hidden in fullscreen */}
      {!isFullscreen && !isMobile && (
        <div className="mb-2 rounded border border-slate-700/50 bg-slate-800/30 px-3 py-1.5 text-[11px] text-slate-500">
          If the video is out of sync, press <kbd className="rounded bg-slate-700 px-1 font-mono text-slate-400">SPACE</kbd> or refresh the page
        </div>
      )}

      {/* Key Mapper */}
      {needsMapping && (
        <KeyMapper inputs={selectedCombo.inputs} videoRef={videoRef} onComplete={handleMappingComplete} />
      )}

      {/* Video + Overlay */}
      <div className={`relative overflow-hidden ${isFullscreen ? 'min-h-0 flex-1' : isMobile ? 'rounded-lg' : 'rounded-xl border border-slate-700'}`}>
        <VideoPlayer ref={videoRef} filename={selectedCombo.video.filename} fill={isFullscreen} />
        {!needsMapping && !isMobile && <GradePopup />}

        {/* Mobile: full-screen tap zone overlay */}
        {isMobile && !needsMapping && (
          <MobileTapOverlay inputs={selectedCombo.inputs} />
        )}

        {/* Desktop: State overlay on video */}
        {!isMobile && comboState === 'ready' && !needsMapping && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <div className="mb-2 text-xs font-medium tracking-widest text-slate-400 uppercase">Ready</div>
              <div className="text-2xl font-black text-white">
                Press <span className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-400">{getDisplayKey(selectedCombo.inputs[0]!)}</span> to start
              </div>
              <div className="mt-3 text-xs text-slate-500">
                SPACE to reset position
              </div>
            </div>
          </div>
        )}
        {!isMobile && comboState === 'complete' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <div className="text-3xl font-black text-green-400">Combo Complete!</div>
              <div className="mt-2 text-sm text-slate-300">
                Press SPACE to try again
              </div>
            </div>
          </div>
        )}
      </div>

      {!needsMapping && (
        <>
          {/* Section toggles — hidden in fullscreen */}
          {!isFullscreen && (
            <div className="mt-1 flex items-center gap-3 border-b border-slate-800 pb-1">
              <SectionToggle label="Timeline" visible={showTimeline} onToggle={() => setShowTimeline(!showTimeline)} />
              <SectionToggle label="Early/Late" visible={showEarlyLate} onToggle={() => setShowEarlyLate(!showEarlyLate)} />
              {!isMobile && <SectionToggle label="Keys" visible={showComboSteps} onToggle={() => setShowComboSteps(!showComboSteps)} />}
              {!isMobile && <SectionToggle label="Stats" visible={showStats} onToggle={() => setShowStats(!showStats)} />}
            </div>
          )}

          {/* Timeline */}
          {(isFullscreen || showTimeline) && <TimingOverlay inputs={selectedCombo.inputs} />}

          {/* Early/Late */}
          {(isFullscreen || showEarlyLate) && <EarlyLateIndicator />}

          {/* Combo Steps */}
          {(isFullscreen || (!isMobile && showComboSteps)) && <>
          <div className="mt-3 space-y-2">
            {/* Keyboard row */}
            <div className={activeDevice === 'keyboard' ? 'opacity-100' : 'opacity-40'}>
              <div className="mb-1 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
                </svg>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Keyboard
                </span>
                {activeDevice === 'keyboard' && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                <span className="ml-auto text-[10px] text-slate-600">
                  click to edit
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedCombo.inputs.map((input, index) => {
                  const hit = hits.find((h) => h.stepIndex === index)
                  const isCurrent = index === currentStep && comboState === 'playing'
                  const isEditing = editingStep === index
                  const grade = hitGrades.get(index) as Grade | undefined
                  const color = grade ? GRADE_COLORS[grade] : undefined
                  const borderColor = color ?? (isCurrent ? '#22d3ee' : isEditing ? '#f59e0b' : '#334155')

                  return (
                    <div key={index} className="relative flex flex-col items-center">
                      {/* Approach ring — pulses on current step */}
                      {isCurrent && (
                        <div
                          className="absolute inset-0 m-auto h-12 w-12 animate-ping rounded-full opacity-30"
                          style={{ backgroundColor: '#22d3ee' }}
                        />
                      )}
                      <button
                        onClick={() => handleEditStep(isEditing ? null : index)}
                        className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-base font-mono font-bold transition-all ${
                          isCurrent
                            ? 'scale-110 shadow-lg shadow-cyan-500/30'
                            : ''
                        }`}
                        style={{
                          borderColor,
                          color: color ?? (isCurrent ? '#22d3ee' : '#94a3b8'),
                          backgroundColor: color ? `${color}15` : isCurrent ? 'rgba(8,145,178,0.15)' : isEditing ? 'rgba(245,158,11,0.1)' : 'rgba(30,41,59,0.8)',
                        }}
                      >
                        {getKeyboardKey(input)}
                      </button>
                      {/* Grade label below */}
                      {hit && (
                        <span className="mt-1 text-[9px] font-medium" style={{ color }}>
                          {hit.grade}
                        </span>
                      )}
                      {!hit && !isCurrent && (
                        <span className="mt-1 text-[9px] text-slate-600">{input.label}</span>
                      )}

                      {/* Edit dropdown */}
                      {isEditing && (
                        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-slate-600 bg-slate-800 shadow-xl">
                          {editFrame && (
                            <div className="border-b border-slate-700 p-1.5">
                              <img src={editFrame} alt={`Step ${index + 1}`} className="w-52 rounded" />
                              <div className="mt-1 px-1 text-[10px] text-slate-500">
                                Step {index + 1} at {input.time.toFixed(2)}s — what key is this?
                              </div>
                            </div>
                          )}
                          <div className="max-h-48 overflow-y-auto py-1">
                            {ACTION_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handleReassignKey(index, opt.value) }}
                                className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-700 ${input.action === opt.value ? 'text-cyan-400' : 'text-slate-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {index < selectedCombo.inputs.length - 1 && (
                        <span className="absolute -right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">›</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gamepad row */}
            <div className={activeDevice === 'gamepad' ? 'opacity-100' : 'opacity-40'}>
              <div className="mb-1 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
                  <rect x="2" y="6" width="20" height="12" rx="4" />
                </svg>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Controller
                </span>
                {activeDevice === 'gamepad' && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedCombo.inputs.map((input, index) => {
                  const isCurrent = index === currentStep && comboState === 'playing'
                  const grade = hitGrades.get(index) as Grade | undefined
                  const color = grade ? GRADE_COLORS[grade] : undefined
                  const gamepadLabel = getGamepadButton(input)
                  const borderColor = color ?? (isCurrent ? '#22d3ee' : '#334155')

                  return (
                    <div key={index} className="relative flex flex-col items-center">
                      {isCurrent && (
                        <div
                          className="absolute inset-0 m-auto h-10 w-10 animate-ping rounded-full opacity-30"
                          style={{ backgroundColor: '#22d3ee' }}
                        />
                      )}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                          isCurrent ? 'scale-110' : ''
                        }`}
                        style={{
                          borderColor,
                          color: color ?? (isCurrent ? '#22d3ee' : '#64748b'),
                          backgroundColor: color ? `${color}15` : isCurrent ? 'rgba(8,145,178,0.15)' : 'rgba(30,41,59,0.8)',
                        }}
                      >
                        {gamepadLabel}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Controls bar */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2">
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">SPACE</kbd> reset</span>
              <span><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">{getDisplayKey(selectedCombo.inputs[0]!)}</kbd> start</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset Combo
            </Button>
          </div>
          </>}

          {/* Stats */}
          {(isFullscreen || (!isMobile && showStats)) && <StatsPanel />}
        </>
      )}
    </div>
    </>
  )
}
