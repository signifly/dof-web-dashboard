"use client"

import React, { useMemo, useRef, useCallback, useState, useEffect } from "react"
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  Line,
  Area,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react"

// Import our custom hooks and utilities
import { useChartZoom } from "@/hooks/use-chart-zoom"
import { useChartBrush } from "@/hooks/use-chart-brush"
import { useChartExport } from "@/hooks/use-chart-export"
import {
  transformDataForChart,
  calculateChartDomain,
  generatePerformanceAnnotations,
  getPerformanceColor,
  chartColorSchemes,
} from "@/lib/utils/chart-helpers"

// Import types
import type {
  InteractiveChartProps,
  ChartDataPoint,
  ChartAnnotation,
  BrushSelection,
  ZoomState,
  defaultChartConfig,
} from "@/types/chart"

// Chart toolbar component
interface ChartToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onExport: (format: "png" | "svg" | "csv" | "json") => void
  isZoomed: boolean
  isExporting: boolean
}

function ChartToolbar({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExport,
  isZoomed,
  isExporting,
}: ChartToolbarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1 border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={isExporting}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={isExporting}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetZoom}
          disabled={!isZoomed || isExporting}
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExport("png")}
          disabled={isExporting}
          className="h-8 px-2"
        >
          <Download className="h-4 w-4 mr-1" />
          PNG
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExport("svg")}
          disabled={isExporting}
          className="h-8 px-2"
        >
          <Download className="h-4 w-4 mr-1" />
          SVG
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExport("csv")}
          disabled={isExporting}
          className="h-8 px-2"
        >
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>
      </div>
    </div>
  )
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  metric: string
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload as ChartDataPoint

  return (
    <div className="bg-background border rounded-md shadow-md p-3 max-w-xs">
      <p className="font-medium text-sm mb-2">{data.timestamp_formatted}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {metric.replace("_", " ").toUpperCase()}:
          </span>
          <span className="font-medium text-sm">
            {payload[0].value?.toFixed(1)}
            {metric === "memory_usage" && " MB"}
            {metric === "cpu_usage" && "%"}
            {metric === "load_time" && " ms"}
            {metric === "fps" && " FPS"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Screen:</span>
          <span className="text-sm">{data.screen_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Performance:</span>
          <span
            className={cn(
              "text-sm font-medium",
              data.performance_tier === "Excellent" && "text-green-600",
              data.performance_tier === "Good" && "text-blue-600",
              data.performance_tier === "Fair" && "text-yellow-600",
              data.performance_tier === "Poor" && "text-red-600"
            )}
          >
            {data.performance_tier}
          </span>
        </div>
        {data.anomaly && (
          <div className="mt-2 p-2 bg-muted rounded-sm">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600">
                Anomaly Detected
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.anomaly.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Annotation marker component
interface AnnotationMarkerProps {
  annotation: ChartAnnotation
  x: number
  y: number
}

function AnnotationMarker({ annotation, x, y }: AnnotationMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getIcon = () => {
    switch (annotation.type) {
      case "error":
        return <XCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (annotation.type) {
      case "error":
        return "text-red-500"
      case "warning":
        return "text-yellow-500"
      case "success":
        return "text-green-500"
      default:
        return "text-blue-500"
    }
  }

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={8}
        fill="white"
        stroke="currentColor"
        strokeWidth={2}
        className={getColor()}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ cursor: "pointer" }}
      />
      <foreignObject x={x - 8} y={y - 8} width={16} height={16}>
        <div className={cn("flex items-center justify-center", getColor())}>
          {getIcon()}
        </div>
      </foreignObject>
      {showTooltip && (
        <foreignObject x={x + 15} y={y - 20} width={200} height={60}>
          <div className="bg-black text-white text-xs p-2 rounded shadow-lg">
            <div className="font-medium">{annotation.label}</div>
            {annotation.description && (
              <div className="mt-1 opacity-90">{annotation.description}</div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

/**
 * Interactive chart component with zoom, brush, and export capabilities
 */
export function InteractiveChart({
  data,
  metric,
  chartType,
  title,
  height = 400,
  width,
  enableBrush = true,
  enableZoom = true,
  enableExport = true,
  enableAnomalyDetection = true,
  annotations = [],
  maxDataPoints = 1000,
  onBrush,
  onZoom,
  onDrillDown,
  onExport,
  className,
  ariaLabel,
  ariaDescription,
  ...props
}: InteractiveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  })

  // Process and transform data
  const chartData = useMemo(() => {
    const limitedData = data.slice(-maxDataPoints)
    return transformDataForChart(limitedData, chartType, metric)
  }, [data, chartType, metric, maxDataPoints])

  // Calculate domain for better visualization
  const [minValue, maxValue] = useMemo(() => {
    return calculateChartDomain(chartData, metric)
  }, [chartData, metric])

  // Generate performance annotations
  const performanceAnnotations = useMemo(() => {
    if (!enableAnomalyDetection) return []
    return generatePerformanceAnnotations(data, metric)
  }, [data, metric, enableAnomalyDetection])

  // Combine user annotations with performance annotations
  const allAnnotations = useMemo(() => {
    return [...annotations, ...performanceAnnotations]
  }, [annotations, performanceAnnotations])

  // Initialize hooks
  const { zoomState, zoomHandlers, getVisibleData } = useChartZoom({
    onZoomChange: onZoom,
  })

  const { brushState, brushHandlers, getSelectedData } = useChartBrush({
    onSelectionChange: onBrush,
  })

  const { exportState, exportChart, exportData } = useChartExport({
    defaultFilename: `${title.toLowerCase().replace(/\s+/g, "-")}-${metric}`,
    onExportComplete: onExport,
  })

  // Get visible data based on zoom state
  const visibleData = useMemo(() => {
    return getVisibleData(chartData)
  }, [getVisibleData, chartData])

  // Handle brush selection change
  const handleBrushChange = useCallback(
    (selection: any) => {
      if (!selection) {
        brushHandlers.onBrushClear()
        return
      }

      const { startIndex, endIndex } = selection
      const startTime = chartData[startIndex]?.timestamp
        ? new Date(chartData[startIndex].timestamp)
        : undefined
      const endTime = chartData[endIndex]?.timestamp
        ? new Date(chartData[endIndex].timestamp)
        : undefined

      brushHandlers.onBrushChange({
        startIndex,
        endIndex,
        startTime,
        endTime,
      })
    },
    [brushHandlers, chartData]
  )

  // Handle data point click
  const handleDataPointClick = useCallback(
    (data: any) => {
      if (onDrillDown && data) {
        onDrillDown(data.payload)
      }
    },
    [onDrillDown]
  )

  // Export handlers
  const handleExport = useCallback(
    async (format: "png" | "svg" | "csv" | "json") => {
      if (format === "csv" || format === "json") {
        await exportData(chartData, { format, filename: `${title}-${metric}` })
      } else {
        await exportChart(chartRef.current, {
          format,
          filename: `${title}-${metric}`,
        })
      }
    },
    [exportChart, exportData, chartData, title, metric]
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

  // Format y-axis value
  const formatYAxisTick = useCallback(
    (value: number) => {
      if (metric === "memory_usage") return `${value.toFixed(0)}MB`
      if (metric === "cpu_usage") return `${value.toFixed(0)}%`
      if (metric === "load_time") return `${value.toFixed(0)}ms`
      if (metric === "fps") return `${value.toFixed(0)}`
      return value.toString()
    },
    [metric]
  )

  // Responsive container update
  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect()
        setContainerDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Render appropriate chart type
  const renderChart = () => {
    const commonProps = {
      data: visibleData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    const color = chartColorSchemes.primary[metric]

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient
                id={`gradient-${metric}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[minValue, maxValue]}
              tickFormatter={formatYAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${metric})`}
              onClick={handleDataPointClick}
              style={{ cursor: onDrillDown ? "pointer" : "default" }}
            />
            {enableBrush && (
              <Brush
                dataKey="timestamp_short"
                height={30}
                stroke={color}
                onChange={handleBrushChange}
              />
            )}
          </AreaChart>
        )

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, maxValue]}
              tickFormatter={formatYAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Bar
              dataKey="value"
              fill={color}
              onClick={handleDataPointClick}
              style={{ cursor: onDrillDown ? "pointer" : "default" }}
            />
            {enableBrush && (
              <Brush
                dataKey="timestamp_short"
                height={30}
                stroke={color}
                onChange={handleBrushChange}
              />
            )}
          </BarChart>
        )

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="index"
              type="number"
              domain={["dataMin", "dataMax"]}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              dataKey="value"
              type="number"
              domain={[minValue, maxValue]}
              tickFormatter={formatYAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Scatter
              data={visibleData}
              fill={color}
              onClick={handleDataPointClick}
              style={{ cursor: onDrillDown ? "pointer" : "default" }}
            />
          </ScatterChart>
        )

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[minValue, maxValue]}
              tickFormatter={formatYAxisTick}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: color }}
              onClick={handleDataPointClick}
              style={{ cursor: onDrillDown ? "pointer" : "default" }}
            />
            {enableBrush && (
              <Brush
                dataKey="timestamp_short"
                height={30}
                stroke={color}
                onChange={handleBrushChange}
              />
            )}
          </LineChart>
        )
    }
  }

  if (!chartData.length) {
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
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {exportState.isExporting && (
            <span className="text-sm text-muted-foreground">Exporting...</span>
          )}
        </CardTitle>
        {(enableZoom || enableExport) && (
          <ChartToolbar
            onZoomIn={zoomHandlers.onZoomIn}
            onZoomOut={zoomHandlers.onZoomOut}
            onResetZoom={zoomHandlers.onZoomReset}
            onExport={handleExport}
            isZoomed={zoomState.isZoomed}
            isExporting={exportState.isExporting}
          />
        )}
      </CardHeader>
      <CardContent>
        <div
          ref={chartRef}
          role="img"
          aria-label={
            ariaLabel ||
            `${title} - ${metric} chart. ${
              ariaDescription ||
              `Interactive ${chartType} chart showing ${metric} performance over time`
            }`
          }
        >
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {allAnnotations.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Annotations:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {allAnnotations.slice(0, 4).map((annotation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <div
                    className={cn(
                      "mt-0.5",
                      annotation.type === "error" && "text-red-500",
                      annotation.type === "warning" && "text-yellow-500",
                      annotation.type === "success" && "text-green-500",
                      annotation.type === "info" && "text-blue-500"
                    )}
                  >
                    {annotation.type === "error" && (
                      <XCircle className="h-3 w-3" />
                    )}
                    {annotation.type === "warning" && (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {annotation.type === "success" && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {annotation.type === "info" && <Info className="h-3 w-3" />}
                  </div>
                  <div>
                    <div className="font-medium">{annotation.label}</div>
                    {annotation.description && (
                      <div className="text-muted-foreground">
                        {annotation.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
