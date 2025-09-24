"use client"

import * as React from "react"
import { Activity, Cpu, HardDrive, Timer } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface MetricsRange {
  fps?: { min?: number; max?: number }
  cpu?: { min?: number; max?: number }
  memory?: { min?: number; max?: number }
  loadTime?: { min?: number; max?: number }
}

interface MetricsRangeFilterProps {
  value?: MetricsRange
  onChange: (metrics: MetricsRange) => void
  className?: string
  disabled?: boolean
}

// Performance tier definitions
const PERFORMANCE_TIERS = {
  fps: {
    excellent: {
      min: 55,
      max: 120,
      label: "Excellent (55+ FPS)",
      color: "bg-green-500",
    },
    good: {
      min: 30,
      max: 54,
      label: "Good (30-54 FPS)",
      color: "bg-yellow-500",
    },
    poor: { min: 0, max: 29, label: "Poor (0-29 FPS)", color: "bg-red-500" },
  },
  memory: {
    excellent: {
      min: 0,
      max: 200,
      label: "Excellent (< 200MB)",
      color: "bg-green-500",
    },
    good: {
      min: 201,
      max: 500,
      label: "Good (200-500MB)",
      color: "bg-yellow-500",
    },
    poor: { min: 501, max: 2000, label: "Poor (> 500MB)", color: "bg-red-500" },
  },
  cpu: {
    excellent: {
      min: 0,
      max: 30,
      label: "Excellent (< 30%)",
      color: "bg-green-500",
    },
    good: { min: 31, max: 70, label: "Good (30-70%)", color: "bg-yellow-500" },
    poor: { min: 71, max: 100, label: "Poor (> 70%)", color: "bg-red-500" },
  },
  loadTime: {
    excellent: {
      min: 0,
      max: 1000,
      label: "Excellent (< 1s)",
      color: "bg-green-500",
    },
    good: {
      min: 1001,
      max: 3000,
      label: "Good (1-3s)",
      color: "bg-yellow-500",
    },
    poor: { min: 3001, max: 10000, label: "Poor (> 3s)", color: "bg-red-500" },
  },
}

// Metric configurations
const METRIC_CONFIGS = {
  fps: {
    label: "FPS",
    icon: Activity,
    unit: " fps",
    min: 0,
    max: 120,
    step: 1,
    defaultRange: [15, 60],
  },
  memory: {
    label: "Memory Usage",
    icon: HardDrive,
    unit: " MB",
    min: 0,
    max: 2000,
    step: 10,
    defaultRange: [100, 800],
  },
  cpu: {
    label: "CPU Usage",
    icon: Cpu,
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    defaultRange: [20, 80],
  },
  loadTime: {
    label: "Load Time",
    icon: Timer,
    unit: " ms",
    min: 0,
    max: 10000,
    step: 100,
    defaultRange: [500, 5000],
  },
} as const

type MetricType = keyof typeof METRIC_CONFIGS

export function MetricsRangeFilter({
  value = {},
  onChange,
  className,
  disabled = false,
}: MetricsRangeFilterProps) {
  const [activeTab, setActiveTab] = React.useState<string>("fps")

  const handleRangeChange = (
    metricType: MetricType,
    range: [number, number]
  ) => {
    const [min, max] = range
    const newValue = {
      ...value,
      [metricType]: { min, max },
    }
    onChange(newValue)
  }

  const handleMinMaxChange = (
    metricType: MetricType,
    type: "min" | "max",
    inputValue: string
  ) => {
    const numValue = parseFloat(inputValue) || undefined
    const currentRange = value[metricType] || {}

    const newRange = {
      ...currentRange,
      [type]: numValue,
    }

    const newValue = {
      ...value,
      [metricType]: newRange,
    }
    onChange(newValue)
  }

  const handleTierClick = (
    metricType: MetricType,
    tier: keyof (typeof PERFORMANCE_TIERS)[MetricType]
  ) => {
    const tierData = PERFORMANCE_TIERS[metricType][tier]
    handleRangeChange(metricType, [tierData.min, tierData.max])
  }

  const clearMetric = (metricType: MetricType) => {
    const newValue = { ...value }
    delete newValue[metricType]
    onChange(newValue)
  }

  const clearAll = () => {
    onChange({})
  }

  const hasAnyFilters = Object.keys(value).length > 0

  const renderMetricControl = (metricType: MetricType) => {
    const config = METRIC_CONFIGS[metricType]
    const Icon = config.icon
    const currentRange = value[metricType]
    const sliderValue = currentRange
      ? [currentRange.min || config.min, currentRange.max || config.max]
      : [...config.defaultRange]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <Label className="font-medium">{config.label}</Label>
          </div>
          {currentRange && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => clearMetric(metricType)}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Performance Tier Shortcuts */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERFORMANCE_TIERS[metricType]).map(
            ([tierKey, tier]) => (
              <Button
                key={tierKey}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleTierClick(metricType, tierKey as any)}
              >
                <div className={cn("w-2 h-2 rounded-full mr-2", tier.color)} />
                {tier.label}
              </Button>
            )
          )}
        </div>

        {/* Range Slider */}
        <div className="space-y-3">
          <Slider
            min={config.min}
            max={config.max}
            step={config.step}
            value={sliderValue}
            onValueChange={range =>
              handleRangeChange(metricType, range as [number, number])
            }
            disabled={disabled}
            className="w-full"
          />

          {/* Min/Max Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${metricType}-min`} className="text-xs">
                Minimum
              </Label>
              <div className="relative">
                <Input
                  id={`${metricType}-min`}
                  type="number"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={currentRange?.min ?? ""}
                  onChange={e =>
                    handleMinMaxChange(metricType, "min", e.target.value)
                  }
                  disabled={disabled}
                  className="pr-12"
                  placeholder="Min"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {config.unit}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${metricType}-max`} className="text-xs">
                Maximum
              </Label>
              <div className="relative">
                <Input
                  id={`${metricType}-max`}
                  type="number"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={currentRange?.max ?? ""}
                  onChange={e =>
                    handleMinMaxChange(metricType, "max", e.target.value)
                  }
                  disabled={disabled}
                  className="pr-12"
                  placeholder="Max"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {config.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Current Range Display */}
          {currentRange && (
            <div className="text-xs text-muted-foreground text-center">
              Range: {currentRange.min ?? config.min}
              {config.unit} - {currentRange.max ?? config.max}
              {config.unit}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Summary */}
      {hasAnyFilters && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-1">
            {Object.entries(value).map(([metricType, range]) => {
              const config = METRIC_CONFIGS[metricType as MetricType]
              return (
                <Badge key={metricType} variant="secondary">
                  {config.label}: {range.min ?? config.min}-
                  {range.max ?? config.max}
                  {config.unit}
                </Badge>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Metric Controls Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
            const Icon = config.icon
            const hasFilter = value[key as MetricType]

            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
                {hasFilter && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 w-4 p-0 text-[10px]"
                  >
                    •
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.keys(METRIC_CONFIGS).map(key => (
          <TabsContent key={key} value={key} className="mt-4">
            {renderMetricControl(key as MetricType)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
