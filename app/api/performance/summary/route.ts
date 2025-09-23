import { NextRequest, NextResponse } from "next/server"
import { getPerformanceSummary } from "@/lib/performance-data"

export async function GET(request: NextRequest) {
  try {
    const summary = await getPerformanceSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching performance summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance summary" },
      { status: 500 }
    )
  }
}
