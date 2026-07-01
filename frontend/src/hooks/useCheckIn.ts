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
  includeAwayTime: boolean
}

const defaultPreferences: CheckInPreferences = {
  enabled: true,
  intervalMinutes: 30,
  includeAwayTime: false,
}

export function useCheckIn(options: { manageTimers?: boolean } = {}) {
  const { manageTimers = true } = options
  const runningTimerId = useTimerStore((s) => s.runningTimerId)
  const stopTimerById = useTimerStore((s) => s.stopTimerById)
  const startTimerById = useTimerStore((s) => s.startTimerById)
  const updateTimerById = useTimerStore((s) => s.updateTimerById)

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
  const gracePeriodTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const awayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningTimerRef = useRef<{ id: string; stepId: string } | null>(null)
  const notificationRef = useRef<Notification | null>(null)
  
  const GRACE_PERIOD_MS = 2 * 60 * 1000 // 2 minutes

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

  // Ref to hold startCheckInTimer function - declared before use
  const startCheckInTimerRef = useRef<(() => void) | null>(null)
  
  // Handle notification click - restarts check-in timer
  const handleNotificationClick = useCallback(() => {
    // Cancel the grace period - user responded
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current)
      gracePeriodTimeoutRef.current = null
    }
    // Don't stop the timer - user responded in time
    setCheckInState({
      isCheckInPending: false,
      awaySeconds: 0,
      lastCheckInAt: null,
    })
    // Restart check-in timer for next interval
    startCheckInTimerRef.current?.()
  }, [])
  
  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Close any existing notification
      if (notificationRef.current) {
        notificationRef.current.close()
      }
      
      const notification = new Notification(title, {
        body,
        icon: '/favicon.svg',
        requireInteraction: true,
      })
      
      notificationRef.current = notification
      
      // Clicking notification focuses window and cancels grace period
      notification.onclick = () => {
        window.focus()
        notification.close()
        notificationRef.current = null
        handleNotificationClick()
      }
      
      return notification
    }
    return null
  }, [handleNotificationClick])

  // Start check-in timer
  const startCheckInTimer = useCallback(() => {
    if (!preferences.enabled || !runningTimerRef.current) return

    // Clear any existing timeout and interval
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current)
      checkInTimeoutRef.current = null
    }
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current)
      gracePeriodTimeoutRef.current = null
    }
    if (awayIntervalRef.current) {
      clearInterval(awayIntervalRef.current)
      awayIntervalRef.current = null
    }

    const intervalMs = preferences.intervalMinutes * 60 * 1000

    checkInTimeoutRef.current = setTimeout(() => {
      // Time for check-in - show notification but DON'T stop timer yet
      if (runningTimerRef.current) {
        const { id, stepId } = runningTimerRef.current
        
        // Show notification first - timer keeps running during grace period
        showNotification(
          'Check-in Required',
          `Still working? Timer will pause in 2 minutes if you don't respond.`
        )

        // Start grace period - timer continues running
        gracePeriodTimeoutRef.current = setTimeout(() => {
          // Grace period expired - show popup IMMEDIATELY, then stop timer
          setCheckInState({
            isCheckInPending: true,
            awaySeconds: 0,
            lastCheckInAt: Date.now(),
          })

          // Start tracking away time immediately
          if (awayIntervalRef.current) clearInterval(awayIntervalRef.current)
          awayIntervalRef.current = setInterval(() => {
            setCheckInState((prev) => ({
              ...prev,
              awaySeconds: prev.awaySeconds + 1,
            }))
          }, 1000)

          // Stop timer in background - popup already showing
          stopTimerById(id, stepId)
        }, GRACE_PERIOD_MS)
      }
    }, intervalMs)
  }, [preferences.enabled, preferences.intervalMinutes, stopTimerById, showNotification])

  // Store startCheckInTimer in ref so handleNotificationClick can access it
  startCheckInTimerRef.current = startCheckInTimer

  // Resume timer after check-in
  const resumeTimer = useCallback(async () => {
    if (!runningTimerRef.current || !checkInState.isCheckInPending) return

    // Capture timer info BEFORE any state changes that could clear the ref
    const timerToResume = runningTimerRef.current

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

    // Clear runningTimerRef so the useEffect sees the timer as "new" when it starts
    // and calls startCheckInTimer(). Otherwise the effect thinks this timer is already
    // handled and skips setting up the next check-in interval.
    runningTimerRef.current = null

    // Optionally add away time to the timer before resuming
    if (preferences.includeAwayTime && checkInState.awaySeconds > 0) {
      const { id, stepId } = timerToResume
      const timer = useTimerStore.getState().timers.get(stepId)?.find((t) => t.id === id)
      if (timer) {
        const newElapsed = timer.elapsedSeconds + checkInState.awaySeconds
        updateTimerById(id, stepId, { elapsedSeconds: newElapsed })
      }
    }

    // Restart the timer
    await startTimerById(timerToResume.id, timerToResume.stepId)

    // The useEffect will detect runningTimerId changed and call startCheckInTimer().
    // We also call it here as a fallback in case the effect hasn't run yet.
    timerStartTimeRef.current = Date.now()
    startCheckInTimer()
  }, [checkInState.isCheckInPending, checkInState.awaySeconds, startTimerById, startCheckInTimer, preferences.includeAwayTime, updateTimerById])

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
    if (!manageTimers) return
    if (!runningTimerId) {
      // No timer running - clear timeouts/intervals only
      // NEVER clear runningTimerRef here - we need it for check-in resume/skip
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current)
        checkInTimeoutRef.current = null
      }
      if (awayIntervalRef.current) {
        clearInterval(awayIntervalRef.current)
        awayIntervalRef.current = null
      }
      timerStartTimeRef.current = null
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
  }, [runningTimerId, startCheckInTimer, requestNotificationPermission, manageTimers])

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