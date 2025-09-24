"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Custom Collapsible implementation since it's not available
import { MultiSelect } from "@/components/ui/multi-select"
import { DateRangePicker } from "./date-range-picker"
import { DeviceSelector } from "./device-selector"
import { MetricsRangeFilter, MetricsRange } from "./metrics-range-filter"
import {
  SearchQuery,
  SearchResults,
  searchService,
} from "@/lib/services/search-service"
import { SearchQueryBuilder } from "@/lib/utils/search-query-builder"

// Add Collapsible component if not already available
const CollapsibleComponent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleToggle = React.useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }, [isOpen, onOpenChange])

  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { onClick: handleToggle })
          }
          if (child.type === CollapsibleContent) {
            return isOpen ? child : null
          }
        }
        return child
      })}
    </div>
  )
})

CollapsibleComponent.displayName = "CollapsibleComponent"

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between text-left",
      className
    )}
    {...props}
  >
    {children}
  </button>
))

const CollapsibleContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4", className)} {...props}>
    {children}
  </div>
))

// Update imports to use our custom components
const Collapsible = CollapsibleComponent
Collapsible.displayName = "Collapsible"
CollapsibleTrigger.displayName = "CollapsibleTrigger"
CollapsibleContent.displayName = "CollapsibleContent"

// Form validation schema
const searchFormSchema = z.object({
  text: z.string().optional(),
  devices: z.array(z.string()).optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
  metrics: z
    .object({
      fps: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      cpu: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      memory: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      loadTime: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
    })
    .optional(),
  platforms: z.array(z.string()).optional(),
  appVersions: z.array(z.string()).optional(),
  metricTypes: z.array(z.string()).optional(),
  sortBy: z.enum(["timestamp", "metric_value", "created_at"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface AdvancedSearchFormProps {
  onSearch: (query: SearchQuery, results: SearchResults) => void
  initialQuery?: Partial<SearchQuery>
  className?: string
  autoSearch?: boolean
  showPreview?: boolean
}

export function AdvancedSearchForm({
  onSearch,
  initialQuery = {},
  className,
  autoSearch = false,
  showPreview = true,
}: AdvancedSearchFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchPreview, setSearchPreview] = React.useState<string>("")
  const [filterOptions, setFilterOptions] = React.useState({
    platforms: [] as string[],
    appVersions: [] as string[],
    metricTypes: [] as string[],
  })

  // Initialize form with default values
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      text: initialQuery.text || "",
      devices: initialQuery.devices || [],
      platforms: initialQuery.platforms || [],
      appVersions: initialQuery.appVersions || [],
      metricTypes: initialQuery.metricTypes || [],
      sortBy: initialQuery.sortBy || "timestamp",
      sortOrder: initialQuery.sortOrder || "desc",
      dateRange: initialQuery.dateRange
        ? {
            from: initialQuery.dateRange.start,
            to: initialQuery.dateRange.end,
          }
        : undefined,
      metrics: initialQuery.metrics || {},
    },
  })

  const watchedValues = form.watch()

  // Define all callback functions first
  const buildSearchQuery = React.useCallback(
    (values: SearchFormValues): SearchQuery => {
      const query: SearchQuery = {}

      if (values.text?.trim()) query.text = values.text.trim()
      if (values.devices?.length) query.devices = values.devices
      if (values.platforms?.length) query.platforms = values.platforms
      if (values.appVersions?.length) query.appVersions = values.appVersions
      if (values.metricTypes?.length) query.metricTypes = values.metricTypes

      if (values.dateRange?.from && values.dateRange?.to) {
        query.dateRange = {
          start: values.dateRange.from,
          end: values.dateRange.to,
        }
      }

      if (values.metrics && Object.keys(values.metrics).length > 0) {
        query.metrics = values.metrics as MetricsRange
      }

      if (values.sortBy) query.sortBy = values.sortBy
      if (values.sortOrder) query.sortOrder = values.sortOrder

      return query
    },
    []
  )

  const updateSearchPreview = React.useCallback((query: SearchQuery) => {
    const parts: string[] = []

    if (query.text) parts.push(`"${query.text}"`)
    if (query.devices?.length) parts.push(`${query.devices.length} devices`)
    if (query.platforms?.length)
      parts.push(`${query.platforms.join(", ")} platforms`)
    if (query.appVersions?.length)
      parts.push(`versions: ${query.appVersions.join(", ")}`)
    if (query.metricTypes?.length)
      parts.push(`metrics: ${query.metricTypes.join(", ")}`)
    if (query.dateRange) {
      const days = Math.ceil(
        (query.dateRange.end.getTime() - query.dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      parts.push(`${days} days`)
    }
    if (query.metrics) {
      Object.entries(query.metrics).forEach(([metric, range]) => {
        if (range.min !== undefined || range.max !== undefined) {
          parts.push(`${metric} range`)
        }
      })
    }

    setSearchPreview(parts.length ? parts.join(", ") : "All performance data")
  }, [])

  const handleSearch = React.useCallback(
    async (searchQuery?: SearchQuery) => {
      const query = searchQuery || buildSearchQuery(form.getValues())

      // Validate query
      const validation = SearchQueryBuilder.validateQuery(query)
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          form.setError("root", { message: error })
        })
        return
      }

      try {
        setIsSearching(true)
        const results = await searchService.search(query)
        onSearch(query, results)
      } catch (error) {
        console.error("Search error:", error)
        form.setError("root", {
          message: "Search failed. Please try again.",
        })
      } finally {
        setIsSearching(false)
      }
    },
    [onSearch, form]
  )

  // Load filter options on mount
  React.useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await searchService.getFilterOptions()
        setFilterOptions({
          platforms: options.platforms,
          appVersions: options.appVersions,
          metricTypes: options.metricTypes,
        })
      } catch (error) {
        console.error("Error loading filter options:", error)
      }
    }

    loadFilterOptions()
  }, [])

  // Auto-search when enabled and form values change
  React.useEffect(() => {
    if (autoSearch && !isSearching) {
      const searchQuery = buildSearchQuery(watchedValues)
      updateSearchPreview(searchQuery)

      // Debounce auto-search
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [watchedValues, autoSearch, isSearching])

  // Update search preview
  React.useEffect(() => {
    if (showPreview) {
      const searchQuery = buildSearchQuery(watchedValues)
      updateSearchPreview(searchQuery)
    }
  }, [watchedValues, showPreview])

  const handleClearForm = () => {
    form.reset({
      text: "",
      devices: [],
      platforms: [],
      appVersions: [],
      metricTypes: [],
      dateRange: undefined,
      metrics: {},
      sortBy: "timestamp",
      sortOrder: "desc",
    })
  }

  const hasFilters = () => {
    const values = form.getValues()
    return !!(
      values.text?.trim() ||
      values.devices?.length ||
      values.platforms?.length ||
      values.appVersions?.length ||
      values.metricTypes?.length ||
      values.dateRange ||
      (values.metrics && Object.keys(values.metrics).length > 0)
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => handleSearch())}
          className="space-y-6"
        >
          {/* Search Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Advanced Search</h3>
              {hasFilters() && (
                <Badge variant="secondary">
                  {
                    Object.keys(form.getValues()).filter(key => {
                      const value =
                        form.getValues()[key as keyof SearchFormValues]
                      return Array.isArray(value)
                        ? value.length > 0
                        : Boolean(value)
                    }).length
                  }{" "}
                  filters
                </Badge>
              )}
            </div>
            {hasFilters() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearForm}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Basic Search */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Text</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Search metrics, devices, sessions..."
                      {...field}
                      disabled={isSearching}
                    />
                  </FormControl>
                  <FormDescription>
                    Search across metric types, device IDs, and session data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Search Preview */}
            {showPreview && searchPreview && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Search Preview:
                </div>
                <div className="text-sm">{searchPreview}</div>
              </div>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Advanced Filters</span>
              </div>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-6 pt-4">
              {/* Date Range */}
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Range</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        value={field.value as DateRange}
                        onChange={range => field.onChange(range)}
                        disabled={isSearching}
                      />
                    </FormControl>
                    <FormDescription>
                      Filter by performance data collection period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Device Selector */}
              <FormField
                control={form.control}
                name="devices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devices</FormLabel>
                    <FormControl>
                      <DeviceSelector
                        value={field.value}
                        onChange={devices => field.onChange(devices)}
                        disabled={isSearching}
                      />
                    </FormControl>
                    <FormDescription>
                      Select specific devices to analyze
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Platform & Version Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="platforms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platforms</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filterOptions.platforms.map(platform => ({
                            value: platform,
                            label: platform,
                          }))}
                          value={field.value || []}
                          onChange={platforms => field.onChange(platforms)}
                          placeholder="Select platforms..."
                          disabled={isSearching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appVersions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Versions</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={filterOptions.appVersions.map(version => ({
                            value: version,
                            label: `v${version}`,
                          }))}
                          value={field.value || []}
                          onChange={versions => field.onChange(versions)}
                          placeholder="Select versions..."
                          disabled={isSearching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Metric Types Filter */}
              <FormField
                control={form.control}
                name="metricTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric Types</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={filterOptions.metricTypes.map(type => ({
                          value: type,
                          label: type,
                        }))}
                        value={field.value || []}
                        onChange={types => field.onChange(types)}
                        placeholder="Select metric types..."
                        disabled={isSearching}
                      />
                    </FormControl>
                    <FormDescription>
                      Filter by specific performance metric types
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Metrics Range Filter */}
              <FormField
                control={form.control}
                name="metrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Thresholds</FormLabel>
                    <FormControl>
                      <MetricsRangeFilter
                        value={field.value as MetricsRange}
                        onChange={metrics => field.onChange(metrics)}
                        disabled={isSearching}
                      />
                    </FormControl>
                    <FormDescription>
                      Filter by performance metric ranges and thresholds
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sorting Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sortBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort By</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSearching}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="timestamp">Timestamp</SelectItem>
                            <SelectItem value="metric_value">
                              Metric Value
                            </SelectItem>
                            <SelectItem value="created_at">
                              Created Date
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSearching}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Newest First</SelectItem>
                            <SelectItem value="asc">Oldest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Form Errors */}
          {form.formState.errors.root && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {form.formState.errors.root.message}
              </span>
            </div>
          )}

          {/* Search Button */}
          {!autoSearch && (
            <Button type="submit" className="w-full" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Performance Data
                </>
              )}
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}
