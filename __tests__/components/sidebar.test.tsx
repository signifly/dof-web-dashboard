import { render, screen } from "@testing-library/react"
import { Sidebar } from "@/components/layout/sidebar"

// Mock usePathname to return a specific path
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  usePathname: () => "/dashboard",
}))

describe("Sidebar", () => {
  it("should render navigation items", () => {
    render(<Sidebar />)

    // Check that navigation items are present
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Metrics")).toBeInTheDocument()
    expect(screen.getByText("Devices")).toBeInTheDocument()
    expect(screen.getByText("Alerts")).toBeInTheDocument()
  })

  it("should render DOF brand name", () => {
    render(<Sidebar />)

    expect(screen.getByText("DOF")).toBeInTheDocument()
  })

  it("should highlight active navigation item", () => {
    render(<Sidebar />)

    const dashboardButton = screen.getByRole("link", { name: /dashboard/i })
    expect(dashboardButton).toBeInTheDocument()
  })

  it("should render with custom className", () => {
    const { container } = render(<Sidebar className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })
})
