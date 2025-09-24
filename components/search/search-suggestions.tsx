"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Clock,
  TrendingUp,
  Activity,
  Smartphone,
  Layers,
  Hash,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchSuggestion, searchService } from "@/lib/services/search-service"

interface SearchSuggestionsProps {
  value: string
  onValueChange: (value: string) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  showRecentTerms?: boolean
  showPopularTerms?: boolean
  debounceMs?: number
  maxSuggestions?: number
}

interface RecentTerm {
  term: string
  timestamp: Date
  useCount: number
}

const SUGGESTION_ICONS = {
  metric_type: Activity,
  platform: Smartphone,
  app_version: Layers,
  device: Hash,
  screen: ChevronRight,
} as const

const RECENT_TERMS_KEY = "search-recent-terms"
const POPULAR_TERMS_KEY = "search-popular-terms"
const MAX_RECENT_TERMS = 10
const MAX_POPULAR_TERMS = 5

export function SearchSuggestions({
  value,
  onValueChange,
  onSuggestionSelect,
  placeholder = "Search metrics, devices, sessions...",
  className,
  disabled = false,
  autoFocus = false,
  showRecentTerms = true,
  showPopularTerms = true,
  debounceMs = 300,
  maxSuggestions = 8,
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentTerms, setRecentTerms] = useState<RecentTerm[]>([])
  const [popularTerms, setPopularTerms] = useState<RecentTerm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load saved terms on mount
  useEffect(() => {
    loadRecentTerms()
    loadPopularTerms()
  }, [])

  // Auto-focus input if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Debounced suggestion loading
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        loadSuggestions(value.trim())
      }, debounceMs)
    } else {
      setSuggestions([])
      setIsLoading(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, debounceMs])

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  // Load recent terms from localStorage
  const loadRecentTerms = () => {
    try {
      const stored = localStorage.getItem(RECENT_TERMS_KEY)
      if (stored) {
        const parsedTerms = JSON.parse(stored).map((term: any) => ({
          ...term,
          timestamp: new Date(term.timestamp),
        }))
        setRecentTerms(parsedTerms)
      }
    } catch (error) {
      console.error("Error loading recent terms:", error)
    }
  }

  // Load popular terms from localStorage
  const loadPopularTerms = () => {
    try {
      const stored = localStorage.getItem(POPULAR_TERMS_KEY)
      if (stored) {
        const parsedTerms = JSON.parse(stored).map((term: any) => ({
          ...term,
          timestamp: new Date(term.timestamp),
        }))
        setPopularTerms(parsedTerms)
      }
    } catch (error) {
      console.error("Error loading popular terms:", error)
    }
  }

  // Save recent terms to localStorage
  const saveRecentTerms = (terms: RecentTerm[]) => {
    try {
      localStorage.setItem(RECENT_TERMS_KEY, JSON.stringify(terms))
      setRecentTerms(terms)
    } catch (error) {
      console.error("Error saving recent terms:", error)
    }
  }

  // Save popular terms to localStorage
  const savePopularTerms = (terms: RecentTerm[]) => {
    try {
      localStorage.setItem(POPULAR_TERMS_KEY, JSON.stringify(terms))
      setPopularTerms(terms)
    } catch (error) {
      console.error("Error saving popular terms:", error)
    }
  }

  // Load suggestions from API
  const loadSuggestions = async (searchTerm: string) => {
    setIsLoading(true)
    try {
      const apiSuggestions = await searchService.getSuggestions(
        searchTerm,
        maxSuggestions
      )
      setSuggestions(apiSuggestions)
    } catch (error) {
      console.error("Error loading suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Add term to recent/popular tracking
  const addTermToHistory = useCallback(
    (term: string) => {
      // Update recent terms
      const existingRecentIndex = recentTerms.findIndex(
        t => t.term.toLowerCase() === term.toLowerCase()
      )
      let newRecentTerms: RecentTerm[]

      if (existingRecentIndex >= 0) {
        const existingTerm = { ...recentTerms[existingRecentIndex] }
        existingTerm.timestamp = new Date()
        existingTerm.useCount += 1

        newRecentTerms = [
          existingTerm,
          ...recentTerms.filter((_, index) => index !== existingRecentIndex),
        ]
      } else {
        const newTerm: RecentTerm = {
          term,
          timestamp: new Date(),
          useCount: 1,
        }
        newRecentTerms = [newTerm, ...recentTerms]
      }

      if (newRecentTerms.length > MAX_RECENT_TERMS) {
        newRecentTerms = newRecentTerms.slice(0, MAX_RECENT_TERMS)
      }

      saveRecentTerms(newRecentTerms)

      // Update popular terms
      const existingPopularIndex = popularTerms.findIndex(
        t => t.term.toLowerCase() === term.toLowerCase()
      )
      let newPopularTerms: RecentTerm[]

      if (existingPopularIndex >= 0) {
        const existingTerm = { ...popularTerms[existingPopularIndex] }
        existingTerm.useCount += 1
        existingTerm.timestamp = new Date()
        newPopularTerms = popularTerms.map((t, index) =>
          index === existingPopularIndex ? existingTerm : t
        )
      } else {
        const newTerm: RecentTerm = {
          term,
          timestamp: new Date(),
          useCount: 1,
        }
        newPopularTerms = [...popularTerms, newTerm]
      }

      // Sort by use count and limit
      newPopularTerms.sort((a, b) => b.useCount - a.useCount)
      if (newPopularTerms.length > MAX_POPULAR_TERMS) {
        newPopularTerms = newPopularTerms.slice(0, MAX_POPULAR_TERMS)
      }

      savePopularTerms(newPopularTerms)
    },
    [recentTerms, popularTerms]
  )

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onValueChange(suggestion.value)
    addTermToHistory(suggestion.value)
    onSuggestionSelect(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Handle recent/popular term selection
  const handleTermSelect = (term: string) => {
    onValueChange(term)
    addTermToHistory(term)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
        e.preventDefault()
        return
      }
      return
    }

    const totalItems = getTotalSelectableItems()

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break

      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
        break

      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          const item = getSelectableItem(selectedIndex)
          if (item) {
            if ("type" in item) {
              handleSuggestionSelect(item)
            } else {
              handleTermSelect(item.term)
            }
          }
        }
        break

      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Get total number of selectable items
  const getTotalSelectableItems = (): number => {
    let total = suggestions.length

    if (value.trim().length < 2) {
      if (showRecentTerms) total += recentTerms.length
      if (showPopularTerms) total += popularTerms.length
    }

    return total
  }

  // Get selectable item by index
  const getSelectableItem = (
    index: number
  ): SearchSuggestion | RecentTerm | null => {
    let currentIndex = 0

    // Check suggestions first
    if (index < suggestions.length) {
      return suggestions[index]
    }
    currentIndex += suggestions.length

    // Check recent terms (only if no search input)
    if (value.trim().length < 2 && showRecentTerms) {
      if (index < currentIndex + recentTerms.length) {
        return recentTerms[index - currentIndex]
      }
      currentIndex += recentTerms.length
    }

    // Check popular terms (only if no search input)
    if (value.trim().length < 2 && showPopularTerms) {
      if (index < currentIndex + popularTerms.length) {
        return popularTerms[index - currentIndex]
      }
    }

    return null
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    const Icon = SUGGESTION_ICONS[type]
    return Icon ? <Icon className="h-4 w-4" /> : <Search className="h-4 w-4" />
  }

  // Format relative time for recent terms
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      return "just now"
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return `${Math.floor(diffHours / 24)}d ago`
    }
  }

  const shouldShowEmptyState = value.trim().length < 2

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={e => {
                onValueChange(e.target.value)
                if (!isOpen && e.target.value.length > 0) {
                  setIsOpen(true)
                }
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="w-full pl-9 pr-4 py-2 text-sm border border-input bg-background rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div ref={suggestionsRef} className="max-h-80 overflow-y-auto">
            {/* Loading State */}
            {isLoading && value.trim().length >= 2 && (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Loading suggestions...
                  </p>
                </div>
              </div>
            )}

            {/* API Suggestions */}
            {!isLoading && suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground mb-1">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => {
                  const isSelected = selectedIndex === index
                  return (
                    <button
                      key={`suggestion-${suggestion.type}-${suggestion.value}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {suggestion.value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {suggestion.label}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Empty state when searching */}
            {!isLoading &&
              value.trim().length >= 2 &&
              suggestions.length === 0 && (
                <div className="flex items-center justify-center py-6">
                  <div className="text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No suggestions found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                </div>
              )}

            {/* Recent and Popular Terms (when not searching) */}
            {shouldShowEmptyState && (
              <div className="p-2">
                {/* Popular Terms */}
                {showPopularTerms && popularTerms.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      Popular Searches
                    </div>
                    {popularTerms.slice(0, 3).map((term, index) => {
                      const adjustedIndex = suggestions.length + index
                      const isSelected = selectedIndex === adjustedIndex
                      return (
                        <button
                          key={`popular-${term.term}`}
                          onClick={() => handleTermSelect(term.term)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                        >
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm">{term.term}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {term.useCount}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Separator */}
                {showPopularTerms &&
                  popularTerms.length > 0 &&
                  showRecentTerms &&
                  recentTerms.length > 0 && <Separator className="my-2" />}

                {/* Recent Terms */}
                {showRecentTerms && recentTerms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {recentTerms.slice(0, 5).map((term, index) => {
                      const adjustedIndex =
                        suggestions.length +
                        (showPopularTerms ? popularTerms.length : 0) +
                        index
                      const isSelected = selectedIndex === adjustedIndex
                      return (
                        <button
                          key={`recent-${term.term}`}
                          onClick={() => handleTermSelect(term.term)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm">{term.term}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(term.timestamp)}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Empty state */}
                {(!showRecentTerms || recentTerms.length === 0) &&
                  (!showPopularTerms || popularTerms.length === 0) && (
                    <div className="flex items-center justify-center py-6">
                      <div className="text-center text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start typing to search</p>
                        <p className="text-xs">
                          Your recent searches will appear here
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Hook for managing search suggestions state
export function useSearchSuggestions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchService.getSuggestions(term)
      setSuggestions(results)
    } catch (error) {
      console.error("Error loading suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    isLoading,
    loadSuggestions,
  }
}
