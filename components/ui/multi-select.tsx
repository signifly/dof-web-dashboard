"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxItems?: number
  searchable?: boolean
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
  maxItems,
  searchable = true,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options

    return options.filter(
      option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery, searchable])

  const selectedOptions = React.useMemo(() => {
    return options.filter(option => value.includes(option.value))
  }, [options, value])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]

    onChange(newValue)
  }

  const handleRemove = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const newValue = value.filter(v => v !== optionValue)
    onChange(newValue)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const isSelectionLimitReached = maxItems ? value.length >= maxItems : false

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "w-full justify-between text-left font-normal",
              !value.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex gap-1 flex-wrap overflow-hidden">
              {value.length === 0 && placeholder}
              {selectedOptions.slice(0, 2).map(option => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="px-1 py-0 h-5"
                >
                  {option.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={e => handleRemove(option.value, e)}
                  />
                </Badge>
              ))}
              {value.length > 2 && (
                <Badge variant="secondary" className="px-1 py-0 h-5">
                  +{value.length - 2} more
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {value.length > 0 && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-80 overflow-auto">
            {searchable && (
              <div className="p-2 border-b">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            )}

            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = value.includes(option.value)
                  const isDisabled =
                    option.disabled || (!isSelected && isSelectionLimitReached)

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => !isDisabled && handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
