"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseInteractionDetectorOptions {
  timeout?: number // milliseconds of inactivity before considering user inactive
  enabled?: boolean // whether to track user interactions
  events?: string[] // which events to listen for
}

interface UseInteractionDetectorReturn {
  isUserActive: boolean
  lastActivity: Date | null
  timeSinceLastActivity: number // milliseconds
}

const DEFAULT_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
  "focus",
  "blur",
]

export function useInteractionDetector({
  timeout = 5000, // 5 seconds default
  enabled = true,
  events = DEFAULT_EVENTS,
}: UseInteractionDetectorOptions = {}): UseInteractionDetectorReturn {
  const [isUserActive, setIsUserActive] = useState(true)
  const [lastActivity, setLastActivity] = useState<Date | null>(new Date())
  const [timeSinceLastActivity, setTimeSinceLastActivity] = useState(0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef(new Date())

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!enabled) return

    const now = new Date()
    lastActivityRef.current = now
    setLastActivity(now)
    setIsUserActive(true)
    setTimeSinceLastActivity(0)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to mark user as inactive
    timeoutRef.current = setTimeout(() => {
      setIsUserActive(false)
    }, timeout)
  }, [enabled, timeout])

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return

    if (document.visibilityState === "visible") {
      handleActivity()
    } else {
      // Page is hidden, mark as inactive
      setIsUserActive(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, handleActivity])

  // Update time since last activity
  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const lastActivityTime = lastActivityRef.current.getTime()
      const timeDiff = now - lastActivityTime
      setTimeSinceLastActivity(timeDiff)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled])

  // Setup event listeners
  useEffect(() => {
    if (!enabled) {
      setIsUserActive(false)
      return
    }

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initial activity
    handleActivity()

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      // Cleanup timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, events, handleActivity, handleVisibilityChange])

  return {
    isUserActive,
    lastActivity,
    timeSinceLastActivity,
  }
}
