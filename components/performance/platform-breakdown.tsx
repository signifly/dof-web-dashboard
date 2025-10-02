"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSummary } from "@/lib/performance-data"
import { ChevronRight } from "lucide-react"

interface PlatformBreakdownProps {
  data: PerformanceSummary["platformBreakdown"]
}

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  const router = useRouter()

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

  const handlePlatformClick = (platform: string) => {
    router.push(`/platforms/${encodeURIComponent(platform)}`)
  }

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
            <div
              key={platform.platform}
              className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors group"
              onClick={() => handlePlatformClick(platform.platform)}
            >
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{platform.platform}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-muted-foreground">
                  {platform.count} sessions ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all group-hover:bg-blue-700"
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
