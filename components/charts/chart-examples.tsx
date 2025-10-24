"use client"

import React, { useState, useMemo } from "react"
import { addMinutes } from "date-fns"
import { InteractiveChart } from "./interactive-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { MetricsTrend } from "@/lib/performance-data"
import type { ChartType, ChartMetric, ChartAnnotation } from "@/types/chart"

// Generate sample data for testing
function generateSampleData(hours = 24, intervalMinutes = 5): MetricsTrend[] {
  const data: MetricsTrend[] = []
  const now = new Date()
  const totalPoints = (hours * 60) / intervalMinutes

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = addMinutes(now, -((totalPoints - i) * intervalMinutes))
    const timeOfDay = timestamp.getHours()

    // Simulate realistic performance patterns
    const basePerformance = {
      fps: 45 + Math.sin(i * 0.1) * 15 + (Math.random() - 0.5) * 10,
      memory_usage: 300 + Math.sin(i * 0.05) * 100 + (Math.random() - 0.5) * 50,
      cpu_usage: 40 + Math.sin(i * 0.08) * 20 + (Math.random() - 0.5) * 15,
      load_time: 1000 + Math.sin(i * 0.06) * 500 + (Math.random() - 0.5) * 200,
    }

    // Add time-of-day variations (worse performance during peak hours)
    const peakHourMultiplier = timeOfDay >= 9 && timeOfDay <= 17 ? 1.3 : 1.0

    // Occasionally add performance spikes
    const isSpike = Math.random() < 0.05
    const spikeMultiplier = isSpike ? 2.0 : 1.0

    // Screen names rotation
    const screens = [
      "HomeScreen",
      "ProfileScreen",
      "SettingsScreen",
      "GameScreen",
      "ChatScreen",
    ]
    const screenName = screens[i % screens.length]

    data.push({
      timestamp: timestamp.toISOString(),
      fps: Math.max(
        10,
        Math.min(
          60,
          basePerformance.fps / (peakHourMultiplier * spikeMultiplier)
        )
      ),
      memory_usage: Math.max(
        100,
        basePerformance.memory_usage * peakHourMultiplier * (isSpike ? 1.5 : 1)
      ),
      cpu_usage: Math.max(
        10,
        Math.min(
          100,
          basePerformance.cpu_usage * peakHourMultiplier * spikeMultiplier
        )
      ),
      load_time: Math.max(
        200,
        basePerformance.load_time * peakHourMultiplier * (isSpike ? 1.8 : 1)
      ),
      cache_size: Math.max(
        50,
        200 * peakHourMultiplier * (isSpike ? 1.3 : 1)
      ),
      screen_name: screenName,
    })
  }

  return data
}

// Sample annotations for testing
const sampleAnnotations: ChartAnnotation[] = [
  {
    x: 50,
    y: 15,
    label: "Performance Drop",
    type: "error",
    description: "Significant FPS drop detected during peak usage",
  },
  {
    x: 120,
    y: 800,
    label: "Memory Spike",
    type: "warning",
    description: "Memory usage exceeded recommended threshold",
  },
  {
    x: 200,
    y: 85,
    label: "CPU Intensive",
    type: "warning",
    description: "High CPU usage detected during background sync",
  },
]

/**
 * Interactive chart examples component for testing and demonstration
 */
export function ChartExamples() {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("fps")
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("line")
  const [dataHours, setDataHours] = useState(6)
  const [showAnnotations, setShowAnnotations] = useState(true)

  // Generate sample data
  const sampleData = useMemo(() => {
    return generateSampleData(dataHours, 2) // 2-minute intervals
  }, [dataHours])

  // Filter annotations based on selected metric
  const relevantAnnotations = useMemo(() => {
    if (!showAnnotations) return []
    return sampleAnnotations.filter(annotation => {
      const label = annotation.label.toLowerCase()
      return (
        label.includes(selectedMetric) ||
        (selectedMetric === "fps" && label.includes("performance")) ||
        (selectedMetric === "memory_usage" && label.includes("memory")) ||
        (selectedMetric === "cpu_usage" && label.includes("cpu"))
      )
    })
  }, [selectedMetric, showAnnotations])

  // Chart configuration examples
  const chartConfigs = {
    fps: {
      title: "Frames Per Second (FPS) Performance",
      description: "Real-time FPS monitoring with performance thresholds",
    },
    memory_usage: {
      title: "Memory Usage Analysis",
      description: "Memory consumption patterns and leak detection",
    },
    cpu_usage: {
      title: "CPU Usage Monitoring",
      description: "CPU utilization trends and bottleneck identification",
    },
    load_time: {
      title: "Screen Load Time Analysis",
      description: "User experience impact and loading performance",
    },
  }

  const currentConfig = chartConfigs[selectedMetric]

  // Stats for the current data
  const stats = useMemo(() => {
    if (!sampleData.length) return null

    const values = sampleData.map(d => (d as any)[selectedMetric])
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      count: sampleData.length,
    }
  }, [sampleData, selectedMetric])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Chart Examples</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the interactive chart components with sample performance data
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Metric</label>
              <Select
                value={selectedMetric}
                onValueChange={(value: ChartMetric) => setSelectedMetric(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fps">FPS</SelectItem>
                  <SelectItem value="memory_usage">Memory Usage</SelectItem>
                  <SelectItem value="cpu_usage">CPU Usage</SelectItem>
                  <SelectItem value="load_time">Load Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Chart Type
              </label>
              <Select
                value={selectedChartType}
                onValueChange={(value: ChartType) =>
                  setSelectedChartType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Range
              </label>
              <Select
                value={dataHours.toString()}
                onValueChange={(value: string) => setDataHours(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Features</label>
              <Button
                variant={showAnnotations ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnnotations(!showAnnotations)}
                className="w-full"
              >
                {showAnnotations ? "Hide" : "Show"} Annotations
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.min}</div>
                <div className="text-sm text-muted-foreground">Minimum</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.avg}</div>
                <div className="text-sm text-muted-foreground">Average</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.max}</div>
                <div className="text-sm text-muted-foreground">Maximum</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.count}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chart */}
      <InteractiveChart
        data={sampleData}
        metric={selectedMetric}
        chartType={selectedChartType}
        title={currentConfig.title}
        height={400}
        enableBrush={true}
        enableZoom={true}
        enableExport={true}
        enableAnomalyDetection={true}
        annotations={relevantAnnotations}
        onBrush={selection => {
          console.log("Brush selection:", selection)
        }}
        onZoom={zoomState => {
          console.log("Zoom state:", zoomState)
        }}
        onDrillDown={dataPoint => {
          console.log("Drill down:", dataPoint)
        }}
        onExport={(format, filename) => {
          console.log("Export:", { format, filename })
        }}
        ariaLabel={`${currentConfig.title} interactive chart`}
        ariaDescription={currentConfig.description}
      />

      {/* Chart Type Examples Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(["line", "area", "bar", "scatter"] as ChartType[]).map(type => (
          <InteractiveChart
            key={type}
            data={sampleData.slice(-100)} // Show fewer points for examples
            metric={selectedMetric}
            chartType={type}
            title={`${type.charAt(0).toUpperCase() + type.slice(1)} Chart Example`}
            height={250}
            enableBrush={false}
            enableZoom={false}
            enableExport={false}
            enableAnomalyDetection={false}
            className="border"
          />
        ))}
      </div>

      {/* Feature Demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Zoom & Pan</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Zoom in/out with toolbar buttons</li>
                <li>• Pan by dragging the chart</li>
                <li>• Reset zoom to view all data</li>
                <li>• Keyboard shortcuts supported</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Brush Selection</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Drag on timeline to select range</li>
                <li>• Programmatic selection support</li>
                <li>• Time-based filtering</li>
                <li>• Clear selection capability</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Export Options</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PNG image export</li>
                <li>• SVG vector export</li>
                <li>• CSV data export</li>
                <li>• Configurable quality settings</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Performance Annotations</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="destructive">Error Events</Badge>
              <Badge variant="outline">Warning Thresholds</Badge>
              <Badge variant="secondary">Info Points</Badge>
              <Badge variant="default">Success Markers</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Automatic anomaly detection highlights performance issues and
              provides contextual information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
