import { NextRequest, NextResponse } from "next/server"
import { getPerformanceTrends } from "@/lib/performance-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    const limitNumber = limit ? parseInt(limit, 10) : 50

    const trends = await getPerformanceTrends(limitNumber)
    return NextResponse.json(trends)
  } catch (error) {
    console.error("Error fetching performance trends:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance trends" },
      { status: 500 }
    )
  }
}
