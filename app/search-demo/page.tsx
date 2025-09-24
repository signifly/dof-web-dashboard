import { SearchExample } from "@/components/search/search-example"

export const dynamic = "force-dynamic"

export default function SearchDemoPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Performance Data Search</h1>
        <p className="text-muted-foreground">
          Advanced search interface for performance monitoring data
        </p>
      </div>

      <SearchExample />
    </div>
  )
}
