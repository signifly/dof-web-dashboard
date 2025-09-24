"use client"

import { RouteCorrelationAnalysis } from "@/types/route-analytics"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react"

interface CorrelationHeatmapProps {
  correlations: RouteCorrelationAnalysis[]
  routes: string[]
  selectedMetric?: "fps" | "memory" | "cpu"
  interactive?: boolean
}

export function CorrelationHeatmap({
  correlations,
  routes,
  selectedMetric = "fps",
  interactive = true,
}: CorrelationHeatmapProps) {
  const [metric, setMetric] = useState(selectedMetric)
  const [selectedCorrelation, setSelectedCorrelation] =
    useState<RouteCorrelationAnalysis | null>(null)

  // Filter correlations by strength and significance
  const significantCorrelations = correlations
    .filter(
      c => c.correlation_strength > 0.3 && c.statistical_significance > 0.5
    )
    .sort((a, b) => b.correlation_strength - a.correlation_strength)

  const getCorrelationColor = (correlation: RouteCorrelationAnalysis) => {
    const strength = correlation.correlation_strength
    const impact = correlation.performance_impact

    if (impact === "negative" && strength > 0.7) return "bg-red-500 text-white"
    if (impact === "negative" && strength > 0.5) return "bg-red-400 text-white"
    if (impact === "negative") return "bg-red-300 text-red-900"
    if (impact === "positive" && strength > 0.7)
      return "bg-green-500 text-white"
    if (impact === "positive" && strength > 0.5)
      return "bg-green-400 text-white"
    if (impact === "positive") return "bg-green-300 text-green-900"
    return "bg-gray-300 text-gray-900"
  }

  const getCorrelationTypeIcon = (type: string) => {
    switch (type) {
      case "memory_leak":
        return <Activity className="h-4 w-4" />
      case "cpu_spike":
        return <Zap className="h-4 w-4" />
      case "fps_degradation":
        return <TrendingDown className="h-4 w-4" />
      case "performance_boost":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <ArrowRightLeft className="h-4 w-4" />
    }
  }

  const getCorrelationDescription = (correlation: RouteCorrelationAnalysis) => {
    const { correlation_type, performance_impact, correlation_strength } =
      correlation
    const strength =
      correlation_strength > 0.7
        ? "strong"
        : correlation_strength > 0.5
          ? "moderate"
          : "weak"

    const descriptions: Record<string, string> = {
      memory_leak: `${strength} memory correlation - routes may share memory management issues`,
      cpu_spike: `${strength} CPU correlation - similar computational demands or bottlenecks`,
      fps_degradation: `${strength} performance correlation - routes show similar frame rate patterns`,
      performance_boost: `${strength} positive correlation - routes benefit from similar optimizations`,
    }

    return (
      descriptions[correlation_type] ||
      `${strength} performance relationship detected`
    )
  }

  if (significantCorrelations.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Route Correlation Analysis</CardTitle>
          <CardDescription>
            Performance relationships and impact patterns between routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No significant correlations found
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Correlation analysis requires sufficient data across multiple
              routes
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
          Route Correlation Analysis
          <Badge variant="outline" className="text-xs">
            {significantCorrelations.length} correlations
          </Badge>
        </CardTitle>
        <CardDescription>
          Performance relationships and statistical patterns between route pairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {interactive && (
          <div className="flex justify-between items-center mb-6">
            <Select
              value={metric}
              onValueChange={(value: "fps" | "memory" | "cpu") =>
                setMetric(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fps">FPS Impact</SelectItem>
                <SelectItem value="memory">Memory Impact</SelectItem>
                <SelectItem value="cpu">CPU Impact</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-4 text-sm">
              <span className="text-muted-foreground">Impact Legend:</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs">Positive</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-xs">Negative</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span className="text-xs">Neutral</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {significantCorrelations.slice(0, 8).map((correlation, index) => (
            <div
              key={`${correlation.source_route}-${correlation.target_route}-${index}`}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedCorrelation === correlation
                  ? "ring-2 ring-blue-500 border-blue-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedCorrelation(
                  selectedCorrelation === correlation ? null : correlation
                )
              }
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded ${getCorrelationColor(correlation)}`}
                  >
                    {getCorrelationTypeIcon(correlation.correlation_type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center space-x-2">
                      <span>
                        {correlation.source_route.replace(/^\//, "") || "Home"}
                      </span>
                      <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                      <span>
                        {correlation.target_route.replace(/^\//, "") || "Home"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {correlation.correlation_type.replace(/_/g, " ")} pattern
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      correlation.performance_impact === "positive"
                        ? "default"
                        : correlation.performance_impact === "negative"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {correlation.performance_impact}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {Math.round(correlation.correlation_strength * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      strength
                    </div>
                  </div>
                </div>
              </div>

              {/* Correlation Details */}
              <div className="text-sm text-gray-600 mb-3">
                {getCorrelationDescription(correlation)}
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <div className="font-medium">
                    {Math.round(correlation.confidence_level * 100)}%
                  </div>
                  <div className="text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <div className="font-medium">{correlation.sample_size}</div>
                  <div className="text-muted-foreground">Sample Size</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded dark:bg-gray-800">
                  <div className="font-medium">
                    {Math.round(correlation.statistical_significance * 100)}%
                  </div>
                  <div className="text-muted-foreground">Significance</div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCorrelation === correlation && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-950/50">
                      <div className="font-medium text-sm text-blue-800 mb-2 dark:text-blue-200">
                        Performance Impact Analysis
                      </div>
                      <ul className="text-xs text-blue-700 space-y-1 dark:text-blue-300">
                        {correlation.performance_impact === "positive" && (
                          <>
                            <li>
                              • Routes show complementary performance patterns
                            </li>
                            <li>• Optimizations may benefit both routes</li>
                            <li>
                              • Consider similar architecture or caching
                              strategies
                            </li>
                          </>
                        )}
                        {correlation.performance_impact === "negative" && (
                          <>
                            <li>• Routes may compete for resources</li>
                            <li>
                              • Performance issues might cascade between routes
                            </li>
                            <li>
                              • Consider load balancing or resource isolation
                            </li>
                          </>
                        )}
                        {correlation.performance_impact === "neutral" && (
                          <>
                            <li>
                              • Routes show statistical correlation without
                              clear impact
                            </li>
                            <li>• May indicate shared underlying factors</li>
                            <li>• Monitor for emerging patterns</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="font-medium text-sm text-gray-800 mb-2 dark:text-gray-200">
                        Optimization Recommendations
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1 dark:text-gray-300">
                        {correlation.correlation_type === "memory_leak" && (
                          <>
                            <li>• Review memory management in both routes</li>
                            <li>• Check for shared components or services</li>
                            <li>• Implement memory monitoring alerts</li>
                          </>
                        )}
                        {correlation.correlation_type === "cpu_spike" && (
                          <>
                            <li>• Analyze computational complexity</li>
                            <li>• Consider async processing or caching</li>
                            <li>• Review shared algorithms or libraries</li>
                          </>
                        )}
                        {correlation.correlation_type === "fps_degradation" && (
                          <>
                            <li>• Optimize rendering performance</li>
                            <li>• Review animation and transition effects</li>
                            <li>• Consider device-specific optimizations</li>
                          </>
                        )}
                        {correlation.correlation_type ===
                          "performance_boost" && (
                          <>
                            <li>
                              • Apply successful optimizations to similar routes
                            </li>
                            <li>• Document best practices for reuse</li>
                            <li>• Create performance template or guidelines</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>
                      Statistical confidence:{" "}
                      {Math.round(correlation.statistical_significance * 100)}%
                    </span>
                    <span>
                      Based on {correlation.sample_size} route interactions
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {
                  correlations.filter(c => c.performance_impact === "positive")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                Positive Correlations
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {
                  correlations.filter(c => c.performance_impact === "negative")
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                Negative Correlations
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(
                  (significantCorrelations.reduce(
                    (sum, c) => sum + c.correlation_strength,
                    0
                  ) /
                    significantCorrelations.length) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-muted-foreground">Avg Strength</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round(
                  (significantCorrelations.reduce(
                    (sum, c) => sum + c.confidence_level,
                    0
                  ) /
                    significantCorrelations.length) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-muted-foreground">
                Avg Confidence
              </div>
            </div>
          </div>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing {Math.min(8, significantCorrelations.length)} of{" "}
            {correlations.length} total correlations
            {correlations.length > significantCorrelations.length && (
              <span>
                {" "}
                • {correlations.length - significantCorrelations.length}{" "}
                correlations filtered for significance
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
