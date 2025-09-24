"use client"

import * as React from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"

import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { searchService } from "@/lib/services/search-service"

interface DeviceInfo {
  deviceId: string
  platform?: string
  appVersion?: string
  sessionCount?: number
}

interface DeviceSelectorProps {
  value?: string[]
  onChange: (devices: string[]) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  maxItems?: number
}

// Platform icons mapping
const PLATFORM_ICONS = {
  ios: Smartphone,
  android: Smartphone,
  web: Monitor,
  tablet: Tablet,
} as const

const PLATFORM_FILTERS = [
  { value: "all", label: "All Platforms", icon: Monitor },
  { value: "ios", label: "iOS", icon: Smartphone },
  { value: "android", label: "Android", icon: Smartphone },
  { value: "web", label: "Web", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
]

export function DeviceSelector({
  value = [],
  onChange,
  className,
  disabled = false,
  placeholder = "Select devices...",
  maxItems = 10,
}: DeviceSelectorProps) {
  const [devices, setDevices] = React.useState<DeviceInfo[]>([])
  const [__platforms, setPlatforms] = React.useState<string[]>([])
  const [appVersions, setAppVersions] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedPlatformFilter, setSelectedPlatformFilter] =
    React.useState("all")
  const [selectedAppVersionFilter, setSelectedAppVersionFilter] =
    React.useState<string>("all")

  // Load filter options and device data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Get filter options from search service
        const filterOptions = await searchService.getFilterOptions()
        setPlatforms(filterOptions.platforms)
        setAppVersions(filterOptions.appVersions)

        // For demo purposes, we'll create mock device data
        // In a real implementation, this would come from the search service
        const mockDevices: DeviceInfo[] = [
          {
            deviceId: "device-001",
            platform: "ios",
            appVersion: "2.1.0",
            sessionCount: 45,
          },
          {
            deviceId: "device-002",
            platform: "android",
            appVersion: "2.1.0",
            sessionCount: 32,
          },
          {
            deviceId: "device-003",
            platform: "web",
            appVersion: "2.0.9",
            sessionCount: 28,
          },
          {
            deviceId: "device-004",
            platform: "ios",
            appVersion: "2.0.9",
            sessionCount: 67,
          },
          {
            deviceId: "device-005",
            platform: "android",
            appVersion: "2.1.1",
            sessionCount: 23,
          },
          {
            deviceId: "device-006",
            platform: "tablet",
            appVersion: "2.1.0",
            sessionCount: 15,
          },
          {
            deviceId: "device-007",
            platform: "web",
            appVersion: "2.1.1",
            sessionCount: 89,
          },
          {
            deviceId: "device-008",
            platform: "ios",
            appVersion: "2.1.1",
            sessionCount: 56,
          },
        ]

        setDevices(mockDevices)
      } catch (error) {
        console.error("Error loading device data:", error)
        setDevices([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter devices based on selected filters
  const filteredDevices = React.useMemo(() => {
    let filtered = devices

    // Filter by platform
    if (selectedPlatformFilter !== "all") {
      filtered = filtered.filter(
        device => device.platform === selectedPlatformFilter
      )
    }

    // Filter by app version
    if (selectedAppVersionFilter !== "all") {
      filtered = filtered.filter(
        device => device.appVersion === selectedAppVersionFilter
      )
    }

    return filtered
  }, [devices, selectedPlatformFilter, selectedAppVersionFilter])

  // Convert filtered devices to multi-select options
  const deviceOptions: MultiSelectOption[] = React.useMemo(() => {
    return filteredDevices.map(device => {
      const _PlatformIcon =
        PLATFORM_ICONS[device.platform as keyof typeof PLATFORM_ICONS] ||
        Monitor

      return {
        value: device.deviceId,
        label: `${device.deviceId} (${device.platform || "unknown"}) - ${device.sessionCount || 0} sessions`,
      }
    })
  }, [filteredDevices])

  const handleClearFilters = () => {
    setSelectedPlatformFilter("all")
    setSelectedAppVersionFilter("all")
  }

  const handlePlatformFilter = (platform: string) => {
    setSelectedPlatformFilter(platform)
  }

  if (loading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-10 bg-muted rounded-md"></div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filter by:</span>
          {selectedPlatformFilter !== "all" && (
            <Badge variant="secondary">
              {
                PLATFORM_FILTERS.find(f => f.value === selectedPlatformFilter)
                  ?.label
              }
            </Badge>
          )}
          {selectedAppVersionFilter !== "all" && (
            <Badge variant="secondary">v{selectedAppVersionFilter}</Badge>
          )}
          {(selectedPlatformFilter !== "all" ||
            selectedAppVersionFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Platform Filter */}
        <div className="flex flex-wrap gap-1">
          {PLATFORM_FILTERS.map(platform => {
            const Icon = platform.icon
            const isSelected = selectedPlatformFilter === platform.value

            return (
              <Button
                key={platform.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handlePlatformFilter(platform.value)}
              >
                <Icon className="mr-1 h-3 w-3" />
                {platform.label}
              </Button>
            )
          })}
        </div>

        {/* App Version Filter */}
        {appVersions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Button
              variant={
                selectedAppVersionFilter === "all" ? "default" : "outline"
              }
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedAppVersionFilter("all")}
            >
              All Versions
            </Button>
            {appVersions.slice(0, 5).map(version => {
              const isSelected = selectedAppVersionFilter === version

              return (
                <Button
                  key={version}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedAppVersionFilter(version)}
                >
                  v{version}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Device Multi-Select */}
      <MultiSelect
        options={deviceOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxItems={maxItems}
        searchable
      />

      {/* Selection Summary */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {value.length} device{value.length !== 1 ? "s" : ""} selected
          {maxItems && value.length >= maxItems && (
            <span className="text-amber-600 ml-1">(max reached)</span>
          )}
        </div>
      )}
    </div>
  )
}
