import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "@/components/auth/login-form"

// Mock the Supabase client
const mockSignInWithPassword = jest.fn()
const mockSignInWithOAuth = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render login form elements", () => {
    render(<LoginForm />)

    expect(
      screen.getByText("Sign in to DOF Dashboard")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Continue with Google" })
    ).toBeInTheDocument()
  })

  it("should show validation errors for invalid inputs", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const submitButton = screen.getByRole("button", { name: "Sign in" })

    // Submit form with invalid email
    await user.type(emailInput, "invalid-email")
    await user.type(passwordInput, "123") // Too short
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address.")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Password must be at least 6 characters.")
      ).toBeInTheDocument()
    })
  })

  it("should call signInWithPassword on form submission", async () => {
    const user = userEvent.setup()
    mockSignInWithPassword.mockResolvedValue({ error: null })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const submitButton = screen.getByRole("button", { name: "Sign in" })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
    })
  })

  it("should display error message on authentication failure", async () => {
    const user = userEvent.setup()
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const submitButton = screen.getByRole("button", { name: "Sign in" })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "wrongpassword")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
    })
  })

  it("should call signInWithOAuth on Google button click", async () => {
    const user = userEvent.setup()
    mockSignInWithOAuth.mockResolvedValue({ error: null })

    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
    })

    render(<LoginForm />)

    const googleButton = screen.getByRole("button", {
      name: "Continue with Google",
    })
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      })
    })
  })
})