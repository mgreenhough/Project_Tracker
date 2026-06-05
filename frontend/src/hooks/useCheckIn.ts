import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTimerStore } from '../store/useTimerStore'

interface CheckInState {
  isCheckInPending: boolean
  awaySeconds: number
  lastCheckInAt: number | null
}

const CHECK_IN_KEY = 'timer-check-in-preferences'

interface CheckInPreferences {
  enabled: boolean
  intervalMinutes: number
}

const defaultPreferences: CheckInPreferences = {
  enabled: true,
  intervalMinutes: 30,
}

export function useCheckIn() {
  const runningTimerId = useTimerStore((s) => s.runningTimerId)
  const stopTimerById = useTimerStore((s) => s.stopTimerById)
  const startTimerById = useTimerStore((s) => s.startTimerById)

  const [preferences, setPreferences] = useState<CheckInPreferences>(() => {
    const stored = localStorage.getItem(CHECK_IN_KEY)
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences
  })

  const [checkInState, setCheckInState] = useState<CheckInState>({
    isCheckInPending: false,
    awaySeconds: 0,
    lastCheckInAt: null,
  })

  const timerStartTimeRef = useRef<number | null>(null)
  const checkInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const awayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningTimerRef = useRef<{ id: string; stepId: string } | null>(null)

  // Save preferences
  const savePreferences = useCallback((newPrefs: Partial<CheckInPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)
    localStorage.setItem(CHECK_IN_KEY, JSON.stringify(updated))
  }, [preferences])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '⏱',
        requireInteraction: true,
      })
    }
  }, [])

  // Start check-in timer
  const startCheckInTimer = useCallback(() => {
    if (!preferences.enabled || !runningTimerRef.current) return

    // Clear any existing timeout and interval
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current)
      checkInTimeoutRef.current = null
    }
    if (awayIntervalRef.current) {
      clearInterval(awayIntervalRef.current)
      awayIntervalRef.current = null
    }

    const intervalMs = preferences.intervalMinutes * 60 * 1000

    checkInTimeoutRef.current = setTimeout(() => {
      // Time for check-in - pause the timer
      if (runningTimerRef.current) {
        const { id, stepId } = runningTimerRef.current
        stopTimerById(id, stepId).then(() => {
          setCheckInState({
            isCheckInPending: true,
            awaySeconds: 0,
            lastCheckInAt: Date.now(),
          })

          // Show notification
          showNotification(
            'Timer Paused - Check In',
            `Still working? Timer has been paused. Click to resume.`
          )

          // Start tracking away time
          if (awayIntervalRef.current) clearInterval(awayIntervalRef.current)
          awayIntervalRef.current = setInterval(() => {
            setCheckInState((prev) => ({
              ...prev,
              awaySeconds: prev.awaySeconds + 1,
            }))
          }, 1000)
        })
      }
    }, intervalMs)
  }, [preferences.enabled, preferences.intervalMinutes, stopTimerById, showNotification])

  // Resume timer after check-in
  const resumeTimer = useCallback(async () => {
    if (!runningTimerRef.current || !checkInState.isCheckInPending) return

    const { id, stepId } = runningTimerRef.current

    // Clear away time tracking
    if (awayIntervalRef.current) {
      clearInterval(awayIntervalRef.current)
      awayIntervalRef.current = null
    }

    setCheckInState({
      isCheckInPending: false,
      awaySeconds: 0,
      lastCheckInAt: null,
    })

    // Restart the timer
    await startTimerById(id, stepId)

    // Restart check-in timer
    timerStartTimeRef.current = Date.now()
    startCheckInTimer()
  }, [checkInState.isCheckInPending, startTimerById, startCheckInTimer])

  // Skip check-in and stay paused
  const skipCheckIn = useCallback(() => {
    // Clear away time tracking
    if (awayIntervalRef.current) {
      clearInterval(awayIntervalRef.current)
      awayIntervalRef.current = null
    }

    setCheckInState({
      isCheckInPending: false,
      awaySeconds: 0,
      lastCheckInAt: null,
    })

    runningTimerRef.current = null
    timerStartTimeRef.current = null
  }, [])

  // Monitor running timer changes - only depend on runningTimerId
  useEffect(() => {
    if (!runningTimerId) {
      // No timer running - clear everything
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current)
        checkInTimeoutRef.current = null
      }
      if (awayIntervalRef.current) {
        clearInterval(awayIntervalRef.current)
        awayIntervalRef.current = null
      }
      timerStartTimeRef.current = null
      runningTimerRef.current = null
      return
    }

    // New timer started - use getTimerStore().getState() to avoid dependency on timers Map
    if (runningTimerRef.current?.id !== runningTimerId) {
      // Find the timer directly from store to avoid timers Map dependency
      let foundTimer: { id: string; stepId: string } | null = null
      const currentTimers = useTimerStore.getState().timers
      
      for (const [stepId, stepTimers] of currentTimers) {
        const timer = stepTimers.find((t) => t.id === runningTimerId && t.isRunning)
        if (timer) {
          foundTimer = { id: timer.id, stepId }
          break
        }
      }

      if (foundTimer) {
        runningTimerRef.current = foundTimer
        timerStartTimeRef.current = Date.now()

        // Request notification permission on first timer start
        requestNotificationPermission()

        // Start check-in timer
        startCheckInTimer()
      }
    }
  }, [runningTimerId, startCheckInTimer, requestNotificationPermission])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkInTimeoutRef.current) clearTimeout(checkInTimeoutRef.current)
      if (awayIntervalRef.current) clearInterval(awayIntervalRef.current)
    }
  }, [])

  // Format away time for display - useMemo to prevent recalculation on every render
  const formattedAwayTime = useMemo(() => {
    const seconds = checkInState.awaySeconds
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }, [checkInState.awaySeconds])

  return {
    preferences,
    savePreferences,
    isCheckInPending: checkInState.isCheckInPending,
    awaySeconds: checkInState.awaySeconds,
    formattedAwayTime,
    resumeTimer,
    skipCheckIn,
    requestNotificationPermission,
  }
}