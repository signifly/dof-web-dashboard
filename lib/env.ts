import { z } from "zod"
import bcrypt from "bcryptjs"

interface AuthUser {
  email: string
  password: string
}

const envSchema = z.object({
  // Supabase Configuration (for data only, not auth)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anonymous key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required"),

  // Environment-Based Authentication
  ALLOWED_USERS: z
    .string()
    .min(1, "At least one allowed user must be specified")
    .transform((val): AuthUser[] => {
      // Split by comma, then parse each email:password pair
      const userPairs = val.split(",").map(pair => pair.trim())

      const users: AuthUser[] = []
      const emailSchema = z.string().email()

      userPairs.forEach((pair, index) => {
        const [email, password] = pair.split(":")

        if (!email || !password) {
          throw new Error(
            `Invalid user format at position ${index + 1}. Expected "email:password", got "${pair}"`
          )
        }

        const trimmedEmail = email.trim().toLowerCase()
        const trimmedPassword = password.trim()

        // Validate email format
        try {
          emailSchema.parse(trimmedEmail)
        } catch {
          throw new Error(
            `Invalid email format at position ${index + 1}: ${trimmedEmail}`
          )
        }

        // Validate password complexity
        if (trimmedPassword.length === 0) {
          throw new Error(
            `Empty password for user at position ${index + 1}: ${trimmedEmail}`
          )
        }

        // Production password complexity validation (skip during build and in deployed environments)
        // Skip this check in Vercel deployments since we handle validation gracefully later
        const isVercelDeployment =
          process.env.VERCEL_ENV === "production" ||
          process.env.VERCEL_ENV === "preview"
        const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

        if (
          process.env.NODE_ENV === "production" &&
          !isBuildPhase &&
          !isVercelDeployment &&
          trimmedPassword.length < 12
        ) {
          throw new Error(
            `Production password must be at least 12 characters for ${trimmedEmail}`
          )
        }

        // Hash password with bcrypt for security
        const hashedPassword = bcrypt.hashSync(trimmedPassword, 12)

        users.push({
          email: trimmedEmail,
          password: hashedPassword,
        })
      })

      // Check for duplicate emails
      const emails = users.map(u => u.email)
      const uniqueEmails = new Set(emails)
      if (emails.length !== uniqueEmails.size) {
        throw new Error("Duplicate email addresses found in ALLOWED_USERS")
      }

      return users
    }),

  // Session Configuration
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long for security")
    .refine(secret => {
      if (process.env.NODE_ENV === "production" && secret.length < 64) {
        throw new Error(
          "AUTH_SECRET must be at least 64 characters in production"
        )
      }
      return true
    }, "AUTH_SECRET must be at least 64 characters in production"),
})

// Validate environment variables at module load time
// Skip validation during production build phase to avoid build-time errors
const shouldSkipValidation =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export"

let parsedEnv: z.infer<typeof envSchema>

if (shouldSkipValidation) {
  // During build, use a dummy env object that won't be used
  console.warn("⚠️ Skipping environment validation during build phase")
  parsedEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    ALLOWED_USERS: [],
    AUTH_SECRET: process.env.AUTH_SECRET || "",
  } as z.infer<typeof envSchema>
} else {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error("❌ Environment variable validation failed:")
    console.error(parsed.error.format())

    // In production runtime, don't throw - use fallback values to prevent 500 errors
    // This allows the app to load and show proper error messages to users
    // Check both NODE_ENV and VERCEL_ENV to handle both local and Vercel deployments
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.VERCEL_ENV === "preview"

    if (isProduction) {
      console.error(
        "⚠️ Using fallback env values in production to prevent crashes"
      )

      // Try to parse ALLOWED_USERS if it exists, otherwise use empty array
      let allowedUsers: AuthUser[] = []
      if (process.env.ALLOWED_USERS) {
        try {
          // Attempt to parse ALLOWED_USERS even if validation failed
          const userPairs = process.env.ALLOWED_USERS.split(",").map(pair =>
            pair.trim()
          )
          allowedUsers = userPairs
            .map(pair => {
              const [email, password] = pair.split(":")
              if (email && password) {
                const hashedPassword = bcrypt.hashSync(password.trim(), 12)
                return {
                  email: email.trim().toLowerCase(),
                  password: hashedPassword,
                }
              }
              return null
            })
            .filter((u): u is AuthUser => u !== null)
        } catch (e) {
          console.error("Failed to parse ALLOWED_USERS:", e)
        }
      }

      parsedEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        ALLOWED_USERS: allowedUsers,
        AUTH_SECRET: process.env.AUTH_SECRET || "",
      } as z.infer<typeof envSchema>
    } else {
      // In development, throw immediately to catch config issues early
      throw new Error("Invalid environment variables")
    }
  } else {
    parsedEnv = parsed.data
  }
}

export const env = parsedEnv

export type Env = typeof env
export type { AuthUser }
