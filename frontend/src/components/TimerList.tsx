import { memo, useEffect, useCallback, useRef } from 'react'
import { useTimerStore } from '../store/useTimerStore'
import { TimerItem } from './TimerItem'
import type { Timer } from '../types'

interface TimerListProps {
  stepId: string
  projectId: string
  isAdmin: boolean
  isExpanded: boolean
}

export const TimerList = memo(function TimerList({ stepId, projectId, isAdmin, isExpanded }: TimerListProps) {
  // Use a stable selector - return undefined if not found, handle in component
  const timers = useTimerStore((s) => s.timers.get(stepId))
  const isLoading = useTimerStore((s) => s.isLoading)
  const loadTimers = useTimerStore((s) => s.loadTimers)
  const addTimer = useTimerStore((s) => s.addTimer)
  
  // Track if we've already loaded timers for this step to prevent re-loading after delete
  const hasLoadedRef = useRef<Set<string>>(new Set())

  // Load timers when expanded for the first time
  useEffect(() => {
    if (isExpanded && !hasLoadedRef.current.has(stepId) && !isLoading) {
      hasLoadedRef.current.add(stepId)
      loadTimers(stepId)
    }
  }, [isExpanded, stepId, isLoading, loadTimers])

  const handleAddTimer = useCallback(() => {
    addTimer(stepId, projectId)
  }, [stepId, projectId, addTimer])

  if (!isExpanded) return null

  return (
    <div className="pl-8 pr-2 py-2 bg-black/20 rounded ml-4">
      {/* Timer list */}
      <div className="space-y-1">
        {(timers || []).map((timer: Timer) => (
          <TimerItem
            key={timer.id}
            timer={timer}
            stepId={stepId}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Add timer button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleAddTimer}
          className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-neon-blue transition-colors py-1"
        >
          <span className="text-lg">+</span>
          <span>Add timer</span>
        </button>
      )}

      {/* Empty state */}
      {!isAdmin && (!timers || timers.length === 0) && (
        <span className="text-sm text-gray-600 italic">No timers</span>
      )}
    </div>
  )
})