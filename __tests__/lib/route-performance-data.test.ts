import {
  parseScreenTimeContext,
  normalizeRoutePattern,
} from "@/lib/route-performance-data"
import { Json } from "@/types/database"

describe("parseScreenTimeContext", () => {
  it("should parse valid screen time context", () => {
    const context: Json = {
      segments: ["home", "[id]", "game-bird-name", "game"],
      routeName: "game",
      routePath: "/home/spurvehog/game-bird-name/game",
      screenStartTime: 1758623560828,
    }

    const result = parseScreenTimeContext(context)

    expect(result).toEqual({
      segments: ["home", "[id]", "game-bird-name", "game"],
      routeName: "game",
      routePath: "/home/spurvehog/game-bird-name/game",
      screenStartTime: 1758623560828,
    })
  })

  it("should return null for invalid context", () => {
    expect(parseScreenTimeContext(null)).toBeNull()
    expect(parseScreenTimeContext("invalid")).toBeNull()
    expect(parseScreenTimeContext({})).toBeNull()
    expect(parseScreenTimeContext({ segments: "not-array" })).toBeNull()
  })

  it("should return null for missing required fields", () => {
    const incompleteContext: Json = {
      segments: ["home", "game"],
      routeName: "game",
      // missing routePath and screenStartTime
    }

    expect(parseScreenTimeContext(incompleteContext)).toBeNull()
  })

  it("should validate screenStartTime is a number", () => {
    const invalidContext: Json = {
      segments: ["home", "game"],
      routeName: "game",
      routePath: "/home/game",
      screenStartTime: "not-a-number",
    }

    expect(parseScreenTimeContext(invalidContext)).toBeNull()
  })
})

describe("normalizeRoutePattern", () => {
  it("should normalize route patterns with dynamic segments", () => {
    const testCases = [
      {
        routePath: "/home/spurvehog/game-bird-name/game",
        segments: ["home", "spurvehog", "game-bird-name", "game"],
        expected: "/home/[id]/game-bird-name/game",
      },
      {
        routePath: "/user/12345/profile",
        segments: ["user", "12345", "profile"],
        expected: "/user/[id]/profile",
      },
      {
        routePath: "/product/abc123def456/details",
        segments: ["product", "abc123def456", "details"],
        expected: "/product/[id]/details",
      },
    ]

    testCases.forEach(({ routePath, segments, expected }) => {
      const result = normalizeRoutePattern(routePath, segments)
      expect(result).toBe(expected)
    })
  })

  it("should preserve static segments", () => {
    const routePath = "/home/dashboard/settings"
    const segments = ["home", "dashboard", "settings"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/home/dashboard/settings")
  })

  it("should handle already normalized patterns", () => {
    const routePath = "/home/[id]/game-bird-name/game"
    const segments = ["home", "[id]", "game-bird-name", "game"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/home/[id]/game-bird-name/game")
  })

  it("should detect UUID-like segments as dynamic", () => {
    const routePath = "/session/550e8400-e29b-41d4-a716-446655440000/view"
    const segments = ["session", "550e8400-e29b-41d4-a716-446655440000", "view"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/session/[id]/view")
  })

  it("should detect numeric segments as dynamic", () => {
    const routePath = "/item/123456/edit"
    const segments = ["item", "123456", "edit"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/item/[id]/edit")
  })

  it("should preserve known static segments", () => {
    const knownStaticSegments = [
      "home",
      "dashboard",
      "settings",
      "profile",
      "about",
      "contact",
      "game",
      "menu",
      "list",
      "detail",
      "edit",
      "create",
      "view",
    ]

    knownStaticSegments.forEach(segment => {
      const routePath = `/prefix/${segment}/suffix`
      const segments = ["prefix", segment, "suffix"]

      const result = normalizeRoutePattern(routePath, segments)

      expect(result).toBe(`/prefix/${segment}/suffix`)
    })
  })

  it("should handle empty segments array", () => {
    const routePath = "/some/path"
    const segments: string[] = []

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/some/path")
  })

  it("should handle complex mixed patterns", () => {
    const routePath = "/app/user123/dashboard/item/abc-def-123/details"
    const segments = [
      "app",
      "user123",
      "dashboard",
      "item",
      "abc-def-123",
      "details",
    ]

    const result = normalizeRoutePattern(routePath, segments)

    // user123 and abc-def-123 should be detected as dynamic
    expect(result).toBe("/app/[id]/dashboard/item/[id]/details")
  })
})

describe("route performance edge cases", () => {
  it("should handle special characters in route paths", () => {
    const routePath = "/search?query=test&filter=active"
    const segments = ["search"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/search?query=test&filter=active")
  })

  it("should handle route paths with trailing slashes", () => {
    const routePath = "/home/user123/"
    const segments = ["home", "user123"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/home/[id]/")
  })

  it("should handle single segment routes", () => {
    const routePath = "/dashboard"
    const segments = ["dashboard"]

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/dashboard")
  })

  it("should handle root route", () => {
    const routePath = "/"
    const segments: string[] = []

    const result = normalizeRoutePattern(routePath, segments)

    expect(result).toBe("/")
  })
})
