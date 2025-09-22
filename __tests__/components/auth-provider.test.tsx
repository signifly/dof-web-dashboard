import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/components/auth/auth-provider"

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.email}` : "Not logged in"}
      </div>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
    </div>
  )
}

describe("AuthProvider", () => {
  it("should provide authentication context to children", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially shows loading
    expect(screen.getByText("Loading...")).toBeInTheDocument()

    // After loading, shows not logged in state
    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent(
        "Not logged in"
      )
    })

    // Sign out button should be present
    expect(screen.getByTestId("sign-out")).toBeInTheDocument()
  })

  it("should throw error when useAuth is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useAuth must be used within an AuthProvider")

    consoleSpy.mockRestore()
  })
})
