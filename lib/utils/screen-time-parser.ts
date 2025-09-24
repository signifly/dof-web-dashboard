import { Json } from "@/types/database"
import { ScreenTimeContext } from "@/types/route-performance"

/**
 * Enhanced screen time context parsing with fallbacks
 */
export function parseScreenTimeContext(
  context: Json
): ScreenTimeContext | null {
  if (!context || typeof context !== "object") {
    return null
  }

  const ctx = context as any

  // Primary: Full screen_time context
  if (
    ctx.segments &&
    Array.isArray(ctx.segments) &&
    ctx.routeName &&
    ctx.routePath &&
    typeof ctx.screenStartTime === "number"
  ) {
    return {
      segments: ctx.segments,
      routeName: ctx.routeName,
      routePath: ctx.routePath,
      screenStartTime: ctx.screenStartTime,
    }
  }

  // Fallback: Try to extract from nested structure
  if (ctx.screen_time) {
    const screenTime = ctx.screen_time
    if (
      screenTime.segments &&
      screenTime.routeName &&
      screenTime.routePath &&
      screenTime.screenStartTime
    ) {
      return {
        segments: screenTime.segments,
        routeName: screenTime.routeName,
        routePath: screenTime.routePath,
        screenStartTime: screenTime.screenStartTime,
      }
    }
  }

  return null
}

/**
 * Extract screen name from context with multiple fallback strategies
 */
export function extractScreenName(context: Json): string {
  if (!context || typeof context !== "object") {
    return "Unknown"
  }

  const ctx = context as any

  // Strategy 1: Try screen_time context first
  const screenTimeCtx = parseScreenTimeContext(context)
  if (screenTimeCtx) {
    return screenTimeCtx.routeName
  }

  // Strategy 2: Direct screen_name property
  if (ctx.screen_name && typeof ctx.screen_name === "string") {
    return ctx.screen_name
  }

  // Strategy 3: Route name from nested structures
  if (ctx.routeName && typeof ctx.routeName === "string") {
    return ctx.routeName
  }

  // Strategy 4: Route path as screen name
  if (ctx.routePath && typeof ctx.routePath === "string") {
    return ctx.routePath
  }

  // Strategy 5: Navigation context
  if (ctx.navigation && ctx.navigation.screen_name) {
    return ctx.navigation.screen_name
  }

  // Strategy 6: Any screen-related property
  if (ctx.screen && typeof ctx.screen === "string") {
    return ctx.screen
  }

  return "Unknown"
}

/**
 * Extract route path from context
 */
export function extractRoutePath(context: Json): string | null {
  const screenTimeCtx = parseScreenTimeContext(context)
  if (screenTimeCtx) {
    return screenTimeCtx.routePath
  }

  const ctx = context as any
  if (ctx.routePath && typeof ctx.routePath === "string") {
    return ctx.routePath
  }

  return null
}

/**
 * Extract route segments from context
 */
export function extractRouteSegments(context: Json): string[] {
  const screenTimeCtx = parseScreenTimeContext(context)
  if (screenTimeCtx && screenTimeCtx.segments) {
    return screenTimeCtx.segments
  }

  const ctx = context as any
  if (ctx.segments && Array.isArray(ctx.segments)) {
    return ctx.segments
  }

  return []
}

/**
 * Determine if a route is dynamic (contains parameters)
 */
export function isDynamicRoute(context: Json): boolean {
  const routePath = extractRoutePath(context)
  const segments = extractRouteSegments(context)

  if (!routePath || !segments.length) {
    return false
  }

  // Check if route path contains dynamic segments
  return routePath.includes("[") && routePath.includes("]")
}

/**
 * Get normalized route pattern for grouping
 */
export function getNormalizedRoutePattern(context: Json): string {
  const routePath = extractRoutePath(context)
  const segments = extractRouteSegments(context)

  if (!routePath) {
    return extractScreenName(context)
  }

  // If we have segments, use them to normalize dynamic parts
  if (segments.length > 0) {
    return normalizeRoutePattern(routePath, segments)
  }

  return routePath
}

/**
 * Normalize route pattern by replacing dynamic segments
 */
function normalizeRoutePattern(routePath: string, segments: string[]): string {
  let pattern = routePath

  for (const segment of segments) {
    // Skip already normalized segments
    if (segment.startsWith("[") && segment.endsWith("]")) {
      continue
    }

    if (isDynamicSegment(segment, routePath)) {
      // Replace exact segment match with [id]
      const segmentRegex = new RegExp(`/${escapeRegExp(segment)}(?=/|$)`, "g")
      pattern = pattern.replace(segmentRegex, "/[id]")
    }
  }

  return pattern
}

/**
 * Check if a segment is dynamic
 */
function isDynamicSegment(segment: string, _routePath: string): boolean {
  // Already normalized segments
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return false
  }

  const commonStaticSegments = [
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
    "details",
    "edit",
    "create",
    "view",
    "session",
    "app",
    "user",
    "product",
    "item",
    "devices",
    "metrics",
    "analytics",
    "insights",
    "search",
    "routes",
  ]

  if (commonStaticSegments.includes(segment.toLowerCase())) {
    return false
  }

  // UUID pattern
  if (/^[a-f0-9-]{36}$/i.test(segment)) {
    return true
  }

  // Numeric pattern
  if (/^\d+$/.test(segment)) {
    return true
  }

  // Long alphanumeric strings (likely IDs)
  if (/^[a-zA-Z0-9-_]{10,}$/.test(segment)) {
    return true
  }

  return false
}

/**
 * Escape string for use in regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Get screen duration from screen time context
 */
export function getScreenDuration(
  context: Json,
  currentTime?: number
): number | null {
  const screenTimeCtx = parseScreenTimeContext(context)
  if (!screenTimeCtx) {
    return null
  }

  const startTime = screenTimeCtx.screenStartTime
  const endTime = currentTime || Date.now()

  return endTime - startTime
}

/**
 * Enhanced route information for display
 */
export interface EnhancedRouteInfo {
  screenName: string
  routePath: string | null
  routePattern: string
  segments: string[]
  isDynamic: boolean
  duration: number | null
  displayName: string
}

/**
 * Get comprehensive route information from context
 */
export function getEnhancedRouteInfo(
  context: Json,
  currentTime?: number
): EnhancedRouteInfo {
  const screenName = extractScreenName(context)
  const routePath = extractRoutePath(context)
  const segments = extractRouteSegments(context)
  const routePattern = getNormalizedRoutePattern(context)
  const isDynamic = isDynamicRoute(context)
  const duration = getScreenDuration(context, currentTime)

  // Create a user-friendly display name
  let displayName = screenName
  if (routePath && routePath !== screenName) {
    // If we have a clean route path, use it
    if (routePath.split("/").length <= 3) {
      displayName = routePath
    } else {
      // For complex paths, use the last meaningful segment
      const pathSegments = routePath.split("/").filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1]
      if (lastSegment && !isDynamicSegment(lastSegment, routePath)) {
        displayName = lastSegment
      }
    }
  }

  // Capitalize and format display name
  displayName = displayName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())

  return {
    screenName,
    routePath,
    routePattern,
    segments,
    isDynamic,
    duration,
    displayName,
  }
}
