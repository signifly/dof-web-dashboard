"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SearchSuggestions } from "./search-suggestions"
import { SearchHistory } from "./search-history"
import { SearchQuery } from "@/lib/services/search-service"

interface GlobalSearchProps {
  className?: string
  placeholder?: string
  variant?: "input" | "button"
}

export function GlobalSearch({
  className = "",
  placeholder = "Search performance data...",
  variant = "input",
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState("")
  const router = useRouter()

  const handleSearch = (query: SearchQuery) => {
    // Navigate to search results page with query parameters
    const searchParams = new URLSearchParams()

    if (query.text) {
      searchParams.set("q", query.text)
    }

    if (query.platforms && query.platforms.length > 0) {
      searchParams.set("platforms", query.platforms.join(","))
    }

    if (query.devices && query.devices.length > 0) {
      searchParams.set("devices", query.devices.join(","))
    }

    if (query.dateRange) {
      searchParams.set("dateStart", query.dateRange.start.toISOString())
      searchParams.set("dateEnd", query.dateRange.end.toISOString())
    }

    // Navigate to search results page (we'll need to create this)
    router.push(`/search?${searchParams.toString()}`)
    setOpen(false)
  }

  const handleQuickSearch = (text: string) => {
    handleSearch({ text })
  }

  const handleSuggestionSelect = (suggestion: any) => {
    switch (suggestion.type) {
      case "metric_type":
        handleSearch({ metricTypes: [suggestion.value] })
        break
      case "platform":
        handleSearch({ platforms: [suggestion.value] })
        break
      case "device":
        handleSearch({ devices: [suggestion.value] })
        break
      default:
        handleSearch({ text: suggestion.value })
    }
  }

  if (variant === "button") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${className} min-w-[200px] justify-start text-muted-foreground`}
          >
            <Search className="h-4 w-4 mr-2" />
            Search...
            <Command className="h-3 w-3 ml-auto" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Search Performance Data</span>
            </DialogTitle>
          </DialogHeader>
          <GlobalSearchContent
            searchText={searchText}
            setSearchText={setSearchText}
            onSearch={handleQuickSearch}
            onSuggestionSelect={handleSuggestionSelect}
            onHistorySelect={handleSearch}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // Input variant for inline search
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        type="search"
        placeholder={placeholder}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && searchText.trim()) {
            handleQuickSearch(searchText.trim())
          }
        }}
        className="pl-9 pr-4 w-full"
      />
      {searchText && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <SearchSuggestions
            value={searchText}
            onSuggestionSelect={handleSuggestionSelect}
            maxSuggestions={5}
          />
        </div>
      )}
    </div>
  )
}

interface GlobalSearchContentProps {
  searchText: string
  setSearchText: (text: string) => void
  onSearch: (text: string) => void
  onSuggestionSelect: (suggestion: any) => void
  onHistorySelect: (query: SearchQuery) => void
}

function GlobalSearchContent({
  searchText,
  setSearchText,
  onSearch,
  onSuggestionSelect,
  onHistorySelect,
}: GlobalSearchContentProps) {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search performance data..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchText.trim()) {
              onSearch(searchText.trim())
            }
          }}
          className="pl-9 pr-4 text-base"
          autoFocus
        />
      </div>

      {/* Search Suggestions */}
      {searchText && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Suggestions
          </h4>
          <SearchSuggestions
            value={searchText}
            onSuggestionSelect={onSuggestionSelect}
            maxSuggestions={8}
            showCategories={true}
          />
        </div>
      )}

      {/* Search History */}
      {!searchText && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Recent Searches
          </h4>
          <SearchHistory
            onLoadHistory={onHistorySelect}
            maxItems={5}
            compact={true}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Quick Searches
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() =>
              onHistorySelect({
                metrics: { fps: { max: 20 } },
                text: "Poor Performance",
              })
            }
          >
            Poor Performance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() =>
              onHistorySelect({
                dateRange: {
                  start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  end: new Date(),
                },
                text: "Last 24 Hours",
              })
            }
          >
            Last 24 Hours
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() =>
              onHistorySelect({
                platforms: ["android"],
                text: "Android Devices",
              })
            }
          >
            Android Devices
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() =>
              onHistorySelect({
                metrics: { memory: { min: 500 } },
                text: "High Memory Usage",
              })
            }
          >
            High Memory Usage
          </Button>
        </div>
      </div>
    </div>
  )
}
