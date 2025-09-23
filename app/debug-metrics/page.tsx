// import { debugMetricTypes } from "@/lib/performance-data"

export const dynamic = "force-dynamic"

export default async function DebugMetricsPage() {
  // const debugData = await debugMetricTypes()
  const debugData = {
    totalMetrics: 0,
    error: "Debug function temporarily disabled",
    metricTypes: [],
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug: Database Metric Types</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Database Analysis</h2>
        <p className="mb-2">
          Total metrics found: <strong>{debugData.totalMetrics}</strong>
        </p>

        {debugData.error ? (
          <div className="text-red-600 font-medium">
            Error: {debugData.error}
          </div>
        ) : (
          <div>
            <h3 className="text-md font-medium mb-2">Metric Types:</h3>
            <div className="space-y-2">
              {debugData.metricTypes?.map((typeInfo: any) => (
                <div
                  key={typeInfo.type}
                  className="border border-gray-300 p-3 rounded"
                >
                  <div className="font-medium">&quot;{typeInfo.type}&quot;</div>
                  <div className="text-sm text-gray-600">
                    Count: {typeInfo.count} | Examples: [
                    {typeInfo.examples.join(", ")}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Expected Load Time Metric Types
        </h3>
        <p className="text-sm text-gray-700 mb-2">
          The code is currently looking for load time data using these metric
          types:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>
            <code>&quot;navigation_time&quot;</code>
          </li>
          <li>
            <code>&quot;screen_load&quot;</code>
          </li>
          <li>
            <code>&quot;load_time&quot;</code>
          </li>
        </ul>
        <p className="text-sm text-gray-700 mt-2">
          If your load time data uses different metric type names, we&apos;ll
          need to update the code to match.
        </p>
      </div>
    </div>
  )
}
