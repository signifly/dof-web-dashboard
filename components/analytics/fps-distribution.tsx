"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FpsRange {
  range: string
  count: number
}

interface FpsDistributionProps {
  distribution: FpsRange[]
  totalFpsMetrics: number
}

export function FpsDistribution({
  distribution,
  totalFpsMetrics,
}: FpsDistributionProps) {
  const getRangeColor = (range: string) => {
    if (range.includes("60+") || range.includes("Excellent"))
      return "bg-green-900/200"
    if (range.includes("45-60") || range.includes("Very Good"))
      return "bg-blue-900/200"
    if (range.includes("30-45") || range.includes("Good"))
      return "bg-yellow-900/200"
    if (range.includes("20-30") || range.includes("Fair"))
      return "bg-orange-900/200"
    if (range.includes("<20") || range.includes("Poor")) return "bg-red-900/200"
    return "bg-gray-500"
  }

  const getRangeStatus = (range: string) => {
    if (range.includes("60+")) return ""
    if (range.includes("45-60")) return ""
    if (range.includes("30-45")) return ""
    if (range.includes("20-30")) return ""
    if (range.includes("<20")) return ""
    return ""
  }

  // Sort distribution by performance (best first)
  const sortedDistribution = [...distribution].sort((a, b) => {
    const order = ["60+", "45-60", "30-45", "20-30", "<20"]
    const aIndex = order.findIndex(prefix => a.range.includes(prefix))
    const bIndex = order.findIndex(prefix => b.range.includes(prefix))
    return (aIndex === -1 ? 5 : aIndex) - (bIndex === -1 ? 5 : bIndex)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>FPS Performance Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {distribution.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No FPS distribution data available
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDistribution.map(range => {
              const percentage =
                totalFpsMetrics > 0 ? (range.count / totalFpsMetrics) * 100 : 0

              return (
                <div key={range.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {getRangeStatus(range.range)}
                      </div>
                      <div>
                        <div className="font-medium">{range.range}</div>
                        <div className="text-sm text-muted-foreground">
                          Performance quality assessment
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {range.count.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRangeColor(range.range)}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>Performance Guidelines:</strong>
                <br />
                • 60+ FPS: Excellent user experience, no frame drops
                <br />
                • 45-60 FPS: Very good performance, minimal drops
                <br />
                • 30-45 FPS: Good performance, some noticeable drops
                <br />
                • 20-30 FPS: Fair performance, frequent drops
                <br />• &lt;20 FPS: Poor performance, significant lag
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
