"use client"

import * as React from "react"
import { addDays, format, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const DATE_PRESETS = [
  {
    label: "Last 7 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -7)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 14 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -14)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -30)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 90 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -90)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    value: () => {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        from: startOfDay(firstDayOfMonth),
        to: endOfDay(now),
      }
    },
  },
  {
    label: "Last month",
    value: () => {
      const now = new Date()
      const firstDayLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      )
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        from: startOfDay(firstDayLastMonth),
        to: endOfDay(lastDayLastMonth),
      }
    },
  },
]

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handlePresetClick = (preset: (typeof DATE_PRESETS)[0]) => {
    const range = preset.value()
    onChange(range)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange(range)
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const formatDateRange = (range: DateRange) => {
    if (!range.from) return ""

    if (range.to) {
      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`
    }

    return format(range.from, "MMM dd, yyyy")
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateRange(value) : placeholder}
            {value && (
              <Badge
                variant="secondary"
                className="ml-auto mr-0 px-1 py-0 h-4 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={clearSelection}
              >
                ×
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-3">
              <div className="text-sm font-medium mb-2">Quick presets</div>
              <div className="space-y-1">
                {DATE_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                disabled={date =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
