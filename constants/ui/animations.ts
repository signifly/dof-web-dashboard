/**
 * UI Animations - Animation configurations and easing functions
 *
 * These constants define animation settings used throughout the application.
 * Note: ANIMATION_DURATIONS are defined in constants/time/durations.ts
 */

// Export animation durations from time constants for convenience
export { ANIMATION_DURATIONS } from "../time/durations"

// Easing functions for animations
export const EASING_FUNCTIONS = {
  EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
  EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
  EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  LINEAR: "linear",
} as const

// Animation states
export const ANIMATION_STATES = {
  INITIAL: "initial",
  ANIMATE: "animate",
  EXIT: "exit",
} as const

export type EasingFunctions = typeof EASING_FUNCTIONS
export type AnimationStates = typeof ANIMATION_STATES
