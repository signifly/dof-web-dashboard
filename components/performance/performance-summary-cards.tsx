import { MetricCard } from "@/components/charts/metric-card"
import { PerformanceSummary } from "@/lib/performance-data"

interface PerformanceSummaryCardsProps {
  data: PerformanceSummary
  isLoading?: boolean
}

export function PerformanceSummaryCards({
  data,
  isLoading,
}: PerformanceSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const getPerformanceGrade = (fps: number) => {
    if (fps >= 50)
      return {
        grade: "Excellent",
        trend: "up" as const,
        type: "positive" as const,
      }
    if (fps >= 30)
      return {
        grade: "Good",
        trend: "stable" as const,
        type: "neutral" as const,
      }
    if (fps >= 20)
      return {
        grade: "Fair",
        trend: "down" as const,
        type: "negative" as const,
      }
    return { grade: "Poor", trend: "down" as const, type: "negative" as const }
  }

  const getCpuGrade = (cpu: number) => {
    if (cpu <= 30)
      return {
        grade: "Excellent",
        trend: "up" as const,
        type: "positive" as const,
      }
    if (cpu <= 50)
      return {
        grade: "Good",
        trend: "stable" as const,
        type: "neutral" as const,
      }
    if (cpu <= 70)
      return {
        grade: "Fair",
        trend: "down" as const,
        type: "negative" as const,
      }
    return { grade: "Poor", trend: "down" as const, type: "negative" as const }
  }

  const getMemoryGrade = (memory: number) => {
    if (memory <= 100)
      return {
        grade: "Excellent",
        trend: "up" as const,
        type: "positive" as const,
      }
    if (memory <= 200)
      return {
        grade: "Good",
        trend: "stable" as const,
        type: "neutral" as const,
      }
    if (memory <= 500)
      return {
        grade: "Fair",
        trend: "down" as const,
        type: "negative" as const,
      }
    return { grade: "Poor", trend: "down" as const, type: "negative" as const }
  }

  const performanceGrade = getPerformanceGrade(data.avgFps)
  const cpuGrade = getCpuGrade(data.avgCpu)
  const memoryGrade = getMemoryGrade(data.avgMemory)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Active Sessions"
        value={data.totalSessions}
        
        description={`${data.totalMetrics.toLocaleString()} total metrics`}
        trend="stable"
      />

      <MetricCard
        title="Avg Performance"
        value={`${data.avgFps.toFixed(1)} FPS`}
        change={performanceGrade.grade}
        changeType={performanceGrade.type}
        
        trend={performanceGrade.trend}
      />

      <MetricCard
        title="CPU Usage"
        value={`${data.avgCpu.toFixed(1)}%`}
        change={cpuGrade.grade}
        changeType={cpuGrade.type}
        
        trend={cpuGrade.trend}
      />

      <MetricCard
        title="Memory Usage"
        value={`${data.avgMemory.toFixed(0)} MB`}
        change={memoryGrade.grade}
        changeType={memoryGrade.type}
        
        trend={memoryGrade.trend}
      />
    </div>
  )
}
