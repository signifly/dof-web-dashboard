"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AdvancedSearchForm } from "./advanced-search-form"
import { SearchQuery, SearchResults } from "@/lib/services/search-service"

interface SearchExampleProps {
  className?: string
}

export function SearchExample({ className }: SearchExampleProps) {
  const [searchQuery, setSearchQuery] = React.useState<SearchQuery | null>(null)
  const [searchResults, setSearchResults] =
    React.useState<SearchResults | null>(null)

  const handleSearch = (query: SearchQuery, results: SearchResults) => {
    setSearchQuery(query)
    setSearchResults(results)
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Data Search</CardTitle>
            <CardDescription>
              Use advanced filters to search through performance metrics and
              sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedSearchForm
              onSearch={handleSearch}
              autoSearch={false}
              showPreview={true}
            />
          </CardContent>
        </Card>

        {/* Search Results Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Preview of search query and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults ? (
              <div className="space-y-4">
                {/* Results Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {searchResults.metrics.length}
                    </div>
                    <div className="text-sm text-blue-800">Metrics</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {searchResults.sessions.length}
                    </div>
                    <div className="text-sm text-green-800">Sessions</div>
                  </div>
                </div>

                <Separator />

                {/* Query Details */}
                {searchQuery && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Filters:</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery.text && (
                        <Badge variant="secondary">
                          Text: &quot;{searchQuery.text}&quot;
                        </Badge>
                      )}
                      {searchQuery.devices &&
                        searchQuery.devices.length > 0 && (
                          <Badge variant="secondary">
                            {searchQuery.devices.length} devices
                          </Badge>
                        )}
                      {searchQuery.platforms &&
                        searchQuery.platforms.length > 0 && (
                          <Badge variant="secondary">
                            Platforms: {searchQuery.platforms.join(", ")}
                          </Badge>
                        )}
                      {searchQuery.dateRange && (
                        <Badge variant="secondary">
                          Date range:{" "}
                          {searchQuery.dateRange.start.toLocaleDateString()} -{" "}
                          {searchQuery.dateRange.end.toLocaleDateString()}
                        </Badge>
                      )}
                      {searchQuery.metrics &&
                        Object.keys(searchQuery.metrics).length > 0 && (
                          <Badge variant="secondary">
                            {Object.keys(searchQuery.metrics).length} metric
                            filters
                          </Badge>
                        )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Facets */}
                {searchResults.facets && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Result Breakdown:</h4>

                    {/* Metric Types */}
                    {searchResults.facets.metricTypes.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">
                          Metric Types:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {searchResults.facets.metricTypes
                            .slice(0, 5)
                            .map(facet => (
                              <Badge
                                key={facet.type}
                                variant="outline"
                                className="text-xs"
                              >
                                {facet.type} ({facet.count})
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Platforms */}
                    {searchResults.facets.platforms.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">
                          Platforms:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {searchResults.facets.platforms.map(facet => (
                            <Badge
                              key={facet.platform}
                              variant="outline"
                              className="text-xs"
                            >
                              {facet.platform} ({facet.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Search completed in {searchResults.executionTime}ms
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Submit a search to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
