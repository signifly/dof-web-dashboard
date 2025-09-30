"use client"

import { useState, useCallback, useMemo } from "react"

export interface BrushSelection {
  startIndex: number
  endIndex: number
  startTime?: Date | undefined
  endTime?: Date | undefined
}

export interface BrushState {
  selection: BrushSelection | null
  isActive: boolean
  isDragging: boolean
}

export interface BrushHandlers {
  onBrushStart: (startIndex: number, startTime?: Date) => void
  onBrushMove: (endIndex: number, endTime?: Date) => void
  onBrushEnd: () => void
  onBrushChange: (selection: BrushSelection | null) => void
  onBrushClear: () => void
}

export interface UseChartBrushProps {
  onSelectionChange?: ((selection: BrushSelection | null) => void) | undefined
  minSelectionSize?: number
  snapToDataPoints?: boolean
}

export interface UseChartBrushReturn {
  brushState: BrushState
  brushHandlers: BrushHandlers
  getSelectedData: <T>(data: T[]) => T[]
  isPointInSelection: (index: number) => boolean
}

/**
 * Custom hook for managing chart brush/selection functionality
 * Provides time-series brushing capabilities for zooming and filtering
 */
export function useChartBrush({
  onSelectionChange,
  minSelectionSize = 1,
  snapToDataPoints = true,
}: UseChartBrushProps = {}): UseChartBrushReturn {
  const [brushState, setBrushState] = useState<BrushState>({
    selection: null,
    isActive: false,
    isDragging: false,
  })

  // Notify parent component of selection changes
  const notifySelectionChange = useCallback(
    (selection: BrushSelection | null) => {
      onSelectionChange?.(selection)
    },
    [onSelectionChange]
  )

  // Start brush selection
  const onBrushStart = useCallback(
    (startIndex: number, startTime?: Date) => {
      const snappedIndex = snapToDataPoints
        ? Math.round(startIndex)
        : startIndex

      setBrushState(prev => ({
        ...prev,
        isActive: true,
        isDragging: true,
        selection: {
          startIndex: snappedIndex,
          endIndex: snappedIndex,
          startTime,
          endTime: startTime,
        },
      }))
    },
    [snapToDataPoints]
  )

  // Update brush selection during drag
  const onBrushMove = useCallback(
    (endIndex: number, endTime?: Date) => {
      setBrushState(prev => {
        if (!prev.selection || !prev.isDragging) return prev

        const snappedIndex = snapToDataPoints ? Math.round(endIndex) : endIndex

        // Ensure minimum selection size
        const startIndex = prev.selection.startIndex
        const actualEndIndex =
          Math.abs(snappedIndex - startIndex) >= minSelectionSize
            ? snappedIndex
            : startIndex +
              (snappedIndex >= startIndex
                ? minSelectionSize
                : -minSelectionSize)

        const selection: BrushSelection = {
          startIndex: Math.min(startIndex, actualEndIndex),
          endIndex: Math.max(startIndex, actualEndIndex),
          startTime: prev.selection.startTime,
          endTime,
        }

        return {
          ...prev,
          selection,
        }
      })
    },
    [snapToDataPoints, minSelectionSize]
  )

  // Complete brush selection
  const onBrushEnd = useCallback(() => {
    setBrushState(prev => {
      const newState = {
        ...prev,
        isDragging: false,
      }

      // Notify of final selection
      if (prev.selection) {
        notifySelectionChange(prev.selection)
      }

      return newState
    })
  }, [notifySelectionChange])

  // Update brush selection programmatically
  const onBrushChange = useCallback(
    (selection: BrushSelection | null) => {
      setBrushState(prev => ({
        ...prev,
        selection,
        isActive: selection !== null,
        isDragging: false,
      }))

      notifySelectionChange(selection)
    },
    [notifySelectionChange]
  )

  // Clear brush selection
  const onBrushClear = useCallback(() => {
    setBrushState({
      selection: null,
      isActive: false,
      isDragging: false,
    })

    notifySelectionChange(null)
  }, [notifySelectionChange])

  // Get data within brush selection
  const getSelectedData = useCallback(
    <T>(data: T[]): T[] => {
      if (!brushState.selection || !data.length) {
        return []
      }

      const { startIndex, endIndex } = brushState.selection
      const safeStartIndex = Math.max(0, Math.min(startIndex, data.length - 1))
      const safeEndIndex = Math.max(0, Math.min(endIndex, data.length - 1))

      return data.slice(safeStartIndex, safeEndIndex + 1)
    },
    [brushState.selection]
  )

  // Check if a point is within the current selection
  const isPointInSelection = useCallback(
    (index: number): boolean => {
      if (!brushState.selection) return false

      const { startIndex, endIndex } = brushState.selection
      return index >= startIndex && index <= endIndex
    },
    [brushState.selection]
  )

  // Calculate time range for the current selection
  const _selectedTimeRange = useMemo(() => {
    if (!brushState.selection) return null

    return {
      startTime: brushState.selection.startTime,
      endTime: brushState.selection.endTime,
      duration:
        brushState.selection.startTime && brushState.selection.endTime
          ? brushState.selection.endTime.getTime() -
            brushState.selection.startTime.getTime()
          : 0,
    }
  }, [brushState.selection])

  const brushHandlers: BrushHandlers = {
    onBrushStart,
    onBrushMove,
    onBrushEnd,
    onBrushChange,
    onBrushClear,
  }

  return {
    brushState,
    brushHandlers,
    getSelectedData,
    isPointInSelection,
  }
}
