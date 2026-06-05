import { create } from 'zustand'
import type { Timer } from '../types'
import {
  fetchTimers,
  createTimer,
  updateTimer,
  deleteTimer,
  startTimer,
  stopTimer,
  resetTimer,
  fetchProjectTotalTime,
} from '../api'

interface TimerStoreState {
  timers: Map<string, Timer[]> // keyed by stepId
  runningTimerId: string | null
  projectTotals: Map<string, number> // keyed by projectId
  isLoading: boolean
  error: string | null
}

interface TimerStoreActions {
  // Timer CRUD
  loadTimers: (stepId: string) => Promise<void>
  addTimer: (stepId: string, projectId: string, description?: string) => Promise<Timer | undefined>
  updateTimerById: (id: string, stepId: string, updates: { description?: string; checkInDisabled?: boolean }) => void
  removeTimer: (id: string, stepId: string) => void

  // Timer controls
  startTimerById: (id: string, stepId: string) => Promise<void>
  stopTimerById: (id: string, stepId: string) => Promise<void>
  resetTimerById: (id: string, stepId: string) => Promise<void>

  // Project totals
  loadProjectTotal: (projectId: string) => Promise<void>
  getProjectTotal: (projectId: string) => number

  // Utility
  getTimerDisplayTime: (id: string, stepId: string) => string
  getRunningTimerId: () => string | null
  setError: (error: string | null) => void
}

type TimerStore = TimerStoreState & TimerStoreActions

// Helper to format seconds as HH:MM:SS
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  timers: new Map(),
  runningTimerId: null,
  projectTotals: new Map(),
  isLoading: false,
  error: null,

  loadTimers: async (stepId: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetchTimers(stepId)
      const timers = data.timers as Timer[]

      set((state) => {
        const newTimers = new Map(state.timers)
        newTimers.set(stepId, timers)
        return { timers: newTimers, isLoading: false }
      })

      // Check if any timer is running
      const runningTimer = timers.find((t) => t.isRunning)
      if (runningTimer) {
        set({ runningTimerId: runningTimer.id })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load timers', isLoading: false })
    }
  },

  addTimer: async (stepId: string, projectId: string, description: string = '') => {
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()

    const newTimer: Timer = {
      id: tempId,
      stepId,
      projectId,
      description,
      elapsedSeconds: 0,
      isRunning: false,
      startedAt: null,
      checkInDisabled: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const newTimers = new Map(state.timers)
      const stepTimers = newTimers.get(stepId) || []
      newTimers.set(stepId, [...stepTimers, newTimer])
      return { timers: newTimers }
    })

    try {
      const data = await createTimer(stepId, projectId, description)
      const createdTimer = data.timer as Timer

      set((state) => {
        const newTimers = new Map(state.timers)
        const stepTimers = newTimers.get(stepId) || []
        newTimers.set(
          stepId,
          stepTimers.map((t) => (t.id === tempId ? createdTimer : t))
        )
        return { timers: newTimers }
      })

      return createdTimer
    } catch (err: any) {
      set({ error: err.message || 'Failed to create timer' })
      // Remove temp timer on error
      set((state) => {
        const newTimers = new Map(state.timers)
        const stepTimers = newTimers.get(stepId) || []
        newTimers.set(stepId, stepTimers.filter((t) => t.id !== tempId))
        return { timers: newTimers }
      })
    }
  },

  updateTimerById: (id: string, stepId: string, updates: { description?: string }) => {
    set((state) => {
      const newTimers = new Map(state.timers)
      const stepTimers = newTimers.get(stepId) || []
      newTimers.set(
        stepId,
        stepTimers.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
      return { timers: newTimers }
    })

    updateTimer(id, updates).catch((err: any) => {
      set({ error: err.message || 'Failed to update timer' })
    })
  },

  removeTimer: (id: string, stepId: string) => {
    const timer = get().timers.get(stepId)?.find((t) => t.id === id)
    const projectId = timer?.projectId

    set((state) => {
      const newTimers = new Map(state.timers)
      const stepTimers = newTimers.get(stepId) || []
      newTimers.set(stepId, stepTimers.filter((t) => t.id !== id))
      return { timers: newTimers }
    })

    // Update running timer ID if this was the running timer
    if (get().runningTimerId === id) {
      set({ runningTimerId: null })
    }

    deleteTimer(id).catch((err: any) => {
      set({ error: err.message || 'Failed to delete timer' })
    })

    // Recalculate project total
    if (projectId) {
      get().loadProjectTotal(projectId)
    }
  },

  startTimerById: async (id: string, stepId: string) => {
    // Optimistically update UI
    const now = new Date().toISOString()
    set((state) => {
      const newTimers = new Map(state.timers)

      // Stop any other running timers in the store
      for (const [sid, timers] of newTimers) {
        newTimers.set(
          sid,
          timers.map((t) =>
            t.isRunning
              ? {
                  ...t,
                  isRunning: false,
                  startedAt: null,
                  elapsedSeconds: t.elapsedSeconds + Math.floor((Date.now() - new Date(t.startedAt || now).getTime()) / 1000),
                }
              : t
          )
        )
      }

      // Start the requested timer
      const stepTimers = newTimers.get(stepId) || []
      newTimers.set(
        stepId,
        stepTimers.map((t) =>
          t.id === id ? { ...t, isRunning: true, startedAt: now } : t
        )
      )

      return { timers: newTimers, runningTimerId: id }
    })

    try {
      const data = await startTimer(id)
      const updatedTimer = data.timer as Timer

      set((state) => {
        const newTimers = new Map(state.timers)
        const stepTimers = newTimers.get(stepId) || []
        newTimers.set(
          stepId,
          stepTimers.map((t) => (t.id === id ? updatedTimer : t))
        )
        return { timers: newTimers }
      })

      // Update project total
      get().loadProjectTotal(updatedTimer.projectId)
    } catch (err: any) {
      set({ error: err.message || 'Failed to start timer' })
      // Revert optimistic update
      get().loadTimers(stepId)
    }
  },

  stopTimerById: async (id: string, stepId: string) => {
    // Optimistically update UI
    set((state) => {
      const newTimers = new Map(state.timers)
      const stepTimers = newTimers.get(stepId) || []
      const timer = stepTimers.find((t) => t.id === id)

      if (timer && timer.startedAt) {
        const additionalSeconds = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
        newTimers.set(
          stepId,
          stepTimers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isRunning: false,
                  startedAt: null,
                  elapsedSeconds: t.elapsedSeconds + additionalSeconds,
                }
              : t
          )
        )
      }

      return { timers: newTimers, runningTimerId: null }
    })

    try {
      const data = await stopTimer(id)
      const updatedTimer = data.timer as Timer

      set((state) => {
        const newTimers = new Map(state.timers)
        const stepTimers = newTimers.get(stepId) || []
        newTimers.set(
          stepId,
          stepTimers.map((t) => (t.id === id ? updatedTimer : t))
        )
        return { timers: newTimers }
      })

      // Update project total
      get().loadProjectTotal(updatedTimer.projectId)
    } catch (err: any) {
      set({ error: err.message || 'Failed to stop timer' })
      // Revert optimistic update
      get().loadTimers(stepId)
    }
  },

  resetTimerById: async (id: string, stepId: string) => {
    const timer = get().timers.get(stepId)?.find((t) => t.id === id)
    const projectId = timer?.projectId

    // Optimistically update UI
    set((state) => {
      const newTimers = new Map(state.timers)
      const stepTimers = newTimers.get(stepId) || []
      newTimers.set(
        stepId,
        stepTimers.map((t) =>
          t.id === id
            ? { ...t, elapsedSeconds: 0, isRunning: false, startedAt: null }
            : t
        )
      )
      return { timers: newTimers, runningTimerId: state.runningTimerId === id ? null : state.runningTimerId }
    })

    try {
      const data = await resetTimer(id)
      const updatedTimer = data.timer as Timer

      set((state) => {
        const newTimers = new Map(state.timers)
        const stepTimers = newTimers.get(stepId) || []
        newTimers.set(
          stepId,
          stepTimers.map((t) => (t.id === id ? updatedTimer : t))
        )
        return { timers: newTimers }
      })

      // Update project total
      if (projectId) {
        get().loadProjectTotal(projectId)
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to reset timer' })
      // Revert optimistic update
      get().loadTimers(stepId)
    }
  },

  loadProjectTotal: async (projectId: string) => {
    try {
      const data = await fetchProjectTotalTime(projectId)
      set((state) => {
        const newTotals = new Map(state.projectTotals)
        newTotals.set(projectId, data.totalSeconds)
        return { projectTotals: newTotals }
      })
    } catch (err: any) {
      console.error('Failed to load project total:', err)
    }
  },

  getProjectTotal: (projectId: string) => {
    return get().projectTotals.get(projectId) || 0
  },

  getTimerDisplayTime: (id: string, stepId: string) => {
    const timer = get().timers.get(stepId)?.find((t) => t.id === id)
    if (!timer) return '00:00:00'

    let totalSeconds = timer.elapsedSeconds
    if (timer.isRunning && timer.startedAt) {
      totalSeconds += Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
    }

    return formatTime(totalSeconds)
  },

  getRunningTimerId: () => {
    return get().runningTimerId
  },

  setError: (error: string | null) => set({ error }),
}))