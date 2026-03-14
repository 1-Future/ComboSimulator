import { Modal } from '@/components/ui/Modal'
import { KeybindEditor } from './KeybindEditor'
import { DifficultySelector } from './DifficultySelector'
import { AudioSettings } from './AudioSettings'
import { CalibrationWizard } from './CalibrationWizard'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <DifficultySelector />
        <AudioSettings />
        <KeybindEditor />
        <CalibrationWizard />
      </div>
    </Modal>
  )
}
