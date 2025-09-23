"use client"

import React from "react"
import { InteractiveChart } from "./interactive-chart"
import type { MetricsTrend } from "@/lib/performance-data"

// Simple test component to validate our charts work
export function ChartTestExample() {
  // Simple sample data
  const sampleData: MetricsTrend[] = [
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      fps: 45,
      memory_usage: 350,
      cpu_usage: 45,
      load_time: 1200,
      screen_name: "HomeScreen",
    },
    {
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      fps: 52,
      memory_usage: 320,
      cpu_usage: 38,
      load_time: 900,
      screen_name: "ProfileScreen",
    },
    {
      timestamp: new Date().toISOString(), // now
      fps: 48,
      memory_usage: 380,
      cpu_usage: 42,
      load_time: 1100,
      screen_name: "SettingsScreen",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Interactive Chart Test</h2>

      <InteractiveChart
        data={sampleData}
        metric="fps"
        chartType="line"
        title="FPS Performance Test"
        height={300}
        enableBrush={true}
        enableZoom={true}
        enableExport={true}
      />

      <InteractiveChart
        data={sampleData}
        metric="memory_usage"
        chartType="area"
        title="Memory Usage Test"
        height={300}
        enableBrush={false}
        enableZoom={true}
        enableExport={true}
      />
    </div>
  )
}
