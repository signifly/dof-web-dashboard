"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceTier {
  tier: string
  count: number
}

interface PerformanceTiersProps {
  tiers: PerformanceTier[]
  totalMetrics: number
}

export function PerformanceTiers({
  tiers,
  totalMetrics,
}: PerformanceTiersProps) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "high":
        return "bg-green-900/200"
      case "mid":
        return "bg-yellow-900/200"
      case "low":
        return "bg-red-900/200"
      default:
        return "bg-gray-500"
    }
  }

  const getTierDescription = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "high":
        return "High-end devices with excellent performance"
      case "mid":
        return "Mid-range devices with good performance"
      case "low":
        return "Entry-level devices with basic performance"
      default:
        return "Unknown device performance tier"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Performance Tiers</CardTitle>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No performance tier data available
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map(tier => {
              const percentage =
                totalMetrics > 0 ? (tier.count / totalMetrics) * 100 : 0

              return (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getTierColor(tier.tier)}`}
                      />
                      <div>
                        <div className="font-medium capitalize">
                          {tier.tier} Performance
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTierDescription(tier.tier)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {tier.count.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getTierColor(tier.tier)}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
