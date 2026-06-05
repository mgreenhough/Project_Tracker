import { memo, useState, useEffect, useCallback } from 'react'
import { useTimerStore } from '../store/useTimerStore'
import type { Timer } from '../types'

interface TimerItemProps {
  timer: Timer
  stepId: string
  isAdmin: boolean
}

// Helper to format seconds as HH:MM:SS
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const TimerItem = memo(function TimerItem({ timer, stepId, isAdmin }: TimerItemProps) {
  const startTimerById = useTimerStore((s) => s.startTimerById)
  const stopTimerById = useTimerStore((s) => s.stopTimerById)
  const resetTimerById = useTimerStore((s) => s.resetTimerById)
  const removeTimer = useTimerStore((s) => s.removeTimer)
  const updateTimerById = useTimerStore((s) => s.updateTimerById)

  const [displayTime, setDisplayTime] = useState(() => {
    let totalSeconds = timer.elapsedSeconds
    if (timer.isRunning && timer.startedAt) {
      totalSeconds += Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
    }
    return formatTime(totalSeconds)
  })

  // Update display time every second if running
  useEffect(() => {
    if (!timer.isRunning) {
      setDisplayTime(formatTime(timer.elapsedSeconds))
      return
    }

    const interval = setInterval(() => {
      let totalSeconds = timer.elapsedSeconds
      if (timer.startedAt) {
        totalSeconds += Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
      }
      setDisplayTime(formatTime(totalSeconds))
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, timer.elapsedSeconds, timer.startedAt])

  const handlePlayPause = useCallback(() => {
    if (timer.isRunning) {
      stopTimerById(timer.id, stepId)
    } else {
      startTimerById(timer.id, stepId)
    }
  }, [timer.isRunning, timer.id, stepId, startTimerById, stopTimerById])

  const handleReset = useCallback(() => {
    resetTimerById(timer.id, stepId)
  }, [timer.id, stepId, resetTimerById])

  const handleDelete = useCallback(() => {
    removeTimer(timer.id, stepId)
  }, [timer.id, stepId, removeTimer])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateTimerById(timer.id, stepId, { description: e.target.value })
  }, [timer.id, stepId, updateTimerById])

  const handleDescriptionBlur = useCallback(() => {
    // Auto-save on blur
  }, [])

  const handleDescriptionKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm py-1">
      {/* Description input */}
      <input
        type="text"
        value={timer.description}
        onChange={handleDescriptionChange}
        onBlur={handleDescriptionBlur}
        onKeyDown={handleDescriptionKeyDown}
        placeholder="Timer description..."
        disabled={!isAdmin}
        className="flex-1 bg-transparent border-b border-gray-700 text-gray-300 placeholder-gray-600 outline-none focus:border-neon-blue min-w-0 px-1"
      />

      {/* Time display */}
      <span className={`font-mono text-sm w-20 text-center ${timer.isRunning ? 'text-neon-green' : 'text-gray-400'}`}>
        {displayTime}
      </span>

      {/* Play/Pause button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handlePlayPause}
          className={`w-7 h-7 flex items-center justify-center rounded active:bg-white/5 transition-colors ${
            timer.isRunning ? 'text-neon-green' : 'text-gray-400'
          } hover:text-neon-blue`}
          title={timer.isRunning ? 'Pause timer' : 'Start timer'}
        >
          {timer.isRunning ? '⏸' : '▶'}
        </button>
      )}

      {/* Reset button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleReset}
          className="w-7 h-7 flex items-center justify-center rounded active:bg-white/5 transition-colors text-gray-400 hover:text-neon-yellow"
          title="Reset timer"
        >
          ↺
        </button>
      )}

      {/* Check-in disable toggle */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => updateTimerById(timer.id, stepId, { checkInDisabled: !timer.checkInDisabled })}
          className={`w-7 h-7 flex items-center justify-center rounded active:bg-white/5 transition-colors ${
            timer.checkInDisabled ? 'text-neon-orange' : 'text-gray-600'
          } hover:text-neon-orange`}
          title={timer.checkInDisabled ? 'Check-in disabled (timer runs continuously)' : 'Enable check-in reminders'}
        >
          {timer.checkInDisabled ? '🔔' : '🔕'}
        </button>
      )}

      {/* Delete button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-7 h-7 flex items-center justify-center rounded active:bg-white/5 transition-colors text-gray-600 hover:text-neon-red"
          title="Delete timer"
        >
          ×
        </button>
      )}
    </div>
  )
})