"use client"

import React, { useMemo, useCallback, useState, useRef, useEffect } from "react"
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, RotateCcw, Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react"

import { useChartZoom } from "@/hooks/use-chart-zoom"
import { useChartBrush } from "@/hooks/use-chart-brush"
import { useChartExport } from "@/hooks/use-chart-export"
import {
  chartColorSchemes,
  transformDataForChart,
} from "@/lib/utils/chart-helpers"

import type { MetricsTrend } from "@/lib/performance-data"

interface DatasetConfig {
  name: string
  data: MetricsTrend[]
  metric: "fps" | "memory_usage" | "cpu_usage" | "load_time"
  color: string
  visible?: boolean
  strokeWidth?: number
  fillOpacity?: number
}

interface MultiSeriesChartProps {
  datasets: DatasetConfig[]
  title: string
  height?: number
  chartType?: "line" | "area"
  enableBrush?: boolean
  enableZoom?: boolean
  enableExport?: boolean
  enableLegend?: boolean
  className?: string
  onBrush?: (
    selection: {
      startTime?: Date
      endTime?: Date
      startIndex?: number
      endIndex?: number
    } | null
  ) => void
  onZoom?: (zoomState: any) => void
  onDatasetToggle?: (datasetName: string, visible: boolean) => void
}

// Custom tooltip for multi-series
interface MultiSeriesTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  datasets: DatasetConfig[]
}

function MultiSeriesTooltip({
  active,
  payload,
  label,
  datasets,
}: MultiSeriesTooltipProps) {
  if (!active || !payload?.length) return null

  const timestamp = label ? new Date(label).toLocaleString() : ""

  return (
    <div className="bg-background border rounded-md shadow-md p-3 max-w-sm">
      <p className="font-medium text-sm mb-2">{timestamp}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const dataset = datasets.find(
            d => `${d.name}_${d.metric}` === entry.dataKey
          )
          if (!dataset) return null

          const getUnit = (metric: string) => {
            switch (metric) {
              case "memory_usage":
                return " MB"
              case "cpu_usage":
                return "%"
              case "load_time":
                return " ms"
              case "fps":
                return " FPS"
              default:
                return ""
            }
          }

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{dataset.name}</span>
              </div>
              <span className="font-medium text-sm">
                {entry.value?.toFixed(1)}
                {getUnit(dataset.metric)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Legend component for dataset visibility toggle
interface DatasetLegendProps {
  datasets: DatasetConfig[]
  onToggle: (datasetName: string, visible: boolean) => void
}

function DatasetLegend({ datasets, onToggle }: DatasetLegendProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {datasets.map(dataset => (
        <button
          key={dataset.name}
          onClick={() => onToggle(dataset.name, !dataset.visible)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all",
            "border hover:bg-muted",
            dataset.visible === false && "opacity-50"
          )}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: dataset.color }}
          />
          <span>{dataset.name}</span>
          {dataset.visible === false ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </button>
      ))}
    </div>
  )
}

export function MultiSeriesChart({
  datasets,
  title,
  height = 400,
  chartType = "line",
  enableBrush = true,
  enableZoom = true,
  enableExport = true,
  enableLegend = true,
  className,
  onBrush,
  onZoom,
  onDatasetToggle,
}: MultiSeriesChartProps) {
  const [datasetVisibility, setDatasetVisibility] = useState<
    Record<string, boolean>
  >(
    datasets.reduce(
      (acc, dataset) => {
        acc[dataset.name] = dataset.visible !== false
        return acc
      },
      {} as Record<string, boolean>
    )
  )

  // Track previous data for animation control
  const prevDataRef = useRef<string>("")
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Combine all datasets with proper time alignment
  const combinedData = useMemo(() => {
    const timeMap = new Map<number, any>()

    datasets.forEach(dataset => {
      if (!datasetVisibility[dataset.name]) return

      dataset.data.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime()
        const key = `${dataset.name}_${dataset.metric}`

        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {
            timestamp: point.timestamp,
            timestamp_number: timestamp,
            timestamp_formatted: format(new Date(point.timestamp), "HH:mm:ss"),
          })
        }

        timeMap.get(timestamp)![key] = point[dataset.metric]
      })
    })

    return Array.from(timeMap.values()).sort(
      (a, b) => a.timestamp_number - b.timestamp_number
    )
  }, [datasets, datasetVisibility])

  // Initialize hooks
  const { zoomState, zoomHandlers, getVisibleData } = useChartZoom({
    onZoomChange: onZoom,
  })

  const { brushState, brushHandlers } = useChartBrush({
    onSelectionChange: onBrush,
  })

  const { exportState, exportChart, exportData } = useChartExport({
    defaultFilename: `${title.toLowerCase().replace(/\s+/g, "-")}-multi-series`,
  })

  // Get visible data based on zoom state
  const visibleData = useMemo(() => {
    return getVisibleData(combinedData)
  }, [getVisibleData, combinedData])

  // Handle animation control with useEffect
  useEffect(() => {
    const currentDataString = JSON.stringify(visibleData)
    const hasDataChanged = currentDataString !== prevDataRef.current

    if (hasDataChanged && prevDataRef.current !== "") {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 750)

      prevDataRef.current = currentDataString

      return () => clearTimeout(timer)
    } else if (prevDataRef.current === "") {
      // First load, no animation
      prevDataRef.current = currentDataString
      setShouldAnimate(false)
    } else {
      setShouldAnimate(false)
    }
  }, [visibleData])

  // Handle dataset visibility toggle
  const handleDatasetToggle = useCallback(
    (datasetName: string, visible: boolean) => {
      setDatasetVisibility(prev => ({ ...prev, [datasetName]: visible }))
      onDatasetToggle?.(datasetName, visible)
    },
    [onDatasetToggle]
  )

  // Handle brush selection change
  const handleBrushChange = useCallback(
    (selection: any) => {
      if (!selection) {
        brushHandlers.onBrushClear()
        return
      }

      const { startIndex, endIndex } = selection
      const startTime = combinedData[startIndex]?.timestamp
        ? new Date(combinedData[startIndex].timestamp)
        : undefined
      const endTime = combinedData[endIndex]?.timestamp
        ? new Date(combinedData[endIndex].timestamp)
        : undefined

      if (startTime && endTime) {
        brushHandlers.onBrushChange({
          startIndex,
          endIndex,
          startTime,
          endTime,
        })
      }
    },
    [brushHandlers, combinedData]
  )

  // Export handlers
  const handleExport = useCallback(
    async (format: "png" | "svg" | "csv" | "json") => {
      if (format === "csv" || format === "json") {
        await exportData(combinedData, {
          format,
          filename: `${title}-multi-series`,
        })
      } else {
        const chartElement = document.querySelector(
          `[data-chart-id="${title}"]`
        )
        await exportChart(chartElement as HTMLElement, {
          format,
          filename: `${title}-multi-series`,
        })
      }
    },
    [exportChart, exportData, combinedData, title]
  )

  // Format timestamp for x-axis
  const formatXAxisTick = useCallback((tickItem: string) => {
    try {
      const date = parseISO(tickItem)
      return format(date, "HH:mm")
    } catch {
      return tickItem
    }
  }, [])

  // Get visible datasets
  const visibleDatasets = datasets.filter(
    dataset => datasetVisibility[dataset.name]
  )

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: visibleData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    const ChartComponent = chartType === "area" ? AreaChart : LineChart

    return (
      <ChartComponent {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxisTick}
          stroke="currentColor"
          className="text-muted-foreground"
        />
        <YAxis stroke="currentColor" className="text-muted-foreground" />
        <Tooltip content={<MultiSeriesTooltip datasets={visibleDatasets} />} />
        {enableLegend && <Legend />}

        {visibleDatasets.map(dataset => {
          const dataKey = `${dataset.name}_${dataset.metric}`

          if (chartType === "area") {
            return (
              <Area
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={dataset.color}
                fill={dataset.color}
                fillOpacity={dataset.fillOpacity || 0.1}
                strokeWidth={dataset.strokeWidth || 2}
                name={`${dataset.name} (${dataset.metric})`}
                isAnimationActive={shouldAnimate}
                animationDuration={500}
              />
            )
          } else {
            return (
              <Line
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={dataset.color}
                strokeWidth={dataset.strokeWidth || 2}
                dot={false}
                activeDot={{ r: 4, fill: dataset.color }}
                name={`${dataset.name} (${dataset.metric})`}
                isAnimationActive={shouldAnimate}
                animationDuration={500}
              />
            )
          }
        })}

        {enableBrush && (
          <Brush
            dataKey="timestamp_formatted"
            height={30}
            stroke={visibleDatasets[0]?.color || "#3b82f6"}
            onChange={handleBrushChange}
          />
        )}
      </ChartComponent>
    )
  }

  if (!combinedData.length || visibleDatasets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            {visibleDatasets.length === 0
              ? "No datasets visible"
              : "No data available"}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-xs">
              {visibleDatasets.length} series
            </Badge>
          </CardTitle>
          {exportState.isExporting && (
            <span className="text-sm text-muted-foreground">Exporting...</span>
          )}
        </div>

        {/* Toolbar */}
        {(enableZoom || enableExport) && (
          <div className="flex items-center gap-2">
            {enableZoom && (
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomHandlers.onZoomIn}
                  disabled={exportState.isExporting}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomHandlers.onZoomOut}
                  disabled={exportState.isExporting}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomHandlers.onZoomReset}
                  disabled={!zoomState.isZoomed || exportState.isExporting}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {enableExport && (
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport("png")}
                  disabled={exportState.isExporting}
                  className="h-8 px-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PNG
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport("csv")}
                  disabled={exportState.isExporting}
                  className="h-8 px-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dataset Legend */}
        {enableLegend && (
          <DatasetLegend datasets={datasets} onToggle={handleDatasetToggle} />
        )}
      </CardHeader>

      <CardContent>
        <div
          data-chart-id={title}
          role="img"
          aria-label={`${title} - Multi-series chart with ${visibleDatasets.length} datasets. Interactive ${chartType} chart comparing ${visibleDatasets.map(d => d.name).join(", ")} performance over time`}
        >
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Data Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {visibleDatasets.map(dataset => {
            const values = dataset.data
              .map(d => d[dataset.metric])
              .filter(v => typeof v === "number")
            const avg =
              values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0
            const max = values.length > 0 ? Math.max(...values) : 0
            const min = values.length > 0 ? Math.min(...values) : 0

            const getUnit = (metric: string) => {
              switch (metric) {
                case "memory_usage":
                  return "MB"
                case "cpu_usage":
                  return "%"
                case "load_time":
                  return "ms"
                case "fps":
                  return "FPS"
                default:
                  return ""
              }
            }

            return (
              <div key={dataset.name} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dataset.color }}
                  />
                  <span className="font-medium">{dataset.name}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Avg:</span>
                    <span>
                      {avg.toFixed(1)} {getUnit(dataset.metric)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span>
                      {min.toFixed(1)} {getUnit(dataset.metric)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span>
                      {max.toFixed(1)} {getUnit(dataset.metric)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
