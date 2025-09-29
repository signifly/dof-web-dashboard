"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { getFeedbackUsers, getFeedbackRoutes } from "@/lib/actions/feedback"
import { isSuccess } from "@/lib/utils/result"
import {
  Route,
  User,
  ImageIcon,
  Calendar as CalendarIcon,
  X,
  Filter,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface FeedbackFilters {
  userEmail: string
  route: string
  hasScreenshot: boolean | null
  dateRange: { start: string; end: string } | null
}

interface FeedbackFiltersProps {
  filters: FeedbackFilters
  onFiltersChange: (filters: FeedbackFilters) => void
  loading: boolean
}

// Predefined date range options
const DATE_RANGES = [
  {
    label: "Last 7 days",
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 30)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    label: "Last 90 days",
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 90)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
]

export function FeedbackFilters({
  filters,
  onFiltersChange,
  loading,
}: FeedbackFiltersProps) {
  const [users, setUsers] = useState<string[]>([])
  const [routes, setRoutes] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Autocomplete states
  const [userOpen, setUserOpen] = useState(false)
  const [routeOpen, setRouteOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [customDateOpen, setCustomDateOpen] = useState(false)

  // Custom date range state
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >()

  // Load filter options
  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const [usersResult, routesResult] = await Promise.all([
        getFeedbackUsers(),
        getFeedbackRoutes(),
      ])

      if (isSuccess(usersResult)) {
        setUsers(usersResult.data)
      } else {
        console.error("Failed to load users for filters:", usersResult.error)
      }

      if (isSuccess(routesResult)) {
        setRoutes(routesResult.data)
      } else {
        console.error("Failed to load routes for filters:", routesResult.error)
      }
    } catch (error) {
      console.error("Failed to load filter options:", error)
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Handle individual filter changes
  const handleUserEmailChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, userEmail: value })
    },
    [filters, onFiltersChange]
  )

  const handleRouteChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, route: value })
    },
    [filters, onFiltersChange]
  )

  const handleScreenshotChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({
        ...filters,
        hasScreenshot: checked ? true : null,
      })
    },
    [filters, onFiltersChange]
  )

  const handleDateRangeChange = useCallback(
    (range: { start: string; end: string } | null) => {
      onFiltersChange({ ...filters, dateRange: range })
    },
    [filters, onFiltersChange]
  )

  // Handle predefined date range selection
  const handlePredefinedDateRange = useCallback(
    (rangeConfig: (typeof DATE_RANGES)[0]) => {
      const range = rangeConfig.getValue()
      handleDateRangeChange(range)
      setDateOpen(false)
    },
    [handleDateRangeChange]
  )

  // Handle custom date range
  const handleCustomDateRange = useCallback(() => {
    if (customDateRange?.from && customDateRange?.to) {
      const range = {
        start: customDateRange.from.toISOString(),
        end: customDateRange.to.toISOString(),
      }
      handleDateRangeChange(range)
      setCustomDateOpen(false)
      setDateOpen(false)
    }
  }, [customDateRange, handleDateRangeChange])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      userEmail: "",
      route: "",
      hasScreenshot: null,
      dateRange: null,
    })
    setCustomDateRange(undefined)
  }, [onFiltersChange])

  // Check if any filters are active
  const hasActiveFilters = !!(
    filters.userEmail ||
    filters.route ||
    filters.hasScreenshot !== null ||
    filters.dateRange
  )

  const activeFilterCount = [
    filters.userEmail,
    filters.route,
    filters.hasScreenshot !== null,
    filters.dateRange,
  ].filter(Boolean).length

  // Format date range for display
  const formatDateRange = useCallback(
    (dateRange: { start: string; end: string }) => {
      try {
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        const startFormatted = start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
        const endFormatted = end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        return `${startFormatted} - ${endFormatted}`
      } catch {
        return "Invalid date range"
      }
    },
    []
  )

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* User Email Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-3 w-3" />
            User Email
          </Label>
          <Popover open={userOpen} onOpenChange={setUserOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={userOpen}
                className="w-full justify-between"
                disabled={loading}
              >
                {filters.userEmail || "All users..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>
                    {loadingOptions ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "No users found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        handleUserEmailChange("")
                        setUserOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.userEmail ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All users
                    </CommandItem>
                    {users.map(user => (
                      <CommandItem
                        key={user}
                        value={user}
                        onSelect={currentValue => {
                          handleUserEmailChange(
                            currentValue === filters.userEmail
                              ? ""
                              : currentValue
                          )
                          setUserOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.userEmail === user
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {user}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Route Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Route className="h-3 w-3" />
            Route
          </Label>
          <Popover open={routeOpen} onOpenChange={setRouteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={routeOpen}
                className="w-full justify-between"
                disabled={loading}
              >
                {filters.route || "All routes..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search routes..." />
                <CommandList>
                  <CommandEmpty>
                    {loadingOptions ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "No routes found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        handleRouteChange("")
                        setRouteOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.route ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All routes
                    </CommandItem>
                    {routes.map(route => (
                      <CommandItem
                        key={route}
                        value={route}
                        onSelect={currentValue => {
                          handleRouteChange(
                            currentValue === filters.route ? "" : currentValue
                          )
                          setRouteOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.route === route
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {route}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Screenshot Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-3 w-3" />
            Has Screenshot
          </Label>
          <div className="flex items-center space-x-2 h-10 px-3 py-2 border border-input bg-background rounded-md">
            <Switch
              id="screenshot-filter"
              checked={filters.hasScreenshot === true}
              onCheckedChange={handleScreenshotChange}
              disabled={loading}
            />
            <Label htmlFor="screenshot-filter" className="text-sm">
              {filters.hasScreenshot === true
                ? "With screenshots"
                : "All feedback"}
            </Label>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            Date Range
          </Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={loading}
              >
                {filters.dateRange
                  ? formatDateRange(filters.dateRange)
                  : "All time..."}
                <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                {DATE_RANGES.map((range, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handlePredefinedDateRange(range)}
                  >
                    {range.label}
                  </Button>
                ))}
                <div className="border-t pt-3">
                  <Popover
                    open={customDateOpen}
                    onOpenChange={setCustomDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        Custom Range...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="left">
                      <div className="p-3 space-y-3">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={customDateRange?.from || new Date()}
                          selected={customDateRange}
                          onSelect={setCustomDateRange}
                          numberOfMonths={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleCustomDateRange}
                            disabled={
                              !customDateRange?.from || !customDateRange?.to
                            }
                          >
                            Apply Range
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCustomDateOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters & Actions */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}{" "}
              active
            </span>
            <div className="flex gap-1">
              {filters.userEmail && (
                <Badge variant="secondary" className="text-xs">
                  User: {filters.userEmail}
                  <button
                    onClick={() => handleUserEmailChange("")}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
              {filters.route && (
                <Badge variant="secondary" className="text-xs">
                  Route: {filters.route}
                  <button
                    onClick={() => handleRouteChange("")}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
              {filters.hasScreenshot !== null && (
                <Badge variant="secondary" className="text-xs">
                  With screenshots
                  <button
                    onClick={() => handleScreenshotChange(false)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
              {filters.dateRange && (
                <Badge variant="secondary" className="text-xs">
                  {formatDateRange(filters.dateRange)}
                  <button
                    onClick={() => handleDateRangeChange(null)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
