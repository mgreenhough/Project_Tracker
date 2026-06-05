import { memo, useCallback } from 'react'

interface CheckInModalProps {
  isOpen: boolean
  awaySeconds: number
  formattedAwayTime: string
  onResume: () => void
  onSkip: () => void
}

export const CheckInModal = memo(function CheckInModal({
  isOpen,
  awaySeconds,
  formattedAwayTime,
  onResume,
  onSkip,
}: CheckInModalProps) {
  const handleResume = useCallback(() => {
    onResume()
  }, [onResume])

  const handleSkip = useCallback(() => {
    onSkip()
  }, [onSkip])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border-2 border-neon-orange rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⏱</span>
          <h2 className="text-xl font-bold text-white">Timer Paused</h2>
        </div>

        <p className="text-gray-300 mb-4">
          Your timer has been automatically paused after the check-in interval.
        </p>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-1">Time away:</div>
          <div className="text-2xl font-mono text-neon-orange font-bold">
            {formattedAwayTime}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Still working on this task? Click "Resume Timer" to continue tracking time.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleResume}
            className="flex-1 px-4 py-3 bg-neon-green/20 text-neon-green border border-neon-green/40 rounded-lg font-medium active:bg-neon-green/30 transition-colors tap-active"
          >
            Resume Timer
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-3 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg font-medium active:bg-gray-700 transition-colors tap-active"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
})