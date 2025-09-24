"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AdvancedSearchForm } from "./advanced-search-form"
import { SearchResults } from "./search-results"
import { FilterPresetManager } from "./filter-preset-manager"
import { SearchHistory } from "./search-history"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SearchQuery,
  SearchResults as SearchResultsType,
} from "@/lib/services/search-service"
import { SearchQueryBuilder } from "@/lib/utils/search-query-builder"

export function SearchPageContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState<SearchQuery>({})
  const [results, setResults] = useState<SearchResultsType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial query from URL parameters
  useEffect(() => {
    if (searchParams) {
      const urlQuery = SearchQueryBuilder.fromURLParams(searchParams)
      setQuery(urlQuery)
    }
  }, [searchParams])

  const handleSearch = async (
    newQuery: SearchQuery,
    searchResults: SearchResultsType
  ) => {
    setQuery(newQuery)
    setResults(searchResults)
    setError(null)
  }

  const handleSearchError = (error: string) => {
    setError(error)
    setResults(null)
  }

  const handlePresetLoad = (presetQuery: SearchQuery) => {
    setQuery(presetQuery)
  }

  const handleHistoryLoad = (historyQuery: SearchQuery) => {
    setQuery(historyQuery)
  }

  const handleSort = (
    sortBy: "timestamp" | "metric_value" | "created_at",
    sortOrder: "asc" | "desc"
  ) => {
    const newQuery = { ...query, sortBy, sortOrder }
    setQuery(newQuery)
  }

  const handlePageChange = (offset: number) => {
    const newQuery = { ...query, offset }
    setQuery(newQuery)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
          <TabsTrigger value="presets">Saved Presets</TabsTrigger>
          <TabsTrigger value="history">Search History</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <AdvancedSearchForm
                initialQuery={query}
                onSearch={handleSearch}
                onError={handleSearchError}
                autoSearch={true}
                showPreview={true}
              />
            </CardContent>
          </Card>

          {results && (
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              error={error}
              onSort={handleSort}
              onPageChange={handlePageChange}
            />
          )}
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <FilterPresetManager
                currentQuery={query}
                onLoadPreset={handlePresetLoad}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <SearchHistory
                currentQuery={query}
                onLoadHistory={handleHistoryLoad}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
