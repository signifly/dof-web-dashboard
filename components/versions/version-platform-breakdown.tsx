"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { VersionPlatform } from "@/lib/types/version"

interface VersionPlatformBreakdownProps {
  platforms: VersionPlatform[]
}

export function VersionPlatformBreakdown({
  platforms,
}: VersionPlatformBreakdownProps) {
  if (platforms.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No platform data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {platforms.map(platform => (
        <Link
          key={platform.platform}
          href={`/platforms/${encodeURIComponent(platform.platform)}`}
        >
          <Card className="hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Platform Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {platform.platform}
                  </h3>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      platform.healthScore >= 80
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : platform.healthScore >= 60
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {platform.healthScore}/100
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Devices</div>
                    <div className="font-medium text-lg">
                      {platform.deviceCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sessions</div>
                    <div className="font-medium text-lg">
                      {platform.sessionCount}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">FPS</div>
                    <div
                      className={`font-medium ${
                        platform.avgFps >= 50
                          ? "text-green-600 dark:text-green-400"
                          : platform.avgFps >= 30
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {platform.avgFps.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Memory</div>
                    <div
                      className={`font-medium ${
                        platform.avgMemory <= 200
                          ? "text-green-600 dark:text-green-400"
                          : platform.avgMemory <= 400
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {platform.avgMemory} MB
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">CPU</div>
                    <div
                      className={`font-medium ${
                        platform.avgCpu <= 30
                          ? "text-green-600 dark:text-green-400"
                          : platform.avgCpu <= 60
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {platform.avgCpu.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
