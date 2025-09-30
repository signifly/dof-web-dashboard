"use client"

import { useState, useCallback, useMemo } from "react"

export interface ZoomState {
  startX: number | null
  endX: number | null
  isZoomed: boolean
  scale: number
}

export interface ZoomHandlers {
  onZoomStart: (start: number) => void
  onZoomEnd: (end: number) => void
  onZoomReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export interface UseChartZoomProps {
  initialZoom?: Partial<ZoomState>
  minScale?: number
  maxScale?: number
  scaleStep?: number
  onZoomChange?: ((zoomState: ZoomState) => void) | undefined
}

export interface UseChartZoomReturn {
  zoomState: ZoomState
  zoomHandlers: ZoomHandlers
  zoomDomain: {
    startIndex: number
    endIndex: number
  }
  getVisibleData: <T>(data: T[]) => T[]
}

/**
 * Custom hook for managing chart zoom and pan functionality
 * Provides zoom state management, handlers, and data filtering utilities
 */
export function useChartZoom({
  initialZoom = {},
  minScale = 0.1,
  maxScale = 10,
  scaleStep = 0.5,
  onZoomChange,
}: UseChartZoomProps = {}): UseChartZoomReturn {
  const [zoomState, setZoomState] = useState<ZoomState>({
    startX: null,
    endX: null,
    isZoomed: false,
    scale: 1,
    ...initialZoom,
  })

  // Notify parent component of zoom changes
  const notifyZoomChange = useCallback(
    (newState: ZoomState) => {
      onZoomChange?.(newState)
    },
    [onZoomChange]
  )

  // Start zoom selection
  const onZoomStart = useCallback((start: number) => {
    setZoomState(prev => ({
      ...prev,
      startX: start,
      endX: null,
    }))
  }, [])

  // Complete zoom selection
  const onZoomEnd = useCallback(
    (end: number) => {
      setZoomState(prev => {
        if (prev.startX === null) return prev

        const startX = Math.min(prev.startX, end)
        const endX = Math.max(prev.startX, end)

        const newState = {
          ...prev,
          startX,
          endX,
          isZoomed: true,
        }

        notifyZoomChange(newState)
        return newState
      })
    },
    [notifyZoomChange]
  )

  // Reset zoom to show all data
  const onZoomReset = useCallback(() => {
    const newState: ZoomState = {
      startX: null,
      endX: null,
      isZoomed: false,
      scale: 1,
    }

    setZoomState(newState)
    notifyZoomChange(newState)
  }, [notifyZoomChange])

  // Zoom in by scale step
  const onZoomIn = useCallback(() => {
    setZoomState(prev => {
      const newScale = Math.min(prev.scale + scaleStep, maxScale)
      const newState = {
        ...prev,
        scale: newScale,
        isZoomed: newScale > 1,
      }

      notifyZoomChange(newState)
      return newState
    })
  }, [scaleStep, maxScale, notifyZoomChange])

  // Zoom out by scale step
  const onZoomOut = useCallback(() => {
    setZoomState(prev => {
      const newScale = Math.max(prev.scale - scaleStep, minScale)
      const newState = {
        ...prev,
        scale: newScale,
        isZoomed: newScale > 1 || prev.startX !== null,
      }

      notifyZoomChange(newState)
      return newState
    })
  }, [scaleStep, minScale, notifyZoomChange])

  // Calculate zoom domain indices
  const zoomDomain = useMemo(() => {
    if (
      !zoomState.isZoomed ||
      zoomState.startX === null ||
      zoomState.endX === null
    ) {
      return {
        startIndex: 0,
        endIndex: -1, // -1 means no end limit (show all)
      }
    }

    return {
      startIndex: Math.floor(zoomState.startX),
      endIndex: Math.ceil(zoomState.endX),
    }
  }, [zoomState])

  // Filter data based on zoom state
  const getVisibleData = useCallback(
    <T>(data: T[]): T[] => {
      if (!data.length || !zoomState.isZoomed) {
        return data
      }

      const { startIndex, endIndex } = zoomDomain
      if (endIndex === -1) {
        return data.slice(startIndex)
      }

      return data.slice(startIndex, endIndex + 1)
    },
    [zoomState.isZoomed, zoomDomain]
  )

  const zoomHandlers: ZoomHandlers = {
    onZoomStart,
    onZoomEnd,
    onZoomReset,
    onZoomIn,
    onZoomOut,
  }

  return {
    zoomState,
    zoomHandlers,
    zoomDomain,
    getVisibleData,
  }
}
