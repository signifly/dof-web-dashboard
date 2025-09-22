/**
 * Result Pattern Implementation
 * Provides type-safe error handling without exceptions
 */

export type Success<T> = { data: T; error: null }
export type Failure<E> = { data: null; error: E }
export type Result<T, E = Error> = Success<T> | Failure<E>

/**
 * Wraps a promise in a try/catch and returns a Result type
 * Prevents the need to throw exceptions in business logic
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}

/**
 * Wraps a synchronous operation that might throw
 */
export function trySync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}

/**
 * Type guards for Result pattern
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.error === null
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.error !== null
}

/**
 * Utility to unwrap a Result, throwing if it's an error
 * Use sparingly, prefer pattern matching with isSuccess/isFailure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isFailure(result)) {
    throw result.error
  }
  return result.data
}

/**
 * Utility to unwrap a Result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isFailure(result)) {
    return defaultValue
  }
  return result.data
}

/**
 * Maps over the success value of a Result
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isFailure(result)) {
    return result
  }
  return { data: fn(result.data), error: null }
}

/**
 * Maps over the error value of a Result
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isSuccess(result)) {
    return result
  }
  return { data: null, error: fn(result.error) }
}
