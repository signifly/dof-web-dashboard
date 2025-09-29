/**
 * Result type for better error handling
 *
 * This implements the preferred error handling pattern where functions return
 * a Result type instead of throwing exceptions. This makes error handling
 * explicit and type-safe.
 */

export type Success<T> = { data: T; error: null }
export type Failure<E> = { data: null; error: E }
export type Result<T, E = string> = Success<T> | Failure<E>

/**
 * Utility function to wrap async operations in Result pattern
 */
export async function tryCatch<T, E = string>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: (error instanceof Error ? error.message : String(error)) as E,
    }
  }
}

/**
 * Utility function to wrap sync operations in Result pattern
 */
export function tryCatchSync<T, E = string>(fn: () => T): Result<T, E> {
  try {
    const data = fn()
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: (error instanceof Error ? error.message : String(error)) as E,
    }
  }
}

/**
 * Helper to check if a result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.error === null
}

/**
 * Helper to check if a result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.error !== null
}

/**
 * Map over the data of a successful result
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return { data: fn(result.data), error: null }
  }
  return result
}

/**
 * Chain results together (flatMap)
 */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.data)
  }
  return result
}
