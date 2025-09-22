import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  }),
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  }),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key"
