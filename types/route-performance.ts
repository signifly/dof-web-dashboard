export interface ScreenTimeContext {
  segments: string[]
  routeName: string
  routePath: string
  screenStartTime: number
}

export interface RoutePerformanceSession {
  sessionId: string
  deviceId: string
  routeName: string
  routePath: string
  routePattern: string
  segments: string[]
  screenStartTime: number
  screenDuration?: number

  fpsMetrics: number[]
  memoryMetrics: number[]
  cpuMetrics: number[]

  avgFps: number
  avgMemory: number
  avgCpu: number

  deviceType: string
  appVersion: string
  timestamp: string
}

export interface PerformanceDistribution {
  excellent: number
  good: number
  fair: number
  poor: number
}

export interface RoutePerformanceData {
  routeName: string
  routePattern: string
  totalSessions: number
  uniqueDevices: number

  avgFps: number
  avgMemory: number
  avgCpu: number
  avgScreenDuration: number

  fpsDistribution: PerformanceDistribution
  memoryDistribution: PerformanceDistribution

  performanceScore: number
  riskLevel: "low" | "medium" | "high"

  sessions: RoutePerformanceSession[]

  performanceTrend: "improving" | "stable" | "degrading"
  relativePerformance: {
    fpsVsAverage: number
    memoryVsAverage: number
    cpuVsAverage: number
  }
}

export interface RoutePerformanceAnalysis {
  routes: RoutePerformanceData[]
  summary: {
    totalRoutes: number
    totalSessions: number
    worstPerformingRoutes: RoutePerformanceData[]
    bestPerformingRoutes: RoutePerformanceData[]
    routesWithHighMemoryUsage: RoutePerformanceData[]
    routesWithLowFps: RoutePerformanceData[]
  }
  appAverages: {
    avgFps: number
    avgMemory: number
    avgCpu: number
  }
}
