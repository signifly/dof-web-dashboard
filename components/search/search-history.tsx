"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  History,
  Clock,
  Search,
  Trash2,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  Calendar,
  Filter,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchQuery } from "@/lib/services/search-service"

interface SearchHistoryEntry {
  id: string
  query: SearchQuery
  timestamp: Date
  resultsCount: number
  executionTime: number
  searchSummary: string
}

interface SearchHistoryProps {
  currentQuery: SearchQuery
  onLoadHistory: (query: SearchQuery) => void
  onNewSearch?: (
    query: SearchQuery,
    resultsCount: number,
    executionTime: number
  ) => void
  className?: string
  trigger?: React.ReactNode
  triggerAsChild?: boolean
  maxEntries?: number
  showAsPopover?: boolean
}

const MAX_HISTORY_ENTRIES = 20
const RECENT_SEARCHES_KEY = "recent-searches"
const SEARCH_FREQUENCY_KEY = "search-frequency"

export function SearchHistory({
  currentQuery,
  onLoadHistory,
  onNewSearch,
  className,
  trigger,
  triggerAsChild = false,
  maxEntries = MAX_HISTORY_ENTRIES,
  showAsPopover = false,
}: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])
  const [searchFrequency, setSearchFrequency] = useState<Map<string, number>>(
    new Map()
  )

  // Load history from localStorage on mount
  useEffect(() => {
    loadHistory()
    loadSearchFrequency()
  }, [])

  // Save new search to history when onNewSearch is called
  useEffect(() => {
    if (onNewSearch) {
      const originalOnNewSearch = onNewSearch
      onNewSearch = (
        query: SearchQuery,
        resultsCount: number,
        executionTime: number
      ) => {
        addToHistory(query, resultsCount, executionTime)
        originalOnNewSearch(query, resultsCount, executionTime)
      }
    }
  }, [onNewSearch])

  // Load history from localStorage
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const parsedHistory = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }))
        setHistory(parsedHistory)
      }
    } catch (error) {
      console.error("Error loading search history:", error)
      setHistory([])
    }
  }

  // Load search frequency data
  const loadSearchFrequency = () => {
    try {
      const stored = localStorage.getItem(SEARCH_FREQUENCY_KEY)
      if (stored) {
        const parsedFrequency = new Map(JSON.parse(stored))
        setSearchFrequency(parsedFrequency)
      }
    } catch (error) {
      console.error("Error loading search frequency:", error)
      setSearchFrequency(new Map())
    }
  }

  // Save history to localStorage
  const saveHistory = (newHistory: SearchHistoryEntry[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error("Error saving search history:", error)
    }
  }

  // Save search frequency to localStorage
  const saveSearchFrequency = (frequency: Map<string, number>) => {
    try {
      localStorage.setItem(
        SEARCH_FREQUENCY_KEY,
        JSON.stringify(Array.from(frequency.entries()))
      )
      setSearchFrequency(frequency)
    } catch (error) {
      console.error("Error saving search frequency:", error)
    }
  }

  // Generate search summary for display
  const generateSearchSummary = (query: SearchQuery): string => {
    const parts: string[] = []

    if (query.text) parts.push(`"${query.text}"`)
    if (query.devices?.length) parts.push(`${query.devices.length} devices`)
    if (query.platforms?.length) parts.push(`${query.platforms.join(", ")}`)
    if (query.appVersions?.length)
      parts.push(`v${query.appVersions.join(", v")}`)
    if (query.metricTypes?.length) parts.push(`${query.metricTypes.join(", ")}`)
    if (query.dateRange) {
      const days = Math.ceil(
        (query.dateRange.end.getTime() - query.dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      parts.push(`${days} days`)
    }

    return parts.length ? parts.join(" • ") : "All data"
  }

  // Add search to history
  const addToHistory = (
    query: SearchQuery,
    resultsCount: number,
    executionTime: number
  ) => {
    const summary = generateSearchSummary(query)
    const queryKey = JSON.stringify(query)

    // Update search frequency
    const newFrequency = new Map(searchFrequency)
    newFrequency.set(queryKey, (newFrequency.get(queryKey) || 0) + 1)
    saveSearchFrequency(newFrequency)

    // Check if this search already exists (avoid duplicates of identical searches)
    const existingIndex = history.findIndex(
      entry => JSON.stringify(entry.query) === queryKey
    )

    let newHistory: SearchHistoryEntry[]

    if (existingIndex >= 0) {
      // Update existing entry (move to top, update results)
      const existingEntry = { ...history[existingIndex] }
      existingEntry.timestamp = new Date()
      existingEntry.resultsCount = resultsCount
      existingEntry.executionTime = executionTime

      newHistory = [
        existingEntry,
        ...history.filter((_, index) => index !== existingIndex),
      ]
    } else {
      // Create new entry
      const newEntry: SearchHistoryEntry = {
        id: crypto.randomUUID(),
        query,
        timestamp: new Date(),
        resultsCount,
        executionTime,
        searchSummary: summary,
      }

      newHistory = [newEntry, ...history]
    }

    // Limit to max entries
    if (newHistory.length > maxEntries) {
      newHistory = newHistory.slice(0, maxEntries)
    }

    saveHistory(newHistory)
  }

  // Public method to add search (for external use)
  const addSearch = (
    query: SearchQuery,
    resultsCount: number,
    executionTime: number
  ) => {
    addToHistory(query, resultsCount, executionTime)
  }

  // Load a search from history
  const loadSearch = (entry: SearchHistoryEntry) => {
    // Update frequency
    const queryKey = JSON.stringify(entry.query)
    const newFrequency = new Map(searchFrequency)
    newFrequency.set(queryKey, (newFrequency.get(queryKey) || 0) + 1)
    saveSearchFrequency(newFrequency)

    onLoadHistory(entry.query)
  }

  // Clear all history
  const clearHistory = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setHistory([])
  }

  // Remove specific entry
  const removeEntry = (entryId: string) => {
    const newHistory = history.filter(entry => entry.id !== entryId)
    saveHistory(newHistory)
  }

  // Get popular searches (by frequency)
  const getPopularSearches = (): SearchHistoryEntry[] => {
    return history
      .slice()
      .sort((a, b) => {
        const aFreq = searchFrequency.get(JSON.stringify(a.query)) || 0
        const bFreq = searchFrequency.get(JSON.stringify(b.query)) || 0
        return bFreq - aFreq
      })
      .slice(0, 5)
  }

  // Get recent searches (last 7 days)
  const getRecentSearches = (): SearchHistoryEntry[] => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return history.filter(entry => entry.timestamp >= sevenDaysAgo)
  }

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <History className="h-4 w-4 mr-2" />
      History ({history.length})
    </Button>
  )

  const content = (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">Search History</h3>
          <p className="text-sm text-muted-foreground">
            Quick access to your recent searches
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No search history yet</p>
              <p className="text-sm">Your recent searches will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Popular Searches */}
          {getPopularSearches().length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Popular Searches</h4>
              </div>
              <div className="space-y-2">
                {getPopularSearches()
                  .slice(0, 3)
                  .map(entry => {
                    const frequency =
                      searchFrequency.get(JSON.stringify(entry.query)) || 0
                    return (
                      <Card
                        key={`popular-${entry.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <CardContent
                          className="p-3"
                          onClick={() => loadSearch(entry)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">
                                {entry.searchSummary}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  Used {frequency} times
                                </Badge>
                                <span>
                                  {entry.resultsCount.toLocaleString()} results
                                </span>
                                <span>{entry.executionTime}ms</span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )}

          <Separator />

          {/* Recent Searches */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Recent Searches</h4>
            </div>
            <div className="space-y-2">
              {history.slice(0, 10).map(entry => (
                <Card key={entry.id} className="group relative">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => loadSearch(entry)}
                      >
                        <p className="text-sm font-medium mb-1">
                          {entry.searchSummary}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            {entry.resultsCount.toLocaleString()}
                          </span>
                          <span>{entry.executionTime}ms</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSearch(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntry(entry.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Expose addSearch method for external use
  React.useImperativeHandle(
    React.useRef(),
    () => ({
      addSearch,
    }),
    [addSearch]
  )

  if (showAsPopover) {
    return (
      <div className={className}>
        <Popover>
          <PopoverTrigger asChild={triggerAsChild}>
            {trigger || defaultTrigger}
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-96 overflow-y-auto">
            {content}
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger asChild={triggerAsChild}>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent className="w-full max-w-md sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Search History
            </SheetTitle>
            <SheetDescription>
              Access your recent searches and popular queries
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Hook for using search history in other components
export function useSearchHistory(maxEntries: number = MAX_HISTORY_ENTRIES) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])

  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (stored) {
          const parsedHistory = JSON.parse(stored).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }))
          setHistory(parsedHistory)
        }
      } catch (error) {
        console.error("Error loading search history:", error)
        setHistory([])
      }
    }

    loadHistory()
  }, [])

  const addSearch = (
    query: SearchQuery,
    resultsCount: number,
    executionTime: number
  ) => {
    const summary = generateSearchSummary(query)
    const queryKey = JSON.stringify(query)

    // Check for duplicates
    const existingIndex = history.findIndex(
      entry => JSON.stringify(entry.query) === queryKey
    )

    let newHistory: SearchHistoryEntry[]

    if (existingIndex >= 0) {
      const existingEntry = { ...history[existingIndex] }
      existingEntry.timestamp = new Date()
      existingEntry.resultsCount = resultsCount
      existingEntry.executionTime = executionTime

      newHistory = [
        existingEntry,
        ...history.filter((_, index) => index !== existingIndex),
      ]
    } else {
      const newEntry: SearchHistoryEntry = {
        id: crypto.randomUUID(),
        query,
        timestamp: new Date(),
        resultsCount,
        executionTime,
        searchSummary: summary,
      }

      newHistory = [newEntry, ...history]
    }

    if (newHistory.length > maxEntries) {
      newHistory = newHistory.slice(0, maxEntries)
    }

    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error("Error saving search history:", error)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
    setHistory([])
  }

  return {
    history,
    addSearch,
    clearHistory,
  }
}

// Helper function to generate search summary (exported for reuse)
export function generateSearchSummary(query: SearchQuery): string {
  const parts: string[] = []

  if (query.text) parts.push(`"${query.text}"`)
  if (query.devices?.length) parts.push(`${query.devices.length} devices`)
  if (query.platforms?.length) parts.push(`${query.platforms.join(", ")}`)
  if (query.appVersions?.length) parts.push(`v${query.appVersions.join(", v")}`)
  if (query.metricTypes?.length) parts.push(`${query.metricTypes.join(", ")}`)
  if (query.dateRange) {
    const days = Math.ceil(
      (query.dateRange.end.getTime() - query.dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    parts.push(`${days} days`)
  }

  return parts.length ? parts.join(" • ") : "All data"
}
