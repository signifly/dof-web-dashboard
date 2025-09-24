# Search Components Documentation

This directory contains a comprehensive set of search components for the Next.js 14 performance monitoring dashboard. These components integrate with the search service infrastructure to provide advanced filtering capabilities.

## Components Overview

### 1. AdvancedSearchForm (`advanced-search-form.tsx`)

The main search form component that combines all other search components into a unified interface.

**Features:**

- Text search with real-time preview
- Collapsible advanced filters section
- Form validation with Zod schema
- Auto-search capability
- Integration with SearchQuery interface

**Usage:**

```tsx
import { AdvancedSearchForm } from "@/components/search"
;<AdvancedSearchForm
  onSearch={(query, results) => {
    // Handle search results
    console.log("Search query:", query)
    console.log("Results:", results)
  }}
  autoSearch={false}
  showPreview={true}
  initialQuery={{
    text: "fps",
    dateRange: { start: new Date(), end: new Date() },
  }}
/>
```

### 2. DateRangePicker (`date-range-picker.tsx`)

A comprehensive date range picker with preset options and calendar interface.

**Features:**

- Quick preset options (Last 7 days, Last 30 days, etc.)
- Dual calendar interface for range selection
- Clear selection functionality
- Time zone handling
- Format display with badges

**Usage:**

```tsx
import { DateRangePicker } from "@/components/search"
;<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  placeholder="Select date range..."
/>
```

### 3. DeviceSelector (`device-selector.tsx`)

Multi-select device picker with platform and version filtering.

**Features:**

- Platform filtering (iOS, Android, Web, Tablet)
- App version filtering
- Multi-select with search functionality
- Device session count display
- Maximum selection limits

**Usage:**

```tsx
import { DeviceSelector } from "@/components/search"
;<DeviceSelector
  value={selectedDevices}
  onChange={setSelectedDevices}
  maxItems={10}
  placeholder="Select devices..."
/>
```

### 4. MetricsRangeFilter (`metrics-range-filter.tsx`)

Advanced metrics filtering with sliders, inputs, and performance tier shortcuts.

**Features:**

- Tabbed interface for FPS, CPU, Memory, Load Time
- Range sliders with min/max inputs
- Performance tier shortcuts (Poor, Good, Excellent)
- Visual indicators and validation
- Real-time range updates

**Usage:**

```tsx
import { MetricsRangeFilter } from "@/components/search"
;<MetricsRangeFilter
  value={metricsRange}
  onChange={setMetricsRange}
  disabled={isLoading}
/>
```

## Supporting UI Components

### MultiSelect (`ui/multi-select.tsx`)

Reusable multi-select component with search functionality.

### Calendar (`ui/calendar.tsx`)

Calendar component built on react-day-picker for date selection.

### Popover (`ui/popover.tsx`)

Popover component for dropdown interfaces.

### Slider (`ui/slider.tsx`)

Range slider component for numeric range selection.

### Separator (`ui/separator.tsx`)

Visual separator component for UI organization.

## Integration Points

### With Search Service

```tsx
import { searchService, SearchQuery } from "@/lib/services/search-service"

const handleSearch = async (query: SearchQuery) => {
  const results = await searchService.search(query)
  // Handle results...
}
```

### With Query Builder

```tsx
import { SearchQueryBuilder } from "@/lib/utils/search-query-builder"

// Validate query
const validation = SearchQueryBuilder.validateQuery(query)
if (!validation.isValid) {
  // Handle validation errors...
}

// Convert to URL params
const urlParams = SearchQueryBuilder.toURLParams(query)
```

## Form Validation

The search form uses Zod for validation with the following schema:

```tsx
const searchFormSchema = z.object({
  text: z.string().optional(),
  devices: z.array(z.string()).optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
  metrics: z
    .object({
      fps: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      cpu: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      memory: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
      loadTime: z
        .object({ min: z.number().optional(), max: z.number().optional() })
        .optional(),
    })
    .optional(),
  platforms: z.array(z.string()).optional(),
  appVersions: z.array(z.string()).optional(),
  metricTypes: z.array(z.string()).optional(),
  sortBy: z.enum(["timestamp", "metric_value", "created_at"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})
```

## Performance Considerations

- Components use React.memo and useMemo for optimization
- Search debouncing to prevent excessive API calls
- Lazy loading of filter options
- Virtual scrolling for large device lists
- Pagination support in search results

## Accessibility Features

- Full keyboard navigation support
- ARIA labels and descriptions
- Screen reader compatibility
- High contrast mode support
- Focus management and indicators

## Styling

Components use Tailwind CSS with the project's design system:

- Consistent spacing and typography
- Dark/light mode support
- Responsive design patterns
- Animation and transition effects
- Custom component variants

## Error Handling

- Form validation with user-friendly error messages
- Loading states and disabled states
- Graceful fallbacks for API failures
- Toast notifications for user feedback
- Query validation and warnings

## Dependencies Added

The following dependencies were added to support these components:

```json
{
  "react-day-picker": "^9.11.0",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-slider": "^1.3.6",
  "@radix-ui/react-separator": "^1.1.7"
}
```

## Next Steps

1. **Testing**: Add comprehensive unit tests for all components
2. **Documentation**: Create Storybook stories for component showcase
3. **Performance**: Add virtual scrolling for large datasets
4. **Accessibility**: Conduct accessibility audit and improvements
5. **Mobile**: Optimize mobile experience and touch interactions

## Example Implementation

See `search-example.tsx` for a complete implementation example that demonstrates how all components work together in a real search interface.
