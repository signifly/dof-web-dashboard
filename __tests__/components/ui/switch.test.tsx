import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Switch } from "@/components/ui/switch"

describe("Switch", () => {
  it("should render correctly", () => {
    render(<Switch />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).not.toBeChecked()
  })

  it("should be checked when checked prop is true", () => {
    render(<Switch checked={true} />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toBeChecked()
  })

  it("should call onCheckedChange when clicked", async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<Switch onCheckedChange={onCheckedChange} />)

    const switchElement = screen.getByRole("switch")
    await user.click(switchElement)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("should be disabled when disabled prop is true", () => {
    render(<Switch disabled={true} />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toBeDisabled()
  })

  it("should not call onCheckedChange when disabled and clicked", async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<Switch disabled={true} onCheckedChange={onCheckedChange} />)

    const switchElement = screen.getByRole("switch")
    await user.click(switchElement)

    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it("should apply custom className", () => {
    render(<Switch className="custom-class" />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toHaveClass("custom-class")
  })

  it("should forward ref correctly", () => {
    const ref = jest.fn()
    render(<Switch ref={ref} />)

    expect(ref).toHaveBeenCalled()
  })

  it("should handle keyboard interaction", async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<Switch onCheckedChange={onCheckedChange} />)

    const switchElement = screen.getByRole("switch")
    switchElement.focus()

    // Press Space to toggle
    await user.keyboard(" ")

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("should handle Enter key", async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    render(<Switch onCheckedChange={onCheckedChange} />)

    const switchElement = screen.getByRole("switch")
    switchElement.focus()

    // Press Enter to toggle
    await user.keyboard("{Enter}")

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("should toggle between checked and unchecked states", async () => {
    const user = userEvent.setup()
    const onCheckedChange = jest.fn()

    const { rerender } = render(
      <Switch checked={false} onCheckedChange={onCheckedChange} />
    )

    const switchElement = screen.getByRole("switch")
    expect(switchElement).not.toBeChecked()

    await user.click(switchElement)
    expect(onCheckedChange).toHaveBeenCalledWith(true)

    // Simulate parent component updating the checked state
    rerender(<Switch checked={true} onCheckedChange={onCheckedChange} />)

    expect(switchElement).toBeChecked()

    await user.click(switchElement)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it("should be accessible with aria attributes", () => {
    render(<Switch aria-label="Toggle setting" />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toHaveAttribute("aria-label", "Toggle setting")
  })

  it("should have proper focus styles", () => {
    render(<Switch />)

    const switchElement = screen.getByRole("switch")
    switchElement.focus()

    // The switch should be focusable and have focus styles
    expect(switchElement).toHaveFocus()
    expect(switchElement).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
      "focus-visible:ring-offset-2"
    )
  })

  it("should have correct size styles", () => {
    render(<Switch />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toHaveClass("h-6", "w-11")
  })

  it("should handle controlled vs uncontrolled mode", async () => {
    const user = userEvent.setup()

    // Uncontrolled mode
    const { rerender } = render(<Switch />)
    const switchElement = screen.getByRole("switch")

    await user.click(switchElement)
    // In uncontrolled mode, the component manages its own state

    // Controlled mode
    const onCheckedChange = jest.fn()
    rerender(<Switch checked={false} onCheckedChange={onCheckedChange} />)

    await user.click(switchElement)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
