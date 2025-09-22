"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSession } from "@/lib/performance-data"

interface DeviceBenchmarkingProps {
  sessions: PerformanceSession[]
}

export function DeviceBenchmarking({ sessions }: DeviceBenchmarkingProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Performance Benchmarking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Device benchmarking will be available when performance data is
            collected.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
