"use client"

import { useEffect, useState } from "react"
import { getBuildPerformanceDataClient } from "@/lib/client-performance-data"

export default function DebugBuildsPage() {
  const [builds, setBuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await getBuildPerformanceDataClient()
        console.log("Fetched builds:", data)
        setBuilds(data)
      } catch (err) {
        console.error("Error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Build Performance Data</h1>

      <div className="space-y-4">
        {builds.map((build, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h2 className="font-bold text-lg">{build.version}</h2>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>avgFps: {build.avgFps}</div>
              <div>avgFps.toFixed(1): {build.avgFps.toFixed(1)}</div>
              <div>avgMemory: {build.avgMemory}</div>
              <div>avgCpu: {build.avgCpu}</div>
              <div>avgLoadTime: {build.avgLoadTime}</div>
              <div>regressionScore: {build.regressionScore}</div>
              <div>status: {build.status}</div>
              <div>totalSessions: {build.totalSessions}</div>
              <div className="col-span-2">platforms: {build.platforms?.join(", ")}</div>
              <div className="col-span-2">timestamp: {build.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
