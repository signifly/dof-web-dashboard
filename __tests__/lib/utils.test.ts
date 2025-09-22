import { cn } from "@/lib/utils"

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("should handle conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar")
  })

  it("should handle undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
  })

  it("should merge Tailwind classes correctly", () => {
    expect(cn("p-2 p-4")).toBe("p-4")
  })

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo")
  })

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar")
  })
})
