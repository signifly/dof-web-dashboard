"use client"

import { JourneyPattern } from "@/types/user-journey"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface JourneyFlowChartProps {
  journeyPatterns: JourneyPattern[]
  selectedPattern?: string
  onPatternSelect?: (patternId: string) => void
  showPerformanceOverlay?: boolean
}

export function JourneyFlowChart({
  journeyPatterns,
  selectedPattern,
  onPatternSelect,
  showPerformanceOverlay = true,
}: JourneyFlowChartProps) {
  const topPatterns = journeyPatterns
    .sort((a, b) => b.user_impact_score - a.user_impact_score)
    .slice(0, 5)

  const selectedPatternData = selectedPattern
    ? journeyPatterns.find(p => p.pattern_id === selectedPattern)
    : topPatterns[0]

  if (topPatterns.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>User Journey Flow Analysis</CardTitle>
          <CardDescription>
            Common navigation patterns and performance impact across user
            journeys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              No journey patterns available for analysis
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Journey analysis requires sufficient session data across multiple
              route transitions
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          User Journey Flow Analysis
          <Badge variant="outline" className="text-xs">
            {journeyPatterns.length} patterns detected
          </Badge>
        </CardTitle>
        <CardDescription>
          Common navigation patterns and performance impact across user journeys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedPattern || topPatterns[0]?.pattern_id}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            {topPatterns.slice(0, 3).map(pattern => (
              <TabsTrigger
                key={pattern.pattern_id}
                value={pattern.pattern_id}
                onClick={() => onPatternSelect?.(pattern.pattern_id)}
                className="text-xs flex flex-col items-center py-2 h-auto"
              >
                <span className="font-medium">
                  {pattern.route_sequence.length} Routes
                </span>
                <span className="text-xs text-muted-foreground">
                  {pattern.frequency} occurrences
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {topPatterns.slice(0, 3).map(pattern => (
            <TabsContent key={pattern.pattern_id} value={pattern.pattern_id}>
              <div className="space-y-6">
                {/* Journey Flow Visualization */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Navigation Flow</h4>

                  <div className="relative">
                    {/* Flow visualization */}
                    <div className="flex items-center justify-center overflow-x-auto pb-4">
                      <div className="flex items-center space-x-2 min-w-max">
                        {pattern.route_sequence.map((route, index) => {
                          const isBottleneck =
                            pattern.common_bottlenecks.includes(route)

                          return (
                            <div key={index} className="flex items-center">
                              <div
                                className={`
                                relative px-3 py-2 rounded-lg text-sm font-medium transition-all
                                ${
                                  isBottleneck
                                    ? "bg-red-100 text-red-800 border-2 border-red-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }
                              `}
                              >
                                {route.replace(/^\//, "") || "Home"}
                                {isBottleneck && (
                                  <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                                )}
                              </div>
                              {index < pattern.route_sequence.length - 1 && (
                                <div className="mx-2 flex items-center">
                                  <div className="w-8 h-px bg-gray-300"></div>
                                  <div className="w-2 h-2 bg-gray-300 rounded-full -ml-1"></div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Completion Rate:
                        </span>
                        <Badge
                          variant={
                            pattern.completion_rate > 0.7
                              ? "default"
                              : "secondary"
                          }
                        >
                          {Math.round(pattern.completion_rate * 100)}%
                        </Badge>
                      </div>
                      <div className="w-32">
                        <Progress
                          value={pattern.completion_rate * 100}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">
                        Optimization Potential:
                      </span>
                      <Badge
                        variant={
                          pattern.optimization_potential > 50
                            ? "destructive"
                            : "default"
                        }
                      >
                        {Math.round(pattern.optimization_potential)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                {showPerformanceOverlay && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {Math.round(pattern.avg_performance_score)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Performance
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {pattern.frequency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Journeys
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {Math.round(pattern.avg_journey_duration / 1000)}s
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Duration
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {Math.round(pattern.user_impact_score)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Impact Score
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Bottlenecks */}
                {pattern.common_bottlenecks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Performance Bottlenecks</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pattern.common_bottlenecks.map((bottleneck, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-sm text-amber-800">
                              {bottleneck.replace(/^\//, "") || "Home"}
                            </div>
                            <div className="text-xs text-amber-600">
                              Common performance issue detected
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Bottleneck
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Journey Insights */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm">Journey Insights</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="flex-shrink-0">
                        {pattern.completion_rate > 0.7 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : pattern.completion_rate > 0.4 ? (
                          <Minus className="h-4 w-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {pattern.completion_rate > 0.7
                            ? "High completion rate indicates a successful user flow"
                            : pattern.completion_rate > 0.4
                              ? "Moderate completion rate suggests room for improvement"
                              : "Low completion rate indicates significant user drop-off"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pattern.completion_rate > 0.7
                            ? "Consider this pattern as a template for other user flows"
                            : "Focus on bottleneck routes to improve user retention"}
                        </div>
                      </div>
                    </div>

                    {pattern.optimization_potential > 50 && (
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg dark:bg-blue-950/50">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            High optimization potential detected
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Performance improvements in bottleneck routes could
                            significantly impact user experience
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Pattern Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing top {Math.min(3, topPatterns.length)} of{" "}
              {journeyPatterns.length} journey patterns
            </div>
            <div>Based on user impact score and frequency</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
