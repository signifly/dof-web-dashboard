import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RefreshSettings } from "@/components/settings/refresh-settings"

// Mock the refresh config utilities
jest.mock("@/lib/utils/refresh-config", () => ({
  ...jest.requireActual("@/lib/utils/refresh-config"),
  loadRefreshConfig: jest.fn(() => ({
    active: 30000,
    summary: 300000,
    background: 600000,
    interactive: 60000,
  })),
  saveRefreshConfig: jest.fn(),
}))

const mockLoadRefreshConfig = require("@/lib/utils/refresh-config")
  .loadRefreshConfig as jest.Mock
const mockSaveRefreshConfig = require("@/lib/utils/refresh-config")
  .saveRefreshConfig as jest.Mock

describe("RefreshSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoadRefreshConfig.mockReturnValue({
      active: 30000,
      summary: 300000,
      background: 600000,
      interactive: 60000,
    })
  })

  it("should render intervals section by default", () => {
    render(<RefreshSettings />)

    expect(screen.getByText("Refresh Intervals")).toBeInTheDocument()
    expect(screen.getByLabelText("Active Data Refresh")).toBeInTheDocument()
    expect(screen.getByLabelText("Summary Data Refresh")).toBeInTheDocument()
    expect(screen.getByLabelText("Background Refresh")).toBeInTheDocument()
    expect(screen.getByLabelText("Interactive Refresh")).toBeInTheDocument()
  })

  it("should render only specified sections", () => {
    render(<RefreshSettings sections={["intervals"]} />)

    expect(screen.getByText("Refresh Intervals")).toBeInTheDocument()
    expect(screen.queryByText("Global Settings")).not.toBeInTheDocument()
  })

  it("should load initial values from config", () => {
    render(<RefreshSettings />)

    // Check that inputs show the correct values (30 seconds = 30)
    expect(screen.getByDisplayValue("30")).toBeInTheDocument() // Active
    expect(screen.getByDisplayValue("300")).toBeInTheDocument() // Summary (5 minutes = 300 seconds)
    expect(screen.getByDisplayValue("600")).toBeInTheDocument() // Background (10 minutes = 600 seconds)
    expect(screen.getByDisplayValue("60")).toBeInTheDocument() // Interactive (1 minute = 60 seconds)
  })

  it("should update values and save to config", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const activeInput = screen.getByLabelText("Active Data Refresh")

    // Clear and type new value
    await user.clear(activeInput)
    await user.type(activeInput, "45")

    // Should save the new value (45 seconds = 45000ms)
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      active: 45000,
    })
  })

  it("should handle invalid input values", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const activeInput = screen.getByLabelText("Active Data Refresh")

    // Try to enter invalid value
    await user.clear(activeInput)
    await user.type(activeInput, "0")

    // Should enforce minimum value of 1 second
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      active: 1000,
    })
  })

  it("should render compact mode", () => {
    const { container } = render(<RefreshSettings compact={true} />)

    // In compact mode, spacing should be smaller
    expect(container.querySelector(".space-y-3")).toBeInTheDocument()
    expect(container.querySelector(".space-y-6")).not.toBeInTheDocument()
  })

  it("should render global settings section", () => {
    render(<RefreshSettings sections={["global"]} />)

    expect(screen.getByText("Global Settings")).toBeInTheDocument()
    expect(screen.getByLabelText("Pause on User Interaction")).toBeInTheDocument()
    expect(screen.getByLabelText("Auto-refresh Enabled")).toBeInTheDocument()
  })

  it("should handle switch toggles in global settings", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings sections={["global"]} />)

    const pauseSwitch = screen.getByLabelText("Pause on User Interaction")

    // Initial state should be checked (true)
    expect(pauseSwitch).toBeChecked()

    // Toggle the switch
    await user.click(pauseSwitch)

    // Should save the new value
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      pauseOnInteraction: false,
    })
  })

  it("should render both sections when specified", () => {
    render(<RefreshSettings sections={["intervals", "global"]} />)

    expect(screen.getByText("Refresh Intervals")).toBeInTheDocument()
    expect(screen.getByText("Global Settings")).toBeInTheDocument()
  })

  it("should format time values correctly", () => {
    // Test with different config values
    mockLoadRefreshConfig.mockReturnValue({
      active: 45000, // 45 seconds
      summary: 450000, // 7.5 minutes (450 seconds)
      background: 900000, // 15 minutes (900 seconds)
      interactive: 90000, // 1.5 minutes (90 seconds)
    })

    render(<RefreshSettings />)

    expect(screen.getByDisplayValue("45")).toBeInTheDocument()
    expect(screen.getByDisplayValue("450")).toBeInTheDocument()
    expect(screen.getByDisplayValue("900")).toBeInTheDocument()
    expect(screen.getByDisplayValue("90")).toBeInTheDocument()
  })

  it("should handle edge case values", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const activeInput = screen.getByLabelText("Active Data Refresh")

    // Test very large value
    await user.clear(activeInput)
    await user.type(activeInput, "99999")

    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      active: 99999000, // 99999 seconds = 99999000ms
    })
  })

  it("should validate minimum values for all interval inputs", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const summaryInput = screen.getByLabelText("Summary Data Refresh")

    // Try to enter zero
    await user.clear(summaryInput)
    await user.type(summaryInput, "0")

    // Should enforce minimum of 1 second
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      summary: 1000,
    })
  })

  it("should handle localStorage errors gracefully", () => {
    // Mock saveRefreshConfig to throw an error
    mockSaveRefreshConfig.mockImplementation(() => {
      throw new Error("localStorage error")
    })

    // Should not crash when saving fails
    expect(() => render(<RefreshSettings />)).not.toThrow()
  })

  it("should preserve other config values when updating single value", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const activeInput = screen.getByLabelText("Active Data Refresh")

    await user.clear(activeInput)
    await user.type(activeInput, "60")

    // Should only update the active value, not overwrite others
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      active: 60000,
    })

    // Should not include other values in the save call
    expect(mockSaveRefreshConfig).not.toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.any(Number),
        background: expect.any(Number),
        interactive: expect.any(Number),
      })
    )
  })

  it("should handle non-numeric input gracefully", async () => {
    const user = userEvent.setup()
    render(<RefreshSettings />)

    const activeInput = screen.getByLabelText("Active Data Refresh")

    // Try to enter letters
    await user.clear(activeInput)
    await user.type(activeInput, "abc")

    // Should handle invalid input gracefully (likely converts to 0, then to minimum 1)
    expect(mockSaveRefreshConfig).toHaveBeenCalledWith({
      active: 1000,
    })
  })

  it("should apply custom className", () => {
    const { container } = render(
      <RefreshSettings className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("should show help text for each setting", () => {
    render(<RefreshSettings />)

    expect(
      screen.getByText(/How often to refresh active, real-time data/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/How often to refresh summary and aggregated data/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/How often to refresh when tab is not active/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/How often to refresh when user is actively interacting/)
    ).toBeInTheDocument()
  })

  it("should load global settings from localStorage", () => {
    // Mock localStorage with global settings
    const mockGlobalSettings = {
      pauseOnInteraction: false,
      autoRefreshEnabled: false,
    }

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) => {
          if (key === "dof-refresh-preferences") {
            return JSON.stringify(mockGlobalSettings)
          }
          return null
        }),
        setItem: jest.fn(),
      },
      writable: true,
    })

    render(<RefreshSettings sections={["global"]} />)

    const pauseSwitch = screen.getByLabelText("Pause on User Interaction")
    const autoRefreshSwitch = screen.getByLabelText("Auto-refresh Enabled")

    expect(pauseSwitch).not.toBeChecked()
    expect(autoRefreshSwitch).not.toBeChecked()
  })
})