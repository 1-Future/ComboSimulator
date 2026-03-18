import { Modal } from '@/components/ui/Modal'
import { KeybindEditor } from './KeybindEditor'
import { DifficultySelector } from './DifficultySelector'
import { AudioSettings } from './AudioSettings'
import { CalibrationWizard } from './CalibrationWizard'
import { GameKeybindEditor } from '@/components/fighting/GameKeybindEditor'
import { GAME_INPUTS } from '@/types/gameInputs'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function detectGameFromPath(): string | null {
  const segment = window.location.pathname.split('/')[1]
  if (segment && segment in GAME_INPUTS) return segment
  return null
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const currentGame = isOpen ? detectGameFromPath() : null
  const isLeague = currentGame === 'league' || window.location.pathname.startsWith('/play/')
  const isFighting = currentGame && currentGame !== 'league'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <DifficultySelector />
        <AudioSettings />

        {isLeague && <KeybindEditor />}
        {isFighting && <GameKeybindEditor gameId={currentGame} />}
        {!isLeague && !isFighting && (
          <div className="text-xs text-neutral-500">
            Select a game to configure keybinds.
          </div>
        )}

        <CalibrationWizard />
      </div>
    </Modal>
  )
}
