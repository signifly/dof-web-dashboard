import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdvancedSearchForm } from "@/components/search/advanced-search-form"
import { SearchQuery } from "@/lib/services/search-service"

// Mock the search service
jest.mock("@/lib/services/search-service", () => ({
  searchService: {
    search: jest.fn(),
    getFilterOptions: jest.fn(() =>
      Promise.resolve({
        platforms: ["android", "ios"],
        devices: ["device-1", "device-2"],
        appVersions: ["1.0.0", "1.1.0"],
        metricTypes: ["fps", "memory_usage"],
      })
    ),
    getSuggestions: jest.fn(() => Promise.resolve([])),
  },
}))

// Mock react-hook-form
jest.mock("react-hook-form", () => ({
  ...jest.requireActual("react-hook-form"),
  useForm: () => ({
    control: {},
    handleSubmit: (fn: any) => (e: any) => {
      e.preventDefault()
      fn({
        text: "test query",
        platforms: ["android"],
        dateRange: null,
        metrics: {},
      })
    },
    formState: { errors: {} },
    setValue: jest.fn(),
    getValues: jest.fn(() => ({})),
    reset: jest.fn(),
    watch: jest.fn(),
  }),
}))

// Mock shadcn components
jest.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <form>{children}</form>
  ),
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FormDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FormField: ({ render }: { render: any }) =>
    render({ field: { onChange: jest.fn(), value: "" } }),
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FormLabel: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
  FormMessage: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}))

describe("AdvancedSearchForm", () => {
  const mockOnSearch = jest.fn()
  const mockSearchService =
    require("@/lib/services/search-service").searchService

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchService.search.mockResolvedValue({
      metrics: [],
      sessions: [],
      total: 0,
      hasMore: false,
      facets: {
        metricTypes: [],
        platforms: [],
        appVersions: [],
        devices: [],
      },
      executionTime: 100,
    })
  })

  it("should render basic search form", () => {
    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    expect(screen.getByText("Search Query")).toBeInTheDocument()
    expect(screen.getByText("Search")).toBeInTheDocument()
  })

  it("should call onSearch when form is submitted", async () => {
    const user = userEvent.setup()
    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    const searchButton = screen.getByText("Search")
    await user.click(searchButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled()
    })
  })

  it("should support auto-search mode", () => {
    render(<AdvancedSearchForm onSearch={mockOnSearch} autoSearch={true} />)

    // Auto-search should be enabled
    expect(screen.getByText("Auto-search enabled")).toBeInTheDocument()
  })

  it("should display search preview when enabled", () => {
    render(<AdvancedSearchForm onSearch={mockOnSearch} showPreview={true} />)

    expect(screen.getByText("Search Preview")).toBeInTheDocument()
  })

  it("should handle initial query prop", () => {
    const initialQuery: SearchQuery = {
      text: "initial search",
      platforms: ["android"],
      limit: 20,
    }

    render(
      <AdvancedSearchForm onSearch={mockOnSearch} initialQuery={initialQuery} />
    )

    // Form should be populated with initial values
    // Note: This would need actual form integration to test fully
  })

  it("should expand/collapse advanced filters", async () => {
    const user = userEvent.setup()
    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    const advancedButton = screen.getByText("Advanced Filters")
    await user.click(advancedButton)

    // Advanced section should be visible
    expect(screen.getByText("Device Filters")).toBeInTheDocument()
    expect(screen.getByText("Performance Filters")).toBeInTheDocument()
    expect(screen.getByText("Time Range")).toBeInTheDocument()
  })

  it("should handle form validation errors", () => {
    // Mock form with validation errors
    const mockUseForm = require("react-hook-form").useForm
    mockUseForm.mockReturnValue({
      control: {},
      handleSubmit: jest.fn(),
      formState: {
        errors: {
          text: { message: "Search query is required" },
          limit: { message: "Limit must be between 1 and 1000" },
        },
      },
      setValue: jest.fn(),
      getValues: jest.fn(),
      reset: jest.fn(),
      watch: jest.fn(),
    })

    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    expect(screen.getByText("Search query is required")).toBeInTheDocument()
    expect(
      screen.getByText("Limit must be between 1 and 1000")
    ).toBeInTheDocument()
  })

  it("should handle loading state", () => {
    mockSearchService.search.mockReturnValue(new Promise(() => {})) // Never resolves

    render(<AdvancedSearchForm onSearch={mockOnSearch} autoSearch={true} />)

    // Loading state should be visible
    expect(screen.getByText("Searching...")).toBeInTheDocument()
  })

  it("should reset form when reset button is clicked", async () => {
    const user = userEvent.setup()
    const mockReset = jest.fn()

    const mockUseForm = require("react-hook-form").useForm
    mockUseForm.mockReturnValue({
      control: {},
      handleSubmit: jest.fn(),
      formState: { errors: {} },
      setValue: jest.fn(),
      getValues: jest.fn(),
      reset: mockReset,
      watch: jest.fn(),
    })

    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    const resetButton = screen.getByText("Reset")
    await user.click(resetButton)

    expect(mockReset).toHaveBeenCalled()
  })

  it("should handle search service errors", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    mockSearchService.search.mockRejectedValue(new Error("Search failed"))

    render(<AdvancedSearchForm onSearch={mockOnSearch} autoSearch={true} />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Search error:",
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it("should load filter options on mount", async () => {
    render(<AdvancedSearchForm onSearch={mockOnSearch} />)

    await waitFor(() => {
      expect(mockSearchService.getFilterOptions).toHaveBeenCalled()
    })
  })

  it("should display result count in search preview", async () => {
    mockSearchService.search.mockResolvedValue({
      metrics: [],
      sessions: [],
      total: 42,
      hasMore: false,
      facets: {
        metricTypes: [],
        platforms: [],
        appVersions: [],
        devices: [],
      },
      executionTime: 150,
    })

    render(
      <AdvancedSearchForm
        onSearch={mockOnSearch}
        showPreview={true}
        autoSearch={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Found 42 results")).toBeInTheDocument()
      expect(screen.getByText("(150ms)")).toBeInTheDocument()
    })
  })

  it("should handle preset application", () => {
    const mockSetValue = jest.fn()

    const mockUseForm = require("react-hook-form").useForm
    mockUseForm.mockReturnValue({
      control: {},
      handleSubmit: jest.fn(),
      formState: { errors: {} },
      setValue: mockSetValue,
      getValues: jest.fn(),
      reset: jest.fn(),
      watch: jest.fn(),
    })

    const preset: SearchQuery = {
      text: "preset search",
      platforms: ["ios"],
      metrics: { fps: { min: 30, max: 60 } },
    }

    render(
      <AdvancedSearchForm
        onSearch={mockOnSearch}
        initialQuery={preset}
      />
    )
  })
})
