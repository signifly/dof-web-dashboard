"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSummary } from "@/lib/performance-data"

interface PlatformBreakdownProps {
  data: PerformanceSummary["platformBreakdown"]
}

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No platform data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSessions = data.reduce((sum, platform) => sum + platform.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((platform, _index) => {
          const percentage =
            totalSessions > 0 ? (platform.count / totalSessions) * 100 : 0

          return (
            <div key={platform.platform} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{platform.platform}</span>
                <span className="text-muted-foreground">
                  {platform.count} sessions ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            Total: {totalSessions} sessions across {data.length} platforms
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
