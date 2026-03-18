import { useSettingsStore } from '@/stores/settingsStore'
import { setVolume } from '@/lib/audio'

export function AudioSettings() {
  const volume = useSettingsStore((s) => s.volume)
  const pingEnabled = useSettingsStore((s) => s.pingEnabled)
  const gradeSoundsEnabled = useSettingsStore((s) => s.gradeSoundsEnabled)
  const setVolumeStore = useSettingsStore((s) => s.setVolume)
  const setPingEnabled = useSettingsStore((s) => s.setPingEnabled)
  const setGradeSoundsEnabled = useSettingsStore((s) => s.setGradeSoundsEnabled)

  function handleVolumeChange(value: number) {
    setVolumeStore(value)
    setVolume(value)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-300">Audio</h3>

      <div>
        <label className="flex items-center justify-between text-xs text-neutral-400">
          <span>Volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="mt-1 w-full accent-cyan-500"
        />
      </div>

      <label className="flex items-center justify-between text-xs text-neutral-400">
        <span>Ping on combo steps</span>
        <input
          type="checkbox"
          checked={pingEnabled}
          onChange={(e) => setPingEnabled(e.target.checked)}
          className="accent-cyan-500"
        />
      </label>

      <label className="flex items-center justify-between text-xs text-neutral-400">
        <span>Grade sounds</span>
        <input
          type="checkbox"
          checked={gradeSoundsEnabled}
          onChange={(e) => setGradeSoundsEnabled(e.target.checked)}
          className="accent-cyan-500"
        />
      </label>
    </div>
  )
}
